/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload, BookOpen, Brain, Image, FileText, AudioLines, Sparkles } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface WelcomeHeroProps {
    onCreateNew?: () => void;
    onImportDataset?: () => void;
    onTutorials?: () => void;
}

export default function WelcomeHero({ onCreateNew, onImportDataset, onTutorials }: WelcomeHeroProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className={`relative overflow-hidden rounded-2xl px-6 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6 mb-6 border neura-shimmer ${
            isDark
                ? 'bg-gradient-to-br from-[#1a1d2e] via-[#141627] to-[#1e2035] border-white/[0.06]'
                : 'bg-gradient-to-br from-[#f0f0ff] via-white to-[#e8ecff] border-[#0a015a]/[0.04]'
        }`}>
            {/* Background subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, #0a015a 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }} />

            {/* Ambient glow orbs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-[#7C3AED]/[0.08] to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-gradient-to-tr from-[#4F46E5]/[0.06] to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-[#A855F7]/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex items-center justify-between gap-6">
                {/* Left: Text content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center animate-glow-ring ${isDark ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/10' : 'bg-gradient-to-br from-[#7C3AED]/15 to-[#4F46E5]/8'}`}>
                            <Brain size={20} className={isDark ? 'text-violet-400' : 'text-[#7C3AED]'} strokeWidth={2} />
                        </div>
                        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#0a015a]'}`}>
                            Welcome Back, <span className="neura-gradient-text">Explorer!</span>{' '}
                            <span className="inline-block animate-wave">&#x1F44B;</span>
                        </h1>
                    </div>
                    <p className={`text-sm sm:text-base mt-1.5 max-w-md ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        Build, train and deploy AI models without coding.{' '}
                        <span className={`font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>No code. Just creativity.</span>
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-4 sm:mt-5">
                        <button
                            onClick={onCreateNew}
                            className="neura-button-primary flex items-center gap-2 text-xs sm:text-sm"
                        >
                            <Plus size={15} strokeWidth={2.5} />
                            <span>New Project</span>
                        </button>
                        <button
                            onClick={onImportDataset}
                            className="neura-button-secondary flex items-center gap-2 text-xs sm:text-sm"
                        >
                            <Upload size={15} strokeWidth={2.2} />
                            <span>Import Dataset</span>
                        </button>
                        <button
                            onClick={onTutorials}
                            className="neura-button-ghost flex items-center gap-2 text-xs sm:text-sm"
                        >
                            <BookOpen size={15} strokeWidth={2.2} />
                            <span>Tutorials</span>
                        </button>
                    </div>
                </div>

                {/* Right: Decorative illustration area */}
                <div className="relative hidden lg:flex items-center justify-center w-full max-w-[380px] flex-shrink-0">
                    {/* Glass data-type cards with enhanced animations */}
                    <div className="absolute top-0 left-4 neura-glass-premium rounded-xl px-3 py-2.5 flex items-center gap-2.5 animate-float" style={{ animationDelay: '0s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                            <Image size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Image</p>
                            <p className="text-[9px] text-gray-400">.jpg .png .bmp</p>
                        </div>
                    </div>

                    {/* Text card */}
                    <div className="absolute bottom-2 left-0 neura-glass-premium rounded-xl px-3 py-2.5 flex items-center gap-2.5 animate-float" style={{ animationDelay: '0.4s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                            <FileText size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Text</p>
                            <p className="text-[9px] text-gray-400">.txt .csv .doc</p>
                        </div>
                    </div>

                    {/* Audio card */}
                    <div className="absolute top-0 right-0 neura-glass-premium rounded-xl px-3 py-2.5 flex items-center gap-2.5 animate-float" style={{ animationDelay: '0.2s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-pink-500/20">
                            <AudioLines size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Audio</p>
                            <p className="text-[9px] text-gray-400">.mp3 .wav .asc</p>
                        </div>
                    </div>

                    {/* Central brain illustration with glow - Brain.png NOT modified */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/[0.08] to-[#4F46E5]/[0.04] rounded-full blur-2xl scale-110 animate-pulse-slow" />
                        <img src="/Brain.png" alt="" className="relative w-full max-w-[260px] h-auto object-cover object-top opacity-90 pointer-events-none drop-shadow-2xl" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-5 bg-gradient-to-t from-[#7C3AED]/10 via-[#7C3AED]/4 to-transparent rounded-full blur-sm" />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-32 h-2.5 bg-gradient-to-t from-[#7C3AED]/12 to-transparent rounded-full" />

                    {/* Sparkle accent with particle dots */}
                    <div className="absolute -bottom-2 right-2 animate-float" style={{ animationDelay: '0.6s' }}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#7C3AED]/20 rounded-full blur-lg scale-150" />
                            <Sparkles size={36} className="relative text-[#7C3AED] drop-shadow-md" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Floating particle dots */}
                    <div className="absolute top-8 left-12 w-1.5 h-1.5 rounded-full bg-[#7C3AED]/40 animate-float" style={{ animationDelay: '0.8s' }} />
                    <div className="absolute bottom-12 right-12 w-1 h-1 rounded-full bg-[#4F46E5]/50 animate-float" style={{ animationDelay: '1.2s' }} />
                    <div className="absolute top-16 right-16 w-1 h-1 rounded-full bg-[#A855F7]/40 animate-float" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        </div>
    );
}
