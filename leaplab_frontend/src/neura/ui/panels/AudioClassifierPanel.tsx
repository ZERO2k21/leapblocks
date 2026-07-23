import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { AudioClassifier } from '../../ml/classifiers/AudioClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import { useIsMobile } from '../../hooks/useResponsive'
import WorkflowIndicator from '../components/WorkflowIndicator'
import StatsBar from '../components/StatsBar'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface AudioClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function AudioClassifierPanel({ mode }: AudioClassifierPanelProps) {
    const isMobile = useIsMobile(768)
    const classifierRef = useRef(new AudioClassifier())
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const micStreamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [waveform, setWaveform] = useState<number[]>([])
    const [modelLoading, setModelLoading] = useState(false)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const [totalEpochs, setTotalEpochs] = useState(50)

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            let cancelled = false
            setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (cls.samples.length > 0) {
                        for (const sample of cls.samples) {
                            try {
                                const features = JSON.parse(sample.data)
                                await classifierRef.current.addSample(features, cls.name)
                            } catch { /* skip */ }
                        }
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    const startAudio = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            micStreamRef.current = stream
            const ctx = new AudioContext()
            const source = ctx.createMediaStreamSource(stream)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            audioContextRef.current = ctx
            analyserRef.current = analyser
            const draw = () => {
                if (!analyserRef.current) return
                const data = new Uint8Array(analyserRef.current.frequencyBinCount)
                analyserRef.current.getByteFrequencyData(data)
                setWaveform(Array.from(data))

                const canvas = canvasRef.current
                if (canvas) {
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                            canvas.width = canvas.clientWidth
                            canvas.height = canvas.clientHeight
                        }
                        ctx.fillStyle = 'rgba(21, 16, 48, 0.22)'
                        ctx.fillRect(0, 0, canvas.width, canvas.height)

                        const barWidth = (canvas.width / (data.length * 0.55))
                        let x = 0
                        
                        ctx.shadowBlur = 10
                        ctx.shadowColor = 'rgba(124, 58, 237, 0.35)'

                        for (let i = 0; i < data.length * 0.55; i++) {
                            const percent = data[i] / 255
                            const barHeight = percent * canvas.height * 0.7

                            const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
                            gradient.addColorStop(0, 'rgba(99, 14, 212, 0.15)')
                            gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.55)')
                            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.8)')

                            ctx.fillStyle = gradient
                            ctx.beginPath()
                            ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0])
                            ctx.fill()

                            x += barWidth
                        }
                    }
                }
                animFrameRef.current = requestAnimationFrame(draw)
            }
            draw()
        } catch (err) {
            console.error('Mic access denied:', err)
        }
    }, [])

    const stopAudio = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current)
        audioContextRef.current?.close()
        audioContextRef.current = null
        analyserRef.current = null
        micStreamRef.current?.getTracks().forEach(t => t.stop())
        micStreamRef.current = null
        setWaveform([])
    }, [])

    useEffect(() => { return () => { stopAudio() } }, [])

    useEffect(() => {
        if (mode.mode === 'collect') { startAudio() } else { stopAudio() }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        let cancelled = false
        const runPrediction = async () => {
            if (isPredictingRef.current || cancelled) return
            const ctx = audioContextRef.current; const analyser = analyserRef.current
            if (!ctx || !analyser) return
            isPredictingRef.current = true; setIsProcessing(true)
            try {
                if (ctx.state === 'suspended') await ctx.resume()
                const sampleData: number[] = []
                for (let i = 0; i < 40; i++) {
                    if (cancelled) break
                    const data = new Uint8Array(analyser.frequencyBinCount)
                    analyser.getByteFrequencyData(data)
                    sampleData.push(...Array.from(data))
                    await new Promise(r => setTimeout(r, 50))
                }
                if (!cancelled && sampleData.length > 0) {
                    const result = await classifierRef.current.predict(sampleData, 5)
                    if (result && !cancelled) setPrediction(result)
                }
            } catch (err) { console.error('Audio prediction error:', err) }
            setIsProcessing(false); isPredictingRef.current = false
        }
        startAudio()
        const interval = setInterval(runPrediction, 3000)
        return () => { cancelled = true; clearInterval(interval) }
    }, [mode.mode, modelLoading])

    const handleCapture = async () => {
        if (!mode.selectedClassId) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        if (isRecording) return
        setIsRecording(true)
        try {
            const ctx = audioContextRef.current
            if (ctx && ctx.state === 'suspended') await ctx.resume()
            const analyser = analyserRef.current
            const sampleData: number[] = []
            if (analyser) {
                for (let i = 0; i < 40; i++) {
                    const data = new Uint8Array(analyser.frequencyBinCount)
                    analyser.getByteFrequencyData(data)
                    sampleData.push(...Array.from(data))
                    await new Promise(r => setTimeout(r, 50))
                }
            }
            mode.addSample(mode.selectedClassId, { type: 'audio', data: JSON.stringify(sampleData) })
            classifierRef.current.addSample(sampleData, mode.getSelectedClass()?.name || '').catch(() => {})
        } catch (err) { console.warn('[Neura] Audio capture failed:', err) }
        finally { setTimeout(() => setIsRecording(false), 300) }
    }

    const handleTrain = async (epochsToTrain: number = 50) => {
        setTotalEpochs(epochsToTrain)
        setCurrentEpoch(0)
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) { mode.setAccuracy(0); setIsTraining(false); return }
        
        try {
            // Rebuild model samples
            classifierRef.current.clear()
            for (const cls of project.classes) {
                if (cls.samples.length > 0) {
                    for (const sample of cls.samples) {
                        try {
                            const features = JSON.parse(sample.data)
                            await classifierRef.current.addSample(features, cls.name)
                        } catch { /* skip */ }
                    }
                }
            }

            // Simulate epoch progression for UI
            const epochDelay = Math.max(10, Math.min(60, 2000 / epochsToTrain))
            for (let e = 1; e <= epochsToTrain; e++) {
                await new Promise(r => setTimeout(r, epochDelay))
                setCurrentEpoch(e)
            }

            // Compute accuracy
            const sampleCounts = classifierRef.current.getSampleCounts()
            const trainedClasses = Object.keys(sampleCounts)
            if (trainedClasses.length < 2) { mode.setAccuracy(0); setIsTraining(false); return }
            
            let correct = 0; let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
                        const features = JSON.parse(sample.data)
                        const result = await classifierRef.current.predict(features, 5)
                        if (result && result.label === cls.name) correct++
                        total++
                    } catch { total++ }
                }
            }
            mode.setAccuracy(total > 0 ? correct / total : 0)
            setTimeout(() => { mode.setMode('test') }, 1500)
        } catch (err) { 
            console.error('Audio training failed:', err)
            mode.setAccuracy(0) 
        }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    const averageVolume = waveform.length > 0 ? waveform.reduce((a, b) => a + b, 0) / waveform.length : 0
    const micScale = 1 + (averageVolume / 255) * 0.16

    return (
        <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
            {/* Header + Workflow - centered (only for collect/test modes) */}
            {mode.mode !== 'train' && (
                <div className="w-full flex flex-col items-center animate-fade-in">
                    <div className="text-center mb-3">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">🎤 Sound Catcher!</h2>
                        <p className="text-xs text-[#4a4455]">Record sounds to teach your AI!</p>
                    </div>
                    <div className="w-full max-w-[720px]">
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} type="audio" />
                    </div>
                </div>
            )}

            {/* COLLECT MODE */}
            {mode.mode === 'collect' && (
                <div className="w-full flex flex-col lg:flex-row gap-4 flex-1 min-h-0 mt-4">
                    {/* Left half - Waveform visualizer */}
                    <div className="flex-1 min-w-0 flex flex-col min-h-[220px]">
                        <div className="flex-1 rounded-2xl overflow-hidden bg-[#0f0e26] border border-[#3b2f63] shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative">
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

                            {/* LIVE indicator */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.25 py-1 px-2.5 bg-black/50 backdrop-blur-md rounded-md z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                                <span className="text-white text-[10px] font-bold">LIVE</span>
                            </div>

                            {/* Class name badge */}
                            {selectedClass && (
                                <div className="absolute bottom-2.5 left-2.5 py-1 px-2.5 rounded-md text-white text-[10px] font-bold z-10" style={{ background: selectedClass.color }}>
                                    {selectedClass.name}
                                </div>
                            )}

                            {/* Sample count */}
                            {selectedClass && (
                                <div className="absolute bottom-2.5 right-2.5 py-0.75 px-2 bg-black/50 backdrop-blur-md rounded-md z-10">
                                    <span className="text-white text-[9px] font-bold">
                                        {selectedClass.samples.length} samples
                                    </span>
                                </div>
                            )}

                            {/* Center mic icon */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                                <div
                                    className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-transform duration-75 mb-2.5 ${
                                        isRecording
                                            ? 'bg-red-500/15 border-2 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.4)]'
                                            : 'bg-white/10 border-2 border-white/25 shadow-[0_0_16px_rgba(255,255,255,0.05)]'
                                    }`}
                                    style={{ transform: `scale(${micScale})` }}
                                >
                                    <span className="text-3xl">{isRecording ? '🎙️' : '🎤'}</span>
                                </div>
                                <div className="py-1 px-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                                    <span className="text-white text-[10px] font-bold tracking-wider">
                                        {isRecording ? '🔴 Recording...' : '🎤 Listening...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right half - Controls, Stats, Samples */}
                    <div className={`shrink-0 flex flex-col gap-2.5 ${isMobile ? 'w-full h-auto' : 'w-[280px] h-full'}`}>
                        {/* Tips */}
                        <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-lg p-2 px-3 border border-[#630ed4]/10">
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-[10px] shrink-0">💡</div>
                                <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                                    {['Record in quiet environment', 'Speak clearly', 'Try different volumes', 'Record 5+ samples'].map((tip) => (
                                        <span key={tip} className="flex items-center gap-1 text-[9px] text-gray-600">
                                            <span className="w-0.75 h-0.75 rounded-full bg-[#630ed4] shrink-0" />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={startAudio}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#8b5cf6] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)] transition-all"
                            >
                                <span className="text-base">🎙️</span>
                                Mic On
                            </button>
                            <button
                                onClick={handleCapture}
                                disabled={!canAddSamples || isRecording}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none transition-all ${
                                    isRecording
                                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.4)]'
                                        : atSampleLimit
                                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white cursor-not-allowed'
                                            : 'bg-gradient-to-br from-[#630ed4] to-[#8b5cf6] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)]'
                                } ${canAddSamples || isRecording ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                <span className="text-base">{isRecording ? '⏹️' : '🔴'}</span>
                                {isRecording ? 'Stop' : 'Record'}
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-sm">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📊 Total Samples</span>
                                <span className="text-sm font-extrabold text-[#630ed4]">{mode.getTotalSamples()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">🎯 Classes</span>
                                <span className="text-sm font-extrabold text-[#630ed4]">{mode.project?.classes.length || 0}</span>
                            </div>
                        </div>

                        {/* Samples */}
                        {selectedClass && selectedClass.samples.length > 0 && (
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-2 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: selectedClass.color }} />
                                        <span className="text-[11px] font-bold text-[#131b2e]">{selectedClass.name}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold py-0.5 px-1.5 rounded ${atSampleLimit ? 'bg-amber-100 text-[#c32c00]' : 'bg-[#f5f3ff] text-[#630ed4]'}`}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                    </span>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto neura-scrollbar">
                                    <SampleGrid samples={selectedClass.samples} type="audio" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex-1 min-h-0 flex flex-col">
                        <TrainPanel 
                            isTraining={isTraining} 
                            accuracy={mode.accuracy} 
                            canTrain={canTrain} 
                            onTrain={handleTrain} 
                            classCount={mode.project?.classes.length || 0} 
                            totalSamples={mode.getTotalSamples()} 
                            currentEpoch={currentEpoch}
                            totalEpochs={totalEpochs}
                            sampleType="sounds"
                            mode={mode.mode}
                            onModeChange={mode.setMode}
                            workflowType="audio"
                        />
                    </div>
                </div>
            )}

            {/* TEST MODE */}
            {mode.mode === 'test' && (
                <div className="w-full flex-1 min-h-0 mt-4 flex flex-col">
                    {/* Horizontal split */}
                    <div className={`w-full flex flex-1 min-h-0 gap-4 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                        {/* Left half - Waveform visualizer */}
                        <div className={`flex-1 min-w-0 flex flex-col ${isMobile ? 'min-h-[30vh]' : 'min-h-0'}`}>
                            <div className="flex-1 rounded-2xl overflow-hidden bg-[#0f0e26] border border-[#3b2f63] shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative">
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

                                {/* TESTING badge */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.25 py-1 px-2.5 bg-[#006c44]/80 backdrop-blur-md rounded-md z-10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    <span className="text-white text-[10px] font-bold">TESTING</span>
                                </div>

                                {/* Center content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                                    {modelLoading && (
                                        <div className="flex items-center gap-1.5 py-1.5 px-3.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 mb-3.5">
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span className="text-white text-[10px] font-bold">Loading model...</span>
                                        </div>
                                    )}

                                    <div
                                        className="w-[72px] h-[72px] rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center transition-transform duration-75 shadow-[0_0_16px_rgba(255,255,255,0.05)] mb-2.5"
                                        style={{ transform: `scale(${micScale})` }}
                                    >
                                        <span className="text-3xl">🎤</span>
                                    </div>

                                    {prediction && (
                                        <div className="flex flex-col items-center gap-1 py-2 px-4 bg-black/50 backdrop-blur-md rounded-xl border border-white/10">
                                            <span className="text-white/50 text-[8px] font-bold uppercase tracking-widest">Prediction</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white text-xs font-extrabold capitalize">{prediction.label}</span>
                                                <span className="text-emerald-400 text-[11px] font-extrabold">
                                                    {Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right half - Test results */}
                        <div className={`shrink-0 flex flex-col gap-2.5 ${isMobile ? 'w-full h-auto' : 'w-[280px] h-full'}`}>
                            <TestPanel prediction={prediction} isProcessing={isProcessing}><div /></TestPanel>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

