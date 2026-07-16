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

function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                    background: 'rgba(250,248,255,0.5)',
                    borderRadius: '12px',
                    border: '2px dashed rgba(204,195,216,0.4)',
                }}
            >
                <span style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{TYPE_EMOJI[type]}</span>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#7b7487' }}>No samples yet</p>
                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>Capture some to teach your AI!</p>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                }}
            >
                {samples.map((sample, index) => (
                    <div
                        key={sample.id}
                        style={{
                            position: 'relative',
                            aspectRatio: '1/1',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            cursor: 'default',
                            transition: 'all 0.15s ease',
                        }}
                        className="group"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                            e.currentTarget.style.transform = 'scale(1.02)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    >
                        {type === 'image' && (
                            <img
                                src={sample.data}
                                alt={`Sample ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        )}
                        {type === 'audio' && (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🎵</span>
                            </div>
                        )}
                        {type === 'text' && (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px',
                                background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                            }}>
                                <p style={{ fontSize: '8px', color: '#4b5563', textAlign: 'center', overflow: 'hidden' }}>
                                    {sample.data.slice(0, 50)}
                                </p>
                            </div>
                        )}
                        {type === 'keypoints' && (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🤸</span>
                            </div>
                        )}

                        {/* Delete button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRemove(sample)
                            }}
                            style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
                                zIndex: 10,
                            }}
                            className="opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150"
                        >
                            ✕
                        </button>

                        {/* Time badge */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '3px',
                                left: '3px',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                background: 'rgba(0,0,0,0.55)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 10,
                            }}
                            className="opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150"
                        >
                            <span style={{ color: '#fff', fontSize: '8px', fontWeight: 600 }}>
                                {formatTime(sample.timestamp)}
                            </span>
                        </div>

                        {/* Index number */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '3px',
                                left: '3px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '4px',
                                background: 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span style={{ color: '#fff', fontSize: '8px', fontWeight: 700 }}>
                                {index + 1}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Undo toast */}
            {deletedSample && onUndo && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 50,
                }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            background: 'rgba(19,27,46,0.95)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>🗑️</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Deleted</span>
                        <button
                            onClick={handleUndo}
                            style={{
                                padding: '5px 10px',
                                background: '#630ed4',
                                color: '#fff',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            ↩️ Undo
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
