/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { NeuraProject } from '../../../types/neura.types';
import { ExternalLink, Trash2, Calendar, Layers, Clock, CheckCircle, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { projectTypeConfig, fallbackConfig } from '../config/projectTypeConfig';

interface ProjectDetailsPanelProps {
    project: NeuraProject | null;
    onOpenProject: (project: NeuraProject) => void;
    onDeleteProject: (projectId: string) => void;
}

function formatDateFull(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function DetailCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) {
    return (
        <div className="bg-ml-well rounded-xl p-4 border border-ml-border">
            <div className="flex items-center gap-2 mb-1.5">
                <Icon size={13} style={{ color }} strokeWidth={2.2} />
                <span className="text-[10px] font-semibold text-ml-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-bold text-ml-text-primary">{value}</p>
        </div>
    );
}

export default function ProjectDetailsPanel({ project, onOpenProject, onDeleteProject }: ProjectDetailsPanelProps) {
    if (!project) {
        return (
            <div className="flex-1 bg-ml-surface rounded-2xl border border-ml-border shadow-[0_2px_16px_rgba(10,1,90,0.04)] flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/5 flex items-center justify-center mb-4">
                    <Brain size={28} className="text-[#7C3AED]" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-ml-text-muted font-medium">Select a project to view details</p>
                <p className="text-xs text-ml-text-muted mt-1">Click on any project from the list</p>
            </div>
        );
    }

    const config = projectTypeConfig[project.type] || fallbackConfig;
    const Icon = config.icon;

    return (
        <div className="flex-1 bg-ml-surface rounded-2xl border border-ml-border shadow-[0_2px_16px_rgba(10,1,90,0.04)] overflow-hidden flex flex-col min-h-[400px]">
            {/* Header with gradient accent */}
            <div className="relative px-6 pt-6 pb-5 border-b border-ml-border">
                <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-60"
                    style={{ background: `linear-gradient(90deg, ${config.accentBorder}, ${config.accentBorder}80)` }}
                />

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                                background: `linear-gradient(135deg, ${config.accentBorder}20, ${config.accentBorder}08)`,
                            }}
                        >
                            <Icon size={22} style={{ color: config.accentBorder }} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-ml-text-primary tracking-tight">{project.name}</h2>
                            <p className="text-xs text-ml-text-muted font-medium mt-0.5">{config.label}</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onOpenProject(project)}
                            className="neura-button-primary flex items-center gap-1.5 text-xs px-4 py-2"
                        >
                            <ExternalLink size={13} strokeWidth={2.5} />
                            Open
                        </button>
                        <button
                            onClick={() => onDeleteProject(project.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-ml-text-muted hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        >
                            <Trash2 size={14} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="flex-1 px-6 py-5">
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <DetailCard
                        icon={project.modelTrained ? CheckCircle : Clock}
                        label="Status"
                        value={project.modelTrained ? `Trained${project.accuracy != null ? ` · ${project.accuracy}%` : ''}` : 'Not Trained'}
                        color={project.modelTrained ? '#22c55e' : '#94a3b8'}
                    />
                    <DetailCard
                        icon={Layers}
                        label="Classes"
                        value={`${project.classes.length} class${project.classes.length !== 1 ? 'es' : ''}`}
                        color="#6366f1"
                    />
                    <DetailCard
                        icon={Calendar}
                        label="Created"
                        value={formatDateFull(project.createdAt)}
                        color="#f97316"
                    />
                    <DetailCard
                        icon={Clock}
                        label="Last Updated"
                        value={formatDateFull(project.updatedAt)}
                        color="#8b5cf6"
                    />
                </div>

                {/* Class preview */}
                {project.classes.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-semibold text-ml-text-muted uppercase tracking-wider mb-2.5">Classes</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {project.classes.map((cls) => (
                                <span
                                    key={cls.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-ml-border"
                                    style={{ background: `${cls.color}10`, color: cls.color }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cls.color }} />
                                    {cls.name}
                                    <span className="text-[9px] opacity-50">({cls.samples.length})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
