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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', padding: '16px 20px 8px', flexShrink: 0 }} className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📝</div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#630ed4' }}>Word Wizard!</h2>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>Type words to teach your AI to read! 🔤</p>
                    </div>

                    <div style={{ padding: '0 20px', flexShrink: 0 }}>
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', overflow: 'hidden' }}>
                        {/* Input card */}
                        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <input
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddText() }}
                                    placeholder="Type something..."
                                    style={{ flex: 1, padding: '12px 16px', fontSize: '14px', fontWeight: 600, border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', background: '#fff', color: '#131b2e' }}
                                    onFocus={(e) => e.target.style.borderColor = '#630ed4'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                                <button onClick={handleAddText} disabled={!textInput.trim() || !mode.selectedClassId || atSampleLimit} style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: !textInput.trim() || !mode.selectedClassId || atSampleLimit ? 'not-allowed' : 'pointer',
                                    background: !textInput.trim() || !mode.selectedClassId || atSampleLimit ? '#e5e7eb' : 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                    color: !textInput.trim() || !mode.selectedClassId || atSampleLimit ? '#9ca3af' : '#fff',
                                    transition: 'all 0.2s'
                                }}>➕ Add</button>
                            </div>

                            {selectedClass && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ede9fe' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedClass.color }} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#630ed4' }}>Adding to: {selectedClass.name}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, marginLeft: 'auto', padding: '2px 8px', background: selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS ? '#fef3c7' : '#fff', borderRadius: '6px', color: selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS ? '#c32c00' : '#630ed4' }}>
                                        {selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Samples */}
                        {selectedClass && (
                            <div style={{ flex: 1, marginTop: '12px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedClass.color }} />
                                        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#131b2e' }}>{selectedClass.name}</h3>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#f5f3ff', color: '#630ed4' }}>{selectedClass.samples.length} texts</span>
                                </div>
                                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                    <SampleGrid samples={selectedClass.samples} type="text" onRemove={(id) => mode.removeSample(selectedClass.id, id)} />
                                </div>
                            </div>
                        )}
                        {selectedClass && selectedClass.samples.length === 0 && (
                            <div style={{ flex: 1, marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📝</div>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>Type something above to start!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mode.mode === 'train' && (
                <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar" style={{ padding: '12px 20px' }}>
                    <div className="w-full" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <TrainPanel isTraining={isTraining} accuracy={mode.accuracy} canTrain={canTrain} onTrain={handleTrain} classCount={mode.project?.classes.length || 0} totalSamples={mode.getTotalSamples()} sampleType="texts" mode={mode.mode} onModeChange={mode.setMode} />
                    </div>
                </div>
            )}

            {mode.mode === 'test' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', padding: '16px 20px 8px', flexShrink: 0 }} className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🧪</div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#630ed4' }}>Test Your AI!</h2>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>Type something and see if your AI understands! 🎯</p>
                    </div>

                    <div style={{ padding: '0 20px', flexShrink: 0 }}>
                        <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: '12px', overflow: 'hidden' }}>
                        {/* Input card */}
                        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                            <input
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Type a word to test..."
                                style={{ width: '100%', padding: '12px 16px', fontSize: '14px', fontWeight: 600, border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', background: '#fff', color: '#131b2e' }}
                                onFocus={(e) => e.target.style.borderColor = '#630ed4'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                            {modelLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 12px', background: '#f5f3ff', borderRadius: '10px' }}>
                                    <div style={{ width: '14px', height: '14px', border: '2px solid #630ed4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#630ed4' }}>Loading model...</span>
                                </div>
                            )}
                        </div>

                        {/* Results area */}
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            {isProcessing && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <div style={{ width: '48px', height: '48px', border: '3px solid #e5e7eb', borderTopColor: '#630ed4', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>Analyzing... 🔍</p>
                                </div>
                            )}
                            {!isProcessing && prediction && (
                                <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                        <p style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>🎯 Prediction</p>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                                                {prediction.label.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e' }}>{prediction.label}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Confidence</span>
                                            <span style={{ fontSize: '14px', fontWeight: 800, color: (Object.values(prediction.confidences)[0] || 0) >= 0.7 ? '#059669' : (Object.values(prediction.confidences)[0] || 0) >= 0.4 ? '#d97706' : '#dc2626' }}>
                                                {Math.round((Object.values(prediction.confidences)[0] || 0) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a).map(([label, confidence]) => {
                                            const val = Math.round(confidence * 100)
                                            return (
                                                <div key={label}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>{label}</span>
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>{val}%</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', borderRadius: '3px', background: confidence >= 0.7 ? 'linear-gradient(90deg, #34d399, #10b981)' : confidence >= 0.4 ? 'linear-gradient(90deg, #fbbf24, #d97706)' : 'linear-gradient(90deg, #fca5a5, #ef4444)', width: `${val}%`, transition: 'width 0.5s ease' }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            {!isProcessing && !prediction && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', border: '2px dashed #c4b5fd' }}>
                                        <span style={{ fontSize: '20px' }}>🤔</span>
                                    </div>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>Type something above!</p>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Your AI is ready to predict</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
