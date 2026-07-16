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
            iconUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFV6WP6Ccd3fI57YmAmqM2bIyoaGVESdaQBOoNhq47iHamltyRvW1l99BoFwi1tl0-8OSDfZu2G9MxfYHfPPpTmD37XibvEHG6xWh_nyBM7zmsS_A1Cc0INjMLpedCufcHhQvCcPs74d2tCAivOq_PPHvsgY2vAH2N_q01qF1atytL_gwMGBtVilMNeJ68sB_ji1kn12p2KyPI0QuNwRqJxCbeF7-L5uMWCQS7zuS8iIT3eFWMBDjNM9Ezn2hJVwHH1tdXmAdl4Q',
            description: 'Teach your computer to SEE and recognize things!',
            color: '#8B5CF6',
            gradient: 'from-[#630ed4] via-[#7c3aed] to-[#a855f7]',
            badge: '👁️ Vision'
        },
        {
            type: 'audio-classifier',
            name: 'Sound Catcher',
            emoji: '🎤',
            iconUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQnamSDGi56YINT9FErtq2kCV3fSImrmVtd2oHlJHinRPlVa0IlgY2IvcHydU8Ce5gmblkub5WYc1lEAA3yCU_-UVfBzYqGYoDf9_4Dgy1vex4TEYCGOwxZ1XPg0NUpTsp4kW9upu4Eo-OCdCn39tvITj4tpF5JKC7f36X72sUTcxDupTx44Hfzy0IAu8dUNj0oFjmaSSLQ0WBGzoZH5Rgwbpk56wLQ-mN4bbVVlN8Zl88dSKLVTr7DkskzF959W9IzVLJ7qJmyQ',
            description: 'Train AI to LISTEN and tell sounds apart!',
            color: '#A855F7',
            gradient: 'from-[#7c3aed] via-[#a855f7] to-[#d946ef]',
            badge: '👂 Sound'
        },
        {
            type: 'pose-classifier',
            name: 'Body & Hand Poses',
            emoji: '🤸',
            iconUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGgUObyyyGa8gle6EgQLb2cZR8GzZLFf77q58ePxR4--asSj6yHlBKsETVLRnkhuPdoka4tggAQm5HAGgW_bySFzbI3sgkx5vgYCoSpl47f0z0xGY7u2FO7zeitNmDc4iqW2AktFahwJ2lBEQ_NBw1auoMi57TmqHPX311QAEXcvi620xzAlxh4rr2RDvTqYFaak8WxxV2Dyvys8PNJ-vAe4BEvsVdiQhFDf5AGsCwc_REWOc5vORvszUH1J4jTUcKJXflBT-JOw',
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
            iconUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDn1qEY1FgfJRanmYYjFVL-BPY_UxnTiFfzAlf70nrcvrRCYGF-vQ7--Hd7TH0AzBWqm51VN1lCoh_f58NaxiKoU001R7Ftzm8CtjmMNB28WG5ODyuJQte_l9mzNT_L7iIqFzaZriXZ8NugsIAGnT3OC6UggOJkQaAc2RZRiX2Ic45ZpA8XdFdf7XHxzW_1eCy8fQ_jKJ8NOMuG22a3wpwI-LI9VNkxDhkz9RoF7ouR7bm5GiMla6ozDmO1fxv4hcBUuVdSIdGXgA',
            description: 'Classify words and sentences with smart word magic!',
            color: '#059669',
            gradient: 'from-[#006c44] via-[#10b981] to-[#34d399]',
            badge: '🔡 Words'
        },
        {
            type: 'numbers-cr',
            name: 'Number Ninja',
            emoji: '🔢',
            iconUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlZKi_6lO0LjrZIQaeF1nbNi18Y26MtFJjb6z3MC0dPtioCt9L3_PAHpX6YOSQ_qslem2fCxabiNw3rpbRopTQoYjbnHQBBGC47erhNJS28JMG_zLG3WvJjBNpPSRdZIs-ZPwZblhgjeIR5nHvzK_Ub_cyalRuABWEm3LbzSSwdEIBodd25fXQm9rwycwI4OPX9BLvpdJW2k27NkIkClILIWVgv7Hc4-Ge24SaILqbHMiq58qLFV4LhrlT8410NOV2yuFJAgaILA',
            description: 'Understand numbers and patterns like a genius!',
            color: '#8B5CF6',
            gradient: 'from-[#a855f7] via-[#d946ef] to-[#f472b6]',
            badge: '🔢 Math'
        },
        {
            type: 'object-detection',
            name: 'Object Finder',
            emoji: '🔍',
            iconUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgU5-o_BmTfV7QGif79ZrLpy31DZAQCpxkV1cqQDgid7yFziL9H2EXCW1q1SoqYjDr40bL50EsaCx2kTHhiBzzwE0iCkFlKR1sSKlinBD5ndu8ZeuA9xMdYVSLPTx74pxkjvAnuEByfp84L-SfTy08vZEpQCFRz9HPAtR6YlCOKxC6cxX2Qa3aR7J7I-gPUaAL-3JZW47CEg5uLOsedjMGuwjIPWAkjH77RJbOOG5c0IjHYj76FJH4pAmee5kaOy8KLYZP5yWSNg',
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
                    padding: 2rem 1.5rem;
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
                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden bg-white p-0.5"
                                        title={item.name}
                                    >
                                        <img alt={item.name} className="w-full h-full object-contain" src={item.iconUrl} />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                            className="flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                                            style={{
                                                width: '72px',
                                                height: '72px',
                                                borderRadius: '1.25rem',
                                                backgroundColor: `${item.color}0A`,
                                                border: `1.5px solid ${item.color}18`,
                                                boxShadow: `0 4px 14px ${item.color}12`,
                                            }}
                                        >
                                            <img alt={item.name} className="w-11 h-11 object-contain select-none" src={item.iconUrl} />
                                        </div>

                                        {/* Badge */}
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                                            style={{
                                                color: item.color,
                                                backgroundColor: `${item.color}0D`,
                                            }}
                                        >
                                            {item.badge}
                                        </span>

                                        {/* Title */}
                                        <h3 className="text-xl font-extrabold text-gray-800 mb-2 leading-snug">
                                            {item.name}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-[13px] text-gray-500 leading-relaxed" style={{ maxWidth: '240px' }}>
                                            {item.description}
                                        </p>

                                        {/* Toggle switch for pose classifier */}
                                        {item.hasToggle && (
                                            <div
                                                className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 mt-4"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => setPoseMode('body')}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${poseMode === 'body' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    🏋️ Body
                                                </button>
                                                <button
                                                    onClick={() => setPoseMode('hand')}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${poseMode === 'hand' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    ✋ Hand
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
                                <div style={{ fontSize: '32px', marginBottom: '12px' }} className="group-hover:scale-125 transition-transform">✨</div>
                                <span className="text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-colors">Create Blank Project</span>
                                <span className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wider font-semibold">Start fresh!</span>
                            </button>

                            {PROJECT_TEMPLATES.map((template) => (
                                <button
                                    key={template.name}
                                    onClick={() => onSelect((template as any).projectType || 'image-classifier', { name: template.name, classes: template.classes })}
                                    className="neura-project-card text-left"
                                >
                                    <div
                                        className="flex items-center justify-center gap-3"
                                        style={{ backgroundColor: `${template.color}08`, padding: '28px 16px' }}
                                    >
                                        <span className="text-3xl select-none transition-transform duration-300 hover:scale-110">{template.icon}</span>
                                        <span className="text-3xl select-none transition-transform duration-300 hover:scale-110">{template.icon2}</span>
                                        <span className="text-3xl select-none transition-transform duration-300 hover:scale-110">{template.icon3}</span>
                                    </div>
                                    <div
                                        className="bg-white"
                                        style={{ padding: '14px 16px', borderTop: `1px solid ${template.color}15` }}
                                    >
                                        <h4 className="text-sm font-bold text-gray-800">{template.name}</h4>
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
                    <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-3xl p-8 border border-white/80 shadow-[0_25px_60px_-15px_rgba(99,14,212,0.15)]">
                        <button
                            onClick={() => setShowTypePicker(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-8">
                            <span className="text-3xl mb-2 inline-block">✨</span>
                            <h3 className="text-2xl font-bold text-[#131b2e]">Select Project Type</h3>
                            <p className="text-sm text-[#4a4455]/70 mt-1">
                                Choose the sensory interface you want your custom AI model to process.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {CLASSIFIER_TYPES.map(item => (
                                <button
                                    key={item.type}
                                    onClick={() => handlePickType(item.type)}
                                    className="group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-white hover:to-gray-50/50 border border-gray-100/80 hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 p-2 bg-white border border-gray-100"
                                    >
                                        <img alt={item.name} className="w-8 h-8 object-contain select-none" src={item.iconUrl} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-[#131b2e] group-hover:text-[#630ed4] transition-colors">
                                            {item.name}
                                        </div>
                                        <div className="text-xs text-[#4a4455]/60 mt-0.5">
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
