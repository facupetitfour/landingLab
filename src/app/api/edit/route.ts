// Edit API Route
// Handles copy edits (quick edits and free text) and regenerates HTML

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { editCopy, QUICK_EDITS } from '@/services/edit-engine';
import { renderLandingPage } from '@/services/html-renderer';
import { LandingCopy } from '@/types/landing';
import { BriefData } from '@/types/brief';
import { consumeCredits, CREDIT_COSTS } from '@/services/credits';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, instruction, quick_edit_key } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch project and latest output
    const project = await prisma.project.findUnique({
      where: { id: project_id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const latestOutput = await prisma.projectOutput.findFirst({
      where: { projectId: project_id },
      orderBy: { version: 'desc' }
    });

    if (!latestOutput) {
      return NextResponse.json({ error: 'No output found to edit' }, { status: 404 });
    }

    // Determine edit instruction
    const editInstruction = quick_edit_key
      ? QUICK_EDITS[quick_edit_key] || instruction
      : instruction;

    if (!editInstruction) {
      return NextResponse.json({ error: 'No edit instruction provided' }, { status: 400 });
    }

    const hasCredits = await consumeCredits(userId, CREDIT_COSTS.EDIT);
    if (!hasCredits) {
      return NextResponse.json({ error: 'No tenés suficientes créditos para editar (se requieren 10).' }, { status: 402 });
    }

    // Update project status
    await prisma.project.update({
      where: { id: project_id },
      data: { status: 'editing' }
    });

    // Save edit message to chat
    await prisma.chatMessage.create({
      data: {
        projectId: project_id,
        role: 'user',
        content: quick_edit_key
          ? `✏️ Edición rápida: ${quick_edit_key.replace(/_/g, ' ')}`
          : `✏️ ${instruction}`,
      }
    });

    await prisma.chatMessage.create({
      data: {
        projectId: project_id,
        role: 'assistant',
        content: '✏️ Aplicando los cambios...',
      }
    });

    // Edit copy via LLM
    const currentCopy = latestOutput.copyData as unknown as LandingCopy;
    const updatedCopy = await editCopy(currentCopy, editInstruction);

    // Re-render HTML - VERSIÓN SÍNCRONA
    const brief = project.briefData as unknown as BriefData;

    const renderData = {
      ...updatedCopy,
      checkout_url: "#", // Aseguramos el botón
      product: {
        ...updatedCopy.product,
        name: brief.product_name // Inyectamos el nombre para el footer
      }
    };

    const html = renderLandingPage(renderData as any);

    // Save new version
    const newVersion = latestOutput.version + 1;
    await prisma.projectOutput.create({
      data: {
        projectId: project_id,
        version: newVersion,
        copyData: updatedCopy as unknown as object,
        htmlContent: html,
      }
    });

    // Update project
    await prisma.project.update({
      where: { id: project_id },
      data: {
        status: 'completed',
        activeVersion: newVersion
      }
    });

    // Mensaje de éxito limpio
    const completeMsg = '✅ ¡Cambios aplicados! Revisá la nueva versión.';

    await prisma.chatMessage.create({
      data: {
        projectId: project_id,
        role: 'assistant',
        content: completeMsg,
      }
    });

    return NextResponse.json({
      success: true,
      version: newVersion,
      copy_data: updatedCopy,
      html_content: html,
    });

  } catch (error) {
    console.error('Edit API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}