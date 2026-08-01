import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ImageClassifier } from '../../ml/classifiers/ImageClassifier'
import { RELATEDNESS_THRESHOLD } from '../../ml/KNNClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../components/WorkflowIndicator'
import StatsBar from '../components/StatsBar'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'
import NotRelatedModal from '../components/NotRelatedModal'

interface ImageClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function ImageClassifierPanel({ mode }: ImageClassifierPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new ImageClassifier())
    const fileInputRef = useRef<HTMLInputElement>(null)
    const testFileInputRef = useRef<HTMLInputElement>(null)
    const burstIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const handleCaptureRef = useRef<() => Promise<void>>(null)
    const autoSwitchRef = useRef<NodeJS.Timeout | null>(null)
    const skipNextRebuildRef = useRef(false)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)

    const [isCapturing, setIsCapturing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [trainingError, setTrainingError] = useState<string | null>(null)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [cameraOn, setCameraOn] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return !localStorage.getItem('neura-onboarding-seen')
    })
    const [burstMode, setBurstMode] = useState(false)
    const [testImage, setTestImage] = useState<string | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [augmentMode, setAugmentMode] = useState(true)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [showNotRelated, setShowNotRelated] = useState(false)
    const [totalEpochs, setTotalEpochs] = useState(50)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const streamRef = useRef<MediaStream | null>(null)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const startCamera = useCallback(async () => {
        try {
            setCameraError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 30 }
                }
            })
            streamRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
        } catch (err) {
            console.error('Camera access denied:', err)
            setCameraError('Camera access is needed to take photos. Please allow camera access in your browser settings and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) {
            s.getTracks().forEach(t => t.stop())
            streamRef.current = null
            setStream(null)
        }
    }, [])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) {
            stopCamera()
            setCameraOn(false)
        } else {
            startCamera()
        }
    }, [cameraOn, startCamera, stopCamera])

    useEffect(() => {
        return () => { stopCamera() }
    }, [])

    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    // Sync stream to video element when stream changes
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

    useEffect(() => {
        if (cameraOn && stream && videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
        }
    }, [cameraOn, stream])

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            if (skipNextRebuildRef.current && mode.mode === 'test') {
                skipNextRebuildRef.current = false
                setModelLoading(false)
                return
            }
            skipNextRebuildRef.current = false
            // Abort any in-flight rebuild to prevent redundant GPU work
            const thisBuild = ++rebuildAbortRef.current
            let cancelled = false
            setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    // Check if a newer rebuild has started — abort this one
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

    const testCameraStartedRef = useRef(false)
    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        // Auto-start camera when entering test mode
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (cameraOnRef.current && streamStateRef.current && videoRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const start = performance.now()
                    const result = await classifierRef.current.predict(videoRef.current)
                    const elapsed = Math.round(performance.now() - start)
                    if (result) {
                        if (result.similarity !== undefined && result.similarity < RELATEDNESS_THRESHOLD) {
                            setPrediction(null)
                        } else {
                            setPrediction(result)
                            setInferenceTime(elapsed)
                        }
                    } else {
                        setPrediction(null)
                    }
                } catch (err) {
                    console.error('Prediction error:', err)
                }
                setIsProcessing(false)
                isPredictingRef.current = false
            }
        }
        if (cameraOn && stream) {
            runPrediction()
            const interval = setInterval(runPrediction, 500)
            return () => clearInterval(interval)
        }
    }, [mode.mode, stream, cameraOn, modelLoading])

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !mode.selectedClassId || !cameraOn) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        if (isCapturing) return
        setIsCapturing(true)
        try {
            const canvas = canvasRef.current
            const video = videoRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(video, 0, 0)
            const imageData = canvas.toDataURL('image/png')
            mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })
            if (augmentMode) {
                classifierRef.current.addSampleAugmented(video, mode.getSelectedClass()?.name || '').catch(() => undefined)
            } else {
                classifierRef.current.addSample(video, mode.getSelectedClass()?.name || '').catch(() => undefined)
            }
        } catch (err) {
            console.warn('[Neura] Capture failed:', err)
        } finally {
            setTimeout(() => setIsCapturing(false), 300)
        }
    }

    handleCaptureRef.current = handleCapture

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
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
                if (augmentMode) {
                    await classifierRef.current.addSampleAugmented(img, mode.getSelectedClass()?.name || '')
                } else {
                    await classifierRef.current.addSample(img, mode.getSelectedClass()?.name || '')
                }
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        if (modelLoading) {
            alert('Model is still loading. Please wait a moment and try again.')
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
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                const start = performance.now()
                const result = await classifierRef.current.predict(img)
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
                label: selectedClass ? `Class: ${selectedClass.name}` : 'Class Samples'
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
            const result = await classifierRef.current.predict(videoRef.current)
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
            console.error('[Neura] Test capture prediction error:', err)
        }
        setIsProcessing(false)
    }, [cameraOn, modelLoading])

    const handleExportTestReport = useCallback(() => {
        if (!prediction) return
        const sortedConfidences = Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a)
        const report = {
            projectName: mode.project?.name || 'Untitled',
            projectType: 'image-classifier',
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

    const startBurstCapture = useCallback(() => {
        if (!burstMode || !mode.selectedClassId || !cameraOn) return
        burstIntervalRef.current = setInterval(() => {
            handleCaptureRef.current?.()
        }, 500)
    }, [burstMode, mode.selectedClassId, cameraOn])

    const stopBurstCapture = useCallback(() => {
        if (burstIntervalRef.current) {
            clearInterval(burstIntervalRef.current)
            burstIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => {
            stopBurstCapture()
            if (autoSwitchRef.current) clearTimeout(autoSwitchRef.current)
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        }
    }, [])

    const handleTrain = async (epochs = 50) => {
        setIsTraining(true)
        setTrainingError(null)
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
            // Single rebuild pass — reuse classifierRef for both training and LOO
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
            // Build LOO classifier without augmentation (reuses same data, no extra GPU load)
            const { ImageClassifier } = await import('../../ml/classifiers/ImageClassifier')
            const loClassifier = new ImageClassifier()
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
                                total++; continue
                            }
                            const removedEmbedding = await loClassifier.removeExampleByIndex(cls.name, i)
                            const result = await loClassifier.predict(img, adaptiveK)
                            if (result && result.label === cls.name) correct++
                            total++
                            if (removedEmbedding) {
                                await loClassifier.addExampleFromDataArray(removedEmbedding, cls.name)
                            }
                            // Yield to browser between LOO predictions to prevent GPU buildup
                            await new Promise(r => setTimeout(r, 0))
                        } catch { total++ }
                    }
                }
                const rawAccuracy = total > 0 ? correct / total : 0
                epochResults.push(rawAccuracy)
                let weightedSum = 0; let weightTotal = 0
                for (let i = 0; i < epochResults.length; i++) {
                    const weight = Math.pow(1.5, epochResults.length - 1 - i)
                    weightedSum += epochResults[i] * weight; weightTotal += weight
                }
                const smoothedAccuracy = weightTotal > 0 ? weightedSum / weightTotal : rawAccuracy
                if (smoothedAccuracy > bestAccuracy) bestAccuracy = smoothedAccuracy
                mode.setAccuracy(smoothedAccuracy)
            }
            loClassifier.dispose()
            mode.setAccuracy(bestAccuracy)
            skipNextRebuildRef.current = true
            autoSwitchRef.current = setTimeout(() => {
                mode.setMode('test')
            }, 2000)
        } catch (err) {
            mode.setAccuracy(0)
            setTrainingError('Training failed. Please try again.')
            console.error('[Neura] Training error:', err)
        }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project && !modelLoading ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit
    const totalSamplesAll = mode.getTotalSamples()
    let warningTitle = ''; let warningDesc = ''
    if (mode.project && mode.project.classes.length < 2) {
        warningTitle = 'Add at least 2 classes'; warningDesc = 'Create 2 or more classes to start training'
    } else if (totalSamplesAll === 0) {
        warningTitle = 'Add samples to train the model'; warningDesc = 'Capture or upload images for each class'
    } else if (mode.project && mode.project.classes.some(c => c.samples.length < 2)) {
        warningTitle = 'Add more samples per class'; warningDesc = 'Each class needs at least 2 samples for reliable training. 5+ recommended for 90%+ accuracy.'
    }

    const removeDebounceRef = useRef<NodeJS.Timeout | null>(null)
    const handleRemoveSample = async (classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        // Debounce rebuilds when removing multiple samples quickly
        if (removeDebounceRef.current) clearTimeout(removeDebounceRef.current)
        removeDebounceRef.current = setTimeout(() => {
            const project = mode.project
            if (project) {
                const cls = project.classes.find(c => c.id === classId)
                if (cls) {
                    const remainingSamples = cls.samples.filter(s => s.id !== sampleId)
                    classifierRef.current.rebuildClass(cls.name, remainingSamples.map(s => s.data), augmentMode)
                }
            }
        }, 300)
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

    return (
        <div className="flex flex-col h-full relative">
            {/* Toast messages */}
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-[onbFadeIn_0.3s_ease-out]">
                    <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />
                    <div className="relative w-full max-w-[440px] overflow-hidden animate-[onbSlideIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-br from-[#c084fc]/50 via-[#818cf8]/30 to-[#630ed4]/50 blur-sm" />
                        <div className="relative bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(99,14,212,0.3),0_0_0_1px_rgba(99,14,212,0.08)] overflow-hidden">
                            {/* Top gradient bar */}
                            <div className="h-1.5 bg-gradient-to-r from-[#c084fc] via-[#630ed4] to-[#818cf8]" />

                            {/* Icon */}
                            <div className="px-8 pt-10 pb-6">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#eaedff] to-[#c7d2fe] rounded-[1.25rem] rotate-3 shadow-lg" />
                                    <div className="relative w-full h-full bg-white rounded-[1.25rem] flex items-center justify-center shadow-md border border-[#eaedff]/50">
                                        <span className="text-[2.5rem]">📸</span>
                                    </div>
                                </div>
                                <h3 className="text-center font-extrabold text-[#131b2e] tracking-tight text-[1.35rem] mb-2.5">
                                    Welcome to Image Classifier!
                                </h3>
                                <p className="text-center leading-relaxed text-[#5b5670] text-sm max-w-[340px] mx-auto">
                                    Teach AI to recognize different objects using your camera or uploaded pictures! 🚀
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="px-8"><div className="h-px bg-gradient-to-r from-transparent via-[#e5e1f0] to-transparent" /></div>

                            {/* Steps */}
                            <div className="px-8 py-6">
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#eaedff] to-[#c7d2fe] flex items-center justify-center shrink-0 text-sm font-bold text-[#630ed4] shadow-[0_2px_8px_rgba(99,14,212,0.15)]">1</div>
                                        <div>
                                            <p className="font-bold text-[#131b2e] text-[15px] mb-0.5">Create Classes 📁</p>
                                            <p className="text-[#5b5670] text-xs">Click "+" in the sidebar to add categories!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#eaedff] to-[#c7d2fe] flex items-center justify-center shrink-0 text-sm font-bold text-[#630ed4] shadow-[0_2px_8px_rgba(99,14,212,0.15)]">2</div>
                                        <div>
                                            <p className="font-bold text-[#131b2e] text-[15px] mb-0.5">Collect Photos 📸</p>
                                            <p className="text-[#5b5670] text-xs">Use camera or upload pictures of each object!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shrink-0 text-sm font-bold text-[#006c44] shadow-[0_2px_8px_rgba(0,108,68,0.15)]">3</div>
                                        <div>
                                            <p className="font-bold text-[#131b2e] text-[15px] mb-0.5">Train & Test 🏋️🧪</p>
                                            <p className="text-[#5b5670] text-xs">Teach your AI, then test how smart it got!</p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-onboarding-seen', 'true') }}
                                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white relative overflow-hidden group bg-gradient-to-br from-[#630ed4] to-[#7c3aed] shadow-[0_8px_24px_rgba(99,14,212,0.3)] transition-all duration-200"
                                >
                                    <span className="relative z-10">Let's Go! 🚀</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#630ed4] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
                    {/* Header */}
                    <div className="text-center animate-fade-in mb-3">
                        <div className="inline-flex items-center gap-2.5 py-2.5 px-5 bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-2xl border border-[#630ed4]/10 shadow-[0_2px_8px_rgba(99,14,212,0.06)]">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#630ed4] to-[#7c3aed] flex items-center justify-center shadow-[0_4px_12px_rgba(99,14,212,0.25)]">
                                <span className="text-lg">📸</span>
                            </div>
                            <h2 className="text-xl font-extrabold text-[#131b2e] m-0">
                                Teach Your AI to See!
                            </h2>
                        </div>
                    </div>

                    {/* Workflow and Tips - centered */}
                    <div className="max-w-[800px] w-full mx-auto mb-3">
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />

                        {/* Tips */}
                        <div className="mt-2.5 animate-fade-in bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl p-2.5 px-3.5 border border-[#630ed4]/10">
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-xs shrink-0">💡</div>
                                <div>
                                    <p className="text-[9px] font-extrabold text-[#630ed4] tracking-widest uppercase mb-1">
                                        Tips for better accuracy
                                    </p>
                                    <div className="flex flex-wrap gap-x-3.5 gap-y-0.75">
                                        {['Take from different angles', 'Try different lighting', 'Change backgrounds', 'Mix close-up & far shots'].map((tip) => (
                                            <span key={tip} className="flex items-center gap-1.25 text-[10px] text-gray-600">
                                                <span className="w-0.75 h-0.75 rounded-full bg-[#630ed4] shrink-0" />
                                                {tip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Main content - Two column layout */}
                    <div className="flex flex-col lg:flex-row gap-4 w-full flex-1 min-h-0">
                        {/* Left half - Camera */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            {/* Camera error */}
                            {cameraError && !cameraOn && (
                                <div className="w-full flex-1 min-h-0 bg-white rounded-2xl p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-200 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mx-auto mb-5">
                                        <span className="text-3xl">🚫</span>
                                    </div>
                                    <h3 className="text-lg font-extrabold text-[#131b2e] mb-2">
                                        Camera Access Needed
                                    </h3>
                                    <p className="text-xs text-gray-500 max-w-[300px] mx-auto mb-5 leading-relaxed">
                                        {cameraError}
                                    </p>
                                    <div className="flex items-center justify-center gap-2.5">
                                        <button onClick={startCamera} className="flex items-center gap-1.5 py-2.5 px-5 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold border-none cursor-pointer">
                                            🔄 Try Again
                                        </button>
                                        <button onClick={() => { setCameraError(null); setCameraOn(false) }} className="flex items-center gap-1.5 py-2.5 px-5 bg-[#f5f3ff] text-[#630ed4] rounded-xl text-xs font-bold border-none cursor-pointer">
                                            📂 Upload Only
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Camera feed */}
                            <div className={`w-full flex-1 min-h-0 relative rounded-2xl overflow-hidden bg-[#1e1b4b] shadow-[0_2px_12px_rgba(0,0,0,0.1)] ${cameraOn ? 'flex' : 'hidden'}`}>
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain -scale-x-100" />
                                {isCapturing && <div className="absolute inset-0 bg-white/40 animate-[flash_0.3s_ease-out]" />}
                                
                                {/* LIVE indicator */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.25 py-1 px-2.5 bg-black/50 backdrop-blur-md rounded-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                                    <span className="text-white text-[10px] font-bold">LIVE</span>
                                </div>
                                
                                {/* Class name */}
                                {selectedClass && (
                                    <div className="absolute bottom-2.5 left-2.5 py-1.25 px-3 rounded-md text-white text-[11px] font-bold" style={{ background: selectedClass.color }}>
                                        {selectedClass.name}
                                    </div>
                                )}
                                
                                {/* Sample count */}
                                {selectedClass && (
                                    <div className="absolute bottom-2.5 right-2.5 py-1 px-2 bg-black/50 backdrop-blur-md rounded-md">
                                        <span className="text-white text-[10px] font-bold">
                                            {selectedClass.samples.length} samples
                                        </span>
                                    </div>
                                )}
                                
                                {/* Capture button */}
                                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2">
                                    <button
                                        onClick={handleCapture}
                                        onMouseDown={burstMode ? startBurstCapture : undefined}
                                        onMouseUp={burstMode ? stopBurstCapture : undefined}
                                        onTouchStart={burstMode ? startBurstCapture : undefined}
                                        onTouchEnd={burstMode ? stopBurstCapture : undefined}
                                        disabled={!canAddSamples || isCapturing}
                                        className={`w-12 h-12 rounded-full border-2 border-white/90 flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition-all duration-200 ${canAddSamples && !isCapturing ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'}`}
                                        style={{ background: isCapturing ? '#9ca3af' : (selectedClass?.color || '#630ed4') }}
                                    >
                                        <span className="text-lg">
                                            {isCapturing ? '✅' : atSampleLimit ? '🎯' : '📸'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Camera off placeholder */}
                            {!cameraOn && !cameraError && (
                                <div
                                    className={`w-full flex-1 min-h-0 rounded-2xl py-10 px-6 text-center border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 ${isDragging ? 'bg-[#f5f3ff] border-[#630ed4] shadow-[0_8px_24px_rgba(99,14,212,0.08)]' : 'bg-white border-[#630ed4]/15 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'}`}
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        setIsDragging(true)
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault()
                                        setIsDragging(false)
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        setIsDragging(false)
                                        if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
                                            mode.setSelectedClassId(mode.project.classes[0].id)
                                        }
                                        if (e.dataTransfer.files.length > 0) {
                                            const syntheticEvent = { target: { files: e.dataTransfer.files } } as any
                                            handleUpload(syntheticEvent)
                                        }
                                    }}
                                >
                                    <div className={`contents ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                                        <div
                                            className={`w-18 h-18 rounded-2xl flex items-center justify-center mb-5 transition-all duration-200 ${
                                                isDragging 
                                                    ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] shadow-[0_4px_16px_rgba(99,14,212,0.2)] scale-105' 
                                                    : mode.selectedClassId 
                                                        ? 'bg-gradient-to-br from-[#f3e8ff] to-[#ede9fe] shadow-[0_4px_12px_rgba(99,14,212,0.1)] scale-100' 
                                                        : 'bg-gradient-to-br from-amber-100 to-amber-200 shadow-[0_4px_12px_rgba(99,14,212,0.1)] scale-100'
                                            }`}
                                        >
                                            <span className={`text-3xl transition-all duration-200 ${isDragging ? 'brightness-0 invert' : ''}`}>
                                                {isDragging ? '📥' : mode.selectedClassId ? '📸' : '📁'}
                                            </span>
                                        </div>
                                        <h2 className="text-lg font-extrabold text-[#131b2e] mb-2">
                                            {isDragging 
                                                ? 'Drop Images Here! 📥' 
                                                : mode.selectedClassId 
                                                    ? 'Add Photos' 
                                                    : 'Drop Files Here'}
                                        </h2>
                                        <p className="text-xs text-gray-500 max-w-[280px] mb-6 leading-relaxed">
                                            {isDragging
                                                ? 'Drop files to upload instantly to this class'
                                                : mode.selectedClassId 
                                                    ? `Drag & drop images here, take photos, or click upload for "${selectedClass?.name || 'your class'}"`
                                                    : 'Select or create a class first, then drop images here'}
                                        </p>
                                        <div className="flex items-center justify-center gap-2.5">
                                            <button
                                                onClick={startCamera}
                                                className="flex items-center gap-1.5 py-3 px-5.5 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold border-none cursor-pointer shadow-[0_4px_12px_rgba(99,14,212,0.25)]"
                                            >
                                                📷 Turn On Camera
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-1.5 py-3 px-5.5 bg-white text-[#630ed4] rounded-xl text-xs font-bold border-2 border-[#630ed4] cursor-pointer"
                                            >
                                                📂 Upload
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-3.5">
                                            PNG, JPG up to 10MB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right half - Controls, Stats, Samples */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                            {/* Controls */}
                            <div className="bg-white rounded-xl p-2.5 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] shrink-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <CameraToggle />

                                    <button
                                        onClick={() => { setBurstMode(!burstMode); if (burstMode) stopBurstCapture() }}
                                        disabled={!cameraOn}
                                        className={`flex items-center gap-1.25 py-2 px-3 rounded-xl text-[11px] font-bold border-none transition-all duration-150 ${burstMode && cameraOn ? 'bg-[#f5f3ff] text-[#630ed4] shadow-[0_1px_4px_rgba(99,14,212,0.12)]' : 'bg-gray-50 text-gray-700'} ${cameraOn ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'}`}
                                    >
                                        <span className="text-xs">⚡</span>
                                        {burstMode ? 'Rapid ON' : 'Rapid OFF'}
                                    </button>

                                    <button
                                        onClick={() => setAugmentMode(!augmentMode)}
                                        disabled={!mode.selectedClassId}
                                        className={`flex items-center gap-1.25 py-2 px-3 rounded-xl text-[11px] font-bold border-none transition-all duration-150 ${augmentMode && mode.selectedClassId ? 'bg-emerald-50 text-emerald-600 shadow-[0_1px_4px_rgba(5,150,105,0.12)]' : 'bg-gray-50 text-gray-700'} ${mode.selectedClassId ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'}`}
                                    >
                                        <span className="text-xs">✨</span>
                                        {augmentMode ? 'Smart ON' : 'Smart OFF'}
                                    </button>

                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.25 py-2 px-3 rounded-xl text-[11px] font-bold border-none cursor-pointer bg-blue-50 text-blue-600 shadow-[0_1px_4px_rgba(37,99,235,0.1)] transition-all duration-150"
                                    >
                                        <span className="text-xs">📂</span>
                                        Upload
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="shrink-0">
                                <StatsBar 
                                    totalClasses={mode.project?.classes.length || 0} 
                                    totalImages={mode.getTotalSamples()} 
                                    imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0} 
                                    recommended={15} 
                                />
                            </div>

                            {/* Samples */}
                            {selectedClass && selectedClass.samples.length > 0 && (
                                <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex-1 min-h-0 flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: selectedClass.color }} />
                                            <span className="text-xs font-bold text-[#131b2e]">{selectedClass.name}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold py-0.5 px-1.5 rounded-md ${atSampleLimit ? 'bg-amber-100 text-[#c32c00]' : 'bg-[#f5f3ff] text-[#630ed4]'}`}>
                                            {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto neura-scrollbar">
                                        <SampleGrid samples={selectedClass.samples} type="image" onRemove={(id) => handleRemoveSample(selectedClass.id, id)} onUndo={(sample) => mode.addSample(selectedClass.id, { type: sample.type, data: sample.data })} />
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
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} warningTitle={warningTitle} warningDesc={warningDesc} trainingError={trainingError} currentEpoch={currentEpoch} totalEpochs={totalEpochs} mode={mode.mode} onModeChange={mode.setMode} />
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
                            <p className="text-xs text-[#4a4455]">Take a photo or upload an image to test! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                        </div>
                    </div>
                    <div className="w-full mt-2.5 flex-1 min-h-0 flex flex-col">
                        <TestPanel prediction={prediction} isProcessing={isProcessing} cameraOn={cameraOn} testImage={testImage} videoRef={videoRef} canvasRef={canvasRef} onCapture={handleTestCapture} onUpload={() => testFileInputRef.current?.click()} onToggleCamera={toggleCamera} onReset={() => { setTestImage(null); setPrediction(null) }} onTryAnother={() => { setTestImage(null); setPrediction(null) }} onExport={handleExportTestReport} fileInputRef={testFileInputRef} onFileChange={handleTestUpload} projectName={mode.project?.name} testsRun={prediction ? 1 : 0} inferenceTime={inferenceTime} modelLoading={modelLoading} />
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
