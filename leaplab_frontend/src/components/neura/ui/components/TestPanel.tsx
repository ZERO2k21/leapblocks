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

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.7) return { bar: 'from-emerald-400 to-green-500', text: 'text-emerald-500', bg: 'bg-emerald-50' }
        if (confidence >= 0.4) return { bar: 'from-amber-400 to-orange-500', text: 'text-amber-500', bg: 'bg-amber-50' }
        return { bar: 'from-red-400 to-pink-500', text: 'text-red-500', bg: 'bg-red-50' }
    }

    return (
        <div className="w-full max-w-lg">
            {children}

            {/* Processing indicator */}
            {isProcessing && (
                <div className="flex items-center justify-center gap-3 py-6 animate-[fade-in_0.2s_ease-out]">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '100ms', animationDuration: '0.6s' }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.6s' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-500">Analyzing...</span>
                </div>
            )}

            {/* Prediction result */}
            {prediction && !isProcessing && (
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 animate-[scale-in_0.35s_cubic-bezier(0.34,1.56,0.64,1)]" style={{
                    boxShadow: maxConfidence >= 0.7
                        ? '0 8px 32px rgba(16,185,129,0.12), 0 0 0 1px rgba(16,185,129,0.08)'
                        : '0 8px 32px rgba(0,0,0,0.06)'
                }}>
                    {/* Main prediction */}
                    <div className="text-center mb-6">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Prediction</p>
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-50 to-blue-50 rounded-2xl" style={{
                            animation: 'glow-pulse 2s ease-in-out infinite'
                        }}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {prediction.label.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-2xl font-bold text-gray-800">{prediction.label}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-sm text-gray-400">Confidence</span>
                            <span className={`text-lg font-bold ${getConfidenceColor(maxConfidence).text}`}>
                                {Math.round(maxConfidence * 100)}%
                            </span>
                        </div>
                    </div>

                    {/* Confidence bars */}
                    <div className="space-y-3">
                        {sortedConfidences.map(([label, confidence], index) => {
                            const colors = getConfidenceColor(confidence)
                            return (
                                <div key={label} className="flex items-center gap-3 animate-[stagger-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]" style={{ animationDelay: `${index * 50}ms` }}>
                                    <span className="text-xs font-semibold text-gray-600 w-24 truncate capitalize">{label}</span>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700 ease-out`}
                                            style={{
                                                width: `${confidence * 100}%`,
                                                boxShadow: confidence >= 0.7 ? '0 0 8px rgba(16,185,129,0.3)' : undefined
                                            }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold ${colors.text} w-12 text-right`}>
                                        {Math.round(confidence * 100)}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!prediction && !isProcessing && (
                <div className="flex flex-col items-center py-10 text-gray-300">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-400">Waiting for input</p>
                    <p className="text-xs text-gray-300 mt-1">Use the input above to test</p>
                </div>
            )}
        </div>
    )
}
