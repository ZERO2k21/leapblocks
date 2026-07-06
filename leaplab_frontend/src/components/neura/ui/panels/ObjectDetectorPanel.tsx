import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ObjectDetector, DetectionResult } from '../../ml/classifiers/ObjectDetector'

interface ObjectDetectorPanelProps {
    mode: UseNeuraProjectReturn
}

const CCO_LABELS = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train',
    'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep',
    'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard',
    'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
    'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork',
    'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
    'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv',
    'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave',
    'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
    'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

export default function ObjectDetectorPanel({ mode }: ObjectDetectorPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const detectorRef = useRef(new ObjectDetector())
    const animFrameRef = useRef<number>(0)
    const projectName = mode.project?.name || 'Object Detector'

    const [isLoading, setIsLoading] = useState(true)
    const [isDetecting, setIsDetecting] = useState(false)
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [autoDetect, setAutoDetect] = useState(true)
    const [detectionCount, setDetectionCount] = useState(0)

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
        const init = async () => {
            setIsLoading(true)
            try {
                await detectorRef.current.loadModel()
            } catch (err) {
                console.error('Failed to load model:', err)
            }
            setIsLoading(false)
            await startCamera()
        }
        init()

        return () => {
            stopCamera()
            detectorRef.current.dispose()
            cancelAnimationFrame(animFrameRef.current)
        }
    }, [])

    const runDetection = useCallback(async () => {
        if (!videoRef.current || !overlayRef.current || isDetecting) return

        setIsDetecting(true)
        try {
            const result = await detectorRef.current.detect(videoRef.current)
            setDetectionResult(result)
            setDetectionCount(prev => prev + 1)

            if (videoRef.current && overlayRef.current) {
                detectorRef.current.drawDetections(
                    overlayRef.current,
                    result,
                    videoRef.current.videoWidth,
                    videoRef.current.videoHeight
                )
            }
        } catch (err) {
            console.error('Detection failed:', err)
        }
        setIsDetecting(false)
    }, [isDetecting])

    useEffect(() => {
        if (!autoDetect || !stream || isLoading) return

        let active = true
        const detectLoop = async () => {
            if (!active) return
            await runDetection()
            if (active) {
                animFrameRef.current = requestAnimationFrame(detectLoop)
            }
        }

        const timeout = setTimeout(() => {
            detectLoop()
        }, 500)

        return () => {
            active = false
            clearTimeout(timeout)
            cancelAnimationFrame(animFrameRef.current)
        }
    }, [autoDetect, stream, isLoading, runDetection])

    const groupedObjects = detectionResult
        ? detectorRef.current.getObjectsByLabel(detectionResult)
        : {}

    const sortedLabels = Object.entries(groupedObjects)
        .sort(([, a], [, b]) => b.length - a.length)

    const glassStyle = {
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
    }

    return (
        <div className="h-full flex flex-col" style={{
            background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0f4ff 100%)'
        }}>
            {/* Object Detector Toolbar */}
            <div className="flex items-center justify-between px-5 py-3" style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
            }}>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">{projectName}</span>
                    <span className="text-xs text-gray-400">—</span>
                    <span className="text-xs text-gray-400 font-medium">{detectionCount > 0 ? `Scanned ${detectionCount} times` : 'Object Detection'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.15)'
                    }}>
                        <span className="text-xs font-bold text-gray-600">Auto</span>
                        <button
                            onClick={() => setAutoDetect(!autoDetect)}
                            className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${
                                autoDetect ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                        >
                            <div
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                    autoDetect ? 'translate-x-5' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                    <button
                        onClick={runDetection}
                        disabled={isDetecting || isLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${
                            isDetecting || isLoading
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'hover:scale-105 active:scale-95 cursor-pointer'
                        }`}
                        style={!isDetecting && !isLoading ? {
                            background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                            color: 'white',
                            boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                        } : {}}
                    >
                        {isDetecting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                Detect
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Camera Feed */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="relative rounded-3xl overflow-hidden" style={{
                        maxWidth: 640,
                        background: 'rgba(15,15,35,0.85)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(16,185,129,0.1)'
                    }}>
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{
                                background: 'rgba(15,15,35,0.95)'
                            }}>
                                <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-white/70 text-sm font-bold">Loading AI model...</p>
                                <p className="text-white/40 text-xs mt-1">This may take a moment</p>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full rounded-3xl"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        <canvas
                            ref={overlayRef}
                            width={640}
                            height={480}
                            className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Detection counter badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="text-white text-xs font-bold">
                                {detectionResult?.objects.length || 0} objects
                            </span>
                        </div>

                        {/* Glass corner accents */}
                        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-white/30 rounded-tl-lg" />
                        <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-white/30 rounded-tr-lg" />
                        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-white/30 rounded-bl-lg" />
                        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-white/30 rounded-br-lg" />
                    </div>
                </div>

                {/* Detection Panel */}
                <div className="w-80 flex flex-col" style={{
                    background: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(24px)',
                    borderLeft: '1px solid rgba(255,255,255,0.6)'
                }}>
                    <div className="px-5 py-4" style={{
                        borderBottom: '1px solid rgba(16,185,129,0.1)'
                    }}>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Detected Objects</h3>
                        <div className="w-8 h-0.5 mt-1 rounded-full" style={{
                            background: 'linear-gradient(90deg, #10B981, #14B8A6)'
                        }} />
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                            {detectionCount > 0 ? `Scanned ${detectionCount} times` : 'Start detecting to see results'}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {sortedLabels.length > 0 ? (
                            sortedLabels.map(([label, objects]) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                                    style={{
                                        background: 'rgba(255,255,255,0.5)',
                                        border: '1px solid rgba(255,255,255,0.5)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                        style={{
                                            background: `linear-gradient(135deg, ${detectorRef.current.getColorForObject(label)}DD, ${detectorRef.current.getColorForObject(label)})`,
                                            boxShadow: `0 4px 12px ${detectorRef.current.getColorForObject(label)}30`
                                        }}
                                    >
                                        {objects.length}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-700 capitalize">{label}</p>
                                        <p className="text-xs text-gray-400 font-medium">
                                            {Math.round(objects[0].confidence * 100)}% confidence
                                        </p>
                                    </div>
                                    <div className="flex -space-x-1">
                                        {objects.slice(0, 3).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-3 h-3 rounded-full border-2 border-white"
                                                style={{ backgroundColor: detectorRef.current.getColorForObject(label) }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center py-12 text-gray-300">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
                                    background: 'rgba(16,185,129,0.05)',
                                    border: '2px dashed rgba(16,185,129,0.15)'
                                }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-gray-400">No objects detected</p>
                                <p className="text-xs text-gray-300 mt-1">Point camera at objects</p>
                            </div>
                        )}
                    </div>

                    {/* All COCO-SSD Classes */}
                    <div className="px-4 py-3" style={{
                        borderTop: '1px solid rgba(16,185,129,0.1)',
                        background: 'rgba(16,185,129,0.03)'
                    }}>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Can Detect</p>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {CCO_LABELS.map((label) => {
                                const isActive = groupedObjects[label]
                                return (
                                    <span
                                        key={label}
                                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all duration-300"
                                        style={isActive ? {
                                            background: 'rgba(16,185,129,0.15)',
                                            color: '#059669',
                                            border: '1px solid rgba(16,185,129,0.3)'
                                        } : {
                                            background: 'rgba(0,0,0,0.03)',
                                            color: '#9CA3AF'
                                        }}
                                    >
                                        {label}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
