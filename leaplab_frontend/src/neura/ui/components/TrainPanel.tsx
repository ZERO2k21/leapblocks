import React, { useState, useEffect, useRef } from 'react'
import WorkflowIndicator from './WorkflowIndicator'
import AccuracyChart from './AccuracyChart'

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
    mode?: any
    onModeChange?: (mode: any) => void
    workflowType?: string
    modelLoading?: boolean
    epochResults?: number[]
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
    sampleType = 'pictures',
    mode = 'train',
    onModeChange,
    workflowType,
    modelLoading = false,
    epochResults = []
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
        <div className="animate-fade-in flex flex-col items-center overflow-y-auto neura-scrollbar w-full h-full p-5">
            {/* Header - centered */}
            <div className="w-full flex flex-col items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#630ed4] mb-0">
                    {isTraining ? '🧠 Teaching Time!' : modelLoading ? '⏳ Loading Model...' : accuracy !== null ? '🎉 Training Complete!' : '🤖 Ready to Train!'}
                </h2>
                <p className="text-xs text-[#4a4455]">
                    {isTraining
                        ? `Teaching round ${currentEpoch} of ${epochs}`
                        : modelLoading
                            ? 'Preparing your samples...'
                            : accuracy !== null
                                ? `Accuracy: ${displayAccuracy}%`
                                : `Learning from ${totalSamples} ${sampleType} across ${classCount} classes`}
                </p>
            </div>

            {/* Workflow Indicator */}
            {onModeChange && (
                <div className="max-w-[800px] w-full mx-auto mb-3">
                    <WorkflowIndicator mode={mode} onModeChange={onModeChange} canTrain={canTrain} type={workflowType as any} />
                </div>
            )}

            {/* Horizontal split */}
            <div className="w-full flex flex-col md:flex-row gap-4 flex-1 min-h-0">
                {/* Left half - Training visualization */}
                <div className="flex-1 min-w-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-xl rounded-2xl p-6 px-5 border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative overflow-hidden">
                    {/* AI Brain */}
                    <div className="relative flex flex-col items-center z-10">
                        {/* Icon with animated gradient ring */}
                        <div className="relative mb-5">
                            {/* Spinning gradient ring */}
                            <div
                                className={`absolute -inset-2 rounded-full transition-opacity ${isTraining ? 'animate-spin opacity-85' : accuracy !== null ? 'opacity-85' : 'opacity-35'}`}
                                style={{
                                    background: isTraining
                                        ? 'conic-gradient(from 0deg, #630ed4, #c084fc, #818cf8, #630ed4)'
                                        : accuracy !== null
                                            ? 'conic-gradient(from 0deg, #059669, #34d399, #10b981, #059669)'
                                            : 'conic-gradient(from 0deg, #e5e7eb, #f3f4f6, #e5e7eb, #f3f4f6, #e5e7eb)',
                                }}
                            />
                            {/* White spacer ring */}
                            <div className="absolute -inset-0.75 rounded-full bg-white" />
                            {/* Icon circle */}
                            <div className={`relative flex items-center justify-center w-25 h-25 rounded-full transition-transform duration-300 ${isTraining ? 'animate-pulse' : ''} ${accuracy !== null ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-violet-50 to-violet-100'}`}>
                                <span className="text-[2.8rem]">{isTraining ? '🧠' : accuracy !== null ? '🎉' : '🤖'}</span>
                            </div>
                            {/* SVG progress ring overlay */}
                            {(isTraining || accuracy !== null) && (
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle
                                        cx="50" cy="50" r="47"
                                        fill="transparent"
                                        stroke={accuracy !== null ? '#059669' : '#630ed4'}
                                        strokeWidth="4"
                                        strokeDasharray={2 * Math.PI * 47}
                                        strokeDashoffset={2 * Math.PI * 47 - (progress / 100) * 2 * Math.PI * 47}
                                        strokeLinecap="round"
                                        className="transition-[stroke-dashoffset] duration-[350ms] ease-out opacity-90"
                                    />
                                </svg>
                            )}
                        </div>

                        {/* Train button */}
                        <button
                            onClick={() => onTrain(epochs)}
                            disabled={!canTrain || isTraining || modelLoading}
                            className={`flex items-center gap-2 py-3 px-8 rounded-xl text-sm font-bold border-none tracking-wide transition-all duration-200 ${
                                canTrain && !isTraining && !modelLoading
                                    ? 'cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_6px_24px_rgba(99,14,212,0.3)] hover:opacity-95'
                                    : isTraining
                                        ? 'cursor-not-allowed bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white/90 shadow-[0_4px_16px_rgba(99,14,212,0.2)]'
                                        : modelLoading
                                            ? 'cursor-not-allowed bg-violet-100 text-[#630ed4] border border-violet-200'
                                            : 'cursor-not-allowed bg-slate-200 text-slate-400 opacity-50'
                            }`}
                        >
                            {isTraining ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    <span>Teaching... ({currentEpoch}/{epochs})</span>
                                </>
                            ) : modelLoading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-[#630ed4]/40 border-t-[#630ed4] rounded-full animate-spin" />
                                    <span>Preparing model...</span>
                                </>
                            ) : accuracy !== null ? (
                                <>
                                    <span className="text-base">🧪</span>
                                    <span>Test Your AI!</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-base">🚀</span>
                                    <span>Start Teaching!</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right half - Settings */}
                <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                    {/* Epochs */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase">🔄 Training Rounds</span>
                            <span className="text-lg font-extrabold text-[#630ed4]">{epochs}</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="150"
                            value={epochs}
                            onChange={(e) => setEpochs(parseInt(e.target.value))}
                            disabled={isTraining}
                            className={`w-full h-1.5 rounded-full accent-[#630ed4] ${isTraining ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {epochPresets.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setEpochs(preset)}
                                    disabled={isTraining}
                                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border-none transition-all duration-150 ${
                                        epochs === preset ? 'bg-[#630ed4] text-white' : 'bg-violet-100 text-[#4a4455] hover:bg-violet-200'
                                    } ${isTraining ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        <p className="text-[9px] text-[#7b7487] mt-1.5">More rounds = smarter AI but takes longer ⏱️</p>
                    </div>

                    {/* Progress */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase">📊 Progress</span>
                            <span className="text-lg font-extrabold text-[#630ed4]">{isTraining || accuracy !== null ? Math.round(progress) : 0}%</span>
                        </div>
                        <div className="w-full bg-violet-100 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    accuracy !== null ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed]'
                                }`}
                                style={{ width: `${isTraining || accuracy !== null ? progress : 0}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-[#4a4455] mt-1.5 italic">
                            {isTraining ? (
                                <>Round <span className="font-bold text-slate-900">{currentEpoch}</span> of <span className="font-bold text-slate-900">{epochs}</span></>
                            ) : accuracy !== null ? (
                                <span className="font-bold text-emerald-600">✅ Complete!</span>
                            ) : (
                                <>Est. ~{Math.round(epochs * 0.9)} seconds</>
                            )}
                        </p>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-lg">🎯</span>
                            <div>
                                <span className="text-[10px] font-bold text-[#4a4455] uppercase block">Accuracy</span>
                                <span className={`text-base font-extrabold ${accuracy !== null ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {accuracy !== null ? `${displayAccuracy || Math.round(accuracy * 100)}%` : '—'}
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500">How smart your AI is! 🧠</p>
                    </div>

                    {/* Accuracy Chart */}
                    {(epochResults.length > 0 || isTraining) && (
                        <AccuracyChart
                            epochResults={epochResults}
                            isTraining={isTraining}
                            currentEpoch={currentEpoch}
                        />
                    )}
                </div>
            </div>

            {/* Warning */}
            {!canTrain && warningTitle && (
                <div className="flex items-center gap-2.5 p-3 px-4 bg-amber-50 rounded-2xl border border-amber-200 w-full mt-4 mx-auto animate-fade-in shadow-sm">
                    <span className="text-lg">⚠️</span>
                    <div className="text-left">
                        <p className="text-xs font-extrabold text-amber-700 m-0">{warningTitle}</p>
                        <p className="text-[11px] text-amber-600 m-0">{warningDesc}</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {trainingError && (
                <div className="flex items-center gap-2.5 p-3 px-4 bg-red-50 rounded-2xl border border-red-200 w-full mt-4 mx-auto animate-fade-in shadow-sm">
                    <span className="text-lg">❌</span>
                    <div className="text-left">
                        <p className="text-xs font-extrabold text-red-800 m-0">{trainingError}</p>
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
