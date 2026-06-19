/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload, BookOpen, Image, FileText, AudioLines, Sparkles } from 'lucide-react';

interface WelcomeHeroProps {
    onCreateNew?: () => void;
    onImportDataset?: () => void;
    onTutorials?: () => void;
}

export default function WelcomeHero({ onCreateNew, onImportDataset, onTutorials }: WelcomeHeroProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0f0ff] via-white to-[#e8ecff] px-4 sm:px-6 py-5 sm:py-6 mb-6 border border-[#0a015a]/[0.04]">
            {/* Background subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, #0a015a 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }} />

            {/* Ambient glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-[#7C3AED]/[0.07] to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-[#4F46E5]/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex items-center justify-between">
                {/* Left: Text content */}
                <div className="flex-1 max-w-sm">
                    <h1 className="text-xl sm:text-[26px] font-bold text-[#0a015a] mb-1.5 tracking-tight leading-tight">
                        Welcome Back, <span className="neura-gradient-text">Explorer!</span> <span className="inline-block animate-wave">&#x1F44B;</span>
                    </h1>
                    <p className="text-gray-500 text-[13px] mb-6 leading-relaxed">
                        Start building powerful AI models in minutes.<br />
                        No code. Just creativity.
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        <button
                            onClick={onCreateNew}
                            className="neura-button-primary flex items-center gap-1.5 text-xs"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>New Project</span>
                        </button>
                        <button
                            onClick={onImportDataset}
                            className="neura-button-secondary flex items-center gap-1.5 text-xs"
                        >
                            <Upload size={14} strokeWidth={2.2} />
                            <span>Import Dataset</span>
                        </button>
                        <button
                            onClick={onTutorials}
                            className="neura-button-ghost flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#0a015a] border border-[#0a015a]/10 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-[#0a015a]/20 hover:shadow-md transition-all duration-300 whitespace-nowrap"
                        >
                            <BookOpen size={14} strokeWidth={2.2} />
                            <span>Tutorials</span>
                        </button>
                    </div>
                </div>

                {/* Right: Decorative illustration area */}
                <div className="relative hidden lg:flex items-center justify-center w-[400px] h-[200px] flex-shrink-0">
                    {/* Glass data-type cards */}
                    <div className="absolute top-0 left-4 neura-glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 animate-float" style={{ animationDelay: '0s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                            <Image size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Image</p>
                            <p className="text-[9px] text-gray-400">.jpg .png .bmp</p>
                        </div>
                    </div>

                    {/* Text card */}
                    <div className="absolute bottom-2 left-0 neura-glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 animate-float" style={{ animationDelay: '0.4s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                            <FileText size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Text</p>
                            <p className="text-[9px] text-gray-400">.txt .csv .doc</p>
                        </div>
                    </div>

                    {/* Audio card */}
                    <div className="absolute top-0 right-0 neura-glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 animate-float" style={{ animationDelay: '0.2s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-pink-500/20">
                            <AudioLines size={16} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Audio</p>
                            <p className="text-[9px] text-gray-400">.mp3 .wav .asc</p>
                        </div>
                    </div>

                    {/* Central brain illustration with glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/[0.08] to-[#4F46E5]/[0.04] rounded-full blur-2xl scale-110" />
                        <img src="/Brain.png" alt="" className="relative w-[280px] h-[200px] object-cover object-top opacity-90 pointer-events-none drop-shadow-2xl" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-5 bg-gradient-to-t from-[#7C3AED]/10 via-[#7C3AED]/4 to-transparent rounded-full blur-sm" />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-32 h-2.5 bg-gradient-to-t from-[#7C3AED]/12 to-transparent rounded-full" />

                    {/* Sparkle accent */}
                    <div className="absolute -bottom-2 right-2 animate-float" style={{ animationDelay: '0.6s' }}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#7C3AED]/20 rounded-full blur-lg scale-150" />
                            <Sparkles size={36} className="relative text-[#7C3AED] drop-shadow-md" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
