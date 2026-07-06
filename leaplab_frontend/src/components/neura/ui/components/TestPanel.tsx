import React from 'react'

interface TestPanelProps {
    prediction: { label: string; confidences: Record<string, number> } | null
    isProcessing: boolean
    children: React.ReactNode
    projectName?: string
}

export default function TestPanel({ prediction, isProcessing, children, projectName }: TestPanelProps) {
    const sortedConfidences = prediction
        ? Object.entries(prediction.confidences)
            .sort(([, a], [, b]) => b - a)
        : []

    const maxConfidence = sortedConfidences.length > 0 ? sortedConfidences[0][1] : 0

    const getColorForConfidence = (confidence: number) => {
        if (confidence >= 0.7) return { gradient: 'from-emerald-400 to-green-500', color: '#10B981' }
        if (confidence >= 0.4) return { gradient: 'from-amber-400 to-orange-500', color: '#F59E0B' }
        return { gradient: 'from-red-400 to-pink-500', color: '#EF4444' }
    }

    const handleDownloadReport = () => {
        if (!prediction) return

        const report = {
            projectName: projectName || 'Classifier',
            prediction: prediction.label,
            confidence: Math.round(maxConfidence * 100),
            allConfidences: Object.fromEntries(
                Object.entries(prediction.confidences).map(([k, v]) => [k, Math.round(v * 100)])
            ),
            timestamp: new Date().toISOString(),
            model: 'KNN Classifier',
            framework: 'TensorFlow.js'
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `test-report-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
                <h3 className="text-2xl font-black text-gray-800 mb-1" style={{
                    background: 'linear-gradient(135deg, #1e1b4b, #10B981)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Test Your Model</h3>
                <p className="text-sm text-gray-500 font-medium">Give input and see what the model predicts!</p>
            </div>

            <div className="w-full">
                {children}
            </div>

            {/* Processing indicator */}
            {isProcessing && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl" style={{
                    background: 'rgba(124,58,237,0.06)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold text-violet-600">Analyzing...</span>
                </div>
            )}

            {/* Prediction result */}
            {prediction && !isProcessing && (
                <div className="w-full max-w-md animate-fade-in">
                    <div className="rounded-2xl p-6" style={{
                        background: 'rgba(255,255,255,0.65)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}>
                        {/* Gradient header strip */}
                        <div className="h-1 rounded-full mb-5" style={{
                            background: 'linear-gradient(90deg, #10B981, #3B82F6, #7C3AED)'
                        }} />

                        <div className="text-center mb-5">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Prediction</p>
                            <p className="text-3xl font-black text-gray-800">{prediction.label}</p>
                            <div className="flex items-center justify-center gap-2 mt-2 px-4 py-1.5 rounded-full mx-auto" style={{
                                background: 'rgba(124,58,237,0.06)',
                                border: '1px solid rgba(124,58,237,0.15)'
                            }}>
                                <span className="text-xs text-gray-500 font-medium">Confidence:</span>
                                <span className="text-sm font-black" style={{
                                    background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {Math.round(maxConfidence * 100)}%
                                </span>
                            </div>
                        </div>

                        {/* Confidence bars */}
                        <div className="space-y-3">
                            {sortedConfidences.map(([label, confidence]) => {
                                const { color } = getColorForConfidence(confidence)
                                return (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-600 w-20 truncate">{label}</span>
                                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{
                                            background: 'rgba(0,0,0,0.04)',
                                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                        }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out"
                                                style={{
                                                    width: `${confidence * 100}%`,
                                                    background: `linear-gradient(90deg, ${color}CC, ${color})`,
                                                    boxShadow: `0 2px 8px ${color}30`
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-gray-500 w-10 text-right">
                                            {Math.round(confidence * 100)}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Download Report Button */}
                        <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <button
                                onClick={handleDownloadReport}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                                    color: 'white',
                                    boxShadow: '0 4px 16px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download Report (JSON)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!prediction && !isProcessing && (
                <div className="flex flex-col items-center py-10 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '2px dashed rgba(124,58,237,0.12)'
                }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
                        background: 'rgba(124,58,237,0.05)'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-400">No prediction yet</p>
                    <p className="text-xs text-gray-300 mt-1">Use the input above to test your model</p>
                </div>
            )}
        </div>
    )
}
