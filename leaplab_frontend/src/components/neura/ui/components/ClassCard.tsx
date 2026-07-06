import React, { useState } from 'react'
import type { ClassData } from '../../../types/neura.types'

interface ClassCardProps {
    classData: ClassData
    isSelected: boolean
    onSelect: () => void
    onRemove: () => void
    onRename: (name: string) => void
}

export default function ClassCard({ classData, isSelected, onSelect, onRemove, onRename }: ClassCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(classData.name)

    const handleRename = () => {
        if (editName.trim()) {
            onRename(editName.trim())
        }
        setIsEditing(false)
    }

    return (
        <div
            onClick={onSelect}
            className={`relative flex flex-col items-center p-5 rounded-2xl cursor-pointer transition-all duration-400 ${
                isSelected
                    ? 'scale-[1.03]'
                    : 'hover:scale-[1.01]'
            }`}
            style={{
                background: isSelected
                    ? 'rgba(255,255,255,0.8)'
                    : 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isSelected
                    ? `2px solid ${classData.color}60`
                    : '1px solid rgba(255,255,255,0.5)',
                boxShadow: isSelected
                    ? `0 8px 32px ${classData.color}20, inset 0 1px 0 rgba(255,255,255,0.8)`
                    : '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)'
            }}
        >
            {/* Color circle with gradient */}
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-3 transition-all duration-300"
                style={{
                    background: `linear-gradient(135deg, ${classData.color}CC, ${classData.color})`,
                    boxShadow: `0 6px 20px ${classData.color}40, inset 0 2px 0 rgba(255,255,255,0.25)`
                }}
            >
                {classData.name.charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
                <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    className="w-full text-center text-sm font-bold text-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                    style={{
                        background: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(124,58,237,0.3)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <p
                    className="text-sm font-bold text-gray-700 text-center truncate w-full"
                    onDoubleClick={(e) => {
                        e.stopPropagation()
                        setIsEditing(true)
                    }}
                >
                    {classData.name}
                </p>
            )}

            {/* Sample count badge */}
            <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full" style={{
                background: `${classData.color}12`,
                border: `1px solid ${classData.color}25`
            }}>
                <span className="text-xs font-black" style={{ color: classData.color }}>{classData.samples.length}</span>
                <span className="text-xs text-gray-400 font-medium">samples</span>
            </div>

            {/* Delete button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                style={{
                    boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                    opacity: 1
                }}
            >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}
