/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React from 'react';
import ProjectTypeCard from './ProjectTypeCard';
import { ProjectTypeInfo } from '@/types/neura.types';

const projectTypes: ProjectTypeInfo[] = [
    { id: 'image-classifier', name: 'Image Classifier', icon: '📸', color: 'bg-orange-100' },
    { id: 'object-detection', name: 'Object Detection', icon: '🐱', color: 'bg-yellow-100' },
    { id: 'pose-classifier', name: 'Pose Classifier', icon: '🤸', color: 'bg-blue-100' },
    { id: 'hand-pose-classifier', name: 'Hand Pose Classifier', icon: '✋', color: 'bg-pink-100' },
    { id: 'audio-classifier', name: 'Audio Classifier', icon: '🎵', color: 'bg-green-100' },
    { id: 'numbers-cr', name: 'Numbers CR', icon: '🔢', color: 'bg-purple-100' },
    { id: 'text-classifier', name: 'Text Classifier', icon: '📝', color: 'bg-red-100' },
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[950px] max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-[#6b21a8] text-white px-8 py-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Create New Project</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 px-4 py-2 rounded-2xl transition-colors flex items-center gap-2"
                    >
                        <span>←</span>
                        <span>Back</span>
                    </button>
                </div>

                {/* Project types grid */}
                <div className="p-8 overflow-auto max-h-[calc(90vh-100px)]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {projectTypes.map((type) => (
                            <ProjectTypeCard
                                key={type.id}
                                type={type}
                                onClick={() => handleSelectType(type.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
