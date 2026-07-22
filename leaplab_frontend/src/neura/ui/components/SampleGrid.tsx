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

// Hand landmark connections for skeleton visualization
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17], // Palm
]

// Pose landmark connections for body skeleton
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Right arm
    [0, 5], [5, 6], [6, 7], [7, 8], // Left arm
    [0, 9], [9, 10], [10, 11], [11, 12], // Right leg
    [0, 13], [13, 14], [14, 15], [15, 16], // Left leg
    [0, 17], [17, 18], [18, 19], [19, 20], // Torso
]

function KeypointSkeleton({ data }: { data: string }) {
    try {
        const keypoints = JSON.parse(data)
        if (!Array.isArray(keypoints) || keypoints.length < 5) {
            return <span style={{ fontSize: '1.25rem' }}>🤸</span>
        }

        const isHand = keypoints.length === 21 || keypoints.length === 78
        const connections = isHand ? HAND_CONNECTIONS : POSE_CONNECTIONS

        // Normalize keypoints to 0-1 range
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const kp of keypoints) {
            const x = kp.x ?? kp[0] ?? 0
            const y = kp.y ?? kp[1] ?? 0
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
        const rangeX = maxX - minX || 1
        const rangeY = maxY - minY || 1

        const normalizedKps = keypoints.map((kp) => {
            const x = kp.x ?? kp[0] ?? 0
            const y = kp.y ?? kp[1] ?? 0
            return {
                x: ((x - minX) / rangeX) * 80 + 10,
                y: ((y - minY) / rangeY) * 80 + 10,
            }
        })

        return (
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', padding: '4px' }}>
                {/* Draw connections */}
                {connections.map(([i, j], idx) => {
                    if (i >= normalizedKps.length || j >= normalizedKps.length) return null
                    const kp1 = normalizedKps[i]
                    const kp2 = normalizedKps[j]
                    return (
                        <line
                            key={idx}
                            x1={kp1.x}
                            y1={kp1.y}
                            x2={kp2.x}
                            y2={kp2.y}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    )
                })}
                {/* Draw keypoints */}
                {normalizedKps.map((kp, idx) => (
                    <circle
                        key={idx}
                        cx={kp.x}
                        cy={kp.y}
                        r="2"
                        fill="#ea580c"
                        stroke="#fff"
                        strokeWidth="0.5"
                    />
                ))}
            </svg>
        )
    } catch {
        return <span style={{ fontSize: '1.25rem' }}>🤸</span>
    }
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
                    height: '100%',
                    minHeight: '80px'
                }}
            >
                <span style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{TYPE_EMOJI[type]}</span>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#7b7487' }}>No samples yet</p>
                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>Capture some to teach your AI!</p>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingRight: '2px' }}>
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
                                position: 'relative',
                            }}>
                                <KeypointSkeleton data={sample.data} />
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
