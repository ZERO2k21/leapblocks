import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── inject keyframes once ───────────────────────────────────────────────────
function injectCSS() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('lp-anims')) return;
    const s = document.createElement('style');
    s.id = 'lp-anims';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        @keyframes lp-fadein    { from { opacity:0 } to { opacity:1 } }
        @keyframes lp-fadeup    { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes lp-blink     { 0%,100%{opacity:.15;transform:scale(.85)} 50%{opacity:1;transform:scale(1.4)} }
        @keyframes lp-shoot     {
            0%   { opacity:0; transform:translate(0,0) }
            10%  { opacity:1 }
            100% { opacity:0; transform:translate(var(--sx),var(--sy)) }
        }

        /* Robot intro: falls from top, bounces, settles */
        @keyframes lp-robot-drop {
            0%   { transform:translateY(-340px) rotate(-12deg) scale(.6); opacity:0 }
            55%  { transform:translateY(18px)   rotate(3deg)  scale(1.05); opacity:1 }
            70%  { transform:translateY(-10px)  rotate(-2deg) scale(.97) }
            82%  { transform:translateY(6px)    rotate(1deg)  scale(1.02) }
            92%  { transform:translateY(-3px)   rotate(0deg)  scale(.99) }
            100% { transform:translateY(0)      rotate(0deg)  scale(1);   opacity:1 }
        }
        /* Robot hover float after landing */
        @keyframes lp-robot-float {
            0%,100% { transform:translateY(0) rotate(-1deg) }
            50%     { transform:translateY(-10px) rotate(1deg) }
        }
        /* Thruster fire on robot */
        @keyframes lp-thruster {
            0%,100% { transform:scaleY(.7) scaleX(.8); opacity:.7 }
            50%     { transform:scaleY(1.3) scaleX(1.1); opacity:1 }
        }
        /* Logo frame shimmer */
        @keyframes lp-shimmer {
            0%   { background-position: -200% center }
            100% { background-position:  200% center }
        }
        /* Glow pulse on logo frame */
        @keyframes lp-frame-glow {
            0%,100% { box-shadow:0 0 20px 4px rgba(133,92,214,.45), 0 0 60px 8px rgba(133,92,214,.15) }
            50%     { box-shadow:0 0 35px 10px rgba(180,100,255,.7), 0 0 80px 20px rgba(133,92,214,.35) }
        }
        /* Type cursor blink */
        @keyframes lp-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
        /* Card hover lift */
        @keyframes lp-card-glow {
            0%,100% { box-shadow:0 0 0 1px rgba(133,92,214,.35), 0 8px 24px rgba(0,0,0,.5) }
            50%     { box-shadow:0 0 0 2px rgba(160,100,255,.6), 0 14px 36px rgba(133,92,214,.4) }
        }
        /* Stars orbit / particle */
        @keyframes lp-orbit {
            from { transform:rotate(0deg)   translateX(var(--r)) rotate(0deg) }
            to   { transform:rotate(360deg) translateX(var(--r)) rotate(-360deg) }
        }
        /* Exhaust trail fade */
        @keyframes lp-trail {
            0%   { opacity:.9; transform:scaleX(1) }
            100% { opacity:0;  transform:scaleX(0) }
        }
        /* Progress ring on robot badge */
        @keyframes lp-ring-spin { from{stroke-dashoffset:220} to{stroke-dashoffset:0} }
        /* Welcome title glow pulse */
        @keyframes lp-title-glow {
            0%,100%{text-shadow:0 0 18px rgba(180,140,255,.6),0 0 40px rgba(133,92,214,.3)}
            50%    {text-shadow:0 0 32px rgba(200,120,255,.9),0 0 70px rgba(133,92,214,.6)}
        }
        /* Background nebula drift */
        @keyframes lp-nebula {
            0%,100%{transform:scale(1)   rotate(0deg)}
            50%    {transform:scale(1.06) rotate(8deg)}
        }
        /* Flicker on "BETA" / "SOON" badge */
        @keyframes lp-badge-flicker {
            0%,90%,100%{opacity:1}80%{opacity:.4}85%{opacity:.9}
        }
    `;
    document.head.appendChild(s);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

interface StarProps { x: number; y: number; size: number; delay: number }
const Star: React.FC<StarProps> = ({ x, y, size, delay }) => (
    <div style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        width: size, height: size, borderRadius: '50%', backgroundColor: 'white',
        animation: `lp-blink ${1.5 + delay}s ${delay}s ease-in-out infinite`,
    }} />
);

interface ShootingStarProps { x: number; y: number; sx: number; sy: number; dur: number; delay: number }
const ShootingStar: React.FC<ShootingStarProps> = ({ x, y, sx, sy, dur, delay }) => (
    <div style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        width: 80, height: 2, borderRadius: 2,
        background: 'linear-gradient(to right, transparent, rgba(200,160,255,.9), transparent)',
        ['--sx' as any]: `${sx}px`, ['--sy' as any]: `${sy}px`,
        animation: `lp-shoot ${dur}s ${delay}s ease-in infinite`,
        transformOrigin: 'left center',
        transform: `rotate(${Math.atan2(sy, sx) * (180 / Math.PI)}deg)`,
    }} />
);

// ─── Robot SVG (drawn entirely inline) ───────────────────────────────────────
const RobotSprite: React.FC = () => (
    <svg width="110" height="130" viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="rb-body" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#9B6DFF" />
                <stop offset="100%" stopColor="#4C1D95" />
            </radialGradient>
            <radialGradient id="rb-head" cx="50%" cy="35%" r="55%">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="100%" stopColor="#7C3AED" />
            </radialGradient>
            <radialGradient id="rb-eye" cx="30%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="100%" stopColor="#0284C7" />
            </radialGradient>
            <filter id="rb-glow">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
        </defs>

        {/* Antenna */}
        <line x1="55" y1="6" x2="55" y2="18" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="55" cy="4" r="4" fill="#E879F9" filter="url(#rb-glow)" />

        {/* Head */}
        <rect x="28" y="18" width="54" height="42" rx="12" fill="url(#rb-head)" />

        {/* Eyes */}
        <circle cx="42" cy="36" r="9" fill="url(#rb-eye)" filter="url(#rb-glow)" />
        <circle cx="68" cy="36" r="9" fill="url(#rb-eye)" filter="url(#rb-glow)" />
        {/* Eye pupils */}
        <circle cx="44" cy="34" r="4" fill="white" />
        <circle cx="70" cy="34" r="4" fill="white" />
        <circle cx="45" cy="35" r="2" fill="#1E3A5F" />
        <circle cx="71" cy="35" r="2" fill="#1E3A5F" />
        {/* Eye gleam */}
        <circle cx="46" cy="33" r="1" fill="white" opacity=".8" />
        <circle cx="72" cy="33" r="1" fill="white" opacity=".8" />

        {/* Mouth / speaker grille */}
        <rect x="38" y="50" width="34" height="6" rx="3" fill="rgba(0,0,0,.3)" />
        {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={40 + i * 6} y={51} width="3" height="4" rx="1" fill="#7C3AED" />
        ))}

        {/* Neck */}
        <rect x="47" y="60" width="16" height="8" rx="4" fill="#6D28D9" />

        {/* Body */}
        <rect x="22" y="68" width="66" height="44" rx="14" fill="url(#rb-body)" />

        {/* Chest panel */}
        <rect x="36" y="76" width="38" height="24" rx="8" fill="rgba(0,0,0,.25)" />
        {/* Chest light */}
        <circle cx="55" cy="84" r="6" fill="#F97316" filter="url(#rb-glow)" />
        <circle cx="55" cy="84" r="3" fill="#FDE68A" />
        {/* Chest dots */}
        <circle cx="43" cy="94" r="2.5" fill="#22D3EE" />
        <circle cx="55" cy="94" r="2.5" fill="#A78BFA" />
        <circle cx="67" cy="94" r="2.5" fill="#F472B6" />

        {/* Left arm */}
        <rect x="4" y="70" width="16" height="32" rx="8" fill="#7C3AED" />
        <rect x="6" y="98" width="12" height="14" rx="6" fill="#6D28D9" />
        {/* Right arm */}
        <rect x="90" y="70" width="16" height="32" rx="8" fill="#7C3AED" />
        <rect x="92" y="98" width="12" height="14" rx="6" fill="#6D28D9" />

        {/* Legs */}
        <rect x="36" y="112" width="16" height="16" rx="6" fill="#6D28D9" />
        <rect x="58" y="112" width="16" height="16" rx="6" fill="#6D28D9" />
        {/* Feet */}
        <rect x="33" y="124" width="22" height="6" rx="3" fill="#5B21B6" />
        <rect x="55" y="124" width="22" height="6" rx="3" fill="#5B21B6" />

        {/* Jet thruster left */}
        <rect x="32" y="108" width="10" height="6" rx="3" fill="#444" />
        {/* Jet thruster right */}
        <rect x="68" y="108" width="10" height="6" rx="3" fill="#444" />
    </svg>
);

// Thruster flame under robot
const ThrusterFlame: React.FC<{ side: 'left' | 'right' }> = ({ side }) => (
    <div style={{
        position: 'absolute',
        bottom: -12,
        [side]: side === 'left' ? 14 : 14,
        width: 14,
        height: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }}>
        <div style={{
            width: 14, height: 22,
            background: 'linear-gradient(to bottom, rgba(255,100,0,.0), rgba(255,160,0,.85), #FFF3)',
            borderRadius: '50% 50% 30% 30%',
            filter: 'blur(3px)',
            animation: 'lp-thruster .12s ease-in-out infinite alternate',
            transformOrigin: 'top center',
        }} />
        <div style={{
            position: 'absolute', top: 6,
            width: 7, height: 14,
            background: 'linear-gradient(to bottom, transparent, #fff)',
            borderRadius: '50% 50% 30% 30%',
            filter: 'blur(1.5px)',
        }} />
    </div>
);

// ─── Mode card ───────────────────────────────────────────────────────────────
interface ModeCardProps {
    icon: string;
    title: string;
    subtitle: string;
    badge?: string;
    badgeColor?: string;
    color: string;          // main accent
    glow: string;
    delay: number;
    available: boolean;
    onClick: () => void;
}
const ModeCard: React.FC<ModeCardProps> = ({ icon, title, subtitle, badge, badgeColor, color, glow, delay, available, onClick }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={available ? onClick : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                width: 200,
                background: hovered && available
                    ? `radial-gradient(ellipse at 50% 0%, ${glow} 0%, rgba(15,8,32,.97) 70%)`
                    : 'rgba(255,255,255,.04)',
                border: `1px solid ${hovered && available ? color : 'rgba(255,255,255,.1)'}`,
                borderRadius: 20,
                padding: '28px 20px 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: available ? 'pointer' : 'default',
                transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
                transform: hovered && available ? 'translateY(-8px) scale(1.04)' : 'translateY(0) scale(1)',
                boxShadow: hovered && available
                    ? `0 0 0 1px ${color}66, 0 20px 50px rgba(0,0,0,.6), 0 0 30px ${glow}`
                    : '0 4px 20px rgba(0,0,0,.4)',
                backdropFilter: 'blur(12px)',
                animation: `lp-fadeup .6s ${delay}s both`,
                opacity: available ? 1 : .55,
                filter: available ? 'none' : 'grayscale(.5)',
            }}
        >
            {/* Badge */}
            {badge && (
                <div style={{
                    position: 'absolute',
                    top: 10, right: 10,
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '3px 7px',
                    borderRadius: 20,
                    backgroundColor: badgeColor ?? '#7C3AED',
                    color: 'white',
                    letterSpacing: '.08em',
                    fontFamily: '"Orbitron", sans-serif',
                    animation: badge === 'SOON' ? 'lp-badge-flicker 4s 2s infinite' : 'none',
                    textTransform: 'uppercase',
                }}>
                    {badge}
                </div>
            )}

            {/* Icon circle */}
            <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,.4) 70%)`,
                border: `2px solid ${color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34,
                marginBottom: 14,
                boxShadow: hovered && available ? `0 0 22px ${glow}` : 'none',
                transition: 'box-shadow .3s',
            }}>
                {icon}
            </div>

            {/* Title */}
            <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: available ? '#EDE9FE' : '#9CA3AF',
                marginBottom: 6,
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '.04em',
                textAlign: 'center',
            }}>
                {title}
            </div>

            {/* Subtitle */}
            <div style={{
                fontSize: 11,
                color: available ? '#9CA3AF' : '#6B7280',
                textAlign: 'center',
                lineHeight: 1.5,
                fontFamily: '"Inter", sans-serif',
            }}>
                {subtitle}
            </div>

            {/* "Click to enter" hint */}
            {available && hovered && (
                <div style={{
                    marginTop: 14,
                    fontSize: 10,
                    color: color,
                    fontWeight: 700,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    fontFamily: '"Orbitron", sans-serif',
                    animation: 'lp-fadein .2s ease-out',
                }}>
                    ▶ ENTER
                </div>
            )}

            {!available && (
                <div style={{
                    marginTop: 12,
                    fontSize: 9,
                    color: '#6B7280',
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    fontFamily: '"Orbitron", sans-serif',
                }}>
                    COMING SOON
                </div>
            )}
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
interface LandingPageProps {
    onSelect: (mode: 'intermediate' | 'junior') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
    injectCSS();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    // Phases: 'intro' → robot drops, 'welcome' → text types, 'main' → full UI
    const [phase, setPhase] = useState<'intro' | 'welcome' | 'main'>('intro');
    const [typedText, setTypedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [robotLanded, setRobotLanded] = useState(false);

    const FULL_TEXT = 'Welcome to LeapBlocks';

    // Phase timer
    useEffect(() => {
        // After drop animation (1.4s) mark landed
        const t1 = setTimeout(() => setRobotLanded(true), 1400);
        // Move to 'welcome' phase
        const t2 = setTimeout(() => setPhase('welcome'), 2200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Typewriter
    useEffect(() => {
        if (phase !== 'welcome') return;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setTypedText(FULL_TEXT.slice(0, i));
            if (i >= FULL_TEXT.length) {
                clearInterval(interval);
                setTimeout(() => setPhase('main'), 700);
            }
        }, 55);
        return () => clearInterval(interval);
    }, [phase]);

    // Cursor blink
    useEffect(() => {
        if (phase !== 'welcome') return;
        const iv = setInterval(() => setShowCursor(c => !c), 500);
        return () => clearInterval(iv);
    }, [phase]);

    // Shooting stars canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        let lastShot = 0;
        interface SS { x: number; y: number; vx: number; vy: number; life: number; max: number }
        let stars: SS[] = [];
        const spawn = () => stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * .6,
            vx: (Math.random() * 5 + 3) * (Math.random() < .5 ? 1 : -1),
            vy: Math.random() * 4 + 1,
            life: 0, max: 50,
        });
        const draw = (ts: number) => {
            rafRef.current = requestAnimationFrame(draw);
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (ts - lastShot > 900) { spawn(); lastShot = ts; }
            stars = stars.filter(s => s.life < s.max);
            for (const s of stars) {
                const a = 1 - s.life / s.max;
                ctx.save();
                ctx.globalAlpha = a;
                ctx.strokeStyle = `rgba(200,160,255,${a})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12);
                ctx.stroke();
                ctx.restore();
                s.x += s.vx; s.y += s.vy; s.life++;
            }
        };
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // Stars for background
    const [stars] = useState(() =>
        Array.from({ length: 100 }, (_, i) => ({
            x: Math.random() * 100, y: Math.random() * 100,
            size: Math.random() * 2.5 + .5, delay: Math.random() * 2.5, key: i,
        }))
    );

    // Shooting star decorations
    const [shoots] = useState(() =>
        Array.from({ length: 6 }, (_, i) => ({
            x: Math.random() * 80, y: Math.random() * 40,
            sx: (Math.random() * 120 + 40) * (i % 2 === 0 ? 1 : -1),
            sy: Math.random() * 60 + 20,
            dur: 2 + Math.random() * 2,
            delay: i * 1.4,
            key: i,
        }))
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, overflow: 'hidden',
            background: 'radial-gradient(ellipse at 30% 20%, #160832 0%, #08041a 60%, #020210 100%)',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
            {/* Nebula blobs */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-15%',
                width: '55vw', height: '55vw', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(100,40,200,.22) 0%, transparent 70%)',
                animation: 'lp-nebula 14s ease-in-out infinite', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', right: '-10%',
                width: '45vw', height: '45vw', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(200,80,100,.14) 0%, transparent 70%)',
                animation: 'lp-nebula 18s 3s ease-in-out infinite reverse', pointerEvents: 'none',
            }} />

            {/* Canvas for shooting stars */}
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

            {/* Static stars */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {stars.map(s => <Star key={s.key} x={s.x} y={s.y} size={s.size} delay={s.delay} />)}
            </div>

            {/* Decorative shooting stars */}
            {shoots.map(s => <ShootingStar key={s.key} x={s.x} y={s.y} sx={s.sx} sy={s.sy} dur={s.dur} delay={s.delay} />)}

            {/* ══════════ INTRO PHASE ══════════ */}
            {(phase === 'intro' || phase === 'welcome') && (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Drop trail */}
                    <div style={{
                        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
                        width: 4, height: 120,
                        background: 'linear-gradient(to bottom, transparent, rgba(150,100,255,.6))',
                        animation: 'lp-trail .8s .4s ease-out forwards',
                        borderRadius: 4,
                    }} />

                    {/* Robot with drop animation */}
                    <div style={{
                        position: 'relative',
                        animation: 'lp-robot-drop 1.4s cubic-bezier(.36,.07,.19,.97) both',
                        filter: 'drop-shadow(0 0 24px rgba(133,92,214,.9))',
                    }}>
                        <RobotSprite />
                        <ThrusterFlame side="left" />
                        <ThrusterFlame side="right" />
                    </div>

                    {/* Welcome typewriter */}
                    {phase === 'welcome' && (
                        <div style={{
                            marginTop: 28,
                            fontSize: 28,
                            fontWeight: 900,
                            fontFamily: '"Orbitron", sans-serif',
                            letterSpacing: '0.06em',
                            color: '#EDE9FE',
                            textShadow: '0 0 24px rgba(180,140,255,.7)',
                            animation: 'lp-fadein .4s both',
                            minHeight: 44,
                        }}>
                            {typedText}
                            {showCursor && <span style={{ animation: 'lp-cursor .5s steps(1) infinite', color: '#A78BFA' }}>|</span>}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ MAIN PHASE ══════════ */}
            {phase === 'main' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, animation: 'lp-fadein .5s ease-out' }}>

                    {/* ── Logo / Brand Frame ── */}
                    <div style={{
                        position: 'relative',
                        marginBottom: 32,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'lp-fadeup .6s .1s both',
                    }}>
                        {/* Orbiting particle ring */}
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} style={{
                                position: 'absolute',
                                top: '50%', left: '50%',
                                width: 8, height: 8,
                                marginTop: -4, marginLeft: -4,
                                borderRadius: '50%',
                                backgroundColor: ['#A78BFA', '#F472B6', '#22D3EE', '#FBBF24'][i],
                                ['--r' as any]: `${80 + i * 12}px`,
                                animation: `lp-orbit ${4 + i * 1.5}s ${i * .5}s linear infinite`,
                                boxShadow: `0 0 8px 2px ${['#A78BFA', '#F472B6', '#22D3EE', '#FBBF24'][i]}`,
                            }} />
                        ))}

                        {/* Frame box */}
                        <div style={{
                            position: 'relative',
                            padding: '20px 32px',
                            borderRadius: 24,
                            border: '2px solid transparent',
                            backgroundImage: 'linear-gradient(rgba(15,8,32,.9),rgba(15,8,32,.9)), linear-gradient(135deg,#9B6DFF,#F472B6,#22D3EE,#9B6DFF)',
                            backgroundOrigin: 'border-box',
                            backgroundClip: 'padding-box, border-box',
                            animation: 'lp-frame-glow 2.5s ease-in-out infinite',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        }}>
                            {/* Floating robot (smaller, hovering) */}
                            <div style={{
                                animation: 'lp-robot-float 3s ease-in-out infinite',
                                filter: 'drop-shadow(0 0 16px rgba(133,92,214,.85))',
                            }}>
                                <svg width="70" height="84" viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <radialGradient id="rb2-body" cx="50%" cy="40%" r="55%">
                                            <stop offset="0%" stopColor="#9B6DFF" />
                                            <stop offset="100%" stopColor="#4C1D95" />
                                        </radialGradient>
                                        <radialGradient id="rb2-head" cx="50%" cy="35%" r="55%">
                                            <stop offset="0%" stopColor="#C4B5FD" />
                                            <stop offset="100%" stopColor="#7C3AED" />
                                        </radialGradient>
                                        <radialGradient id="rb2-eye" cx="30%" cy="30%" r="60%">
                                            <stop offset="0%" stopColor="#67E8F9" />
                                            <stop offset="100%" stopColor="#0284C7" />
                                        </radialGradient>
                                        <filter id="rb2-glow">
                                            <feGaussianBlur stdDeviation="2" result="b" />
                                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>
                                    <line x1="55" y1="6" x2="55" y2="18" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
                                    <circle cx="55" cy="4" r="4" fill="#E879F9" filter="url(#rb2-glow)" />
                                    <rect x="28" y="18" width="54" height="42" rx="12" fill="url(#rb2-head)" />
                                    <circle cx="42" cy="36" r="9" fill="url(#rb2-eye)" filter="url(#rb2-glow)" />
                                    <circle cx="68" cy="36" r="9" fill="url(#rb2-eye)" filter="url(#rb2-glow)" />
                                    <circle cx="44" cy="34" r="4" fill="white" />
                                    <circle cx="70" cy="34" r="4" fill="white" />
                                    <circle cx="45" cy="35" r="2" fill="#1E3A5F" />
                                    <circle cx="71" cy="35" r="2" fill="#1E3A5F" />
                                    <rect x="38" y="50" width="34" height="6" rx="3" fill="rgba(0,0,0,.3)" />
                                    {[0, 1, 2, 3, 4].map(i => <rect key={i} x={40 + i * 6} y={51} width="3" height="4" rx="1" fill="#7C3AED" />)}
                                    <rect x="47" y="60" width="16" height="8" rx="4" fill="#6D28D9" />
                                    <rect x="22" y="68" width="66" height="44" rx="14" fill="url(#rb2-body)" />
                                    <rect x="36" y="76" width="38" height="24" rx="8" fill="rgba(0,0,0,.25)" />
                                    <circle cx="55" cy="84" r="6" fill="#F97316" filter="url(#rb2-glow)" />
                                    <circle cx="55" cy="84" r="3" fill="#FDE68A" />
                                    <circle cx="43" cy="94" r="2.5" fill="#22D3EE" />
                                    <circle cx="55" cy="94" r="2.5" fill="#A78BFA" />
                                    <circle cx="67" cy="94" r="2.5" fill="#F472B6" />
                                    <rect x="4" y="70" width="16" height="32" rx="8" fill="#7C3AED" />
                                    <rect x="90" y="70" width="16" height="32" rx="8" fill="#7C3AED" />
                                </svg>
                            </div>

                            {/* Shimmer title */}
                            <div style={{
                                fontSize: 30,
                                fontWeight: 900,
                                fontFamily: '"Orbitron", sans-serif',
                                letterSpacing: '0.08em',
                                background: 'linear-gradient(90deg, #C4B5FD, #F0ABFC, #67E8F9, #C4B5FD)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'lp-shimmer 3s linear infinite, lp-title-glow 2.5s ease-in-out infinite',
                            }}>
                                LEAPBLOCKS
                            </div>
                            <div style={{
                                fontSize: 12,
                                color: '#9CA3AF',
                                letterSpacing: '0.22em',
                                textTransform: 'uppercase',
                                fontFamily: '"Orbitron", sans-serif',
                            }}>
                                Learn · Build · Launch
                            </div>
                        </div>
                    </div>

                    {/* ── Subtitle ── */}
                    <div style={{
                        fontSize: 14, color: '#6B7280', marginBottom: 36,
                        letterSpacing: '.12em', textTransform: 'uppercase',
                        fontFamily: '"Orbitron", sans-serif',
                        animation: 'lp-fadeup .6s .2s both',
                    }}>
                        Choose your coding adventure
                    </div>

                    {/* ── Mode Cards ── */}
                    <div style={{
                        display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
                    }}>
                        <ModeCard
                            icon="🚀"
                            title="Intermediate"
                            subtitle="Blockly + Arduino hardware coding"
                            badge="READY"
                            badgeColor="#7C3AED"
                            color="#9B6DFF"
                            glow="rgba(133,92,214,.35)"
                            delay={0.3}
                            available={true}
                            onClick={() => onSelect('intermediate')}
                        />
                        <ModeCard
                            icon="🐻"
                            title="Junior"
                            subtitle="Icon blocks & visual stories"
                            badge="READY"
                            badgeColor="#F59E0B"
                            color="#FBBF24"
                            glow="rgba(251,191,36,.25)"
                            delay={0.45}
                            available={true}
                            onClick={() => onSelect('junior')}
                        />
                        <ModeCard
                            icon="🐍"
                            title="Python"
                            subtitle="Text-based Python coding"
                            badge="SOON"
                            badgeColor="#059669"
                            color="#34D399"
                            glow="rgba(52,211,153,.2)"
                            delay={0.6}
                            available={false}
                            onClick={() => { }}
                        />
                        <ModeCard
                            icon="🤖"
                            title="AI Studio"
                            subtitle="Machine learning & AI models"
                            badge="SOON"
                            badgeColor="#DB2777"
                            color="#F472B6"
                            glow="rgba(244,114,182,.2)"
                            delay={0.75}
                            available={false}
                            onClick={() => { }}
                        />
                    </div>

                    {/* ── Footer tip ── */}
                    <div style={{
                        marginTop: 36,
                        fontSize: 11, color: '#374151',
                        letterSpacing: '.08em',
                        fontFamily: '"Orbitron", sans-serif',
                        animation: 'lp-fadeup .6s .9s both',
                    }}>
                        v1.0 · Powered by Blockly & Electron
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
