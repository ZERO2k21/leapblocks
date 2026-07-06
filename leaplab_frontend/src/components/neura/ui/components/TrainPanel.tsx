import React, { useState, useEffect, useRef } from 'react'

interface TrainPanelProps {
    isTraining: boolean
    accuracy: number | null
    canTrain: boolean
    onTrain: () => void
    classCount: number
    totalSamples: number
}

export default function TrainPanel({ isTraining, accuracy, canTrain, onTrain, classCount, totalSamples }: TrainPanelProps) {
    const [progress, setProgress] = useState(0)
    const [showAccuracy, setShowAccuracy] = useState(false)
    const progressRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isTraining) {
            setProgress(0)
            setShowAccuracy(false)
            const startTime = Date.now()
            const duration = 1500 // 1.5 seconds

            progressRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime
                const pct = Math.min(100, (elapsed / duration) * 100)
                setProgress(pct)

                if (pct >= 100) {
                    if (progressRef.current) clearInterval(progressRef.current)
                }
            }, 16) // ~60fps
        } else if (!isTraining && accuracy !== null) {
            // Training complete — force progress to 100% immediately
            if (progressRef.current) clearInterval(progressRef.current)
            setProgress(100)
            // Show accuracy after a brief delay
            const timer = setTimeout(() => setShowAccuracy(true), 400)
            return () => clearTimeout(timer)
        }

        return () => {
            if (progressRef.current) clearInterval(progressRef.current)
        }
    }, [isTraining, accuracy])

    // Reset progress when accuracy becomes null (new training)
    useEffect(() => {
        if (accuracy === null) {
            setProgress(0)
            setShowAccuracy(false)
        }
    }, [accuracy])

    return (
        <div className="flex flex-col items-center gap-8 py-12">
            <div className="text-center">
                <h3 className="text-2xl font-black text-gray-800 mb-2" style={{
                    background: 'linear-gradient(135deg, #1e1b4b, #7C3AED)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Train Your Model</h3>
                <p className="text-sm text-gray-500 font-medium">
                    {classCount} classes with {totalSamples} total samples
                </p>
            </div>

            {/* Stats cards */}
            <div className="flex gap-6">
                <div className="flex flex-col items-center px-8 py-5 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 4px 24px rgba(124,58,237,0.08)'
                }}>
                    <span className="text-4xl font-black" style={{
                        background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{classCount}</span>
                    <span className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Classes</span>
                </div>
                <div className="w-px my-2" style={{ background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.2), transparent)' }} />
                <div className="flex flex-col items-center px-8 py-5 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 4px 24px rgba(59,130,246,0.08)'
                }}>
                    <span className="text-4xl font-black" style={{
                        background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{totalSamples}</span>
                    <span className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Samples</span>
                </div>
            </div>

            {/* Warning */}
            {!canTrain && !isTraining && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl" style={{
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-sm text-amber-700 font-bold">Need at least 2 classes with samples</span>
                </div>
            )}

            {/* Progress bar during training */}
            {(isTraining || (progress > 0 && !showAccuracy)) && (
                <div className="w-80 flex flex-col items-center gap-3">
                    <div className="w-full h-4 rounded-full overflow-hidden" style={{
                        background: 'rgba(124,58,237,0.08)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div
                            className="h-full rounded-full transition-all duration-100 ease-out"
                            style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #7C3AED, #3B82F6, #10B981)',
                                boxShadow: '0 2px 8px rgba(124,58,237,0.4)'
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold text-gray-600">
                            Training... {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            )}

            {/* Train button (hidden during training) */}
            {!isTraining && progress === 0 && (
                <button
                    onClick={onTrain}
                    disabled={!canTrain}
                    className={`relative flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-black transition-all duration-500 ${
                        canTrain
                            ? 'hover:scale-105 hover:shadow-2xl active:scale-95 cursor-pointer'
                            : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                    }`}
                    style={canTrain ? {
                        background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                        color: 'white',
                        boxShadow: '0 10px 40px rgba(124,58,237,0.35), inset 0 2px 0 rgba(255,255,255,0.2)'
                    } : {}}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                    Train Model
                </button>
            )}

            {/* Accuracy display */}
            {showAccuracy && accuracy !== null && (
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="relative w-36 h-36">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke="rgba(16,185,129,0.1)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke="url(#accuracyGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${accuracy * 264} 264`}
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10B981" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black" style={{
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>{Math.round(accuracy * 100)}%</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Accuracy</span>
                        </div>
                    </div>

                    {/* Train again button */}
                    <button
                        onClick={onTrain}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                            background: 'rgba(124,58,237,0.08)',
                            color: '#7C3AED',
                            border: '1px solid rgba(124,58,237,0.2)'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6" />
                            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                        </svg>
                        Train Again
                    </button>
                </div>
            )}
        </div>
    )
}
