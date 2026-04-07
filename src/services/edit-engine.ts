// Edit Engine Service
// Handles user edit instructions on existing copy
// Uses LLM to interpret natural language edits

import { getOpenAIClient, MODEL } from '@/lib/openai/client';
import { LandingCopy } from '@/types/landing';

const EDIT_SYSTEM_PROMPT = `Eres un editor de copy experto en marketing digital y ventas tambien en diseño de landing pages. 

Tu tarea es modificar el copy existente de una landing page según las instrucciones del usuario.

REGLAS FUNDAMENTALES:
- Aplica SOLO el cambio solicitado — no reescribas todo.
- Mantén el tono y estilo existente a menos que el usuario pida cambiarlo.
- Mantén la consistencia (nombre del producto, CTA, etc.).
- NO inventes testimonios ni cifras.
- Responde con el JSON COMPLETO de copy actualizado (misma estructura que el input).
- Responde SOLO con JSON válido.

DIRECTRICES DE IMÁGENES (CRÍTICO - FOTOGRAFÍA REAL):
1. AVATARS: Usa EXCLUSIVAMENTE https://i.pravatar.cc/150?u=[numero_del_1_al_70].
2. PRODUCTOS Y BONOS: Usa el servicio LoremFlickr para inyectar fotos fotográficas reales.
   Formato exacto: https://loremflickr.com/800/600/[palabra_clave_fisica]?lock=[numero_aleatorio_1_al_1000]
3. REGLAS PARA LA PALABRA CLAVE DE LOREMFLICKR:
   - Debe ser UNA SOLA palabra en inglés.
   - NUNCA uses conceptos abstractos (prohibido mental, success, mind, barrier).
   - Usa SOLAMENTE objetos físicos concretos, lugares o personas trabajando (ej: laptop, desk, notebook, coffee, meeting, office, woman, man, study, reading, gym, food).`;
// Quick edit presets that map to specific instructions
export const QUICK_EDITS: Record<string, string> = {
  'mas_corto': 'Acorta todos los textos. Hazlos más directos y concisos. Elimina redundancias.',
  'mas_vendedor': 'Haz que el copy sea más persuasivo y orientado a la venta. Agrega más urgencia y deseo.',
  'mas_premium': 'Eleva el tono. Hazlo sonar más exclusivo, sofisticado y de alto valor.',
  'cambiar_cta': 'Cambia los textos de los botones CTA por alternativas más atractivas y variadas.',
  'mejorar_hero': 'Reescribe el headline y subheadline del hero para que sean más impactantes y memorables.',
  'cambiar_imagenes': 'Actualiza todas las imágenes de los productos y bonos generando nuevas URLs de Unsplash. Recuerda usar únicamente objetos físicos en inglés como palabra clave y añade el parámetro &sig= con un número diferente en cada una para que no se repitan.'
};

export async function editCopy(
  currentCopy: LandingCopy,
  editInstruction: string
): Promise<LandingCopy> {
  const response = await getOpenAIClient().chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EDIT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `## COPY ACTUAL
${JSON.stringify(currentCopy, null, 2)}

## INSTRUCCIÓN DE EDICIÓN
${editInstruction}

## TAREA
Aplica la instrucción al copy y devuelve el JSON completo actualizado con la misma estructura exacta.
Solo modifica lo que sea necesario según la instrucción, preservando estrictamente el resto (especialmente las URLs de las imágenes si no se pidió cambiarlas).`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Edit Engine: no response from LLM');
  }

  try {
    return JSON.parse(content) as LandingCopy;
  } catch {
    throw new Error('Edit Engine: failed to parse LLM response');
  }
}