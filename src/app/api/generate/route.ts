// Generate API Route
// Fetches generation results for a project (polling endpoint)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    const projectId = request.nextUrl.searchParams.get('project_id');
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch project status
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: profile.id, deletedAt: null },
      select: {
        status: true,
        strategyData: true,
        archetype: true,
        skeletonType: true,
        activeVersion: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch latest output if completed
    let output = null;
    if (project.status === 'completed' || project.status === 'editing') {
      const data = await prisma.projectOutput.findFirst({
        where: { projectId: projectId },
        orderBy: { version: 'desc' }
      });
      if (data) {
        // map camelCase to expected snake_case response
        output = {
          ...data,
          project_id: data.projectId,
          copy_data: data.copyData,
          html_content: data.htmlContent,
          created_at: data.createdAt
        };
      }
    }

    // Fetch recent messages
    const messages = await prisma.chatMessage.findMany({
      where: { projectId: projectId },
      orderBy: { createdAt: 'asc' }
    });

    // map messages camelCase to expected snake_case response
    const formattedMessages = messages.map((m: any) => ({
      ...m,
      project_id: m.projectId,
      created_at: m.createdAt
    }));

    return NextResponse.json({
      status: project.status,
      strategy: project.strategyData,
      archetype: project.archetype,
      skeleton_type: project.skeletonType,
      output,
      messages: formattedMessages || [],
    });
  } catch (error) {
    console.error('Generate GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
