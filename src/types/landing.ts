// types/landing.ts

export interface LandingDesign {
  theme?: string;
  fontTheme?: string;
  borderRadius?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    bgLight?: string;
    text?: string;
  };
}


export interface Review {
  author: string;
  text: string;
  avatar: string;
  stars: number;
  verified: boolean;
}

export interface ProductInclude {
  type: "CORE" | "BONUS";
  title: string;
  subtitle: string;
  image: string;
  points: string[];
}

export interface LandingCopy {
  offer_bar: {
    text: string;
    countdown_minutes: number;
  };
  hero: {
    headline: string;
    subheadline: string;
    cta_text: string;
    main_image: string;
    trust_text: string; // Ej: "+500 alumnos satisfechos"
    trust_avatars: string[]; // URLs de 3-4 avatares para debajo del botón
  };
  transformation: {
    pain_points: { title: string; items: string[] };
    gain_points: { title: string; items: string[] };
  };
  product: {
    main_title: string;
    includes: ProductInclude[]; // Mezcla de CORE y BONUS
  };
  offer: {
    title: string;
    price_old: string;
    price_current: string;
    savings_label: string;
    cta_text: string;
    guarantee_title: string;
    guarantee_body: string;
  };
  social_proof: {
    title: string;
    subtitle: string;
    count_label: string;
    reviews: Review[];
  };
  faq: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  design?: LandingDesign;
}