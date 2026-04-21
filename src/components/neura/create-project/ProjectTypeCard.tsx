/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { ProjectTypeInfo } from '@/types/neura.types';

interface ProjectTypeCardProps {
    type: ProjectTypeInfo;
    onClick?: () => void;
}

export default function ProjectTypeCard({ type, onClick }: ProjectTypeCardProps) {
    return (
        <button
            onClick={onClick}
            className="neura-card group relative flex flex-col items-center p-6 w-full"
        >
            {/* Icon container with color background */}
            <div className={`${type.color} w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-4xl">{type.icon}</span>
            </div>

            {/* Project type name */}
            <h3 className="text-center text-sm font-semibold text-gray-800 leading-tight">
                {type.name}
            </h3>

            {/* Optional description */}
            {type.description && (
                <p className="text-xs text-gray-500 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {type.description}
                </p>
            )}
        </button>
    );
}
