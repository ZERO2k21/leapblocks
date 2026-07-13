import React, { useState, useRef, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { TextClassifier } from '../../ml/classifiers/TextClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../../../types/neura.types'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface TextClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function TextClassifierPanel({ mode }: TextClassifierPanelProps) {
    const classifierRef = useRef(new TextClassifier())
    const predictTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [textInput, setTextInput] = useState('')
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
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
                        await classifierRef.current.addSampleBatch(
                            cls.samples.map(s => s.data),
                            cls.name
                        )
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    const handleAddText = useCallback(() => {
        if (!textInput.trim() || !mode.selectedClassId) return

        // Check sample limit
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            return
        }

        mode.addSample(mode.selectedClassId, { type: 'text', data: textInput.trim() })
        classifierRef.current.addSample(textInput.trim(), mode.getSelectedClass()?.name || '')
        setTextInput('')
    }, [textInput, mode.selectedClassId, mode.getSelectedClass])

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
                        const result = await classifierRef.current.predict(sample.data, 5)
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
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                {/* Text input area */}
                <div className="w-full max-w-[560px]">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-700">Add Training Text</h3>
                                <p className="text-[11px] text-gray-400">Type text samples for each class</p>
                            </div>
                        </div>

                        {selectedClass && (
                            <div className="mb-3 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                <span className="text-xs font-bold text-gray-600">
                                    Adding to: {selectedClass.name}
                                </span>
                            </div>
                        )}

                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAddText()
                                }
                            }}
                            placeholder="Type a training text sample..."
                            className="w-full h-28 px-4 py-3 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-300 resize-none bg-gray-50 transition-colors placeholder:text-gray-300"
                        />

                        <div className="flex items-center justify-between mt-3">
                            <span className="text-[11px] text-gray-400">
                                {atSampleLimit
                                    ? `Max ${MAX_SAMPLES_PER_CLASS} samples reached`
                                    : textInput.length > 0
                                        ? `${textInput.length} characters`
                                        : 'Press Enter to add'
                                }
                            </span>
                            <button
                                onClick={handleAddText}
                                disabled={!textInput.trim() || !canAddSamples}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                Add Sample
                            </button>
                        </div>
                    </div>
                </div>

                {/* Current class samples */}
                {selectedClass && selectedClass.samples.length > 0 && (
                    <div className="w-full max-w-[560px]">
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
                                    {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS} texts
                                </span>
                            </div>
                            <SampleGrid
                                samples={selectedClass.samples}
                                type="text"
                                onRemove={(id) => mode.removeSample(selectedClass.id, id)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {mode.mode === 'train' && (
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-white/80 backdrop-blur-sm z-10">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-white/80 backdrop-blur-sm z-10">
                    <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-gray-700">Test Text Classification</h3>
                        </div>
                        {modelLoading && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200 mb-3 animate-[fade-in_0.3s_ease-out]">
                                <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-semibold text-violet-700">Loading model...</span>
                            </div>
                        )}
                        <textarea
                            placeholder="Type text to classify..."
                            className="w-full h-24 px-4 py-3 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-300 resize-none bg-gray-50 mb-3"
                            onChange={(e) => {
                                const value = e.target.value
                                if (predictTimeoutRef.current) {
                                    clearTimeout(predictTimeoutRef.current)
                                    predictTimeoutRef.current = null
                                }
                                if (value.trim() && !modelLoading && classifierRef.current.canClassify) {
                                    setIsProcessing(true)
                                    predictTimeoutRef.current = setTimeout(async () => {
                                        try {
                                            const result = await classifierRef.current.predict(value, 5)
                                            if (result) setPrediction(result)
                                        } catch {
                                            // ignore
                                        }
                                        setIsProcessing(false)
                                    }, 500)
                                }
                            }}
                        />
                        <TestPanel prediction={prediction} isProcessing={isProcessing}>
                            <div />
                        </TestPanel>
                    </div>
                </div>
            )}
        </div>
    )
}
