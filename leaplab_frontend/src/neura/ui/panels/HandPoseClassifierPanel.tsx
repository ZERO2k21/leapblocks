import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import { useIsMobile } from '../../hooks/useResponsive'
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
    const isMobile = useIsMobile(768)
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
    const testFileInputRef = useRef<HTMLInputElement>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.5)
    const [testImage, setTestImage] = useState<string | null>(null)

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
        if (!files || files.length === 0) return
        // Auto-select first class if none selected
        if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
            mode.setSelectedClassId(mode.project.classes[0].id)
        }
        if (!mode.selectedClassId) { alert('Create a class first.'); return }
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

    const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        if (modelLoading) {
            showSaved('⚠️ Model is still loading. Please wait.')
            return
        }
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })
        setTestImage(dataUrl)
        setCameraOn(false)
        stopCamera()
        setIsProcessing(true)
        try {
            const img = new Image()
            img.src = dataUrl
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(() => resolve(), 5000)
            })
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                const start = performance.now()
                const result = await classifierRef.current.predictFromImage(img, 3)
                const elapsed = Math.round(performance.now() - start)
                if (result) {
                    setPrediction(result)
                    setInferenceTime(elapsed)
                } else {
                    showSaved('⚠️ No hand detected in the image.')
                }
            }
        } catch (err) {
            console.warn('[HandPoseClassifier] Test upload failed:', err)
            showSaved('⚠️ Failed to analyze image.')
        }
        setIsProcessing(false)
        if (testFileInputRef.current) testFileInputRef.current.value = ''
    }

    // Register global window drag-and-drop upload handler (collect mode only — test mode uses live camera)
    useEffect(() => {
        if (mode.mode === 'collect') {
            const selectedClass = mode.getSelectedClass();
            (window as any).__activeUpload = {
                handler: (files: FileList) => {
                    if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
                        mode.setSelectedClassId(mode.project.classes[0].id)
                    }
                    handleUpload(files)
                },
                label: selectedClass ? `Class: ${selectedClass.name}` : 'Hand Pose Samples'
            }
        } else if (mode.mode === 'test') {
            (window as any).__activeUpload = {
                handler: (files: FileList) => {
                    if (files.length > 0) {
                        const syntheticEvent = { target: { files } } as any
                        handleTestUpload(syntheticEvent)
                    }
                },
                label: 'Test Image'
            }
        } else {
            (window as any).__activeUpload = null
        }
        return () => { (window as any).__activeUpload = null }
    }, [mode.mode, mode.selectedClassId, mode.project])

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
    }, [mode.mode, mode.project, augmentMode])

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
                        if (result && result.confidences[result.label] >= confidenceThreshold) {
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
    }, [mode.mode, stream, modelLoading, startCamera, confidenceThreshold])

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
                if (!added) {
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
        removeDebounceRef.current = setTimeout(async () => {
            const project = mode.project
            if (project) {
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
            }
        }, 300)
    }, [mode.project, mode.removeSample, augmentMode])

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
            className={`flex items-center gap-1.5 rounded-xl text-xs font-bold border-none cursor-pointer transition-all duration-200 ${
                size === 'sm' ? 'py-2 px-3' : 'py-2.5 px-4'
            } ${
                cameraOn
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-[0_2px_8px_rgba(5,150,105,0.15)]'
                    : 'bg-gradient-to-br from-red-50 to-red-100 text-red-600 shadow-[0_2px_8px_rgba(220,38,38,0.12)]'
            }`}
        >
            <span className="text-sm">{cameraOn ? '📷' : '🚫'}</span>
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
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}
            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-[onbFadeIn_0.3s_ease-out]">
                    <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />
                    <div className="relative w-full max-w-[440px] overflow-hidden animate-[onbSlideIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="absolute -inset-[2px] rounded-[34px] bg-gradient-to-br from-[#c084fc]/50 via-[#a855f7]/30 to-[#630ed4]/50 blur-md" />
                        <div className="relative bg-white rounded-[32px] shadow-[0_30px_70px_-15px_rgba(99,14,212,0.3)] overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c084fc] via-[#630ed4] to-[#a855f7]" />
                            <div className="pt-10 px-10 pb-6">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-2xl rotate-6 shadow-[0_8px_24px_rgba(99,14,212,0.15)]" />
                                    <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-[#f5f3ff]/50">
                                        <span className="text-[40px]">✋</span>
                                    </div>
                                </div>
                                <h3 className="text-[22px] font-extrabold text-[#131b2e] mb-2.5 text-center tracking-tight leading-snug">Welcome to Hand Pose Classifier!</h3>
                                <p className="text-sm text-gray-500 leading-relaxed text-center max-w-[300px] mx-auto">Teach AI to recognize your hand gestures using the camera! 🚀</p>
                            </div>
                            <div className="mx-10 h-[1px] bg-gradient-to-r from-transparent via-[#ede9fe] to-transparent" />
                            <div className="pt-6 px-10 pb-8">
                                <div className="flex flex-col gap-3 mb-6">
                                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#faf9ff] border border-[#ede9fe]">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center shrink-0 text-sm font-bold text-[#630ed4] shadow-[0_2px_8px_rgba(99,14,212,0.1)]">1</div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-[#131b2e] mb-0.5">Create Classes</p>
                                            <p className="text-xs text-gray-500 leading-relaxed">Click "+" in the sidebar to add gesture categories!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#faf9ff] border border-[#ede9fe]">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center shrink-0 text-sm font-bold text-[#630ed4] shadow-[0_2px_8px_rgba(99,14,212,0.1)]">2</div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-[#131b2e] mb-0.5">Capture Gestures</p>
                                            <p className="text-xs text-gray-500 leading-relaxed">Show your hand to the camera and capture samples!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#d1fae5]">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] flex items-center justify-center shrink-0 text-sm font-bold text-[#006c44] shadow-[0_2px_8px_rgba(0,108,68,0.1)]">3</div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-[#131b2e] mb-0.5">Train & Test</p>
                                            <p className="text-xs text-gray-500 leading-relaxed">Teach your AI, then test how well it recognizes gestures!</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-handpose-onboarding-seen', 'true') }} className="w-full p-4 rounded-2xl text-sm font-bold border-none cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_8px_24px_rgba(99,14,212,0.3)] relative overflow-hidden transition-all">
                                    <span className="relative z-10">Let's Go! 🚀</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <style>{`@keyframes onbFadeIn{from{opacity:0}to{opacity:1}}@keyframes onbSlideIn{from{opacity:0;transform:translateY(12px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar py-3 px-5">
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
                        <div className="w-full max-w-[520px] bg-white rounded-2xl p-6 shadow-md border border-[#dae2fd] text-center animate-scale-in mx-auto mt-2.5">
                            <span className="text-4xl mb-3 block">🚫</span>
                            <h3 className="text-sm font-bold text-[#131b2e] mb-2">Camera Access Needed</h3>
                            <p className="text-xs text-[#4a4455] mb-4">{cameraError}</p>
                            <button onClick={startCamera} className="px-5 py-2.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all">Try Again</button>
                        </div>
                    )}

                    {/* Horizontal split */}
                    <div className="w-full flex flex-col lg:flex-row gap-4 flex-1 min-h-[35vh] lg:min-h-0 mt-4">
                        {/* Left half - Camera feed */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            {/* Camera feed */}
                            <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#0f0e26] border border-[#3b2f63] shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-h-[350px]">
                                {cameraOn ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain -scale-x-100" />
                                        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full -scale-x-100" />
                                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.25 py-1 px-2.5 bg-black/50 backdrop-blur-md rounded-md z-10">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                                            <span className="text-white text-[10px] font-bold">✋ LIVE</span>
                                        </div>
                                        {stream && (
                                            <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 py-0.75 px-2 backdrop-blur-md rounded-md z-10 ${handDetected ? 'bg-emerald-800/90' : 'bg-black/50'}`}>
                                                <div className={`w-1.25 h-1.25 rounded-full bg-white ${handDetected ? 'opacity-100 animate-pulse' : 'opacity-50'}`} />
                                                <span className="text-white text-[9px] font-bold">{handDetected ? '✋ HAND DETECTED' : '👀 SCANNING'}</span>
                                            </div>
                                        )}
                                        {selectedClass && (
                                            <div className="absolute bottom-2.5 left-2.5 py-1 px-2.5 rounded-md text-white text-[10px] font-bold z-10" style={{ background: selectedClass.color }}>
                                                {selectedClass.name}
                                            </div>
                                        )}
                                        <CaptureFeedback />
                                    </>
                                ) : (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                                        onDrop={async (e) => {
                                            e.preventDefault()
                                            setIsDragging(false)
                                            if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
                                                mode.setSelectedClassId(mode.project.classes[0].id)
                                            }
                                            if (e.dataTransfer.files.length > 0) await handleUpload(e.dataTransfer.files)
                                        }}
                                        className={`absolute inset-0 flex flex-col items-center justify-center ${isDragging ? 'bg-[#0ea5e9]/5' : 'bg-transparent'}`}
                                    >
                                        <div className={`contents ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                                            <span className={`text-[3.5rem] mb-3 transition-transform duration-200 ${isDragging ? 'scale-115' : 'scale-100'}`}>{isDragging ? '📥' : '✋'}</span>
                                            <p className="text-sm font-bold text-white mb-3">{isDragging ? 'Drop Gesture Images Here!' : 'Camera is off'}</p>
                                            <div className={`flex gap-2 items-center transition-opacity duration-200 ${isDragging ? 'opacity-30' : 'opacity-100'}`}>
                                                <button onClick={startCamera} className="py-2.5 px-5 rounded-xl text-xs font-bold border-none cursor-pointer bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)]">
                                                    📷 Turn On Camera
                                                </button>
                                                <span className="text-gray-400 text-[11px] font-semibold">or</span>
                                                <button onClick={() => fileInputRef.current?.click()} className="py-2.5 px-5 rounded-xl text-xs font-bold border-2 border-[#0ea5e9] cursor-pointer bg-white text-[#0ea5e9]">
                                                    📂 Upload
                                                </button>
                                            </div>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right half - Controls, Stats, Samples */}
                        <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-2.5 overflow-y-auto max-h-full neura-scrollbar">
                            {/* Tips */}
                            <div className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] rounded-xl py-2.5 px-3.5 border border-[#0ea5e9]/10">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-[10px] shrink-0">💡</div>
                                    <span className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-wider">Tips for Hand Tracking</span>
                                </div>
                                <div className="flex flex-wrap gap-1 gap-x-3">
                                    {['Keep hand in center', 'Spread fingers apart', 'Good lighting helps'].map((tip) => (
                                        <span key={tip} className="flex items-center gap-1 text-[10px] text-[#4a4455]">
                                            <span className="w-0.75 h-0.75 rounded-full bg-[#0ea5e9] shrink-0" />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                                <button onClick={toggleCamera} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none cursor-pointer text-white ${cameraOn ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_14px_rgba(239,68,68,0.35)]' : 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] shadow-[0_4px_14px_rgba(14,165,233,0.35)]'}`}>{cameraOn ? '⏹️ Stop' : '📷 Start'}</button>
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none cursor-pointer bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)]">📂 Upload</button>
                            </div>

                            {/* Augment toggle */}
                            <label className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl border cursor-pointer text-[11px] font-bold backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.03)] ${augmentMode ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-[#006c44] text-[#006c44]' : 'bg-white/85 border-gray-200 text-[#4a4455]'}`}>
                                <input type="checkbox" checked={augmentMode} onChange={(e) => setAugmentMode(e.target.checked)} className="accent-[#0ea5e9]" />
                                <div>
                                    <div className="font-bold text-[11px]">Augment (5x)</div>
                                    <div className="text-[9px] opacity-70">More varied training data</div>
                                </div>
                            </label>

                            {/* Capture buttons */}
                            {cameraOn && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCapture}
                                        disabled={getCaptureDisabled()}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)] ${getCaptureDisabled() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
                                    >
                                        <span className="text-sm">📸</span>
                                        {getCaptureLabel()}
                                    </button>
                                    <button
                                        onClick={handleBatchCapture}
                                        disabled={batchCapturing || getCaptureDisabled()}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-2 ${batchCapturing ? 'border-[#0ea5e9] bg-gradient-to-br from-sky-100 to-sky-200 text-[#0ea5e9]' : 'border-[#0ea5e9]/30 bg-white text-[#0ea5e9]'} ${batchCapturing || getCaptureDisabled() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
                                    >
                                        {batchCapturing ? `⏳ ${batchCountdown}` : '📸 Batch (5)'}
                                    </button>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📊 Total Samples</span>
                                    <span className="text-sm font-extrabold text-[#0ea5e9]">{mode.getTotalSamples()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">🎯 Classes</span>
                                    <span className="text-sm font-extrabold text-[#0ea5e9]">{mode.project?.classes.length || 0}</span>
                                </div>
                            </div>

                            {/* Samples */}
                            {selectedClass && selectedClass.samples.length > 0 && (
                                <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] max-h-[200px] flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: selectedClass.color }} />
                                            <span className="text-[11px] font-bold text-[#131b2e]">{selectedClass.name}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold py-0.5 px-1.5 rounded-md ${atSampleLimit ? 'bg-amber-100 text-[#c32c00]' : 'bg-sky-50 text-[#0ea5e9]'}`}>
                                            {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto neura-scrollbar">
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
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar py-3 px-5">
                    <div className="w-full flex-1 min-h-0 flex flex-col">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} warningTitle={warningTitle} warningDesc={warningDesc} trainingError={trainingError} sampleType="poses" mode={mode.mode} onModeChange={mode.setMode} workflowType="pose" />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar py-3 px-5">
                    {/* Header + Workflow - centered */}
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-0">🧪 Test Your AI!</h2>
                            <p className="text-xs text-[#4a4455]">Show a hand gesture and see if your AI recognizes it! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                        {mode.project && mode.project.classes.some(c => c.samples.length < 2) && (
                            <div className="w-full max-w-[720px] mt-2 px-4 py-3 rounded-xl text-xs font-bold text-center bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 border border-amber-400">
                                ⚠️ Some classes have fewer than 2 samples — predictions may be unreliable. Go back to Collect and add more samples.
                            </div>
                        )}
                        {/* Confidence Threshold */}
                        <div className="w-full max-w-[720px] mt-2 bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-gray-700">🎚️ Confidence Threshold</span>
                                <span className="text-xs font-extrabold text-[#0ea5e9] bg-[#f0f9ff] px-2 py-0.5 rounded-md">{Math.round(confidenceThreshold * 100)}%</span>
                            </div>
                            <input type="range" min="0" max="100" value={Math.round(confidenceThreshold * 100)}
                                onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0ea5e9]" />
                        </div>
                    </div>
                    <div className="w-full mt-4 flex-1 min-h-0 flex flex-col">
                        <TestPanel prediction={prediction} isProcessing={isProcessing} cameraOn={cameraOn} testImage={testImage} videoRef={videoRef} canvasRef={canvasRef} onToggleCamera={toggleCamera} onUpload={() => testFileInputRef.current?.click()} onReset={() => { setTestImage(null); setPrediction(null) }} onTryAnother={() => { setTestImage(null); setPrediction(null) }} onExport={handleExportTestReport} fileInputRef={testFileInputRef} onFileChange={handleTestUpload} testsRun={prediction ? 1 : 0} inferenceTime={inferenceTime} modelLoading={modelLoading} />
                    </div>
                    <input ref={testFileInputRef} type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
                </div>
            )}
        </div>
    )
}
