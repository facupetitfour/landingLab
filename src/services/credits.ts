import { prisma } from '@/lib/prisma';

export const CREDIT_COSTS = {
  CHAT_MESSAGE: 1,
  GENERATION: 50,
  EDIT: 10,
};

/**
 * Check if the user has enough credits and consume them if they do.
 * @param userId - the ID of the user (clerk userId which maps to Profile.id)
 * @param amount - amount of credits to consume
 * @returns boolean indicating if the credits were successfully consumed
 */
export async function consumeCredits(userId: string, amount: number): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { clerkUserId: userId },
    select: { credits: true },
  });

  if (!profile || profile.credits < amount) {
    return false;
  }

  try {
    await prisma.profile.update({
      where: { clerkUserId: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });
    return true;
  } catch (error) {
    console.error('Error consuming credits:', error);
    return false;
  }
}

/**
 * Get the current credit balance of a user.
 */
export async function getCredits(userId: string): Promise<number> {
  const profile = await prisma.profile.findUnique({
    where: { clerkUserId: userId },
    select: { credits: true },
  });

  return profile?.credits || 0;
}
