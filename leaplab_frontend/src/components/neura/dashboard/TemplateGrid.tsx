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

const templates: {
    id: ProjectType;
    name: string;
    description: string;
    icon: LucideIcon;
    iconBg: string;
    accentColor: string;
    accentGlow: string;
    hoverShadow: string;
    tagBg: string;
    tagText: string;
    tag: string;
}[] = [
    {
        id: 'image-classifier',
        name: 'Image Classification',
        description: 'Classify images into different categories',
        icon: Image,
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        accentColor: 'from-blue-500 to-indigo-600',
        accentGlow: 'rgba(99, 102, 241, 0.35)',
        hoverShadow: 'hover:shadow-[0_8px_40px_rgba(99,102,241,0.18)]',
        tagBg: 'bg-blue-50',
        tagText: 'text-blue-600',
        tag: 'Vision',
    },
    {
        id: 'object-detection',
        name: 'Object Detection',
        description: 'Detect and locate multiple objects in images',
        icon: ScanSearch,
        iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
        accentColor: 'from-amber-400 to-orange-500',
        accentGlow: 'rgba(249, 115, 22, 0.35)',
        hoverShadow: 'hover:shadow-[0_8px_40px_rgba(249,115,22,0.18)]',
        tagBg: 'bg-orange-50',
        tagText: 'text-orange-600',
        tag: 'Vision',
    },
    {
        id: 'audio-classifier',
        name: 'Audio Classification',
        description: 'Recognize sounds and audio patterns',
        icon: AudioLines,
        iconBg: 'bg-gradient-to-br from-rose-400 to-red-500',
        accentColor: 'from-rose-400 to-red-500',
        accentGlow: 'rgba(239, 68, 68, 0.35)',
        hoverShadow: 'hover:shadow-[0_8px_40px_rgba(239,68,68,0.18)]',
        tagBg: 'bg-red-50',
        tagText: 'text-red-600',
        tag: 'Audio',
    },
    {
        id: 'pose-classifier',
        name: 'Pose Detection',
        description: 'Detect human poses and keypoints',
        icon: PersonStanding,
        iconBg: 'bg-gradient-to-br from-emerald-400 to-green-500',
        accentColor: 'from-emerald-400 to-green-500',
        accentGlow: 'rgba(34, 197, 94, 0.35)',
        hoverShadow: 'hover:shadow-[0_8px_40px_rgba(34,197,94,0.18)]',
        tagBg: 'bg-green-50',
        tagText: 'text-green-600',
        tag: 'Vision',
    },
    {
        id: 'text-classifier',
        name: 'Text Sentiment',
        description: 'Analyze sentiment and opinions in text',
        icon: MessageSquare,
        iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
        accentColor: 'from-violet-400 to-purple-500',
        accentGlow: 'rgba(139, 92, 246, 0.35)',
        hoverShadow: 'hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)]',
        tagBg: 'bg-purple-50',
        tagText: 'text-purple-600',
        tag: 'NLP',
    },
];

export default function TemplateGrid({ onSelectTemplate, onViewAll }: TemplateGridProps) {
    return (
        <div className="mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-bold text-[#0a015a] tracking-tight flex items-center gap-2">
                        <Image size={18} className="text-[#0a015a]" strokeWidth={2.2} />
                        Start with a Template
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Choose a prebuilt template and start training in seconds.</p>
                </div>
                <button
                    onClick={onViewAll}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0a015a]/70 hover:text-[#0a015a] transition-colors duration-200 group"
                >
                    View All Templates
                    <ChevronRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
            </div>

            {/* Template cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {templates.map((template, idx) => {
                    const Icon = template.icon;
                    return (
                        <div
                            key={template.id}
                            className={`relative bg-white rounded-2xl border border-gray-100/80 px-3 sm:px-5 pt-5 sm:pt-7 pb-4 sm:pb-5 flex flex-col items-start cursor-pointer group transition-all duration-300 min-h-[170px] sm:min-h-[220px] shadow-[0_2px_16px_rgba(10,1,90,0.04)] hover:shadow-[0_8px_40px_rgba(10,1,90,0.1)] hover:border-[#0a015a]/15 hover:-translate-y-1 animate-slide-in-up stagger-${idx + 1} ${template.hoverShadow}`}
                            onClick={() => onSelectTemplate?.(template.id)}
                        >
                            {/* Top accent line with glow */}
                            <div
                                className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${template.accentColor} opacity-30 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`}
                                style={{ '--accent-glow': template.accentGlow } as React.CSSProperties}
                            />

                            {/* Tag */}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${template.tagBg} ${template.tagText} mb-4 tracking-wide uppercase`}>
                                {template.tag}
                            </span>

                            {/* Icon with glow */}
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${template.iconBg} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                                <Icon size={24} className="text-white" strokeWidth={2} />
                            </div>

                            {/* Text */}
                            <h3 className="text-[14px] font-extrabold text-[#0a015a] mb-1.5 leading-tight">{template.name}</h3>
                            <p className="text-[12px] text-gray-400 leading-relaxed mb-5 flex-1">{template.description}</p>

                            {/* CTA */}
                            <button className="w-full py-2.5 px-4 rounded-xl text-[12px] font-bold text-white bg-gradient-to-r from-[#0a015a] to-[#15027a] shadow-[0_2px_8px_rgba(10,1,90,0.25)] group-hover:shadow-[0_4px_20px_rgba(10,1,90,0.35)] group-hover:from-[#15027a] group-hover:to-[#1e05a3] transition-all duration-300 active:scale-[0.97] relative overflow-hidden">
                                <span className="relative z-10">Use Template</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
