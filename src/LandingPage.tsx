
import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onSelect: (mode: 'intermediate' | 'junior' | 'python' | 'appinventor' | any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashCompleted');
  });
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('splashCompleted', 'true');
      }, 3800);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    (window as any).showComingSoon = (name: string) => {
      setToast({ message: `${name} is coming soon.`, visible: true });
      setTimeout(() => setToast({ message: '', visible: false }), 2500);
    };

    // Dynamically load Lottie script if not present
    let script: HTMLScriptElement | null = null;
    if (!(window as any).lottie) {
      script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
      script.async = true;
      script.onload = initLottie;
      document.body.appendChild(script);
    } else {
      initLottie();
    }

    function initLottie() {
      const container = document.getElementById('lottie-anim');
      if (!container) return;
      container.innerHTML = ''; // clear any existing animation
      const anim = (window as any).lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: encodeURI('/assets/Remix of Guy talking to Robot _ AI Help.json')
      });
      anim.setSpeed(0.5); // Slow down the animation by 50%

      anim.addEventListener('data_failed', function () {
        const el = document.getElementById('lottie-anim');
        if (el) {
          el.style.cssText = `
              display:flex; align-items:center; justify-content:center;
              flex-direction:column; gap:18px;
              background: radial-gradient(ellipse at 38% 38%, rgba(124,92,252,0.12), transparent 60%),
                          radial-gradient(ellipse at 66% 66%, rgba(31,220,232,0.08), transparent 60%);
              border-radius:20px; min-height:400px;
              `;
          el.innerHTML = `
              <style>
                  @keyframes rb{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-14px) rotate(2deg)}}
                  @keyframes cp{0%,100%{opacity:0;transform:translateY(6px)}18%,82%{opacity:1;transform:translateY(0)}}
                  .rb-e{animation:rb 3s ease-in-out infinite;font-size:68px}
                  .rb-a{animation:cp 4.2s ease-in-out infinite .3s;background:rgba(31,220,232,0.1);border:1px solid rgba(31,220,232,0.2);padding:7px 16px;border-radius:10px;font-size:.82rem;color:#1a1a2e}
                  .rb-b{animation:cp 4.2s ease-in-out infinite 2.1s;background:rgba(124,92,252,0.1);border:1px solid rgba(124,92,252,0.2);padding:7px 16px;border-radius:10px;font-size:.82rem;color:#1a1a2e}
              </style>
              <div class="rb-a">Hi! How can I help? 👋</div>
              <div class="rb-e">🤖</div>
              <div class="rb-b">Let's build something! 🚀</div>
              `;
        }
      });
    }

    return () => {
      if (script) document.body.removeChild(script);
      const container = document.getElementById('lottie-anim');
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <>
      {showSplash && (
        <div className="splash-screen">
          <div className="splash-rocket-container">
            <img src="/assets/sprites/robot/robot_idle.svg" alt="Robot Flow" className="splash-robot-img" />
          </div>
          <div className="splash-text-container">
            <div className="splash-text-welcome">Welcome to the</div>
            <div className="splash-text">Leaplab</div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --brand-primary: #100051; /* Electric Indigo */
  --brand-secondary: #4F46E5;
  --bg-main: #F8FAFC;
  --text-main: #0F172A; /* Deep Slate */
  --text-muted: #64748B;
  --accent: #BEF264; /* Acid Green for Funky pop */
  --accent-secondary: #F472B6; /* Hot Pink accents */
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ─── SPLASH SCREEN ─── */
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  animation: splash-fade-out 0.8s ease-in-out 3s forwards;
}
@keyframes splash-fade-out {
  0% { opacity: 1; visibility: visible; }
  100% { opacity: 0; visibility: hidden; }
}
.splash-rocket-container {
  position: absolute;
  animation: rocket-fly 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  z-index: 2;
}
.splash-robot-img {
  width: 140px;
  height: 140px;
  filter: drop-shadow(0 10px 30px rgba(124, 92, 252, 0.5));
}
@keyframes rocket-fly {
  0% { transform: translateY(120vh) scale(1); opacity: 1; }
  35% { transform: translateY(0) scale(1.1); opacity: 1; }
  50% { transform: translateY(0) scale(1.1); opacity: 1; }
  85% { transform: translateY(-120vh) scale(0.8); opacity: 1; }
  100% { transform: translateY(-120vh) scale(0.8); opacity: 0; }
}
.splash-text-container {
  z-index: 1;
  opacity: 0;
  animation: splash-text-reveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 1.2s forwards;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.splash-text-welcome {
  font-size: 1.8rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: -15px; 
}
.splash-text {
  font-size: 5.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #7a5af8 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}
@keyframes splash-text-reveal {
  0% { opacity: 0; transform: scale(0.8) translateY(20px); filter: blur(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
}

.landing-page-container {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background: var(--bg-main);
  background-image: radial-gradient(rgba(99, 102, 241, 0.05) 1.5px, transparent 1.5px);
  background-size: 30px 30px;
  color: var(--text-main);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* ─── BACKGROUND NODES top-right ─── */
.landing-page-container .bg-nodes {
  position: fixed;
  top: 0; right: 0;
  width: 52%;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.landing-page-container .bg-nodes svg { width: 100%; height: 100%; opacity: 0.5; }

/* ─── TOPBAR ─── */
.landing-page-container nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 200;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36px;
  background: #ffffff;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(252, 248, 248, 0.05);
}
.landing-page-container .nav-brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
.landing-page-container .brand-logo {
  height:60px;
  width:auto;
  object-fit:contain;
}
.landing-page-container .nav-links { display:flex; gap:40px; }
.landing-page-container .nav-links a { color:rgba(248, 245, 245, 0.6); text-decoration:none; font-size:0.95rem; font-weight:500; transition:color .2s; }
.landing-page-container .nav-links a:hover { color:#1a1a2e; }
.landing-page-container .nav-actions { display:flex; align-items:center; gap:14px; }
.landing-page-container .nav-logo {
  height:36px;
  width:auto;
  object-fit:contain;
}

/* ─── PAGE CONTENT ─── */
.landing-page-container .page { position:relative; z-index:1; padding-top:64px; }

/* ─── HERO ─── */
.landing-page-container .hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 48px 32px;
  gap: 32px;
  min-height: calc(100vh - 64px - 220px);
}

.landing-page-container .hero-title {
  font-size: clamp(3.5rem, 7vw, 6.5rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  margin-bottom: 28px;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.05));
}
.landing-page-container .hero-title .t1 {
  display: block;
  background: linear-gradient(to right, #0F172A, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.landing-page-container .hero-title .t2 {
  display: block;
  background: linear-gradient(135deg, var(--brand-primary) 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.landing-page-container .hero-tagline {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  margin-bottom: 24px;
  padding: 8px 16px;
  background: var(--accent);
  border: 2px solid #000;
  box-shadow: 4px 4px 0px #000;
  transform: rotate(-1deg);
}
.landing-page-container .hero-sub {
  font-size: 1.125rem;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 480px;
  margin-bottom: 40px;
  position: relative;
  z-index: 2;
}
.landing-page-container .hero-btns { display:flex; gap:14px; flex-wrap:wrap; }
.landing-page-container .btn-adventure {
  background: var(--brand-primary);
  border: none;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  padding: 16px 32px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}
.landing-page-container .btn-adventure:hover {
  background: var(--brand-secondary);
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.4);
}
.landing-page-container .btn-demo {
  background: #fff;
  border: 2px solid #000;
  color: var(--text-main);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  padding: 16px 32px;
  border-radius: 12px;
  transition: all 0.2s;
  box-shadow: 4px 4px 0px #000;
}
.landing-page-container .btn-demo:hover {
  background: var(--bg-main);
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #000;
}

/* ─── ANIMATIONS ─── */
@keyframes hero-reveal {
  0% { opacity: 0; transform: translateY(50px) scale(0.9); filter: blur(10px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
}

.hero-tagline { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.hero-title { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards; }
.hero-sub { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards; }
.hero-btns { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s forwards; }
.hero-right { animation: hero-reveal 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.4s forwards; }

/* ─── FLOATING SHAPES ─── */
.shape {
  position: absolute;
  z-index: 0;
  filter: blur(40px);
  opacity: 0.4;
  animation: float-slow 10s ease-in-out infinite;
}
.shape-1 {
  width: 300px; height: 300px;
  background: var(--accent);
  top: 10%; left: -5%;
}
.shape-2 {
  width: 400px; height: 400px;
  background: var(--brand-primary);
  top: 40%; right: -10%;
  animation-delay: -2s;
}
.shape-3 {
  width: 250px; height: 250px;
  background: var(--accent-secondary);
  bottom: 10%; left: 20%;
  animation-delay: -5s;
}
@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, 50px) rotate(5deg); }
  66% { transform: translate(-20px, 30px) rotate(-5deg); }
}

/* RIGHT — Lottie */
.landing-page-container .hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.landing-page-container .hero-right::after {
  content: '';
  position: absolute;
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  z-index: -1;
  animation: float-glow 6s ease-in-out infinite;
}
@keyframes float-glow {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}
.landing-page-container #lottie-anim {
  width:100%;
  max-width:480px;
  aspect-ratio:1;
  border-radius:22px;
  overflow:hidden;
}

/* ─── CARDS ROW ─── */
.landing-page-container .cards-wrap {
  max-width:1280px;
  margin:0 auto;
  padding:0 48px 56px;
}
.landing-page-container .cards-row {
  display:grid;
  grid-template-columns:repeat(7,1fr);
  gap:12px;
}
.landing-page-container .tc {
  border-radius:16px;
  padding:16px 14px 14px;
  cursor:pointer;
  transition:transform .2s,box-shadow .2s,border-color .2s;
  position:relative;
  overflow:hidden;
  min-height:185px;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);
}
.landing-page-container .tc:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,0.1),0 4px 12px rgba(0,0,0,0.06); }

.landing-page-container .tc-ignite  { background:linear-gradient(155deg,#f0f4ff 0%,#e8eeff 60%,#e0e8ff 100%); border:1px solid rgba(80,120,220,0.25); }
.landing-page-container .tc-circuit { background:linear-gradient(155deg,#f0f8ff 0%,#e6f2ff 60%,#dceeff 100%); border:1px solid rgba(50,160,200,0.25); }
.landing-page-container .tc-codex   { background:linear-gradient(155deg,#f0fff8 0%,#e6fff0 60%,#dcffe8 100%); border:1px solid rgba(30,170,140,0.25); }
.landing-page-container .tc-neura   { background:linear-gradient(155deg,#faf0ff 0%,#f5e6ff 60%,#f0dcff 100%); border:1px solid rgba(160,60,220,0.25); }
.landing-page-container .tc-forge   { background:linear-gradient(155deg,#fff5f0 0%,#ffece6 60%,#ffe4dc 100%); border:1px solid rgba(210,100,50,0.25); }
.landing-page-container .tc-studio  { background:linear-gradient(155deg,#fff0fa 0%,#ffe6f5 60%,#ffdcee 100%); border:1px solid rgba(190,60,190,0.25); }
.landing-page-container .tc-quiz    { background:linear-gradient(155deg,#fffaf0 0%,#fff5e6 60%,#fff0dc 100%); border:1px solid rgba(210,170,40,0.25); }

.landing-page-container .tc-icon {
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding-bottom:8px;
}
.landing-page-container .tc-icon svg,
.landing-page-container .tc-icon img { width:68px; height:68px; object-fit: contain; }

.landing-page-container .tc-cat {
  font-size:0.6rem; font-weight:800; letter-spacing:0.07em;
  text-transform:uppercase; color:rgba(0,0,0,0.45); margin-bottom:2px; line-height:1.3;
}
.landing-page-container .tc-name {
  font-size:0.8rem; font-weight:800; letter-spacing:0.04em;
  text-transform:uppercase; color:#1a1a2e; margin-bottom:5px; line-height:1.2;
}
.landing-page-container .tc-desc {
  font-size:0.68rem; color:rgba(0,0,0,0.5); line-height:1.4;
}

/* ─── FOOTER STRIP ─── */
.landing-page-container .footer-strip {
  position:relative; z-index:1;
  background:rgba(248,249,250,0.85);
  border-top:1px solid rgba(0,0,0,0.08);
  padding:28px 48px;
  display:flex;
  gap:0;
}
.landing-page-container .fs-item {
  flex:1;
  padding:0 20px;
  border-right:1px solid rgba(0,0,0,0.08);
}
.landing-page-container .fs-item:first-child { padding-left:0; }
.landing-page-container .fs-item:last-child { border-right:none; }
.landing-page-container .fs-label { font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(0,0,0,0.35); margin-bottom:6px; }
.landing-page-container .fs-val { font-size:1.1rem; font-weight:700; color:rgba(0,0,0,0.6); }
` }} />
      <div className="landing-page-container">

        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>

        <div className="bg-nodes">
          <svg viewBox="0 0 820 920" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="690" cy="72" r="54" fill="rgba(200,210,240,0.6)" stroke="rgba(90,110,180,0.2)" strokeWidth="1.5" />
            <circle cx="690" cy="72" r="42" fill="rgba(210,220,245,0.5)" />
            <circle cx="690" cy="72" r="26" fill="rgba(220,230,250,0.4)" />
            <circle cx="584" cy="198" r="40" fill="rgba(195,205,235,0.55)" stroke="rgba(88,108,175,0.18)" strokeWidth="1.5" />
            <circle cx="584" cy="198" r="30" fill="rgba(205,215,240,0.45)" />
            <circle cx="770" cy="285" r="32" fill="rgba(195,205,235,0.5)" stroke="rgba(88,108,175,0.16)" strokeWidth="1.5" />
            <circle cx="770" cy="285" r="22" fill="rgba(205,215,240,0.4)" />
            <circle cx="494" cy="118" r="24" fill="rgba(195,205,235,0.45)" stroke="rgba(88,108,175,0.14)" strokeWidth="1" />
            <circle cx="494" cy="118" r="16" fill="rgba(205,215,240,0.35)" />
            <circle cx="724" cy="430" r="28" fill="rgba(195,205,235,0.45)" stroke="rgba(88,108,175,0.14)" strokeWidth="1" />
            <circle cx="620" cy="378" r="18" fill="rgba(195,205,235,0.35)" />
            <circle cx="534" cy="318" r="14" fill="rgba(195,205,235,0.3)" />
            <circle cx="450" cy="262" r="9" fill="rgba(195,205,235,0.25)" />
            {/* Lines */}
            <line x1="690" y1="72" x2="584" y2="198" stroke="rgba(100,120,200,0.2)" strokeWidth="1.2" />
            <line x1="690" y1="72" x2="770" y2="285" stroke="rgba(100,120,200,0.18)" strokeWidth="1.2" />
            <line x1="584" y1="198" x2="494" y2="118" stroke="rgba(100,120,200,0.16)" strokeWidth="1" />
            <line x1="584" y1="198" x2="534" y2="318" stroke="rgba(100,120,200,0.14)" strokeWidth="1" />
            <line x1="770" y1="285" x2="724" y2="430" stroke="rgba(100,120,200,0.12)" strokeWidth="1" />
            <line x1="534" y1="318" x2="620" y2="378" stroke="rgba(100,120,200,0.12)" strokeWidth="1" />
            <line x1="620" y1="378" x2="724" y2="430" stroke="rgba(100,120,200,0.1)" strokeWidth="1" />
            <line x1="494" y1="118" x2="450" y2="262" stroke="rgba(100,120,200,0.1)" strokeWidth="1" />
            {/* Dots */}
            <circle cx="666" cy="338" r="4" fill="rgba(100,120,200,0.25)" />
            <circle cx="786" cy="158" r="5" fill="rgba(100,120,200,0.2)" />
            <circle cx="506" cy="444" r="4" fill="rgba(100,120,200,0.18)" />
            <circle cx="700" cy="518" r="5" fill="rgba(100,120,200,0.15)" />
            <circle cx="440" cy="168" r="3" fill="rgba(100,120,200,0.16)" />
          </svg>
        </div>

        {/* TOPBAR */}
        <nav>
          <a href="#" className="nav-brand">
            <img src="public\assets\leaplab_logo.jpeg" alt="Leaplab Logo" className="brand-logo" />
          </a>

          <div className="nav-actions">
            <img src="public/assets/topbar_logo.svg" alt="Logo" className="nav-logo" />
          </div>
        </nav>

        <div className="page">

          {/* HERO */}
          <div className="hero-grid">
            <div className="hero-left">
              <div className="hero-tagline">Curiosity · Creativity · Critical Thinking</div>
              <h1 className="hero-title">
                <span className="t1">Learn to code</span>
                <span className="t2">the bold way</span>
              </h1>
              <p className="hero-sub">
                Seven unique tracks from junior picture-blocks all the way to AI,
                robotics, and machine vision. Pick your adventure.
              </p>
              <div className="hero-btns">
                <button className="btn-adventure" onClick={() => document.querySelector('.cards-wrap')?.scrollIntoView({ behavior: 'smooth' })}>Choose your adventure</button>
                <button className="btn-demo">Watch 2-min demo</button>
              </div>
            </div>

            {/* RIGHT: Lottie animation (exact uploaded file) */}
            <div className="hero-right">
              <div id="lottie-anim"></div>
            </div>
          </div>

          {/* 7 TRACK CARDS */}
          <div className="cards-wrap">
            <div className="cards-row">

              {/* 1 IGNITE */}
              <div className="tc tc-ignite" onClick={() => onSelect('junior')}>
                <div className="tc-icon">
                  <img src="/assets/sprites/robot/robot_idle.svg" alt="Ignite Robot" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Ignite</div>
                  <div className="tc-desc">Glowing robot and robot animation</div>
                </div>
              </div>

              {/* 2 CIRCUIT */}
              <div className="tc tc-circuit" onClick={() => onSelect('intermediate')}>
                <div className="tc-icon">
                  <img src="public\assets\arduino_icon.png" alt="Circuit Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Circuit</div>
                  <div className="tc-desc">Glowing micro microchip</div>
                </div>
              </div>

              {/* 3 CODEX */}
              <div className="tc tc-codex" onClick={() => onSelect('python')}>
                <div className="tc-icon">
                  <img src="public\assets\python_icon.png" alt="Codex Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Codex</div>
                  <div className="tc-desc">Glowing python animations</div>
                </div>
              </div>

              {/* 4 NEURA */}
              <div className="tc tc-Neura" onClick={() => (window as any).showComingSoon('Neura')}>
                <div className="tc-icon">
                  <img src="public\assets\ml_brain_icon.png" alt="Codex Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Neura</div>
                  <div className="tc-desc">Glowing brain with neural network</div>
                </div>
              </div>

              {/* 5 FORGE */}
              <div className="tc tc-forge" onClick={() => (window as any).showComingSoon('Creocad')}>
                <div className="tc-icon">
                  <img src="public\assets\3d_printer_icon.png" alt="Forge Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Forge</div>
                  <div className="tc-desc">Glowing gears and 3D printer</div>
                </div>
              </div>

              {/* 6 STUDIO */}
              <div className="tc tc-studio" onClick={() => onSelect('appforge')}>
                <div className="tc-icon">
                  <img src="public\assets\creocad_icon.png" alt="Studio Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Studio</div>
                  <div className="tc-desc">Glowing game with game and clouds</div>
                </div>
              </div>

              {/* 7 QUIZ */}
              <div className="tc tc-quiz" onClick={() => (window as any).showComingSoon('Quiz')}>
                <div className="tc-icon">
                  <img src="public\assets\quiz_icon.png" alt="Quiz Icon" />
                </div>
                <div>
                  <div className="tc-cat">&nbsp;</div>
                  <div className="tc-name">Quiz</div>
                  <div className="tc-desc">Learning target of brain cognition</div>
                </div>
              </div>

            </div>
          </div>

          {/* FOOTER STRIP */}
          <div className="footer-strip">
            <div className="fs-item">
              <div className="fs-label">Explore</div>
              <div className="fs-val" style={{ fontSize: '0.95rem', color: 'rgba(0,0,0,0.4)' }}>Tracks & Paths</div>
            </div>
            <div className="fs-item">
              <div className="fs-label">Community</div>
              <div className="fs-val" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)' }}>50K+ Learners</div>
            </div>
            <div className="fs-item">
              <div className="fs-label">Get Started</div>
              <div className="fs-val" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)' }}>Free Forever</div>
            </div>
            <div className="fs-item">
              <div className="fs-label">Extras</div>
              <div className="fs-val" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)' }}>Projects & More</div>
            </div>
          </div>

        </div>


        {/* Toast notification */}
        {toast.visible && (
          <div style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '14px 20px',
            borderRadius: 18,
            background: 'rgba(15,23,42,0.94)',
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: '"Poppins", sans-serif',
            boxShadow: '0 18px 34px rgba(15,23,42,0.22)',
            animation: 'lp-toast-in .3s ease-out',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #38bdf8)',
              boxShadow: '0 0 14px rgba(56,189,248,0.45)',
            }} />
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
};

export default LandingPage;
