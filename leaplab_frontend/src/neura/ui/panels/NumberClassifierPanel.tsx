import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { NumberClassifier } from '../../ml/classifiers/NumberClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
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
    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !mode.selectedClassId) return
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
                <div className="flex-1 flex flex-col items-center gap-6 p-6 overflow-y-auto neura-scrollbar">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-1">✏️ Number Ninja!</h2>
                        <p className="text-sm text-[#4a4455]">Draw, photograph, or upload numbers to teach your AI! 🔢</p>
                    </div>

                    {/* Input mode toggle */}
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-[#dae2fd] shadow-sm">
                        <button
                            onClick={() => { if (cameraOn) stopCamera(); setInputMode('draw') }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${inputMode === 'draw' ? 'bg-[#630ed4] text-white shadow-md' : 'text-[#4a4455] hover:bg-[#eaedff]'}`}
                        >
                            ✏️ Draw
                        </button>
                        <button
                            onClick={() => { if (!cameraOn) startCamera(); setInputMode('camera') }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${inputMode === 'camera' ? 'bg-[#630ed4] text-white shadow-md' : 'text-[#4a4455] hover:bg-[#eaedff]'}`}
                        >
                            📷 Camera
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!mode.selectedClassId}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode.selectedClassId ? 'text-[#4a4455] hover:bg-[#eaedff]' : 'text-[#ccc3d8] cursor-not-allowed'}`}
                        >
                            📂 Upload
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setAugmentMode(!augmentMode)} disabled={!mode.selectedClassId} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${augmentMode && mode.selectedClassId ? 'bg-[#d1fae5] text-[#006c44] ring-2 ring-[#006c44]/30' : mode.selectedClassId ? 'bg-[#f2f3ff] text-[#4a4455] hover:bg-[#eaedff]' : 'bg-[#f9fafb] text-[#ccc3d8] cursor-not-allowed'}`} title="Makes training data more varied for better results">
                            <span className="text-sm">&#10024;</span>
                            {augmentMode ? 'Smart ON' : 'Smart OFF'}
                        </button>
                    </div>

                    {/* Camera error */}
                    {cameraError && inputMode === 'camera' && (
                        <div className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-sm border border-[#dae2fd] text-center">
                            <span className="text-4xl mb-3 block">🚫</span>
                            <h3 className="text-sm font-bold text-[#131b2e] mb-2">Camera Access Needed</h3>
                            <p className="text-xs text-[#4a4455] mb-4">{cameraError}</p>
                            <div className="flex gap-2 justify-center">
                                <button onClick={startCamera} className="px-4 py-2 bg-[#630ed4] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all">Try Again</button>
                                <button onClick={() => { setCameraError(null); setInputMode('draw') }} className="px-4 py-2 bg-[#eaedff] text-[#131b2e] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-all">Draw Instead</button>
                            </div>
                        </div>
                    )}

                    {/* Drawing canvas */}
                    {inputMode === 'draw' && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 border border-[#dae2fd] shadow-sm">
                            <canvas
                                ref={drawCanvasRef}
                                width={360}
                                height={360}
                                className="rounded-2xl bg-white touch-none cursor-crosshair shadow-inner w-full max-w-80 aspect-square"
                                onMouseDown={handleStart}
                                onMouseMove={handleMove}
                                onMouseUp={handleEnd}
                                onMouseLeave={handleEnd}
                                onTouchStart={handleStart}
                                onTouchMove={handleMove}
                                onTouchEnd={handleEnd}
                            />
                            <div className="flex items-center justify-between mt-3">
                                <button onClick={clearCanvas} className="flex items-center gap-1.5 px-4 py-2 bg-[#fee2e2] text-[#991b1b] rounded-xl text-xs font-bold hover:bg-[#fecaca] transition-all">
                                    🗑️ Clear
                                </button>
                                {selectedClass && (
                                    <span className="text-xs font-bold text-[#630ed4] bg-[#eaedff] px-3 py-1.5 rounded-lg">
                                        Adding to: {selectedClass.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Camera feed */}
                    {inputMode === 'camera' && (
                        <div className={`relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[420px] transition-all duration-300 aspect-[4/3] ${cameraOn ? '' : 'hidden'}`}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain rounded-3xl bg-black" />
                            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                                <span className="text-white text-[10px] font-bold tracking-wide">LIVE</span>
                            </div>
                            {selectedClass && (
                                <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: `${selectedClass.color}CC` }}>
                                    {selectedClass.name}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Camera off placeholder */}
                    {inputMode === 'camera' && !cameraOn && !cameraError && (
                        <div className="w-full max-w-[420px] border-2 border-dashed border-[#630ed4]/20 rounded-3xl p-6 text-center">
                            <span className="text-4xl mb-3 block">📷</span>
                            <p className="text-sm font-bold text-[#131b2e] mb-2">Camera is off</p>
                            <button onClick={startCamera} className="px-5 py-2.5 bg-[#630ed4] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all">Turn On Camera</button>
                        </div>
                    )}

                    <canvas ref={cameraCanvasRef} className="hidden" />

                    {/* Capture buttons */}
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        {inputMode === 'draw' ? (
                            <CaptureButton onClick={handleCaptureDrawing} disabled={!canAddSamples} label={atSampleLimit ? 'Max Reached 🎯' : 'Add Drawing ✏️'} icon="pen" color={selectedClass?.color || '#630ed4'} />
                        ) : (
                            <CaptureButton onClick={handleCaptureCamera} disabled={!canAddSamples || !cameraOn} label={atSampleLimit ? 'Max Reached 🎯' : 'Take Photo 📸'} icon="camera" color={selectedClass?.color || '#630ed4'} />
                        )}
                    </div>

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${atSampleLimit ? 'text-[#c32c00] bg-[#fef3c7]' : 'text-[#4a4455] bg-[#f2f3ff]'}`}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                    </span>
                                </div>
                                <SampleGrid samples={selectedClass.samples} type="image" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-1">🏋️ Teach Your AI Numbers!</h2>
                        <p className="text-sm text-[#4a4455]">Your AI is learning to count! 🔢</p>
                    </div>
                    {modelLoading && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-[#eaedff] rounded-2xl border border-[#630ed4]/20 animate-fade-in">
                            <div className="w-5 h-5 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-bold text-[#630ed4]">Loading model... ⏳</span>
                        </div>
                    )}
                    <div className="w-full flex justify-center">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} currentEpoch={currentEpoch} totalEpochs={totalEpochs} />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-6 overflow-y-auto neura-scrollbar">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-1">🧪 Test Your AI!</h2>
                        <p className="text-sm text-[#4a4455]">Draw, photograph, or upload a number to test! 🎯</p>
                    </div>

                    {/* Test input mode toggle */}
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-[#dae2fd] shadow-sm">
                        <button
                            onClick={() => { if (cameraOn) stopCamera(); setTestImage(null); setPrediction(null); setInputMode('draw') }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${inputMode === 'draw' ? 'bg-[#630ed4] text-white shadow-md' : 'text-[#4a4455] hover:bg-[#eaedff]'}`}
                        >
                            ✏️ Draw
                        </button>
                        <button
                            onClick={() => { setTestImage(null); setPrediction(null); if (!cameraOn) startCamera(); setInputMode('camera') }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${inputMode === 'camera' ? 'bg-[#630ed4] text-white shadow-md' : 'text-[#4a4455] hover:bg-[#eaedff]'}`}
                        >
                            📷 Camera
                        </button>
                        <button
                            onClick={() => testFileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#4a4455] hover:bg-[#eaedff] transition-all"
                        >
                            📂 Upload
                        </button>
                        <input ref={testFileInputRef} type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
                    </div>

                    {modelLoading && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-[#eaedff] rounded-2xl border border-[#630ed4]/20 animate-fade-in">
                            <div className="w-5 h-5 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-bold text-[#630ed4]">Loading model... ⏳</span>
                        </div>
                    )}

                    {/* Draw mode test */}
                    {inputMode === 'draw' && !testImage && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 border border-[#dae2fd] shadow-sm">
                            <canvas
                                ref={drawCanvasRef}
                                width={360}
                                height={360}
                                className="rounded-2xl bg-white touch-none cursor-crosshair shadow-inner w-full max-w-80 aspect-square"
                                onMouseDown={handleStart}
                                onMouseMove={handleMove}
                                onMouseUp={handleEnd}
                                onMouseLeave={handleEnd}
                                onTouchStart={handleStart}
                                onTouchMove={handleMove}
                                onTouchEnd={handleEnd}
                            />
                            <div className="flex justify-center mt-3">
                                <button onClick={clearCanvas} className="flex items-center gap-1.5 px-4 py-2 bg-[#fee2e2] text-[#991b1b] rounded-xl text-xs font-bold hover:bg-[#fecaca] transition-all">🗑️ Clear</button>
                            </div>
                        </div>
                    )}

                    {/* Draw mode test - predict button */}
                    {inputMode === 'draw' && !testImage && (
                        <button onClick={handleTestDrawCapture} disabled={isProcessing || modelLoading} className="px-6 py-3 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                            {isProcessing ? '🔍 Analyzing...' : '🎯 Predict Drawing'}
                        </button>
                    )}

                    {/* Camera mode test */}
                    {inputMode === 'camera' && (
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
                                    if (result) {
                                        setPrediction(result)
                                        setInferenceTime(0)
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
                    )}

                    {/* Draw mode results (shown below canvas) */}
                    {inputMode === 'draw' && prediction && !isProcessing && (
                        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-[#006c44]/30 shadow-sm text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-[#25fea8] shadow-lg mx-auto">
                                <span className="text-3xl">🎯</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#006c44] uppercase tracking-widest mb-1 block">Result</span>
                            <h2 className="text-xl font-extrabold text-[#131b2e] mb-3">
                                It's {prediction.label}! 🎉
                            </h2>
                            <div className="space-y-1.5 mb-4">
                                {Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a).map(([label, confidence]) => (
                                    <div key={label} className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[#131b2e] w-6 text-center">{label}</span>
                                        <div className="flex-1 h-2.5 bg-[#eaedff] rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${confidence >= 0.7 ? 'bg-[#25fea8]' : confidence >= 0.4 ? 'bg-[#fbbf24]' : 'bg-[#fca5a5]'}`} style={{ width: `${confidence * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-[#4a4455] w-10 text-right">{Math.round(confidence * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 justify-center">
                                <button onClick={() => { setPrediction(null); clearCanvas() }} className="px-4 py-2 bg-[#eaedff] text-[#131b2e] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-all">🔄 Try Again</button>
                                <button onClick={handleExportTestReport} className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all">💾 Export Report</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
