import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminUserDetail } from '@/types';
import { isAdmin } from '@/lib/isAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        creditsLog: {
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentCredits = profile.creditsLog.reduce((sum, credit) => sum + credit.amount, 0);

    const userDetail: AdminUserDetail = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      createdAt: profile.createdAt.toISOString(),
      subscriptionStatus: profile.subscription?.status || null,
      currentCredits,
      subscription: profile.subscription ? {
        id: profile.subscription.id,
        mpSubscriptionId: profile.subscription.mpSubscriptionId,
        status: profile.subscription.status,
        currentPeriodStart: profile.subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: profile.subscription.currentPeriodEnd.toISOString()
      } : null,
      creditsHistory: profile.creditsLog.map(credit => ({
        id: credit.id,
        amount: credit.amount,
        reason: credit.reason,
        createdAt: credit.createdAt.toISOString()
      })),
      payments: profile.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt.toISOString()
      }))
    };

    return NextResponse.json(userDetail);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}