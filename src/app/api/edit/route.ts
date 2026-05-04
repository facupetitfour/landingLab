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
    const { project_id, instruction, quick_edit_key } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch project and latest output
    const project = await prisma.project.findUnique({
      where: { id: project_id, userId: profile.id, deletedAt: null }
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

    // Check credits
    const credits = await prisma.creditLedger.aggregate({
      _sum: { amount: true },
      where: { userId: profile.id }
    });

    if ((credits._sum.amount || 0) < CREDIT_COSTS.EDIT) {
      return NextResponse.json({ error: 'No tenés suficientes créditos para editar (se requieren 10).' }, { status: 402 });
    }

    const hasCredits = await consumeCredits(profile.id, CREDIT_COSTS.EDIT);
    if (!hasCredits) {
      return NextResponse.json({ error: 'Error al consumir créditos.' }, { status: 500 });
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