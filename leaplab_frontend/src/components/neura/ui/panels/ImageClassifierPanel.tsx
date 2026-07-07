import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ImageClassifier } from '../../ml/classifiers/ImageClassifier'
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
    const [isCapturing, setIsCapturing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return !localStorage.getItem('neura-onboarding-seen')
    })
    const [burstMode, setBurstMode] = useState(false)
    const burstIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
            setStream(mediaStream)
        } catch (err) {
            console.error('Camera access denied:', err)
            setCameraError('Camera access is needed to take photos. Please allow camera access in your browser settings and try again.')
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop())
            setStream(null)
        }
    }, [stream])

    useEffect(() => {
        return () => { stopCamera() }
    }, [])

    useEffect(() => {
        if (mode.mode === 'collect' || mode.mode === 'test') {
            startCamera()
        } else {
            stopCamera()
        }
    }, [mode.mode])

    // Test mode prediction interval
    useEffect(() => {
        if (mode.mode !== 'test') return

        const runPrediction = async () => {
            if (videoRef.current && classifierRef.current.canClassify) {
                setIsProcessing(true)
                try {
                    const result = await classifierRef.current.predict(videoRef.current)
                    if (result) setPrediction(result)
                } catch {
                    // Prediction failed, ignore
                }
                setIsProcessing(false)
            }
        }

        // Run prediction immediately when stream is ready
        if (stream && videoRef.current) {
            runPrediction()
        }

        const interval = setInterval(runPrediction, 500)
        return () => clearInterval(interval)
    }, [mode.mode, stream])

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !mode.selectedClassId) return

        setIsCapturing(true)
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL('image/png')
        mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })

        await classifierRef.current.addSample(video, mode.getSelectedClass()?.name || '')

        setTimeout(() => setIsCapturing(false), 300)
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !mode.selectedClassId) return

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.type.startsWith('image/')) continue

            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })

            mode.addSample(mode.selectedClassId, { type: 'image', data: dataUrl })

            // Add to classifier
            const img = new Image()
            img.src = dataUrl
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                setTimeout(() => resolve(), 2000)
            })
            await classifierRef.current.addSample(img, mode.getSelectedClass()?.name || '')
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const startBurstCapture = useCallback(() => {
        if (!burstMode || !mode.selectedClassId) return
        burstIntervalRef.current = setInterval(() => {
            handleCapture()
        }, 500)
    }, [burstMode, mode.selectedClassId])

    const stopBurstCapture = useCallback(() => {
        if (burstIntervalRef.current) {
            clearInterval(burstIntervalRef.current)
            burstIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => stopBurstCapture()
    }, [])

    const handleTrain = async () => {
        setIsTraining(true)
        // Compute real accuracy by running predictions on training samples
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
        let correct = 0
        let total = 0
        for (const cls of project.classes) {
            for (const sample of cls.samples) {
                try {
                    const img = new Image()
                    img.src = sample.data
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve()
                        img.onerror = () => reject(new Error('Failed to load image'))
                        setTimeout(() => resolve(), 2000)
                    })
                    const result = await classifierRef.current.predict(img, 3)
                    if (result && result.label === cls.name) {
                        correct++
                    }
                    total++
                } catch {
                    total++
                }
            }
        }
        const accuracy = total > 0 ? correct / total : 0
        // Brief delay so the animation feels natural
        await new Promise(r => setTimeout(r, 800))
        mode.setAccuracy(accuracy)
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.some(c => c.samples.length > 0) : false

    const handleRemoveSample = async (classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        // Rebuild KNN embeddings for this class without the removed sample
        const project = mode.project
        if (project) {
            const cls = project.classes.find(c => c.id === classId)
            if (cls) {
                const remainingSamples = cls.samples.filter(s => s.id !== sampleId)
                await classifierRef.current.rebuildClass(
                    cls.name,
                    remainingSamples.map(s => s.data)
                )
            }
        }
    }

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
                            <p className="text-sm text-gray-500">Teach AI to recognize different objects using your camera.</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-violet-600">1</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Create Classes</p>
                                    <p className="text-xs text-gray-400">Click "Add" in the sidebar to create categories (e.g., Apple, Banana)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-blue-600">2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Collect Photos</p>
                                    <p className="text-xs text-gray-400">Take 10-15 photos or upload images of each object</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-emerald-600">3</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Train & Test</p>
                                    <p className="text-xs text-gray-400">Switch to Train tab, then Test to see AI recognize your objects!</p>
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

            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    {/* Camera error state */}
                    {cameraError && (
                        <div className="w-full max-w-[520px] bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Camera Access Needed</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{cameraError}</p>
                            <button
                                onClick={startCamera}
                                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Camera feed - centered and prominent */}
                    <div
                        className="relative rounded-3xl overflow-hidden bg-gray-900 w-full max-w-[520px] transition-all duration-300"
                        style={{
                            aspectRatio: '4/3',
                            boxShadow: isCapturing
                                ? `0 0 0 3px ${selectedClass?.color || '#7C3AED'}40, 0 0 40px ${selectedClass?.color || '#7C3AED'}20, 0 25px 50px rgba(0,0,0,0.25)`
                                : '0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)'
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
                        {/* Capture flash */}
                        {isCapturing && (
                            <div className="absolute inset-0 bg-white/50 animate-[flash_0.3s_ease-out] rounded-3xl" />
                        )}
                        {/* LIVE badge */}
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-white text-xs font-bold tracking-wide">LIVE</span>
                        </div>
                        {/* Class badge */}
                        {selectedClass && (
                            <div
                                className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md"
                                style={{ backgroundColor: `${selectedClass.color}CC` }}
                            >
                                {selectedClass.name}
                            </div>
                        )}
                        {/* Sample count */}
                        {selectedClass && (
                            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                <span className="text-white text-xs font-bold">
                                    {selectedClass.samples.length} samples
                                </span>
                            </div>
                        )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Burst mode toggle & Upload button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setBurstMode(!burstMode)
                                if (burstMode) stopBurstCapture()
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                burstMode
                                    ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-300'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v12" />
                                <path d="M6 12h12" />
                            </svg>
                            {burstMode ? 'Burst ON' : 'Burst OFF'}
                        </button>

                        {/* Upload button */}
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
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                mode.selectedClassId
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload
                        </button>

                        {burstMode && (
                            <span className="text-[10px] text-gray-400">Hold capture button</span>
                        )}
                    </div>

                    {/* Capture button */}
                    <CaptureButton
                        onClick={burstMode ? () => {} : handleCapture}
                        onMouseDown={burstMode ? startBurstCapture : undefined}
                        onMouseUp={burstMode ? stopBurstCapture : undefined}
                        onTouchStart={burstMode ? startBurstCapture : undefined}
                        onTouchEnd={burstMode ? stopBurstCapture : undefined}
                        disabled={!mode.selectedClassId || isCapturing}
                        label={isCapturing ? 'Captured!' : burstMode ? 'Hold to Capture' : 'Take Photo'}
                        icon="camera"
                        color={selectedClass?.color || '#7C3AED'}
                        pulse={!isCapturing && !!mode.selectedClassId}
                    />

                    {/* Samples section */}
                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: selectedClass.color }}
                                        />
                                        <h3 className="text-sm font-bold text-gray-700">{selectedClass.name}</h3>
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-lg">
                                        {selectedClass.samples.length} photos
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

            {mode.mode === 'train' && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <TrainPanel
                        isTraining={isTraining}
                        accuracy={mode.accuracy}
                        canTrain={canTrain}
                        onTrain={handleTrain}
                        classCount={mode.project?.classes.length || 0}
                        totalSamples={mode.getTotalSamples()}
                    />
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    {/* Camera feed for testing */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 w-full max-w-[520px]" style={{ aspectRatio: '4/3' }}>
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

                    <TestPanel prediction={prediction} isProcessing={isProcessing} projectName={mode.project?.name}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
