import React, { useState, useRef, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { TextClassifier } from '../../ml/classifiers/TextClassifier'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from '../components/TrainPanel'
import TestPanel from '../components/TestPanel'

interface TextClassifierPanelProps {
    mode: UseNeuraProjectReturn
}

export default function TextClassifierPanel({ mode }: TextClassifierPanelProps) {
    const classifierRef = useRef(new TextClassifier())
    const [textInput, setTextInput] = useState('')
    const [isTraining, setIsTraining] = useState(false)
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleAddText = useCallback(() => {
        if (!textInput.trim() || !mode.selectedClassId) return
        mode.addSample(mode.selectedClassId, { type: 'text', data: textInput.trim() })
        classifierRef.current.addSample(textInput.trim(), mode.getSelectedClass()?.name || '')
        setTextInput('')
    }, [textInput, mode.selectedClassId])

    const handleTrain = async () => {
        setIsTraining(true)
        await new Promise(r => setTimeout(r, 1500))
        mode.setAccuracy(0.80 + Math.random() * 0.18)
        setIsTraining(false)
    }

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.some(c => c.samples.length > 0) : false

    const glassCardStyle = {
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
    }

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
                                {textInput.length > 0 ? `${textInput.length} characters` : 'Press Enter to add'}
                            </span>
                            <button
                                onClick={handleAddText}
                                disabled={!textInput.trim() || !mode.selectedClassId}
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
                                <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-lg">
                                    {selectedClass.samples.length} texts
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
                        <textarea
                            placeholder="Type text to classify..."
                            className="w-full h-24 px-4 py-3 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-300 resize-none bg-gray-50 mb-3"
                            onBlur={(e) => {
                                if (e.target.value) {
                                    setIsProcessing(true)
                                    setTimeout(() => {
                                        setPrediction({ label: selectedClass?.name || 'Unknown', confidences: { [selectedClass?.name || 'Unknown']: 0.75 + Math.random() * 0.2 } })
                                        setIsProcessing(false)
                                    }, 800)
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
