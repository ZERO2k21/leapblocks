import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { AudioClassifier } from '../../ml/classifiers/AudioClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../../../types/neura.types'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface AudioClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function AudioClassifierPanel({ mode }: AudioClassifierPanelProps) {
    const classifierRef = useRef(new AudioClassifier())
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animFrameRef = useRef<number>(0)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [waveform, setWaveform] = useState<number[]>([])
    const [modelLoading, setModelLoading] = useState(false)

    // Rebuild KNN from stored samples when entering train or test mode
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
                            } catch {
                                // skip invalid samples
                            }
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
            const ctx = new AudioContext()
            const source = ctx.createMediaStreamSource(stream)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            audioContextRef.current = ctx
            analyserRef.current = analyser

            const draw = () => {
                if (!analyserRef.current || !canvasRef.current) return
                const data = new Uint8Array(analyserRef.current.frequencyBinCount)
                analyserRef.current.getByteFrequencyData(data)
                setWaveform(Array.from(data))
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
        setWaveform([])
    }, [])

    useEffect(() => {
        if (mode.mode === 'collect') {
            startAudio()
        } else {
            stopAudio()
        }
    }, [mode.mode])

    const handleCapture = async () => {
        if (!mode.selectedClassId) return

        // Check sample limit
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            return
        }

        // Block re-entry while recording
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

            // Add to classifier in background (non-blocking)
            classifierRef.current.addSample(sampleData, mode.getSelectedClass()?.name || '').catch(() => {})
        } catch (err) {
            console.warn('[Neura] Audio capture failed:', err)
        } finally {
            // Always re-enable the button after brief visual feedback
            setTimeout(() => setIsRecording(false), 300)
        }
    }

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) {
            mode.setAccuracy(0)
            setIsTraining(false)
            return
        }
        try {
            // Step 1: KNN was already rebuilt by useEffect when entering train mode.
            // Add a small delay so the UI shows the training animation.
            await new Promise(r => setTimeout(r, 1500))

            // Step 2: Verify the KNN has data before computing accuracy
            const sampleCounts = classifierRef.current.getSampleCounts()
            const trainedClasses = Object.keys(sampleCounts)
            if (trainedClasses.length < 2) {
                mode.setAccuracy(0)
                setIsTraining(false)
                return
            }

            // Step 3: Compute accuracy by predicting each sample against the KNN
            let correct = 0
            let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try {
                        const features = JSON.parse(sample.data)
                        const result = await classifierRef.current.predict(features, 3)
                        if (result && result.label === cls.name) correct++
                        total++
                    } catch {
                        total++
                    }
                }
            }
            const accuracy = total > 0 ? correct / total : 0
            mode.setAccuracy(accuracy)

            // Auto-switch to test mode after training completes
            setTimeout(() => {
                mode.setMode('test')
            }, 2000)
        } catch {
            mode.setAccuracy(0)
        }
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    {/* Waveform visualization */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-900 to-purple-900 w-full max-w-[520px]" style={{ aspectRatio: '4/3' }}>
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1 mb-4">
                                {waveform.slice(0, 40).map((v, i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 bg-white/80 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(4, v / 4)}px` }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-md rounded-xl">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                                </svg>
                                <span className="text-white text-sm font-bold">Audio Input Active</span>
                            </div>
                        </div>
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-white text-xs font-bold tracking-wide">LIVE</span>
                        </div>
                        {selectedClass && (
                            <div
                                className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md"
                                style={{ backgroundColor: `${selectedClass.color}CC` }}
                            >
                                {selectedClass.name}
                            </div>
                        )}
                    </div>

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={!canAddSamples || isRecording}
                        label={isRecording ? 'Recording...' : atSampleLimit ? 'Max Samples Reached' : 'Record Audio'}
                        icon="mic"
                        color={selectedClass?.color || '#7C3AED'}
                        pulse={!isRecording && !!canAddSamples}
                    />

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-gray-700">{selectedClass.name}</h3>
                                    </div>
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                        atSampleLimit
                                            ? 'text-amber-600 bg-amber-50'
                                            : 'text-gray-400 bg-gray-50'
                                    }`}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} recordings
                                    </span>
                                </div>
                                <SampleGrid
                                    samples={selectedClass.samples}
                                    type="audio"
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
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-900 to-purple-900 w-full max-w-[520px]" style={{ aspectRatio: '4/3' }}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {modelLoading && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-black/30 backdrop-blur-md rounded-xl mb-4 animate-[fade-in_0.3s_ease-out]">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs font-semibold text-white">Loading model...</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 mb-4">
                                {waveform.slice(0, 40).map((v, i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 bg-white/80 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(4, v / 4)}px` }}
                                    />
                                ))}
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
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-white text-xs font-bold tracking-wide">TESTING</span>
                        </div>
                    </div>
                    <TestPanel prediction={prediction} isProcessing={isProcessing}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
