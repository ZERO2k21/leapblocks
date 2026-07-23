/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export default function JuniorTutorialOverlay({ tutorial, onComplete, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!tutorial || !tutorial.steps || tutorial.steps.length === 0) return null;

    const step = tutorial.steps[currentStep];

    const handleNext = () => {
        if (currentStep < tutorial.steps.length - 1) {
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
        <div className="absolute bottom-6 right-6 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-violet-500 p-6 z-50 font-sans animate-[slideIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="m-0 text-violet-900 text-lg font-bold">
                    {tutorial.title}
                </h3>
                <button 
                    type="button"
                    onClick={onClose}
                    className="bg-transparent border-0 text-gray-500 cursor-pointer p-1.5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-1.5 mb-5">
                {tutorial.steps.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                            idx <= currentStep ? 'bg-violet-500' : 'bg-gray-200'
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
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-1 bg-transparent border-0 font-bold text-sm py-2 px-3 rounded-lg transition-colors ${
                        currentStep === 0 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-500 hover:bg-gray-100 cursor-pointer'
                    }`}
                >
                    <ChevronLeft size={18} strokeWidth={3} />
                    Back
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    className={`flex items-center gap-1.5 border-0 text-white cursor-pointer font-bold text-sm py-2.5 px-5 rounded-full transition-all duration-200 hover:scale-105 ${
                        currentStep === tutorial.steps.length - 1 
                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                            : 'bg-violet-500 shadow-lg shadow-violet-500/30'
                    }`}
                >
                    {currentStep === tutorial.steps.length - 1 ? (
                        <>Finish <Check size={18} strokeWidth={3} /></>
                    ) : (
                        <>Next <ChevronRight size={18} strokeWidth={3} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
