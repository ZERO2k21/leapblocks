/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Rocket, FolderOpen, Brain, BarChart3 } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface QuickStartGuideProps {
    onWatchTutorial?: () => void;
}

const steps = [
    {
        num: 1,
        title: 'Upload Dataset',
        desc: 'Upload your data in images, audio or text format.',
        icon: FolderOpen,
        iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
        iconShadow: 'shadow-violet-500/25',
    },
    {
        num: 2,
        title: 'Train Model',
        desc: 'Train your machine learning model with powerful ML algorithms.',
        icon: Brain,
        iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
        iconShadow: 'shadow-indigo-500/25',
    },
    {
        num: 3,
        title: 'Deploy & Share',
        desc: 'Deploy your model and share with the world.',
        icon: BarChart3,
        iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        iconShadow: 'shadow-emerald-500/25',
    },
];

export default function QuickStartGuide({ onWatchTutorial }: QuickStartGuideProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className={`rounded-2xl border shadow-[0_2px_16px_rgba(10,1,90,0.04)] p-5 ${isDark ? 'bg-[#1a1d2e] border-white/[0.06]' : 'bg-white border-gray-100/80'}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0a015a] to-[#15027a] flex items-center justify-center shadow-md shadow-[#0a015a]/20">
                    <Rocket size={14} className="text-white" strokeWidth={2.2} />
                </div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-[#0a015a]'}`}>Quick Start</h3>
            </div>

            {/* Steps */}
            <div className="relative space-y-0">
                {/* Connecting line */}
                <div className={`absolute left-[11px] top-[28px] bottom-[28px] w-[2px] bg-gradient-to-b ${isDark ? 'from-violet-500/20 via-violet-500/10 to-transparent' : 'from-[#0a015a]/20 via-[#0a015a]/10 to-transparent'}`} />

                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.num} className={`relative flex items-start gap-3 py-3 px-2 rounded-xl transition-all duration-200 group ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50/60'} ${idx < steps.length - 1 ? 'mb-1' : ''}`}>
                            {/* Step number */}
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0a015a] to-[#15027a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-[#0a015a]/20 relative z-10">
                                {step.num}
                            </div>
                            {/* Icon circle */}
                            <div className={`w-9 h-9 rounded-xl ${step.iconBg} flex items-center justify-center flex-shrink-0 shadow-lg ${step.iconShadow} group-hover:scale-105 transition-transform duration-200`}>
                                <Icon size={16} className="text-white" strokeWidth={2} />
                            </div>
                            {/* Step content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-bold leading-tight ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{step.title}</p>
                                <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{step.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
