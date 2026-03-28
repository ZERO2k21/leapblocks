import React, { useEffect, useRef, useState } from 'react';

// ─── inject keyframes once ───────────────────────────────────────────────────
function injectCSS() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('lp-anims')) return;
    const s = document.createElement('style');
    s.id = 'lp-anims';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        @keyframes lp-fadein    { from { opacity:0 } to { opacity:1 } }
        @keyframes lp-fadeup    { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }

        @keyframes lp-robot-launch {
            0%   { transform:translateY(300px) rotate(-8deg) scale(.6); opacity:0 }
            55%  { transform:translateY(-14px) rotate(2deg)  scale(1.03); opacity:1 }
            70%  { transform:translateY(8px)   rotate(-1deg) scale(.98) }
            85%  { transform:translateY(-4px)  rotate(0deg)  scale(1.01) }
            100% { transform:translateY(0)     rotate(0deg)  scale(1);   opacity:1 }
        }

        @keyframes lp-robot-float {
            0%,100% { transform:translateY(0) rotate(-0.5deg) }
            50%     { transform:translateY(-8px) rotate(0.5deg) }
        }

        @keyframes lp-cursor { 0%,100%{opacity:1} 50%{opacity:0} }

        @keyframes lp-bg-shift {
            0%,100% { background-position: 0% 50% }
            50%     { background-position: 100% 50% }
        }

        @keyframes lp-float-shape {
            0%,100% { transform: translateY(0) rotate(0deg) }
            50%     { transform: translateY(-20px) rotate(5deg) }
        }

        /* Floating orbs */
        @keyframes lp-orb-float-a {
            0%,100% { transform: translateY(0) scale(1); }
            50%     { transform: translateY(-24px) scale(1.02); }
        }
        @keyframes lp-orb-float-b {
            0%,100% { transform: translateY(0) scale(1); }
            50%     { transform: translateY(20px) scale(0.98); }
        }

        /* Badge pulse */
        @keyframes lp-badge-pulse {
            0%,100% { transform: scale(1); opacity: 1; }
            50%     { transform: scale(1.5); opacity: 0.6; }
        }

        @keyframes lp-spotlight {
            0% { transform: translateX(-200%) skewX(-45deg); opacity: 0; }
            10% { opacity: 0.2; }
            90% { opacity: 0.2; }
            100% { transform: translateX(300%) skewX(-45deg); opacity: 0; }
        }

        @keyframes lp-grid-flow {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 40px 40px, 0 0; }
        }

        @keyframes lp-card-pulse {
            0%,100% { box-shadow: 0 4px 20px rgba(133,92,214,0.08) }
            50%     { box-shadow: 0 8px 32px rgba(133,92,214,0.18) }
        }

        @keyframes lp-toast-in {
            from { opacity:0; transform:translate(-50%, 20px) }
            to   { opacity:1; transform:translate(-50%, 0) }
        }
        @keyframes lp-toast-out {
            from { opacity:1; transform:translate(-50%, 0) }
            to   { opacity:0; transform:translate(-50%, -20px) }
        }

        @keyframes lp-wave {
            0%,100% { transform: rotate(0deg) }
            25%     { transform: rotate(14deg) }
            50%     { transform: rotate(-8deg) }
            75%     { transform: rotate(12deg) }
        }

        @keyframes lp-shadow-pulse {
            0%,100% { transform: scaleX(1); opacity:0.15 }
            50%     { transform: scaleX(1.1); opacity:0.25 }
        }

        @keyframes lp-orbit-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes lp-card-float {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(-6px); }
        }

        @keyframes lp-card-shimmer {
            0%   { transform: translateX(-160%) skewX(-18deg); opacity: 0; }
            16%  { opacity: 0.35; }
            100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }

        @keyframes lp-card-wave {
            0%,100% { transform: translateY(0) scaleY(1); }
            50%     { transform: translateY(-6px) scaleY(1.08); }
        }
    `;
    document.head.appendChild(s);
}

// ─── Mode card ───────────────────────────────────────────────────────────────
interface ModeCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    color: string;
    gradient: string;
    delay: number;
    available: boolean;
    patternType?: string;
    tag?: string;
    chips?: string[];
    cta?: string;
    onClick: () => void;
    highlighted?: boolean;
}

const renderCardDecorations = (patternType: string, color: string, gradient: string, hovered: boolean) => {
    if (patternType === 'grid') {
        return (
            <>
                <div style={{
                    position: 'absolute',
                    top: 18,
                    right: 18,
                    width: 96,
                    height: 96,
                    borderRadius: 22,
                    opacity: hovered ? 0.2 : 0.12,
                    backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                    color,
                    transform: hovered ? 'rotate(8deg) scale(1.04)' : 'rotate(4deg)',
                    transition: 'all .45s ease',
                }} />
                <div style={{
                    position: 'absolute',
                    top: 34,
                    left: 18,
                    fontSize: 34,
                    fontWeight: 700,
                    fontFamily: '"Orbitron", sans-serif',
                    color: `${color}55`,
                }}>{'{'}</div>
            </>
        );
    }

    if (patternType === 'lines') {
        return (
            <>
                <div style={{
                    position: 'absolute',
                    inset: 'auto -24px 46px auto',
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    border: `1px solid ${color}33`,
                    animation: 'lp-orbit-slow 14s linear infinite',
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -5,
                        left: '50%',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 14px ${color}88`,
                    }} />
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: 26,
                    left: 22,
                    right: 22,
                    display: 'flex',
                    gap: 6,
                    opacity: hovered ? 0.35 : 0.2,
                    transition: 'opacity .35s ease',
                }}>
                    {[22, 34, 18, 42, 28, 38].map((height, index) => (
                        <div
                            key={height}
                            style={{
                                flex: 1,
                                height,
                                borderRadius: 999,
                                background: gradient,
                                transformOrigin: 'bottom center',
                                animation: `lp-card-wave 1.6s ${index * 0.14}s ease-in-out infinite`,
                            }}
                        />
                    ))}
                </div>
            </>
        );
    }

    if (patternType === 'waves') {
        return (
            <>
                <div style={{
                    position: 'absolute',
                    top: 22,
                    right: -14,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${color}44 0%, transparent 65%)`,
                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform .45s ease',
                }} />
                <div style={{
                    position: 'absolute',
                    inset: 'auto 18px 20px 18px',
                    height: 52,
                    borderRadius: 30,
                    opacity: hovered ? 0.25 : 0.14,
                    background: `repeating-radial-gradient(circle at 0 100%, ${color} 0 6px, transparent 6px 20px)`,
                }} />
            </>
        );
    }

    return (
        <>
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: hovered ? 0.1 : 0.05,
                transition: 'opacity .4s ease, transform .4s ease',
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 2px, transparent 0)',
                backgroundSize: '16px 16px',
                color,
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }} />
            <div style={{
                position: 'absolute',
                top: 16,
                right: 18,
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `${color}22`,
                boxShadow: `0 0 0 12px ${color}12`,
                animation: 'lp-card-float 4s ease-in-out infinite',
            }} />
        </>
    );
};

const ModeCard: React.FC<ModeCardProps> = ({
    icon,
    title,
    subtitle,
    color,
    gradient,
    delay,
    available,
    patternType = 'dots',
    tag = 'Studio',
    chips = [],
    cta = 'Open',
    onClick,
    highlighted = false,
}) => {
    const [hovered, setHovered] = useState(false);
    const [pointer, setPointer] = useState({ x: 50, y: 50 });

    const isEffectiveHovered = hovered || highlighted;
    const rotateX = hovered ? (50 - pointer.y) / 10 : (highlighted ? -2 : 0);
    const rotateY = hovered ? (pointer.x - 50) / 10 : 0;

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false);
                setPointer({ x: 50, y: 50 });
            }}
            onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                setPointer({ x, y });
            }}
            style={{
                position: 'relative',
                width: 196,
                height: 240,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.72))',
                border: `1px solid ${hovered ? `${color}66` : 'rgba(255,255,255,0.75)'}`,
                borderRadius: 28,
                padding: '14px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform .35s ease, box-shadow .35s ease, border-color .35s ease',
                transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${isEffectiveHovered ? -10 : 0}px)`,
                boxShadow: isEffectiveHovered
                    ? `0 32px 80px ${color}66, 0 12px 28px rgba(15,23,42,0.15), 0 0 45px ${color}33`
                    : '0 12px 30px rgba(15,23,42,0.08)',
                animation: `lp-fadeup .5s ${delay}s both`,
                overflow: 'hidden',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
            }}
        >
            <div style={{
                position: 'absolute',
                inset: 0,
                background: gradient,
                opacity: isEffectiveHovered ? 0.18 : 0.08,
                transition: 'opacity .35s ease',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.15) 34%, transparent 60%)`,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '-45%',
                width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                opacity: hovered ? 1 : 0,
                animation: hovered ? 'lp-card-shimmer 1.3s ease-out' : 'none',
                pointerEvents: 'none',
            }} />
            {renderCardDecorations(patternType, color, gradient, hovered)}



            <div style={{
                position: 'relative',
                zIndex: 1,
                width: 64,
                height: 64,
                borderRadius: 20,
                background: isEffectiveHovered ? gradient : 'rgba(255,255,255,0.78)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                boxShadow: isEffectiveHovered ? `0 16px 28px ${color}33` : '0 8px 20px rgba(15,23,42,0.08)',
                transition: 'all .35s ease',
                transform: isEffectiveHovered ? 'scale(1.06) rotate(4deg)' : 'scale(1)',
                border: '1px solid rgba(255,255,255,0.84)',
            }}>
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
            </div>

            <div style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 16,
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: 6,
                fontFamily: '"Poppins", sans-serif',
                lineHeight: 1.1,
            }}>
                {title}
            </div>

            <div style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 11.5,
                color: '#526176',
                lineHeight: 1.5,
                fontFamily: '\"Inter\", sans-serif',
                marginBottom: 10,
                minHeight: 48,
            }}>
                {subtitle}
            </div>

            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginTop: 'auto',
            }}>
                {chips.map((chip, index) => (
                    <div
                        key={`${title}-${chip}`}
                        style={{
                            padding: '6px 8px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.72)',
                            border: '1px solid rgba(255,255,255,0.85)',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#334155',
                            animation: `lp-card-float 4s ${index * 0.18}s ease-in-out infinite`,
                        }}
                    >
                        {chip}
                    </div>
                ))}
            </div>

        </div>
    );
};

// ─── Toast notification ──────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
    if (!visible) return null;
    return (
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
            zIndex: 100,
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
            {message}
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

// ─── Network Background ──────────────────────────────────────────────────────
const NetworkBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: -1000, y: -1000, isDragging: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;

        const resize = () => {
            canvas!.width = window.innerWidth;
            canvas!.height = window.innerHeight;
            initParticles();
        };

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.radius = Math.random() * 2 + 1;
                const colors = ['#855CD6', '#3B82F6', '#94a3b8', '#cbd5e1'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;

                const dx = mouse.current.x - this.x;
                const dy = mouse.current.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const interactionDist = mouse.current.isDragging ? 220 : 120;

                if (distance < interactionDist) {
                    const force = (interactionDist - distance) / interactionDist;
                    // Attract slightly on normal hover, pull strongly on drag
                    const pull = mouse.current.isDragging ? 2.5 : -1.2;
                    this.x -= (dx / distance) * force * pull;
                    this.y -= (dy / distance) * force * pull;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            const numParticles = Math.min(Math.floor((canvas!.width * canvas!.height) / 11000), 120);
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas!.width, canvas!.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 140) {
                        ctx.beginPath();
                        const opacity = 0.2 * (1 - distance / 140);
                        ctx.strokeStyle = `rgba(133, 92, 214, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        });
        window.addEventListener('mousedown', () => mouse.current.isDragging = true);
        window.addEventListener('mouseup', () => mouse.current.isDragging = false);
        window.addEventListener('mouseout', () => {
            mouse.current.x = -1000;
            mouse.current.y = -1000;
        });

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};


interface LandingPageProps {
    onSelect: (mode: 'intermediate' | 'junior' | 'python' | 'appinventor' | any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
    useEffect(() => {
        injectCSS();
    }, []);

    // Phases: 'intro' → robot drops, 'welcome' → text types, 'main' → full UI
    const hasSeenIntro = sessionStorage.getItem('leapblocks_intro_seen') === 'true';
    const [phase, setPhase] = useState<'intro' | 'welcome' | 'main'>(hasSeenIntro ? 'main' : 'intro');
    const [typedText, setTypedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

    // Show toast for coming soon
    const showComingSoon = (name: string) => {
        setToast({ message: `${name} is coming soon.`, visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 2500);
    };

    // Cards data
    const mainCards = [

        {
            icon: (
                <img
                    src="/assets/sprites/robot/robot_idle.svg"
                    alt="Junior Blocks"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'LEAPLAB IGNITE', subtitle: 'Where curiosity turns into action.',
            color: '#c77e00ff', gradient: 'linear-gradient(135deg, #ffbb44ff, #fe8b08ff)',
            available: true, patternType: 'dots', tag: 'Play first', chips: ['Big icons', 'Easy stories'], cta: 'Start studio', onClick: () => onSelect('junior'),
        },
        {
            icon: (
                <img
                    src="/assets/arduino_icon.png"
                    alt="Intermediate Blocks"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'LEAPLAB CIRCUIT', subtitle: 'Build logic, connect ideas, power systems.',
            color: '#5a29bdff', gradient: 'linear-gradient(135deg, #855CD6, #370091ff)',
            available: true, patternType: 'lines', tag: 'Build robots', chips: ['Sensors', 'Logic flow'], cta: 'Open hardware', onClick: () => onSelect('intermediate'),
        },
        {
            icon: (
                <img
                    src="/assets/python_icon.png"
                    alt="Python IDE"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'LEAPLAB CODEX', subtitle: 'A powerful space where real coding begins.',
            color: '#3776ab', gradient: 'linear-gradient(135deg, #3776ab, #ffd343)',
            available: true, patternType: 'grid', tag: 'Code deeper', chips: ['Text editor', 'Sprite APIs'], cta: 'Write code', onClick: () => onSelect('python'),
        },
        {
            icon: (
                <img
                    src="/assets/ml_brain_icon.png"
                    alt="Advanced Blocks"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'LEAPLAB NEURA', subtitle: 'Inspired by neural networks and AI thinking.',
            color: '#2c5fb3ff', gradient: 'linear-gradient(135deg, #5a99ffff, #033cd7ff)',
            available: false, patternType: 'waves', tag: 'AI lab', chips: ['Vision tools', 'Smart blocks'], cta: 'Preview lane', onClick: () => showComingSoon('Advanced'),
        },
    ];

    const extraCards = [
        {
            icon: (
                <img
                    src="/assets/creocad_icon.png"
                    alt="Creocad"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'LEAPLAB FORGE', subtitle: 'Where ideas are shaped into real designs.',
            color: '#51c1bdff', gradient: 'linear-gradient(135deg, #51c1bdff, #00fefaff)',
            available: false, patternType: 'grid', tag: '3D build', chips: ['Model space', 'Prototype'], cta: 'See preview', onClick: () => showComingSoon('Creocad')
        },
        {
            icon: (
                <img
                    src="/assets/app_game_dev_icon.png"
                    alt="App & Game Development"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'LEAPLAB STUDIO', subtitle: 'Create apps, games, and interactive experiences.',
            color: '#EF4444', gradient: 'linear-gradient(135deg, #ff6a6aff, #b70000ff)',
            available: true, patternType: 'lines', tag: 'Game lab', chips: ['Scenes', 'Interactions'], cta: 'Start studio', onClick: () => onSelect('appforge'),
        },
        {
            icon: (
                <img
                    src="/assets/quiz_icon.png"
                    alt="Quiz"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'Quiz', subtitle: 'A focused path for fast classroom checks and fun learning challenges.',
            color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #00faabff)',
            available: false, patternType: 'dots', tag: 'Fast checks', chips: ['Questions', 'Scoreboards'], cta: 'Join queue', onClick: () => showComingSoon('Quiz'),
        },
    ];

    const FULL_TEXT = 'Welcome to LeapBlocks';

    // Phase timer
    useEffect(() => {
        if (hasSeenIntro) return;
        const t1 = setTimeout(() => setPhase('welcome'), 1800);
        return () => clearTimeout(t1);
    }, [hasSeenIntro]);

    // Typewriter
    useEffect(() => {
        if (phase !== 'welcome') return;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setTypedText(FULL_TEXT.slice(0, i));
            if (i >= FULL_TEXT.length) {
                clearInterval(interval);
                sessionStorage.setItem('leapblocks_intro_seen', 'true');
                setTimeout(() => setPhase('main'), 600);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [phase]);

    // Cursor blink
    useEffect(() => {
        if (phase !== 'welcome') return;
        const iv = setInterval(() => setShowCursor(c => !c), 500);
        return () => clearInterval(iv);
    }, [phase]);

    // Cycling highlight effect
    useEffect(() => {
        if (highlightIndex === null) return;
        const totalCards = mainCards.length + extraCards.length;
        const timer = setTimeout(() => {
            setHighlightIndex((highlightIndex + 1) % totalCards);
        }, 800);
        return () => clearTimeout(timer);
    }, [highlightIndex, mainCards.length, extraCards.length]);





    const logoAnimationDelay = hasSeenIntro ? 0 : 0.4;
    const subtitleAnimationDelay = hasSeenIntro ? 0.08 : 0.8;
    const getCardAnimation = (index: number, isExtra = false) => {
        const start = hasSeenIntro ? 0.1 : 1.2;
        const adjustedIndex = isExtra ? index + 4 : index;
        const step = hasSeenIntro ? 0.07 : 0.1;
        return `lp-fadeup .7s ${start + adjustedIndex * step}s both`;
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, overflow: 'auto',
            background: 'radial-gradient(rgba(133,92,214,0.06) 1px, transparent 1px), linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', // Flowing animated background
            backgroundSize: '40px 40px, 100% 100%',
            animation: phase === 'main' ? 'lp-grid-flow 30s linear infinite' : 'none',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            minHeight: '100vh',
        }}>
            {/* Topbar */}
            <nav style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 44px',
                background: 'rgba(13, 10, 31, 0.96)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(133,92,214,0.24)',
                zIndex: 100,
                animation: phase === 'main' ? 'lp-fadeup 0.6s ease-out both' : 'none',
                opacity: phase === 'main' ? 1 : 0,
                pointerEvents: phase === 'main' ? 'auto' : 'none',
            }}>
                {/* Left: Logo + Nav Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
                    {/* Logo */}
                    <div
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <img
                            src="/assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg"
                            alt="LeapBlocks"
                            style={{
                                height: 60,
                                objectFit: 'contain',
                                filter: 'brightness(0) invert(1)',
                                transform: 'scale(2.2)',
                                transformOrigin: 'left center',
                                margin: '0 24px 0 0'
                            } as React.CSSProperties}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/leapblocks_logo.svg';
                                (e.target as HTMLImageElement).style.filter = 'none';
                            }}
                        />
                    </div>

                    {/* Nav Links */}
                    <div style={{ display: 'flex', gap: 2 }}>
                        {['Explore', 'Tutorials'].map((link, i) => (
                            <div
                                key={link}
                                style={{
                                    padding: '7px 15px', borderRadius: 999,
                                    fontSize: 13.5, fontWeight: i === 0 ? 600 : 500,
                                    color: i === 0 ? '#C084FC' : '#94A3B8',
                                    background: i === 0 ? 'rgba(133,92,214,0.16)' : 'transparent',
                                    cursor: 'pointer', transition: '0.2s',
                                    fontFamily: '"Outfit", sans-serif',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(133,92,214,0.16)';
                                    e.currentTarget.style.color = '#C084FC';
                                }}
                                onMouseLeave={(e) => {
                                    if (i !== 0) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#94A3B8';
                                    }
                                }}
                                onClick={() => { if (i !== 0) showComingSoon(link); }}
                            >
                                {link}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Auth Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        style={{
                            padding: '8px 18px', borderRadius: 11, fontSize: 13.5, fontWeight: 600,
                            color: '#DDD6FF', background: 'transparent',
                            border: '1.5px solid rgba(133,92,214,0.3)',
                            cursor: 'pointer', transition: '0.2s',
                            fontFamily: '"Outfit", sans-serif',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#C084FC';
                            e.currentTarget.style.background = 'rgba(133,92,214,0.1)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(133,92,214,0.3)';
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#DDD6FF';
                        }}
                        onClick={() => showComingSoon('Log in')}
                    >
                        Log in
                    </button>
                    <button
                        style={{
                            padding: '9px 20px', borderRadius: 11, fontSize: 13.5, fontWeight: 700,
                            background: '#855CD6', color: '#fff', border: 'none',
                            cursor: 'pointer', transition: '0.2s',
                            fontFamily: '"Outfit", sans-serif',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#6D28D9';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#855CD6';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => showComingSoon('Sign up')}
                    >
                        Get started free →
                    </button>
                </div>
            </nav>
            {/* 3D Network Background Interactive Layer */}
            <NetworkBackground />

            {/* ══════════ INTRO PHASE ══════════ */}
            {(phase === 'intro' || phase === 'welcome') && (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto' }}>

                    {/* Robot with drop animation */}
                    <div style={{
                        position: 'relative',
                        animation: 'lp-robot-launch 1.4s cubic-bezier(.36,.07,.19,.97) both',
                    }}>
                        {/* Robot mascot image */}
                        <img
                            src="/assets/sprites/robot/robot_idle.svg"
                            alt="LeapBlocks Robot"
                            style={{
                                width: 140,
                                height: 140,
                                filter: 'drop-shadow(0 8px 24px rgba(133,92,214,0.35))',
                            }}
                            onError={(e) => {
                                // Fallback to emoji if image not found
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>

                    {/* Shadow under robot */}
                    <div style={{
                        width: 80, height: 12,
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse, rgba(133,92,214,0.2) 0%, transparent 70%)',
                        animation: 'lp-shadow-pulse 3s ease-in-out infinite',
                        marginTop: -4,
                    }} />

                    {/* Welcome typewriter */}
                    {phase === 'welcome' && (
                        <div style={{
                            marginTop: 24,
                            fontSize: 32,
                            fontWeight: 800,
                            fontFamily: '"Poppins", sans-serif',
                            letterSpacing: '-0.01em',
                            background: 'linear-gradient(135deg, #855CD6, #6D28D9, #3B82F6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'lp-fadein .4s both',
                            minHeight: 48,
                        }}>
                            {typedText}
                            {showCursor && <span style={{
                                animation: 'lp-cursor .5s steps(1) infinite',
                                WebkitTextFillColor: '#855CD6',
                            }}>|</span>}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ MAIN PHASE ══════════ */}
            {phase === 'main' && (
                <div style={{
                    display: 'flex', flexDirection: 'row', gap: 0,
                    animation: 'lp-fadein .5s ease-out',
                    padding: '64px 0 0 0', width: '100%',
                    minHeight: '100vh',
                    position: 'relative',
                }}>

                    {/* ── Spotlight Strip ── */}
                    <div style={{
                        position: 'absolute',
                        top: 0, bottom: 0, left: '-20%',
                        width: '40%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                        animation: 'lp-spotlight 6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }} />

                    {/* ══════ LEFT SIDE — Hero Content ══════ */}
                    <div style={{
                        position: 'sticky',
                        top: 64,
                        alignSelf: 'flex-start',
                        width: '50%',
                        minWidth: 360,
                        padding: '36px 28px 36px 48px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        zIndex: 2,
                        overflow: 'hidden',
                        height: 'calc(100vh - 64px)',
                        justifyContent: 'center',
                    }}>
                        {/* ── Floating Orbs ── */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                            <div style={{
                                position: 'absolute', width: 280, height: 280, borderRadius: '50%',
                                background: '#EDE8FF', top: -80, left: -60,
                                animation: 'lp-orb-float-a 10s ease-in-out infinite',
                            }} />
                            <div style={{
                                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                                background: '#FFE8F4', top: -40, right: -40,
                                animation: 'lp-orb-float-b 12s ease-in-out infinite',
                            }} />
                            <div style={{
                                position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                                background: '#E0FAF4', bottom: 40, left: 20,
                                animation: 'lp-orb-float-b 9s ease-in-out 2s infinite',
                            }} />
                            <div style={{
                                position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                                background: '#FFF0E0', bottom: -20, right: 60,
                                animation: 'lp-orb-float-a 11s ease-in-out 1s infinite',
                            }} />
                            <div style={{
                                position: 'absolute', width: 100, height: 100, borderRadius: '50%',
                                background: '#E6F4FF', top: '40%', left: -20,
                                animation: 'lp-orb-float-a 8s ease-in-out 0.5s infinite',
                            }} />
                        </div>

                        {/* ── AI Badge ── */}
                        <div style={{
                            position: 'relative',
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '7px 18px', borderRadius: 999,
                            background: '#fff', border: '1px solid #DDD6FF',
                            fontSize: 11, fontWeight: 700, color: '#855CD6',
                            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                            marginBottom: 24,
                            boxShadow: '0 4px 16px rgba(133,92,214,0.08)',
                            width: 'fit-content',
                            animation: `lp-fadeup .6s ${logoAnimationDelay}s both`,
                            fontFamily: '"Outfit", "Poppins", sans-serif',
                        }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#00D4A4',
                                animation: 'lp-badge-pulse 1.6s ease-in-out infinite',
                            }} />
                            Now with AI-powered mentoring
                        </div>

                        {/* ── Tagline ── */}
                        <div style={{
                            position: 'relative',
                            fontSize: 11,
                            color: '#855CD6',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase' as const,
                            fontFamily: '"Outfit", "Poppins", sans-serif',
                            fontWeight: 600,
                            marginBottom: 16,
                            animation: `lp-fadeup .6s ${logoAnimationDelay + 0.08}s both`,
                        }}>
                            Curiosity · Creativity · Critical Thinking
                        </div>

                        {/* ── Headline ── */}
                        <div style={{
                            position: 'relative',
                            animation: `lp-fadeup .8s ${logoAnimationDelay + 0.1}s both`,
                        }}>
                            <div style={{
                                fontSize: 'clamp(36px, 4.5vw, 58px)',
                                fontWeight: 900,
                                lineHeight: 1.05,
                                letterSpacing: '-2px',
                                color: '#1A0A3B',
                                fontFamily: '"Outfit", "Poppins", sans-serif',
                            }}>
                                Learn to{' '}
                                <span style={{
                                    fontFamily: '"DM Serif Display", serif',
                                    fontStyle: 'italic',
                                    fontWeight: 400,
                                    color: '#855CD6',
                                }}>code</span>
                                <br />
                                the{' '}
                                <span style={{
                                    WebkitTextStroke: '2px #855CD6',
                                    color: 'transparent',
                                }}>bold</span>{' '}
                                way
                            </div>
                        </div>

                        {/* ── Sub description ── */}
                        <div style={{
                            position: 'relative',
                            marginTop: 20,
                            fontSize: 15,
                            color: '#7366A0',
                            lineHeight: 1.65,
                            fontFamily: '"Outfit", "Inter", sans-serif',
                            maxWidth: 380,
                            fontWeight: 400,
                            animation: `lp-fadeup .7s ${subtitleAnimationDelay + 0.1}s both`,
                        }}>
                            Seven unique tracks from junior picture-blocks all the way to AI, robotics, and machine vision. Pick your adventure.
                        </div>

                        {/* ── CTA Buttons ── */}
                        <div style={{
                            position: 'relative',
                            display: 'flex', alignItems: 'center', gap: 12,
                            marginTop: 28, flexWrap: 'wrap',
                            animation: `lp-fadeup .7s ${subtitleAnimationDelay + 0.25}s both`,
                        }}>
                            <button
                                onClick={() => {
                                    setHighlightIndex(0); // Start cycling animation
                                    const cardsArea = document.querySelector('.lp-main-card');
                                    cardsArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }}
                                style={{
                                    padding: '14px 32px', borderRadius: 16, fontSize: 15, fontWeight: 800,
                                    background: '#855CD6', color: '#fff', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 8px 28px rgba(133,92,214,0.3)',
                                    fontFamily: '"Outfit", "Poppins", sans-serif',
                                    transition: 'all .25s',
                                    letterSpacing: '-0.2px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#6D28D9';
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(133,92,214,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#855CD6';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(133,92,214,0.3)';
                                }}
                            >
                                Choose your adventure →
                            </button>
                            <button
                                style={{
                                    padding: '14px 24px', borderRadius: 16, fontSize: 15, fontWeight: 600,
                                    background: '#fff', color: '#1A0A3B', border: '2px solid #DDD6FF',
                                    cursor: 'pointer', fontFamily: '"Outfit", "Poppins", sans-serif',
                                    transition: 'all .25s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#855CD6';
                                    e.currentTarget.style.color = '#855CD6';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#DDD6FF';
                                    e.currentTarget.style.color = '#1A0A3B';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                ▶ Watch 2-min demo
                            </button>
                        </div>

                        {/* ── Info Chips ── */}
                        <div style={{
                            position: 'relative',
                            display: 'flex', alignItems: 'center', gap: 10,
                            marginTop: 28, flexWrap: 'wrap',
                            animation: `lp-fadeup .7s ${subtitleAnimationDelay + 0.4}s both`,
                        }}>
                            {[
                                { icon: '✓', label: 'No experience needed', bg: '#E0FAF4', color: '#00A47A' },
                                { icon: '★', label: 'Ages 7 to 17', bg: '#EDE8FF', color: '#855CD6' },
                                { icon: '⚡', label: 'Real projects, real skills', bg: '#FFF0E0', color: '#B07000' },
                            ].map((chip) => (
                                <div key={chip.label} style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '8px 14px', borderRadius: 999,
                                    background: '#fff', border: '1px solid rgba(133,92,214,0.1)',
                                    fontSize: 12, fontWeight: 500, color: '#3D2B7A',
                                    boxShadow: '0 2px 10px rgba(133,92,214,0.05)',
                                    fontFamily: '"Outfit", sans-serif',
                                    transition: '.2s',
                                }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: 7,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 10, fontWeight: 800,
                                        background: chip.bg, color: chip.color,
                                    }}>
                                        {chip.icon}
                                    </div>
                                    {chip.label}
                                </div>
                            ))}
                        </div>

                        {/* ── Footer ── */}
                        <div style={{
                            position: 'relative',
                            marginTop: 'auto',
                            paddingTop: 24,
                            fontSize: 11,
                            color: '#9B8EC4',
                            fontFamily: '"Outfit", sans-serif',
                            fontWeight: 500,
                            letterSpacing: '0.05em',
                            animation: `lp-fadeup .5s ${subtitleAnimationDelay + 0.55}s both`,
                        }}>
                            v1.0 · Creoleap Technologies Pvt. Ltd.
                        </div>
                    </div>

                    {/* ══════ RIGHT SIDE — Mode Cards ══════ */}
                    <div
                        onMouseEnter={() => setHighlightIndex(null)}
                        style={{
                            flex: 1,
                            padding: '20px 36px 36px 16px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            zIndex: 2,
                        }}>
                        {/* Row 1: Main Mode Cards */}
                        <div style={{
                            display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-start',
                        }}>
                            {mainCards.map((card, i) => (
                                <div key={card.title} className="lp-main-card" style={{ animation: getCardAnimation(i) }}>
                                    <ModeCard
                                        icon={card.icon}
                                        title={card.title}
                                        subtitle={card.subtitle}
                                        color={card.color}
                                        gradient={card.gradient}
                                        delay={0}
                                        available={card.available}
                                        patternType={(card as any).patternType}
                                        onClick={card.onClick}
                                        highlighted={highlightIndex === i}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Row 2: Extra Cards */}
                        <div style={{
                            display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-start',
                        }}>
                            {extraCards.map((card, i) => (
                                <div key={card.title} className="lp-extra-card" style={{ animation: getCardAnimation(i, true) }}>
                                    <ModeCard
                                        icon={card.icon}
                                        title={card.title}
                                        subtitle={card.subtitle}
                                        color={card.color}
                                        gradient={card.gradient}
                                        delay={0}
                                        available={card.available}
                                        patternType={(card as any).patternType}
                                        onClick={card.onClick}
                                        highlighted={highlightIndex === (mainCards.length + i)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification for "Coming Soon" */}
            <Toast message={toast.message} visible={toast.visible} />

        </div>
    );
};

export default LandingPage;
