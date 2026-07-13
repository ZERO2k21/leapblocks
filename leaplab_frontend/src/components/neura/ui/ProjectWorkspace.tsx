import React, { useState, useEffect, useRef, useCallback } from 'react'
import { IgniteTopbar } from '../../../Electra/Client/Src/components/Layout/Topbar'
import type { ProjectType, NeuraProject } from '../../../types/neura.types'
import type { ClassifierMode } from '../hooks/useNeuraProject'
import { useNeuraProject } from '../hooks/useNeuraProject'
import { fileService } from '../../../Electra/Client/Src/services/FileService'
import ClassCard from './components/ClassCard'

interface ProjectWorkspaceProps {
    type: ProjectType
    onBack: () => void
    template?: { name: string; classes: string[] }
    children: (props: {
        mode: ReturnType<typeof useNeuraProject>
    }) => React.ReactNode
}

function ModeSwitcher({ mode, onModeChange, canTrain, projectType }: { mode: ClassifierMode; onModeChange: (m: ClassifierMode) => void; canTrain: boolean; projectType: ProjectType }) {
    if (projectType === 'object-detection') {
        const modes = [
            { id: 'collect' as const, label: 'Collect' },
            { id: 'annotate' as const, label: 'Label' },
            { id: 'train' as const, label: 'Train' },
            { id: 'test' as const, label: 'Test' }
        ]

        return (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
                {modes.map((m) => {
                    const isActive = mode === m.id
                    return (
                        <button
                            key={m.id}
                            onClick={() => onModeChange(m.id)}
                            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                isActive
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {m.label}
                        </button>
                    )
                })}
            </div>
        )
    }

    const modes = [
        { id: 'collect' as const, label: 'Collect' },
        { id: 'train' as const, label: 'Train' },
        { id: 'test' as const, label: 'Test' }
    ]

    return (
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            {modes.map((m) => {
                const isActive = mode === m.id
                const isDisabled = m.id === 'train' && !canTrain
                return (
                    <button
                        key={m.id}
                        onClick={() => !isDisabled && onModeChange(m.id)}
                        disabled={isDisabled}
                        className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            isActive
                                ? 'bg-white text-slate-800 shadow-sm'
                                : isDisabled
                                    ? 'text-white/30 cursor-not-allowed'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {m.label}
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
    const [sessionTime] = useState(() => Date.now())

    const isObjectDetection = type === 'object-detection'

    // Auto-create classes from template on first mount
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
    const elapsed = Math.floor((Date.now() - sessionTime) / 60000)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDownload = useCallback(() => {
        if (!mode.project) return
        fileService.saveProjectLocally(mode.project.name, 'neura', mode.project)
    }, [mode.project])

    const handleImport = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const data = await fileService.loadProject(file)

            // Validate it's a valid neura project
            const validation = fileService.validateNeuraImport(data)
            if (!validation.isValid) {
                alert(validation.error || 'Invalid project file.')
                return
            }

            // Extract the NeuraProject from the .leap wrapper format
            let projectData: NeuraProject

            if (data.mode === 'neura' && data.classes) {
                // .leap wrapper format -- extract the neura project fields
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
                // Direct NeuraProject format
                projectData = data as NeuraProject
            } else {
                alert('This file does not appear to be a valid Neura project.')
                return
            }

            // Validate essential fields
            if (!Array.isArray(projectData.classes)) {
                alert('Invalid project file: missing classes data.')
                return
            }

            mode.loadProject(projectData)
        } catch (err: any) {
            console.error('[Neura] Failed to import project:', err)
            alert('Failed to read project file: ' + (err?.message || 'Unknown error'))
        }

        // Reset the input so the same file can be re-imported
        e.target.value = ''
    }, [mode])

    const OBJECT_DETECTION_ICONS: Record<string, string> = {
        label: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z',
        filter_center_focus: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
        polyline: 'M22 12h-4l-3 9L9 3l-3 9H2',
        add_circle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'
    }

    const getStepIcon = (index: number) => {
        const icons = ['collect', 'annotate', 'train', 'test']
        return OBJECT_DETECTION_ICONS[icons[index]] || OBJECT_DETECTION_ICONS.label
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".leap,.lbproject,application/json"
                onChange={handleFileImport}
            />
            <IgniteTopbar
                title={mode.project?.name || 'Classifier'}
                onBack={onBack}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onSave={() => {}}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onTitleChange={() => {}}
                brandName="NEURA"
                rightContent={
                    <ModeSwitcher
                        mode={mode.mode}
                        onModeChange={mode.setMode}
                        canTrain={canTrain}
                        projectType={type}
                    />
                }
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-56 bg-surface border-r border-outline-variant flex flex-col py-3 z-40 animate-[slide-down_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                    {/* Sidebar Header */}
                    <div className="px-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {isObjectDetection ? 'Objects' : 'Classes'}
                            </h2>
                            <button
                                onClick={() => setShowAddClass(true)}
                                className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all"
                                title={isObjectDetection ? 'Add New Label' : 'Add Class'}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                        </div>

                        {/* Add class input */}
                        {showAddClass && (
                            <div className="flex gap-1.5 animate-[slideUp_0.2s_ease-out]">
                                <input
                                    autoFocus
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddClass()
                                        if (e.key === 'Escape') setShowAddClass(false)
                                    }}
                                    placeholder={isObjectDetection ? 'Label name...' : 'Class name...'}
                                    className="flex-1 px-2.5 py-1.5 text-xs border border-primary/30 rounded-lg focus:outline-none focus:border-primary bg-white transition-colors"
                                />
                                <button
                                    onClick={handleAddClass}
                                    className="px-2 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:shadow-md transition-all"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Class list */}
                    <div className="flex-1 overflow-y-auto neura-scrollbar px-2 space-y-1.5">
                        {mode.project?.classes.map((classData, index) => (
                            <ClassCard
                                key={classData.id}
                                classData={classData}
                                isSelected={classData.id === mode.selectedClassId}
                                onSelect={() => mode.setSelectedClassId(classData.id)}
                                onRemove={() => mode.removeClass(classData.id)}
                                onRename={(name) => mode.renameClass(classData.id, name)}
                                index={index}
                            />
                        ))}

                        {mode.project && mode.project.classes.length === 0 && !showAddClass && (
                            <div className="flex flex-col items-center py-10 text-center">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8M8 12h8" />
                                    </svg>
                                </div>
                                <p className="text-xs font-semibold text-on-surface mb-0.5">No classes yet</p>
                                <p className="text-[10px] text-on-surface-variant">Click + to add</p>
                            </div>
                        )}
                    </div>

                    {/* Compact Workflow Stepper */}
                    <div className="px-3 py-3 border-t border-outline-variant">
                        {isObjectDetection ? (
                            <div className="flex items-center justify-between">
                                {['Collect', 'Label', 'Train', 'Test'].map((step, idx) => {
                                    const modeId = ['collect', 'annotate', 'train', 'test'][idx] as ClassifierMode
                                    const isCurrent = mode.mode === modeId
                                    const isCompleted = idx < ['collect', 'annotate', 'train', 'test'].indexOf(mode.mode)
                                    return (
                                        <button
                                            key={step}
                                            onClick={() => mode.setMode(modeId)}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                                                isCurrent
                                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                    : isCompleted
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-slate-200 text-slate-400'
                                            }`}>
                                                {isCompleted ? (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                ) : idx + 1}
                                            </div>
                                            <span className={`text-[9px] font-medium ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>{step}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex gap-1">
                                {[
                                    { id: 'collect' as const, label: 'Collect' },
                                    { id: 'train' as const, label: 'Train' },
                                    { id: 'test' as const, label: 'Test' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => mode.setMode(m.id)}
                                        className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                                            mode.mode === m.id
                                                ? 'bg-primary text-white'
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto neura-scrollbar bg-background">
                    <div key={mode.mode} className="animate-[fade-in_0.3s_ease-out]">
                        {children({ mode })}
                    </div>
                </main>
            </div>

            {/* ── Minimal Status Bar ── */}
            <footer className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{mode.getTotalSamples()} pictures</span>
                    <span className="text-slate-200">|</span>
                    <span>{mode.project?.classes.length || 0} types</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${mode.project?.modelTrained ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-slate-400">{mode.project?.modelTrained ? 'Model ready' : 'No model'}</span>
                </div>
            </footer>
        </div>
    )
}
