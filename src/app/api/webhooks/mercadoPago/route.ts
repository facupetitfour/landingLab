import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string
});
type SubscriptionStatus = 'authorized' | 'paused' | 'cancelled' | 'pending';

// 🔐 Verificación de firma (MercadoPago)
function verifySignature(body: any, headers: Headers) {
  const signature = headers.get('x-signature');
  const requestId = headers.get('x-request-id');
  const secret = process.env.MP_WEBHOOK_SECRET as string;

  if (!signature || !requestId || !secret) return false;

  const parts = signature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!ts || !v1) return false;

  const dataId = body?.data?.id;
  if (!dataId) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const hash = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  return hash === v1;
}

export async function POST(request: Request) {
  try {

    const body = await request.json();
    console.log('📬 Webhook recibido:', body);
    // 🔐 Validar firma
    const isValid = verifySignature(body, request.headers);

    if (!isValid) {
      console.warn('❌ Webhook inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = body?.type;
    const dataId = body?.data?.id;

    if (!type || !dataId) {
      return NextResponse.json({ ok: true });
    }

    // =====================================================
    // 🔁 SUSCRIPCIONES (preapproval)
    // =====================================================
    if (type === 'preapproval') {
      const preapproval = new PreApproval(client);
      const subscription = await preapproval.get({ id: dataId });

      const clerkUserId = subscription.external_reference;
      if (!clerkUserId) return NextResponse.json({ ok: true });

      const profile = await prisma.profile.findUnique({
        where: { clerkUserId }
      });

      if (!profile) return NextResponse.json({ ok: true });

      // ✅ Validación de estado segura
      const validStatuses = ['authorized', 'paused', 'cancelled', 'pending'];

      const status: SubscriptionStatus = validStatuses.includes(subscription.status as SubscriptionStatus)
        ? (subscription.status as SubscriptionStatus)
        : 'pending';
      await prisma.subscription.upsert({
        where: {
          mpSubscriptionId: String(subscription.id)
        },
        update: {
          status,
          currentPeriodStart: subscription.date_created
            ? new Date(subscription.date_created)
            : new Date(),
          currentPeriodEnd: subscription.next_payment_date
            ? new Date(subscription.next_payment_date)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userEmailmp: subscription.payer_email ?? null
        },
        create: {
          userId: profile.id,
          mpSubscriptionId: String(subscription.id),
          status,
          currentPeriodStart: subscription.date_created
            ? new Date(subscription.date_created)
            : new Date(),
          currentPeriodEnd: subscription.next_payment_date
            ? new Date(subscription.next_payment_date)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userEmailmp: subscription.payer_email ?? null
        }
      });
    }

    // =====================================================
    // 💳 PAGOS
    // =====================================================
    if (type === 'payment') {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: dataId });

      const clerkUserId = payment.external_reference;
      if (!clerkUserId) return NextResponse.json({ ok: true });

      const profile = await prisma.profile.findUnique({
        where: { clerkUserId }
      });

      if (!profile) return NextResponse.json({ ok: true });

      // 🔐 Idempotencia con upsert
      await prisma.payment.upsert({
        where: { mpId: String(dataId) },
        update: {},
        create: {
          mpId: String(dataId),
          userId: profile.id,
          amount: payment.transaction_amount || 0,
          currency: payment.currency_id || 'ARS',
          status: payment.status || 'unknown',
          type: 'subscription',
          rawData: payment as any
        }
      });

      // 🎁 Créditos solo si aprobado (con protección)
      if (payment.status === 'approved') {
        const alreadyGiven = await prisma.creditLedger.findFirst({
          where: {
            userId: profile.id,
            reason: 'monthly_grant',
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // ventana anti-duplicados
            }
          }
        });

        if (!alreadyGiven) {
          await prisma.creditLedger.create({
            data: {
              userId: profile.id,
              amount: 3000,
              reason: 'monthly_grant'
            }
          });
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('🔥 Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}