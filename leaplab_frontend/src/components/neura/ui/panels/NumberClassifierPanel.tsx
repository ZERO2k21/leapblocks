import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { NumberClassifier } from '../../ml/classifiers/NumberClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../../../types/neura.types'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface NumberClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function NumberClassifierPanel({ mode }: NumberClassifierPanelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new NumberClassifier())
    const [isDrawing, setIsDrawing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const lastPosRef = useRef<{ x: number; y: number } | null>(null)
    const [modelLoading, setModelLoading] = useState(false)

    // Rebuild KNN from stored samples when entering train or test mode
    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            let cancelled = false
            setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (cls.samples.length > 0) {
                        for (const sample of cls.samples) {
                            try {
                                // Create a canvas from the stored image data
                                const img = new Image()
                                img.src = sample.data
                                await new Promise<void>((resolve, reject) => {
                                    img.onload = () => resolve()
                                    img.onerror = () => reject(new Error('Failed to load image'))
                                    setTimeout(() => reject(new Error('Image load timeout')), 5000)
                                })
                                const tempCanvas = document.createElement('canvas')
                                tempCanvas.width = 360
                                tempCanvas.height = 360
                                const tempCtx = tempCanvas.getContext('2d')!
                                tempCtx.drawImage(img, 0, 0, 360, 360)
                                await classifierRef.current.addSample(tempCanvas, cls.name)
                            } catch {
                                // skip invalid samples
                            }
                        }
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const rect = canvas.getBoundingClientRect()
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
        lastPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        setIsDrawing(true)
    }, [])

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const rect = canvas.getBoundingClientRect()
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#1F2937'
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        if (lastPosRef.current) {
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
            ctx.lineTo(x, y)
            ctx.stroke()
        }
        lastPosRef.current = { x, y }
    }, [isDrawing])

    const stopDrawing = useCallback(() => {
        setIsDrawing(false)
        lastPosRef.current = null
    }, [])

    const handleCapture = () => {
        if (!canvasRef.current || !mode.selectedClassId) return

        // Check sample limit
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            return
        }

        try {
            const canvas = canvasRef.current
            const imageData = canvas.toDataURL('image/png')
            mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })

            // Add to classifier in background (non-blocking)
            classifierRef.current.addSample(canvas, mode.getSelectedClass()?.name || '').catch(() => {})

            // Clear the drawing canvas
            const ctx = canvas.getContext('2d')!
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        } catch (err) {
            console.warn('[Neura] Number capture failed:', err)
        }
    }

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
        try {
            // Step 1: KNN was already rebuilt by useEffect when entering train mode.
            // Add a small delay so the UI shows the training animation.
            await new Promise(r => setTimeout(r, 1500))

            // Step 2: Verify the KNN has data before computing accuracy
            const sampleCounts = classifierRef.current.getSampleCounts()
            const trainedClasses = Object.keys(sampleCounts)
            if (trainedClasses.length < 2) {
                mode.setAccuracy(0)
                setIsTraining(false)
                return
            }

            // Step 3: Compute accuracy by predicting each sample against the KNN
            let correct = 0
            let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
                        // Create a canvas from the stored image data
                        const img = new Image()
                        img.src = sample.data
                        await new Promise<void>((resolve, reject) => {
                            img.onload = () => resolve()
                            img.onerror = () => reject(new Error('Failed to load image'))
                            setTimeout(() => reject(new Error('Image load timeout')), 5000)
                        })
                        const tempCanvas = document.createElement('canvas')
                        tempCanvas.width = 360
                        tempCanvas.height = 360
                        const tempCtx = tempCanvas.getContext('2d')!
                        tempCtx.drawImage(img, 0, 0, 360, 360)
                        const result = await classifierRef.current.predict(tempCanvas, 3)
                        if (result && result.label === cls.name) correct++
                        total++
                    } catch {
                        total++
                    }
                }
            }
            const accuracy = total > 0 ? correct / total : 0
            mode.setAccuracy(accuracy)

            // Auto-switch to test mode after training completes
            setTimeout(() => {
                mode.setMode('test')
            }, 2000)
        } catch {
            mode.setAccuracy(0)
        }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    const canvasContainerStyle = {
        background: 'rgba(15,15,35,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(236,72,153,0.1)'
    }

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    {/* Drawing canvas */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border-2 border-gray-100 w-full max-w-[360px]" style={{ aspectRatio: '1' }}>
                        <canvas
                            ref={canvasRef}
                            width={360}
                            height={360}
                            className="w-full h-full cursor-crosshair rounded-3xl"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                        {/* Drawing hint */}
                        {!isDrawing && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl pointer-events-none">
                                <span className="text-white text-xs font-bold">Draw a number</span>
                            </div>
                        )}
                        {selectedClass && (
                            <div
                                className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md"
                                style={{ backgroundColor: `${selectedClass.color}CC` }}
                            >
                                {selectedClass.name}
                            </div>
                        )}
                        {selectedClass && (
                            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                <span className="text-white text-xs font-bold">{selectedClass.samples.length} samples</span>
                            </div>
                        )}
                    </div>

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={!canAddSamples}
                        label={atSampleLimit ? 'Max Samples Reached' : 'Save Drawing'}
                        icon="check"
                        color={selectedClass?.color || '#7C3AED'}
                        pulse={!!canAddSamples}
                    />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[360px]">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-gray-700">{selectedClass.name}</h3>
                                    </div>
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                        atSampleLimit
                                            ? 'text-amber-600 bg-amber-50'
                                            : 'text-gray-400 bg-gray-50'
                                    }`}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} drawings
                                    </span>
                                </div>
                                <SampleGrid
                                    samples={selectedClass.samples}
                                    type="image"
                                    onRemove={(id) => mode.removeSample(selectedClass.id, id)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <TrainPanel
                        isTraining={isTraining}
                        accuracy={mode.accuracy}
                        canTrain={canTrain}
                        onTrain={handleTrain}
                        classCount={mode.project?.classes.length || 0}
                        totalSamples={mode.getTotalSamples()}
                    />
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    {modelLoading && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-violet-50 rounded-2xl border border-violet-200 animate-[fade-in_0.3s_ease-out]">
                            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-semibold text-violet-700">Loading model and preparing samples...</span>
                        </div>
                    )}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border-2 border-gray-100 w-full max-w-[360px]" style={{ aspectRatio: '1' }}>
                        <canvas
                            ref={canvasRef}
                            width={360}
                            height={360}
                            className="w-full h-full cursor-crosshair rounded-3xl"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-xl pointer-events-none">
                            <span className="text-white text-xs font-bold tracking-wide">TEST MODE</span>
                        </div>
                        {prediction && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-2xl">
                                <span className="text-white text-2xl font-bold">{prediction.label}</span>
                                <span className="text-white/70 text-sm ml-2">
                                    {Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <CaptureButton
                        onClick={async () => {
                            if (!canvasRef.current || modelLoading) return
                            setIsProcessing(true)
                            try {
                                const result = await classifierRef.current.predict(canvasRef.current, 3)
                                if (result) setPrediction(result)
                            } catch {
                                // ignore
                            }
                            setIsProcessing(false)
                        }}
                        disabled={modelLoading}
                        label="Test Drawing"
                        icon="check"
                        color="#7C3AED"
                        pulse={!modelLoading}
                    />
                    <TestPanel prediction={prediction} isProcessing={isProcessing}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
