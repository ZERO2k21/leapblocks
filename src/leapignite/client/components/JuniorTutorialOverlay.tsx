/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface TutorialStep {
    title: string;
    content: string;
}

interface Tutorial {
    title: string;
    steps: TutorialStep[];
}

interface JuniorTutorialOverlayProps {
    tutorial: Tutorial | null;
    onComplete: () => void;
    onClose: () => void;
}

export default function JuniorTutorialOverlay({ tutorial, onComplete, onClose }: JuniorTutorialOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!tutorial || !tutorial.steps || tutorial.steps.length === 0) return null;

    const step = tutorial.steps[currentStep];
    const isLastStep = currentStep === tutorial.steps.length - 1;

    const handleNext = () => {
        if (!isLastStep) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="absolute bottom-6 right-6 w-80 bg-white/95 backdrop-blur-[10px] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-2 border-[#8B5CF6] p-6 z-[1000] font-[Segoe_UI,Inter,system-ui,sans-serif] animate-[slideIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="m-0 text-[#4C1D95] text-lg font-bold">
                    {tutorial.title}
                </h3>
                <button 
                    onClick={onClose}
                    className="bg-transparent border-none text-gray-500 cursor-pointer p-1.5 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-1.5 mb-5">
                {tutorial.steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={`flex-1 h-1.5 rounded-sm transition-colors duration-300 ${
                            idx <= currentStep ? 'bg-[#8B5CF6]' : 'bg-gray-200'
                        }`}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="mb-6 min-h-[80px]">
                <h4 className="m-0 mb-2 text-gray-800 text-base font-bold">
                    {step.title}
                </h4>
                <p className="m-0 text-gray-600 text-sm leading-relaxed">
                    {step.content}
                </p>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-1 bg-transparent border-none font-bold text-sm px-3 py-2 rounded-lg transition-colors ${
                        currentStep === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 cursor-pointer hover:bg-gray-100'
                    }`}
                >
                    <ChevronLeft size={18} strokeWidth={3} />
                    Back
                </button>

                <button
                    onClick={handleNext}
                    className={`flex items-center gap-1.5 border-none text-white cursor-pointer font-bold text-sm px-5 py-2.5 rounded-3xl transition-all hover:scale-105 ${
                        isLastStep
                            ? 'bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                            : 'bg-[#8B5CF6] shadow-[0_4px_12px_rgba(139,92,246,0.3)]'
                    }`}
                >
                    {isLastStep ? (
                        <>Finish <Check size={18} strokeWidth={3} /></>
                    ) : (
                        <>Next <ChevronRight size={18} strokeWidth={3} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
