import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { PoseClassifier } from '../../ml/classifiers/PoseClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
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
    const streamRef = useRef<MediaStream | null>(null)
    const isPredictingRef = useRef(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [modelLoading, setModelLoading] = useState(false)

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
            if (videoRef.current) { videoRef.current.srcObject = mediaStream; await videoRef.current.play() }
            streamRef.current = mediaStream; setStream(mediaStream)
        } catch (err) { console.error('Camera access denied:', err) }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
    }, [])

    useEffect(() => { return () => { stopCamera() } }, [])

    useEffect(() => {
        if (mode.mode === 'collect' || mode.mode === 'test') {
            startCamera()
        }
        return () => stopCamera()
    }, [mode.mode])

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            let cancelled = false; setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (cls.samples.length > 0) {
                        for (const sample of cls.samples) {
                            try { await classifierRef.current.addSample(JSON.parse(sample.data), cls.name) } catch { /* skip */ }
                        }
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode, mode.project])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        const runPrediction = async () => {
            if (isPredictingRef.current) return
            if (stream && videoRef.current && canvasRef.current) {
                isPredictingRef.current = true; setIsProcessing(true)
                try {
                    const ctx = canvasRef.current.getContext('2d')
                    if (ctx) {
                        canvasRef.current.width = 640
                        canvasRef.current.height = 480
                        ctx.drawImage(videoRef.current, 0, 0, 640, 480)
                        const result = await classifierRef.current.predictFromImage(canvasRef.current)
                        if (result) setPrediction(result)
                    }
                } catch { /* ignore */ }
                setIsProcessing(false); isPredictingRef.current = false
            }
        }
        if (stream) {
            runPrediction()
            const interval = setInterval(runPrediction, 1000)
            return () => clearInterval(interval)
        }
    }, [mode.mode, stream, modelLoading])

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !mode.selectedClassId || !stream) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        if (isCapturing) return
        setIsCapturing(true)
        try {
            const video = videoRef.current; const canvas = canvasRef.current
            canvas.width = video.videoWidth; canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(video, 0, 0)
            const keypoints = await classifierRef.current.detectPose(canvas)
            if (keypoints && keypoints.length > 0) {
                mode.addSample(mode.selectedClassId, { type: 'keypoints', data: JSON.stringify(keypoints) })
                classifierRef.current.addSampleFromKeypoints(keypoints, mode.getSelectedClass()?.name || '').catch(() => {})
            }
        } catch { /* ignore */ }
        finally { setTimeout(() => setIsCapturing(false), 300) }
    }

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) { mode.setAccuracy(0); setIsTraining(false); return }
        try {
            await new Promise(r => setTimeout(r, 1500))
            let correct = 0; let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try { const result = await classifierRef.current.predict(JSON.parse(sample.data), 5); if (result && result.label === cls.name) correct++; total++ } catch { total++ }
                }
            }
            mode.setAccuracy(total > 0 ? correct / total : 0)
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch { mode.setAccuracy(0) }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">🤸 Pose Master!</h2>
                        <p className="text-sm text-[#4a4455]">Strike a pose and teach your AI! 🕺</p>
                    </div>
                    <div className="relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] shadow-lg aspect-[4/3]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                        {selectedClass && (
                            <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: `${selectedClass.color}CC` }}>
                                {selectedClass.name}
                            </div>
                        )}
                    </div>

                    <CaptureButton onClick={handleCapture} disabled={!canAddSamples || isCapturing} label={isCapturing ? '📸 Captured!' : atSampleLimit ? 'Max Reached 🎯' : 'Capture Pose 🤸'} icon="pose" color={selectedClass?.color || '#630ed4'} pulse={!isCapturing && !!canAddSamples} />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#4a4455] bg-[#f2f3ff] px-2.5 py-1 rounded-lg">{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} poses</span>
                                </div>
                                <SampleGrid samples={selectedClass.samples} type="keypoints" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">🏋️ Teach Your AI Poses!</h2>
                        <p className="text-sm text-[#4a4455]">Your AI is learning your moves! 💃</p>
                    </div>
                    <div className="w-full flex justify-center">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} />
                    </div>
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">🧪 Test Your AI!</h2>
                        <p className="text-sm text-[#4a4455]">Strike a pose and see if your AI recognizes it! 🎯</p>
                    </div>
                    <div className="relative rounded-3xl overflow-hidden bg-[#1e1b4b] w-full max-w-[520px] shadow-lg aspect-[4/3]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl -scale-x-100" />
                        {modelLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                <div className="flex items-center gap-3 px-4 py-3 bg-white/90 rounded-xl"><div className="w-4 h-4 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" /><span className="text-xs font-bold text-[#131b2e]">Loading... ⏳</span></div>
                            </div>
                        )}
                        {prediction && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md rounded-2xl">
                                <span className="text-white text-lg font-bold">{prediction.label}</span>
                                <span className="text-white/70 text-sm ml-2">{Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%</span>
                            </div>
                        )}
                    </div>
                    <TestPanel prediction={prediction} isProcessing={isProcessing}><div /></TestPanel>
                </div>
            )}
        </div>
    )
}
