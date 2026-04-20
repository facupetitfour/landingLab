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

        if (!userId || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userEmail = user.primaryEmailAddress?.emailAddress;

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
        if (profile.isSubscribed) {
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

        // 💾 Guardar en Profile
        await prisma.profile.update({
            where: { clerkUserId: userId },
            data: {
                mpSubscriptionId: result.id,
                subscriptionStatus: "pending",
                isSubscribed: false,
            }
        });

        return NextResponse.json({ init_point: result.init_point });

    } catch (error) {
        console.error("Error al generar suscripción:", error);
        return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
    }
}

// export async function POST2(requiest: Request) {
//             const preference = new Preference(client)

//         const preferenceResult = await preference.create({
//             body: {
//                 items: [
//                     {
//                         id: "21231",
//                         title: 'Mi producto',
//                         quantity: 1,
//                         unit_price: 100,
//                     }
//                 ],
                
//                 back_urls: {
//                     success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
//                     failure: `${process.env.NEXT_PUBLIC_APP_URL}/failure`,
//                     pending: `${process.env.NEXT_PUBLIC_APP_URL}/pending`
//                 },
//                 auto_return: "approved",
//             }
//         })
// }