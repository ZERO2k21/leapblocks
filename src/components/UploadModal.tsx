import React, { useEffect, useState } from 'react';

interface UploadModalProps {
    isOpen: boolean;
    progress: string; // Format: "25%: Configuring board..."
}

// Inject keyframe animations once
function injectAnimations() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ulm-anims')) return;
    const tag = document.createElement('style');
    tag.id = 'ulm-anims';
    tag.textContent = `
        @keyframes ulm-fadein {
            from { opacity: 0; transform: scale(0.96); }
            to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ulm-rocket-hover {
            0%, 100% { transform: translateY(0) rotate(-8deg); }
            50%      { transform: translateY(-6px) rotate(-8deg); }
        }
        @keyframes ulm-rocket-launch {
            0%   { transform: translateY(0) rotate(-45deg) scale(1); opacity: 1; }
            60%  { transform: translateY(-80px) rotate(-45deg) scale(1.1); opacity: 1; }
            100% { transform: translateY(-300px) rotate(-45deg) scale(0.5); opacity: 0; }
        }
        @keyframes ulm-shimmer {
            0%   { left: -50%; }
            100% { left: 120%; }
        }
        @keyframes ulm-pulse {
            0%, 100% { opacity: 0.6; }
            50%      { opacity: 1; }
        }
        @keyframes ulm-checkpop {
            0%   { transform: scale(0); }
            60%  { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        @keyframes ulm-exhaust {
            0%   { opacity: 0.7; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(var(--ex), var(--ey)) scale(0.3); }
        }
    `;
    document.head.appendChild(tag);
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, progress }) => {
    injectAnimations();

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

    // Stage label
    const stageLabel =
        percentage === 0 ? 'Initializing...' :
            percentage < 15 ? 'Checking Arduino CLI...' :
                percentage < 40 ? 'Saving Sketch...' :
                    percentage < 70 ? 'Compiling Code...' :
                        percentage < 100 ? 'Uploading to Board...' :
                            'Upload Complete!';

    // Small exhaust particles behind rocket
    const [exhaust] = useState(() =>
        Array.from({ length: 6 }, (_, i) => ({
            key: i,
            ex: 10 + Math.random() * 20,
            ey: 10 + Math.random() * 15,
            delay: i * 0.08,
            size: 3 + Math.random() * 4,
        }))
    );

    // Stages for pill indicators
    const stages = [
        { label: 'Init', threshold: 5 },
        { label: 'Save', threshold: 15 },
        { label: 'Compile', threshold: 40 },
        { label: 'Upload', threshold: 70 },
        { label: 'Done', threshold: 100 },
    ];

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                {/* ─── Rocket Icon ─── */}
                <div style={styles.rocketArea}>
                    {/* Exhaust particles */}
                    {!launched && percentage > 10 && exhaust.map(p => (
                        <div key={p.key} style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 12,
                            width: p.size,
                            height: p.size,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(133, 92, 214, 0.3)',
                            ['--ex' as any]: `${p.ex}px`,
                            ['--ey' as any]: `${p.ey}px`,
                            animation: `ulm-exhaust 0.6s ${p.delay}s ease-out infinite`,
                            pointerEvents: 'none',
                        }} />
                    ))}

                    {/* Rocket SVG */}
                    <div style={{
                        animation: launched
                            ? 'ulm-rocket-launch 1s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                            : 'ulm-rocket-hover 1.5s ease-in-out infinite',
                        transformOrigin: 'center center',
                    }}>
                        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Exhaust flame */}
                            {!launched && percentage > 5 && (
                                <g>
                                    <ellipse cx="50" cy="50" rx="5" ry="8" fill="#FFB020" opacity="0.7" transform="rotate(45 50 50)" />
                                    <ellipse cx="52" cy="52" rx="3" ry="5" fill="#FFD666" opacity="0.8" transform="rotate(45 52 52)" />
                                </g>
                            )}
                            {/* Body */}
                            <path d="M18 46 L32 8 L46 46 C40 42 24 42 18 46Z" fill="#855CD6" />
                            {/* Nose highlight */}
                            <path d="M28 20 L32 8 L36 20 C34 18 30 18 28 20Z" fill="#B794F6" />
                            {/* Window */}
                            <circle cx="32" cy="30" r="6" fill="white" opacity="0.9" />
                            <circle cx="32" cy="30" r="4.5" fill="#DBEAFE" />
                            <ellipse cx="30.5" cy="28.5" rx="2" ry="1.2" fill="white" opacity="0.6" transform="rotate(-20 30.5 28.5)" />
                            {/* Left fin */}
                            <path d="M18 46 L10 54 L20 50Z" fill="#7C3AED" />
                            {/* Right fin */}
                            <path d="M46 46 L54 54 L44 50Z" fill="#7C3AED" />
                            {/* Center nozzle */}
                            <rect x="29" y="46" width="6" height="4" rx="1" fill="#6B7280" />
                        </svg>
                    </div>

                    {/* Success checkmark replaces rocket */}
                    {launched && (
                        <div style={{
                            position: 'absolute',
                            animation: 'ulm-checkpop 0.4s ease-out 0.8s both',
                        }}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="22" fill="#DCFCE7" stroke="#16A34A" strokeWidth="2" />
                                <path d="M14 24 L21 31 L34 17" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* ─── Title ─── */}
                <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: launched ? '#16A34A' : '#1F2937',
                    marginBottom: 6,
                    transition: 'color 0.3s',
                    fontFamily: '"Segoe UI", sans-serif',
                }}>
                    {launched ? 'Upload Complete!' : 'Uploading...'}
                </div>

                {/* ─── Progress Bar ─── */}
                <div style={styles.barOuter}>
                    <div style={{
                        ...styles.barFill,
                        width: `${percentage}%`,
                        backgroundColor: launched ? '#16A34A' : '#855CD6',
                    }}>
                        {!launched && <div style={styles.shimmer} />}
                    </div>
                </div>

                {/* ─── Stage Pills ─── */}
                <div style={styles.stageRow}>
                    {stages.map(({ label, threshold }) => {
                        const done = percentage >= threshold;
                        const active = !done && percentage >= threshold - 30;
                        return (
                            <div key={label} style={{
                                ...styles.pill,
                                backgroundColor: done ? '#855CD6' : active ? '#F3E8FF' : '#F3F4F6',
                                color: done ? 'white' : active ? '#7C3AED' : '#9CA3AF',
                                borderColor: active ? '#C4B5FD' : 'transparent',
                                fontWeight: done || active ? 700 : 500,
                            }}>
                                {done ? '✓' : ''} {label}
                            </div>
                        );
                    })}
                </div>

                {/* ─── Status Message ─── */}
                <div style={styles.statusRow}>
                    <span style={{
                        ...styles.statusText,
                        animation: launched ? 'none' : 'ulm-pulse 1.2s ease-in-out infinite',
                    }}>
                        {stageLabel}
                    </span>
                    <span style={{
                        ...styles.pctText,
                        color: launched ? '#16A34A' : '#855CD6',
                    }}>
                        {percentage}%
                    </span>
                </div>

                {/* ─── Detail message ─── */}
                {message && (
                    <div style={styles.detailRow}>
                        <span style={styles.detailDot} />
                        <span style={styles.detailText}>{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Styles ───
const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'ulm-fadein 0.25s ease-out',
    },
    card: {
        background: 'white',
        borderRadius: 20,
        padding: '32px 36px 28px',
        width: 400,
        maxWidth: '90vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(133, 92, 214, 0.15), 0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid rgba(133, 92, 214, 0.12)',
    },
    rocketArea: {
        position: 'relative',
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    barOuter: {
        width: '100%',
        height: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 14,
    },
    barFill: {
        height: '100%',
        borderRadius: 8,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), background-color 0.3s',
        position: 'relative',
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: '-50%',
        width: '40%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        animation: 'ulm-shimmer 1.2s linear infinite',
    },
    stageRow: {
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    pill: {
        fontSize: 10,
        padding: '3px 10px',
        borderRadius: 12,
        border: '1px solid transparent',
        transition: 'all 0.3s ease',
        fontFamily: '"Segoe UI", sans-serif',
    },
    statusRow: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: 500,
        color: '#6B7280',
        fontFamily: '"Segoe UI", sans-serif',
    },
    pctText: {
        fontSize: 20,
        fontWeight: 800,
        fontFamily: '"Segoe UI", sans-serif',
        transition: 'color 0.3s',
    },
    detailRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 12px',
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        border: '1px solid #F3F4F6',
    },
    detailDot: {
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: '#855CD6',
        flexShrink: 0,
        animation: 'ulm-pulse 0.8s ease-in-out infinite',
    },
    detailText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontFamily: 'Consolas, monospace',
    },
};

export default UploadModal;
