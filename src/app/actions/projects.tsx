// app/actions/dashboard.ts
'use server'

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. Obtener todos los datos iniciales (Proyectos y Créditos)
export async function getDashboardData() {
    const { userId } = await auth();
    if (!userId) throw new Error('No autorizado');

    const profile = await prisma.profile.findUnique({
        where: { clerkUserId: userId },
        select: { credits: true, isSubscribed: true },
    });

    if (!profile?.isSubscribed) {
        throw new Error('Suscripción inactiva.');
    }

    const projects = await prisma.project.findMany({
        where: {
            profile: { clerkUserId: userId }
        },
        orderBy: {
            createdAt: 'desc' // Asegúrate de usar el nombre exacto de tu propiedad Prisma
        }
    });

    const formattedProjects = projects.map((p) => ({
        ...p,
        status: p.status as any,
        created_at: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
        updated_at: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString()
    }));

    return {
        credits: profile.credits,
        projects: formattedProjects,
    };
}

// 2. Crear un nuevo proyecto
export async function createProjectAction() {
    const { userId } = await auth();
    if (!userId) throw new Error('No autorizado');

    const newProject = await prisma.project.create({
        data: {
            profile: { connect: { clerkUserId: userId } },
            name: 'Nueva Landing Page',
            status: 'welcome',
        },
    });

    revalidatePath('/dashboard');
    return newProject;
}

// 3. Eliminar un proyecto de forma segura
export async function deleteProjectAction(projectId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('No autorizado');

    await prisma.project.delete({
        where: {
            id: projectId,
            profile: { clerkUserId: userId }, // Prevención de IDOR
        },
    });

    revalidatePath('/dashboard');
    return { success: true };
}