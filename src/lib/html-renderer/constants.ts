export const STATIC_HEAD = `
<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<style>
  :root {
    /* Tema base (Verde) */
    --primary: #27AE60;
    --primary-light: #dcfce7;
    --primary-dark: #166534;
    --black: #0f172a; /* Azul noche muy oscuro, más elegante que negro puro */
    --white: #ffffff;
    --bg-light: #f8fafc;
    --gray: #64748b;
    --dark-gray: #334155;
    --danger: #ef4444;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
    --radius: 16px;
    --transition: all 0.3s ease;
  }

  /* Temas Seleccionables */
  .theme-green { --primary: #22c55e; --primary-light: #dcfce7; --primary-dark: #166534; }
  .theme-blue { --primary: #3b82f6; --primary-light: #dbeafe; --primary-dark: #1e40af; }
  .theme-red { --primary: #ef4444; --primary-light: #fee2e2; --primary-dark: #991b1b; }
  .theme-purple { --primary: #a855f7; --primary-light: #f3e8ff; --primary-dark: #6b21a8; }
  .theme-gold { --primary: #eab308; --primary-light: #fef9c3; --primary-dark: #854d0e; }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Montserrat', sans-serif; font-size: 16px; color: var(--dark-gray); background: var(--bg-light); padding-top: 50px; }

  /* Contenedor ampliado para Desktop */
  .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; width: 100%; }
  section { padding: 60px 0; }
  @media (min-width: 768px) { section { padding: 90px 0; } }

  /* Barras Superiores */
  .offer-bar { position: fixed; top: 0; left: 0; width: 100%; background: var(--black); color: var(--white); text-align: center; padding: 12px; font-weight: 700; font-size: 14px; z-index: 1000; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: var(--shadow-sm); }
  .progress-container { width: 100%; height: 4px; background: #e2e8f0; position: fixed; top: 44px; left: 0; z-index: 999; }
  .progress-bar { height: 100%; background: var(--primary); width: 0%; transition: width 0.1s ease; }

  /* Tipografía */
  h1, h2, h3 { font-family: 'Playfair Display', serif; color: var(--black); line-height: 1.2; }
  h1 { font-size: clamp(32px, 5vw, 52px); margin-bottom: 20px; font-weight: 800; }
  h2 { font-size: clamp(28px, 4vw, 40px); text-align: center; margin-bottom: 40px; }
  h2::after { content: ''; display: block; width: 60px; height: 4px; background: var(--primary); margin: 15px auto 0; border-radius: 2px; }

  /* Botones */
  .cta-button { display: block; width: 100%; max-width: 400px; margin: auto; padding: 20px; background: var(--primary); color: var(--white); text-align: center; text-decoration: none; font-size: 18px; font-weight: 800; text-transform: uppercase; border-radius: 50px; box-shadow: 0 10px 15px -3px rgba(var(--primary-dark), 0.3); transition: var(--transition); letter-spacing: 0.5px; }
  .cta-button:hover { transform: translateY(-3px); box-shadow: var(--shadow-xl); filter: brightness(1.1); }
  .pulse-big { animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }

  /* 1. HERO - Dos columnas en PC */
  .hero-section { background: var(--white); padding-top: 80px; text-align: center; }
  .hero-grid { display: grid; gap: 40px; align-items: center; }
  .hero-image-container { width: 100%; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-xl); }
  .hero-image-container img { width: 100%; height: auto; display: block; }
  .hero-social-proof { display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 25px 0; }
  .hero-avatars { display: flex; }
  .hero-avatars img { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--white); margin-left: -15px; }
  .hero-avatars img:first-child { margin-left: 0; }
  .stars { color: #f59e0b; font-size: 14px; }
  @media (min-width: 768px) {
    .hero-section { text-align: left; }
    .hero-grid { grid-template-columns: 1fr 1fr; }
    .hero-social-proof { align-items: flex-start; }
    .cta-button { margin: 0; }
  }

  /* 2. TRANSFORMACIÓN - Grilla 2 columnas */
  .transformation-section { background: var(--black); color: var(--white); }
  .transformation-section h2 { color: var(--white); }
  .transformation-grid { display: grid; gap: 30px; margin-top: 40px; }
  .benefit-card { background: rgba(255,255,255,0.05); border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.1); padding: 30px; }
  .benefit-header { font-size: 20px; font-weight: 700; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center; }
  .benefit-item { display: flex; gap: 15px; margin-bottom: 15px; font-size: 15px; align-items: flex-start; }
  .pain-card i { color: var(--danger); font-size: 20px; margin-top: 2px; }
  .gain-card i { color: var(--primary); font-size: 20px; margin-top: 2px; }
  .chevron-divider { text-align: center; color: rgba(255,255,255,0.2); font-size: 30px; }
  @media (min-width: 768px) {
    .transformation-grid { grid-template-columns: 1fr auto 1fr; align-items: center; }
    .chevron-divider { transform: rotate(-90deg); } /* Flecha apunta a la derecha en PC */
  }

  /* 3. MÓDULOS Y BONOS - Grilla 3 columnas */
  .includes-section { background: var(--bg-light); }
  .modules-grid { display: grid; gap: 30px; }
  .module-card { background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-md); transition: var(--transition); border: 1px solid #e2e8f0; }
  .module-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-xl); border-color: var(--primary-light); }
  .module-img-box { width: 100%; aspect-ratio: 16/9; overflow: hidden; }
  .module-img-box img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .module-card:hover .module-img-box img { transform: scale(1.05); }
  .module-info { padding: 25px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 800; margin-bottom: 15px; letter-spacing: 0.5px; }
  .badge-CORE { background: var(--black); color: var(--white); }
  .badge-BONUS { background: var(--primary-light); color: var(--primary-dark); }
  .module-info h3 { font-size: 20px; margin-bottom: 10px; }
  .checklist { list-style: none; margin-top: 20px; }
  .checklist-item { padding-left: 28px; position: relative; font-size: 14px; margin-bottom: 12px; color: var(--gray); }
  .checklist-item::before { content: '✓'; color: var(--primary); font-weight: 900; position: absolute; left: 0; font-size: 16px; top: -1px; }
  @media (min-width: 768px) { .modules-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); } }

  /* 4. REVIEWS */
  .cafe-reviews-grid { display: grid; gap: 20px; margin-top: 40px; }
  .cafe-review-card { background: var(--white); border-radius: var(--radius); padding: 25px; box-shadow: var(--shadow-sm); border: 1px solid #e2e8f0; }
  .reviewer-name-cafe { font-weight: 800; color: var(--black); display: flex; align-items: center; gap: 8px; margin: 15px 0 5px; }
  .verified-icon { background: var(--primary-light); color: var(--primary-dark); width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; }
  .review-body-cafe { color: var(--gray); font-style: italic; font-size: 15px; }
  @media (min-width: 768px) { .cafe-reviews-grid { grid-template-columns: repeat(3, 1fr); } }

  /* 5. PRECIO & FAQ */
  .price-box { background: var(--white); padding: 40px; border-radius: 20px; border: 2px solid var(--primary); text-align: center; margin: 0 auto 30px; max-width: 500px; box-shadow: var(--shadow-xl); }
  .price-old { text-decoration: line-through; color: var(--gray); font-size: 20px; }
  .price-new { font-size: clamp(48px, 8vw, 64px); color: var(--black); font-weight: 800; line-height: 1; margin: 10px 0; }
  .price-save { display: inline-block; background: var(--primary-light); color: var(--primary-dark); padding: 8px 20px; border-radius: 50px; font-weight: 800; font-size: 14px; margin-top: 10px; }
  
  .faq-container { max-width: 800px; margin: 0 auto; }
  .faq-item { margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: var(--radius); background: var(--white); }
  .faq-question { padding: 20px; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: var(--black); }
  .faq-question::after { content: '+'; font-size: 24px; color: var(--primary); font-weight: 400; transition: transform 0.3s; }
  .faq-question.active::after { transform: rotate(45deg); }
  .faq-answer { padding: 0 20px; max-height: 0; overflow: hidden; transition: max-height 0.3s ease; color: var(--gray); }
  .faq-answer p { padding-bottom: 20px; }

  footer { background: var(--black); color: rgba(255,255,255,0.5); text-align: center; padding: 40px 20px; }
</style>
`;

export const STATIC_SCRIPTS = `
<script>
  function setTheme(themeName) { document.body.className = themeName; }

  window.onscroll = function() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    document.getElementById("progressBar").style.width = (winScroll / height) * 100 + "%";
  };

  let t = 15 * 60;
  const timerEl = document.getElementById("countdown");
  if(timerEl) {
    setInterval(() => {
      let m = Math.floor(t/60), s = t%60;
      timerEl.innerHTML = (m<10?'0':'')+m + ":" + (s<10?'0':'')+s;
      if(t > 0) t--;
    }, 1000);
  }

  document.querySelectorAll('.faq-question').forEach(q => {
    q.onclick = () => {
      const a = q.nextElementSibling;
      const isActive = q.classList.contains('active');
      document.querySelectorAll('.faq-question').forEach(other => {
        other.classList.remove('active');
        other.nextElementSibling.style.maxHeight = null;
      });
      if(!isActive) {
        q.classList.add('active');
        a.style.maxHeight = a.scrollHeight + "px";
      }
    }
  });
</script>
`;