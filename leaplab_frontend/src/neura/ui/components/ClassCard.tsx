import React, { useState } from 'react'
import type { ClassData } from '../../types/neura.types'

interface ClassCardProps {
    classData: ClassData
    isSelected: boolean
    onSelect: () => void
    onRemove: () => void
    onRename: (name: string) => void
    index?: number
}

const EMOJI_LIST = ['🌟', '⭐', '💫', '✨', '🎯', '🏆', '🎪', '🌈', '🦋', '🌸']

export default function ClassCard({ classData, isSelected, onSelect, onRemove, onRename, index = 0 }: ClassCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(classData.name)

    const handleRename = () => {
        if (editName.trim()) onRename(editName.trim())
        setIsEditing(false)
    }

    const sampleCount = classData.samples.length
    const progressPercent = Math.min(100, (sampleCount / 15) * 100)
    const emoji = EMOJI_LIST[index % EMOJI_LIST.length]

    return (
        <div
            onClick={onSelect}
            className="group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200"
            style={{
                background: isSelected ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)' : 'transparent',
                borderLeft: `3px solid ${isSelected ? '#7c3aed' : 'transparent'}`,
                boxShadow: isSelected ? '0 1px 4px rgba(124,58,237,0.1)' : 'none',
            }}
        >
            {/* Class icon */}
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-all duration-200"
                style={{
                    background: isSelected
                        ? `linear-gradient(135deg, ${classData.color}, ${classData.color}dd)`
                        : '#f1f0f5',
                    color: isSelected ? '#fff' : '#7c3aed',
                    boxShadow: isSelected ? `0 2px 8px ${classData.color}40` : 'none',
                }}
            >
                {emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename()
                                if (e.key === 'Escape') setIsEditing(false)
                            }}
                            className="flex-1 text-[13px] font-bold text-[#1e1b4b] bg-white rounded-lg px-2 py-1 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className="text-[13px] font-bold text-[#1e1b4b] truncate"
                            onDoubleClick={(e) => {
                                e.stopPropagation()
                                setIsEditing(true)
                            }}
                        >
                            {classData.name}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                    {/* Sample count pill */}
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                            background: sampleCount > 0 ? '#ede9fe' : '#f5f5f5',
                            color: sampleCount > 0 ? '#7c3aed' : '#9ca3af',
                        }}
                    >
                        {sampleCount} {sampleCount === 1 ? 'sample' : 'samples'}
                    </span>

                    {/* Progress bar */}
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${progressPercent}%`,
                                background: `linear-gradient(90deg, ${classData.color}, ${classData.color}cc)`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Delete button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                style={{
                    color: '#d1d5db',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626'
                    e.currentTarget.style.background = '#fef2f2'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#d1d5db'
                    e.currentTarget.style.background = 'transparent'
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
            </button>
        </div>
    )
}
