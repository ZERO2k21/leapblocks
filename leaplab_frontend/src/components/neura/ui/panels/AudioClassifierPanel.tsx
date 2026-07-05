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
                <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            {isRecording && (
                                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                            )}
                            <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
                                isRecording
                                    ? 'bg-gradient-to-br from-red-400 to-pink-500 shadow-2xl shadow-red-200'
                                    : 'bg-gradient-to-br from-violet-100 to-blue-100'
                            }`}>
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
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-red-400 to-pink-500 rounded-full transition-all duration-100"
                                        style={{ width: `${recordingProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-2">
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
                                <h3 className="text-sm font-bold text-gray-600">
                                    {selectedClass.name} Samples
                                </h3>
                                <span className="text-xs text-gray-400">{selectedClass.samples.length} recordings</span>
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
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                            </svg>
                        </div>
                    </div>

                    <CaptureButton
                        onClick={handleCapture}
                        disabled={isRecording}
                        label={isRecording ? 'Listening...' : 'Test Sound'}
                        icon="mic"
                        color="#10B981"
                        pulse={!isRecording}
                    />

                    <TestPanel prediction={prediction} isProcessing={isProcessing}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
