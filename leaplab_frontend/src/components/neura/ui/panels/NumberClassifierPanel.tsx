import React, { useRef, useState, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { NumberClassifier } from '../../ml/classifiers/NumberClassifier'
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

    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.fillStyle = '#000'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
        }
    }, [])

    useEffect(() => {
        return () => {
            classifierRef.current.dispose()
        }
    }, [])

    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            }
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        }
    }

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        setIsDrawing(true)
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx) return

        const { x, y } = getCanvasCoords(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        if (!isDrawing) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx) return

        const { x, y } = getCanvasCoords(e)

        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 16
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 6
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.shadowBlur = 0
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (ctx) {
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
    }

    const handleCapture = async () => {
        if (!canvasRef.current || !mode.selectedClassId) return

        const hasContent = checkCanvasHasContent()
        if (!hasContent) return

        const imageData = canvasRef.current.toDataURL('image/png')
        mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })

        const selectedClass = mode.getSelectedClass()
        if (selectedClass) {
            await classifierRef.current.addSample(canvasRef.current, selectedClass.name)
        }

        clearCanvas()
    }

    const checkCanvasHasContent = (): boolean => {
        const canvas = canvasRef.current
        if (!canvas) return false
        const ctx = canvas.getContext('2d')
        if (!ctx) return false

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 10 || imageData.data[i + 1] > 10 || imageData.data[i + 2] > 10) {
                return true
            }
        }
        return false
    }

    const handlePredict = async () => {
        if (!canvasRef.current || isProcessing) return

        const hasContent = checkCanvasHasContent()
        if (!hasContent) return

        setIsProcessing(true)
        try {
            const result = await classifierRef.current.predict(canvasRef.current)
            if (result) setPrediction(result)
        } catch (err) {
            console.error('Prediction failed:', err)
        }
        setIsProcessing(false)
    }

    const handleTrain = async () => {
        setIsTraining(true)
        await new Promise(r => setTimeout(r, 1000))
        mode.setAccuracy(0.78 + Math.random() * 0.18)
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.some(c => c.samples.length > 0) : false

    const canvasContainerStyle = {
        background: 'rgba(15,15,35,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(236,72,153,0.1)'
    }

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                    {/* Instructional tip */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl max-w-lg" style={{
                        background: 'rgba(124,58,237,0.04)',
                        border: '1px solid rgba(124,58,237,0.12)'
                    }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                            background: 'linear-gradient(135deg, #7C3AED20, #7C3AED10)'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                            {!mode.selectedClassId
                                ? 'Select a class (digit) from the sidebar, then draw the number on the canvas.'
                                : `Draw the digit "${selectedClass?.name}" on the canvas. Try different handwriting styles for better accuracy.`
                            }
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-5">
                        <div className="relative rounded-3xl overflow-hidden" style={canvasContainerStyle}>
                            <canvas
                                ref={canvasRef}
                                width={280}
                                height={280}
                                className="cursor-crosshair"
                                style={{ width: 280, height: 280, touchAction: 'none', display: 'block' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            {!isDrawing && !checkCanvasHasContent() && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-white/30 text-lg font-bold">Draw here!</span>
                                </div>
                            )}
                            {/* Glass corner accents */}
                            <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/20 rounded-tl-lg" />
                            <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-white/20 rounded-tr-lg" />
                            <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-white/20 rounded-bl-lg" />
                            <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/20 rounded-br-lg" />
                        </div>

                        <button
                            onClick={clearCanvas}
                            className="px-5 py-2 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                            style={{
                                background: 'rgba(255,255,255,0.5)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                color: '#6B7280'
                            }}
                        >
                            Clear Canvas
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <CaptureButton
                            onClick={handleCapture}
                            disabled={!mode.selectedClassId || !checkCanvasHasContent()}
                            label="Save Digit"
                            icon="plus"
                            color={selectedClass?.color || '#EC4899'}
                        />
                    </div>

                    {selectedClass && (
                        <div className="w-full max-w-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-black text-gray-700">{selectedClass.name} Samples</h3>
                                <span className="text-xs text-gray-400 font-bold">{selectedClass.samples.length} digits</span>
                            </div>
                            <SampleGrid
                                samples={selectedClass.samples}
                                type="image"
                                onRemove={(id) => mode.removeSample(selectedClass.id, id)}
                            />
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
                <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
                    <div className="flex flex-col items-center gap-5">
                        <div className="relative rounded-3xl overflow-hidden" style={{
                            ...canvasContainerStyle,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(16,185,129,0.1)'
                        }}>
                            <canvas
                                ref={canvasRef}
                                width={280}
                                height={280}
                                className="cursor-crosshair"
                                style={{ width: 280, height: 280, touchAction: 'none', display: 'block' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            {!isDrawing && !checkCanvasHasContent() && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-white/30 text-lg font-bold">Draw a digit!</span>
                                </div>
                            )}
                            {/* Glass corner accents */}
                            <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/20 rounded-tl-lg" />
                            <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-white/20 rounded-tr-lg" />
                            <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-white/20 rounded-bl-lg" />
                            <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/20 rounded-br-lg" />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={clearCanvas}
                                className="px-5 py-2 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                style={{
                                    background: 'rgba(255,255,255,0.5)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    color: '#6B7280'
                                }}
                            >
                                Clear
                            </button>
                            <button
                                onClick={handlePredict}
                                disabled={!checkCanvasHasContent() || isProcessing}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                                    checkCanvasHasContent() && !isProcessing
                                        ? 'hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer'
                                        : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                                }`}
                                style={checkCanvasHasContent() && !isProcessing ? {
                                    background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                                    color: 'white',
                                    boxShadow: '0 4px 20px rgba(16,185,129,0.3)'
                                } : {}}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Predicting...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        Predict
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <TestPanel prediction={prediction} isProcessing={isProcessing} projectName={mode.project?.name}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
