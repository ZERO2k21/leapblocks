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
        <div className={`relative overflow-hidden rounded-2xl border neura-shimmer h-full ${
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
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-[#7C3AED]/[0.08] to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-[#4F46E5]/[0.06] to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#A855F7]/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Main content */}
            <div className="relative flex items-center justify-between gap-6 px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-16 xl:py-20 h-full">
                {/* Left: Text content */}
                <div className="flex-1 min-w-0">
                    {/* Brain icon + Welcome heading */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center animate-glow-ring ${isDark ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/10' : 'bg-gradient-to-br from-[#7C3AED]/15 to-[#4F46E5]/8'}`}>
                            <Brain size={24} className={isDark ? 'text-violet-400' : 'text-[#7C3AED]'} strokeWidth={2} />
                        </div>
                        <h1 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#0a015a]'}`}>
                            Welcome Back, <span className="neura-gradient-text">Explorer!</span>{' '}
                            <span className="inline-block animate-wave">&#x1F44B;</span>
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p className={`text-sm sm:text-base lg:text-lg mt-2 sm:mt-3 max-w-lg ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        Build, train and deploy AI models without coding.{' '}
                        <span className={`font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>No code. Just creativity.</span>
                    </p>

                    {/* Inspirational quote */}
                    <div className={`mt-6 sm:mt-8 max-w-md border-l-2 pl-4 ${isDark ? 'border-violet-500/40' : 'border-[#7C3AED]/30'}`}>
                        <p className={`text-sm sm:text-base lg:text-lg italic leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            "The best way to predict the future is to create it."
                        </p>
                        <p className={`text-[11px] sm:text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
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

                {/* Right: Brain animation and decorative elements */}
                <div className="hidden lg:flex relative items-center justify-center w-full max-w-[400px] xl:max-w-[460px] flex-shrink-0">
                    {/* Glass data-type cards */}
                    {/* Image card - top left */}
                    <div className="absolute top-4 left-4 neura-glass-premium rounded-xl px-4 py-3 flex items-center gap-3 animate-float" style={{ animationDelay: '0s' }}>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                            <Image size={18} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className={`text-[11px] font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Image</p>
                            <p className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>.jpg .png .bmp</p>
                        </div>
                    </div>

                    {/* Text card - bottom left */}
                    <div className="absolute bottom-8 left-2 neura-glass-premium rounded-xl px-4 py-3 flex items-center gap-3 animate-float" style={{ animationDelay: '0.4s' }}>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                            <FileText size={18} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className={`text-[11px] font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Text</p>
                            <p className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>.txt .csv .doc</p>
                        </div>
                    </div>

                    {/* Audio card - top right */}
                    <div className="absolute top-4 right-4 neura-glass-premium rounded-xl px-4 py-3 flex items-center gap-3 animate-float" style={{ animationDelay: '0.2s' }}>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-pink-500/20">
                            <AudioLines size={18} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className={`text-[11px] font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Audio</p>
                            <p className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>.mp3 .wav .asc</p>
                        </div>
                    </div>

                    {/* Purple platform base rings */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        {/* Outermost ring */}
                        <div className="w-64 h-10 rounded-full bg-gradient-to-t from-[#7C3AED]/[0.10] via-[#7C3AED]/[0.06] to-transparent border border-[#7C3AED]/[0.08]" />
                        {/* Middle ring */}
                        <div className="w-52 h-7 -mt-4 rounded-full bg-gradient-to-t from-[#7C3AED]/[0.14] via-[#7C3AED]/[0.08] to-transparent border border-[#7C3AED]/[0.10]" />
                        {/* Inner ring */}
                        <div className="w-40 h-5 -mt-3 rounded-full bg-gradient-to-t from-[#7C3AED]/[0.20] via-[#7C3AED]/[0.10] to-transparent border border-[#7C3AED]/[0.12]" />
                        {/* Center glow */}
                        <div className="w-24 h-2.5 -mt-2 rounded-full bg-[#7C3AED]/[0.15] blur-sm" />
                    </div>

                    {/* Central brain illustration with glow */}
                    <div className="relative z-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/[0.10] to-[#4F46E5]/[0.05] rounded-full blur-2xl scale-110 animate-pulse-slow" />
                        <img src="/Brain.png" alt="" className="relative w-full max-w-[320px] xl:max-w-[380px] h-auto object-cover object-top opacity-90 pointer-events-none drop-shadow-2xl" />
                    </div>

                    {/* Sparkle accent */}
                    <div className="absolute bottom-2 right-6 animate-float" style={{ animationDelay: '0.6s' }}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#7C3AED]/20 rounded-full blur-lg scale-150" />
                            <Sparkles size={36} className="relative text-[#7C3AED] drop-shadow-md" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Floating particle dots */}
                    <div className="absolute top-12 left-12 w-2 h-2 rounded-full bg-[#7C3AED]/40 animate-float" style={{ animationDelay: '0.8s' }} />
                    <div className="absolute bottom-20 right-12 w-1.5 h-1.5 rounded-full bg-[#4F46E5]/50 animate-float" style={{ animationDelay: '1.2s' }} />
                    <div className="absolute top-16 right-16 w-1.5 h-1.5 rounded-full bg-[#A855F7]/40 animate-float" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        </div>
    );
}
