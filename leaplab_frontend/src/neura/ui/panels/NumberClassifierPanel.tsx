import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { NumberClassifier } from '../../ml/classifiers/NumberClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
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

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            let cancelled = false; setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (cls.samples.length > 0) {
                        for (const sample of cls.samples) {
                            try {
                                const img = new Image(); img.src = sample.data
                                await new Promise<void>((resolve, reject) => {
                                    img.onload = () => resolve(); img.onerror = () => reject(new Error('Failed to load image'))
                                    setTimeout(() => reject(new Error('Image load timeout')), 5000)
                                })
                                const tempCanvas = document.createElement('canvas')
                                tempCanvas.width = 360; tempCanvas.height = 360
                                const tempCtx = tempCanvas.getContext('2d')!
                                tempCtx.drawImage(img, 0, 0, 360, 360)
                                await classifierRef.current.addSample(tempCanvas, cls.name)
                            } catch { /* skip */ }
                        }
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode === 'test' && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height)
            if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current)
        }
    }, [mode.mode])

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        setPrediction(null); setTypedDigit('')
    }, [])

    const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
        return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
    }, [])

    const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = '#131b2e'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        ctx.stroke()
    }, [])

    const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        const pos = getCanvasPos(e)
        if (!pos) return
        setIsDrawing(true); lastPosRef.current = pos
    }, [getCanvasPos])

    const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        if (!isDrawing || !lastPosRef.current) return
        const pos = getCanvasPos(e)
        if (!pos) return
        drawLine(lastPosRef.current, pos)
        lastPosRef.current = pos
    }, [isDrawing, getCanvasPos, drawLine])

    const handleEnd = useCallback(() => {
        setIsDrawing(false); lastPosRef.current = null
    }, [])

    const handleCapture = useCallback(() => {
        if (!mode.selectedClassId || !canvasRef.current) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        const dataUrl = canvasRef.current.toDataURL('image/png')
        mode.addSample(mode.selectedClassId, { type: 'image', data: dataUrl })
        classifierRef.current.addSample(canvasRef.current, mode.getSelectedClass()?.name || '').catch(() => {})
        clearCanvas()
    }, [mode, clearCanvas])

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) { mode.setAccuracy(0); setIsTraining(false); return }
        try {
            await new Promise(r => setTimeout(r, 1500))
            let correct = 0; let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
                        const img = new Image(); img.src = sample.data
                        await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); setTimeout(() => resolve(), 3000) })
                        const tempCanvas = document.createElement('canvas')
                        tempCanvas.width = 360; tempCanvas.height = 360
                        const tempCtx = tempCanvas.getContext('2d')!
                        tempCtx.drawImage(img, 0, 0, 360, 360)
                        const result = await classifierRef.current.predict(tempCanvas, 5)
                        if (result && result.label === cls.name) correct++
                        total++
                    } catch { total++ }
                }
            }
            mode.setAccuracy(total > 0 ? correct / total : 0)
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch { mode.setAccuracy(0) }
        setIsTraining(false)
    }

    useEffect(() => {
        if (mode.mode === 'test' && typedDigit.trim()) {
            if (isPredictingRef.current) return
            if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current)
            predictTimeoutRef.current = setTimeout(async () => {
                if (!canvasRef.current) return
                isPredictingRef.current = true; setIsProcessing(true)
                try { const result = await classifierRef.current.predict(canvasRef.current, 5); setPrediction(result) } catch { setPrediction(null) }
                setIsProcessing(false); isPredictingRef.current = false
            }, 300)
        }
        return () => { if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current) }
    }, [typedDigit, mode.mode])

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">✏️ Number Ninja!</h2>
                        <p className="text-sm text-[#4a4455]">Draw numbers to teach your AI! 🔢</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 border border-[#dae2fd] shadow-sm">
                        <canvas
                            ref={canvasRef}
                            width={360}
                            height={360}
                            className="rounded-2xl bg-white touch-none cursor-crosshair shadow-inner w-80 h-80"
                            onMouseDown={handleStart}
                            onMouseMove={handleMove}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                            onTouchStart={handleStart}
                            onTouchMove={handleMove}
                            onTouchEnd={handleEnd}
                        />
                        <div className="flex items-center justify-between mt-3">
                            <button onClick={clearCanvas} className="flex items-center gap-1.5 px-4 py-2 bg-[#fee2e2] text-[#991b1b] rounded-xl text-xs font-bold hover:bg-[#fecaca] transition-all">
                                🗑️ Clear
                            </button>
                            {selectedClass && (
                                <span className="text-xs font-bold text-[#630ed4] bg-[#eaedff] px-3 py-1.5 rounded-lg">
                                    Adding to: {selectedClass.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <CaptureButton onClick={handleCapture} disabled={!canAddSamples} label={atSampleLimit ? 'Max Reached 🎯' : 'Add Drawing ✏️'} icon="pen" color={selectedClass?.color || '#630ed4'} />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#4a4455] bg-[#f2f3ff] px-2.5 py-1 rounded-lg">{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}</span>
                                </div>
                                <SampleGrid samples={selectedClass.samples} type="image" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">🏋️ Teach Your AI Numbers!</h2>
                        <p className="text-sm text-[#4a4455]">Your AI is learning to count! 🔢</p>
                    </div>
                    <div className="w-full flex justify-center">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} />
                    </div>
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">🧪 Test Your AI!</h2>
                        <p className="text-sm text-[#4a4455]">Draw a number and see if your AI knows it! 🎯</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 border border-[#dae2fd] shadow-sm">
                        <canvas ref={canvasRef} width={360} height={360} className="rounded-2xl bg-white touch-none cursor-crosshair shadow-inner w-80 h-80" onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} />
                        <div className="flex justify-center mt-3">
                            <button onClick={clearCanvas} className="flex items-center gap-1.5 px-4 py-2 bg-[#fee2e2] text-[#991b1b] rounded-xl text-xs font-bold hover:bg-[#fecaca] transition-all">🗑️ Clear</button>
                        </div>
                    </div>
                    {modelLoading && <div className="flex items-center gap-2 px-4 py-2 bg-[#eaedff] rounded-xl animate-fade-in"><div className="w-4 h-4 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" /><span className="text-xs font-bold text-[#630ed4]">Loading model...</span></div>}
                    <TestPanel prediction={prediction} isProcessing={isProcessing}><div /></TestPanel>
                </div>
            )}
        </div>
    )
}
