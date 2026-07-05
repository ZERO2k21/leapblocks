import React from 'react'

interface TrainPanelProps {
    isTraining: boolean
    accuracy: number | null
    canTrain: boolean
    onTrain: () => void
    classCount: number
    totalSamples: number
}

export default function TrainPanel({ isTraining, accuracy, canTrain, onTrain, classCount, totalSamples }: TrainPanelProps) {
    return (
        <div className="flex flex-col items-center gap-8 py-10 px-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full mx-auto">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Train Your Model</h3>
                <p className="text-sm text-gray-400">
                    Teach AI to recognize your classes
                </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-violet-500">{classCount}</span>
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Classes</span>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-blue-500">{totalSamples}</span>
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Samples</span>
                </div>
            </div>

            {/* Warning */}
            {!canTrain && (
                <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 rounded-2xl border border-amber-200 w-full">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-amber-700 font-semibold">Not enough data</p>
                        <p className="text-xs text-amber-600">Add at least 2 classes with samples</p>
                    </div>
                </div>
            )}

            {/* Train button */}
            <button
                onClick={onTrain}
                disabled={!canTrain || isTraining}
                className={`relative w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-lg font-bold transition-all duration-300 ${
                    canTrain && !isTraining
                        ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 text-white shadow-xl shadow-violet-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
                {isTraining ? (
                    <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Training Model...</span>
                    </>
                ) : (
                    <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                        <span>Train Model</span>
                    </>
                )}

                {/* Shimmer effect */}
                {canTrain && !isTraining && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                )}
            </button>

            {/* Accuracy result */}
            {accuracy !== null && !isTraining && (
                <div className="w-full animate-fade-in">
                    <div className="text-center mb-4">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Training Accuracy</span>
                        <div className="flex items-baseline justify-center gap-1 mt-1">
                            <span className="text-5xl font-bold text-emerald-500">{Math.round(accuracy * 100)}</span>
                            <span className="text-2xl font-bold text-emerald-400">%</span>
                        </div>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${accuracy * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        {accuracy >= 0.9 ? 'Excellent! Ready to test!' : accuracy >= 0.7 ? 'Good! Try adding more samples.' : 'Add more samples to improve.'}
                    </p>
                </div>
            )}
        </div>
    )
}
