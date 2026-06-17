/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
import { TestResult } from '@/types/neura.types';

interface TestingPanelProps {
    onTest?: () => void;
    isTesting?: boolean;
    result?: TestResult;
}

export default function TestingPanel({ onTest, isTesting, result }: TestingPanelProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>🧪</span>
                <span>Testing</span>
            </h3>

            {/* Webcam preview placeholder */}
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <div className="text-4xl mb-2">📹</div>
                        <div className="text-sm">Webcam Preview</div>
                    </div>
                </div>
            </div>

            {/* Test buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onTest}
                    disabled={isTesting}
                    className="py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                >
                    📷 Webcam
                </button>
                <button
                    onClick={onTest}
                    disabled={isTesting}
                    className="py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-300"
                >
                    📁 Upload
                </button>
            </div>

            {/* Result display */}
            {result && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-700 font-medium">Prediction</span>
                        <span className="text-lg font-bold text-purple-600">{result.predictedClass}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">Confidence</span>
                        <span className="text-sm font-semibold text-purple-600">
                            {(result.confidence * 100).toFixed(1)}%
                        </span>
                    </div>
                    {/* Confidence bar */}
                    <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-purple-600 h-full transition-all duration-500"
                            style={{ width: `${result.confidence * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Testing info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                ℹ️ Train your model first before testing
            </div>
        </div>
    );
}
