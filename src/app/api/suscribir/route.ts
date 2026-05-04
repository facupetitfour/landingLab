import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { MercadoPagoConfig, PreApproval} from 'mercadopago';
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string
});

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        const { userEmail } = await request.json();
        if (!userId || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!userEmail) {
            return NextResponse.json({ error: "El usuario no tiene email" }, { status: 400 });
        }

        // 🔍 Buscar profile
        const profile = await prisma.profile.findUnique({
            where: { clerkUserId: userId }
        });

        if (!profile) {
            return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
        }

        // 🚫 Evitar doble suscripción activa
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: profile.id }
        });

        if (existingSubscription && existingSubscription.status === 'authorized') {
            return NextResponse.json({ error: "Ya estás suscripto" }, { status: 400 });
        }

        const preapproval = new PreApproval(client);

        const result = await preapproval.create({
            body: {
                payer_email: userEmail,
                back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                reason: "Suscripción mensual - LandingLab",
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: 100,
                    currency_id: "ARS",
                },
                status: "pending",
                external_reference: userId,
            }
        });

        // 💾 Crear o actualizar Subscription
        await prisma.subscription.upsert({
            where: { userId: profile.id },
            update: {
                mpSubscriptionId: result.id!,
                status: 'pending',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                userEmailmp: userEmail
            },
            create: {
                userId: profile.id,
                mpSubscriptionId: result.id!,
                status: 'pending',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                userEmailmp: userEmail
            }
        });

        return NextResponse.json({ init_point: result.init_point });

    } catch (error) {
        console.error("Error al generar suscripción:", error);
        return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
    }
}