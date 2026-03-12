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

        /* Robot intro: falls from top, bounces, settles */
        @keyframes lp-robot-drop {
            0%   { transform:translateY(-300px) rotate(-8deg) scale(.6); opacity:0 }
            55%  { transform:translateY(14px)   rotate(2deg)  scale(1.03); opacity:1 }
            70%  { transform:translateY(-8px)   rotate(-1deg) scale(.98) }
            85%  { transform:translateY(4px)    rotate(0deg)  scale(1.01) }
            100% { transform:translateY(0)      rotate(0deg)  scale(1);   opacity:1 }
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
    onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ icon, title, subtitle, color, gradient, delay, available, onClick }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                width: 200,
                height: 260, // Fixed height for consistency
                background: hovered ? '#FFFFFF' : '#FFFFFF', // Maintain light theme
                border: `2.5px solid ${hovered ? color : '#F1F5F9'}`,
                borderRadius: 24,
                padding: '32px 20px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: 'pointer',
                transition: 'all .4s cubic-bezier(.34,1.56,.64,1)',
                transform: hovered ? 'translateY(-10px)' : 'translateY(0)',
                boxShadow: hovered
                    ? `0 20px 40px ${color}25, 0 0 0 1px ${color}15`
                    : '0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)',
                animation: `lp-fadeup .5s ${delay}s both`,
                overflow: 'hidden',
            }}
        >
            {/* Hover Gradient Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: gradient,
                opacity: hovered ? 0.03 : 0,
                transition: 'opacity .4s',
                pointerEvents: 'none',
            }} />

            {/* Icon circle */}
            <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: hovered ? gradient : '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34,
                marginBottom: 20,
                boxShadow: hovered ? `0 8px 24px ${color}44` : 'none',
                transition: 'all .4s ease',
                transform: hovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                border: hovered ? 'none' : '1px solid #E2E8F0',
            }}>
                <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
            </div>

            {/* Title */}
            <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1E293B',
                marginBottom: 8,
                fontFamily: '"Poppins", sans-serif',
                textAlign: 'center',
                transition: 'color .3s',
            }}>
                {title}
            </div>

            {/* Subtitle */}
            <div style={{
                fontSize: 12,
                color: '#64748B',
                textAlign: 'center',
                lineHeight: 1.6,
                padding: '0 4px',
                fontFamily: '"Inter", sans-serif',
                transition: 'color .3s',
                fontWeight: 400,
            }}>
                {subtitle}
            </div>

            {/* Bottom Glow */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: '10%', right: '10%',
                height: 4,
                background: gradient,
                borderRadius: '4px 4px 0 0',
                opacity: hovered ? 1 : 0,
                transition: 'opacity .3s',
            }} />

            {/* Available indicator */}
            {available && (
                <div style={{
                    position: 'absolute',
                    top: 14, right: 14,
                    width: 10, height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    boxShadow: '0 0 10px rgba(34,197,94,0.4)',
                    border: '2px solid white',
                }} />
            )}
        </div>
    );
};

// ─── Toast notification ──────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '14px 28px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #855CD6, #6D28D9)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: '"Poppins", sans-serif',
            boxShadow: '0 8px 32px rgba(133,92,214,0.35)',
            animation: 'lp-toast-in .3s ease-out',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
        }}>
            <span style={{ fontSize: 20 }}>🚧</span>
            {message}
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
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
    const bgShapesRef = useRef<(HTMLDivElement | null)[]>([]);

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const shapes = useMemo(() => {
        const shapeTypes = ['square', 'circle', 'plus', 'puzzle', 'triangle'];
        return Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            type: shapeTypes[i % shapeTypes.length],
            size: random(20, 70), // Slightly smaller but more of them
            x: random(-5, 105), // Spread slightly beyond bounds to avoid edges
            y: random(-5, 105),
            rotation: random(0, 360),
            opacity: random(0.03, 0.07),
            color: ['#855CD6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i % 5]
        }));
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            setMousePos({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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

        // Sequence: Robot -> Logo/Subtitle -> Cards
        
        // 1. Robot Entrance (First)
        if (robotRef.current) {
            animate(robotRef.current, {
                translateY: [100, 0],
                opacity: [0, 1],
                scale: [0.5, 1],
                rotate: [20, 0],
                duration: 1200,
                ease: 'outElastic(1, .6)',
            });

            // Start hover float after entrance
            setTimeout(() => {
                if (robotRef.current) {
                    animate(robotRef.current, {
                        translateY: [-15, 0],
                        rotate: [-3, 3],
                        duration: 2000,
                        direction: 'alternate',
                        loop: true,
                        ease: 'inOutQuad'
                    });
                }
            }, 1200);
        }

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

        // Background shapes floating
        bgShapesRef.current.forEach((shape, i) => {
            if (!shape) return;
            animate(shape, {
                translateX: () => random(-50, 50),
                translateY: () => random(-50, 50),
                rotate: () => random(-30, 30),
                duration: () => random(6000, 10000),
                delay: i * 50,
                direction: 'alternate',
                loop: true,
                ease: 'inOutSine'
            });
        });

        return () => scope.revert();
    }, [phase, scope]);

    // Show toast for coming soon
    const showComingSoon = (name: string) => {
        setToast({ message: `${name} — Coming Soon! 🚀`, visible: true });
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
            title: 'Junior Blocks', subtitle: 'Icon blocks & visual stories for Classes 1 to 5',
            color: '#c77e00ff', gradient: 'linear-gradient(135deg, #ffbb44ff, #fe8b08ff)',
            available: true, onClick: () => onSelect('junior'),
        },
        {
            icon: (
                <img
                    src="/assets/arduino_icon.png"
                    alt="Intermediate Blocks"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'Intermediate Blocks', subtitle: 'Blockly + Arduino hardware coding for Classes 6 to 8',
            color: '#5a29bdff', gradient: 'linear-gradient(135deg, #855CD6, #370091ff)',
            available: true, onClick: () => onSelect('intermediate'),
        },
        {
            icon: (
                <img
                    src="/assets/python_icon.png"
                    alt="Python IDE"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'Python IDE', subtitle: 'Step into the world of text-based coding',
            color: '#3776ab', gradient: 'linear-gradient(135deg, #3776ab, #ffd343)',
            available: true, onClick: () => onSelect('python'),
        },
        {
            icon: (
                <img
                    src="/assets/ml_brain_icon.png"
                    alt="Advanced Blocks"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'Advanced Blocks', subtitle: 'AI/ML Coding with intelligent blocks',
            color: '#2c5fb3ff', gradient: 'linear-gradient(135deg, #5a99ffff, #033cd7ff)',
            available: false, onClick: () => showComingSoon('Advanced'),
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
            title: 'Creocad', subtitle: 'Online simulation for 3D printing',
            color: '#51c1bdff', gradient: 'linear-gradient(135deg, #51c1bdff, #00fefaff)',
            available: false, onClick: () => showComingSoon('Creocad')
        },
        {
            icon: (
                <img
                    src="/assets/app_game_dev_icon.png"
                    alt="App & Game Development"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'App & Game Development', subtitle: 'Build interactive games',
            color: '#EF4444', gradient: 'linear-gradient(135deg, #ff6a6aff, #b70000ff)',
            available: false, onClick: () => showComingSoon('App & Game Development'),
        },
        {
            icon: (
                <img
                    src="/assets/quiz_icon.png"
                    alt="Quiz"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ),
            title: 'Quiz', subtitle: 'Create fun learning quizzes',
            color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #00faabff)',
            available: false, onClick: () => showComingSoon('Quiz'),
        },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, overflow: 'auto',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', // Cleaner light theme
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh',
        }}>
            {/* Topbar */}
            <div style={{
                position: 'absolute',
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

            {/* Interactive Decorative Shapes Layer */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                {shapes.map((shape, i) => (
                    <div
                        key={shape.id}
                        style={{
                            position: 'absolute',
                            left: `${shape.x}%`,
                            top: `${shape.y}%`,
                            width: shape.size,
                            height: shape.size,
                            transform: `translate(${mousePos.x * shape.size * 0.4}px, ${mousePos.y * shape.size * 0.4}px)`,
                            transition: 'transform 0.15s ease-out', 
                        }}
                    >
                        <div
                            ref={el => { bgShapesRef.current[i] = el; }}
                            style={{
                                width: '100%',
                                height: '100%',
                                opacity: shape.opacity,
                                transform: `rotate(${shape.rotation}deg)`,
                            }}
                        >
                            {shape.type === 'square' && (
                                <svg viewBox="0 0 100 100" fill={shape.color}>
                                    <rect x="10" y="10" width="80" height="80" rx="16" />
                                </svg>
                            )}
                            {shape.type === 'circle' && (
                                <svg viewBox="0 0 100 100" fill={shape.color}>
                                    <circle cx="50" cy="50" r="40" />
                                </svg>
                            )}
                            {shape.type === 'plus' && (
                                <svg viewBox="0 0 100 100" fill={shape.color}>
                                    <path d="M40 10h20v30h30v20h-30v30h-20v-30h-30v-20h30z" />
                                </svg>
                            )}
                            {shape.type === 'puzzle' && (
                                <svg viewBox="0 0 100 100" fill={shape.color}>
                                    <path d="M85 40c0-8.3-6.7-15-15-15h-5.2c-2.4-5.8-8.1-10-14.8-10s-12.4 4.2-14.8 10H30c-8.3 0-15 6.7-15 15v5.2c5.8 2.4 10 8.1 10 14.8s-4.2 12.4-10 14.8V80c0 8.3 6.7 15 15 15h35c8.3 0 15-6.7 15-15v-5.2c-5.8-2.4-10-8.1-10-14.8s4.2-12.4 10-14.8V40z" />
                                </svg>
                            )}
                            {shape.type === 'triangle' && (
                                <svg viewBox="0 0 100 100" fill={shape.color}>
                                    <path d="M50 15L85 85H15L50 15Z" />
                                </svg>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ══════════ INTRO PHASE ══════════ */}
            {(phase === 'intro' || phase === 'welcome') && (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Robot with drop animation */}
                    <div style={{
                        position: 'relative',
                        animation: 'lp-robot-drop 1.4s cubic-bezier(.36,.07,.19,.97) both',
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
                    padding: '20px',
                }}>

                    {/* ── Logo / Brand ── */}
                    <div 
                        ref={logoRef}
                        style={{
                        position: 'relative',
                        marginBottom: 12,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        zIndex: 2, // Above background
                    }}>
                        {/* Floating robot mascot container */}
                        <div style={{
                            marginBottom: 20, // More space to avoid clipping
                            height: 100, // Explicit height to prevent layout shift
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <img
                                ref={robotRef}
                                src="/assets/sprites/robot/robot_idle.svg"
                                alt="LeapBlocks Robot"
                                style={{
                                    width: 90,
                                    height: 90,
                                    filter: 'drop-shadow(0 8px 20px rgba(133,92,214,0.3))',
                                    opacity: 0, // Starts invisible for Anime.js
                                }}
                            />
                        </div>

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
                        fontSize: 15, color: '#1f242cff', marginBottom: 28,
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
