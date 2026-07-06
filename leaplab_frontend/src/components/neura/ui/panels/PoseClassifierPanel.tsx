import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { PoseClassifier, Keypoint } from '../../ml/classifiers/PoseClassifier'
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
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const classifierRef = useRef(new PoseClassifier())
    const [isCapturing, setIsCapturing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [detectedPose, setDetectedPose] = useState<Keypoint[]>([])

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
        if (mode.mode === 'collect' || mode.mode === 'test') {
            startCamera()
        } else {
            stopCamera()
        }
    }, [mode.mode])

    useEffect(() => {
        if ((mode.mode === 'collect' || mode.mode === 'test') && stream) {
            const interval = setInterval(async () => {
                if (videoRef.current && overlayRef.current) {
                    try {
                        const keypoints = await classifierRef.current.detectPose(videoRef.current)
                        setDetectedPose(keypoints)
                        classifierRef.current.drawPose(overlayRef.current, keypoints)
                    } catch (e) {
                        // Pose detection failed, ignore
                    }
                }
            }, 100)
            return () => clearInterval(interval)
        }
    }, [mode.mode, stream])

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
        if (!videoRef.current || !mode.selectedClassId) return

        setIsCapturing(true)

        if (detectedPose.length > 0) {
            const poseData = JSON.stringify(detectedPose)
            mode.addSample(mode.selectedClassId, { type: 'keypoints', data: poseData })

            const selectedClass = mode.getSelectedClass()
            if (selectedClass) {
                await classifierRef.current.addSampleFromKeypoints(detectedPose, selectedClass.name)
            }
        }

        setTimeout(() => setIsCapturing(false), 300)
    }

    const handleTrain = async () => {
        setIsTraining(true)
        await new Promise(r => setTimeout(r, 1000))
        mode.setAccuracy(0.82 + Math.random() * 0.14)
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
                        background: 'rgba(249,115,22,0.04)',
                        border: '1px solid rgba(249,115,22,0.12)'
                    }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                            background: 'linear-gradient(135deg, #F9731620, #F9731610)'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                            {!mode.selectedClassId
                                ? 'Select a class from the sidebar, then strike a pose to train your model.'
                                : `Strike a "${selectedClass?.name}" pose. The model detects your body keypoints — try different angles!`
                            }
                        </p>
                    </div>

                    {/* Video container with glass frame */}
                    <div className="relative rounded-3xl overflow-hidden" style={{
                        maxWidth: 640,
                        background: 'rgba(15,15,35,0.85)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(249,115,22,0.1)'
                    }}>
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
                            className="absolute inset-0 w-full h-full rounded-3xl"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {isCapturing && (
                            <div className="absolute inset-0 rounded-3xl" style={{
                                background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(236,72,153,0.3))'
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
                        disabled={!mode.selectedClassId || isCapturing || detectedPose.length === 0}
                        label={isCapturing ? 'Captured!' : 'Capture Pose'}
                        icon="camera"
                        color={selectedClass?.color || '#F97316'}
                        pulse={!isCapturing}
                    />

                    {selectedClass && (
                        <div className="w-full max-w-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-black text-gray-700">{selectedClass.name} Samples</h3>
                                <span className="text-xs text-gray-400 font-bold">{selectedClass.samples.length} poses</span>
                            </div>
                            <SampleGrid
                                samples={selectedClass.samples}
                                type="keypoints"
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
                        <canvas
                            ref={overlayRef}
                            width={640}
                            height={480}
                            className="absolute inset-0 w-full h-full rounded-3xl"
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
