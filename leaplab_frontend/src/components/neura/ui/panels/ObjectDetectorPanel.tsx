import React, { useRef, useState, useEffect, useCallback } from 'react'
import { IgniteTopbar } from '../../../../Electra/Client/Src/components/Layout/Topbar'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ObjectDetector, DetectionResult } from '../../ml/classifiers/ObjectDetector'

interface ObjectDetectorPanelProps {
    mode: UseNeuraProjectReturn
    onBack?: () => void
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

export default function ObjectDetectorPanel({ mode, onBack }: ObjectDetectorPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const detectorRef = useRef(new ObjectDetector())
    const animFrameRef = useRef<number>(0)
    const projectName = mode.project?.name || 'Object Detector'

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleSave = React.useCallback(() => {}, [])
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handleTitleChange = React.useCallback(() => {}, [])
    const handleBack = React.useCallback(() => onBack?.(), [onBack])

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

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <IgniteTopbar
                title={projectName}
                onBack={handleBack}
                onSave={handleSave}
                onTitleChange={handleTitleChange}
                brandName="NEURA"
                rightContent={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl">
                            <span className="text-xs font-medium text-white/70">Auto</span>
                            <button
                                onClick={() => setAutoDetect(!autoDetect)}
                                className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                                    autoDetect ? 'bg-emerald-500' : 'bg-white/30'
                                }`}
                            >
                                <div
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                                        autoDetect ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        <button
                            onClick={runDetection}
                            disabled={isDetecting || isLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-200 ${
                                isDetecting || isLoading
                                    ? 'bg-white/20 text-white/50 cursor-not-allowed'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 active:scale-95 shadow-md'
                            }`}
                        >
                            {isDetecting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    Detect
                                </>
                            )}
                        </button>
                    </div>
                }
            />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Camera Feed */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900" style={{ maxWidth: 640 }}>
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                                <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-white/70 text-sm font-medium">Loading AI model...</p>
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
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-xl">
                            <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="text-white text-xs font-bold">
                                {detectionResult?.objects.length || 0} objects
                            </span>
                        </div>
                    </div>
                </div>

                {/* Detection Panel */}
                <div className="w-80 bg-white border-l border-gray-100 flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Detected Objects</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {detectionCount > 0 ? `Scanned ${detectionCount} times` : 'Start detecting to see results'}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {sortedLabels.length > 0 ? (
                            sortedLabels.map(([label, objects]) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                                        style={{ backgroundColor: detectorRef.current.getColorForObject(label) }}
                                    >
                                        {objects.length}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-700 capitalize">{label}</p>
                                        <p className="text-xs text-gray-400">
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
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <p className="text-sm font-medium">No objects detected</p>
                                <p className="text-xs mt-1">Point camera at objects</p>
                            </div>
                        )}
                    </div>

                    {/* All COCO-SSD Classes */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Can Detect</p>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {CCO_LABELS.map((label) => {
                                const isActive = groupedObjects[label]
                                return (
                                    <span
                                        key={label}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition-colors ${
                                            isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}
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
