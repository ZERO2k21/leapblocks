import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ImageClassifier } from '../../ml/classifiers/ImageClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../components/WorkflowIndicator'
import StatsBar from '../components/StatsBar'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

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
                        setPrediction(result)
                        setInferenceTime(elapsed)
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
                    setPrediction(result)
                    setInferenceTime(elapsed)
                }
            }
        } catch { /* prediction failed */ }
        setIsProcessing(false)
        if (testFileInputRef.current) testFileInputRef.current.value = ''
    }

    const handleTestCapture = useCallback(async () => {
        if (!videoRef.current || !cameraOn || modelLoading) return
        setIsProcessing(true)
        try {
            const start = performance.now()
            const result = await classifierRef.current.predict(videoRef.current)
            const elapsed = Math.round(performance.now() - start)
            if (result) {
                setPrediction(result)
                setInferenceTime(elapsed)
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
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'onbFadeIn 0.3s ease-out' }}>
                    <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />
                    <div className="relative w-full max-w-[440px] overflow-hidden" style={{ animation: 'onbSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-br from-[#c084fc]/50 via-[#818cf8]/30 to-[#630ed4]/50 blur-sm" />
                        <div className="relative bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(99,14,212,0.3),0_0_0_1px_rgba(99,14,212,0.08)] overflow-hidden">
                            {/* Top gradient bar */}
                            <div className="h-1.5 bg-gradient-to-r from-[#c084fc] via-[#630ed4] to-[#818cf8]" />

                            {/* Icon */}
                            <div className="px-8 pt-10 pb-6">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#eaedff] to-[#c7d2fe] rounded-[1.25rem] rotate-3 shadow-lg" />
                                    <div className="relative w-full h-full bg-white rounded-[1.25rem] flex items-center justify-center shadow-md border border-[#eaedff]/50">
                                        <span style={{ fontSize: '2.5rem' }}>📸</span>
                                    </div>
                                </div>
                                <h3 className="text-center font-extrabold text-[#131b2e] tracking-tight" style={{ fontSize: '1.35rem', marginBottom: '10px' }}>
                                    Welcome to Image Classifier!
                                </h3>
                                <p className="text-center leading-relaxed text-[#5b5670]" style={{ fontSize: '14px', maxWidth: '340px', margin: '0 auto' }}>
                                    Teach AI to recognize different objects using your camera or uploaded pictures! 🚀
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="px-8"><div className="h-px bg-gradient-to-r from-transparent via-[#e5e1f0] to-transparent" /></div>

                            {/* Steps */}
                            <div className="px-8 py-6">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div className="flex items-start" style={{ gap: '14px' }}>
                                        <div
                                            className="flex items-center justify-center flex-shrink-0 font-bold"
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #eaedff, #c7d2fe)',
                                                fontSize: '14px',
                                                color: '#630ed4',
                                                boxShadow: '0 2px 8px rgba(99,14,212,0.15)',
                                            }}
                                        >1</div>
                                        <div>
                                            <p className="font-bold text-[#131b2e]" style={{ fontSize: '15px', marginBottom: '3px' }}>Create Classes 📁</p>
                                            <p className="text-[#5b5670]" style={{ fontSize: '13px' }}>Click "+" in the sidebar to add categories!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start" style={{ gap: '14px' }}>
                                        <div
                                            className="flex items-center justify-center flex-shrink-0 font-bold"
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #eaedff, #c7d2fe)',
                                                fontSize: '14px',
                                                color: '#630ed4',
                                                boxShadow: '0 2px 8px rgba(99,14,212,0.15)',
                                            }}
                                        >2</div>
                                        <div>
                                            <p className="font-bold text-[#131b2e]" style={{ fontSize: '15px', marginBottom: '3px' }}>Collect Photos 📸</p>
                                            <p className="text-[#5b5670]" style={{ fontSize: '13px' }}>Use camera or upload pictures of each object!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start" style={{ gap: '14px' }}>
                                        <div
                                            className="flex items-center justify-center flex-shrink-0 font-bold"
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                                                fontSize: '14px',
                                                color: '#006c44',
                                                boxShadow: '0 2px 8px rgba(0,108,68,0.15)',
                                            }}
                                        >3</div>
                                        <div>
                                            <p className="font-bold text-[#131b2e]" style={{ fontSize: '15px', marginBottom: '3px' }}>Train & Test 🏋️🧪</p>
                                            <p className="text-[#5b5670]" style={{ fontSize: '13px' }}>Teach your AI, then test how smart it got!</p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-onboarding-seen', 'true') }}
                                    className="w-full rounded-2xl font-bold text-white relative overflow-hidden group"
                                    style={{
                                        padding: '14px 0',
                                        fontSize: '15px',
                                        background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                        boxShadow: '0 8px 24px rgba(99,14,212,0.3)',
                                        transition: 'all 0.25s ease',
                                    }}
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
                <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '12px 20px' }}>
                    {/* Header */}
                    <div className="text-center animate-fade-in" style={{ marginBottom: '12px' }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                                borderRadius: '14px',
                                border: '1px solid rgba(99,14,212,0.1)',
                                boxShadow: '0 2px 8px rgba(99,14,212,0.06)',
                            }}
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(99,14,212,0.25)',
                                }}
                            >
                                <span style={{ fontSize: '1.1rem' }}>📸</span>
                            </div>
                            <h2
                                style={{
                                    fontSize: '1.3rem',
                                    fontWeight: 800,
                                    color: '#131b2e',
                                    margin: 0,
                                }}
                            >
                                Teach Your AI to See!
                            </h2>
                        </div>
                    </div>

                    {/* Workflow and Tips - centered */}
                    <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto 12px' }}>
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />

                        {/* Tips */}
                        <div style={{ marginTop: '10px' }} className="animate-fade-in">
                            <div
                                style={{
                                    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                                    borderRadius: '12px',
                                    padding: '10px 14px',
                                    border: '1px solid rgba(99,14,212,0.1)',
                                }}
                            >
                                <div className="flex items-start" style={{ gap: '8px' }}>
                                    <div
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            flexShrink: 0,
                                        }}
                                    >💡</div>
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 800, color: '#630ed4', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            Tips for better accuracy
                                        </p>
                                        <div className="flex flex-wrap" style={{ gap: '3px 14px' }}>
                                            {['Take from different angles', 'Try different lighting', 'Change backgrounds', 'Mix close-up & far shots'].map((tip) => (
                                                <span key={tip} className="flex items-center" style={{ gap: '5px', fontSize: '10px', color: '#4b5563' }}>
                                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#630ed4', flexShrink: 0 }} />
                                                    {tip}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Main content - Two column layout */}
                    <div 
                        style={{ 
                            display: 'flex', 
                            gap: '16px', 
                            width: '100%', 
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        {/* Left half - Camera */}
                        <div style={{ flex: '1', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* Camera error */}
                            {cameraError && !cameraOn && (
                                <div
                                    style={{
                                        width: '100%',
                                        flex: 1,
                                        minHeight: 0,
                                        background: '#fff',
                                        borderRadius: '16px',
                                        padding: '40px 32px',
                                        textAlign: 'center',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                        border: '1px solid #e5e7eb',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px',
                                        }}
                                    >
                                        <span style={{ fontSize: '2rem' }}>🚫</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#131b2e', marginBottom: '8px' }}>
                                        Camera Access Needed
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#6b7280', maxWidth: '300px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                                        {cameraError}
                                    </p>
                                    <div className="flex items-center justify-center" style={{ gap: '10px' }}>
                                        <button
                                            onClick={startCamera}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '10px 20px',
                                                background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                                color: '#fff',
                                                borderRadius: '10px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            🔄 Try Again
                                        </button>
                                        <button
                                            onClick={() => { setCameraError(null); setCameraOn(false) }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '10px 20px',
                                                background: '#f5f3ff',
                                                color: '#630ed4',
                                                borderRadius: '10px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            📂 Upload Only
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Camera feed */}
                            <div 
                                style={{
                                    width: '100%',
                                    flex: 1,
                                    minHeight: 0,
                                    position: 'relative',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#1e1b4b',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                                    display: cameraOn ? 'flex' : 'none',
                                }}
                            >
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)',
                                    }}
                                />
                                {isCapturing && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(255,255,255,0.4)',
                                        animation: 'flash 0.3s ease-out',
                                    }} />
                                )}
                                
                                {/* LIVE indicator */}
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '4px 10px',
                                    background: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '6px',
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                                    <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>LIVE</span>
                                </div>
                                
                                {/* Class name */}
                                {selectedClass && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '10px',
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        background: selectedClass.color,
                                        color: '#fff',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                    }}>
                                        {selectedClass.name}
                                    </div>
                                )}
                                
                                {/* Sample count */}
                                {selectedClass && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        right: '10px',
                                        padding: '4px 8px',
                                        background: 'rgba(0,0,0,0.5)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '6px',
                                    }}>
                                        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                                            {selectedClass.samples.length} samples
                                        </span>
                                    </div>
                                )}
                                
                                {/* Capture button */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}>
                                    <button
                                        onClick={handleCapture}
                                        onMouseDown={burstMode ? startBurstCapture : undefined}
                                        onMouseUp={burstMode ? stopBurstCapture : undefined}
                                        onTouchStart={burstMode ? startBurstCapture : undefined}
                                        onTouchEnd={burstMode ? stopBurstCapture : undefined}
                                        disabled={!canAddSamples || isCapturing}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: isCapturing ? '#9ca3af' : (selectedClass?.color || '#630ed4'),
                                            border: '3px solid rgba(255,255,255,0.9)',
                                            cursor: canAddSamples && !isCapturing ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                                            transition: 'all 0.2s ease',
                                            opacity: canAddSamples ? 1 : 0.5,
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>
                                            {isCapturing ? '✅' : atSampleLimit ? '🎯' : '📸'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Camera off placeholder */}
                            {!cameraOn && !cameraError && (
                                <div
                                    style={{
                                        width: '100%',
                                        flex: 1,
                                        minHeight: 0,
                                        background: isDragging ? '#f5f3ff' : '#fff',
                                        borderRadius: '16px',
                                        padding: '40px 24px',
                                        textAlign: 'center',
                                        border: isDragging ? '2px dashed #630ed4' : '2px dashed rgba(99,14,212,0.15)',
                                        boxShadow: isDragging ? '0 8px 24px rgba(99,14,212,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                    }}
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
                                        if (mode.selectedClassId && e.dataTransfer.files.length > 0) {
                                            const syntheticEvent = { target: { files: e.dataTransfer.files } } as any
                                            handleUpload(syntheticEvent)
                                        }
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '18px',
                                            background: isDragging 
                                                ? 'linear-gradient(135deg, #630ed4, #7c3aed)'
                                                : mode.selectedClassId 
                                                    ? 'linear-gradient(135deg, #f3e8ff, #ede9fe)' 
                                                    : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            boxShadow: isDragging ? '0 4px 16px rgba(99,14,212,0.2)' : '0 4px 12px rgba(99,14,212,0.1)',
                                            transform: isDragging ? 'scale(1.08)' : 'scale(1)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span style={{ fontSize: '2rem', filter: isDragging ? 'brightness(0) invert(1)' : 'none', transition: 'all 0.2s ease' }}>
                                            {isDragging ? '📥' : mode.selectedClassId ? '📸' : '📁'}
                                        </span>
                                    </div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#131b2e', marginBottom: '8px' }}>
                                        {isDragging 
                                            ? 'Drop Images Here! 📥' 
                                            : mode.selectedClassId 
                                                ? 'Add Photos' 
                                                : 'Drop Files Here'}
                                    </h2>
                                    <p style={{ fontSize: '13px', color: '#6b7280', maxWidth: '280px', marginBottom: '24px', lineHeight: 1.5 }}>
                                        {isDragging
                                            ? 'Drop files to upload instantly to this class'
                                            : mode.selectedClassId 
                                                ? `Drag & drop images here, take photos, or click upload for "${selectedClass?.name || 'your class'}"`
                                                : 'Select or create a class first, then drop images here'}
                                    </p>
                                    <div className="flex items-center justify-center" style={{ gap: '10px' }}>
                                        <button
                                            onClick={startCamera}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '12px 22px',
                                                background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                                color: '#fff',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(99,14,212,0.25)',
                                            }}
                                        >
                                            📷 Turn On Camera
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!mode.selectedClassId}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '12px 22px',
                                                background: mode.selectedClassId ? '#fff' : '#f3f4f6',
                                                color: mode.selectedClassId ? '#630ed4' : '#9ca3af',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                border: `2px solid ${mode.selectedClassId ? '#630ed4' : '#e5e7eb'}`,
                                                cursor: mode.selectedClassId ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            📂 Upload
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '14px' }}>
                                        PNG, JPG up to 10MB
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right half - Controls, Stats, Samples */}
                        <div style={{ flex: '1', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Controls */}
                            <div
                                style={{
                                    background: '#fff',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <CameraToggle />

                                    <button
                                        onClick={() => { setBurstMode(!burstMode); if (burstMode) stopBurstCapture() }}
                                        disabled={!cameraOn}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: cameraOn ? 'pointer' : 'not-allowed',
                                            background: burstMode && cameraOn ? '#f5f3ff' : '#f9fafb',
                                            color: burstMode && cameraOn ? '#630ed4' : cameraOn ? '#374151' : '#9ca3af',
                                            boxShadow: burstMode && cameraOn ? '0 1px 4px rgba(99,14,212,0.12)' : 'none',
                                            transition: 'all 0.15s ease',
                                            opacity: cameraOn ? 1 : 0.5,
                                        }}
                                    >
                                        <span style={{ fontSize: '12px' }}>⚡</span>
                                        {burstMode ? 'Rapid ON' : 'Rapid OFF'}
                                    </button>

                                    <button
                                        onClick={() => setAugmentMode(!augmentMode)}
                                        disabled={!mode.selectedClassId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: mode.selectedClassId ? 'pointer' : 'not-allowed',
                                            background: augmentMode && mode.selectedClassId ? '#ecfdf5' : '#f9fafb',
                                            color: augmentMode && mode.selectedClassId ? '#059669' : mode.selectedClassId ? '#374151' : '#9ca3af',
                                            boxShadow: augmentMode && mode.selectedClassId ? '0 1px 4px rgba(5,150,105,0.12)' : 'none',
                                            transition: 'all 0.15s ease',
                                            opacity: mode.selectedClassId ? 1 : 0.5,
                                        }}
                                    >
                                        <span style={{ fontSize: '12px' }}>✨</span>
                                        {augmentMode ? 'Smart ON' : 'Smart OFF'}
                                    </button>

                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!mode.selectedClassId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: mode.selectedClassId ? 'pointer' : 'not-allowed',
                                            background: mode.selectedClassId ? '#eff6ff' : '#f9fafb',
                                            color: mode.selectedClassId ? '#2563eb' : '#9ca3af',
                                            boxShadow: mode.selectedClassId ? '0 1px 4px rgba(37,99,235,0.1)' : 'none',
                                            transition: 'all 0.15s ease',
                                            opacity: mode.selectedClassId ? 1 : 0.5,
                                        }}
                                    >
                                        <span style={{ fontSize: '12px' }}>📂</span>
                                        Upload
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ flexShrink: 0 }}>
                                <StatsBar 
                                    totalClasses={mode.project?.classes.length || 0} 
                                    totalImages={mode.getTotalSamples()} 
                                    imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0} 
                                    recommended={15} 
                                />
                            </div>

                            {/* Samples */}
                            {selectedClass && selectedClass.samples.length > 0 && (
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: '1px solid #e5e7eb',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                        flex: 1,
                                        minHeight: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedClass.color }} />
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#131b2e' }}>{selectedClass.name}</span>
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
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    <div className="w-full" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} warningTitle={warningTitle} warningDesc={warningDesc} trainingError={trainingError} currentEpoch={currentEpoch} totalEpochs={totalEpochs} mode={mode.mode} onModeChange={mode.setMode} />
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
                            <p className="text-xs text-[#4a4455]">Take a photo or upload an image to test! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                        </div>
                    </div>
                    <div className="w-full" style={{ marginTop: '10px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TestPanel prediction={prediction} isProcessing={isProcessing} cameraOn={cameraOn} testImage={testImage} videoRef={videoRef} canvasRef={canvasRef} onCapture={handleTestCapture} onUpload={() => testFileInputRef.current?.click()} onToggleCamera={toggleCamera} onReset={() => { setTestImage(null); setPrediction(null) }} onTryAnother={() => { setTestImage(null); setPrediction(null) }} onExport={handleExportTestReport} fileInputRef={testFileInputRef} onFileChange={handleTestUpload} projectName={mode.project?.name} testsRun={prediction ? 1 : 0} inferenceTime={inferenceTime} modelLoading={modelLoading} />
                    </div>
                </div>
            )}
        </div>
    )
}
