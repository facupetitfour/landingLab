import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string
});

// 🔐 función de verificación
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

        // 🔐 VALIDACIÓN DE FIRMA
        const isValid = verifySignature(body, request.headers);

        if (!isValid) {
            console.warn('❌ Webhook inválido - firma incorrecta');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const type = body?.type;
        const dataId = body?.data?.id;

        if (!type || !dataId) {
            return NextResponse.json({ ok: true });
        }

        // =========================
        // 🔁 SUSCRIPCIÓN
        // =========================
        if (type === 'preapproval') {
            const preapproval = new PreApproval(client);
            const subscription = await preapproval.get({ id: dataId });

            const userId = subscription.external_reference;
            if (!userId) return NextResponse.json({ ok: true });

            const status = subscription.status;

            await prisma.profile.update({
                where: { clerkUserId: userId },
                data: {
                    isSubscribed: status === 'authorized',
                    subscriptionStatus: status,
                    mpSubscriptionId: dataId
                }
            });
        }

        // =========================
        // 💳 PAYMENT
        // =========================
        if (type === 'payment') {
            const paymentClient = new Payment(client);
            const payment = await paymentClient.get({ id: dataId });

            const userId = payment.external_reference;
            if (!userId) return NextResponse.json({ ok: true });

            const profile = await prisma.profile.findUnique({
                where: { clerkUserId: userId }
            });

            if (!profile) return NextResponse.json({ ok: true });

            // 🔐 Idempotencia
            const exists = await prisma.payment.findUnique({
                where: { mpId: String(dataId) }
            });

            if (exists) {
                return NextResponse.json({ ok: true });
            }

            await prisma.payment.create({
                data: {
                    mpId: String(dataId),
                    userId: profile.id,
                    status: payment.status || 'unknown'
                }
            });

            if (payment.status === 'approved') {
                await prisma.profile.update({
                    where: { clerkUserId: userId },
                    data: {
                        isSubscribed: true,
                        credits: {
                            increment: 3000
                        }
                    }
                });
            }
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}