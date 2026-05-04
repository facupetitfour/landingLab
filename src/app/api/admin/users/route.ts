import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminUser } from '@/types';
import { isAdmin } from '@/lib/isAdmin';

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: Record<string, any> = {};

    if (search) {
      where.email = {
        contains: search,
        mode: 'insensitive'
      };
    }

    if (status && status !== 'all') {
      where.subscription = {
        status: status
      };
    }

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        subscription: true,
        creditsLog: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const users: AdminUser[] = profiles.map(profile => {
      const currentCredits = profile.creditsLog.reduce((sum, credit) => sum + credit.amount, 0);

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        createdAt: profile.createdAt.toISOString(),
        subscriptionStatus: profile.subscription?.status || null,
        currentCredits
      };
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}