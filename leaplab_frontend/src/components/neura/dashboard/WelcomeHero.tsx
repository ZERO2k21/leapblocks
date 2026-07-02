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
        <div className={`relative overflow-hidden h-full ${isDark ? 'bg-[#0a0618]' : 'bg-gradient-to-br from-[#FBF9FF] via-[#F3EEFF] to-[#FCEEF7]'}`}>
            {/* Dot grid pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-60" style={{
                backgroundImage: 'radial-gradient(rgba(123,63,228,0.2) 1.2px, transparent 1.2px)',
                backgroundSize: '18px 18px',
                maskImage: 'linear-gradient(180deg, black 0%, transparent 80%)',
                WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 80%)',
            }} />

            {/* Premium radial gradient overlays */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: isDark
                    ? 'radial-gradient(80% 60% at 70% 40%, rgba(123,63,228,0.15), transparent 70%), radial-gradient(60% 50% at 20% 80%, rgba(236,72,153,0.10), transparent 60%), radial-gradient(40% 40% at 50% 20%, rgba(59,130,246,0.08), transparent 50%)'
                    : 'radial-gradient(80% 60% at 70% 40%, rgba(123,63,228,0.08), transparent 70%), radial-gradient(60% 50% at 20% 80%, rgba(236,72,153,0.05), transparent 60%), radial-gradient(40% 40% at 50% 20%, rgba(59,130,246,0.04), transparent 50%)'
            }} />

            {/* Main content */}
            <div className="relative flex items-center justify-between gap-6 px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-16 xl:py-20 h-full">
                {/* Left: Text content */}
                <div className="flex-1 min-w-0">
                    {/* Brain icon + Welcome heading */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#7C3AED]/20' : 'bg-[#7C3AED]/12'}`}>
                            <Brain size={22} className="text-[#7C3AED]" strokeWidth={2} />
                        </div>
                        <h1 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#1A1440]'}`}>
                            Welcome Back,{' '}
                            <span className="neura-gradient-text">Explorer!</span>{' '}
                            <span className="inline-block animate-wave">&#x1F44B;</span>
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p className={`text-sm sm:text-base lg:text-lg mt-2 sm:mt-3 max-w-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#6B6483]'}`}>
                        Build, train and deploy AI models without coding.
                        <span className={`block mt-1 font-semibold ${isDark ? 'text-violet-400' : 'text-[#1A1440]'}`}>
                            <span className={isDark ? 'text-violet-400' : 'text-[#1A1440]'}>No code.</span>{' '}
                            <span className={isDark ? 'text-pink-400' : 'text-[#EC4899]'}>Just creativity.</span>
                        </span>
                    </p>

                    {/* Inspirational quote */}
                    <div className={`mt-6 sm:mt-8 max-w-md border-l-[3px] pl-4 ${isDark ? 'border-violet-500/40' : 'border-[#7C3AED]/30'}`}>
                        <p className={`text-sm sm:text-base italic leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#847E9C]'}`}>
                            "The best way to predict the future is to create it."
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-[#A29CB8]'}`}>
                            — Peter Drucker
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-8 lg:mt-10">
                        <button
                            onClick={onCreateNew}
                            className="neura-button-primary flex items-center gap-2.5 text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                            <span>New Project</span>
                        </button>
                        <button
                            onClick={onImportDataset}
                            className="neura-button-secondary flex items-center gap-2.5 text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5"
                        >
                            <Upload size={20} strokeWidth={2.2} />
                            <span>Import Dataset</span>
                        </button>
                        <button
                            onClick={onTutorials}
                            className="neura-button-ghost flex items-center gap-2.5 text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5"
                        >
                            <BookOpen size={18} strokeWidth={2.2} />
                            <span>Tutorials</span>
                        </button>
                    </div>
                </div>

                {/* Right: Big Brain centerpiece */}
                <div className="hidden lg:flex relative items-center justify-center w-full max-w-[460px] xl:max-w-[540px] flex-shrink-0 h-[320px]">
                    {/* Background glow behind brain */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#7C3AED]/[0.18] to-[#4F46E5]/[0.08] blur-3xl animate-pulse-slow" />
                    </div>

                    {/* Concentric glow rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[280px] h-[280px] rounded-full border border-[#7C3AED]/[0.10] animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[220px] h-[220px] rounded-full border border-[#7C3AED]/[0.15] animate-pulse-slow" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Big Brain image */}
                    <div className="relative z-10 animate-float" style={{ animationDuration: '6s' }}>
                        <img
                            src="/Brain.png"
                            alt="AI Brain"
                            className="w-[260px] xl:w-[320px] h-auto object-contain drop-shadow-[0_20px_60px_rgba(123,63,228,0.4)]"
                        />
                    </div>

                    {/* Image chip - floating left */}
                    <div className="absolute top-4 -left-6 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl px-4 py-3 flex items-center gap-3 animate-float shadow-[0_8px_30px_-8px_rgba(60,40,120,0.2)]" style={{ animationDelay: '0s' }}>
                        <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center">
                            <Image size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#1A1440] leading-tight">Image</p>
                            <p className="text-[10px] text-[#A9A3BE] leading-tight">.jpg .png .bmp</p>
                        </div>
                    </div>

                    {/* Text chip - floating bottom left */}
                    <div className="absolute bottom-8 -left-2 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl px-4 py-3 flex items-center gap-3 animate-float shadow-[0_8px_30px_-8px_rgba(60,40,120,0.2)]" style={{ animationDelay: '0.4s' }}>
                        <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
                            <FileText size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#1A1440] leading-tight">Text</p>
                            <p className="text-[10px] text-[#A9A3BE] leading-tight">.txt .csv .doc</p>
                        </div>
                    </div>

                    {/* Audio chip - floating right */}
                    <div className="absolute top-16 -right-6 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl px-4 py-3 flex items-center gap-3 animate-float shadow-[0_8px_30px_-8px_rgba(60,40,120,0.2)]" style={{ animationDelay: '0.2s' }}>
                        <div className="w-8 h-8 rounded-lg bg-[#EC4899] flex items-center justify-center">
                            <AudioLines size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#1A1440] leading-tight">Audio</p>
                            <p className="text-[10px] text-[#A9A3BE] leading-tight">.mp3 .wav .aac</p>
                        </div>
                    </div>

                    {/* Sparkle accent */}
                    <div className="absolute bottom-4 right-8 animate-float" style={{ animationDelay: '0.6s' }}>
                        <Sparkles size={24} className="text-[#EC4899] opacity-80" strokeWidth={1.5} />
                    </div>

                    {/* Floating particle dots */}
                    <div className="absolute top-16 left-12 w-2 h-2 rounded-full bg-[#7C3AED]/40 animate-float" style={{ animationDelay: '0.8s' }} />
                    <div className="absolute bottom-24 right-14 w-1.5 h-1.5 rounded-full bg-[#4F46E5]/50 animate-float" style={{ animationDelay: '1.2s' }} />
                    <div className="absolute top-12 right-20 w-1.5 h-1.5 rounded-full bg-[#A855F7]/40 animate-float" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute bottom-16 left-20 w-1 h-1 rounded-full bg-[#EC4899]/30 animate-float" style={{ animationDelay: '1.5s' }} />
                </div>
            </div>
        </div>
    );
}
