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
        <div className="h-screen flex flex-col" style={{
            background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0f4ff 100%)'
        }}>
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
                <div className="w-80 bg-white border-r border-gray-100 flex flex-col shadow-sm animate-[slide-down_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                    {/* Sidebar header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-1.5">
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Classes</h2>
                            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                                {mode.project?.classes.length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-medium">
                                {totalSamples} total samples
                            </p>
                            <button
                                onClick={() => setShowAddClass(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Class list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {showAddClass && (
                            <div className="flex gap-2 animate-[slideUp_0.2s_ease-out]">
                                <input
                                    autoFocus
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddClass()
                                        if (e.key === 'Escape') setShowAddClass(false)
                                    }}
                                    placeholder="Enter class name..."
                                    className="flex-1 px-4 py-2.5 text-sm border-2 border-violet-200 rounded-xl focus:outline-none focus:border-violet-400 bg-white transition-colors"
                                />
                                <button
                                    onClick={handleAddClass}
                                    className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </button>
                            </div>
                        )}

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

                        {mode.project && mode.project.classes.length === 0 && (
                            <div className="flex flex-col items-center py-12 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center mb-4">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8M8 12h8" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-gray-600 mb-1">No classes yet</p>
                                <p className="text-xs text-gray-400">Click "Add" to create your first class</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar footer stats */}
                    {mode.project && mode.project.classes.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">
                                    {mode.project.classes.length} classes
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-gray-600 font-semibold">
                                        {totalSamples} samples
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
                    <div key={mode.mode} className="animate-[fade-in_0.3s_ease-out]">
                        {children({ mode })}
                    </div>
                </div>
            </div>
        </div>
    )
}
