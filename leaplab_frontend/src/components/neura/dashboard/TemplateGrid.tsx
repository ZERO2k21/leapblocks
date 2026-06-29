/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { ChevronRight, Image, ScanSearch, AudioLines, PersonStanding, MessageSquare } from 'lucide-react';
import { ProjectType } from '../../../types/neura.types';
import type { LucideIcon } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

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
    accentFrom: string;
    accentTo: string;
    accentGlow: string;
    tag: string;
    popular?: boolean;
}[] = [
    {
        id: 'image-classifier',
        name: 'Image Classification',
        description: 'Instantly classify images into custom categories using powerful convolutional networks.',
        icon: Image,
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        accentFrom: '#3b82f6',
        accentTo: '#6366f1',
        accentGlow: 'rgba(99, 102, 241, 0.35)',
        tag: 'Vision',
        popular: true,
    },
    {
        id: 'object-detection',
        name: 'Object Detection',
        description: 'Detect and locate multiple objects with precise bounding boxes in real-time.',
        icon: ScanSearch,
        iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
        accentFrom: '#f59e0b',
        accentTo: '#f97316',
        accentGlow: 'rgba(249, 115, 22, 0.35)',
        tag: 'Vision',
        popular: true,
    },
    {
        id: 'audio-classifier',
        name: 'Audio Classification',
        description: 'Recognize sounds, speech patterns, and audio events with high accuracy.',
        icon: AudioLines,
        iconBg: 'bg-gradient-to-br from-rose-400 to-red-500',
        accentFrom: '#fb7185',
        accentTo: '#ef4444',
        accentGlow: 'rgba(239, 68, 68, 0.35)',
        tag: 'Audio',
    },
    {
        id: 'pose-classifier',
        name: 'Human Pose Detection',
        description: 'Track body keypoints and human poses for movement analysis and AR applications.',
        icon: PersonStanding,
        iconBg: 'bg-gradient-to-br from-emerald-400 to-green-500',
        accentFrom: '#34d399',
        accentTo: '#22c55e',
        accentGlow: 'rgba(34, 197, 94, 0.35)',
        tag: 'Vision',
    },
    {
        id: 'text-classifier',
        name: 'Sentiment Analysis',
        description: 'Understand emotions and opinions in text with advanced NLP models.',
        icon: MessageSquare,
        iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
        accentFrom: '#a78bfa',
        accentTo: '#8b5cf6',
        accentGlow: 'rgba(139, 92, 246, 0.35)',
        tag: 'NLP',
    },
];

export default function TemplateGrid({ onSelectTemplate, onViewAll }: TemplateGridProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className="mt-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0a015a]'}`}>
                        Start with a Template
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Choose a prebuilt template and start training in seconds.</p>
                </div>
                <button
                    onClick={onViewAll}
                    className={`flex items-center gap-1.5 text-base font-semibold transition-colors duration-200 group ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
                >
                    View All Templates
                    <ChevronRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
            </div>

            {/* Template cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-7">
                {templates.map((template, idx) => {
                    const Icon = template.icon;
                    return (
                        <div
                            key={template.id}
                            className={`neura-premium-card neura-card-glow group animate-slide-in-up stagger-${idx + 1}`}
                            style={{
                                '--accent-from': template.accentFrom,
                                '--accent-to': template.accentTo,
                                '--accent-glow': template.accentGlow,
                            } as React.CSSProperties}
                            onClick={() => onSelectTemplate?.(template.id)}
                        >
                            {/* Popular badge */}
                            {template.popular && (
                                <div className="neura-popular-badge">Popular</div>
                            )}

                            {/* Icon */}
                            <div className={`neura-icon-wrapper ${template.iconBg} group-hover:shadow-lg`}>
                                <Icon size={32} className="text-white" strokeWidth={1.8} />
                            </div>

                            {/* Category badge */}
                            <span className="neura-category-badge">{template.tag}</span>

                            {/* Title */}
                            <h3 className="neura-card-title">{template.name}</h3>

                            {/* Description */}
                            <p className="neura-card-desc">{template.description}</p>

                            {/* Button */}
                            <button className="neura-use-btn" onClick={(e) => {
                                e.stopPropagation();
                                onSelectTemplate?.(template.id);
                            }}>
                                Use Template
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
