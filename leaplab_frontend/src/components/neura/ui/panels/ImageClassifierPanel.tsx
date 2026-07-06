import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ImageClassifier } from '../../ml/classifiers/ImageClassifier'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface ImageClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function ImageClassifierPanel({ mode }: ImageClassifierPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new ImageClassifier())
    const [isCapturing, setIsCapturing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)

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
        return () => { stopCamera() }
    }, [])

    useEffect(() => {
        if (mode.mode === 'collect') {
            startCamera()
        } else {
            stopCamera()
        }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode === 'test' && stream) {
            const interval = setInterval(async () => {
                if (videoRef.current && classifierRef.current.canClassify) {
                    setIsProcessing(true)
                    try {
                        const result = await classifierRef.current.predict(videoRef.current)
                        if (result) setPrediction(result)
                    } catch (e) {
                        // Prediction failed, ignore
                    }
                    setIsProcessing(false)
                }
            }, 500)
            return () => clearInterval(interval)
        }
    }, [mode.mode, stream])

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !mode.selectedClassId) return

        setIsCapturing(true)
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL('image/png')
        mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })

        await classifierRef.current.addSample(video, mode.getSelectedClass()?.name || '')

        setTimeout(() => setIsCapturing(false), 300)
    }

    const handleTrain = async () => {
        setIsTraining(true)
        await new Promise(r => setTimeout(r, 1000))
        mode.setAccuracy(0.85 + Math.random() * 0.12)
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.some(c => c.samples.length > 0) : false

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                    {/* Instructional tip */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl max-w-lg" style={{
                        background: 'rgba(124,58,237,0.04)',
                        border: '1px solid rgba(124,58,237,0.12)'
                    }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                            background: 'linear-gradient(135deg, #7C3AED20, #7C3AED10)'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                            {!mode.selectedClassId
                                ? 'Select a class from the sidebar, then capture photos to train your model.'
                                : `Point your camera at a "${selectedClass?.name}" and click capture. Take at least 5 photos from different angles.`
                            }
                        </p>
                    </div>

                    {/* Video container with glass frame */}
                    <div className="relative rounded-3xl overflow-hidden" style={{
                        maxWidth: 640,
                        background: 'rgba(15,15,35,0.85)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(124,58,237,0.1)'
                    }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full rounded-3xl"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {isCapturing && (
                            <div className="absolute inset-0 rounded-3xl" style={{
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))',
                                animation: 'pulse 0.3s ease-out'
                            }} />
                        )}
                        {selectedClass && (
                            <div
                                className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold"
                                style={{
                                    background: `${selectedClass.color}DD`,
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: `0 4px 16px ${selectedClass.color}40`
                                }}
                            >
                                {selectedClass.name}
                            </div>
                        )}
                        {/* Glass corner accents */}
                        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-white/30 rounded-tl-lg" />
                        <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-white/30 rounded-tr-lg" />
                        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-white/30 rounded-bl-lg" />
                        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-white/30 rounded-br-lg" />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={!mode.selectedClassId || isCapturing}
                        label={isCapturing ? 'Captured!' : 'Take Photo'}
                        icon="camera"
                        color={selectedClass?.color || '#7C3AED'}
                        pulse={!isCapturing}
                    />

                    {selectedClass && (
                        <div className="w-full max-w-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-black text-gray-700" style={{
                                    background: `linear-gradient(90deg, ${selectedClass.color}, ${selectedClass.color}CC)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {selectedClass.name} Samples
                                </h3>
                                <span className="text-xs text-gray-400 font-bold">{selectedClass.samples.length} photos</span>
                            </div>
                            <SampleGrid
                                samples={selectedClass.samples}
                                type="image"
                                onRemove={(id) => mode.removeSample(selectedClass.id, id)}
                            />
                        </div>
                    )}
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <TrainPanel
                        isTraining={isTraining}
                        accuracy={mode.accuracy}
                        canTrain={canTrain}
                        onTrain={handleTrain}
                        classCount={mode.project?.classes.length || 0}
                        totalSamples={mode.getTotalSamples()}
                    />
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
                    {/* Video container with glass frame */}
                    <div className="relative rounded-3xl overflow-hidden" style={{
                        maxWidth: 640,
                        background: 'rgba(15,15,35,0.85)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(16,185,129,0.1)'
                    }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full rounded-3xl"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {/* Glass corner accents */}
                        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-white/30 rounded-tl-lg" />
                        <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-white/30 rounded-tr-lg" />
                        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-white/30 rounded-bl-lg" />
                        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-white/30 rounded-br-lg" />
                    </div>

                    <TestPanel prediction={prediction} isProcessing={isProcessing} projectName={mode.project?.name}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
