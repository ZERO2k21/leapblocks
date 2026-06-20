/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload } from 'lucide-react';

interface EmptyStateIllustrationProps {
    onCreateNew?: () => void;
    onImport?: () => void;
}

export default function EmptyStateIllustration({ onCreateNew, onImport }: EmptyStateIllustrationProps) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: 'radial-gradient(circle, #0a015a 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }} />

            {/* Content */}
            <div className="relative flex flex-col items-center">
                {/* Icon */}
                <div className="w-16 h-16 bg-white rounded-2xl shadow-inner flex items-center justify-center text-4xl mb-6 mx-auto">
                    📦
                </div>

                {/* Heading */}
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">No projects yet</h3>

                {/* Description */}
                <p className="text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
                    Create your first AI project or import a dataset to get started on your journey.
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={onCreateNew}
                        className="neura-button-primary flex items-center gap-2"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>New Project</span>
                    </button>
                    <button
                        onClick={onImport}
                        className="neura-button-secondary flex items-center gap-2"
                    >
                        <Upload size={18} strokeWidth={2.2} />
                        <span>Import Dataset</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
