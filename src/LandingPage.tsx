import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';

interface LandingPageProps {
  onSelect: (mode: 'intermediate' | 'junior' | 'python' | 'appinventor' | any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashCompleted');
  });
  const [activeSection, setActiveSection] = useState(0);
  const [highlightCards, setHighlightCards] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);
  const scanIntervalRef = useRef<any>(null);

  /* ── Card scan ── */
  const startCardScan = () => {
    setHighlightCards(true);
    setScanIndex(0);
    let i = 0;
    scanIntervalRef.current = setInterval(() => {
      i = (i + 1) % 7;
      setScanIndex(i);
    }, 300);
  };

  const stopCardScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanIndex(-1);
  };

  const handleCardClick = (action: () => void) => {
    stopCardScan();
    setHighlightCards(false);
    action();
  };

  const tcClass = (index: number) =>
    [
      scanIndex === index ? 'tc-scan-active' : '',
      highlightCards && scanIndex === -1 ? 'tc-highlight' : '',
    ]
      .filter(Boolean)
      .join(' ');

  /* ── Cleanup scan on unmount ── */
  useEffect(() => {
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
  }, []);

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

    let script: HTMLScriptElement | null = null;
    if (!(window as any).lottie) {
      script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
      script.async = true;
      script.onload = initLottie;
      script.onerror = initLottie;
      document.body.appendChild(script);
    } else {
      initLottie();
    }

    function renderLottieFallback(container: HTMLElement, message = 'Animation unavailable.') {
      container.style.cssText = `
        display:flex; align-items:center; justify-content:center;
        flex-direction:column; gap:18px;
        background: radial-gradient(ellipse at 38% 38%, rgba(124,92,252,0.12), transparent 60%),
                    radial-gradient(ellipse at 66% 66%, rgba(31,220,232,0.08), transparent 60%);
        border-radius:20px; min-height:400px;
      `;
      container.innerHTML = `
        <div style="text-align:center; padding:24px; color:#1a1a2e; font-weight:600;">
          ${message}
        </div>
      `;
    }

    async function initLottie() {
      const container = document.getElementById('lottie-anim');
      if (!container) return;
      container.innerHTML = '';

      const lottieLib = (window as any).lottie;
      if (!lottieLib) {
        renderLottieFallback(container);
        return;
      }

      try {
        const response = await fetch('/assets/robot.lottie');
        if (!response.ok) throw new Error(`Failed to fetch .lottie (${response.status})`);
        const buffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) throw new Error('Missing manifest.json in .lottie');
        const manifestText = await manifestFile.async('text');
        const manifest = JSON.parse(manifestText);
        const animationId = manifest.animations?.[0]?.id;
        if (!animationId) throw new Error('Missing animation ID in .lottie manifest');
        const animationFile = zip.file(`animations/${animationId}.json`);
        if (!animationFile) throw new Error(`Missing animations/${animationId}.json in .lottie`);
        const animationText = await animationFile.async('text');
        const animationData = JSON.parse(animationText);

        const anim = lottieLib.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData,
        });
        anim.setSpeed(0.5);
        anim.addEventListener('data_failed', () => renderLottieFallback(container, 'Animation data failed to load.'));
      } catch (err) {
        console.error('[LandingPage] .lottie load error:', err);
        renderLottieFallback(container);
      }
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
            <div className="splash-powered-by">
              <span>Powered by</span>
              <img src="/assets/topbar_logo.svg" alt="LeapLab" />
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --brand-primary: #100051;
  --brand-secondary: #4F46E5;
  --bg-main: #F8FAFC;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --accent: #BEF264;
  --accent-secondary: #F472B6;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ─── SPLASH SCREEN ─── */
.splash-screen {
  position: fixed; inset: 0; z-index: 9999;
  background: #f8f9fa;
  display: flex; align-items: center; justify-content: center; flex-direction: column;
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
  width: clamp(100px, 25vw, 140px); height: auto;
  filter: drop-shadow(0 10px 30px rgba(124, 92, 252, 0.5));
}
@keyframes rocket-fly {
  0%   { transform: translateY(120vh) scale(1); opacity: 1; }
  35%  { transform: translateY(0) scale(1.1); opacity: 1; }
  50%  { transform: translateY(0) scale(1.1); opacity: 1; }
  85%  { transform: translateY(-120vh) scale(0.8); opacity: 1; }
  100% { transform: translateY(-120vh) scale(0.8); opacity: 0; }
}
.splash-text-container {
  z-index: 1; opacity: 0;
  animation: splash-text-reveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 1.2s forwards;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.splash-text-welcome {
  font-size: clamp(1rem, 3vw, 1.8rem); font-weight: 500;
  color: rgba(0, 0, 0, 0.6); letter-spacing: 0.1em;
  text-transform: uppercase; margin-bottom: -15px;
}
.splash-text {
  font-size: clamp(3rem, 12vw, 5.5rem); font-weight: 900; letter-spacing: -0.02em;
  background: linear-gradient(135deg, #7a5af8 0%, #38bdf8 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  line-height: 1.1;
}
@keyframes splash-text-reveal {
  0%   { opacity: 0; transform: scale(0.8) translateY(20px); filter: blur(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
}
.splash-powered-by {
  margin-top: 15px; display: flex; align-items: center; gap: 10px;
  opacity: 0; animation: splash-text-reveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) 1.8s forwards;
}
.splash-powered-by span {
  font-size: 0.85rem; font-weight: 600; color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase; letter-spacing: 0.1em;
}
.splash-powered-by img { height: 28px; opacity: 0.8; }

.hero-powered-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15);
  backdrop-filter: blur(8px); border-radius: 100px; margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); transition: all 0.3s ease;
}
.hero-powered-badge:hover {
  transform: translateY(-2px); background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.25);
}
.hero-powered-badge .pb-text {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--text-muted);
}
.hero-powered-badge .pb-logo { height: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
.hero-powered-badge .pb-info-icon {
  width: 14px; height: 14px; background: var(--brand-primary); color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 900; font-family: serif;
}

.landing-page-container {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background: var(--bg-main);
  background-image: radial-gradient(rgba(99, 102, 241, 0.05) 1.5px, transparent 1.5px);
  background-size: 30px 30px;
  color: var(--text-main);
  height: 100dvh; 
  position: relative;
  overflow: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
.landing-page-container::-webkit-scrollbar { display: none; }

/* ─── BACKGROUND NODES ─── */
.landing-page-container .bg-nodes {
  position: fixed; top: 0; right: 0;
  width: 100%; max-width: 1200px; height: 100vh;
  pointer-events: none; z-index: 0; overflow: hidden; opacity: 0.3;
}
@media (min-width: 1024px) {
  .landing-page-container .bg-nodes { width: 60%; opacity: 0.6; }
}
.landing-page-container .bg-nodes svg { width: 100%; height: 100%; opacity: 0.5; }

/* ─── TOPBAR ─── */
.landing-page-container nav {
  position: sticky; top: 0; left: 0; right: 0; z-index: 200;
  height: clamp(60px, 8vw, 68px);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 clamp(12px, 3vw, 40px);
  background: rgba(248, 250, 252, 0.85);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.landing-page-container .nav-brand {
  display:flex; align-items:center; gap:10px; text-decoration:none;
  filter: drop-shadow(0 2px 8px rgba(99,102,241,0.15));
}
.landing-page-container .brand-logo { height: clamp(50px, 5.5vw, 64px); width:auto; object-fit:contain; }
.landing-page-container .nav-actions {
  display:flex; align-items:center; gap:14px;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.08));
}
.landing-page-container .nav-links { display: flex; gap: 24px; margin-left: 12px; }
@media (max-width: 768px) { .landing-page-container .nav-links { display: none; } }

/* ─── PAGE CONTENT ─── */
.landing-page-container .page {
  position:relative; z-index:1; padding-top:20px;
  display: flex; flex-direction: column;
  min-height: calc(100vh - 68px); transition: all 0.3s ease;
  overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.page::-webkit-scrollbar { display: none; }

/* ─── HERO ─── */
.landing-page-container .hero-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  align-items: center; max-width: 1280px; margin: 0 auto;
  padding: clamp(4px, 1vw, 12px) clamp(16px, 5vw, 48px);
  gap: clamp(16px, 6vw, 75px); flex: 1 0 auto;
}
@media (max-width: 1024px) {
  .landing-page-container .hero-grid {
    grid-template-columns: 1fr; text-align: center;
    gap: 32px; padding-top: clamp(24px, 10vw, 48px); margin-bottom: 20px;
  }
  .landing-page-container .hero-left { display: flex; flex-direction: column; align-items: center; }
  .landing-page-container .hero-sub { margin-left: auto; margin-right: auto; max-width: 90%; }
  .landing-page-container .hero-btns { justify-content: center; width: 100%; gap: 12px; }
}
@media (max-width: 640px) {
  .landing-page-container nav { padding: 0 16px; height: 56px; }
  .landing-page-container .nav-brand { gap: 6px; }
  .landing-page-container .brand-logo { height: 38px; }
  .landing-page-container .hero-title { font-size: clamp(2rem, 10vw, 2.4rem); }
  .landing-page-container .hero-sub { font-size: 0.9rem; max-width: 100%; padding: 0 10px; }
  .landing-page-container .hero-btns { gap: 10px; }
}

.landing-page-container .hero-title {
  font-size: clamp(1.8rem, 5.2vw, 3.4rem); font-weight: 900;
  line-height: 1.12; letter-spacing: -0.04em; margin-bottom: 6px; color: #0F172A;
}
.landing-page-container .hero-title .hw-code {
  font-style: italic; color: transparent;
  background: linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #8B5CF6 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  letter-spacing: 0.02em; padding: 0 4px;
}
.landing-page-container .hero-title .hw-bold {
  color: transparent; -webkit-text-stroke: 2.5px #6366F1;
  -webkit-text-fill-color: transparent; letter-spacing: -0.02em;
}
.landing-page-container .hero-tagline {
  display: inline-block; font-size: clamp(0.55rem, 1.1vw, 0.65rem);
  font-weight: 800; color: #000; text-transform: uppercase;
  letter-spacing: 0.25em; margin-bottom: 6px; padding: 4px 12px;
  background: var(--accent); border: 2px solid #000; box-shadow: 4px 4px 0px #000;
  transform: rotate(-1deg);
}
.landing-page-container .hero-sub {
  font-size: clamp(0.85rem, 1.8vw, 1rem); color: #0f172a;
  line-height: 1.55; max-width: 500px; margin-bottom: 20px;
  position: relative; z-index: 2; opacity: 0.85;
}
.landing-page-container .hero-btns { display:flex; gap:10px; flex-wrap:wrap; }
.landing-page-container .btn-adventure {
  background: var(--brand-primary); border: none; color: #fff;
  font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit;
  padding: 12px 24px; border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}
.landing-page-container .btn-adventure:hover {
  background: var(--brand-secondary); transform: scale(1.05) rotate(2deg);
  box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.4);
}
.landing-page-container .btn-demo {
  background: #fff; border: 2px solid #000; color: var(--text-main);
  font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit;
  padding: 12px 24px; border-radius: 12px; transition: all 0.2s;
  box-shadow: 4px 4px 0px #000;
}
.landing-page-container .btn-demo:hover {
  background: var(--bg-main); transform: translate(-2px, -2px); box-shadow: 6px 6px 0px #000;
}

/* ─── ANIMATIONS ─── */
@keyframes hero-reveal {
  0%   { opacity: 0; transform: translateY(50px) scale(0.9); filter: blur(10px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
}
.hero-tagline { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.hero-title   { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards; }
.hero-sub     { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards; }
.hero-btns    { animation: hero-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s forwards; }
.hero-right   { animation: hero-reveal 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.4s forwards; }

/* ─── FLOATING SHAPES ─── */
.shape { position: absolute; z-index: 0; filter: blur(40px); opacity: 0.4; animation: float-slow 10s ease-in-out infinite; }
.shape-1 { width: 300px; height: 300px; background: var(--accent); top: 10%; left: -5%; }
.shape-2 { width: 400px; height: 400px; background: var(--brand-primary); top: 40%; right: -10%; animation-delay: -2s; }
.shape-3 { width: 250px; height: 250px; background: var(--accent-secondary); bottom: 10%; left: 20%; animation-delay: -5s; }
@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33%       { transform: translate(30px, 50px) rotate(5deg); }
  66%       { transform: translate(-20px, 30px) rotate(-5deg); }
}

/* RIGHT — Lottie */
.landing-page-container .hero-right {
  display: flex; align-items: center; justify-content: center; position: relative;
}
.landing-page-container .hero-right::after {
  content: ''; position: absolute; width: 120%; height: 120%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  z-index: -1; animation: float-glow 6s ease-in-out infinite;
}
@keyframes float-glow {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50%       { transform: scale(1.1); opacity: 0.8; }
}
.landing-page-container #lottie-anim {
  width:100%; max-width: clamp(260px, 80vw, 460px);
  aspect-ratio:1; border-radius:24px; overflow:hidden;
}
@media (max-width: 1024px) {
  .landing-page-container #lottie-anim { max-width: clamp(260px, 60vw, 380px); margin: 0 auto; }
}

/* ─── CARDS ROW ─── */
.landing-page-container .cards-wrap {
  max-width:1280px; margin:0 auto;
  padding: 0 clamp(16px, 3vw, 32px) clamp(6px, 1.2vw, 12px);
}
.landing-page-container .cards-row {
  display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: clamp(10px, 1.5vw, 16px);
}
@media (min-width: 1440px) {
  .landing-page-container .cards-row { grid-template-columns: repeat(7, 1fr); }
}

/* ── Card base + scan transitions ── */
.landing-page-container .tc {
  border-radius:12px; padding: 6px 6px; cursor:pointer;
  transition: transform .4s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow .5s ease,
              opacity .3s ease;
  position:relative; overflow:hidden; min-height:0;
  display:flex; flex-direction:column; justify-content:flex-end;
  /* 3D Shadows — Contact + Object + Ambient */
  box-shadow: 
    0 1px 2px rgba(0,0,0,0.06), 
    0 4px 8px rgba(0,0,0,0.04),
    0 12px 24px rgba(0,0,0,0.02),
    inset 0 0 0 1px rgba(255,255,255,0.7); /* Inner Rim Glint */
  border: 1px solid rgba(0, 0, 0, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.82); /* Rim Light Top */
  border-left: 1px solid rgba(255, 255, 255, 0.4); /* Rim Light Left */
}
.landing-page-container .tc:hover {
  transform: translateY(-10px) scale(1.015);
  box-shadow: 
    0 2px 4px rgba(0,0,0,0.1), 
    0 12px 28px rgba(0,0,0,0.08), 
    0 24px 50px rgba(0,0,0,0.05),
    inset 0 0 0 1px rgba(255,255,255,1);
  z-index: 5;
}

/* Scanning spotlight — active card */
.landing-page-container .tc.tc-scan-active {
  transform: translateY(-10px) scale(1.04) !important;
  box-shadow: 0 0 0 3px #6366F1, 0 20px 40px rgba(99,102,241,0.25) !important;
  z-index: 10;
}

/* Dim non-active cards while scanning */
.landing-page-container .cards-row.is-scanning .tc:not(.tc-scan-active) {
  opacity: 0.55;
  transform: scale(0.97);
}

/* Subtle glow on all cards before scan starts */
.landing-page-container .tc.tc-highlight {
  box-shadow: 0 0 0 2px rgba(99,102,241,0.35), 0 8px 20px rgba(99,102,241,0.08);
}

@media (max-width: 1280px) { .landing-page-container .cards-row { grid-template-columns: repeat(4, 1fr); gap: 14px; } }
@media (max-width: 900px)  { .landing-page-container .cards-row { grid-template-columns: repeat(3, 1fr); gap: 12px; } }
@media (max-width: 768px)  { 
  .landing-page-container .cards-wrap { padding: 0 20px 40px; }
  .landing-page-container .cards-row { grid-template-columns: repeat(2, 1fr); gap: 12px; } 
}
@media (max-width: 480px)  { 
  .landing-page-container .cards-row { grid-template-columns: 1fr; gap: 12px; } 
  .landing-page-container .tc { padding: 12px; }
}

.landing-page-container .tc-ignite  { background:linear-gradient(155deg,#ffffff 0%, #f0f4ff 60%,#e0e8ff 100%); border-bottom: 4px solid #6366F1; }
.landing-page-container .tc-ignite:hover { box-shadow: 0 20px 40px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.1); }
.landing-page-container .tc-circuit { background:linear-gradient(155deg,#ffffff 0%, #f0f8ff 60%,#dceeff 100%); border-bottom: 4px solid #0EA5E9; }
.landing-page-container .tc-circuit:hover { box-shadow: 0 20px 40px rgba(14,165,233,0.15), 0 0 0 1px rgba(14,165,233,0.1); }
.landing-page-container .tc-codex   { background:linear-gradient(155deg,#ffffff 0%, #f0fff8 60%,#dcffe8 100%); border-bottom: 4px solid #10B981; }
.landing-page-container .tc-codex:hover { box-shadow: 0 20px 40px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.1); }
.landing-page-container .tc-neura   { background:linear-gradient(155deg,#ffffff 0%, #faf0ff 60%,#f0dcff 100%); border-bottom: 4px solid #A855F7; }
.landing-page-container .tc-neura:hover { box-shadow: 0 20px 40px rgba(168,85,247,0.15), 0 0 0 1px rgba(168,85,247,0.1); }
.landing-page-container .tc-forge   { background:linear-gradient(155deg,#ffffff 0%, #fff5f0 60%,#ffe4dc 100%); border-bottom: 4px solid #F97316; }
.landing-page-container .tc-forge:hover { box-shadow: 0 20px 40px rgba(249,115,22,0.15), 0 0 0 1px rgba(249,115,22,0.1); }
.landing-page-container .tc-studio  { background:linear-gradient(155deg,#ffffff 0%, #fff0fa 60%,#ffdcee 100%); border-bottom: 4px solid #EC4899; }
.landing-page-container .tc-studio:hover { box-shadow: 0 20px 40px rgba(236,72,153,0.15), 0 0 0 1px rgba(236,72,153,0.1); }
.landing-page-container .tc-quiz    { background:linear-gradient(155deg,#ffffff 0%, #fffaf0 60%,#fff0dc 100%); border-bottom: 4px solid #F59E0B; }
.landing-page-container .tc-quiz:hover { box-shadow: 0 20px 40px rgba(245,158,11,0.15), 0 0 0 1px rgba(245,158,11,0.1); }

.landing-page-container .tc-icon {
  flex:1; display:flex; align-items:center; justify-content:right; padding-bottom:6px;
}
.landing-page-container .tc-icon svg,
.landing-page-container .tc-icon img {
  width: clamp(34px, 9vw,68px); height: clamp(34px, 9vw, 68px); object-fit: contain;
}
.landing-page-container .tc-cat {
  font-size: 0.90rem; font-weight: 900; letter-spacing: 0.12em;
  text-transform: uppercase; color: #0a0328ff; margin-bottom: 2px; line-height: 1.2; opacity: 0.65;
}
.landing-page-container .tc-name {
  font-size: clamp(0.9rem, 1.4vw, 0.98rem); font-weight: 1000; letter-spacing: 0.01em;
  text-transform: uppercase; color: #0f172a; margin-bottom: 2px; line-height: 1.2;
}
.landing-page-container .tc-desc {
  font-size: 0.82rem; color: #020046a5; line-height: 1.4; font-weight: 600;
}
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
            <line x1="690" y1="72" x2="584" y2="198" stroke="rgba(100,120,200,0.2)" strokeWidth="1.2" />
            <line x1="690" y1="72" x2="770" y2="285" stroke="rgba(100,120,200,0.18)" strokeWidth="1.2" />
            <line x1="584" y1="198" x2="494" y2="118" stroke="rgba(100,120,200,0.16)" strokeWidth="1" />
            <line x1="584" y1="198" x2="534" y2="318" stroke="rgba(100,120,200,0.14)" strokeWidth="1" />
            <line x1="770" y1="285" x2="724" y2="430" stroke="rgba(100,120,200,0.12)" strokeWidth="1" />
            <line x1="534" y1="318" x2="620" y2="378" stroke="rgba(100,120,200,0.12)" strokeWidth="1" />
            <line x1="620" y1="378" x2="724" y2="430" stroke="rgba(100,120,200,0.1)" strokeWidth="1" />
            <line x1="494" y1="118" x2="450" y2="262" stroke="rgba(100,120,200,0.1)" strokeWidth="1" />
            <circle cx="666" cy="338" r="4" fill="rgba(100,120,200,0.25)" />
            <circle cx="786" cy="158" r="5" fill="rgba(100,120,200,0.2)" />
            <circle cx="506" cy="444" r="4" fill="rgba(100,120,200,0.18)" />
            <circle cx="700" cy="518" r="5" fill="rgba(100,120,200,0.15)" />
            <circle cx="440" cy="168" r="3" fill="rgba(100,120,200,0.16)" />
          </svg>
        </div>

        {/* TOPBAR */}
        <nav>
          <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#" className="nav-brand">
              <img src="/assets/Final_logo_b.png" alt="LeapLab Logo" className="brand-logo" />
            </a>
            <div className="nav-links">
              <a href="#" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', transition: 'color 0.2s' }}>Tutorials</a>
              <a href="#" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', transition: 'color 0.2s' }}>Explore</a>
            </div>
          </div>
          <div className="nav-actions">
            <img src="/assets/topbar_logo.svg" alt="Leapblocks Top Logo" className="nav-logo" style={{ height: 'clamp(40px, 5vw, 50px)' }} />
          </div>
        </nav>

        <div className="page">

          {/* HERO */}
          <div className="hero-grid">
            <div className="hero-left">
              <div className="hero-tagline">Curiosity · Creativity · Critical Thinking</div>
              <h1 className="hero-title">
                Learn to <span className="hw-code">code</span><br />
                the <span className="hw-bold">bold</span> way
              </h1>
              <p className="hero-sub">
                Seven unique tracks from junior picture-blocks all the way to AI,
                robotics, and machine vision. Pick your adventure.
              </p>
              <div className="hero-btns">
                <button
                  className="btn-adventure"
                  onClick={() => {
                    startCardScan();
                    document.querySelector('.cards-wrap')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Choose your adventure
                </button>
                <button className="btn-demo">Watch 2-min demo</button>
              </div>
            </div>

            {/* RIGHT: Lottie animation */}
            <div className="hero-right">
              <div id="lottie-anim"></div>
            </div>
          </div>

          {/* 7 TRACK CARDS */}
          <div className="cards-wrap">
            <div className={`cards-row ${highlightCards ? 'highlight-active' : ''} ${scanIndex >= 0 ? 'is-scanning' : ''}`}>

              {/* 1 IGNITE */}
              <div className={`tc tc-ignite ${tcClass(0)}`} onClick={() => handleCardClick(() => onSelect('junior'))}>
                <div className="tc-icon">
                  <img src="/assets/sprites/robot/robot_idle.svg" alt="Ignite Robot" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Ignite</div>
                  <div className="tc-desc">Scratch & block coding</div>
                </div>
              </div>

              {/* 2 EMBED */}
              <div className={`tc tc-circuit ${tcClass(1)}`} onClick={() => handleCardClick(() => onSelect('intermediate'))}>
                <div className="tc-icon">
                  <img src="/assets/arduino_icon.png" alt="Circuit Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Embed</div>
                  <div className="tc-desc">Block Coding, Arduino & Embedded Systems</div>
                </div>
              </div>

              {/* 3 CODEX */}
              <div className={`tc tc-codex ${tcClass(2)}`} onClick={() => handleCardClick(() => onSelect('python'))}>
                <div className="tc-icon">
                  <img src="/assets/python_icon.png" alt="Codex Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Codex</div>
                  <div className="tc-desc">Python Programming</div>
                </div>
              </div>

              {/* 4 NEURA */}
              <div className={`tc tc-neura ${tcClass(3)}`} onClick={() => handleCardClick(() => (window as any).showComingSoon('Neura'))}>
                <div className="tc-icon">
                  <img src="/assets/ml_brain_icon.png" alt="Neura Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Neura</div>
                  <div className="tc-desc">AI Logic & Advanced Block Programming</div>
                </div>
              </div>

              {/* 5 ELECTRA */}
              <div className={`tc tc-forge ${tcClass(4)}`} onClick={() => handleCardClick(() => onSelect('leapforge'))}>
                <div className="tc-icon">
                  <img src="/assets/creocad_icon.png" alt="Forge Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Electra</div>
                  <div className="tc-desc">Circuit Design & Simulation</div>
                </div>
              </div>

              {/* 6 VISION3D */}
              <div className={`tc tc-studio ${tcClass(5)}`} onClick={() => handleCardClick(() => onSelect('appforge'))}>
                <div className="tc-icon">
                  <img src="/assets/app_game_dev_icon.png" alt="Studio Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Vision3D</div>
                  <div className="tc-desc">3D Design & Modeling </div>
                </div>
              </div>

              {/* 7 STUDIO */}
              <div className={`tc tc-studio ${tcClass(5)}`} onClick={() => handleCardClick(() => onSelect('appforge'))}>
                <div className="tc-icon">
                  <img src="/assets/app_game_dev_icon.png" alt="Studio Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Studio</div>
                  <div className="tc-desc">App & Game Development</div>
                </div>
              </div>

              {/* 8 PULSE */}
              <div className={`tc tc-quiz ${tcClass(6)}`} onClick={() => handleCardClick(() => (window as any).showComingSoon('Quiz'))}>
                <div className="tc-icon">
                  <img src="/assets/quiz_icon.png" alt="Quiz Icon" />
                </div>
                <div>
                  <div className="tc-cat">Leaplab</div>
                  <div className="tc-name">Pulse</div>
                  <div className="tc-desc">Assessment & Quiz Creation</div>
                </div>
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <footer style={{
            textAlign: 'center',
            padding: '28px 0',
            color: '#05001eff',
            fontSize: '0.95rem',
            fontFamily: '"Poppins", sans-serif',
            opacity: 1,
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            LeapLab v1.0 © Creoleap Technologies Pvt. Ltd.
          </footer>

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
              width: 10, height: 10, borderRadius: '50%',
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
