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

export default function ObjectDetectorPanel({ mode }: ObjectDetectorPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDetecting, setIsDetecting] = useState(false)
    const [detections, setDetections] = useState<Detection[]>([])
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [model, setModel] = useState<any>(null)
    const [isLoadingModel, setIsLoadingModel] = useState(false)

    useEffect(() => {
        const load = async () => {
            setIsLoadingModel(true)
            try {
                const m = await ensureCocoSsd()
                setModel(m)
            } catch (err) {
                console.error('Failed to load COCO-SSD:', err)
            }
            setIsLoadingModel(false)
        }
        load()
    }, [])

    const startCamera = useCallback(async () => {
        try {
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
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop())
            setStream(null)
        }
    }, [stream])

    useEffect(() => {
        if (mode.mode === 'collect' || mode.mode === 'test') {
            startCamera()
        } else {
            stopCamera()
        }
    }, [mode.mode])

    const detect = async () => {
        if (!videoRef.current || !canvasRef.current || !model) return
        setIsDetecting(true)

        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        try {
            const results = await model.detect(video)
            setDetections(results)

            const ctx = canvas.getContext('2d')!
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(video, 0, 0)

            const colors = ['#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#06B6D4', '#84CC16']
            results.forEach((det: Detection, i: number) => {
                const [x, y, w, h] = det.bbox
                const color = colors[i % colors.length]

                ctx.strokeStyle = color
                ctx.lineWidth = 3
                ctx.strokeRect(x, y, w, h)

                const label = `${det.class} ${Math.round(det.score * 100)}%`
                ctx.font = 'bold 14px sans-serif'
                const textWidth = ctx.measureText(label).width
                ctx.fillStyle = color
                ctx.roundRect(x, y - 28, textWidth + 16, 24, 6)
                ctx.fill()
                ctx.fillStyle = '#fff'
                ctx.fillText(label, x + 8, y - 10)
            })
        } catch (err) {
            console.error('Detection failed:', err)
        }
        setIsDetecting(false)
    }

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !mode.selectedClassId) return

        const video = videoRef.current
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = video.videoWidth
        tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)
        const imageData = tempCanvas.toDataURL('image/png')

        mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })
    }

    const selectedClass = mode.getSelectedClass()

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            {/* Camera feed */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 w-full max-w-[520px]" style={{ aspectRatio: '4/3' }}>
                {isLoadingModel && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-orange-900 flex flex-col items-center justify-center z-10 rounded-3xl">
                        <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-amber-200 text-sm font-bold">Loading AI model...</p>
                    </div>
                )}
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
                    className="absolute inset-0 w-full h-full rounded-3xl"
                    style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/80 backdrop-blur-md rounded-xl">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-white text-xs font-bold tracking-wide">DETECT</span>
                </div>
                {detections.length > 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                        <span className="text-white text-xs font-bold">{detections.length} objects</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
                <button
                    onClick={detect}
                    disabled={!model || isDetecting}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isDetecting ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Detecting...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            Detect Objects
                        </span>
                    )}
                </button>
                <button
                    onClick={handleCapture}
                    disabled={!mode.selectedClassId}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        Capture
                    </span>
                </button>
            </div>

            {/* Detection results */}
            {detections.length > 0 && (
                <div className="w-full max-w-[520px] bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700">Detection Results</h3>
                        <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-lg">
                            {detections.length} objects
                        </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detections.map((det, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-700 capitalize">{det.class}</p>
                                </div>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                    {Math.round(det.score * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
