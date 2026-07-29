import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { AudioClassifier } from '../../ml/classifiers/AudioClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import { useIsMobile } from '../../hooks/useResponsive'
import WorkflowIndicator from '../components/WorkflowIndicator'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'

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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [waveform, setWaveform] = useState<number[]>([])
    const [modelLoading, setModelLoading] = useState(false)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const [totalEpochs, setTotalEpochs] = useState(50)
    const [isImporting, setIsImporting] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)
    const [isMicOn, setIsMicOn] = useState(false)

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
            setIsMicOn(true)
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
        setIsMicOn(false)
    }, [])

    useEffect(() => { return () => { stopAudio() } }, [])

    useEffect(() => {
        if (mode.mode !== 'collect') { stopAudio() }
    }, [mode.mode])

    useEffect(() => {
        if (mode.mode !== 'test' || modelLoading) return
        let cancelled = false
        const runPrediction = async () => {
            if (isPredictingRef.current || cancelled) return
            if (!micStreamRef.current) return
            isPredictingRef.current = true; setIsProcessing(true)
            try {
                const blob = await classifierRef.current.captureFromStream(micStreamRef.current, 2000)
                const features = await classifierRef.current.extractFeaturesFromRecording(blob)
                const result = await classifierRef.current.predict(features, 5)
                if (result && !cancelled) setPrediction(result)
            } catch (err) { console.error('Audio prediction error:', err) }
            setIsProcessing(false); isPredictingRef.current = false
        }
        const interval = setInterval(runPrediction, 3000)
        return () => { cancelled = true; clearInterval(interval) }
    }, [mode.mode, modelLoading])

    const handleCapture = async () => {
        if (!mode.selectedClassId || !micStreamRef.current) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        if (isRecording) return
        setIsRecording(true)
        try {
            const blob = await classifierRef.current.captureFromStream(micStreamRef.current, 2000)
            const features = await classifierRef.current.extractFeaturesFromRecording(blob)
            await classifierRef.current.addSample(features, mode.getSelectedClass()?.name || '')
            mode.addSample(mode.selectedClassId, { type: 'audio', data: JSON.stringify(features) })
        } catch (err) { console.warn('[Neura] Audio capture failed:', err) }
        finally { setTimeout(() => setIsRecording(false), 300) }
    }

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !mode.selectedClassId) return

        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            setImportError('Sample limit reached for this class')
            return
        }

        setIsImporting(true)
        setImportError(null)

        try {
            const file = files[0]
            const features = await classifierRef.current.importFromFile(file, mode.getSelectedClass()?.name || '')
            mode.addSample(mode.selectedClassId, { type: 'audio', data: JSON.stringify(features) })
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Failed to import audio file')
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
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
    const hasClasses = mode.project ? mode.project.classes.length > 0 : false
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

                            {/* LIVE / OFF indicator */}
                            <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.25 py-1 px-2.5 backdrop-blur-md rounded-md z-10 ${
                                isMicOn ? 'bg-black/50' : 'bg-gray-800/70'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    isMicOn ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]' : 'bg-gray-500'
                                }`} />
                                <span className="text-white text-[10px] font-bold">{isMicOn ? 'LIVE' : 'OFF'}</span>
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
                                            : isMicOn
                                                ? 'bg-white/10 border-2 border-white/25 shadow-[0_0_16px_rgba(255,255,255,0.05)]'
                                                : 'bg-gray-500/10 border-2 border-gray-500/30 shadow-none'
                                    }`}
                                    style={{ transform: `scale(${isMicOn ? micScale : 1})` }}
                                >
                                    <span className="text-3xl">{isRecording ? '🎙️' : isMicOn ? '🎤' : '🔇'}</span>
                                </div>
                                <div className={`py-1 px-3 backdrop-blur-md rounded-full border ${
                                    isMicOn ? 'bg-black/50 border-white/10' : 'bg-gray-800/60 border-gray-600/30'
                                }`}>
                                    <span className={`text-[10px] font-bold tracking-wider ${
                                        isMicOn ? 'text-white' : 'text-gray-400'
                                    }`}>
                                        {isRecording ? '🔴 Recording...' : isMicOn ? '🎤 Listening...' : '🔇 Mic Off — Create a class & click Mic On'}
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
                                    {['Create a class first', 'Click Mic On', 'Record in quiet environment', 'Record 5+ samples'].map((tip) => (
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
                                onClick={isMicOn ? stopAudio : startAudio}
                                disabled={!hasClasses}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none transition-all ${
                                    !hasClasses
                                        ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white cursor-not-allowed'
                                        : isMicOn
                                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.4)]'
                                            : 'bg-gradient-to-br from-[#630ed4] to-[#8b5cf6] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)]'
                                } ${hasClasses ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                <span className="text-base">{isMicOn ? '🔴' : '🎙️'}</span>
                                {isMicOn ? 'Mic Off' : 'Mic On'}
                            </button>
                            <button
                                onClick={handleCapture}
                                disabled={!canAddSamples || !isMicOn || isRecording}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none transition-all ${
                                    isRecording
                                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.4)]'
                                        : atSampleLimit || !isMicOn
                                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white cursor-not-allowed'
                                            : 'bg-gradient-to-br from-[#630ed4] to-[#8b5cf6] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)]'
                                } ${canAddSamples && isMicOn || isRecording ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                <span className="text-base">{isRecording ? '⏹️' : '🔴'}</span>
                                {isRecording ? 'Stop' : 'Record'}
                            </button>
                        </div>

                        {/* File Import */}
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".wav,.mp3,audio/wav,audio/mpeg"
                                onChange={handleFileImport}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!canAddSamples || isImporting}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none transition-all ${
                                    isImporting
                                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                                        : atSampleLimit
                                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white cursor-not-allowed'
                                            : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]'
                                } ${canAddSamples && !isImporting ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                <span className="text-base">{isImporting ? '⏳' : '📁'}</span>
                                {isImporting ? 'Importing...' : 'Import .wav/.mp3'}
                            </button>
                        </div>

                        {/* Import Error */}
                        {importError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 px-3">
                                <span className="text-[10px] text-red-600 font-medium">{importError}</span>
                            </div>
                        )}

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
                    <div className={`w-full flex flex-1 min-h-0 gap-4 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                        {/* Left half - Waveform visualizer + Controls */}
                        <div className={`flex-1 min-w-0 flex flex-col ${isMobile ? 'min-h-[30vh]' : 'min-h-0'}`}>
                            <div className="flex-1 rounded-2xl overflow-hidden bg-[#0f0e26] border border-[#3b2f63] shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative">
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

                                {/* TESTING badge */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.25 py-1 px-2.5 bg-[#006c44]/80 backdrop-blur-md rounded-md z-10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    <span className="text-white text-[10px] font-bold">TESTING</span>
                                </div>

                                {/* LIVE / OFF indicator */}
                                <div className={`absolute top-2.5 right-2.5 flex items-center gap-1.25 py-1 px-2.5 backdrop-blur-md rounded-md z-10 ${
                                    isMicOn ? 'bg-black/50' : 'bg-gray-800/70'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        isMicOn ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]' : 'bg-gray-500'
                                    }`} />
                                    <span className="text-white text-[10px] font-bold">{isMicOn ? 'LIVE' : 'OFF'}</span>
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
                                        className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-transform duration-75 mb-2.5 ${
                                            isProcessing
                                                ? 'bg-amber-500/15 border-2 border-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.4)]'
                                                : isMicOn
                                                    ? 'bg-white/10 border-2 border-white/25 shadow-[0_0_16px_rgba(255,255,255,0.05)]'
                                                    : 'bg-gray-500/10 border-2 border-gray-500/30 shadow-none'
                                        }`}
                                        style={{ transform: `scale(${isMicOn ? micScale : 1})` }}
                                    >
                                        <span className="text-3xl">{isProcessing ? '⏳' : isMicOn ? '🎤' : '🔇'}</span>
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

                                    {!prediction && !modelLoading && !isProcessing && (
                                        <div className="py-1 px-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                                            <span className={`text-[10px] font-bold tracking-wider ${isMicOn ? 'text-white' : 'text-gray-400'}`}>
                                                {isMicOn ? '🎤 Speak or import a file to test' : '🔇 Turn on mic or import a file'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right half - Test controls + Results */}
                        <div className={`shrink-0 flex flex-col gap-2.5 ${isMobile ? 'w-full h-auto' : 'w-[280px] h-full'}`}>
                            {/* Test Controls */}
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-2.5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Test Controls</span>
                                </div>

                                {/* Mic Toggle */}
                                <button
                                    onClick={isMicOn ? stopAudio : startAudio}
                                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none transition-all mb-2 ${
                                        isMicOn
                                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.4)]'
                                            : 'bg-gradient-to-br from-[#630ed4] to-[#8b5cf6] text-white shadow-[0_4px_14px_rgba(99,14,212,0.35)]'
                                    } cursor-pointer`}
                                >
                                    <span className="text-base">{isMicOn ? '🔴' : '🎙️'}</span>
                                    {isMicOn ? 'Mic Off' : 'Mic On'}
                                </button>

                                {/* Record & Test Button */}
                                <button
                                    onClick={async () => {
                                        if (!micStreamRef.current || isProcessing) return
                                        setIsProcessing(true)
                                        try {
                                            const blob = await classifierRef.current.captureFromStream(micStreamRef.current, 2000)
                                            const features = await classifierRef.current.extractFeaturesFromRecording(blob)
                                            const result = await classifierRef.current.predict(features, 5)
                                            if (result) setPrediction(result)
                                        } catch (err) { console.error('Test capture error:', err) }
                                        setIsProcessing(false)
                                    }}
                                    disabled={!isMicOn || isProcessing}
                                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none transition-all mb-2 ${
                                        isProcessing
                                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white cursor-wait'
                                            : !isMicOn
                                                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white cursor-not-allowed'
                                                : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] cursor-pointer'
                                    } ${!isMicOn || isProcessing ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    <span className="text-base">{isProcessing ? '⏳' : '🎯'}</span>
                                    {isProcessing ? 'Analyzing...' : 'Record & Test'}
                                </button>

                                {/* File Import for Testing */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".wav,.mp3,audio/wav,audio/mpeg"
                                    onChange={async (e) => {
                                        const files = e.target.files
                                        if (!files || files.length === 0) return
                                        setIsProcessing(true)
                                        setImportError(null)
                                        try {
                                            const file = files[0]
                                            const result = await classifierRef.current.predictFromFile(file, 5)
                                            if (result) setPrediction(result)
                                        } catch (err) {
                                            setImportError(err instanceof Error ? err.message : 'Failed to test file')
                                        } finally {
                                            setIsProcessing(false)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }
                                    }}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border-none transition-all ${
                                        isProcessing
                                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white cursor-wait'
                                            : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(59,130,246,0.35)] cursor-pointer'
                                    } ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    <span className="text-base">{isProcessing ? '⏳' : '📁'}</span>
                                    {isProcessing ? 'Analyzing...' : 'Test with File (.wav/.mp3)'}
                                </button>

                                {/* Import Error */}
                                {importError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 px-3 mt-2">
                                        <span className="text-[10px] text-red-600 font-medium">{importError}</span>
                                    </div>
                                )}
                            </div>

                            {/* Prediction Results */}
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
                                {prediction ? (
                                    <div className="flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Results</span>
                                            <button
                                                onClick={() => setPrediction(null)}
                                                className="text-[9px] font-bold text-[#630ed4] bg-[#f5f3ff] py-0.5 px-1.5 rounded border-none cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        </div>

                                        {/* Top Prediction */}
                                        <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl p-3 mb-3 border border-[#630ed4]/10">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#630ed4] to-[#7c3aed] flex items-center justify-center text-white font-bold text-sm">
                                                    {prediction.label.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block">Prediction</span>
                                                    <span className="text-sm font-extrabold text-[#131b2e] capitalize">{prediction.label}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-gray-500">Confidence</span>
                                                <span className={`text-sm font-extrabold ${
                                                    Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) >= 0.7
                                                        ? 'text-emerald-600'
                                                        : Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) >= 0.4
                                                            ? 'text-amber-600'
                                                            : 'text-red-600'
                                                }`}>
                                                    {Math.round(Object.values(prediction.confidences).reduce((a, b) => Math.max(a, b), 0) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-5">
                                        <div className="w-12 h-12 rounded-full bg-[#f5f3ff] flex items-center justify-center mb-2.5 border-2 border-dashed border-purple-300">
                                            <span className="text-xl">🤔</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 text-center">No prediction yet</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 text-center">Record audio or import a file to test</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

