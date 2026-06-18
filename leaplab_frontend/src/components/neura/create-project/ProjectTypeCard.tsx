/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { ProjectTypeInfo } from '../../../types/neura.types';

interface ProjectTypeCardProps {
    type: ProjectTypeInfo;
    onClick?: () => void;
}

export default function ProjectTypeCard({ type, onClick }: ProjectTypeCardProps) {
    const IconComponent = type.Icon;
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
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0a015a]/10 to-[#15027a]/5 border border-[#0a015a]/8 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
                {IconComponent ? (
                    <IconComponent size={28} className="text-[#0a015a]" strokeWidth={1.8} />
                ) : (
                    <span className="text-4xl">{type.icon}</span>
                )}
            </div>

            <h3 className="text-sm font-semibold text-[#0a015a]">
                {type.name}
            </h3>
        </div>
    );
}
