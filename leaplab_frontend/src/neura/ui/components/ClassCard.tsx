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
    const stars = Math.min(5, Math.ceil(sampleCount / 3))
    const emoji = EMOJI_LIST[index % EMOJI_LIST.length]

    return (
        <div
            onClick={onSelect}
            className={`group flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 animate-fade-in ${
                isSelected
                    ? 'bg-[#eaedff] border-l-4 border-[#630ed4] shadow-sm'
                    : 'border-l-4 border-transparent hover:bg-[#f2f3ff]'
            }`}
        >
            {/* Class avatar with emoji */}
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 transition-all duration-200 shadow-sm"
                style={{
                    backgroundColor: isSelected ? classData.color : '#dae2fd',
                    color: isSelected ? '#ffffff' : '#630ed4'
                }}
            >
                {emoji}
            </div>

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
                            className="w-full text-sm font-bold text-[#131b2e] bg-white rounded-lg px-2 py-1 border border-[#630ed4]/30 focus:outline-none focus:border-[#630ed4]"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className="text-sm font-bold text-[#131b2e] truncate"
                            onDoubleClick={(e) => {
                                e.stopPropagation()
                                setIsEditing(true)
                            }}
                        >
                            {classData.name}
                        </span>
                    )}
                    {sampleCount > 0 && (
                        <span className="text-[10px] bg-[#eaedff] text-[#630ed4] px-2 py-0.5 rounded-full font-bold ml-1">
                            {sampleCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-[8px] ${i < stars ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
                        ))}
                    </div>
                    <span className="text-[9px] text-[#4a4455] ml-1">{sampleCount} sample{sampleCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#ccc3d8]/30 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%`, backgroundColor: classData.color }}
                    />
                </div>
            </div>

            {/* Remove button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#ccc3d8] hover:text-[#ba1a1a] hover:bg-[#ffdad6] opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm"
            >
                🗑️
            </button>
        </div>
    )
}
