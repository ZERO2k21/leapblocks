import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import type { HandKeypoint } from '../../ml/classifiers/HandPoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface HandPoseClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

type CaptureStatus = 'idle' | 'loading-model' | 'detecting' | 'success' | 'no-hand' | 'error'

export default function HandPoseClassifierPanel({ mode }: HandPoseClassifierPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new HandPoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [modelReady, setModelReady] = useState(false)
    const [handDetected, setHandDetected] = useState(false)
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle')
    const [cameraError, setCameraError] = useState<string | null>(null)

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
            streamRef.current = mediaStream
            setStream(mediaStream)
        } catch (err) {
            console.error('Camera access denied:', err)
            setCameraError('Camera access denied. Please allow camera permissions.')
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
    }, [])

    const toggleCamera = useCallback(() => {
        if (stream) { stopCamera() } else { startCamera() }
    }, [stream, startCamera, stopCamera])

    useEffect(() => { return () => { stopCamera(); cancelAnimationFrame(animFrameRef.current) } }, [])

    useEffect(() => {
        if (mode.mode !== 'collect' && mode.mode !== 'test') {
            stopCamera()
        }
    }, [mode.mode])

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            let cancelled = false; setModelLoading(true); setModelReady(false)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (cls.samples.length > 0) {
                        for (const sample of cls.samples) {
                            try {
                                const data = JSON.parse(sample.data)
                                const features = new Float32Array(data)
                                await classifierRef.current.addSample(features, cls.name)
                            } catch (e) { console.warn('[HandPose] Failed to load sample:', e) }
                        }
                    }
                }
                if (!cancelled) { setModelLoading(false); setModelReady(true) }
            }
            rebuild().catch((e) => { console.error('[HandPose] Rebuild failed:', e); if (!cancelled) { setModelLoading(false); setModelReady(false) } })
            return () => { cancelled = true }
        }
    }, [mode.mode, mode.project])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (stream && videoRef.current && canvasRef.current) {
                isPredictingRef.current = true; setIsProcessing(true)
                try {
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        canvasRef.current.width = 640
                        canvasRef.current.height = 480
                        ctx.drawImage(videoRef.current, 0, 0, 640, 480)
                        const result = await classifierRef.current.predictFromImage(canvasRef.current)
                        if (result) {
                            setPrediction(result)
                            setHandDetected(true)
                        } else {
                            setPrediction(null)
                            setHandDetected(false)
                        }
                    }
                } catch (e) { console.warn('[HandPose] Prediction error:', e) }
                setIsProcessing(false); isPredictingRef.current = false
            }
        }
        if (stream) {
            const tick = () => { runPrediction(); animFrameRef.current = requestAnimationFrame(tick) }
            animFrameRef.current = requestAnimationFrame(tick)
            return () => cancelAnimationFrame(animFrameRef.current)
        }
    }, [mode.mode, stream, modelLoading])

    useEffect(() => {
        if (mode.mode !== 'collect' || !stream) return
        const detectLoop = async () => {
            if (isPredictingRef.current) return
            if (videoRef.current && overlayCanvasRef.current) {
                isPredictingRef.current = true
                try {
                    const canvas = overlayCanvasRef.current
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        canvas.width = videoRef.current.videoWidth || 640
                        canvas.height = videoRef.current.videoHeight || 480
                        ctx.clearRect(0, 0, canvas.width, canvas.height)
                        const keypoints = await classifierRef.current.detectHand(videoRef.current)
                        if (keypoints.length > 0) {
                            setHandDetected(true)
                            classifierRef.current.drawHand(canvas, keypoints)
                        } else {
                            setHandDetected(false)
                        }
                    }
                } catch { /* ignore detection loop errors */ }
                isPredictingRef.current = false
            }
        }
        const tick = () => { detectLoop(); animFrameRef.current = requestAnimationFrame(tick) }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [mode.mode, stream])

    const handleCapture = async () => {
        if (!videoRef.current || !mode.selectedClassId || !stream) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        if (isCapturing) return

        setIsCapturing(true)
        setCaptureStatus('loading-model')

        try {
            const video = videoRef.current
            setCaptureStatus('detecting')
            const keypoints = await classifierRef.current.detectHand(video)

            if (keypoints && keypoints.length > 0) {
                setCaptureStatus('success')
                const features = classifierRef.current.normalizeKeypoints(keypoints)
                const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(Array.from(features)) })
                if (added) {
                    classifierRef.current.addSample(features, mode.getSelectedClass()?.name || '').catch(() => {})
                    console.log('[HandPose] Sample added to class:', mode.getSelectedClass()?.name)
                } else {
                    console.warn('[HandPose] Failed to add sample - limit reached?')
                    setCaptureStatus('error')
                }
            } else {
                setCaptureStatus('no-hand')
                console.log('[HandPose] No hand detected in frame')
            }
        } catch (e) {
            console.error('[HandPose] Capture error:', e)
            setCaptureStatus('error')
        } finally {
            setTimeout(() => { setIsCapturing(false); setCaptureStatus('idle') }, 800)
        }
    }

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) { mode.setAccuracy(0); setIsTraining(false); return }
        try {
            setModelLoading(true)
            classifierRef.current.clear()
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
                        const data = JSON.parse(sample.data)
                        const features = new Float32Array(data)
                        await classifierRef.current.addSample(features, cls.name)
                    } catch { /* skip bad sample */ }
                }
            }
            setModelLoading(false)

            let correct = 0; let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
                        const data = JSON.parse(sample.data)
                        const features = new Float32Array(data)
                        const result = await classifierRef.current.predict(features, 5)
                        if (result && result.label === cls.name) correct++
                        total++
                    } catch { total++ }
                }
            }
            mode.setAccuracy(total > 0 ? correct / total : 0)
            setModelReady(true)
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch { mode.setAccuracy(0) }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    const getCaptureLabel = () => {
        if (captureStatus === 'loading-model') return 'Loading model...'
        if (captureStatus === 'detecting') return 'Detecting hand...'
        if (captureStatus === 'success') return 'Captured!'
        if (captureStatus === 'no-hand') return 'No hand found!'
        if (captureStatus === 'error') return 'Error!'
        if (isCapturing) return 'Capturing...'
        if (atSampleLimit) return 'Max Reached'
        if (!stream) return 'Start Camera First'
        return 'Capture Hand'
    }

    const getCaptureDisabled = () => {
        if (isCapturing) return true
        if (atSampleLimit) return true
        if (!stream) return true
        if (!selectedClass) return true
        return false
    }

    const CameraToggle = () => (
        <button
            onClick={toggleCamera}
            className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                stream
                    ? 'bg-[#006c44]/90 text-white hover:bg-[#006c44]'
                    : 'bg-[#991b1b]/90 text-white hover:bg-[#991b1b]'
            } backdrop-blur-sm shadow-lg cursor-pointer`}
        >
            <span className="text-sm">{stream ? '📹' : '📷'}</span>
            {stream ? 'Camera On' : 'Camera Off'}
        </button>
    )

    const CaptureFeedback = () => {
        if (captureStatus === 'idle') return null
        const bg = captureStatus === 'success' ? 'bg-[#006c44]/90'
            : captureStatus === 'no-hand' ? 'bg-[#f97316]/90'
            : captureStatus === 'error' ? 'bg-[#991b1b]/90'
            : 'bg-[#0ea5e9]/90'
        const icon = captureStatus === 'success' ? '✅'
            : captureStatus === 'no-hand' ? '✋'
            : captureStatus === 'error' ? '❌'
            : captureStatus === 'loading-model' ? '⏳'
            : '🔍'
        return (
            <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 ${bg} backdrop-blur-sm rounded-xl z-10 animate-fade-in`}>
                <span className="text-white text-xs font-bold">{icon} {getCaptureLabel()}</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-1">✋ Hand Gesture Guru!</h2>
                        <p className="text-sm text-[#4a4455]">Show your hand to the camera and teach your AI! 🖐️</p>
                    </div>

                    <div className="bg-gradient-to-r from-[#e0f2fe] to-[#bae6fd] rounded-2xl px-5 py-3 border border-[#0ea5e9]/10 max-w-[520px] w-full">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <div>
                                <p className="text-[11px] font-bold text-[#0ea5e9] mb-1">TIPS FOR HAND TRACKING</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#0ea5e9]" /> Keep hand in center of frame</span>
                                    <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#0ea5e9]" /> Spread fingers apart</span>
                                    <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#0ea5e9]" /> Good lighting helps</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!selectedClass && (
                        <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-2xl px-5 py-3 max-w-[520px] w-full">
                            <p className="text-xs font-bold text-[#f97316] text-center">⚠️ Select or add a class first to start capturing!</p>
                        </div>
                    )}

                    <div className="relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] shadow-lg aspect-[4/3]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full -scale-x-100" />
                        <CameraToggle />
                        <CaptureFeedback />
                        {selectedClass && (
                            <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: `${selectedClass.color}CC` }}>
                                {selectedClass.name}
                            </div>
                        )}
                        {stream && (
                            <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-0.5 bg-[#006c44]/90 backdrop-blur-sm rounded-lg">
                                <div className={`w-1.5 h-1.5 rounded-full ${handDetected ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
                                <span className="text-white text-[9px] font-bold">{handDetected ? '✋ HAND DETECTED' : '👀 SCANNING'}</span>
                            </div>
                        )}
                        {!stream && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-4xl mb-2 block">📷</span>
                                    <span className="text-white/70 text-xs font-bold">Camera is off</span>
                                    <p className="text-white/40 text-[10px] mt-1">Click "Camera On" to start</p>
                                </div>
                            </div>
                        )}
                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center px-4">
                                    <span className="text-4xl mb-2 block">⚠️</span>
                                    <span className="text-[#f97316] text-xs font-bold block">{cameraError}</span>
                                    <button onClick={startCamera} className="mt-2 px-3 py-1 bg-[#0ea5e9] text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-[#0284c7]">
                                        Retry
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={getCaptureDisabled()}
                        label={getCaptureLabel()}
                        icon="pose"
                        color={captureStatus === 'success' ? '#006c44' : captureStatus === 'no-hand' ? '#f97316' : selectedClass?.color || '#0ea5e9'}
                        pulse={!isCapturing && !!canAddSamples && !!stream}
                    />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#4a4455] bg-[#f2f3ff] px-2.5 py-1 rounded-lg">{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} gestures</span>
                                </div>
                                <SampleGrid samples={selectedClass.samples} type="keypoints" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-1">🏋️ Teach Your AI Hands!</h2>
                        <p className="text-sm text-[#4a4455]">Your AI is learning your hand gestures! ✋</p>
                    </div>
                    <div className="w-full flex justify-center">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} />
                    </div>
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-1">🧪 Test Your AI!</h2>
                        <p className="text-sm text-[#4a4455]">Show a hand gesture and see if your AI recognizes it! 🎯</p>
                    </div>
                    <div className="relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] shadow-lg aspect-[4/3]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100" />
                        <CameraToggle />
                        {modelLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                <div className="flex items-center gap-3 px-4 py-3 bg-white/90 rounded-xl"><div className="w-4 h-4 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" /><span className="text-xs font-bold text-[#131b2e]">Loading model... ⏳</span></div>
                            </div>
                        )}
                        {!stream && !modelLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-4xl mb-2 block">📷</span>
                                    <span className="text-white/70 text-xs font-bold">Camera is off</span>
                                </div>
                            </div>
                        )}
                        {prediction && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-2xl">
                                <span className="text-white text-lg font-bold">{prediction.label}</span>
                                <span className="text-white/70 text-sm ml-2">{Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%</span>
                            </div>
                        )}
                        {!handDetected && !modelLoading && stream && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#f97316]/90 backdrop-blur-sm rounded-lg">
                                <span className="text-white text-[10px] font-bold">✋ Show your hand</span>
                            </div>
                        )}
                        {handDetected && stream && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#006c44]/90 backdrop-blur-sm rounded-lg">
                                <span className="text-white text-[10px] font-bold">✋ Hand detected</span>
                            </div>
                        )}
                    </div>
                    <TestPanel prediction={prediction} isProcessing={isProcessing}><div /></TestPanel>
                </div>
            )}
        </div>
    )
}
