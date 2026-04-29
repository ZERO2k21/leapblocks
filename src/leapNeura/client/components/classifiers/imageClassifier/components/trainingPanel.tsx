/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';

interface TrainingPanelProps {
    onTrain?: () => void;
    isTraining?: boolean;
    accuracy?: number;
}

export default function TrainingPanel({ onTrain, isTraining, accuracy }: TrainingPanelProps) {
    const [epochs, setEpochs] = useState(50);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>🎯</span>
                <span>Training</span>
            </h3>

            {/* Epochs slider */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Epochs</label>
                    <span className="text-sm font-semibold text-purple-600">{epochs}</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={epochs}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
            </div>

            {/* Train button */}
            <button
                onClick={onTrain}
                disabled={isTraining}
                className={`w-full py-3 rounded-2xl font-semibold transition-all ${isTraining
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#6b21a8] text-white hover:bg-[#7c3aed]'
                    }`}
            >
                {isTraining ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⚙️</span>
                        <span>Training...</span>
                    </span>
                ) : (
                    'Train Model'
                )}
            </button>

            {/* Accuracy display */}
            {accuracy !== undefined && (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium">Model Accuracy</span>
                        <span className="text-2xl font-bold text-green-600">{accuracy}%</span>
                    </div>
                </div>
            )}

            {/* Training info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                💡 Tip: Add at least 20 samples per class for better accuracy
            </div>
        </div>
    );
}
