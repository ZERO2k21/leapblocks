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
    testsRun = 0,
    inferenceTime = 0,
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

    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Camera/Input */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-[#dae2fd] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse" />
                            <span className="text-[10px] font-bold text-[#131b2e] tracking-wider">📸 CAMERA</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={onToggleCamera} className="p-2 hover:bg-[#eaedff] rounded-full transition-colors text-[#4a4455]" title="Toggle camera">
                                <span className="text-lg">📷</span>
                            </button>
                            <button onClick={onCapture} disabled={!cameraOn} className="p-2 hover:bg-[#eaedff] rounded-full transition-colors text-[#4a4455] disabled:opacity-40" title="Capture">
                                <span className="text-lg">📸</span>
                            </button>
                        </div>
                    </div>

                    <div className="aspect-video bg-[#eaedff] rounded-2xl relative flex items-center justify-center overflow-hidden group">
                        {cameraOn && (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl -scale-x-100" />
                        )}
                        {!cameraOn && testImage && (
                            <img src={testImage} alt="Test" className="w-full h-full object-cover rounded-2xl" />
                        )}
                        {!cameraOn && !testImage && (
                            <div className="flex flex-col items-center text-[#7b7487] opacity-50">
                                <span className="text-5xl mb-2">📷</span>
                                <p className="text-sm font-semibold">Turn on camera or upload a picture</p>
                            </div>
                        )}

                        {cameraOn && (
                            <>
                                <div className="absolute inset-0 pointer-events-none border-2 border-[#630ed4]/20 rounded-2xl" />
                                <div className="absolute left-0 w-full h-0.5 bg-[#630ed4]/60 shadow-[0_0_12px_rgba(99,14,212,0.6)]" style={{ animation: 'scan 3s infinite ease-in-out' }} />
                            </>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <div className="flex items-center gap-3 px-6 py-3 bg-white/90 rounded-2xl">
                                    <div className="w-5 h-5 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-bold text-[#131b2e]">Analyzing... 🔍</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-3 mt-5">
                        <button
                            onClick={onCapture}
                            disabled={!cameraOn}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-2xl font-bold transition-all hover:shadow-lg hover:shadow-[#630ed4]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            📸 Take Photo
                        </button>
                        <button
                            onClick={onUpload}
                            className="flex items-center gap-2 px-6 py-3 border-2 border-[#630ed4] text-[#630ed4] rounded-2xl font-bold transition-all hover:bg-[#630ed4]/5 hover:-translate-y-0.5 active:translate-y-0 text-sm"
                        >
                            📂 Upload
                        </button>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Results */}
                <div className="flex flex-col gap-4">
                    <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center text-center border shadow-sm ${
                        prediction ? 'border-[#006c44]/30' : 'border-[#dae2fd]'
                    }`}>
                        {prediction ? (
                            <>
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-[#25fea8] shadow-lg animate-bounce">
                                    <span className="text-4xl">🎯</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#006c44] uppercase tracking-widest mb-1">Result</span>
                                <h2 className="text-2xl font-extrabold text-[#131b2e] mb-4">
                                    It's a {getPredictionLabel()}! 🎉
                                </h2>
                                <div className="w-full max-w-xs space-y-2 mb-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold text-[#4a4455] uppercase tracking-wider">Confidence</span>
                                        <span className={`text-lg font-black ${displayConfidence < 40 ? 'text-[#d97706]' : 'text-[#006c44]'}`}>
                                            {displayConfidence}%
                                        </span>
                                    </div>
                                    <div className="h-5 bg-[#eaedff] rounded-full overflow-hidden p-0.5">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${displayConfidence}%`,
                                                background: displayConfidence < 40 ? '#f59e0b' : '#25fea8'
                                            }}
                                        />
                                    </div>
                                    {displayConfidence < 40 && (
                                        <div className="flex items-start gap-2 px-3 py-2.5 bg-[#fef3c7] border border-[#fde68a] rounded-xl mt-2">
                                            <span className="text-lg">💡</span>
                                            <p className="text-[11px] font-medium text-[#92400e]">Add more different pictures to make your AI smarter!</p>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button onClick={onTryAnother} className="flex items-center justify-center gap-2 py-3.5 bg-[#eaedff] text-[#131b2e] rounded-2xl font-bold hover:bg-[#dae2fd] transition-all text-sm">
                                        🔄 Try Another
                                    </button>
                                    <button onClick={onExport} className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all text-sm">
                                        💾 Save Model
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="py-8">
                                <div className="w-20 h-20 rounded-full bg-[#eaedff] flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">🤔</span>
                                </div>
                                <p className="text-base font-bold text-[#4a4455]">Waiting for input</p>
                                <p className="text-sm text-[#7b7487] mt-1">Capture or upload to test your AI!</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl p-4 flex items-center gap-3 bg-[#f2f3ff] border border-[#dae2fd]/30 shadow-sm">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <p className="text-[10px] text-[#4a4455] opacity-70 font-bold uppercase tracking-wider">Speed</p>
                                <p className="text-lg font-black text-[#131b2e]">{inferenceTime}ms</p>
                            </div>
                        </div>
                        <div className="rounded-2xl p-4 flex items-center gap-3 bg-[#f2f3ff] border border-[#dae2fd]/30 shadow-sm">
                            <span className="text-2xl">📊</span>
                            <div>
                                <p className="text-[10px] text-[#4a4455] opacity-70 font-bold uppercase tracking-wider">Tests</p>
                                <p className="text-lg font-black text-[#131b2e]">{testsRun}</p>
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
        <div className="w-full max-w-lg">
            {children}
            {isProcessing && (
                <div className="flex items-center justify-center gap-3 py-6 animate-fade-in">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#630ed4] animate-bounce delay-0 duration-[600ms]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#630ed4] animate-bounce delay-100 duration-[600ms]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#630ed4] animate-bounce delay-[200ms] duration-[600ms]" />
                    </div>
                    <span className="text-sm font-bold text-[#4a4455]">Analyzing... 🔍</span>
                </div>
            )}
            {prediction && !isProcessing && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-[#dae2fd] shadow-sm">
                    <div className="text-center mb-6">
                        <p className="text-[10px] text-[#4a4455] uppercase tracking-wider font-bold mb-2">🎯 Prediction</p>
                        <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#eaedff] to-[#dbeafe] rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#630ed4] to-[#3b82f6] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {prediction.label.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xl font-bold text-[#131b2e]">{prediction.label}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-sm text-[#4a4455]">Confidence</span>
                            <span className={`text-lg font-bold ${maxConfidence < 0.4 ? 'text-[#d97706]' : maxConfidence < 0.7 ? 'text-[#c32c00]' : 'text-[#006c44]'}`}>
                                {Math.round(maxConfidence * 100)}%
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        {sortedConfidences.map(([label, confidence]) => {
                            const barColor = confidence >= 0.7 ? 'from-[#25fea8] to-[#006c44]' : confidence >= 0.4 ? 'from-[#fbbf24] to-[#d97706]' : 'from-[#fca5a5] to-[#ef4444]'
                            const textColor = confidence >= 0.7 ? 'text-[#006c44]' : confidence >= 0.4 ? 'text-[#d97706]' : 'text-[#dc2626]'
                            return (
                                <div key={label} className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#131b2e] w-20 truncate capitalize">{label}</span>
                                    <div className="flex-1 h-3 bg-[#eaedff] rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`} style={{ width: `${confidence * 100}%` }} />
                                    </div>
                                    <span className={`text-[11px] font-bold ${textColor} w-10 text-right`}>{Math.round(confidence * 100)}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {!prediction && !isProcessing && (
                <div className="flex flex-col items-center py-10">
                    <div className="w-20 h-20 rounded-full bg-[#eaedff] flex items-center justify-center mb-4">
                        <span className="text-4xl">🤔</span>
                    </div>
                    <p className="text-sm font-bold text-[#4a4455]">Waiting for input</p>
                    <p className="text-xs text-[#7b7487] mt-1">Use the camera above to test! 📸</p>
                </div>
            )}
        </div>
    )
}
