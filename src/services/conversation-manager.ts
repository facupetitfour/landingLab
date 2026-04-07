// Conversation Manager Service
// Orchestrates the entire chat flow: state machine, question routing,
// field extraction, brief compilation, and generation triggering

import { BriefData, REQUIRED_BRIEF_FIELDS, EMPTY_BRIEF } from '@/types/brief';
import { ProjectStatus, QUESTION_SEQUENCE, QuestionConfig } from '@/types/chat';

export interface ConversationState {
  status: ProjectStatus;
  currentQuestionIndex: number;
  briefData: BriefData;
  pendingClarification: boolean;
}

export interface ConversationResponse {
  messages: string[];
  newStatus: ProjectStatus;
  newQuestionIndex: number;
  updatedBrief: BriefData;
  shouldGenerate: boolean;
}

// Determine the status phase based on question index
function getPhaseForQuestion(index: number): ProjectStatus {
  if (index < 0) return 'welcome';
  if (index >= QUESTION_SEQUENCE.length) return 'confirming_brief';
  return QUESTION_SEQUENCE[index].phase;
}

// Get the next question to ask
export function getNextQuestion(state: ConversationState): QuestionConfig | null {
  if (state.currentQuestionIndex >= QUESTION_SEQUENCE.length) {
    return null;
  }
  return QUESTION_SEQUENCE[state.currentQuestionIndex];
}

// Check if all required fields are filled
export function isReadyForGeneration(brief: BriefData): boolean {
  return REQUIRED_BRIEF_FIELDS.every((field) => {
    const value = brief[field];
    return value !== null && value !== undefined && value !== '';
  });
}

// Build the confirmation summary
export function buildConfirmationSummary(brief: BriefData): string {
  const lines: string[] = [];

  if (brief.product_name) lines.push(`📦 **Producto:** ${brief.product_name}`);
  if (brief.product_function) lines.push(`📝 **Qué es:** ${brief.product_function}`);
  if (brief.target_audience_raw) lines.push(`🎯 **Audiencia:** ${brief.target_audience_raw}`);
  if (brief.core_result) lines.push(`✨ **Resultado principal:** ${brief.core_result}`);
  if (brief.format) lines.push(`📚 **Formato:** ${brief.format}`);
  if (brief.price) lines.push(`💰 **Precio:** ${brief.price} ${brief.currency || ''}`);
  if (brief.bonuses) lines.push(`🎁 **Bonus:** ${brief.bonuses}`);
  if (brief.guarantee) lines.push(`🛡️ **Garantía:** ${brief.guarantee}`);
  if (brief.tone_style) lines.push(`🎨 **Tono:** ${brief.tone_style}`);
  if (brief.checkout_url) lines.push(`🔗 **Checkout:** ${brief.checkout_url}`);

  return lines.join('\n');
}

// Process user response to decide next action
export function processUserResponse(
  userMessage: string,
  state: ConversationState,
  extractedFields: Partial<BriefData>,
  needsClarification: boolean
): ConversationResponse {
  const response: ConversationResponse = {
    messages: [],
    newStatus: state.status,
    newQuestionIndex: state.currentQuestionIndex,
    updatedBrief: { ...state.briefData },
    shouldGenerate: false,
  };

  // Handle welcome state
  if (state.status === 'welcome') {
    response.newStatus = 'collecting_core_info';
    response.newQuestionIndex = 0;
    const firstQuestion = QUESTION_SEQUENCE[0];
    response.messages.push(firstQuestion.question);
    return response;
  }

  // Handle confirmation state
  if (state.status === 'confirming_brief') {
    const lowerMsg = userMessage.toLowerCase().trim();
    const confirmWords = ['dale', 'sí', 'si', 'ok', 'perfecto', 'correcto', 'está bien', 'esta bien', 'listo', 'generar', 'adelante'];

    if (confirmWords.some((w) => lowerMsg.includes(w))) {
      response.shouldGenerate = true;
      response.newStatus = 'building_strategy';
      response.messages.push('🚀 ¡Perfecto! Estoy construyendo tu landing page...');
      return response;
    } else {
      // User wants to change something — stay in confirming but acknowledge
      response.messages.push(
        'Entendido, ¿qué te gustaría cambiar? Podés decirme algo como "cambiar el nombre del producto" o "agregar un bonus".'
      );
      return response;
    }
  }

  // Handle collecting states — merge extracted fields
  response.updatedBrief = {
    ...state.briefData,
    ...extractedFields,
  };

  // If clarification is needed, re-ask
  if (needsClarification) {
    const currentQ = QUESTION_SEQUENCE[state.currentQuestionIndex];
    if (currentQ?.follow_up_if_short) {
      response.messages.push(currentQ.follow_up_if_short);
    } else {
      response.messages.push('¿Podrías darme un poco más de detalle sobre eso?');
    }
    return response;
  }

  // Advance to next question
  const nextIndex = state.currentQuestionIndex + 1;

  if (nextIndex >= QUESTION_SEQUENCE.length) {
    // All questions asked — move to confirmation
    response.newStatus = 'confirming_brief';
    response.newQuestionIndex = nextIndex;
    const summary = buildConfirmationSummary(response.updatedBrief);
    response.messages.push(
      `📋 Perfecto, déjame resumir lo que entendí:\n\n${summary}\n\n¿Está todo bien? Si querés cambiar algo, decime qué ajustar. Si está correcto, escribí **"dale"** y empiezo a construir tu landing.`
    );
  } else {
    // Ask next question
    const nextQuestion = QUESTION_SEQUENCE[nextIndex];
    response.newQuestionIndex = nextIndex;
    response.newStatus = getPhaseForQuestion(nextIndex);
    response.messages.push(nextQuestion.question);
  }

  return response;
}

// Initial state factory
export function createInitialState(): ConversationState {
  return {
    status: 'welcome',
    currentQuestionIndex: -1,
    briefData: { ...EMPTY_BRIEF },
    pendingClarification: false,
  };
}
