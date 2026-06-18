/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
import { GraduationCap, ChevronRight, Brain, Image, AudioLines, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LearningCenterProps {
    onViewAll?: () => void;
}

const tutorials: { id: number; title: string; desc: string; icon: LucideIcon }[] = [
    {
        id: 1,
        title: "Beginner's Guide to Machine Learning",
        desc: 'Learn the basics of ML and build your first model in minutes.',
        icon: Brain,
    },
    {
        id: 2,
        title: 'Image Classification Tutorial',
        desc: 'Step-by-step guide to training an image classifier.',
        icon: Image,
    },
    {
        id: 3,
        title: 'Working with Audio Data',
        desc: 'How to prepare and use audio datasets effectively.',
        icon: AudioLines,
    },
    {
        id: 4,
        title: 'Understanding Model Accuracy',
        desc: 'Tips to improve your model performance and accuracy.',
        icon: BarChart3,
    },
];

export default function LearningCenter({ onViewAll }: LearningCenterProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-[#0a015a]" strokeWidth={2.2} />
                    <h3 className="text-base font-bold text-[#0a015a]">Learning Center</h3>
                </div>
                <button
                    onClick={onViewAll}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0a015a] hover:text-[#15027a] transition-colors"
                >
                    View All
                    <ChevronRight size={14} strokeWidth={2.5} />
                </button>
            </div>

            {/* Tutorial card */}
            <div className="bg-gradient-to-br from-[#f5f0ff] to-[#ede8ff] rounded-xl p-4 mb-4 border border-purple-100/50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                        {React.createElement(tutorials[activeIndex].icon, { size: 20, className: 'text-[#0a015a]', strokeWidth: 2 })}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0a015a] leading-tight mb-1">
                            {tutorials[activeIndex].title}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            {tutorials[activeIndex].desc}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-2">
                {tutorials.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            i === activeIndex
                                ? 'bg-[#0a015a] w-5'
                                : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to tutorial ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
