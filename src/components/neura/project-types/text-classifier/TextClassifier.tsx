/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React from 'react';
import ProjectHeader from '../../common/ProjectHeader';

interface TextClassifierProps {
    onBack?: () => void;
}

export default function TextClassifier({ onBack }: TextClassifierProps) {
    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <ProjectHeader
                icon="📝"
                title="Text Classifier"
                onBack={onBack}
            />

            <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-8xl mb-6">📝</div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Text Classifier
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Train AI to classify text into categories like sentiment, topics, or spam detection
                    </p>
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
                        <p className="text-purple-700 font-medium">
                            🚧 Coming Soon
                        </p>
                        <p className="text-sm text-purple-600 mt-2">
                            This feature is under development
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
