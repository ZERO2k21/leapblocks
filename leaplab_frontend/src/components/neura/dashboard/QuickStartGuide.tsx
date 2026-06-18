/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Rocket, FolderOpen, Brain, BarChart3 } from 'lucide-react';

interface QuickStartGuideProps {
    onWatchTutorial?: () => void;
}

const steps = [
    {
        num: 1,
        title: 'Upload Dataset',
        desc: 'Upload your data in images, audio or text format.',
        icon: FolderOpen,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
    },
    {
        num: 2,
        title: 'Train Model',
        desc: 'Train your machine learning model with powerful ML algorithms.',
        icon: Brain,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
    },
    {
        num: 3,
        title: 'Deploy & Share',
        desc: 'Deploy your model and share with the world.',
        icon: BarChart3,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
    },
];

export default function QuickStartGuide({ onWatchTutorial }: QuickStartGuideProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <Rocket size={16} className="text-[#0a015a]" strokeWidth={2.2} />
                <h3 className="text-sm font-bold text-[#0a015a]">Quick Start</h3>
            </div>

            {/* Steps */}
            <div className="space-y-4">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.num} className="flex items-start gap-3">
                            {/* Step number */}
                            <div className="w-6 h-6 rounded-full bg-[#0a015a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {step.num}
                            </div>
                            {/* Icon circle */}
                            <div className={`w-9 h-9 rounded-lg ${step.iconBg} flex items-center justify-center flex-shrink-0`}>
                                <Icon size={16} className={step.iconColor} strokeWidth={2} />
                            </div>
                            {/* Step content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-gray-800 leading-tight">{step.title}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
