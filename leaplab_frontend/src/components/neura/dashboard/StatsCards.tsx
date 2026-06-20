/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { FolderOpen, CheckCircle, Database, Brain } from 'lucide-react';
import { NeuraProject } from '../../../types/neura.types';

interface StatsCardsProps {
    projects: NeuraProject[];
}

export default function StatsCards({ projects }: StatsCardsProps) {
    const totalProjects = projects.length;
    const trainedCount = projects.filter((p) => p.modelTrained).length;
    const totalClasses = projects.reduce((sum, p) => sum + p.classes.length, 0);

    const stats = [
        { icon: FolderOpen, label: 'Projects', value: totalProjects, color: '#6366f1' },
        { icon: CheckCircle, label: 'Trained', value: trainedCount, color: '#22c55e' },
        { icon: Database, label: 'Datasets', value: totalClasses, color: '#f97316' },
        { icon: Brain, label: 'Models', value: trainedCount, color: '#8b5cf6' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className={`neura-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 animate-slide-in-up stagger-${idx + 1}`}
                    >
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${stat.color}12` }}
                        >
                            <Icon size={20} style={{ color: stat.color }} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl sm:text-2xl font-bold text-[#0a015a] tabular-nums">{stat.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
