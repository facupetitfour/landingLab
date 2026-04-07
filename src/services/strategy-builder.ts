// Strategy Builder Service
// Infers the complete marketing strategy from brief + archetype
// This is the "intelligence" core of the app

import { getOpenAIClient, MODEL } from '@/lib/openai/client';
import { BriefData } from '@/types/brief';
import { MarketArchetype, StrategyData, SkeletonType } from '@/types/strategy';

const STRATEGY_SYSTEM_PROMPT = `Eres un estratega de marketing digital experto en copywriting persuasivo para infoproductos digitales.

Tu tarea es analizar un producto digital y su audiencia, y generar una estrategia completa de landing page.

REGLAS IMPORTANTES:
- Infiere de forma realista basándote en la información del producto y su audiencia
- No inventes claims extremos ni promesas irreales
- No inventes testimonios ni cifras de ingresos
- El tono debe coincidir con lo que el usuario pidió
- Si no hay información de bonus, sugiere 2-3 bonus coherentes con el producto
- Si no hay garantía, sugiere una garantía simple y razonable
- Las creencias requeridas deben ser lógicas y éticas
- Los FAQ deben ser preguntas reales que haría el avatar
- Responde SOLO con JSON válido`;

export async function buildStrategy(
  brief: BriefData,
  archetype: MarketArchetype
): Promise<StrategyData> {
  const response = await getOpenAIClient().chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: STRATEGY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Genera la estrategia de landing page para este producto:

## DATOS DEL PRODUCTO
- Nombre: ${brief.product_name || 'No definido'}
- Qué es: ${brief.product_function || 'No definido'}
- Audiencia: ${brief.target_audience_raw || 'No definida'}
- Resultado principal: ${brief.core_result || 'No definido'}
- Formato: ${brief.format || 'No definido'}
- Precio: ${brief.price || 'No definido'} ${brief.currency || ''}
- Bonuses: ${brief.bonuses || 'No tiene (sugiere algunos)'}
- Garantía: ${brief.guarantee || 'No tiene (sugiere una)'}
- Tono: ${brief.tone_style || 'profesional y cercano'}
- Arquetipo de mercado: ${archetype}

## GENERA LA ESTRATEGIA

Devuelve un JSON con esta EXACTA estructura:
{
  "market_archetype": "${archetype}",
  "avatar_summary": "Descripción concreta del avatar ideal (2-3 oraciones)",
  "primary_desire": "El deseo principal que motiva al avatar",
  "primary_pain": "El dolor principal que sufre el avatar",
  "primary_objection": "La objeción principal que tendría antes de comprar",
  "required_beliefs": ["creencia 1 que debe tener", "creencia 2", "creencia 3"],
  "promise": "La promesa principal de la landing page (una frase poderosa)",
  "mechanism": "El mecanismo o método que el producto usa para lograr el resultado",
  "offer_positioning": "Cómo posicionar la oferta (2-3 oraciones)",
  "recommended_angle": "El ángulo editorial recomendado para la landing",
  "faq_topics": ["tema de pregunta 1", "tema 2", "tema 3", "tema 4", "tema 5"],
  "skeleton_type": "standard_infoproduct | offer_heavy | minimal_short"
}

Para skeleton_type:
- "standard_infoproduct": para la mayoría de productos (estructura completa)
- "offer_heavy": si el precio es alto o tiene muchos bonus
- "minimal_short": si es un producto simple y barato`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Strategy Builder: no response from LLM');
  }

  try {
    const parsed = JSON.parse(content) as StrategyData;
    // Validate skeleton_type
    const validSkeletons: SkeletonType[] = ['standard_infoproduct', 'offer_heavy', 'minimal_short'];
    if (!parsed.skeleton_type || !validSkeletons.includes(parsed.skeleton_type)) {
      parsed.skeleton_type = 'standard_infoproduct';
    }
    return parsed;
  } catch {
    throw new Error('Strategy Builder: failed to parse LLM response');
  }
}
