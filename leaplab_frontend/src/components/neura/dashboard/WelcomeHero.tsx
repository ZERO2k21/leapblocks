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
                <div className="relative hidden lg:flex items-center justify-center w-[400px] h-[200px] flex-shrink-0">
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
                    <img src="/Brain.png" alt="" className="relative w-[280px] h-[200px] object-cover object-top opacity-90 pointer-events-none drop-shadow-2xl" />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-5 bg-gradient-to-t from-[#7C3AED]/10 via-[#7C3AED]/4 to-transparent rounded-full blur-sm" />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-32 h-2.5 bg-gradient-to-t from-[#7C3AED]/12 to-transparent rounded-full" />

                    {/* Robot mascot */}
                    <div className="absolute -bottom-2 right-2 animate-float" style={{ animationDelay: '0.6s' }}>
                        <Sparkles size={36} className="text-[#7C3AED] drop-shadow-md" strokeWidth={1.5} />
                    </div>
                </div>
            </div>
        </div>
    );
}
