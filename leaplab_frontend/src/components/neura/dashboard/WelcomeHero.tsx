/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload, BookOpen, Brain, Image, FileText, AudioLines, Sparkles, Zap, Layers, Target } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface WelcomeHeroProps {
    onCreateNew?: () => void;
    onImportDataset?: () => void;
    onTutorials?: () => void;
}

export default function WelcomeHero({ onCreateNew, onImportDataset, onTutorials }: WelcomeHeroProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className={`relative overflow-hidden h-full flex flex-col ${isDark ? 'bg-[#07050f]' : 'bg-gradient-to-br from-[#FBF9FF] via-[#F3EEFF] to-[#FCEEF7]'}`}>

            {/* ── Animated Mesh Gradient Background ───────────────────────── */}
            <div
                className="absolute inset-0 pointer-events-none animate-mesh-shift opacity-70"
                style={{
                    backgroundImage: isDark
                        ? 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(236,72,153,0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 50% 20%, rgba(59,130,246,0.06) 0%, transparent 50%)'
                        : 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(124,58,237,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(236,72,153,0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 50% 20%, rgba(59,130,246,0.03) 0%, transparent 50%)',
                    backgroundSize: '400% 400%',
                }}
            />

            {/* ── Dot Grid Pattern ────────────────────────────────────────── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: isDark
                        ? 'radial-gradient(rgba(124,58,237,0.25) 1px, transparent 1px)'
                        : 'radial-gradient(rgba(123,63,228,0.18) 1.2px, transparent 1.2px)',
                    backgroundSize: isDark ? '20px 20px' : '18px 18px',
                    maskImage: 'linear-gradient(180deg, black 0%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 60%)',
                    opacity: 0.5,
                }}
            />

            {/* ── Soft Orbs ───────────────────────────────────────────────── */}
            <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background: isDark
                        ? 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)',
                }}
            />
            <div className="absolute bottom-[-5%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: isDark
                        ? 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(236,72,153,0.03) 0%, transparent 70%)',
                }}
            />

            {/* ── Main Content ────────────────────────────────────────────── */}
            <div className="relative flex-1 flex items-center gap-8 px-6 sm:px-10 lg:px-14 py-8 sm:py-10 lg:py-12 min-h-0">

                {/* ── Left: Text Content ──────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">

                    {/* Brain Icon + Welcome Heading */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 animate-hero-stagger" style={{ animationDelay: '0.1s' }}>
                        <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-[#7C3AED]/20 shadow-[0_0_20px_rgba(124,58,237,0.2)]' : 'bg-[#7C3AED]/10 shadow-[0_4px_16px_rgba(124,58,237,0.12)]'}`}>
                            <Brain size={26} className="text-[#7C3AED]" strokeWidth={2} />
                            <div className="absolute inset-0 rounded-2xl border border-[#7C3AED]/20 animate-pulse-slow" />
                        </div>
                        <h1 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-extrabold tracking-tight leading-[1.15] ${isDark ? 'text-white' : 'text-[#1A1440]'}`}>
                            Welcome Back,{' '}
                            <span className="neura-gradient-text">Explorer!</span>{' '}
                            <span className="inline-block animate-wave">&#x1F44B;</span>
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p className={`text-sm sm:text-base lg:text-lg mt-1 sm:mt-2 max-w-lg leading-relaxed animate-hero-stagger ${isDark ? 'text-gray-400' : 'text-[#6B6483]'}`}
                       style={{ animationDelay: '0.25s' }}>
                        Build, train and deploy AI models without coding.
                        <span className="block mt-1.5">
                            <span className={`font-bold ${isDark ? 'text-violet-400' : 'text-[#1A1440]'}`}>No code.</span>{' '}
                            <span className={`font-bold ${isDark ? 'text-pink-400' : 'text-[#EC4899]'}`}>Just creativity.</span>
                        </span>
                    </p>

                    {/* Quick Stats Row */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-5 sm:mt-6 animate-hero-stagger flex-wrap" style={{ animationDelay: '0.35s' }}>
                        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-[#7C3AED]/[0.08] shadow-[0_2px_8px_rgba(124,58,237,0.06)]'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#7C3AED]/15' : 'bg-[#7C3AED]/10'}`}>
                                <Layers size={14} className="text-[#7C3AED]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold leading-none ${isDark ? 'text-gray-200' : 'text-[#1A1440]'}`}>3</p>
                                <p className={`text-[10px] leading-none mt-0.5 ${isDark ? 'text-gray-500' : 'text-[#847E9C]'}`}>Projects</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-[#EC4899]/[0.08] shadow-[0_2px_8px_rgba(236,72,153,0.06)]'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#EC4899]/15' : 'bg-[#EC4899]/10'}`}>
                                <Zap size={14} className="text-[#EC4899]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold leading-none ${isDark ? 'text-gray-200' : 'text-[#1A1440]'}`}>12</p>
                                <p className={`text-[10px] leading-none mt-0.5 ${isDark ? 'text-gray-500' : 'text-[#847E9C]'}`}>Models</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-[#22c55e]/[0.08] shadow-[0_2px_8px_rgba(34,197,94,0.06)]'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#22c55e]/15' : 'bg-[#22c55e]/10'}`}>
                                <Target size={14} className="text-[#22c55e]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold leading-none ${isDark ? 'text-gray-200' : 'text-[#1A1440]'}`}>89%</p>
                                <p className={`text-[10px] leading-none mt-0.5 ${isDark ? 'text-gray-500' : 'text-[#847E9C]'}`}>Accuracy</p>
                            </div>
                        </div>
                    </div>

                    {/* Inspirational Quote */}
                    <div className={`mt-5 sm:mt-6 max-w-md border-l-[3px] pl-4 animate-hero-stagger ${isDark ? 'border-violet-500/40' : 'border-[#7C3AED]/30'}`}
                         style={{ animationDelay: '0.4s' }}>
                        <p className={`text-sm sm:text-base italic leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#6B6483]'}`}>
                            "The best way to predict the future is to create it."
                        </p>
                        <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-500' : 'text-[#A29CB8]'}`}>
                            — Peter Drucker
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-7 animate-hero-stagger" style={{ animationDelay: '0.5s' }}>
                        <button
                            onClick={onCreateNew}
                            className="neura-button-primary flex items-center gap-2.5 text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 active:scale-[0.97]"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                            <span>New Project</span>
                        </button>
                        <button
                            onClick={onImportDataset}
                            className="neura-button-secondary flex items-center gap-2.5 text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 active:scale-[0.97]"
                        >
                            <Upload size={20} strokeWidth={2.2} />
                            <span>Import Dataset</span>
                        </button>
                        <button
                            onClick={onTutorials}
                            className="neura-button-ghost flex items-center gap-2.5 text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 active:scale-[0.97]"
                        >
                            <BookOpen size={18} strokeWidth={2.2} />
                            <span>Tutorials</span>
                        </button>
                    </div>
                </div>

                {/* ── Right: Brain Centerpiece ───────────────────────────── */}
                <div className="hidden lg:flex relative items-center justify-center w-[380px] xl:w-[480px] flex-shrink-0 h-[340px] animate-hero-scale" style={{ animationDelay: '0.3s' }}>

                    {/* Background Glow */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-[300px] h-[300px] xl:w-[360px] xl:h-[360px] rounded-full animate-pulse-slow ${
                            isDark
                                ? 'bg-gradient-to-br from-[#7C3AED]/[0.18] to-[#4F46E5]/[0.06]'
                                : 'bg-gradient-to-br from-[#7C3AED]/[0.10] to-[#4F46E5]/[0.04]'
                        } blur-3xl`} />
                    </div>

                    {/* Rotating Glow Ring (outer) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-[280px] h-[280px] xl:w-[340px] xl:h-[340px] rounded-full border border-dashed animate-glow-ring-rotate ${
                            isDark ? 'border-[#7C3AED]/[0.12]' : 'border-[#7C3AED]/[0.08]'
                        }`} />
                    </div>

                    {/* Pulsing Glow Ring (middle) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-[220px] h-[220px] xl:w-[270px] xl:h-[270px] rounded-full border animate-pulse-slow ${
                            isDark ? 'border-[#7C3AED]/[0.18]' : 'border-[#7C3AED]/[0.12]'
                        }`} style={{ animationDelay: '0.5s' }} />
                    </div>

                    {/* Inner Glow Ring */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-[160px] h-[160px] xl:w-[200px] xl:h-[200px] rounded-full border animate-pulse-slow ${
                            isDark ? 'border-[#A855F7]/[0.15]' : 'border-[#A855F7]/[0.08]'
                        }`} style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Brain Image */}
                    <div className="relative z-10 animate-float" style={{ animationDuration: '6s' }}>
                        <div className="animate-brain-glow rounded-full">
                            <img
                                src="/Brain.png"
                                alt="AI Brain"
                                className={`w-[200px] xl:w-[260px] h-auto object-contain ${
                                    isDark
                                        ? 'drop-shadow-[0_20px_60px_rgba(124,58,237,0.5)]'
                                        : 'drop-shadow-[0_20px_60px_rgba(124,58,237,0.3)]'
                                }`}
                            />
                        </div>
                    </div>

                    {/* ── Floating Data Chips ──────────────────────────────── */}

                    {/* Image Chip - top left */}
                    <div
                        className="absolute top-6 left-4 backdrop-blur-md border rounded-xl px-4 py-3 flex items-center gap-3 animate-float hero-chip-scan shadow-[0_8px_30px_-8px_rgba(60,40,120,0.18)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_-8px_rgba(59,130,246,0.25)] cursor-default"
                        style={{
                            animationDelay: '0s',
                            background: isDark ? 'rgba(20,20,40,0.85)' : 'rgba(255,255,255,0.9)',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(229,231,235,0.6)',
                        }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-[0_4px_8px_rgba(59,130,246,0.3)]">
                            <Image size={15} className="text-white" strokeWidth={2.2} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold leading-tight ${isDark ? 'text-gray-200' : 'text-[#1A1440]'}`}>Image</p>
                            <p className={`text-[10px] leading-tight font-medium ${isDark ? 'text-gray-500' : 'text-[#A9A3BE]'}`}>.jpg .png .bmp</p>
                        </div>
                    </div>

                    {/* Text Chip - bottom left */}
                    <div
                        className="absolute bottom-10 left-8 backdrop-blur-md border rounded-xl px-4 py-3 flex items-center gap-3 animate-float hero-chip-scan shadow-[0_8px_30px_-8px_rgba(60,40,120,0.18)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_-8px_rgba(249,115,22,0.25)] cursor-default"
                        style={{
                            animationDelay: '0.4s',
                            background: isDark ? 'rgba(20,20,40,0.85)' : 'rgba(255,255,255,0.9)',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(229,231,235,0.6)',
                        }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-[0_4px_8px_rgba(249,115,22,0.3)]">
                            <FileText size={15} className="text-white" strokeWidth={2.2} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold leading-tight ${isDark ? 'text-gray-200' : 'text-[#1A1440]'}`}>Text</p>
                            <p className={`text-[10px] leading-tight font-medium ${isDark ? 'text-gray-500' : 'text-[#A9A3BE]'}`}>.txt .csv .doc</p>
                        </div>
                    </div>

                    {/* Audio Chip - right */}
                    <div
                        className="absolute top-20 right-4 backdrop-blur-md border rounded-xl px-4 py-3 flex items-center gap-3 animate-float hero-chip-scan shadow-[0_8px_30px_-8px_rgba(60,40,120,0.18)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_-8px_rgba(236,72,153,0.25)] cursor-default"
                        style={{
                            animationDelay: '0.2s',
                            background: isDark ? 'rgba(20,20,40,0.85)' : 'rgba(255,255,255,0.9)',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(229,231,235,0.6)',
                        }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EC4899] to-[#DB2777] flex items-center justify-center shadow-[0_4px_8px_rgba(236,72,153,0.3)]">
                            <AudioLines size={15} className="text-white" strokeWidth={2.2} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold leading-tight ${isDark ? 'text-gray-200' : 'text-[#1A1440]'}`}>Audio</p>
                            <p className={`text-[10px] leading-tight font-medium ${isDark ? 'text-gray-500' : 'text-[#A9A3BE]'}`}>.mp3 .wav .aac</p>
                        </div>
                    </div>

                    {/* Sparkle Accent */}
                    <div className="absolute bottom-6 right-10 animate-float" style={{ animationDelay: '0.6s' }}>
                        <Sparkles size={20} className={`${isDark ? 'text-pink-400' : 'text-[#EC4899]'} opacity-60`} strokeWidth={1.5} />
                    </div>

                    {/* ── Floating Particle Dots ──────────────────────────── */}
                    <div className="absolute top-16 left-12 w-2 h-2 rounded-full bg-[#7C3AED]/40 animate-float" style={{ animationDelay: '0.8s' }} />
                    <div className="absolute bottom-24 right-14 w-1.5 h-1.5 rounded-full bg-[#4F46E5]/50 animate-float" style={{ animationDelay: '1.2s' }} />
                    <div className="absolute top-12 right-20 w-1.5 h-1.5 rounded-full bg-[#A855F7]/40 animate-float" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute bottom-16 left-20 w-1 h-1 rounded-full bg-[#EC4899]/30 animate-float" style={{ animationDelay: '1.5s' }} />
                </div>
            </div>

            {/* ── Bottom Gradient Fade ──────────────────────────────────── */}
            <div className={`absolute bottom-0 left-0 right-0 h-16 pointer-events-none ${
                isDark
                    ? 'bg-gradient-to-t from-[#07050f] to-transparent'
                    : 'bg-gradient-to-t from-[#F3EEFF]/80 to-transparent'
            }`} />
        </div>
    );
}
