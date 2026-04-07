// Field Extractor Service
// Extracts structured brief data from user's natural language responses
// Uses LLM with JSON mode for reliable structured extraction

import { getOpenAIClient, MODEL_MINI } from '@/lib/openai/client';
import { BriefData } from '@/types/brief';

const EXTRACTION_SYSTEM_PROMPT = `Eres un asistente experto en extraer información estructurada de respuestas conversacionales.

Tu tarea es leer la respuesta del usuario y extraer los campos relevantes.

REGLAS:
- Solo extrae información que el usuario haya mencionado explícitamente
- Si el usuario dice "no tengo", "aún no", "no sé", marca el campo como null
- No inventes información
- Extrae precios como string (ej: "29.99")
- Detecta la moneda si la menciona (USD, EUR, etc.) o infiere por contexto
- Para bonuses y garantías, extrae la descripción completa que dio el usuario
- Responde SOLO con JSON válido`;

interface ExtractionResult {
  extracted_fields: Partial<BriefData>;
  confidence: 'high' | 'medium' | 'low';
  needs_clarification: boolean;
  clarification_reason?: string;
}

export async function extractFields(
  userMessage: string,
  targetFields: string[],
  currentBrief: BriefData,
  questionContext: string
): Promise<ExtractionResult> {
  const response = await getOpenAIClient().chat.completions.create({
    model: MODEL_MINI,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Pregunta que se le hizo al usuario: "${questionContext}"

Campos objetivo a extraer: ${JSON.stringify(targetFields)}

Brief actual (datos ya recopilados): ${JSON.stringify(currentBrief)}

Respuesta del usuario: "${userMessage}"

Extrae los campos mencionados de la respuesta del usuario. Devuelve un JSON con esta estructura:
{
  "extracted_fields": { ... campos extraídos ... },
  "confidence": "high" | "medium" | "low",
  "needs_clarification": true/false,
  "clarification_reason": "razón si needs_clarification es true"
}

Si la respuesta es muy corta (menos de 5 palabras) para una pregunta importante, marca needs_clarification como true.
Si la respuesta es ambigua, marca confidence como "low" y needs_clarification como true.`,
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      extracted_fields: {},
      confidence: 'low',
      needs_clarification: true,
      clarification_reason: 'No se pudo procesar la respuesta',
    };
  }

  try {
    return JSON.parse(content) as ExtractionResult;
  } catch {
    return {
      extracted_fields: {},
      confidence: 'low',
      needs_clarification: true,
      clarification_reason: 'Error al procesar la respuesta',
    };
  }
}

export async function generateBriefSummary(brief: BriefData): Promise<string> {
  const parts: string[] = [];

  if (brief.product_name) parts.push(`📦 **Producto:** ${brief.product_name}`);
  if (brief.product_function) parts.push(`📝 **Qué es:** ${brief.product_function}`);
  if (brief.target_audience_raw) parts.push(`🎯 **Audiencia:** ${brief.target_audience_raw}`);
  if (brief.core_result) parts.push(`✨ **Resultado principal:** ${brief.core_result}`);
  if (brief.format) parts.push(`📚 **Formato:** ${brief.format}`);
  if (brief.price) parts.push(`💰 **Precio:** ${brief.price} ${brief.currency || ''}`);
  if (brief.bonuses) parts.push(`🎁 **Bonus:** ${brief.bonuses}`);
  if (brief.guarantee) parts.push(`🛡️ **Garantía:** ${brief.guarantee}`);
  if (brief.tone_style) parts.push(`🎨 **Tono:** ${brief.tone_style}`);
  if (brief.checkout_url) parts.push(`🔗 **Checkout:** ${brief.checkout_url}`);

  return parts.join('\n');
}
