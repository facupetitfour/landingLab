// Chat types — conversation messages and state

export type MessageRole = 'assistant' | 'user';

export interface ChatMessage {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type ProjectStatus =
  | 'welcome'
  | 'collecting_core_info'
  | 'collecting_offer_info'
  | 'collecting_style_preferences'
  | 'confirming_brief'
  | 'building_strategy'
  | 'generating_copy'
  | 'generating_html'
  | 'completed'
  | 'editing';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  welcome: 'Inicio',
  collecting_core_info: 'Información del producto',
  collecting_offer_info: 'Detalles de la oferta',
  collecting_style_preferences: 'Preferencias de estilo',
  confirming_brief: 'Confirmando datos',
  building_strategy: 'Construyendo estrategia',
  generating_copy: 'Generando copy',
  generating_html: 'Generando HTML',
  completed: 'Completado',
  editing: 'Editando',
};

// Question sequence configuration
export interface QuestionConfig {
  id: string;
  target_fields: string[];
  question: string;
  phase: ProjectStatus;
  required: boolean;
  follow_up_if_short?: string;
}

export const QUESTION_SEQUENCE: QuestionConfig[] = [
  {
    id: 'q1_product',
    target_fields: ['product_name', 'product_function'],
    question: '¿Cómo se llama tu producto y qué es exactamente? Contame en pocas palabras.',
    phase: 'collecting_core_info',
    required: true,
    follow_up_if_short: '¿Podrías darme un poco más de detalle? Por ejemplo, ¿qué aprende o logra alguien con tu producto?',
  },
  {
    id: 'q2_audience',
    target_fields: ['target_audience_raw'],
    question: '¿A quién va dirigido? ¿Quién es tu cliente ideal?',
    phase: 'collecting_core_info',
    required: true,
    follow_up_if_short: '¿Podrías describir un poco más a tu cliente típico? ¿Qué situación vive cuando busca tu producto?',
  },
  {
    id: 'q3_result',
    target_fields: ['core_result'],
    question: '¿Cuál es el resultado principal que tu cliente va a obtener con tu producto?',
    phase: 'collecting_core_info',
    required: true,
    follow_up_if_short: '¿Qué cambio concreto va a notar tu cliente después de usar tu producto?',
  },
  {
    id: 'q4_format',
    target_fields: ['format'],
    question: '¿En qué formato se entrega? (ebook, curso en video, plantillas, guía, workshop, etc.)',
    phase: 'collecting_core_info',
    required: true,
  },
  {
    id: 'q5_price',
    target_fields: ['price', 'currency'],
    question: '¿Ya tenés precio definido? ¿Cuánto cuesta? (Si todavía no tenés precio, decime "aún no")',
    phase: 'collecting_offer_info',
    required: false,
  },
  {
    id: 'q6_bonuses',
    target_fields: ['bonuses'],
    question: '¿Incluye algún bonus o material extra? (Si no tenés, no te preocupes, te puedo sugerir algunos)',
    phase: 'collecting_offer_info',
    required: false,
  },
  {
    id: 'q7_guarantee',
    target_fields: ['guarantee'],
    question: '¿Ofrecés algún tipo de garantía? (por ejemplo, "garantía de 30 días")',
    phase: 'collecting_offer_info',
    required: false,
  },
  {
    id: 'q8_tone',
    target_fields: ['tone_style'],
    question: '¿Cómo te gustaría que suene tu landing? Por ejemplo: profesional, cercano, motivacional, directo...',
    phase: 'collecting_style_preferences',
    required: false,
  },
  {
    id: 'q9_checkout',
    target_fields: ['checkout_url'],
    question: '¿Tenés el link de checkout de tu producto en Shopify? (Si no lo tenés aún, luego lo podés agregar)',
    phase: 'collecting_style_preferences',
    required: false,
  },
];

export const WELCOME_MESSAGE = `¡Hola! 👋 Soy tu asistente de LandingLab.

Voy a ayudarte a crear una landing page profesional para tu producto digital. Es súper simple: solo respondé unas preguntas sobre tu producto y yo me encargo del resto.`;

export const CONFIRMATION_INTRO = '📋 Perfecto, déjame resumir lo que entendí:\n\n';
export const CONFIRMATION_OUTRO = '\n\n¿Está todo bien? Si querés cambiar algo, decime qué ajustar. Si está correcto, escribí **"dale"** y empiezo a construir tu landing.';

export const GENERATION_MESSAGES = {
  building_strategy: '🔍 Analizando tu producto y tu audiencia...',
  generating_copy: '✍️ Escribiendo el copy de tu landing page...',
  generating_html: '🏗️ Armando el HTML listo para Shopify...',
  completed: '🎉 ¡Tu landing page está lista!',
};
