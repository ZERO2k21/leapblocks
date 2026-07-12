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
}

export default function WorkflowIndicator({ mode, onModeChange, canTrain }: WorkflowIndicatorProps) {
    const steps: StepConfig[] = [
        {
            id: 'collect',
            number: 1,
            label: 'Collect',
            description: 'Add classes and upload images for each class.',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
            )
        }
    ]

    const getStepState = (step: StepConfig, index: number) => {
        if (mode === step.id) return 'active'
        const modeOrder: ClassifierMode[] = ['collect', 'train', 'test']
        const currentModeIndex = modeOrder.indexOf(mode)
        if (index < currentModeIndex) return 'completed'
        if (step.id === 'train' && !canTrain) return 'disabled'
        return 'inactive'
    }

    return (
        <div className="w-full max-w-[720px] mx-auto mb-8">
            <div className="grid grid-cols-3 gap-md relative">
                {steps.map((step, index) => {
                    const state = getStepState(step, index)
                    const isActive = state === 'active'
                    const isCompleted = state === 'completed'
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
                                className={`relative flex flex-col items-center text-center py-sm px-md rounded-2xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-surface-container-lowest border-2 border-primary shadow-[0_0_24px_rgba(124,58,237,0.15)] cursor-pointer'
                                        : isCompleted
                                            ? 'bg-surface-container-low border-2 border-secondary opacity-80 cursor-pointer'
                                            : isDisabled
                                                ? 'bg-surface-container-low border border-outline-variant opacity-50 cursor-not-allowed'
                                                : 'bg-surface-container-low border border-outline-variant hover:border-outline cursor-pointer'
                                }`}
                            >
                                {/* Step Number Badge */}
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-xs transition-all duration-200 ${
                                        isActive
                                            ? 'bg-primary text-on-primary shadow-md'
                                            : isCompleted
                                                ? 'bg-secondary text-on-secondary'
                                                : 'bg-outline-variant text-on-surface-variant'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        step.number
                                    )}
                                </div>

                                {/* Icon */}
                                <div
                                    className={`mb-xs transition-colors duration-200 ${
                                        isActive ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-on-surface-variant'
                                    }`}
                                >
                                    {step.icon}
                                </div>

                                {/* Label */}
                                <span className={`font-label-md text-label-md mb-xs transition-colors duration-200 ${
                                    isActive ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-on-surface-variant'
                                }`}>
                                    {step.label}
                                </span>

                                {/* Description */}
                                <span className="text-[11px] leading-tight text-on-surface-variant">
                                    {step.description}
                                </span>
                            </button>

                            {/* Arrow Connector */}
                            {index < steps.length - 1 && (
                                <div className={`absolute transition-colors duration-200 ${
                                    isCompleted ? 'text-secondary' : 'text-outline-variant'
                                }`} style={{
                                    left: `${((index + 1) / 3) * 100}%`,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 10
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
