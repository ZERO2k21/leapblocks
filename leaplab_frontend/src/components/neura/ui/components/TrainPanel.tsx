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
        <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Train Your Model</h3>
                <p className="text-sm text-gray-500">
                    {classCount} classes with {totalSamples} total samples
                </p>
            </div>

            <div className="flex gap-8 text-center">
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-violet-500">{classCount}</span>
                    <span className="text-xs text-gray-400 font-medium">Classes</span>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-blue-500">{totalSamples}</span>
                    <span className="text-xs text-gray-400 font-medium">Samples</span>
                </div>
            </div>

            {!canTrain && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-sm text-amber-700 font-medium">Need at least 2 classes with samples</span>
                </div>
            )}

            <button
                onClick={onTrain}
                disabled={!canTrain || isTraining}
                className={`relative flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 ${
                    canTrain && !isTraining
                        ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-xl shadow-violet-200 hover:shadow-2xl hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
                {isTraining ? (
                    <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        Training...
                    </>
                ) : (
                    <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                        Train Model
                    </>
                )}
            </button>

            {accuracy !== null && (
                <div className="flex flex-col items-center gap-2 animate-fade-in">
                    <div className="text-center">
                        <span className="text-sm text-gray-500">Training Accuracy</span>
                        <div className="text-4xl font-bold text-emerald-500">{Math.round(accuracy * 100)}%</div>
                    </div>
                    <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${accuracy * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
