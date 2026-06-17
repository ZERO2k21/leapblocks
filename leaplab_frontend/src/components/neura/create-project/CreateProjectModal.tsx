/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React from 'react';
import ProjectTypeCard from './ProjectTypeCard';
import { ProjectTypeInfo } from '../../../types/neura.types';

const projectTypes: ProjectTypeInfo[] = [
    { id: 'image-classifier', name: 'Image Classifier', icon: '📸', color: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_40px_rgba(10,1,90,0.15)] hover:scale-[1.04] transition-all duration-300' },
    { id: 'object-detection', name: 'Object Detection', icon: '🐱', color: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_40px_rgba(10,1,90,0.15)] hover:scale-[1.04] transition-all duration-300' },
    { id: 'pose-classifier', name: 'Pose Classifier', icon: '🤸', color: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_40px_rgba(10,1,90,0.15)] hover:scale-[1.04] transition-all duration-300' },
    { id: 'hand-pose-classifier', name: 'Hand Pose Classifier', icon: '✋', color: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_40px_rgba(10,1,90,0.15)] hover:scale-[1.04] transition-all duration-300' },
    { id: 'audio-classifier', name: 'Audio Classifier', icon: '🎵', color: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_40px_rgba(10,1,90,0.15)] hover:scale-[1.04] transition-all duration-300' },
    { id: 'numbers-cr', name: 'Numbers CR', icon: '🔢', color: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_40px_rgba(10,1,90,0.15)] hover:scale-[1.04] transition-all duration-300' },
    { id: 'text-classifier', name: 'Text Classifier', icon: '📝', color: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_40px_rgba(10,1,90,0.15)] hover:scale-[1.04] transition-all duration-300' },
];

interface CreateProjectModalProps {
    onClose?: () => void;
    onSelectType?: (typeId: string) => void;
}

export default function CreateProjectModal({ onClose, onSelectType }: CreateProjectModalProps) {
    const handleSelectType = (typeId: string) => {
        onSelectType?.(typeId);
    };

    return (
        <div className="w-full h-full flex flex-col px-6 sm:px-10 py-8 bg-gradient-to-br from-[#f5f7ff] via-white to-[#eef1ff]">
            {/* Header section with refined typography */}
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-[#0a015a] tracking-tight">
                    Choose a Project Type
                </h2>
                <p className="text-slate-500 mt-2 text-sm sm:text-base">
                    Select a machine learning model to start building.
                </p>
            </div>

            {/* Optimized grid layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6 content-start">
                {projectTypes.map((type) => (
                    <ProjectTypeCard
                        key={type.id}
                        type={type}
                        onClick={() => handleSelectType(type.id)}
                    />
                ))}
            </div>
        </div>
    );
}
