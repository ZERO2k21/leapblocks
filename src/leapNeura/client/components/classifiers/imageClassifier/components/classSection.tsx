/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { ClassData } from '../../../../types/neura.types';

interface ClassSectionProps {
    classData: ClassData;
    onAddSample?: () => void;
    onRemoveSample?: (sampleId: string) => void;
    onRename?: (newName: string) => void;
    onDelete?: () => void;
}

export default function ClassSection({
    classData,
    onAddSample,
    onRemoveSample,
    onRename,
    onDelete,
}: ClassSectionProps) {
    const colorClasses: Record<string, string> = {
        red: 'bg-red-500',
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
        pink: 'bg-pink-500',
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-md">
            {/* Class header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${colorClasses[classData.color] || 'bg-gray-500'}`} />
                    <input
                        type="text"
                        value={classData.name}
                        onChange={(e) => onRename?.(e.target.value)}
                        className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded px-2"
                    />
                    <span className="text-sm text-gray-500">({classData.samples.length} samples)</span>
                </div>
                <button
                    onClick={onDelete}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                    🗑️
                </button>
            </div>

            {/* Samples grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                {classData.samples.map((sample) => (
                    <div
                        key={sample.id}
                        className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden"
                    >
                        <img
                            src={sample.data}
                            alt={`Sample ${sample.id}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => onRemoveSample?.(sample.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Add sample buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onAddSample}
                    className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-medium"
                >
                    📷 Webcam
                </button>
                <button
                    onClick={onAddSample}
                    className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-medium"
                >
                    📁 Upload
                </button>
            </div>
        </div>
    );
}
