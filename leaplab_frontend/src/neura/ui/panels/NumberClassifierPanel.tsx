import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { NumberClassifier } from '../../ml/classifiers/NumberClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import WorkflowIndicator from '../components/WorkflowIndicator'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface NumberClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function NumberClassifierPanel({ mode }: NumberClassifierPanelProps) {
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
                    setPrediction(result)
                    setInferenceTime(elapsed)
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
                setPrediction(result)
                setInferenceTime(elapsed)
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
        <div className="flex flex-col h-full relative">
            {/* Toast */}
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
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">✏️ Number Ninja!</h2>
                            <p className="text-xs text-[#4a4455]">Draw, photograph, or upload numbers to teach your AI! 🔢</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                        </div>
                    </div>

                    {/* Camera error */}
                    {cameraError && inputMode === 'camera' && (
                        <div className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-sm border border-[#dae2fd] text-center mx-auto" style={{ marginTop: '10px' }}>
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
                    <div className="w-full" style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, marginTop: '16px' }}>
                        {/* Left half - Canvas/Camera */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* Drawing canvas */}
                            {inputMode === 'draw' && (
                                <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                    <canvas
                                        ref={drawCanvasRef}
                                        width={360}
                                        height={360}
                                        style={{ width: '100%', aspectRatio: '1/1', maxHeight: '400px', borderRadius: '12px', background: '#fff', touchAction: 'none', cursor: 'crosshair', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)' }}
                                        onMouseDown={handleStart}
                                        onMouseMove={handleMove}
                                        onMouseUp={handleEnd}
                                        onMouseLeave={handleEnd}
                                        onTouchStart={handleStart}
                                        onTouchMove={handleMove}
                                        onTouchEnd={handleEnd}
                                    />
                                    <div className="flex items-center justify-between" style={{ marginTop: '10px' }}>
                                        <button onClick={clearCanvas} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}>
                                            🗑️ Clear
                                        </button>
                                        {selectedClass && (
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#630ed4', background: '#eaedff', padding: '4px 10px', borderRadius: '6px' }}>
                                                Adding to: {selectedClass.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Camera feed */}
                            {inputMode === 'camera' && (
                                <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#0f0e26', border: '1px solid #3b2f63', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minHeight: '250px' }}>
                                    {cameraOn ? (
                                        <>
                                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '6px', zIndex: 10 }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                                                <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>LIVE</span>
                                            </div>
                                            {selectedClass && (
                                                <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '4px 10px', borderRadius: '6px', background: selectedClass.color, color: '#fff', fontSize: '10px', fontWeight: 700, zIndex: 10 }}>
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
                                            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDragging ? 'rgba(99,14,212,0.05)' : 'transparent' }}
                                        >
                                            <div style={{ pointerEvents: isDragging ? 'none' : 'auto', display: 'contents' }}>
                                                <span style={{ fontSize: '3rem', marginBottom: '12px', transform: isDragging ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s ease' }}>{isDragging ? '📥' : '📷'}</span>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{isDragging ? 'Drop Images Here!' : 'Camera is off'}</p>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: isDragging ? 0.3 : 1, transition: 'opacity 0.2s ease' }}>
                                                    <button onClick={startCamera} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', boxShadow: '0 4px 14px rgba(99,14,212,0.35)' }}>
                                                        📷 Turn On Camera
                                                    </button>
                                                    <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 600 }}>or</span>
                                                    <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: '2px solid #630ed4', cursor: 'pointer', background: '#fff', color: '#630ed4' }}>
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
                        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Input mode toggle */}
                            <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '5px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', display: 'flex', gap: '3px' }}>
                                <button onClick={() => { if (cameraOn) stopCamera(); setInputMode('draw') }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: inputMode === 'draw' ? 'linear-gradient(135deg, #630ed4, #7c3aed)' : 'transparent', color: inputMode === 'draw' ? '#fff' : '#6b7280', boxShadow: inputMode === 'draw' ? '0 2px 8px rgba(99,14,212,0.25)' : 'none', transition: 'all 0.2s ease' }}>
                                    <span style={{ fontSize: '13px' }}>✏️</span>
                                    Draw
                                </button>
                                <button onClick={() => { if (!cameraOn) startCamera(); setInputMode('camera') }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: inputMode === 'camera' ? 'linear-gradient(135deg, #630ed4, #7c3aed)' : 'transparent', color: inputMode === 'camera' ? '#fff' : '#6b7280', boxShadow: inputMode === 'camera' ? '0 2px 8px rgba(99,14,212,0.25)' : 'none', transition: 'all 0.2s ease' }}>
                                    <span style={{ fontSize: '13px' }}>📷</span>
                                    Camera
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'transparent', color: '#6b7280', transition: 'all 0.2s ease' }}>
                                    <span style={{ fontSize: '13px' }}>📂</span>
                                    Upload
                                </button>
                            </div>

                            {/* Smart augment toggle */}
                            <button onClick={() => setAugmentMode(!augmentMode)} disabled={!mode.selectedClassId} style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: augmentMode && mode.selectedClassId ? '2px solid #006c44' : '1px solid #e5e7eb', cursor: mode.selectedClassId ? 'pointer' : 'not-allowed', background: augmentMode && mode.selectedClassId ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'rgba(255,255,255,0.85)', color: augmentMode && mode.selectedClassId ? '#006c44' : '#4a4455', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', backdropFilter: 'blur(12px)', opacity: mode.selectedClassId ? 1 : 0.5, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px' }}>&#10024;</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '11px' }}>{augmentMode ? 'Smart Augment ON' : 'Smart Augment OFF'}</div>
                                    <div style={{ fontSize: '9px', opacity: 0.7 }}>More varied training data</div>
                                </div>
                            </button>

                            {/* Capture button */}
                            <button
                                onClick={inputMode === 'draw' ? handleCaptureDrawing : handleCaptureCamera}
                                disabled={inputMode === 'camera' ? !canAddSamples || !cameraOn : !canAddSamples}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: (inputMode === 'camera' ? canAddSamples && cameraOn : canAddSamples) ? 'pointer' : 'not-allowed',
                                    background: atSampleLimit ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' : 'linear-gradient(135deg, #630ed4, #8b5cf6)',
                                    color: '#fff',
                                    boxShadow: '0 4px 14px rgba(99,14,212,0.35)',
                                    opacity: (inputMode === 'camera' ? canAddSamples && cameraOn : canAddSamples) ? 1 : 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span style={{ fontSize: '14px' }}>{inputMode === 'draw' ? '✏️' : '📸'}</span>
                                {atSampleLimit ? 'Max Reached' : inputMode === 'draw' ? 'Add Drawing' : 'Take Photo'}
                            </button>

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
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', background: atSampleLimit ? '#fef3c7' : '#f5f3ff', color: atSampleLimit ? '#c32c00' : '#630ed4' }}>
                                            {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="neura-scrollbar">
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
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    <div className="w-full" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} currentEpoch={currentEpoch} totalEpochs={totalEpochs} sampleType="numbers" mode={mode.mode} onModeChange={mode.setMode} />
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
                            <p className="text-xs text-[#4a4455]">Draw, photograph, or upload a number to test! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                        </div>
                    </div>

                    {/* Horizontal split */}
                    <div className="w-full" style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                        {/* Left half - Canvas/Camera */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            {modelLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f5f3ff', borderRadius: '12px', border: '1px solid rgba(99,14,212,0.2)', marginBottom: '10px' }}>
                                    <div style={{ width: '16px', height: '16px', border: '2px solid #630ed4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#630ed4' }}>Loading model...</span>
                                </div>
                            )}

                            {/* Draw mode test */}
                            {inputMode === 'draw' && !testImage && (
                                <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                    <canvas
                                        ref={drawCanvasRef}
                                        width={360}
                                        height={360}
                                        style={{ width: '100%', aspectRatio: '1/1', maxHeight: '400px', borderRadius: '12px', background: '#fff', touchAction: 'none', cursor: 'crosshair', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)' }}
                                        onMouseDown={handleStart}
                                        onMouseMove={handleMove}
                                        onMouseUp={handleEnd}
                                        onMouseLeave={handleEnd}
                                        onTouchStart={handleStart}
                                        onTouchMove={handleMove}
                                        onTouchEnd={handleEnd}
                                    />
                                    <div className="flex items-center justify-between" style={{ marginTop: '10px' }}>
                                        <button onClick={clearCanvas} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}>
                                            🗑️ Clear
                                        </button>
                                        <button onClick={handleTestDrawCapture} disabled={isProcessing || modelLoading} style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: isProcessing || modelLoading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', boxShadow: '0 4px 14px rgba(99,14,212,0.35)', opacity: isProcessing || modelLoading ? 0.5 : 1 }}>
                                            {isProcessing ? '🔍 Analyzing...' : '🎯 Predict Drawing'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Camera mode test */}
                            {inputMode === 'camera' && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                                                if (result) { setPrediction(result); setInferenceTime(0) }
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
                        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Test input mode toggle */}
                            <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '5px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', display: 'flex', gap: '3px' }}>
                                <button onClick={() => { if (cameraOn) stopCamera(); setTestImage(null); setPrediction(null); setInputMode('draw') }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: inputMode === 'draw' ? 'linear-gradient(135deg, #630ed4, #7c3aed)' : 'transparent', color: inputMode === 'draw' ? '#fff' : '#6b7280', boxShadow: inputMode === 'draw' ? '0 2px 8px rgba(99,14,212,0.25)' : 'none', transition: 'all 0.2s ease' }}>
                                    <span style={{ fontSize: '13px' }}>✏️</span> Draw
                                </button>
                                <button onClick={() => { setTestImage(null); setPrediction(null); if (!cameraOn) startCamera(); setInputMode('camera') }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: inputMode === 'camera' ? 'linear-gradient(135deg, #630ed4, #7c3aed)' : 'transparent', color: inputMode === 'camera' ? '#fff' : '#6b7280', boxShadow: inputMode === 'camera' ? '0 2px 8px rgba(99,14,212,0.25)' : 'none', transition: 'all 0.2s ease' }}>
                                    <span style={{ fontSize: '13px' }}>📷</span> Camera
                                </button>
                                <button onClick={() => testFileInputRef.current?.click()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'transparent', color: '#6b7280', transition: 'all 0.2s ease' }}>
                                    <span style={{ fontSize: '13px' }}>📂</span> Upload
                                </button>
                                <input ref={testFileInputRef} type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
                            </div>

                            {/* Draw mode results */}
                            {inputMode === 'draw' && prediction && !isProcessing && (
                                <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '16px', border: '1px solid #006c44', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#25fea8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,254,168,0.3)' }}>
                                            <span style={{ fontSize: '20px' }}>🎯</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#006c44', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Result</span>
                                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#131b2e' }}>It's {prediction.label}! 🎉</h3>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a).map(([label, confidence]) => (
                                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#131b2e', width: '24px', textAlign: 'center' }}>{label}</span>
                                                <div style={{ flex: 1, height: '8px', background: '#ede9fe', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #630ed4, #7c3aed)', width: `${confidence * 100}%`, transition: 'width 0.5s ease' }} />
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#630ed4', minWidth: '36px', textAlign: 'right' }}>{Math.round(confidence * 100)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(99,14,212,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>💡</div>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#630ed4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tips</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {['Draw clearly in the center', 'Use bold strokes', 'Try different handwriting'].map((tip) => (
                                        <span key={tip} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#4a4455' }}>
                                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#630ed4', flexShrink: 0 }} />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
