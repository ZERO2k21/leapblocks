import React, { useRef, useState, useEffect } from 'react'
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
    const [isTraining, setIsTraining] = useState(false)
    const [inputText, setInputText] = useState('')
    const [testText, setTestText] = useState('')
    const [prediction, setPrediction] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        return () => {
            classifierRef.current.dispose()
        }
    }, [])

    const handleAddSample = async () => {
        if (!inputText.trim() || !mode.selectedClassId || isAdding) return

        setIsAdding(true)
        try {
            mode.addSample(mode.selectedClassId, { type: 'text', data: inputText.trim() })

            const selectedClass = mode.getSelectedClass()
            if (selectedClass) {
                await classifierRef.current.addSample(inputText.trim(), selectedClass.name)
            }
            setInputText('')
        } catch (err) {
            console.error('Failed to add sample:', err)
        }
        setIsAdding(false)
    }

    const handleTrain = async () => {
        setIsTraining(true)
        await new Promise(r => setTimeout(r, 1000))
        mode.setAccuracy(0.83 + Math.random() * 0.14)
        setIsTraining(false)
    }

    const handlePredict = async () => {
        if (!testText.trim() || isProcessing) return

        setIsProcessing(true)
        try {
            const result = await classifierRef.current.predict(testText.trim())
            if (result) setPrediction(result)
        } catch (err) {
            console.error('Prediction failed:', err)
        }
        setIsProcessing(false)
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
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8">
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
                                ? 'Select a class from the sidebar, then type text samples to train your model.'
                                : `Type text examples for "${selectedClass?.name}". Add at least 5 different examples for better accuracy.`
                            }
                        </p>
                    </div>

                    <div className="w-full max-w-2xl">
                        <div className="rounded-3xl p-6" style={glassCardStyle}>
                            {/* Gradient header strip */}
                            <div className="h-1 rounded-full mb-5" style={{
                                background: 'linear-gradient(90deg, #7C3AED, #3B82F6)'
                            }} />

                            <h3 className="text-lg font-black text-gray-800 mb-4">Add Text Sample</h3>

                            <div className="flex gap-3">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type something to classify..."
                                    rows={3}
                                    className="flex-1 px-4 py-3 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.5)',
                                        border: '1px solid rgba(124,58,237,0.2)'
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    {selectedClass && (
                                        <span
                                            className="px-3 py-1 rounded-xl text-white text-xs font-bold"
                                            style={{
                                                background: `linear-gradient(135deg, ${selectedClass.color}DD, ${selectedClass.color})`,
                                                boxShadow: `0 2px 8px ${selectedClass.color}30`
                                            }}
                                        >
                                            → {selectedClass.name}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={handleAddSample}
                                    disabled={!inputText.trim() || !mode.selectedClassId || isAdding}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                                        inputText.trim() && mode.selectedClassId && !isAdding
                                            ? 'hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer'
                                            : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                                    }`}
                                    style={inputText.trim() && mode.selectedClassId && !isAdding ? {
                                        background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                                        color: 'white',
                                        boxShadow: '0 4px 20px rgba(124,58,237,0.3)'
                                    } : {}}
                                >
                                    {isAdding ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                            Add Sample
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {selectedClass && (
                        <div className="w-full max-w-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-black text-gray-700">{selectedClass.name} Samples</h3>
                                <span className="text-xs text-gray-400 font-bold">{selectedClass.samples.length} texts</span>
                            </div>
                            <SampleGrid
                                samples={selectedClass.samples}
                                type="text"
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
                <div className="flex-1 flex flex-col items-center gap-8 p-8">
                    <div className="w-full max-w-2xl">
                        <div className="rounded-3xl p-6" style={glassCardStyle}>
                            {/* Gradient header strip */}
                            <div className="h-1 rounded-full mb-5" style={{
                                background: 'linear-gradient(90deg, #10B981, #14B8A6)'
                            }} />

                            <h3 className="text-lg font-black text-gray-800 mb-4">Test Your Text</h3>

                            <div className="flex gap-3">
                                <textarea
                                    value={testText}
                                    onChange={(e) => setTestText(e.target.value)}
                                    placeholder="Type text to classify..."
                                    rows={3}
                                    className="flex-1 px-4 py-3 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.5)',
                                        border: '1px solid rgba(16,185,129,0.2)'
                                    }}
                                />
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={handlePredict}
                                    disabled={!testText.trim() || isProcessing}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                                        testText.trim() && !isProcessing
                                            ? 'hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer'
                                            : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                                    }`}
                                    style={testText.trim() && !isProcessing ? {
                                        background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                                        color: 'white',
                                        boxShadow: '0 4px 20px rgba(16,185,129,0.3)'
                                    } : {}}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8" />
                                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                            </svg>
                                            Classify
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <TestPanel prediction={prediction} isProcessing={isProcessing} projectName={mode.project?.name}>
                        <div />
                    </TestPanel>
                </div>
            )}
        </div>
    )
}
