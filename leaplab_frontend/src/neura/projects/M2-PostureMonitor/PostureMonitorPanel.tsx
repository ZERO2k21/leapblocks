import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { PoseClassifier, Keypoint } from '../../ml/classifiers/PoseClassifier'
import WorkflowIndicator from '../../ui/components/WorkflowIndicator'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import ClassScores from '../../ui/components/ClassScores'
import SampleWarningModal from '../../ui/components/SampleWarningModal'
import { classifyPosture } from '../../ml/utils/ruleBasedClassifiers'

interface PostureMonitorPanelProps {
    mode: UseNeuraProjectReturn
}

const POSTURE_CLASSES = ['Good Posture', 'Bad Posture', 'Leaning Left', 'Leaning Right']

const BODY_CONNECTIONS: [number, number][] = [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12],
    [11, 13], [13, 15], [12, 14], [14, 16],
]

const SKELETON_COLOR = '#6366f1'
const KEYPOINT_COLOR = '#818cf8'
const ACCENT = '#6366f1'
const ACCENT_LIGHT = '#eef2ff'

const PREDICT_INTERVAL_MS = 1000
const BAD_POSTURE_THRESHOLD = 3
const BREAK_REMINDER_MS = 30 * 60 * 1000

type PostureState = 'Good Posture' | 'Bad Posture' | 'Leaning Left' | 'Leaning Right' | null

const POSTURE_CONFIG: Record<string, { emoji: string; color: string; bgColor: string }> = {
    'Good Posture': { emoji: '✅', color: '#10b981', bgColor: '#ecfdf5' },
    'Bad Posture': { emoji: '⚠️', color: '#ef4444', bgColor: '#fef2f2' },
    'Leaning Left': { emoji: '⬅️', color: '#f59e0b', bgColor: '#fffbeb' },
    'Leaning Right': { emoji: '➡️', color: '#f59e0b', bgColor: '#fffbeb' },
}

export default function PostureMonitorPanel({ mode }: PostureMonitorPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new PoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const testCameraStartedRef = useRef(false)
    const lastPredictTimeRef = useRef(0)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const breakTimerRef = useRef<NodeJS.Timeout | null>(null)
    const sessionStartRef = useRef<number>(Date.now())

    const [isCapturing, setIsCapturing] = useState(false)
    const [captureFps, setCaptureFps] = useState(15)
    const burstIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const handleCaptureRef = useRef<() => Promise<void>>(null)
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
    const [currentKeypoints, setCurrentKeypoints] = useState<Keypoint[]>([])
    const [detectionCount, setDetectionCount] = useState(0)

    const [postureState, setPostureState] = useState<PostureState>(null)
    const [consecutiveBadCount, setConsecutiveBadCount] = useState(0)
    const [showBadPostureAlert, setShowBadPostureAlert] = useState(false)
    const [showBreakReminder, setShowBreakReminder] = useState(false)
    const [goodCount, setGoodCount] = useState(0)
    const [badCount, setBadCount] = useState(0)
    const [leftCount, setLeftCount] = useState(0)
    const [rightCount, setRightCount] = useState(0)
    const [sessionDuration, setSessionDuration] = useState(0)
    const consecutiveBadRef = useRef(0)

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
            console.error('[PostureMonitor] Camera access denied:', err)
            setCameraError('Camera access is needed for posture monitoring.')
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
        setPostureState(null)
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
            if (breakTimerRef.current) clearTimeout(breakTimerRef.current)
        }
    }, [])

    useEffect(() => {
        if (mode.mode !== 'collect' && mode.mode !== 'test') stopCamera()
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode === 'train' || mode.mode === 'test') {
            setModelLoading(false)
        }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test') {
            sessionStartRef.current = Date.now()
            setGoodCount(0)
            setBadCount(0)
            setLeftCount(0)
            setRightCount(0)
            setConsecutiveBadCount(0)
            consecutiveBadRef.current = 0
            setShowBadPostureAlert(false)
            setShowBreakReminder(false)
            if (breakTimerRef.current) clearTimeout(breakTimerRef.current)
        }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode === 'test') {
            const interval = setInterval(() => {
                setSessionDuration(Math.floor((Date.now() - sessionStartRef.current) / 1000))
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode === 'test' && !breakTimerRef.current) {
            breakTimerRef.current = setTimeout(() => {
                setShowBreakReminder(true)
            }, BREAK_REMINDER_MS)
            return () => {
                if (breakTimerRef.current) clearTimeout(breakTimerRef.current)
                breakTimerRef.current = null
            }
        }
    }, [mode.mode])

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
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)'
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
        // Camera starts OFF in test mode — user chooses to turn on camera
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
                        const elapsed = Math.round(performance.now() - start)

                        setCurrentKeypoints(keypoints)
                        drawSkeletonOverlay(keypoints)

                        if (keypoints.length > 0 && keypoints.some(kp => kp.score > 0.3)) {
                            setPoseDetected(true)
                            setDetectionCount(prev => prev + 1)
                            
                            // Use PoseClassifier's new 61-d features with angle-based features
                            const features = new Float32Array(61)
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
                            
                            // Rule-based classification for posture
                            const postureResult = classifyPosture(features)
                            const postureLabel = postureResult.label === 'good' ? 'Good Posture' : 
                                                 postureResult.label === 'slouching' ? 'Bad Posture' :
                                                 postureResult.label === 'leaning_left' ? 'Leaning Left' : 'Leaning Right'
                            
                            const confidences: Record<string, number> = {
                                'Good Posture': postureResult.label === 'good' ? 0.9 : 0.1,
                                'Bad Posture': postureResult.label === 'slouching' ? 0.9 : 0.1,
                                'Leaning Left': postureResult.label === 'leaning_left' ? 0.9 : 0.1,
                                'Leaning Right': postureResult.label === 'leaning_right' ? 0.9 : 0.1,
                            }
                            const result = { label: postureLabel, confidences }
                            
                            setPrediction(result)
                            setInferenceTime(elapsed)
                            const newPosture = result.label as PostureState
                            setPostureState(newPosture)

                            if (newPosture === 'Good Posture') {
                                setGoodCount(prev => prev + 1)
                                consecutiveBadRef.current = 0
                                setConsecutiveBadCount(0)
                                setShowBadPostureAlert(false)
                            } else if (newPosture === 'Bad Posture') {
                                setBadCount(prev => prev + 1)
                                consecutiveBadRef.current += 1
                                setConsecutiveBadCount(consecutiveBadRef.current)
                                if (consecutiveBadRef.current >= BAD_POSTURE_THRESHOLD) {
                                    setShowBadPostureAlert(true)
                                }
                            } else if (newPosture === 'Leaning Left') {
                                setLeftCount(prev => prev + 1)
                                consecutiveBadRef.current = 0
                                setConsecutiveBadCount(0)
                            } else if (newPosture === 'Leaning Right') {
                                setRightCount(prev => prev + 1)
                                consecutiveBadRef.current = 0
                                setConsecutiveBadCount(0)
                            }
                        } else {
                            setPoseDetected(false)
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
    }, [mode.mode, stream, modelLoading, startCamera, drawSkeletonOverlay])

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

    handleCaptureRef.current = handleCapture

    const startBurstCapture = useCallback(() => {
        if (!mode.selectedClassId || !cameraOn) return
        burstIntervalRef.current = setInterval(() => {
            handleCaptureRef.current?.()
        }, 1000 / captureFps)
    }, [captureFps, mode.selectedClassId, cameraOn])

    const stopBurstCapture = useCallback(() => {
        if (burstIntervalRef.current) {
            clearInterval(burstIntervalRef.current)
            burstIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => { stopBurstCapture() }
    }, [])

    const resetSession = useCallback(() => {
        setGoodCount(0)
        setBadCount(0)
        setLeftCount(0)
        setRightCount(0)
        setConsecutiveBadCount(0)
        consecutiveBadRef.current = 0
        setShowBadPostureAlert(false)
        setShowBreakReminder(false)
        sessionStartRef.current = Date.now()
        setSessionDuration(0)
        setPostureState(null)
        setPrediction(null)
        if (breakTimerRef.current) clearTimeout(breakTimerRef.current)
        breakTimerRef.current = setTimeout(() => {
            setShowBreakReminder(true)
        }, BREAK_REMINDER_MS)
        showSaved('Session reset!')
    }, [showSaved])

    const dismissBreakReminder = useCallback(() => {
        setShowBreakReminder(false)
        breakTimerRef.current = setTimeout(() => {
            setShowBreakReminder(true)
        }, BREAK_REMINDER_MS)
    }, [])

    const dismissBadPostureAlert = useCallback(() => {
        setShowBadPostureAlert(false)
        consecutiveBadRef.current = 0
        setConsecutiveBadCount(0)
    }, [])

    const canTrain = !!(mode.project && mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2))
    const selectedClass = mode.getSelectedClass()
    const totalReadings = goodCount + badCount + leftCount + rightCount
    const postureScore = totalReadings > 0 ? Math.round((goodCount / totalReadings) * 100) : 0
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}m ${s}s`
    }

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {showBadPostureAlert && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>Bad posture detected! Please sit up straight.</span>
                    <button onClick={dismissBadPostureAlert} className="ml-2 px-2 py-0.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">✕</button>
                </div>
            )}

            {showBreakReminder && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in flex items-center gap-2">
                    <span className="text-lg">☕</span>
                    <span>Time for a break! You've been sitting for 30 minutes.</span>
                    <button onClick={dismissBreakReminder} className="ml-2 px-2 py-0.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">✕</button>
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-0 text-indigo-600">Posture Monitor!</h2>
                            <p className="text-xs text-[#4a4455]">Teach the AI to recognize sitting postures!</p>
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
                                        <span className="text-5xl mb-3">🪑</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to collect posture samples</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-colors">Turn On Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-600 text-indigo-600 bg-white hover:bg-indigo-50 transition-colors">
                                    {cameraOn ? 'Stop' : 'Start'}
                                </button>
                                <div className="flex items-center gap-1 py-1 px-2 bg-gray-50 rounded-lg">
                                    <span className="text-[9px] font-bold text-gray-500">FPS</span>
                                    <input
                                        type="range"
                                        min={5}
                                        max={30}
                                        step={1}
                                        value={captureFps}
                                        onChange={(e) => setCaptureFps(Number(e.target.value))}
                                        className="w-12 h-1 accent-indigo-600"
                                    />
                                    <span className="text-[10px] font-bold text-indigo-600 w-4 text-center">{captureFps}</span>
                                </div>
                                <button
                                    onClick={handleCapture}
                                    onMouseDown={startBurstCapture}
                                    onMouseUp={stopBurstCapture}
                                    onMouseLeave={stopBurstCapture}
                                    onTouchStart={startBurstCapture}
                                    onTouchEnd={stopBurstCapture}
                                    disabled={!cameraOn || isCapturing || !selectedClass}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors disabled:opacity-40 ${isCapturing ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    {isCapturing ? '⏳ Recording...' : '📸 Hold to Record'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            <div className="rounded-xl p-3 border bg-indigo-50 border-indigo-500/20">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 text-indigo-600">Posture Types</p>
                                <div className="flex flex-col gap-1">
                                    {POSTURE_CLASSES.map(posture => (
                                        <span key={posture} className="text-[9px] text-gray-600 flex items-center gap-1.5">
                                            <span>{POSTURE_CONFIG[posture]?.emoji}</span>
                                            {posture}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl p-3 border bg-indigo-50 border-indigo-500/20">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 text-indigo-600">Tips</p>
                                <div className="flex flex-col gap-1">
                                    {['Sit facing the camera', 'Keep back straight for good posture', 'Slouch for bad posture samples', 'Lean left/right for leaning samples'].map(tip => (
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
                                <div className="rounded-xl p-2.5 border bg-indigo-50 border-indigo-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Total</p>
                                    <p className="text-lg font-extrabold text-indigo-600">{mode.getTotalSamples()}</p>
                                </div>
                                <div className="rounded-xl p-2.5 border bg-indigo-50 border-indigo-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Classes</p>
                                    <p className="text-lg font-extrabold text-indigo-600">{mode.project?.classes.length || 0}</p>
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
                        <h2 className="text-2xl font-extrabold mb-2 text-indigo-600">Training Posture AI!</h2>
                        <p className="text-sm text-gray-500">Teaching the AI to recognize sitting postures...</p>
                    </div>
                    {modelLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-indigo-600">Loading model...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-6xl">✓</span>
                            <p className="text-sm font-bold text-green-600">Model Ready!</p>
                            <button onClick={() => mode.setMode('test')} className="px-6 py-3 text-white rounded-xl text-sm font-bold shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-colors">
                                Start Monitoring
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
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-0 text-indigo-600">Posture Monitoring</h2>
                            <p className="text-xs text-[#4a4455]">Sit properly and get real-time feedback!</p>
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
                                {postureState && POSTURE_CONFIG[postureState] && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-fade-in px-8 py-4 rounded-2xl flex flex-col items-center backdrop-blur-md bg-black/60">
                                            <span className="text-5xl mb-1">{POSTURE_CONFIG[postureState].emoji}</span>
                                            <span className="text-3xl font-black text-white">{postureState}</span>
                                        </div>
                                    </div>
                                )}
                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">🪑</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to monitor posture</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-colors">Start Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-600 text-indigo-600 bg-white hover:bg-indigo-50 transition-colors">
                                    {cameraOn ? 'Stop Camera' : 'Start Camera'}
                                </button>
                                <button onClick={resetSession} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors">
                                    Reset Session
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Current Posture Indicator */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Posture</p>
                                <div className="text-5xl mb-1">{postureState && POSTURE_CONFIG[postureState] ? POSTURE_CONFIG[postureState].emoji : '🪑'}</div>
                                <div className={`text-lg font-black ${postureState && POSTURE_CONFIG[postureState] ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {postureState || 'Waiting...'}
                                </div>
                                {prediction && (
                                    <p className="text-xs font-bold text-gray-500 mt-1">
                                        {Math.round(prediction.confidences[prediction.label] * 100)}% confidence
                                    </p>
                                )}
                            </div>

                            {/* All Class Scores */}
                            {prediction && (
                                <ClassScores confidences={prediction.confidences} accentColor="#4f46e5" accentBg="#eef2ff" />
                            )}

                            {/* Posture Score */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Posture Score</span>
                                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                                        postureScore >= 70 ? 'text-emerald-600 bg-emerald-50' : postureScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
                                    }`}>
                                        {postureScore}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            postureScore >= 70 ? 'bg-emerald-500' : postureScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${postureScore}%` }}
                                    />
                                </div>
                            </div>

                            {/* Session Stats */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">Session Stats</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2 rounded-lg bg-emerald-50">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase">Good</p>
                                        <p className="text-lg font-extrabold text-green-600">{goodCount}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-red-50">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase">Bad</p>
                                        <p className="text-lg font-extrabold text-red-600">{badCount}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-amber-50">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase">Left</p>
                                        <p className="text-lg font-extrabold text-amber-600">{leftCount}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-amber-50">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase">Right</p>
                                        <p className="text-lg font-extrabold text-amber-600">{rightCount}</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 font-bold">
                                    <span>Total: {totalReadings} readings</span>
                                    <span>⏱ {formatDuration(sessionDuration)}</span>
                                </div>
                            </div>

                            {/* Confidence Threshold */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Confidence</span>
                                    <span className="text-xs font-extrabold bg-white px-2 py-0.5 rounded-md text-indigo-600">{Math.round(confidenceThreshold * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round(confidenceThreshold * 100)}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-600 bg-slate-200"
                                />
                            </div>

                            {/* Speed & Pose Detection */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl p-2.5 border bg-indigo-50 border-indigo-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Speed</p>
                                    <p className="text-lg font-extrabold text-gray-800">{inferenceTime}ms</p>
                                </div>
                                <div className="rounded-xl p-2.5 border bg-indigo-50 border-indigo-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Pose</p>
                                    <p className={`text-lg font-extrabold ${poseDetected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {poseDetected ? 'Found' : 'None'}
                                    </p>
                                </div>
                            </div>

                            {/* Consecutive Bad Count */}
                            {consecutiveBadCount > 0 && (
                                <div className="rounded-xl p-3 border bg-red-50 border-red-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-red-600">Consecutive Bad</span>
                                        <span className="text-sm font-extrabold text-red-600">{consecutiveBadCount}/{BAD_POSTURE_THRESHOLD}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-red-200 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${(consecutiveBadCount / BAD_POSTURE_THRESHOLD) * 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {mode.mode === 'collect' && mode.project && (
                <SampleWarningModal
                    classes={mode.project.classes}
                    accentColor="#4f46e5"
                    accentBg="#eef2ff"
                    projectType="posture monitor"
                />
            )}
        </div>
    )
}
