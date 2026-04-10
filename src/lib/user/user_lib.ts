"use server"
import { prisma } from '@/lib/prisma';

export async function getProfileByUserId(userId: string) {
    return await prisma.profile.findUnique({
        where: { clerkUserId: userId }
    });
}

export async function createUserProfile(userId: string, email: string, fullName: string, avatarUrl: string | null) {
    return await prisma.profile.create({
        data: {
            clerkUserId: userId,
            email,
            fullName: fullName || email.split('@')[0],
            avatarUrl,
        }
    });
}
