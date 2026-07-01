/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface EmptyStateIllustrationProps {
    onCreateNew?: () => void;
    onImport?: () => void;
}

export default function EmptyStateIllustration({ onCreateNew, onImport }: EmptyStateIllustrationProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-inner flex items-center justify-center text-3xl sm:text-4xl mb-5 sm:mb-6 mx-auto ${isDark ? 'bg-[#1e2035]' : 'bg-white'}`}>
                📦
            </div>

            {/* Heading */}
            <h3 className={`text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>No projects yet</h3>

            {/* Description */}
            <p className={`max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Create your first AI project or import a dataset to get started on your journey.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
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
    );
}
