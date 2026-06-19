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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[420px] shadow-2xl overflow-hidden animate-in">
                <div className="bg-gradient-to-r from-[#0a015a] to-[#15027a] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-lg font-bold">New Project</h2>
                    <button onClick={onCancel} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <div className="px-6 py-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-[#0a015a]" />
                        <span className="text-sm text-gray-500">Type:</span>
                        <span className="text-sm font-semibold text-[#0a015a]">{typeLabels[projectType] || projectType}</span>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Cat vs Dog Classifier"
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#0a015a] focus:outline-none text-sm text-gray-800 placeholder-gray-400 transition-colors"
                    />
                </div>
                <div className="px-6 pb-6 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={handleCreate} disabled={!name.trim()} className="px-5 py-2.5 rounded-xl bg-[#0a015a] text-white font-semibold text-sm hover:bg-[#15027a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Create Project</button>
                </div>
            </div>
            <style>{`
                @keyframes animate-in { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .animate-in { animation: animate-in 0.2s ease-out; }
            `}</style>
        </div>
    );
}
