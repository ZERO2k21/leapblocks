import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { Sample } from '../../../../types/neura.types'

interface SampleGridProps {
    samples: Sample[]
    type: 'image' | 'audio' | 'text' | 'keypoints'
    onRemove: (sampleId: string) => void
    onUndo?: (sample: Sample) => void
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
            <div className="flex flex-col items-center justify-center py-10 text-gray-300 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-sm font-semibold text-gray-400">No samples yet</p>
                <p className="text-xs text-gray-300 mt-1">Capture some to get started!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-72 overflow-y-auto neura-scrollbar p-1 rounded-2xl bg-gray-50/30">
            {samples.map((sample, index) => (
                <div
                    key={sample.id}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-gray-100 animate-[stagger-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both] transition-all duration-200"
                    style={{ animationDelay: `${index * 30}ms` }}
                >
                    {type === 'image' && (
                        <img
                            src={sample.data}
                            alt={`Sample ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    )}
                    {type === 'audio' && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-blue-50">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                            </svg>
                            <span className="text-[9px] text-gray-400 font-medium">Audio</span>
                        </div>
                    )}
                    {type === 'text' && (
                        <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-blue-50 to-emerald-50">
                            <p className="text-[10px] text-gray-500 text-center line-clamp-4 leading-tight">{sample.data}</p>
                        </div>
                    )}
                    {type === 'keypoints' && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                                <circle cx="12" cy="5" r="3" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                                <line x1="12" y1="16" x2="8" y2="22" />
                                <line x1="12" y1="16" x2="16" y2="22" />
                            </svg>
                            <span className="text-[9px] text-gray-400 font-medium">Pose</span>
                        </div>
                    )}

                    {/* Remove button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleRemove(sample)
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                        style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Sample number badge */}
                    <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {index + 1}
                    </div>
                </div>
            ))}

            {/* Undo toast */}
            {deletedSample && onUndo && (
                <div className="col-span-full fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[toast-enter_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
                    <div className="flex items-center gap-3 px-5 py-3 bg-gray-800/95 backdrop-blur-md text-white rounded-2xl shadow-2xl" style={{
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
                    }}>
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium">Sample deleted</span>
                        <button
                            onClick={handleUndo}
                            className="px-3 py-1.5 bg-violet-500 hover:bg-violet-400 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
