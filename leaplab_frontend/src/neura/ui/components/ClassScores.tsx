import React from 'react'

interface ClassScoresProps {
    confidences: Record<string, number>
    accentColor?: string
    accentBg?: string
}

export default function ClassScores({ confidences, accentColor = '#630ed4', accentBg = '#f5f3ff' }: ClassScoresProps) {
    const sorted = Object.entries(confidences).sort(([, a], [, b]) => b - a)
    if (sorted.length === 0) return null

    return (
        <div className="bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-gray-100">
            <span className="text-[9px] font-extrabold uppercase tracking-widest block mb-2" style={{ color: accentColor }}>
                All Class Scores
            </span>
            <div className="flex flex-col gap-1.5">
                {sorted.map(([label, conf], idx) => {
                    const pct = Math.round(conf * 100)
                    const isTop = idx === 0
                    return (
                        <div
                            key={label}
                            className={`rounded-lg p-2 transition-all ${
                                isTop
                                    ? 'border'
                                    : 'bg-gray-50 border border-gray-100'
                            }`}
                            style={isTop ? { backgroundColor: accentBg, borderColor: `${accentColor}22` } : undefined}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span
                                    className={`text-[11px] font-bold capitalize ${isTop ? '' : 'text-gray-700'}`}
                                    style={isTop ? { color: accentColor } : undefined}
                                >
                                    {isTop && <span className="mr-1">🏆</span>}
                                    {label}
                                </span>
                                <span className={`text-[11px] font-extrabold ${pct >= 50 ? 'text-emerald-600' : pct >= 25 ? 'text-amber-600' : 'text-gray-400'}`}>
                                    {pct}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-[width] duration-200 ease-out"
                                    style={{
                                        width: `${pct}%`,
                                        background: isTop
                                            ? `linear-gradient(to right, ${accentColor}, ${accentColor}cc)`
                                            : pct >= 25
                                                ? 'linear-gradient(to right, #fbbf24, #f59e0b)'
                                                : '#d1d5db'
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
