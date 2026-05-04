import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { isAdmin } from '@/lib/isAdmin';

export async function PATCH(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    const validActions = ['activate', 'pause', 'cancel'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check if subscription exists
    let subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    let status: SubscriptionStatus;
    switch (action) {
      case 'activate':
        status = 'authorized';
        break;
      case 'pause':
        status = 'paused';
        break;
      case 'cancel':
        status = 'cancelled';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (subscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { userId },
        data: { status }
      });
    } else if (action === 'activate') {
      // Create new subscription if activating and none exists
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      subscription = await prisma.subscription.create({
        data: {
          userId,
          mpSubscriptionId: `manual_admin_${Date.now()}`,
          status: 'authorized',
          currentPeriodStart: now,
          currentPeriodEnd: thirtyDaysFromNow
        }
      });
    } else {
      return NextResponse.json({ error: 'No subscription found to modify' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        mpSubscriptionId: subscription.mpSubscriptionId,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}