import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../../ui/components/WorkflowIndicator'
import { classifyFingerCount, MajorityVoteBuffer } from '../../ml/utils/ruleBasedClassifiers'

interface FingerCounterPanelProps {
    mode: UseNeuraProjectReturn
}

type CaptureStatus = 'idle' | 'loading-model' | 'detecting' | 'success' | 'no-hand' | 'error'

const DETECT_THROTTLE_MS = 33
const PREDICT_THROTTLE_MS = 500

const FINGER_LABELS: Record<string, number> = {
    'One': 1, 'Two': 2, 'Three': 3, 'Four': 4, 'Five': 5
}

const COUNT_COLORS: Record<number, string> = {
    1: '#10b981', 2: '#3b82f6', 3: '#8b5cf6', 4: '#f59e0b', 5: '#ef4444'
}

export default function FingerCounterPanel({ mode }: FingerCounterPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new HandPoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const lastDetectTimeRef = useRef(0)
    const lastPredictTimeRef = useRef(0)
    const audioContextRef = useRef<AudioContext | null>(null)
    const majorityVoteRef = useRef(new MajorityVoteBuffer(5))

    const [isCapturing, setIsCapturing] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [modelLoading, setModelLoading] = useState(false)
    const [handDetected, setHandDetected] = useState(false)
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle')
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [currentCount, setCurrentCount] = useState(0)
    const [countHistory, setCountHistory] = useState<number[]>([])
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.5)

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    const playCountSound = useCallback((count: number) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext()
            }
            const ctx = audioContextRef.current
            const frequencies: Record<number, number> = {
                1: 261.63, 2: 329.63, 3: 392.00, 4: 523.25, 5: 659.25
            }
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = frequencies[count] || 440
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 0.3)
        } catch { /* ignore audio errors */ }
    }, [])

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            streamRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
            if (overlayCanvasRef.current) {
                classifierRef.current.attachWebGLHandlers(overlayCanvasRef.current)
            }
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
        } catch (err) {
            console.error('Camera access denied:', err)
            setCameraError('Camera access is needed for hand tracking. Please allow camera access and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
        setCameraOn(false)
        setHandDetected(false)
        setPrediction(null)
        setCurrentCount(0)
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) stopCamera(); else startCamera()
    }, [cameraOn, startCamera, stopCamera])

    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    useEffect(() => {
        if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => undefined)
        }
    }, [stream])

    useEffect(() => {
        if (cameraOn && stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => undefined)
        }
    }, [cameraOn])

    useEffect(() => {
        return () => {
            stopCamera()
            cancelAnimationFrame(animFrameRef.current)
            classifierRef.current.dispose()
        }
    }, [])

    useEffect(() => {
        if (mode.mode !== 'collect' && mode.mode !== 'test') stopCamera()
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            const thisBuild = ++rebuildAbortRef.current
            let cancelled = false
            setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (thisBuild !== rebuildAbortRef.current) return
                    if (cls.samples.length > 0) {
                        for (const sample of cls.samples) {
                            try {
                                const features = JSON.parse(sample.data)
                                const padded = new Float32Array(78)
                                padded.set(features, 0)
                                await classifierRef.current.addSample(padded, cls.name)
                            } catch { /* skip */ }
                        }
                    }
                }
                if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled && thisBuild === rebuildAbortRef.current) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode, mode.project])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (streamStateRef.current && videoRef.current && canvasRef.current) {
                isPredictingRef.current = true
                setIsProcessing(true)
                try {
                    const start = performance.now()
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        canvasRef.current.width = 640
                        canvasRef.current.height = 480
                        ctx.drawImage(videoRef.current, 0, 0, 640, 480)
                        
                        // Rule-based classification: detect hand, extract features, count fingers
                        const keypoints = await classifierRef.current.detectHand(canvasRef.current)
                        if (keypoints && keypoints.length > 0) {
                            const features = classifierRef.current.extractFeatures(keypoints)
                            const result = classifyFingerCount(features)
                            const smoothed = majorityVoteRef.current.add(result.label)
                            
                            const elapsed = Math.round(performance.now() - start)
                            setInferenceTime(elapsed)
                            setHandDetected(true)
                            
                            // Build prediction result with all class confidences
                            const confidences: Record<string, number> = {}
                            for (const [label, conf] of Object.entries(result.details)) {
                                confidences[label] = conf
                            }
                            setPrediction({ label: smoothed, confidences })
                            
                            const count = FINGER_LABELS[smoothed] || 0
                            setCurrentCount(count)
                            setCountHistory(prev => [...prev.slice(-19), count])
                            playCountSound(count)
                        } else {
                            setPrediction(null)
                            setHandDetected(false)
                            setCurrentCount(0)
                            majorityVoteRef.current.clear()
                        }
                    }
                } catch { /* ignore */ }
                setIsProcessing(false)
                isPredictingRef.current = false
            }
        }
        lastPredictTimeRef.current = performance.now()
        const tick = () => {
            const now = performance.now()
            if (now - lastPredictTimeRef.current >= PREDICT_THROTTLE_MS) {
                lastPredictTimeRef.current = now
                runPrediction()
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [mode.mode, stream, modelLoading, startCamera, playCountSound])

    const handleCapture = useCallback(async () => {
        if (!videoRef.current || !mode.selectedClassId || !cameraOn || isCapturing) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
            return
        }
        setIsCapturing(true)
        setCaptureStatus('detecting')
        try {
            const video = videoRef.current
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = video.videoWidth || 640
            tempCanvas.height = video.videoHeight || 480
            const ctx = tempCanvas.getContext('2d')!
            ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
            const keypoints = await classifierRef.current.detectHand(tempCanvas)
            if (keypoints && keypoints.length > 0) {
                const features = classifierRef.current.extractFeatures(keypoints)
                const added = mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(Array.from(features)) })
                if (!added) {
                    showSaved('⚠️ Sample limit reached! (20 per class)')
                    setCaptureStatus('idle')
                    setIsCapturing(false)
                    return
                }
                classifierRef.current.addSample(features, mode.getSelectedClass()?.name || '').catch(() => {})
                setCaptureStatus('success')
                showSaved(`📸 Saved to ${mode.getSelectedClass()?.name}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
            } else {
                setCaptureStatus('no-hand')
                showSaved('⚠️ No hand detected. Try again!')
            }
        } catch (err) {
            console.error('[FingerCounter] Capture error:', err)
            setCaptureStatus('error')
        } finally {
            setIsCapturing(false)
            setTimeout(() => setCaptureStatus('idle'), 1500)
        }
    }, [cameraOn, isCapturing, mode, showSaved])

    const canTrain = !!(mode.project && mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2))
    const selectedClass = mode.getSelectedClass()

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-0">✋ AI Finger Counter!</h2>
                            <p className="text-xs text-[#4a4455]">Show different finger counts and capture them! 🖐️</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 mt-3 min-h-0">
                        {/* Camera */}
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                            {cameraError && !cameraOn && (
                                <div className="flex flex-col items-center justify-center bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-red-200">
                                    <span className="text-4xl mb-2">🚫</span>
                                    <h3 className="text-sm font-bold text-gray-800 mb-1">Camera Access Needed</h3>
                                    <p className="text-xs text-gray-500 mb-3">{cameraError}</p>
                                    <button onClick={startCamera} className="px-4 py-2 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold">Try Again</button>
                                </div>
                            )}

                            <div className="relative rounded-2xl overflow-hidden bg-[#0a0128] flex-1 min-h-[300px]">
                                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain -scale-x-100 ${cameraOn ? 'block' : 'hidden'}`} />
                                <canvas ref={canvasRef} className="hidden" />
                                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100" />

                                {cameraOn && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-white text-[9px] font-bold">🔍 LIVE</span>
                                    </div>
                                )}

                                {captureStatus === 'success' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                                        <span className="text-6xl">✅</span>
                                    </div>
                                )}
                                {captureStatus === 'no-hand' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
                                        <span className="text-6xl">✋</span>
                                    </div>
                                )}

                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">✋</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to collect hand gesture samples</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold shadow-lg">📷 Turn On Camera</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <button onClick={toggleCamera} disabled={modelLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1]">
                                    {cameraOn ? '📷 Stop' : '📷 Start'}
                                </button>
                                <button onClick={handleCapture} disabled={!cameraOn || isCapturing || modelLoading || !selectedClass || selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white disabled:opacity-40 ${isCapturing ? 'bg-slate-400' : 'bg-[#0ea5e9]'}`}>
                                    {isCapturing ? '⏳ Capturing...' : '📸 Capture'}
                                </button>
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Tips */}
                            <div className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] rounded-xl p-3 border border-[#0ea5e9]/10">
                                <p className="text-[10px] font-bold text-[#0369a1] uppercase tracking-wide mb-1.5">💡 Tips</p>
                                <div className="flex flex-col gap-1">
                                    {['Show one hand clearly', 'Good lighting helps', 'Vary hand positions', 'Capture each finger count'].map(tip => (
                                        <span key={tip} className="flex items-center gap-1.5 text-[10px] text-[#1e3a5f]">
                                            <span className="w-1 h-1 rounded-full bg-[#0ea5e9] flex-shrink-0" />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#f0f9ff] rounded-xl p-2.5 border border-[#e0f2fe]">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Classes</p>
                                    <p className="text-lg font-extrabold text-gray-800">{mode.project?.classes.length || 0}</p>
                                </div>
                                <div className="bg-[#f0f9ff] rounded-xl p-2.5 border border-[#e0f2fe]">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Samples</p>
                                    <p className="text-lg font-extrabold text-gray-800">{mode.getTotalSamples()}</p>
                                </div>
                            </div>

                            {/* Current Class Samples */}
                            {selectedClass && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedClass.color }} />
                                            <span className="text-xs font-bold text-gray-800">{selectedClass.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}</span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1">
                                        {selectedClass.samples.slice(0, 10).map((_, i) => (
                                            <div key={i} className="aspect-square rounded-md" style={{ background: `${selectedClass.color}30` }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-extrabold text-[#0ea5e9] mb-2">🏋️ Training Your AI!</h2>
                        <p className="text-sm text-gray-500">Teaching the AI to recognize your finger counts...</p>
                    </div>
                    {modelLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-[#0369a1]">Loading model...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-6xl">✅</span>
                            <p className="text-sm font-bold text-green-600">Model Ready!</p>
                            <button onClick={() => mode.setMode('test')} className="px-6 py-3 bg-[#0ea5e9] text-white rounded-xl text-sm font-bold shadow-lg">
                                🧪 Start Testing
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ea5e9] mb-0">🧪 Test Your Finger Counter!</h2>
                            <p className="text-xs text-[#4a4455]">Show different finger counts and see what AI detects! 🎯</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 mt-3 min-h-0">
                        {/* Camera Feed */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="relative rounded-2xl overflow-hidden bg-[#0a0128] flex-1 min-h-[300px]">
                                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain -scale-x-100 ${cameraOn ? 'block' : 'hidden'}`} />
                                <canvas ref={canvasRef} className="hidden" />
                                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100" />

                                {cameraOn && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-white text-[9px] font-bold">🔍 LIVE</span>
                                    </div>
                                )}

                                {/* Large Count Display */}
                                {currentCount > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-fade-in text-[120px] font-black drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] leading-none" style={{ color: COUNT_COLORS[currentCount] || '#fff' }}>
                                            {currentCount}
                                        </div>
                                    </div>
                                )}

                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">📷</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to test finger counting</p>
                                        <button onClick={startCamera} className="px-5 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold shadow-lg">📷 Start Camera</button>
                                    </div>
                                )}

                                {modelLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl">
                                            <div className="w-4 h-4 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-bold">Loading model...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-2 mt-2">
                                <button onClick={toggleCamera} disabled={modelLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1]">
                                    {cameraOn ? '📷 Stop Camera' : '📷 Start Camera'}
                                </button>
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Confidence Threshold */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">🎚️ Confidence</span>
                                    <span className="text-xs font-extrabold text-[#0ea5e9] bg-[#f0f9ff] px-2 py-0.5 rounded-md">{Math.round(confidenceThreshold * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={Math.round(confidenceThreshold * 100)}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                    style={{ background: `linear-gradient(to right, #0ea5e9 ${Math.round(confidenceThreshold * 100)}%, #e5e7eb ${Math.round(confidenceThreshold * 100)}%)` }} />
                            </div>

                            {/* Current Count Display */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fingers Detected</p>
                                <div className="text-6xl font-black leading-none" style={{ color: COUNT_COLORS[currentCount] || '#94a3b8' }}>
                                    {currentCount || '—'}
                                </div>
                                {prediction && (
                                    <p className="text-xs font-bold text-gray-600 mt-1">
                                        {prediction.label} ({Math.round(prediction.confidences[prediction.label] * 100)}%)
                                    </p>
                                )}
                            </div>

                            {/* Speed & Hand Status */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#f0f9ff] rounded-xl p-2.5 border border-[#e0f2fe]">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">⚡ Speed</p>
                                    <p className="text-lg font-extrabold text-gray-800">{inferenceTime}ms</p>
                                </div>
                                <div className="bg-[#f0f9ff] rounded-xl p-2.5 border border-[#e0f2fe]">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">✋ Hand</p>
                                    <p className={`text-lg font-extrabold ${handDetected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {handDetected ? 'Found' : 'None'}
                                    </p>
                                </div>
                            </div>

                            {/* Count History */}
                            {countHistory.length > 0 && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-700 mb-2">📈 Count History</p>
                                    <div className="flex items-end gap-1 h-16">
                                        {countHistory.map((count, i) => (
                                            <div key={i} className="flex-1 rounded-t-xs min-h-1" style={{
                                                height: `${(count / 5) * 100}%`,
                                                background: COUNT_COLORS[count] || '#94a3b8'
                                            }} />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[8px] text-gray-400">Oldest</span>
                                        <span className="text-[8px] text-gray-400">Latest</span>
                                    </div>
                                </div>
                            )}

                            {/* Class Confidences */}
                            {prediction && Object.keys(prediction.confidences).length > 1 && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-700 mb-2">📊 All Classes</p>
                                    <div className="flex flex-col gap-1.5">
                                        {Object.entries(prediction.confidences).sort(([,a],[,b]) => b - a).slice(0, 5).map(([label, conf]) => (
                                            <div key={label}>
                                                <div className="flex justify-between mb-0.5">
                                                    <span className="text-[9px] font-bold text-gray-600">{label}</span>
                                                    <span className="text-[9px] font-bold text-gray-400">{Math.round(conf * 100)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${conf * 100}%`, background: FINGER_LABELS[label] ? COUNT_COLORS[FINGER_LABELS[label]] : '#0ea5e9' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
