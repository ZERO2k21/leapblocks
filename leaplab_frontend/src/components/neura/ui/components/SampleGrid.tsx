import React from 'react'
import type { Sample } from '../../../types/neura.types'

interface SampleGridProps {
    samples: Sample[]
    type: 'image' | 'audio' | 'text' | 'keypoints'
    onRemove: (sampleId: string) => void
}

export default function SampleGrid({ samples, type, onRemove }: SampleGridProps) {
    if (samples.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl" style={{
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(12px)',
                border: '2px dashed rgba(124,58,237,0.15)'
            }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{
                    background: 'rgba(124,58,237,0.06)'
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
                <p className="text-sm font-bold text-gray-400">No samples yet</p>
                <p className="text-xs text-gray-300 mt-1">Capture some samples to get started!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-2 rounded-2xl" style={{
            background: 'rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.5)'
        }}>
            {samples.map((sample, index) => (
                <div
                    key={sample.id}
                    className="relative group aspect-square rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{
                        background: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        animationDelay: `${index * 30}ms`
                    }}
                >
                    {type === 'image' && (
                        <img
                            src={sample.data}
                            alt="Sample"
                            className="w-full h-full object-cover"
                        />
                    )}
                    {type === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center" style={{
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(59,130,246,0.1))'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                            </svg>
                        </div>
                    )}
                    {type === 'text' && (
                        <div className="w-full h-full flex items-center justify-center p-2" style={{
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))'
                        }}>
                            <p className="text-xs text-gray-600 text-center line-clamp-3 font-medium">{sample.data}</p>
                        </div>
                    )}
                    {type === 'keypoints' && (
                        <div className="w-full h-full flex items-center justify-center" style={{
                            background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(236,72,153,0.1))'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="5" r="3" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                                <line x1="12" y1="16" x2="8" y2="22" />
                                <line x1="12" y1="16" x2="16" y2="22" />
                            </svg>
                        </div>
                    )}

                    {/* Delete button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove(sample.id)
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                        style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    )
}
