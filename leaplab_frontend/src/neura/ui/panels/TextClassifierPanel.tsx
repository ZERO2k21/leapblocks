import React, { useState, useRef, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { TextClassifier } from '../../ml/classifiers/TextClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
import SampleGrid from '../components/SampleGrid'
import WorkflowIndicator from '../components/WorkflowIndicator'
import TrainPanel from '../components/TrainPanel'

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

    useEffect(() => {
        if ((mode.mode === 'train' || mode.mode === 'test') && mode.project) {
            let cancelled = false; setModelLoading(true)
            const rebuild = async () => {
                classifierRef.current.clear()
                for (const cls of mode.project!.classes) {
                    if (cls.samples.length > 0) {
                        await classifierRef.current.addSampleBatch(cls.samples.map(s => s.data), cls.name)
                    }
                }
                if (!cancelled) setModelLoading(false)
            }
            rebuild().catch(() => { if (!cancelled) setModelLoading(false) })
            return () => { cancelled = true }
        }
    }, [mode.mode])

    const handleAddText = useCallback(() => {
        if (!textInput.trim()) return
        // Auto-select first class if none selected
        if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
            mode.setSelectedClassId(mode.project.classes[0].id)
        }
        if (!mode.selectedClassId) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) return
        mode.addSample(mode.selectedClassId, { type: 'text', data: textInput.trim() })
        classifierRef.current.addSample(textInput.trim(), mode.getSelectedClass()?.name || '').catch(() => {})
        setTextInput('')
    }, [textInput, mode])

    const handleTrain = async () => {
        setIsTraining(true)
        const project = mode.project
        if (!project || project.classes.length < 2) { mode.setAccuracy(0); setIsTraining(false); return }
        try {
            await new Promise(r => setTimeout(r, 1500))
            let correct = 0; let total = 0
            for (const cls of project.classes) {
                for (const sample of cls.samples) {
                    try { const result = await classifierRef.current.predict(sample.data, 5); if (result && result.label === cls.name) correct++; total++ } catch { total++ }
                }
            }
            mode.setAccuracy(total > 0 ? correct / total : 0)
            setTimeout(() => { mode.setMode('test') }, 2000)
        } catch { mode.setAccuracy(0) }
        setIsTraining(false)
    }

    const handlePredict = useCallback(async (text: string) => {
        if (!text.trim()) { setPrediction(null); return }
        setIsProcessing(true)
        try {
            const result = await classifierRef.current.predict(text.trim(), 5)
            setPrediction(result)
        } catch { setPrediction(null) }
        setIsProcessing(false)
    }, [])

    useEffect(() => {
        if (mode.mode === 'test' && textInput.trim()) {
            if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current)
            predictTimeoutRef.current = setTimeout(() => handlePredict(textInput), 500)
        }
        return () => { if (predictTimeoutRef.current) clearTimeout(predictTimeoutRef.current) }
    }, [textInput, mode.mode])

    const selectedClass = mode.getSelectedClass()
    const canTrain = mode.project && !modelLoading ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false

    return (
        <div className="flex flex-col h-full overflow-y-auto neura-scrollbar">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col overflow-auto">
                    {/* Header */}
                    <div className="text-center py-4 px-5 pb-2 shrink-0 animate-fade-in">
                        <div className="flex items-center justify-center gap-2.5 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center text-xl">📝</div>
                            <h2 className="text-2xl font-extrabold text-[#630ed4]">Word Wizard!</h2>
                        </div>
                        <p className="text-xs text-gray-500">Type words to teach your AI to read! 🔤</p>
                    </div>

                    <div className="px-5 shrink-0">
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col p-3 px-5 overflow-hidden">
                        {/* Input card */}
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] shrink-0">
                            <div className="flex gap-2 mb-2.5">
                                <input
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddText() }}
                                    placeholder="Type something..."
                                    className="flex-1 p-3 px-4 text-sm font-semibold border-2 border-gray-200 focus:border-[#630ed4] rounded-xl outline-none bg-white text-[#131b2e] transition-colors"
                                />
                                <button
                                    onClick={handleAddText}
                                    disabled={!textInput.trim() || atSampleLimit}
                                    className={`py-3 px-6 rounded-xl text-sm font-bold border-none transition-all ${
                                        !textInput.trim() || atSampleLimit
                                            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                            : 'cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white'
                                    }`}
                                >
                                    ➕ Add
                                </button>
                            </div>

                            {selectedClass && (
                                <div className="flex items-center gap-2 py-2 px-3 bg-[#f5f3ff] rounded-lg border border-[#ede9fe]">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedClass.color }} />
                                    <span className="text-xs font-bold text-[#630ed4]">Adding to: {selectedClass.name}</span>
                                    <span className={`text-[10px] font-semibold ml-auto py-0.5 px-2 rounded-md ${selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS ? 'bg-amber-100 text-[#c32c00]' : 'bg-white text-[#630ed4]'}`}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Samples */}
                        {selectedClass && (
                            <div className="flex-1 mt-3 bg-white/90 backdrop-blur-md rounded-xl p-3.5 border border-gray-200 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-2.5 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedClass.color }} />
                                        <h3 className="text-xs font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-bold py-0.75 px-2 rounded-md bg-[#f5f3ff] text-[#630ed4]">{selectedClass.samples.length} texts</span>
                                </div>
                                <div className="flex-1 min-h-0 overflow-hidden">
                                    <SampleGrid samples={selectedClass.samples} type="text" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                                </div>
                            </div>
                        )}
                        {selectedClass && selectedClass.samples.length === 0 && (
                            <div className="flex-1 mt-3 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📝</div>
                                    <p className="text-xs font-bold text-gray-500">Type something above to start!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar p-3 px-5">
                    <div className="w-full flex-1 min-h-0 flex flex-col">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} sampleType="texts" mode={mode.mode} onModeChange={mode.setMode} modelLoading={modelLoading} />
                    </div>
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col overflow-auto">
                    {/* Header */}
                    <div className="text-center py-4 px-5 pb-2 shrink-0 animate-fade-in">
                        <div className="flex items-center justify-center gap-2.5 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center text-xl">🧪</div>
                            <h2 className="text-2xl font-extrabold text-[#630ed4]">Test Your AI!</h2>
                        </div>
                        <p className="text-xs text-gray-500">Type something and see if your AI understands! 🎯</p>
                    </div>

                    <div className="px-5 shrink-0">
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col p-3 px-5 gap-3 overflow-hidden">
                        {/* Input card */}
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] shrink-0">
                            <input
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Type a word to test..."
                                className="w-full p-3 px-4 text-sm font-semibold border-2 border-gray-200 focus:border-[#630ed4] rounded-xl outline-none bg-white text-[#131b2e] transition-colors"
                            />
                            {modelLoading && (
                                <div className="flex items-center gap-2 mt-2.5 py-2 px-3 bg-[#f5f3ff] rounded-lg">
                                    <div className="w-3.5 h-3.5 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[11px] font-bold text-[#630ed4]">Loading model...</span>
                                </div>
                            )}
                        </div>

                        {/* Results area */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            {isProcessing && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="w-12 h-12 border-3 border-gray-200 border-t-[#630ed4] rounded-full animate-spin mb-3" />
                                    <p className="text-xs font-bold text-gray-500">Analyzing... 🔍</p>
                                </div>
                            )}
                            {!isProcessing && prediction && (
                                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] h-full flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[9px] font-extrabold text-[#630ed4] uppercase tracking-widest">All Class Scores</span>
                                        <button
                                            onClick={() => { setPrediction(null); setTextInput('') }}
                                            className="text-[9px] font-bold text-[#630ed4] bg-[#f5f3ff] py-0.5 px-1.5 rounded border-none cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto neura-scrollbar">
                                        {Object.entries(prediction.confidences)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([label, conf], idx) => {
                                                const pct = Math.round(conf * 100)
                                                const isTop = idx === 0
                                                return (
                                                    <div key={label} className={`rounded-lg p-2 ${isTop ? 'bg-[#f5f3ff] border border-[#630ed4]/15' : 'bg-gray-50 border border-gray-100'}`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className={`text-[11px] font-bold capitalize ${isTop ? 'text-[#630ed4]' : 'text-gray-700'}`}>
                                                                {isTop && <span className="mr-1">🏆</span>}
                                                                {label}
                                                            </span>
                                                            <span className={`text-[11px] font-extrabold ${pct >= 50 ? 'text-emerald-600' : pct >= 25 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-[width] duration-200 ease-out ${
                                                                    isTop
                                                                        ? 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed]'
                                                                        : pct >= 25
                                                                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                                            : 'bg-gray-300'
                                                                }`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            )}
                            {!isProcessing && !prediction && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="w-12 h-12 rounded-full bg-[#f5f3ff] flex items-center justify-center mb-2.5 border-2 border-dashed border-violet-300">
                                        <span className="text-xl">🤔</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-500">Type something above!</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Your AI is ready to predict</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
