/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * NumbersCR — Handwritten Digit Recognition (0-9)
 * Draw digits on canvas, train a CNN model, and predict in real-time
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
import DrawingCanvas, { DrawingCanvasHandle } from './DrawingCanvas'
import { DigitModel } from './DigitModel'
import {
    Eraser,
    Plus,
    Trash2,
    Check,
    Sparkles,
    Target,
    Zap,
    Activity,
    Grid3X3,
} from 'lucide-react'

type NumbersCRProps = {
    project?: any
    onBack: () => void
    onDataChange?: (data: Record<string, any>) => void
}

const DIGIT_COLORS = [
    { bg: '#ef4444', light: '#f87171', glow: 'rgba(239, 68, 68, 0.3)' },
    { bg: '#f97316', light: '#fb923c', glow: 'rgba(249, 115, 22, 0.3)' },
    { bg: '#eab308', light: '#facc15', glow: 'rgba(234, 179, 8, 0.3)' },
    { bg: '#22c55e', light: '#4ade80', glow: 'rgba(34, 197, 94, 0.3)' },
    { bg: '#14b8a6', light: '#2dd4bf', glow: 'rgba(20, 184, 166, 0.3)' },
    { bg: '#3b82f6', light: '#60a5fa', glow: 'rgba(59, 130, 246, 0.3)' },
    { bg: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.3)' },
    { bg: '#ec4899', light: '#f472b6', glow: 'rgba(236, 72, 153, 0.3)' },
    { bg: '#6366f1', light: '#818cf8', glow: 'rgba(99, 102, 241, 0.3)' },
    { bg: '#d946ef', light: '#e879f9', glow: 'rgba(217, 70, 239, 0.3)' },
]

export default function NumbersCR({ project, onBack, onDataChange }: NumbersCRProps) {
    const canvasRef = useRef<DrawingCanvasHandle>(null)
    const modelRef = useRef<DigitModel>(new DigitModel())
    const testCanvasRef = useRef<DrawingCanvasHandle>(null)

    const [selectedDigit, setSelectedDigit] = useState(0)
    const [sampleCounts, setSampleCounts] = useState<Record<number, number>>({
        0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    })
    const [sampleThumbnails, setSampleThumbnails] = useState<Record<number, string[]>>({
        0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [],
    })
    const [trained, setTrained] = useState(false)
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState(0)
    const [showAdv, setShowAdv] = useState(false)
    const [epochs, setEpochs] = useState(20)
    const [testResult, setTestResult] = useState<any>(null)
    const [canvasClear, setCanvasClear] = useState(0)
    const [testCanvasClear, setTestCanvasClear] = useState(0)
    const [addedFeedback, setAddedFeedback] = useState(false)
    const [hoveredDigit, setHoveredDigit] = useState<number | null>(null)
    const [restored, setRestored] = useState(false)

    // Deserialize: restore from saved project on mount
    useEffect(() => {
        if (project?.projectData && !restored) {
            const pd = project.projectData
            if (pd.sampleCounts) setSampleCounts(pd.sampleCounts)
            if (pd.sampleThumbnails) setSampleThumbnails(pd.sampleThumbnails)
            setTrained(project.modelTrained || false)
            if (pd.epochs) setEpochs(pd.epochs)
            setRestored(true)
        }
    }, [project])

    // Serialize: sync state back to parent (debounced)
    useEffect(() => {
        if (!restored || !onDataChange) return
        const timer = setTimeout(() => {
            onDataChange({
                classes: [],
                modelTrained: trained,
                projectData: { sampleCounts, sampleThumbnails, epochs },
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [sampleCounts, sampleThumbnails, trained, epochs])

    const totalSamples = Object.values(sampleCounts).reduce((s, c) => s + c, 0)
    const canTrain = Object.values(sampleCounts).filter(c => c > 0).length >= 2

    const addSample = () => {
        if (!canvasRef.current) return
        const imageData = canvasRef.current.capture()
        if (!imageData) return

        modelRef.current.addSample(selectedDigit, imageData)
        setSampleCounts(modelRef.current.getSampleCounts())

        // Create thumbnail
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = 28
        tempCanvas.height = 28
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0)
            const dataUrl = tempCanvas.toDataURL()
            setSampleThumbnails(prev => ({
                ...prev,
                [selectedDigit]: [...prev[selectedDigit], dataUrl].slice(-8),
            }))
        }

        // Clear canvas and show feedback
        canvasRef.current.clear()
        setCanvasClear(c => c + 1)
        setAddedFeedback(true)
        setTimeout(() => setAddedFeedback(false), 800)
    }

    const handleTrain = async () => {
        setStatus('training')
        setProgress(0)
        try {
            await modelRef.current.train(
                (p) => {
                    setProgress((p.epoch / epochs) * 100)
                },
                epochs
            )
            setTrained(true)
            setStatus('done')
        } catch (e) {
            console.error('Training failed:', e)
            setStatus('idle')
        }
    }

    const handlePredict = async () => {
        if (!testCanvasRef.current || !trained) return
        const imageData = testCanvasRef.current.capture()
        if (!imageData) return

        try {
            const result = await modelRef.current.predict(imageData)
            setTestResult(result)
        } catch (e) {
            console.error('Prediction failed:', e)
        }
    }

    const clearDigitSamples = (digit: number) => {
        modelRef.current.clearSamples(digit)
        setSampleCounts(modelRef.current.getSampleCounts())
        setSampleThumbnails(prev => ({ ...prev, [digit]: [] }))
    }

    useEffect(() => {
        return () => {
            modelRef.current.dispose()
        }
    }, [])

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minHeight: 0 }}>
                {/* Digit Selector Row */}
                <div style={{
                    background: 'var(--ml-surface)',
                    border: '1px solid var(--ml-border)',
                    borderRadius: 16,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <Target size={16} style={{ color: 'var(--ml-text-secondary)', flexShrink: 0 }} />
                    <span style={{
                        color: 'var(--ml-text-secondary)',
                        fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        marginRight: 8,
                        flexShrink: 0,
                    }}>Select Digit:</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Array.from({ length: 10 }).map((_, digit) => {
                            const color = DIGIT_COLORS[digit]
                            const isSelected = selectedDigit === digit
                            const count = sampleCounts[digit]
                            return (
                                <button
                                    key={digit}
                                    onClick={() => setSelectedDigit(digit)}
                                    onMouseEnter={() => setHoveredDigit(digit)}
                                    onMouseLeave={() => setHoveredDigit(null)}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        border: `2px solid ${isSelected ? color.bg : hoveredDigit === digit ? color.bg + '60' : 'var(--ml-border-strong)'}`,
                                        background: isSelected ? color.bg + '20' : 'var(--ml-well)',
                                        color: isSelected ? color.bg : 'var(--ml-text-secondary)',
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: 18,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1,
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        boxShadow: isSelected ? `0 0 12px ${color.glow}` : 'none',
                                    }}
                                >
                                    {digit}
                                    {count > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            background: color.bg,
                                            color: '#fff',
                                            fontSize: 9,
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <Activity size={12} style={{ color: 'var(--ml-text-muted)' }} />
                        <span style={{ color: 'var(--ml-text-muted)', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                            {totalSamples} total
                        </span>
                    </div>
                </div>

                {/* Main Content Row */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                    {/* Drawing Canvas Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Canvas Card */}
                        <div style={{
                            background: 'var(--ml-surface)',
                            border: '1px solid var(--ml-border)',
                            borderRadius: 16,
                            padding: 20,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: DIGIT_COLORS[selectedDigit].bg,
                                        boxShadow: `0 0 8px ${DIGIT_COLORS[selectedDigit].glow}`,
                                    }} />
                                    <span style={{
                                        color: 'var(--ml-text-primary)',
                                        fontSize: 14,
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 700,
                                    }}>
                                        Draw digit {selectedDigit}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => { canvasRef.current?.clear(); setCanvasClear(c => c + 1) }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            background: 'var(--ml-well)',
                                            border: '1px solid var(--ml-border-strong)',
                                            color: 'var(--ml-text-secondary)',
                                            fontSize: 11,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = '#ef4444'
                                            e.currentTarget.style.color = '#ef4444'
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'var(--ml-border-strong)'
                                            e.currentTarget.style.color = 'var(--ml-text-secondary)'
                                        }}
                                    >
                                        <Eraser size={12} />
                                        Clear
                                    </button>
                                    <button
                                        onClick={addSample}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: 8,
                                            background: `linear-gradient(135deg, ${DIGIT_COLORS[selectedDigit].bg}, ${DIGIT_COLORS[selectedDigit].light})`,
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: 11,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            transition: 'all 0.2s ease',
                                            boxShadow: `0 2px 8px ${DIGIT_COLORS[selectedDigit].glow}`,
                                        }}
                                    >
                                        {addedFeedback ? <Check size={12} /> : <Plus size={12} />}
                                        {addedFeedback ? 'Added!' : 'Add Sample'}
                                    </button>
                                </div>
                            </div>

                            <DrawingCanvas
                                ref={canvasRef}
                                width={280}
                                height={280}
                                strokeColor="#ffffff"
                                bgColor="var(--ml-well)"
                                strokeWidth={16}
                                clearTrigger={canvasClear}
                            />

                            <div style={{
                                marginTop: 12,
                                textAlign: 'center',
                                fontSize: 11,
                                color: 'var(--ml-text-muted)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>
                                Draw a digit with your mouse or touch, then click "Add Sample"
                            </div>
                        </div>

                        {/* Samples Grid */}
                        <div style={{
                            background: 'var(--ml-surface)',
                            border: '1px solid var(--ml-border)',
                            borderRadius: 16,
                            padding: 16,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Grid3X3 size={14} style={{ color: 'var(--ml-text-secondary)' }} />
                                <span style={{
                                    color: 'var(--ml-text-secondary)',
                                    fontSize: 11,
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}>Captured Samples</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
                                {Array.from({ length: 10 }).map((_, digit) => {
                                    const color = DIGIT_COLORS[digit]
                                    const thumbnails = sampleThumbnails[digit]
                                    const count = sampleCounts[digit]
                                    return (
                                        <div
                                            key={digit}
                                            style={{
                                                background: 'var(--ml-well)',
                                                border: `1px solid ${count > 0 ? color.bg + '30' : 'var(--ml-border)'}`,
                                                borderRadius: 10,
                                                padding: 6,
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div style={{
                                                fontSize: 14,
                                                fontFamily: "'DM Mono', monospace",
                                                fontWeight: 700,
                                                color: count > 0 ? color.bg : 'var(--ml-text-disabled)',
                                                marginBottom: 4,
                                            }}>{digit}</div>
                                            {thumbnails.length > 0 ? (
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <img
                                                        src={thumbnails[thumbnails.length - 1]}
                                                        alt={`Digit ${digit}`}
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: 4,
                                                            border: `1px solid ${color.bg}30`,
                                                            imageRendering: 'pixelated',
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    margin: '0 auto',
                                                    borderRadius: 4,
                                                    border: '1px dashed var(--ml-border-strong)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <span style={{ fontSize: 10, color: 'var(--ml-text-disabled)' }}>—</span>
                                                </div>
                                            )}
                                            <div style={{
                                                fontSize: 9,
                                                color: count > 0 ? color.bg : 'var(--ml-text-disabled)',
                                                marginTop: 4,
                                                fontFamily: "'DM Mono', monospace",
                                            }}>{count}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Training Panel */}
                    <TrainingPanel
                        status={status}
                        progress={progress}
                        accuracy={modelRef.current.accuracy}
                        canTrain={canTrain}
                        onTrain={handleTrain}
                        showAdvanced={showAdv}
                        setShowAdvanced={setShowAdv}
                        epochs={epochs}
                        setEpochs={setEpochs}
                        trained={trained}
                        sampleCounts={Object.fromEntries(
                            Object.entries(sampleCounts).filter(([_, c]) => c > 0).map(([d, c]) => [`Digit ${d}`, c])
                        )}
                    />

                    {/* Divider */}
                    <div style={{ width: 32, display: 'flex', alignItems: 'center', paddingTop: 64 }}>
                        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, #8b5cf640, transparent)' }} />
                    </div>

                    {/* Testing Panel */}
                    <div style={{
                        width: 280,
                        background: 'var(--ml-surface)',
                        border: '1px solid var(--ml-border)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <Sparkles size={16} style={{ color: '#fff' }} />
                            <span style={{
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 14,
                                fontFamily: "'DM Sans', sans-serif",
                            }}>Testing</span>
                        </div>

                        <div style={{ padding: 16 }}>
                            {!trained ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
                                    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" style={{ opacity: 0.4, marginBottom: 12 }}>
                                        {/* Canvas frame */}
                                        <rect x="16" y="4" width="48" height="48" rx="6" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
                                        {/* Grid lines */}
                                        <line x1="32" y1="4" x2="32" y2="52" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
                                        <line x1="48" y1="4" x2="48" y2="52" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
                                        <line x1="16" y1="20" x2="64" y2="20" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
                                        <line x1="16" y1="36" x2="64" y2="36" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.3" />
                                        {/* Pencil */}
                                        <path d="M56 44 L64 52 L52 64 L44 56 Z" fill="#8b5cf6" opacity="0.3" />
                                        <line x1="56" y1="44" x2="64" y2="36" stroke="#8b5cf6" strokeWidth="1" opacity="0.5" />
                                    </svg>
                                    <p style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: 12,
                                        color: 'var(--ml-text-muted)',
                                        lineHeight: 1.6,
                                    }}>
                                        Train your digit model first.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* Success indicator */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        background: 'var(--ml-success-bg)',
                                        border: '1px solid var(--ml-success-border)',
                                        borderRadius: 10,
                                        padding: '10px 12px',
                                    }}>
                                        <div style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: 'var(--ml-success-dot)',
                                            boxShadow: '0 0 8px var(--ml-success-dot)',
                                        }} />
                                        <span style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 12,
                                            color: 'var(--ml-success-text)',
                                            fontWeight: 600,
                                        }}>Model ready</span>
                                    </div>

                                    {/* Test canvas */}
                                    <div style={{
                                        background: 'var(--ml-well)',
                                        borderRadius: 10,
                                        padding: 8,
                                        border: '1px solid var(--ml-border)',
                                    }}>
                                        <DrawingCanvas
                                            ref={testCanvasRef}
                                            width={248}
                                            height={160}
                                            strokeColor="#ffffff"
                                            bgColor="var(--ml-well)"
                                            strokeWidth={12}
                                            clearTrigger={testCanvasClear}
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => { testCanvasRef.current?.clear(); setTestCanvasClear(c => c + 1); setTestResult(null) }}
                                            style={{
                                                flex: 1,
                                                padding: '10px 0',
                                                borderRadius: 10,
                                                background: 'var(--ml-well)',
                                                border: '1px solid var(--ml-border-strong)',
                                                color: 'var(--ml-text-secondary)',
                                                fontSize: 12,
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 5,
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <Eraser size={12} />
                                            Clear
                                        </button>
                                        <button
                                            onClick={handlePredict}
                                            style={{
                                                flex: 1.5,
                                                padding: '10px 0',
                                                borderRadius: 10,
                                                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: 12,
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 5,
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)',
                                            }}
                                        >
                                            <Zap size={13} />
                                            Predict
                                        </button>
                                    </div>

                                    {/* Prediction results */}
                                    {testResult && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {/* Predicted digit */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: `linear-gradient(135deg, ${DIGIT_COLORS[testResult.label].bg}15, ${DIGIT_COLORS[testResult.label].light}10)`,
                                                border: `1px solid ${DIGIT_COLORS[testResult.label].bg}30`,
                                                borderRadius: 12,
                                                padding: '12px 0',
                                            }}>
                                                <span style={{
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: 48,
                                                    fontWeight: 700,
                                                    color: DIGIT_COLORS[testResult.label].bg,
                                                    lineHeight: 1,
                                                }}>{testResult.label}</span>
                                            </div>

                                            {/* Confidence bars */}
                                            {Object.entries(testResult.confidences)
                                                .sort((a, b) => (b[1] as number) - (a[1] as number))
                                                .slice(0, 5)
                                                .map(([digit, conf]) => {
                                                    const d = parseInt(digit)
                                                    const color = DIGIT_COLORS[d]
                                                    return (
                                                        <div key={digit}>
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                fontSize: 11,
                                                                marginBottom: 3,
                                                            }}>
                                                                <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Digit {d}</span>
                                                                <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                                                                    {Math.round((conf as number) * 100)}%
                                                                </span>
                                                            </div>
                                                            <div style={{
                                                                height: 4,
                                                                background: 'var(--ml-well)',
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                            }}>
                                                                <div style={{
                                                                    height: '100%',
                                                                    width: `${(conf as number) * 100}%`,
                                                                    background: `linear-gradient(90deg, ${color.bg}, ${color.light})`,
                                                                    borderRadius: 2,
                                                                    transition: 'width 0.5s ease',
                                                                }} />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ClassifierLayout>
    )
}
