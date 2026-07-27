import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../../ui/components/WorkflowIndicator'
import { classifyDrawErase, StateMachineBuffer } from '../../ml/utils/ruleBasedClassifiers'

interface DrawingCanvasPanelProps {
    mode: UseNeuraProjectReturn
}

type CaptureStatus = 'idle' | 'detecting' | 'success' | 'no-hand' | 'error'

const PREDICT_THROTTLE_MS = 300
const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const MAX_UNDO = 30
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
const BRUSH_SIZES = { small: 3, medium: 8, large: 15 }
const ERASER_BRUSH = 25

const CLASSES = ['Draw', 'Erase', 'Move', 'Color Select'] as const

const TOOL_CONFIG: Record<string, { emoji: string; description: string; gesture: string }> = {
    'Draw': { emoji: '✏️', description: 'Draw on canvas', gesture: '☝️ Index finger pointing' },
    'Erase': { emoji: '🧹', description: 'Erase strokes', gesture: '✊ Closed fist' },
    'Move': { emoji: '✋', description: 'Pan canvas', gesture: '✌️ Peace sign' },
    'Color Select': { emoji: '🎨', description: 'Cycle colors', gesture: '🖐️ Open hand' },
}

export default function DrawingCanvasPanel({ mode }: DrawingCanvasPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hiddenCanvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new HandPoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const lastPredictTimeRef = useRef(0)
    const stateMachineRef = useRef(new StateMachineBuffer(3))

    const [isCapturing, setIsCapturing] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [handDetected, setHandDetected] = useState(false)
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle')
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.5)
    const [activeTool, setActiveTool] = useState<string | null>(null)
    const [currentColorIndex, setCurrentColorIndex] = useState(0)
    const [brushSize, setBrushSize] = useState<keyof typeof BRUSH_SIZES>('medium')
    const [fingerPos, setFingerPos] = useState<{ x: number; y: number } | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const lastDragPosRef = useRef<{ x: number; y: number } | null>(null)
    const colorCycleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastColorCycleTimeRef = useRef(0)
    const undoStackRef = useRef<ImageData[]>([])
    const isPanningRef = useRef(false)
    const panStartRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    const saveUndoState = useCallback(() => {
        const canvas = drawingCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        undoStackRef.current.push(imageData)
        if (undoStackRef.current.length > MAX_UNDO) {
            undoStackRef.current.shift()
        }
    }, [])

    const handleUndo = useCallback(() => {
        const canvas = drawingCanvasRef.current
        if (!canvas || undoStackRef.current.length === 0) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const prev = undoStackRef.current.pop()!
        ctx.putImageData(prev, 0, 0)
    }, [])

    const handleClearCanvas = useCallback(() => {
        const canvas = drawingCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        saveUndoState()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }, [saveUndoState])

    const getFingerPosition = useCallback((keypoints: { x: number; y: number; score: number }[]): { x: number; y: number } | null => {
        if (!keypoints || keypoints.length < 21) return null
        const indexTip = keypoints[8]
        if (!indexTip || indexTip.score < 0.3) return null
        const canvas = drawingCanvasRef.current
        if (!canvas) return null
        return {
            x: (1 - indexTip.x / CANVAS_WIDTH) * canvas.width,
            y: (indexTip.y / CANVAS_HEIGHT) * canvas.height
        }
    }, [])

    const drawAtPosition = useCallback((x: number, y: number, isErase: boolean) => {
        const canvas = drawingCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        if (isErase) {
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath()
            ctx.arc(x, y, ERASER_BRUSH / 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalCompositeOperation = 'source-over'
            return
        }

        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = COLORS[currentColorIndex]
        ctx.lineWidth = BRUSH_SIZES[brushSize]
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        const prev = lastDragPosRef.current
        if (prev) {
            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(x, y)
            ctx.stroke()
        } else {
            ctx.beginPath()
            ctx.arc(x, y, BRUSH_SIZES[brushSize] / 2, 0, Math.PI * 2)
            ctx.fillStyle = COLORS[currentColorIndex]
            ctx.fill()
        }
    }, [currentColorIndex, brushSize])

    const handleToolAction = useCallback((tool: string, keypoints: { x: number; y: number; score: number }[]) => {
        const pos = getFingerPosition(keypoints)
        setFingerPos(pos)
        if (!pos) {
            setIsDragging(false)
            lastDragPosRef.current = null
            return
        }

        switch (tool) {
            case 'Draw': {
                if (!isDragging) {
                    saveUndoState()
                    setIsDragging(true)
                }
                drawAtPosition(pos.x, pos.y, false)
                lastDragPosRef.current = pos
                break
            }
            case 'Erase': {
                if (!isDragging) {
                    saveUndoState()
                    setIsDragging(true)
                }
                drawAtPosition(pos.x, pos.y, true)
                lastDragPosRef.current = pos
                break
            }
            case 'Move': {
                if (!isPanningRef.current && lastDragPosRef.current) {
                    isPanningRef.current = true
                    const canvas = drawingCanvasRef.current
                    if (canvas) {
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                            panStartRef.current = { x: pos.x, y: pos.y, cx: 0, cy: 0 }
                        }
                    }
                }
                lastDragPosRef.current = pos
                break
            }
            case 'Color Select': {
                const now = Date.now()
                if (now - lastColorCycleTimeRef.current > 600) {
                    lastColorCycleTimeRef.current = now
                    setCurrentColorIndex(prev => (prev + 1) % COLORS.length)
                    showSaved(`🎨 Color: ${COLORS[(currentColorIndex + 1) % COLORS.length]}`)
                }
                lastDragPosRef.current = pos
                break
            }
        }
    }, [isDragging, getFingerPosition, drawAtPosition, saveUndoState, currentColorIndex, showSaved])

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            streamRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
            if (overlayCanvasRef.current) {
                classifierRef.current.attachWebGLHandlers(overlayCanvasRef.current)
            }
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
        } catch {
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
        setCameraOn(false)
        setHandDetected(false)
        setPrediction(null)
        setFingerPos(null)
        setIsDragging(false)
        lastDragPosRef.current = null
        isPanningRef.current = false
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) stopCamera(); else startCamera()
    }, [cameraOn, startCamera, stopCamera])

    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    useEffect(() => {
        if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => undefined)
        }
    }, [stream])

    useEffect(() => {
        return () => {
            stopCamera()
            cancelAnimationFrame(animFrameRef.current)
            classifierRef.current.dispose()
        }
    }, [])

    useEffect(() => {
        if (mode.mode !== 'collect' && mode.mode !== 'test') stopCamera()
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            const thisBuild = ++rebuildAbortRef.current
            let cancelled = false
            setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (thisBuild !== rebuildAbortRef.current) return
                    if (cls.samples.length > 0) {
                        await classifierRef.current.rebuildClass(
                            cls.name,
                            cls.samples.map(s => s.data),
                            true
                        )
                    }
                }
                if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode, mode.project])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (streamStateRef.current && videoRef.current && hiddenCanvasRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const start = performance.now()
                    const ctx = hiddenCanvasRef.current.getContext('2d')
                    if (ctx) {
                        hiddenCanvasRef.current.width = CANVAS_WIDTH
                        hiddenCanvasRef.current.height = CANVAS_HEIGHT
                        ctx.drawImage(videoRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
                        const keypoints = await classifierRef.current.detectHand(hiddenCanvasRef.current)
                        const elapsed = Math.round(performance.now() - start)

                        if (keypoints.length > 0) {
                            setHandDetected(true)
                            setInferenceTime(elapsed)

                            if (overlayCanvasRef.current) {
                                overlayCanvasRef.current.width = CANVAS_WIDTH
                                overlayCanvasRef.current.height = CANVAS_HEIGHT
                                classifierRef.current.drawHand(overlayCanvasRef.current, keypoints)
                            }

                            // Rule-based classification: check finger flags for draw/erase
                            const features = classifierRef.current.extractFeatures(keypoints)
                            const result = classifyDrawErase(features)
                            const smoothedTool = stateMachineRef.current.update(result.label)
                            
                            // Map to tool name
                            const toolName = smoothedTool === 'draw' ? 'Draw' : 'Erase'
                            setPrediction({ label: toolName, confidences: result.details })
                            setActiveTool(toolName)
                            handleToolAction(toolName, keypoints)
                        } else {
                            setHandDetected(false)
                            setPrediction(null)
                            setActiveTool(null)
                            setFingerPos(null)
                            setIsDragging(false)
                            lastDragPosRef.current = null
                            isPanningRef.current = false
                            stateMachineRef.current.clear()
                            if (overlayCanvasRef.current) {
                                const octx = overlayCanvasRef.current.getContext('2d')
                                if (octx) octx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
                            }
                        }
                    }
                } catch { /* ignore */ }
                setIsProcessing(false)
                isPredictingRef.current = false
            }
        }
        lastPredictTimeRef.current = performance.now()
        const tick = () => {
            const now = performance.now()
            if (now - lastPredictTimeRef.current >= PREDICT_THROTTLE_MS) {
                lastPredictTimeRef.current = now
                runPrediction()
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [mode.mode, stream, modelLoading, startCamera, confidenceThreshold, handleToolAction])

    const handleCapture = useCallback(async () => {
        if (!videoRef.current || !mode.selectedClassId || !cameraOn || isCapturing) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('Sample limit reached!')
            return
        }
        setIsCapturing(true)
        setCaptureStatus('detecting')
        try {
            const video = videoRef.current
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = video.videoWidth || 640
            tempCanvas.height = video.videoHeight || 480
            const ctx = tempCanvas.getContext('2d')!
            ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
            const keypoints = await classifierRef.current.detectHand(tempCanvas)
            if (keypoints && keypoints.length > 0) {
                const features = classifierRef.current.extractFeatures(keypoints)
                const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(Array.from(features)) })
                if (!added) {
                    showSaved('Sample limit reached!')
                    setCaptureStatus('idle')
                    setIsCapturing(false)
                    return
                }
                classifierRef.current.addSample(features, mode.getSelectedClass()?.name || '').catch(() => {})
                setCaptureStatus('success')
                showSaved(`Saved to ${mode.getSelectedClass()?.name}!`)
            } else {
                setCaptureStatus('no-hand')
                showSaved('No hand detected!')
            }
        } catch {
            setCaptureStatus('error')
        } finally {
            setIsCapturing(false)
            setTimeout(() => setCaptureStatus('idle'), 1500)
        }
    }, [cameraOn, isCapturing, mode, showSaved])

    const canTrain = !!(mode.project && mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2))
    const selectedClass = mode.getSelectedClass()

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-500 mb-0">Virtual Drawing Canvas!</h2>
                            <p className="text-xs text-gray-600">Learn hand gestures to control drawing tools!</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="hand-pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 mt-3 min-h-0">
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="relative rounded-2xl overflow-hidden bg-[#0a0128] flex-1 min-h-[300px]">
                                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain -scale-x-100 ${cameraOn ? 'block' : 'hidden'}`} />
                                <canvas ref={hiddenCanvasRef} className="hidden" />
                                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100" />
                                {cameraOn && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-white text-[9px] font-bold">LIVE</span>
                                    </div>
                                )}
                                {captureStatus === 'success' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                                        <span className="text-6xl">✅</span>
                                    </div>
                                )}
                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">🎨</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to collect gesture samples</p>
                                        <button type="button" onClick={startCamera} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg border-none cursor-pointer">Turn On Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border-none cursor-pointer">
                                    {cameraOn ? 'Stop' : 'Start'}
                                </button>
                                <button type="button" onClick={handleCapture} disabled={!cameraOn || isCapturing || !selectedClass}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white border-none cursor-pointer disabled:opacity-40 ${isCapturing ? 'bg-slate-400' : 'bg-emerald-500'}`}>
                                    {isCapturing ? '...' : '📸 Capture'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">Drawing Tools</p>
                                <div className="flex flex-col gap-1.5">
                                    {CLASSES.map(cls => {
                                        const config = TOOL_CONFIG[cls]
                                        return (
                                            <div key={cls} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50">
                                                <span className="text-sm">{config.emoji}</span>
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-bold text-gray-800">{config.description}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-500/10">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5">Gesture Guide</p>
                                <div className="flex flex-col gap-1">
                                    {CLASSES.map(cls => (
                                        <span key={cls} className="text-[9px] text-emerald-900">• {cls}: {TOOL_CONFIG[cls].gesture}</span>
                                    ))}
                                </div>
                            </div>

                            {selectedClass && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedClass.color }} />
                                            <span className="text-xs font-bold text-gray-800">{selectedClass.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-extrabold text-emerald-500 mb-2">Training Your Drawing AI!</h2>
                        <p className="text-sm text-gray-500">Teaching the AI to recognize drawing gestures...</p>
                    </div>
                    {modelLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-emerald-600">Loading model...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-6xl">✅</span>
                            <p className="text-sm font-bold text-green-600">Model Ready!</p>
                            <button type="button" onClick={() => mode.setMode('test')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg border-none cursor-pointer">
                                Start Drawing
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-500 mb-0">Draw with Gestures!</h2>
                            <p className="text-xs text-gray-600">Show hand gestures to control drawing tools!</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="hand-pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 mt-3 min-h-0">
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Drawing Canvas */}
                            <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 min-h-[320px]">
                                <canvas
                                    ref={drawingCanvasRef}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    className="w-full h-full object-contain block"
                                />
                                {activeTool && (
                                    <div className="absolute top-2 left-2 px-3 py-1.5 rounded-xl backdrop-blur-md text-white text-xs font-bold bg-emerald-500/85">
                                        <span className="mr-1">{TOOL_CONFIG[activeTool]?.emoji}</span>
                                        {activeTool}
                                    </div>
                                )}
                                {fingerPos && handDetected && (
                                    <div
                                        className="absolute pointer-events-none rounded-full border-2"
                                        style={{
                                            left: `${(fingerPos.x / CANVAS_WIDTH) * 100}%`,
                                            top: `${(fingerPos.y / CANVAS_HEIGHT) * 100}%`,
                                            width: activeTool === 'Erase' ? '24px' : '10px',
                                            height: activeTool === 'Erase' ? '24px' : '10px',
                                            transform: 'translate(-50%, -50%)',
                                            borderColor: activeTool === 'Erase' ? '#ef4444' : COLORS[currentColorIndex],
                                            background: activeTool === 'Erase' ? 'rgba(239,68,68,0.2)' : `${COLORS[currentColorIndex]}40`,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Drawing Controls */}
                            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                                <button type="button" onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border-none cursor-pointer">
                                    {cameraOn ? '📷 Stop' : '📷 Start'}
                                </button>
                                <button type="button" onClick={handleUndo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600 border-none cursor-pointer">
                                    ↩️ Undo
                                </button>
                                <button type="button" onClick={handleClearCanvas} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border-none cursor-pointer">
                                    🗑️ Clear
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Current Tool */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Tool</p>
                                {activeTool ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-5xl">{TOOL_CONFIG[activeTool]?.emoji}</span>
                                        <span className="text-lg font-black text-emerald-500">{activeTool}</span>
                                        <span className="text-[10px] text-gray-500">{TOOL_CONFIG[activeTool]?.description}</span>
                                    </div>
                                ) : (
                                    <div className="text-5xl font-black text-gray-300">--</div>
                                )}
                            </div>

                            {/* Confidence Threshold */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Confidence</span>
                                    <span className="text-xs font-extrabold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">{Math.round(confidenceThreshold * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={Math.round(confidenceThreshold * 100)}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                    style={{ background: `linear-gradient(to right, #10b981 ${Math.round(confidenceThreshold * 100)}%, #e5e7eb ${Math.round(confidenceThreshold * 100)}%)` }} />
                            </div>

                            {/* Color Palette */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">Color Palette</p>
                                <div className="flex gap-2">
                                    {COLORS.map((color, i) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setCurrentColorIndex(i)}
                                            className="w-8 h-8 rounded-lg border-2 transition-all cursor-pointer"
                                            style={{
                                                background: color,
                                                borderColor: i === currentColorIndex ? '#111827' : 'transparent',
                                                transform: i === currentColorIndex ? 'scale(1.15)' : 'scale(1)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Brush Size */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">Brush Size</p>
                                <div className="flex gap-2">
                                    {Object.entries(BRUSH_SIZES).map(([name, size]) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setBrushSize(name as keyof typeof BRUSH_SIZES)}
                                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${
                                                brushSize === name
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-500'
                                                    : 'bg-gray-50 text-gray-500 border border-transparent'
                                            }`}
                                        >
                                            <div className="rounded-full bg-current" style={{ width: `${Math.min(size * 1.5, 18)}px`, height: `${Math.min(size * 1.5, 18)}px` }} />
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Speed & Hand */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Speed</p>
                                    <p className="text-lg font-extrabold text-gray-800">{inferenceTime}ms</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Hand</p>
                                    <p className={`text-lg font-extrabold ${handDetected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {handDetected ? 'Found' : 'None'}
                                    </p>
                                </div>
                            </div>

                            {/* Gesture Map */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">Gesture Map</p>
                                <div className="flex flex-col gap-1.5">
                                    {CLASSES.map(cls => {
                                        const config = TOOL_CONFIG[cls]
                                        return (
                                            <div key={cls} className="flex items-center gap-2">
                                                <span className="text-sm">{config.emoji}</span>
                                                <span className="text-[10px] font-bold text-gray-700 flex-1">{config.description}</span>
                                                <span className="text-[9px] text-gray-400">{config.gesture}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
