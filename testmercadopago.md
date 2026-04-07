# Guía para Testear la Integración de Mercado Pago (Localmente)

## Paso 1: Configurar una herramienta de Tunneling
Dado que Mercado Pago requiere una URL accesible desde internet para notificarle a tu Webhook los pagos y autorizaciones, tu `localhost` local está oculto y no servirá.

Utiliza herramientas como **ngrok** o **localtunnel** en tu terminal para exponer tu proyecto temporalmente:
```bash
npx localtunnel --port 3000
```
Obtendrás un dominio temporal (ej. `https://tu-tunnel.loca.lt`).

## Paso 2: Actualización de Variables de Entorno
Modifica o asegúrate que tu `.env` tenga acceso claro a la nueva URL (esto garantiza que luego de pagar, MP regrese correctamente a la app):
```makefile
NEXT_PUBLIC_APP_URL="https://tu-tunnel.loca.lt"
```
Luego:
1. Ve a la consola de [Desarrolladores de Mercado Pago](https://dev.mercadopago.com.ar/).
2. Configura tu Webhook utilizando la URL temporal del túnel (ej. `https://tu-tunnel.loca.lt/api/webhooks/mercadoPago`).
3. Marca los eventos que te interesan (al menos **"Suscripciones"** y **"Pagos"**).

## Paso 3: Simular el Flujo del Usuario
1. Arranca tu entorno local con `npm run dev` y dirígete en tu navegador **al túnel** (es vital que navegues la app a través del túnel y no pongas `localhost:3000`).
2. Inicia sesión en LandingLab y ve a `https://tu-tunnel.loca.lt/suscribir`.
3. Haz clic en **"Suscribirse Ahora"**.
4. *Inspecciona:* Debes ser arrojado exitosamente a la pantalla de Checkout Oficial de Mercado Pago.
5. Mercado Pago provee Tarjetas de Prueba (visita su documentación para sacar los números de ejemplo). Úsalas para simular el pago real.

## Paso 4: Validar el Webhook
Una vez que apruebes el pago de suscripción con los datos falsos, Mercado Pago de inmediato enviará la notificación **HTTP POST** a tu túnel.

1. Revisa la terminal donde estés corriendo `npm run dev`. Deberías ver tus propios `console.log`:
   > `"Suscripción de usuario user_XXX autorizada. Créditos recargados a 3000."`

2. Corrobora la base de datos de Prisma en la tabla `Profile` o vuelve a `/dashboard` y deberás ver tus **3000 créditos** insertados mágicamente.