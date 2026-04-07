// Strategy data — inferred by AI from brief

export type MarketArchetype =
  | 'monetizable_skill_home'
  | 'hobby_to_business'
  | 'physical_transformation'
  | 'emotional_transformation'
  | 'marketing_business_growth'
  | 'productivity_organization';

export const ARCHETYPE_LABELS: Record<MarketArchetype, string> = {
  monetizable_skill_home: 'Habilidad monetizable desde casa',
  hobby_to_business: 'De hobby a negocio',
  physical_transformation: 'Transformación física',
  emotional_transformation: 'Transformación emocional',
  marketing_business_growth: 'Marketing y crecimiento de negocio',
  productivity_organization: 'Productividad y organización',
};

export interface StrategyData {
  market_archetype: MarketArchetype | null;
  avatar_summary: string | null;
  primary_desire: string | null;
  primary_pain: string | null;
  primary_objection: string | null;
  required_beliefs: string[] | null;
  promise: string | null;
  mechanism: string | null;
  offer_positioning: string | null;
  recommended_angle: string | null;
  faq_topics: string[] | null;
  skeleton_type: SkeletonType | null;
}

export type SkeletonType = 'standard_infoproduct' | 'offer_heavy' | 'minimal_short';

export const SKELETON_LABELS: Record<SkeletonType, string> = {
  standard_infoproduct: 'Infoproducto estándar',
  offer_heavy: 'Enfocado en oferta',
  minimal_short: 'Mínimo y corto',
};

export const EMPTY_STRATEGY: StrategyData = {
  market_archetype: null,
  avatar_summary: null,
  primary_desire: null,
  primary_pain: null,
  primary_objection: null,
  required_beliefs: null,
  promise: null,
  mechanism: null,
  offer_positioning: null,
  recommended_angle: null,
  faq_topics: null,
  skeleton_type: null,
};
