import React from 'react'
import { IgniteTopbar } from '../../../Electra/Client/Src/components/Layout/Topbar'
import type { ProjectType } from '../../../types/neura.types'

interface NeuraHomeProps {
    onSelect: (type: ProjectType, template?: { name: string; classes: string[] }) => void
    onBack: () => void
}

const CLASSIFIER_TYPES: {
    type: ProjectType
    name: string
    description: string
    emoji: string
    color: string
    gradient: string
    glow: string
}[] = [
    {
        type: 'image-classifier',
        name: 'Image',
        description: 'Teach your computer to recognize pictures!',
        emoji: '📷',
        color: '#7C3AED',
        gradient: 'from-violet-500 to-purple-600',
        glow: 'shadow-violet-500/30'
    },
    {
        type: 'audio-classifier',
        name: 'Audio',
        description: 'Train it to understand sounds and voices!',
        emoji: '🎤',
        color: '#3B82F6',
        gradient: 'from-blue-500 to-indigo-600',
        glow: 'shadow-blue-500/30'
    },
    {
        type: 'pose-classifier',
        name: 'Pose',
        description: 'Detect body movements and gestures!',
        emoji: '🧍',
        color: '#F97316',
        gradient: 'from-orange-500 to-red-500',
        glow: 'shadow-orange-500/30'
    },
    {
        type: 'text-classifier',
        name: 'Text',
        description: 'Classify words and sentences smartly!',
        emoji: '💬',
        color: '#10B981',
        gradient: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-500/30'
    },
    {
        type: 'numbers-cr',
        name: 'Numbers',
        description: 'Draw digits and let AI recognize them!',
        emoji: '✏️',
        color: '#EC4899',
        gradient: 'from-pink-500 to-rose-500',
        glow: 'shadow-pink-500/30'
    },
    {
        type: 'object-detection',
        name: 'Objects',
        description: 'Find and locate objects in the real world!',
        emoji: '🔍',
        color: '#14B8A6',
        gradient: 'from-teal-500 to-cyan-500',
        glow: 'shadow-teal-500/30'
    }
]

const PROJECT_TEMPLATES = [
    {
        name: 'Fruit Classifier',
        description: 'Identify different fruits using AI',
        emoji: '🍎',
        classes: ['Apple', 'Banana', 'Orange', 'Grape'],
        color: '#EF4444',
        gradient: 'from-red-400 to-orange-500'
    },
    {
        name: 'Animal Classifier',
        description: 'Recognize different animals',
        emoji: '🐶',
        classes: ['Dog', 'Cat', 'Bird', 'Fish'],
        color: '#F59E0B',
        gradient: 'from-amber-400 to-yellow-500'
    },
    {
        name: 'Waste Segregation',
        description: 'Sort waste into correct categories',
        emoji: '♻️',
        classes: ['Wet Waste', 'Dry Waste', 'Recyclable', 'Hazardous'],
        color: '#10B981',
        gradient: 'from-emerald-400 to-green-500'
    },
    {
        name: 'Healthy vs Junk Food',
        description: 'Classify food as healthy or junk',
        emoji: '🥗',
        classes: ['Healthy Food', 'Junk Food'],
        color: '#8B5CF6',
        gradient: 'from-violet-400 to-purple-500'
    }
]

export default function NeuraHome({ onSelect, onBack }: NeuraHomeProps) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleSave = React.useCallback(() => {}, [])
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleTitleChange = React.useCallback(() => {}, [])

    return (
        <div className="h-screen flex flex-col relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 30%, #ede9fe 60%, #f0f9ff 100%)'
        }}>
            {/* Floating gradient orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-violet-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite 1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/10 rounded-full blur-3xl" />

            {/* Subtle dot grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, #7C3AED 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }} />

            <IgniteTopbar
                title="NEURA"
                onBack={onBack}
                onSave={handleSave}
                onTitleChange={handleTitleChange}
                brandName="NEURA"
            />

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10">
                <div className="text-center mb-12 animate-[stagger-in_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                    <div className="relative inline-block mb-6">
                        <div className="text-7xl relative z-10" style={{ animation: 'float 3s ease-in-out infinite' }}>🧠</div>
                        <div className="absolute inset-0 text-7xl blur-xl opacity-40" style={{
                            background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'float 3s ease-in-out infinite 0.2s'
                        }}>🧠</div>
                    </div>
                    <h2 className="text-4xl font-black mb-3" style={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #7C3AED 50%, #3B82F6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Choose Your Classifier
                    </h2>
                    <p className="text-gray-500 max-w-lg text-lg font-medium">
                        Pick what you want to teach your computer to recognize. Each type uses different AI magic!
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
                    {CLASSIFIER_TYPES.map((item, index) => (
                        <button
                            key={item.type}
                            onClick={() => onSelect(item.type)}
                            className="group relative flex flex-col items-center p-8 rounded-3xl transition-all duration-500 hover:scale-[1.04] hover:-translate-y-3 active:scale-95 cursor-pointer animate-[stagger-in_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]"
                            style={{
                                background: 'rgba(255,255,255,0.55)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.6)',
                                boxShadow: `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)`,
                                animationDelay: `${100 + index * 80}ms`
                            }}
                        >
                            {/* Gradient top border */}
                            <div
                                className="absolute top-0 left-4 right-4 h-1 rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: `linear-gradient(90deg, ${item.color}80, ${item.color})` }}
                            />

                            {/* Icon container */}
                            <div
                                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-4xl mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                style={{
                                    boxShadow: `0 8px 24px ${item.color}40, inset 0 2px 0 rgba(255,255,255,0.3)`
                                }}
                            >
                                {item.emoji}
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
                            <p className="text-sm text-gray-500 text-center leading-relaxed">{item.description}</p>

                            {/* Hover glow effect */}
                            <div
                                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    boxShadow: `0 20px 60px ${item.color}25, 0 0 40px ${item.color}10`
                                }}
                            />

                            {/* Bottom gradient strip */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: `linear-gradient(90deg, ${item.color}60, ${item.color})` }}
                            />
                        </button>
                    ))}
                </div>

                {/* Quick Start Projects */}
                <div className="mt-16 max-w-5xl w-full animate-[stagger-in_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Quick Start Projects</h3>
                        <p className="text-sm text-gray-500">Pick a pre-made template to start building in seconds</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PROJECT_TEMPLATES.map((template, index) => (
                            <button
                                key={template.name}
                                onClick={() => onSelect('image-classifier', { name: template.name, classes: template.classes })}
                                className="group relative flex flex-col items-center p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-2 active:scale-95 cursor-pointer animate-[stagger-in_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]"
                                style={{
                                    background: 'rgba(255,255,255,0.6)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    animationDelay: `${600 + index * 80}ms`
                                }}
                            >
                                <div
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center text-2xl mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                                    style={{ boxShadow: `0 6px 16px ${template.color}30` }}
                                >
                                    {template.emoji}
                                </div>
                                <h4 className="text-sm font-bold text-gray-800 mb-1">{template.name}</h4>
                                <p className="text-xs text-gray-400 text-center mb-3">{template.description}</p>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {template.classes.slice(0, 3).map(cls => (
                                        <span key={cls} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-medium">
                                            {cls}
                                        </span>
                                    ))}
                                    {template.classes.length > 3 && (
                                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-medium">
                                            +{template.classes.length - 3}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
