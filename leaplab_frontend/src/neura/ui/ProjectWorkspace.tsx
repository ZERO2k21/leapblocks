import React, { useState, useEffect, useRef, useCallback } from 'react'
import { IgniteTopbar } from '../../Electra/Client/Src/components/Layout/Topbar'
import type { ProjectType, NeuraProject } from '../types/neura.types'
import type { ClassifierMode } from '../hooks/useNeuraProject'
import { useNeuraProject } from '../hooks/useNeuraProject'
import { fileService } from '../../Electra/Client/Src/services/FileService'
import ClassCard from './components/ClassCard'
import DiscardConfirmModal from './components/DiscardConfirmModal'

interface ProjectWorkspaceProps {
    type: ProjectType
    onBack: () => void
    template?: { name: string; classes: string[] }
    children: (props: {
        mode: ReturnType<typeof useNeuraProject>
    }) => React.ReactNode
}

const MODE_EMOJI: Record<string, string> = {
    collect: '📸',
    train: '🏋️',
    test: '🧪',
    annotate: '🏷️',
    evaluate: '📊'
}

function ModeSwitcher({ mode, onModeChange, canTrain, projectType }: { mode: ClassifierMode; onModeChange: (m: ClassifierMode) => void; canTrain: boolean; projectType: ProjectType }) {
    const isObjectDetection = projectType === 'object-detection'
    const modes = isObjectDetection
        ? [{ id: 'collect' as const, label: 'Collect', emoji: '📸' }, { id: 'annotate' as const, label: 'Label', emoji: '🏷️' }, { id: 'train' as const, label: 'Train', emoji: '🏋️' }, { id: 'evaluate' as const, label: 'Evaluate', emoji: '📊' }, { id: 'test' as const, label: 'Test', emoji: '🧪' }]
        : [{ id: 'collect' as const, label: 'Collect', emoji: '📸' }, { id: 'train' as const, label: 'Train', emoji: '🏋️' }, { id: 'test' as const, label: 'Test', emoji: '🧪' }]

    return (
        <div
            className="flex items-center"
            style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '4px',
                gap: '3px',
            }}
        >
            {modes.map((m) => {
                const isActive = mode === m.id
                const isDisabled = m.id === 'train' && !canTrain
                return (
                    <button
                        key={m.id}
                        onClick={() => !isDisabled && onModeChange(m.id)}
                        disabled={isDisabled}
                        className="flex items-center"
                        style={{
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '11px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            background: isActive ? '#fff' : 'transparent',
                            color: isActive ? '#630ed4' : isDisabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                            boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            opacity: isDisabled ? 0.5 : 1,
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>{m.emoji}</span>
                        <span className="hidden sm:inline">{m.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default function ProjectWorkspace({ type, onBack, template, children }: ProjectWorkspaceProps) {
    const mode = useNeuraProject(type, template?.name)
    const [newClassName, setNewClassName] = useState('')
    const [showAddClass, setShowAddClass] = useState(false)
    const [showDiscardModal, setShowDiscardModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<'home' | 'new' | 'open' | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isMobile, setIsMobile] = useState(false)

    const isObjectDetection = type === 'object-detection'

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile) setSidebarOpen(false)
            else setSidebarOpen(true)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (template && template.classes.length > 0 && mode.project && mode.project.classes.length === 0) {
            template.classes.forEach(className => {
                mode.addClass(className)
            })
        }
    }, [])

    const canTrain = mode.project
        ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2)
        : false

    const handleAddClass = () => {
        if (newClassName.trim()) {
            mode.addClass(newClassName.trim())
            setNewClassName('')
            setShowAddClass(false)
        }
    }

    const totalSamples = mode.getTotalSamples()

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDownload = useCallback(() => {
        if (!mode.project) return
        fileService.saveProjectLocally(mode.project.name, 'neura', mode.project)
    }, [mode.project])

    const handleSaveAs = useCallback(() => {
        handleDownload()
    }, [handleDownload])

    const hasUnsavedWork = mode.project && mode.project.classes.length > 0

    const handleNewProject = useCallback(() => {
        if (hasUnsavedWork) {
            setPendingAction('new')
            setShowDiscardModal(true)
        } else {
            mode.resetProject()
            localStorage.removeItem(`neura-project-${type}`)
        }
    }, [hasUnsavedWork, mode, type])

    const handleHomeClick = useCallback(() => {
        if (hasUnsavedWork) {
            setPendingAction('home')
            setShowDiscardModal(true)
        } else {
            onBack()
        }
    }, [hasUnsavedWork, onBack])

    const handleOpenProject = useCallback(() => {
        if (hasUnsavedWork) {
            setPendingAction('open')
            setShowDiscardModal(true)
        } else {
            fileInputRef.current?.click()
        }
    }, [hasUnsavedWork])

    const handleDiscardConfirm = useCallback(() => {
        setShowDiscardModal(false)
        if (pendingAction === 'home') {
            onBack()
        } else if (pendingAction === 'new') {
            mode.resetProject()
            localStorage.removeItem(`neura-project-${type}`)
            // Re-add template classes after reset
            if (template && template.classes.length > 0) {
                setTimeout(() => {
                    template.classes.forEach(className => {
                        mode.addClass(className)
                    })
                }, 100)
            }
        } else if (pendingAction === 'open') {
            fileInputRef.current?.click()
        }
        setPendingAction(null)
    }, [pendingAction, onBack, mode, type, template])

    const handleDiscardCancel = useCallback(() => {
        setShowDiscardModal(false)
        setPendingAction(null)
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
            mode.loadProject(projectData)
        } catch (err: any) {
            console.error('[Neura] Failed to import project:', err)
            alert('Failed to read project file: ' + (err?.message || 'Unknown error'))
        }
        e.target.value = ''
    }, [mode])

    const sidebarContent = (
        <>
            <div style={{ padding: '16px 14px 12px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                    <h2
                        className="flex items-center"
                        style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: '#131b2e',
                            gap: '8px',
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>{isObjectDetection ? '🏷️' : '📁'}</span>
                        {isObjectDetection ? 'Objects' : 'Classes'}
                    </h2>
                    <button
                        onClick={() => setShowAddClass(true)}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(99,14,212,0.3)',
                            transition: 'all 0.2s ease',
                        }}
                        title={isObjectDetection ? 'Add New Label' : 'Add Class'}
                    >
                        +
                    </button>
                </div>

                {showAddClass && (
                    <div className="flex animate-fade-in" style={{ gap: '8px', marginBottom: '12px' }}>
                        <input
                            autoFocus
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddClass()
                                if (e.key === 'Escape') setShowAddClass(false)
                            }}
                            placeholder={isObjectDetection ? 'Label name...' : 'Class name...'}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: '1.5px solid #e5e7eb',
                                borderRadius: '10px',
                                outline: 'none',
                                background: '#fff',
                                color: '#131b2e',
                                transition: 'border-color 0.2s ease',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#630ed4'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            onClick={handleAddClass}
                            style={{
                                padding: '8px 14px',
                                background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                color: '#fff',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            ✓
                        </button>
                    </div>
                )}
            </div>

            {/* Class list */}
            <div className="flex-1 overflow-y-auto neura-scrollbar" style={{ padding: '0 10px' }}>
                {mode.project?.classes.map((classData, index) => (
                    <ClassCard
                        key={classData.id}
                        classData={classData}
                        isSelected={classData.id === mode.selectedClassId}
                        onSelect={() => {
                            mode.setSelectedClassId(classData.id)
                            if (isMobile) setSidebarOpen(false)
                        }}
                        onRemove={() => mode.removeClass(classData.id)}
                        onRename={(name) => mode.renameClass(classData.id, name)}
                        index={index}
                    />
                ))}

                {mode.project && mode.project.classes.length === 0 && !showAddClass && (
                    <div
                        className="flex flex-col items-center text-center"
                        style={{ padding: '40px 16px' }}
                    >
                        <div
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                marginBottom: '14px',
                                boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
                            }}
                        >
                            📂
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#131b2e', marginBottom: '4px' }}>
                            No classes yet
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                            Click + to add some! 👆
                        </p>
                    </div>
                )}
            </div>

            {/* Workflow Stepper */}
            <div style={{ padding: '12px 14px', borderTop: '1.5px solid #e5e7eb' }}>
                {isObjectDetection ? (
                    <div className="flex items-center justify-between">
                        {['Collect', 'Label', 'Train', 'Eval', 'Test'].map((step, idx) => {
                            const modeId = ['collect', 'annotate', 'train', 'evaluate', 'test'][idx] as ClassifierMode
                            const isCurrent = mode.mode === modeId
                            const isCompleted = idx < ['collect', 'annotate', 'train', 'evaluate', 'test'].indexOf(mode.mode)
                            const stepEmojis = ['📸', '🏷️', '🏋️', '📊', '🧪']
                            return (
                                <button
                                    key={step}
                                    onClick={() => mode.setMode(modeId)}
                                    className="flex flex-col items-center"
                                    style={{ gap: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                                >
                                    <div
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            background: isCurrent ? 'linear-gradient(135deg, #630ed4, #7c3aed)' : isCompleted ? '#d1fae5' : '#f3f4f6',
                                            color: isCurrent || isCompleted ? '#fff' : '#9ca3af',
                                            boxShadow: isCurrent ? '0 2px 8px rgba(99,14,212,0.3)' : 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {isCompleted ? '✓' : stepEmojis[idx]}
                                    </div>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: isCurrent ? '#630ed4' : '#9ca3af' }}>
                                        {step}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex" style={{ gap: '6px' }}>
                        {[
                            { id: 'collect' as const, label: 'Collect', emoji: '📸' },
                            { id: 'train' as const, label: 'Train', emoji: '🏋️' },
                            { id: 'test' as const, label: 'Test', emoji: '🧪' }
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => mode.setMode(m.id)}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease',
                                    background: mode.mode === m.id ? 'linear-gradient(135deg, #630ed4, #7c3aed)' : '#f3f0ff',
                                    color: mode.mode === m.id ? '#fff' : '#6b7280',
                                    boxShadow: mode.mode === m.id ? '0 2px 8px rgba(99,14,212,0.3)' : 'none',
                                }}
                            >
                                <span style={{ fontSize: '12px' }}>{m.emoji}</span>
                                {m.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    )

    return (
        <div className="h-screen flex flex-col bg-[#faf8ff]">
            <input
                type="file"
                ref={fileInputRef}
                hidden
                accept=".leap,.lbproject,application/json"
                onChange={handleFileImport}
            />
            <IgniteTopbar
                title={mode.project?.name || 'Classifier'}
                onBack={handleHomeClick}
                onSave={handleDownload}
                onDownload={handleDownload}
                onNew={handleNewProject}
                onOpen={handleOpenProject}
                onSaveAs={handleSaveAs}
                onTitleChange={(name) => mode.setProjectName(name)}
                brandName="NEURA"
                rightContent={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all"
                            title="Toggle sidebar"
                        >
                            {sidebarOpen ? '✕' : '☰'}
                        </button>
                        <ModeSwitcher
                            mode={mode.mode}
                            onModeChange={mode.setMode}
                            canTrain={canTrain}
                            projectType={type}
                        />
                    </div>
                }
            />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Desktop sidebar */}
                <aside
                    className="hidden md:flex flex-col z-40 animate-fade-in shrink-0"
                    style={{
                        width: '224px',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(12px)',
                        borderRight: '1.5px solid #e5e7eb',
                    }}
                >
                    {sidebarContent}
                </aside>

                {/* Mobile sidebar overlay */}
                {isMobile && sidebarOpen && (
                    <div className="fixed inset-0 z-50 flex">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <div
                            className="relative flex flex-col animate-slide-in-left"
                            style={{
                                width: '256px',
                                background: 'rgba(255,255,255,0.98)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '8px 0 32px rgba(0,0,0,0.12)',
                            }}
                        >
                            <div className="flex items-center justify-end" style={{ padding: '12px 14px 0' }}>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            {sidebarContent}
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 bg-[#faf8ff] min-w-0 flex flex-col overflow-hidden relative">
                    <div key={mode.mode} className="animate-fade-in flex-1 flex flex-col min-h-0 h-full relative">
                        {children({ mode })}
                    </div>
                </main>
            </div>

            {/* Status Bar */}
            <footer
                className="flex items-center justify-between"
                style={{
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(12px)',
                    borderTop: '1.5px solid #e5e7eb',
                    padding: '10px 16px',
                }}
            >
                <div className="flex items-center" style={{ gap: '12px' }}>
                    {/* Pics */}
                    <div
                        className="flex items-center"
                        style={{
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '10px',
                            background: '#f3f0ff',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#630ed4',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>🖼️</span>
                        <span>{mode.getTotalSamples()} pics</span>
                    </div>
                    {/* Types */}
                    <div
                        className="flex items-center"
                        style={{
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '10px',
                            background: '#f0fdf4',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#006c44',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>📁</span>
                        <span>{mode.project?.classes.length || 0} types</span>
                    </div>
                    {/* Auto-saved */}
                    <div
                        className="hidden sm:flex items-center"
                        style={{
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '10px',
                            background: '#ecfdf5',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#059669',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>💾</span>
                        <span>Auto-saved</span>
                    </div>
                </div>
                <div className="flex items-center" style={{ gap: '8px' }}>
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: mode.project?.modelTrained ? '#059669' : '#d1d5db',
                            boxShadow: mode.project?.modelTrained ? '0 0 8px rgba(5,150,105,0.5)' : 'none',
                        }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                        {mode.project?.modelTrained ? '✅ Ready' : '⏳ No model'}
                    </span>
                </div>
            </footer>

            <DiscardConfirmModal
                isOpen={showDiscardModal}
                classCount={mode.project?.classes.length || 0}
                onConfirm={handleDiscardConfirm}
                onCancel={handleDiscardCancel}
                title={
                    pendingAction === 'home'
                        ? 'Leave without saving?'
                        : pendingAction === 'new'
                            ? 'Start a new project?'
                            : 'Open another project?'
                }
                description={
                    pendingAction === 'home'
                        ? `You created ${mode.project?.classes.length || 0} ${(mode.project?.classes.length || 0) === 1 ? 'class' : 'classes'} but haven't added any training data yet. Your progress will be lost! 😢`
                        : pendingAction === 'new'
                            ? 'This will reset your workspace and remove all classes. You can start fresh with a new project!'
                            : 'Any unsaved changes will be lost when you open another project.'
                }
                confirmText={
                    pendingAction === 'home'
                        ? 'Leave 🚪'
                        : pendingAction === 'new'
                            ? 'Reset 🔄'
                            : 'Leave 🚪'
                }
            />
        </div>
    )
}
