// Copy Generator Service V1.2
// Generates all landing page copy sections from brief + strategy
// Optimized for Social Proof Expansion & Automatic Bonus Generation

import { getOpenAIClient, MODEL } from '@/lib/openai/client';
import { BriefData } from '@/types/brief';
import { StrategyData } from '@/types/strategy';
import { LandingCopy } from '@/types/landing';

const COPY_SYSTEM_PROMPT = `Eres un copywriter experto en landing pages de respuesta directa y optimización de conversiones.

Tu tarea es escribir el copy completo de una landing page, basándote en la estrategia proporcionada.

REGLAS DE ORO PARA V1.2:
- SOCIAL PROOF: Genera obligatoriamente entre 6 y 10 testimonios plausibles.
- BONOS: Si el brief no incluye bonos suficientes, INVENTA 2 o 3 bonos adicionales de alto valor percibido.
- TONO: Mantén el tono solicitado pero prioriza la claridad y la urgencia.
- MOBILE-FIRST: Frases cortas. Máximo 2 líneas por párrafo.

DIRECTRICES DE IMÁGENES (CRÍTICO - FOTOGRAFÍA REAL):
1. AVATARS: Usa EXCLUSIVAMENTE https://i.pravatar.cc/150?u=[numero_del_1_al_70].
2. PRODUCTOS Y BONOS: Usa el servicio LoremFlickr para inyectar fotos fotográficas reales.
   Formato exacto: https://loremflickr.com/800/600/[palabra_clave_fisica]?lock=[numero_aleatorio_1_al_1000]
3. REGLAS PARA LA PALABRA CLAVE DE LOREMFLICKR:
   - Debe ser UNA SOLA palabra en inglés.
   - NUNCA uses conceptos abstractos (prohibido mental, success, mind, barrier).
   - Usa SOLAMENTE objetos físicos concretos, lugares o personas trabajando (ej: laptop, desk, notebook, coffee, meeting, office, woman, man, study, reading, gym, food).

REGLAS DE COPY:
- Escribe en español.
- NO inventes cifras de ingresos garantizados.
- El CTA debe ser un comando de acción claro.
- Responde SOLO con JSON válido.`;

export async function generateCopy(
  brief: BriefData,
  strategy: StrategyData
): Promise<LandingCopy> {

  const response = await getOpenAIClient().chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: COPY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Escribe el copy completo para la landing page de este producto:

## DATOS DEL PRODUCTO
- Nombre: ${brief.product_name}
- Qué es: ${brief.product_function}
- Audiencia: ${brief.target_audience_raw}
- Resultado principal: ${brief.core_result}
- Formato: ${brief.format}
- Precio Original / Descuento: ${brief.price || 'Sugerir precio basado en mercado'}
- Garantía: ${brief.guarantee || '30 días'}
- Tono: ${brief.tone_style || 'profesional y cercano'}
- URL de checkout: ${brief.checkout_url || '#'}

## REQUERIMIENTOS DE ESTRUCTURA JSON
Genera un JSON con esta estructura exacta. Respeta cada llave y tipo de dato.

{
  "offer_bar": {
    "text": "Texto con urgencia real (ej: OFERTA RELÁMPAGO TERMINA EN)",
    "countdown_minutes": 15
  },
  "hero": {
    "headline": "Headline principal impactante",
    "subheadline": "Subheadline que expande la promesa",
    "cta_text": "Texto del botón CTA central",
    "main_image": "https://loremflickr.com/800/600/laptop?lock=1",
    "trust_text": "+500 profesionales ya están dentro",
    "trust_avatars": [
      "https://i.pravatar.cc/150?u=1",
      "https://i.pravatar.cc/150?u=2",
      "https://i.pravatar.cc/150?u=3"
    ]
  },
  "transformation": {
    "pain_points": {
      "title": "La frustración de seguir igual",
      "items": ["Dolor 1", "Dolor 2", "Dolor 3"]
    },
    "gain_points": {
      "title": "Tu nueva vida con el programa",
      "items": ["Ganancia 1", "Ganancia 2", "Ganancia 3"]
    }
  },
  "product": {
    "main_title": "Todo lo que recibes hoy al unirte",
    "includes": [
      {
        "type": "CORE",
        "title": "Nombre del Módulo",
        "subtitle": "Beneficio del módulo",
        "image": "https://loremflickr.com/800/600/notebook?lock=2",
        "points": ["lo que aprenderás 1", "2"]
      },
      {
        "type": "BONUS",
        "title": "Bono de Regalo: [Nombre]",
        "subtitle": "Valorado en $XX (Gratis hoy)",
        "image": "https://loremflickr.com/800/600/coffee?lock=3",
        "points": ["Beneficio del bono"]
      }
    ]
  },
  "offer": {
    "title": "Asegura tu lugar hoy",
    "price_old": "$XX",
    "price_current": "${brief.price}",
    "savings_label": "Ahorras $ZZ",
    "cta_text": "Sí, quiero acceder ahora",
    "guarantee_title": "Garantía incondicional de 30 días",
    "guarantee_body": "Prueba el programa sin riesgo. Si no te convence, te devolvemos el 100% de tu dinero."
  },
  "social_proof": {
    "title": "Lo que dicen nuestros alumnos",
    "subtitle": "Casos de éxito reales",
    "count_label": "Basado en más de 200 reseñas",
    "reviews": [
      {
        "author": "Nombre Apellido",
        "text": "Testimonio enfocado en resultado X",
        "avatar": "https://i.pravatar.cc/150?u=4",
        "stars": 5,
        "verified": true
      }
    ]
  },
  "faq": {
    "title": "Preguntas Frecuentes",
    "items": [
      {
        "question": "¿Pregunta frecuente 1?",
        "answer": "Respuesta derribando la objeción."
      }
    ]
  }
}`
      }
    ],
    temperature: 0.8,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Copy Generator: no response from LLM');
  }

  try {
    return JSON.parse(content) as LandingCopy;
  } catch (error) {
    throw new Error('Copy Generator: failed to parse LLM response');
  }
}