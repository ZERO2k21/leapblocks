import React, { useCallback, useState } from 'react'
import { IgniteTopbar } from '../../Electra/Client/Src/components/Layout/Topbar'
import type { ProjectType } from '../types/neura.types'

interface NeuraHomeProps {
    onSelect: (type: ProjectType, template?: { name: string; classes: string[] }) => void
    onBack: () => void
}

const CLASSIFIER_TYPES: {
    type: ProjectType
    name: string
    emoji: string
    description: string
    color: string
    gradient: string
    badge: string
}[] = [
    {
        type: 'image-classifier',
        name: 'Image Detective',
        emoji: '📸',
        description: 'Teach your computer to SEE and recognize things!',
        color: '#630ed4',
        gradient: 'from-[#630ed4] via-[#7c3aed] to-[#a855f7]',
        badge: '👁️ Vision'
    },
    {
        type: 'audio-classifier',
        name: 'Sound Catcher',
        emoji: '🎤',
        description: 'Train AI to LISTEN and tell sounds apart!',
        color: '#7c3aed',
        gradient: 'from-[#7c3aed] via-[#a855f7] to-[#d946ef]',
        badge: '👂 Sound'
    },
    {
        type: 'pose-classifier',
        name: 'Pose Master',
        emoji: '🤸',
        description: 'Detect body moves and dance poses!',
        color: '#c32c00',
        gradient: 'from-[#c32c00] via-[#ef4444] to-[#f97316]',
        badge: '💃 Dance'
    },
    {
        type: 'text-classifier',
        name: 'Word Wizard',
        emoji: '📝',
        description: 'Classify words and sentences with smart word magic!',
        color: '#006c44',
        gradient: 'from-[#006c44] via-[#10b981] to-[#34d399]',
        badge: '🔤 Words'
    },
    {
        type: 'numbers-cr',
        name: 'Number Ninja',
        emoji: '🔢',
        description: 'Understand numbers and patterns like a genius!',
        color: '#a855f7',
        gradient: 'from-[#a855f7] via-[#d946ef] to-[#f472b6]',
        badge: '🧮 Math'
    },
    {
        type: 'object-detection',
        name: 'Object Finder',
        emoji: '🔍',
        description: 'Find and spot multiple things in one picture!',
        color: '#630ed4',
        gradient: 'from-[#630ed4] via-[#3b82f6] to-[#06b6d4]',
        badge: '🎯 Spot'
    }
]

const PROJECT_TEMPLATES = [
    {
        name: 'Rock Paper Scissors',
        description: 'Play against AI that knows your hand moves!',
        icon: '✊',
        icon2: '📄',
        icon3: '✂️',
        classes: ['rock', 'paper', 'scissors'],
        color: '#7c3aed',
        bg: 'from-[#7c3aed]/10 to-[#a855f7]/10',
        tag: '🕹️ Game'
    },
    {
        name: 'Fruit Finder',
        description: 'Teach AI to recognize yummy fruits!',
        icon: '🍎',
        icon2: '🍌',
        icon3: '🍊',
        classes: ['Apple', 'Banana', 'Orange'],
        color: '#c32c00',
        bg: 'from-[#c32c00]/10 to-[#ef4444]/10',
        tag: '🍏 Healthy'
    },
    {
        name: 'Pet Identifier',
        description: 'Can your AI tell a cat from a dog?',
        icon: '🐱',
        icon2: '🐶',
        icon3: '🐦',
        classes: ['Cat', 'Dog', 'Bird'],
        color: '#006c44',
        bg: 'from-[#006c44]/10 to-[#10b981]/10',
        tag: '🐾 Pets'
    },
    {
        name: 'Eco Sorter',
        description: 'Help save the planet by sorting trash!',
        icon: '♻️',
        icon2: '🌍',
        icon3: '🌱',
        classes: ['Paper', 'Plastic', 'Metal'],
        color: '#630ed4',
        bg: 'from-[#630ed4]/10 to-[#3b82f6]/10',
        tag: '🌱 Eco'
    }
]

function FloatingOrb({ className, color }: { className: string; color: string }) {
    return (
        <div
            className={`absolute rounded-full opacity-20 blur-3xl pointer-events-none ${className}`}
            style={{ backgroundColor: color }}
        />
    )
}

export default function NeuraHome({ onSelect, onBack }: NeuraHomeProps) {
    const [showTypePicker, setShowTypePicker] = useState(false)
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)

    const handleBlankProject = useCallback(() => {
        setShowTypePicker(true)
    }, [])

    const handlePickType = useCallback((type: ProjectType) => {
        setShowTypePicker(false)
        onSelect(type)
    }, [onSelect])

    const handleSave = useCallback(() => {}, [])
    const handleTitleChange = useCallback(() => {}, [])

    return (
        <div className="w-full h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#faf8ff] via-white to-[#f0ecfd]">
            {/* Floating background orbs */}
            <FloatingOrb className="w-96 h-96 -top-20 -left-20" color="#630ed4" />
            <FloatingOrb className="w-80 h-80 top-1/3 -right-32" color="#a855f7" />
            <FloatingOrb className="w-60 h-60 bottom-20 left-1/4" color="#06b6d4" />
            <FloatingOrb className="w-72 h-72 bottom-0 right-1/3" color="#10b981" />

            <IgniteTopbar
                title="NEURA"
                onBack={onBack}
                onSave={handleSave}
                onTitleChange={handleTitleChange}
                brandName="NEURA"
            />

            <div className="flex-1 overflow-x-hidden overflow-y-auto neura-scrollbar w-full relative z-10 flex flex-col items-center">
                <section className="scroll-mt-20 w-full flex flex-col items-center">
                    <div className="w-full max-w-[1200px] px-6 sm:px-8 lg:px-10">
                        {/* Hero */}
                        <div className="pt-10 pb-6 text-center relative">
                            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md rounded-full px-5 py-1.5 shadow-sm border border-[#dae2fd]/60 mb-6 animate-fade-in">
                                <span className="text-sm">🧠</span>
                                <span className="text-xs font-bold bg-gradient-to-r from-[#630ed4] to-[#a855f7] bg-clip-text text-transparent">Your AI Learning Buddy!</span>
                                <span className="text-xs bg-[#eaedff] text-[#630ed4] font-bold px-2 py-0.5 rounded-full">v2.0</span>
                            </div>

                            <div className="relative inline-block mb-6">
                                <div className="text-8xl animate-bounce select-none">🧠</div>
                                <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
                                <div className="absolute -bottom-1 -left-3 text-xl animate-pulse" style={{ animationDelay: '500ms' }}>⚡</div>
                            </div>

                            <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none mb-4 text-center">
                                <span className="bg-gradient-to-r from-[#630ed4] via-[#7c3aed] to-[#a855f7] bg-clip-text text-transparent">
                                    Choose Your
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-[#a855f7] via-[#d946ef] to-[#f472b6] bg-clip-text text-transparent">
                                    Superpower! ⚡
                                </span>
                            </h1>

                            <p className="text-lg text-center text-[#4a4455]/80 max-w-xl mx-auto font-medium leading-relaxed">
                                Pick what you want to teach your AI buddy!
                                <br />
                                Each power uses different AI magic <span className="inline-block animate-spin" style={{ animationDuration: '3s' }}>✨</span>
                            </p>

                            <div className="flex items-center justify-center gap-4 mt-8">
                                <div className="flex -space-x-2">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#630ed4] to-[#7c3aed] flex items-center justify-center text-xs border-2 border-white shadow-sm">📸</div>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-xs border-2 border-white shadow-sm">🎤</div>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c32c00] to-[#ef4444] flex items-center justify-center text-xs border-2 border-white shadow-sm">🤸</div>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#006c44] to-[#10b981] flex items-center justify-center text-xs border-2 border-white shadow-sm">📝</div>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#a855f7] to-[#d946ef] flex items-center justify-center text-xs border-2 border-white shadow-sm">🔢</div>
                                </div>
                                <span className="text-xs text-[#4a4455]/60 font-medium">6 superpowers unlocked!</span>
                            </div>
                        </div>

                        {/* Classifier Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-2">
                            {CLASSIFIER_TYPES.map((item) => {
                                const isHovered = hoveredCard === item.type
                                return (
                                    <button
                                        key={item.type}
                                        onClick={() => onSelect(item.type)}
                                        onMouseEnter={() => setHoveredCard(item.type)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        className="group relative w-full bg-white/50 backdrop-blur-sm rounded-3xl p-7 flex flex-col items-center text-center cursor-pointer border border-[#dae2fd]/60 hover:border-transparent transition-all duration-500 shadow-sm hover:shadow-xl overflow-hidden"
                                    >
                                        {/* Hover gradient overlay */}
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}
                                        />

                                        {/* Top color bar */}
                                        <div
                                            className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl transition-all duration-500 ${isHovered ? 'h-2' : 'h-1'}`}
                                            style={{ backgroundColor: item.color }}
                                        />

                                        {/* Emoji Icon Container (Prevents badge overlapping) */}
                                        <div
                                            className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 shadow-sm relative z-20"
                                            style={{ backgroundColor: `${item.color}0d`, borderColor: `${item.color}25` }}
                                        >
                                            <span className="text-3xl select-none">{item.emoji}</span>
                                        </div>

                                        {/* Badge (Dynamically themed to match card brand color) */}
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 transition-all duration-300 ${isHovered ? 'text-white scale-105' : ''}`}
                                            style={
                                                isHovered
                                                    ? { backgroundColor: item.color }
                                                    : { color: item.color, backgroundColor: `${item.color}15` }
                                            }
                                        >
                                            {item.badge}
                                        </span>

                                        <h3 className="text-xl font-bold text-[#131b2e] mb-1.5">{item.name}</h3>
                                        <p className="text-sm text-[#4a4455]/85 leading-relaxed">{item.description}</p>

                                        {/* Hover sparkles container (Prevents layout height shifting) */}
                                        <div className="h-6 mt-4 flex items-center justify-center">
                                            <div className={`flex gap-1.5 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                                <span className="text-sm animate-bounce" style={{ animationDelay: '0ms' }}>⭐</span>
                                                <span className="text-sm animate-bounce" style={{ animationDelay: '150ms' }}>⭐</span>
                                                <span className="text-sm animate-bounce" style={{ animationDelay: '300ms' }}>⭐</span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Type Picker */}
                        {showTypePicker && (
                            <div className="mt-6 text-center animate-fade-in">
                                <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 bg-white/70 backdrop-blur-md rounded-2xl border border-[#dae2fd]/60 shadow-sm">
                                    <span className="text-xs font-bold text-[#630ed4] px-2">✨ Pick your power:</span>
                                    {CLASSIFIER_TYPES.map(item => (
                                        <button
                                            key={item.type}
                                            onClick={() => handlePickType(item.type)}
                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 cursor-pointer bg-white border border-[#dae2fd]/60 shadow-sm hover:shadow-md text-[#131b2e] active:scale-95"
                                        >
                                            <span className="text-base">{item.emoji}</span>
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quick Start Projects */}
                <section className="py-14 w-full flex flex-col items-center">
                    <div className="w-full max-w-[1200px] px-6 sm:px-8 lg:px-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <span className="text-3xl">🚀</span>
                            </div>
                            <h2 className="text-4xl font-black text-[#131b2e] mb-2">
                                Quick Start Projects
                            </h2>
                            <p className="text-base text-[#4a4455]/70 max-w-md mx-auto">
                                Pick a ready-made project or start a fresh one from scratch!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                            {/* Create Blank Project (Placed First for Professional UX) */}
                            <button
                                onClick={handleBlankProject}
                                className="group relative w-full bg-white/50 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer border-2 border-dashed border-[#ccc3d8]/60 hover:border-[#630ed4]/40 hover:bg-white/70 transition-all duration-500 min-h-[240px] hover:-translate-y-1 shadow-sm hover:shadow-xl"
                            >
                                <div className="text-5xl mb-4 group-hover:scale-125 group-hover:rotate-90 transition-all duration-500 select-none">✨</div>
                                <span className="text-base font-bold text-[#131b2e] group-hover:text-[#630ed4] transition-colors duration-300">
                                    Create Blank Project
                                </span>
                                <span className="text-xs text-[#7b7487]/70 mt-1">Start from scratch!</span>
                                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#630ed4]/20 transition-all duration-500 pointer-events-none" />
                            </button>

                            {PROJECT_TEMPLATES.map((template) => {
                                const isTemplateHovered = hoveredCard === `tpl-${template.name}`
                                return (
                                <button
                                    key={template.name}
                                    onClick={() => onSelect('image-classifier', { name: template.name, classes: template.classes })}
                                    onMouseEnter={() => setHoveredCard(`tpl-${template.name}`)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    className="group relative w-full bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden flex flex-col text-left cursor-pointer border border-[#dae2fd]/60 hover:border-transparent transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1"
                                >
                                    {/* Hover gradient overlay */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded-2xl pointer-events-none`}
                                        style={{ background: `linear-gradient(135deg, ${template.color}33, transparent)` }}
                                    />

                                    {/* Icon strip */}
                                    <div className={`h-32 w-full flex items-center justify-center gap-3 bg-gradient-to-br ${template.bg} border-b border-[#dae2fd]/60 transition-all duration-500 group-hover:gap-4`}>
                                        <span className="text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">{template.icon}</span>
                                        <span className="text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0" style={{ transitionDelay: '50ms' }}>{template.icon2}</span>
                                        <span className="text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" style={{ transitionDelay: '100ms' }}>{template.icon3}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 relative flex-1 flex flex-col">
                                        <div
                                            className="absolute top-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ backgroundColor: template.color }}
                                        />
                                        <h4 className="text-base font-bold text-[#131b2e] mb-1.5">{template.name}</h4>
                                        <p className="text-xs text-[#4a4455]/70 mb-3 line-clamp-2 leading-relaxed flex-1">{template.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold transition-all duration-300 ${isTemplateHovered ? 'text-white' : 'bg-[#eaedff] text-[#630ed4]'}`}
                                                style={isTemplateHovered ? { backgroundColor: template.color } : {}}
                                            >
                                                {template.tag}
                                            </span>
                                            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#630ed4] font-bold">Start →</span>
                                        </div>
                                    </div>
                                </button>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-10 border-t border-[#ccc3d8]/20 bg-white/40 backdrop-blur-sm w-full shrink-0">
                    <div className="flex flex-col md:flex-row justify-between items-center px-6 sm:px-8 lg:px-10 gap-6 max-w-[1200px] mx-auto w-full">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                            <div className="flex items-center gap-2 text-base font-bold">
                                <span className="text-xl">🧠</span>
                                <span className="bg-gradient-to-r from-[#630ed4] to-[#a855f7] bg-clip-text text-transparent">NEURA</span>
                            </div>
                            <p className="text-xs text-[#4a4455]/60">Your AI Learning Buddy! Made for curious minds ✨</p>
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="flex items-center gap-1 text-xs font-semibold text-[#4a4455]/60 hover:text-[#630ed4] transition-colors">
                                <span>📖</span> Guide
                            </a>
                            <a href="#" className="flex items-center gap-1 text-xs font-semibold text-[#4a4455]/60 hover:text-[#630ed4] transition-colors">
                                <span>❓</span> Help
                            </a>
                            <a href="#" className="flex items-center gap-1 text-xs font-semibold text-[#4a4455]/60 hover:text-[#630ed4] transition-colors">
                                <span>⭐</span> Rate
                            </a>
                        </div>
                        <div className="text-xs text-[#4a4455]/50">
                            Made with <span className="inline-block animate-pulse">💜</span> for young creators
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
