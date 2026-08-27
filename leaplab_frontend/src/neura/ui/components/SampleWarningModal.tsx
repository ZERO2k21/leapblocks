import React, { useState, useEffect } from 'react'

const DISMISS_KEY = 'neura-sample-warning-dismissed'

interface SampleWarningModalProps {
    classes: { name: string; samples: any[] }[]
    requiredSamples?: number
    accentColor?: string
    accentBg?: string
    projectType?: string
}

export default function SampleWarningModal({
    classes,
    requiredSamples = 20,
    accentColor = '#630ed4',
    accentBg = '#f5f3ff',
    projectType = 'model'
}: SampleWarningModalProps) {
    const [visible, setVisible] = useState(false)
    const [dontShow, setDontShow] = useState(false)

    const underfilled = classes.filter(c => c.samples.length < requiredSamples)
    const totalSamples = classes.reduce((s, c) => s + c.samples.length, 0)
    const totalNeeded = classes.length * requiredSamples
    const overallProgress = totalNeeded > 0 ? Math.min(100, Math.round((totalSamples / totalNeeded) * 100)) : 0

    useEffect(() => {
        const dismissed = sessionStorage.getItem(DISMISS_KEY)
        if (dismissed === 'true') return
        if (underfilled.length > 0 && classes.length >= 2) {
            const timer = setTimeout(() => setVisible(true), 800)
            return () => clearTimeout(timer)
        }
    }, [underfilled.length, classes.length])

    const handleDismiss = () => {
        if (dontShow) {
            sessionStorage.setItem(DISMISS_KEY, 'true')
        }
        setVisible(false)
    }

    if (!visible || underfilled.length === 0) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-[92vw] max-w-[420px] mx-4 overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="p-5 pb-3 text-center" style={{ background: `linear-gradient(135deg, ${accentBg}, white)` }}>
                    <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}>
                        📸
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 mb-1">
                        Collect More Samples
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        For the best <span className="font-bold" style={{ color: accentColor }}>{projectType}</span> accuracy, collect at least <span className="font-extrabold text-gray-800">{requiredSamples} samples</span> per class.
                    </p>
                </div>

                {/* Class Progress List */}
                <div className="px-5 pb-3">
                    <div className="flex flex-col gap-2">
                        {classes.map((cls) => {
                            const count = cls.samples.length
                            const pct = Math.min(100, Math.round((count / requiredSamples) * 100))
                            const isComplete = count >= requiredSamples
                            return (
                                <div key={cls.name} className="flex items-center gap-2.5">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[11px] font-bold text-gray-700 truncate">{cls.name}</span>
                                            <span className={`text-[10px] font-extrabold ${isComplete ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                {count}/{requiredSamples}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: isComplete
                                                        ? 'linear-gradient(to right, #10b981, #34d399)'
                                                        : `linear-gradient(to right, ${accentColor}, ${accentColor}bb)`
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {isComplete && (
                                        <span className="text-emerald-500 text-sm shrink-0">✓</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="px-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overall Progress</span>
                        <span className="text-[11px] font-extrabold" style={{ color: accentColor }}>{overallProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${overallProgress}%`,
                                background: `linear-gradient(to right, ${accentColor}, ${accentColor}cc)`
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-center">
                        {totalSamples} of {totalNeeded} total samples collected
                    </p>
                </div>

                {/* Footer */}
                <div className="px-5 pb-4 flex flex-col gap-2.5">
                    <button
                        onClick={handleDismiss}
                        className="w-full py-2.5 rounded-xl text-[12px] font-extrabold text-white border-none cursor-pointer shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
                    >
                        Got it — Start Collecting!
                    </button>
                    <label className="flex items-center justify-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dontShow}
                            onChange={(e) => setDontShow(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-purple-600"
                        />
                        <span className="text-[10px] text-gray-400">Don't show again this session</span>
                    </label>
                </div>
            </div>
        </div>
    )
}
