import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ImageClassifier } from '../../ml/classifiers/ImageClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../../../types/neura.types'
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
    const streamRef = useRef<MediaStream | null>(null)

    // Camera controls
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

    // Stop camera on unmount
    useEffect(() => {
        return () => { stopCamera() }
    }, [])

    // Rebuild KNN from stored samples when entering train or test mode
    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            // Skip rebuild if coming from train→test auto-switch
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
                            cls.samples.map(s => s.data)
                        )
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    // Test mode prediction - works with both camera and uploaded image
    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return

        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (cameraOn && stream && videoRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const result = await classifierRef.current.predict(videoRef.current)
                    if (result) setPrediction(result)
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

    // Capture from camera
    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !mode.selectedClassId || !cameraOn) return

        // Check sample limit
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            return
        }

        // Block re-entry while capturing
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

            // Add to classifier in background (non-blocking)
            classifierRef.current.addSample(video, mode.getSelectedClass()?.name || '').catch(() => {})
        } catch (err) {
            console.warn('[Neura] Capture failed:', err)
        } finally {
            // Always re-enable the button after brief visual feedback
            setTimeout(() => setIsCapturing(false), 300)
        }
    }

    // Keep ref updated with latest handleCapture
    handleCaptureRef.current = handleCapture

    // Upload images as samples (collect mode)
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !mode.selectedClassId) return

        // Check sample limit
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            alert(`Maximum ${MAX_SAMPLES_PER_CLASS} samples per class reached.`)
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.type.startsWith('image/')) continue

            // Check limit before each upload
            const currentClass = mode.getSelectedClass()
            if (currentClass && currentClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
                break
            }

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
    }

    // Upload image to test (test mode)
    const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        // Guard: wait for model rebuild to complete
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

        // Run prediction on uploaded image
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
                const result = await classifierRef.current.predict(img)
                if (result) setPrediction(result)
            }
        } catch {
            // ignore
        }
        setIsProcessing(false)

        if (testFileInputRef.current) testFileInputRef.current.value = ''
    }

    // Burst capture
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

    // Training - rebuild KNN from stored samples, then compute leave-one-out accuracy
    const handleTrain = async () => {
        setIsTraining(true)
        setTrainingError(null)
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
        try {
            // Step 1: KNN was already rebuilt by useEffect when entering train mode.
            // Add a small delay so the UI shows the training animation.
            await new Promise(r => setTimeout(r, 1500))

            // Step 2: Verify the KNN has data before computing accuracy
            const sampleCounts = classifierRef.current.getSampleCounts()
            const trainedClasses = Object.keys(sampleCounts)
            if (trainedClasses.length < 2) {
                mode.setAccuracy(0)
                setIsTraining(false)
                return
            }

            // Step 3: Compute accuracy using true leave-one-out cross-validation
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

                        // Remove this sample from KNN temporarily
                        const removedEmbedding = await classifierRef.current.removeExampleByIndex(cls.name, i)

                        // Predict without this sample
                        const result = await classifierRef.current.predict(img, 3)
                        if (result && result.label === cls.name) correct++
                        total++

                        // Re-add the sample back
                        if (removedEmbedding) {
                            await classifierRef.current.addExampleFromDataArray(removedEmbedding, cls.name)
                        }
                    } catch {
                        total++
                    }
                }
            }
            const accuracy = total > 0 ? correct / total : 0
            mode.setAccuracy(accuracy)

            // Auto-switch to test mode after training completes
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
    const totalSamplesAll = mode.getTotalSamples()
    let warningTitle = ''
    let warningDesc = ''
    if (mode.project && mode.project.classes.length < 2) {
        warningTitle = 'Add at least 2 classes'
        warningDesc = 'Create 2 or more classes to start training'
    } else if (totalSamplesAll === 0) {
        warningTitle = 'Add samples to train the model'
        warningDesc = 'Capture or upload images for each class'
    }
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    const handleRemoveSample = async (classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        const project = mode.project
        if (project) {
            const cls = project.classes.find(c => c.id === classId)
            if (cls) {
                const remainingSamples = cls.samples.filter(s => s.id !== sampleId)
                await classifierRef.current.rebuildClass(cls.name, remainingSamples.map(s => s.data))
            }
        }
    }

    // Camera toggle button component
    const CameraToggle = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
        <button
            onClick={toggleCamera}
            className={`flex items-center gap-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                size === 'sm' ? 'px-3 py-1.5' : 'px-5 py-2.5'
            } ${
                cameraOn
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-500 hover:bg-red-100'
            }`}
        >
            {cameraOn ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                </svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
            )}
            {cameraOn ? 'Camera On' : 'Camera Off'}
        </button>
    )

    return (
        <div className="flex flex-col h-full relative">
            {/* Onboarding overlay */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-[scale-in_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📸</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Image Classifier!</h3>
                            <p className="text-sm text-gray-500">Teach AI to recognize different objects using your camera or uploaded images.</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-violet-600">1</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Create Classes</p>
                                    <p className="text-xs text-gray-400">Click "Add" in the sidebar to create categories</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-blue-600">2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Collect Photos</p>
                                    <p className="text-xs text-gray-400">Use camera or upload images of each object</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-emerald-600">3</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Train & Test</p>
                                    <p className="text-xs text-gray-400">Train your model, then test with camera or upload</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowOnboarding(false)
                                localStorage.setItem('neura-onboarding-seen', 'true')
                            }}
                            className="w-full py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== COLLECT MODE ==================== */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-5 p-6 overflow-y-auto">
                    {/* Workflow Header */}
                    <div className="w-full max-w-[520px] text-center mb-1 animate-[fade-in_0.3s_ease-out]">
                        <h2 className="text-2xl font-black text-gray-800 mb-1" style={{
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #7C3AED 50%, #3B82F6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Image Classifier Workflow
                        </h2>
                        <p className="text-sm text-gray-400 font-medium">
                            Follow the steps to build your custom image classifier
                        </p>
                    </div>

                    {/* 3-Step Workflow Indicator */}
                    <WorkflowIndicator
                        mode={mode.mode}
                        onModeChange={mode.setMode}
                        canTrain={canTrain}
                    />

                    {/* Camera error state */}
                    {cameraError && !cameraOn && (
                        <div className="w-full max-w-[520px] bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center animate-[scale-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Camera Access Needed</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{cameraError}</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={startCamera}
                                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => { setCameraError(null); setCameraOn(false) }}
                                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                                >
                                    Use Upload Only
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Camera feed */}
                    {cameraOn && (
                        <div
                            className="relative rounded-3xl overflow-hidden bg-gray-900 w-full max-w-[520px] transition-all duration-300"
                            style={{
                                aspectRatio: '4/3',
                                boxShadow: isCapturing
                                    ? `0 0 0 3px ${selectedClass?.color || '#7C3AED'}40, 0 0 40px ${selectedClass?.color || '#7C3AED'}20, 0 25px 50px rgba(0,0,0,0.25)`
                                    : '0 25px 50px rgba(0,0,0,0.25)'
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover rounded-3xl"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            {isCapturing && (
                                <div className="absolute inset-0 bg-white/50 animate-[flash_0.3s_ease-out] rounded-3xl" />
                            )}
                            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white text-xs font-bold tracking-wide">LIVE</span>
                            </div>
                            {selectedClass && (
                                <div
                                    className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md"
                                    style={{ backgroundColor: `${selectedClass.color}CC` }}
                                >
                                    {selectedClass.name}
                                </div>
                            )}
                            {selectedClass && (
                                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                    <span className="text-white text-xs font-bold">{selectedClass.samples.length} samples</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Camera off placeholder */}
                    {!cameraOn && !cameraError && (
                        <div className="w-full max-w-[520px] rounded-3xl overflow-hidden flex flex-col items-center justify-center py-16" style={{
                            aspectRatio: '4/3',
                            background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0f4ff 100%)',
                            border: '2px dashed #E5E7EB'
                        }}>
                            {/* Camera icon with decorative ring */}
                            <div className="relative mb-5">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center border border-violet-100/50">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                </div>
                            </div>

                            <p className="text-base font-bold text-gray-600 mb-1">Camera is off</p>
                            <p className="text-sm text-gray-400 mb-5">Turn on your camera or upload images to get started</p>

                            {/* Turn On Camera button */}
                            <button
                                onClick={startCamera}
                                className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 hover:scale-105 active:scale-95 mb-4"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                Turn On Camera
                            </button>

                            {/* "or" divider */}
                            <div className="flex items-center gap-3 w-48 mb-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-300 font-medium">or</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Upload Images button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!mode.selectedClassId}
                                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    mode.selectedClassId
                                        ? 'bg-white text-gray-700 border-2 border-gray-200 hover:border-violet-300 hover:shadow-md'
                                        : 'bg-gray-50 text-gray-300 border-2 border-gray-100 cursor-not-allowed'
                                }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Upload Images
                            </button>
                            <p className="text-[11px] text-gray-300 mt-2 font-medium">
                                PNG, JPG, JPEG up to 10MB
                            </p>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Controls row */}
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <CameraToggle />

                        <button
                            onClick={() => {
                                setBurstMode(!burstMode)
                                if (burstMode) stopBurstCapture()
                            }}
                            disabled={!cameraOn}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                burstMode && cameraOn
                                    ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-300'
                                    : cameraOn
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v12M6 12h12" />
                            </svg>
                            {burstMode ? 'Burst ON' : 'Burst OFF'}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!mode.selectedClassId}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                mode.selectedClassId
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload
                        </button>
                    </div>

                    {/* Capture button - only when camera is on */}
                    {cameraOn && (
                        <CaptureButton
                            onClick={burstMode ? () => {} : handleCapture}
                            onMouseDown={burstMode ? startBurstCapture : undefined}
                            onMouseUp={burstMode ? stopBurstCapture : undefined}
                            onTouchStart={burstMode ? startBurstCapture : undefined}
                            onTouchEnd={burstMode ? stopBurstCapture : undefined}
                            disabled={!canAddSamples || isCapturing}
                            label={isCapturing ? 'Captured!' : atSampleLimit ? 'Max Samples Reached' : burstMode ? 'Hold to Capture' : 'Take Photo'}
                            icon="camera"
                            color={selectedClass?.color || '#7C3AED'}
                            pulse={!isCapturing && !!canAddSamples}
                        />
                    )}

                    {/* Stats Bar */}
                    <StatsBar
                        totalClasses={mode.project?.classes.length || 0}
                        totalImages={mode.getTotalSamples()}
                        imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0}
                        recommended={15}
                    />

                    {/* Samples section */}
                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-gray-700">{selectedClass.name}</h3>
                                    </div>
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                        atSampleLimit
                                            ? 'text-amber-600 bg-amber-50'
                                            : 'text-gray-400 bg-gray-50'
                                    }`}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} samples
                                    </span>
                                </div>
                                <SampleGrid
                                    samples={selectedClass.samples}
                                    type="image"
                                    onRemove={(id) => handleRemoveSample(selectedClass.id, id)}
                                    onUndo={(sample) => mode.addSample(selectedClass.id, { type: sample.type, data: sample.data })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== TRAIN MODE ==================== */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <TrainPanel
                        isTraining={isTraining}
                        accuracy={mode.accuracy}
                        canTrain={canTrain}
                        onTrain={handleTrain}
                        classCount={mode.project?.classes.length || 0}
                        totalSamples={mode.getTotalSamples()}
                        warningTitle={warningTitle}
                        warningDesc={warningDesc}
                        trainingError={trainingError}
                    />
                </div>
            )}

            {/* ==================== TEST MODE ==================== */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
                    {/* Model loading indicator */}
                    {modelLoading && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-violet-50 rounded-2xl border border-violet-200 animate-[fade-in_0.3s_ease-out]">
                            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-semibold text-violet-700">Loading model and preparing samples...</span>
                        </div>
                    )}

                    {/* Camera feed for testing */}
                    {cameraOn && (
                        <div className="relative rounded-3xl overflow-hidden bg-gray-900 w-full max-w-[520px] transition-all duration-300" style={{ aspectRatio: '4/3' }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover rounded-3xl"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-white text-xs font-bold tracking-wide">TESTING</span>
                            </div>
                            {prediction && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-2xl">
                                    <span className="text-white text-lg font-bold">{prediction.label}</span>
                                    <span className="text-white/70 text-sm ml-2">
                                        {Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Uploaded test image */}
                    {!cameraOn && testImage && (
                        <div className="relative rounded-3xl overflow-hidden bg-gray-900 w-full max-w-[520px] shadow-2xl" style={{ aspectRatio: '4/3' }}>
                            <img
                                src={testImage}
                                alt="Test image"
                                className="w-full h-full object-cover rounded-3xl"
                            />
                            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-blue-500/80 backdrop-blur-md rounded-xl">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span className="text-white text-xs font-bold tracking-wide">UPLOADED</span>
                            </div>
                            {prediction && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-2xl">
                                    <span className="text-white text-lg font-bold">{prediction.label}</span>
                                    <span className="text-white/70 text-sm ml-2">
                                        {Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No camera, no image - prompt user */}
                    {!cameraOn && !testImage && (
                        <div className="w-full max-w-[520px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-16" style={{ aspectRatio: '4/3' }}>
                            <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center mb-4">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-400 mb-1">Ready to test</p>
                            <p className="text-xs text-gray-300 mb-4">Turn on camera or upload an image</p>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Test controls */}
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <CameraToggle />

                        <input
                            ref={testFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleTestUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => testFileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            Upload to Test
                        </button>

                        {cameraOn && (
                            <button
                                onClick={() => { setTestImage(null); setPrediction(null) }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="1 4 1 10 7 10" />
                                    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                                </svg>
                                Reset
                            </button>
                        )}
                    </div>

                    <TestPanel prediction={prediction} isProcessing={isProcessing} projectName={mode.project?.name}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
