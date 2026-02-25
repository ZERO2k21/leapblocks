import React, { useEffect, useRef, useState, useCallback } from 'react';

interface UploadModalProps {
    isOpen: boolean;
    progress: string; // Format: "25%: Configuring board..."
}

// ---------- Utility: inject keyframes once ----------
function injectAnimations() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ulm-anims')) return;
    const tag = document.createElement('style');
    tag.id = 'ulm-anims';
    tag.textContent = `
        @keyframes ulm-fadein {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        @keyframes ulm-starblink {
            0%,100% { opacity: 0.2; transform: scale(0.8); }
            50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes ulm-rumble {
            0%   { transform: rotate(-1.5deg) translate(-2px,  1px); }
            25%  { transform: rotate( 1.5deg) translate( 2px, -1px); }
            50%  { transform: rotate(-1deg)   translate(-1px,  2px); }
            75%  { transform: rotate( 1deg)   translate( 1px, -2px); }
            100% { transform: rotate(-1.5deg) translate(-2px,  1px); }
        }
        @keyframes ulm-launch {
            0%   { transform: translateY(0)    scale(1);   opacity: 1; }
            30%  { transform: translateY(-40px) scale(1.05); opacity: 1; }
            100% { transform: translateY(-420px) scale(0.3); opacity: 0; }
        }
        @keyframes ulm-flame-pulse {
            0%,100% { scaleY(1);   opacity: 0.9; }
            50%      { scaleY(1.5); opacity: 1;   }
        }
        @keyframes ulm-smoke-rise {
            0%   { transform: translateY(0)   scaleX(1)   opacity: 0.7; }
            100% { transform: translateY(-60px) scaleX(2.5) opacity: 0; }
        }
        @keyframes ulm-spark-fly {
            0%   { opacity: 1; transform: translate(0,0)          scale(1); }
            100% { opacity: 0; transform: translate(var(--sx),var(--sy)) scale(0); }
        }
        @keyframes ulm-bar-glow {
            0%,100% { box-shadow: 0 0 6px 2px rgba(149,88,255,0.5); }
            50%      { box-shadow: 0 0 18px 6px rgba(255,140,50,0.8); }
        }
        @keyframes ulm-label-float {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-3px); }
        }
        @keyframes ulm-success-ring {
            0%   { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes ulm-cloud-drift {
            0%   { transform: translateX(0)   scaleX(1) translateY(0); opacity: 0; }
            15%  { opacity: 0.55; }
            100% { transform: translateX(var(--cdx)) scaleX(var(--cds)) translateY(var(--cdy)); opacity: 0; }
        }
    `;
    document.head.appendChild(tag);
}

// ---------- Tiny helper components ----------

const Star: React.FC<{ x: number; y: number; size: number; delay: number }> = ({ x, y, size, delay }) => (
    <div style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'white',
        animation: `ulm-starblink ${1.5 + delay}s ${delay}s ease-in-out infinite`,
    }} />
);

interface SparkProps { x: number; y: number; color: string; sx: number; sy: number; delay: number; size: number }
const Spark: React.FC<SparkProps> = ({ x, y, color, sx, sy, delay, size }) => (
    <div style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        ['--sx' as any]: `${sx}px`,
        ['--sy' as any]: `${sy}px`,
        animation: `ulm-spark-fly 0.6s ${delay}s ease-out both`,
        pointerEvents: 'none',
    }} />
);

// ---------- Main Component ----------

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, progress }) => {
    injectAnimations();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    // Parse progress
    let percentage = 0;
    let message = '';
    const match = progress.match(/(\d+)%/);
    if (match) {
        percentage = parseInt(match[1], 10);
        const parts = progress.split(':');
        message = parts.length > 1 ? parts.slice(1).join(':').trim() : progress;
    } else {
        message = progress;
    }

    const launched = percentage >= 100;
    const isCompiling = percentage >= 40 && percentage < 70;
    const isUploading = percentage >= 70 && percentage < 100;

    // Stage label
    const stageLabel =
        percentage === 0 ? '🔌 Initializing...' :
            percentage < 15 ? '🔍 Checking Arduino CLI...' :
                percentage < 40 ? '💾 Saving Sketch...' :
                    percentage < 70 ? '⚙️ Compiling Code...' :
                        percentage < 100 ? '🚀 Uploading to Board...' :
                            '✅ Upload Complete!';

    // Stars (generated once)
    const [stars] = useState(() =>
        Array.from({ length: 80 }, (_, i) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2.5 + 0.5,
            delay: Math.random() * 2,
            key: i,
        }))
    );

    // Shooting stars on canvas
    useEffect(() => {
        if (!isOpen) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        let last = 0;

        interface ShootingStar { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; }
        let shootingStars: ShootingStar[] = [];

        const spawnStar = () => {
            shootingStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.5,
                vx: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? 1 : -1),
                vy: Math.random() * 3 + 1,
                life: 0,
                maxLife: 40,
            });
        };

        const draw = (ts: number) => {
            animFrameRef.current = requestAnimationFrame(draw);
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (ts - last > 800) {
                spawnStar();
                last = ts;
            }

            shootingStars = shootingStars.filter(s => s.life < s.maxLife);
            for (const s of shootingStars) {
                const alpha = 1 - s.life / s.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = `rgba(180, 150, 255, ${alpha})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 10, s.y - s.vy * 10);
                ctx.stroke();
                ctx.restore();
                s.x += s.vx;
                s.y += s.vy;
                s.life++;
            }
        };

        animFrameRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isOpen]);

    // Success sparks state
    const [showSparks, setShowSparks] = useState(false);
    const sparksTriggered = useRef(false);
    useEffect(() => {
        if (launched && !sparksTriggered.current) {
            sparksTriggered.current = true;
            setShowSparks(true);
            setTimeout(() => setShowSparks(false), 900);
        }
        if (!launched) sparksTriggered.current = false;
    }, [launched]);

    const sparks = showSparks
        ? Array.from({ length: 28 }, (_, i) => {
            const angle = (i / 28) * Math.PI * 2;
            const dist = 60 + Math.random() * 80;
            return {
                key: i,
                sx: Math.cos(angle) * dist,
                sy: Math.sin(angle) * dist,
                color: ['#FF6B35', '#FFD700', '#FF4757', '#FFA502', '#ECCC68', '#855CD6', '#ffffff'][i % 7],
                delay: Math.random() * 0.2,
                size: Math.random() * 6 + 4,
            };
        })
        : [];

    if (!isOpen) return null;

    // Flame height grows with percentage
    const flameScale = 0.5 + (percentage / 100) * 0.9;

    return (
        <div style={styles.overlay}>
            {/* Starfield canvas */}
            <canvas ref={canvasRef} style={styles.canvas} />

            {/* Static twinkling stars */}
            <div style={styles.starLayer}>
                {stars.map(s => <Star key={s.key} x={s.x} y={s.y} size={s.size} delay={s.delay} />)}
            </div>

            {/* Main card */}
            <div style={styles.card}>
                {/* Glow blob behind card */}
                <div style={{ ...styles.glowBall, background: launched ? 'radial-gradient(circle, rgba(50,255,120,0.35) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(133,92,214,0.4) 0%, transparent 70%)' }} />

                {/* TITLE */}
                <div style={styles.titleRow}>
                    <span style={{ ...styles.titleText, color: launched ? '#4ADE80' : '#C4B5FD' }}>
                        {launched ? '🎉 LAUNCH SUCCESSFUL!' : '🚀 UPLOADING CODE'}
                    </span>
                </div>

                {/* ======================== ROCKET SCENE ======================== */}
                <div style={styles.rocketScene}>

                    {/* Ground glow */}
                    <div style={{
                        ...styles.groundGlow,
                        opacity: launched ? 0 : (0.3 + percentage / 200),
                        width: `${60 + percentage}px`,
                    }} />

                    {/* Flame / exhaust plumes — grow with progress */}
                    {!launched && (
                        <div style={{
                            ...styles.flameWrapper,
                            transform: `scaleY(${flameScale})`,
                        }}>
                            {/* Outer flame */}
                            <div style={styles.flameOuter} />
                            {/* Mid flame */}
                            <div style={styles.flameMid} />
                            {/* Core flame */}
                            <div style={styles.flameCore} />
                        </div>
                    )}

                    {/* Launch smoke clouds */}
                    {isUploading && (
                        <div style={styles.smokeClouds}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} style={{
                                    ...styles.smokeCloud,
                                    ['--cdx' as any]: `${(i % 2 === 0 ? 1 : -1) * (30 + i * 8)}px`,
                                    ['--cdy' as any]: `${-(20 + i * 5)}px`,
                                    ['--cds' as any]: `${1.5 + i * 0.3}`,
                                    animationDelay: `${i * 0.15}s`,
                                    width: 18 + i * 6,
                                    height: 18 + i * 6,
                                    bottom: 4,
                                }} />
                            ))}
                        </div>
                    )}

                    {/* ROCKET SVG */}
                    <div style={{
                        ...styles.rocketWrapper,
                        animation: launched
                            ? 'ulm-launch 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                            : 'ulm-rumble 0.08s linear infinite',
                    }}>
                        <svg width="90" height="140" viewBox="0 0 90 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* --- Exhaust nozzle --- */}
                            <rect x="36" y="112" width="18" height="10" rx="3" fill="#444" />

                            {/* --- Main body --- */}
                            {/* Shadow gradient */}
                            <defs>
                                <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6C3FBD" />
                                    <stop offset="50%" stopColor="#9B6DFF" />
                                    <stop offset="100%" stopColor="#5A2E9C" />
                                </linearGradient>
                                <linearGradient id="noseGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#D4BBFF" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                                <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#7C3AED" />
                                    <stop offset="100%" stopColor="#4C1D95" />
                                </linearGradient>
                                <radialGradient id="windowGrad" cx="50%" cy="40%" r="50%">
                                    <stop offset="0%" stopColor="#E0F2FF" />
                                    <stop offset="100%" stopColor="#60A5FA" />
                                </radialGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>

                            {/* Body */}
                            <rect x="28" y="40" width="34" height="72" rx="6" fill="url(#bodyGrad)" />

                            {/* Nose cone */}
                            <path d="M28 42 Q45 2 62 42 Z" fill="url(#noseGrad)" />

                            {/* Left wing */}
                            <path d="M28 90 L10 118 L30 112 Z" fill="url(#wingGrad)" stroke="#7C3AED" strokeWidth="0.8" />
                            {/* Right wing */}
                            <path d="M62 90 L80 118 L60 112 Z" fill="url(#wingGrad)" stroke="#7C3AED" strokeWidth="0.8" />

                            {/* Body detail stripes */}
                            <rect x="28" y="70" width="34" height="3" rx="1" fill="rgba(255,255,255,0.12)" />
                            <rect x="28" y="78" width="34" height="2" rx="1" fill="rgba(255,255,255,0.08)" />

                            {/* Window */}
                            <circle cx="45" cy="55" r="11" fill="url(#windowGrad)" filter="url(#glow)" />
                            <circle cx="45" cy="55" r="11" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                            {/* Window reflection */}
                            <ellipse cx="41" cy="51" rx="4" ry="2.5" fill="white" opacity="0.4" transform="rotate(-30 41 51)" />

                            {/* LeapBlocks "LB" logo on body */}
                            <text x="39" y="96" fontSize="9" fill="white" opacity="0.7" fontWeight="bold" fontFamily="monospace">LB</text>

                            {/* Tip dot */}
                            <circle cx="45" cy="5" r="3" fill="#F5D0FE" opacity="0.8" />
                        </svg>
                    </div>

                    {/* Success sparks burst */}
                    {sparks.map(s => (
                        <Spark
                            key={s.key}
                            x={45}
                            y={80}
                            sx={s.sx}
                            sy={s.sy}
                            color={s.color}
                            delay={s.delay}
                            size={s.size}
                        />
                    ))}

                    {/* Expanding ring on success */}
                    {launched && (
                        <>
                            <div style={{ ...styles.successRing, animationDelay: '0s' }} />
                            <div style={{ ...styles.successRing, animationDelay: '0.25s' }} />
                            <div style={{ ...styles.successRing, animationDelay: '0.5s' }} />
                        </>
                    )}
                </div>

                {/* ======================== STAGE CHIPS ======================== */}
                <div style={styles.stageRow}>
                    {[
                        { label: 'Init', pct: 5 },
                        { label: 'Save', pct: 15 },
                        { label: 'Compile', pct: 40 },
                        { label: 'Upload', pct: 70 },
                        { label: 'Done', pct: 100 },
                    ].map(({ label, pct }) => {
                        const done = percentage >= pct;
                        const active = percentage >= pct - 30 && percentage < pct + 5;
                        return (
                            <div key={label} style={{
                                ...styles.stageChip,
                                backgroundColor: done ? 'rgba(133,92,214,0.6)' : 'rgba(255,255,255,0.08)',
                                border: active ? '1px solid #C4B5FD' : '1px solid rgba(255,255,255,0.12)',
                                color: done ? '#EDE9FE' : '#6B7280',
                                transform: active ? 'scale(1.08)' : 'scale(1)',
                                animation: active ? 'ulm-label-float 0.8s ease-in-out infinite' : 'none',
                            }}>
                                {done ? '✓ ' : ''}{label}
                            </div>
                        );
                    })}
                </div>

                {/* ======================== PROGRESS BAR ======================== */}
                <div style={styles.barOuter}>
                    <div style={{
                        ...styles.barFill,
                        width: `${percentage}%`,
                        background: launched
                            ? 'linear-gradient(90deg,#4ADE80,#86EFAC)'
                            : isCompiling
                                ? 'linear-gradient(90deg,#F97316,#FACC15,#855CD6)'
                                : isUploading
                                    ? 'linear-gradient(90deg,#855CD6,#F97316,#FFD700)'
                                    : 'linear-gradient(90deg,#6C3FBD,#9B6DFF)',
                        animation: !launched ? 'ulm-bar-glow 1s ease-in-out infinite' : 'none',
                    }}>
                        {/* shimmer */}
                        <div style={styles.barShimmer} />
                    </div>
                </div>

                {/* ======================== LABELS ======================== */}
                <div style={styles.infoRow}>
                    <span style={styles.stageLabel}>{stageLabel}</span>
                    <span style={{ ...styles.pctLabel, color: launched ? '#4ADE80' : '#C4B5FD' }}>{percentage}%</span>
                </div>

                {message ? (
                    <div style={styles.msgBox}>
                        <span style={styles.msgDot} />
                        {message}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

// ---------- Styles ----------
const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #0d0820 0%, #050510 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'ulm-fadein 0.35s ease-out',
        overflow: 'hidden',
    },
    canvas: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
    },
    starLayer: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
    },
    card: {
        position: 'relative',
        background: 'rgba(15, 8, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        borderRadius: '28px',
        border: '1px solid rgba(133, 92, 214, 0.4)',
        padding: '36px 38px 32px',
        width: '460px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 0 60px rgba(133,92,214,0.35), 0 30px 60px rgba(0,0,0,0.7)',
        overflow: 'hidden',
    },
    glowBall: {
        position: 'absolute',
        top: '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        pointerEvents: 'none',
        transition: 'background 0.6s',
    },
    titleRow: {
        marginBottom: '14px',
        zIndex: 1,
    },
    titleText: {
        fontSize: '20px',
        fontWeight: 800,
        letterSpacing: '0.08em',
        fontFamily: '"Segoe UI", sans-serif',
        textShadow: '0 0 20px currentColor',
        transition: 'color 0.5s',
    },

    // ---- Rocket Scene ----
    rocketScene: {
        position: 'relative',
        width: '160px',
        height: '200px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginBottom: '16px',
        zIndex: 1,
    },
    rocketWrapper: {
        position: 'absolute',
        bottom: '28px',
        transformOrigin: 'bottom center',
        filter: 'drop-shadow(0 0 16px rgba(133,92,214,0.8))',
        zIndex: 3,
    },
    groundGlow: {
        position: 'absolute',
        bottom: '10px',
        height: '16px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,160,50,0.85) 0%, transparent 80%)',
        filter: 'blur(6px)',
        transition: 'width 0.4s, opacity 0.4s',
        zIndex: 2,
    },

    // Flame layers (positioned under rocket nozzle)
    flameWrapper: {
        position: 'absolute',
        bottom: '22px',
        width: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transformOrigin: 'top center',
        zIndex: 2,
        transition: 'transform 0.4s',
    },
    flameOuter: {
        width: '30px',
        height: '50px',
        background: 'linear-gradient(to bottom, rgba(255,80,0,0.0) 0%, rgba(255,120,0,0.7) 40%, rgba(255,200,50,0.9) 100%)',
        borderRadius: '50% 50% 30% 30%',
        filter: 'blur(5px)',
        animation: 'ulm-flame-pulse 0.15s ease-in-out infinite alternate',
    },
    flameMid: {
        position: 'absolute',
        top: '8px',
        width: '18px',
        height: '38px',
        background: 'linear-gradient(to bottom, rgba(255,180,0,0.0) 0%, rgba(255,220,80,0.9) 60%, rgba(255,255,200,1) 100%)',
        borderRadius: '50% 50% 30% 30%',
        filter: 'blur(3px)',
        animation: 'ulm-flame-pulse 0.12s ease-in-out infinite alternate-reverse',
    },
    flameCore: {
        position: 'absolute',
        top: '14px',
        width: '8px',
        height: '24px',
        background: 'linear-gradient(to bottom, transparent 0%, #fff 100%)',
        borderRadius: '50% 50% 30% 30%',
        filter: 'blur(1.5px)',
    },

    smokeClouds: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1,
    },
    smokeCloud: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: '50%',
        backgroundColor: 'rgba(180,150,255,0.18)',
        filter: 'blur(5px)',
        animation: 'ulm-cloud-drift 0.9s ease-out infinite',
    },

    successRing: {
        position: 'absolute',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid rgba(74,222,128,0.8)',
        animation: 'ulm-success-ring 0.8s ease-out forwards',
        pointerEvents: 'none',
    },

    // ---- Stage chips ----
    stageRow: {
        display: 'flex',
        gap: '6px',
        marginBottom: '18px',
        zIndex: 1,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    stageChip: {
        fontSize: '10px',
        fontWeight: 700,
        padding: '4px 8px',
        borderRadius: '20px',
        transition: 'all 0.3s ease',
        fontFamily: '"Segoe UI", sans-serif',
        letterSpacing: '0.04em',
    },

    // ---- Progress bar ----
    barOuter: {
        width: '100%',
        height: '14px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '14px',
        zIndex: 1,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    barFill: {
        height: '100%',
        borderRadius: '10px',
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.5s',
        position: 'relative',
        overflow: 'hidden',
    },
    barShimmer: {
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '60%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
        animation: 'ulm-label-float 1.5s linear infinite', // repurposed for movement
    },

    // ---- Info row ----
    infoRow: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        zIndex: 1,
    },
    stageLabel: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#D1D5DB',
        fontFamily: '"Segoe UI", sans-serif',
        animation: 'ulm-label-float 1.2s ease-in-out infinite',
    },
    pctLabel: {
        fontSize: '22px',
        fontWeight: 900,
        fontFamily: '"Segoe UI", sans-serif',
        letterSpacing: '-0.02em',
        textShadow: '0 0 14px currentColor',
        transition: 'color 0.5s',
    },

    // ---- Message box ----
    msgBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#6B7280',
        fontFamily: 'monospace',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '8px',
        padding: '6px 12px',
        width: '100%',
        zIndex: 1,
    },
    msgDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: '#9B6DFF',
        flexShrink: 0,
        animation: 'ulm-starblink 0.8s ease-in-out infinite',
    },
};

export default UploadModal;
