/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';

interface ProjectHeaderProps {
    icon: string;
    title: string;
    onBack?: () => void;
    onSave?: () => void;
    onUploadFolder?: () => void;
}

export default function ProjectHeader({
    icon,
    title,
    onBack,
    onSave,
    onUploadFolder,
}: ProjectHeaderProps) {
    return (
        <div className="bg-[#6b21a8] text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        ← Back
                    </button>
                )}
                <span className="text-2xl">{icon}</span>
                <h1 className="font-semibold text-xl">{title}</h1>
            </div>
            <div className="flex gap-4">
                {onUploadFolder && (
                    <button
                        onClick={onUploadFolder}
                        className="bg-white text-purple-700 px-6 py-2 rounded-2xl font-medium hover:bg-purple-100 transition-colors"
                    >
                        📁 Upload Classes from Folder
                    </button>
                )}
                {onSave && (
                    <button
                        onClick={onSave}
                        className="bg-purple-800 hover:bg-purple-900 px-6 py-2 rounded-2xl font-medium transition-colors"
                    >
                        💾 Save Project
                    </button>
                )}
            </div>
        </div>
    );
}
