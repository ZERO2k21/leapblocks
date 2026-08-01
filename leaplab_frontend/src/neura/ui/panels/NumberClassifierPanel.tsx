import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { NumberClassifier } from '../../ml/classifiers/NumberClassifier'
import { RELATEDNESS_THRESHOLD } from '../../ml/KNNClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import { useIsMobile } from '../../hooks/useResponsive'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import WorkflowIndicator from '../components/WorkflowIndicator'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'
import NotRelatedModal from '../components/NotRelatedModal'

interface NumberClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function NumberClassifierPanel({ mode }: NumberClassifierPanelProps) {
    const isMobile = useIsMobile(768)
    const drawCanvasRef = useRef<HTMLCanvasElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const cameraCanvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const testFileInputRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new NumberClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const isPredictingRef = useRef(false)
    const predictTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const testCameraStartedRef = useRef(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const rebuildAbortRef = useRef(0)

    const [isDrawing, setIsDrawing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [modelLoading, setModelLoading] = useState(false)
    const [cameraOn, setCameraOn] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [testImage, setTestImage] = useState<string | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [showNotRelated, setShowNotRelated] = useState(false)
    const [inputMode, setInputMode] = useState<'draw' | 'camera'>('draw')
    const [augmentMode, setAugmentMode] = useState(true)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const [totalEpochs, setTotalEpochs] = useState(50)
    const lastPosRef = useRef<{ x: number; y: number } | null>(null)
    const skipNextRebuildRef = useRef(false)

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'environment' }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
            streamRef.current = mediaStream
            setCameraOn(true)
            setInputMode('camera')
        } catch (err) {
            console.error('Camera access denied:', err)
            setCameraError('Camera access is needed to take photos. Please allow camera access and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) {
            s.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setCameraOn(false)
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) {
            stopCamera()
            setInputMode('draw')
        } else {
            startCamera()
        }
    }, [cameraOn, startCamera, stopCamera])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    useEffect(() => {
        cameraOnRef.current = cameraOn
    }, [cameraOn])

    useEffect(() => {
        streamStateRef.current = streamRef.current
    })

    // Sync stream to video element when cameraOn changes (video element may mount after stream is set)
    useEffect(() => {
        if (cameraOn && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
            videoRef.current.srcObject = streamRef.current
            videoRef.current.play().catch(() => undefined)
        }
    }, [cameraOn])

    useEffect(() => {
        return () => {
            stopCamera()
            if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current)
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        }
    }, [])

    // Rebuild classifier when entering train/test mode
    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            if (skipNextRebuildRef.current && mode.mode === 'test') {
                skipNextRebuildRef.current = false
                setModelLoading(false)
                return
            }
            skipNextRebuildRef.current = false
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
                if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    // Reset test camera flag when leaving test mode
    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    // Auto-start camera & run prediction in test mode
    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (cameraOnRef.current && streamRef.current && videoRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const canvas = cameraCanvasRef.current
                    if (canvas && videoRef.current) {
                        canvas.width = videoRef.current.videoWidth || 640
                        canvas.height = videoRef.current.videoHeight || 480
                        const ctx = canvas.getContext('2d')!
                        ctx.drawImage(videoRef.current, 0, 0)
                        const start = performance.now()
                        const result = await classifierRef.current.predict(canvas, 3)
                        const elapsed = Math.round(performance.now() - start)
                        if (result) {
                            setPrediction(result)
                            setInferenceTime(elapsed)
                        }
                    }
                } catch (err) {
                    console.error('[NumberClassifier] Prediction error:', err)
                }
                setIsProcessing(false)
                isPredictingRef.current = false
            }
        }
        if (cameraOn && streamRef.current) {
            runPrediction()
            const interval = setInterval(runPrediction, 500)
            return () => clearInterval(interval)
        }
    }, [mode.mode, cameraOn, modelLoading])

    // Drawing handlers
    const clearCanvas = useCallback(() => {
        const canvas = drawCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        setPrediction(null)
    }, [])

    const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = drawCanvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
        return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
    }, [])

    const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
        const canvas = drawCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = '#131b2e'
        ctx.lineWidth = 12
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
    }, [])

    const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        const pos = getCanvasPos(e)
        if (!pos) return
        setIsDrawing(true)
        lastPosRef.current = pos
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
        setIsDrawing(false)
        lastPosRef.current = null
    }, [])

    // Capture from drawing canvas
    const handleCaptureDrawing = useCallback(() => {
        if (!mode.selectedClassId || !drawCanvasRef.current) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        const dataUrl = drawCanvasRef.current.toDataURL('image/png')
        mode.addSample(mode.selectedClassId, { type: 'image', data: dataUrl })
        classifierRef.current.addSample(drawCanvasRef.current, mode.getSelectedClass()?.name || '').catch(() => undefined)
        clearCanvas()
        showSaved(`✏️ Drawing saved to ${mode.getSelectedClass()?.name || 'class'}!`)
    }, [mode, clearCanvas, showSaved])

    // Capture from camera
    const handleCaptureCamera = useCallback(() => {
        if (!mode.selectedClassId || !videoRef.current || !cameraOn) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        const video = videoRef.current
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        mode.addSample(mode.selectedClassId, { type: 'image', data: dataUrl })
        classifierRef.current.addSample(canvas, mode.getSelectedClass()?.name || '').catch(() => undefined)
        showSaved(`📸 Photo saved to ${mode.getSelectedClass()?.name || 'class'}!`)
    }, [mode, cameraOn, showSaved])

    // Upload handler
    const handleUpload = useCallback(async (eOrFiles: React.ChangeEvent<HTMLInputElement> | FileList | File[]) => {
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
            alert(`Maximum ${MAX_SAMPLES_PER_CLASS} samples per class reached.`)
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.type.startsWith('image/')) continue
            const currentClass = mode.getSelectedClass()
            if (currentClass && currentClass.samples.length >= MAX_SAMPLES_PER_CLASS) break
            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })
            mode.addSample(mode.selectedClassId, { type: 'image', data: dataUrl })
            const img = new Image()
            img.src = dataUrl
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(() => resolve(), 3000)
            })
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                await classifierRef.current.addSample(img, mode.getSelectedClass()?.name || '')
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
        showSaved(`📂 Images uploaded to ${mode.getSelectedClass()?.name || 'class'}!`)
    }, [mode, showSaved])

    // Test upload handler
    const handleTestUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        if (modelLoading) {
            alert('Model is still loading. Please wait and try again.')
            return
        }
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })
        setTestImage(dataUrl)
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
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                const start = performance.now()
                const result = await classifierRef.current.predict(img, 3)
                const elapsed = Math.round(performance.now() - start)
                if (result) {
                    if (result.similarity !== undefined && result.similarity < RELATEDNESS_THRESHOLD) {
                        setPrediction(null)
                        setShowNotRelated(true)
                    } else {
                        setPrediction(result)
                        setInferenceTime(elapsed)
                    }
                } else {
                    setPrediction(null)
                    setShowNotRelated(true)
                }
            }
        } catch { /* prediction failed */ }
        setIsProcessing(false)
        if (testFileInputRef.current) testFileInputRef.current.value = ''
    }, [modelLoading, stopCamera])

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
                label: selectedClass ? `Class: ${selectedClass.name}` : 'Number Samples'
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

    // Test capture from drawing canvas
    const handleTestDrawCapture = useCallback(async () => {
        if (!drawCanvasRef.current || modelLoading) return
        setIsProcessing(true)
        try {
            const start = performance.now()
            const result = await classifierRef.current.predict(drawCanvasRef.current, 3)
            const elapsed = Math.round(performance.now() - start)
            if (result) {
                if (result.similarity !== undefined && result.similarity < RELATEDNESS_THRESHOLD) {
                    setPrediction(null)
                    setShowNotRelated(true)
                } else {
                    setPrediction(result)
                    setInferenceTime(elapsed)
                }
            } else {
                setPrediction(null)
                setShowNotRelated(true)
            }
        } catch (err) {
            console.error('[NumberClassifier] Test capture error:', err)
        }
        setIsProcessing(false)
    }, [modelLoading])

    // Export test report
    const handleExportTestReport = useCallback(() => {
        if (!prediction) return
        const sortedConfidences = Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a)
        const report = {
            projectName: mode.project?.name || 'Untitled',
            projectType: 'numbers-cr',
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

    // Training
    const handleTrain = async (epochs = 50) => {
        setIsTraining(true)
        setTotalEpochs(epochs)
        setCurrentEpoch(0)
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
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
            await new Promise(r => setTimeout(r, 800))

            const sampleCounts = classifierRef.current.getSampleCounts()
            const trainedClasses = Object.keys(sampleCounts)
            if (trainedClasses.length < 2) {
                mode.setAccuracy(0)
                setIsTraining(false)
                return
            }

            const { NumberClassifier: LOClassifier } = await import('../../ml/classifiers/NumberClassifier')
            const loClassifier = new LOClassifier()
            for (const cls of project.classes) {
                if (cls.samples.length > 0) {
                    await loClassifier.rebuildClass(cls.name, cls.samples.map(s => s.data), false)
                }
            }

            const minSamples = Math.min(...Object.values(loClassifier.getSampleCounts()))
            const adaptiveK = Math.min(5, minSamples)

            let bestAccuracy = 0
            const epochResults: number[] = []

            for (let epoch = 1; epoch <= epochs; epoch++) {
                setCurrentEpoch(epoch)
                const delay = epochs > 50 ? Math.max(5, 20 / (epoch * 0.1)) : Math.max(10, 40 / (epoch * 0.1))
                await new Promise(r => setTimeout(r, delay))

                let correct = 0
                let total = 0
                for (const cls of project.classes) {
                    for (let i = 0; i < cls.samples.length; i++) {
                        const sample = cls.samples[i]
                        try {
                            const img = new Image()
                            img.src = sample.data
                            await new Promise<void>((resolve, reject) => {
                                img.onload = () => resolve()
                                img.onerror = () => reject(new Error('Failed to load image'))
                                setTimeout(() => reject(new Error('Image load timeout')), 5000)
                            })
                            if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
                                total++
                                continue
                            }
                            const tempCanvas = document.createElement('canvas')
                            tempCanvas.width = img.naturalWidth
                            tempCanvas.height = img.naturalHeight
                            const tempCtx = tempCanvas.getContext('2d')!
                            tempCtx.drawImage(img, 0, 0)

                            const result = await loClassifier.predict(tempCanvas, adaptiveK)
                            if (result && result.label === cls.name) correct++
                            total++
                            await new Promise(r => setTimeout(r, 0))
                        } catch { total++ }
                    }
                }

                const rawAccuracy = total > 0 ? correct / total : 0
                epochResults.push(rawAccuracy)

                let weightedSum = 0
                let weightTotal = 0
                for (let i = 0; i < epochResults.length; i++) {
                    const weight = Math.pow(1.5, epochResults.length - 1 - i)
                    weightedSum += epochResults[i] * weight
                    weightTotal += weight
                }
                const smoothedAccuracy = weightTotal > 0 ? weightedSum / weightTotal : rawAccuracy
                if (smoothedAccuracy > bestAccuracy) bestAccuracy = smoothedAccuracy
                mode.setAccuracy(smoothedAccuracy)
            }

            loClassifier.dispose()
            mode.setAccuracy(bestAccuracy)
            skipNextRebuildRef.current = true
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch (err) {
            mode.setAccuracy(0)
            console.error('[NumberClassifier] Training error:', err)
        }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {/* Toast */}
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar py-3 px-5">
                    {/* Header + Workflow - centered */}
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">✏️ Number Ninja!</h2>
                            <p className="text-xs text-[#4a4455]">Draw, photograph, or upload numbers to teach your AI! 🔢</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                        </div>
                    </div>

                    {/* Camera error */}
                    {cameraError && inputMode === 'camera' && (
                        <div className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-sm border border-[#dae2fd] text-center mx-auto mt-2.5">
                            <span className="text-4xl mb-3 block">🚫</span>
                            <h3 className="text-sm font-bold text-[#131b2e] mb-2">Camera Access Needed</h3>
                            <p className="text-xs text-[#4a4455] mb-4">{cameraError}</p>
                            <div className="flex gap-2 justify-center">
                                <button onClick={startCamera} className="px-4 py-2 bg-[#630ed4] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all">Try Again</button>
                                <button onClick={() => { setCameraError(null); setInputMode('draw') }} className="px-4 py-2 bg-[#eaedff] text-[#131b2e] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-all">Draw Instead</button>
                            </div>
                        </div>
                    )}

                    {/* Horizontal split */}
                    <div className="w-full flex flex-col lg:flex-row gap-4 flex-1 min-h-0 mt-4">
                        {/* Left half - Canvas/Camera */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            {/* Drawing canvas */}
                            {inputMode === 'draw' && (
                                <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                                    <canvas
                                        ref={drawCanvasRef}
                                        width={360}
                                        height={360}
                                        className="w-full aspect-square max-h-[400px] rounded-xl bg-white touch-none cursor-crosshair shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]"
                                        onMouseDown={handleStart}
                                        onMouseMove={handleMove}
                                        onMouseUp={handleEnd}
                                        onMouseLeave={handleEnd}
                                        onTouchStart={handleStart}
                                        onTouchMove={handleMove}
                                        onTouchEnd={handleEnd}
                                    />
                                    <div className="flex items-center justify-between mt-2.5">
                                        <button onClick={clearCanvas} className="py-2 px-4 rounded-xl text-[11px] font-bold border-none cursor-pointer bg-red-100 text-red-800">
                                            🗑️ Clear
                                        </button>
                                        {selectedClass && (
                                            <span className="text-[10px] font-bold text-[#630ed4] bg-[#eaedff] py-1 px-2.5 rounded-md">
                                                Adding to: {selectedClass.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Camera feed */}
                            {inputMode === 'camera' && (
                                <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#0f0e26] border border-[#3b2f63] shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-h-[250px]">
                                    {cameraOn ? (
                                        <>
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain -scale-x-100" />
                                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.25 py-1 px-2.5 bg-black/50 backdrop-blur-md rounded-md z-10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                                                <span className="text-white text-[10px] font-bold">LIVE</span>
                                            </div>
                                            {selectedClass && (
                                                <div className="absolute bottom-2.5 left-2.5 py-1 px-2.5 rounded-md text-white text-[10px] font-bold z-10" style={{ background: selectedClass.color }}>
                                                    {selectedClass.name}
                                                </div>
                                            )}
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
                                            className={`absolute inset-0 flex flex-col items-center justify-center ${isDragging ? 'bg-[#630ed4]/5' : 'bg-transparent'}`}
                                        >
                                            <div className={`contents ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                                                <span className={`text-[3rem] mb-3 transition-transform duration-200 ${isDragging ? 'scale-115' : 'scale-100'}`}>{isDragging ? '📥' : '📷'}</span>
                                                <p className="text-sm font-bold text-white mb-3">{isDragging ? 'Drop Images Here!' : 'Camera is off'}</p>
                                                <div className={`flex gap-2 items-center transition-opacity duration-200 ${isDragging ? 'opacity-30' : 'opacity-100'}`}>
                                                    <button onClick={startCamera} className="py-2 px-4 rounded-xl text-[11px] font-bold border-none cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)]">
                                                        📷 Turn On Camera
                                                    </button>
                                                    <span className="text-gray-400 text-[10px] font-semibold">or</span>
                                                    <button onClick={() => fileInputRef.current?.click()} className="py-2 px-4 rounded-xl text-[11px] font-bold border-2 border-[#630ed4] cursor-pointer bg-white text-[#630ed4]">
                                                        📂 Upload
                                                    </button>
                                                </div>
                                            </div>
                                            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <canvas ref={cameraCanvasRef} className="hidden" />
                        </div>

                        {/* Right half - Controls, Stats, Samples */}
                        <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-2.5">
                            {/* Input mode toggle */}
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-1 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex gap-0.75">
                                <button onClick={() => { if (cameraOn) stopCamera(); setInputMode('draw') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'draw' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
                                    <span className="text-[13px]">✏️</span>
                                    Draw
                                </button>
                                <button onClick={() => { if (!cameraOn) startCamera(); setInputMode('camera') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'camera' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
                                    <span className="text-[13px]">📷</span>
                                    Camera
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer bg-transparent text-gray-500 transition-all duration-200">
                                    <span className="text-[13px]">📂</span>
                                    Upload
                                </button>
                            </div>

                            {/* Smart augment toggle */}
                            <button onClick={() => setAugmentMode(!augmentMode)} disabled={!mode.selectedClassId} className={`py-2.5 px-4 rounded-xl text-[11px] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.03)] backdrop-blur-md text-left flex items-center gap-2 transition-all ${augmentMode && mode.selectedClassId ? 'border-2 border-[#006c44] bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#006c44]' : 'border border-gray-200 bg-white/85 text-[#4a4455]'} ${mode.selectedClassId ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'}`}>
                                <span className="text-sm">&#10024;</span>
                                <div>
                                    <div className="font-bold text-[11px]">{augmentMode ? 'Smart Augment ON' : 'Smart Augment OFF'}</div>
                                    <div className="text-[9px] opacity-70">More varied training data</div>
                                </div>
                            </button>

                            {/* Capture button */}
                            <button
                                onClick={inputMode === 'draw' ? handleCaptureDrawing : handleCaptureCamera}
                                disabled={inputMode === 'camera' ? !canAddSamples || !cameraOn : !canAddSamples}
                                className={`py-3 px-5 rounded-xl text-xs font-bold border-none flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(99,14,212,0.35)] text-white transition-all ${(inputMode === 'camera' ? canAddSamples && cameraOn : canAddSamples) ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'} ${atSampleLimit ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 'bg-gradient-to-br from-[#630ed4] to-[#8b5cf6]'}`}
                            >
                                <span className="text-sm">{inputMode === 'draw' ? '✏️' : '📸'}</span>
                                {atSampleLimit ? 'Max Reached' : inputMode === 'draw' ? 'Add Drawing' : 'Take Photo'}
                            </button>

                            {/* Stats */}
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📊 Total Samples</span>
                                    <span className="text-sm font-extrabold text-[#630ed4]">{mode.getTotalSamples()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">🎯 Classes</span>
                                    <span className="text-sm font-extrabold text-[#630ed4]">{mode.project?.classes.length || 0}</span>
                                </div>
                            </div>

                            {/* Samples */}
                            {selectedClass && selectedClass.samples.length > 0 && (
                                <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex-1 min-h-0 flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: selectedClass.color }} />
                                            <span className="text-[11px] font-bold text-[#131b2e]">{selectedClass.name}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold py-0.5 px-1.5 rounded-md ${atSampleLimit ? 'bg-amber-100 text-[#c32c00]' : 'bg-purple-50 text-[#630ed4]'}`}>
                                            {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto neura-scrollbar">
                                        <SampleGrid samples={selectedClass.samples} type="image" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
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
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} currentEpoch={currentEpoch} totalEpochs={totalEpochs} sampleType="numbers" mode={mode.mode} onModeChange={mode.setMode} />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar py-3 px-5">
                    {/* Header + Workflow - centered */}
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">🧪 Test Your AI!</h2>
                            <p className="text-xs text-[#4a4455]">Draw, photograph, or upload a number to test! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                        </div>
                    </div>

                    {/* Horizontal split */}
                    <div className="w-full flex gap-4 mt-2.5">
                        {/* Left half - Canvas/Camera */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            {modelLoading && (
                                <div className="flex items-center gap-2 py-2.5 px-4 bg-[#f5f3ff] rounded-xl border border-[#630ed4]/20 mb-2.5">
                                    <div className="w-4 h-4 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs font-bold text-[#630ed4]">Loading model...</span>
                                </div>
                            )}

                            {/* Draw mode test */}
                            {inputMode === 'draw' && !testImage && (
                                <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                                    <canvas
                                        ref={drawCanvasRef}
                                        width={360}
                                        height={360}
                                        className="w-full aspect-square max-h-[400px] rounded-xl bg-white touch-none cursor-crosshair shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]"
                                        onMouseDown={handleStart}
                                        onMouseMove={handleMove}
                                        onMouseUp={handleEnd}
                                        onMouseLeave={handleEnd}
                                        onTouchStart={handleStart}
                                        onTouchMove={handleMove}
                                        onTouchEnd={handleEnd}
                                    />
                                    <div className="flex items-center justify-between mt-2.5">
                                        <button onClick={clearCanvas} className="py-2 px-4 rounded-xl text-[11px] font-bold border-none cursor-pointer bg-red-100 text-red-800">
                                            🗑️ Clear
                                        </button>
                                        <button onClick={handleTestDrawCapture} disabled={isProcessing || modelLoading} className={`py-2.5 px-5 rounded-xl text-xs font-bold border-none bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)] ${isProcessing || modelLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}>
                                            {isProcessing ? '🔍 Analyzing...' : '🎯 Predict Drawing'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Camera mode test */}
                            {inputMode === 'camera' && (
                                <div className="flex-1 flex flex-col">
                                    <TestPanel
                                        prediction={prediction}
                                        isProcessing={isProcessing}
                                        cameraOn={cameraOn}
                                        testImage={testImage}
                                        videoRef={videoRef}
                                        canvasRef={cameraCanvasRef}
                                        videoFit="contain"
                                        onCapture={() => {
                                            if (!videoRef.current || !cameraOn) return
                                            const video = videoRef.current
                                            const canvas = document.createElement('canvas')
                                            canvas.width = video.videoWidth || 640
                                            canvas.height = video.videoHeight || 480
                                            const ctx = canvas.getContext('2d')!
                                            ctx.drawImage(video, 0, 0)
                                            setTestImage(canvas.toDataURL('image/png'))
                                            stopCamera()
                                            setIsProcessing(true)
                                            classifierRef.current.predict(canvas, 3).then(result => {
                                                if (result && result.similarity !== undefined && result.similarity < RELATEDNESS_THRESHOLD) {
                                                    setPrediction(null)
                                                    setShowNotRelated(true)
                                                } else if (result) {
                                                    setPrediction(result)
                                                    setInferenceTime(0)
                                                } else {
                                                    setPrediction(null)
                                                    setShowNotRelated(true)
                                                }
                                                setIsProcessing(false)
                                            }).catch(() => setIsProcessing(false))
                                        }}
                                        onUpload={() => testFileInputRef.current?.click()}
                                        onToggleCamera={toggleCamera}
                                        onReset={() => { setTestImage(null); setPrediction(null) }}
                                        onTryAnother={() => { setTestImage(null); setPrediction(null); if (!cameraOn) startCamera() }}
                                        onExport={handleExportTestReport}
                                        fileInputRef={testFileInputRef}
                                        onFileChange={handleTestUpload}
                                        projectName={mode.project?.name}
                                        testsRun={prediction ? 1 : 0}
                                        inferenceTime={inferenceTime}
                                        modelLoading={modelLoading}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right half - Controls, Toggle, Results */}
                        <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-2.5">
                            {/* Test input mode toggle */}
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-1 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex gap-0.75">
                                <button onClick={() => { if (cameraOn) stopCamera(); setTestImage(null); setPrediction(null); setInputMode('draw') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'draw' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
                                    <span className="text-[13px]">✏️</span> Draw
                                </button>
                                <button onClick={() => { setTestImage(null); setPrediction(null); if (!cameraOn) startCamera(); setInputMode('camera') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'camera' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
                                    <span className="text-[13px]">📷</span> Camera
                                </button>
                                <button onClick={() => testFileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer bg-transparent text-gray-500 transition-all duration-200">
                                    <span className="text-[13px]">📂</span> Upload
                                </button>
                                <input ref={testFileInputRef} type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
                            </div>

                            {/* Draw mode results */}
                            {inputMode === 'draw' && prediction && !isProcessing && (
                                <div className="bg-white/85 backdrop-blur-md rounded-xl p-4 border border-[#006c44] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-[#25fea8] flex items-center justify-center shadow-[0_4px_12px_rgba(37,254,168,0.3)]">
                                            <span className="text-xl">🎯</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold text-[#006c44] uppercase tracking-wider block">Result</span>
                                            <h3 className="text-base font-extrabold text-[#131b2e]">It's {prediction.label}! 🎉</h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl py-2.5 px-3.5 border border-[#630ed4]/10">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-[10px] shrink-0">💡</div>
                                    <span className="text-[10px] font-bold text-[#630ed4] uppercase tracking-wider">Tips</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {['Draw clearly in the center', 'Use bold strokes', 'Try different handwriting'].map((tip) => (
                                        <span key={tip} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                                            <span className="w-0.75 h-0.75 rounded-full bg-[#630ed4] shrink-0" />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NotRelatedModal
                isOpen={showNotRelated}
                onClose={() => setShowNotRelated(false)}
                onUpload={() => testFileInputRef.current?.click()}
            />
        </div>
    )
}
