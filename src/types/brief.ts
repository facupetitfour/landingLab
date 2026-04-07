// Brief structured data — collected from chat conversation

export interface BriefData {
  product_name: string | null;
  product_function: string | null;
  target_audience_raw: string | null;
  core_result: string | null;
  format: string | null;
  price: string | null;
  currency: string | null;
  bonuses: string | null;
  guarantee: string | null;
  tone_style: string | null;
  page_length: 'short' | 'medium' | 'long' | null;
  checkout_url: string | null;
}

export const EMPTY_BRIEF: BriefData = {
  product_name: null,
  product_function: null,
  target_audience_raw: null,
  core_result: null,
  format: null,
  price: null,
  currency: null,
  bonuses: null,
  guarantee: null,
  tone_style: null,
  page_length: null,
  checkout_url: null,
};

// Fields that are required before generation can proceed
export const REQUIRED_BRIEF_FIELDS: (keyof BriefData)[] = [
  'product_name',
  'product_function',
  'target_audience_raw',
  'core_result',
  'format',
];

// Fields that are optional (generation handles nulls gracefully)
export const OPTIONAL_BRIEF_FIELDS: (keyof BriefData)[] = [
  'price',
  'currency',
  'bonuses',
  'guarantee',
  'tone_style',
  'page_length',
  'checkout_url',
];
