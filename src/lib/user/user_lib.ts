"use server"
import { prisma } from '@/lib/prisma';

export async function existingProfileFunction(userId: string) {
    return await prisma.profile.findUnique({
        where: { id: userId }
    });
}

export async function createProfileFunction(userId: string, email: string, fullName: string, avatarUrl: string | null) {
    return await prisma.profile.create({
        data: {
            id: userId,
            email,
            fullName: fullName || email.split('@')[0],
            avatarUrl,
        }
    });
}
