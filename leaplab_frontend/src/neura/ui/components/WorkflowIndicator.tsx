import React from 'react'
import type { ClassifierMode } from '../../hooks/useNeuraProject'
import { CollectIcon, TrainIcon, TestIcon, CameraIcon, MicIcon, HandPoseIcon } from '../../assets/icons/NeuraIcons'

interface WorkflowIndicatorProps {
    mode: ClassifierMode
    onModeChange: (mode: ClassifierMode) => void
    canTrain: boolean
    type?: string
}

export default function WorkflowIndicator({ mode, onModeChange, canTrain, type }: WorkflowIndicatorProps) {
    const isAudio = type === 'audio' || type === 'audio-classifier'
    const isPose = type === 'pose' || type === 'pose-classifier' || type === 'hand-pose' || type === 'hand-pose-classifier'

    const CollectIconComponent = isAudio ? MicIcon : isPose ? HandPoseIcon : CameraIcon

    const steps = [
        { id: 'collect' as ClassifierMode, number: 1, label: 'Collect', IconComponent: CollectIconComponent, tip: isAudio ? 'Record sounds!' : isPose ? 'Strike a pose!' : 'Take pictures!' },
        { id: 'train' as ClassifierMode, number: 2, label: 'Train', IconComponent: TrainIcon, tip: 'Teach your AI!' },
        { id: 'test' as ClassifierMode, number: 3, label: 'Test', IconComponent: TestIcon, tip: 'Test your AI!' }
    ]
    const modeOrder: ClassifierMode[] = ['collect', 'train', 'test']
    const currentIndex = modeOrder.indexOf(mode)

    return (
        <div className="w-full max-w-[600px] mx-auto">
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 px-5 border border-gray-200 shadow-xs relative">
                {steps.map((step, index) => {
                    const isActive = mode === step.id
                    const isCompleted = index < currentIndex

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                type="button"
                                onClick={() => onModeChange(step.id)}
                                className={`flex items-center gap-2.5 p-2.5 px-4 rounded-xl border-none cursor-pointer flex-1 transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed]'
                                        : isCompleted
                                            ? 'bg-emerald-50'
                                            : 'bg-transparent'
                                }`}
                            >
                                <div
                                    className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center text-xs shrink-0 transition-all duration-200 ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    {isCompleted ? '✓' : <step.IconComponent size={16} color="currentColor" />}
                                </div>
                                <div className="text-left">
                                    <div
                                        className={`text-xs font-bold leading-tight ${
                                            isActive ? 'text-white' : 'text-gray-900'
                                        }`}
                                    >
                                        {step.label}
                                    </div>
                                    <div
                                        className={`text-[10px] leading-snug ${
                                            isActive ? 'text-white/70' : 'text-gray-500'
                                        }`}
                                    >
                                        {step.tip}
                                    </div>
                                </div>
                            </button>

                            {/* Connector arrow */}
                            {index < steps.length - 1 && (
                                <div className="flex items-center justify-center shrink-0 mx-1">
                                    <div
                                        className={`w-3 h-0.5 rounded-xs transition-colors duration-300 ${
                                            index < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'
                                        }`}
                                    />
                                    <div
                                        className={`w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-5 -ml-px transition-colors duration-300 ${
                                            index < currentIndex ? 'border-l-emerald-500' : 'border-l-gray-200'
                                        }`}
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
