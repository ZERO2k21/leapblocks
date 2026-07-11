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
    const progressPercent = Math.min(100, (sampleCount / 15) * 100)

    return (
        <div
            onClick={onSelect}
            className={`group flex items-center gap-sm p-sm rounded-r-xl cursor-pointer transition-all duration-200 animate-[stagger-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both] ${
                isSelected
                    ? 'class-item-active bg-primary/10'
                    : 'hover:bg-surface-container-low'
            }`}
            style={{
                animationDelay: `${index * 60}ms`,
                borderLeft: isSelected ? '4px solid #7c3aed' : '4px solid transparent'
            }}
        >
            {/* Class avatar */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 transition-all duration-200"
                style={{
                    backgroundColor: isSelected ? classData.color : '#dae2fd',
                    color: isSelected ? '#ffffff' : '#630ed4'
                }}
            >
                {classData.name.charAt(0).toUpperCase()}
            </div>

            {/* Class info */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
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
                            className="w-full text-sm font-semibold text-on-surface bg-white rounded-lg px-2 py-1 border border-outline-variant focus:outline-none focus:border-primary"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className="font-label-md text-label-md text-on-surface truncate"
                            onDoubleClick={(e) => {
                                e.stopPropagation()
                                setIsEditing(true)
                            }}
                        >
                            {classData.name}
                        </span>
                    )}
                    {sampleCount > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-full font-bold">
                            {sampleCount}
                        </span>
                    )}
                </div>

                {/* Sample count with dot */}
                <div className="flex items-center gap-1 mt-0.5">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isSelected ? classData.color : '#dae2fd' }}
                    />
                    <p className="text-[10px] text-on-surface-variant">
                        {sampleCount} {sampleCount === 1 ? 'sample' : 'samples'}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-outline-variant h-1 rounded-full mt-1 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundColor: '#7c3aed'
                        }}
                    />
                </div>

                {/* Hint text */}
                <p className="text-[9px] text-outline mt-0.5">Aim for 10-15</p>
            </div>

            {/* Remove button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-outline-variant hover:text-error hover:bg-error-container/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}
