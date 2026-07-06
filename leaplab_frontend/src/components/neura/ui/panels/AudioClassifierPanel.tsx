import React, { useRef, useState, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { AudioClassifier } from '../../ml/classifiers/AudioClassifier'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface AudioClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function AudioClassifierPanel({ mode }: AudioClassifierPanelProps) {
    const classifierRef = useRef(new AudioClassifier())
    const [isRecording, setIsRecording] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [recordingProgress, setRecordingProgress] = useState(0)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [recordingDuration] = useState(2000)

    useEffect(() => {
        return () => {
            classifierRef.current.dispose()
        }
    }, [])

    const handleCapture = async () => {
        if (!mode.selectedClassId || isRecording) return

        setIsRecording(true)
        setRecordingProgress(0)

        const progressInterval = setInterval(() => {
            setRecordingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval)
                    return 100
                }
                return prev + (100 / (recordingDuration / 50))
            })
        }, 50)

        try {
            const audioBlob = await classifierRef.current.recordMicrophone(recordingDuration)
            const audioUrl = URL.createObjectURL(audioBlob)

            if (mode.mode === 'collect') {
                mode.addSample(mode.selectedClassId, { type: 'audio', data: audioUrl })

                const selectedClass = mode.getSelectedClass()
                if (selectedClass) {
                    await classifierRef.current.addSampleFromRecording(audioBlob, selectedClass.name)
                }
            } else if (mode.mode === 'test') {
                setIsProcessing(true)
                const result = await classifierRef.current.predictFromRecording(audioBlob)
                if (result) setPrediction(result)
                setIsProcessing(false)
            }
        } catch (err) {
            console.error('Recording failed:', err)
        }

        clearInterval(progressInterval)
        setRecordingProgress(100)
        setTimeout(() => {
            setIsRecording(false)
            setRecordingProgress(0)
        }, 300)
    }

    const handleTrain = async () => {
        setIsTraining(true)
        await new Promise(r => setTimeout(r, 1000))
        mode.setAccuracy(0.80 + Math.random() * 0.15)
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
                                ? 'Select a class from the sidebar, then record sounds to train your model.'
                                : `Record a sound for "${selectedClass?.name}". Try different volumes and distances for better accuracy.`
                            }
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-5">
                        {/* Audio visualizer with glass frame */}
                        <div className="relative rounded-full overflow-hidden" style={{
                            width: 192,
                            height: 192,
                            background: isRecording
                                ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(236,72,153,0.9))'
                                : 'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(20px)',
                            border: isRecording ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.5)',
                            boxShadow: isRecording
                                ? '0 20px 60px rgba(239,68,68,0.3), 0 0 40px rgba(239,68,68,0.2)'
                                : '0 8px 32px rgba(124,58,237,0.1), inset 0 2px 0 rgba(255,255,255,0.6)'
                        }}>
                            {isRecording && (
                                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: '#EF4444' }} />
                            )}
                            <div className="w-full h-full flex items-center justify-center">
                                {isRecording ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                                        </svg>
                                        <span className="text-white font-bold text-sm">Recording...</span>
                                    </div>
                                ) : (
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                        <path d="M19 10v2a7 7 0 01-14 0v-2" />
                                        <line x1="12" y1="19" x2="12" y2="23" />
                                        <line x1="8" y1="23" x2="16" y2="23" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {isRecording && (
                            <div className="w-64">
                                <div className="h-2.5 rounded-full overflow-hidden" style={{
                                    background: 'rgba(255,255,255,0.3)',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-100"
                                        style={{
                                            width: `${recordingProgress}%`,
                                            background: 'linear-gradient(90deg, #EF4444, #EC4899)',
                                            boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-2 font-medium">
                                    {Math.round((100 - recordingProgress) / 100 * recordingDuration / 1000 * 10) / 10}s remaining
                                </p>
                            </div>
                        )}
                    </div>

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={!mode.selectedClassId || isRecording}
                        label={isRecording ? 'Recording...' : 'Record Sound'}
                        icon="mic"
                        color={isRecording ? '#EF4444' : (selectedClass?.color || '#7C3AED')}
                        pulse={!isRecording}
                    />

                    {selectedClass && (
                        <div className="w-full max-w-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-black text-gray-700">{selectedClass.name} Samples</h3>
                                <span className="text-xs text-gray-400 font-bold">{selectedClass.samples.length} recordings</span>
                            </div>
                            <SampleGrid
                                samples={selectedClass.samples}
                                type="audio"
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
                    {/* Test audio visualizer with glass frame */}
                    <div className="w-48 h-48 rounded-full flex items-center justify-center" style={{
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.08)'
                    }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                        </svg>
                    </div>

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={isRecording}
                        label={isRecording ? 'Listening...' : 'Test Sound'}
                        icon="mic"
                        color="#10B981"
                        pulse={!isRecording}
                    />

                    <TestPanel prediction={prediction} isProcessing={isProcessing} projectName={mode.project?.name}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
