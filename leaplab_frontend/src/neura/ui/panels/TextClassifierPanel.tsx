import React, { useState, useRef, useCallback, useEffect } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { TextClassifier } from '../../ml/classifiers/TextClassifier'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
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
        if (!textInput.trim() || !mode.selectedClassId) return
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
    const canTrain = mode.project ? mode.project.classes.length >= 2 && mode.project.classes.every(c => c.samples.length >= 2) : false
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false

    return (
        <div className="flex flex-col h-full">
            {mode.mode === 'collect' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">📝 Word Wizard!</h2>
                        <p className="text-sm text-[#4a4455]">Type words to teach your AI to read! 🔤</p>
                    </div>

                    <div className="w-full max-w-[520px] bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-[#dae2fd] shadow-sm">
                        <div className="flex gap-2 mb-4">
                            <input
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddText() }}
                                placeholder="Type something..."
                                className="flex-1 px-4 py-3 text-sm font-semibold border-2 border-[#dae2fd] rounded-2xl focus:outline-none focus:border-[#630ed4] bg-white text-[#131b2e] placeholder:text-[#7b7487]"
                            />
                            <button onClick={handleAddText} disabled={!textInput.trim() || !mode.selectedClassId || atSampleLimit} className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${!textInput.trim() || !mode.selectedClassId ? 'bg-[#dae2fd] text-[#7b7487] cursor-not-allowed' : 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white hover:shadow-md'}`}>
                                ➕ Add
                            </button>
                        </div>
                        {selectedClass && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#eaedff] rounded-xl">
                                <span className="text-sm">📁</span>
                                <span className="text-xs font-bold text-[#630ed4]">Adding to: {selectedClass.name}</span>
                                <span className="text-[10px] text-[#4a4455] ml-auto">{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}</span>
                            </div>
                        )}
                    </div>

                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="w-full max-w-[520px]">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#dae2fd]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                        <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#4a4455] bg-[#f2f3ff] px-2.5 py-1 rounded-lg">{selectedClass.samples.length} texts</span>
                                </div>
                                <SampleGrid samples={selectedClass.samples} type="text" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col items-center gap-6 p-8 overflow-y-auto neura-scrollbar">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">🏋️ Teach Your AI Words!</h2>
                        <p className="text-sm text-[#4a4455]">Your AI is learning to read! 📖</p>
                    </div>
                    <div className="w-full flex justify-center">
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} />
                    </div>
                </div>
            )}

            {mode.mode === 'test' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-extrabold text-[#630ed4] mb-1">🧪 Test Your AI!</h2>
                        <p className="text-sm text-[#4a4455]">Type something and see if your AI understands! 🎯</p>
                    </div>
                    <div className="w-full max-w-[520px] bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-[#dae2fd] shadow-sm">
                        <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type a word to test..." className="w-full px-4 py-3 text-sm font-semibold border-2 border-[#dae2fd] rounded-2xl focus:outline-none focus:border-[#630ed4] bg-white text-[#131b2e] placeholder:text-[#7b7487] mb-4" />
                        {modelLoading && <div className="flex items-center gap-2 px-4 py-2 bg-[#eaedff] rounded-xl animate-fade-in"><div className="w-4 h-4 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" /><span className="text-xs font-bold text-[#630ed4]">Loading model...</span></div>}
                        <TestPanel prediction={prediction} isProcessing={isProcessing}><div /></TestPanel>
                    </div>
                </div>
            )}
        </div>
    )
}
