import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/isAdmin';

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
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