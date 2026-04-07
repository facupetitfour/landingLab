// Copy data — generated section-by-section by AI

export interface HeroSection {
  headline: string;
  subheadline: string;
  cta_text: string;
}

export interface ProblemsSection {
  intro: string;
  problems: string[];
}

export interface BenefitsSection {
  intro: string;
  benefits: string[];
}

export interface ProductSection {
  title: string;
  description: string;
}

export interface IncludesSection {
  title: string;
  items: string[];
}

export interface BonusSection {
  title: string;
  items: { name: string; description: string }[];
}

export interface GuaranteeSection {
  title: string;
  description: string;
}

export interface FaqSection {
  title: string;
  items: { question: string; answer: string }[];
}

export interface FinalOfferSection {
  headline: string;
  subheadline: string;
  price_text: string;
  cta_text: string;
}

export interface CopyData {
  hero: HeroSection;
  problems: ProblemsSection;
  benefits: BenefitsSection;
  product: ProductSection;
  includes: IncludesSection;
  bonus: BonusSection | null;
  guarantee: GuaranteeSection | null;
  faq: FaqSection;
  final_offer: FinalOfferSection;
}

export const COPY_SECTION_LABELS: Record<keyof CopyData, string> = {
  hero: 'Hero',
  problems: 'Problemas',
  benefits: 'Beneficios',
  product: 'Presentación del producto',
  includes: 'Qué incluye',
  bonus: 'Bonus',
  guarantee: 'Garantía',
  faq: 'Preguntas frecuentes',
  final_offer: 'Oferta final',
};
