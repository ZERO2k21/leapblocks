import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { PoseClassifier } from '../../ml/classifiers/PoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import { useIsMobile } from '../../hooks/useResponsive'
import WorkflowIndicator from '../components/WorkflowIndicator'
import StatsBar from '../components/StatsBar'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface PoseClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function PoseClassifierPanel({ mode }: PoseClassifierPanelProps) {
    const isMobile = useIsMobile(768)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const testFileInputRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new PoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [isCapturing, setIsCapturing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameraOn, setCameraOn] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [captureFlash, setCaptureFlash] = useState(false)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [testImage, setTestImage] = useState<string | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)

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
            console.error('[PoseClassifier] Camera access denied:', err)
            setCameraError('Camera access is needed for pose detection. Please allow camera access in your browser settings and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) {
            s.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setStream(null)
        setCameraOn(false)
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) {
            stopCamera()
        } else {
            startCamera()
        }
    }, [cameraOn, startCamera, stopCamera])

    const showFlash = useCallback(() => {
        setCaptureFlash(true)
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
        flashTimeoutRef.current = setTimeout(() => setCaptureFlash(false), 300)
    }, [])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    // Keep refs in sync
    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    // Sync stream to video element
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
            cancelAnimationFrame(0)
            classifierRef.current.dispose()
            if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
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

    // Rebuild classifier when entering train/test mode
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

    // Test mode: auto-start camera and run predictions
    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        // Auto-start camera when entering test mode
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (cameraOnRef.current && streamStateRef.current && videoRef.current && canvasRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const start = performance.now()
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        canvasRef.current.width = videoRef.current.videoWidth || 640
                        canvasRef.current.height = videoRef.current.videoHeight || 480
                        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
                        const result = await classifierRef.current.predictFromImage(canvasRef.current)
                        const elapsed = Math.round(performance.now() - start)
                        if (result) {
                            setPrediction(result)
                            setInferenceTime(elapsed)
                        }
                    }
                } catch { /* ignore */ }
                setIsProcessing(false)
                isPredictingRef.current = false
            }
        }
        if (cameraOn && stream) {
            runPrediction()
            const interval = setInterval(runPrediction, 1000)
            return () => clearInterval(interval)
        }
    }, [mode.mode, stream, cameraOn, modelLoading])

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !mode.selectedClassId || !cameraOn) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
            return
        }
        if (isCapturing) return
        setIsCapturing(true)
        try {
            const video = videoRef.current
            const canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(video, 0, 0)
            const keypoints = await classifierRef.current.detectPose(canvas)
            if (keypoints && keypoints.length > 0) {
                const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(keypoints) })
                if (!added) {
                    showSaved('⚠️ Sample limit reached! (20 per class)')
                    return
                }
                classifierRef.current.addSampleFromKeypoints(keypoints, mode.getSelectedClass()?.name || '').catch(() => undefined)
                showFlash()
                const className = mode.getSelectedClass()?.name || 'class'
                showSaved(`📸 Saved to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
            } else {
                showSaved('⚠️ No pose detected! Try striking a clearer pose.')
            }
        } catch (err) {
            console.warn('[PoseClassifier] Capture failed:', err)
            showSaved('⚠️ Capture failed. Try again.')
        } finally {
            setTimeout(() => setIsCapturing(false), 300)
        }
    }

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
        let noPoseCount = 0
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
                    const keypoints = await classifierRef.current.detectPose(tempCanvas)
                    if (keypoints && keypoints.length > 0) {
                        const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(keypoints) })
                        if (!added) {
                            limitReached = true
                            break
                        }
                        classifierRef.current.addSampleFromKeypoints(keypoints, mode.getSelectedClass()?.name || '').catch(() => undefined)
                        successCount++
                    } else {
                        noPoseCount++
                    }
                } catch (err) {
                    console.warn('[PoseClassifier] Upload failed:', err)
                }
            }
        }

        showFlash()
        const className = mode.getSelectedClass()?.name || 'class'
        if (successCount > 0) {
            showSaved(`📂 Saved ${successCount} pose(s) to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
        }
        if (noPoseCount > 0) {
            showSaved(`⚠️ No pose detected in ${noPoseCount} image(s).`)
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
                setTimeout(() => resolve(), 3000)
            })
            if (img.complete && img.naturalWidth > 0) {
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = img.naturalWidth
                tempCanvas.height = img.naturalHeight
                const ctx = tempCanvas.getContext('2d')!
                ctx.drawImage(img, 0, 0)
                const start = performance.now()
                const result = await classifierRef.current.predictFromImage(tempCanvas)
                const elapsed = Math.round(performance.now() - start)
                if (result) {
                    setPrediction(result)
                    setInferenceTime(elapsed)
                }
            }
        } catch { /* prediction failed */ }
        setIsProcessing(false)
        if (testFileInputRef.current) testFileInputRef.current.value = ''
    }

    // Register global window drag-and-drop upload handler
    useEffect(() => {
        if (mode.mode === 'collect') {
            const selectedClass = mode.getSelectedClass();
            (window as any).__activeUpload = {
                handler: (files: FileList) => {
                    if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
                        mode.setSelectedClassId(mode.project.classes[0].id)
                    }
                    handleUpload({ target: { files } } as any)
                },
                label: selectedClass ? `Class: ${selectedClass.name}` : 'Pose Samples'
            }
        } else if (mode.mode === 'test') {
            (window as any).__activeUpload = {
                handler: (files: FileList) => {
                    handleTestUpload({ target: { files } } as any)
                },
                label: 'Test Image'
            }
        } else {
            (window as any).__activeUpload = null
        }
        return () => { (window as any).__activeUpload = null }
    }, [mode.mode, mode.selectedClassId, mode.project])

    const handleTestCapture = useCallback(async () => {
        if (!videoRef.current || !cameraOn || modelLoading) return
        setIsProcessing(true)
        try {
            const start = performance.now()
            const canvas = canvasRef.current
            if (canvas && videoRef.current) {
                canvas.width = videoRef.current.videoWidth || 640
                canvas.height = videoRef.current.videoHeight || 480
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
                    const result = await classifierRef.current.predictFromImage(canvas)
                    const elapsed = Math.round(performance.now() - start)
                    if (result) {
                        setPrediction(result)
                        setInferenceTime(elapsed)
                    }
                }
            }
        } catch (err) {
            console.error('[PoseClassifier] Test capture error:', err)
        }
        setIsProcessing(false)
    }, [cameraOn, modelLoading])

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
        try {
            // Wait for model rebuild
            setModelLoading(true)
            classifierRef.current.clear()
            for (const cls of project.classes) {
                if (cls.samples.length > 0) {
                    for (const sample of cls.samples) {
                        try {
                            const keypoints = JSON.parse(sample.data)
                            await classifierRef.current.addSampleFromKeypoints(keypoints, cls.name)
                        } catch { /* skip */ }
                    }
                }
            }
            setModelLoading(false)
            await new Promise(r => setTimeout(r, 500))

            // Run LOO accuracy evaluation
            let correct = 0
            let total = 0
            for (const cls of project.classes) {
                for (let i = 0; i < cls.samples.length; i++) {
                    try {
                        const keypoints = JSON.parse(cls.samples[i].data)
                        const result = await classifierRef.current.predict(keypoints, 5)
                        if (result && result.label === cls.name) correct++
                        total++
                        await new Promise(r => setTimeout(r, 0))
                    } catch { total++ }
                }
            }
            const accuracy = total > 0 ? correct / total : 0
            mode.setAccuracy(accuracy)
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch {
            mode.setAccuracy(0)
        }
        setIsTraining(false)
    }

    const handleExportTestReport = useCallback(() => {
        if (!prediction) return
        const sortedConfidences = Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a)
        const report = {
            projectName: mode.project?.name || 'Untitled',
            projectType: 'pose-classifier',
            exportedAt: new Date().toISOString(),
            testResults: {
                prediction: prediction.label,
                confidence: sortedConfidences.length > 0 ? sortedConfidences[0][1] : 0,
                allConfidences: Object.fromEntries(sortedConfidences.map(([k, v]) => [k, Math.round(v * 100) + '%'])),
                inferenceTime
            },
            projectSummary: {
                totalSamples: mode.getTotalSamples(),
                totalClasses: mode.project?.classes.length || 0,
                classes: mode.project?.classes.map(c => ({ name: c.name, sampleCount: c.samples.length })),
                accuracy: mode.accuracy
            }
        }
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${(mode.project?.name || 'report').replace(/[^a-z0-9]/gi, '_')}_test_report.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showSaved('💾 Test report downloaded!')
    }, [prediction, inferenceTime, mode, showSaved])

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit
    const totalSamples = mode.getTotalSamples()

    let warningTitle = ''
    let warningDesc = ''
    if (mode.project && mode.project.classes.length < 2) {
        warningTitle = 'Add at least 2 classes'
        warningDesc = 'Create 2 or more classes to start training'
    } else if (totalSamples === 0) {
        warningTitle = 'Add samples to train the model'
        warningDesc = 'Capture or upload images for each class'
    } else if (mode.project && mode.project.classes.some(c => c.samples.length < 2)) {
        warningTitle = 'Add more samples per class'
        warningDesc = 'Each class needs at least 2 samples for reliable training.'
    }

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {/* Toast messages */}
            {captureFlash && <div className="fixed inset-0 bg-white/40 z-50 pointer-events-none animate-fade-in" />}
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    {/* Header + Workflow - centered */}
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">🤸 Pose Master!</h2>
                            <p className="text-xs text-[#4a4455]">Strike a pose and teach your AI! 🕺</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>

                    {/* Camera error */}
                    {cameraError && !cameraOn && (
                        <div className="w-full max-w-[520px] bg-white rounded-3xl p-8 shadow-md border border-[#dae2fd] text-center animate-scale-in mx-auto">
                            <span className="text-5xl mb-4 block">🚫</span>
                            <h3 className="text-lg font-bold text-[#131b2e] mb-2">Camera Access Needed 📷</h3>
                            <p className="text-sm text-[#4a4455] mb-6 max-w-sm mx-auto">{cameraError}</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={startCamera} className="px-6 py-3 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">Try Again 🔄</button>
                                <button onClick={() => { setCameraError(null); fileInputRef.current?.click() }} className="px-6 py-3 bg-[#eaedff] text-[#131b2e] rounded-xl font-bold text-sm hover:bg-[#dae2fd] transition-all">Upload Only 📂</button>
                            </div>
                        </div>
                    )}



                    {/* Horizontal split */}
                    <div className="w-full flex flex-col lg:flex-row gap-4 flex-1 min-h-0" style={{ marginTop: '16px' }}>
                        {/* Left half - Camera feed */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* Camera feed */}
                            <div className={`relative rounded-2xl overflow-hidden bg-[#1e1b4b] w-full shadow-lg aspect-[4/3] transition-all duration-300 ${cameraOn ? '' : 'hidden'}`}>
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain rounded-2xl -scale-x-100" />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none -scale-x-100" />
                                {captureFlash && <div className="absolute inset-0 bg-white/50 animate-flash rounded-2xl" />}
                                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                    <div className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                                    <span className="text-white text-[10px] font-bold tracking-wide">🤸 LIVE</span>
                                </div>
                                {selectedClass && (
                                    <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: `${selectedClass.color}CC` }}>
                                        {selectedClass.name}
                                    </div>
                                )}
                                {/* Center capture button */}
                                {cameraOn && (
                                    <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
                                        <CaptureButton
                                            onClick={handleCapture}
                                            disabled={!canAddSamples || isCapturing}
                                            label={isCapturing ? '📸 Captured!' : atSampleLimit ? 'Max Reached' : 'Capture Pose 🤸'}
                                            icon="pose"
                                            color={selectedClass?.color || '#630ed4'}
                                            pulse={!isCapturing && !!canAddSamples}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Camera off placeholder */}
                            {!cameraOn && !cameraError && (
                                <div 
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        setIsDragging(true)
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault()
                                        setIsDragging(false)
                                    }}
                                    onDrop={async (e) => {
                                        e.preventDefault()
                                        setIsDragging(false)
                                        if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
                                            mode.setSelectedClassId(mode.project.classes[0].id)
                                        }
                                        if (e.dataTransfer.files.length > 0) {
                                            await handleUpload(e.dataTransfer.files)
                                        }
                                    }}
                                    style={{ 
                                        flex: 1, 
                                        borderRadius: '16px', 
                                        overflow: 'hidden', 
                                        background: isDragging ? '#ede9fe' : '#f5f3ff', 
                                        border: isDragging ? '2px dashed #630ed4' : '2px dashed rgba(99,14,212,0.2)', 
                                        position: 'relative', 
                                        minHeight: '300px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ pointerEvents: isDragging ? 'none' : 'auto', display: 'contents' }}>
                                        <span style={{ fontSize: '3.5rem', marginBottom: '12px', transform: isDragging ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                                            {isDragging ? '📥' : '🤸'}
                                        </span>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#131b2e', marginBottom: '6px' }}>
                                            {isDragging ? 'Drop Image Here! 📥' : 'Camera is off'}
                                        </h3>
                                        <p style={{ fontSize: '12px', color: '#4a4455', marginBottom: '16px' }}>
                                            {isDragging ? 'Drop files to upload instantly' : 'Start the camera to capture poses!'}
                                        </p>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', opacity: isDragging ? 0.3 : 1, transition: 'opacity 0.2s ease' }}>
                                            <button onClick={startCamera} style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', boxShadow: '0 4px 14px rgba(99,14,212,0.35)' }}>
                                                📷 Turn On Camera
                                            </button>
                                            <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 600 }}>or</span>
                                            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: '2px solid #630ed4', cursor: 'pointer', background: '#fff', color: '#630ed4' }}>
                                                📂 Upload
                                            </button>
                                        </div>
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                                </div>
                            )}
                        </div>

                        {/* Right half - Controls, Stats, Samples */}
                        <div style={{ width: isMobile ? '100%' : '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Tips */}
                            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '10px', padding: '8px 12px', border: '1px solid rgba(99,14,212,0.1)' }}>
                                <div className="flex items-center" style={{ gap: '6px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>💡</div>
                                    <div className="flex flex-wrap" style={{ gap: '2px 10px' }}>
                                        {['Full body visible', 'Good lighting', 'Clear background', 'Try different poses'].map((tip) => (
                                            <span key={tip} className="flex items-center" style={{ gap: '4px', fontSize: '9px', color: '#4b5563' }}>
                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#630ed4', flexShrink: 0 }} />
                                                {tip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                                <button onClick={toggleCamera} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: cameraOn ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #630ed4, #8b5cf6)', color: '#fff', boxShadow: cameraOn ? '0 4px 14px rgba(239,68,68,0.35)' : '0 4px 14px rgba(99,14,212,0.35)' }}>
                                    {cameraOn ? '⏹️ Stop' : '📷 Start'}
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #630ed4, #8b5cf6)', color: '#fff', boxShadow: '0 4px 14px rgba(99,14,212,0.35)' }}>
                                    📂 Upload
                                </button>
                            </div>

                            {/* Stats */}
                            <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 Total Samples</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#630ed4' }}>{mode.getTotalSamples()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Classes</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#630ed4' }}>{mode.project?.classes.length || 0}</span>
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
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '5px',
                                            background: atSampleLimit ? '#fef3c7' : '#f5f3ff',
                                            color: atSampleLimit ? '#c32c00' : '#630ed4',
                                        }}>
                                            {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="neura-scrollbar">
                                        <SampleGrid samples={selectedClass.samples} type="keypoints" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
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
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} warningTitle={warningTitle} warningDesc={warningDesc} sampleType="poses" mode={mode.mode} onModeChange={mode.setMode} workflowType="pose" />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    {/* Header + Workflow - centered */}
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">🧪 Test Your AI!</h2>
                            <p className="text-xs text-[#4a4455]">Strike a pose and see if your AI recognizes it! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>
                    <div className="w-full" style={{ marginTop: '16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TestPanel
                            prediction={prediction}
                            isProcessing={isProcessing}
                            cameraOn={cameraOn}
                            testImage={testImage}
                            videoRef={videoRef}
                            canvasRef={canvasRef}
                            onCapture={handleTestCapture}
                            onUpload={() => testFileInputRef.current?.click()}
                            onToggleCamera={toggleCamera}
                            onReset={() => { setTestImage(null); setPrediction(null) }}
                            onTryAnother={() => { setTestImage(null); setPrediction(null) }}
                            onExport={handleExportTestReport}
                            fileInputRef={testFileInputRef}
                            onFileChange={handleTestUpload}
                            projectName={mode.project?.name}
                            testsRun={prediction ? 1 : 0}
                            inferenceTime={inferenceTime}
                            modelLoading={modelLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
