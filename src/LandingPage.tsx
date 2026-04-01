
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
  const [highlightCards, setHighlightCards] = useState(false);

  const handleCardClick = (action: () => void) => {
    setHighlightCards(false);
    action();
  };

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

    // Dynamically load DotLottie script if not present
    let script: HTMLScriptElement | null = null;
    if (!customElements.get('dotlottie-player')) {
      script = document.createElement('script');
      script.src = "https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs";
      script.type = "module";
      script.onload = initLottie;
      document.body.appendChild(script);
    } else {
      initLottie();
    }

    function initLottie() {
      const container = document.getElementById('lottie-anim');
      if (!container) return;
      container.innerHTML = `
        <dotlottie-player 
          src="/assets/robot.lottie" 
          background="transparent" 
          speed="1" 
          style="width: 100%; height: 100%;" 
          loop 
          autoplay
        ></dotlottie-player>
      `;
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
        <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] flex items-center justify-center flex-col overflow-hidden animate-splash-fade-out">
          <div className="absolute z-2 animate-rocket-fly">
            <img
              src="/assets/sprites/robot/robot_idle.svg"
              alt="Robot Flow"
              className="w-[clamp(100px,25vw,140px)] h-auto drop-shadow-[0_10px_30px_rgba(124,92,252,0.5)]"
            />
          </div>
          <div className="z-1 opacity-0 flex flex-col items-center gap-[10px] animate-[splash-text-reveal_1.2s_cubic-bezier(0.2,0.8,0.2,1)_1.2s_forwards]">
            <div className="text-[clamp(1rem,3vw,1.8rem)] font-medium text-black/60 tracking-[0.1em] uppercase mb-[-15px]">Welcome to the</div>
            <div className="text-[clamp(3rem,12vw,5.5rem)] font-black tracking-[-0.02em] bg-clip-text text-transparent bg-gradient-to-br from-[#7a5af8] to-[#38bdf8] leading-[1.1]">Leaplab</div>
            <div className="mt-[15px] flex items-center gap-[10px] opacity-0 animate-[splash-text-reveal_1s_cubic-bezier(0.2,0.8,0.2,1)_1.8s_forwards]">
              <span className="text-[0.85rem] font-semibold text-black/40 uppercase tracking-[0.1em]">Powered by</span>
              <img src="/assets/topbar_logo.svg" alt="LeapLab" className="h-[28px] opacity-80" />
            </div>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes splash-text-reveal {
              0% { opacity: 0; transform: scale(0.8) translateY(20px); filter: blur(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
            }
          `}} />
        </div>
      )}

      {/* Tailwind handles the design tokens via utility classes */}
      <div className="font-jakarta bg-bg-main text-text-main min-h-screen overflow-x-hidden overflow-y-auto relative selection:bg-brand-secondary/20">

        {/* Global Floating Shapes */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-5%] left-[-10%] w-[550px] h-[550px] bg-[#bef264]/20 rounded-full blur-[130px] animate-float-slow"></div>
          <div className="absolute top-[25%] left-[-5%] w-[500px] h-[500px] bg-[#7c5cfc]/15 rounded-full blur-[120px] animate-float-slow delay-[-2s]"></div>
          <div className="absolute top-[30%] right-[5%] w-[450px] h-[450px] bg-[#38bdf8]/10 rounded-full blur-[110px] animate-float-slow delay-[-4s]"></div>
          <div className="absolute bottom-[-10%] left-[25%] w-[450px] h-[450px] bg-[#f472b6]/20 rounded-full blur-[120px] animate-float-slow delay-[-5s]"></div>
        </div>

        <div className="fixed top-0 right-0 w-full lg:w-3/5 h-screen pointer-events-none z-0 overflow-hidden opacity-10 lg:opacity-30">
          <svg viewBox="0 0 820 920" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="690" cy="72" r="54" fill="rgba(200,210,240,0.6)" />
            <circle cx="584" cy="198" r="40" fill="rgba(195,205,235,0.55)" />
            <circle cx="770" cy="285" r="32" fill="rgba(195,205,235,0.5)" />
            <circle cx="494" cy="118" r="24" fill="rgba(195,205,235,0.45)" />
          </svg>
        </div>

        {/* TOPBAR */}
        <nav className="sticky top-0 left-0 right-0 z-[200] h-[clamp(50px,10vw, 80px)] bg-white/95 backdrop-blur-lg border-b border-black/5 shadow-sm">
          <div className="max-w-[1500px] mx-auto px-[clamp(16px,3vw,32px)] h-full flex items-center justify-between relative">
            <div className="flex items-center gap-2 drop-shadow-sm">
              <img src="/assets/leaplab_logo_transparent.png" alt="LeapLab Logo" className="h-[clamp(40px,8vw,60px)] w-auto object-contain" />
            </div>

            <div className="hidden md:flex items-start justify-start gap-12 absolute left-1/2 -translate-x-1/2">
              <a href="#" className="text-[#05001eff]/80 hover:text-brand-primary text-[16px] font-bold transition-all duration-200 tracking-tight">Tutorials</a>
              <a href="#" className="text-[#05001eff]/80 hover:text-brand-primary text-[16px] font-bold transition-all duration-200 tracking-tight">Explore</a>
            </div>

            <div className="flex items-center gap-4 drop-shadow-sm">
              <img src="/assets/topbar_logo.svg" alt="Creoleap" className="h-[clamp(45px,7vw,55px)] w-auto object-contain pr-1" />
            </div>
          </div>
        </nav>

        <main className="relative z-10 flex flex-col min-h-[calc(100vh-68px)] overflow-x-hidden">
          {/* HERO */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-center max-w-[1300px] mx-auto px-[clamp(12px,3vw,48px)] py-4 lg:py-6 gap-6 lg:gap-10 flex-1 min-h-[0]">
            <div className="flex flex-col order-2 lg:order-1">
              <div className="inline-block py-2.5 px-6 bg-[#bef264] border-2 border-black shadow-[5px_5px_0px_#000] -rotate-1 mb-8 text-[0.8rem] rounded-full font-black uppercase tracking-[0.3em] transform animate-hero-reveal lg:self-end">
                Curiosity · Creativity · Critical Thinking
              </div>
              <h1 className="text-[clamp(3rem,10vw,6rem)] font-black leading-[0.95] tracking-tight mb-8 text-[#05001eff] animate-hero-reveal delay-100 lg:text-right lg:self-end">
                Learn to <span className="text-[#7c5cfc] italic inline-block mt-[-10px] transform translate-y-[5px]">code</span><br />
                the <span className="text-white [-webkit-text-stroke:2.5px_#221e4bff] drop-shadow-[0_4px_2px_rgba(0,0,0,0.15)] inline-block mt-[-10px] transform translate-y-[5px]">bold</span> way
              </h1>
              <p className="text-[clamp(1rem,2vw,1.20rem)] text-text-main leading-relaxed max-w-[540px] mb-8 opacity-80 animate-hero-reveal delay-200 lg:text-center lg:self-end lg:ml-auto">
                Seven unique tracks from junior picture-blocks all the way to AI,
                robotics, and machine vision. Pick your adventure.
              </p>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-center lg:self-center animate-hero-reveal delay-300">
                <button
                  onClick={() => {
                    setHighlightCards(true);
                    document.querySelector('#adventure-start')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#100051] hover:bg-[#1a0077] text-white font-black py-10 px-32 rounded-full shadow-[4px_4px_0px_#000] hover:scale-105 hover:shadow-[6px_6px_0px_#000] active:scale-95 transition-all duration-300 tracking-tight text-[19px]"
                >
                  Choose your adventure
                </button>
                <button className="bg-white border-2 border-black text-[#05001eff] font-black py-10 px-32 rounded-full shadow-[4px_4px_0px_#000] hover:translate-y-[-3px] hover:translate-x-[-3px] hover:shadow-[7px_7px_0px_#000] active:translate-y-0 active:translate-x-0 transition-all duration-200 text-[19px]">
                  Watch 2-min demo
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center animate-hero-reveal delay-400 order-1 lg:order-2">
              <div className="absolute inset-0 bg-brand-secondary/15 rounded-full blur-[100px] animate-float-glow"></div>
              <div id="lottie-anim" className="w-full max-w-[clamp(280px,80vw,480px)] aspect-square rounded-[32px] overflow-hidden relative z-10 transform scale-105"></div>
            </div>
          </div>

      <div id="adventure-start" className="scroll-mt-24" />

      {/* 7 TRACK CARDS */}
      <section className="w-full px-[clamp(12px,3vw,48px)] pb-6 -mt-24 flex justify-center">
        <div className="w-full max-w-[1300px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 animate-hero-reveal delay-500">

            {/* Common Card Classes */}
            {(() => {
              const baseTc = `relative overflow-hidden rounded-[22px] px-6 py-6 flex flex-col justify-end h-[180px] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-black/5 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(99,102,241,0.12),0_8px_16px_rgba(99,102,241,0.06)] ${highlightCards ? 'animate-tc-pulse' : ''}`;

              return (
                <>
                  {/* 1 IGNITE */}
                  <div className={`${baseTc} bg-gradient-to-b from-[#f4f2ff] to-[#ede9ff] border-b-4 border-[#4f46e5] group`} onClick={() => handleCardClick(() => onSelect('junior'))}>
                    <div className="flex-1 flex items-center justify-center">
                      <img src="/assets/sprites/robot/robot_idle.svg" alt="Ignite Robot" className="w-[clamp(56px,8vw,72px)] h-[clamp(56px,8vw,72px)] object-contain transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div className="mt-auto">
                      <div className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-[#05001eff]/35 mb-0.5">Leaplab</div>
                      <div className="text-[1rem] font-black uppercase text-[#05001eff] mb-1">Ignite</div>
                      <div className="text-[0.65rem] font-semibold text-[#05001eff]/50 leading-snug">Glowing robot and robot animation</div>
                    </div>
                  </div>

                  {/* 2 CIRCUIT */}
                  <div className={`${baseTc} bg-gradient-to-b from-[#f0faff] to-[#e0f2fe] border-b-4 border-[#0ea5e9] group`} onClick={() => handleCardClick(() => onSelect('intermediate'))}>
                    <div className="flex-1 flex items-center justify-center pb-2 transition-transform duration-300 group-hover:scale-110">
                      <img src="/assets/arduino_icon.png" alt="Circuit Icon" className="w-[clamp(40px,7vw,56px)] h-[clamp(40px,7vw,56px)] object-contain" />
                    </div>
                    <div>
                      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#05001eff]/40 mb-0.5">Leaplab</div>
                      <div className="text-[0.95rem] font-black uppercase text-[#05001eff] mb-0.5">Circuit</div>
                      <div className="text-[0.62rem] font-bold text-[#05001eff]/60 leading-tight">Glowing microchip</div>
                    </div>
                  </div>

                  {/* 3 CODEX */}
                  <div className={`${baseTc} bg-gradient-to-b from-[#f0fff4] to-[#dcfce7] border-b-4 border-[#10b981] group`} onClick={() => handleCardClick(() => onSelect('python'))}>
                    <div className="flex-1 flex items-center justify-center pb-2 transition-transform duration-300 group-hover:scale-110">
                      <img src="/assets/python_icon.png" alt="Codex Icon" className="w-[clamp(40px,7vw,56px)] h-[clamp(40px,7vw,56px)] object-contain" />
                    </div>
                    <div>
                      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#05001eff]/40 mb-0.5">Leaplab</div>
                      <div className="text-[0.95rem] font-black uppercase text-[#05001eff] mb-0.5">Codex</div>
                      <div className="text-[0.62rem] font-bold text-[#05001eff]/60 leading-tight">Glowing python animations</div>
                    </div>
                  </div>

                  {/* 4 NEURA */}
                  <div className={`${baseTc} bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe] border-b-4 border-[#8b5cf6] group`} onClick={() => handleCardClick(() => (window as any).showComingSoon('Neura'))}>
                    <div className="flex-1 flex items-center justify-center pb-2 transition-transform duration-300 group-hover:scale-110">
                      <img src="/assets/ml_brain_icon.png" alt="Neura Icon" className="w-[clamp(40px,7vw,56px)] h-[clamp(40px,7vw,56px)] object-contain" />
                    </div>
                    <div>
                      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#05001eff]/40 mb-0.5">Leaplab</div>
                      <div className="text-[0.95rem] font-black uppercase text-[#05001eff] mb-0.5">Neura</div>
                      <div className="text-[0.62rem] font-bold text-[#05001eff]/60 leading-tight">Glowing brain with neural network</div>
                    </div>
                  </div>

                  {/* 5 FORGE */}
                  <div className={`${baseTc} bg-gradient-to-b from-[#fff7ed] to-[#ffedd5] border-b-4 border-[#f97316] group`} onClick={() => handleCardClick(() => (window as any).showComingSoon('Creocad'))}>
                    <div className="flex-1 flex items-center justify-center pb-2 transition-transform duration-300 group-hover:scale-110">
                      <img src="/assets/creocad_icon.png" alt="Forge Icon" className="w-[clamp(40px,7vw,56px)] h-[clamp(40px,7vw,56px)] object-contain" />
                    </div>
                    <div>
                      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#05001eff]/40 mb-0.5">Leaplab</div>
                      <div className="text-[0.95rem] font-black uppercase text-[#05001eff] mb-0.5">Forge</div>
                      <div className="text-[0.62rem] font-bold text-[#05001eff]/60 leading-tight">Glowing gears and 3D printer</div>
                    </div>
                  </div>

                  {/* 6 STUDIO */}
                  <div className={`${baseTc} bg-gradient-to-b from-[#fdf2f8] to-[#fce7f3] border-b-4 border-[#ec4899] group`} onClick={() => handleCardClick(() => onSelect('appforge'))}>
                    <div className="flex-1 flex items-center justify-center pb-2 transition-transform duration-300 group-hover:scale-110">
                      <img src="/assets/app_game_dev_icon.png" alt="Studio Icon" className="w-[clamp(40px,7vw,56px)] h-[clamp(40px,7vw,56px)] object-contain" />
                    </div>
                    <div>
                      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#05001eff]/40 mb-0.5">Leaplab</div>
                      <div className="text-[0.95rem] font-black uppercase text-[#05001eff] mb-0.5">Studio</div>
                      <div className="text-[0.62rem] font-bold text-[#05001eff]/60 leading-tight">Glowing game with game and clouds</div>
                    </div>
                  </div>

                  {/* 7 QUIZ */}
                  <div className={`${baseTc} bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] border-b-4 border-[#f59e0b] group`} onClick={() => handleCardClick(() => (window as any).showComingSoon('Quiz'))}>
                    <div className="flex-1 flex items-center justify-center pb-2 transition-transform duration-300 group-hover:scale-110">
                      <img src="/assets/quiz_icon.png" alt="Quiz Icon" className="w-[clamp(40px,7vw,56px)] h-[clamp(40px,7vw,56px)] object-contain" />
                    </div>
                    <div>
                      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#05001eff]/40 mb-0.5">Leaplab</div>
                      <div className="text-[0.95rem] font-black uppercase text-[#05001eff] mb-0.5">Quiz</div>
                      <div className="text-[0.62rem] font-bold text-[#05001eff]/60 leading-tight">Learning target of brain cognition</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 text-center bg-white/20 border-t border-black/5 backdrop-blur-sm shrink-0">
        <p className="text-[13px] font-bold text-[#05001eff]/60 tracking-tight">
          LeapLab v1.0 © Creoleap Technologies Pvt. Ltd.
        </p>
      </footer>
    </main >

      {/* TOAST NOTIFICATION */ }
  {
    toast.visible && (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 bg-brand-primary/95 text-white rounded-2xl font-bold shadow-2xl animate-hero-reveal flex items-center gap-3 border border-white/10 backdrop-blur-md">
        <div className="w-2.5 h-2.5 rounded-full bg-accent-lime shadow-[0_0_10px_#bef264]" />
        {toast.message}
      </div>
    )
  }
      </div >
    </>
  );
};

export default LandingPage;
