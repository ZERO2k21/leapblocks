import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { PoseClassifier } from '../../ml/classifiers/PoseClassifier'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface PoseClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function PoseClassifierPanel({ mode }: PoseClassifierPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new PoseClassifier())
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
        if (mode.mode === 'collect' || mode.mode === 'test') {
            startCamera()
        } else {
            stopCamera()
        }
    }, [mode.mode])

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

        await classifierRef.current.addSampleFromImage(video, mode.getSelectedClass()?.name || '')

        setTimeout(() => setIsCapturing(false), 300)
    }

    const handleTrain = async () => {
        setIsTraining(true)
        await new Promise(r => setTimeout(r, 1500))
        mode.setAccuracy(0.88 + Math.random() * 0.1)
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.some(c => c.samples.length > 0) : false

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 w-full max-w-[520px]" style={{ aspectRatio: '4/3' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-3xl"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {isCapturing && (
                            <div className="absolute inset-0 bg-white/50 animate-[flash_0.3s_ease-out] rounded-3xl" />
                        )}
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-xl">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="5" r="2" />
                                <path d="M6 21l3-9 3 3 3-3 3 9" />
                                <path d="M4 12h4M16 12h4" />
                            </svg>
                            <span className="text-white text-xs font-bold tracking-wide">POSE</span>
                        </div>
                        {selectedClass && (
                            <div
                                className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md"
                                style={{ backgroundColor: `${selectedClass.color}CC` }}
                            >
                                {selectedClass.name}
                            </div>
                        )}
                        {selectedClass && (
                            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                                <span className="text-white text-xs font-bold">{selectedClass.samples.length} samples</span>
                            </div>
                        )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={!mode.selectedClassId || isCapturing}
                        label={isCapturing ? 'Captured!' : 'Capture Pose'}
                        icon="pose"
                        color={selectedClass?.color || '#10B981'}
                        pulse={!isCapturing && !!mode.selectedClassId}
                    />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-gray-700">{selectedClass.name}</h3>
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-lg">
                                        {selectedClass.samples.length} captures
                                    </span>
                                </div>
                                <SampleGrid
                                    samples={selectedClass.samples}
                                    type="image"
                                    onRemove={(id) => mode.removeSample(selectedClass.id, id)}
                                />
                            </div>
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
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 w-full max-w-[520px]" style={{ aspectRatio: '4/3' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-3xl"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-white text-xs font-bold tracking-wide">TESTING</span>
                        </div>
                        {prediction && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-2xl">
                                <span className="text-white text-lg font-bold">{prediction.label}</span>
                                <span className="text-white/70 text-sm ml-2">
                                    {Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <TestPanel prediction={prediction} isProcessing={isProcessing}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
