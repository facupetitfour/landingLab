import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { auth, currentUser } from '@clerk/nextjs/server';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string
});

export async function POST(request: Request) {
    try {
        // Validación de seguridad en el servidor usando Clerk
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userEmail = user.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: 'El usuario no tiene email' }, { status: 400 });
        }

        const preapproval = new PreApproval(client);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const result = await preapproval.create({
            body: {
                back_url: `${baseUrl}/dashboard`,
                reason: "Suscripción mensual - LandingLab",
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: 100,
                    currency_id: "ARS",
                },
                payer_email: userEmail,
                status: "pending",
                external_reference: userId, // ¡Clave! Aquí envías el ID de tu usuario en tu base de datos
            }
        });

        // Devuelves el link generado específicamente para este usuario
        return NextResponse.json({ init_point: result.init_point });

    } catch (error) {
        console.error('Error al generar suscripción:', error);
        return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
    }
}