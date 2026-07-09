import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ensureCocoSsd } from '../../ml/loadScript'

interface ObjectDetectorPanelProps {
    mode: UseNeuraProjectReturn
}

interface Detection {
    class: string
    score: number
    bbox: [number, number, number, number]
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
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [uploadedDetections, setUploadedDetections] = useState<Detection[]>([])
    const [realtimeEnabled, setRealtimeEnabled] = useState(true)

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

        dets.forEach((det, i) => {
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

        setUploadedImage(dataUrl)
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

                // Draw on a canvas overlay
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth
                canvas.height = img.naturalHeight
                const ctx = canvas.getContext('2d')!

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

                // Store the drawn canvas as the displayed image
                setUploadedImage(canvas.toDataURL('image/png'))
            } catch (err) {
                console.error('[ObjectDetector] Upload detection failed:', err)
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ── Reset uploaded image ──
    const handleResetUpload = () => {
        setUploadedImage(null)
        setUploadedDetections([])
    }

    const selectedClass = mode.getSelectedClass()
    const hasUploadedImage = !!uploadedImage

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 overflow-y-auto">
            {/* ── Camera feed / Uploaded image ── */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 w-full max-w-[520px]" style={{ aspectRatio: '4/3' }}>
                {isLoadingModel && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-orange-900 flex flex-col items-center justify-center z-10 rounded-3xl">
                        <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-amber-200 text-sm font-bold">Loading AI model...</p>
                        <p className="text-amber-400/60 text-xs mt-1">COCO-SSD (80 object classes)</p>
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
                            className="w-full h-full object-cover rounded-3xl"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </>
                )}

                {/* Uploaded image view */}
                {hasUploadedImage && (
                    <img
                        src={uploadedImage}
                        alt="Uploaded for detection"
                        className="w-full h-full object-cover rounded-3xl"
                    />
                )}

                {/* Status badges */}
                {!hasUploadedImage && cameraOn && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-xs font-bold tracking-wide">DETECTING</span>
                    </div>
                )}
                {!hasUploadedImage && !cameraOn && !isLoadingModel && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-gray-600/80 backdrop-blur-md rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-white text-xs font-bold tracking-wide">CAM OFF</span>
                    </div>
                )}
                {hasUploadedImage && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-blue-500/80 backdrop-blur-md rounded-xl">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span className="text-white text-xs font-bold tracking-wide">UPLOADED</span>
                    </div>
                )}

                {/* Detection count badge */}
                {!hasUploadedImage && detections.length > 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                        <span className="text-white text-xs font-bold">{detections.length} objects</span>
                    </div>
                )}
                {hasUploadedImage && uploadedDetections.length > 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                        <span className="text-white text-xs font-bold">{uploadedDetections.length} objects</span>
                    </div>
                )}

                {/* Camera off placeholder */}
                {!hasUploadedImage && !cameraOn && !isLoadingModel && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gray-700/50 flex items-center justify-center mb-4">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-sm font-semibold">Turn on camera to start detecting</p>
                    </div>
                )}
            </div>

            {/* ── Control buttons ── */}
            <div className="flex gap-3 flex-wrap justify-center">
                {/* Camera toggle */}
                <button
                    onClick={toggleCamera}
                    disabled={isLoadingModel || hasUploadedImage}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        cameraOn
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${isLoadingModel || hasUploadedImage ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                    {cameraOn ? 'Camera On' : 'Camera Off'}
                </button>

                {/* Real-time toggle */}
                {cameraOn && !hasUploadedImage && (
                    <button
                        onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                            realtimeEnabled
                                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {realtimeEnabled ? 'Auto Detect ON' : 'Auto Detect OFF'}
                    </button>
                )}

                {/* Manual detect */}
                {cameraOn && !hasUploadedImage && !realtimeEnabled && (
                    <button
                        onClick={handleManualDetect}
                        disabled={!model || isDetecting}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-200 hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isDetecting ? 'Detecting...' : 'Detect Now'}
                    </button>
                )}

                {/* Capture sample */}
                {cameraOn && !hasUploadedImage && mode.selectedClassId && (
                    <button
                        onClick={handleCapture}
                        className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
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
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        !isLoadingModel
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md'
                            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                >
                    Upload to Detect
                </button>

                {/* Reset uploaded image */}
                {hasUploadedImage && (
                    <button
                        onClick={handleResetUpload}
                        className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all duration-200"
                    >
                        Back to Camera
                    </button>
                )}
            </div>

            {/* ── Detection results ── */}
            {((!hasUploadedImage && detections.length > 0) || (hasUploadedImage && uploadedDetections.length > 0)) && (
                <div className="w-full max-w-[520px] bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700">Detection Results</h3>
                        <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-lg">
                            {(hasUploadedImage ? uploadedDetections : detections).length} objects
                        </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(hasUploadedImage ? uploadedDetections : detections).map((det, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: `linear-gradient(135deg, ${getColorForObject(det.class)}40, ${getColorForObject(det.class)}80)` }}
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorForObject(det.class) }} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-700 capitalize">{det.class}</p>
                                    <p className="text-[10px] text-gray-400">
                                        bbox: [{det.bbox.map(v => Math.round(v)).join(', ')}]
                                    </p>
                                </div>
                                <span
                                    className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                                    style={{ backgroundColor: getColorForObject(det.class) }}
                                >
                                    {Math.round(det.score * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Supported objects hint ── */}
            {!hasUploadedImage && !cameraOn && !isLoadingModel && (
                <div className="w-full max-w-[520px] bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 mb-2">80 Supported Objects</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {['person', 'car', 'cat', 'dog', 'chair', 'bottle', 'laptop', 'phone', 'book', 'keyboard', 'cup', 'pizza', 'bed', 'tv', 'clock', 'vase'].map(obj => (
                            <span key={obj} className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-500 capitalize">
                                {obj}
                            </span>
                        ))}
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-50 text-gray-300">+64 more</span>
                    </div>
                </div>
            )}
        </div>
    )
}
