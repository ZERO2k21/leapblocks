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
    return (
        <div className="flex items-center gap-2 rounded-2xl p-1.5" style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.25)'
        }}>
            <button
                onClick={() => onModeChange('collect')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                style={mode === 'collect' ? {
                    background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                } : {
                    color: 'rgba(255,255,255,0.7)'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                </svg>
                Collect
            </button>
            <button
                onClick={() => canTrain && onModeChange('train')}
                disabled={!canTrain}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                style={mode === 'train' ? {
                    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                } : canTrain ? {
                    color: 'rgba(255,255,255,0.7)'
                } : {
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'not-allowed'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
                Train
            </button>
            <button
                onClick={() => onModeChange('test')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                style={mode === 'test' ? {
                    background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                } : {
                    color: 'rgba(255,255,255,0.7)'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Test
            </button>
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleSave = React.useCallback(() => {}, [])
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleTitleChange = React.useCallback(() => {}, [])

    const handleAddClass = () => {
        if (newClassName.trim()) {
            mode.addClass(newClassName.trim())
            setNewClassName('')
            setShowAddClass(false)
        }
    }

    return (
        <div className="h-screen flex flex-col" style={{
            background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0f4ff 100%)'
        }}>
            <IgniteTopbar
                title={mode.project?.name || 'Classifier'}
                onBack={onBack}
                onSave={handleSave}
                onTitleChange={handleTitleChange}
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
                {/* Left sidebar: Classes */}
                <div className="w-72 flex flex-col relative" style={{
                    background: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderRight: '1px solid rgba(255,255,255,0.6)'
                }}>
                    <div className="px-4 py-4" style={{
                        borderBottom: '1px solid rgba(139,92,246,0.1)'
                    }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Classes</h2>
                                <div className="w-8 h-0.5 mt-1 rounded-full" style={{
                                    background: 'linear-gradient(90deg, #7C3AED, #A855F7)'
                                }} />
                            </div>
                            <button
                                onClick={() => setShowAddClass(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                                style={{
                                    background: 'rgba(124,58,237,0.1)',
                                    color: '#7C3AED',
                                    border: '1px solid rgba(124,58,237,0.2)'
                                }}
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
                                    className="flex-1 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.7)',
                                        border: '1px solid rgba(124,58,237,0.3)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                />
                                <button
                                    onClick={handleAddClass}
                                    className="px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300"
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
                                    <div className="mt-2 ml-2 text-xs text-gray-400 font-medium">
                                        {classData.samples.length} samples
                                    </div>
                                )}
                            </div>
                        ))}

                        {mode.project && mode.project.classes.length === 0 && (
                            <div className="flex flex-col items-center py-12 text-gray-300">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
                                    background: 'rgba(124,58,237,0.05)',
                                    border: '2px dashed rgba(124,58,237,0.15)'
                                }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8M8 12h8" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-gray-400">No classes yet</p>
                                <p className="text-xs text-gray-300 mt-1">Add classes to start training</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-y-auto" style={{
                    background: 'linear-gradient(180deg, rgba(248,247,255,0.5) 0%, rgba(255,255,255,0.3) 100%)'
                }}>
                    {children({ mode })}
                </div>
            </div>
        </div>
    )
}
