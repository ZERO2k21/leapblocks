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

function ModeSwitcher({ mode, onModeChange, canTrain }: { mode: ClassifierMode; onModeChange: (m: ClassifierMode) => void; canTrain: boolean }) {
    const modes = [
        { id: 'collect' as const, label: 'Collect', icon: 'M12 8v8M8 12h8' },
        { id: 'train' as const, label: 'Train', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
        { id: 'test' as const, label: 'Test', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' }
    ]

    return (
        <div className="relative flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
            {modes.map((m, idx) => {
                const isActive = mode === m.id
                const isDisabled = m.id === 'train' && !canTrain
                return (
                    <button
                        key={m.id}
                        onClick={() => !isDisabled && onModeChange(m.id)}
                        disabled={isDisabled}
                        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 z-10 ${
                            isActive
                                ? 'text-[#0b1b42]'
                                : isDisabled
                                    ? 'text-white/30 cursor-not-allowed'
                                    : 'text-white/70 hover:text-white'
                        }`}
                    >
                        {isActive && (
                            <div className="absolute inset-0 bg-white rounded-lg shadow-md transition-all duration-300" style={{
                                animation: 'scale-in 0.2s cubic-bezier(0.34,1.56,0.64,1)'
                            }} />
                        )}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                            <path d={m.icon} />
                        </svg>
                        <span className="relative z-10">{m.label}</span>
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
                onNew={mode.resetProject}
                onDownload={handleDownload}
                onOpen={handleImport}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onTitleChange={() => {}}
                brandName="NEURA"
                rightContent={
                    <ModeSwitcher
                        mode={mode.mode}
                        onModeChange={mode.setMode}
                        canTrain={canTrain}
                    />
                }
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-surface border-r border-outline-variant flex flex-col py-4 z-40 animate-[slide-down_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                    {/* Classes Header */}
                    <div className="px-4 mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <div>
                                <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Classes</h2>
                                <p className="text-xs text-on-surface-variant">{totalSamples} total samples</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddClass(true)}
                            className="w-full mt-3 bg-primary text-on-primary py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold shadow-lg hover:opacity-90 active:translate-x-0.5 transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Class
                        </button>
                    </div>

                    {/* Add class input */}
                    {showAddClass && (
                        <div className="px-4 mb-3 flex gap-2 animate-[slideUp_0.2s_ease-out]">
                            <input
                                autoFocus
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddClass()
                                    if (e.key === 'Escape') setShowAddClass(false)
                                }}
                                placeholder="Enter class name..."
                                className="flex-1 px-3 py-2 text-sm border-2 border-primary/30 rounded-xl focus:outline-none focus:border-primary bg-white transition-colors"
                            />
                            <button
                                onClick={handleAddClass}
                                className="px-3 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Class list */}
                    <div className="flex-1 overflow-y-auto px-3 space-y-2">
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
                            <div className="flex flex-col items-center py-12 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8M8 12h8" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-on-surface mb-1">No classes yet</p>
                                <p className="text-xs text-on-surface-variant">Click "Add Class" to start</p>
                            </div>
                        )}
                    </div>

                    {/* Workflow Navigation */}
                    <nav className="px-3 mb-4 space-y-1">
                        <div
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                                mode.mode === 'collect'
                                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                                    : 'text-on-surface-variant hover:bg-surface-container-low cursor-pointer'
                            }`}
                            onClick={() => mode.setMode('collect')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span className="text-sm">Collect</span>
                        </div>
                        <div
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors opacity-60 cursor-not-allowed ${
                                mode.mode === 'train'
                                    ? 'bg-primary text-on-primary font-bold'
                                    : 'text-on-surface-variant hover:bg-surface-container-low'
                            }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                            <span className="text-sm">Train</span>
                        </div>
                        <div
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors opacity-60 cursor-not-allowed ${
                                mode.mode === 'test'
                                    ? 'bg-primary text-on-primary font-bold'
                                    : 'text-on-surface-variant hover:bg-surface-container-low'
                            }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                            </svg>
                            <span className="text-sm">Test</span>
                        </div>
                    </nav>

                    {/* Sidebar footer */}
                    <div className="px-3 pt-3 border-t border-outline-variant space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant cursor-pointer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                            </svg>
                            <span className="text-sm">Settings</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant cursor-pointer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span className="text-sm">Help</span>
                        </div>
                    </div>
                </aside>

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto bg-background">
                    <div key={mode.mode} className="animate-[fade-in_0.3s_ease-out]">
                        {children({ mode })}
                    </div>
                </main>
            </div>
        </div>
    )
}
