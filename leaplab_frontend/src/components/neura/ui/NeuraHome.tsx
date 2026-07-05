import React from 'react'
import type { ProjectType } from '../../../types/neura.types'

interface NeuraHomeProps {
    onSelect: (type: ProjectType) => void
    onBack: () => void
}

const CLASSIFIER_TYPES: {
    type: ProjectType
    name: string
    description: string
    emoji: string
    color: string
    gradient: string
    shadow: string
}[] = [
    {
        type: 'image-classifier',
        name: 'Image',
        description: 'Teach your computer to recognize pictures!',
        emoji: '📷',
        color: '#7C3AED',
        gradient: 'from-violet-400 to-purple-500',
        shadow: 'shadow-violet-200'
    },
    {
        type: 'audio-classifier',
        name: 'Audio',
        description: 'Train it to understand sounds and voices!',
        emoji: '🎤',
        color: '#3B82F6',
        gradient: 'from-blue-400 to-indigo-500',
        shadow: 'shadow-blue-200'
    },
    {
        type: 'pose-classifier',
        name: 'Pose',
        description: 'Detect body movements and gestures!',
        emoji: '🧍',
        color: '#F97316',
        gradient: 'from-orange-400 to-red-500',
        shadow: 'shadow-orange-200'
    },
    {
        type: 'text-classifier',
        name: 'Text',
        description: 'Classify words and sentences smartly!',
        emoji: '💬',
        color: '#10B981',
        gradient: 'from-emerald-400 to-teal-500',
        shadow: 'shadow-emerald-200'
    },
    {
        type: 'numbers-cr',
        name: 'Numbers',
        description: 'Draw digits and let AI recognize them!',
        emoji: '✏️',
        color: '#EC4899',
        gradient: 'from-pink-400 to-rose-500',
        shadow: 'shadow-pink-200'
    }
]

export default function NeuraHome({ onSelect, onBack }: NeuraHomeProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Neura</h1>
                    <p className="text-sm text-gray-400">AI & Machine Learning</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
                <div className="text-center mb-10">
                    <div className="text-6xl mb-4">🧠</div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Classifier</h2>
                    <p className="text-gray-500 max-w-md">
                        Pick what you want to teach your computer to recognize. Each type uses different AI magic!
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
                    {CLASSIFIER_TYPES.map((item) => (
                        <button
                            key={item.type}
                            onClick={() => onSelect(item.type)}
                            className={`group relative flex flex-col items-center p-8 rounded-3xl bg-white border border-gray-100 shadow-lg ${item.shadow} hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 active:scale-95 cursor-pointer`}
                        >
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-4xl mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                {item.emoji}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
                            <p className="text-sm text-gray-500 text-center leading-relaxed">{item.description}</p>

                            <div
                                className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ backgroundColor: item.color }}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
