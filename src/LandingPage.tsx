import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

// ─── inject keyframes once ───────────────────────────────────────────────────
function injectCSS() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('lp-anims')) return;
    const s = document.createElement('style');
    s.id = 'lp-anims';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

        @font-face {
            font-family: 'Azonix';
            src: url('/assets/fonts/Azonix.woff') format('woff'),
                 url('/assets/fonts/Azonix.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

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
    icon: string;
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
                width: 190,
                background: hovered ? gradient : '#FFFFFF',
                border: `2px solid ${hovered ? color : '#E5E7EB'}`,
                borderRadius: 20,
                padding: '24px 18px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
                transform: hovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
                boxShadow: hovered
                    ? `0 12px 36px ${color}33, 0 0 0 1px ${color}22`
                    : '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
                animation: `lp-fadeup .5s ${delay}s both`,
            }}
        >
            {/* Icon circle */}
            <div style={{
                width: 64, height: 64,
                borderRadius: '50%',
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30,
                marginBottom: 14,
                boxShadow: `0 4px 16px ${color}33`,
                transition: 'transform .3s',
                transform: hovered ? 'scale(1.1)' : 'scale(1)',
            }}>
                {icon}
            </div>

            {/* Title */}
            <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: hovered ? '#FFFFFF' : '#1E293B',
                marginBottom: 4,
                fontFamily: '"Poppins", sans-serif',
                textAlign: 'center',
                transition: 'color .3s',
            }}>
                {title}
            </div>

            {/* Subtitle */}
            <div style={{
                fontSize: 11,
                color: hovered ? 'rgba(255,255,255,0.85)' : '#94A3B8',
                textAlign: 'center',
                lineHeight: 1.5,
                fontFamily: '"Inter", sans-serif',
                transition: 'color .3s',
            }}>
                {subtitle}
            </div>

            {/* Available indicator */}
            {available && (
                <div style={{
                    position: 'absolute',
                    top: 10, right: 10,
                    width: 8, height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    boxShadow: '0 0 6px rgba(34,197,94,0.5)',
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
    onSelect: (mode: 'intermediate' | 'junior') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
    injectCSS();

    // Phases: 'intro' → robot drops, 'welcome' → text types, 'main' → full UI
    const [phase, setPhase] = useState<'intro' | 'welcome' | 'main'>('intro');
    const [typedText, setTypedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const FULL_TEXT = 'Welcome to LeapBlocks';

    // Phase timer
    useEffect(() => {
        const t1 = setTimeout(() => setPhase('welcome'), 1800);
        return () => clearTimeout(t1);
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

    // Show toast for coming soon
    const showComingSoon = (name: string) => {
        setToast({ message: `${name} — Coming Soon! 🚀`, visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 2500);
    };

    // Cards data
    const mainCards = [

        {
            icon: '🐻', title: 'Junior Blocks', subtitle: 'Icon blocks & visual stories for Classes 1 to 5',
            color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
            available: true, onClick: () => onSelect('junior'),
        },
        {
            icon: '🚀', title: 'Intermediate Blocks', subtitle: 'Blockly + Arduino hardware coding for Classes 6 to 8',
            color: '#855CD6', gradient: 'linear-gradient(135deg, #855CD6, #6D28D9)',
            available: true, onClick: () => onSelect('intermediate'),
        },
        {
            icon: '', title: 'Python IDE', subtitle: 'Python IDE for Classes 9 to 12',
            color: '#c5d032ff', gradient: 'linear-gradient(135deg, #cdf54cff, #d8c91dff)',
            available: false, onClick: () => showComingSoon('Python IDE'),
        },
        {
            icon: '⚡', title: 'Advanced Blocks', subtitle: 'AI/ML',
            color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            available: false, onClick: () => showComingSoon('Advanced'),
        },
    ];

    const extraCards = [
        {
            icon: '🎮', title: 'Creocad', subtitle: 'Online simulation for 3D printing',
            color: '#44efe9ff', gradient: 'linear-gradient(135deg, #44efe9ff, #26dcd8ff)',
            available: false, onClick: () => showComingSoon('Creocad')
        },
        {
            icon: '📱', title: 'App & Game Development', subtitle: 'Build interactive games',
            color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
            available: false, onClick: () => showComingSoon('App & Game Development'),
        },
        {
            icon: '🧩', title: 'Quiz', subtitle: 'Create fun learning quizzes',
            color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)',
            available: false, onClick: () => showComingSoon('Quiz'),
        },

        {
            icon: '📱', title: 'App Design', subtitle: 'Design beautiful app interfaces',
            color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)',
            available: false, onClick: () => showComingSoon('App Design'),
        },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, overflow: 'auto',
            background: 'linear-gradient(135deg, #F8F7FF 0%, #EDE9FE 25%, #F0F9FF 50%, #FDF2F8 75%, #F8F7FF 100%)',
            backgroundSize: '400% 400%',
            animation: 'lp-bg-shift 15s ease-in-out infinite',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh',
        }}>
            {/* Topbar */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px',
                background: 'rgba(255, 255, 255)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
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
                        style={{ height: '36px', objectFit: 'contain' }}
                        onError={(e) => {
                            // Fallback if topbar_logo.svg is missing
                            (e.target as HTMLImageElement).src = '/assets/leapblocks_logo.svg';
                        }}
                    />
                </div>

                {/* Right Notification Icon */}
                <div style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)',
                    transition: 'all 0.2sease',
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(133,92,214,0.15), inset 0 1px 0 rgba(255,255,255,0.9)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)';
                    }}
                    onClick={() => showComingSoon('Notifications')}
                >
                    <Bell size={20} color="#475569" strokeWidth={2.5} />
                    {/* Notification indicator dot */}
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '10px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        border: '2px solid white',
                        boxShadow: '0 0 0 1px rgba(239,68,68,0.2)',
                    }} />
                </div>
            </div>
            {/* Decorative floating shapes */}
            <div style={{
                position: 'absolute', top: '8%', left: '6%',
                width: 100, height: 100, borderRadius: '10%',
                background: 'linear-gradient(135deg, rgba(133,92,214,0.12), rgba(99,102,241,0.08))',
                animation: 'lp-float-shape 6s ease-in-out infinite',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', top: '15%', right: '8%',
                width: 60, height: 60, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(236,72,153,0.08))',
                animation: 'lp-float-shape 8s 2s ease-in-out infinite',
                pointerEvents: 'none', transform: 'rotate(30deg)',
            }} />
            <div style={{
                position: 'absolute', bottom: '12%', left: '10%',
                width: 50, height: 50, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))',
                animation: 'lp-float-shape 7s 1s ease-in-out infinite',
                pointerEvents: 'none', transform: 'rotate(-15deg)',
            }} />
            <div style={{
                position: 'absolute', bottom: '20%', right: '12%',
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(245,158,11,0.08))',
                animation: 'lp-float-shape 9s 3s ease-in-out infinite',
                pointerEvents: 'none',
            }} />

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
                    <div style={{
                        position: 'relative',
                        marginBottom: 8,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'lp-fadeup .5s .1s both',
                    }}>
                        {/* Floating robot mascot */}
                        <div style={{
                            animation: 'lp-robot-float 3s ease-in-out infinite',
                            marginBottom: 12,
                        }}>
                            <img
                                src="/assets/sprites/robot/robot_idle.svg"
                                alt="LeapBlocks Robot"
                                style={{
                                    width: 80,
                                    height: 80,
                                    filter: 'drop-shadow(0 6px 16px rgba(133,92,214,0.3))',
                                }}
                            />
                        </div>

                        {/* Brand name */}
                        <div style={{
                            fontSize: 36,
                            fontWeight: 900,
                            fontFamily: '"Azonix", "Poppins", sans-serif',
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
                    <div style={{
                        fontSize: 15, color: '#1f242cff', marginBottom: 28,
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 500,
                        animation: 'lp-fadeup .5s .2s both',
                    }}>
                        Choose your coding adventure ✨
                    </div>

                    {/* ── Row 1: Main Mode Cards ── */}
                    <div style={{
                        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
                        marginBottom: 16,
                    }}>
                        {mainCards.map((card, i) => (
                            <ModeCard
                                key={card.title}
                                icon={card.icon}
                                title={card.title}
                                subtitle={card.subtitle}
                                color={card.color}
                                gradient={card.gradient}
                                delay={0.3 + i * 0.1}
                                available={card.available}
                                onClick={card.onClick}
                            />
                        ))}
                    </div>

                    {/* ── Row 2: Extra Cards ── */}
                    <div style={{
                        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
                    }}>
                        {extraCards.map((card, i) => (
                            <ModeCard
                                key={card.title}
                                icon={card.icon}
                                title={card.title}
                                subtitle={card.subtitle}
                                color={card.color}
                                gradient={card.gradient}
                                delay={0.6 + i * 0.1}
                                available={card.available}
                                onClick={card.onClick}
                            />
                        ))}
                    </div>

                    {/* ── Footer ── */}
                    <div style={{
                        marginTop: 28,
                        fontSize: 11, color: '#001125ff',
                        fontFamily: '"Poppins",azonix',
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
