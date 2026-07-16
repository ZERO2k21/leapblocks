import React from 'react'
import type { ClassifierMode } from '../../hooks/useNeuraProject'

interface WorkflowIndicatorProps {
    mode: ClassifierMode
    onModeChange: (mode: ClassifierMode) => void
    canTrain: boolean
}

const STEPS: { id: ClassifierMode; number: number; label: string; emoji: string; tip: string }[] = [
    { id: 'collect', number: 1, label: 'Collect', emoji: '📸', tip: 'Take pictures!' },
    { id: 'train', number: 2, label: 'Train', emoji: '🏋️', tip: 'Teach your AI!' },
    { id: 'evaluate', number: 3, label: 'Evaluate', emoji: '📊', tip: 'Check quality!' },
    { id: 'test', number: 4, label: 'Test', emoji: '🧪', tip: 'Test your AI!' }
]

export default function WorkflowIndicator({ mode, onModeChange, canTrain }: WorkflowIndicatorProps) {
    const modeOrder: ClassifierMode[] = ['collect', 'train', 'evaluate', 'test']
    const currentIndex = modeOrder.indexOf(mode)

    return (
        <div className="w-full max-w-[500px] mx-auto">
            <div className="flex items-center justify-between relative">
                {/* Connecting line */}
                <div className="absolute top-5 left-[12%] right-[12%] h-1 bg-[#dae2fd] rounded-full z-0">
                    <div
                        className="h-full bg-gradient-to-r from-[#630ed4] to-[#006c44] rounded-full transition-all duration-500"
                        style={{ width: `${(currentIndex / 3) * 100}%` }}
                    />
                </div>

                {STEPS.map((step, index) => {
                    const isActive = mode === step.id
                    const isCompleted = index < currentIndex
                    const isDisabled = step.id === 'train' && !canTrain
                    const isPast = index <= currentIndex

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => {
                                    if (step.id === 'train' && !canTrain) return
                                    onModeChange(step.id)
                                }}
                                disabled={isDisabled}
                                className="flex items-center gap-2.5 group"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    background: isActive
                                        ? 'linear-gradient(135deg, #630ed4, #7c3aed)'
                                        : isCompleted
                                            ? '#d1fae5'
                                            : 'transparent',
                                    opacity: isDisabled ? 0.5 : 1,
                                    transition: 'all 0.25s ease',
                                }}
                            >
                                <div
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '15px',
                                        background: isActive
                                            ? 'rgba(255,255,255,0.2)'
                                            : isCompleted
                                                ? '#006c44'
                                                : '#eaedff',
                                        color: isActive
                                            ? '#fff'
                                            : isCompleted
                                                ? '#fff'
                                                : '#630ed4',
                                        boxShadow: isCompleted
                                            ? '0 2px 6px rgba(0,108,68,0.25)'
                                            : isActive
                                                ? 'none'
                                                : '0 1px 3px rgba(0,0,0,0.06)',
                                        flexShrink: 0,
                                    }}
                                >
                                    {isCompleted ? '✓' : step.emoji}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: isActive ? '#fff' : isPast ? '#131b2e' : '#7b7487',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {step.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: isActive ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {step.tip}
                                    </div>
                                </div>
                            </button>

                            {/* Connector line */}
                            {index < STEPS.length - 1 && (
                                <div
                                    style={{
                                        width: '24px',
                                        height: '2px',
                                        borderRadius: '1px',
                                        background: index < currentIndex
                                            ? 'linear-gradient(90deg, #006c44, #630ed4)'
                                            : '#e5e7eb',
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
