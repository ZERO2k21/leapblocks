/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface MyProjectsHeaderProps {
    onCreateNew?: () => void;
}

export default function MyProjectsHeader({ onCreateNew }: MyProjectsHeaderProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className={`text-3xl font-bold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    My <span className="neura-gradient-text">Projects</span>
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage and train your machine learning models</p>
            </div>
            <button
                onClick={onCreateNew}
                className="neura-button-primary flex items-center gap-2 text-sm"
            >
                <Plus size={16} strokeWidth={2.5} />
                <span>New Project</span>
            </button>
        </div>
    );
}
