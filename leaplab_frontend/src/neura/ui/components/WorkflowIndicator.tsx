import React from 'react'
import type { ClassifierMode } from '../../hooks/useNeuraProject'

interface WorkflowIndicatorProps {
    mode: ClassifierMode
    onModeChange: (mode: ClassifierMode) => void
    canTrain: boolean
    type?: string
}

export default function WorkflowIndicator({ mode, onModeChange, canTrain, type }: WorkflowIndicatorProps) {
    const isAudio = type === 'audio' || type === 'audio-classifier'
    const isPose = type === 'pose' || type === 'pose-classifier' || type === 'hand-pose' || type === 'hand-pose-classifier'

    const steps = [
        { id: 'collect' as ClassifierMode, number: 1, label: 'Collect', emoji: isAudio ? '🎤' : isPose ? '🧘' : '📸', tip: isAudio ? 'Record sounds!' : isPose ? 'Strike a pose!' : 'Take pictures!' },
        { id: 'train' as ClassifierMode, number: 2, label: 'Train', emoji: '🏋️', tip: 'Teach your AI!' },
        { id: 'test' as ClassifierMode, number: 3, label: 'Test', emoji: '🧪', tip: 'Test your AI!' }
    ]
    const modeOrder: ClassifierMode[] = ['collect', 'train', 'test']
    const currentIndex = modeOrder.indexOf(mode)

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    position: 'relative',
                }}
            >
                {steps.map((step, index) => {
                    const isActive = mode === step.id
                    const isCompleted = index < currentIndex

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => {
                                    onModeChange(step.id)
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: isActive
                                        ? 'linear-gradient(135deg, #630ed4, #7c3aed)'
                                        : isCompleted
                                            ? '#ecfdf5'
                                            : 'transparent',
                                    opacity: 1,
                                    transition: 'all 0.2s ease',
                                    flex: 1,
                                }}
                            >
                                <div
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '13px',
                                        background: isActive
                                            ? 'rgba(255,255,255,0.2)'
                                            : isCompleted
                                                ? '#10b981'
                                                : '#f3f4f6',
                                        color: isActive
                                            ? '#fff'
                                            : isCompleted
                                                ? '#fff'
                                                : '#6b7280',
                                        flexShrink: 0,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {isCompleted ? '✓' : step.emoji}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: isActive ? '#fff' : '#111827',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {step.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: isActive ? 'rgba(255,255,255,0.7)' : '#6b7280',
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {step.tip}
                                    </div>
                                </div>
                            </button>

                            {/* Connector arrow */}
                            {index < steps.length - 1 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        margin: '0 4px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '12px',
                                            height: '2px',
                                            background: index < currentIndex ? '#10b981' : '#e5e7eb',
                                            borderRadius: '1px',
                                            transition: 'background 0.3s ease',
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderTop: '4px solid transparent',
                                            borderBottom: '4px solid transparent',
                                            borderLeft: '5px solid ' + (index < currentIndex ? '#10b981' : '#e5e7eb'),
                                            marginLeft: '-1px',
                                            transition: 'border-color 0.3s ease',
                                        }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
