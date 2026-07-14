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

    const [isCapturing, setIsCapturing] = useState(false)
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
    const [totalEpochs, setTotalEpochs] = useState(50)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const streamRef = useRef<MediaStream | null>(null)

    const startCamera = useCallback(async () => {
        try {
            setCameraError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
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

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            if (skipNextRebuildRef.current && mode.mode === 'test') {
                skipNextRebuildRef.current = false
                setModelLoading(false)
                return
            }
            skipNextRebuildRef.current = false
            let cancelled = false
            setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (cls.samples.length > 0) {
                        await classifierRef.current.rebuildClass(
                            cls.name,
                            cls.samples.map(s => s.data),
                            augmentMode
                        )
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (cameraOn && stream && videoRef.current) {
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
                classifierRef.current.addSampleAugmented(video, mode.getSelectedClass()?.name || '').catch(() => {})
            } else {
                classifierRef.current.addSample(video, mode.getSelectedClass()?.name || '').catch(() => {})
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
        } catch {}
        setIsProcessing(false)
        if (testFileInputRef.current) testFileInputRef.current.value = ''
    }

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
        }
    }, [])

    const handleTrain = async (epochs: number = 50) => {
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

    const handleRemoveSample = async (classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        const project = mode.project
        if (project) {
            const cls = project.classes.find(c => c.id === classId)
            if (cls) {
                const remainingSamples = cls.samples.filter(s => s.id !== sampleId)
                await classifierRef.current.rebuildClass(cls.name, remainingSamples.map(s => s.data), augmentMode)
            }
        }
    }

    const CameraToggle = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
        <button onClick={toggleCamera} className={`flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2'} ${cameraOn ? 'bg-[#d1fae5] text-[#006c44] hover:bg-[#a7f3d0]' : 'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]'}`}>
            <span className="text-sm">{cameraOn ? '📷' : '🚫'}</span>
            {cameraOn ? 'Camera On' : 'Camera Off'}
        </button>
    )

    return (
        <div className="flex flex-col h-full relative">
            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">📸</div>
                            <h3 className="text-xl font-extrabold text-[#131b2e] mb-2">Welcome to Image Classifier!</h3>
                            <p className="text-sm text-[#4a4455]">Teach AI to recognize different objects using your camera or uploaded pictures! 🚀</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#eaedff] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#630ed4]">1</div>
                                <div>
                                    <p className="text-sm font-bold text-[#131b2e]">Create Classes 📁</p>
                                    <p className="text-xs text-[#4a4455]">Click "+" in the sidebar to add categories!</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#eaedff] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#630ed4]">2</div>
                                <div>
                                    <p className="text-sm font-bold text-[#131b2e]">Collect Photos 📸</p>
                                    <p className="text-xs text-[#4a4455]">Use camera or upload pictures of each object!</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#d1fae5] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#006c44]">3</div>
                                <div>
                                    <p className="text-sm font-bold text-[#131b2e]">Train & Test 🏋️🧪</p>
                                    <p className="text-xs text-[#4a4455]">Teach your AI, then test how smart it got!</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-onboarding-seen', 'true') }} className="w-full py-3 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-[#630ed4]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                            Let's Go! 🚀
                        </button>
                    </div>
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="w-full max-w-[720px] text-center mb-2 animate-fade-in">
                        <h2 className="text-3xl font-extrabold text-[#630ed4] mb-2">
                            📸 Teach Your AI to See!
                        </h2>
                        <p className="text-sm text-[#4a4455] font-medium">
                            Follow the steps below to teach your AI buddy!
                        </p>
                    </div>

                    <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />

                    {/* Tips */}
                    <div className="w-full max-w-[720px] animate-fade-in">
                        <div className="bg-gradient-to-r from-[#eaedff] to-[#dbeafe] rounded-2xl px-5 py-4 border border-[#630ed4]/10">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">💡</span>
                                <div>
                                    <p className="text-[11px] font-bold text-[#630ed4] mb-1">TIPS FOR BETTER ACCURACY</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#630ed4]" /> Take pictures from different angles</span>
                                        <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#630ed4]" /> Try different lighting</span>
                                        <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#630ed4]" /> Change backgrounds</span>
                                        <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#630ed4]" /> Mix close-up & far shots</span>
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
                            <div className="flex gap-3 justify-center">
                                <button onClick={startCamera} className="px-6 py-3 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">Try Again 🔄</button>
                                <button onClick={() => { setCameraError(null); setCameraOn(false) }} className="px-6 py-3 bg-[#eaedff] text-[#131b2e] rounded-xl font-bold text-sm hover:bg-[#dae2fd] transition-all">Use Upload Only 📂</button>
                            </div>
                        </div>
                    )}

                    {/* Camera feed */}
                    <div className={`relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] transition-all duration-300 aspect-[4/3] ${cameraOn ? '' : 'hidden'}`}>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                        {isCapturing && <div className="absolute inset-0 bg-white/50 animate-flash rounded-3xl" />}
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                            <span className="text-white text-[10px] font-bold tracking-wide">📸 LIVE</span>
                        </div>
                        {selectedClass && (
                            <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: `${selectedClass.color}CC` }}>
                                {selectedClass.name}
                            </div>
                        )}
                        {selectedClass && (
                            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                <span className="text-white text-[11px] font-bold">{selectedClass.samples.length} samples</span>
                            </div>
                        )}
                    </div>

                    {/* Camera off placeholder */}
                    {!cameraOn && !cameraError && (
                        <div className="w-full max-w-[680px] border-2 border-dashed border-[#630ed4]/20 rounded-3xl p-8 text-center transition-all hover:border-[#630ed4]/40 bg-white/70 backdrop-blur-sm">
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-6xl mb-4">📸</span>
                                <h2 className="text-xl font-extrabold text-[#131b2e] mb-2">Camera is off</h2>
                                <p className="text-sm text-[#4a4455] mb-6 max-w-sm">
                                    Start by adding object types and uploading pictures for each one!
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                    <button onClick={startCamera} className="bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-[#630ed4]/30 hover:-translate-y-0.5 transition-all">
                                        📷 Turn On Camera
                                    </button>
                                    <div className="text-[#4a4455] text-xs font-semibold flex items-center gap-2">
                                        <div className="h-px w-6 bg-[#ccc3d8]" />or<div className="h-px w-6 bg-[#ccc3d8]" />
                                    </div>
                                    <button onClick={() => fileInputRef.current?.click()} disabled={!mode.selectedClassId} className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${mode.selectedClassId ? 'bg-white text-[#630ed4] border-2 border-[#630ed4] hover:bg-[#630ed4]/5' : 'bg-[#e5e7eb] text-[#ccc3d8] border-2 border-[#d1d5db] cursor-not-allowed'}`}>
                                        📂 Upload Pictures
                                    </button>
                                </div>
                                <p className="mt-3 text-[11px] text-[#7b7487]">PNG, JPG up to 10MB</p>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <CameraToggle />
                        <button onClick={() => { setBurstMode(!burstMode); if (burstMode) stopBurstCapture() }} disabled={!cameraOn} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${burstMode && cameraOn ? 'bg-[#eaedff] text-[#630ed4] ring-2 ring-[#630ed4]/30' : cameraOn ? 'bg-[#f2f3ff] text-[#4a4455] hover:bg-[#eaedff]' : 'bg-[#f9fafb] text-[#ccc3d8] cursor-not-allowed'}`}>
                            <span className="text-sm">⚡</span>
                            {burstMode ? 'Rapid ON' : 'Rapid OFF'}
                        </button>
                        <button onClick={() => setAugmentMode(!augmentMode)} disabled={!mode.selectedClassId} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${augmentMode && mode.selectedClassId ? 'bg-[#d1fae5] text-[#006c44] ring-2 ring-[#006c44]/30' : mode.selectedClassId ? 'bg-[#f2f3ff] text-[#4a4455] hover:bg-[#eaedff]' : 'bg-[#f9fafb] text-[#ccc3d8] cursor-not-allowed'}`} title="Makes training data more varied for better results">
                            <span className="text-sm">✨</span>
                            {augmentMode ? 'Smart ON' : 'Smart OFF'}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={!mode.selectedClassId} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${mode.selectedClassId ? 'bg-[#dbeafe] text-[#1d4ed8] hover:bg-[#bfdbfe] hover:shadow-sm' : 'bg-[#f9fafb] text-[#ccc3d8] cursor-not-allowed'}`}>
                            <span className="text-sm">📂</span>
                            Upload
                        </button>
                    </div>

                    {/* Capture */}
                    {cameraOn && (
                        <CaptureButton
                            onClick={burstMode ? () => {} : handleCapture}
                            onMouseDown={burstMode ? startBurstCapture : undefined}
                            onMouseUp={burstMode ? stopBurstCapture : undefined}
                            onTouchStart={burstMode ? startBurstCapture : undefined}
                            onTouchEnd={burstMode ? stopBurstCapture : undefined}
                            disabled={!canAddSamples || isCapturing}
                            label={isCapturing ? '📸 Captured!' : atSampleLimit ? 'Max Reached 🎯' : burstMode ? 'Hold to Capture ⚡' : 'Take Photo 📸'}
                            icon="camera"
                            color={selectedClass?.color || '#630ed4'}
                            pulse={!isCapturing && !!canAddSamples}
                        />
                    )}

                    <StatsBar totalClasses={mode.project?.classes.length || 0} totalImages={mode.getTotalSamples()} imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0} recommended={15} />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${atSampleLimit ? 'text-[#c32c00] bg-[#fef3c7]' : 'text-[#4a4455] bg-[#f2f3ff]'}`}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} pics
                                    </span>
                                </div>
                                <SampleGrid samples={selectedClass.samples} type="image" onRemove={(id) => handleRemoveSample(selectedClass.id, id)} onUndo={(sample) => mode.addSample(selectedClass.id, { type: sample.type, data: sample.data })} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="w-full max-w-[720px] text-center mb-2 animate-fade-in">
                        <h2 className="text-3xl font-extrabold text-[#630ed4] mb-2">
                            🏋️ Teach Your AI!
                        </h2>
                        <p className="text-sm text-[#4a4455] font-medium">
                            Watch your AI learn from your pictures! 🧠
                        </p>
                    </div>
                    <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                    <div className="w-full flex justify-center">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} warningTitle={warningTitle} warningDesc={warningDesc} trainingError={trainingError} currentEpoch={currentEpoch} totalEpochs={totalEpochs} />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="w-full max-w-[720px] text-center mb-2 animate-fade-in">
                        <h2 className="text-3xl font-extrabold text-[#630ed4] mb-2">
                            🧪 Test Your AI!
                        </h2>
                        <p className="text-sm text-[#4a4455] font-medium">
                            See how smart your AI has become! 🎯
                        </p>
                    </div>
                    <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                    {modelLoading && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-[#eaedff] rounded-2xl border border-[#630ed4]/20 animate-fade-in">
                            <div className="w-5 h-5 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-bold text-[#630ed4]">Loading model... ⏳</span>
                        </div>
                    )}
                    <TestPanel prediction={prediction} isProcessing={isProcessing} cameraOn={cameraOn} testImage={testImage} videoRef={videoRef} canvasRef={canvasRef} onCapture={handleCapture} onUpload={() => testFileInputRef.current?.click()} onToggleCamera={toggleCamera} onReset={() => { setTestImage(null); setPrediction(null) }} onTryAnother={() => { setTestImage(null); setPrediction(null) }} onExport={() => {}} fileInputRef={testFileInputRef} onFileChange={handleTestUpload} projectName={mode.project?.name} testsRun={prediction ? 1 : 0} inferenceTime={inferenceTime} />
                </div>
            )}
        </div>
    )
}
