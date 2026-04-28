import { prisma } from '@/lib/prisma';

export const CREDIT_COSTS = {
  CHAT_MESSAGE: 1,
  GENERATION: 50,
  EDIT: 10,
};

/**
 * Check if the user has enough credits and consume them if they do.
 * @param userId - the Profile.id (not clerk userId)
 * @param amount - amount of credits to consume
 * @returns boolean indicating if the credits were successfully consumed
 */
export async function consumeCredits(userId: string, amount: number): Promise<boolean> {
  // Use transaction to check balance and consume atomically
  try {
    await prisma.$transaction(async (tx) => {
      const credits = await tx.creditLedger.aggregate({
        _sum: { amount: true },
        where: { userId }
      });

      const currentCredits = credits._sum.amount || 0;

      if (currentCredits < amount) {
        throw new Error('Insufficient credits');
      }

      await tx.creditLedger.create({
        data: {
          userId,
          amount: -amount,
          reason: 'ai_usage'
        }
      });
    });
    return true;
  } catch (error) {
    console.error('Error consuming credits:', error);
    return false;
  }
}

/**
 * Get the current credit balance of a user.
 * @param userId - the Profile.id
 */
export async function getCredits(userId: string): Promise<number> {
  const credits = await prisma.creditLedger.aggregate({
    _sum: { amount: true },
    where: { userId }
  });

  return credits._sum.amount || 0;
}

/**
 * Add credits to a user's account.
 * @param userId - the Profile.id
 * @param amount - amount of credits to add
 * @param reason - reason for the credit addition
 */
export async function addCredits(userId: string, amount: number, reason: 'monthly_grant' | 'bonus' = 'monthly_grant'): Promise<void> {
  await prisma.creditLedger.create({
    data: {
      userId,
      amount,
      reason
    }
  });
}
