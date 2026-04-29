/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { ProjectTypeInfo } from '../../types/neura.types';

interface ProjectTypeCardProps {
    type: ProjectTypeInfo;
    onClick?: () => void;
}

export default function ProjectTypeCard({ type, onClick }: ProjectTypeCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                ${type.color}
                rounded-2xl
                p-5
                cursor-pointer
                flex flex-col items-center justify-center
                text-center
                group
                h-full
            `}
        >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">
                {type.icon}
            </div>

            <h3 className="text-sm font-semibold text-[#0a015a]">
                {type.name}
            </h3>
        </div>
    );
}
