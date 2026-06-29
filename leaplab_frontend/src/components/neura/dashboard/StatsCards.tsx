/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useEffect, useState } from 'react';
import { FolderOpen, CheckCircle, Database, Brain } from 'lucide-react';
import { NeuraProject } from '../../../types/neura.types';
import { useNeuraTheme } from '../common/NeuraThemeContext';

interface StatsCardsProps {
    projects: NeuraProject[];
}

function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = value / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setDisplay(value);
                clearInterval(timer);
            } else {
                setDisplay(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <>{display}</>;
}

export default function StatsCards({ projects }: StatsCardsProps) {
    const { isDark } = useNeuraTheme();
    const totalProjects = projects.length;
    const trainedCount = projects.filter((p) => p.modelTrained).length;
    const totalClasses = projects.reduce((sum, p) => sum + p.classes.length, 0);

    const stats = [
        { icon: FolderOpen, label: 'Projects', value: totalProjects, color: '#6366f1', gradient: 'from-indigo-500 to-violet-500' },
        { icon: CheckCircle, label: 'Trained', value: trainedCount, color: '#22c55e', gradient: 'from-emerald-500 to-green-500' },
        { icon: Database, label: 'Datasets', value: totalClasses, color: '#f97316', gradient: 'from-orange-400 to-amber-500' },
        { icon: Brain, label: 'Models', value: trainedCount, color: '#8b5cf6', gradient: 'from-violet-500 to-purple-500' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className={`neura-card neura-card-glow p-4 sm:p-5 flex items-center gap-3 sm:gap-4 animate-slide-in-up stagger-${idx + 1} group`}
                    >
                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                            <Icon size={20} className="text-white" strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                            <p className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{stat.label}</p>
                            <p className={`text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#0a015a]'}`}>
                                <AnimatedNumber value={stat.value} />
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
