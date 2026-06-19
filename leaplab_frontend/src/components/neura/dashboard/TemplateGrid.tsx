/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { ChevronRight, Image, ScanSearch, AudioLines, PersonStanding, MessageSquare } from 'lucide-react';
import { ProjectType } from '../../../types/neura.types';
import type { LucideIcon } from 'lucide-react';

interface TemplateGridProps {
    onSelectTemplate?: (typeId: ProjectType) => void;
    onViewAll?: () => void;
}

const templates: { id: ProjectType; name: string; description: string; icon: LucideIcon; iconBg: string }[] = [
    {
        id: 'image-classifier',
        name: 'Image Classification',
        description: 'Classify images into different categories',
        icon: Image,
        iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
        id: 'object-detection',
        name: 'Object Detection',
        description: 'Detect and locate multiple objects in images',
        icon: ScanSearch,
        iconBg: 'bg-gradient-to-br from-orange-400 to-orange-500',
    },
    {
        id: 'audio-classifier',
        name: 'Audio Classification',
        description: 'Recognize sounds and audio patterns',
        icon: AudioLines,
        iconBg: 'bg-gradient-to-br from-red-400 to-red-500',
    },
    {
        id: 'pose-classifier',
        name: 'Pose Detection',
        description: 'Detect human poses and keypoints',
        icon: PersonStanding,
        iconBg: 'bg-gradient-to-br from-green-400 to-green-500',
    },
    {
        id: 'text-classifier',
        name: 'Text Sentiment',
        description: 'Analyze sentiment and opinions in text',
        icon: MessageSquare,
        iconBg: 'bg-gradient-to-br from-purple-400 to-purple-500',
    },
];

export default function TemplateGrid({ onSelectTemplate, onViewAll }: TemplateGridProps) {
    return (
        <div className="mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-[#0a015a] tracking-tight flex items-center gap-2">
                        <Image size={18} className="text-[#0a015a]" strokeWidth={2.2} />
                        Start with a Template
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Choose a prebuilt template and start training in seconds.</p>
                </div>
                <button
                    onClick={onViewAll}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0a015a] hover:text-[#15027a] transition-colors"
                >
                    View All Templates
                    <ChevronRight size={14} strokeWidth={2.5} />
                </button>
            </div>

            {/* Template cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-start min-h-[180px] cursor-pointer group hover:shadow-[0_4px_20px_rgba(10,1,90,0.08)] hover:border-[#0a015a]/10 hover:-translate-y-0.5 transition-all duration-300"
                        onClick={() => onSelectTemplate?.(template.id)}
                    >
                        {/* Colored circular icon */}
                        <div className={`w-12 h-12 rounded-full ${template.iconBg} flex items-center justify-center mb-3 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                            <template.icon size={22} className="text-white" strokeWidth={2} />
                        </div>

                        {/* Text */}
                        <h3 className="text-[14px] font-bold text-[#0a015a] mb-1 leading-tight">{template.name}</h3>
                        <p className="text-[12px] text-gray-400 leading-relaxed mb-4 flex-1">{template.description}</p>

                        {/* CTA */}
                        <button className="w-full py-2 px-3 rounded-lg text-[12px] font-semibold text-[#0a015a] border border-[#0a015a]/12 bg-[#0a015a]/[0.02] hover:bg-[#0a015a]/[0.06] transition-all">
                            Use Template
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
