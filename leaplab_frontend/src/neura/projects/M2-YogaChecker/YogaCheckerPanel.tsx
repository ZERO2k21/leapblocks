import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { PoseClassifier, Keypoint } from '../../ml/classifiers/PoseClassifier'
import WorkflowIndicator from '../../ui/components/WorkflowIndicator'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import { HoldTimeBuffer } from '../../ml/utils/ruleBasedClassifiers'

interface YogaCheckerPanelProps {
    mode: UseNeuraProjectReturn
}

const YOGA_CLASSES = ['Tree Pose', 'Warrior Pose', 'Mountain Pose', 'Cobra Pose', "Child's Pose"]

const BODY_CONNECTIONS: [number, number][] = [
    [5, 6],
    [5, 7], [7, 9],
    [6, 8], [8, 10],
    [5, 11], [6, 12],
    [11, 12],
    [11, 13], [13, 15],
    [12, 14], [14, 16],
]

const SKELETON_COLOR = '#7C3AED'
const KEYPOINT_COLOR = '#A78BFA'
const ACCENT = '#06b6d4'

const MAX_HISTORY = 5
const PREDICT_INTERVAL_MS = 800
const HOLD_TIME_MS = 2000

export default function YogaCheckerPanel({ mode }: YogaCheckerPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new PoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const lastPredictTimeRef = useRef(0)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const holdTimeRef = useRef(new HoldTimeBuffer(HOLD_TIME_MS))

    const [isCapturing, setIsCapturing] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [poseDetected, setPoseDetected] = useState(false)
    const [captureStatus, setCaptureStatus] = useState<'idle' | 'detecting' | 'success' | 'no-pose' | 'error'>('idle')
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.5)
    const [poseHistory, setPoseHistory] = useState<string[]>([])
    const [detectionCount, setDetectionCount] = useState(0)
    const [currentKeypoints, setCurrentKeypoints] = useState<Keypoint[]>([])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            streamRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
        } catch (err) {
            console.error('[YogaChecker] Camera access denied:', err)
            setCameraError('Camera access is needed for pose detection.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
        setCameraOn(false)
        setPoseDetected(false)
        setPrediction(null)
        setCurrentKeypoints([])
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
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
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
                        for (const sample of cls.samples) {
                            try {
                                const keypoints = JSON.parse(sample.data)
                                await classifierRef.current.addSampleFromKeypoints(keypoints, cls.name)
                            } catch { /* skip */ }
                        }
                    }
                }
                if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode, mode.project])

    const drawSkeletonOverlay = useCallback((keypoints: Keypoint[]) => {
        const canvas = overlayCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const displayW = canvas.clientWidth || 640
        const displayH = canvas.clientHeight || 480
        canvas.width = displayW
        canvas.height = displayH

        ctx.clearRect(0, 0, displayW, displayH)

        const scaleX = displayW / 640
        const scaleY = displayH / 480

        ctx.strokeStyle = SKELETON_COLOR
        ctx.lineWidth = 3
        ctx.shadowColor = 'rgba(124, 58, 237, 0.5)'
        ctx.shadowBlur = 8

        for (const [i, j] of BODY_CONNECTIONS) {
            if (keypoints[i] && keypoints[j] && keypoints[i].score > 0.3 && keypoints[j].score > 0.3) {
                ctx.beginPath()
                ctx.moveTo(keypoints[i].x * scaleX, keypoints[i].y * scaleY)
                ctx.lineTo(keypoints[j].x * scaleX, keypoints[j].y * scaleY)
                ctx.stroke()
            }
        }

        ctx.shadowBlur = 0
        for (const kp of keypoints) {
            if (kp.score > 0.3) {
                ctx.beginPath()
                ctx.arc(kp.x * scaleX, kp.y * scaleY, 5, 0, 2 * Math.PI)
                ctx.fillStyle = KEYPOINT_COLOR
                ctx.fill()
                ctx.strokeStyle = '#fff'
                ctx.lineWidth = 2
                ctx.stroke()
            }
        }
    }, [])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (streamStateRef.current && videoRef.current && canvasRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const start = performance.now()
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        canvasRef.current.width = 640
                        canvasRef.current.height = 480
                        ctx.drawImage(videoRef.current, 0, 0, 640, 480)

                        const keypoints = await classifierRef.current.detectPose(canvasRef.current)
                        setCurrentKeypoints(keypoints)
                        drawSkeletonOverlay(keypoints)

                        // Use PoseClassifier's new 61-d features with angle-based features
                        const features = new Float32Array(61)
                        if (keypoints.length > 0) {
                            const validKps = keypoints.filter(kp => kp.score > 0.3)
                            if (validKps.length > 0) {
                                const minX = Math.min(...validKps.map(kp => kp.x))
                                const maxX = Math.max(...validKps.map(kp => kp.x))
                                const minY = Math.min(...validKps.map(kp => kp.y))
                                const maxY = Math.max(...validKps.map(kp => kp.y))
                                const rangeX = maxX - minX || 1
                                const rangeY = maxY - minY || 1
                                for (let i = 0; i < keypoints.length && i < 17; i++) {
                                    features[i * 3] = (keypoints[i].x - minX) / rangeX
                                    features[i * 3 + 1] = (keypoints[i].y - minY) / rangeY
                                    features[i * 3 + 2] = keypoints[i].score
                                }
                                // Add angle features (indices 51-60)
                                const kp = (i: number) => ({ x: keypoints[i].x, y: keypoints[i].y })
                                const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
                                const calcAngle = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
                                    const ab = { x: a.x - b.x, y: a.y - b.y }
                                    const bc = { x: c.x - b.x, y: c.y - b.y }
                                    const dot = ab.x * bc.x + ab.y * bc.y
                                    const cross = ab.x * bc.y - ab.y * bc.x
                                    return Math.round(Math.atan2(Math.abs(cross), dot) * (180 / Math.PI))
                                }
                                const normalizeAngle = (deg: number) => Math.max(0, Math.min(1, deg / 180))
                                
                                const shoulderMid = midpoint(kp(5), kp(6))
                                const hipMid = midpoint(kp(11), kp(12))
                                
                                features[51] = normalizeAngle(calcAngle(kp(11), kp(13), kp(15)))
                                features[52] = normalizeAngle(calcAngle(kp(12), kp(14), kp(16)))
                                features[53] = normalizeAngle(calcAngle(kp(5), kp(7), kp(9)))
                                features[54] = normalizeAngle(calcAngle(kp(6), kp(8), kp(10)))
                                features[55] = normalizeAngle(Math.abs(Math.atan2(kp(6).y - kp(5).y, kp(6).x - kp(5).x) * (180 / Math.PI)))
                                features[56] = normalizeAngle(Math.abs(Math.atan2(kp(12).y - kp(11).y, kp(12).x - kp(11).x) * (180 / Math.PI)))
                                features[57] = normalizeAngle(Math.abs(Math.atan2(hipMid.y - shoulderMid.y, hipMid.x - shoulderMid.x) * (180 / Math.PI)))
                                features[58] = normalizeAngle(calcAngle(kp(0), shoulderMid, hipMid))
                                features[59] = normalizeAngle(calcAngle(kp(7), kp(5), kp(11)))
                                features[60] = normalizeAngle(calcAngle(kp(8), kp(6), kp(12)))
                            }
                        }

                        const result = await classifierRef.current.predict(features, 5)
                        const elapsed = Math.round(performance.now() - start)

                        if (keypoints.length > 0 && keypoints.some(kp => kp.score > 0.3)) {
                            setPoseDetected(true)
                            setDetectionCount(prev => prev + 1)
                        } else {
                            setPoseDetected(false)
                        }

                        if (result && result.confidences[result.label] >= confidenceThreshold) {
                            // Apply hold-time buffer: only register pose if held for 2 seconds
                            const heldPose = holdTimeRef.current.update(result.label)
                            if (heldPose) {
                                setPrediction(result)
                                setInferenceTime(elapsed)
                                setPoseHistory(prev => {
                                    const next = [...prev, result.label]
                                    return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
                                })
                            }
                        } else {
                            setPrediction(null)
                            holdTimeRef.current.clear()
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
            if (now - lastPredictTimeRef.current >= PREDICT_INTERVAL_MS) {
                lastPredictTimeRef.current = now
                runPrediction()
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [mode.mode, stream, modelLoading, startCamera, confidenceThreshold, drawSkeletonOverlay])

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
            const keypoints = await classifierRef.current.detectPose(tempCanvas)
            if (keypoints && keypoints.length > 0 && keypoints.some(kp => kp.score > 0.3)) {
                const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(keypoints) })
                if (!added) {
                    showSaved('Sample limit reached!')
                    setCaptureStatus('idle')
                    setIsCapturing(false)
                    return
                }
                classifierRef.current.addSampleFromKeypoints(keypoints, mode.getSelectedClass()?.name || '').catch(() => {})
                setCaptureStatus('success')
                showSaved(`Saved to ${mode.getSelectedClass()?.name}!`)
            } else {
                setCaptureStatus('no-pose')
                showSaved('No pose detected!')
            }
        } catch (err) {
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
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-0 text-cyan-500">Yoga Pose Checker!</h2>
                            <p className="text-xs text-[#4a4455]">Strike a yoga pose and teach the AI!</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 mt-3">
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="relative rounded-2xl overflow-hidden bg-[#0a0128] flex-1 min-h-[300px]">
                                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain -scale-x-100 ${cameraOn ? 'block' : 'hidden'}`} />
                                <canvas ref={canvasRef} className="hidden" />
                                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100" />
                                {cameraOn && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-white text-[9px] font-bold">LIVE</span>
                                    </div>
                                )}
                                {captureStatus === 'success' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                                        <span className="text-6xl">✓</span>
                                    </div>
                                )}
                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">🧘</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to collect yoga pose samples</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg bg-cyan-500 hover:bg-cyan-600 transition-colors">Turn On Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-cyan-500 text-cyan-500 bg-white hover:bg-cyan-50 transition-colors">
                                    {cameraOn ? 'Stop' : 'Start'}
                                </button>
                                <button
                                    onClick={handleCapture}
                                    disabled={!cameraOn || isCapturing || !selectedClass}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors disabled:opacity-40 ${isCapturing ? 'bg-slate-400' : 'bg-cyan-500 hover:bg-cyan-600'}`}
                                >
                                    {isCapturing ? '...' : 'Capture Pose'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            <div className="rounded-xl p-3 border bg-cyan-50 border-cyan-500/20">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 text-cyan-500">Yoga Poses</p>
                                <div className="flex flex-col gap-1">
                                    {YOGA_CLASSES.map(pose => (
                                        <span key={pose} className="text-[9px] text-gray-600">• {pose}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl p-3 border bg-cyan-50 border-cyan-500/20">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 text-cyan-500">Tips</p>
                                <div className="flex flex-col gap-1">
                                    {['Full body visible in frame', 'Good lighting for accuracy', 'Use a clear background', 'Try different angles'].map(tip => (
                                        <span key={tip} className="text-[9px] text-gray-600">• {tip}</span>
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

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl p-2.5 border bg-cyan-50 border-cyan-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Total</p>
                                    <p className="text-lg font-extrabold text-cyan-500">{mode.getTotalSamples()}</p>
                                </div>
                                <div className="rounded-xl p-2.5 border bg-cyan-50 border-cyan-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Classes</p>
                                    <p className="text-lg font-extrabold text-cyan-500">{mode.project?.classes.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-extrabold mb-2 text-cyan-500">Training Yoga AI!</h2>
                        <p className="text-sm text-gray-500">Teaching the AI to recognize yoga poses...</p>
                    </div>
                    {modelLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-cyan-500">Loading model...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-6xl">✓</span>
                            <p className="text-sm font-bold text-green-600">Model Ready!</p>
                            <button onClick={() => mode.setMode('test')} className="px-6 py-3 text-white rounded-xl text-sm font-bold shadow-lg bg-cyan-500 hover:bg-cyan-600 transition-colors">
                                Start Testing
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
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-0 text-cyan-500">Test Your Yoga AI!</h2>
                            <p className="text-xs text-[#4a4455]">Strike a pose and see if the AI recognizes it!</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 mt-3">
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="relative rounded-2xl overflow-hidden bg-[#0a0128] flex-1 min-h-[300px]">
                                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain -scale-x-100 ${cameraOn ? 'block' : 'hidden'}`} />
                                <canvas ref={canvasRef} className="hidden" />
                                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100" />
                                {cameraOn && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-white text-[9px] font-bold">LIVE</span>
                                    </div>
                                )}
                                {prediction && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-fade-in px-8 py-4 rounded-2xl backdrop-blur-md bg-black/60">
                                            <span className="text-5xl font-black text-white">{prediction.label}</span>
                                            <span className="block text-xl font-bold text-white/80 mt-1">
                                                {Math.round(prediction.confidences[prediction.label] * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">📷</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to test yoga poses</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg bg-cyan-500 hover:bg-cyan-600 transition-colors">Start Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-cyan-500 text-cyan-500 bg-white hover:bg-cyan-50 transition-colors">
                                    {cameraOn ? 'Stop Camera' : 'Start Camera'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Confidence Threshold */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Confidence</span>
                                    <span className="text-xs font-extrabold bg-white px-2 py-0.5 rounded-md text-cyan-500">{Math.round(confidenceThreshold * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round(confidenceThreshold * 100)}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-500 bg-slate-200"
                                />
                            </div>

                            {/* Current Pose */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Pose</p>
                                <div className={`text-4xl font-black ${prediction ? 'text-cyan-500' : 'text-slate-400'}`}>
                                    {prediction ? prediction.label : '—'}
                                </div>
                                {prediction && (
                                    <p className="text-xs font-bold text-gray-500 mt-1">
                                        {Math.round(prediction.confidences[prediction.label] * 100)}% confidence
                                    </p>
                                )}
                            </div>

                            {/* Speed & Pose Detection */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl p-2.5 border bg-cyan-50 border-cyan-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Speed</p>
                                    <p className="text-lg font-extrabold text-gray-800">{inferenceTime}ms</p>
                                </div>
                                <div className="rounded-xl p-2.5 border bg-cyan-50 border-cyan-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Pose</p>
                                    <p className={`text-lg font-extrabold ${poseDetected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {poseDetected ? 'Found' : 'None'}
                                    </p>
                                </div>
                            </div>

                            {/* Pose History */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Pose History</span>
                                    <span className="text-[9px] font-bold text-cyan-500">{detectionCount} detected</span>
                                </div>
                                {poseHistory.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {poseHistory.map((pose, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white bg-cyan-500">
                                                {pose}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-gray-400">No poses detected yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
