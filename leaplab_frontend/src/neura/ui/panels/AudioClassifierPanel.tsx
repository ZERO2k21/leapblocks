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
        <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
            {/* Header + Workflow - centered (only for collect/test modes) */}
            {mode.mode !== 'train' && (
                <div className="w-full flex flex-col items-center animate-fade-in">
                    <div className="text-center" style={{ marginBottom: '12px' }}>
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
                <div className="w-full" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', flex: 1, minHeight: 0, marginTop: '16px' }}>
                    {/* Left half - Waveform visualizer */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: isMobile ? '30vh' : 0 }}>
                        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', background: '#0f0e26', border: '1px solid #3b2f63', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative' }}>
                            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7 }} />

                            {/* LIVE indicator */}
                            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '6px', zIndex: 10 }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                                <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>LIVE</span>
                            </div>

                            {/* Class name badge */}
                            {selectedClass && (
                                <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '4px 10px', borderRadius: '6px', background: selectedClass.color, color: '#fff', fontSize: '10px', fontWeight: 700, zIndex: 10 }}>
                                    {selectedClass.name}
                                </div>
                            )}

                            {/* Sample count */}
                            {selectedClass && (
                                <div style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '3px 8px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '5px', zIndex: 10 }}>
                                    <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>
                                        {selectedClass.samples.length} samples
                                    </span>
                                </div>
                            )}

                            {/* Center mic icon */}
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                                    border: isRecording ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: `scale(${micScale})`,
                                    transition: 'transform 0.05s ease-out, background-color 0.2s, border-color 0.2s',
                                    boxShadow: isRecording ? '0 0 24px rgba(239,68,68,0.4)' : '0 0 16px rgba(255,255,255,0.05)',
                                    marginBottom: '10px',
                                }}>
                                    <span style={{ fontSize: '2rem' }}>{isRecording ? '🎙️' : '🎤'}</span>
                                </div>
                                <div style={{ padding: '4px 12px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
                                        {isRecording ? '🔴 Recording...' : '🎤 Listening...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right half - Controls, Stats, Samples */}
                    <div style={{ width: isMobile ? '100%' : '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', height: isMobile ? 'auto' : '100%' }}>
                        {/* Tips */}
                        <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '10px', padding: '8px 12px', border: '1px solid rgba(99,14,212,0.1)' }}>
                            <div className="flex items-center" style={{ gap: '6px' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>💡</div>
                                <div className="flex flex-wrap" style={{ gap: '2px 10px' }}>
                                    {['Record in quiet environment', 'Speak clearly', 'Try different volumes', 'Record 5+ samples'].map((tip) => (
                                        <span key={tip} className="flex items-center" style={{ gap: '4px', fontSize: '9px', color: '#4b5563' }}>
                                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#630ed4', flexShrink: 0 }} />
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
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #630ed4, #8b5cf6)',
                                    color: '#fff',
                                    boxShadow: '0 4px 14px rgba(99,14,212,0.35)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>🎙️</span>
                                Mic On
                            </button>
                            <button
                                onClick={handleCapture}
                                disabled={!canAddSamples || isRecording}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: canAddSamples && !isRecording ? 'pointer' : 'not-allowed',
                                    background: isRecording
                                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                        : atSampleLimit
                                            ? 'linear-gradient(135deg, #d1d5db, #9ca3af)'
                                            : 'linear-gradient(135deg, #630ed4, #8b5cf6)',
                                    color: '#fff',
                                    boxShadow: isRecording
                                        ? '0 4px 14px rgba(239,68,68,0.4)'
                                        : '0 4px 14px rgba(99,14,212,0.35)',
                                    opacity: canAddSamples || isRecording ? 1 : 0.5,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>{isRecording ? '⏹️' : '🔴'}</span>
                                {isRecording ? 'Stop' : 'Record'}
                            </button>
                        </div>

                        {/* Stats */}
                        <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                            <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 Total Samples</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#630ed4' }}>{mode.getTotalSamples()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Classes</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#630ed4' }}>{mode.project?.classes.length || 0}</span>
                            </div>
                        </div>

                        {/* Samples */}
                        {selectedClass && selectedClass.samples.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div className="flex items-center justify-between" style={{ marginBottom: '8px', flexShrink: 0 }}>
                                    <div className="flex items-center" style={{ gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedClass.color }} />
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#131b2e' }}>{selectedClass.name}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '5px',
                                        background: atSampleLimit ? '#fef3c7' : '#f5f3ff',
                                        color: atSampleLimit ? '#c32c00' : '#630ed4',
                                    }}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="neura-scrollbar">
                                    <SampleGrid samples={selectedClass.samples} type="audio" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TRAIN MODE */}
            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    <div className="w-full" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
                <div className="w-full" style={{ flex: 1, minHeight: 0, marginTop: '16px', display: 'flex', flexDirection: 'column' }}>
                    {/* Horizontal split */}
                    <div className="w-full" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', flex: 1, minHeight: 0 }}>
                        {/* Left half - Waveform visualizer */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: isMobile ? '30vh' : 0 }}>
                            <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', background: '#0f0e26', border: '1px solid #3b2f63', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative' }}>
                                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7 }} />

                                {/* TESTING badge */}
                                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(0,108,68,0.8)', backdropFilter: 'blur(8px)', borderRadius: '6px', zIndex: 10 }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                                    <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>TESTING</span>
                                </div>

                                {/* Center content */}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                                    {modelLoading && (
                                        <div className="flex items-center" style={{ gap: '6px', padding: '6px 14px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '14px' }}>
                                            <div style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>Loading model...</span>
                                        </div>
                                    )}

                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '2px solid rgba(255,255,255,0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transform: `scale(${micScale})`,
                                        transition: 'transform 0.05s ease-out',
                                        boxShadow: '0 0 16px rgba(255,255,255,0.05)',
                                        marginBottom: '10px',
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>🎤</span>
                                    </div>

                                    {prediction && (
                                        <div className="flex flex-col items-center" style={{ gap: '4px', padding: '8px 16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prediction</span>
                                            <div className="flex items-center" style={{ gap: '6px' }}>
                                                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800, textTransform: 'capitalize' }}>{prediction.label}</span>
                                                <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 800 }}>
                                                    {Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right half - Test results */}
                        <div style={{ width: isMobile ? '100%' : '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', height: isMobile ? 'auto' : '100%' }}>
                            <TestPanel prediction={prediction} isProcessing={isProcessing}><div /></TestPanel>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
