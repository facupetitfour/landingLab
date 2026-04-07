import OpenAI from 'openai';

let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

export default { get client() { return getOpenAIClient(); } };

export const MODEL = 'gpt-4o';
export const MODEL_MINI = 'gpt-4o-mini';
