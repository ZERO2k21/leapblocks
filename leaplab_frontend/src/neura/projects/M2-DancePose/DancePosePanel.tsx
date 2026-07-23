import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { PoseClassifier, Keypoint } from '../../ml/classifiers/PoseClassifier'
import WorkflowIndicator from '../../ui/components/WorkflowIndicator'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import { MajorityVoteBuffer } from '../../ml/utils/ruleBasedClassifiers'

interface DancePosePanelProps {
    mode: UseNeuraProjectReturn
}

const DANCE_CLASSES = ['Pose 1', 'Pose 2', 'Pose 3', 'Pose 4']

const BODY_CONNECTIONS: [number, number][] = [
    [5, 6],
    [5, 7], [7, 9],
    [6, 8], [8, 10],
    [5, 11], [6, 12],
    [11, 12],
    [11, 13], [13, 15],
    [12, 14], [14, 16],
]

const ACCENT = '#ec4899'
const SKELETON_COLOR = '#ec4899'
const KEYPOINT_COLOR = '#f472b6'
const POSE_COLORS: Record<string, string> = {
    'Pose 1': '#ec4899',
    'Pose 2': '#8b5cf6',
    'Pose 3': '#06b6d4',
    'Pose 4': '#f59e0b',
}

const MAX_HISTORY = 10
const PREDICT_INTERVAL_MS = 600

export default function DancePosePanel({ mode }: DancePosePanelProps) {
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
    const majorityVoteRef = useRef(new MajorityVoteBuffer(3))

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
    const [correctDetections, setCorrectDetections] = useState(0)
    const [totalDetections, setTotalDetections] = useState(0)
    const [currentKeypoints, setCurrentKeypoints] = useState<Keypoint[]>([])
    const [sequencePhase, setSequencePhase] = useState<'idle' | 'tracking' | 'paused'>('idle')

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
            console.error('[DancePose] Camera access denied:', err)
            setCameraError('Camera access is needed for dance pose detection.')
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
        ctx.shadowColor = 'rgba(236, 72, 153, 0.5)'
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

                        const result = await classifierRef.current.predictFromImage(canvasRef.current, 5)
                        const keypoints = await classifierRef.current.detectPose(canvasRef.current)
                        const elapsed = Math.round(performance.now() - start)

                        setCurrentKeypoints(keypoints)
                        drawSkeletonOverlay(keypoints)

                        if (keypoints.length > 0 && keypoints.some(kp => kp.score > 0.3)) {
                            setPoseDetected(true)
                            setDetectionCount(prev => prev + 1)
                            if (sequencePhase === 'idle') setSequencePhase('tracking')
                        } else {
                            setPoseDetected(false)
                        }

                        if (result && result.confidences[result.label] >= confidenceThreshold) {
                            // Apply majority vote smoothing
                            const smoothedLabel = majorityVoteRef.current.add(result.label)
                            const smoothedResult = { ...result, label: smoothedLabel }
                            setPrediction(smoothedResult)
                            setInferenceTime(elapsed)
                            setPoseHistory(prev => {
                                const next = [...prev, smoothedLabel]
                                return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
                            })
                            setTotalDetections(prev => prev + 1)
                            setCorrectDetections(prev => prev + 1)
                        } else {
                            setPrediction(null)
                            majorityVoteRef.current.clear()
                            if (keypoints.length > 0) {
                                setTotalDetections(prev => prev + 1)
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
            if (now - lastPredictTimeRef.current >= PREDICT_INTERVAL_MS) {
                lastPredictTimeRef.current = now
                runPrediction()
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [mode.mode, stream, modelLoading, startCamera, confidenceThreshold, drawSkeletonOverlay, sequencePhase])

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

    const handleResetSequence = useCallback(() => {
        setPoseHistory([])
        setTotalDetections(0)
        setCorrectDetections(0)
        setSequencePhase('idle')
        showSaved('Sequence reset!')
    }, [showSaved])

    const accuracyScore = totalDetections > 0
        ? Math.round((correctDetections / totalDetections) * 100)
        : 0

    const canTrain = !!(mode.project && mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2))
    const selectedClass = mode.getSelectedClass()

    const getPoseColor = (label: string) => POSE_COLORS[label] || ACCENT

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-pink-500 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-0 text-pink-500">Dance Pose Recognition</h2>
                            <p className="text-xs text-[#4a4455]">Strike a dance pose and teach the AI!</p>
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
                                        <span className="text-5xl mb-3">💃</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to collect dance pose samples</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg bg-pink-500 hover:bg-pink-600 transition-colors">Turn On Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-pink-500 text-pink-500 bg-white hover:bg-pink-50 transition-colors">
                                    {cameraOn ? 'Stop' : 'Start'}
                                </button>
                                <button
                                    onClick={handleCapture}
                                    disabled={!cameraOn || isCapturing || !selectedClass}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors disabled:opacity-40 ${isCapturing ? 'bg-slate-400' : 'bg-pink-500 hover:bg-pink-600'}`}
                                >
                                    {isCapturing ? '...' : 'Capture Pose'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            <div className="rounded-xl p-3 border bg-pink-50 border-pink-500/20">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 text-pink-500">Dance Poses</p>
                                <div className="flex flex-col gap-1">
                                    {DANCE_CLASSES.map(pose => (
                                        <div key={pose} className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: getPoseColor(pose) }} />
                                            <span className="text-[9px] text-gray-600">{pose}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl p-3 border bg-pink-50 border-pink-500/20">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 text-pink-500">Tips</p>
                                <div className="flex flex-col gap-1">
                                    {['Full body visible in frame', 'Dynamic dance movements', 'Good lighting for accuracy', 'Hold poses for 1-2 seconds'].map(tip => (
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
                                <div className="rounded-xl p-2.5 border bg-pink-50 border-pink-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Total</p>
                                    <p className="text-lg font-extrabold text-pink-500">{mode.getTotalSamples()}</p>
                                </div>
                                <div className="rounded-xl p-2.5 border bg-pink-50 border-pink-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Classes</p>
                                    <p className="text-lg font-extrabold text-pink-500">{mode.project?.classes.length || 0}</p>
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
                        <h2 className="text-2xl font-extrabold mb-2 text-pink-500">Training Dance AI!</h2>
                        <p className="text-sm text-gray-500">Teaching the AI to recognize dance poses...</p>
                    </div>
                    {modelLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-pink-500">Loading model...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-6xl">✓</span>
                            <p className="text-sm font-bold text-green-600">Model Ready!</p>
                            <button onClick={() => mode.setMode('test')} className="px-6 py-3 text-white rounded-xl text-sm font-bold shadow-lg bg-pink-500 hover:bg-pink-600 transition-colors">
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
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-0 text-pink-500">Test Your Dance AI!</h2>
                            <p className="text-xs text-[#4a4455]">Strike a dance pose and see if the AI recognizes it!</p>
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
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to test dance poses</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg bg-pink-500 hover:bg-pink-600 transition-colors">Start Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-pink-500 text-pink-500 bg-white hover:bg-pink-50 transition-colors">
                                    {cameraOn ? 'Stop Camera' : 'Start Camera'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Confidence Threshold */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Confidence</span>
                                    <span className="text-xs font-extrabold bg-white px-2 py-0.5 rounded-md text-pink-500">{Math.round(confidenceThreshold * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round(confidenceThreshold * 100)}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-pink-500 bg-slate-200"
                                />
                            </div>

                            {/* Current Pose - Large Display */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Pose</p>
                                <div className={`text-4xl font-black ${prediction ? 'text-pink-500' : 'text-slate-400'}`}>
                                    {prediction ? prediction.label : '—'}
                                </div>
                                {prediction && (
                                    <p className="text-xs font-bold text-gray-500 mt-1">
                                        {Math.round(prediction.confidences[prediction.label] * 100)}% confidence
                                    </p>
                                )}
                            </div>

                            {/* Accuracy Score */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Accuracy Score</span>
                                    <button onClick={handleResetSequence} className="text-[9px] font-bold px-2 py-0.5 rounded-md text-pink-500 bg-pink-50 hover:bg-pink-100 transition-colors">
                                        Reset
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-14 h-14 flex-shrink-0">
                                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                            <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                            <circle
                                                cx="28"
                                                cy="28"
                                                r="24"
                                                fill="none"
                                                stroke="#ec4899"
                                                strokeWidth="4"
                                                strokeDasharray={`${(accuracyScore / 100) * 150.8} 150.8`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-pink-500">
                                            {accuracyScore}%
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-[9px] text-gray-500"><span className="font-bold text-emerald-500">{correctDetections}</span> correct</p>
                                        <p className="text-[9px] text-gray-500"><span className="font-bold text-gray-700">{totalDetections}</span> total</p>
                                        <p className="text-[9px] text-gray-500"><span className="font-bold text-pink-500">{poseHistory.length}</span> history</p>
                                    </div>
                                </div>
                            </div>

                            {/* Speed & Pose Detection */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl p-2.5 border bg-pink-50 border-pink-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Speed</p>
                                    <p className="text-lg font-extrabold text-gray-800">{inferenceTime}ms</p>
                                </div>
                                <div className="rounded-xl p-2.5 border bg-pink-50 border-pink-500/20">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Sequence</p>
                                    <p className={`text-lg font-extrabold ${sequencePhase === 'tracking' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {sequencePhase === 'tracking' ? 'Active' : 'Idle'}
                                    </p>
                                </div>
                            </div>

                            {/* Pose History Timeline */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">Pose Sequence</span>
                                    <span className="text-[9px] font-bold text-pink-500">{detectionCount} detected</span>
                                </div>
                                {poseHistory.length > 0 ? (
                                    <div className="flex gap-1 flex-wrap">
                                        {poseHistory.map((pose, i) => (
                                            <div key={i} className="flex flex-col items-center gap-0.5">
                                                <span className="text-[7px] font-bold text-gray-400">#{i + 1}</span>
                                                <span className="px-2 py-1 rounded-md text-[9px] font-bold text-white" style={{ background: getPoseColor(pose) }}>
                                                    {pose.replace('Pose ', 'P')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-gray-400">No poses detected yet</p>
                                )}
                            </div>

                            {/* All Confidences */}
                            {prediction && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-700 mb-2">All Confidences</p>
                                    <div className="flex flex-col gap-1.5">
                                        {Object.entries(prediction.confidences)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([label, conf]) => (
                                                <div key={label} className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-gray-600 w-20 truncate">{label}</span>
                                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${conf * 100}%`, background: getPoseColor(label) }} />
                                                    </div>
                                                    <span className="text-[9px] font-bold" style={{ color: getPoseColor(label) }}>{Math.round(conf * 100)}%</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
