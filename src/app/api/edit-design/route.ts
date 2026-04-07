import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { renderLandingPage } from '@/services/html-renderer';
import { BriefData } from '@/types/brief';
import { LandingCopy } from '@/types/landing';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, updatedCopyData } = body;

    if (!project_id || !updatedCopyData) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: project_id }
    });

    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const latestOutput = await prisma.projectOutput.findFirst({
      where: { projectId: project_id },
      orderBy: { version: 'desc' }
    });

    if (!latestOutput) {
      return NextResponse.json({ error: 'No output found to edit' }, { status: 404 });
    }

    // Save edit message to chat
    await prisma.chatMessage.create({
      data: {
        projectId: project_id,
        role: 'user',
        content: `🎨 Diseño actualizado (tema, colores o imágenes)`,
      }
    });

    await prisma.chatMessage.create({
      data: {
        projectId: project_id,
        role: 'assistant',
        content: '✅ ¡Diseño aplicado! Revisá la nueva vista previa.',
      }
    });

    // Re-render HTML
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

    // Save new version
    const newVersion = latestOutput.version + 1;
    await prisma.projectOutput.create({
      data: {
        projectId: project_id,
        version: newVersion,
        copyData: updatedCopyData as unknown as object,
        htmlContent: html,
      }
    });

    // Update project
    await prisma.project.update({
      where: { id: project_id },
      data: {
        activeVersion: newVersion
      }
    });

    return NextResponse.json({
      success: true,
      version: newVersion,
      copy_data: updatedCopyData,
      html_content: html,
    });

  } catch (error) {
    console.error('Edit Design API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
