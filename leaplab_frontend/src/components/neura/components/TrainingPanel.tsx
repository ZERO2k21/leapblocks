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
    mlDescription?: string
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
    mlDescription,
}: TrainingPanelProps) {
    const totalSamples = Object.values(sampleCounts).reduce((s, c) => s + c, 0)
    const isReady = canTrain && status !== 'training'

    return (
        <div className="rounded-2xl w-[330px] overflow-hidden font-sans" style={{ background: 'var(--ml-surface)', border: '1px solid var(--ml-border)' }}>
            {/* Header with status indicator */}
            <div className="px-5 py-4 flex items-center gap-2.5">
                <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-400 ${trained ? '' : ''}`}
                    style={trained ? { background: 'var(--ml-success-dot)', boxShadow: '0 0 8px var(--ml-success-dot)' } : { background: 'var(--ml-text-muted)' }}
                />
                <span className="font-bold text-[15px]" style={{ color: 'var(--ml-text-primary)' }}>Training</span>
            </div>

            <div className="px-5 pb-5 flex flex-col gap-3.5">
                {/* Idle state: Neural network SVG */}
                {!trained && status === 'idle' && (
                    <div className="flex flex-col items-center py-3">
                        <svg width="120" height="70" viewBox="0 0 120 70" fill="none" className="mb-2.5 opacity-70">
                            <circle cx="20" cy="15" r="5" fill="#7c3aed" opacity="0.4">
                                <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="20" cy="35" r="5" fill="#7c3aed" opacity="0.5">
                                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.5s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="20" cy="55" r="5" fill="#7c3aed" opacity="0.4">
                                <animate attributeName="opacity" values="0.4;0.7;0.4" dur="1.8s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="60" cy="12" r="5" fill="#a78bfa" opacity="0.5">
                                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="60" cy="35" r="5" fill="#a78bfa" opacity="0.6">
                                <animate attributeName="opacity" values="0.6;0.9;0.6" dur="1.9s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="60" cy="58" r="5" fill="#a78bfa" opacity="0.5">
                                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.3s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="100" cy="25" r="5" fill="#c4b5fd" opacity="0.5">
                                <animate attributeName="opacity" values="0.5;0.7;0.5" dur="2.1s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="100" cy="45" r="5" fill="#c4b5fd" opacity="0.4">
                                <animate attributeName="opacity" values="0.4;0.6;0.4" dur="2.4s" repeatCount="indefinite" />
                            </circle>
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
                        <div className="text-[13px] leading-relaxed text-center" style={{ color: 'var(--ml-text-muted)' }}>
                            {!canTrain ? 'Add samples to at least 2 classes to begin.' : 'Ready to train.'}
                        </div>
                    </div>
                )}

                {/* Training state: Progress ring */}
                {status === 'training' && (
                    <div className="flex flex-col items-center py-2">
                        <div className="relative w-16 h-16 mb-2">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--ml-well)" strokeWidth="4" />
                                <circle cx="32" cy="32" r="28" fill="none" stroke="url(#progress-gradient)" strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 28}`}
                                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                                    style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
                                <defs>
                                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#7c3aed" />
                                        <stop offset="100%" stopColor="#a78bfa" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-mono text-xs font-bold" style={{ color: 'var(--ml-accent-light)' }}>{Math.round(progress)}%</span>
                            </div>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--ml-text-secondary)' }}>Extracting features…</span>
                    </div>
                )}

                {/* Trained state: Success message */}
                {trained && (
                    <div className="rounded-[10px] px-3.5 py-2.5" style={{ animation: 'neura-celebration 0.5s cubic-bezier(0.34,1.56,0.64,1) both', background: 'var(--ml-success-bg)', border: '1px solid var(--ml-success-border)' }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--ml-success-text)' }}>✓ Model trained successfully</div>
                        <div className="font-mono text-[11px]" style={{ color: 'var(--ml-text-secondary)' }}>
                            Accuracy: {Math.round(accuracy * 100)}% · {totalSamples} samples · {Object.keys(sampleCounts).length} classes
                        </div>
                    </div>
                )}

                {/* Sample counts grid */}
                {Object.keys(sampleCounts).length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--ml-text-secondary)' }}>Samples</div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(sampleCounts).map(([name, count]) => (
                                <div key={name} className="rounded-[10px] px-3 py-2 text-[11px]" style={{ background: 'var(--ml-well)', color: 'var(--ml-text-secondary)' }}>
                                    {name}: <span className="font-bold" style={{ color: 'var(--ml-text-primary)' }}>{count}</span>
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
                    className="w-full py-3.5 rounded-[11px] border-none font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 tracking-[-0.01em]"
                    style={isReady ? {
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
                    } : {
                        background: 'var(--ml-btn-idle)',
                        color: 'var(--ml-text-disabled)',
                        cursor: 'not-allowed',
                    }}
                >
                    <Zap size={15} />
                    {status === 'training' ? 'Training…' : trained ? 'Retrain Model' : 'Train Model'}
                </button>

                {/* Advanced settings */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="bg-transparent border-none font-sans text-[13px] cursor-pointer flex items-center gap-1.5 p-0 w-full"
                        style={{ color: 'var(--ml-text-muted)' }}
                    >
                        <Settings size={13} />
                        <span>Advanced settings</span>
                        <span className="ml-auto transition-transform duration-200" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </button>
                    {showAdvanced && (
                        <div className="mt-2.5 rounded-[10px] p-3.5 flex flex-col gap-3" style={{ background: 'var(--ml-well)' }}>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs" style={{ color: 'var(--ml-text-secondary)' }}>Epochs</span>
                                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--ml-accent-light)' }}>{epochs}</span>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={100}
                                    step={5}
                                    value={epochs}
                                    onChange={(e) => setEpochs(Number(e.target.value))}
                                    className="w-full"
                                    style={{ accentColor: '#7c3aed' }}
                                />
                            </div>
                            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--ml-text-muted)' }}>
                                {mlDescription || 'Using transfer learning + KNN classifier. All computation runs in-browser — no data leaves your device.'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Accuracy badge */}
                {trained && (
                    <div className="rounded-[10px] py-2.5 px-3.5 text-xs font-semibold text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--ml-accent-light)' }}>
                        Accuracy: {Math.round(accuracy * 100)}%
                    </div>
                )}
            </div>
        </div>
    )
}
