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
            className={`relative flex flex-col items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                isSelected
                    ? 'bg-white shadow-lg shadow-violet-200/50 ring-2 ring-violet-400 scale-105'
                    : 'bg-white/60 hover:bg-white hover:shadow-md hover:scale-102'
            }`}
        >
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg transition-transform duration-300 hover:scale-110"
                style={{ backgroundColor: classData.color }}
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
                    className="w-full text-center text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <p
                    className="text-sm font-semibold text-gray-700 text-center truncate w-full"
                    onDoubleClick={(e) => {
                        e.stopPropagation()
                        setIsEditing(true)
                    }}
                >
                    {classData.name}
                </p>
            )}

            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold text-violet-500">{classData.samples.length}</span>
                <span className="text-xs text-gray-400">samples</span>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-md"
                style={{ opacity: 1 }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}
