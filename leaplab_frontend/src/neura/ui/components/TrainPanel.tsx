import React, { useState, useEffect, useRef } from 'react'

interface TrainPanelProps {
    isTraining: boolean
    accuracy: number | null
    canTrain: boolean
    onTrain: (epochs: number) => void
    classCount: number
    totalSamples: number
    warningTitle?: string
    warningDesc?: string
    trainingError?: string | null
    currentEpoch?: number
    totalEpochs?: number
    sampleType?: string
}

const ENCOURAGEMENTS = [
    'Your AI is learning! 🧠',
    'Almost there! ⏳',
    'Getting smarter! 💡',
    'AI brain growing! 🌱',
    'Learning in progress! 🚀'
]

export default function TrainPanel({
    isTraining,
    accuracy,
    canTrain,
    onTrain,
    classCount,
    totalSamples,
    warningTitle,
    warningDesc,
    trainingError,
    currentEpoch = 0,
    totalEpochs = 50,
    sampleType = 'pictures'
}: TrainPanelProps) {
    const [progress, setProgress] = useState(0)
    const [displayAccuracy, setDisplayAccuracy] = useState(0)
    const [epochs, setEpochs] = useState(totalEpochs)
    const [encouragement, setEncouragement] = useState('Ready to train your AI! 🎯')

    const circleCircumference = 2 * Math.PI * 88

    useEffect(() => {
        if (isTraining) {
            setEncouragement(ENCOURAGEMENTS[currentEpoch % ENCOURAGEMENTS.length])
            setProgress((currentEpoch / epochs) * 100)
        } else if (!isTraining && accuracy !== null) {
            setProgress(100)
            setEncouragement('Training Complete! 🎉')
            const timer = setTimeout(() => {
                const target = Math.round(accuracy * 100)
                const duration = 800
                const startTime = Date.now()
                const counterInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime
                    const pct = Math.min(1, elapsed / duration)
                    setDisplayAccuracy(Math.round(target * (1 - Math.pow(1 - pct, 3))))
                    if (pct >= 1) clearInterval(counterInterval)
                }, 16)
            }, 400)
            return () => clearTimeout(timer)
        } else {
            setProgress(0)
            setDisplayAccuracy(0)
            setEncouragement('Ready to train your AI! 🎯')
        }
    }, [isTraining, accuracy, currentEpoch, epochs])

    const getProgressOffset = () => circleCircumference - (progress / 100) * circleCircumference

    const epochPresets = [10, 25, 50, 100]

    return (
        <div className="animate-fade-in flex flex-col items-center" style={{ height: '100%' }}>
            {/* Header - centered */}
            <div className="w-full flex flex-col items-center mb-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">
                    {isTraining ? '🧠 Teaching Time!' : accuracy !== null ? '🎉 Training Complete!' : '🤖 Ready to Train!'}
                </h2>
                <p className="text-xs text-[#4a4455]">
                    {isTraining
                        ? `Teaching round ${currentEpoch} of ${epochs}`
                        : accuracy !== null
                            ? `Accuracy: ${displayAccuracy}%`
                            : `Learning from ${totalSamples} ${sampleType} across ${classCount} classes`}
                </p>
            </div>

            {/* Horizontal split */}
            <div className="w-full flex flex-col md:flex-row gap-4" style={{ flex: 1, minHeight: 0 }}>
                {/* Left half - Training visualization */}
                <div
                    className="flex-1 min-w-0"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '20px',
                        padding: '24px 20px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* AI Brain */}
                    <div className="relative flex flex-col items-center z-10">
                        {/* Icon with animated gradient ring */}
                        <div className="relative" style={{ marginBottom: '20px' }}>
                            {/* Spinning gradient ring */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '-8px',
                                    borderRadius: '50%',
                                    background: isTraining
                                        ? 'conic-gradient(from 0deg, #630ed4, #c084fc, #818cf8, #630ed4)'
                                        : accuracy !== null
                                            ? 'conic-gradient(from 0deg, #059669, #34d399, #10b981, #059669)'
                                            : 'conic-gradient(from 0deg, #e5e7eb, #f3f4f6, #e5e7eb, #f3f4f6, #e5e7eb)',
                                    animation: isTraining ? 'spin 3s linear infinite' : 'none',
                                    opacity: isTraining || accuracy !== null ? 0.85 : 0.35,
                                }}
                            />
                            {/* White spacer ring */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '-3px',
                                    borderRadius: '50%',
                                    background: '#fff',
                                }}
                            />
                            {/* Icon circle */}
                            <div
                                className={`relative flex items-center justify-center transition-transform duration-300 ${isTraining ? 'animate-pulse' : ''}`}
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: isTraining
                                        ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)'
                                        : accuracy !== null
                                            ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
                                            : 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                                }}
                            >
                                <span style={{ fontSize: '2.8rem' }}>{isTraining ? '🧠' : accuracy !== null ? '🎉' : '🤖'}</span>
                            </div>
                            {/* SVG progress ring overlay */}
                            {(isTraining || accuracy !== null) && (
                                <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle
                                        cx="50" cy="50" r="47"
                                        fill="transparent"
                                        stroke={accuracy !== null ? '#059669' : '#630ed4'}
                                        strokeWidth="4"
                                        strokeDasharray={2 * Math.PI * 47}
                                        strokeDashoffset={2 * Math.PI * 47 - (progress / 100) * 2 * Math.PI * 47}
                                        strokeLinecap="round"
                                        className="transition-[stroke-dashoffset] duration-[350ms] ease-out"
                                        style={{ opacity: 0.9 }}
                                    />
                                </svg>
                            )}
                        </div>

                        {/* Train button */}
                        <button
                            onClick={() => onTrain(epochs)}
                            disabled={!canTrain || isTraining}
                            className="flex items-center gap-2 transition-all duration-200"
                            style={{
                                padding: '12px 32px',
                                borderRadius: '14px',
                                fontSize: '14px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: canTrain && !isTraining ? 'pointer' : 'not-allowed',
                                background: canTrain && !isTraining
                                    ? 'linear-gradient(135deg, #630ed4, #7c3aed)'
                                    : isTraining
                                        ? 'linear-gradient(135deg, #630ed4, #7c3aed)'
                                        : '#e5e7eb',
                                color: canTrain && !isTraining ? '#fff' : isTraining ? 'rgba(255,255,255,0.9)' : '#9ca3af',
                                boxShadow: canTrain && !isTraining
                                    ? '0 6px 24px rgba(99,14,212,0.3)'
                                    : isTraining
                                        ? '0 4px 16px rgba(99,14,212,0.2)'
                                        : 'none',
                                opacity: !canTrain && !isTraining ? 0.5 : 1,
                                letterSpacing: '0.02em',
                            }}
                        >
                            {isTraining ? (
                                <>
                                    <div
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            border: '2px solid rgba(255,255,255,0.4)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                        }}
                                    />
                                    <span>Teaching... ({currentEpoch}/{epochs})</span>
                                </>
                            ) : accuracy !== null ? (
                                <>
                                    <span style={{ fontSize: '16px' }}>🧪</span>
                                    <span>Test Your AI!</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '16px' }}>🚀</span>
                                    <span>Start Teaching!</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right half - Settings */}
                <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Epochs */}
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '14px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#4a4455', letterSpacing: '0.05em', textTransform: 'uppercase' }}>🔄 Training Rounds</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#630ed4' }}>{epochs}</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="150"
                            value={epochs}
                            onChange={(e) => setEpochs(parseInt(e.target.value))}
                            disabled={isTraining}
                            style={{
                                width: '100%',
                                height: '6px',
                                borderRadius: '3px',
                                accentColor: '#630ed4',
                                opacity: isTraining ? 0.5 : 1,
                            }}
                        />
                        <div className="flex flex-wrap" style={{ gap: '5px', marginTop: '8px' }}>
                            {epochPresets.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setEpochs(preset)}
                                    disabled={isTraining}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: isTraining ? 'not-allowed' : 'pointer',
                                        background: epochs === preset ? '#630ed4' : '#ede9fe',
                                        color: epochs === preset ? '#fff' : '#4a4455',
                                        transition: 'all 0.15s ease',
                                        opacity: isTraining ? 0.5 : 1,
                                    }}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '9px', color: '#7b7487', marginTop: '6px' }}>More rounds = smarter AI but takes longer ⏱️</p>
                    </div>

                    {/* Progress */}
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '14px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#4a4455', letterSpacing: '0.05em', textTransform: 'uppercase' }}>📊 Progress</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#630ed4' }}>{isTraining || accuracy !== null ? Math.round(progress) : 0}%</span>
                        </div>
                        <div style={{ width: '100%', background: '#ede9fe', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    borderRadius: '4px',
                                    background: accuracy !== null ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #630ed4, #7c3aed)',
                                    width: `${isTraining || accuracy !== null ? progress : 0}%`,
                                    transition: 'width 0.3s ease',
                                }}
                            />
                        </div>
                        <p style={{ fontSize: '11px', color: '#4a4455', marginTop: '6px', fontStyle: 'italic' }}>
                            {isTraining ? (
                                <>Round <span style={{ fontWeight: 700, color: '#131b2e' }}>{currentEpoch}</span> of <span style={{ fontWeight: 700, color: '#131b2e' }}>{epochs}</span></>
                            ) : accuracy !== null ? (
                                <span style={{ fontWeight: 700, color: '#059669' }}>✅ Complete!</span>
                            ) : (
                                <>Est. ~{Math.round(epochs * 0.9)} seconds</>
                            )}
                        </p>
                    </div>

                    {/* Accuracy */}
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '14px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                            <span style={{ fontSize: '18px' }}>🎯</span>
                            <div>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#4a4455', textTransform: 'uppercase', display: 'block' }}>Accuracy</span>
                                <span style={{ fontSize: '16px', fontWeight: 800, color: accuracy !== null ? '#059669' : '#9ca3af' }}>
                                    {accuracy !== null ? `${displayAccuracy || Math.round(accuracy * 100)}%` : '—'}
                                </span>
                            </div>
                        </div>
                        <p style={{ fontSize: '10px', color: '#6b7280' }}>How smart your AI is! 🧠</p>
                    </div>
                </div>
            </div>

            {/* Warning */}
            {!canTrain && warningTitle && (
                <div
                    className="flex items-center animate-fade-in shadow-sm"
                    style={{
                        gap: '10px',
                        padding: '12px 16px',
                        background: '#fffbeb',
                        borderRadius: '16px',
                        border: '1px solid #fde68a',
                        width: '100%',
                        maxWidth: '760px',
                        margin: '16px auto 0',
                    }}
                >
                    <span style={{ fontSize: '18px' }}>⚠️</span>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', margin: 0 }}>{warningTitle}</p>
                        <p style={{ fontSize: '11px', color: '#d97706', margin: 0 }}>{warningDesc}</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {trainingError && (
                <div
                    className="flex items-center animate-fade-in shadow-sm"
                    style={{
                        gap: '10px',
                        padding: '12px 16px',
                        background: '#fef2f2',
                        borderRadius: '16px',
                        border: '1px solid #fecaca',
                        width: '100%',
                        maxWidth: '760px',
                        margin: '16px auto 0',
                    }}
                >
                    <span style={{ fontSize: '18px' }}>❌</span>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#991b1b', margin: 0 }}>{trainingError}</p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #630ed4;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #630ed4;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    )
}
