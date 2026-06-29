/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
import { GraduationCap, ChevronRight, Brain, Image, AudioLines, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface LearningCenterProps {
    onViewAll?: () => void;
}

const tutorials: { id: number; title: string; desc: string; icon: LucideIcon; iconBg: string }[] = [
    {
        id: 1,
        title: "Beginner's Guide to Machine Learning",
        desc: 'Learn the basics of ML and build your first model in minutes.',
        icon: Brain,
        iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    },
    {
        id: 2,
        title: 'Image Classification Tutorial',
        desc: 'Step-by-step guide to training an image classifier.',
        icon: Image,
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
    {
        id: 3,
        title: 'Working with Audio Data',
        desc: 'How to prepare and use audio datasets effectively.',
        icon: AudioLines,
        iconBg: 'bg-gradient-to-br from-rose-400 to-pink-500',
    },
    {
        id: 4,
        title: 'Understanding Model Accuracy',
        desc: 'Tips to improve your model performance and accuracy.',
        icon: BarChart3,
        iconBg: 'bg-gradient-to-br from-emerald-400 to-green-500',
    },
];

export default function LearningCenter({ onViewAll }: LearningCenterProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const { isDark } = useNeuraTheme();

    return (
        <div className={`rounded-2xl border shadow-[0_2px_16px_rgba(10,1,90,0.04)] p-6 ${isDark ? 'bg-[#1a1d2e] border-white/[0.06]' : 'bg-white border-gray-100/80'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0a015a] to-[#15027a] flex items-center justify-center shadow-md shadow-[#0a015a]/20">
                        <GraduationCap size={14} className="text-white" strokeWidth={2.2} />
                    </div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-[#0a015a]'}`}>Learning Center</h3>
                </div>
                <button
                    onClick={onViewAll}
                    className={`flex items-center gap-1 text-xs font-semibold transition-colors duration-200 group ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-[#0a015a]/60 hover:text-[#0a015a]'}`}
                >
                    View All
                    <ChevronRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
            </div>

            {/* Featured tutorial card */}
            <div className={`relative rounded-xl p-4 mb-4 overflow-hidden neura-animated-border ${
                isDark
                    ? 'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 border border-violet-500/20'
                    : 'bg-gradient-to-br from-[#f5f0ff] via-[#ede8ff] to-[#f0ecff] border border-purple-100/50'
            }`}>
                {/* Subtle shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer-slide_3s_ease-in-out_infinite]" />

                <div className="relative flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl ${tutorials[activeIndex].iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {React.createElement(tutorials[activeIndex].icon, { size: 20, className: 'text-white', strokeWidth: 2 })}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-tight mb-1 ${isDark ? 'text-gray-100' : 'text-[#0a015a]'}`}>
                            {tutorials[activeIndex].title}
                        </p>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {tutorials[activeIndex].desc}
                        </p>
                        <button className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold transition-colors ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-[#0a015a] hover:text-[#15027a]'}`}>
                            Start Learning
                            <ChevronRight size={12} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-2">
                {tutorials.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`rounded-full transition-all duration-300 ${
                            i === activeIndex
                                ? 'w-6 h-2 bg-gradient-to-r from-[#0a015a] to-[#4338ca] shadow-sm shadow-[#0a015a]/20'
                                : 'w-2 h-2 bg-gray-200 hover:bg-gray-300 hover:scale-110'
                        }`}
                        aria-label={`Go to tutorial ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
