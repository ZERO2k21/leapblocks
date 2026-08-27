import React from 'react'

interface AccuracyChartProps {
    epochResults: number[]
    isTraining: boolean
    currentEpoch?: number
}

export default function AccuracyChart({ epochResults, isTraining, currentEpoch = 0 }: AccuracyChartProps) {
    const padding = { top: 16, right: 16, bottom: 32, left: 36 }
    const width = 300
    const height = 170
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const data = epochResults.length > 0 ? epochResults : []
    const hasData = data.length > 0
    const maxEpochs = Math.max(data.length, 1)

    const getX = (i: number) => padding.left + (i / (maxEpochs - 1 || 1)) * chartW
    const getY = (v: number) => padding.top + chartH - Math.max(0, Math.min(1, v)) * chartH

    const pathD = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ')
    const areaD = hasData
        ? `${pathD} L ${getX(data.length - 1).toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`
        : ''

    const yTicks = [0, 0.25, 0.5, 0.75, 1.0]

    // Show at most ~6 X-axis labels to avoid overlap
    const xLabelCount = Math.min(6, maxEpochs)
    const xStep = Math.max(1, Math.floor(maxEpochs / (xLabelCount - 1 || 1)))
    const xLabels: number[] = []
    for (let i = 0; i < maxEpochs; i += xStep) {
        xLabels.push(i)
    }
    if (xLabels[xLabels.length - 1] !== maxEpochs - 1 && maxEpochs > 1) {
        xLabels.push(maxEpochs - 1)
    }

    const finalAccuracy = hasData ? data[data.length - 1] : 0

    return (
        <div className="w-full bg-white/85 backdrop-blur-xl rounded-xl p-3 border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase">Accuracy Vs Epochs</span>
                {isTraining && currentEpoch > 0 && (
                    <span className="text-[10px] font-bold text-[#630ed4]">Epoch {currentEpoch}/{epochResults.length || '...'}</span>
                )}
                {!isTraining && hasData && (
                    <span className="text-[10px] font-bold text-emerald-600">{(finalAccuracy * 100).toFixed(0)}%</span>
                )}
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '170px' }}>
                    <defs>
                        <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#630ed4" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#630ed4" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines & Y-axis labels */}
                    {yTicks.map((tick) => (
                        <g key={`y-${tick}`}>
                            <line
                                x1={padding.left}
                                y1={getY(tick)}
                                x2={width - padding.right}
                                y2={getY(tick)}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                            />
                            <text
                                x={padding.left - 6}
                                y={getY(tick) + 3}
                                textAnchor="end"
                                fill="#94a3b8"
                                fontSize="9"
                                fontFamily="system-ui"
                            >
                                {(tick * 100).toFixed(0)}%
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {xLabels.map((i) => (
                        <text
                            key={`x-${i}`}
                            x={getX(i)}
                            y={height - 10}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="9"
                            fontFamily="system-ui"
                        >
                            {i + 1}
                        </text>
                    ))}

                    {/* X-axis title */}
                    <text
                        x={width / 2}
                        y={height - 1}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="system-ui"
                    >
                        Epochs
                    </text>

                    {/* Area fill */}
                    {hasData && areaD && (
                        <path
                            d={areaD}
                            fill="url(#accuracyGradient)"
                        />
                    )}

                    {/* Line path */}
                    {hasData && data.length > 1 && (
                        <path
                            d={pathD}
                            fill="none"
                            stroke="#630ed4"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Data points */}
                    {hasData && data.map((v, i) => (
                        <circle
                            key={`dot-${i}`}
                            cx={getX(i)}
                            cy={getY(v)}
                            r={i === data.length - 1 ? 4 : 2.5}
                            fill={i === data.length - 1 ? '#630ed4' : 'white'}
                            stroke="#630ed4"
                            strokeWidth={i === data.length - 1 ? 2.5 : 1.5}
                        />
                    ))}

                    {/* Final accuracy label */}
                    {hasData && data.length > 1 && (
                        <text
                            x={getX(data.length - 1)}
                            y={getY(finalAccuracy) - 10}
                            textAnchor="middle"
                            fill="#630ed4"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="system-ui"
                        >
                            {(finalAccuracy * 100).toFixed(0)}%
                        </text>
                    )}

                    {/* Empty state */}
                    {!hasData && (
                        <text
                            x={width / 2}
                            y={height / 2}
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize="11"
                            fontFamily="system-ui"
                        >
                            Press Train to begin
                        </text>
                    )}
                </svg>
            </div>
        </div>
    )
}
