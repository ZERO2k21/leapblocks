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
                        <button
                            key={step.id}
                            onClick={() => {
                                if (step.id === 'train' && !canTrain) return
                                onModeChange(step.id)
                            }}
                            disabled={isDisabled}
                            className="relative z-10 flex flex-col items-center gap-1.5 group"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                                    isActive
                                        ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-lg shadow-[#630ed4]/30 scale-110 ring-4 ring-[#eaedff]'
                                        : isCompleted
                                            ? 'bg-[#006c44] text-white shadow-md'
                                            : isDisabled
                                                ? 'bg-[#dae2fd] text-[#ccc3d8] cursor-not-allowed'
                                                : 'bg-[#eaedff] text-[#630ed4] shadow-sm group-hover:scale-105'
                                }`}
                            >
                                {isCompleted ? '✅' : step.emoji}
                            </div>
                            <span className={`text-[11px] font-bold transition-colors duration-200 ${
                                isActive ? 'text-[#630ed4]' : isPast ? 'text-[#131b2e]' : 'text-[#7b7487]'
                            }`}>
                                {step.label}
                            </span>
                            <span className={`text-[8px] ${isActive ? 'text-[#630ed4]/60' : 'text-[#7b7487]/40'}`}>
                                {step.tip}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
