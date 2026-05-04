"use server"
import { prisma } from '@/lib/prisma';

export async function getProfileByUserId(userId: string) {
    return await prisma.profile.findUnique({
        where: { clerkUserId: userId }
    });
}

export async function createUserProfile(userId: string, email: string, fullName: string, avatarUrl: string | null) {
    const profile = await prisma.profile.create({
        data: {
            clerkUserId: userId,
            email,
            fullName: fullName || email.split('@')[0],
            avatarUrl,
        }
    });

    // Create initial subscription (inactive)
    await prisma.subscription.create({
        data: {
            userId: profile.id,
            mpSubscriptionId: `pending-${profile.id}`, // unique placeholder
            status: 'paused',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date()
        }
    });

    // Initial credits if needed, but probably not since they get on payment
    // await prisma.creditLedger.create({
    //     data: {
    //         userId: profile.id,
    //         amount: 3000,
    //         reason: 'monthly_grant'
    //     }
    // });

    return profile;
}
