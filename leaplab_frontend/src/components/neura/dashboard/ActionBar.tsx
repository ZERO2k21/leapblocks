/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Plus, Upload, Search, FolderOpen } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface ActionBarProps {
    projectCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onCreateNew?: () => void;
    onImport?: () => void;
}

export default function ActionBar({ projectCount, searchQuery, onSearchChange, onCreateNew, onImport }: ActionBarProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl border mb-5 sm:mb-6 transition-colors duration-200 ${
            isDark
                ? 'bg-[#1a1d2e]/80 border-white/[0.06]'
                : 'bg-white border-gray-100/80 shadow-[0_1px_3px_rgba(10,1,90,0.03)]'
        }`}>
            {/* Left: Title + Count */}
            <div className="flex items-center gap-3 shrink-0">
                <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0a015a]'}`}>
                    My Projects
                </h2>
                {projectCount > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[11px] font-bold ${
                        isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-[#0a015a]/8 text-[#0a015a]'
                    }`}>
                        {projectCount}
                    </span>
                )}
            </div>

            {/* Center: Search */}
            <div className={`flex-1 max-w-xs relative`}>
                <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                }`} strokeWidth={2} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search projects..."
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all duration-200 ${
                        isDark
                            ? 'bg-white/[0.04] border border-white/[0.08] text-gray-200 placeholder-gray-500 focus:border-violet-500/40 focus:bg-white/[0.06]'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-[#0a015a]/30 focus:bg-white'
                    }`}
                />
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
                <button
                    onClick={onImport}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                        isDark
                            ? 'text-gray-300 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'
                            : 'text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                >
                    <Upload size={14} strokeWidth={2.2} />
                    <span className="hidden sm:inline">Import</span>
                </button>
                <button
                    onClick={onCreateNew}
                    className="neura-button-primary flex items-center gap-2 !py-2.5 !px-4 !text-xs !rounded-xl"
                >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>New Project</span>
                </button>
            </div>
        </div>
    );
}
