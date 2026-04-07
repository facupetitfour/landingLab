import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string
});

export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        // MP puede enviar 'type' o 'topic' dependiendo de la configuración
        const type = url.searchParams.get('type') || url.searchParams.get('topic');

        const body = await request.json();
        const dataId = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');

        if (type === 'subscription_preapproval' && dataId) {
            const preapproval = new PreApproval(client);
            const subscriptionInfo = await preapproval.get({ id: dataId });
            const userId = subscriptionInfo.external_reference;

            if (userId) {
                if (subscriptionInfo.status === 'authorized') {
                    await prisma.profile.update({
                        where: { id: userId },
                        data: {
                            isSubscribed: true,
                            subscriptionStatus: subscriptionInfo.status,
                            mpSubscriptionId: dataId,
                            credits: 3000 // Recarga inicial o renovación
                        }
                    });
                    console.log(`Suscripción de usuario ${userId} autorizada. Créditos recargados a 3000.`);
                } else if (subscriptionInfo.status === 'cancelled') {
                    await prisma.profile.update({
                        where: { id: userId },
                        data: {
                            isSubscribed: false,
                            subscriptionStatus: subscriptionInfo.status,
                        }
                    });
                    console.log(`Suscripción de usuario ${userId} cancelada.`);
                }
            }
        } else if (type === 'payment' && dataId) {
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: dataId });
            const userId = paymentInfo.external_reference;

            if (userId) {
                // 1. Guardar o actualizar registro histórico en la tabla Payment
                await prisma.payment.upsert({
                    where: { mpId: String(dataId) },
                    create: {
                        mpId: String(dataId),
                        userId: userId,
                        status: paymentInfo.status || 'unknown'
                    },
                    update: {
                        status: paymentInfo.status || 'unknown'
                    }
                });

                // 2. Si el pago está aprobado, recargar los créditos
                if (paymentInfo.status === 'approved') {
                    await prisma.profile.update({
                        where: { id: userId },
                        data: {
                            isSubscribed: true, // Por seguridad
                            credits: 3000 // Recarga en cada pago aprobado
                        }
                    });
                    console.log(`Pago mensual aprobado para usuario ${userId}. Créditos recargados a 3000 y pago guardado en historial.`);
                } else {
                    console.log(`Pago guardado para usuario ${userId} con estado: ${paymentInfo.status}`);
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Error procesando webhook:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}