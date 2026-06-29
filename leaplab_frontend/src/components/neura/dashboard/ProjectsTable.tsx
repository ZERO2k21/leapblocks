/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState, useRef, useEffect } from 'react';
import { NeuraProject } from '../../../types/neura.types';
import { MoreVertical, Pencil, Trash2, Download, ExternalLink } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';
import { projectTypeConfig, fallbackConfig } from '../config/projectTypeConfig';

interface ProjectsTableProps {
    projects: NeuraProject[];
    onOpenProject?: (project: NeuraProject) => void;
    onDeleteProject?: (projectId: string) => void;
    onRenameProject?: (project: NeuraProject) => void;
    onDownloadProject?: (project: NeuraProject) => void;
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
    const { isDark } = useNeuraTheme();

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
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                    isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
                <MoreVertical size={16} strokeWidth={2} />
            </button>
            {open && (
                <div className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl shadow-[0_12px_40px_rgba(10,1,90,0.15)] border py-1.5 z-50 animate-fade-in-scale backdrop-blur-md ${
                    isDark ? 'bg-[#1e2035]/95 border-white/[0.08]' : 'bg-white/95 border-gray-100'
                }`}>
                    <button
                        onClick={() => { onOpen?.(); setOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                            isDark ? 'text-gray-300 hover:bg-white/[0.06]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <ExternalLink size={14} strokeWidth={2} />
                        Open Project
                    </button>
                    <button
                        onClick={() => { onRename?.(); setOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                            isDark ? 'text-gray-300 hover:bg-white/[0.06]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Pencil size={14} strokeWidth={2} />
                        Rename
                    </button>
                    <button
                        onClick={() => { onDownload?.(); setOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                            isDark ? 'text-gray-300 hover:bg-white/[0.06]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Download size={14} strokeWidth={2} />
                        Download
                    </button>
                    <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`} />
                    <button
                        onClick={() => { onDelete?.(); setOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                            isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                        }`}
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
    const config = projectTypeConfig[project.type] || fallbackConfig;
    const Icon = config.icon;
    const { isDark } = useNeuraTheme();

    return (
        <div
            onClick={onOpen}
            className="neura-mobile-project-card"
            style={{ borderLeftWidth: '3px', borderLeftColor: config.accentBorder }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/8'
                    }`}>
                        <Icon size={20} className={isDark ? 'text-violet-400' : 'text-[#0a015a]'} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <p className={`font-bold tracking-tight text-sm truncate ${isDark ? 'text-gray-100' : 'text-[#0a015a]'}`}>{project.name}</p>
                        <p className={`text-[11px] font-medium capitalize ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{project.type.replace(/-/g, ' ')}</p>
                    </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu project={project} onOpen={onOpen} onDelete={onDelete} onRename={onRename} onDownload={onDownload} />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Classes: <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-[#0a015a]'}`}>{project.classes.length}</span>
                    </span>
                    {project.modelTrained ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" />
                            Trained
                        </span>
                    ) : (
                        <span className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Not Trained</span>
                    )}
                </div>
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDateShort(project.updatedAt)}</span>
            </div>
        </div>
    );
}

/* ── Main Component ───────────────────────────────────────────────────── */
export default function ProjectsTable({ projects, onOpenProject, onDeleteProject, onRenameProject, onDownloadProject }: ProjectsTableProps) {
    const { isDark } = useNeuraTheme();

    return (
        <div>
            {/* Mobile: Card list */}
            <div className="sm:hidden flex flex-col gap-3">
                {projects.map((project) => (
                    <MobileProjectCard
                        key={project.id}
                        project={project}
                        onOpen={() => onOpenProject?.(project)}
                        onDelete={() => onDeleteProject?.(project.id)}
                        onRename={() => onRenameProject?.(project)}
                        onDownload={() => onDownloadProject?.(project)}
                    />
                ))}
                {projects.length === 0 && (
                    <div className={`py-8 text-center rounded-xl border ${isDark ? 'bg-[#1a1d2e] border-white/[0.06]' : 'bg-white border-gray-100/80'}`}>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No projects found.</p>
                    </div>
                )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block neura-table-wrap">
                <table className="neura-table">
                    <thead>
                        <tr className={isDark ? 'bg-[#0a015a]' : 'bg-gradient-to-r from-[#0a015a] to-[#15027a]'}>
                            <th className="text-white/90">Project Details</th>
                            <th className="text-white/90">Type</th>
                            <th className="text-white/90 hidden md:table-cell">Classes</th>
                            <th className="text-white/90 hidden lg:table-cell">Last Updated</th>
                            <th className="text-white/90">Status</th>
                            <th className="w-14 text-white/90"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => {
                            const config = projectTypeConfig[project.type] || fallbackConfig;
                            const Icon = config.icon;
                            return (
                                <tr
                                    key={project.id}
                                    onClick={() => onOpenProject?.(project)}
                                >
                                    {/* Project Details */}
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/8'
                                            }`}>
                                                <Icon size={20} className={isDark ? 'text-violet-400' : 'text-[#0a015a]'} strokeWidth={2} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-bold tracking-tight truncate max-w-[200px] ${isDark ? 'text-gray-100' : 'text-[#0a015a]'}`}>{project.name}</p>
                                                <p className={`text-[11px] font-medium capitalize ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{project.type.replace(/-/g, ' ')}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Type Badge */}
                                    <td>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                                            {config.label}
                                        </span>
                                    </td>

                                    {/* Classes */}
                                    <td className="hidden md:table-cell">
                                        <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-[#0a015a]'}`}>{project.classes.length}</span>
                                    </td>

                                    {/* Last Updated */}
                                    <td className="hidden lg:table-cell">
                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{formatDateFull(project.updatedAt)}</span>
                                    </td>

                                    {/* Status */}
                                    <td>
                                        {project.modelTrained ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" />
                                                Trained
                                                {project.accuracy != null && <span className="ml-0.5 text-emerald-500">{project.accuracy}%</span>}
                                            </span>
                                        ) : (
                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Not Trained</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td onClick={(e) => e.stopPropagation()}>
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

                {projects.length === 0 && (
                    <div className="py-12 text-center">
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No projects found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
