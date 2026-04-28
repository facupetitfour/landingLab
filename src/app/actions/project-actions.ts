'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { extractFields } from '@/services/field-extractor';
import { classifyArchetype } from '@/services/archetype-classifier';
import { buildStrategy } from '@/services/strategy-builder';
import { generateCopy } from '@/services/copy-generator';
import { renderLandingPage } from '@/services/html-renderer';
import { processUserResponse, type ConversationState } from '@/services/conversation-manager';
import { QUESTION_SEQUENCE, WELCOME_MESSAGE } from '@/types/chat';
import { EMPTY_BRIEF, type BriefData } from '@/types/brief';
import { consumeCredits, CREDIT_COSTS } from '@/services/credits';
import { editCopy, QUICK_EDITS } from '@/services/edit-engine';
import { LandingCopy } from '@/types/landing';

// ----------------------------------------------------------------------
// GET PROJECT STATE (Polling & Init)
// ----------------------------------------------------------------------
export async function getProjectStateAction(projectId: string, _ts?: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');

  const project = await prisma.project.findUnique({
    where: { 
      id: projectId,
      profile: { clerkUserId: userId } 
    },
    select: {
      status: true,
      strategyData: true,
      archetype: true,
      skeletonType: true,
      activeVersion: true,
      briefData: true,
      currentQuestionIndex: true,
    }
  });

  if (!project) throw new Error('Project not found');

  let output = null;
  if (project.status === 'completed' || project.status === 'editing') {
    const data = await prisma.projectOutput.findFirst({
      where: { projectId: projectId },
      orderBy: { version: 'desc' }
    });
    if (data) {
      output = {
        ...data,
        project_id: data.projectId,
        copy_data: data.copyData,
        html_content: data.htmlContent,
        created_at: data.createdAt
      };
    }
  }

  const messages = await prisma.chatMessage.findMany({
    where: { projectId: projectId },
    orderBy: { createdAt: 'asc' }
  });

  const formattedMessages = messages.map((m: any) => ({
    ...m,
    project_id: m.projectId,
    created_at: m.createdAt
  }));

  return {
    status: project.status,
    strategy: project.strategyData,
    archetype: project.archetype,
    skeleton_type: project.skeletonType,
    output,
    brief: project.briefData,
    currentQuestionIndex: project.currentQuestionIndex,
    messages: formattedMessages || [],
  };
}

// ----------------------------------------------------------------------
// CHAT & GENERATION
// ----------------------------------------------------------------------
export async function sendMessageAction(projectId: string, message?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');

  const profile = await prisma.profile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true }
  });

  if (!profile) throw new Error('Profile not found');

  const subscription = await prisma.subscription.findUnique({
    where: { userId: profile.id }
  });

  if (!subscription || subscription.status !== 'authorized') {
    throw new Error('Suscripción inactiva');
  }

  const project = await prisma.project.findUnique({
    where: { 
      id: projectId,
      userId: profile.id,
      deletedAt: null
    }
  });

  if (!project) throw new Error('Project not found');

  const state: ConversationState = {
    status: project.status as any,
    currentQuestionIndex: project.currentQuestionIndex || 0,
    briefData: (project.briefData as unknown as BriefData) || { ...EMPTY_BRIEF },
    pendingClarification: false,
  };

  if (!message) {
    if (state.status === 'welcome') {
      await prisma.chatMessage.create({
        data: {
          projectId: projectId,
          role: 'assistant',
          content: WELCOME_MESSAGE,
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const firstQuestion = QUESTION_SEQUENCE[0].question;
      await prisma.chatMessage.create({
        data: {
          projectId: projectId,
          role: 'assistant',
          content: firstQuestion,
        }
      });

      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'collecting_core_info',
          currentQuestionIndex: 0,
        }
      });

      revalidatePath(`/project/${projectId}`);
      return { messages: [WELCOME_MESSAGE, firstQuestion], status: 'collecting_core_info' };
    }
    return { messages: [], status: state.status };
  }

  const hasCredits = await consumeCredits(profile.id, CREDIT_COSTS.CHAT_MESSAGE);
  if (!hasCredits) {
    return {
      messages: ['❌ No tenés suficientes créditos para enviar mensajes. Adquirí más créditos para continuar.'],
      status: state.status,
      brief: state.briefData,
      shouldGenerate: false,
    };
  }

  await prisma.chatMessage.create({
    data: {
      projectId: projectId,
      role: 'user',
      content: message,
    }
  });

  let extractedFields: Partial<BriefData> = {};
  let needsClarification = false;

  if (state.status !== 'welcome' && state.status !== 'confirming_brief') {
    const currentQuestion = QUESTION_SEQUENCE[state.currentQuestionIndex];
    if (currentQuestion) {
      const extraction = await extractFields(
        message,
        currentQuestion.target_fields,
        state.briefData,
        currentQuestion.question
      );
      extractedFields = extraction.extracted_fields;
      needsClarification = extraction.needs_clarification && currentQuestion.required;
    }
  }

  const response = processUserResponse(message, state, extractedFields, needsClarification);

  for (const msg of response.messages) {
    await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        role: 'assistant',
        content: msg,
      }
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: response.newStatus,
      currentQuestionIndex: response.newQuestionIndex,
      briefData: response.updatedBrief as unknown as object,
      name: response.updatedBrief.product_name || project.name,
    }
  });

  revalidatePath(`/project/${projectId}`);

  if (response.shouldGenerate) {
    const hasGenCredits = await consumeCredits(profile.id, CREDIT_COSTS.GENERATION);
    if (!hasGenCredits) {
      const errorMsg = '❌ No pudimos generar tu landing page porque no tenés suficientes créditos (se requieren 50).';
      await prisma.chatMessage.create({
        data: {
          projectId: projectId,
          role: 'assistant',
          content: errorMsg,
        }
      });
      response.messages.push(errorMsg);
      response.shouldGenerate = false;
    } else {
      // Disparamos la generación asíncrona sin await. 
      // Las variables projectId y updatedBrief están serializadas y la función es autónoma.
      generateLanding(projectId, response.updatedBrief, profile.id).catch(console.error);
    }
  }

  return {
    messages: response.messages,
    status: response.newStatus,
    brief: response.updatedBrief,
    shouldGenerate: response.shouldGenerate,
  };
}

async function generateLanding(projectId: string, brief: BriefData, internalUserId: string) {
  try {
    // Verificamos que el proyecto sea del usuario usando el internal user id
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: internalUserId }
    });

    if(!project) return;
    
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'building_strategy' }
    });

    await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        role: 'assistant',
        content: '🔍 Analizando tu producto y tu audiencia...',
      }
    });

    const classification = await classifyArchetype(brief);
    const strategy = await buildStrategy(brief, classification.archetype);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        archetype: classification.archetype,
        strategyData: strategy as unknown as object,
        skeletonType: strategy.skeleton_type || 'standard_infoproduct',
        status: 'generating_copy',
      }
    });

    await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        role: 'assistant',
        content: '✍️ Escribiendo el copy de tu landing page...',
      }
    });

    const copy = await generateCopy(brief, strategy);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'generating_html' }
    });

    await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        role: 'assistant',
        content: '🏗️ Renderizando HTML y ajustes finales...',
      }
    });

    const renderData = {
      ...copy,
      checkout_url: "#",
      product: {
        ...copy.product,
        name: brief.product_name
      }
    };

    const html = renderLandingPage(renderData as any);

    const existingOutput = await prisma.projectOutput.findFirst({
      where: { projectId: projectId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const newVersion = (existingOutput?.version || 0) + 1;

    await prisma.projectOutput.create({
      data: {
        projectId: projectId,
        version: newVersion,
        copyData: copy as unknown as object,
        htmlContent: html,
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'completed',
        activeVersion: newVersion,
      }
    });

    await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        role: 'assistant',
        content: '🎉 ¡Tu landing page está lista! Revisá las pestañas de Estrategia, Copy y HTML para ver los resultados.',
      }
    });

    // Como estamos en un proceso separado del request HTTP, revalidatePath aquí podría no funcionar 
    // en todas las versiones dependiendo del contexto, pero lo incluimos.
    try {
        revalidatePath(`/project/${projectId}`);
    } catch(e) {}

  } catch (error) {
    console.error('Generation Pipeline Error:', error);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'completed' }
    });

    await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        role: 'assistant',
        content: '❌ Hubo un error generando tu landing. Por favor intentá de nuevo.',
      }
    });
  }
}

// ----------------------------------------------------------------------
// EDIT COPY
// ----------------------------------------------------------------------
export async function editCopyAction(projectId: string, instruction: string, quickEditKey?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');

  const profile = await prisma.profile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true }
  });

  if (!profile) throw new Error('Profile not found');

  const subscription = await prisma.subscription.findUnique({
    where: { userId: profile.id }
  });

  if (!subscription || subscription.status !== 'authorized') {
    throw new Error('Suscripción inactiva');
  }

  const project = await prisma.project.findUnique({
    where: { 
      id: projectId,
      userId: profile.id,
      deletedAt: null
    }
  });

  if (!project) throw new Error('Project not found');

  const latestOutput = await prisma.projectOutput.findFirst({
    where: { projectId: projectId },
    orderBy: { version: 'desc' }
  });

  if (!latestOutput) throw new Error('No output found to edit');

  const editInstruction = quickEditKey ? QUICK_EDITS[quickEditKey as keyof typeof QUICK_EDITS] || instruction : instruction;

  if (!editInstruction) throw new Error('No edit instruction provided');

  const hasCredits = await consumeCredits(profile.id, CREDIT_COSTS.EDIT);
  if (!hasCredits) throw new Error('No tenés suficientes créditos para editar (se requieren 10).');

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'editing' }
  });

  await prisma.chatMessage.create({
    data: {
      projectId: projectId,
      role: 'user',
      content: quickEditKey ? `✏️ Edición rápida: ${quickEditKey.replace(/_/g, ' ')}` : `✏️ ${instruction}`,
    }
  });

  await prisma.chatMessage.create({
    data: {
      projectId: projectId,
      role: 'assistant',
      content: '✏️ Aplicando los cambios...',
    }
  });

  const currentCopy = latestOutput.copyData as unknown as LandingCopy;
  const updatedCopy = await editCopy(currentCopy, editInstruction);

  const brief = project.briefData as unknown as BriefData;

  const renderData = {
    ...updatedCopy,
    checkout_url: "#",
    product: {
      ...updatedCopy.product,
      name: brief.product_name
    }
  };

  const html = renderLandingPage(renderData as any);

  const newVersion = latestOutput.version + 1;
  await prisma.projectOutput.create({
    data: {
      projectId: projectId,
      version: newVersion,
      copyData: updatedCopy as unknown as object,
      htmlContent: html,
    }
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'completed',
      activeVersion: newVersion
    }
  });

  await prisma.chatMessage.create({
    data: {
      projectId: projectId,
      role: 'assistant',
      content: '✅ ¡Cambios aplicados! Revisá la nueva versión.',
    }
  });

  revalidatePath(`/project/${projectId}/results`);

  return {
    success: true,
    version: newVersion,
    copy_data: updatedCopy,
    html_content: html,
  };
}

// ----------------------------------------------------------------------
// EDIT DESIGN
// ----------------------------------------------------------------------
export async function updateDesignAction(projectId: string, updatedCopyData: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');

  const project = await prisma.project.findUnique({
    where: { 
      id: projectId,
      profile: { clerkUserId: userId }
    }
  });

  if (!project) throw new Error('Project not found');

  const latestOutput = await prisma.projectOutput.findFirst({
    where: { projectId: projectId },
    orderBy: { version: 'desc' }
  });

  if (!latestOutput) throw new Error('No output found to edit');

  await prisma.chatMessage.create({
    data: {
      projectId: projectId,
      role: 'user',
      content: `🎨 Diseño actualizado (tema, colores o imágenes)`,
    }
  });

  await prisma.chatMessage.create({
    data: {
      projectId: projectId,
      role: 'assistant',
      content: '✅ ¡Diseño aplicado! Revisá la nueva vista previa.',
    }
  });

  const brief = project.briefData as unknown as BriefData;

  const renderData = {
    ...updatedCopyData,
    checkout_url: "#",
    product: {
      ...updatedCopyData.product,
      name: brief.product_name
    }
  };

  const html = renderLandingPage(renderData as any);

  const newVersion = latestOutput.version + 1;
  await prisma.projectOutput.create({
    data: {
      projectId: projectId,
      version: newVersion,
      copyData: updatedCopyData as unknown as object,
      htmlContent: html,
    }
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      activeVersion: newVersion
    }
  });

  revalidatePath(`/project/${projectId}/results`);

  return {
    success: true,
    version: newVersion,
    copy_data: updatedCopyData,
    html_content: html,
  };
}
