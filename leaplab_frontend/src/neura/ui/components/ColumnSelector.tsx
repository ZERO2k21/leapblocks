import React from 'react'
import type { TabularColumnInfo, TabularTaskType } from '../../types/neura.types'

interface ColumnSelectorProps {
    columnInfos: TabularColumnInfo[]
    featureIndices: number[]
    targetIndex: number
    taskType: TabularTaskType
    onFeatureToggle: (index: number) => void
    onTargetChange: (index: number) => void
    onTaskTypeChange: (type: TabularTaskType) => void
}

function getSignalBadge(col: TabularColumnInfo): { text: string; className: string } | null {
    if (col.isZeroVariance) return { text: '⚠ no variance', className: 'bg-amber-100 text-amber-700' }
    if (col.missingCount > 0) return { text: `${col.missingCount} missing`, className: 'bg-orange-100 text-orange-700' }
    if (col.uniqueValues <= 2 && col.type === 'text') return { text: 'low variety', className: 'bg-sky-100 text-sky-700' }
    if (col.type === 'numeric') return { text: 'good signal', className: 'bg-emerald-100 text-emerald-700' }
    return null
}

export default function ColumnSelector({
    columnInfos,
    featureIndices,
    targetIndex,
    taskType,
    onFeatureToggle,
    onTargetChange,
    onTaskTypeChange
}: ColumnSelectorProps) {
    const warnings: string[] = []
    if (featureIndices.length === 0) warnings.push('Select at least 1 feature column')
    if (featureIndices.length > 0 && featureIndices.includes(targetIndex)) {
        warnings.push('Target column should not also be a feature')
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Task type selector */}
            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase mb-2">Is your output a category or a number?</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onTaskTypeChange('classification')}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                            taskType === 'classification'
                                ? 'border-[#630ed4] bg-[#f5f3ff] text-[#630ed4]'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        <div className="text-base mb-0.5">🏷️</div>
                        Category → Classification
                        <div className="text-[9px] font-normal mt-0.5 opacity-70">e.g. Yes/No, Red/Green/Blue</div>
                    </button>
                    <button
                        onClick={() => onTaskTypeChange('regression')}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                            taskType === 'regression'
                                ? 'border-[#630ed4] bg-[#f5f3ff] text-[#630ed4]'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        <div className="text-base mb-0.5">📊</div>
                        Number → Regression
                        <div className="text-[9px] font-normal mt-0.5 opacity-70">e.g. price, temperature</div>
                    </button>
                </div>
            </div>

            {/* Target column */}
            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase mb-2">🎯 Output Column (what to predict)</div>
                <select
                    value={targetIndex}
                    onChange={(e) => onTargetChange(Number(e.target.value))}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2 px-3 rounded-lg border border-gray-200 text-xs font-bold text-[#131b2e] bg-white focus:outline-none focus:border-[#630ed4] focus:ring-1 focus:ring-[#630ed4]"
                >
                    {columnInfos.map((col) => {
                        const signal = getSignalBadge(col)
                        return (
                            <option key={col.index} value={col.index}>
                                {col.name} ({col.type === 'numeric' ? 'numeric' : `${col.uniqueValues} categories`})
                                {signal ? ` — ${signal.text}` : ''}
                            </option>
                        )
                    })}
                </select>
            </div>

            {/* Feature columns */}
            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-[#4a4455] tracking-widest uppercase">📥 Input Columns (features)</div>
                    <span className="text-[10px] font-bold text-[#630ed4]">{featureIndices.length} selected</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto neura-scrollbar">
                    {columnInfos
                        .filter(col => col.index !== targetIndex)
                        .map(col => {
                            const isSelected = featureIndices.includes(col.index)
                            const signal = getSignalBadge(col)
                            return (
                                <button
                                    key={col.index}
                                    onClick={() => onFeatureToggle(col.index)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all text-left ${
                                        isSelected
                                            ? 'border-[#630ed4] bg-[#f5f3ff] text-[#630ed4]'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                        isSelected ? 'border-[#630ed4] bg-[#630ed4]' : 'border-gray-300'
                                    }`}>
                                        {isSelected && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate">{col.name}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] font-normal opacity-60">
                                                {col.type === 'numeric' ? 'numeric' : `${col.uniqueValues} categories`}
                                            </span>
                                            {signal && (
                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${signal.className}`}>
                                                    {signal.text}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                        col.type === 'numeric' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {col.type === 'numeric' ? '123' : 'ABC'}
                                    </span>
                                </button>
                            )
                        })}
                </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    {warnings.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-amber-700 font-bold">
                            <span>⚠️</span>
                            <span>{w}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
