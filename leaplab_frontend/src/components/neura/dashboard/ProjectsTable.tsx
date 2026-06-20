/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState, useRef, useEffect } from 'react';
import { NeuraProject } from '../../../types/neura.types';
import { Image, ScanSearch, PersonStanding, Hand, AudioLines, Calculator, FileText, Bot, MoreVertical, Pencil, Trash2, Download, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ProjectsTableProps {
    projects: NeuraProject[];
    onOpenProject?: (project: NeuraProject) => void;
    onDeleteProject?: (projectId: string) => void;
    onRenameProject?: (project: NeuraProject) => void;
    onDownloadProject?: (project: NeuraProject) => void;
}

const typeConfig: Record<string, { icon: LucideIcon; label: string; badgeBg: string; badgeText: string; badgeBorder: string; accentBorder: string }> = {
    'image-classifier': { icon: Image, label: 'Image Classifier', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', badgeBorder: 'border-blue-200', accentBorder: '#6366f1' },
    'object-detection': { icon: ScanSearch, label: 'Object Detection', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', badgeBorder: 'border-orange-200', accentBorder: '#f97316' },
    'pose-classifier': { icon: PersonStanding, label: 'Pose Classifier', badgeBg: 'bg-green-50', badgeText: 'text-green-700', badgeBorder: 'border-green-200', accentBorder: '#22c55e' },
    'hand-pose-classifier': { icon: Hand, label: 'Hand Pose', badgeBg: 'bg-cyan-50', badgeText: 'text-cyan-700', badgeBorder: 'border-cyan-200', accentBorder: '#06b6d4' },
    'audio-classifier': { icon: AudioLines, label: 'Audio Classifier', badgeBg: 'bg-rose-50', badgeText: 'text-rose-700', badgeBorder: 'border-rose-200', accentBorder: '#ef4444' },
    'numbers-cr': { icon: Calculator, label: 'Numbers CR', badgeBg: 'bg-purple-50', badgeText: 'text-purple-700', badgeBorder: 'border-purple-200', accentBorder: '#a855f7' },
    'text-classifier': { icon: FileText, label: 'Text Classifier', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', badgeBorder: 'border-sky-200', accentBorder: '#3b82f6' },
};

const fallbackConfig = { icon: Bot, label: 'Unknown', badgeBg: 'bg-gray-50', badgeText: 'text-gray-700', badgeBorder: 'border-gray-200', accentBorder: '#6b7280' };

function formatDateFull(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function formatDateShort(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function ActionMenu({
    project,
    onOpen,
    onDelete,
    onRename,
    onDownload,
}: {
    project: NeuraProject;
    onOpen?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    onDownload?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 active:scale-90"
            >
                <MoreVertical size={16} strokeWidth={2} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(10,1,90,0.12)] border border-gray-100 py-1.5 z-50 animate-fade-in-scale">
                    <button
                        onClick={() => { onOpen?.(); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <ExternalLink size={14} strokeWidth={2} />
                        Open Project
                    </button>
                    <button
                        onClick={() => { onRename?.(); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Pencil size={14} strokeWidth={2} />
                        Rename
                    </button>
                    <button
                        onClick={() => { onDownload?.(); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Download size={14} strokeWidth={2} />
                        Download
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                        onClick={() => { onDelete?.(); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={14} strokeWidth={2} />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Mobile Card ──────────────────────────────────────────────────────── */
function MobileProjectCard({
    project,
    onOpen,
    onDelete,
    onRename,
    onDownload,
}: {
    project: NeuraProject;
    onOpen?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    onDownload?: () => void;
}) {
    const config = typeConfig[project.type] || fallbackConfig;
    const Icon = config.icon;

    return (
        <div
            onClick={onOpen}
            className="bg-white rounded-xl border border-gray-100/80 p-4 cursor-pointer active:scale-[0.98] transition-transform duration-150 relative overflow-hidden"
            style={{ borderLeft: `3px solid ${config.accentBorder}` }}
        >
            {/* Top row: icon + name + menu */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/8 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-[#0a015a]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-[#0a015a] tracking-tight text-sm truncate">{project.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium capitalize">{project.type.replace(/-/g, ' ')}</p>
                    </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                        project={project}
                        onOpen={onOpen}
                        onDelete={onDelete}
                        onRename={onRename}
                        onDownload={onDownload}
                    />
                </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">Classes: <span className="font-bold text-[#0a015a]">{project.classes.length}</span></span>
                    {project.modelTrained ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Trained
                        </span>
                    ) : (
                        <span className="text-[10px] text-gray-400 font-medium">Not Trained</span>
                    )}
                </div>
                <span className="text-[10px] text-gray-400">{formatDateShort(project.updatedAt)}</span>
            </div>
        </div>
    );
}

/* ── Main Component ───────────────────────────────────────────────────── */
export default function ProjectsTable({ projects, onOpenProject, onDeleteProject, onRenameProject, onDownloadProject }: ProjectsTableProps) {
    return (
        <div className="mb-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#0a015a] tracking-tight flex items-center gap-2">
                        <span className="text-sm sm:text-base">&#x1F4C2;</span>
                        Recent Projects
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">All your machine learning projects in one place.</p>
                </div>
            </div>

            {/* Mobile: Card list */}
            <div className="sm:hidden space-y-3">
                {projects.map((project, idx) => (
                    <div key={project.id} className={`animate-slide-in-up stagger-${(idx % 7) + 1}`}>
                        <MobileProjectCard
                            project={project}
                            onOpen={() => onOpenProject?.(project)}
                            onDelete={() => onDeleteProject?.(project.id)}
                            onRename={() => onRenameProject?.(project)}
                            onDownload={() => onDownloadProject?.(project)}
                        />
                    </div>
                ))}
                {projects.length === 0 && (
                    <div className="py-8 text-center bg-white rounded-xl border border-gray-100/80">
                        <p className="text-gray-400 text-sm">No projects found.</p>
                    </div>
                )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100/80 shadow-[0_2px_16px_rgba(10,1,90,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gradient-to-r from-[#0a015a] to-[#15027a]">
                                <th className="text-left px-4 lg:px-6 py-3.5 text-xs font-bold text-white/90 tracking-wide uppercase">Project Details</th>
                                <th className="text-left px-4 lg:px-6 py-3.5 text-xs font-bold text-white/90 tracking-wide uppercase">Type</th>
                                <th className="text-left px-4 lg:px-6 py-3.5 text-xs font-bold text-white/90 tracking-wide uppercase hidden md:table-cell">No. of Classes</th>
                                <th className="text-left px-4 lg:px-6 py-3.5 text-xs font-bold text-white/90 tracking-wide uppercase hidden lg:table-cell">Last Updated</th>
                                <th className="text-left px-4 lg:px-6 py-3.5 text-xs font-bold text-white/90 tracking-wide uppercase">Status</th>
                                <th className="w-12 px-4 lg:px-6 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project, idx) => {
                                const config = typeConfig[project.type] || fallbackConfig;
                                const Icon = config.icon;
                                return (
                                    <tr
                                        key={project.id}
                                        onClick={() => onOpenProject?.(project)}
                                        className={`group border-b border-gray-50 cursor-pointer transition-colors duration-200 hover:bg-[#f8f9ff]/60 animate-slide-in-up stagger-${(idx % 7) + 1} ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                    >
                                        {/* Project Details */}
                                        <td className="px-4 lg:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                                                    <Icon size={18} className="text-[#0a015a]" strokeWidth={2} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[#0a015a] tracking-tight truncate max-w-[180px]">{project.name}</p>
                                                    <p className="text-[11px] text-gray-400 font-medium capitalize">{project.type.replace(/-/g, ' ')}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Type Badge */}
                                        <td className="px-4 lg:px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                                                {config.label}
                                            </span>
                                        </td>

                                        {/* No. of Classes */}
                                        <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                                            <span className="font-bold text-[#0a015a]">{project.classes.length}</span>
                                        </td>

                                        {/* Last Updated */}
                                        <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                                            <span className="text-gray-500 text-xs">{formatDateFull(project.updatedAt)}</span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 lg:px-6 py-4">
                                            {project.modelTrained ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    Trained
                                                    {project.accuracy != null && <span className="ml-0.5 text-emerald-500">{project.accuracy}%</span>}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-medium">Model Not Trained</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 lg:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <ActionMenu
                                                project={project}
                                                onOpen={() => onOpenProject?.(project)}
                                                onDelete={() => onDeleteProject?.(project.id)}
                                                onRename={() => onRenameProject?.(project)}
                                                onDownload={() => onDownloadProject?.(project)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {projects.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-gray-400 text-sm">No projects found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
