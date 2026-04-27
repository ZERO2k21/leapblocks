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
        <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            width: '320px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '2px solid #8B5CF6',
            padding: '24px',
            zIndex: 1000,
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#4C1D95', fontSize: '18px', fontWeight: 'bold' }}>
                    {tutorial.title}
                </h3>
                <button 
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {tutorial.steps.map((_, idx) => (
                    <div key={idx} style={{
                        flex: 1,
                        height: '6px',
                        background: idx <= currentStep ? '#8B5CF6' : '#E5E7EB',
                        borderRadius: '3px',
                        transition: 'background 0.3s ease'
                    }} />
                ))}
            </div>

            {/* Content */}
            <div style={{ marginBottom: '24px', minHeight: '80px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1F2937', fontSize: '16px', fontWeight: 'bold' }}>
                    {step.title}
                </h4>
                <p style={{ margin: 0, color: '#4B5563', fontSize: '14px', lineHeight: '1.6' }}>
                    {step.content}
                </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: currentStep === 0 ? '#D1D5DB' : '#6B7280',
                        cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => { if (currentStep !== 0) (e.currentTarget as HTMLElement).style.background = '#F3F4F6' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                    <ChevronLeft size={18} strokeWidth={3} />
                    Back
                </button>

                <button
                    onClick={handleNext}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: currentStep === tutorial.steps.length - 1 ? '#10B981' : '#8B5CF6',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        padding: '10px 20px',
                        borderRadius: '24px',
                        boxShadow: currentStep === tutorial.steps.length - 1 
                            ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                            : '0 4px 12px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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
