import React, { useCallback, useState, useRef } from 'react'
import { IgniteTopbar } from '../../Electra/Client/Src/components/Layout/Topbar'
import { fileService } from '../../Electra/Client/Src/services/FileService'
import type { ProjectType, NeuraProject } from '../types/neura.types'

interface NeuraHomeProps {
    onSelect: (type: ProjectType, template?: { name: string; classes: string[] }) => void
    onBack: () => void
}

const CLASSIFIER_TYPES: {
    type: ProjectType
    name: string
    emoji: string
    iconUrl: string
    description: string
    color: string
    gradient: string
    badge: string
    hasToggle?: boolean
}[] = [
        {
            type: 'image-classifier',
            name: 'Image Detective',
            emoji: '📸',
            iconUrl: 'https://api.iconify.design/fluent-emoji/high-res/coloramera.png',
            description: 'Teach your computer to SEE and recognize things!',
            color: '#8B5CF6',
            gradient: 'from-[#630ed4] via-[#7c3aed] to-[#a855f7]',
            badge: '👁️ Vision'
        },
        {
            type: 'audio-classifier',
            name: 'Sound Catcher',
            emoji: '🎤',
            iconUrl: 'https://api.iconify.design/fluent-emoji/high-res/color microphone.png',
            description: 'Train AI to LISTEN and tell sounds apart!',
            color: '#A855F7',
            gradient: 'from-[#7c3aed] via-[#a855f7] to-[#d946ef]',
            badge: '👂 Sound'
        },
        {
            type: 'pose-classifier',
            name: 'Body & Hand Poses',
            emoji: '🤸',
            iconUrl: 'https://api.iconify.design/fluent-emoji/high-res/color person-raising-hand.png',
            description: 'Teach AI to read body poses AND hand gestures!',
            color: '#EA580C',
            gradient: 'from-[#c32c00] via-[#ef4444] to-[#f97316]',
            badge: '💃 Motion',
            hasToggle: true
        },
        {
            type: 'text-classifier',
            name: 'Word Wizard',
            emoji: '📝',
            iconUrl: 'https://api.iconify.design/fluent-emoji/high-res/color memo.png',
            description: 'Classify words and sentences with smart word magic!',
            color: '#059669',
            gradient: 'from-[#006c44] via-[#10b981] to-[#34d399]',
            badge: '🔡 Words'
        },
        {
            type: 'numbers-cr',
            name: 'Number Ninja',
            emoji: '🔢',
            iconUrl: 'https://api.iconify.design/fluent-emoji/high-res/color input-numbers.png',
            description: 'Understand numbers and patterns like a genius!',
            color: '#8B5CF6',
            gradient: 'from-[#a855f7] via-[#d946ef] to-[#f472b6]',
            badge: '🔢 Math'
        },
        {
            type: 'object-detection',
            name: 'Object Finder',
            emoji: '🔍',
            iconUrl: 'https://api.iconify.design/fluent-emoji/high-res/color magnifying-glass-tilted-left.png',
            description: 'Find and spot multiple things in one picture!',
            color: '#4F46E5',
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
        name: 'Finger Counter',
        description: 'Count fingers with AI hand tracking!',
        icon: '✋',
        icon2: '☝️',
        icon3: '🖖',
        classes: ['One', 'Two', 'Three', 'Four', 'Five'],
        color: '#0ea5e9',
        bg: 'from-[#0ea5e9]/10 to-[#38bdf8]/10',
        tag: '✋ Hands',
        projectType: 'hand-pose-classifier' as ProjectType
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

export default function NeuraHome({ onSelect, onBack }: NeuraHomeProps) {
    const [showTypePicker, setShowTypePicker] = useState(false)
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)
    const [poseMode, setPoseMode] = useState<'body' | 'hand'>('body')

    const handleBlankProject = useCallback(() => {
        setShowTypePicker(true)
    }, [])

    const handlePickType = useCallback((type: ProjectType) => {
        setShowTypePicker(false)
        onSelect(type)
    }, [onSelect])

    const handleSave = useCallback(() => { }, [])
    const handleTitleChange = useCallback(() => { }, [])

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDownload = useCallback(() => {
        alert('Create or open a project first to download it as a .leap file.')
    }, [])

    const handleImport = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const data = await fileService.loadProject(file)
            const validation = fileService.validateNeuraImport(data)
            if (!validation.isValid) {
                alert(validation.error || 'Invalid project file.')
                return
            }
            let projectData: NeuraProject
            if (data.mode === 'neura' && data.classes) {
                projectData = {
                    id: data.id || Date.now().toString(36),
                    type: data.type || 'image-classifier',
                    name: data.projectName || data.name || 'Imported Project',
                    classes: data.classes || [],
                    createdAt: data.createdAt || data.timestamp || Date.now(),
                    updatedAt: data.updatedAt || Date.now(),
                    modelTrained: data.modelTrained || false,
                    accuracy: data.accuracy,
                    projectData: data.projectData
                }
            } else if (data.classes && data.type) {
                projectData = data as NeuraProject
            } else {
                alert('This file does not appear to be a valid Neura project.')
                return
            }
            if (!Array.isArray(projectData.classes)) {
                alert('Invalid project file: missing classes data.')
                return
            }
            onSelect(projectData.type)
        } catch (err: any) {
            console.error('[Neura] Failed to import project:', err)
            alert('Failed to read project file: ' + (err?.message || 'Unknown error'))
        }
        e.target.value = ''
    }, [onSelect])

    return (
        <div className="w-full h-screen flex flex-col relative overflow-hidden bg-[#faf8ff]">
            <style dangerouslySetInnerHTML={{ __html: `
                .neura-page {
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                    background: radial-gradient(circle at top left, #f3e8ff 0%, #ffffff 40%, #ffffff 60%, #f3e8ff 100%);
                    min-height: 100%;
                    width: 100%;
                    color: #374151;
                }
                .neura-border-vision { border-top: 4px solid #8B5CF6; }
                .neura-border-sound { border-top: 4px solid #A855F7; }
                .neura-border-motion { border-top: 4px solid #EA580C; }
                .neura-border-word { border-top: 4px solid #059669; }
                .neura-border-math { border-top: 4px solid #8B5CF6; }
                .neura-border-spot { border-top: 4px solid #4F46E5; }
                .neura-card {
                    background: #fff;
                    border-radius: 1.5rem;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.03);
                    padding: 2.25rem 1.75rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
                    cursor: pointer;
                    border: 1.5px solid #e5e7eb;
                    position: relative;
                    overflow: hidden;
                }
                .neura-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at top center, rgba(139,92,246,0.03) 0%, transparent 60%);
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .neura-card:hover::before {
                    opacity: 1;
                }
                .neura-card:hover {
                    transform: translateY(-6px) scale(1.02);
                    box-shadow: 0 8px 24px rgba(139,92,246,0.12), 0 16px 40px rgba(0,0,0,0.06);
                    border-color: #c4b5fd;
                }
                .neura-project-card {
                    border-radius: 1.25rem;
                    overflow: hidden;
                    background: #fff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
                    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                    cursor: pointer;
                    border: 1.5px solid #e5e7eb;
                }
                .neura-project-card:hover {
                    box-shadow: 0 8px 30px rgba(139,92,246,0.12), 0 4px 12px rgba(0,0,0,0.06);
                    transform: translateY(-4px);
                    border-color: #c4b5fd;
                }
                .neura-blank-card {
                    background: #fff;
                    border: 2px dashed #c4b5fd;
                    border-radius: 1.25rem;
                    padding: 2rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                    min-height: 180px;
                }
                .neura-blank-card:hover {
                    background: #fff;
                    border-color: #a78bfa;
                }
            ` }} />

            <input
                type="file"
                ref={fileInputRef}
                hidden
                accept=".leap,.lbproject,application/json"
                onChange={handleFileImport}
            />
            <IgniteTopbar
                title="NEURA"
                onBack={onBack}
                onSave={handleSave}
                onTitleChange={handleTitleChange}
                onDownload={handleDownload}
                onOpen={handleImport}
                brandName="NEURA"
            />

            <div className="flex-1 overflow-x-hidden overflow-y-auto neura-scrollbar w-full relative z-10 flex flex-col items-center">
                <div className="neura-page w-full flex-1 flex flex-col items-center">
                    {/* ── Hero Section ── */}
                    <header className="relative w-full flex justify-center" style={{ paddingTop: '40px', paddingBottom: '24px' }}>
                        <div className="flex flex-col items-center text-center px-6 sm:px-8 lg:px-10 max-w-3xl">
                            {/* Version Badge */}
                            <div
                                className="inline-flex items-center rounded-full mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(243,232,255,0.95) 100%)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '8px 18px 8px 10px',
                                    border: '1px solid rgba(168,85,247,0.2)',
                                    boxShadow: '0 4px 16px rgba(139,92,246,0.1), 0 1px 3px rgba(0,0,0,0.04)',
                                    gap: '10px',
                                }}
                            >
                                <div
                                    className="flex items-center justify-center rounded-full"
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                        boxShadow: '0 2px 8px rgba(139,92,246,0.4)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{ fontSize: '13px' }}>🧠</span>
                                </div>
                                <span className="text-[11px] font-bold text-purple-700" style={{ letterSpacing: '0.02em' }}>Your AI Learning Buddy!</span>
                                <span
                                    className="text-[10px] font-bold text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
                                        padding: '3px 10px',
                                        borderRadius: '9999px',
                                        letterSpacing: '0.04em',
                                        flexShrink: 0,
                                        lineHeight: '1.4',
                                    }}
                                >
                                    v2.0
                                </span>
                            </div>

                            {/* Main Title */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 tracking-tight leading-tight mb-4">
                                Choose Your Superpower! ⚡
                            </h1>

                            <p className="text-gray-500 text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-6 text-center">
                                Pick what you want to teach your AI buddy!
                                <br />
                                Each power uses different AI magic 🪄
                            </p>

                        {/* Superpower Icons Row */}
                        <div className="flex justify-center items-center gap-3" style={{ marginTop: '16px', marginBottom: '8px' }}>
                            <div className="flex -space-x-2">
                                {CLASSIFIER_TYPES.map(item => (
                                    <div
                                        key={item.type}
                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden bg-white"
                                        style={{ fontSize: '16px', background: `linear-gradient(135deg, ${item.color}10, ${item.color}05)` }}
                                        title={item.name}
                                    >
                                        {item.emoji}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 font-semibold">{CLASSIFIER_TYPES.length} superpowers unlocked!</span>
                        </div>
                        <div style={{ height: '40px' }} />
                        </div>
                    </header>

                    {/* ── Superpower Cards Grid ── */}
                    <main className="w-full flex justify-center" style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '24px', paddingBottom: '32px' }}>
                        <div className="w-full max-w-7xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '28px' }}>
                            {CLASSIFIER_TYPES.map((item) => {
                                const borderClass =
                                    item.type === 'image-classifier' ? 'neura-border-vision' :
                                    item.type === 'audio-classifier' ? 'neura-border-sound' :
                                    item.type === 'pose-classifier' ? 'neura-border-motion' :
                                    item.type === 'text-classifier' ? 'neura-border-word' :
                                    item.type === 'numbers-cr' ? 'neura-border-math' :
                                    'neura-border-spot'

                                return (
                                    <div
                                        key={item.type}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (item.hasToggle) {
                                                onSelect(poseMode === 'body' ? 'pose-classifier' : 'hand-pose-classifier')
                                            } else {
                                                onSelect(item.type)
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                if (item.hasToggle) {
                                                    onSelect(poseMode === 'body' ? 'pose-classifier' : 'hand-pose-classifier')
                                                } else {
                                                    onSelect(item.type)
                                                }
                                            }
                                        }}
                                        onMouseEnter={() => setHoveredCard(item.type)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        className={`neura-card ${borderClass}`}
                                    >
                                        {/* Icon Container */}
                                        <div
                                            className="flex items-center justify-center transition-transform duration-300 hover:scale-110"
                                            style={{
                                                width: '88px',
                                                height: '88px',
                                                borderRadius: '1.5rem',
                                                backgroundColor: `${item.color}10`,
                                                border: `2px solid ${item.color}25`,
                                                boxShadow: `0 6px 20px ${item.color}18`,
                                                marginBottom: '20px',
                                                fontSize: '48px'
                                            }}
                                        >
                                            {item.emoji}
                                        </div>

                                        {/* Badge */}
                                        <div
                                            className="inline-flex items-center rounded-full"
                                            style={{
                                                padding: '5px 14px 5px 8px',
                                                backgroundColor: item.color,
                                                boxShadow: `0 3px 12px ${item.color}35`,
                                                marginBottom: '14px',
                                                gap: '6px',
                                            }}
                                        >
                                            <span style={{ fontSize: '13px', lineHeight: 1 }}>{item.badge.split(' ')[0]}</span>
                                            <span className="font-bold" style={{ fontSize: '11px', letterSpacing: '0.05em', color: '#fff' }}>
                                                {item.badge.split(' ').slice(1).join(' ')}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-extrabold text-gray-800 leading-snug" style={{ fontSize: '1.4rem', marginBottom: '10px' }}>
                                            {item.name}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-gray-500 leading-relaxed font-medium" style={{ fontSize: '14px', maxWidth: '250px' }}>
                                            {item.description}
                                        </p>

                                        {/* Toggle switch for pose classifier */}
                                        {item.hasToggle && (
                                            <div
                                                className="flex items-center rounded-2xl mt-4"
                                                style={{
                                                    background: '#f3f4f6',
                                                    border: '2px solid #e5e7eb',
                                                    padding: '5px',
                                                    gap: '4px',
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => setPoseMode('body')}
                                                    style={{
                                                        padding: '10px 18px',
                                                        borderRadius: '14px',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.06em',
                                                        textTransform: 'uppercase',
                                                        transition: 'all 0.25s ease',
                                                        background: poseMode === 'body' ? '#fff' : 'transparent',
                                                        color: poseMode === 'body' ? '#ea580c' : '#9ca3af',
                                                        boxShadow: poseMode === 'body' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                    }}
                                                >
                                                    <span style={{ fontSize: '15px' }}>🏋️</span> Body
                                                </button>
                                                <button
                                                    onClick={() => setPoseMode('hand')}
                                                    style={{
                                                        padding: '10px 18px',
                                                        borderRadius: '14px',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.06em',
                                                        textTransform: 'uppercase',
                                                        transition: 'all 0.25s ease',
                                                        background: poseMode === 'hand' ? '#fff' : 'transparent',
                                                        color: poseMode === 'hand' ? '#2563eb' : '#9ca3af',
                                                        boxShadow: poseMode === 'hand' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                    }}
                                                >
                                                    <span style={{ fontSize: '15px' }}>✋</span> Hand
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        </div>
                    </main>

                    {/* ── Quick Start Projects ── */}
                    <section className="w-full flex justify-center" style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '32px', paddingBottom: '48px' }}>
                        <div className="w-full" style={{ maxWidth: '1100px' }}>
                        <div className="text-center" style={{ marginBottom: '40px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚀</div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-800" style={{ marginBottom: '12px' }}>
                                Quick Start Projects
                            </h2>
                            <p className="text-gray-500 text-base leading-relaxed" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                Pick a ready-made project or start a fresh one from scratch!
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5" style={{ gap: '20px' }}>
                            {/* Create Blank Project */}
                            <button
                                onClick={handleBlankProject}
                                className="neura-blank-card group"
                            >
                                <div style={{ fontSize: '40px', marginBottom: '14px' }} className="group-hover:scale-125 transition-transform">✨</div>
                                <span className="font-bold text-gray-700 group-hover:text-purple-600 transition-colors" style={{ fontSize: '15px' }}>Create Blank Project</span>
                                <span className="text-gray-400 mt-1.5 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>Start fresh!</span>
                            </button>

                            {PROJECT_TEMPLATES.map((template) => (
                                <button
                                    key={template.name}
                                    onClick={() => onSelect((template as any).projectType || 'image-classifier', { name: template.name, classes: template.classes })}
                                    className="neura-project-card text-left"
                                >
                                    <div
                                        className="flex items-center justify-center gap-3"
                                        style={{ backgroundColor: `${template.color}10`, padding: '32px 16px' }}
                                    >
                                        <span className="select-none transition-transform duration-300 hover:scale-110" style={{ fontSize: '2.2rem' }}>{template.icon}</span>
                                        <span className="select-none transition-transform duration-300 hover:scale-110" style={{ fontSize: '2.2rem' }}>{template.icon2}</span>
                                        <span className="select-none transition-transform duration-300 hover:scale-110" style={{ fontSize: '2.2rem' }}>{template.icon3}</span>
                                    </div>
                                    <div
                                        className="bg-white"
                                        style={{ padding: '16px', borderTop: `2px solid ${template.color}18` }}
                                    >
                                        <h4 className="font-bold text-gray-800" style={{ fontSize: '14px' }}>{template.name}</h4>
                                    </div>
                                </button>
                            ))}
                        </div>
                        </div>
                    </section>

                    {/* ── Footer ── */}
                    <footer className="py-8 border-t border-gray-100 bg-white/40 backdrop-blur-sm w-full flex justify-center">
                        <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🧠</span>
                                <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">NEURA</span>
                            </div>
                            <p className="text-xs text-gray-400">Designed to inspire the next generation of AI innovators.</p>
                            <div className="text-xs text-gray-400">LeapLab v2.0 &copy; 2026 Creoleap Technologies Pvt. Ltd.</div>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Type Picker Modal */}
            {showTypePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-[0_25px_60px_-15px_rgba(99,14,212,0.18)]" style={{ padding: '36px' }}>
                        {/* Close button */}
                        <button
                            onClick={() => setShowTypePicker(false)}
                            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                            style={{ fontSize: '14px' }}
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="text-center" style={{ marginBottom: '32px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <span style={{ fontSize: '28px' }}>✨</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#131b2e]" style={{ marginBottom: '6px' }}>Select Project Type</h3>
                            <p className="text-sm text-gray-500">
                                Choose what your AI will learn to recognize
                            </p>
                        </div>

                        {/* Project types grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '12px' }}>
                            {CLASSIFIER_TYPES.map(item => (
                                <button
                                    key={item.type}
                                    onClick={() => handlePickType(item.type)}
                                    className="group text-left transition-all duration-200"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        border: '1px solid #f3f4f6',
                                        background: '#fff',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#c4b5fd'
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #faf5ff, #f5f3ff)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,14,212,0.08)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#f3f4f6'
                                        e.currentTarget.style.background = '#fff'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)`,
                                        border: `1.5px solid ${item.color}25`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'transform 0.2s',
                                        fontSize: '24px'
                                    }}
                                    className="group-hover:scale-105"
                                    >
                                        {item.emoji}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-[#131b2e]" style={{ transition: 'color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#630ed4'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#131b2e'}
                                        >
                                            {item.name}
                                        </div>
                                        <div className="text-xs text-gray-400" style={{ marginTop: '2px' }}>
                                            {item.badge}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
