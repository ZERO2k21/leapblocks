import React, { useState, useEffect, useRef } from 'react';

interface UploadModalProps {
    isOpen: boolean;
    progress: string; // Format: "25%: Configuring board..."
}

function injectAnimations() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ulm-anims-v3')) return;
    const tag = document.createElement('style');
    tag.id = 'ulm-anims-v3';
    tag.textContent = `
        @keyframes ulm-fadein {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ulm-float {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-8px); }
        }
        @keyframes ulm-launch {
            0%   { transform: translateY(0) rotate(-30deg) scale(1); opacity: 1; }
            50%  { transform: translateY(-60px) rotate(-30deg) scale(1.05); opacity: 1; }
            100% { transform: translateY(-250px) rotate(-30deg) scale(0.4); opacity: 0; }
        }
        @keyframes ulm-shimmer {
            0%   { left: -60%; }
            100% { left: 130%; }
        }
        @keyframes ulm-dot-pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50%      { transform: scale(1.4); opacity: 1; }
        }
        @keyframes ulm-checkpop {
            0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
            60%  { transform: scale(1.15) rotate(2deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ulm-ring {
            0%   { transform: scale(0.9); opacity: 0.2; }
            50%  { transform: scale(1.15); opacity: 0.05; }
            100% { transform: scale(0.9); opacity: 0.2; }
        }
        @keyframes ulm-confetti-fall {
            0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(30px) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(tag);
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, progress }) => {
    injectAnimations();

    // Smooth progress interpolation
    const [displayPct, setDisplayPct] = useState(0);
    const targetPctRef = useRef(0);
    const animFrameRef = useRef<number | null>(null);

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

    // Animate percentage smoothly
    useEffect(() => {
        targetPctRef.current = percentage;
        const step = () => {
            setDisplayPct(prev => {
                const target = targetPctRef.current;
                if (prev >= target) return target;
                // Increment by 0.5–1 per frame for smooth animation
                const diff = target - prev;
                const increment = Math.max(0.3, diff * 0.08);
                return Math.min(target, prev + increment);
            });
            animFrameRef.current = requestAnimationFrame(step);
        };
        animFrameRef.current = requestAnimationFrame(step);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [percentage]);

    // Reset on open
    useEffect(() => {
        if (isOpen) setDisplayPct(0);
    }, [isOpen]);

    const roundedPct = Math.round(displayPct);
    const launched = percentage >= 100;

    const stageLabel =
        percentage === 0 ? 'Initializing...' :
            percentage < 5 ? 'Preparing environment...' :
                percentage < 10 ? 'Checking Arduino CLI...' :
                    percentage < 20 ? 'Saving Sketch...' :
                        percentage < 25 ? 'Sketch saved' :
                            percentage < 60 ? 'Compiling Code...' :
                                percentage < 65 ? 'Compilation done' :
                                    percentage < 90 ? 'Uploading to Board...' :
                                        percentage < 100 ? 'Finalizing...' :
                                            'Upload Complete!';

    const stages = [
        { label: 'Init', threshold: 5 },
        { label: 'Save', threshold: 15 },
        { label: 'Compile', threshold: 30 },
        { label: 'Upload', threshold: 70 },
        { label: 'Done', threshold: 100 },
    ];

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                {/* ─── Rocket Image ─── */}
                <div style={styles.rocketArea}>
                    {/* Ambient ring */}
                    {!launched && (
                        <div style={{
                            position: 'absolute',
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            border: '2px solid rgba(124,58,237,0.08)',
                            animation: 'ulm-ring 3s ease-in-out infinite',
                        }} />
                    )}

                    {/* Rocket Image */}
                    {!launched && (
                        <img
                            src="/assets/ui/rocket.png"
                            alt="Uploading"
                            style={{
                                width: 80,
                                height: 80,
                                objectFit: 'contain',
                                animation: launched
                                    ? 'ulm-launch 0.8s cubic-bezier(0.4,0,0.2,1) forwards'
                                    : 'ulm-float 2s ease-in-out infinite',
                                filter: 'drop-shadow(0 4px 12px rgba(124,58,237,0.2))',
                            }}
                        />
                    )}

                    {/* Success checkmark */}
                    {launched && (
                        <div style={{ animation: 'ulm-checkpop 0.5s ease-out 0.3s both' }}>
                            <svg width="68" height="68" viewBox="0 0 56 56" fill="none">
                                <circle cx="28" cy="28" r="26" fill="#F0FDF4" stroke="#16A34A" strokeWidth="2.5" />
                                <circle cx="28" cy="28" r="20" fill="#DCFCE7" opacity="0.5" />
                                <path d="M17 28 L24 35 L39 19" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* ─── Title ─── */}
                <div style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: launched ? '#16A34A' : '#1F2937',
                    marginBottom: 3,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    letterSpacing: '-0.03em',
                }}>
                    {launched ? '🎉 Upload Complete!' : 'Uploading to Board'}
                </div>

                {/* Subtitle */}
                <div style={{
                    fontSize: 13,
                    color: launched ? 'rgba(22,163,74,0.7)' : '#9CA3AF',
                    marginBottom: 24,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    fontWeight: 500,
                }}>
                    {launched ? 'Your code is now running on the device' : stageLabel}
                </div>

                {/* ─── Progress Bar ─── */}
                <div style={styles.barOuter}>
                    <div style={{
                        height: '100%',
                        borderRadius: 6,
                        transition: 'width 0.15s linear',
                        position: 'relative',
                        overflow: 'hidden',
                        width: `${displayPct}%`,
                        background: launched
                            ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                            : 'linear-gradient(90deg, #7C3AED, #8B5CF6, #A78BFA)',
                    }}>
                        {!launched && <div style={styles.shimmer} />}
                    </div>
                </div>

                {/* ─── Percentage ─── */}
                <div style={{
                    fontSize: 40,
                    fontWeight: 900,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    color: launched ? '#16A34A' : '#7C3AED',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    marginBottom: 24,
                }}>
                    {roundedPct}<span style={{ fontSize: 22, fontWeight: 700, opacity: 0.5 }}>%</span>
                </div>

                {/* ─── Step Indicators ─── */}
                <div style={styles.stepsRow}>
                    {stages.map(({ label, threshold }, i) => {
                        const done = percentage >= threshold;
                        const active = !done && percentage >= threshold - 25;
                        const isLast = i === stages.length - 1;
                        return (
                            <React.Fragment key={label}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 1 }}>
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        transition: 'all 0.35s ease',
                                        background: done
                                            ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                                            : active ? '#F5F3FF' : '#F9FAFB',
                                        color: done ? '#fff' : active ? '#7C3AED' : '#D1D5DB',
                                        border: done
                                            ? '2.5px solid #7C3AED'
                                            : active ? '2.5px solid #C4B5FD' : '2.5px solid #E5E7EB',
                                        boxShadow: done ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                                    }}>
                                        {done ? '✓' : ''}
                                    </div>
                                    <span style={{
                                        fontSize: 9,
                                        fontWeight: done ? 700 : 500,
                                        color: done ? '#7C3AED' : active ? '#8B5CF6' : '#B0B0B0',
                                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                    }}>
                                        {label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div style={{
                                        flex: 1,
                                        height: 2.5,
                                        borderRadius: 2,
                                        marginTop: -20,
                                        transition: 'background 0.5s ease',
                                        background: done ? 'linear-gradient(90deg, #7C3AED, #A78BFA)' : '#EEEFF2',
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ─── Log Message ─── */}
                {message && (
                    <div style={styles.logRow}>
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: launched ? '#16A34A' : '#7C3AED',
                            flexShrink: 0,
                            animation: launched ? 'none' : 'ulm-dot-pulse 1s ease-in-out infinite',
                        }} />
                        <span style={{
                            fontSize: 11,
                            color: '#6B7280',
                            fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
                            fontWeight: 500,
                        }}>{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 10, 30, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'ulm-fadein 0.3s ease-out',
    },
    card: {
        background: '#FFFFFF',
        borderRadius: 28,
        padding: '44px 48px 36px',
        width: 440,
        maxWidth: '92vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 24px 80px rgba(124, 58, 237, 0.12), 0 8px 24px rgba(0,0,0,0.08)',
        border: '1px solid rgba(124, 58, 237, 0.06)',
    },
    rocketArea: {
        position: 'relative',
        width: 120,
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    barOuter: {
        width: '100%',
        height: 7,
        backgroundColor: '#F3F0FF',
        borderRadius: 7,
        overflow: 'hidden',
        marginBottom: 16,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: '-60%',
        width: '45%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
        animation: 'ulm-shimmer 1.2s linear infinite',
    },
    stepsRow: {
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 20,
        padding: '0 2px',
    },
    logRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 16px',
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
        border: '1px solid #F0F0F0',
    },
};

export default UploadModal;
