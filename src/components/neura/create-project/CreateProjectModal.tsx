/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React from 'react';
import ProjectTypeCard from './ProjectTypeCard';
import { ProjectTypeInfo } from '@/types/neura.types';

const projectTypes: ProjectTypeInfo[] = [
    { id: 'image-classifier', name: 'Image Classifier', icon: '📸', color: 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10' },
    { id: 'object-detection', name: 'Object Detection', icon: '🐱', color: 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10' },
    { id: 'pose-classifier', name: 'Pose Classifier', icon: '🤸', color: 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10' },
    { id: 'hand-pose-classifier', name: 'Hand Pose Classifier', icon: '✋', color: 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10' },
    { id: 'audio-classifier', name: 'Audio Classifier', icon: '🎵', color: 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10' },
    { id: 'numbers-cr', name: 'Numbers CR', icon: '🔢', color: 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10' },
    { id: 'text-classifier', name: 'Text Classifier', icon: '📝', color: 'bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/10' },
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
        <div className="w-full h-full bg-gray-50 flex flex-col p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Choose a Project Type</h2>
                <p className="text-slate-500 mt-2">Select a machine learning model to start building.</p>
            </div>

            {/* Project types grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 content-start">
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
