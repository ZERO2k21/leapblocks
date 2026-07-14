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
    totalEpochs = 50
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
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Main training visualization */}
                <div className="flex-1 w-full bg-white/70 backdrop-blur-sm rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] border border-[#dae2fd] shadow-sm relative overflow-hidden">
                    {/* AI Brain */}
                    <div className="relative flex flex-col items-center z-10">
                        <div className={`w-44 h-44 rounded-full bg-white shadow-xl flex items-center justify-center relative mb-6 transition-transform duration-300 ${isTraining ? 'animate-pulse' : ''}`}>
                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#630ed4]/20" style={{ animation: isTraining ? 'spin 12s linear infinite' : 'none' }} />
                            <svg className="w-full h-full absolute -rotate-90">
                                <circle cx="88" cy="88" r="78" fill="transparent" stroke={isTraining || accuracy !== null ? '#630ed4' : '#dae2fd'} strokeWidth="8" strokeDasharray={circleCircumference} strokeDashoffset={isTraining || accuracy !== null ? getProgressOffset() : circleCircumference} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-[350ms] ease-out" />
                            </svg>
                            <span className="text-6xl">{isTraining ? '🧠' : accuracy !== null ? '🎉' : '🤖'}</span>
                        </div>

                        <h2 className="text-2xl font-extrabold text-[#131b2e] mb-2">{encouragement}</h2>
                        <p className="text-sm text-[#4a4455] text-center max-w-sm">
                            {isTraining
                                ? `Teaching round ${currentEpoch} of ${epochs}`
                                : accuracy !== null
                                    ? `Accuracy: ${displayAccuracy}% — Your AI learned from ${totalSamples} pictures!`
                                    : `Learning from ${totalSamples} pictures across ${classCount} classes`}
                        </p>
                    </div>

                    {/* Train button */}
                    <div className="mt-8 z-10">
                        <button
                            onClick={() => onTrain(epochs)}
                            disabled={!canTrain || isTraining}
                            className={`px-10 py-4 rounded-2xl text-base font-bold transition-all duration-300 flex items-center gap-3 shadow-lg ${
                                canTrain && !isTraining
                                    ? 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white hover:shadow-xl hover:shadow-[#630ed4]/30 hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    : isTraining
                                        ? 'bg-[#630ed4]/50 text-white/70 cursor-not-allowed'
                                        : 'bg-[#dae2fd] text-[#7b7487] cursor-not-allowed'
                            }`}
                        >
                            {isTraining ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Teaching... ({currentEpoch}/{epochs})</span>
                                </>
                            ) : accuracy !== null ? (
                                <>
                                    <span>🧪</span>
                                    <span>Test Your AI!</span>
                                </>
                            ) : (
                                <>
                                    <span>🚀</span>
                                    <span>Start Teaching!</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sidebar settings */}
                <div className="w-full lg:w-64 space-y-4">
                    {/* Epochs */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-[#dae2fd] shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-[#4a4455] uppercase tracking-wider">🔄 Training Rounds</span>
                            <span className="text-xl font-extrabold text-[#630ed4]">{epochs}</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="150"
                            value={epochs}
                            onChange={(e) => setEpochs(parseInt(e.target.value))}
                            disabled={isTraining}
                            className="w-full h-2 bg-[#eaedff] rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-[#630ed4]"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {epochPresets.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setEpochs(preset)}
                                    disabled={isTraining}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                                        epochs === preset ? 'bg-[#630ed4] text-white' : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-[#7b7487] mt-2">More rounds = smarter AI but takes longer ⏱️</p>
                    </div>

                    {/* Progress */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-[#dae2fd] shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-[#4a4455] uppercase tracking-wider">📊 Progress</span>
                            <span className="text-xl font-extrabold text-[#630ed4]">{isTraining || accuracy !== null ? Math.round(progress) : 0}%</span>
                        </div>
                        <div className="w-full bg-[#eaedff] h-3 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#630ed4] to-[#7c3aed]" style={{ width: `${isTraining || accuracy !== null ? progress : 0}%` }} />
                        </div>
                        <p className="text-xs text-[#4a4455] mt-2 italic">
                            {isTraining ? (
                                <>Round <span className="font-bold text-[#131b2e]">{currentEpoch}</span> of <span className="font-bold text-[#131b2e]">{epochs}</span></>
                            ) : accuracy !== null ? (
                                <span className="font-bold text-[#006c44]">✅ Complete!</span>
                            ) : (
                                <>Est. ~{Math.round(epochs * 0.9)} seconds</>
                            )}
                        </p>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-[#dae2fd] shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🎯</span>
                            <div>
                                <span className="text-[10px] font-bold text-[#4a4455] uppercase block">Accuracy</span>
                                <span className="text-lg font-extrabold text-[#006c44]">
                                    {accuracy !== null ? `${displayAccuracy || Math.round(accuracy * 100)}%` : '—'}
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-[#4a4455]">How smart your AI is! 🧠</p>
                    </div>
                </div>
            </div>

            {/* Warning */}
            {!canTrain && warningTitle && (
                <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-[#fef3c7] rounded-2xl border border-[#fde68a] animate-fade-in">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <p className="text-sm text-[#92400e] font-bold">{warningTitle}</p>
                        <p className="text-xs text-[#92400e]/80">{warningDesc}</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {trainingError && (
                <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-[#fee2e2] rounded-2xl border border-[#fecaca] animate-fade-in">
                    <span className="text-xl">❌</span>
                    <div>
                        <p className="text-sm text-[#991b1b] font-bold">{trainingError}</p>
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
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #630ed4;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                input[type="range"]::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
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
