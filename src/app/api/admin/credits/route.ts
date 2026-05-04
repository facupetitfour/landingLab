import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreditReason } from '@prisma/client';
import { isAdmin } from '@/lib/isAdmin';

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount, reason = 'bonus' } = await request.json();

    if (!userId || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Missing userId or invalid amount' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.profile.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create credit transaction
    const creditTransaction = await prisma.creditLedger.create({
      data: {
        userId,
        amount,
        reason: reason as CreditReason
      }
    });

    // Calculate new balance
    const creditsLog = await prisma.creditLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const currentCredits = creditsLog.reduce((sum, credit) => sum + credit.amount, 0);

    return NextResponse.json({
      success: true,
      creditTransaction: {
        id: creditTransaction.id,
        amount: creditTransaction.amount,
        reason: creditTransaction.reason,
        createdAt: creditTransaction.createdAt.toISOString()
      },
      currentCredits
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}