// Chat API Route
// Handles all chat messages: extraction, state management, generation triggering

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { extractFields } from '@/services/field-extractor';
import { classifyArchetype } from '@/services/archetype-classifier';
import { buildStrategy } from '@/services/strategy-builder';
import { generateCopy } from '@/services/copy-generator';
// import { renderHtml, validateHtml } from '@/services/html-renderer';
// Bórralo o coméntalo:
// import { renderHtml, validateHtml } from '@/services/html-renderer';

// Cámbialo por:
import { renderLandingPage } from '@/services/html-renderer';
import {
  processUserResponse,
  type ConversationState,
} from '@/services/conversation-manager';
import { QUESTION_SEQUENCE, WELCOME_MESSAGE } from '@/types/chat';
import { EMPTY_BRIEF, type BriefData } from '@/types/brief';
import { consumeCredits, CREDIT_COSTS } from '@/services/credits';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile and check subscription
    const profile = await prisma.profile.findUnique({
      where: { clerkUserId: userId }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: profile.id }
    });

    if (!subscription || subscription.status !== 'authorized') {
      return NextResponse.json({ error: 'Subscription inactive' }, { status: 403 });
    }

    const body = await request.json();
    const { project_id, message } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch current project state
    const project = await prisma.project.findUnique({
      where: { id: project_id, userId: profile.id, deletedAt: null }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const state: ConversationState = {
      status: project.status as any,
      currentQuestionIndex: project.currentQuestionIndex || 0,
      briefData: (project.briefData as unknown as BriefData) || { ...EMPTY_BRIEF },
      pendingClarification: false,
    };

    // Handle initial load (no message = get welcome or current question)
    if (!message) {
      if (state.status === 'welcome') {
        // Save welcome message
        await prisma.chatMessage.create({
          data: {
            projectId: project_id,
            role: 'assistant',
            content: WELCOME_MESSAGE,
          }
        });

        return NextResponse.json({
          messages: [WELCOME_MESSAGE],
          status: 'welcome',
        });
      }

      // Return current state
      const messages = await prisma.chatMessage.findMany({
        where: { projectId: project_id },
        orderBy: { createdAt: 'asc' }
      });

      // format to match expected snake_case response
      const formattedMessages = messages.map((m: any) => ({
        ...m,
        project_id: m.projectId,
        created_at: m.createdAt
      }));

      return NextResponse.json({
        messages: formattedMessages || [],
        status: state.status,
        brief: state.briefData,
      });
    }

    // Check credits before sending message
    const credits = await prisma.creditLedger.aggregate({
      _sum: { amount: true },
      where: { userId: profile.id }
    });

    if ((credits._sum.amount || 0) < CREDIT_COSTS.CHAT_MESSAGE) {
      return NextResponse.json({
        messages: ['❌ No tenés suficientes créditos para enviar mensajes. Adquirí más créditos para continuar.'],
        status: state.status,
        brief: state.briefData,
        shouldGenerate: false,
      });
    }

    const hasCredits = await consumeCredits(profile.id, CREDIT_COSTS.CHAT_MESSAGE);
    if (!hasCredits) {
      return NextResponse.json({
        messages: ['❌ Error al consumir créditos.'],
        status: state.status,
        brief: state.briefData,
        shouldGenerate: false,
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        projectId: project_id,
        role: 'user',
        content: message,
      }
    });

    // Extract fields from user message
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

    // Process through conversation manager
    const response = processUserResponse(message, state, extractedFields, needsClarification);

    // Save assistant messages
    for (const msg of response.messages) {
      await prisma.chatMessage.create({
        data: {
          projectId: project_id,
          role: 'assistant',
          content: msg,
        }
      });
    }

    // Update project state
    await prisma.project.update({
      where: { id: project_id },
      data: {
        status: response.newStatus,
        currentQuestionIndex: response.newQuestionIndex,
        briefData: response.updatedBrief as unknown as object,
        name: response.updatedBrief.product_name || project.name,
      }
    });

    // If should generate — trigger the generation pipeline
    if (response.shouldGenerate) {
      const genCredits = await prisma.creditLedger.aggregate({
        _sum: { amount: true },
        where: { userId: profile.id }
      });

      if ((genCredits._sum.amount || 0) < CREDIT_COSTS.GENERATION) {
        const errorMsg = '❌ No pudimos generar tu landing page porque no tenés suficientes créditos (se requieren 50).';
        await prisma.chatMessage.create({
          data: {
            projectId: project_id,
            role: 'assistant',
            content: errorMsg,
          }
        });
        response.messages.push(errorMsg);
        response.shouldGenerate = false;
      } else {
        const hasGenCredits = await consumeCredits(profile.id, CREDIT_COSTS.GENERATION);
        if (!hasGenCredits) {
          const errorMsg = '❌ Error al consumir créditos para generación.';
          await prisma.chatMessage.create({
            data: {
              projectId: project_id,
              role: 'assistant',
              content: errorMsg,
            }
          });
          response.messages.push(errorMsg);
          response.shouldGenerate = false;
        } else {
          // Run generation in background (we respond immediately with status)
          generateLanding(project_id, response.updatedBrief).catch(console.error);
        }
      }
    }

    return NextResponse.json({
      messages: response.messages,
      status: response.newStatus,
      brief: response.updatedBrief,
      shouldGenerate: response.shouldGenerate,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// Generation pipeline — runs after chat collection is complete
async function generateLanding(
  projectId: string,
  brief: BriefData
) {
  try {
    // Step 1: Classify archetype
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

    // Step 2: Build strategy
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

    // Step 3: Generate copy
    const copy = await generateCopy(brief, strategy);

    // Step 4: Render HTML
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

    // 1. Preparamos el objeto completo mezclando el Copy con datos crudos del Brief
    const renderData = {
      ...copy,
      checkout_url: "#", // Aquí puedes poner tu link de pago real si lo tienes
      product: {
        ...copy.product,
        name: brief.product_name // Para que el footer y las imágenes tengan el nombre real
      }
    };

    // 2. Renderizamos al instante con Handlebars
    const html = renderLandingPage(renderData as any);

    // Step 5: Save output
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
        copyData: copy as unknown as object, // Guardamos el copy puro
        htmlContent: html,
      }
    });

    // Step 6: Update project as completed
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'completed',
        activeVersion: newVersion,
      }
    });

    // Mensaje de finalización limpio (sin variables de validación inexistentes)
    const completionMsg = '🎉 ¡Tu landing page está lista! Revisá las pestañas de Estrategia, Copy y HTML para ver los resultados.';

    await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        role: 'assistant',
        content: completionMsg,
      }
    });
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
