import React, { useRef, useEffect, useState } from 'react'

interface TestPanelProps {
    prediction: { label: string; confidences: Record<string, number> } | null
    isProcessing: boolean
    cameraOn?: boolean
    testImage?: string | null
    videoRef?: React.RefObject<HTMLVideoElement | null>
    canvasRef?: React.RefObject<HTMLCanvasElement | null>
    onCapture?: () => void
    onUpload?: () => void
    onToggleCamera?: () => void
    onReset?: () => void
    onTryAnother?: () => void
    onExport?: () => void
    fileInputRef?: React.RefObject<HTMLInputElement | null>
    onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    projectName?: string
    testsRun?: number
    inferenceTime?: number
    modelLoading?: boolean
    videoFit?: 'cover' | 'contain'
    children?: React.ReactNode
}

export default function TestPanel({
    prediction,
    isProcessing,
    cameraOn = false,
    testImage = null,
    videoRef,
    canvasRef,
    onCapture = () => {},
    onUpload = () => {},
    onToggleCamera = () => {},
    onReset = () => {},
    onTryAnother = () => {},
    onExport = () => {},
    fileInputRef,
    onFileChange = () => {},
    testsRun = 0,
    inferenceTime = 0,
    modelLoading = false,
    videoFit = 'cover',
    children
}: TestPanelProps) {
    if (children) {
        return <LegacyTestPanel prediction={prediction} isProcessing={isProcessing}>{children}</LegacyTestPanel>
    }

    const sortedConfidences = prediction
        ? Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a)
        : []

    const maxConfidence = sortedConfidences.length > 0 ? sortedConfidences[0][1] : 0
    const [displayConfidence, setDisplayConfidence] = useState(0)

    useEffect(() => {
        if (prediction && maxConfidence > 0) {
            const duration = 600
            const startTime = Date.now()
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime
                const pct = Math.min(1, elapsed / duration)
                setDisplayConfidence(Math.round(maxConfidence * 100 * (1 - Math.pow(1 - pct, 3))))
                if (pct >= 1) clearInterval(interval)
            }, 16)
            return () => clearInterval(interval)
        } else {
            setDisplayConfidence(0)
        }
    }, [prediction, maxConfidence])

    const getPredictionLabel = () => {
        if (!prediction) return ''
        return prediction.label.charAt(0).toUpperCase() + prediction.label.slice(1)
    }

    const cardStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Tips */}
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto 10px' }}>
                <div
                    style={{
                        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        border: '1px solid rgba(99,14,212,0.1)',
                    }}
                >
                    <div className="flex items-start" style={{ gap: '6px' }}>
                        <div
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                flexShrink: 0,
                            }}
                        >💡</div>
                        <div>
                            <div className="flex flex-wrap" style={{ gap: '2px 12px' }}>
                                {['Take clear photos', 'Good lighting helps', 'Try different angles', 'Match training conditions'].map((tip) => (
                                    <span key={tip} className="flex items-center" style={{ gap: '4px', fontSize: '10px', color: '#4b5563' }}>
                                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#630ed4', flexShrink: 0 }} />
                                        {tip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4" style={{ flex: 1, minHeight: 0 }}>
                {/* Left - Camera */}
                <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', minWidth: 0 }}>
                    {/* Camera header */}
                    <div className="flex justify-between items-center" style={{ marginBottom: '10px' }}>
                        <div className="flex items-center" style={{ gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cameraOn ? '#10b981' : '#ef4444', boxShadow: cameraOn ? '0 0 6px rgba(16,185,129,0.5)' : 'none' }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {cameraOn ? 'Live Feed' : 'Camera Off'}
                            </span>
                        </div>
                        <button
                            onClick={onToggleCamera}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: cameraOn ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                                color: cameraOn ? '#059669' : '#630ed4',
                                boxShadow: cameraOn ? '0 2px 8px rgba(5,150,105,0.15)' : '0 2px 8px rgba(99,14,212,0.12)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <span style={{ fontSize: '12px' }}>{cameraOn ? '📷' : '🚫'}</span>
                            {cameraOn ? ' On' : ' Off'}
                        </button>
                    </div>

                    {/* Camera viewport */}
                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            background: '#1e1b4b',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {cameraOn && (
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full rounded-2xl -scale-x-100 ${videoFit === 'contain' ? 'object-contain bg-black' : 'object-cover'}`} />
                        )}
                        {!cameraOn && testImage && (
                            <img src={testImage} alt="Test" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        )}
                        {!cameraOn && !testImage && (
                            <div className="flex flex-col items-center text-center animate-fade-in" style={{ padding: '24px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📸</span>
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Camera is off</p>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', maxWidth: '180px', marginBottom: '16px' }}>Turn on camera or upload a picture</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={onToggleCamera}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(99,14,212,0.25)',
                                        }}
                                    >
                                        📷 Turn On Camera
                                    </button>
                                    {fileInputRef && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#fff',
                                                color: '#630ed4',
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                border: '2px solid #630ed4',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            📂 Upload Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Scan line */}
                        {cameraOn && (
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                width: '100%',
                                height: '2px',
                                background: 'linear-gradient(90deg, transparent, rgba(99,14,212,0.6), transparent)',
                                boxShadow: '0 0 12px rgba(99,14,212,0.4)',
                                animation: 'scan 3s infinite ease-in-out',
                            }} />
                        )}

                        {/* LIVE indicator */}
                        {cameraOn && (
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '5px',
                            }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                                <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>LIVE</span>
                            </div>
                        )}

                        {/* Loading overlay - small center badge only */}
                        {(modelLoading || isProcessing) && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                background: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                zIndex: 20,
                            }}>
                                <div style={{ width: '16px', height: '16px', border: '2px solid #630ed4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{modelLoading ? 'Loading model...' : 'Analyzing...'}</span>
                            </div>
                        )}

                        {/* Capture button overlay - visible when camera is on or test image is uploaded */}
                        {(cameraOn || testImage) && (
                            <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '8px',
                                padding: '6px 12px',
                                background: 'rgba(255,255,255,0.85)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.4)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 15,
                            }}>
                                {cameraOn && (
                                    <button
                                        onClick={onCapture}
                                        className="flex items-center"
                                        style={{
                                            gap: '4px',
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                            color: '#fff',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span style={{ fontSize: '12px' }}>📸</span>
                                        Take Photo
                                    </button>
                                )}
                                {fileInputRef && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center"
                                        style={{
                                            gap: '4px',
                                            padding: '6px 14px',
                                            background: '#fff',
                                            color: '#374151',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: '1px solid #e5e7eb',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span style={{ fontSize: '12px' }}>📂</span>
                                        {testImage ? 'Upload Another' : 'Upload'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Right - Results */}
                <div style={{ width: '100%', maxWidth: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Result card */}
                    <div style={{ ...cardStyle, padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {prediction ? (
                            <div className="w-full flex flex-col items-center animate-fade-in">
                                {/* Icon */}
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '12px',
                                    boxShadow: '0 4px 16px rgba(16,185,129,0.15)',
                                }}>
                                    <span style={{ fontSize: '2rem' }}>🎯</span>
                                </div>

                                {/* Label */}
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    Prediction
                                </span>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#131b2e', marginBottom: '12px', textAlign: 'center' }}>
                                    It's a <span style={{ color: '#630ed4' }}>{getPredictionLabel()}</span>! 🎉
                                </h2>

                                {/* Confidence */}
                                <div style={{ width: '100%', marginBottom: '14px' }}>
                                    <div className="flex justify-between" style={{ marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280' }}>Confidence</span>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: displayConfidence >= 50 ? '#059669' : '#d97706' }}>
                                            {displayConfidence}%
                                        </span>
                                    </div>
                                    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            borderRadius: '4px',
                                            background: displayConfidence >= 50 ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #fbbf24, #d97706)',
                                            width: `${displayConfidence}%`,
                                            transition: 'width 0.6s ease',
                                        }} />
                                    </div>
                                </div>

                                {/* Class breakdown */}
                                {sortedConfidences.length > 1 && (
                                    <div style={{ width: '100%', marginBottom: '14px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>All Classes</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {sortedConfidences.slice(0, 4).map(([label, confidence]) => {
                                                const val = Math.round(confidence * 100)
                                                return (
                                                    <div key={label}>
                                                        <div className="flex justify-between" style={{ marginBottom: '2px' }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>{label}</span>
                                                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280' }}>{val}%</span>
                                                        </div>
                                                        <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #630ed4, #7c3aed)', width: `${val}%`, transition: 'width 0.5s ease' }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex" style={{ gap: '8px', width: '100%' }}>
                                    <button
                                        onClick={onTryAnother}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#f3f4f6',
                                            color: '#374151',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: '1px solid #e5e7eb',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        🔄 Try Another
                                    </button>
                                    <button
                                        onClick={onExport}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(99,14,212,0.25)',
                                        }}
                                    >
                                        💾 Save Report
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center" style={{ padding: '20px' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '12px',
                                    border: '2px dashed #e5e7eb',
                                }}>
                                    <span style={{ fontSize: '1.8rem' }}>🤔</span>
                                </div>
                                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '4px', textAlign: 'center' }}>Awaiting Input</h3>
                                <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', maxWidth: '180px' }}>
                                    Take a photo or upload an image to test your model
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="flex" style={{ gap: '10px' }}>
                        <div style={{ ...cardStyle, flex: 1, padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>⚡</div>
                            <div>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Speed</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#131b2e' }}>{inferenceTime}ms</span>
                            </div>
                        </div>
                        <div style={{ ...cardStyle, flex: 1, padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📊</div>
                            <div>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Tests</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#131b2e' }}>{testsRun}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; }
                    50% { top: calc(100% - 2px); }
                    100% { top: 0%; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

function LegacyTestPanel({ prediction, isProcessing, children }: { prediction: { label: string; confidences: Record<string, number> } | null; isProcessing: boolean; children: React.ReactNode }) {
    const sortedConfidences = prediction
        ? Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a)
        : []
    const maxConfidence = sortedConfidences.length > 0 ? sortedConfidences[0][1] : 0

    return (
        <div style={{ maxWidth: '600px', width: '100%' }}>
            {children}
            {isProcessing && (
                <div className="flex items-center justify-center" style={{ gap: '10px', padding: '20px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #630ed4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>Analyzing... 🔍</span>
                </div>
            )}
            {prediction && !isProcessing && (
                <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div className="text-center" style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>🎯 Prediction</p>
                        <div className="inline-flex items-center" style={{ gap: '10px', padding: '8px 16px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                                {prediction.label.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e' }}>{prediction.label}</span>
                        </div>
                        <div className="flex items-center justify-center" style={{ gap: '6px', marginTop: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Confidence</span>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: maxConfidence >= 0.7 ? '#059669' : maxConfidence >= 0.4 ? '#d97706' : '#dc2626' }}>
                                {Math.round(maxConfidence * 100)}%
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sortedConfidences.map(([label, confidence]) => {
                            const val = Math.round(confidence * 100)
                            return (
                                <div key={label}>
                                    <div className="flex justify-between" style={{ marginBottom: '2px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>{label}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>{val}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: '3px', background: confidence >= 0.7 ? 'linear-gradient(90deg, #34d399, #10b981)' : confidence >= 0.4 ? 'linear-gradient(90deg, #fbbf24, #d97706)' : 'linear-gradient(90deg, #fca5a5, #ef4444)', width: `${val}%`, transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {!prediction && !isProcessing && (
                <div className="flex flex-col items-center justify-center" style={{ padding: '40px', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', border: '2px dashed #c4b5fd' }}>
                        <span style={{ fontSize: '20px' }}>🤔</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>Waiting for input</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Speak into the mic to test! 🎤</p>
                </div>
            )}
        </div>
    )
}
