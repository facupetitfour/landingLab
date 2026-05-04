import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

async function verifyAdmin(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  return userEmail && ADMIN_EMAILS.includes(userEmail);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: Record<string, any> = {};

    if (userId) {
      where.userId = userId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        profile: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const paymentRecords = payments.map(payment => ({
      id: payment.id,
      userId: payment.userId,
      userEmail: payment.profile.email,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt.toISOString()
    }));

    return NextResponse.json(paymentRecords);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}