'use server'

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getDashboardData() {
    // 1. Identidad segura desde Clerk
    const { userId } = await auth();

    if (!userId) {
        throw new Error('No autorizado');
    }

    // 2. Validar suscripción buscando por clerkUserId
    const profile = await prisma.profile.findUnique({
        where: { clerkUserId: userId },
        select: { id: true }
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

    // 3. Consulta segura previniendo IDOR
    const data = await prisma.project.findMany({
        where: {
            profile: {
                clerkUserId: userId
            }
        }
    });

    return data;
}