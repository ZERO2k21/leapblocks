/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React, { useState } from 'react';
import ClassSection from './components/ClassSection';
import TrainingPanel from './components/TrainingPanel';
import TestingPanel from './components/TestingPanel';
import { ClassData } from '@/types/neura.types';

export default function ImageClassifier() {
    const [classes, setClasses] = useState<ClassData[]>([
        {
            id: '1',
            name: 'class1',
            color: 'red',
            samples: [],
        },
        {
            id: '2',
            name: 'class2',
            color: 'emerald',
            samples: [],
        },
    ]);

    const [isTraining, setIsTraining] = useState(false);
    const [accuracy, setAccuracy] = useState<number>();

    const handleAddClass = () => {
        const colors = ['red', 'emerald', 'blue', 'yellow', 'purple', 'pink'];
        const newClass: ClassData = {
            id: Date.now().toString(),
            name: `class${classes.length + 1}`,
            color: colors[classes.length % colors.length],
            samples: [],
        };
        setClasses([...classes, newClass]);
    };

    const handleDeleteClass = (classId: string) => {
        setClasses(classes.filter((c) => c.id !== classId));
    };

    const handleRenameClass = (classId: string, newName: string) => {
        setClasses(
            classes.map((c) => (c.id === classId ? { ...c, name: newName } : c))
        );
    };

    const handleTrain = () => {
        setIsTraining(true);
        // Simulate training
        setTimeout(() => {
            setIsTraining(false);
            setAccuracy(Math.floor(Math.random() * 20) + 80); // 80-100%
        }, 3000);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Purple top bar */}
            <div className="bg-[#6b21a8] text-white px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <button className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                        ← Back
                    </button>
                    <span className="text-2xl">📸</span>
                    <h1 className="font-semibold text-xl">Image Classifier</h1>
                </div>
                <div className="flex gap-4">
                    <button className="bg-white text-purple-700 px-6 py-2 rounded-2xl font-medium hover:bg-purple-100 transition-colors">
                        📁 Upload Classes from Folder
                    </button>
                    <button className="bg-purple-800 hover:bg-purple-900 px-6 py-2 rounded-2xl font-medium transition-colors">
                        💾 Save Project
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Classes */}
                <div className="w-2/3 p-6 space-y-6 overflow-auto">
                    {classes.map((classData) => (
                        <ClassSection
                            key={classData.id}
                            classData={classData}
                            onRename={(newName) => handleRenameClass(classData.id, newName)}
                            onDelete={() => handleDeleteClass(classData.id)}
                        />
                    ))}

                    {/* Add class button */}
                    <button
                        onClick={handleAddClass}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors font-medium"
                    >
                        + Add Class
                    </button>
                </div>

                {/* Right: Training + Testing */}
                <div className="w-1/3 border-l bg-white p-6 space-y-8 overflow-auto">
                    <TrainingPanel
                        onTrain={handleTrain}
                        isTraining={isTraining}
                        accuracy={accuracy}
                    />
                    <div className="border-t pt-8">
                        <TestingPanel />
                    </div>
                </div>
            </div>
        </div>
    );
}
