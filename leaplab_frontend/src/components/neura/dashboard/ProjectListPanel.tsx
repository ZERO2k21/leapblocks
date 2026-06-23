/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { NeuraProject } from '../../../types/neura.types';
import { Image, ScanSearch, PersonStanding, Hand, AudioLines, Calculator, FileText, Bot, FolderOpen, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface ProjectListPanelProps {
    projects: NeuraProject[];
    selectedProject: NeuraProject | null;
    onSelectProject: (project: NeuraProject) => void;
}

const typeConfig: Record<string, { icon: LucideIcon; label: string; accentBorder: string }> = {
    'image-classifier': { icon: Image, label: 'Image Classifier', accentBorder: '#6366f1' },
    'object-detection': { icon: ScanSearch, label: 'Object Detection', accentBorder: '#f97316' },
    'pose-classifier': { icon: PersonStanding, label: 'Pose Classifier', accentBorder: '#22c55e' },
    'hand-pose-classifier': { icon: Hand, label: 'Hand Pose', accentBorder: '#06b6d4' },
    'audio-classifier': { icon: AudioLines, label: 'Audio Classifier', accentBorder: '#ef4444' },
    'numbers-cr': { icon: Calculator, label: 'Numbers CR', accentBorder: '#a855f7' },
    'text-classifier': { icon: FileText, label: 'Text Classifier', accentBorder: '#3b82f6' },
};

const fallbackConfig = { icon: Bot, label: 'Unknown', accentBorder: '#6b7280' };

function formatDateShort(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export default function ProjectListPanel({ projects, selectedProject, onSelectProject }: ProjectListPanelProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className={`w-full lg:w-[320px] xl:w-[340px] shrink-0 rounded-2xl border shadow-[0_2px_16px_rgba(10,1,90,0.04)] overflow-hidden flex flex-col ${isDark ? 'bg-[#1a1d2e] border-white/[0.06]' : 'bg-white border-gray-100/80'}`}>
            {/* Header */}
            <div className={`px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-[#0a015a]'}`}>My Projects</h3>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#0a015a]/5 flex items-center justify-center">
                        <Brain size={14} className="text-[#0a015a]" strokeWidth={2.2} />
                    </div>
                </div>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto">
                {projects.length === 0 && (
                    <div className="py-12 text-center px-6">
                        <Brain size={32} className="mx-auto text-gray-200 mb-3" strokeWidth={1.5} />
                        <p className="text-xs text-gray-400">No projects yet</p>
                    </div>
                )}

                {projects.map((project) => {
                    const config = typeConfig[project.type] || fallbackConfig;
                    const Icon = config.icon;
                    const isSelected = selectedProject?.id === project.id;

                    return (
                        <div
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            className="relative px-4 py-3.5 cursor-pointer transition-all duration-200 border-l-[3px] group"
                            style={{
                                borderLeftColor: isSelected ? config.accentBorder : 'transparent',
                                background: isSelected ? `${config.accentBorder}08` : 'transparent',
                            }}
                        >
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ background: `${config.accentBorder}04` }}
                            />

                            <div className="relative flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                                    style={{
                                        background: `linear-gradient(135deg, ${config.accentBorder}18, ${config.accentBorder}08)`,
                                    }}
                                >
                                    <Icon size={16} style={{ color: config.accentBorder }} strokeWidth={2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-[13px] font-semibold truncate ${isDark ? 'text-gray-100' : 'text-[#0a015a]'}`}>{project.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-gray-400 font-medium">{config.label}</p>
                                        <span className="text-[9px] text-gray-300">·</span>
                                        <p className="text-[10px] text-gray-400">{formatDateShort(project.updatedAt)}</p>
                                    </div>
                                </div>
                                {project.modelTrained && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
