/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React, { useState } from 'react';
import ProjectTypeCard from './ProjectTypeCard';
import { ProjectTypeInfo, ProjectType } from '../../../types/neura.types';
import { Image, ScanSearch, PersonStanding, Hand, AudioLines, Calculator, FileText, ArrowLeft } from 'lucide-react';
import { useNeuraTheme } from '../common/NeuraThemeContext';

const projectTypes: ProjectTypeInfo[] = [
    { id: 'image-classifier', name: 'Image Classifier', icon: '📸', Icon: Image, color: 'from-blue-500 to-indigo-600', description: 'Classify images into categories' },
    { id: 'object-detection', name: 'Object Detection', icon: '🔍', Icon: ScanSearch, color: 'from-amber-400 to-orange-500', description: 'Detect objects in images' },
    { id: 'pose-classifier', name: 'Pose Classifier', icon: '🤸', Icon: PersonStanding, color: 'from-emerald-400 to-green-500', description: 'Detect human poses' },
    { id: 'hand-pose-classifier', name: 'Hand Pose Classifier', icon: '✋', Icon: Hand, color: 'from-teal-400 to-cyan-500', description: 'Recognize hand gestures' },
    { id: 'audio-classifier', name: 'Audio Classifier', icon: '🎵', Icon: AudioLines, color: 'from-rose-400 to-red-500', description: 'Classify sounds and audio' },
    { id: 'numbers-cr', name: 'Numbers CR', icon: '🔢', Icon: Calculator, color: 'from-violet-400 to-purple-500', description: 'Classify numerical data' },
    { id: 'text-classifier', name: 'Text Classifier', icon: '📝', Icon: FileText, color: 'from-sky-400 to-blue-500', description: 'Analyze text sentiment' },
];

interface CreateProjectModalProps {
    onClose?: () => void;
    onCreateProject?: (name: string, type: ProjectType, description?: string) => void;
}

export default function CreateProjectModal({ onClose, onCreateProject }: CreateProjectModalProps) {
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
    const { isDark } = useNeuraTheme();

    const canCreate = projectName.trim() && selectedType;

    const handleCreate = () => {
        if (!canCreate || !selectedType) return;
        onCreateProject?.(projectName.trim(), selectedType, projectDescription.trim() || undefined);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && canCreate) handleCreate();
        if (e.key === 'Escape') onClose?.();
    };

    return (
        <div className={`w-full h-full flex flex-col relative overflow-hidden ${isDark ? 'bg-[#0f1117]' : 'bg-gradient-to-br from-[#f5f7ff] via-white to-[#eef1ff]'}`}>
            {/* Background ambient glows */}
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-gradient-to-br from-violet-500/[0.04] to-transparent' : 'bg-gradient-to-br from-indigo-400/[0.06] to-transparent'}`} />
            <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-gradient-to-tr from-purple-500/[0.03] to-transparent' : 'bg-gradient-to-tr from-purple-400/[0.05] to-transparent'}`} />

            {/* Header bar */}
            <div className="relative bg-gradient-to-r from-[#0a015a] to-[#15027a] px-6 py-4 flex items-center justify-between shrink-0">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                }} />
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="relative text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 active:scale-90"
                    >
                        <ArrowLeft size={20} strokeWidth={2.2} />
                    </button>
                    <h2 className="relative text-white text-lg font-bold">Create New Project</h2>
                </div>
                <button
                    onClick={onClose}
                    className="relative text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 text-sm font-semibold"
                >
                    Back
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-8 sm:px-12 py-8" onKeyDown={handleKeyDown}>
                {/* Project Details Section */}
                <div className="mb-8 animate-slide-in-up">
                    <h3 className="text-[#7C3AED] font-bold text-sm mb-4">Enter Project Details:</h3>
                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Enter Project Name"
                                autoFocus
                                className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent text-sm font-medium focus:outline-none transition-colors ${isDark ? 'border-white/[0.1] text-gray-100 placeholder-gray-500 focus:border-[#7c3aed]' : 'border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#0a015a]'}`}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Enter Project Description (optional)"
                                className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent text-sm focus:outline-none transition-colors ${isDark ? 'border-white/[0.1] text-gray-100 placeholder-gray-500 focus:border-[#7c3aed]' : 'border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#0a015a]'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Project Type Section */}
                <div className="mb-8 animate-slide-in-up stagger-2">
                    <h3 className="text-[#7C3AED] font-bold text-sm mb-4">Select Project Type:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {projectTypes.map((type, idx) => (
                            <div key={type.id} className={`animate-slide-in-up stagger-${(idx % 7) + 1}`}>
                                <ProjectTypeCard
                                    type={type}
                                    selected={selectedType === type.id}
                                    onClick={() => setSelectedType(type.id)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer with Create button */}
            <div className={`relative px-8 sm:px-12 py-5 border-t backdrop-blur-sm flex justify-end shrink-0 ${isDark ? 'border-white/[0.06] bg-[#13131f]/80' : 'border-gray-100/80 bg-white/60'}`}>
                <button
                    onClick={handleCreate}
                    disabled={!canCreate}
                    className="neura-button-primary px-8 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                    Create Project
                </button>
            </div>
        </div>
    );
}
