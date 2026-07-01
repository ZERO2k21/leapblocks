/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { NeuraProject } from '../../../types/neura.types';
import { Brain } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';
import { projectTypeConfig, fallbackConfig } from '../config/projectTypeConfig';

interface ProjectListPanelProps {
    projects: NeuraProject[];
    selectedProject: NeuraProject | null;
    onSelectProject: (project: NeuraProject) => void;
}

function formatDateShort(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export default function ProjectListPanel({ projects, selectedProject, onSelectProject }: ProjectListPanelProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 neura-card neura-card-glow overflow-hidden ${isDark ? 'bg-[#0f1222] border-white/[0.08]' : 'bg-white border-gray-100/80'}`}>
            {/* Header */}
            <div className={`px-5 py-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.32em] font-semibold text-[#7c3aed] mb-2">Premium panel</p>
                            <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0a015a]'}`}>My Projects</h3>
                            <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                A polished Neura project panel with centered spacing, responsive layout, and premium card styling.
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-3xl border border-[#0a015a]/15 flex items-center justify-center bg-[#0a015a]/5">
                            <Brain size={16} className="text-[#0a015a]" strokeWidth={2.2} />
                        </div>
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
                    const config = projectTypeConfig[project.type] || fallbackConfig;
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
