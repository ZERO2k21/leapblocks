import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { HandPoseClassifier } from '../../ml/classifiers/HandPoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../../ui/components/WorkflowIndicator'
import ClassScores from '../../ui/components/ClassScores'
import SampleWarningModal from '../../ui/components/SampleWarningModal'
import { classifyPianoKey, ZoneDebounceBuffer } from '../../ml/utils/ruleBasedClassifiers'

interface VirtualPianoPanelProps {
    mode: UseNeuraProjectReturn
}

type CaptureStatus = 'idle' | 'detecting' | 'success' | 'no-hand' | 'error'

const PREDICT_THROTTLE_MS = 400

const NOTE_CONFIG: Record<string, { freq: number; key: string; color: string; isBlack: boolean }> = {
    'Do': { freq: 261.63, key: 'C', color: '#ef4444', isBlack: false },
    'Re': { freq: 293.66, key: 'D', color: '#f97316', isBlack: false },
    'Mi': { freq: 329.63, key: 'E', color: '#eab308', isBlack: false },
    'Fa': { freq: 349.23, key: 'F', color: '#22c55e', isBlack: false },
    'Sol': { freq: 392.00, key: 'G', color: '#3b82f6', isBlack: false },
    'La': { freq: 440.00, key: 'A', color: '#8b5cf6', isBlack: false },
    'Si': { freq: 493.88, key: 'B', color: '#ec4899', isBlack: false }
}

export default function VirtualPianoPanel({ mode }: VirtualPianoPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new HandPoseClassifier())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const testCameraStartedRef = useRef(false)
    const lastPredictTimeRef = useRef(0)
    const audioContextRef = useRef<AudioContext | null>(null)
    const activeOscillatorsRef = useRef<Map<string, { osc: OscillatorNode; gain: GainNode }>>(new Map())
    const zoneDebounceRef = useRef(new ZoneDebounceBuffer())

    const [isCapturing, setIsCapturing] = useState(false)
    const [captureFps, setCaptureFps] = useState(15)
    const burstIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const handleCaptureRef = useRef<() => Promise<void>>(null)
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
    const [activeNote, setActiveNote] = useState<string | null>(null)
    const [playedNotes, setPlayedNotes] = useState<string[]>([])
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.5)
    const [volume, setVolume] = useState(0.5)

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext()
        }
        return audioContextRef.current
    }, [])

    const playNote = useCallback((note: string) => {
        try {
            const ctx = getAudioContext()
            const config = NOTE_CONFIG[note]
            if (!config) return

            if (activeOscillatorsRef.current.has(note)) return

            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const filter = ctx.createBiquadFilter()

            osc.type = 'triangle'
            osc.frequency.value = config.freq

            filter.type = 'lowpass'
            filter.frequency.value = 2000

            gain.gain.setValueAtTime(0, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.05)
            gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime + 0.1)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)

            osc.connect(filter)
            filter.connect(gain)
            gain.connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 1.5)

            activeOscillatorsRef.current.set(note, { osc, gain })
            setTimeout(() => {
                activeOscillatorsRef.current.delete(note)
            }, 1600)
        } catch { /* ignore audio errors */ }
    }, [getAudioContext, volume])

    const stopNote = useCallback((note: string) => {
        const entry = activeOscillatorsRef.current.get(note)
        if (entry) {
            try {
                const ctx = getAudioContext()
                entry.gain.gain.cancelScheduledValues(ctx.currentTime)
                entry.gain.gain.setValueAtTime(entry.gain.gain.value, ctx.currentTime)
                entry.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
                setTimeout(() => {
                    try { entry.osc.stop() } catch {}
                    activeOscillatorsRef.current.delete(note)
                }, 100)
            } catch {
                activeOscillatorsRef.current.delete(note)
            }
        }
    }, [getAudioContext])

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
        setActiveNote(null)
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
            activeOscillatorsRef.current.forEach((entry) => {
                try { entry.osc.stop() } catch {}
            })
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
        // Camera starts OFF in test mode — user chooses to turn on camera
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
                        
                        // Rule-based classification: map fingertip position to piano key
                        const keypoints = await classifierRef.current.detectHand(canvasRef.current)
                        if (keypoints && keypoints.length > 0) {
                            const features = classifierRef.current.extractFeatures(keypoints)
                            const result = classifyPianoKey(features, 640, 480, 7)
                            const debouncedKey = zoneDebounceRef.current.update(result.label)
                            
                            const elapsed = Math.round(performance.now() - start)
                            setInferenceTime(elapsed)
                            setHandDetected(true)
                            
                            // Build prediction result
                            const confidences: Record<string, number> = {}
                            for (const [key, conf] of Object.entries(result.details)) {
                                confidences[key] = conf
                            }
                            setPrediction({ label: result.label, confidences })
                            
                            // Only play note on new zone entry (debounced)
                            if (debouncedKey && debouncedKey !== 'none') {
                                setActiveNote(debouncedKey)
                                playNote(debouncedKey)
                                setPlayedNotes(prev => [...prev.slice(-19), debouncedKey])
                            }
                        } else {
                            setPrediction(null)
                            setHandDetected(false)
                            setActiveNote(null)
                            zoneDebounceRef.current.clear()
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
    }, [mode.mode, stream, startCamera, playNote])

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
                showSaved(`🎹 Saved to ${mode.getSelectedClass()?.name}!`)
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

    handleCaptureRef.current = handleCapture

    const startBurstCapture = useCallback(() => {
        if (!mode.selectedClassId || !cameraOn) return
        burstIntervalRef.current = setInterval(() => {
            handleCaptureRef.current?.()
        }, 1000 / captureFps)
    }, [captureFps, mode.selectedClassId, cameraOn])

    const stopBurstCapture = useCallback(() => {
        if (burstIntervalRef.current) {
            clearInterval(burstIntervalRef.current)
            burstIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => { stopBurstCapture() }
    }, [])

    const canTrain = !!(mode.project && mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2))
    const selectedClass = mode.getSelectedClass()

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-purple-600 mb-0">🎹 Virtual Piano!</h2>
                            <p className="text-xs text-gray-600">Learn hand gestures for each note and capture them! 🎵</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
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
                                        <span className="text-5xl mb-3">🎹</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to collect gesture samples</p>
                                        <button type="button" onClick={startCamera} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-lg border-none cursor-pointer">📷 Turn On Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border-none cursor-pointer">
                                    {cameraOn ? '📷 Stop' : '📷 Start'}
                                </button>
                                <div className="flex items-center gap-1 py-1 px-2 bg-gray-50 rounded-lg">
                                    <span className="text-[9px] font-bold text-gray-500">FPS</span>
                                    <input
                                        type="range"
                                        min={5}
                                        max={30}
                                        step={1}
                                        value={captureFps}
                                        onChange={(e) => setCaptureFps(Number(e.target.value))}
                                        className="w-12 h-1 accent-purple-600"
                                    />
                                    <span className="text-[10px] font-bold text-purple-600 w-4 text-center">{captureFps}</span>
                                </div>
                                <button type="button" onClick={handleCapture}
                                    onMouseDown={startBurstCapture}
                                    onMouseUp={stopBurstCapture}
                                    onMouseLeave={stopBurstCapture}
                                    onTouchStart={startBurstCapture}
                                    onTouchEnd={stopBurstCapture}
                                    disabled={!cameraOn || isCapturing || !selectedClass}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white border-none cursor-pointer disabled:opacity-40 ${isCapturing ? 'bg-slate-400' : 'bg-purple-600'}`}>
                                    {isCapturing ? '⏳ Recording...' : '📸 Hold to Record'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Piano Keys Reference */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">🎵 Notes</p>
                                <div className="flex gap-1">
                                    {Object.entries(NOTE_CONFIG).map(([note, config]) => (
                                        <div key={note} className="flex-1 flex flex-col items-center">
                                            <div className={`w-full h-12 rounded-b-lg border border-gray-200 flex items-end justify-center pb-1 ${activeNote === note ? '' : 'bg-white'}`}
                                                style={{ background: activeNote === note ? config.color : undefined }}>
                                                <span className={`text-[8px] font-bold ${activeNote === note ? 'text-white' : ''}`} style={{ color: activeNote === note ? undefined : config.color }}>
                                                    {config.key}
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-500 mt-1">{note}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-600/10">
                                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-1.5">💡 Gesture Guide</p>
                                <div className="flex flex-col gap-1">
                                    {['Do: Fist (closed hand)', 'Re: Index finger up', 'Mi: Two fingers up', 'Fa: Three fingers up', 'Sol: Four fingers up', 'La: Open hand (five)', 'Si: Thumb up'].map(tip => (
                                        <span key={tip} className="text-[9px] text-purple-900">• {tip}</span>
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
                        <h2 className="text-2xl font-extrabold text-purple-600 mb-2">🏋️ Training Your Piano AI!</h2>
                        <p className="text-sm text-gray-500">Teaching the AI to recognize note gestures...</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-6xl">✅</span>
                        <p className="text-sm font-bold text-green-600">Model Ready!</p>
                        <button type="button" onClick={() => mode.setMode('test')} className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg border-none cursor-pointer">
                                🎹 Start Playing
                            </button>
                        </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-1">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-purple-600 mb-0">🧪 Test Your Piano!</h2>
                            <p className="text-xs text-gray-600">Show hand gestures to play notes! 🎵</p>
                        </div>
                        <div className="w-full max-w-[720px]">
                            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="pose" />
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
                                {/* Active Note Display */}
                                {activeNote && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-fade-in px-8 py-4 rounded-2xl backdrop-blur-md" style={{
                                            background: `${NOTE_CONFIG[activeNote]?.color || '#8b5cf6'}CC`
                                        }}>
                                            <span className="text-6xl font-black text-white">{activeNote}</span>
                                            <span className="block text-2xl font-bold text-white/80">{NOTE_CONFIG[activeNote]?.key}</span>
                                        </div>
                                    </div>
                                )}
                                {!cameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl mb-3">📷</span>
                                        <h3 className="text-white text-sm font-bold mb-1">Camera is off</h3>
                                        <p className="text-white/50 text-[10px] mb-4">Start camera to play piano</p>
                                        <button type="button" onClick={startCamera} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-lg border-none cursor-pointer">📷 Start Camera</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <button type="button" onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border-none cursor-pointer">
                                    {cameraOn ? '📷 Stop Camera' : '📷 Start Camera'}
                                </button>
                            </div>
                        </div>

                        <div className="w-full lg:w-72 flex flex-col gap-2 overflow-y-auto">
                            {/* Confidence Threshold */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">🎚️ Confidence</span>
                                    <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{Math.round(confidenceThreshold * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={Math.round(confidenceThreshold * 100)}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-purple-600"
                                    style={{ background: `linear-gradient(to right, #8b5cf6 ${Math.round(confidenceThreshold * 100)}%, #e5e7eb ${Math.round(confidenceThreshold * 100)}%)` }} />
                            </div>

                            {/* Volume Control */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-700">🔊 Volume</span>
                                    <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{Math.round(volume * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={Math.round(volume * 100)}
                                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-purple-600"
                                    style={{ background: `linear-gradient(to right, #8b5cf6 ${Math.round(volume * 100)}%, #e5e7eb ${Math.round(volume * 100)}%)` }} />
                            </div>

                            {/* Active Note */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Note</p>
                                <div className="text-5xl font-black" style={{ color: activeNote ? NOTE_CONFIG[activeNote]?.color : '#94a3b8' }}>
                                    {activeNote || '—'}
                                </div>
                                {activeNote && (
                                    <p className="text-xs font-bold text-gray-500 mt-1">{NOTE_CONFIG[activeNote]?.key} ({Math.round(NOTE_CONFIG[activeNote]?.freq)}Hz)</p>
                                )}
                            </div>

                            {/* All Class Scores */}
                            {prediction && (
                                <ClassScores confidences={prediction.confidences} accentColor="#8b5cf6" accentBg="#f5f3ff" />
                            )}

                            {/* Speed & Hand */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-purple-50 rounded-xl p-2.5 border border-purple-100">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">⚡ Speed</p>
                                    <p className="text-lg font-extrabold text-gray-800">{inferenceTime}ms</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-2.5 border border-purple-100">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">✋ Hand</p>
                                    <p className={`text-lg font-extrabold ${handDetected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {handDetected ? 'Found' : 'None'}
                                    </p>
                                </div>
                            </div>

                            {/* Played Notes History */}
                            {playedNotes.length > 0 && (
                                <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-700 mb-2">🎵 Recent Notes</p>
                                    <div className="flex flex-wrap gap-1">
                                        {playedNotes.slice(-12).map((note, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: NOTE_CONFIG[note]?.color || '#94a3b8' }}>
                                                {note}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Piano Keys */}
                            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-700 mb-2">🎹 Keyboard</p>
                                <div className="flex gap-0.5">
                                    {Object.entries(NOTE_CONFIG).map(([note, config]) => (
                                        <button key={note} type="button" onMouseDown={() => playNote(note)} onMouseUp={() => stopNote(note)}
                                            className={`flex-1 h-14 rounded-b-lg border border-gray-200 flex items-end justify-center pb-1 transition-all cursor-pointer ${activeNote === note ? '' : 'bg-white'}`}
                                            style={{ background: activeNote === note ? config.color : undefined }}>
                                            <span className={`text-[8px] font-bold ${activeNote === note ? 'text-white' : ''}`} style={{ color: activeNote === note ? undefined : config.color }}>
                                                {config.key}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mode.mode === 'collect' && mode.project && (
                <SampleWarningModal
                    classes={mode.project.classes}
                    accentColor="#8b5cf6"
                    accentBg="#f5f3ff"
                    projectType="virtual piano"
                />
            )}
        </div>
    )
}
