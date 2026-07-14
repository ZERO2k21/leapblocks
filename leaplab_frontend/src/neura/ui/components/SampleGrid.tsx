import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { Sample } from '../../types/neura.types'

interface SampleGridProps {
    samples: Sample[]
    type: 'image' | 'audio' | 'text' | 'keypoints'
    onRemove: (sampleId: string) => void
    onUndo?: (sample: Sample) => void
}

const TYPE_EMOJI: Record<string, string> = {
    image: '🖼️',
    audio: '🎵',
    text: '📝',
    keypoints: '🤸'
}

const TYPE_COLORS: Record<string, string> = {
    image: 'from-[#eaedff] to-[#faf8ff]',
    audio: 'from-[#d1fae5] to-[#ecfdf5]',
    text: 'from-[#dbeafe] to-[#eff6ff]',
    keypoints: 'from-[#fef3c7] to-[#fffbeb]'
}

export default function SampleGrid({ samples, type, onRemove, onUndo }: SampleGridProps) {
    const [deletedSample, setDeletedSample] = useState<{ sample: Sample; classId?: string } | null>(null)
    const undoTimerRef = useRef<NodeJS.Timeout | null>(null)

    const handleRemove = useCallback((sample: Sample) => {
        setDeletedSample({ sample })
        onRemove(sample.id)

        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        undoTimerRef.current = setTimeout(() => {
            setDeletedSample(null)
        }, 3000)
    }, [onRemove])

    const handleUndo = useCallback(() => {
        if (deletedSample && onUndo) {
            onUndo(deletedSample.sample)
            setDeletedSample(null)
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        }
    }, [deletedSample, onUndo])

    useEffect(() => {
        return () => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        }
    }, [])

    if (samples.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 bg-[#faf8ff]/50 rounded-2xl border-2 border-dashed border-[#ccc3d8]/50">
                <span className="text-3xl mb-2">{TYPE_EMOJI[type]}</span>
                <p className="text-sm font-bold text-[#7b7487]">No samples yet</p>
                <p className="text-[11px] text-[#7b7487]/60 mt-1">Capture some to teach your AI! 🚀</p>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-72 overflow-y-auto neura-scrollbar p-1 rounded-2xl bg-[#faf8ff]/30">
                {samples.map((sample, index) => (
                    <div
                        key={sample.id}
                        className="relative group aspect-square rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md border border-[#dae2fd] animate-fade-in transition-all duration-200"
                    >
                        {type === 'image' && (
                            <img
                                src={sample.data}
                                alt={`Sample ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        )}
                        {type === 'audio' && (
                            <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${TYPE_COLORS[type]}`}>
                                <span className="text-2xl mb-1">🎵</span>
                                <span className="text-[8px] text-[#4a4455] font-medium">Audio</span>
                            </div>
                        )}
                        {type === 'text' && (
                            <div className={`w-full h-full flex items-center justify-center p-2 bg-gradient-to-br ${TYPE_COLORS[type]}`}>
                                <p className="text-[9px] text-[#4a4455] text-center line-clamp-4 leading-tight">{sample.data}</p>
                            </div>
                        )}
                        {type === 'keypoints' && (
                            <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${TYPE_COLORS[type]}`}>
                                <span className="text-2xl mb-1">🤸</span>
                                <span className="text-[8px] text-[#4a4455] font-medium">Pose</span>
                            </div>
                        )}

                        {/* Remove button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRemove(sample)
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-[#ba1a1a] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-md text-[10px]"
                        >
                            ✕
                        </button>

                        {/* Sample number */}
                        <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            {index + 1}
                        </div>
                    </div>
                ))}
            </div>

            {/* Undo toast */}
            {deletedSample && onUndo && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                    <div className="flex items-center gap-3 px-5 py-3 bg-[#131b2e]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10">
                        <span className="text-lg">🗑️</span>
                        <span className="text-sm font-medium">Sample deleted</span>
                        <button
                            onClick={handleUndo}
                            className="px-3 py-1.5 bg-[#630ed4] hover:bg-[#7c3aed] rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            ↩️ Undo
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
