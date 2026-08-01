import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import { classifyDrawErase, StateMachineBuffer } from '../../ml/utils/ruleBasedClassifiers'

interface DrawingCanvasPanelProps {
    mode: UseNeuraProjectReturn
}

const PREDICT_THROTTLE_MS = 16
const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const MAX_UNDO = 30
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
const BRUSH_SIZES = { small: 3, medium: 8, large: 15 }
const ERASER_BRUSH = 25
const POINTER_COLOR = '#22c55e'

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
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new HandPoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const lastPredictTimeRef = useRef(0)
    const stateMachineRef = useRef(new StateMachineBuffer(3))

    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [handDetected, setHandDetected] = useState(false)
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [modelError, setModelError] = useState<string | null>(null)
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
    const handDetectedRef = useRef(false)
    const panStartRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)
    const [smoothingAlpha, setSmoothingAlpha] = useState(0.35)
    const smoothingAlphaRef = useRef(smoothingAlpha)
    smoothingAlphaRef.current = smoothingAlpha
    const smoothedIndexTipRef = useRef<{ x: number; y: number } | null>(null)
    const activeToolRef = useRef<string | null>(null)
    const currentColorIndexRef = useRef(currentColorIndex)
    const brushSizeRef = useRef(brushSize)
    const handDetectionEverWorkedRef = useRef(false)
    const modelErrorShownRef = useRef(false)

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

    const handleToolAction = useCallback((tool: string, _keypoints: { x: number; y: number; score: number }[]) => {
        const canvas = drawingCanvasRef.current
        let pos: { x: number; y: number } | null = null
        if (canvas && smoothedIndexTipRef.current) {
            pos = {
                x: (1 - smoothedIndexTipRef.current.x / CANVAS_WIDTH) * canvas.width,
                y: (smoothedIndexTipRef.current.y / CANVAS_HEIGHT) * canvas.height,
            }
        }
        setFingerPos(pos)
        if (!pos) {
            if (isDragging) console.debug('[DrawingCanvas] Drag stop — finger lost')
            setIsDragging(false)
            lastDragPosRef.current = null
            return
        }

        switch (tool) {
            case 'Draw': {
                if (!isDragging) {
                    saveUndoState()
                    setIsDragging(true)
                    console.debug('[DrawingCanvas] Draw start at', Math.round(pos.x), Math.round(pos.y))
                }
                drawAtPosition(pos.x, pos.y, false)
                lastDragPosRef.current = pos
                break
            }
            case 'Erase': {
                if (!isDragging) {
                    saveUndoState()
                    setIsDragging(true)
                    console.debug('[DrawingCanvas] Erase start at', Math.round(pos.x), Math.round(pos.y))
                }
                drawAtPosition(pos.x, pos.y, true)
                lastDragPosRef.current = pos
                break
            }
            case 'Move': {
                if (isDragging) {
                    setIsDragging(false)
                    lastDragPosRef.current = null
                }
                if (!isPanningRef.current) {
                    isPanningRef.current = true
                    panStartRef.current = { x: pos.x, y: pos.y, cx: 0, cy: 0 }
                }
                break
            }
            case 'Color Select': {
                const now = Date.now()
                if (now - lastColorCycleTimeRef.current > 600) {
                    lastColorCycleTimeRef.current = now
                    setCurrentColorIndex(prev => {
                        const next = (prev + 1) % COLORS.length
                        console.log('[DrawingCanvas] Color changed to', COLORS[next])
                        showSaved(`🎨 Color: ${COLORS[next]}`)
                        return next
                    })
                }
                lastDragPosRef.current = pos
                break
            }
        }
    }, [isDragging, drawAtPosition, saveUndoState, showSaved])

    const startCamera = useCallback(async () => {
        try {
            console.log('[DrawingCanvas] Starting webcam (640x480)')
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
                console.log('[DrawingCanvas] Webcam started')
            }
        } catch (err) {
            console.warn('[DrawingCanvas] Camera start failed:', err)
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        console.log('[DrawingCanvas] Stopping camera')
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
        setCameraOn(false)
        setHandDetected(false)
        handDetectedRef.current = false
        setPrediction(null)
        setFingerPos(null)
        setIsDragging(false)
        lastDragPosRef.current = null
        isPanningRef.current = false
        if (overlayCanvasRef.current) {
            const octx = overlayCanvasRef.current.getContext('2d')
            if (octx) octx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        }
        if (previewCanvasRef.current) {
            const pctx = previewCanvasRef.current.getContext('2d')
            if (pctx) pctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        }
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) stopCamera(); else startCamera()
    }, [cameraOn, startCamera, stopCamera])

    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])
    useEffect(() => { currentColorIndexRef.current = currentColorIndex }, [currentColorIndex])
    useEffect(() => { brushSizeRef.current = brushSize }, [brushSize])

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

    // Auto-start camera on mount
    useEffect(() => {
        startCamera()
    }, [])

    // Run detection loop whenever camera is on
    useEffect(() => {
        if (modelLoading) return
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (streamStateRef.current && videoRef.current && hiddenCanvasRef.current) {
                isPredictingRef.current = true
                let keypoints: any[] = []
                let elapsed = 0
                try {
                    const start = performance.now()
                    const ctx = hiddenCanvasRef.current.getContext('2d')
                    if (ctx) {
                        hiddenCanvasRef.current.width = CANVAS_WIDTH
                        hiddenCanvasRef.current.height = CANVAS_HEIGHT
                        ctx.drawImage(videoRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
                        try {
                            const rawKeypoints = await classifierRef.current.detectHand(hiddenCanvasRef.current)
                            // MediaPipe normalized landmarks scaled to pixels; default score to 1 so gating works
                            keypoints = rawKeypoints.map(kp => ({ ...kp, score: typeof kp.score === 'number' ? kp.score : 1 }))
                            if (keypoints.length > 0) {
                                handDetectionEverWorkedRef.current = true
                                if (modelErrorShownRef.current) {
                                    modelErrorShownRef.current = false
                                    setModelError(null)
                                }
                            }
                        } catch (detectErr) {
                            console.warn('[DrawingCanvas] detectHand error:', detectErr)
                            if (!handDetectionEverWorkedRef.current && !modelErrorShownRef.current) {
                                modelErrorShownRef.current = true
                                setModelError('MediaPipe GPU hand model failed to load. Check your internet connection and retry.')
                            }
                        }
                        elapsed = Math.round(performance.now() - start)
                    }

                    if (keypoints.length > 0) {
                        const wasDetected = handDetectedRef.current
                        if (!wasDetected) console.log('[DrawingCanvas] Hand detected —', keypoints.length, 'keypoints')
                        handDetectedRef.current = true
                        setHandDetected(true)
                        setInferenceTime(elapsed)
                        console.debug('[DrawingCanvas] detect:', elapsed + 'ms, ' + keypoints.length + 'kp')

                        // Smooth index fingertip position (landmark 8)
                        const indexTip = keypoints[8]
                        const indexTipOk = !!indexTip && (typeof indexTip.score !== 'number' || indexTip.score > 0.3)
                        if (indexTipOk) {
                            const sa = smoothingAlphaRef.current
                            if (smoothedIndexTipRef.current) {
                                smoothedIndexTipRef.current = {
                                    x: sa * indexTip.x + (1 - sa) * smoothedIndexTipRef.current.x,
                                    y: sa * indexTip.y + (1 - sa) * smoothedIndexTipRef.current.y,
                                }
                            } else {
                                smoothedIndexTipRef.current = { x: indexTip.x, y: indexTip.y }
                            }
                            console.debug('[DrawingCanvas] indexTip raw:', Math.round(indexTip.x) + ',' + Math.round(indexTip.y), '→ sm:', Math.round(smoothedIndexTipRef.current.x) + ',' + Math.round(smoothedIndexTipRef.current.y))
                        } else {
                            if (indexTip) {
                                // Fall back to raw tip position so pointer/drawing still work
                                smoothedIndexTipRef.current = { x: indexTip.x, y: indexTip.y }
                                console.debug('[DrawingCanvas] Index tip low confidence, using raw:', Math.round(indexTip.x) + ',' + Math.round(indexTip.y))
                            } else {
                                smoothedIndexTipRef.current = null
                            }
                        }

                        // Rule-based classification
                        let toolName = 'Draw'
                        try {
                            const features = classifierRef.current.extractFeatures(keypoints)
                            const result = classifyDrawErase(features)
                            const smoothedTool = stateMachineRef.current.update(result.label)
                            const labelToTool: Record<string, string> = {
                                'draw': 'Draw', 'erase': 'Erase', 'move': 'Move', 'color-select': 'Color Select',
                            }
                            toolName = labelToTool[smoothedTool] || 'Draw'
                        } catch (classifyErr) {
                            console.warn('[DrawingCanvas] Classification error:', classifyErr)
                        }
                        const prevTool = activeToolRef.current
                        if (prevTool !== toolName) console.log('[DrawingCanvas] Tool switch:', prevTool || '(none)', '→', toolName)
                        activeToolRef.current = toolName
                        setPrediction({ label: toolName, confidences: { [toolName]: 1 } })
                        setActiveTool(toolName)

                        // Draw overlay: skeleton + green finger pointer (aligned to mirrored webcam)
                        if (overlayCanvasRef.current && smoothedIndexTipRef.current) {
                            try {
                                overlayCanvasRef.current.width = CANVAS_WIDTH
                                overlayCanvasRef.current.height = CANVAS_HEIGHT
                                classifierRef.current.drawHand(overlayCanvasRef.current, keypoints, POINTER_COLOR, { readableLabels: true })
                                const octx = overlayCanvasRef.current.getContext('2d')
                                if (octx) {
                                    const raw = smoothedIndexTipRef.current
                                    const px = overlayCanvasRef.current.width - raw.x
                                    const py = raw.y
                                    const isErase = toolName === 'Erase'
                                    const color = isErase ? '#ef4444' : POINTER_COLOR
                                    const brushPx = BRUSH_SIZES[brushSizeRef.current]
                                    const ringRadius = isErase ? 24 : Math.max(10, brushPx * 1.8)
                                    octx.beginPath()
                                    octx.arc(px, py, ringRadius, 0, Math.PI * 2)
                                    octx.strokeStyle = color
                                    octx.lineWidth = isErase ? 4 : 3
                                    octx.shadowColor = color
                                    octx.shadowBlur = 20
                                    octx.stroke()
                                    if (isErase) {
                                        octx.beginPath()
                                        octx.arc(px, py, ringRadius - 2, 0, Math.PI * 2)
                                        octx.fillStyle = 'rgba(239,68,68,0.15)'
                                        octx.shadowBlur = 0
                                        octx.fill()
                                    }
                                    octx.beginPath()
                                    octx.arc(px, py, 3, 0, Math.PI * 2)
                                    octx.fillStyle = '#ffffff'
                                    octx.shadowColor = '#ffffff'
                                    octx.shadowBlur = 12
                                    octx.fill()
                                    octx.shadowBlur = 0
                                    const ch = Math.max(8, ringRadius * 0.6)
                                    octx.strokeStyle = 'rgba(255,255,255,0.7)'
                                    octx.lineWidth = 1
                                    octx.beginPath()
                                    octx.moveTo(px - ch, py)
                                    octx.lineTo(px - ringRadius * 0.5, py)
                                    octx.moveTo(px + ringRadius * 0.5, py)
                                    octx.lineTo(px + ch, py)
                                    octx.moveTo(px, py - ch)
                                    octx.lineTo(px, py - ringRadius * 0.5)
                                    octx.moveTo(px, py + ringRadius * 0.5)
                                    octx.lineTo(px, py + ch)
                                    octx.stroke()
                                    const toolEmoji = isErase ? '🧹' : (toolName === 'Color Select' ? '🎨' : (toolName === 'Move' ? '✋' : '✏️'))
                                    octx.font = 'bold 12px system-ui, sans-serif'
                                    octx.textAlign = 'center'
                                    const labelText = `${toolEmoji} ${toolName}`
                                    const tw = octx.measureText(labelText).width
                                    octx.fillStyle = 'rgba(0,0,0,0.65)'
                                    octx.beginPath()
                                    octx.roundRect(px - tw / 2 - 8, py - ringRadius - 27, tw + 16, 22, 6)
                                    octx.fill()
                                    octx.fillStyle = '#ffffff'
                                    octx.fillText(labelText, px, py - ringRadius - 13)
                                }
                            } catch (drawErr) {
                                console.warn('[DrawingCanvas] Overlay draw error:', drawErr)
                            }
                        }

                        handleToolAction(toolName, keypoints)
                    } else {
                        if (handDetectedRef.current) console.log('[DrawingCanvas] Hand lost')
                        handDetectedRef.current = false
                        setHandDetected(false)
                        smoothedIndexTipRef.current = null
                        setPrediction(null)
                        setActiveTool(null)
                        activeToolRef.current = null
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
                } catch (e) {
                    console.warn('[DrawingCanvas] Prediction error:', e)
                }
                isPredictingRef.current = false
            }
        }
        // Draw drawing preview on webcam (mirrored, semi-transparent)
        const drawPreview = () => {
            if (!previewCanvasRef.current || !drawingCanvasRef.current || !cameraOnRef.current) return
            previewCanvasRef.current.width = CANVAS_WIDTH
            previewCanvasRef.current.height = CANVAS_HEIGHT
            const pctx = previewCanvasRef.current.getContext('2d')
            if (!pctx) return
            pctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            pctx.save()
            pctx.scale(-1, 1)
            pctx.translate(-CANVAS_WIDTH, 0)
            pctx.globalAlpha = 0.5
            pctx.drawImage(drawingCanvasRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            pctx.globalAlpha = 1.0
            pctx.restore()
        }
        lastPredictTimeRef.current = performance.now()
        const tick = () => {
            drawPreview()
            const now = performance.now()
            if (now - lastPredictTimeRef.current >= PREDICT_THROTTLE_MS) {
                lastPredictTimeRef.current = now
                runPrediction()
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [stream, modelLoading, startCamera, confidenceThreshold, handleToolAction])

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* ALWAYS-ON DRAWING CANVAS */}
            <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                <div className="w-full flex flex-col items-center animate-fade-in">
                    <div className="text-center mb-1">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-500 mb-0">Virtual Drawing Canvas</h2>
                        <p className="text-xs text-gray-600">Show hand gestures to draw on the whiteboard!</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 flex-1 mt-3 min-h-0">
                    {/* LEFT: Webcam + Drawing Canvas stacked */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        {/* Webcam Feed */}
                        <div className="relative rounded-2xl overflow-hidden bg-[#0a0128] min-h-[240px] max-h-[320px]">
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain -scale-x-100 ${cameraOn ? 'block' : 'hidden'}`} />
                            <canvas ref={hiddenCanvasRef} className="hidden" />
                            <canvas ref={previewCanvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none -scale-x-100" />
                            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            {cameraOn && (
                                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-white text-[9px] font-bold">LIVE</span>
                                </div>
                            )}
                            {activeTool && (
                                <div className="absolute top-2 right-2 px-3 py-1.5 rounded-xl backdrop-blur-md text-white text-xs font-bold bg-emerald-500/85">
                                    <span className="mr-1">{TOOL_CONFIG[activeTool]?.emoji}</span>
                                    {activeTool}
                                </div>
                            )}
                            {modelError && (
                                <div className="absolute inset-x-2 bottom-2 px-3 py-2 bg-red-600/80 backdrop-blur-md rounded-xl text-white text-[10px] font-bold leading-relaxed z-10">
                                    ⚠️ {modelError}
                                    <button type="button" onClick={() => { setModelError(null); modelErrorShownRef.current = false }} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
                                </div>
                            )}
                            {!cameraOn && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl mb-3">🎨</span>
                                    <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                    <p className="text-white/50 text-[10px] mb-4">Start camera to draw with hand gestures</p>
                                    <button type="button" onClick={startCamera} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg border-none cursor-pointer">Turn On Camera</button>
                                </div>
                            )}
                        </div>

                        {/* Drawing Canvas (visible whiteboard) */}
                        <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 flex-1 min-h-[280px]">
                            <canvas
                                ref={drawingCanvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="w-full h-full object-contain block"
                            />
                            {fingerPos && handDetected && (
                                <div
                                    className="absolute pointer-events-none rounded-full border-2"
                                    style={{
                                        left: `${(fingerPos.x / CANVAS_WIDTH) * 100}%`,
                                        top: `${(fingerPos.y / CANVAS_HEIGHT) * 100}%`,
                                        width: activeTool === 'Erase' ? '24px' : '10px',
                                        height: activeTool === 'Erase' ? '24px' : '10px',
                                        transform: 'translate(-50%, -50%)',
                                        borderColor: activeTool === 'Erase' ? '#ef4444' : '#22c55e',
                                        background: activeTool === 'Erase' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.25)',
                                    }}
                                />
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-2 flex-wrap">
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

                    {/* RIGHT: Tools & Settings */}
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

                        {/* Smoothing Control */}
                        <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-700 mb-2">
                                Smoothing <span className="text-emerald-500">{Math.round(smoothingAlpha * 100)}%</span>
                            </p>
                            <input
                                type="range"
                                min="5"
                                max="80"
                                value={Math.round(smoothingAlpha * 100)}
                                onChange={e => { const v = Number(e.target.value) / 100; console.log('[DrawingCanvas] Smoothing:', Math.round(v * 100) + '%'); setSmoothingAlpha(v) }}
                                className="w-full accent-emerald-500 cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
                                <span>Smooth</span>
                                <span>Responsive</span>
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
        </div>
    )
}
