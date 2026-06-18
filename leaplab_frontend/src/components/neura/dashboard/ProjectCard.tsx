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

const projectIcons: Record<string, LucideIcon> = {
    'image-classifier': Image,
    'object-detection': ScanSearch,
    'pose-classifier': PersonStanding,
    'hand-pose-classifier': Hand,
    'audio-classifier': AudioLines,
    'numbers-cr': Calculator,
    'text-classifier': FileText,
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
    const IconComp = projectIcons[project.type] || Bot;

    return (
        <div
            onClick={onClick}
            className="neura-card p-6 cursor-pointer hover:scale-105 transition-transform"
        >
            {/* Project icon and type */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10 rounded-xl flex items-center justify-center">
                    <IconComp size={24} className="text-[#0a015a]" strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-[#0a015a] tracking-tight">{project.name}</h3>
                    <p className="text-xs text-gray-500 font-medium capitalize">{project.type.replace('-', ' ')}</p>
                </div>
            </div>

            {/* Project stats */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Classes:</span>
                    <span className="font-semibold text-gray-800">{project.classes.length}</span>
                </div>
                {project.modelTrained && (
                    <div className="flex items-center gap-1 text-green-600">
                        <span>✓</span>
                        <span className="text-xs font-medium">Trained</span>
                    </div>
                )}
            </div>

            {/* Accuracy badge if trained */}
            {project.accuracy && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Accuracy</span>
                        <span className="text-sm font-bold text-[#0a015a]">{project.accuracy}%</span>
                    </div>
                </div>
            )}

            {/* Last updated */}
            <div className="mt-3 text-xs text-gray-400">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
            </div>
        </div>
    );
}
