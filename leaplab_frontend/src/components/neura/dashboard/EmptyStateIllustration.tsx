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
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-6">
            {/* Illustration */}
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <div className="relative">
                    <Package size={48} className="text-[#0a015a]/30 drop-shadow-sm" strokeWidth={1.5} />
                    <Sparkles size={18} className="absolute -top-3 -right-2 text-amber-400 animate-float" strokeWidth={2} />
                    <Diamond size={16} className="absolute -bottom-1 -left-3 text-purple-400 animate-float" strokeWidth={2} />
                    <Star size={14} className="absolute top-1 -left-4 text-yellow-400 animate-float" strokeWidth={2} />
                </div>
            </div>

            {/* Text content */}
            <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1.5">No projects yet</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed mb-5 max-w-xs">
                    Create your first AI project or import a dataset to get started.
                </p>
                <div className="flex items-center gap-2.5">
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
