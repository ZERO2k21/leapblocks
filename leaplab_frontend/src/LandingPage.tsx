/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useRef, useState } from 'react';
import LeapLabAuthButton from './auth/LeapLabAuthButton';
import MyProjectsDashboard from './components/my-projects/MyProjectsDashboard';
import './components/my-projects/my-projects.css';
// JSZip lazy-loaded only when Lottie animation needs to be parsed

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
  const [activeTab, setActiveTab] = useState<'modules' | 'my-projects'>(() => {
    const saved = sessionStorage.getItem('landingActiveTab');
    if (saved === 'my-projects') return 'my-projects';
    return 'modules';
  });
  const showProjects = activeTab === 'my-projects';

  /* ── Card scan ── */
  const startCardScan = () => {
    // Clear any existing interval to prevent leaks and flickering
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    setHighlightCards(true);
    setScanIndex(0);
    let i = 0;
    scanIntervalRef.current = setInterval(() => {
      i = (i + 1) % 8;
      setScanIndex(i);
    }, 300);
  };

  const stopCardScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanIndex(-1);
    setHighlightCards(false);
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
        const response = await fetch('assets/robot.lottie');
        if (!response.ok) throw new Error(`Failed to fetch .lottie (${response.status})`);
        const buffer = await response.arrayBuffer();

        // Lazy-load JSZip only when needed for Lottie parsing
        const { default: JSZip } = await import('jszip');
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
            <img src="assets/sprites/robot/robot_idle.svg" alt="Robot Flow" className="splash-robot-img" />
          </div>
          <div className="splash-text-container">
            <div className="splash-text-welcome">Welcome to the</div>
            <img src="assets/splash_logo_b.png" alt="Leaplab Logo" className="splash-logo" />
            <div className="splash-powered-by">
              <span>Powered by</span>
              <img src="assets/topbar_logo.svg" alt="LeapLab" />
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

/* ─── TOPBAR GRADIENT LINE ─── */
.topbar-gradient-line {
  width: 100%;
  position: relative;
  z-index: 150;
}

.topbar-gradient-line .line-primary {
  height: 3px;
  width: 100%;
  background: linear-gradient(
    90deg,
    #F97316 0%,
    #14B8A6 20%,
    #3B82F6 40%,
    #A855F7 60%,
    #22C55E 80%,
    #EC4899 100%
  );
}

.topbar-gradient-line .line-secondary {
  height: 2px;
  width: 100%;
  background: linear-gradient(
    90deg,
    rgba(249,115,22,0.5),
    rgba(20,184,166,0.5),
    rgba(59,130,246,0.5),
    rgba(168,85,247,0.5),
    rgba(34,197,94,0.5),
    rgba(236,72,153,0.5)
  );
  opacity: 0.6;
}

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
.splash-logo {
  height: clamp(60px, 15vw, 120px);
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(124, 92, 252, 0.4));
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
  overflow-x: hidden;
  overflow-y: auto;
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
  height: 10vh;
  min-height: 50px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 clamp(12px, 2vw, 30px);
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
.landing-page-container .nav-links { display: flex; gap: 24px; margin-left: 12px; align-items: center; }
@media (max-width: 768px) { .landing-page-container .nav-links { display: none; } }
.landing-page-container .nav-link {
  background: transparent;
  border: none;
  color: #0f172a;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  transition: all 0.2s ease;
}
.landing-page-container .nav-link:hover { color: #4f46e5; background: rgba(79,70,229,0.06); }
.landing-page-container .nav-link.active { color: #ffffff; background: #4f46e5; }

/* ─── PAGE CONTENT ─── */
.landing-page-container .page {
  position:relative; z-index:1; padding-top: 1vh; padding-bottom: 48px;
  display: flex; flex-direction: column; justify-content: space-between;
  flex: 1; min-height: 0; transition: all 0.3s ease;
  overflow: visible; scroll-behavior: smooth;
}

/* ─── HERO ─── */
.landing-page-container .hero-grid {
  display: grid; grid-template-columns: 1.1fr 0.9fr;
  align-items: center; max-width: 1800px; margin: 0 auto;
  padding: 0 2vw;
  gap: 10vw; flex: 1 1 auto; /* Fill remaining space natively */
}
@media (max-width: 1024px) {
  .landing-page-container .hero-grid {
    grid-template-columns: 1fr; text-align: center;
    gap: 2vh; padding-top: 2vh; height: 45vh; flex: 0 1 45vh;
  }
  .landing-page-container .hero-left { display: flex; flex-direction: column; align-items: center; }
  .landing-page-container .hero-sub { margin-left: auto; margin-right: auto; max-width: 90%; }
  .landing-page-container .hero-btns { justify-content: center; width: 100%; gap: 12px; }
}
@media (max-width: 640px) {
  .landing-page-container nav { padding: 0 16px; height: 56px; }
  .landing-page-container .nav-brand { gap: 6px; }
  .landing-page-container .brand-logo { height: 38px; }
  .landing-page-container .hero-title { font-size: 5vh; }
  .landing-page-container .hero-sub { font-size: 2vh; max-width: 100%; padding: 0 1vw; }
  .landing-page-container .hero-btns { gap: 1vh; }
}

.landing-page-container .hero-title {
  font-size: min(4.8rem, 7.5vh); font-weight: 900;
  line-height: 1.1; letter-spacing: -0.04em; margin-bottom: 2vh; color: #0F172A;
}
.landing-page-container .hero-title .hw-code {
  color: transparent; -webkit-text-stroke: 2px #6366F1;
  -webkit-text-fill-color: transparent; letter-spacing: -0.02em;
}
.landing-page-container .hero-title .hw-bold {
  font-style: italic; color: transparent;
  background: linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #8B5CF6 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  letter-spacing: 0.02em; padding: 0 4px;
}
.landing-page-container .hero-tagline {
  display: inline-block; font-size: min(0.7rem, 1.4vh);
  font-weight: 800; color: #000; text-transform: uppercase;
  letter-spacing: 0.25em; margin-bottom: 1.5vh; padding: 0.8vh 1.2vw;
  background: var(--accent); border: 2px solid #000; box-shadow: 2px 2px 0px #000;
  transform: rotate(-1deg);
}
.landing-page-container .hero-sub {
  font-size: min(1.25rem, 2.6vh); color: #0f172a;
  line-height: 1.45; max-width: 600px; margin-bottom: 3vh;
  position: relative; z-index: 2; opacity: 0.85;
}
.landing-page-container .hero-btns { display:flex; gap:1.2vw; flex-wrap:wrap; }
.landing-page-container .btn-adventure {
  background: var(--brand-primary); border: none; color: #fff;
  font-size: min(1.05rem, 2.2vh); font-weight: 600; cursor: pointer; font-family: inherit;
  padding: 1.8vh 1.8vw; border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 12px -3px rgba(99, 102, 241, 0.3);
}
.landing-page-container .btn-adventure:hover {
  background: var(--brand-secondary); transform: scale(1.05) rotate(2deg);
  box-shadow: 0 16px 20px -5px rgba(99, 102, 241, 0.4);
}
.landing-page-container .btn-demo {
  background: #fff; border: 2px solid #000; color: var(--text-main);
  font-size: min(1.05rem, 2.2vh); font-weight: 700; cursor: pointer; font-family: inherit;
  padding: 1.8vh 1.8vw; border-radius: 12px; transition: all 0.2s;
  box-shadow: 3px 3px 0px #000;
}
.landing-page-container .btn-demo:hover {
  background: var(--bg-main); transform: translate(-2px, -2px); box-shadow: 5px 5px 0px #000;
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
.shape-2 { width: 400px; height: 400px; background: linear-gradient(135deg, #4e42c0 0%, #1a24af 100%); top: 40%; right: -10%; animation-delay: -2s; }
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
  width:100%; max-height: 48vh; max-width: max(260px, 46vh);
  aspect-ratio:1; border-radius:24px; overflow:hidden;
}
@media (max-width: 1024px) {
  .landing-page-container #lottie-anim { max-height: 35vh; max-width: max(220px, 35vh); margin: 0 auto; }
}

/* ─── CARDS ROW ─── */
.landing-page-container .cards-wrap {
  width: 100%; margin: 0 auto;
  padding: 2vh 1.5vw 4vh; /* Breating room */
  flex: 0 1 auto; display: flex; align-items: center; justify-content: center;
}
.landing-page-container .cards-row {
  display:grid; grid-template-columns: repeat(8, 1fr);
  gap: 1vw; width: 100%; max-width: 1600px; /* Maximize row expanse */
}
@media (max-width: 1440px) {
  .landing-page-container .cards-row { grid-template-columns: repeat(8, 1fr); }
}

/* ── Card base + scan transitions ── */
.landing-page-container .tc {
  border-radius:18px; padding: 1.5vh 0.8vw; cursor:pointer;
  transition: transform .4s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow .5s ease,
              opacity .3s ease;
  position:relative; overflow:hidden; 
  height: clamp(140px, 28vh, 260px); /* Massive, properly proportionate height */
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

/* Scanning spotlight — active card (3D Pop Animation) */
.landing-page-container .tc.tc-scan-active {
  transform: perspective(1000px) translate3d(0, -10px, 40px) scale(1.08) rotateX(8deg) rotateY(-2deg) !important;
  box-shadow: 
    0 0 0 3px #6366F1, 
    0 15px 35px rgba(99,102,241,0.35),
    inset 0 2px 4px rgba(255,255,255,1) !important;
  z-index: 10;
  border-color: rgba(99,102,241,0.5);
}

/* Dim non-active cards while scanning */
.landing-page-container .cards-row.is-scanning .tc:not(.tc-scan-active) {
  opacity: 0.4;
  transform: perspective(1000px) translateZ(-20px) scale(0.95);
  box-shadow: none;
}

/* Subtle glow on all cards before scan starts */
.landing-page-container .tc.tc-highlight {
  box-shadow: 0 0 0 2px rgba(99,102,241,0.35), 0 8px 20px rgba(99,102,241,0.08);
}

@media (max-width: 1200px) { 
  .landing-page-container .cards-row { grid-template-columns: repeat(8, 1fr); gap: 0.5vw; } 
}
@media (max-width: 900px)  { 
  .landing-page-container .cards-row { grid-template-columns: repeat(8, 1fr); gap: 0.5vw; } 
}
@media (max-width: 768px)  { 
  .landing-page-container .cards-wrap { padding: 1vh 1vw; }
  .landing-page-container .cards-row { grid-template-columns: repeat(8, 1fr); gap: 0.5vw; } 
}
@media (max-width: 480px)  { 
  .landing-page-container .cards-row { grid-template-columns: repeat(8, 1fr); gap: 0.5vw; } 
  .landing-page-container .tc { padding: 0.5vh 0.5vw; }
}

.landing-page-container .tc-ignite  { background:linear-gradient(155deg,#ffffff 0%, #fff0e5 60%,#fce5d4 100%); border-bottom: 4px solid #F97316; }
.landing-page-container .tc-ignite:hover { box-shadow: 0 20px 40px rgba(249,115,22,0.15), 0 0 0 1px rgba(249,115,22,0.1); }
.landing-page-container .tc-embed   { background:linear-gradient(155deg,#ffffff 0%, #e5f2f5 60%,#d5f2f7 100%); border-bottom: 4px solid #59aaa4ff; }
.landing-page-container .tc-embed:hover { box-shadow: 0 20px 40px rgba(15, 118, 109, 0.86), 0 0 0 1px rgba(15,118,110,0.1); }
.landing-page-container .tc-Logix   { background:linear-gradient(155deg,#ffffff 0%, #ebf0fd 60%,#ccdafa 100%); border-bottom: 4px solid #3B82F6; }
.landing-page-container .tc-Logix:hover { box-shadow: 0 20px 40px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.1); }
.landing-page-container .tc-electra { background:linear-gradient(155deg,#ffffff 0%, #eaf8ed 60%,#d6f7df 100%); border-bottom: 4px solid #22C55E; }
.landing-page-container .tc-electra:hover { box-shadow: 0 20px 40px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.1); }
.landing-page-container .tc-vision3d{ background:linear-gradient(155deg,#ffffff 0%, #e5f6f8 60%,#d2f6fa 100%); border-bottom: 4px solid #06B6D4; }
.landing-page-container .tc-vision3d:hover { box-shadow: 0 20px 40px rgba(6,182,212,0.15), 0 0 0 1px rgba(6,182,212,0.1); }
.landing-page-container .tc-creova  { background:linear-gradient(155deg,#ffffff 0%, #fbedf4 60%,#fae1ee 100%); border-bottom: 4px solid #EC4899; }
.landing-page-container .tc-creova:hover { box-shadow: 0 20px 40px rgba(236,72,153,0.15), 0 0 0 1px rgba(236,72,153,0.1); }
.landing-page-container .tc-pulse   { background:linear-gradient(155deg,#ffffff 0%, #eafcf1 60%,#c7fade 100%); border-bottom: 4px solid #10B981; }
.landing-page-container .tc-pulse:hover { box-shadow: 0 20px 40px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.1); }

.landing-page-container .tc-icon {
  flex:1; display:flex; align-items:center; justify-content:center; padding-bottom: 2vh;
}
.landing-page-container .tc-icon svg,
.landing-page-container .tc-icon img {
  width: 90%; max-height: 12vh; object-fit: contain;
  transform: scale(1) translateY(0);
  filter: drop-shadow(0 10px 10px rgba(0,0,0,0.15));
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
}
.landing-page-container .tc:hover .tc-icon img {
  transform: scale(1.12) translateY(-6px);
  filter: drop-shadow(0 15px 15px rgba(0,0,0,0.25));
  z-index: 20;
}
.landing-page-container .tc-cat-logo {
  height: clamp(10px, 1.5vh, 16px);
  width: auto;
  object-fit: contain;
  margin-bottom: 0.4vh;
  opacity: 0.75;
  display: block;
}
.landing-page-container .tc-cat {
  font-size: min(0.8rem, 1.2vw); font-weight: 900; letter-spacing: 0.05em;
  text-transform: uppercase; color: #0a0328ff; margin-bottom: 0.5vh; line-height: 1.1; opacity: 0.65;
}
.landing-page-container .tc-name {
  font-size: min(0.9rem, 1.5vw); font-weight: 1000; letter-spacing: 0.01em;
  text-transform: uppercase; color: #281746ff; margin-bottom: 0.5vh; line-height: 1.1;
}
.landing-page-container .tc-desc {
  font-size: min(0.75rem, 1vw); color: #020046b1; line-height: 1.2; font-weight: 600;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
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
            <a href="#" className="nav-brand" onClick={() => {
              setActiveTab('modules');
              sessionStorage.setItem('landingActiveTab', 'modules');
              sessionStorage.removeItem('myProjectsSelectedMode');
            }}>
              <img src="assets/Final_logo_b.png" alt="LeapLab Logo" className="brand-logo" />
            </a>
            <div className="nav-links">
              <button className="nav-link" onClick={() => (window as any).showComingSoon('Tutorials')}>
                Tutorials
              </button>
              <button className="nav-link" onClick={() => (window as any).showComingSoon('Explore')}>
                Explore
              </button>
              <button
                className={`nav-link ${showProjects ? 'active' : ''}`}
                onClick={() => {
                  const target = showProjects ? 'modules' : 'my-projects';
                  setActiveTab(target);
                  sessionStorage.setItem('landingActiveTab', target);
                }}
              >
                My Projects
              </button>
            </div>
          </div>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <LeapLabAuthButton variant="light" size="md" />
            <div className="nav-separator" style={{ width: '1.5px', height: '24px', backgroundColor: 'rgba(15, 23, 42, 0.15)' }}></div>
            <img src="assets/topbar_logo.svg" alt="Leapblocks Top Logo" className="nav-logo" style={{ height: 'clamp(40px, 5vw, 50px)' }} />
          </div>

        </nav>

        {/* Gradient Divider Line */}
        <div className="topbar-gradient-line">
          <div className="line-primary"></div>
          <div className="line-secondary"></div>
        </div>

        <div className="page">

          {activeTab === 'my-projects' && (
            <MyProjectsDashboard onOpenProject={(mode) => onSelect(mode)} />
          )}

          {activeTab === 'modules' && (
            <>
              {/* HERO */}
              <div className="hero-grid">
            <div className="hero-left">
              <div className="hero-tagline">Curiosity · Creativity · Critical Thinking</div>
              <h1 className="hero-title">
                Learn to <span className="hw-code">code</span><br />
                the <span className="hw-bold">bold</span> way
              </h1>
              <p className="hero-sub">
                Eight unique tracks from junior picture-blocks all the way to AI,
                robotics, and machine vision. Pick your adventure.
              </p>
              <div className="hero-btns">
                <button
                  className="btn-adventure"
                  onClick={() => {
                    if (highlightCards) {
                      stopCardScan();
                    } else {
                      startCardScan();
                      document.querySelector('.cards-wrap')?.scrollIntoView({ behavior: 'smooth' });
                    }
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
                  <img src="assets/ignite_icon.png" alt="Ignite Robot" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Ignite</div>
                  <div className="tc-desc">leap & block coding</div>
                </div>
              </div>

              {/* 2 EMBED */}
              <div className={`tc tc-embed ${tcClass(1)}`} onClick={() => handleCardClick(() => onSelect('intermediate'))}>
                <div className="tc-icon">
                  <img src="assets/arduino_icon.png" alt="Circuit Icon" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Embed</div>
                  <div className="tc-desc">Block Coding, Arduino & Embedded Systems</div>
                </div>
              </div>

              {/* 3 Logix */}
              <div className={`tc tc-Logix ${tcClass(2)}`} onClick={() => handleCardClick(() => onSelect('python'))}>
                <div className="tc-icon">
                  <img src="assets/python_icon.png" alt="Logix Icon" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Logix</div>
                  <div className="tc-desc">Python Programming</div>
                </div>
              </div>

              {/* 4 NEURA */}
              <div className={`tc tc-neura ${tcClass(3)}`} onClick={() => handleCardClick(() => onSelect('neura'))}>
                <div className="tc-icon">
                  <img src="assets/ml_brain_icon.png" alt="Neura Icon" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Neura</div>
                  <div className="tc-desc">AI Logic & Advanced Block Programming</div>
                </div>
              </div>

              {/* 5 ELECTRA */}
              <div className={`tc tc-electra ${tcClass(4)}`} onClick={() => handleCardClick(() => onSelect('electra'))}>
                <div className="tc-icon">
                  <img src="assets/creocad_icon.png" alt="Forge Icon" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Electra</div>
                  <div className="tc-desc">Circuit Design & Simulation</div>
                </div>
              </div>

              {/* 6 VISION3D */}
              <div className={`tc tc-vision3d ${tcClass(5)}`} onClick={() => handleCardClick(() => (window as any).showComingSoon('Vision3D'))}>
                <div className="tc-icon">
                  <img src="assets/vision3d_icon.png" alt="Vision3D Icon" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Vision3D</div>
                  <div className="tc-desc">3D Design & Modeling </div>
                </div>
              </div>

              {/* 7 CREOVA */}
              <div className={`tc tc-creova ${tcClass(6)}`} onClick={() => handleCardClick(() => onSelect('creova'))}>
                <div className="tc-icon">
                  <img src="assets/app_game_dev_icon.png" alt="Creova Icon" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Creova</div>
                  <div className="tc-desc">App & Game Development</div>
                </div>
              </div>

              {/* 8 PULSE */}
              <div className={`tc tc-pulse ${tcClass(7)}`} onClick={() => handleCardClick(() => (window as any).showComingSoon('Quiz'))}>
                <div className="tc-icon">
                  <img src="assets/quiz_icon.png" alt="Quiz Icon" />
                </div>
                <div>
                  <img src="assets/splash_logo_b.png" alt="Leaplab" className="tc-cat-logo" />
                  <div className="tc-name">Pulse</div>
                  <div className="tc-desc">Assessment & Quiz Creation</div>
                </div>
              </div>

            </div>
          </div>
            </>
          )}

          {/* FOOTER */}
          {activeTab === 'modules' && (
            <footer style={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: 'center',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexShrink: 0,
              zIndex: 10,
            }}>
              {/* Ambient glow dot */}
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #6366f1, #a855f7)',
                boxShadow: '0 0 8px 2px rgba(99,102,241,0.5)',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                letterSpacing: '0.04em',
                background: 'linear-gradient(90deg, #0a015a 0%, #6366f1 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                LeapLab v1.0 &copy; 2026 Creoleap Technologies Pvt. Ltd. — All rights reserved.
              </span>
              {/* Ambient glow dot */}
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #a855f7, #6366f1)',
                boxShadow: '0 0 8px 2px rgba(168,85,247,0.5)',
                flexShrink: 0,
              }} />
            </footer>
          )}

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
