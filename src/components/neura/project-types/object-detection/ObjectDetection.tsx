/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React from 'react';
import ProjectHeader from '../../common/ProjectHeader';

interface ObjectDetectionProps {
    onBack?: () => void;
}

export default function ObjectDetection({ onBack }: ObjectDetectionProps) {
    const [objects, setObjects] = React.useState<string[]>(['Cat', 'Dog']);

    const handleAddObject = () => {
        setObjects([...objects, `Object ${objects.length + 1}`]);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <ProjectHeader
                icon="🐱"
                title="Object Detection"
                onBack={onBack}
                onSave={() => console.log('Save project')}
                onUploadFolder={() => console.log('Upload folder')}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Objects to detect */}
                <div className="w-2/3 p-6 space-y-6 overflow-auto">
                    <div className="bg-white rounded-3xl p-6 shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Objects to Detect
                        </h2>
                        <div className="space-y-3">
                            {objects.map((obj, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl"
                                >
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <input
                                        type="text"
                                        value={obj}
                                        onChange={(e) => {
                                            const newObjects = [...objects];
                                            newObjects[index] = e.target.value;
                                            setObjects(newObjects);
                                        }}
                                        className="flex-1 bg-transparent border-none focus:outline-none font-medium"
                                    />
                                    <button
                                        onClick={() =>
                                            setObjects(objects.filter((_, i) => i !== index))
                                        }
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleAddObject}
                            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors font-medium"
                        >
                            + Add Object
                        </button>
                    </div>

                    {/* Annotation area */}
                    <div className="bg-white rounded-3xl p-6 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Draw Bounding Boxes
                        </h3>
                        <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
                            <div className="text-center text-gray-400">
                                <div className="text-4xl mb-2">🖼️</div>
                                <div className="text-sm">Upload image to annotate</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Training + Testing */}
                <div className="w-1/3 border-l bg-white p-6 space-y-8 overflow-auto">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span>🎯</span>
                            <span>Training</span>
                        </h3>
                        <button className="w-full py-3 bg-[#6b21a8] text-white rounded-2xl font-semibold hover:bg-[#7c3aed] transition-colors">
                            Train Model
                        </button>
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                            💡 Draw bounding boxes around objects in your images
                        </div>
                    </div>

                    <div className="border-t pt-8 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span>🧪</span>
                            <span>Testing</span>
                        </h3>
                        <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center">
                            <div className="text-center text-gray-400">
                                <div className="text-4xl mb-2">📹</div>
                                <div className="text-sm">Webcam Preview</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition-colors">
                                📷 Webcam
                            </button>
                            <button className="py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition-colors">
                                📁 Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
