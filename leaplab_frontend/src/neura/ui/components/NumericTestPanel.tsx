import React, { useState, useEffect } from 'react'
import type { TabularColumnInfo, TabularTaskType } from '../../types/neura.types'

interface NumericTestPanelProps {
    columnInfos: TabularColumnInfo[]
    featureIndices: number[]
    targetIndex: number
    taskType: TabularTaskType
    onPredict: (values: (string | number)[]) => Promise<{ value: string | number; confidence?: number; probabilities?: Record<string, number> } | null>
}

export default function NumericTestPanel({
    columnInfos,
    featureIndices,
    targetIndex,
    taskType,
    onPredict
}: NumericTestPanelProps) {
    const [inputValues, setInputValues] = useState<(string | number)[]>(() =>
        featureIndices.map(i => {
            const col = columnInfos[i]
            if (col.type === 'numeric') return 0
            return col.labelMap ? Object.keys(col.labelMap)[0] : ''
        })
    )
    const [result, setResult] = useState<{ value: string | number; confidence?: number; probabilities?: Record<string, number> } | null>(null)
    const [isPredicting, setIsPredicting] = useState(false)

    // keep inputs in sync when features/columns change (e.g., after Create/Setup) - makes table editable efficiently
    useEffect(() => {
        setInputValues(featureIndices.map(i => {
            const col = columnInfos[i]
            if (!col) return 0
            if (col.type === 'numeric') return 0
            return col.labelMap ? Object.keys(col.labelMap)[0] : ''
        }))
        setResult(null)
    }, [featureIndices, columnInfos])

    const handlePredict = async () => {
        setIsPredicting(true)
        try {
            const allValues: (string | number)[] = columnInfos.map((_, i) => {
                const featureIdx = featureIndices.indexOf(i)
                if (featureIdx >= 0) return inputValues[featureIdx]
                return 0
            })
            const pred = await onPredict(allValues)
            setResult(pred)
        } catch {
            setResult(null)
        }
        setIsPredicting(false)
    }

    const targetInfo = columnInfos[targetIndex]

    return (
        <div className="flex flex-col gap-3">
            {/* Input fields */}
            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase mb-2">Enter values</div>
                <div className="flex flex-col gap-2">
                    {featureIndices.map((fi, uiIdx) => {
                        const col = columnInfos[fi]
                        return (
                            <div key={fi} className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-600 w-28 shrink-0 truncate">{col.name}</label>
                                {col.type === 'text' && col.labelMap ? (
                                    <select
                                        value={String(inputValues[uiIdx])}
                                        onChange={(e) => {
                                            const newVals = [...inputValues]
                                            newVals[uiIdx] = e.target.value
                                            setInputValues(newVals)
                                        }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 py-1.5 px-2.5 rounded-lg border border-gray-200 text-xs font-bold text-[#131b2e] bg-white focus:outline-none focus:border-[#630ed4]"
                                    >
                                        {Object.keys(col.labelMap).map(opt => (
                                            <option key={opt} value={opt}>{opt} ({col.labelMap![opt]})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="number"
                                        step="any"
                                        value={inputValues[uiIdx] as number}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            const newVals = [...inputValues]
                                            newVals[uiIdx] = e.target.value === '' ? 0 : Number(e.target.value)
                                            setInputValues(newVals)
                                        }}
                                        className="flex-1 py-1.5 px-2.5 rounded-lg border border-gray-200 text-xs font-bold text-[#131b2e] bg-white focus:outline-none focus:border-[#630ed4]"
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
                <button
                    onClick={handlePredict}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={isPredicting}
                    className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold border-none transition-all ${
                        isPredicting
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white cursor-pointer shadow-[0_4px_14px_rgba(99,14,212,0.35)] hover:opacity-95'
                    }`}
                >
                    {isPredicting ? 'Analysing...' : '🔮 Predict'}
                </button>
            </div>

            {/* Result */}
            {result && (
                <div className="bg-white/85 backdrop-blur-md rounded-xl p-4 border border-gray-200">
                    <div className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase mb-2">Result</div>
                    {taskType === 'classification' ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <div className="text-lg font-extrabold text-[#630ed4]">{String(result.value)}</div>
                                    {result.confidence !== undefined && (
                                        <div className="text-[10px] text-gray-500 font-bold">
                                            {Math.round(result.confidence * 100)}% confidence
                                        </div>
                                    )}
                                </div>
                            </div>
                            {result.probabilities && (
                                <div className="flex flex-col gap-1.5">
                                    {Object.entries(result.probabilities)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([label, prob]) => {
                                            const pct = Math.round(prob * 100)
                                            const isTop = label === String(result.value)
                                            return (
                                                <div key={label} className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold w-20 truncate ${isTop ? 'text-[#630ed4]' : 'text-gray-600'}`}>
                                                        {isTop && '🏆 '}{label}
                                                    </span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-[width] duration-300 ${
                                                                isTop ? 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed]' : 'bg-gray-300'
                                                            }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{pct}%</span>
                                                </div>
                                            )
                                        })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            <div>
                                <div className="text-lg font-extrabold text-[#630ed4]">
                                    {typeof result.value === 'number' ? result.value.toFixed(4) : result.value}
                                </div>
                                <div className="text-[10px] text-gray-500 font-bold">Predicted value</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
