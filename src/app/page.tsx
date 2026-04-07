import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ClientScripts from './ClientScripts';
import './offer.css';

export const metadata: Metadata = {
  title: 'LandingLab | Minimalist Landing Page Creator',
  description: 'LandingLab utiliza inteligencia artificial y estructuras validadas en +1500 ofertas para crear landing pages de alta conversión sin código.',
  keywords: ['landing page', 'inteligencia artificial', 'infoproductos', 'alta conversión', 'creador de landings'],
  openGraph: {
    title: 'LandingLab | Crea Landings de Alta Conversión',
    description: 'Transforma tus visitantes en clientes con landing pages generadas por IA y estructuradas para convertir.',
    url: 'https://landinglab.com',
    siteName: 'LandingLab',
    images: [
      {
        url: 'https://cdn.shopify.com/s/files/1/0984/1701/7216/files/imagen_2026-03-10_121314296_1.webp',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LandingLab',
    description: 'Landing pages de alta conversión generadas con IA.',
    images: ['https://cdn.shopify.com/s/files/1/0984/1701/7216/files/imagen_2026-03-10_121314296_1.webp'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LandingLab',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '19900',
    priceCurrency: 'ARS',
  },
  description: 'Plataforma para crear landing pages de alta conversión utilizando inteligencia artificial.',
};

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientScripts />
      <main className="ll-shopify-container">

        {/* ═══ TOP BAR ═══ */}
        <aside className="ll-top-bar" aria-label="Announcement">
          <div className="ll-top-bar-offer" role="alert">
            Arquitectura de Conversión Comprobada <span>• V2.0 Disponible</span>
          </div>
        </aside>

        {/* ═══ HERO ═══ */}
        <header className="ll-hero">
          <div className="ll-container">
            <div className="ll-hero-badge ll-fade-in">
              <span aria-hidden="true"></span>
              Impulsado por AI y +1500 Ofertas
            </div>

            <h1 className="ll-fade-in">
              Landing Pages de <span>Alta Conversión</span>
            </h1>

            <p className="ll-hero-subtitle ll-fade-in">
              Construye, despliega y optimiza landings estructuradas bajo sólidos principios de marketing. Todo esto en minutos y sin tocar una línea de código.
            </p>

            <div className="ll-hero-actions ll-fade-in">
              <a href="#ll-main-cta" className="ll-btn-primary">
                Comenzar ahora
              </a>
              <a href="#demo" className="ll-btn-secondary">
                Ver Demo
              </a>
            </div>
          </div>
        </header>

        {/* ═══ PAIN POINT SECTION ═══ */}
        <section className="ll-section" aria-labelledby="pain-title">
          <div className="ll-container ll-text-center">
            <h2 id="pain-title" className="ll-fade-in">El problema con tu oferta</h2>
            <p className="ll-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Traffic is not the issue. The architecture of your landing page is failing to convert visitors into buyers.
            </p>

            <div className="ll-compare ll-fade-in">
              {[
                'Tu tráfico llega, pero no se convierte en clientes.',
                'Experimentás con el header y no ves resultados.',
                'El desarrollo y diseño demoran semanas invaluables.',
                'Dependerás de plantillas genéricas sin estrategia.',
              ].map((text, i) => (
                <div key={i} className="ll-compare-row ll-pain-row">
                  <div className="ll-compare-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                  </div>
                  <div className="ll-compare-text">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ BENEFIT SECTION ═══ */}
        <section className="ll-section" aria-labelledby="benefit-title">
          <div className="ll-container">
            <div className="ll-text-center">
              <h2 id="benefit-title" className="ll-fade-in">La solución inteligente</h2>
              <p className="ll-fade-in">No aprendes conversión, la aplicas automáticamente.</p>
            </div>

            <div className="ll-grid">
              {[
                { title: 'Lanzamiento Flash', desc: 'Creá landings en cuestión de minutos no de semanas.', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
                { title: 'Claridad Estratégica', desc: 'Tu mensaje de marketing ordenado de principio a fin.', icon: 'M4 6h16M4 12h16m-7 6h7' },
                { title: 'Manejo de Objeciones', desc: 'Elimina las dudas frecuentes antes del Checkout.', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
              ].map((item, i) => (
                <article key={i} className="ll-card ll-fade-in">
                  <div className="ll-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon}></path>
                    </svg>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="ll-section" aria-labelledby="how-it-works-title">
          <div className="ll-container">
            <div className="ll-text-center">
              <h2 id="how-it-works-title" className="ll-fade-in">Cómo funciona</h2>
              <p className="ll-fade-in">Tres simples pasos entre tu idea y una landing publicada.</p>
            </div>

            <div className="ll-steps">
              {[
                { title: 'Configuración', desc: 'Ingresa los datos de tu producto al sistema inteligente.' },
                { title: 'Arquitectura IA', desc: 'El motor estructura el copy basándose en modelos ganadores.' },
                { title: 'Despliegue', desc: 'Tu página queda lista y optimizada, alojada en milisegundos.' },
              ].map((step, i) => (
                <div key={i} className="ll-step ll-fade-in">
                  <div className="ll-step-number">{i + 1}</div>
                  <div className="ll-step-content">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRODUCT & CTA ═══ */}
        <section className="ll-section" id="ll-main-cta" aria-labelledby="product-title">
          <div className="ll-container">
            <h2 id="product-title" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)' }}>Oferta de Lanzamiento Exclusiva</h2>

            <div className="ll-offer-card ll-fade-in">
              <div className="ll-offer-badge">Pro Access</div>
              <h3>LandingLab Completamente Ilimitado</h3>

              <div className="ll-price-wrap">
                <div className="ll-price-new">
                  $19.900
                </div>
                <div className="ll-price-currency">
                  <div className="ll-price-old">$49.900</div>
                  ARS / mes
                </div>
              </div>

              <ul className="ll-offer-features">
                {[
                  'Motor de Arquitectura Predictiva con IA',
                  'Exportación HTML limpia y optimizada',
                  'Estructuras validadas por +1500 infoproductores',
                  'Soporte técnico premium 24/7'
                ].map((feature, i) => (
                  <li key={i} className="ll-offer-feature">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a href="/dashboard" className="ll-btn-primary" style={{ width: '100%', padding: '18px' }}>
                Obtener Acceso
              </a>

              <div className="ll-security">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Transacción Segura 256-bit SSL
              </div>
            </div>

          </div>
        </section>

        {/* ═══ GUARANTEE ═══ */}
        <section className="ll-section" aria-labelledby="guarantee-title">
          <div className="ll-container">
            <div className="ll-guarantee ll-fade-in">
              <h2 id="guarantee-title">Garantía de Satisfacción</h2>
              <p>
                Integramos la mentalidad de los mejores ingenieros de conversión. Si nuestra plataforma no logra darte una estructura coherente y lista para publicar, podés pedir tu reintegro íntegro dentro de las primeras 72 horas sin preguntas.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="ll-footer">
          <div className="ll-container">
            <p>© {new Date().getFullYear()} - LandingLab Inc. / Buenos Aires</p>
            <p>
              <a href="#">Términos</a> &nbsp;&nbsp;·&nbsp;&nbsp; <a href="#">Privacidad</a>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
