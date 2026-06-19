/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload, Package, Sparkles, Diamond, Star } from 'lucide-react';

interface EmptyStateIllustrationProps {
    onCreateNew?: () => void;
    onImport?: () => void;
}

export default function EmptyStateIllustration({ onCreateNew, onImport }: EmptyStateIllustrationProps) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f8f9ff] via-white to-[#f0f2ff] rounded-2xl border border-[#0a015a]/[0.06] p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-[0_2px_16px_rgba(10,1,90,0.04)]">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'radial-gradient(circle, #0a015a 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }} />

            {/* Illustration */}
            <div className="relative w-20 h-20 sm:w-36 sm:h-36 flex-shrink-0 flex items-center justify-center">
                {/* Glow behind icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/[0.12] via-purple-400/[0.08] to-transparent rounded-full blur-2xl" />

                <div className="relative">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/8 flex items-center justify-center animate-pulse-slow">
                        <Package size={32} className="text-[#0a015a]/50 sm:hidden" strokeWidth={1.5} />
                        <Package size={40} className="text-[#0a015a]/50 hidden sm:block" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-3 -right-2 animate-float" style={{ animationDelay: '0s' }}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md scale-150" />
                            <Sparkles size={16} className="relative text-amber-400 drop-shadow-sm sm:hidden" strokeWidth={2} />
                            <Sparkles size={18} className="relative text-amber-400 drop-shadow-sm hidden sm:block" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -left-3 animate-float" style={{ animationDelay: '0.4s' }}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-400/30 rounded-full blur-md scale-150" />
                            <Diamond size={14} className="relative text-purple-400 drop-shadow-sm sm:hidden" strokeWidth={2} />
                            <Diamond size={16} className="relative text-purple-400 drop-shadow-sm hidden sm:block" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="absolute top-1 -left-4 animate-float" style={{ animationDelay: '0.8s' }}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-md scale-150" />
                            <Star size={12} className="relative text-yellow-400 drop-shadow-sm sm:hidden" strokeWidth={2} />
                            <Star size={14} className="relative text-yellow-400 drop-shadow-sm hidden sm:block" strokeWidth={2} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Text content */}
            <div className="flex-1 relative text-center sm:text-left">
                <h3 className="text-lg font-bold text-gray-800 mb-1.5">No projects yet</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed mb-5 max-w-xs mx-auto sm:mx-0">
                    Create your first AI project or import a dataset to get started.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <button
                        onClick={onCreateNew}
                        className="neura-button-primary flex items-center gap-1.5 text-xs"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Create Project</span>
                    </button>
                    <button
                        onClick={onImport}
                        className="neura-button-secondary flex items-center gap-1.5 text-xs"
                    >
                        <Upload size={14} strokeWidth={2.2} />
                        <span>Import Project</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
