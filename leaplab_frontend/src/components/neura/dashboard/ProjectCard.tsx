/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { NeuraProject } from '../../../types/neura.types';
import { Image, ScanSearch, PersonStanding, Hand, AudioLines, Calculator, FileText, Bot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ProjectCardProps {
    project: NeuraProject;
    onClick?: () => void;
}

const projectConfig: Record<string, { icon: LucideIcon; gradient: string; glow: string; accentBorder: string }> = {
    'image-classifier': { icon: Image, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/25', accentBorder: '#6366f1' },
    'object-detection': { icon: ScanSearch, gradient: 'from-amber-400 to-orange-500', glow: 'shadow-orange-500/25', accentBorder: '#f97316' },
    'pose-classifier': { icon: PersonStanding, gradient: 'from-emerald-400 to-green-500', glow: 'shadow-green-500/25', accentBorder: '#22c55e' },
    'hand-pose-classifier': { icon: Hand, gradient: 'from-teal-400 to-cyan-500', glow: 'shadow-cyan-500/25', accentBorder: '#06b6d4' },
    'audio-classifier': { icon: AudioLines, gradient: 'from-rose-400 to-red-500', glow: 'shadow-red-500/25', accentBorder: '#ef4444' },
    'numbers-cr': { icon: Calculator, gradient: 'from-violet-400 to-purple-500', glow: 'shadow-purple-500/25', accentBorder: '#a855f7' },
    'text-classifier': { icon: FileText, gradient: 'from-sky-400 to-blue-500', glow: 'shadow-blue-500/25', accentBorder: '#3b82f6' },
};

const fallbackConfig = { icon: Bot, gradient: 'from-gray-400 to-gray-500', glow: 'shadow-gray-500/25', accentBorder: '#6b7280' };

function getRelativeTime(date: number): string {
    const diff = Date.now() - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
    const config = projectConfig[project.type] || fallbackConfig;
    const IconComp = config.icon;

    return (
        <div
            onClick={onClick}
            className="neura-card p-6 cursor-pointer group"
            style={{ borderLeft: `4px solid ${config.accentBorder}` }}
        >
            {/* Project icon and type */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg ${config.glow} group-hover:scale-105 transition-transform duration-300`}>
                    <IconComp size={22} className="text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#0a015a] tracking-tight truncate">{project.name}</h3>
                    <p className="text-xs text-gray-400 font-medium capitalize">{project.type.replace(/-/g, ' ')}</p>
                </div>
            </div>

            {/* Project stats */}
            <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Classes</span>
                    <span className="font-bold text-[#0a015a] text-sm">{project.classes.length}</span>
                </div>
                {project.modelTrained && (
                    <span className="neura-badge neura-badge-success">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Trained
                    </span>
                )}
            </div>

            {/* Accuracy bar if trained */}
            {project.accuracy != null && (
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-gray-400 font-medium">Accuracy</span>
                        <span className="text-sm font-bold text-[#0a015a]">{project.accuracy}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#0a015a] to-[#4338ca] rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(project.accuracy, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium">
                        {getRelativeTime(project.updatedAt)}
                    </span>
                    <span className="text-[11px] text-[#0a015a]/40 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Open &rarr;
                    </span>
                </div>
            </div>
        </div>
    );
}
