/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';

interface EmptyStateIllustrationProps {
    onCreateNew?: () => void;
}

export default function EmptyStateIllustration({ onCreateNew }: EmptyStateIllustrationProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            {/* Central illustration - Boy with floating icons */}
            <div className="relative w-64 h-64 mb-8">
                {/* Central character */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl">🧑‍💻</div>
                </div>

                {/* Floating icons around */}
                <div className="absolute top-0 left-8 animate-bounce" style={{ animationDelay: '0s' }}>
                    <span className="text-4xl">📸</span>
                </div>
                <div className="absolute top-0 right-8 animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <span className="text-4xl">🎵</span>
                </div>
                <div className="absolute bottom-0 left-4 animate-bounce" style={{ animationDelay: '0.4s' }}>
                    <span className="text-4xl">🤖</span>
                </div>
                <div className="absolute bottom-0 right-4 animate-bounce" style={{ animationDelay: '0.6s' }}>
                    <span className="text-4xl">✨</span>
                </div>
            </div>

            {/* Empty state text */}
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Projects Yet</h3>
            <p className="text-gray-500 text-center max-w-md mb-8">
                Start your AI journey by creating your first machine learning project
            </p>

            {/* CTA Button */}
            <button onClick={onCreateNew} className="neura-button-primary text-lg px-8 py-3 flex items-center gap-2">
                <span className="text-xl">+</span>
                <span>Create Your First Project</span>
            </button>
        </div>
    );
}
