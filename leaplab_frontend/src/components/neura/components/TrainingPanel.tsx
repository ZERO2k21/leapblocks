import * as React from 'react'
import { Zap, Settings } from 'lucide-react'

type TrainingPanelProps = {
    status: string
    progress: number
    accuracy: number
    canTrain: boolean
    onTrain: () => void
    showAdvanced: boolean
    setShowAdvanced: (value: boolean) => void
    epochs: number
    setEpochs: (value: number) => void
    trained: boolean
    sampleCounts?: Record<string, number>
}

export default function TrainingPanel({
    status,
    progress,
    accuracy,
    canTrain,
    onTrain,
    showAdvanced,
    setShowAdvanced,
    epochs,
    setEpochs,
    trained,
    sampleCounts = {},
}: TrainingPanelProps) {
    const totalSamples = Object.values(sampleCounts).reduce((s, c) => s + c, 0)
    const isReady = canTrain && status !== 'training'

    return (
        <div className="bg-ml-surface border border-ml-border rounded-2xl w-[288px] overflow-hidden font-sans">
            {/* Header with status indicator */}
            <div className="px-5 py-4 flex items-center gap-2.5">
                <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-400 ${trained ? 'bg-ml-success-dot shadow-[0_0_8px_var(--ml-success-dot)]' : 'bg-ml-text-muted'}`}
                />
                <span className="text-ml-text-primary font-bold text-[15px]">Training</span>
                <div className="ml-auto flex gap-1 bg-ml-well rounded-lg py-[3px] px-1">
                    {['JS', 'PY'].map(m => (
                        <div
                            key={m}
                            className={`px-2.5 py-[3px] rounded-md text-[11px] font-bold font-mono transition-all duration-200 ${m === 'JS' ? 'bg-ml-accent text-white' : 'bg-transparent text-ml-text-muted'}`}
                        >{m}</div>
                    ))}
                </div>
            </div>

            <div className="px-5 pb-5 flex flex-col gap-3.5">
                {/* Idle state: Neural network SVG */}
                {!trained && status === 'idle' && (
                    <div className="flex flex-col items-center py-3">
                        <svg width="120" height="70" viewBox="0 0 120 70" fill="none" className="mb-2.5 opacity-60">
                            <circle cx="20" cy="15" r="5" fill="#7c3aed" opacity="0.4" />
                            <circle cx="20" cy="35" r="5" fill="#7c3aed" opacity="0.5" />
                            <circle cx="20" cy="55" r="5" fill="#7c3aed" opacity="0.4" />
                            <circle cx="60" cy="12" r="5" fill="#a78bfa" opacity="0.5" />
                            <circle cx="60" cy="35" r="5" fill="#a78bfa" opacity="0.6" />
                            <circle cx="60" cy="58" r="5" fill="#a78bfa" opacity="0.5" />
                            <circle cx="100" cy="25" r="5" fill="#c4b5fd" opacity="0.5" />
                            <circle cx="100" cy="45" r="5" fill="#c4b5fd" opacity="0.4" />
                            <line x1="25" y1="15" x2="55" y2="12" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                            <line x1="25" y1="15" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="35" x2="55" y2="12" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="35" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                            <line x1="25" y1="35" x2="55" y2="58" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="55" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="55" x2="55" y2="58" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                            <line x1="65" y1="12" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                            <line x1="65" y1="12" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                            <line x1="65" y1="35" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                            <line x1="65" y1="35" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                            <line x1="65" y1="58" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                            <line x1="65" y1="58" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                        </svg>
                        <div className="text-[13px] text-ml-text-muted leading-relaxed text-center">
                            {!canTrain ? 'Add samples to at least 2 classes to begin.' : 'Ready to train.'}
                        </div>
                    </div>
                )}

                {/* Training state: Progress bar */}
                {status === 'training' && (
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-xs text-ml-text-secondary">Extracting features…</span>
                            <span className="font-mono text-xs text-ml-accent-light font-semibold">{Math.round(progress)}%</span>
                        </div>
                        <div className="bg-ml-well rounded-md h-1.5 overflow-hidden">
                            <div
                                className="h-full rounded-md bg-gradient-to-r from-ml-accent to-ml-accent-light transition-[width] duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Trained state: Success message */}
                {trained && (
                    <div className="bg-ml-success-bg border border-ml-success-border rounded-[10px] px-3.5 py-2.5">
                        <div className="text-xs text-ml-success-text font-semibold mb-1">✓ Model trained successfully</div>
                        <div className="font-mono text-[11px] text-ml-text-secondary">
                            Accuracy: {Math.round(accuracy * 100)}% · {totalSamples} samples · {Object.keys(sampleCounts).length} classes
                        </div>
                    </div>
                )}

                {/* Sample counts grid */}
                {Object.keys(sampleCounts).length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] text-ml-text-secondary uppercase tracking-[0.18em] font-semibold">Samples</div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(sampleCounts).map(([name, count]) => (
                                <div key={name} className="bg-ml-well rounded-[10px] px-3 py-2 text-[11px] text-ml-text-secondary">
                                    {name}: <span className="font-bold text-ml-text-primary">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Train button */}
                <button
                    type="button"
                    onClick={onTrain}
                    disabled={!canTrain || status === 'training'}
                    className={`w-full py-3.5 rounded-[11px] border-none font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 tracking-[-0.01em] ${
                        isReady
                            ? 'bg-gradient-to-br from-ml-accent to-[#a855f7] text-white cursor-pointer shadow-[0_4px_14px_rgba(124,58,237,0.25)]'
                            : 'bg-ml-btn-idle text-ml-text-disabled cursor-not-allowed shadow-none'
                    }`}
                >
                    <Zap size={15} />
                    {status === 'training' ? 'Training…' : trained ? 'Retrain Model' : 'Train Model'}
                </button>

                {/* Advanced settings */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="bg-transparent border-none text-ml-text-muted font-sans text-[13px] cursor-pointer flex items-center gap-1.5 p-0 w-full"
                    >
                        <Settings size={13} />
                        <span>Advanced settings</span>
                        <span className="ml-auto transition-transform duration-200" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </button>
                    {showAdvanced && (
                        <div className="mt-2.5 bg-ml-well rounded-[10px] p-3.5 flex flex-col gap-3">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-ml-text-secondary">Epochs</span>
                                    <span className="font-mono text-xs text-ml-accent-light font-semibold">{epochs}</span>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={100}
                                    step={5}
                                    value={epochs}
                                    onChange={(e) => setEpochs(Number(e.target.value))}
                                    className="w-full accent-ml-accent"
                                />
                            </div>
                            <div className="text-[11px] text-ml-text-muted leading-relaxed">
                                Using MediaPipe hand landmarks + KNN classifier. All computation runs in-browser — no data leaves your device.
                            </div>
                        </div>
                    )}
                </div>

                {/* Accuracy badge */}
                <div className="bg-gradient-to-br from-ml-accent/10 to-[#a855f7]/10 border border-ml-accent/20 rounded-[10px] py-2.5 px-3.5 text-xs text-ml-accent-light font-semibold text-center">
                    Accuracy: {Math.round(accuracy * 100)}%
                </div>
            </div>
        </div>
    )
}
