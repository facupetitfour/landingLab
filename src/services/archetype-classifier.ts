// Archetype Classifier Service
// Classifies the product into one of 6 market archetypes
// Uses LLM with constrained JSON output

import { getOpenAIClient, MODEL_MINI } from '@/lib/openai/client';
import { BriefData } from '@/types/brief';
import { MarketArchetype } from '@/types/strategy';

const CLASSIFIER_SYSTEM_PROMPT = `Eres un experto en marketing digital y categorización de infoproductos.

Tu tarea es clasificar un producto digital en UNO de estos 6 arquetipos de mercado:

1. monetizable_skill_home — El producto enseña una habilidad que se puede monetizar desde casa (freelancing, diseño, programación, etc.)
2. hobby_to_business — El producto ayuda a convertir un hobby o pasión en un negocio (fotografía, cocina, manualidades, etc.)
3. physical_transformation — El producto se enfoca en transformación física (fitness, nutrición, salud, belleza, etc.)
4. emotional_transformation — El producto se enfoca en transformación emocional o mental (mindset, relaciones, autoestima, espiritualidad, etc.)
5. marketing_business_growth — El producto enseña marketing, ventas o crecimiento de negocio (redes sociales, ads, e-commerce, etc.)
6. productivity_organization — El producto se enfoca en productividad, organización o gestión del tiempo (planners, sistemas, métodos, etc.)

REGLAS:
- Elige EXACTAMENTE UN arquetipo
- Basa tu decisión en el producto, la audiencia y el resultado principal
- Si hay ambigüedad, elige el más dominante
- Responde SOLO con JSON válido`;

interface ClassificationResult {
  archetype: MarketArchetype;
  confidence: number; // 0-1
  reasoning: string;
}

export async function classifyArchetype(brief: BriefData): Promise<ClassificationResult> {
  const response = await getOpenAIClient().chat.completions.create({
    model: MODEL_MINI,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Clasifica este producto digital en un arquetipo:

Nombre del producto: ${brief.product_name || 'No especificado'}
Qué es/hace: ${brief.product_function || 'No especificado'}
Audiencia objetivo: ${brief.target_audience_raw || 'No especificado'}
Resultado principal: ${brief.core_result || 'No especificado'}
Formato: ${brief.format || 'No especificado'}

Responde con JSON:
{
  "archetype": "uno_de_los_6_arquetipos",
  "confidence": 0.0-1.0,
  "reasoning": "breve explicación de por qué este arquetipo"
}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      archetype: 'monetizable_skill_home',
      confidence: 0.3,
      reasoning: 'Clasificación por defecto — no se pudo procesar',
    };
  }

  try {
    const result = JSON.parse(content) as ClassificationResult;
    // Validate archetype is valid
    const validArchetypes: MarketArchetype[] = [
      'monetizable_skill_home', 'hobby_to_business', 'physical_transformation',
      'emotional_transformation', 'marketing_business_growth', 'productivity_organization',
    ];
    if (!validArchetypes.includes(result.archetype)) {
      result.archetype = 'monetizable_skill_home';
      result.confidence = 0.3;
    }
    return result;
  } catch {
    return {
      archetype: 'monetizable_skill_home',
      confidence: 0.3,
      reasoning: 'Error en clasificación — usando valor por defecto',
    };
  }
}
