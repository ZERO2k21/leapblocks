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
    const [isDragging, setIsDragging] = useState(false)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    const handleUpload = async (eOrFiles: React.ChangeEvent<HTMLInputElement> | FileList | File[]) => {
        let files: FileList | File[] | null = null
        if (eOrFiles instanceof FileList || Array.isArray(eOrFiles)) {
            files = eOrFiles
        } else if (eOrFiles && 'target' in eOrFiles) {
            files = eOrFiles.target.files
        }
        if (!files || files.length === 0 || !mode.selectedClassId) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        let successCount = 0
        let noHandCount = 0
        let limitReached = false

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file || !file.type.startsWith('image/')) continue

            const currentClass = mode.getSelectedClass()
            if (currentClass && currentClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
                limitReached = true
                break
            }

            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })
            const img = new Image()
            img.src = dataUrl
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(() => resolve(), 5000)
            })

            if (img.complete && img.naturalWidth > 0) {
                try {
                    const tempCanvas = document.createElement('canvas')
                    tempCanvas.width = img.naturalWidth
                    tempCanvas.height = img.naturalHeight
                    const ctx = tempCanvas.getContext('2d')!
                    ctx.drawImage(img, 0, 0)
                    const keypoints = await classifierRef.current.detectHand(tempCanvas)
                    if (keypoints && keypoints.length > 0) {
                        const features = classifierRef.current.extractFeatures(keypoints)
                        const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(Array.from(features)) })
                        if (!added) {
                            limitReached = true
                            break
                        }
                        classifierRef.current.addSample(features, mode.getSelectedClass()?.name || '').catch(() => {})
                        successCount++
                    } else {
                        noHandCount++
                    }
                } catch (err) {
                    console.warn('[HandPoseClassifier] Upload failed:', err)
                }
            }
        }

        const className = mode.getSelectedClass()?.name || 'class'
        if (successCount > 0) {
            showSaved(`📂 Saved ${successCount} gesture(s) to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
        }
        if (noHandCount > 0) {
            showSaved(`⚠️ No hand detected in ${noHandCount} image(s).`)
        }
        if (limitReached) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
        }

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

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
    useEffect(() => {
        return () => {
            stopCamera()
            cancelAnimationFrame(animFrameRef.current)
            classifierRef.current.dispose()
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        }
    }, [])

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
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}
            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'onbFadeIn 0.3s ease-out' }}>
                    <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />
                    <div className="relative w-full max-w-[440px] overflow-hidden" style={{ animation: 'onbSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="absolute -inset-[2px] rounded-[34px] bg-gradient-to-br from-[#c084fc]/50 via-[#a855f7]/30 to-[#630ed4]/50 blur-md" />
                        <div className="relative bg-white rounded-[32px] shadow-[0_30px_70px_-15px_rgba(99,14,212,0.3)] overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c084fc] via-[#630ed4] to-[#a855f7]" />
                            <div style={{ padding: '40px 40px 24px' }}>
                                <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '20px', transform: 'rotate(6deg)', boxShadow: '0 8px 24px rgba(99,14,212,0.15)' }} />
                                    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(245,243,255,0.5)' }}>
                                        <span style={{ fontSize: '40px' }}>✋</span>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#131b2e', marginBottom: '10px', textAlign: 'center', letterSpacing: '-0.02em', lineHeight: 1.3 }}>Welcome to Hand Pose Classifier!</h3>
                                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, textAlign: 'center', maxWidth: '300px', margin: '0 auto' }}>Teach AI to recognize your hand gestures using the camera! 🚀</p>
                            </div>
                            <div style={{ margin: '0 40px', height: '1px', background: 'linear-gradient(to right, transparent, #ede9fe, transparent)' }} />
                            <div style={{ padding: '24px 40px 32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: '#faf9ff', border: '1px solid #ede9fe' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: '#630ed4', boxShadow: '0 2px 8px rgba(99,14,212,0.1)' }}>1</div>
                                        <div style={{ paddingTop: '2px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '2px' }}>Create Classes</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>Click "+" in the sidebar to add gesture categories!</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: '#faf9ff', border: '1px solid #ede9fe' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: '#630ed4', boxShadow: '0 2px 8px rgba(99,14,212,0.1)' }}>2</div>
                                        <div style={{ paddingTop: '2px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '2px' }}>Capture Gestures</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>Show your hand to the camera and capture samples!</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: '#006c44', boxShadow: '0 2px 8px rgba(0,108,68,0.1)' }}>3</div>
                                        <div style={{ paddingTop: '2px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '2px' }}>Train & Test</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>Teach your AI, then test how well it recognizes gestures!</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-handpose-onboarding-seen', 'true') }} style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', boxShadow: '0 8px 24px rgba(99,14,212,0.3)', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}>
                                    <span style={{ position: 'relative', zIndex: 10 }}>Let's Go! 🚀</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <style>{`@keyframes onbFadeIn{from{opacity:0}to{opacity:1}}@keyframes onbSlideIn{from{opacity:0;transform:translateY(12px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    {/* Header + Workflow - centered */}
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-0">✋ Hand Gesture Guru!</h2>
                            <p className="text-xs text-[#4a4455]">Show your hand to the camera and teach your AI! 🖐️</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>

                    {/* Camera error */}
                    {cameraError && !cameraOn && (
                        <div className="w-full max-w-[520px] bg-white rounded-2xl p-6 shadow-md border border-[#dae2fd] text-center animate-scale-in mx-auto" style={{ marginTop: '10px' }}>
                            <span className="text-4xl mb-3 block">🚫</span>
                            <h3 className="text-sm font-bold text-[#131b2e] mb-2">Camera Access Needed</h3>
                            <p className="text-xs text-[#4a4455] mb-4">{cameraError}</p>
                            <button onClick={startCamera} className="px-5 py-2.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all">Try Again</button>
                        </div>
                    )}

                    {/* Horizontal split */}
                    <div className="w-full" style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, marginTop: '16px' }}>
                        {/* Left half - Camera feed */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* Camera feed */}
                            <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#0f0e26', border: '1px solid #3b2f63', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minHeight: '300px' }}>
                                {cameraOn ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                        <canvas ref={overlayCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
                                        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '6px', zIndex: 10 }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                                            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✋ LIVE</span>
                                        </div>
                                        {stream && (
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: handDetected ? 'rgba(0,108,68,0.9)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '6px', zIndex: 10 }}>
                                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff', opacity: handDetected ? 1 : 0.5, animation: handDetected ? 'pulse 1s infinite' : 'none' }} />
                                                <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>{handDetected ? '✋ HAND DETECTED' : '👀 SCANNING'}</span>
                                            </div>
                                        )}
                                        {selectedClass && (
                                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '4px 10px', borderRadius: '6px', background: selectedClass.color, color: '#fff', fontSize: '10px', fontWeight: 700, zIndex: 10 }}>
                                                {selectedClass.name}
                                            </div>
                                        )}
                                        <CaptureFeedback />
                                    </>
                                ) : (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                                        onDrop={async (e) => { e.preventDefault(); setIsDragging(false); if (mode.selectedClassId && e.dataTransfer.files.length > 0) await handleUpload(e.dataTransfer.files) }}
                                        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDragging ? 'rgba(14,165,233,0.05)' : 'transparent' }}
                                    >
                                        <span style={{ fontSize: '3.5rem', marginBottom: '12px', transform: isDragging ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s ease' }}>{isDragging ? '📥' : '✋'}</span>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{isDragging ? 'Drop Gesture Images Here!' : 'Camera is off'}</p>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: isDragging ? 0.3 : 1, transition: 'opacity 0.2s ease' }}>
                                            <button onClick={startCamera} style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}>
                                                📷 Turn On Camera
                                            </button>
                                            <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 600 }}>or</span>
                                            <button onClick={() => fileInputRef.current?.click()} disabled={!mode.selectedClassId} style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: mode.selectedClassId ? '2px solid #0ea5e9' : '2px solid #d1d5db', cursor: mode.selectedClassId ? 'pointer' : 'not-allowed', background: mode.selectedClassId ? '#fff' : '#e5e7eb', color: mode.selectedClassId ? '#0ea5e9' : '#9ca3af' }}>
                                                📂 Upload
                                            </button>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right half - Controls, Stats, Samples */}
                        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Tips */}
                            <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(14,165,233,0.1)' }}>
                                <div className="flex items-center" style={{ gap: '6px', marginBottom: '6px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>💡</div>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tips for Hand Tracking</span>
                                </div>
                                <div className="flex flex-wrap" style={{ gap: '4px 12px' }}>
                                    {['Keep hand in center', 'Spread fingers apart', 'Good lighting helps'].map((tip) => (
                                        <span key={tip} className="flex items-center" style={{ gap: '4px', fontSize: '10px', color: '#4a4455' }}>
                                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#0ea5e9', flexShrink: 0 }} />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                                <button onClick={toggleCamera} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: cameraOn ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', boxShadow: cameraOn ? '0 4px 14px rgba(239,68,68,0.35)' : '0 4px 14px rgba(14,165,233,0.35)' }}>
                                    {cameraOn ? '⏹️ Stop' : '📷 Start'}
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} disabled={!mode.selectedClassId} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: mode.selectedClassId ? 'pointer' : 'not-allowed', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', boxShadow: '0 4px 14px rgba(14,165,233,0.35)', opacity: mode.selectedClassId ? 1 : 0.5 }}>
                                    📂 Upload
                                </button>
                            </div>

                            {/* Augment toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: augmentMode ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'rgba(255,255,255,0.85)', border: augmentMode ? '2px solid #006c44' : '1px solid #e5e7eb', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: augmentMode ? '#006c44' : '#4a4455', backdropFilter: 'blur(12px)', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                <input type="checkbox" checked={augmentMode} onChange={(e) => setAugmentMode(e.target.checked)} style={{ accentColor: '#0ea5e9' }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '11px' }}>Augment (5x)</div>
                                    <div style={{ fontSize: '9px', opacity: 0.7 }}>More varied training data</div>
                                </div>
                            </label>

                            {/* Capture buttons */}
                            {cameraOn && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCapture}
                                        disabled={getCaptureDisabled()}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '10px 16px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: getCaptureDisabled() ? 'not-allowed' : 'pointer',
                                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                            color: '#fff',
                                            boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                                            opacity: getCaptureDisabled() ? 0.5 : 1,
                                        }}
                                    >
                                        <span style={{ fontSize: '14px' }}>📸</span>
                                        {getCaptureLabel()}
                                    </button>
                                    <button
                                        onClick={handleBatchCapture}
                                        disabled={batchCapturing || getCaptureDisabled()}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '10px 16px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            border: batchCapturing ? '2px solid #0ea5e9' : '2px solid rgba(14,165,233,0.3)',
                                            cursor: batchCapturing || getCaptureDisabled() ? 'not-allowed' : 'pointer',
                                            background: batchCapturing ? 'linear-gradient(135deg, #e0f2fe, #bae6fd)' : '#fff',
                                            color: '#0ea5e9',
                                            opacity: batchCapturing || getCaptureDisabled() ? 0.5 : 1,
                                        }}
                                    >
                                        {batchCapturing ? `⏳ ${batchCountdown}` : '📸 Batch (5)'}
                                    </button>
                                </div>
                            )}

                            {/* Stats */}
                            <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 Total Samples</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0ea5e9' }}>{mode.getTotalSamples()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Classes</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0ea5e9' }}>{mode.project?.classes.length || 0}</span>
                                </div>
                            </div>

                            {/* Samples */}
                            {selectedClass && selectedClass.samples.length > 0 && (
                                <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div className="flex items-center justify-between" style={{ marginBottom: '8px', flexShrink: 0 }}>
                                        <div className="flex items-center" style={{ gap: '6px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedClass.color }} />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#131b2e' }}>{selectedClass.name}</span>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', background: atSampleLimit ? '#fef3c7' : '#f0f9ff', color: atSampleLimit ? '#c32c00' : '#0ea5e9' }}>
                                            {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="neura-scrollbar">
                                        <SampleGrid samples={selectedClass.samples} type="keypoints" onRemove={(id) => handleRemoveSample(selectedClass.id, id)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    <div className="w-full" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} warningTitle={warningTitle} warningDesc={warningDesc} trainingError={trainingError} sampleType="poses" mode={mode.mode} onModeChange={mode.setMode} workflowType="pose" />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    {/* Header + Workflow - centered */}
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-0">🧪 Test Your AI!</h2>
                            <p className="text-xs text-[#4a4455]">Show a hand gesture and see if your AI recognizes it! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>
                    <div className="w-full" style={{ marginTop: '16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TestPanel prediction={prediction} isProcessing={isProcessing} cameraOn={cameraOn} videoRef={videoRef} canvasRef={canvasRef} onCapture={() => {}} onUpload={() => {}} onToggleCamera={toggleCamera} onReset={() => setPrediction(null)} onTryAnother={() => setPrediction(null)} onExport={handleExportTestReport} testsRun={prediction ? 1 : 0} inferenceTime={inferenceTime} modelLoading={modelLoading} />
                    </div>
                </div>
            )}
        </div>
    )
}
