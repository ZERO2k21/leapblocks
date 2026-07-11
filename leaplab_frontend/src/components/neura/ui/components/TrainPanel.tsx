import React, { useState, useEffect, useRef } from 'react'

interface TrainPanelProps {
    isTraining: boolean
    accuracy: number | null
    canTrain: boolean
    onTrain: () => void
    classCount: number
    totalSamples: number
    warningTitle?: string
    warningDesc?: string
    trainingError?: string | null
}

export default function TrainPanel({ isTraining, accuracy, canTrain, onTrain, classCount, totalSamples, warningTitle, warningDesc, trainingError }: TrainPanelProps) {
    const [progress, setProgress] = useState(0)
    const [showAccuracy, setShowAccuracy] = useState(false)
    const [displayAccuracy, setDisplayAccuracy] = useState(0)
    const [statusText, setStatusText] = useState('Ready to Train')
    const [statusSubtext, setStatusSubtext] = useState(`Learning from ${totalSamples} images across ${classCount} classes`)
    const progressRef = useRef<NodeJS.Timeout | null>(null)
    const particleIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const circleCircumference = 2 * Math.PI * 88

    useEffect(() => {
        if (isTraining) {
            setProgress(0)
            setShowAccuracy(false)
            setStatusText('Analyzing Patterns')
            setStatusSubtext('Your neural network is learning...')
            const startTime = Date.now()
            const duration = 1500

            progressRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime
                const pct = Math.min(100, (elapsed / duration) * 100)
                setProgress(pct)

                if (pct >= 100) {
                    if (progressRef.current) clearInterval(progressRef.current)
                }
            }, 16)

            // Particle generation during training
            particleIntervalRef.current = setInterval(() => {
                // Particles are CSS-animated, this is just a trigger
            }, 500)
        } else if (!isTraining && accuracy !== null) {
            if (progressRef.current) clearInterval(progressRef.current)
            if (particleIntervalRef.current) clearInterval(particleIntervalRef.current)
            setProgress(100)
            setStatusText('Training Complete!')
            setStatusSubtext(`Accuracy reached ${Math.round(accuracy * 100)}%`)

            const timer = setTimeout(() => {
                setShowAccuracy(true)
                const target = Math.round(accuracy * 100)
                const duration = 800
                const startTime = Date.now()
                const counterInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime
                    const pct = Math.min(1, elapsed / duration)
                    const eased = 1 - Math.pow(1 - pct, 3)
                    setDisplayAccuracy(Math.round(target * eased))
                    if (pct >= 1) clearInterval(counterInterval)
                }, 16)
            }, 400)
            return () => clearTimeout(timer)
        }

        return () => {
            if (progressRef.current) clearInterval(progressRef.current)
            if (particleIntervalRef.current) clearInterval(particleIntervalRef.current)
        }
    }, [isTraining, accuracy])

    useEffect(() => {
        if (accuracy === null) {
            setProgress(0)
            setShowAccuracy(false)
            setStatusText('Ready to Train')
            setStatusSubtext(`Learning from ${totalSamples} images across ${classCount} classes`)
        }
    }, [accuracy, totalSamples, classCount])

    const getProgressOffset = () => {
        return circleCircumference - (progress / 100) * circleCircumference
    }

    return (
        <div className="w-full max-w-6xl mx-auto animate-[fade-in_0.4s_ease-out]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left: Training Visualization */}
                <div className="lg:col-span-8 relative rounded-3xl p-8 min-h-[480px] flex flex-col items-center justify-center overflow-hidden" style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '2px solid rgba(124, 58, 237, 0.1)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.08)'
                }}>

                    {/* Particle Container */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {isTraining && (
                            <>
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center border border-primary/10"
                                        style={{
                                            left: `${10 + Math.random() * 80}%`,
                                            top: `${10 + Math.random() * 80}%`,
                                            animation: `float-into-brain 2.5s infinite linear ${i * 0.4}s`,
                                            opacity: 0
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Brain/Model Core */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Circular Brain Visualization */}
                        <div className={`w-48 h-48 rounded-full bg-surface-container-lowest shadow-2xl flex items-center justify-center relative mb-8 group transition-transform duration-500 hover:scale-105 ${isTraining ? 'training-glow' : ''}`} style={{
                            filter: isTraining ? 'drop-shadow(0 0 15px rgba(99, 14, 212, 0.4))' : 'none'
                        }}>
                            {/* Spinning dashed border */}
                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30" style={{
                                animation: 'spin 12s linear infinite'
                            }} />

                            {/* Progress ring */}
                            <svg className="w-full h-full absolute -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    fill="transparent"
                                    stroke="#7c3aed"
                                    strokeWidth="8"
                                    strokeDasharray={circleCircumference}
                                    strokeDashoffset={isTraining || accuracy !== null ? getProgressOffset() : circleCircumference}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 0.35s ease-out' }}
                                />
                            </svg>

                            {/* Brain icon */}
                            <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 group-hover:scale-110" style={{ fill: 'rgba(124, 58, 237, 0.1)' }}>
                                <path d="M12 2a4 4 0 0 0-4 4c0 .34.05.67.13.99A3.5 3.5 0 0 0 5 10.5a3.5 3.5 0 0 0 2.26 3.27A2 2 0 0 0 9 16h1v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-4h1a2 2 0 0 0 2-2.23A3.5 3.5 0 0 0 19 10.5a3.5 3.5 0 0 0-3.13-3.51A4 4 0 0 0 12 2z" />
                                <path d="M12 2v20" />
                                <circle cx="12" cy="10" r="2" fill="#7c3aed" />
                            </svg>
                        </div>

                        {/* Status Text */}
                        <h2 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {statusText}
                        </h2>
                        <p className="text-on-surface-variant text-center max-w-sm">
                            {statusSubtext}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="mt-10 z-20">
                        <button
                            onClick={onTrain}
                            disabled={!canTrain || isTraining}
                            className={`px-12 py-4 rounded-full text-lg font-bold transition-all duration-300 flex items-center gap-3 shadow-xl ${
                                canTrain && !isTraining
                                    ? 'bg-primary text-on-primary hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    : isTraining
                                        ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            {isTraining ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Training...</span>
                                </>
                            ) : accuracy !== null ? (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                    </svg>
                                    <span>Test Model</span>
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                    <span>Start Training</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Detailed Stats */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Overall Progress Card */}
                    <div className="rounded-2xl p-6 shadow-md" style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(12px)',
                        borderLeft: '4px solid #7c3aed'
                    }}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                OVERALL PROGRESS
                            </span>
                            <span className="text-2xl font-bold text-primary">
                                {isTraining || accuracy !== null ? Math.round(progress) : 0}%
                            </span>
                        </div>
                        <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${isTraining || accuracy !== null ? progress : 0}%`,
                                    background: '#7c3aed',
                                    boxShadow: '0 0 8px rgba(124, 58, 237, 0.5)'
                                }}
                            />
                        </div>
                        <p className="text-sm text-on-surface-variant mt-3 italic">
                            Estimating time: <span className="font-bold text-on-surface">
                                {isTraining ? `~${Math.max(0, Math.round((100 - progress) * 0.45))} seconds` : accuracy !== null ? 'Complete' : '~45 seconds'}
                            </span>
                        </p>
                    </div>

                    {/* Model Accuracy Card */}
                    <div className="rounded-2xl p-6 shadow-md" style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(12px)',
                        borderLeft: '4px solid #006c44'
                    }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#25fea8' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006c44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-on-surface-variant uppercase block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    MODEL ACCURACY
                                </span>
                                <span className="text-2xl font-bold" style={{ color: '#006c44' }}>
                                    {showAccuracy ? `${displayAccuracy}%` : accuracy !== null ? `${Math.round(accuracy * 100)}%` : '0.0%'}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                            Performance metrics of the current neural network.
                        </p>
                    </div>

                    {/* Dataset Pulse Card */}
                    <div className="rounded-2xl p-6" style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid #ccc3d8'
                    }}>
                        <h3 className="text-xs font-semibold text-on-surface-variant mb-4 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            DATASET PULSE
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-on-surface-variant">Class Balance</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#25fea8', color: '#006c44' }}>
                                    GREAT
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-on-surface-variant">Augmentation</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#7c3aed', color: '#ede0ff' }}>
                                    ENABLED
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-on-surface-variant">Epochs</span>
                                <span className="text-sm font-bold text-on-surface">50</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Warning */}
            {!canTrain && warningTitle && (
                <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-tertiary/10 rounded-2xl border border-tertiary/20 animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
                    <div className="w-8 h-8 rounded-lg bg-tertiary-container flex items-center justify-center flex-shrink-0 animate-pulse" style={{ animationDuration: '2s' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffdfd7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface font-semibold">{warningTitle}</p>
                        <p className="text-xs text-on-surface-variant">{warningDesc}</p>
                    </div>
                </div>
            )}

            {/* Training Error */}
            {trainingError && (
                <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-error/10 rounded-2xl border border-error/20 animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
                    <div className="w-8 h-8 rounded-lg bg-error-container flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-on-error-container font-semibold">{trainingError}</p>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes float-into-brain {
                    0% { transform: translate(0, 0) scale(1); opacity: 0; }
                    20% { opacity: 0.8; }
                    80% { opacity: 0.8; }
                    100% { transform: translate(calc(50vw - 50%), calc(50vh - 50%)) scale(0.2); opacity: 0; }
                }
                .training-glow {
                    filter: drop-shadow(0 0 15px rgba(99, 14, 212, 0.4));
                }
            `}</style>
        </div>
    )
}
