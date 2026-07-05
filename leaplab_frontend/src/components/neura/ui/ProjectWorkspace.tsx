import React, { useState } from 'react'
import type { ProjectType } from '../../../types/neura.types'
import { useNeuraProject } from '../hooks/useNeuraProject'
import TopBar from './components/TopBar'
import ClassCard from './components/ClassCard'

interface ProjectWorkspaceProps {
    type: ProjectType
    onBack: () => void
    children: (props: {
        mode: ReturnType<typeof useNeuraProject>
    }) => React.ReactNode
}

export default function ProjectWorkspace({ type, onBack, children }: ProjectWorkspaceProps) {
    const mode = useNeuraProject(type)
    const [newClassName, setNewClassName] = useState('')
    const [showAddClass, setShowAddClass] = useState(false)

    const handleAddClass = () => {
        if (newClassName.trim()) {
            mode.addClass(newClassName.trim())
            setNewClassName('')
            setShowAddClass(false)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <TopBar
                title={mode.project?.name || 'Classifier'}
                mode={mode.mode}
                onModeChange={mode.setMode}
                onBack={onBack}
                totalSamples={mode.getTotalSamples()}
                canTrain={mode.project ? mode.project.classes.some(c => c.samples.length > 0) && mode.project.classes.length >= 2 : false}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Left sidebar: Classes */}
                <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Classes</h2>
                            <button
                                onClick={() => setShowAddClass(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {showAddClass && (
                            <div className="flex gap-2 animate-fade-in">
                                <input
                                    autoFocus
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddClass()
                                        if (e.key === 'Escape') setShowAddClass(false)
                                    }}
                                    placeholder="Class name..."
                                    className="flex-1 px-3 py-2 text-sm border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                                />
                                <button
                                    onClick={handleAddClass}
                                    className="px-3 py-2 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors"
                                >
                                    ✓
                                </button>
                            </div>
                        )}

                        {mode.project?.classes.map((classData) => (
                            <div key={classData.id} className="group">
                                <ClassCard
                                    classData={classData}
                                    isSelected={classData.id === mode.selectedClassId}
                                    onSelect={() => mode.setSelectedClassId(classData.id)}
                                    onRemove={() => mode.removeClass(classData.id)}
                                    onRename={(name) => mode.renameClass(classData.id, name)}
                                />
                                {classData.id === mode.selectedClassId && mode.mode === 'collect' && (
                                    <div className="mt-2 ml-2 text-xs text-gray-400">
                                        {classData.samples.length} samples
                                    </div>
                                )}
                            </div>
                        ))}

                        {mode.project && mode.project.classes.length === 0 && (
                            <div className="flex flex-col items-center py-8 text-gray-300">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v8M8 12h8" />
                                </svg>
                                <p className="text-sm font-medium text-gray-400">No classes yet</p>
                                <p className="text-xs text-gray-300">Add classes to start</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-y-auto">
                    {children({ mode })}
                </div>
            </div>
        </div>
    )
}
