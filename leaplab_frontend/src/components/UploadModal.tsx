/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
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
        <div className="fixed inset-0 bg-[#0f0a1e]/50 backdrop-blur-xl flex items-center justify-center z-[99999] animate-[ulm-fadein_0.3s_ease-out]">
            <div className="bg-white rounded-3xl p-11 px-12 pb-9 w-[440px] max-w-[92vw] flex flex-col items-center shadow-[0_24px_80px_rgba(124,58,237,0.12),0_8px_24px_rgba(0,0,0,0.08)] border border-purple-600/6">
                {/* ─── Rocket Image ─── */}
                <div className="relative w-[120px] h-[100px] flex items-center justify-center mb-4">
                    {/* Ambient ring */}
                    {!launched && (
                        <div className="absolute w-[120px] h-[120px] rounded-full border-2 border-purple-600/10 animate-[ulm-ring_3s_ease-in-out_infinite]" />
                    )}

                    {/* Rocket Image */}
                    {!launched && (
                        <img
                            src="assets/ui/rocket.png"
                            alt="Uploading"
                            className={`w-20 h-20 object-contain drop-shadow-[0_4px_12px_rgba(124,58,237,0.2)] ${
                                launched
                                    ? 'animate-[ulm-launch_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]'
                                    : 'animate-[ulm-float_2s_ease-in-out_infinite]'
                            }`}
                        />
                    )}

                    {/* Success checkmark */}
                    {launched && (
                        <div className="animate-[ulm-checkpop_0.5s_ease-out_0.3s_both]">
                            <svg width="68" height="68" viewBox="0 0 56 56" fill="none">
                                <circle cx="28" cy="28" r="26" fill="#F0FDF4" stroke="#16A34A" strokeWidth="2.5" />
                                <circle cx="28" cy="28" r="20" fill="#DCFCE7" opacity="0.5" />
                                <path d="M17 28 L24 35 L39 19" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* ─── Title ─── */}
                <div className={`text-[22px] font-extrabold mb-0.75 font-sans tracking-tight ${launched ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {launched ? '🎉 Upload Complete!' : 'Uploading to Board'}
                </div>

                {/* Subtitle */}
                <div className={`text-xs mb-6 font-sans font-medium ${launched ? 'text-emerald-600/70' : 'text-slate-400'}`}>
                    {launched ? 'Your code is now running on the device' : stageLabel}
                </div>

                {/* ─── Progress Bar ─── */}
                <div className="w-full h-1.75 bg-purple-50 rounded-full overflow-hidden mb-4">
                    <div
                        className={`h-full rounded-md transition-[width] duration-150 ease-linear relative overflow-hidden ${
                            launched
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                                : 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400'
                        }`}
                        style={{ width: `${displayPct}%` }}
                    >
                        {!launched && <div className="absolute top-0 -left-[60%] w-[45%] h-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-[ulm-shimmer_1.2s_linear_infinite]" />}
                    </div>
                </div>

                {/* ─── Percentage ─── */}
                <div className={`text-[40px] font-black font-sans tracking-tighter leading-none mb-6 ${launched ? 'text-emerald-600' : 'text-purple-600'}`}>
                    {roundedPct}<span className="text-[22px] font-bold opacity-50">%</span>
                </div>

                {/* ─── Step Indicators ─── */}
                <div className="flex items-start w-full mb-5 px-0.5">
                    {stages.map(({ label, threshold }, i) => {
                        const done = percentage >= threshold;
                        const active = !done && percentage >= threshold - 25;
                        const isLast = i === stages.length - 1;
                        return (
                            <React.Fragment key={label}>
                                <div className="flex flex-col items-center gap-1.25 z-10">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-350 ease-in-out ${
                                        done
                                            ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-[2.5px] border-purple-600 shadow-[0_2px_8px_rgba(124,58,237,0.3)]'
                                            : active
                                            ? 'bg-purple-50 text-purple-600 border-[2.5px] border-purple-300'
                                            : 'bg-slate-50 text-slate-300 border-[2.5px] border-slate-200'
                                    }`}>
                                        {done ? '✓' : ''}
                                    </div>
                                    <span className={`text-[9px] font-sans uppercase tracking-wider ${
                                        done ? 'font-bold text-purple-600' : active ? 'font-semibold text-purple-500' : 'font-medium text-slate-400'
                                    }`}>
                                        {label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className={`flex-1 h-[2.5px] rounded-xs -mt-5 transition-colors duration-500 ease-in-out ${
                                        done ? 'bg-gradient-to-r from-purple-600 to-purple-400' : 'bg-slate-100'
                                    }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ─── Log Message ─── */}
                {message && (
                    <div className="flex items-center gap-2.5 w-full p-2.5 px-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${launched ? 'bg-emerald-600' : 'bg-purple-600 animate-[ulm-dot-pulse_1s_ease-in-out_infinite]'}`} />
                        <span className="text-[11px] text-slate-500 font-mono font-medium">{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadModal;
