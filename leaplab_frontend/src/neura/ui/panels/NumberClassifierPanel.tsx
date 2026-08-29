import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { useCamera } from '../../hooks/useCamera'
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
import SampleWarningModal from '../components/SampleWarningModal'
import TabularPanel from './TabularPanel'
import { useTabularState } from '../../hooks/useTabularState'
import StepperShell from '../shells/StepperShell'
import DashboardShell from '../shells/DashboardShell'

interface NumberClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function NumberClassifierPanel({ mode }: NumberClassifierPanelProps) {
    const isMobile = useIsMobile(768)
    const [dataMode, setDataMode] = useState(false)
    const drawCanvasRef = useRef<HTMLCanvasElement>(null)
    const cameraCanvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const testFileInputRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new NumberClassifier())
    const isPredictingRef = useRef(false)
    const predictTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const testCameraStartedRef = useRef(false)
    const rebuildAbortRef = useRef(0)

    const [isDrawing, setIsDrawing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [modelLoading, setModelLoading] = useState(false)
    const [testImage, setTestImage] = useState<string | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [showNotRelated, setShowNotRelated] = useState(false)
    const notRelatedCooldownRef = useRef(0)
    const [inputMode, setInputMode] = useState<'draw' | 'camera'>('draw')
    const [augmentMode, setAugmentMode] = useState(true)
    const [captureFps, setCaptureFps] = useState(15)
    const burstIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const handleCaptureRef = useRef<() => void>(null)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const [totalEpochs, setTotalEpochs] = useState(50)
    const [epochResults, setEpochResults] = useState<number[]>([])
    const lastPosRef = useRef<{ x: number; y: number } | null>(null)
    const skipNextRebuildRef = useRef(false)

    const camera = useCamera({
        videoConstraints: { width: 640, height: 480, facingMode: 'environment' }
    })

    const tabularState = useTabularState(mode)

    // Sync dataMode to sidebar visibility
    useEffect(() => {
        mode.setHideSidebar(dataMode)
        return () => { mode.setHideSidebar(false) }
    }, [dataMode])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    useEffect(() => {
        return () => {
            camera.stopCamera()
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

    // Test mode: camera starts OFF — user chooses to turn on camera or upload
    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (camera.cameraOnRef.current && camera.streamStateRef.current && camera.videoRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const canvas = cameraCanvasRef.current
                    if (canvas && camera.videoRef.current) {
                        canvas.width = camera.videoRef.current.videoWidth || 640
                        canvas.height = camera.videoRef.current.videoHeight || 480
                        const ctx = canvas.getContext('2d')!
                        ctx.drawImage(camera.videoRef.current, 0, 0)
                        const start = performance.now()
                        const result = await classifierRef.current.predict(canvas, 3)
                        const elapsed = Math.round(performance.now() - start)
                        if (result) {
                            if (result.similarity !== undefined && result.similarity < RELATEDNESS_THRESHOLD) {
                                setPrediction(null)
                                const now = Date.now()
                                if (now - notRelatedCooldownRef.current > 3000) {
                                    notRelatedCooldownRef.current = now
                                    setShowNotRelated(true)
                                }
                            } else {
                                setPrediction(result)
                                setInferenceTime(elapsed)
                            }
                        } else {
                            setPrediction(null)
                        }
                    }
                } catch (err) {
                    console.error('[NumberClassifier] Prediction error:', err)
                }
                setIsProcessing(false)
                isPredictingRef.current = false
            }
        }
        if (camera.cameraOn && camera.streamStateRef.current) {
            runPrediction()
            const interval = setInterval(runPrediction, 500)
            return () => clearInterval(interval)
        }
    }, [mode.mode, camera.cameraOn, modelLoading])

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
        if (!mode.selectedClassId || !camera.videoRef.current || !camera.cameraOn) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        const video = camera.videoRef.current
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        mode.addSample(mode.selectedClassId, { type: 'image', data: dataUrl })
        classifierRef.current.addSample(canvas, mode.getSelectedClass()?.name || '').catch(() => undefined)
        showSaved(`📸 Photo saved to ${mode.getSelectedClass()?.name || 'class'}!`)
    }, [mode, camera.cameraOn, showSaved])

    handleCaptureRef.current = inputMode === 'draw' ? handleCaptureDrawing : handleCaptureCamera

    const startBurstCapture = useCallback(() => {
        if (inputMode !== 'camera' || !mode.selectedClassId || !camera.cameraOn) return
        burstIntervalRef.current = setInterval(() => {
            handleCaptureRef.current?.()
        }, 1000 / captureFps)
    }, [captureFps, inputMode, mode.selectedClassId, camera.cameraOn])

    const stopBurstCapture = useCallback(() => {
        if (burstIntervalRef.current) {
            clearInterval(burstIntervalRef.current)
            burstIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => { stopBurstCapture() }
    }, [])

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
        camera.stopCamera()
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
                const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000))
                const result = await Promise.race([
                    classifierRef.current.predict(img, 3),
                    timeoutPromise
                ])
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
    }, [modelLoading, camera.stopCamera])

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
            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000))
            const result = await Promise.race([
                classifierRef.current.predict(drawCanvasRef.current, 3),
                timeoutPromise
            ])
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
        setEpochResults([])
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
        try {
            setModelLoading(true)
            const { NumberClassifier } = await import('../../ml/classifiers/NumberClassifier')

            // Step 1: Shuffle & split samples 80/20 per class
            const trainData: { cls: string; samples: typeof project.classes[0]['samples'] }[] = []
            const testDataUrls: { dataUrl: string; label: string }[] = []

            for (const cls of project.classes) {
                const shuffled = [...cls.samples].sort(() => Math.random() - 0.5)
                const splitIdx = Math.max(2, Math.floor(shuffled.length * 0.8))
                trainData.push({ cls: cls.name, samples: shuffled.slice(0, splitIdx) })
                for (const sample of shuffled.slice(splitIdx)) {
                    testDataUrls.push({ dataUrl: sample.data, label: cls.name })
                }
            }

            if (trainData.every(t => t.samples.length === 0) || testDataUrls.length === 0) {
                mode.setAccuracy(0)
                setModelLoading(false)
                setIsTraining(false)
                return
            }

            // Step 2: Pre-compute ALL MobileNet embeddings ONCE (the expensive part)
            const precomputedTrain: { cls: string; embeddings: Float32Array[] }[] = []
            for (const td of trainData) {
                if (td.samples.length > 0) {
                    const embeddings = await NumberClassifier.precomputeEmbeddings(td.samples.map(s => s.data))
                    precomputedTrain.push({ cls: td.cls, embeddings })
                }
            }
            const precomputedTest: { embedding: Float32Array; label: string }[] = []
            for (const item of testDataUrls) {
                const embeddings = await NumberClassifier.precomputeEmbeddings([item.dataUrl])
                if (embeddings.length > 0) {
                    precomputedTest.push({ embedding: embeddings[0], label: item.label })
                }
            }

            setModelLoading(false)

            if (precomputedTrain.every(t => t.embeddings.length === 0) || precomputedTest.length === 0) {
                mode.setAccuracy(0)
                setIsTraining(false)
                return
            }

            // Step 3: Progressive training using pre-computed embeddings (fast — no MobileNet)
            const epochResultsLocal: number[] = []
            let bestAccuracy = 0

            for (let epoch = 1; epoch <= epochs; epoch++) {
                const progress = epoch / epochs
                const delay = epochs > 50 ? Math.max(5, 20 / (epoch * 0.1)) : Math.max(10, 40 / (epoch * 0.1))
                await new Promise(r => setTimeout(r, delay))

                const evalClassifier = new NumberClassifier()
                for (const pt of precomputedTrain) {
                    const numToAdd = Math.max(1, Math.ceil(progress * pt.embeddings.length))
                    const batch = pt.embeddings.slice(0, numToAdd)
                    if (batch.length > 0) {
                        try {
                            await evalClassifier.addFromPrecomputed(pt.cls, batch)
                        } catch { }
                    }
                }

                let correct = 0
                let total = 0
                for (const item of precomputedTest) {
                    try {
                        const result = await evalClassifier.predictFromEmbedding(item.embedding, 3)
                        if (result && result.label === item.label) correct++
                        total++
                    } catch { total++ }
                }

                evalClassifier.dispose()

                const rawAccuracy = total > 0 ? correct / total : 0
                epochResultsLocal.push(rawAccuracy)
                if (rawAccuracy > bestAccuracy) bestAccuracy = rawAccuracy

                // Batch state updates — only update UI every 5 epochs to reduce re-renders
                if (epoch % 5 === 0 || epoch === epochs) {
                    setCurrentEpoch(epoch)
                    setEpochResults([...epochResultsLocal])
                    mode.setAccuracy(rawAccuracy)
                }
            }

            // Step 4: Build final classifier for actual use
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

            mode.setAccuracy(bestAccuracy)
            skipNextRebuildRef.current = true
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch (err) {
            mode.setAccuracy(0)
            setModelLoading(false)
            console.error('[NumberClassifier] Training error:', err)
        }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project && !modelLoading ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const totalSamples = mode.getTotalSamples()
    const isReallyTrained = mode.modelTrained && totalSamples > 0
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    // Data Mode: render shells based on viewMode
    if (dataMode) {
        const viewMode = mode.dataViewMode ?? 'guided'

        return (
            <div className="flex flex-col h-full relative">
                {savedMessage && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                        {savedMessage}
                    </div>
                )}
                {/* Mode toggle + View toggle */}
                <div className="flex items-center justify-between py-2 px-5 bg-white/80 backdrop-blur-md border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDataMode(false)} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold border-none bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                            ✏️ Image Mode
                        </button>
                        <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold border-none bg-[#630ed4] text-white">
                            📊 Data Mode
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => mode.setDataViewMode('guided')}
                            className={`py-1 px-2.5 rounded-md text-[9px] font-bold border-none transition-all ${
                                viewMode === 'guided' ? 'bg-white text-[#630ed4] shadow-sm' : 'bg-transparent text-gray-500'
                            }`}
                        >
                            📋 Guided
                        </button>
                        <button
                            onClick={() => mode.setDataViewMode('dashboard')}
                            className={`py-1 px-2.5 rounded-md text-[9px] font-bold border-none transition-all ${
                                viewMode === 'dashboard' ? 'bg-white text-[#630ed4] shadow-sm' : 'bg-transparent text-gray-500'
                            }`}
                        >
                            📊 Dashboard
                        </button>
                    </div>
                </div>
                {viewMode === 'guided' ? (
                    <StepperShell {...tabularState} />
                ) : (
                    <DashboardShell {...tabularState} />
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {/* Toast */}
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* Mode toggle */}
            <div className="flex items-center justify-center gap-2 py-2 px-5 bg-white/80 backdrop-blur-md border-b border-gray-200 shrink-0">
                <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold border-none bg-[#630ed4] text-white">
                    ✏️ Image Mode
                </button>
                <button onClick={() => setDataMode(true)} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold border-none bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                    📊 Data Mode
                </button>
            </div>

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
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} isTrained={isReallyTrained} />
                        </div>
                    </div>

                    {/* Camera error */}
                    {camera.cameraError && inputMode === 'camera' && (
                        <div className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-sm border border-[#dae2fd] text-center mx-auto mt-2.5">
                            <span className="text-4xl mb-3 block">🚫</span>
                            <h3 className="text-sm font-bold text-[#131b2e] mb-2">Camera Access Needed</h3>
                                <p className="text-xs text-[#4a4455] mb-4">{camera.cameraError}</p>
                                <div className="flex gap-2 justify-center">
                                    <button onClick={camera.startCamera} className="px-4 py-2 bg-[#630ed4] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all">Try Again</button>
                                    <button onClick={() => { camera.setCameraError(null); setInputMode('draw') }} className="px-4 py-2 bg-[#eaedff] text-[#131b2e] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-all">Draw Instead</button>
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
                                    {camera.cameraOn ? (
                                        <>
                                            <video ref={camera.videoRef} autoPlay playsInline muted className="w-full h-full object-contain -scale-x-100" />
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
                                                    <button onClick={camera.startCamera} className="py-2 px-4 rounded-xl text-[11px] font-bold border-none cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)]">
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
                                <button onClick={() => { if (camera.cameraOn) camera.stopCamera(); setInputMode('draw') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'draw' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
                                    <span className="text-[13px]">✏️</span>
                                    Draw
                                </button>
                                <button onClick={() => { if (!camera.cameraOn) camera.startCamera(); setInputMode('camera') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'camera' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
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
                            {inputMode === 'camera' && (
                                <div className="flex items-center gap-1.5 py-1 px-2.5 bg-gray-50 rounded-lg self-center mb-2">
                                    <span className="text-[9px] font-bold text-gray-500">FPS</span>
                                    <input
                                        type="range"
                                        min={5}
                                        max={30}
                                        step={1}
                                        value={captureFps}
                                        onChange={(e) => setCaptureFps(Number(e.target.value))}
                                        className="w-14 h-1 accent-[#630ed4]"
                                    />
                                    <span className="text-[10px] font-bold text-[#630ed4] w-4 text-center">{captureFps}</span>
                                </div>
                            )}
                            <button
                                onClick={inputMode === 'draw' ? handleCaptureDrawing : handleCaptureCamera}
                                onMouseDown={inputMode === 'camera' ? startBurstCapture : undefined}
                                onMouseUp={inputMode === 'camera' ? stopBurstCapture : undefined}
                                onMouseLeave={inputMode === 'camera' ? stopBurstCapture : undefined}
                                onTouchStart={inputMode === 'camera' ? startBurstCapture : undefined}
                                onTouchEnd={inputMode === 'camera' ? stopBurstCapture : undefined}
                                disabled={inputMode === 'camera' ? !canAddSamples || !camera.cameraOn : !canAddSamples}
                                className={`py-3 px-5 rounded-xl text-xs font-bold border-none flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(99,14,212,0.35)] text-white transition-all ${(inputMode === 'camera' ? canAddSamples && camera.cameraOn : canAddSamples) ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'} ${atSampleLimit ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 'bg-gradient-to-br from-[#630ed4] to-[#8b5cf6]'}`}
                            >
                                <span className="text-sm">{inputMode === 'draw' ? '✏️' : '📸'}</span>
                                {atSampleLimit ? 'Max Reached' : inputMode === 'draw' ? 'Add Drawing' : 'Hold to Record'}
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
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} currentEpoch={currentEpoch} totalEpochs={totalEpochs} sampleType="numbers" mode={mode.mode} onModeChange={mode.setMode} modelLoading={modelLoading} epochResults={epochResults} />
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
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} isTrained={isReallyTrained} />
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
                                        cameraOn={camera.cameraOn}
                                        testImage={testImage}
                                        videoRef={camera.videoRef}
                                        canvasRef={cameraCanvasRef}
                                        videoFit="contain"
                                        onCapture={() => {
                                            if (!camera.videoRef.current || !camera.cameraOn) return
                                            const video = camera.videoRef.current
                                            const canvas = document.createElement('canvas')
                                            canvas.width = video.videoWidth || 640
                                            canvas.height = video.videoHeight || 480
                                            const ctx = canvas.getContext('2d')!
                                            ctx.drawImage(video, 0, 0)
                                            setTestImage(canvas.toDataURL('image/png'))
                                            camera.stopCamera()
                                            setIsProcessing(true)
                                            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000))
                                            Promise.race([
                                                classifierRef.current.predict(canvas, 3),
                                                timeoutPromise
                                            ]).then(result => {
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
                                        onToggleCamera={camera.toggleCamera}
                                        onReset={() => { setTestImage(null); setPrediction(null) }}
                                        onTryAnother={() => { setTestImage(null); setPrediction(null); if (!camera.cameraOn) camera.startCamera() }}
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
                                <button onClick={() => { if (camera.cameraOn) camera.stopCamera(); setTestImage(null); setPrediction(null); setInputMode('draw') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'draw' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
                                    <span className="text-[13px]">✏️</span> Draw
                                </button>
                                <button onClick={() => { setTestImage(null); setPrediction(null); if (!camera.cameraOn) camera.startCamera(); setInputMode('camera') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all duration-200 ${inputMode === 'camera' ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(99,14,212,0.25)]' : 'bg-transparent text-gray-500'}`}>
                                    <span className="text-[13px]">📷</span> Camera
                                </button>
                                <button onClick={() => testFileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold border-none cursor-pointer bg-transparent text-gray-500 transition-all duration-200">
                                    <span className="text-[13px]">📂</span> Upload
                                </button>
                                <input ref={testFileInputRef} type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
                            </div>

                            {/* Draw mode results */}
                            {inputMode === 'draw' && prediction && !isProcessing && (
                                <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-extrabold text-[#630ed4] uppercase tracking-widest">All Class Scores</span>
                                        <button
                                            onClick={() => { setPrediction(null); clearCanvas() }}
                                            className="text-[9px] font-bold text-[#630ed4] bg-[#f5f3ff] py-0.5 px-1.5 rounded border-none cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {Object.entries(prediction.confidences)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([label, conf], idx) => {
                                                const pct = Math.round(conf * 100)
                                                const isTop = idx === 0
                                                return (
                                                    <div key={label} className={`rounded-lg p-2 ${isTop ? 'bg-[#f5f3ff] border border-[#630ed4]/15' : 'bg-gray-50 border border-gray-100'}`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className={`text-[11px] font-bold ${isTop ? 'text-[#630ed4]' : 'text-gray-700'}`}>
                                                                {isTop && <span className="mr-1">🏆</span>}
                                                                {label}
                                                            </span>
                                                            <span className={`text-[11px] font-extrabold ${pct >= 50 ? 'text-emerald-600' : pct >= 25 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-[width] duration-200 ease-out ${
                                                                    isTop
                                                                        ? 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed]'
                                                                        : pct >= 25
                                                                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                                            : 'bg-gray-300'
                                                                }`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
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

            {mode.mode === 'collect' && mode.project && (
                <SampleWarningModal
                    classes={mode.project.classes}
                    accentColor="#630ed4"
                    accentBg="#f5f3ff"
                    projectType="number classifier"
                />
            )}
        </div>
    )
}
