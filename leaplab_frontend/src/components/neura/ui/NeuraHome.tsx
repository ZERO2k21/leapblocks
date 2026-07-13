import React, { useEffect, useCallback, useRef, useState } from 'react'
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
    icon: string
    gradient: string
    shadowColor: string
}[] = [
    {
        type: 'image-classifier',
        name: 'Image',
        description: 'Teach your computer to see and recognize pictures, objects, or faces.',
        icon: 'image',
        gradient: 'linear-gradient(135deg, #4648d4 0%, #6063ee 100%)',
        shadowColor: 'rgba(70, 72, 212, 0.35)'
    },
    {
        type: 'audio-classifier',
        name: 'Audio',
        description: 'Train models to distinguish sounds, spoken words, or musical patterns.',
        icon: 'mic',
        gradient: 'linear-gradient(135deg, #8127cf 0%, #9c48ea 100%)',
        shadowColor: 'rgba(129, 39, 207, 0.35)'
    },
    {
        type: 'pose-classifier',
        name: 'Pose',
        description: 'Detect body movements, skeletal points, and complex physical gestures.',
        icon: 'directions_run',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)',
        shadowColor: 'rgba(255, 107, 107, 0.35)'
    },
    {
        type: 'text-classifier',
        name: 'Text',
        description: 'Classify words, sentences, and sentiments using advanced NLP logic.',
        icon: 'description',
        gradient: 'linear-gradient(135deg, #006577 0%, #008096 100%)',
        shadowColor: 'rgba(0, 101, 119, 0.35)'
    },
    {
        type: 'numbers-cr',
        name: 'Numbers',
        description: 'Understand numerical data, patterns, and mathematical relationships.',
        icon: 'calculate',
        gradient: 'linear-gradient(135deg, #9c48ea 0%, #8127cf 100%)',
        shadowColor: 'rgba(156, 72, 234, 0.35)'
    },
    {
        type: 'object-detection',
        name: 'Objects',
        description: 'Localize multiple objects within a single frame with bounding boxes.',
        icon: 'search',
        gradient: 'linear-gradient(135deg, #6063ee 0%, #4648d4 100%)',
        shadowColor: 'rgba(96, 99, 238, 0.35)'
    }
]

const PROJECT_TEMPLATES = [
    {
        name: 'Smart Security',
        description: 'Real-time person and motion detection for surveillance systems.',
        icon: 'security',
        classes: ['person', 'motion', 'face', 'intruder'],
        color: '#4648d4',
        tags: ['COMPUTER VISION', 'TENSORFLOW']
    },
    {
        name: 'AI Games: RPS',
        description: 'Play against an AI that recognizes your hand gestures instantly.',
        icon: 'sports_esports',
        classes: ['rock', 'paper', 'scissors'],
        color: '#8127cf',
        tags: ['POSE NET', 'INTERACTIVE']
    },
    {
        name: 'Virtual Piano',
        description: 'Convert finger movements into beautiful piano melodies with Pose AI.',
        icon: 'piano',
        classes: ['C4', 'D4', 'E4', 'F4', 'G4'],
        color: '#006577',
        tags: ['AUDIO SYNTH', 'GESTURES']
    },
    {
        name: 'Fruit Detector',
        description: 'Identify and categorize various fruits and vegetables for inventory.',
        icon: 'restaurant',
        classes: ['Apple', 'Banana', 'Orange', 'Grape'],
        color: '#6063ee',
        tags: ['IMAGE CLASS', 'EDGETPU']
    },
    {
        name: 'Smart Parking',
        description: 'Automatically monitor and detect available spaces in parking lots.',
        icon: 'local_parking',
        classes: ['car', 'truck', 'empty', 'occupied'],
        color: '#9c48ea',
        tags: ['OBJ DETECTION', 'CCTV']
    },
    {
        name: 'Pet ID',
        description: 'Identify different animal breeds and species from photos instantly.',
        icon: 'pets',
        classes: ['Dog', 'Cat', 'Bird', 'Fish'],
        color: '#006577',
        tags: ['MOBILENET', 'WILDLIFE']
    },
    {
        name: 'Eco-Sort',
        description: 'Help the environment by automatically sorting recyclables from trash.',
        icon: 'recycling',
        classes: ['Paper', 'Plastic', 'Metal', 'Organic'],
        color: '#004e5c',
        tags: ['SUSTAINABILITY', 'IMAGING']
    }
]

export default function NeuraHome({ onSelect, onBack }: NeuraHomeProps) {
    const classifierRef = useRef<HTMLDivElement>(null)
    const [showTypePicker, setShowTypePicker] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleSave = useCallback(() => {}, [])
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleTitleChange = useCallback(() => {}, [])

    const handleBlankProject = useCallback(() => {
        setShowTypePicker(true)
        setTimeout(() => {
            classifierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
    }, [])

    const handlePickType = useCallback((type: ProjectType) => {
        setShowTypePicker(false)
        onSelect(type)
    }, [onSelect])

    useEffect(() => {
        const cards = document.querySelectorAll('.neura-glass-card')
        const handleEnter = (e: Event) => {
            const card = e.currentTarget as HTMLElement
            const icon = card.querySelector('.material-symbols-outlined')
            if (icon) (icon as HTMLElement).style.fontVariationSettings = "'FILL' 1"
        }
        const handleLeave = (e: Event) => {
            const card = e.currentTarget as HTMLElement
            const icon = card.querySelector('.material-symbols-outlined')
            if (icon) (icon as HTMLElement).style.fontVariationSettings = "'FILL' 0"
        }
        cards.forEach(card => {
            card.addEventListener('mouseenter', handleEnter)
            card.addEventListener('mouseleave', handleLeave)
        })
        return () => {
            cards.forEach(card => {
                card.removeEventListener('mouseenter', handleEnter)
                card.removeEventListener('mouseleave', handleLeave)
            })
        }
    }, [])

    return (
        <div className="h-screen flex flex-col relative overflow-y-auto neura-scrollbar neura-mesh-gradient"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, #4648d4 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }} />

            <IgniteTopbar
                title="NEURA"
                onBack={onBack}
                onSave={handleSave}
                onTitleChange={handleTitleChange}
                brandName="NEURA"
            />

            <div className="flex-1 overflow-y-auto">
                {/* ── Hero / Classifier Section ── */}
                <section ref={classifierRef} className="scroll-mt-20">
                    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Brain icon */}
                        <div className="pt-10 mb-6 flex justify-center">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center neura-float overflow-hidden"
                                style={{ background: 'rgba(70, 72, 212, 0.1)' }}
                            >
                                <span className="text-4xl">🧠</span>
                            </div>
                        </div>

                        {/* Heading — centered */}
                        <div className="text-center mb-12">
                            <h1 className="text-[48px] font-extrabold tracking-tight mb-4"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#131b2e', lineHeight: 1.1, letterSpacing: '-0.02em' }}
                            >
                                Choose Your Classifier
                            </h1>
                            <p className="text-lg max-w-2xl mx-auto"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#464554', lineHeight: 1.6 }}
                            >
                                Pick what you want to teach your computer to recognize. Each type uses unique AI magic to understand the world!
                            </p>
                        </div>

                        {/* Classifier Cards — fills parent container */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {CLASSIFIER_TYPES.map((item, index) => (
                                <button
                                    key={item.type}
                                    onClick={() => onSelect(item.type)}
                                    className="neura-glass-card rounded-3xl p-8 flex flex-col items-center text-center cursor-pointer group"
                                    style={{ animationDelay: `${100 + index * 80}ms` }}
                                >
                                    <div
                                        className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110"
                                        style={{ background: item.gradient, boxShadow: `0 8px 24px ${item.shadowColor}, inset 0 2px 0 rgba(255,255,255,0.3)` }}
                                    >
                                        <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {item.icon}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2"
                                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#131b2e' }}
                                    >
                                        {item.name}
                                    </h3>
                                    <p className="text-sm leading-relaxed"
                                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#464554' }}
                                    >
                                        {item.description}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Type Picker — shown after blank project click */}
                        {showTypePicker && (
                            <div className="mt-8 text-center animate-[scale-in_0.3s_cubic-bezier(0.4,0,0.2,1)]">
                                <p className="text-sm font-semibold mb-4" style={{ color: '#4648d4' }}>
                                    Select a classifier type to begin:
                                </p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {CLASSIFIER_TYPES.map(item => (
                                        <button
                                            key={item.type}
                                            onClick={() => handlePickType(item.type)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 cursor-pointer"
                                            style={{
                                                background: 'rgba(255,255,255,0.7)',
                                                backdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255,255,255,0.6)',
                                                boxShadow: `0 4px 16px ${item.shadowColor}`,
                                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                color: '#131b2e',
                                                fontWeight: 600,
                                                fontSize: '14px'
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: item.shadowColor }}>
                                                {item.icon}
                                            </span>
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Quick Start Projects ── */}
                <section className="py-10">
                    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Section header — centered */}
                        <div className="text-center mb-10">
                            <h2 className="text-[32px] font-bold mb-2"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#131b2e', letterSpacing: '-0.01em' }}
                            >
                                Quick Start Projects
                            </h2>
                            <p className="text-base mb-4"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#464554' }}
                            >
                                Pick a pre-made template to start building and deploying in seconds.
                            </p>
                            <button className="inline-flex items-center gap-2 font-bold hover:underline"
                                style={{ color: '#4648d4', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                                View All Templates
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                            </button>
                        </div>

                        {/* Project cards — fills same parent as classifier grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {PROJECT_TEMPLATES.map((template, index) => (
                                <button
                                    key={template.name}
                                    onClick={() => onSelect('image-classifier', { name: template.name, classes: template.classes })}
                                    className="neura-glass-card neura-project-card rounded-2xl overflow-hidden flex flex-col text-left cursor-pointer group"
                                    style={{ animationDelay: `${600 + index * 80}ms` }}
                                >
                                    <div className="h-40 w-full relative overflow-hidden"
                                        style={{ background: `linear-gradient(135deg, ${template.color}15 0%, ${template.color}08 100%)` }}
                                    >
                                        <svg className="w-full h-full" viewBox="0 0 200 110" fill="none">
                                            <defs>
                                                <pattern id={`grid-${index}`} width="12" height="12" patternUnits="userSpaceOnUse">
                                                    <path d="M 12 0 L 0 0 0 12" fill="none" stroke={`${template.color}15`} strokeWidth="0.5"/>
                                                </pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
                                            <circle cx="100" cy="55" r="30" stroke={template.color} strokeWidth="1" opacity="0.15" fill="none" />
                                            <circle cx="100" cy="55" r="20" stroke={template.color} strokeWidth="0.75" opacity="0.1" fill="none" strokeDasharray="4 4" />
                                            <circle cx="100" cy="55" r="6" fill={template.color} opacity="0.2" />
                                        </svg>
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
                                        <div className="absolute bottom-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                            style={{ background: template.color }}
                                        >
                                            <span className="material-symbols-outlined text-white text-xl">{template.icon}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 pt-3 flex flex-col flex-grow">
                                        <h4 className="text-[17px] font-semibold mb-1"
                                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#131b2e' }}
                                        >
                                            {template.name}
                                        </h4>
                                        <p className="text-[13px] mb-4 flex-grow line-clamp-2"
                                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#464554', lineHeight: 1.5 }}
                                        >
                                            {template.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {template.tags.map(tag => (
                                                <span key={tag}
                                                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                                                    style={{ fontFamily: "'Geist', sans-serif", background: `${template.color}12`, color: template.color }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {/* Create Blank Project */}
                            <button
                                onClick={handleBlankProject}
                                className="neura-blank-card rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer group min-h-[280px]"
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300"
                                    style={{ background: '#eaedff' }}
                                >
                                    <span className="material-symbols-outlined text-xl transition-colors duration-300" style={{ color: '#767586' }}>
                                        add
                                    </span>
                                </div>
                                <span className="mt-4 text-sm font-medium transition-colors duration-300"
                                    style={{ fontFamily: "'Geist', sans-serif", color: '#464554' }}
                                >
                                    Create Blank Project
                                </span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="py-10 border-t transition-all duration-300 w-full shrink-0"
                style={{ background: '#eaedff', borderColor: 'rgba(199, 196, 215, 0.3)' }}
            >
                <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 lg:px-8 gap-6 max-w-[1100px] mx-auto w-full">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <div className="text-lg font-bold" style={{ color: '#4648d4' }}>NEURA</div>
                        <p className="text-xs" style={{ color: 'rgba(70, 69, 84, 0.8)' }}>
                            &copy; 2024 Neura AI Learning Platform. Visionary. Kinetic. Encouraging.
                        </p>
                    </div>
                    <div className="flex gap-8">
                        {['Privacy Policy', 'Terms of Service', 'Documentation', 'Support'].map(link => (
                            <a key={link} href="#"
                                className="text-xs font-semibold hover:underline transition-colors"
                                style={{ fontFamily: "'Geist', sans-serif", color: 'rgba(70, 69, 84, 0.8)' }}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                            style={{ background: 'rgba(255,255,255,0.5)' }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#464554' }}>language</span>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                            style={{ background: 'rgba(255,255,255,0.5)' }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#464554' }}>mail</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
