import React from 'react'

interface TestPanelProps {
    prediction: { label: string; confidences: Record<string, number> } | null
    isProcessing: boolean
    children: React.ReactNode
}

export default function TestPanel({ prediction, isProcessing, children }: TestPanelProps) {
    const sortedConfidences = prediction
        ? Object.entries(prediction.confidences)
            .sort(([, a], [, b]) => b - a)
        : []

    const maxConfidence = sortedConfidences.length > 0 ? sortedConfidences[0][1] : 0

    const getColorForConfidence = (confidence: number) => {
        if (confidence >= 0.7) return 'from-emerald-400 to-green-500'
        if (confidence >= 0.4) return 'from-amber-400 to-orange-500'
        return 'from-red-400 to-pink-500'
    }

    return (
        <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Test Your Model</h3>
                <p className="text-sm text-gray-500">Give input and see what the model predicts!</p>
            </div>

            <div className="w-full">
                {children}
            </div>

            {isProcessing && (
                <div className="flex items-center gap-2 text-violet-500">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Analyzing...</span>
                </div>
            )}

            {prediction && !isProcessing && (
                <div className="w-full max-w-md animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="text-center mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Prediction</p>
                            <p className="text-2xl font-bold text-gray-800">{prediction.label}</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <span className="text-sm text-gray-400">Confidence:</span>
                                <span className="text-sm font-bold text-violet-500">
                                    {Math.round(maxConfidence * 100)}%
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {sortedConfidences.map(([label, confidence]) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600 w-20 truncate">{label}</span>
                                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${getColorForConfidence(confidence)} transition-all duration-700 ease-out`}
                                            style={{ width: `${confidence * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 w-10 text-right">
                                        {Math.round(confidence * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!prediction && !isProcessing && (
                <div className="flex flex-col items-center py-8 text-gray-300">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <p className="text-sm font-medium">No prediction yet</p>
                    <p className="text-xs">Use the input above to test your model</p>
                </div>
            )}
        </div>
    )
}
