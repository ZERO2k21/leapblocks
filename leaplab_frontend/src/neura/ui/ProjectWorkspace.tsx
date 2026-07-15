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
    annotate: '🏷️'
}

function ModeSwitcher({ mode, onModeChange, canTrain, projectType }: { mode: ClassifierMode; onModeChange: (m: ClassifierMode) => void; canTrain: boolean; projectType: ProjectType }) {
    const isObjectDetection = projectType === 'object-detection'
    const modes = isObjectDetection
        ? [{ id: 'collect' as const, label: 'Collect', emoji: '📸' }, { id: 'annotate' as const, label: 'Label', emoji: '🏷️' }, { id: 'train' as const, label: 'Train', emoji: '🏋️' }, { id: 'test' as const, label: 'Test', emoji: '🧪' }]
        : [{ id: 'collect' as const, label: 'Collect', emoji: '📸' }, { id: 'train' as const, label: 'Train', emoji: '🏋️' }, { id: 'test' as const, label: 'Test', emoji: '🧪' }]

    return (
        <div className="flex items-center gap-1 bg-white/20 rounded-xl p-0.5">
            {modes.map((m) => {
                const isActive = mode === m.id
                const isDisabled = m.id === 'train' && !canTrain
                return (
                    <button
                        key={m.id}
                        onClick={() => !isDisabled && onModeChange(m.id)}
                        disabled={isDisabled}
                        className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                            isActive
                                ? 'bg-white text-[#630ed4] shadow-sm'
                                : isDisabled
                                    ? 'text-white/30 cursor-not-allowed'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <span className="text-xs">{m.emoji}</span>
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
    const [pendingAction, setPendingAction] = useState<'new' | 'open' | null>(null)
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
        if (pendingAction === 'new') {
            onBack()
        } else if (pendingAction === 'open') {
            fileInputRef.current?.click()
        }
        setPendingAction(null)
    }, [pendingAction, onBack])

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
            <div className="px-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs sm:text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
                        <span className="text-sm sm:text-base">{isObjectDetection ? '🏷️' : '📁'}</span>
                        {isObjectDetection ? 'Objects' : 'Classes'}
                    </h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowAddClass(true)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#eaedff] text-[#630ed4] flex items-center justify-center hover:bg-[#dae2fd] active:scale-95 transition-all text-sm sm:text-lg"
                            title={isObjectDetection ? 'Add New Label' : 'Add Class'}
                        >
                            ➕
                        </button>
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="w-7 h-7 rounded-xl bg-[#fee2e2] text-[#991b1b] flex items-center justify-center hover:bg-[#fecaca] transition-all text-sm"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {showAddClass && (
                    <div className="flex gap-1.5 animate-fade-in">
                        <input
                            autoFocus
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddClass()
                                if (e.key === 'Escape') setShowAddClass(false)
                            }}
                            placeholder={isObjectDetection ? 'Label name...' : 'Class name...'}
                            className="flex-1 px-2.5 py-2 text-xs font-semibold border border-[#630ed4]/30 rounded-xl focus:outline-none focus:border-[#630ed4] bg-white transition-colors text-[#131b2e] placeholder:text-[#7b7487]"
                        />
                        <button
                            onClick={handleAddClass}
                            className="px-3 py-2 bg-[#630ed4] text-white rounded-xl text-xs font-bold hover:shadow-md transition-all"
                        >
                            ✅
                        </button>
                    </div>
                )}
            </div>

            {/* Class list */}
            <div className="flex-1 overflow-y-auto neura-scrollbar px-2 space-y-1">
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
                    <div className="flex flex-col items-center py-10 text-center">
                        <span className="text-2xl sm:text-3xl mb-2">📂</span>
                        <p className="text-[10px] sm:text-xs font-bold text-[#131b2e] mb-0.5">No classes yet</p>
                        <p className="text-[9px] sm:text-[10px] text-[#4a4455]">Click + to add some! ✨</p>
                    </div>
                )}
            </div>

            {/* Workflow Stepper */}
            <div className="px-3 py-3 border-t border-[#dae2fd]">
                {isObjectDetection ? (
                    <div className="flex items-center justify-between">
                        {['Collect', 'Label', 'Train', 'Test'].map((step, idx) => {
                            const modeId = ['collect', 'annotate', 'train', 'test'][idx] as ClassifierMode
                            const isCurrent = mode.mode === modeId
                            const isCompleted = idx < ['collect', 'annotate', 'train', 'test'].indexOf(mode.mode)
                            const stepEmojis = ['📸', '🏷️', '🏋️', '🧪']
                            return (
                                <button
                                    key={step}
                                    onClick={() => mode.setMode(modeId)}
                                    className="flex flex-col items-center gap-1 group"
                                >
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs transition-all ${
                                        isCurrent
                                            ? 'bg-[#630ed4] text-white shadow-md shadow-[#630ed4]/30 scale-110'
                                            : isCompleted
                                                ? 'bg-[#006c44] text-white'
                                                : 'bg-[#dae2fd] text-[#7b7487] group-hover:bg-[#ccc3d8]'
                                    }`}>
                                        {isCompleted ? '✅' : stepEmojis[idx]}
                                    </div>
                                    <span className={`text-[7px] sm:text-[8px] font-semibold ${isCurrent ? 'text-[#630ed4]' : 'text-[#7b7487]'}`}>{step}</span>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex gap-1">
                        {[
                            { id: 'collect' as const, label: 'Collect', emoji: '📸' },
                            { id: 'train' as const, label: 'Train', emoji: '🏋️' },
                            { id: 'test' as const, label: 'Test', emoji: '🧪' }
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => mode.setMode(m.id)}
                                className={`flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                                    mode.mode === m.id
                                        ? 'bg-[#630ed4] text-white shadow-sm'
                                        : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'
                                }`}
                            >
                                <span>{m.emoji}</span>
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
                onBack={onBack}
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
                <aside className="hidden md:flex w-56 bg-white/80 backdrop-blur-md border-r border-[#dae2fd] flex-col py-3 z-40 animate-fade-in shrink-0">
                    {sidebarContent}
                </aside>

                {/* Mobile sidebar overlay */}
                {isMobile && sidebarOpen && (
                    <div className="fixed inset-0 z-50 flex">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <div className="relative w-64 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col py-3 animate-slide-in-left">
                            {sidebarContent}
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 overflow-y-auto neura-scrollbar bg-[#faf8ff] min-w-0">
                    <div key={mode.mode} className="animate-fade-in">
                        {children({ mode })}
                    </div>
                </main>
            </div>

            {/* Status Bar */}
            <footer className="bg-white/80 backdrop-blur-sm border-t border-[#dae2fd] px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-[#4a4455]">
                    <span className="flex items-center gap-1"><span className="text-xs sm:text-sm">🖼️</span> {mode.getTotalSamples()} pics</span>
                    <span className="text-[#ccc3d8]">|</span>
                    <span className="flex items-center gap-1"><span className="text-xs sm:text-sm">📁</span> {mode.project?.classes.length || 0} types</span>
                    <span className="hidden sm:inline text-[#ccc3d8]">|</span>
                    <span className="hidden sm:flex items-center gap-1 text-[#006c44]"><span className="text-sm">💾</span> Auto-saved</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${mode.project?.modelTrained ? 'bg-[#006c44] animate-pulse' : 'bg-[#ccc3d8]'}`} />
                    <span className="text-[#4a4455]">{mode.project?.modelTrained ? '✅ Ready' : '⏳ No model'}</span>
                </div>
            </footer>

            <DiscardConfirmModal
                isOpen={showDiscardModal}
                classCount={mode.project?.classes.length || 0}
                onConfirm={handleDiscardConfirm}
                onCancel={handleDiscardCancel}
                title={pendingAction === 'new' ? 'Start a new project?' : 'Open another project?'}
                description={
                    pendingAction === 'new'
                        ? 'Any unsaved changes will be lost. Do you want to continue?'
                        : 'Any unsaved changes will be lost when you open another project.'
                }
            />
        </div>
    )
}
