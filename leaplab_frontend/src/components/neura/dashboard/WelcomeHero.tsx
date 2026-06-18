/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload, BookOpen, Image, FileText, AudioLines, Brain, Sparkles } from 'lucide-react';

interface WelcomeHeroProps {
    onCreateNew?: () => void;
    onImportDataset?: () => void;
    onTutorials?: () => void;
}

export default function WelcomeHero({ onCreateNew, onImportDataset, onTutorials }: WelcomeHeroProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0f0ff] via-white to-[#e8ecff] px-6 py-6 mb-6">
            {/* Background subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, #0a015a 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }} />

            <div className="relative flex items-center justify-between">
                {/* Left: Text content */}
                <div className="flex-1 max-w-sm">
                    <h1 className="text-[26px] font-bold text-[#0a015a] mb-1.5 tracking-tight leading-tight">
                        Welcome Back, Explorer! <span className="inline-block animate-wave">&#x1F44B;</span>
                    </h1>
                    <p className="text-gray-500 text-[13px] mb-6 leading-relaxed">
                        Start building powerful AI models in minutes.<br />
                        No code. Just creativity.
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5">
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
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#0a015a] border border-[#0a015a]/15 bg-white hover:bg-gray-50 transition-all whitespace-nowrap"
                        >
                            <BookOpen size={14} strokeWidth={2.2} />
                            <span>Tutorials</span>
                        </button>
                    </div>
                </div>

                {/* Right: Decorative illustration area */}
                <div className="relative hidden lg:flex items-center justify-center w-[340px] h-[160px] flex-shrink-0">
                    {/* Image card */}
                    <div className="absolute top-0 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-[0_3px_12px_rgba(0,0,0,0.06)] px-3 py-2 flex items-center gap-2.5 border border-gray-100 animate-float" style={{ animationDelay: '0s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                            <Image size={16} className="text-indigo-500" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Image</p>
                            <p className="text-[9px] text-gray-400">.jpg .png .bmp</p>
                        </div>
                    </div>

                    {/* Text card */}
                    <div className="absolute bottom-2 left-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-[0_3px_12px_rgba(0,0,0,0.06)] px-3 py-2 flex items-center gap-2.5 border border-gray-100 animate-float" style={{ animationDelay: '0.4s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                            <FileText size={16} className="text-orange-500" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Text</p>
                            <p className="text-[9px] text-gray-400">.txt .csv .doc</p>
                        </div>
                    </div>

                    {/* Audio card */}
                    <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-[0_3px_12px_rgba(0,0,0,0.06)] px-3 py-2 flex items-center gap-2.5 border border-gray-100 animate-float" style={{ animationDelay: '0.2s' }}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center">
                            <AudioLines size={16} className="text-pink-500" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-800">Audio</p>
                            <p className="text-[9px] text-gray-400">.mp3 .wav .asc</p>
                        </div>
                    </div>

                    {/* Central brain illustration */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[50%]">
                        <div className="absolute inset-0 w-28 h-28 -translate-x-3 -translate-y-3 bg-gradient-radial from-[#7C3AED]/15 via-[#7C3AED]/5 to-transparent rounded-full blur-lg" />
                        <div className="relative w-20 h-20 flex items-center justify-center animate-pulse-slow">
                            <Brain size={48} className="text-[#7C3AED] drop-shadow-lg" strokeWidth={1.5} />
                        </div>
                        <div className="absolute inset-[-14px] border border-[#7C3AED]/12 rounded-full" />
                        <div className="absolute inset-[-24px] border border-dashed border-[#7C3AED]/8 rounded-full" />
                        <div className="absolute -top-4 left-1/2 w-1.5 h-1.5 bg-[#7C3AED]/25 rounded-full animate-float" style={{ animationDelay: '0.1s' }} />
                        <div className="absolute top-1/2 -right-6 w-1 h-1 bg-[#7C3AED]/20 rounded-full animate-float" style={{ animationDelay: '0.3s' }} />
                        <div className="absolute -bottom-3 left-3 w-1.5 h-1.5 bg-[#7C3AED]/15 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-gradient-to-t from-[#7C3AED]/8 via-[#7C3AED]/3 to-transparent rounded-full blur-sm" />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-2 bg-gradient-to-t from-[#7C3AED]/10 to-transparent rounded-full" />
                    </div>

                    {/* Robot mascot */}
                    <div className="absolute -bottom-2 right-2 animate-float" style={{ animationDelay: '0.6s' }}>
                        <Sparkles size={36} className="text-[#7C3AED] drop-shadow-md" strokeWidth={1.5} />
                    </div>
                </div>
            </div>
        </div>
    );
}
