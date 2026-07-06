import React, { useState } from 'react'
import { IgniteTopbar } from '../../../Electra/Client/Src/components/Layout/Topbar'
import type { ProjectType } from '../../../types/neura.types'
import type { ClassifierMode } from '../hooks/useNeuraProject'
import { useNeuraProject } from '../hooks/useNeuraProject'
import ClassCard from './components/ClassCard'

interface ProjectWorkspaceProps {
    type: ProjectType
    onBack: () => void
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
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
            {modes.map((m) => {
                const isActive = mode === m.id
                const isDisabled = m.id === 'train' && !canTrain
                return (
                    <button
                        key={m.id}
                        onClick={() => !isDisabled && onModeChange(m.id)}
                        disabled={isDisabled}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            isActive
                                ? 'bg-white text-[#0b1b42] shadow-md'
                                : isDisabled
                                    ? 'text-white/30 cursor-not-allowed'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={m.icon} />
                        </svg>
                        {m.label}
                    </button>
                )
            })}
        </div>
    )
}

export default function ProjectWorkspace({ type, onBack, children }: ProjectWorkspaceProps) {
    const mode = useNeuraProject(type)
    const [newClassName, setNewClassName] = useState('')
    const [showAddClass, setShowAddClass] = useState(false)

    const canTrain = mode.project
        ? mode.project.classes.some(c => c.samples.length > 0) && mode.project.classes.length >= 2
        : false

    const handleAddClass = () => {
        if (newClassName.trim()) {
            mode.addClass(newClassName.trim())
            setNewClassName('')
            setShowAddClass(false)
        }
    }

    const totalSamples = mode.getTotalSamples()

    return (
        <div className="h-screen flex flex-col" style={{
            background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0f4ff 100%)'
        }}>
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
                    />
                }
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-white border-r border-gray-100 flex flex-col shadow-sm">
                    {/* Sidebar header */}
                    <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Classes</h2>
                            <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">
                                {mode.project?.classes.length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-gray-400">
                                {totalSamples} total samples
                            </p>
                            <button
                                onClick={() => setShowAddClass(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-lg text-[11px] font-bold hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 hover:scale-105 active:scale-95"
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

                        {mode.project?.classes.map((classData) => (
                            <ClassCard
                                key={classData.id}
                                classData={classData}
                                isSelected={classData.id === mode.selectedClassId}
                                onSelect={() => mode.setSelectedClassId(classData.id)}
                                onRemove={() => mode.removeClass(classData.id)}
                                onRename={(name) => mode.renameClass(classData.id, name)}
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
                        <div className="px-5 py-3 border-t border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-400 font-medium">
                                    {mode.project.classes.length} classes
                                </span>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-gray-500 font-semibold">
                                        {totalSamples} samples
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
                    {children({ mode })}
                </div>
            </div>
        </div>
    )
}
