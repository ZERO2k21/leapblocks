import React, { useState } from 'react'
import type { ClassData } from '../../../../types/neura.types'

interface ClassCardProps {
    classData: ClassData
    isSelected: boolean
    onSelect: () => void
    onRemove: () => void
    onRename: (name: string) => void
    index?: number
}

export default function ClassCard({ classData, isSelected, onSelect, onRemove, onRename, index = 0 }: ClassCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(classData.name)

    const handleRename = () => {
        if (editName.trim()) {
            onRename(editName.trim())
        }
        setIsEditing(false)
    }

    const sampleCount = classData.samples.length

    return (
        <div
            onClick={onSelect}
            className={`relative group cursor-pointer rounded-2xl p-4 transition-all duration-300 animate-[stagger-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both] ${
                isSelected
                    ? 'bg-white scale-[1.02]'
                    : 'bg-white/60 hover:bg-white hover:shadow-lg hover:scale-[1.01]'
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
                    ? `0 8px 32px ${classData.color}25, 0 0 0 1px ${classData.color}15, inset 0 1px 0 rgba(255,255,255,0.8)`
                    : '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                animationDelay: `${index * 60}ms`
            }}
        >
            {/* Color indicator bar */}
            <div
                className="absolute top-0 left-3 right-3 h-1 rounded-b-full transition-all duration-300"
                style={{
                    backgroundColor: classData.color,
                    opacity: isSelected ? 1 : 0.4,
                    transform: isSelected ? 'scaleY(1.5)' : 'scaleY(1)'
                }}
            />

            <div className="flex items-center gap-3 mt-1">
                {/* Class avatar */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                        backgroundColor: classData.color,
                        boxShadow: isSelected ? `0 8px 20px ${classData.color}40` : `0 4px 10px ${classData.color}20`
                    }}
                >
                    {classData.name.charAt(0).toUpperCase()}
                </div>

                {/* Class info */}
                <div className="flex-1 min-w-0">
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
                            className="w-full text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <p
                            className="text-sm font-bold text-gray-800 truncate"
                            onDoubleClick={(e) => {
                                e.stopPropagation()
                                setIsEditing(true)
                            }}
                        >
                            {classData.name}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-1">
                            <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: classData.color }}
                            />
                            <span className="text-xs text-gray-500 font-medium">
                                {sampleCount} {sampleCount === 1 ? 'sample' : 'samples'}
                            </span>
                        </div>
                    </div>
                    {/* Sample quality progress bar */}
                    <div className="mt-2">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${Math.min(100, (sampleCount / 15) * 100)}%`,
                                    background: sampleCount >= 10
                                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                                        : sampleCount >= 5
                                            ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                                            : 'linear-gradient(90deg, #EF4444, #F87171)',
                                    boxShadow: sampleCount >= 10
                                        ? '0 0 8px rgba(16,185,129,0.4)'
                                        : sampleCount >= 5
                                            ? '0 0 8px rgba(245,158,11,0.4)'
                                            : '0 0 8px rgba(239,68,68,0.4)'
                                }}
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium">
                            {sampleCount >= 10 ? 'Great samples!' : sampleCount >= 5 ? 'Good, add more for better results' : `Aim for 10-15 samples`}
                        </p>
                    </div>
                </div>

                {/* Remove button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Sample count badge */}
            {sampleCount > 0 && (
                <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: classData.color }}
                >
                    {sampleCount}
                </div>
            )}
        </div>
    )
}
