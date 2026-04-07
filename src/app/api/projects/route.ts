// Projects API Route
// CRUD operations for projects

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EMPTY_BRIEF } from '@/types/brief';
import { EMPTY_STRATEGY } from '@/types/strategy';
import { prisma } from '@/lib/prisma';

// GET — list user's projects
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        status: true,
        archetype: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Map properties from camelCase back to snake_case to maintain API contract
    // Or just return the raw array if the frontend uses camelCase.
    // Following old supabase shape precisely:
    const formattedProjects = projects.map((p: any) => ({
      ...p,
      created_at: p.createdAt,
      updated_at: p.updatedAt
    }));

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error('Projects GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — create a new project
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    const project = await prisma.project.create({
      data: {
        userId,
        name: name || 'Mi landing page',
        status: 'welcome',
        briefData: EMPTY_BRIEF as unknown as object,
        strategyData: EMPTY_STRATEGY as unknown as object,
        currentQuestionIndex: 0,
      }
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Projects POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — delete a project
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    await prisma.project.deleteMany({
      where: {
        id: project_id,
        userId: userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Projects DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


