import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../components/WorkflowIndicator'
import StatsBar from '../components/StatsBar'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface HandPoseClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

type CaptureStatus = 'idle' | 'loading-model' | 'detecting' | 'success' | 'no-hand' | 'error'

const DETECT_THROTTLE_MS = 33 // ~30fps for detection loop
const PREDICT_THROTTLE_MS = 500 // ~2fps for test prediction

export default function HandPoseClassifierPanel({ mode }: HandPoseClassifierPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new HandPoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const removeDebounceRef = useRef<NodeJS.Timeout | null>(null)
    const lastDetectTimeRef = useRef(0)
    const lastPredictTimeRef = useRef(0)

    const [isCapturing, setIsCapturing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [handDetected, setHandDetected] = useState(false)
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle')
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return !localStorage.getItem('neura-handpose-onboarding-seen')
    })
    const [inferenceTime, setInferenceTime] = useState(0)
    const [trainingError, setTrainingError] = useState<string | null>(null)
    const [augmentMode, setAugmentMode] = useState(true)
    const [batchCapturing, setBatchCapturing] = useState(false)
    const [batchCountdown, setBatchCountdown] = useState(0)

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            streamRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
            // Attach WebGL handlers to overlay canvas for context loss recovery
            if (overlayCanvasRef.current) {
                classifierRef.current.attachWebGLHandlers(overlayCanvasRef.current)
            }
            // Attach stream to video element (may not exist yet in test mode)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
        } catch (err) {
            console.error('Camera access denied:', err)
            setCameraError('Camera access is needed for hand tracking. Please allow camera access in your browser settings and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
        setCameraOn(false)
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) { stopCamera() } else { startCamera() }
    }, [cameraOn, startCamera, stopCamera])

    // Keep refs in sync to avoid stale closures
    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    // Sync stream to video element when stream changes (handles test mode timing)
    useEffect(() => {
        if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => undefined)
        }
    }, [stream])

    // Re-sync when cameraOn changes (video element may mount after stream is set)
    useEffect(() => {
        if (cameraOn && stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => undefined)
        }
    }, [cameraOn])

    // Cleanup on unmount
    useEffect(() => { return () => { stopCamera(); cancelAnimationFrame(animFrameRef.current); classifierRef.current.dispose() } }, [])

    // Stop camera when leaving collect/test modes
    useEffect(() => {
        if (mode.mode !== 'collect' && mode.mode !== 'test') {
            stopCamera()
        }
    }, [mode.mode])

    // Reset test camera ref when leaving test mode
    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    // Rebuild KNN classifier from saved samples (with abort pattern and augmentation)
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
                            augmentMode
                        )
                    }
                }
                if (!cancelled && thisBuild === rebuildAbortRef.current) {
                    setModelLoading(false)
                }
            }
            rebuild().catch((e) => {
                console.error('[HandPose] Rebuild failed:', e)
                if (!cancelled && thisBuild === rebuildAbortRef.current) {
                    setModelLoading(false)
                }
            })
            return () => { cancelled = true }
        }
    }, [mode.mode, mode.project])

    // Test mode: auto-start camera and run throttled predictions
    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        // Auto-start camera when entering test mode
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
                        const result = await classifierRef.current.predictFromImage(canvasRef.current, 3)
                        const elapsed = Math.round(performance.now() - start)
                        if (result) {
                            setPrediction(result)
                            setHandDetected(true)
                            setInferenceTime(elapsed)
                        } else {
                            setPrediction(null)
                            setHandDetected(false)
                        }
                    }
                } catch (e) { console.warn('[HandPose] Prediction error:', e) }
                setIsProcessing(false)
                isPredictingRef.current = false
            }
        }
        if (streamStateRef.current || stream) {
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
        }
    }, [mode.mode, stream, modelLoading, startCamera])

    // Collect mode: throttled hand detection loop for overlay drawing
    useEffect(() => {
        if (mode.mode !== 'collect' || !stream) return
        const detectLoop = async () => {
            if (isPredictingRef.current) return
            if (videoRef.current && overlayCanvasRef.current) {
                isPredictingRef.current = true
                try {
                    const canvas = overlayCanvasRef.current
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        canvas.width = videoRef.current.videoWidth || 640
                        canvas.height = videoRef.current.videoHeight || 480
                        ctx.clearRect(0, 0, canvas.width, canvas.height)
                        const keypoints = await classifierRef.current.detectHand(videoRef.current)
                        if (keypoints.length > 0) {
                            setHandDetected(true)
                            classifierRef.current.drawHand(canvas, keypoints)
                        } else {
                            setHandDetected(false)
                        }
                    }
                } catch { /* ignore detection loop errors */ }
                isPredictingRef.current = false
            }
        }
        lastDetectTimeRef.current = performance.now()
        const tick = () => {
            const now = performance.now()
            if (now - lastDetectTimeRef.current >= DETECT_THROTTLE_MS) {
                lastDetectTimeRef.current = now
                detectLoop()
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [mode.mode, stream])

    const handleCapture = async () => {
        if (!videoRef.current || !mode.selectedClassId || !stream) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        if (isCapturing) return

        setIsCapturing(true)
        setCaptureStatus('loading-model')

        try {
            const video = videoRef.current
            setCaptureStatus('detecting')
            const keypoints = await classifierRef.current.detectHand(video)

            if (keypoints && keypoints.length > 0) {
                setCaptureStatus('success')
                const features = classifierRef.current.extractFeatures(keypoints)
                const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(Array.from(features)) })
                if (added) {
                    classifierRef.current.addSample(features, mode.getSelectedClass()?.name || '').catch(() => {})
                } else {
                    console.warn('[HandPose] Failed to add sample - limit reached?')
                    setCaptureStatus('error')
                }
            } else {
                setCaptureStatus('no-hand')
            }
        } catch (e) {
            console.error('[HandPose] Capture error:', e)
            setCaptureStatus('error')
        } finally {
            setTimeout(() => { setIsCapturing(false); setCaptureStatus('idle') }, 800)
        }
    }

    const handleTrain = async (_epochs: number = 50) => {
        setIsTraining(true)
        setTrainingError(null)
        const project = mode.project
        if (!project || project.classes.length < 2) { mode.setAccuracy(0); setIsTraining(false); return }
        try {
            setModelLoading(true)
            classifierRef.current.clear()
            for (const cls of project.classes) {
                if (cls.samples.length > 0) {
                    await classifierRef.current.rebuildClass(
                        cls.name,
                        cls.samples.map(s => s.data),
                        augmentMode
                    )
                }
            }
            setModelLoading(false)

            let correct = 0; let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
                        const data = JSON.parse(sample.data)
                        const features = new Float32Array(data)
                        // Pad legacy63-d vectors to78-d
                        const padded = features.length < 78 ? (() => { const p = new Float32Array(78); p.set(features); return p })() : features
                        const result = await classifierRef.current.predict(padded, 3)
                        if (result && result.label === cls.name) correct++
                        total++
                    } catch { total++ }
                    await new Promise(r => setTimeout(r, 0))
                }
            }
            mode.setAccuracy(total > 0 ? correct / total : 0)
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch (e) {
            mode.setAccuracy(0)
            setTrainingError('Training failed. Please try again.')
            console.error('[HandPose] Training error:', e)
        }
        setIsTraining(false)
    }

    const handleRemoveSample = useCallback((classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        // Debounce rebuilds when removing multiple samples quickly
        if (removeDebounceRef.current) clearTimeout(removeDebounceRef.current)
        removeDebounceRef.current = setTimeout(() => {
            const project = mode.project
            if (project) {
                const cls = project.classes.find(c => c.id === classId)
                if (cls) {
                    classifierRef.current.clear()
                    for (const c of project.classes) {
                        for (const sample of c.samples) {
                            try {
                                const data = JSON.parse(sample.data)
                                const features = new Float32Array(data)
                                classifierRef.current.addSample(features, c.name)
                            } catch { /* skip */ }
                        }
                    }
                }
            }
        }, 300)
    }, [mode.project, mode.removeSample])

    const handleBatchCapture = useCallback(async () => {
        if (!videoRef.current || !mode.selectedClassId || !stream || batchCapturing) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return

        setBatchCapturing(true)
        const captureOne = async (): Promise<boolean> => {
            if (!videoRef.current || !mode.selectedClassId || !stream) return false
            const cls = mode.getSelectedClass()
            if (cls && cls.samples.length >= MAX_SAMPLES_PER_CLASS) return false
            try {
                const keypoints = await classifierRef.current.detectHand(videoRef.current)
                if (keypoints && keypoints.length > 0) {
                    const features = classifierRef.current.extractFeatures(keypoints)
                    mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(Array.from(features)) })
                    return true
                }
            } catch { /* skip failed capture */ }
            return false
        }

        for (let i = 0; i < 5; i++) {
            setBatchCountdown(5 - i)
            await new Promise(r => setTimeout(r, 1000))
            await captureOne()
        }
        setBatchCountdown(0)
        setBatchCapturing(false)
    }, [mode.selectedClassId, mode.getSelectedClass, mode.addSample, stream, batchCapturing])

    const handleExportTestReport = useCallback(() => {
        const project = mode.project
        if (!project) return

        const sampleCounts: Record<string, number> = {}
        for (const cls of project.classes) {
            sampleCounts[cls.name] = cls.samples.length
        }

        const report = {
            projectName: project.name,
            classifierType: 'hand-pose-classifier',
            exportedAt: new Date().toISOString(),
            accuracy: mode.accuracy,
            classCount: project.classes.length,
            totalSamples: mode.getTotalSamples(),
            sampleCounts,
            deviceInfo: {
                userAgent: navigator.userAgent,
                cameraAvailable: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            },
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.name.replace(/\s+/g, '_')}_handpose_test_report.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, [mode.project, mode.accuracy, mode.getTotalSamples])

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    const getCaptureLabel = () => {
        if (captureStatus === 'loading-model') return 'Loading model...'
        if (captureStatus === 'detecting') return 'Detecting hand...'
        if (captureStatus === 'success') return 'Captured!'
        if (captureStatus === 'no-hand') return 'No hand found!'
        if (captureStatus === 'error') return 'Error!'
        if (isCapturing) return 'Capturing...'
        if (atSampleLimit) return 'Max Reached'
        if (!stream) return 'Start Camera First'
        return 'Capture Hand'
    }

    const getCaptureDisabled = () => {
        if (isCapturing) return true
        if (atSampleLimit) return true
        if (!stream) return true
        if (!selectedClass) return true
        return false
    }

    const CameraToggle = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
        <button
            onClick={toggleCamera}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: size === 'sm' ? '8px 12px' : '10px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: cameraOn ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                color: cameraOn ? '#059669' : '#dc2626',
                boxShadow: cameraOn ? '0 2px 8px rgba(5,150,105,0.15)' : '0 2px 8px rgba(220,38,38,0.12)',
                transition: 'all 0.2s ease',
            }}
        >
            <span style={{ fontSize: '14px' }}>{cameraOn ? '📷' : '🚫'}</span>
            {cameraOn ? 'Camera On' : 'Camera Off'}
        </button>
    )

    const CaptureFeedback = () => {
        if (captureStatus === 'idle') return null
        const bg = captureStatus === 'success' ? 'bg-[#006c44]/90'
            : captureStatus === 'no-hand' ? 'bg-[#f97316]/90'
            : captureStatus === 'error' ? 'bg-[#991b1b]/90'
            : 'bg-[#0ea5e9]/90'
        const icon = captureStatus === 'success' ? '✅'
            : captureStatus === 'no-hand' ? '✋'
            : captureStatus === 'error' ? '❌'
            : captureStatus === 'loading-model' ? '⏳'
            : '🔍'
        return (
            <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 ${bg} backdrop-blur-sm rounded-xl z-10 animate-fade-in`}>
                <span className="text-white text-xs font-bold">{icon} {getCaptureLabel()}</span>
            </div>
        )
    }

    const totalSamplesAll = mode.getTotalSamples()
    let warningTitle = ''; let warningDesc = ''
    if (mode.project && mode.project.classes.length < 2) {
        warningTitle = 'Add at least 2 classes'; warningDesc = 'Create 2 or more classes to start training'
    } else if (totalSamplesAll === 0) {
        warningTitle = 'Add samples to train the model'; warningDesc = 'Capture hand gestures for each class'
    } else if (mode.project && mode.project.classes.some(c => c.samples.length < 2)) {
        warningTitle = 'Add more samples per class'; warningDesc = 'Each class needs at least 2 samples for reliable training. 5+ recommended for better accuracy.'
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'onbFadeIn 0.3s ease-out' }}>
                    <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />
                    <div className="relative w-full max-w-[420px] overflow-hidden" style={{ animation: 'onbSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-[#7dd3fc]/40 via-[#38bdf8]/20 to-[#0ea5e9]/40 blur-sm" />
                        <div className="relative bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_25px_60px_-12px_rgba(14,165,233,0.25),0_0_0_1px_rgba(14,165,233,0.08)] overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7dd3fc] via-[#0ea5e9] to-[#38bdf8]" />
                            <div className="px-8 pt-8 pb-5">
                                <div className="relative w-16 h-16 mx-auto mb-5">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] rounded-2xl rotate-3 shadow-md" />
                                    <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#e0f2fe]/50">
                                        <span className="text-3xl">✋</span>
                                    </div>
                                </div>
                                <h3 className="text-[19px] font-extrabold text-[#131b2e] mb-2.5 text-center tracking-tight leading-tight">Welcome to Hand Pose Classifier!</h3>
                                <p className="text-[13px] text-[#5b5670] leading-[1.65] text-center max-w-[320px] mx-auto">Teach AI to recognize your hand gestures using the camera! 🚀</p>
                            </div>
                            <div className="mx-8"><div className="h-px bg-gradient-to-r from-transparent via-[#e0f2fe] to-transparent" /></div>
                            <div className="px-8 py-5">
                                <div className="space-y-3 mb-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#0ea5e9] shadow-sm">1</div>
                                        <div><p className="text-sm font-bold text-[#131b2e]">Create Classes 📁</p><p className="text-xs text-[#5b5670]">Click "+" in the sidebar to add gesture categories!</p></div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#0ea5e9] shadow-sm">2</div>
                                        <div><p className="text-sm font-bold text-[#131b2e]">Capture Gestures ✋</p><p className="text-xs text-[#5b5670]">Show your hand to the camera and capture samples!</p></div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#006c44] shadow-sm">3</div>
                                        <div><p className="text-sm font-bold text-[#131b2e]">Train & Test 🏋️🧪</p><p className="text-xs text-[#5b5670]">Teach your AI, then test how well it recognizes gestures!</p></div>
                                    </div>
                                </div>
                                <button onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-handpose-onboarding-seen', 'true') }} className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg shadow-[#0ea5e9]/25 hover:shadow-xl hover:shadow-[#0ea5e9]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] relative overflow-hidden group">
                                    <span className="relative z-10">Let's Go! 🚀</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <style>{`@keyframes onbFadeIn{from{opacity:0}to{opacity:1}}@keyframes onbSlideIn{from{opacity:0;transform:translateY(12px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-6 overflow-y-auto neura-scrollbar">
                    <div className="w-full max-w-[720px] text-center mb-2 animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-1">✋ Hand Gesture Guru!</h2>
                        <p className="text-sm text-[#4a4455]">Show your hand to the camera and teach your AI! 🖐️</p>
                    </div>

                    <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />

                    {/* Tips */}
                    <div className="w-full max-w-[720px] animate-fade-in">
                        <div className="bg-gradient-to-r from-[#e0f2fe] to-[#bae6fd] rounded-2xl px-5 py-4 border border-[#0ea5e9]/10">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">💡</span>
                                <div>
                                    <p className="text-[11px] font-bold text-[#0ea5e9] mb-1">TIPS FOR HAND TRACKING</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#0ea5e9]" /> Keep hand in center of frame</span>
                                        <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#0ea5e9]" /> Spread fingers apart</span>
                                        <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#0ea5e9]" /> Good lighting helps</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Camera error */}
                    {cameraError && !cameraOn && (
                        <div className="w-full max-w-[520px] bg-white rounded-3xl p-8 shadow-md border border-[#dae2fd] text-center animate-scale-in">
                            <span className="text-5xl mb-4 block">🚫</span>
                            <h3 className="text-lg font-bold text-[#131b2e] mb-2">Camera Access Needed 📷</h3>
                            <p className="text-sm text-[#4a4455] mb-6 max-w-sm mx-auto">{cameraError}</p>
                            <button onClick={startCamera} className="px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">Try Again 🔄</button>
                        </div>
                    )}



                    {/* Camera feed */}
                    <div className={`relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] shadow-lg aspect-[4/3] transition-all duration-300 ${cameraOn ? '' : 'hidden'}`}>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full -scale-x-100" />
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                            <span className="text-white text-[10px] font-bold tracking-wide">✋ LIVE</span>
                        </div>
                        <CameraToggle />
                        <CaptureFeedback />
                        {selectedClass && (
                            <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: `${selectedClass.color}CC` }}>
                                {selectedClass.name}
                            </div>
                        )}
                        {stream && (
                            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 bg-[#006c44]/90 backdrop-blur-sm rounded-lg">
                                <div className={`w-1.5 h-1.5 rounded-full ${handDetected ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
                                <span className="text-white text-[9px] font-bold">{handDetected ? '✋ HAND DETECTED' : '👀 SCANNING'}</span>
                            </div>
                        )}
                    </div>

                    {/* Camera off placeholder */}
                    {!cameraOn && !cameraError && (
                        <div className="w-full max-w-[520px] border-2 border-dashed border-[#0ea5e9]/20 rounded-3xl p-8 text-center transition-all hover:border-[#0ea5e9]/40 bg-white/70 backdrop-blur-sm">
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-6xl mb-4">📷</span>
                                <h2 className="text-xl font-extrabold text-[#131b2e] mb-2">Camera is off</h2>
                                <p className="text-sm text-[#4a4455] mb-6 max-w-sm">
                                    Start the camera to begin capturing hand gestures!
                                </p>
                                <button onClick={startCamera} className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-[#0ea5e9]/30 hover:-translate-y-0.5 transition-all">
                                    📷 Turn On Camera
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <CameraToggle />
                        <label className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-xl border border-[#dae2fd] cursor-pointer select-none text-xs font-bold text-[#4a4455] hover:bg-white transition-all">
                            <input
                                type="checkbox"
                                checked={augmentMode}
                                onChange={(e) => setAugmentMode(e.target.checked)}
                                className="accent-[#0ea5e9]"
                            />
                            Augment (5x)
                        </label>
                    </div>

                    {/* Capture */}
                    {cameraOn && (
                        <div className="flex items-center gap-3 flex-wrap justify-center">
                            <CaptureButton
                                onClick={handleCapture}
                                disabled={getCaptureDisabled()}
                                label={getCaptureLabel()}
                                icon="pose"
                                color={captureStatus === 'success' ? '#006c44' : captureStatus === 'no-hand' ? '#f97316' : selectedClass?.color || '#0ea5e9'}
                                pulse={!isCapturing && !!canAddSamples && !!stream}
                            />
                            <button
                                onClick={handleBatchCapture}
                                disabled={batchCapturing || getCaptureDisabled()}
                                className="px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 border-2"
                                style={{
                                    background: batchCapturing ? 'linear-gradient(135deg, #e0f2fe, #bae6fd)' : 'white',
                                    borderColor: batchCapturing ? '#0ea5e9' : '#0ea5e9/30',
                                    color: '#0ea5e9',
                                    opacity: batchCapturing || getCaptureDisabled() ? 0.5 : 1,
                                    cursor: batchCapturing || getCaptureDisabled() ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {batchCapturing ? `⏳ ${batchCountdown}` : '📸 Batch (5)'}
                            </button>
                        </div>
                    )}

                    <StatsBar totalClasses={mode.project?.classes.length || 0} totalImages={mode.getTotalSamples()} imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0} recommended={10} />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${atSampleLimit ? 'text-[#c32c00] bg-[#fef3c7]' : 'text-[#4a4455] bg-[#f2f3ff]'}`}>{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} gestures</span>
                                </div>
                                <SampleGrid samples={selectedClass.samples} type="keypoints" onRemove={(id) => handleRemoveSample(selectedClass.id, id)} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="w-full max-w-4xl mx-auto text-center mb-2 animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-1">🏋️ Teach Your AI Hands!</h2>
                        <p className="text-sm text-[#4a4455]">Your AI is learning your hand gestures! ✋</p>
                    </div>
                    <div className="w-full max-w-4xl mx-auto">
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                    </div>
                    <div className="w-full max-w-4xl mx-auto">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} warningTitle={warningTitle} warningDesc={warningDesc} trainingError={trainingError} sampleType="poses" />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-6 overflow-y-auto neura-scrollbar">
                    <div className="w-full max-w-[720px] text-center mb-2 animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-1">🧪 Test Your AI!</h2>
                        <p className="text-sm text-[#4a4455]">Show a hand gesture and see if your AI recognizes it! 🎯</p>
                    </div>
                    <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                    <TestPanel prediction={prediction} isProcessing={isProcessing} cameraOn={cameraOn} videoRef={videoRef} canvasRef={canvasRef} onCapture={() => {}} onUpload={() => {}} onToggleCamera={toggleCamera} onReset={() => setPrediction(null)} onTryAnother={() => setPrediction(null)} onExport={handleExportTestReport} testsRun={prediction ? 1 : 0} inferenceTime={inferenceTime} modelLoading={modelLoading} />
                </div>
            )}
        </div>
    )
}
