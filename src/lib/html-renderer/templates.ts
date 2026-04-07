export const BODY_SKELETON = `
<body class="{{#if design.theme}}{{design.theme}}{{else}}{{#if design.colors}}theme-custom{{else}}theme-green{{/if}}{{/if}}"
      style="{{#if design.colors.primary}}--primary: {{design.colors.primary}};{{/if}}{{#if design.colors.secondary}}--primary-dark: {{design.colors.secondary}};{{/if}}{{#if design.colors.bgLight}}--bg-light: {{design.colors.bgLight}};{{/if}}{{#if design.colors.text}}--dark-gray: {{design.colors.text}}; --black: {{design.colors.text}};{{/if}}{{#if design.borderRadius}}--radius: {{design.borderRadius}};{{/if}}">

{{#if design.fontTheme}}
  {{#eq design.fontTheme 'inter'}}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style> body, h1, h2, h3 { font-family: 'Inter', sans-serif !important; } </style>
  {{/eq}}
  {{#eq design.fontTheme 'outfit'}}
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style> body, h1, h2, h3 { font-family: 'Outfit', sans-serif !important; } </style>
  {{/eq}}
  {{#eq design.fontTheme 'playfair'}}
    <style> body, h1, h2, h3 { font-family: 'Playfair Display', serif !important; } </style>
  {{/eq}}
{{/if}}
<div class="theme-switcher">
    <div class="theme-dot dot-green" title="Verde" onclick="setTheme('theme-green')"></div>
    <div class="theme-dot dot-blue" title="Azul" onclick="setTheme('theme-blue')"></div>
    <div class="theme-dot dot-red" title="Rojo" onclick="setTheme('theme-red')"></div>
    <div class="theme-dot dot-purple" title="Púrpura" onclick="setTheme('theme-purple')"></div>
    <div class="theme-dot dot-gold" title="Dorado" onclick="setTheme('theme-gold')"></div>
</div>

<div class="offer-bar">
    <i class="fas fa-bolt"></i> ⏰ {{offer_bar.text}} <span id="countdown" style="margin-left:5px;">{{offer_bar.countdown_minutes}}:00</span>
</div>
<div class="progress-container"><div class="progress-bar" id="progressBar"></div></div>

<section class="hero-section">
    <div class="container hero-grid">
        <div class="hero-content">
            <h1>{{hero.headline}}</h1>
            <p style="font-size: 18px; color: var(--gray); margin-bottom: 20px;">{{hero.subheadline}}</p>
            
            <div class="hero-social-proof">
                <div class="hero-avatars">
                    {{#each hero.trust_avatars}}
                    <img src="{{{this}}}" alt="User Avatar">
                    {{/each}}
                </div>
                <div class="hero-review-text">
                    <div class="stars">★★★★★</div>
                    <span style="color: var(--black); font-weight: 700; font-size: 14px;">{{hero.trust_text}}</span>
                </div>
            </div>

            <a href="{{{checkout_url}}}" class="cta-button pulse-big">{{hero.cta_text}}</a>
        </div>
        
        <div class="hero-image-container">
            <img src="{{{hero.main_image}}}" alt="Producto principal">
        </div>
    </div>
</section>

<section class="transformation-section">
    <div class="container">
        <h2 style="color: white;">El salto que estás a punto de dar</h2>
        <div class="transformation-grid">
            <div class="benefit-card pain-card">
                <div class="benefit-header">{{transformation.pain_points.title}}</div>
                <div class="benefit-list">
                    {{#each transformation.pain_points.items}}
                    <div class="benefit-item"><i class="fas fa-times-circle"></i><span>{{this}}</span></div>
                    {{/each}}
                </div>
            </div>

            <div class="chevron-divider"><i class="fas fa-arrow-down"></i></div>

            <div class="benefit-card gain-card">
                <div class="benefit-header" style="color: var(--primary-light);">{{transformation.gain_points.title}}</div>
                <div class="benefit-list">
                    {{#each transformation.gain_points.items}}
                    <div class="benefit-item"><i class="fas fa-check-circle"></i><span>{{this}}</span></div>
                    {{/each}}
                </div>
            </div>
        </div>
    </div>
</section>

<section class="includes-section">
    <div class="container">
        <h2>{{product.main_title}}</h2>
        
        <div class="modules-grid">
            {{#each product.includes}}
            <div class="module-card">
                <div class="module-img-box">
                    <img src="{{{image}}}" alt="{{title}}">
                </div>
                <div class="module-info">
                    <span class="badge badge-{{type}}">{{type}}</span>
                    <h3>{{title}}</h3>
                    <p style="color: var(--gray); font-size: 14px; margin-bottom: 15px;">{{subtitle}}</p>
                    <ul class="checklist">
                        {{#each points}}
                        <li class="checklist-item">{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
            </div>
            {{/each}}
        </div>
    </div>
</section>

<section id="precio">
    <div class="container">
        <h2>{{offer.title}}</h2>
        <div class="price-box">
            <div class="price-old">{{offer.price_old}}</div>
            <div class="price-new">{{offer.price_current}}</div>
            <div class="price-save">{{offer.savings_label}}</div>
        </div>
        
        <a href="{{{checkout_url}}}" class="cta-button pulse-big" style="margin: auto;">{{offer.cta_text}}</a>
        
        <div style="background:var(--white); padding:20px; border-radius:16px; margin:30px auto 0; max-width:600px; box-shadow:var(--shadow-md); display:flex; gap:15px; align-items:flex-start; border: 1px solid #e2e8f0;">
            <i class="fas fa-shield-alt" style="color:var(--primary); font-size:32px;"></i>
            <div>
                <strong style="font-size:16px; color:var(--black); display:block; margin-bottom:5px;">{{offer.guarantee_title}}</strong>
                <p style="font-size:14px; color:var(--gray); line-height:1.5;">{{offer.guarantee_body}}</p>
            </div>
        </div>
    </div>
</section>

<section class="cafe-reviews-section">
    <div class="container">
        <div class="cafe-reviews-header">
            <h2>{{social_proof.title}}</h2>
            <p style="text-align:center; color:var(--gray); margin-bottom: 30px; font-size: 18px;">{{social_proof.subtitle}}</p>
        </div>
        <div class="overall-rating" style="display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:40px;">
            <span class="stars" style="font-size: 20px;">★★★★★</span>
            <span style="font-size:13px; color:var(--gray); font-weight:600; text-transform:uppercase; letter-spacing:1px;">{{social_proof.count_label}}</span>
        </div>
        
        <div class="cafe-reviews-grid">
            {{#each social_proof.reviews}}
            <div class="cafe-review-card">
                <span class="stars">★★★★★</span>
                <p class="reviewer-name-cafe">{{author}} {{#if verified}}<span class="verified-icon">✓</span>{{/if}}</p>
                <p class="review-body-cafe">"{{text}}"</p>
            </div>
            {{/each}}
        </div>
    </div>
</section>

<section class="faq-section" style="background: var(--bg-light);">
    <div class="container">
        <h2>{{faq.title}}</h2>
        <div class="faq-container">
            {{#each faq.items}}
            <div class="faq-item">
                <div class="faq-question">{{question}}</div>
                <div class="faq-answer"><p>{{answer}}</p></div>
            </div>
            {{/each}}
        </div>
    </div>
</section>

<footer>
    <div class="container">
        <p>© 2026 - {{product.name}}. Todos los derechos reservados.</p>
    </div>
</footer>
</body>
`;