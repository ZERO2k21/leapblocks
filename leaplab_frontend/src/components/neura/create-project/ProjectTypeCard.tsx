/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { ProjectTypeInfo, ProjectType } from '../../../types/neura.types';
import TypeIllustration from './TypeIllustrations';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface ProjectTypeCardProps {
    type: ProjectTypeInfo;
    selected?: boolean;
    onClick?: () => void;
}

export default function ProjectTypeCard({ type, selected, onClick }: ProjectTypeCardProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer rounded-2xl p-3.5 sm:p-4 flex flex-col items-center text-center transition-all duration-300 group h-full min-h-[160px] sm:min-h-[180px] ${
                selected
                    ? `border-2 scale-[1.02] ${isDark ? 'border-[#7c3aed] bg-white/[0.05]' : 'border-[#0a015a] bg-[#f8f9ff]'}`
                    : `border-2 border-dashed ${isDark ? 'border-white/[0.1] bg-[#13131f]' : 'border-gray-200 bg-white'}`
            } ${!selected ? (isDark ? 'hover:border-[#7c3aed]/40 hover:bg-white/[0.03]' : 'hover:border-[#0a015a]/40 hover:bg-[#fafbff]') : ''} hover:scale-[1.01]`}
            style={!selected ? { boxShadow: 'none' } : { boxShadow: '0 0 0 3px rgba(10,1,90,0.1), 0 8px 30px rgba(10,1,90,0.12)' }}
        >
            {/* Selected checkmark */}
            {selected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#0a015a] to-[#15027a] flex items-center justify-center shadow-lg z-10" style={{ animation: 'neura-fade-in-scale 0.3s cubic-bezier(0.4,0,0.2,1) both' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            )}

            {/* Illustration area */}
            <div className={`w-full h-[80px] sm:h-[100px] flex items-center justify-center mb-2.5 sm:mb-3 rounded-xl overflow-hidden ${isDark ? 'bg-gradient-to-b from-white/[0.03] to-transparent' : 'bg-gradient-to-b from-gray-50/80 to-transparent'}`}>
                <TypeIllustration type={type.id as ProjectType} className="w-full h-full object-contain" />
            </div>

            {/* Label */}
            <h3 className={`text-[12px] sm:text-[13px] font-bold tracking-tight transition-colors duration-200 ${
                selected
                    ? (isDark ? 'text-violet-300' : 'text-[#0a015a]')
                    : (isDark ? 'text-gray-300 group-hover:text-violet-300' : 'text-gray-700 group-hover:text-[#0a015a]')
            }`}>
                {type.name}
            </h3>

            {/* Description */}
            {type.description && (
                <p className={`text-[10px] mt-1 leading-relaxed line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{type.description}</p>
            )}
        </div>
    );
}
