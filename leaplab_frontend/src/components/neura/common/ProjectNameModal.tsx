/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface ProjectNameModalProps {
    isOpen: boolean;
    projectType: string;
    onCreate: (name: string) => void;
    onCancel: () => void;
}

const typeLabels: Record<string, string> = {
    'image-classifier': 'Image Classifier',
    'object-detection': 'Object Detection',
    'pose-classifier': 'Pose Classifier',
    'hand-pose-classifier': 'Hand Pose Classifier',
    'audio-classifier': 'Audio Classifier',
    'numbers-cr': 'Numbers CR',
    'text-classifier': 'Text Classifier',
};

export default function ProjectNameModal({ isOpen, projectType, onCreate, onCancel }: ProjectNameModalProps) {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleCreate = () => {
        const trimmed = name.trim();
        if (trimmed) {
            onCreate(trimmed);
            setName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCreate();
        if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="rounded-2xl w-[420px] shadow-2xl overflow-hidden animate-fade-in-scale" style={{ background: 'var(--ml-surface)', border: '1px solid var(--ml-border)' }}>
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-[#0a015a] to-[#15027a] px-6 py-4 flex items-center justify-between overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)'
                    }} />
                    <h2 className="relative text-white text-lg font-bold">New Project</h2>
                    <button onClick={onCancel} className="relative text-white/60 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10">
                        <X size={18} strokeWidth={2.2} />
                    </button>
                </div>

                <div className="px-6 py-6">
                    {/* Project type badge */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0a015a] to-[#15027a] flex items-center justify-center shadow-md shadow-[#0a015a]/20">
                            <Sparkles size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--ml-text-muted)' }}>Type</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-[0.03em] uppercase" style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#3730a3' }}>
                            {typeLabels[projectType] || projectType}
                        </span>
                    </div>

                    {/* Input field */}
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--ml-text-primary)' }}>Project Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Cat vs Dog Classifier"
                        autoFocus
                        className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--ml-accent)]/30 focus:border-[var(--ml-accent)]"
                        style={{ border: '2px solid var(--ml-border)', background: 'var(--ml-well)', color: 'var(--ml-text-primary)' }}
                    />
                </div>

                {/* Footer buttons */}
                <div className="px-6 pb-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                        style={{ color: 'var(--ml-text-secondary)', background: 'var(--ml-btn-idle)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
                        style={{
                            background: 'linear-gradient(135deg, #0a015a 0%, #15027a 50%, #0a015a 100%)',
                            boxShadow: '0 4px 14px rgba(10,1,90,0.25)',
                        }}
                    >
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
}
