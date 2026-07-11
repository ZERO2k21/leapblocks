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
    projectName,
    testsRun = 0,
    inferenceTime = 0,
    children
}: TestPanelProps) {
    // If children are provided, use legacy simple mode for backward compatibility
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
                const eased = 1 - Math.pow(1 - pct, 3)
                setDisplayConfidence(Math.round(maxConfidence * 100 * eased))
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

    return (
        <div className="w-full max-w-6xl mx-auto animate-[fade-in_0.4s_ease-out]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: Camera Preview Card */}
                <div className="rounded-[2rem] p-5 shadow-xl flex flex-col" style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(204, 195, 216, 0.5)'
                }}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-error rounded-full animate-pulse shadow-[0_0_8px_rgba(186,26,26,0.5)]" />
                            <span className="text-xs font-semibold text-on-surface tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                LIVE PREVIEW
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onToggleCamera}
                                className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 19H4a2 2 0 01-2-2V7a2 2 0 012-2h5" />
                                    <path d="M13 5h7a2 2 0 012 2v10a2 2 0 01-2 2h-5" />
                                    <path d="M14 9a2 2 0 114 0" />
                                    <path d="M10 15a2 2 0 114 0" />
                                </svg>
                            </button>
                            <button
                                onClick={onCapture}
                                disabled={!cameraOn}
                                className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant disabled:opacity-40"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Camera/Video Feed */}
                    <div className="aspect-video bg-surface-container mx-1 rounded-2xl relative flex items-center justify-center overflow-hidden group">
                        {cameraOn && (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover rounded-2xl"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                        )}
                        {!cameraOn && testImage && (
                            <img
                                src={testImage}
                                alt="Test image"
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        )}
                        {!cameraOn && !testImage && (
                            <div className="flex flex-col items-center text-on-surface-variant opacity-50">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                                <p className="text-sm mt-2 font-medium">Turn on camera or upload an image</p>
                            </div>
                        )}

                        {/* Scanner Animation Overlay */}
                        {cameraOn && (
                            <>
                                <div className="absolute inset-0 pointer-events-none border-2 border-primary/20 rounded-2xl" />
                                <div
                                    className="absolute left-0 w-full h-1 bg-primary/60 shadow-[0_0_20px_rgba(115,46,228,1)]"
                                    style={{ animation: 'scan 3s infinite ease-in-out' }}
                                />
                            </>
                        )}

                        {/* Processing Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <div className="flex items-center gap-3 px-6 py-3 bg-white/90 rounded-full">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-semibold text-on-surface">Analyzing...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mt-5 px-1">
                        <button
                            onClick={onCapture}
                            disabled={!cameraOn}
                            className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-full font-bold transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            Capture Image
                        </button>
                        <button
                            onClick={onUpload}
                            className="flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-full font-bold transition-all hover:bg-primary/5 hover:-translate-y-0.5 active:translate-y-0"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload File
                        </button>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Right: Prediction Results */}
                <div className="flex flex-col gap-5">

                    {/* Result Card */}
                    <div className="rounded-[2rem] p-7 flex flex-col items-center text-center relative overflow-hidden" style={{
                        background: prediction ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(37,254,168,0.08) 100%)' : 'rgba(255,255,255,0.9)',
                        border: prediction ? '2px solid #00e293' : '1px solid rgba(204, 195, 216, 0.5)',
                        boxShadow: prediction ? '0 25px 50px rgba(0,108,68,0.08)' : '0 25px 50px rgba(0,0,0,0.06)'
                    }}>
                        {prediction ? (
                            <>
                                {/* Floating verified icon */}
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-secondary/20 relative z-20" style={{
                                    background: '#25fea8',
                                    animation: 'float 3s ease-in-out infinite'
                                }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#006c44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>

                                {/* Prediction Label */}
                                <h3 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-2 relative z-20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    PREDICTION RESULT
                                </h3>
                                <h2 className="text-[32px] font-extrabold text-on-surface mb-6 relative z-20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    It's a {getPredictionLabel()}!
                                </h2>

                                {/* Confidence Gauge */}
                                <div className="w-full max-w-sm space-y-3 mb-8 relative z-20">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                            CONFIDENCE
                                        </span>
                                        <span className="text-2xl font-black text-secondary">
                                            {displayConfidence}%
                                        </span>
                                    </div>
                                    <div className="h-6 bg-surface-container rounded-full overflow-hidden p-1 border border-outline-variant/30">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                            style={{
                                                width: `${displayConfidence}%`,
                                                background: '#25fea8',
                                                boxShadow: '0 0 15px rgba(0,108,71,0.4)'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-secondary/80 to-secondary animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-4 w-full relative z-20">
                                    <button
                                        onClick={onTryAnother}
                                        className="flex items-center justify-center gap-2 py-5 bg-surface-container-high text-on-surface rounded-full font-bold hover:bg-surface-container-highest transition-all border border-outline-variant/50"
                                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="1 4 1 10 7 10" />
                                            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                                        </svg>
                                        Try Another
                                    </button>
                                    <button
                                        onClick={onExport}
                                        className="flex items-center justify-center gap-2 py-5 bg-primary text-on-primary rounded-full font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-1 active:translate-y-0"
                                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
                                            <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
                                            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                                        </svg>
                                        Export Model
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Empty state */
                            <div className="py-8">
                                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7b7487" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </div>
                                <p className="text-base font-semibold text-on-surface-variant">Waiting for input</p>
                                <p className="text-sm text-on-surface-variant/60 mt-1">Capture or upload an image to test</p>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-5">
                        {/* Inference Time */}
                        <div className="rounded-2xl p-5 flex items-center gap-4 border border-outline-variant/30 shadow-sm" style={{
                            background: 'rgba(242, 243, 255, 0.8)'
                        }}>
                            <div className="p-3 rounded-xl shadow-inner" style={{ background: '#c32c00' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffdfd7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant opacity-70 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    INFERENCE
                                </p>
                                <p className="text-xl font-black text-on-surface">{inferenceTime}ms</p>
                            </div>
                        </div>

                        {/* Tests Run */}
                        <div className="rounded-2xl p-5 flex items-center gap-4 border border-outline-variant/30 shadow-sm" style={{
                            background: 'rgba(242, 243, 255, 0.8)'
                        }}>
                            <div className="p-3 rounded-xl shadow-inner" style={{ background: '#25fea8' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006c44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant opacity-70 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    TESTS RUN
                                </p>
                                <p className="text-xl font-black text-on-surface">{testsRun}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes scan {
                    0% { top: 0%; }
                    50% { top: calc(100% - 4px); }
                    100% { top: 0%; }
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </div>
    )
}

// Legacy TestPanel for backward compatibility with other classifier panels
function LegacyTestPanel({ prediction, isProcessing, children }: { prediction: { label: string; confidences: Record<string, number> } | null; isProcessing: boolean; children: React.ReactNode }) {
    const sortedConfidences = prediction
        ? Object.entries(prediction.confidences).sort(([, a], [, b]) => b - a)
        : []

    const maxConfidence = sortedConfidences.length > 0 ? sortedConfidences[0][1] : 0

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.7) return { bar: 'from-emerald-400 to-green-500', text: 'text-emerald-500' }
        if (confidence >= 0.4) return { bar: 'from-amber-400 to-orange-500', text: 'text-amber-500' }
        return { bar: 'from-red-400 to-pink-500', text: 'text-red-500' }
    }

    return (
        <div className="w-full max-w-lg">
            {children}
            {isProcessing && (
                <div className="flex items-center justify-center gap-3 py-6 animate-[fade-in_0.2s_ease-out]">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '100ms', animationDuration: '0.6s' }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.6s' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-500">Analyzing...</span>
                </div>
            )}
            {prediction && !isProcessing && (
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <div className="text-center mb-6">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Prediction</p>
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-50 to-blue-50 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {prediction.label.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-2xl font-bold text-gray-800">{prediction.label}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-sm text-gray-400">Confidence</span>
                            <span className={`text-lg font-bold ${getConfidenceColor(maxConfidence).text}`}>
                                {Math.round(maxConfidence * 100)}%
                            </span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {sortedConfidences.map(([label, confidence], index) => {
                            const colors = getConfidenceColor(confidence)
                            return (
                                <div key={label} className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-gray-600 w-24 truncate capitalize">{label}</span>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700 ease-out`}
                                            style={{ width: `${confidence * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold ${colors.text} w-12 text-right`}>
                                        {Math.round(confidence * 100)}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {!prediction && !isProcessing && (
                <div className="flex flex-col items-center py-10 text-gray-300">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-400">Waiting for input</p>
                    <p className="text-xs text-gray-300 mt-1">Use the input above to test</p>
                </div>
            )}
        </div>
    )
}
