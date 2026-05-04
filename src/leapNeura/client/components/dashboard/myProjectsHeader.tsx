/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';

interface MyProjectsHeaderProps {
    onCreateNew?: () => void;
}

export default function MyProjectsHeader({ onCreateNew }: MyProjectsHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
                <p className="text-gray-600">Manage and train your machine learning models</p>
            </div>
            <button
                onClick={onCreateNew}
                className="neura-button-primary flex items-center gap-2 text-base"
            >
                <span className="text-xl">+</span>
                <span>New Project</span>
            </button>
        </div>
    );
}
