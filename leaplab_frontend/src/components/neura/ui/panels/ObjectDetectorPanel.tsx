import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ensureCocoSsd } from '../../ml/loadScript'
import TrainPanel from './TrainPanel'
import AnnotatePanel from './AnnotatePanel'

interface ObjectDetectorPanelProps {
    mode: UseNeuraProjectReturn
}

interface Detection {
    class: string
    score: number
    bbox: [number, number, number, number]
}

interface UploadedImageState {
    originalUrl: string
    annotatedUrl: string | null
    width: number
    height: number
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
    return OBJECT_COLORS[label] || DEFAULT_COLOR
}

export default function ObjectDetectorPanel({ mode }: ObjectDetectorPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const [model, setModel] = useState<any>(null)
    const [isLoadingModel, setIsLoadingModel] = useState(true)
    const [cameraOn, setCameraOn] = useState(false)
    const [isDetecting, setIsDetecting] = useState(false)
    const [detections, setDetections] = useState<Detection[]>([])
    const [uploadedImage, setUploadedImage] = useState<UploadedImageState | null>(null)
    const [uploadedDetections, setUploadedDetections] = useState<Detection[]>([])
    const [realtimeEnabled, setRealtimeEnabled] = useState(true)
    const [sessionTime] = useState(() => Date.now())
    const [showOriginal, setShowOriginal] = useState(true)
    const [cameraError, setCameraError] = useState<string | null>(null)

    // ── Load COCO-SSD model on mount ──
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setIsLoadingModel(true)
            try {
                const cocoSsd = await ensureCocoSsd()
                if (cancelled) return
                const loadedModel = await cocoSsd.load()
                if (cancelled) return
                setModel(loadedModel)
            } catch (err) {
                console.error('[ObjectDetector] Failed to load COCO-SSD:', err)
            }
            if (!cancelled) setIsLoadingModel(false)
        }
        load()
        return () => { cancelled = true }
    }, [])

    // ── Camera controls ──
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
            setCameraOn(true)
        } catch (err) {
            console.error('[ObjectDetector] Camera access denied:', err)
            setCameraError('Camera access is needed to detect objects. Please allow camera access in your browser settings and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) {
            s.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setCameraOn(false)
        setDetections([])
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) {
            stopCamera()
        } else {
            startCamera()
        }
    }, [cameraOn, startCamera, stopCamera])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera()
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
        }
    }, [])

    // ── Detection on video frame ──
    const detectFrame = useCallback(async (): Promise<Detection[]> => {
        if (!model || !videoRef.current || !videoRef.current.srcObject) return []
        const video = videoRef.current
        if (video.readyState < 2) return []

        try {
            const results = await model.detect(video)
            return results.map((r: any) => ({
                class: r.class,
                score: r.score,
                bbox: r.bbox as [number, number, number, number]
            }))
        } catch {
            return []
        }
    }, [model])

    // ── Draw detections on canvas ──
    const drawDetections = useCallback((dets: Detection[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)

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
    }, [])

    // ── Real-time detection loop ──
    useEffect(() => {
        if (!cameraOn || !realtimeEnabled || !model) {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current)
                detectionIntervalRef.current = null
            }
            return
        }

        const loop = async () => {
            const dets = await detectFrame()
            setDetections(dets)
            if (canvasRef.current && videoRef.current) {
                drawDetections(dets, canvasRef.current, videoRef.current)
            }
        }

        // Run immediately, then every 500ms
        loop()
        detectionIntervalRef.current = setInterval(loop, 500)

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current)
                detectionIntervalRef.current = null
            }
        }
    }, [cameraOn, realtimeEnabled, model, detectFrame, drawDetections])

    // ── Manual single-frame detection ──
    const handleManualDetect = async () => {
        if (!model || !videoRef.current || !canvasRef.current) return
        setIsDetecting(true)
        const dets = await detectFrame()
        setDetections(dets)
        if (canvasRef.current && videoRef.current) {
            drawDetections(dets, canvasRef.current, videoRef.current)
        }
        setIsDetecting(false)
    }

    // ── Capture frame as sample ──
    const handleCapture = async () => {
        if (!videoRef.current || !mode.selectedClassId || !cameraOn) return

        const video = videoRef.current
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = video.videoWidth
        tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)
        const imageData = tempCanvas.toDataURL('image/png')

        mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })
    }

    // ── Upload image detection ──
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        if (!model) {
            alert('Model is still loading. Please wait a moment.')
            return
        }

        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })

        setCameraOn(false)
        stopCamera()

        // Load image and run detection
        const img = new Image()
        img.src = dataUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            setTimeout(() => resolve(), 3000)
        })

        if (img.complete && img.naturalWidth > 0) {
            try {
                const results = await model.detect(img)
                const dets: Detection[] = results.map((r: any) => ({
                    class: r.class,
                    score: r.score,
                    bbox: r.bbox as [number, number, number, number]
                }))
                setUploadedDetections(dets)

                // Create annotated version with detection boxes
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth
                canvas.height = img.naturalHeight
                const ctx = canvas.getContext('2d')!

                // Draw the original image first
                ctx.drawImage(img, 0, 0)

                // Draw detection boxes on top
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

                // Store both original and annotated versions
                setUploadedImage({
                    originalUrl: dataUrl,
                    annotatedUrl: canvas.toDataURL('image/png'),
                    width: img.naturalWidth,
                    height: img.naturalHeight
                })
            } catch (err) {
                console.error('[ObjectDetector] Upload detection failed:', err)
                // Still show the image even if detection fails
                const img2 = new Image()
                img2.src = dataUrl
                await new Promise<void>((resolve) => {
                    img2.onload = () => resolve()
                })
                setUploadedImage({
                    originalUrl: dataUrl,
                    annotatedUrl: null,
                    width: img2.naturalWidth,
                    height: img2.naturalHeight
                })
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ── Reset uploaded image ──
    const handleResetUpload = () => {
        setUploadedImage(null)
        setUploadedDetections([])
        setShowOriginal(true)
        startCamera()
    }

    const selectedClass = mode.getSelectedClass()
    const hasUploadedImage = !!uploadedImage
    const currentDetections = hasUploadedImage ? uploadedDetections : detections
    const totalSamples = mode.getTotalSamples()
    const labelsApplied = mode.project?.classes.length || 0

    const ALL_SUPPORTED_OBJECTS = [
        'person', 'car', 'cat', 'dog', 'chair', 'bottle', 'laptop', 'cell phone',
        'book', 'keyboard', 'cup', 'pizza', 'bed', 'tv', 'clock', 'vase'
    ]

    const templateClasses = mode.project?.classes?.map(c => c.name.toLowerCase()) || []
    const hasTemplate = templateClasses.length > 0 && templateClasses.length <= 10
    const SUPPORTED_OBJECTS = hasTemplate
        ? ALL_SUPPORTED_OBJECTS.filter(obj => templateClasses.includes(obj))
        : ALL_SUPPORTED_OBJECTS

    return (
        mode.mode === 'train' ? (
            <TrainPanel mode={mode} />
        ) : mode.mode === 'annotate' ? (
            <AnnotatePanel mode={mode} />
        ) : (
        <div className="flex-1 flex flex-col p-5 overflow-y-auto neura-scrollbar bg-slate-50/50">
            {/* ── Mode Header with Workflow Indicator ── */}
            <div className="text-center mb-4 animate-[fade-in_0.3s_ease-out]">
                <h2 className="text-[28px] font-extrabold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {mode.mode === 'collect' ? 'Detect Objects' : 'Test Your Detector'}
                </h2>
                <p className="text-sm text-slate-400 font-medium">
                    {mode.mode === 'collect'
                        ? 'Point your camera at things — AI will find and name them automatically!'
                        : 'Try different objects and see what the AI can find!'}
                </p>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded bg-violet-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">Pictures</span>
                    </div>
                    <p className="text-lg font-bold text-slate-700">{totalSamples}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                                <line x1="7" y1="7" x2="7.01" y2="7" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">Types</span>
                    </div>
                    <p className="text-lg font-bold text-slate-700">{labelsApplied}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">Objects</span>
                    </div>
                    <p className="text-lg font-bold text-slate-700">{currentDetections.length}</p>
                </div>
            </div>

            {/* ── Camera Error State ── */}
            {cameraError && !cameraOn && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-200 text-center mb-4 animate-[scale-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Camera Access Needed</h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-sm mx-auto">{cameraError}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={startCamera}
                            className="px-5 py-2.5 bg-violet-500 text-white rounded-xl font-bold text-sm hover:bg-violet-600 hover:shadow-lg transition-all"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => { setCameraError(null); fileInputRef.current?.click() }}
                            className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                        >
                            Use Upload Only
                        </button>
                    </div>
                </div>
            )}

            {/* ── Main Content ── */}
            <div className="flex gap-4 mb-4">
                {/* Camera Preview / Uploaded Image */}
                <div className="flex-1">
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm" style={{ aspectRatio: '4/3' }}>
                        {isLoadingModel && (
                            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded-xl">
                                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
                                <p className="text-slate-600 text-xs font-semibold">Loading model...</p>
                            </div>
                        )}

                        {/* Camera view */}
                        {!hasUploadedImage && (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover rounded-xl"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            </>
                        )}

                        {/* Uploaded image view */}
                        {hasUploadedImage && (
                            <>
                                <img
                                    src={showOriginal ? uploadedImage.originalUrl : (uploadedImage.annotatedUrl || uploadedImage.originalUrl)}
                                    alt="Uploaded for detection"
                                    className="w-full h-full object-contain rounded-xl"
                                />
                                {uploadedImage.annotatedUrl && (
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                                        <button
                                            onClick={() => setShowOriginal(true)}
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${showOriginal ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                                        >
                                            Original
                                        </button>
                                        <button
                                            onClick={() => setShowOriginal(false)}
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${!showOriginal ? 'bg-violet-500 text-white' : 'text-white/60 hover:text-white'}`}
                                        >
                                            Detections
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Status badges */}
                        {!hasUploadedImage && cameraOn && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm rounded-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span className="text-white text-[9px] font-bold">DETECTING</span>
                            </div>
                        )}
                        {hasUploadedImage && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-violet-500/90 backdrop-blur-sm rounded-md">
                                <span className="text-white text-[9px] font-bold">UPLOADED</span>
                            </div>
                        )}

                        {/* Detection count */}
                        {currentDetections.length > 0 && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-md">
                                <span className="text-white text-[9px] font-bold">{currentDetections.length} found</span>
                            </div>
                        )}

                        {/* Camera off placeholder */}
                        {!hasUploadedImage && !cameraOn && !isLoadingModel && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center mb-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 text-xs font-medium mb-2">Camera is off</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={toggleCamera}
                                        disabled={isLoadingModel || hasUploadedImage}
                                        className="px-4 py-1.5 bg-violet-500 text-white rounded-lg text-xs font-semibold hover:bg-violet-600 active:scale-95 transition-all disabled:opacity-40"
                                    >
                                        Start Camera
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoadingModel}
                                        className="px-4 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40"
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detection Results */}
                {currentDetections.length > 0 && (
                    <div className="w-64 bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-slate-700">Detected</h3>
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                {currentDetections.length}
                            </span>
                        </div>
                        <div className="space-y-1 max-h-56 overflow-y-auto neura-scrollbar">
                            {currentDetections.map((det, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group">
                                    <div
                                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${getColorForObject(det.class)}20` }}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorForObject(det.class) }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-slate-700 capitalize truncate">{det.class}</p>
                                    </div>
                                    <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                                        style={{ backgroundColor: getColorForObject(det.class) }}
                                    >
                                        {Math.round(det.score * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Control Buttons ── */}
            <div className="flex gap-2 flex-wrap">
                {/* Camera toggle */}
                <button
                    onClick={toggleCamera}
                    disabled={isLoadingModel || hasUploadedImage}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        cameraOn
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                    {cameraOn ? 'Stop Camera' : 'Start Camera'}
                </button>

                {/* Real-time toggle */}
                {cameraOn && !hasUploadedImage && (
                    <button
                        onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            realtimeEnabled
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                        {realtimeEnabled ? 'Auto Detect' : 'Manual'}
                    </button>
                )}

                {/* Manual detect */}
                {cameraOn && !hasUploadedImage && !realtimeEnabled && (
                    <button
                        onClick={handleManualDetect}
                        disabled={!model || isDetecting}
                        className="px-4 py-2 bg-violet-500 text-white rounded-lg text-xs font-semibold hover:bg-violet-600 active:scale-95 transition-all disabled:opacity-40"
                    >
                        {isDetecting ? 'Detecting...' : 'Detect Now'}
                    </button>
                )}

                {/* Capture sample */}
                {cameraOn && !hasUploadedImage && mode.selectedClassId && (
                    <button
                        onClick={handleCapture}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 active:scale-95 transition-all"
                    >
                        Capture
                    </button>
                )}

                {/* Upload to detect */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoadingModel}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        !isLoadingModel
                            ? 'bg-violet-500 text-white hover:bg-violet-600'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    Upload Image
                </button>

                {/* Reset uploaded image */}
                {hasUploadedImage && (
                    <button
                        onClick={handleResetUpload}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all"
                    >
                        Back to Camera
                    </button>
                )}
            </div>

            {/* ── Supported Objects Hint ── */}
            {!hasUploadedImage && !cameraOn && !isLoadingModel && (
                <div className="mt-3 bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap gap-1">
                        {SUPPORTED_OBJECTS.map(obj => (
                            <span key={obj} className={`text-[10px] font-medium px-2 py-0.5 rounded-md capitalize ${
                                hasTemplate
                                    ? 'bg-teal-50 text-teal-600 border border-teal-200'
                                    : 'bg-slate-100 text-slate-500'
                            }`}>
                                {obj}
                            </span>
                        ))}
                        {!hasTemplate && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-400">+64 more</span>
                        )}
                    </div>
                </div>
            )}
        </div>
        )
    )
}
