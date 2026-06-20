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

    return (
        <div style={{ background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 16, width: 288, overflow: 'hidden' }}>
            {/* Header with status indicator */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: trained ? '#20c997' : '#444',
                    boxShadow: trained ? '0 0 8px #20c997' : 'none',
                    transition: 'all 0.4s'
                }} />
                <span style={{ color: '#e0e0f0', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>Training</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#0d0d1a', borderRadius: 8, padding: '3px 4px' }}>
                    {['JS', 'PY'].map(m => (
                        <div key={m} style={{
                            padding: '3px 9px',
                            borderRadius: 6,
                            background: m === 'JS' ? '#7c3aed' : 'transparent',
                            fontSize: 11,
                            fontFamily: "'DM Mono', monospace",
                            color: m === 'JS' ? '#fff' : '#555',
                            fontWeight: 700,
                            transition: 'all 0.2s'
                        }}>{m}</div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Idle state: Neural network SVG */}
                {!trained && status === 'idle' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
                        <svg width="120" height="70" viewBox="0 0 120 70" fill="none" style={{ marginBottom: 10, opacity: 0.6 }}>
                            {/* Input layer */}
                            <circle cx="20" cy="15" r="5" fill="#7c3aed" opacity="0.4" />
                            <circle cx="20" cy="35" r="5" fill="#7c3aed" opacity="0.5" />
                            <circle cx="20" cy="55" r="5" fill="#7c3aed" opacity="0.4" />
                            {/* Hidden layer */}
                            <circle cx="60" cy="12" r="5" fill="#a78bfa" opacity="0.5" />
                            <circle cx="60" cy="35" r="5" fill="#a78bfa" opacity="0.6" />
                            <circle cx="60" cy="58" r="5" fill="#a78bfa" opacity="0.5" />
                            {/* Output layer */}
                            <circle cx="100" cy="25" r="5" fill="#c4b5fd" opacity="0.5" />
                            <circle cx="100" cy="45" r="5" fill="#c4b5fd" opacity="0.4" />
                            {/* Connections input → hidden */}
                            <line x1="25" y1="15" x2="55" y2="12" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                            <line x1="25" y1="15" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="35" x2="55" y2="12" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="35" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                            <line x1="25" y1="35" x2="55" y2="58" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="55" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                            <line x1="25" y1="55" x2="55" y2="58" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                            {/* Connections hidden → output */}
                            <line x1="65" y1="12" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                            <line x1="65" y1="12" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                            <line x1="65" y1="35" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                            <line x1="65" y1="35" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                            <line x1="65" y1="58" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                            <line x1="65" y1="58" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                        </svg>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#555', lineHeight: 1.5, textAlign: 'center' }}>
                            {!canTrain ? 'Add samples to at least 2 classes to begin.' : 'Ready to train.'}
                        </div>
                    </div>
                )}

                {/* Training state: Progress bar */}
                {status === 'training' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7070a0' }}>Extracting features…</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>{Math.round(progress)}%</span>
                        </div>
                        <div style={{ background: '#0d0d1a', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                                borderRadius: 6,
                                transition: 'width 0.3s'
                            }} />
                        </div>
                    </div>
                )}

                {/* Trained state: Success message */}
                {trained && (
                    <div style={{ background: '#0d1f14', border: '1px solid #1a3a25', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>✓ Model trained successfully</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#2d6a4f' }}>
                            Accuracy: {Math.round(accuracy * 100)}% · {totalSamples} samples · {Object.keys(sampleCounts).length} classes
                        </div>
                    </div>
                )}

                {/* Sample counts grid */}
                {Object.keys(sampleCounts).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#7070a0', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600 }}>Samples</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {Object.entries(sampleCounts).map(([name, count]) => (
                                <div key={name} style={{
                                    background: '#0d0d1a',
                                    borderRadius: 10,
                                    padding: '8px 12px',
                                    fontSize: 11,
                                    color: '#a0a0d0',
                                    fontFamily: "'DM Sans', sans-serif"
                                }}>
                                    {name}: <span style={{ fontWeight: 700, color: '#e0e0f0' }}>{count}</span>
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
                    style={{
                        width: '100%',
                        padding: '13px 0',
                        borderRadius: 11,
                        background: canTrain && status !== 'training'
                            ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                            : '#1a1a2a',
                        border: 'none',
                        color: canTrain && status !== 'training' ? '#fff' : '#333',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: canTrain && status !== 'training' ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all 0.2s',
                        letterSpacing: '-0.01em',
                        boxShadow: canTrain && status !== 'training' ? '0 4px 14px rgba(124, 58, 237, 0.25)' : 'none'
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
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#555',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: 0,
                            width: '100%'
                        }}
                    >
                        <Settings size={13} />
                        <span>Advanced settings</span>
                        <span style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </button>
                    {showAdvanced && (
                        <div style={{ marginTop: 10, background: '#0d0d1a', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'spaceBetween', marginBottom: 4 }}>
                                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7070a0' }}>Epochs</span>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>{epochs}</span>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={100}
                                    step={5}
                                    value={epochs}
                                    onChange={(e) => setEpochs(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#7c3aed' }}
                                />
                            </div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#444', lineHeight: 1.5 }}>
                                Using MediaPipe hand landmarks + KNN classifier. All computation runs in-browser — no data leaves your device.
                            </div>
                        </div>
                    )}
                </div>

                {/* Accuracy badge */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12,
                    color: '#a78bfa',
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    textAlign: 'center'
                }}>
                    Accuracy: {Math.round(accuracy * 100)}%
                </div>
            </div>
        </div>
    )
}
