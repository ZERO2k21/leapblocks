import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../../ui/components/WorkflowIndicator'
import { classifyVolumeLevel, EMABuffer } from '../../ml/utils/ruleBasedClassifiers'

interface VolumeControllerPanelProps {
    mode: UseNeuraProjectReturn
}

type CaptureStatus = 'idle' | 'detecting' | 'success' | 'no-hand' | 'error'

const PREDICT_THROTTLE_MS = 300
const DEBOUNCE_COOLDOWN_MS = 1000

const CLASSES = ['Volume Up', 'Volume Down', 'Mute', 'Play/Pause'] as const

const GESTURE_MAP: Record<string, { key: string; keyCode: number; emoji: string; description: string }> = {
    'Volume Up': { key: 'AudioVolumeUp', keyCode: 174, emoji: '🔊', description: 'Increase Volume' },
    'Volume Down': { key: 'AudioVolumeDown', keyCode: 173, emoji: '🔉', description: 'Decrease Volume' },
    'Mute': { key: 'AudioMute', keyCode: 175, emoji: '🔇', description: 'Mute/Unmute' },
    'Play/Pause': { key: 'MediaPlayPause', keyCode: 179, emoji: '⏯️', description: 'Play/Pause Media' },
}

const GESTURE_GUIDE: Record<string, string> = {
    'Volume Up': '👍 Thumbs Up',
    'Volume Down': '👎 Thumbs Down',
    'Mute': '✊ Closed Fist',
    'Play/Pause': '🖐️ Open Hand / Peace Sign',
}

function dispatchMediaKey(key: string, keyCode: number) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode, bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keyup', { key, keyCode, bubbles: true }))
}

export default function VolumeControllerPanel({ mode }: VolumeControllerPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new HandPoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const testCameraStartedRef = useRef(false)
    const lastPredictTimeRef = useRef(0)
    const lastActionTimeRef = useRef<number>(0)
    const lastActionRef = useRef<string>('')
    const emaVolumeRef = useRef(new EMABuffer(0.3))
    const [isCapturing, setIsCapturing] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [handDetected, setHandDetected] = useState(false)
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle')
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [inferenceTime, setInferenceTime] = useState(0)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.5)
    const [volumeLevel, setVolumeLevel] = useState(50)
    const [lastAction, setLastAction] = useState<string | null>(null)
    const [actionFeedback, setActionFeedback] = useState<string | null>(null)
    const actionFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [actionHistory, setActionHistory] = useState<{ action: string; time: number }[]>([])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    const showActionFeedback = useCallback((action: string) => {
        const config = GESTURE_MAP[action]
        if (!config) return
        setActionFeedback(action)
        if (actionFeedbackTimeoutRef.current) clearTimeout(actionFeedbackTimeoutRef.current)
        actionFeedbackTimeoutRef.current = setTimeout(() => setActionFeedback(null), 800)
        setLastAction(action)
        setActionHistory(prev => [...prev.slice(-9), { action, time: Date.now() }])
    }, [])

    const handleMediaAction = useCallback((action: string) => {
        const now = Date.now()
        if (action === lastActionRef.current && now - lastActionTimeRef.current < DEBOUNCE_COOLDOWN_MS) return

        lastActionRef.current = action
        lastActionTimeRef.current = now

        const config = GESTURE_MAP[action]
        if (!config) return

        switch (action) {
            case 'Volume Up':
                setVolumeLevel(prev => {
                    const next = Math.min(100, prev + 5)
                    return next
                })
                break
            case 'Volume Down':
                setVolumeLevel(prev => {
                    const next = Math.max(0, prev - 5)
                    return next
                })
                break
            case 'Mute':
                setIsMuted(prev => !prev)
                break
        }

        dispatchMediaKey(config.key, config.keyCode)
        showActionFeedback(action)
    }, [showActionFeedback])

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
            setCameraError('Camera access is needed for hand tracking.')
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

    // Rule-based classifier: no KNN rebuild needed

    useEffect(() => {
        if (mode.mode !== 'test') return
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
                        
                        // Rule-based classification: use pinch distance for volume
                        const keypoints = await classifierRef.current.detectHand(canvasRef.current)
                        if (keypoints && keypoints.length > 0) {
                            const features = classifierRef.current.extractFeatures(keypoints)
                            const result = classifyVolumeLevel(features)
                            const smoothedVolume = emaVolumeRef.current.update(result.details.volume || 0)
                            
                            const elapsed = Math.round(performance.now() - start)
                            setInferenceTime(elapsed)
                            setHandDetected(true)
                            
                            // Map smoothed volume to volume level (0-100)
                            const volumePct = Math.round(smoothedVolume * 100)
                            setVolumeLevel(volumePct)
                            
                            // Build prediction result
                            const confidences: Record<string, number> = {
                                'Volume Up': smoothedVolume > 0.6 ? 0.9 : 0.1,
                                'Volume Down': smoothedVolume < 0.4 ? 0.9 : 0.1,
                            }
                            setPrediction({ label: result.label, confidences })
                        } else {
                            setPrediction(null)
                            setHandDetected(false)
                            emaVolumeRef.current.clear()
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
    }, [mode.mode, stream, startCamera])

    const handleCapture = useCallback(async () => {
        if (!videoRef.current || !mode.selectedClassId || !cameraOn || isCapturing) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('⚠️ Sample limit reached!')
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
                    showSaved('⚠️ Sample limit reached!')
                    setCaptureStatus('idle')
                    setIsCapturing(false)
                    return
                }
                classifierRef.current.addSample(features, mode.getSelectedClass()?.name || '').catch(() => {})
                setCaptureStatus('success')
                showSaved(`✅ Saved to ${mode.getSelectedClass()?.name}!`)
            } else {
                setCaptureStatus('no-hand')
                showSaved('⚠️ No hand detected!')
            }
        } catch (err) {
            setCaptureStatus('error')
        } finally {
            setIsCapturing(false)
            setTimeout(() => setCaptureStatus('idle'), 1500)
        }
    }, [cameraOn, isCapturing, mode, showSaved])

    const canTrain = !!(mode.project && mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2))
    const selectedClass = mode.getSelectedClass()

    const volumeBarSegments = 20
    const activeVolumeSegments = Math.round((isMuted ? 0 : volumeLevel) / 100 * volumeBarSegments)

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-red-500 mb-0">🔊 Volume Controller!</h2>
                            <p className="text-xs text-gray-600">Learn hand gestures to control media volume! 🎵</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="hand-pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 mt-3 min-h-0">
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
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
                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">📷</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to collect gesture samples</p>
                                        <button type="button" onClick={startCamera} className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg border-none cursor-pointer">📷 Turn On Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border-none cursor-pointer">
                                    {cameraOn ? '📷 Stop' : '📷 Start'}
                                </button>
                                <button type="button" onClick={handleCapture} disabled={!cameraOn || isCapturing || !selectedClass}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white border-none cursor-pointer disabled:opacity-40 ${isCapturing ? 'bg-slate-400' : 'bg-red-500'}`}>
                                    {isCapturing ? '⏳...' : '📸 Capture'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Gesture Reference */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">🎮 Actions</p>
                                <div className="flex flex-col gap-1.5">
                                    {CLASSES.map(cls => {
                                        const config = GESTURE_MAP[cls]
                                        return (
                                            <div key={cls} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-50">
                                                <span className="text-sm">{config.emoji}</span>
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-bold text-gray-800">{config.description}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border border-red-500/10">
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1.5">💡 Gesture Guide</p>
                                <div className="flex flex-col gap-1">
                                    {CLASSES.map(cls => (
                                        <span key={cls} className="text-[9px] text-red-900">• {GESTURE_GUIDE[cls]}</span>
                                    ))}
                                </div>
                            </div>

                            {selectedClass && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedClass.color }} />
                                            <span className="text-xs font-bold text-gray-800">{selectedClass.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}</span>
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
                        <h2 className="text-2xl font-extrabold text-red-500 mb-2">🏋️ Training Your Volume AI!</h2>
                        <p className="text-sm text-gray-500">Teaching the AI to recognize volume gestures...</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-6xl">✅</span>
                        <p className="text-sm font-bold text-green-600">Model Ready!</p>
                        <button type="button" onClick={() => mode.setMode('test')} className="px-6 py-3 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg border-none cursor-pointer">
                            🔊 Start Controlling
                        </button>
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-red-500 mb-0">🧪 Test Volume Control!</h2>
                            <p className="text-xs text-gray-600">Show hand gestures to control media! 🎵</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="hand-pose" />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 flex-1 mt-3 min-h-0">
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

                                {/* Action Feedback Overlay */}
                                {actionFeedback && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-fade-in px-8 py-4 rounded-2xl bg-red-500/85 backdrop-blur-md">
                                            <span className="text-4xl font-black text-white block">{GESTURE_MAP[actionFeedback]?.emoji}</span>
                                            <span className="text-lg font-bold text-white/90 block text-center mt-1">{GESTURE_MAP[actionFeedback]?.description}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Predicted Gesture Display */}
                                {prediction && !actionFeedback && (
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-md rounded-xl">
                                        <span className="text-lg">{GESTURE_MAP[prediction.label]?.emoji}</span>
                                        <span className="text-white text-xs font-bold">{prediction.label}</span>
                                        <span className="text-white/60 text-[10px] ml-auto">{Math.round((prediction.confidences[prediction.label] || 0) * 100)}%</span>
                                    </div>
                                )}

                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">📷</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to control volume</p>
                                        <button type="button" onClick={startCamera} className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg border-none cursor-pointer">📷 Start Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <button type="button" onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border-none cursor-pointer">
                                    {cameraOn ? '📷 Stop Camera' : '📷 Start Camera'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Confidence Threshold */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">🎚️ Confidence</span>
                                    <span className="text-xs font-extrabold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">{Math.round(confidenceThreshold * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={Math.round(confidenceThreshold * 100)}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-red-500"
                                    style={{ background: `linear-gradient(to right, #ef4444 ${Math.round(confidenceThreshold * 100)}%, #e5e7eb ${Math.round(confidenceThreshold * 100)}%)` }} />
                            </div>

                            {/* Volume Level Indicator */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">🔊 Volume</span>
                                    <span className="text-xs font-extrabold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">{isMuted ? 'Muted' : `${volumeLevel}%`}</span>
                                </div>
                                <div className="flex gap-[3px] items-end h-6">
                                    {Array.from({ length: volumeBarSegments }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-xs transition-all duration-150"
                                            style={{
                                                height: `${30 + (i / volumeBarSegments) * 70}%`,
                                                background: i < activeVolumeSegments
                                                    ? (i < volumeBarSegments * 0.4 ? '#22c55e' : i < volumeBarSegments * 0.7 ? '#eab308' : '#ef4444')
                                                    : '#e5e7eb',
                                                opacity: isMuted ? 0.4 : 1,
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-[8px] text-gray-400">0%</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsMuted(prev => !prev)}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border-none cursor-pointer ${
                                            isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                                    </button>
                                    <span className="text-[8px] text-gray-400">100%</span>
                                </div>
                            </div>

                            {/* Last Action */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Action</p>
                                {lastAction ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-3xl">{GESTURE_MAP[lastAction]?.emoji}</span>
                                        <div>
                                            <div className="text-lg font-black text-red-500">{lastAction}</div>
                                            <div className="text-[10px] text-gray-500">{GESTURE_MAP[lastAction]?.description}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-3xl font-black text-gray-300">—</div>
                                )}
                            </div>

                            {/* Speed & Hand */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-red-50 rounded-xl p-2.5 border border-red-100">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">⚡ Speed</p>
                                    <p className="text-lg font-extrabold text-gray-800">{inferenceTime}ms</p>
                                </div>
                                <div className="bg-red-50 rounded-xl p-2.5 border border-red-100">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">✋ Hand</p>
                                    <p className={`text-lg font-extrabold ${handDetected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {handDetected ? 'Found' : 'None'}
                                    </p>
                                </div>
                            </div>

                            {/* Action History */}
                            {actionHistory.length > 0 && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-700 mb-2">📜 History</p>
                                    <div className="flex flex-col gap-1">
                                        {actionHistory.slice(-5).reverse().map((entry, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[9px]">
                                                <span>{GESTURE_MAP[entry.action]?.emoji}</span>
                                                <span className="font-bold text-gray-700">{entry.action}</span>
                                                <span className="text-gray-400 ml-auto">
                                                    {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gesture Quick Reference */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">🎯 Gesture Map</p>
                                <div className="flex flex-col gap-1.5">
                                    {CLASSES.map(cls => {
                                        const config = GESTURE_MAP[cls]
                                        return (
                                            <div key={cls} className="flex items-center gap-2">
                                                <span className="text-sm">{config.emoji}</span>
                                                <span className="text-[10px] font-bold text-gray-700 flex-1">{config.description}</span>
                                                <span className="text-[9px] text-gray-400">{GESTURE_GUIDE[cls]}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
