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
    const [typedDigit, setTypedDigit] = useState('')
    const predictTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isPredictingRef = useRef(false)

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

    // Get canvas coordinates from mouse or touch event
    const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        }
    }, [])

    // Drawing functions - Mouse
    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const coords = getCanvasCoords(e.clientX, e.clientY)
        if (!coords) return
        ctx.beginPath()
        ctx.moveTo(coords.x, coords.y)
        lastPosRef.current = coords
        setIsDrawing(true)
    }, [getCanvasCoords])

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const coords = getCanvasCoords(e.clientX, e.clientY)
        if (!coords) return
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#1F2937'
        if (lastPosRef.current) {
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
            ctx.lineTo(coords.x, coords.y)
            ctx.stroke()
        }
        lastPosRef.current = coords
    }, [isDrawing, getCanvasCoords])

    // Drawing functions - Touch
    const startDrawingTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const touch = e.touches[0]
        const canvas = canvasRef.current
        if (!canvas || !touch) return
        const ctx = canvas.getContext('2d')!
        const coords = getCanvasCoords(touch.clientX, touch.clientY)
        if (!coords) return
        ctx.beginPath()
        ctx.moveTo(coords.x, coords.y)
        lastPosRef.current = coords
        setIsDrawing(true)
    }, [getCanvasCoords])

    const drawTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        if (!isDrawing) return
        const touch = e.touches[0]
        const canvas = canvasRef.current
        if (!canvas || !touch) return
        const ctx = canvas.getContext('2d')!
        const coords = getCanvasCoords(touch.clientX, touch.clientY)
        if (!coords) return
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#1F2937'
        if (lastPosRef.current) {
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
            ctx.lineTo(coords.x, coords.y)
            ctx.stroke()
        }
        lastPosRef.current = coords
    }, [isDrawing, getCanvasCoords])

    const stopDrawing = useCallback(() => {
        setIsDrawing(false)
        lastPosRef.current = null
    }, [])

    // Auto-predict after drawing stops (test mode only)
    const scheduleAutoPredict = useCallback(() => {
        if (mode.mode !== 'test' || modelLoading) return
        if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current)
        predictTimeoutRef.current = setTimeout(async () => {
            if (isPredictingRef.current || !canvasRef.current) return
            // Check if canvas has content
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const hasContent = imageData.data.some((v, i) => i % 4 === 3 && v > 0)
            if (!hasContent) return

            isPredictingRef.current = true
            setIsProcessing(true)
            try {
                const result = await classifierRef.current.predict(canvas, 3)
                if (result) setPrediction(result)
            } catch {
                // ignore
            }
            setIsProcessing(false)
            isPredictingRef.current = false
        }, 300)
    }, [mode.mode, modelLoading])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current)
        }
    }, [])

    const handleStopDrawing = useCallback(() => {
        stopDrawing()
        if (mode.mode === 'test') {
            scheduleAutoPredict()
        }
    }, [stopDrawing, mode.mode, scheduleAutoPredict])

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setPrediction(null)
    }, [])

    const handleCapture = () => {
        if (!canvasRef.current || !mode.selectedClassId) return

        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            return
        }

        try {
            const canvas = canvasRef.current
            const imageData = canvas.toDataURL('image/png')
            mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })

            classifierRef.current.addSample(canvas, mode.getSelectedClass()?.name || '').catch(() => {})

            clearCanvas()
        } catch (err) {
            console.warn('[Neura] Number capture failed:', err)
        }
    }

    // Render a typed digit onto the canvas for testing
    const renderDigitOnCanvas = useCallback((digit: string) => {
        const canvas = canvasRef.current
        if (!canvas || !digit) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#1F2937'
        ctx.font = 'bold 200px "Plus Jakarta Sans", system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(digit, canvas.width / 2, canvas.height / 2)
    }, [])

    const handleTypedDigitTest = useCallback(async (digit: string) => {
        if (!digit || modelLoading) return
        renderDigitOnCanvas(digit)
        isPredictingRef.current = true
        setIsProcessing(true)
        try {
            const result = await classifierRef.current.predict(canvasRef.current!, 3)
            if (result) setPrediction(result)
        } catch {
            // ignore
        }
        setIsProcessing(false)
        isPredictingRef.current = false
    }, [modelLoading, renderDigitOnCanvas])

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
        try {
            await new Promise(r => setTimeout(r, 1500))

            const sampleCounts = classifierRef.current.getSampleCounts()
            const trainedClasses = Object.keys(sampleCounts)
            if (trainedClasses.length < 2) {
                mode.setAccuracy(0)
                setIsTraining(false)
                return
            }

            let correct = 0
            let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
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
                            className="w-full h-full cursor-crosshair rounded-3xl touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={handleStopDrawing}
                            onMouseLeave={handleStopDrawing}
                            onTouchStart={startDrawingTouch}
                            onTouchMove={drawTouch}
                            onTouchEnd={handleStopDrawing}
                        />
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

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearCanvas}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            Clear
                        </button>
                        <CaptureButton
                            onClick={handleCapture}
                            disabled={!canAddSamples}
                            label={atSampleLimit ? 'Max Samples Reached' : 'Save Drawing'}
                            icon="check"
                            color={selectedClass?.color || '#7C3AED'}
                            pulse={!!canAddSamples}
                        />
                    </div>

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

                    {/* Drawing canvas */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border-2 border-gray-100 w-full max-w-[360px]" style={{ aspectRatio: '1' }}>
                        <canvas
                            ref={canvasRef}
                            width={360}
                            height={360}
                            className="w-full h-full cursor-crosshair rounded-3xl touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={handleStopDrawing}
                            onMouseLeave={handleStopDrawing}
                            onTouchStart={startDrawingTouch}
                            onTouchMove={drawTouch}
                            onTouchEnd={handleStopDrawing}
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

                    {/* Controls row */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearCanvas}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            Clear
                        </button>
                        <CaptureButton
                            onClick={async () => {
                                if (!canvasRef.current || modelLoading) return
                                isPredictingRef.current = true
                                setIsProcessing(true)
                                try {
                                    const result = await classifierRef.current.predict(canvasRef.current, 3)
                                    if (result) setPrediction(result)
                                } catch {
                                    // ignore
                                }
                                setIsProcessing(false)
                                isPredictingRef.current = false
                            }}
                            disabled={modelLoading}
                            label="Test Drawing"
                            icon="check"
                            color="#7C3AED"
                            pulse={!modelLoading}
                        />
                    </div>

                    {/* Text input for testing */}
                    <div className="w-full max-w-[360px] bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Or type a digit</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="0"
                                max="9"
                                value={typedDigit}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '').slice(-1)
                                    setTypedDigit(val)
                                    if (val) renderDigitOnCanvas(val)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && typedDigit) {
                                        handleTypedDigitTest(typedDigit)
                                    }
                                }}
                                placeholder="0-9"
                                className="flex-1 px-4 py-3 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 bg-gray-50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                                onClick={() => {
                                    if (typedDigit) handleTypedDigitTest(typedDigit)
                                }}
                                disabled={!typedDigit || modelLoading}
                                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    typedDigit && !modelLoading
                                        ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:shadow-lg hover:shadow-violet-200'
                                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Test
                            </button>
                        </div>
                    </div>

                    <TestPanel prediction={prediction} isProcessing={isProcessing}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
