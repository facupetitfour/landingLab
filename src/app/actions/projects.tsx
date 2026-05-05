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
        select: { id: true },
    });

    if (!profile) {
        throw new Error('Perfil no encontrado');
    }

    const subscription = await prisma.subscription.findUnique({
        where: { userId: profile.id }
    });

    if (!subscription || subscription.status !== 'authorized') {
        throw new Error('Suscripción inactiva.');
    }

    const projects = await prisma.project.findMany({
        where: {
            profile: { clerkUserId: userId },
            deletedAt: null
        },
        orderBy: {
            createdAt: 'desc' // Asegúrate de usar el nombre exacto de tu propiedad Prisma
        }
    });

    const credits = await prisma.creditLedger.aggregate({
        _sum: { amount: true },
        where: { userId: profile.id }
    });

    const formattedProjects = projects.map((p) => ({
        ...p,
        status: p.status as any,
        created_at: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
        updated_at: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString()
    }));

    return {
        credits: credits._sum.amount || 0,
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

    await prisma.project.update({
        where: {
            id: projectId,
            profile: { clerkUserId: userId }, // Prevención de IDOR
        },
        data: {
            deletedAt: new Date()
        }
    });

    revalidatePath('/dashboard');
    return { success: true };
}

// 4. Verificar estado de suscripción
export async function checkSubscriptionStatus() {
    const { userId } = await auth();
    if (!userId) throw new Error('No autorizado');

    const profile = await prisma.profile.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
    });

    if (!profile) {
        return { isSubscribed: false };
    }

    const subscription = await prisma.subscription.findUnique({
        where: { userId: profile.id }
    });

    const isSubscribed = subscription && subscription.status === 'authorized';

    return { isSubscribed };
}