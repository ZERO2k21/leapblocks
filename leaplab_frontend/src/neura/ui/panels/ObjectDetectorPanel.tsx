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
    return OBJECT_COLORS[label.toLowerCase()] || DEFAULT_COLOR
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
    const [showOriginal, setShowOriginal] = useState(true)
    const [cameraError, setCameraError] = useState<string | null>(null)

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

    const startCamera = useCallback(async () => {
        try {
            setCameraError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
            if (videoRef.current) { videoRef.current.srcObject = mediaStream; await videoRef.current.play() }
            streamRef.current = mediaStream; setCameraOn(true)
        } catch (err) {
            console.error('[ObjectDetector] Camera access denied:', err)
            setCameraError('Camera access needed. Please allow camera access in your browser settings.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setCameraOn(false); setDetections([])
    }, [])

    const toggleCamera = useCallback(() => { if (cameraOn) { stopCamera() } else { startCamera() } }, [cameraOn, startCamera, stopCamera])

    useEffect(() => { return () => { stopCamera(); if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current) } }, [])

    const detectFrame = useCallback(async (): Promise<Detection[]> => {
        if (!model || !videoRef.current || !videoRef.current.srcObject) return []
        const video = videoRef.current
        if (video.readyState < 2) return []
        try {
            const results = await model.detect(video)
            return results.map((r: any) => ({ class: r.class, score: r.score, bbox: r.bbox as [number, number, number, number] }))
        } catch { return [] }
    }, [model])

    const drawDetections = useCallback((dets: Detection[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        dets.forEach((det) => {
            const [x, y, w, h] = det.bbox; const color = getColorForObject(det.class)
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 8
            ctx.strokeRect(x, y, w, h); ctx.shadowBlur = 0
            const label = `${det.class} ${Math.round(det.score * 100)}%`
            ctx.font = 'bold 14px system-ui, sans-serif'
            const textWidth = ctx.measureText(label).width
            const labelY = Math.max(y - 8, 22)
            ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, labelY - 20, textWidth + 16, 22, 6); ctx.fill()
            ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 8, labelY - 9)
        })
    }, [])

    useEffect(() => {
        if (!cameraOn || !realtimeEnabled || !model) {
            if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null }
            return
        }
        const loop = async () => {
            const dets = await detectFrame(); setDetections(dets)
            if (canvasRef.current && videoRef.current) drawDetections(dets, canvasRef.current, videoRef.current)
        }
        loop()
        detectionIntervalRef.current = setInterval(loop, 500)
        return () => { if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null } }
    }, [cameraOn, realtimeEnabled, model, detectFrame, drawDetections])

    const handleManualDetect = async () => {
        if (!model || !videoRef.current || !canvasRef.current) return
        setIsDetecting(true); const dets = await detectFrame(); setDetections(dets)
        if (canvasRef.current && videoRef.current) drawDetections(dets, canvasRef.current, videoRef.current)
        setIsDetecting(false)
    }

    const handleCapture = async () => {
        if (!videoRef.current || !mode.selectedClassId || !cameraOn) return
        const video = videoRef.current; const tempCanvas = document.createElement('canvas')
        tempCanvas.width = video.videoWidth; tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext('2d')!; ctx.drawImage(video, 0, 0)
        mode.addSample(mode.selectedClassId, { type: 'image', data: tempCanvas.toDataURL('image/png') })
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        if (!model) { alert('Model is still loading. Please wait.'); return }
        const dataUrl = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file) })
        setCameraOn(false); stopCamera()
        const img = new Image(); img.src = dataUrl
        await new Promise<void>((resolve) => { img.onload = () => resolve(); setTimeout(() => resolve(), 3000) })
        if (img.complete && img.naturalWidth > 0) {
            try {
                const results = await model.detect(img)
                const dets: Detection[] = results.map((r: any) => ({ class: r.class, score: r.score, bbox: r.bbox as [number, number, number, number] }))
                setUploadedDetections(dets)
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
                const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0)
                dets.forEach((det) => {
                    const [x, y, w, h] = det.bbox; const color = getColorForObject(det.class)
                    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 8
                    ctx.strokeRect(x, y, w, h); ctx.shadowBlur = 0
                    const label = `${det.class} ${Math.round(det.score * 100)}%`
                    ctx.font = 'bold 14px system-ui, sans-serif'
                    const textWidth = ctx.measureText(label).width
                    const labelY = Math.max(y - 8, 22)
                    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, labelY - 20, textWidth + 16, 22, 6); ctx.fill()
                    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 8, labelY - 9)
                })
                setUploadedImage({ originalUrl: dataUrl, annotatedUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight })
            } catch (err) {
                console.error('[ObjectDetector] Upload detection failed:', err)
                setUploadedImage({ originalUrl: dataUrl, annotatedUrl: null, width: img.naturalWidth, height: img.naturalHeight })
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleResetUpload = () => { setUploadedImage(null); setUploadedDetections([]); setShowOriginal(true); startCamera() }

    const selectedClass = mode.getSelectedClass()
    const hasUploadedImage = !!uploadedImage
    const currentDetections = hasUploadedImage ? uploadedDetections : detections
    const totalSamples = mode.getTotalSamples()
    const labelsApplied = mode.project?.classes.length || 0

    return (
        mode.mode === 'train' ? (
            <TrainPanel mode={mode} />
        ) : mode.mode === 'annotate' ? (
            <AnnotatePanel mode={mode} />
        ) : (
            <div className="flex-1 flex flex-col p-5 overflow-y-auto neura-scrollbar bg-[#faf8ff]">
                <div className="text-center mb-4 animate-fade-in">
                    <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">
                        {mode.mode === 'collect' ? '🔍 Object Finder!' : '🧪 Test Your Finder!'}
                    </h2>
                    <p className="text-sm text-[#4a4455] font-medium">
                        {mode.mode === 'collect' ? 'Point your camera at things — AI will find and name them! 🎯' : 'Try different objects and see what AI can find! 🕵️'}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-[#dae2fd] shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">🖼️</span>
                            <span className="text-[10px] font-medium text-[#4a4455]">Pictures</span>
                        </div>
                        <p className="text-lg font-bold text-[#131b2e]">{totalSamples}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-[#dae2fd] shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">🏷️</span>
                            <span className="text-[10px] font-medium text-[#4a4455]">Labels</span>
                        </div>
                        <p className="text-lg font-bold text-[#131b2e]">{labelsApplied}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-[#dae2fd] shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">🎯</span>
                            <span className="text-[10px] font-medium text-[#4a4455]">Found</span>
                        </div>
                        <p className="text-lg font-bold text-[#131b2e]">{currentDetections.length}</p>
                    </div>
                </div>

                {cameraError && !cameraOn && (
                    <div className="bg-white rounded-3xl p-6 shadow-md border border-[#fecaca] text-center mb-4 animate-scale-in">
                        <span className="text-4xl mb-3 block">🚫</span>
                        <h3 className="text-base font-bold text-[#131b2e] mb-1">Camera Access Needed 📷</h3>
                        <p className="text-sm text-[#4a4455] mb-4 max-w-sm mx-auto">{cameraError}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={startCamera} className="px-5 py-2.5 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">Try Again 🔄</button>
                            <button onClick={() => { setCameraError(null); fileInputRef.current?.click() }} className="px-5 py-2.5 bg-[#eaedff] text-[#131b2e] rounded-xl font-bold text-sm hover:bg-[#dae2fd] transition-all">Upload 📂</button>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <div className="relative rounded-2xl overflow-hidden bg-[#eaedff] border border-[#dae2fd] shadow-sm aspect-[4/3]">
                            {isLoadingModel && (
                                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded-2xl">
                                    <div className="w-8 h-8 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin mb-2" />
                                    <p className="text-[#4a4455] text-xs font-bold">Loading AI model... 🧠</p>
                                </div>
                            )}

                            {!hasUploadedImage && (
                                <>
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl -scale-x-100" />
                                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none -scale-x-100" />
                                </>
                            )}

                            {hasUploadedImage && (
                                <>
                                    <img src={showOriginal ? uploadedImage.originalUrl : (uploadedImage.annotatedUrl || uploadedImage.originalUrl)} alt="Uploaded" className="w-full h-full object-contain rounded-2xl" />
                                    {uploadedImage.annotatedUrl && (
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                                            <button onClick={() => setShowOriginal(true)} className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${showOriginal ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}>Original</button>
                                            <button onClick={() => setShowOriginal(false)} className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${!showOriginal ? 'bg-[#630ed4] text-white' : 'text-white/60 hover:text-white'}`}>Detections</button>
                                        </div>
                                    )}
                                </>
                            )}

                            {!hasUploadedImage && cameraOn && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-[#006c44]/90 backdrop-blur-sm rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-white text-[9px] font-bold">🔍 SCANNING</span>
                                </div>
                            )}
                            {hasUploadedImage && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-[#630ed4]/90 backdrop-blur-sm rounded-lg">
                                    <span className="text-white text-[9px] font-bold">📂 UPLOADED</span>
                                </div>
                            )}
                            {currentDetections.length > 0 && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-lg">
                                    <span className="text-white text-[9px] font-bold">🎯 {currentDetections.length} found</span>
                                </div>
                            )}

                            {!hasUploadedImage && !cameraOn && !isLoadingModel && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl mb-2">🔍</span>
                                    <p className="text-[#4a4455] text-xs font-bold mb-3">Camera is off</p>
                                    <div className="flex gap-2">
                                        <button onClick={toggleCamera} disabled={isLoadingModel} className="px-4 py-1.5 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md active:scale-95 transition-all disabled:opacity-40">
                                            📷 Start Camera
                                        </button>
                                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingModel} className="px-4 py-1.5 bg-white text-[#131b2e] border border-[#dae2fd] rounded-xl text-xs font-bold hover:bg-[#f2f3ff] active:scale-95 transition-all disabled:opacity-40">
                                            📂 Upload
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {currentDetections.length > 0 && (
                        <div className="w-64 bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-[#dae2fd] shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-[#131b2e]">🎯 Detected</h3>
                                <span className="text-[10px] text-[#4a4455] font-bold bg-[#eaedff] px-1.5 py-0.5 rounded">
                                    {currentDetections.length}
                                </span>
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto neura-scrollbar">
                                {currentDetections.map((det, i) => (
                                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f2f3ff] transition-colors">
                                        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${getColorForObject(det.class)}20` }}>
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorForObject(det.class) }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-[#131b2e] capitalize truncate">{det.class}</p>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ backgroundColor: getColorForObject(det.class) }}>
                                            {Math.round(det.score * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button onClick={toggleCamera} disabled={isLoadingModel || hasUploadedImage} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${cameraOn ? 'bg-[#d1fae5] text-[#006c44]' : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'} disabled:opacity-40 disabled:cursor-not-allowed`}>
                        {cameraOn ? '📷 Stop' : '📷 Start'}
                    </button>
                    {cameraOn && !hasUploadedImage && (
                        <button onClick={() => setRealtimeEnabled(!realtimeEnabled)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${realtimeEnabled ? 'bg-[#d1fae5] text-[#006c44] border border-[#006c44]/30' : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'}`}>
                            {realtimeEnabled ? '⚡ Auto' : '✋ Manual'}
                        </button>
                    )}
                    {cameraOn && !hasUploadedImage && !realtimeEnabled && (
                        <button onClick={handleManualDetect} disabled={!model || isDetecting} className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md active:scale-95 transition-all disabled:opacity-40">
                            {isDetecting ? '⏳ Scanning...' : '🔍 Scan Now'}
                        </button>
                    )}
                    {cameraOn && !hasUploadedImage && mode.selectedClassId && (
                        <button onClick={handleCapture} className="px-4 py-2 bg-[#006c44] text-white rounded-xl text-xs font-bold hover:shadow-md active:scale-95 transition-all">
                            📸 Capture
                        </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingModel} className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        📂 Upload Image
                    </button>
                    {hasUploadedImage && (
                        <button onClick={handleResetUpload} className="px-4 py-2 bg-[#eaedff] text-[#4a4455] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-all">
                            🔄 Back to Camera
                        </button>
                    )}
                </div>
            </div>
        )
    )
}
