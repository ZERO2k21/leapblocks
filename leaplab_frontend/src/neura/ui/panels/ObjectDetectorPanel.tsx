import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ObjectDetector } from '../../ml/classifiers/ObjectDetector'
import type { DetectionResult } from '../../ml/classifiers/ObjectDetector'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import WorkflowIndicator from '../components/WorkflowIndicator'
import StatsBar from '../components/StatsBar'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from './TrainPanel'
import AnnotatePanel from './AnnotatePanel'

interface ObjectDetectorPanelProps {
    mode: UseNeuraProjectReturn
}

const OBJECT_COLORS: Record<string, string> = {
    person: '#7C3AED', car: '#3B82F6', cat: '#F97316', dog: '#10B981',
    bird: '#EC4899', chair: '#6366F1', bottle: '#06B6D4', keyboard: '#14B8A6',
    book: '#F59E0B', laptop: '#8B5CF6', 'cell phone': '#A855F7', tv: '#EF4444',
    sofa: '#0EA5E9', bed: '#D946EF', 'dining table': '#F59E0B', 'potted plant': '#22C55E',
    backpack: '#F97316', handbag: '#EC4899', suitcase: '#8B5CF6', umbrella: '#06B6D4',
    cup: '#14B8A6', bowl: '#A855F7', mouse: '#6366F1',
    remote: '#EF4444', microwave: '#F59E0B', refrigerator: '#06B6D4', oven: '#8B5CF6',
    toaster: '#EC4899', sink: '#14B8A6', toilet: '#22C55E', vase: '#F97316',
    clock: '#3B82F6', scissors: '#EF4444', 'teddy bear': '#F59E0B', 'hair drier': '#EC4899',
    toothbrush: '#A855F7', bicycle: '#10B981', motorcycle: '#F97316',
    bus: '#6366F1', truck: '#EF4444', train: '#06B6D4', boat: '#14B8A6',
    airplane: '#8B5CF6', 'traffic light': '#F59E0B', 'fire hydrant': '#EC4899',
    'stop sign': '#EF4444', 'parking meter': '#22C55E', bench: '#F97316',
    horse: '#8B5CF6', sheep: '#06B6D4', cow: '#14B8A6', elephant: '#6366F1',
    bear: '#3B82F6', zebra: '#10B981', giraffe: '#F59E0B',
    frisbee: '#EC4899', skis: '#A855F7', snowboard: '#F97316',
    'sports ball': '#EF4444', kite: '#8B5CF6', 'baseball bat': '#06B6D4',
    'baseball glove': '#14B8A6', skateboard: '#22C55E', surfboard: '#3B82F6',
    'tennis racket': '#F59E0B', 'wine glass': '#EC4899', fork: '#F97316',
    knife: '#EF4444', spoon: '#A855F7', banana: '#F59E0B',
    apple: '#EC4899', sandwich: '#10B981', orange: '#F97316',
    broccoli: '#22C55E', carrot: '#F97316', 'hot dog': '#EF4444',
    pizza: '#F59E0B', donut: '#EC4899', cake: '#A855F7',
}
const DEFAULT_COLOR = '#64748B'

function getColorForObject(label: string): string {
    return OBJECT_COLORS[label.toLowerCase()] || DEFAULT_COLOR
}

const DETECT_THROTTLE_MS = 500

export default function ObjectDetectorPanel({ mode }: ObjectDetectorPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new ObjectDetector())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const removeDebounceRef = useRef<NodeJS.Timeout | null>(null)
    const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastDetectTimeRef = useRef(0)

    const [isLoadingModel, setIsLoadingModel] = useState(true)
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [detections, setDetections] = useState<{ class: string; score: number; bbox: [number, number, number, number] }[]>([])
    const [uploadedImage, setUploadedImage] = useState<{ originalUrl: string; annotatedUrl: string | null; width: number; height: number } | null>(null)
    const [uploadedDetections, setUploadedDetections] = useState<{ class: string; score: number; bbox: [number, number, number, number] }[]>([])
    const [realtimeEnabled, setRealtimeEnabled] = useState(true)
    const [showOriginal, setShowOriginal] = useState(true)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [captureFlash, setCaptureFlash] = useState(false)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [isDetecting, setIsDetecting] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return !localStorage.getItem('neura-objectdetect-onboarding-seen')
    })
    const [inferenceTime, setInferenceTime] = useState(0)
    const [modelLoadError, setModelLoadError] = useState<string | null>(null)

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            streamRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
        } catch (err) {
            console.error('[ObjectDetector] Camera access denied:', err)
            setCameraError('Camera access is needed for object detection. Please allow camera access in your browser settings and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
        setCameraOn(false)
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) { stopCamera() } else { startCamera() }
    }, [cameraOn, startCamera, stopCamera])

    const showFlash = useCallback(() => {
        setCaptureFlash(true)
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
        flashTimeoutRef.current = setTimeout(() => setCaptureFlash(false), 300)
    }, [])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    // Keep refs in sync
    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    // Sync stream to video element when stream changes (handles test mode timing)
    useEffect(() => {
        if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
        }
    }, [stream])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera()
            cancelAnimationFrame(animFrameRef.current)
            classifierRef.current.dispose()
            if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        }
    }, [])

    // Stop camera when leaving collect/test modes
    useEffect(() => {
        if (mode.mode !== 'collect' && mode.mode !== 'test') {
            stopCamera()
        }
    }, [mode.mode])

    // Reset test camera ref when leaving test mode
    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    // Load COCO-SSD model (with abort pattern)
    useEffect(() => {
        const thisBuild = ++rebuildAbortRef.current
        let cancelled = false
        setIsLoadingModel(true)
        setModelLoadError(null)
        classifierRef.current.loadModel()
            .then(() => {
                if (!cancelled && thisBuild === rebuildAbortRef.current) setIsLoadingModel(false)
            })
            .catch((e) => {
                console.error('[ObjectDetector] Failed to load COCO-SSD:', e)
                if (!cancelled && thisBuild === rebuildAbortRef.current) {
                    setIsLoadingModel(false)
                    setModelLoadError('Failed to load AI model. Please refresh and try again.')
                }
            })
        return () => { cancelled = true }
    }, [])

    // Detect from video frame
    const detectFrame = useCallback(async (): Promise<{ class: string; score: number; bbox: [number, number, number, number] }[]> => {
        if (!videoRef.current || !videoRef.current.srcObject) return []
        const video = videoRef.current
        if (video.readyState < 2) return []
        try {
            const start = performance.now()
            const result = await classifierRef.current.detect(video)
            const elapsed = Math.round(performance.now() - start)
            setInferenceTime(elapsed)
            return result.objects.map(o => ({ class: o.class, score: o.confidence, bbox: o.bbox }))
        } catch (e) {
            console.warn('[ObjectDetector] Detection error:', e)
            return []
        }
    }, [])

    const drawDetections = useCallback((dets: { class: string; score: number; bbox: [number, number, number, number] }[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width, 0)
        dets.forEach((det) => {
            const [x, y, w, h] = det.bbox
            const color = getColorForObject(det.class)
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.shadowColor = color
            ctx.shadowBlur = 8
            ctx.strokeRect(x, y, w, h)
            ctx.shadowBlur = 0
            const label = `${det.class} ${Math.round(det.score * 100)}%`
            ctx.font = 'bold 14px system-ui, sans-serif'
            const textWidth = ctx.measureText(label).width
            const labelY = Math.max(y - 8, 22)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.roundRect(x, labelY - 20, textWidth + 16, 22, 6)
            ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, x + 8, labelY - 9)
        })
        ctx.restore()
    }, [])

    // Real-time detection loop (throttled)
    useEffect(() => {
        if (!cameraOn || !realtimeEnabled || isLoadingModel) {
            cancelAnimationFrame(animFrameRef.current)
            return
        }
        lastDetectTimeRef.current = performance.now()
        const tick = () => {
            const now = performance.now()
            if (now - lastDetectTimeRef.current >= DETECT_THROTTLE_MS && !isPredictingRef.current) {
                lastDetectTimeRef.current = now
                isPredictingRef.current = true
                detectFrame().then(dets => {
                    setDetections(dets)
                    if (canvasRef.current && videoRef.current) drawDetections(dets, canvasRef.current, videoRef.current)
                    isPredictingRef.current = false
                })
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [cameraOn, realtimeEnabled, isLoadingModel, detectFrame, drawDetections])

    // Test mode: auto-start camera
    useEffect(() => {
        if (mode.mode !== 'test' || isLoadingModel) return
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
    }, [mode.mode, isLoadingModel, startCamera])

    const handleManualDetect = async () => {
        if (isLoadingModel || !videoRef.current || !canvasRef.current) return
        setIsDetecting(true)
        const dets = await detectFrame()
        setDetections(dets)
        if (canvasRef.current && videoRef.current) drawDetections(dets, canvasRef.current, videoRef.current)
        setIsDetecting(false)
    }

    const handleCapture = async () => {
        if (!videoRef.current || !mode.selectedClassId || !cameraOn) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
            return
        }
        const video = videoRef.current
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = video.videoWidth
        tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)
        const imageData = tempCanvas.toDataURL('image/png')
        const added = mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })
        if (!added) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
            return
        }
        showFlash()
        const className = mode.getSelectedClass()?.name || 'class'
        showSaved(`📸 Saved to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        if (isLoadingModel) { alert('Model is still loading. Please wait.'); return }
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })
        setCameraOn(false)
        stopCamera()
        const img = new Image()
        img.src = dataUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            setTimeout(() => resolve(), 5000)
        })
        if (img.complete && img.naturalWidth > 0) {
            try {
                const start = performance.now()
                const result = await classifierRef.current.detect(img as any)
                const elapsed = Math.round(performance.now() - start)
                setInferenceTime(elapsed)
                const dets = result.objects.map(o => ({ class: o.class, score: o.confidence, bbox: o.bbox }))
                setUploadedDetections(dets)
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth
                canvas.height = img.naturalHeight
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0)
                dets.forEach((det) => {
                    const [x, y, w, h] = det.bbox
                    const color = getColorForObject(det.class)
                    ctx.strokeStyle = color
                    ctx.lineWidth = 3
                    ctx.shadowColor = color
                    ctx.shadowBlur = 8
                    ctx.strokeRect(x, y, w, h)
                    ctx.shadowBlur = 0
                    const label = `${det.class} ${Math.round(det.score * 100)}%`
                    ctx.font = 'bold 14px system-ui, sans-serif'
                    const textWidth = ctx.measureText(label).width
                    const labelY = Math.max(y - 8, 22)
                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.roundRect(x, labelY - 20, textWidth + 16, 22, 6)
                    ctx.fill()
                    ctx.fillStyle = '#fff'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(label, x + 8, labelY - 9)
                })
                setUploadedImage({ originalUrl: dataUrl, annotatedUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight })
            } catch (err) {
                console.error('[ObjectDetector] Upload detection failed:', err)
                setUploadedImage({ originalUrl: dataUrl, annotatedUrl: null, width: img.naturalWidth, height: img.naturalHeight })
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSaveUploadedImage = useCallback(() => {
        if (!uploadedImage || !mode.selectedClassId) return
        const saved = mode.addSample(mode.selectedClassId, { type: 'image', data: uploadedImage.originalUrl })
        if (!saved) { showSaved('⚠️ Sample limit reached! (20 per class)'); return }
        const className = mode.getSelectedClass()?.name || 'class'
        showSaved(`📂 Saved to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
    }, [uploadedImage, mode, showSaved])

    const handleResetUpload = () => { setUploadedImage(null); setUploadedDetections([]); setShowOriginal(true); startCamera() }

    const handleRemoveSample = useCallback((classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        if (removeDebounceRef.current) clearTimeout(removeDebounceRef.current)
        removeDebounceRef.current = setTimeout(() => {
            // No KNN rebuild needed for object detection — COCO-SSD is pre-trained
        }, 300)
    }, [mode.removeSample])

    const selectedClass = mode.getSelectedClass()
    const hasUploadedImage = !!uploadedImage
    const currentDetections = hasUploadedImage ? uploadedDetections : detections
    const totalSamples = mode.getTotalSamples()
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    const handleExportTestReport = useCallback(() => {
        const report = {
            projectName: mode.project?.name || 'Untitled',
            projectType: 'object-detection',
            exportedAt: new Date().toISOString(),
            testResults: {
                detections: currentDetections.map(d => ({ class: d.class, confidence: d.score, bbox: d.bbox })),
                totalObjectsFound: currentDetections.length,
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
    }, [mode, currentDetections, inferenceTime])

    // Collect mode
    const renderCollectMode = () => (
        <div className="flex-1 flex flex-col items-center gap-6 p-6 overflow-y-auto neura-scrollbar">
            <div className="w-full max-w-[720px] text-center mb-2 animate-fade-in">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-1">🔍 Object Finder!</h2>
                <p className="text-sm text-[#4a4455]">Point your camera at things — AI will find and name them! 🎯</p>
            </div>

            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={totalSamples >= 4} />

            {/* Tips */}
            <div className="w-full max-w-[720px] animate-fade-in">
                <div className="bg-gradient-to-r from-[#eaedff] to-[#dbeafe] rounded-2xl px-5 py-4 border border-[#630ed4]/10">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <p className="text-[11px] font-bold text-[#630ed4] mb-1">TIPS FOR OBJECT DETECTION</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#630ed4]" /> Point camera at objects</span>
                                <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#630ed4]" /> Good lighting helps</span>
                                <span className="text-xs text-[#4a4455] flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#630ed4]" /> Capture to save detections</span>
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
                        <button onClick={() => { setCameraError(null); fileInputRef.current?.click() }} className="px-6 py-3 bg-[#eaedff] text-[#131b2e] rounded-xl font-bold text-sm hover:bg-[#dae2fd] transition-all">Upload Only 📂</button>
                    </div>
                </div>
            )}

            {!selectedClass && !cameraError && (
                <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-2xl px-5 py-3 max-w-[520px] w-full">
                    <p className="text-xs font-bold text-[#f97316] text-center">⚠️ Select or add a class first to start capturing!</p>
                </div>
            )}

            {/* Camera feed */}
            <div className={`relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] shadow-lg aspect-[4/3] transition-all duration-300 ${cameraOn ? '' : 'hidden'}`}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none -scale-x-100" />
                {captureFlash && <div className="absolute inset-0 bg-white/50 animate-flash rounded-3xl" />}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                    <span className="text-white text-[10px] font-bold tracking-wide">🔍 LIVE</span>
                </div>
                <div className="absolute top-4 right-4">
                    <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#d1fae5] text-[#006c44] hover:bg-[#a7f3d0] transition-all">
                        📷 Camera On
                    </button>
                </div>
                {selectedClass && (
                    <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: `${selectedClass.color}CC` }}>
                        {selectedClass.name}
                    </div>
                )}
                {currentDetections.length > 0 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-xl">
                        <span className="text-white text-[11px] font-bold">🎯 {currentDetections.length} found</span>
                    </div>
                )}
            </div>

            {/* Camera off placeholder */}
            {!cameraOn && !cameraError && (
                <div className="w-full max-w-[520px] border-2 border-dashed border-[#630ed4]/20 rounded-3xl p-8 text-center transition-all hover:border-[#630ed4]/40 bg-white/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-6xl mb-4">🔍</span>
                        <h2 className="text-xl font-extrabold text-[#131b2e] mb-2">Camera is off</h2>
                        <p className="text-sm text-[#4a4455] mb-6 max-w-sm">Start the camera to detect objects in real-time!</p>
                        <div className="flex gap-3">
                            <button onClick={startCamera} className="bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-[#630ed4]/30 hover:-translate-y-0.5 transition-all">
                                📷 Turn On Camera
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} disabled={!mode.selectedClassId} className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${mode.selectedClassId ? 'bg-white text-[#630ed4] border-2 border-[#630ed4] hover:bg-[#630ed4]/5' : 'bg-[#e5e7eb] text-[#ccc3d8] border-2 border-[#d1d5db] cursor-not-allowed'}`}>
                                📂 Upload Image
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
                <button onClick={toggleCamera} disabled={isLoadingModel} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${cameraOn ? 'bg-[#d1fae5] text-[#006c44]' : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'} disabled:opacity-40`}>
                    {cameraOn ? '📷 Stop' : '📷 Start'}
                </button>
                {cameraOn && (
                    <button onClick={() => setRealtimeEnabled(!realtimeEnabled)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${realtimeEnabled ? 'bg-[#d1fae5] text-[#006c44] border border-[#006c44]/30' : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'}`}>
                        {realtimeEnabled ? '⚡ Auto' : '✋ Manual'}
                    </button>
                )}
                {cameraOn && !realtimeEnabled && (
                    <button onClick={handleManualDetect} disabled={isLoadingModel || isDetecting} className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md active:scale-95 transition-all disabled:opacity-40">
                        {isDetecting ? '⏳ Scanning...' : '🔍 Scan Now'}
                    </button>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingModel} className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md disabled:opacity-40 transition-all">
                    📂 Upload
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>

            {/* Capture button */}
            {cameraOn && (
                <CaptureButton
                    onClick={handleCapture}
                    disabled={!canAddSamples || isLoadingModel}
                    label={atSampleLimit ? 'Max Reached' : !stream ? 'Start Camera First' : 'Capture Object'}
                    icon="camera"
                    color={selectedClass?.color || '#630ed4'}
                    pulse={!isLoadingModel && !!canAddSamples && !!stream}
                />
            )}

            <StatsBar totalClasses={mode.project?.classes.length || 0} totalImages={mode.getTotalSamples()} imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0} recommended={10} />

            {/* Detected objects sidebar */}
            {currentDetections.length > 0 && (
                <div className="w-full max-w-[520px]">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-[#131b2e]">🎯 Detected Objects</h3>
                            <span className="text-[10px] font-bold bg-[#eaedff] px-2 py-0.5 rounded text-[#630ed4]">{currentDetections.length}</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto neura-scrollbar">
                            {currentDetections.map((det, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f2f3ff] transition-colors">
                                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${getColorForObject(det.class)}20` }}>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorForObject(det.class) }} />
                                    </div>
                                    <span className="text-[11px] font-bold text-[#131b2e] capitalize truncate flex-1">{det.class}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ backgroundColor: getColorForObject(det.class) }}>
                                        {Math.round(det.score * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Collected samples */}
            {selectedClass && selectedClass.samples.length > 0 && (
                <div className="w-full max-w-[520px]">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${atSampleLimit ? 'text-[#c32c00] bg-[#fef3c7]' : 'text-[#4a4455] bg-[#f2f3ff]'}`}>{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} pics</span>
                        </div>
                        <SampleGrid samples={selectedClass.samples} type="image" onRemove={(id) => handleRemoveSample(selectedClass.id, id)} />
                    </div>
                </div>
            )}
        </div>
    )

    // Test mode
    const renderTestMode = () => (
        <div className="flex-1 flex flex-col items-center gap-6 p-6 overflow-y-auto neura-scrollbar">
            <div className="w-full max-w-[720px] text-center mb-2 animate-fade-in">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-1">🧪 Test Your Finder!</h2>
                <p className="text-sm text-[#4a4455]">Try different objects and see what AI can find! 🕵️</p>
            </div>

            <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={totalSamples >= 4} />

            {isLoadingModel && (
                <div className="flex items-center gap-3 px-6 py-4 bg-[#eaedff] rounded-2xl border border-[#630ed4]/20 animate-fade-in">
                    <div className="w-5 h-5 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold text-[#630ed4]">Loading model... ⏳</span>
                </div>
            )}

            {modelLoadError && (
                <div className="flex items-center gap-3 px-6 py-4 bg-[#fee2e2] rounded-2xl border border-[#fecaca] animate-fade-in">
                    <span className="text-xl">❌</span>
                    <span className="text-sm font-bold text-[#991b1b]">{modelLoadError}</span>
                </div>
            )}

            {/* Camera feed */}
            <div className={`relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] shadow-lg aspect-[4/3] transition-all duration-300 ${cameraOn ? '' : 'hidden'}`}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none -scale-x-100" />
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                    <span className="text-white text-[10px] font-bold tracking-wide">🔍 LIVE</span>
                </div>
                <div className="absolute top-4 right-4">
                    <button onClick={toggleCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#d1fae5] text-[#006c44] hover:bg-[#a7f3d0] transition-all">
                        📷 Camera On
                    </button>
                </div>
                {currentDetections.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-2xl">
                        <span className="text-white text-lg font-bold">🎯 {currentDetections.length} objects detected</span>
                    </div>
                )}
                {!cameraOn && !isLoadingModel && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl mb-2">📷</span>
                        <span className="text-white/70 text-xs font-bold">Camera is off</span>
                        <button onClick={startCamera} className="mt-3 px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md transition-all">
                            📷 Start Camera
                        </button>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
                <button onClick={toggleCamera} disabled={isLoadingModel} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${cameraOn ? 'bg-[#d1fae5] text-[#006c44]' : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'} disabled:opacity-40`}>
                    {cameraOn ? '📷 Stop' : '📷 Start'}
                </button>
                {cameraOn && (
                    <button onClick={handleManualDetect} disabled={isLoadingModel || isDetecting} className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md active:scale-95 transition-all disabled:opacity-40">
                        {isDetecting ? '⏳ Scanning...' : '🔍 Scan Now'}
                    </button>
                )}
            </div>

            {/* Detected objects */}
            {currentDetections.length > 0 && (
                <div className="w-full max-w-[520px]">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-[#131b2e]">🎯 Detected Objects</h3>
                            <span className="text-[10px] font-bold bg-[#eaedff] px-2 py-0.5 rounded text-[#630ed4]">{currentDetections.length}</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto neura-scrollbar">
                            {currentDetections.map((det, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f2f3ff] transition-colors">
                                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${getColorForObject(det.class)}20` }}>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorForObject(det.class) }} />
                                    </div>
                                    <span className="text-[11px] font-bold text-[#131b2e] capitalize truncate flex-1">{det.class}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ backgroundColor: getColorForObject(det.class) }}>
                                        {Math.round(det.score * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Speed and test count */}
            <div className="w-full max-w-[520px] grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-4 flex items-center gap-3 bg-[#f2f3ff] border border-[#dae2fd]/30 shadow-sm">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <p className="text-[10px] text-[#4a4455] opacity-70 font-bold uppercase tracking-wider">Speed</p>
                        <p className="text-lg font-black text-[#131b2e]">{inferenceTime}ms</p>
                    </div>
                </div>
                <div className="rounded-2xl p-4 flex items-center gap-3 bg-[#f2f3ff] border border-[#dae2fd]/30 shadow-sm">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <p className="text-[10px] text-[#4a4455] opacity-70 font-bold uppercase tracking-wider">Objects Found</p>
                        <p className="text-lg font-black text-[#131b2e]">{currentDetections.length}</p>
                    </div>
                </div>
            </div>

            {currentDetections.length > 0 && (
                <button onClick={handleExportTestReport} className="px-6 py-3 bg-[#d1fae5] text-[#006c44] rounded-2xl font-bold text-sm hover:bg-[#a7f3d0] transition-all flex items-center gap-2 shadow-sm">
                    💾 Save Test Report
                </button>
            )}
        </div>
    )

    return (
        <div className="flex flex-col h-full relative">
            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-extrabold text-[#131b2e] mb-2">Welcome to Object Detector!</h3>
                            <p className="text-sm text-[#4a4455]">AI will find and identify objects in your camera! 🚀</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#eaedff] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#630ed4]">1</div>
                                <div>
                                    <p className="text-sm font-bold text-[#131b2e]">Create Classes 📁</p>
                                    <p className="text-xs text-[#4a4455]">Click "+" in the sidebar to add object categories!</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#eaedff] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#630ed4]">2</div>
                                <div>
                                    <p className="text-sm font-bold text-[#131b2e]">Detect & Capture 🔍</p>
                                    <p className="text-xs text-[#4a4455]">AI auto-detects objects — capture to save!</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#d1fae5] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#006c44]">3</div>
                                <div>
                                    <p className="text-sm font-bold text-[#131b2e]">Train & Test 🏋️🧪</p>
                                    <p className="text-xs text-[#4a4455]">Label your captures, then test the detector!</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-objectdetect-onboarding-seen', 'true') }} className="w-full py-3 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-[#630ed4]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                            Let's Go! 🚀
                        </button>
                    </div>
                </div>
            )}

            {/* Toast messages */}
            {captureFlash && <div className="fixed inset-0 bg-white/40 z-50 pointer-events-none animate-fade-in" />}
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* Mode routing */}
            {mode.mode === 'train' ? (
                <TrainPanel mode={mode} />
            ) : mode.mode === 'annotate' ? (
                <AnnotatePanel mode={mode} />
            ) : mode.mode === 'test' ? (
                renderTestMode()
            ) : (
                renderCollectMode()
            )}
        </div>
    )
}
