import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { animate, stagger, random, createScope } from 'animejs';

// ─── inject keyframes once ───────────────────────────────────────────────────
function injectCSS() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('lp-anims')) return;
    const s = document.createElement('style');
    s.id = 'lp-anims';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        @keyframes lp-fadein    { from { opacity:0 } to { opacity:1 } }
        @keyframes lp-fadeup    { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }

        /* Robot intro: launches from bottom, bounces, settles */
        @keyframes lp-robot-launch {
            0%   { transform:translateY(300px) rotate(-8deg) scale(.6); opacity:0 }
            55%  { transform:translateY(-14px) rotate(2deg)  scale(1.03); opacity:1 }
            70%  { transform:translateY(8px)   rotate(-1deg) scale(.98) }
            85%  { transform:translateY(-4px)  rotate(0deg)  scale(1.01) }
            100% { transform:translateY(0)     rotate(0deg)  scale(1);   opacity:1 }
        }

        /* Robot hover float after landing */
        @keyframes lp-robot-float {
            0%,100% { transform:translateY(0) rotate(-0.5deg) }
            50%     { transform:translateY(-8px) rotate(0.5deg) }
        }

        /* Type cursor blink */
        @keyframes lp-cursor { 0%,100%{opacity:1} 50%{opacity:0} }

        /* Gentle gradient shift on background */
        @keyframes lp-bg-shift {
            0%,100% { background-position: 0% 50% }
            50%     { background-position: 100% 50% }
        }

        /* Floating shapes */
        @keyframes lp-float-shape {
            0%,100% { transform: translateY(0) rotate(0deg) }
            50%     { transform: translateY(-20px) rotate(5deg) }
        }

        /* Spotlight strip */
        @keyframes lp-spotlight {
            0% { transform: translateX(-200%) skewX(-45deg); opacity: 0; }
            10% { opacity: 0.2; }
            90% { opacity: 0.2; }
            100% { transform: translateX(300%) skewX(-45deg); opacity: 0; }
        }

        /* Ambient grid flow */
        @keyframes lp-grid-flow {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 40px 40px, 0 0; }
        }

        /* Card hover glow */
        @keyframes lp-card-pulse {
            0%,100% { box-shadow: 0 4px 20px rgba(133,92,214,0.08) }
            50%     { box-shadow: 0 8px 32px rgba(133,92,214,0.18) }
        }

        /* Toast slide in */
        @keyframes lp-toast-in {
            from { opacity:0; transform:translate(-50%, 20px) }
            to   { opacity:1; transform:translate(-50%, 0) }
        }
        @keyframes lp-toast-out {
            from { opacity:1; transform:translate(-50%, 0) }
            to   { opacity:0; transform:translate(-50%, -20px) }
        }

        /* Wave hand */
        @keyframes lp-wave {
            0%,100% { transform: rotate(0deg) }
            25%     { transform: rotate(14deg) }
            50%     { transform: rotate(-8deg) }
            75%     { transform: rotate(12deg) }
        }

        /* Shadow pulse behind robot */
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
}) => {
    const [hovered, setHovered] = useState(false);
    const [pointer, setPointer] = useState({ x: 50, y: 50 });

    const rotateX = hovered ? (50 - pointer.y) / 10 : 0;
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
                border: `1px solid ${hovered ? `${color}33` : 'rgba(255,255,255,0.75)'}`,
                borderRadius: 28,
                padding: '14px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform .35s ease, box-shadow .35s ease, border-color .35s ease',
                transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${hovered ? -10 : 0}px)`,
                boxShadow: hovered
                    ? `0 28px 60px ${color}24, 0 10px 24px rgba(15,23,42,0.12)`
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
                opacity: hovered ? 0.12 : 0.08,
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
                background: hovered ? gradient : 'rgba(255,255,255,0.78)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                boxShadow: hovered ? `0 16px 28px ${color}33` : '0 8px 20px rgba(15,23,42,0.08)',
                transition: 'all .35s ease',
                transform: hovered ? 'scale(1.06) rotate(4deg)' : 'scale(1)',
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
    onSelect: (mode: 'intermediate' | 'junior' | 'python') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
    injectCSS();

    const scope = useMemo(() => createScope(), []);

    // Phases: 'intro' → robot drops, 'welcome' → text types, 'main' → full UI
    const hasSeenIntro = sessionStorage.getItem('leapblocks_intro_seen') === 'true';
    const [phase, setPhase] = useState<'intro' | 'welcome' | 'main'>(hasSeenIntro ? 'main' : 'intro');
    const [typedText, setTypedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    // Refs for anime.js
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const extraCardsContainerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const robotRef = useRef<HTMLImageElement>(null);

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

    // Anime.js Main Entrance
    useEffect(() => {
        if (phase !== 'main') return;

        const isReturning = hasSeenIntro; // If true, skip the header sequence

        if (isReturning) {
            // Instant header, smooth cards
            if (robotRef.current) {
                robotRef.current.style.opacity = '1';
                animate(robotRef.current, {
                    translateY: [-15, 0],
                    rotate: [-3, 3],
                    duration: 2000,
                    direction: 'alternate',
                    loop: true,
                    ease: 'inOutQuad'
                });
            }
            if (logoRef.current) {
                logoRef.current.style.opacity = '1';
            }
            const subtitleEl = document.querySelector('.lp-subtitle') as HTMLElement;
            if (subtitleEl) subtitleEl.style.opacity = '1';

            // Cards stagger quickly
            animate('.lp-main-card', {
                translateY: [80, 0],
                opacity: [0, 1],
                scale: [0.8, 1],
                delay: stagger(60, { start: 100 }),
                duration: 800,
                ease: 'outElastic(1, .7)'
            });
            animate('.lp-extra-card', {
                translateY: [60, 0],
                opacity: [0, 1],
                scale: [0.8, 1],
                delay: stagger(60, { start: 400 }),
                duration: 800,
                ease: 'outElastic(1, .7)'
            });
        } else {
            // Sequence: Logo/Subtitle -> Cards
            
            // 2. Logo / Branding (Offset slightly)
            if (logoRef.current) {
                animate(logoRef.current, {
                    translateY: [40, 0],
                    opacity: [0, 1],
                    scale: [0.9, 1],
                    duration: 1000,
                    ease: 'outQuad',
                    delay: 400
                });
            }

            // 3. Subtitle
            animate('.lp-subtitle', {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                delay: 800,
                ease: 'outQuad'
            });

            // 4. Mode Cards (Staggered last)
            animate('.lp-main-card', {
                translateY: [80, 0],
                opacity: [0, 1],
                scale: [0.8, 1],
                delay: stagger(100, { start: 1200 }),
                duration: 1000,
                ease: 'outElastic(1, .7)'
            });

            animate('.lp-extra-card', {
                translateY: [60, 0],
                opacity: [0, 1],
                scale: [0.8, 1],
                delay: stagger(100, { start: 1600 }),
                duration: 800,
                ease: 'outElastic(1, .7)'
            });
        }

        animate('.lp-extra-card', {
            translateY: [60, 0],
            opacity: [0, 1],
            scale: [0.8, 1],
            delay: stagger(100, { start: 1600 }),
            duration: 800,
            ease: 'outElastic(1, .7)'
        });

        return () => scope.revert();
    }, [phase, scope]);

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
            title: 'Junior Blocks', subtitle: 'Picture-first coding for stories, characters, and quick wins.',
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
            title: 'Intermediate Blocks', subtitle: 'Blockly plus Arduino for robotics, sensors, and logic flows.',
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
            title: 'Python IDE', subtitle: 'Move into text coding with scripts, editor tools, and sprite control.',
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
            title: 'Advanced Blocks', subtitle: 'A future lane for AI, machine vision, and richer block systems.',
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
            title: 'Creocad', subtitle: '3D simulation and prototyping before ideas become physical builds.',
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
            title: 'App & Game Development', subtitle: 'A future studio for scenes, interactions, and game logic.',
            color: '#EF4444', gradient: 'linear-gradient(135deg, #ff6a6aff, #b70000ff)',
            available: false, patternType: 'lines', tag: 'Game lab', chips: ['Scenes', 'Interactions'], cta: 'Track update', onClick: () => showComingSoon('App & Game Development'),
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
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 40px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                zIndex: 100,
                animation: phase === 'main' ? 'lp-fadeup 0.6s ease-out both' : 'none',
                opacity: phase === 'main' ? 1 : 0,
                pointerEvents: phase === 'main' ? 'auto' : 'none',
            }}>
                {/* Left Logo */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                        src="/assets/topbar_logo.svg"
                        alt="LeapBlocks"
                        style={{ height: '40px', objectFit: 'contain' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/leapblocks_logo.svg';
                        }}
                    />
                </div>

                {/* Right Notification Icon */}
                <div style={{
                    position: 'relative',
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid #F1F5F9',
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(133,92,214,0.12)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                    onClick={() => showComingSoon('Notifications')}
                >
                    <Bell size={20} color="#475569" strokeWidth={2} />
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '11px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        border: '2px solid white',
                    }} />
                </div>
            </div>
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
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                    animation: 'lp-fadein .5s ease-out',
                    padding: '84px 20px 40px 20px', width: '100%',
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

                    {/* ── Logo / Brand ── */}
                    <div 
                        ref={logoRef}
                        style={{
                        position: 'relative',
                        marginBottom: 12,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        zIndex: 2, // Above background
                    }}>
                        {/* Brand name */}
                        <div style={{
                            fontSize: 36,
                            fontWeight: 900,
                            fontFamily: '"Orbitron", "Poppins", sans-serif',
                            letterSpacing: '1px',
                            background: 'linear-gradient(135deg, #855CD6, #6D28D9)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            LeapBlocks
                        </div>
                        <div style={{
                            fontSize: 13,
                            color: '#3e8fffff',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            fontFamily: '"Poppins", sans-serif',
                            fontWeight: 500,
                        }}>
                            Curiosity · Creativity · Criticalthinking
                        </div>
                    </div>

                    {/* ── Subtitle ── */}
                    <div 
                        className="lp-subtitle"
                        style={{
                        fontSize: 15, color: '#1f242cff', marginBottom: 16,
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 500,
                        // animation: 'lp-fadeup .5s .2s both',
                    }}>
                        Choose your coding adventure ✨
                    </div>

                    {/* ── Row 1: Main Mode Cards ── */}
                    <div style={{
                        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
                        marginBottom: 16,
                    }}>
                        {mainCards.map((card, i) => (
                            <div key={card.title} className="lp-main-card">
                                <ModeCard
                                    icon={card.icon}
                                    title={card.title}
                                    subtitle={card.subtitle}
                                    color={card.color}
                                    gradient={card.gradient}
                                    delay={0} // Anime handles delay now
                                    available={card.available}
                                    patternType={(card as any).patternType}
                                    onClick={card.onClick}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── Row 2: Extra Cards ── */}
                    <div style={{
                        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
                    }}>
                        {extraCards.map((card, i) => (
                            <div key={card.title} className="lp-extra-card">
                                <ModeCard
                                    icon={card.icon}
                                    title={card.title}
                                    subtitle={card.subtitle}
                                    color={card.color}
                                    gradient={card.gradient}
                                    delay={0} // Anime handles delay now
                                    available={card.available}
                                    patternType={(card as any).patternType}
                                    onClick={card.onClick}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── Footer ── */}
                    <div style={{
                        marginTop: 28,
                        fontSize: 11, color: '#001125ff',
                        fontFamily: '"Poppins", Orbitron',
                        fontWeight: 500,
                        animation: 'lp-fadeup .5s .9s both',
                        letterSpacing: '0.05em',
                    }}>
                        v1.0 · Creoleap Technologies Pvt. Ltd.
                    </div>
                </div>
            )}

            {/* Toast notification for "Coming Soon" */}
            <Toast message={toast.message} visible={toast.visible} />

        </div>
    );
};

export default LandingPage;
