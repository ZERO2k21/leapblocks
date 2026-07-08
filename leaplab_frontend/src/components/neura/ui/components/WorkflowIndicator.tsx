import React from 'react'
import type { ClassifierMode } from '../../hooks/useNeuraProject'

interface WorkflowIndicatorProps {
    mode: ClassifierMode
    onModeChange: (mode: ClassifierMode) => void
    canTrain: boolean
}

interface StepConfig {
    id: ClassifierMode
    number: number
    label: string
    description: string
    icon: React.ReactNode
    activeColor: string
    gradientFrom: string
    gradientTo: string
}

export default function WorkflowIndicator({ mode, onModeChange, canTrain }: WorkflowIndicatorProps) {
    const steps: StepConfig[] = [
        {
            id: 'collect',
            number: 1,
            label: 'Collect',
            description: 'Add classes and upload images for each class.',
            activeColor: '#7C3AED',
            gradientFrom: '#7C3AED',
            gradientTo: '#3B82F6',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                </svg>
            )
        },
        {
            id: 'train',
            number: 2,
            label: 'Train',
            description: 'Train your model with the uploaded images.',
            activeColor: '#3B82F6',
            gradientFrom: '#3B82F6',
            gradientTo: '#6366F1',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
            )
        },
        {
            id: 'test',
            number: 3,
            label: 'Test',
            description: 'Test your model in real-time and see predictions.',
            activeColor: '#10B981',
            gradientFrom: '#10B981',
            gradientTo: '#14B8A6',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
            )
        }
    ]

    const getStepState = (step: StepConfig) => {
        if (mode === step.id) return 'active'
        if (step.id === 'train' && !canTrain) return 'disabled'
        return 'inactive'
    }

    return (
        <div className="w-full max-w-[600px] mx-auto mb-6 animate-[fade-in_0.4s_ease-out]">
            <div className="flex items-center justify-center gap-3">
                {steps.map((step, index) => {
                    const state = getStepState(step)
                    const isActive = state === 'active'
                    const isDisabled = state === 'disabled'

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Card */}
                            <button
                                onClick={() => {
                                    if (step.id === 'train' && !canTrain) return
                                    onModeChange(step.id)
                                }}
                                disabled={isDisabled}
                                className={`relative flex-1 flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl transition-all duration-300 ${
                                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                }`}
                                style={{
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)'
                                        : 'rgba(255,255,255,0.6)',
                                    border: isActive
                                        ? `2px solid transparent`
                                        : '1px solid rgba(255,255,255,0.5)',
                                    backgroundImage: isActive
                                        ? `linear-gradient(white, white), linear-gradient(135deg, ${step.gradientFrom}, ${step.gradientTo})`
                                        : 'none',
                                    backgroundOrigin: 'border-box',
                                    backgroundClip: isActive ? 'padding-box, border-box' : 'unset',
                                    boxShadow: isActive
                                        ? `0 8px 32px ${step.activeColor}20, 0 0 0 1px ${step.activeColor}10`
                                        : '0 2px 8px rgba(0,0,0,0.04)'
                                }}
                            >
                                {/* Step Number Badge */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                                        isActive
                                            ? 'text-white shadow-lg'
                                            : isDisabled
                                                ? 'bg-gray-100 text-gray-300'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}
                                    style={isActive ? {
                                        background: `linear-gradient(135deg, ${step.gradientFrom}, ${step.gradientTo})`
                                    } : {}}
                                >
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div
                                    className={`transition-colors duration-300 ${
                                        isActive ? '' : isDisabled ? 'text-gray-300' : 'text-gray-400'
                                    }`}
                                    style={isActive ? { color: step.activeColor } : {}}
                                >
                                    {step.icon}
                                </div>

                                {/* Label */}
                                <span className={`text-sm font-bold transition-colors duration-300 ${
                                    isActive ? 'text-gray-800' : isDisabled ? 'text-gray-300' : 'text-gray-500'
                                }`}>
                                    {step.label}
                                </span>

                                {/* Description */}
                                <span className={`text-[11px] leading-tight text-center transition-colors duration-300 hidden sm:block ${
                                    isActive ? 'text-gray-500' : isDisabled ? 'text-gray-300' : 'text-gray-400'
                                }`}>
                                    {step.description}
                                </span>
                            </button>

                            {/* Arrow Connector */}
                            {index < steps.length - 1 && (
                                <div className="flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
