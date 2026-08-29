import React from 'react'
import type { TabularConfig, TabularTaskType, TabularTrainMetrics } from '../../types/neura.types'

interface TabularTrainPanelProps {
    density: 'full' | 'compact'
    config: TabularConfig
    taskType: TabularTaskType
    isTraining: boolean
    currentEpoch: number
    epochResults: number[]
    valEpochResults: number[]
    trainMetrics: TabularTrainMetrics[]
    finalAccuracy: number | null
    trainSummary: string
    featureIndices: number[]
    onConfigChange: (config: TabularConfig | ((prev: TabularConfig) => TabularConfig)) => void
    onTrain: () => Promise<void>
    onExportModel: () => Promise<void>
}

export default function TabularTrainPanel({
    density,
    config,
    taskType,
    isTraining,
    currentEpoch,
    epochResults,
    valEpochResults,
    trainMetrics,
    finalAccuracy,
    trainSummary,
    featureIndices,
    onConfigChange,
    onTrain,
    onExportModel,
}: TabularTrainPanelProps) {
    const isCompact = density === 'compact'

    return (
        <div className={`flex flex-col ${isCompact ? 'py-2 px-2 gap-2' : 'py-3 px-4 gap-3'} overflow-y-auto neura-scrollbar`}>
            {/* Training Config */}
            <div className={`bg-white/85 backdrop-blur-md rounded-xl border border-gray-200 shrink-0 ${isCompact ? 'p-2' : 'p-3'}`}>
                <div className={`grid ${isCompact ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3'}`}>
                    {/* Epochs */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold text-gray-500 uppercase`}>Epochs</span>
                            <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-extrabold text-[#630ed4]`}>{config.epochs}</span>
                        </div>
                        <input type="range" min="5" max="200" value={config.epochs} onChange={(e) => onConfigChange(prev => ({ ...prev, epochs: Number(e.target.value) }))} disabled={isTraining} className="w-full h-1.5 rounded-full accent-[#630ed4]" />
                        {!isCompact && <p className="text-[9px] text-gray-400 mt-1 leading-tight">One full pass through your data. Too few → underfits.</p>}
                        <div className="flex gap-1 mt-1">
                            {[10, 25, 50, 100].map(p => (
                                <button key={p} onClick={() => onConfigChange(prev => ({ ...prev, epochs: p }))} disabled={isTraining} className={`flex-1 ${isCompact ? 'py-0 text-[8px]' : 'py-0.5 text-[9px]'} rounded font-bold border-none ${config.epochs === p ? 'bg-[#630ed4] text-white' : 'bg-violet-100 text-gray-600'}`}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Batch Size */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold text-gray-500 uppercase`}>Batch</span>
                            <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-extrabold text-[#630ed4]`}>{config.batchSize}</span>
                        </div>
                        <div className="flex gap-1">
                            {[8, 16, 32, 64].map(bs => (
                                <button key={bs} onClick={() => onConfigChange(prev => ({ ...prev, batchSize: bs }))} disabled={isTraining} className={`flex-1 ${isCompact ? 'py-1 text-[8px]' : 'py-1.5 text-[10px]'} rounded-lg font-bold border-none transition-all ${config.batchSize === bs ? 'bg-[#630ed4] text-white' : 'bg-violet-100 text-gray-600 hover:bg-violet-200'}`}>{bs}</button>
                            ))}
                        </div>
                        {!isCompact && <p className="text-[9px] text-gray-400 mt-1 leading-tight">Rows processed before each weight update. Larger → smoother but slower.</p>}
                    </div>

                    {/* Learning Rate */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold text-gray-500 uppercase`}>LR</span>
                            <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-extrabold text-[#630ed4]`}>{config.learningRate}</span>
                        </div>
                        <input type="range" min="0.0001" max="0.1" step="0.0001" value={config.learningRate} onChange={(e) => onConfigChange(prev => ({ ...prev, learningRate: Number(e.target.value) }))} disabled={isTraining} className="w-full h-1.5 rounded-full accent-[#630ed4]" />
                        {!isCompact && <p className="text-[9px] text-gray-400 mt-1 leading-tight">How big a correction each step makes. Too high → overshoots.</p>}
                    </div>

                    {/* Val Split */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold text-gray-500 uppercase`}>Val</span>
                            <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-extrabold text-[#630ed4]`}>{Math.round(config.valSplit * 100)}%</span>
                        </div>
                        <input type="range" min="0.1" max="0.4" step="0.05" value={config.valSplit} onChange={(e) => onConfigChange(prev => ({ ...prev, valSplit: Number(e.target.value) }))} disabled={isTraining} className="w-full h-1.5 rounded-full accent-[#630ed4]" />
                        {!isCompact && <p className="text-[9px] text-gray-400 mt-1 leading-tight">Portion held out to check if the model generalizes.</p>}
                    </div>
                </div>
            </div>

            {/* Train Button */}
            <button
                onClick={onTrain}
                disabled={isTraining || featureIndices.length === 0}
                className={`w-full rounded-xl font-bold border-none transition-all shrink-0 ${
                    isCompact ? 'py-2 text-[10px]' : 'py-3 text-xs'
                } ${
                    !isTraining && featureIndices.length > 0
                        ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white cursor-pointer shadow-[0_4px_14px_rgba(99,14,212,0.35)] hover:opacity-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
                {isTraining ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {isCompact ? `${currentEpoch}/${config.epochs}` : `Training... Epoch ${currentEpoch}/${config.epochs}`}
                    </span>
                ) : finalAccuracy !== null ? '🔄 Retrain' : '🚀 Start Training'}
            </button>

            {/* Progress */}
            {isTraining && (
                <div className={`bg-white/85 backdrop-blur-md rounded-xl border border-gray-200 shrink-0 ${isCompact ? 'p-2' : 'p-3'}`}>
                    <div className="w-full bg-violet-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#630ed4] to-[#7c3aed] transition-all duration-300" style={{ width: `${(currentEpoch / config.epochs) * 100}%` }} />
                    </div>
                </div>
            )}

            {/* Chart */}
            {epochResults.length > 0 && (
                <div className={`bg-white/85 backdrop-blur-md rounded-xl border border-gray-200 shrink-0 ${isCompact ? 'p-2' : 'p-3'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold text-gray-500 uppercase tracking-wider`}>
                            {taskType === 'classification' ? 'Accuracy' : 'Loss'} vs Epochs
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`${isCompact ? 'text-[7px]' : 'text-[9px]'} font-bold text-[#630ed4] flex items-center gap-1`}>
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#630ed4]" /> Train
                            </span>
                            <span className={`${isCompact ? 'text-[7px]' : 'text-[9px]'} font-bold text-[#a78bfa] flex items-center gap-1`}>
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#a78bfa]" /> Val
                            </span>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                        <svg viewBox="0 0 300 140" className="w-full" style={{ height: isCompact ? '80px' : '120px' }}>
                            <defs>
                                <linearGradient id={`tGrad-${density}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#630ed4" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#630ed4" stopOpacity="0.02" />
                                </linearGradient>
                                <linearGradient id={`vGrad-${density}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>
                            {[0, 0.25, 0.5, 0.75, 1].map(t => {
                                const maxVal = taskType === 'classification' ? 1 : Math.max(...epochResults, ...valEpochResults, 1)
                                const y = 16 + 92 - (t * 92)
                                return <g key={t}><line x1={36} y1={y} x2={284} y2={y} stroke="#f1f5f9" strokeWidth="1" /><text x={30} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="system-ui">{taskType === 'classification' ? `${(t * 100).toFixed(0)}%` : (t * maxVal).toFixed(2)}</text></g>
                            })}
                            {epochResults.length > 0 && (() => {
                                const maxVal = taskType === 'classification' ? 1 : Math.max(...epochResults, ...valEpochResults, 1)
                                const getX = (i: number) => 36 + (i / (Math.max(epochResults.length, 1) - 1 || 1)) * 248
                                const getY = (v: number) => 16 + 92 - (v / maxVal) * 92

                                const trainD = epochResults.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ')
                                const trainArea = `${trainD} L ${getX(epochResults.length - 1).toFixed(1)} 108 L ${getX(0).toFixed(1)} 108 Z`

                                const valD = valEpochResults.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ')
                                const valArea = valEpochResults.length > 0 ? `${valD} L ${getX(valEpochResults.length - 1).toFixed(1)} 108 L ${getX(0).toFixed(1)} 108 Z` : ''

                                return <>
                                    <path d={trainArea} fill={`url(#tGrad-${density})`} />
                                    <path d={trainD} fill="none" stroke="#630ed4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    {epochResults.map((v, i) => <circle key={`t-${i}`} cx={getX(i)} cy={getY(v)} r={i === epochResults.length - 1 ? 4 : 2} fill={i === epochResults.length - 1 ? '#630ed4' : 'white'} stroke="#630ed4" strokeWidth={i === epochResults.length - 1 ? 2 : 1.5} />)}
                                    {valEpochResults.length > 0 && <>
                                        <path d={valArea} fill={`url(#vGrad-${density})`} />
                                        <path d={valD} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
                                        {valEpochResults.map((v, i) => <circle key={`v-${i}`} cx={getX(i)} cy={getY(v)} r={i === valEpochResults.length - 1 ? 4 : 2} fill={i === valEpochResults.length - 1 ? '#a78bfa' : 'white'} stroke="#a78bfa" strokeWidth={i === valEpochResults.length - 1 ? 2 : 1.5} />)}
                                    </>}
                                </>
                            })()}
                            <text x={150} y={136} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600" fontFamily="system-ui">Epochs</text>
                        </svg>
                    </div>
                </div>
            )}

            {/* Summary + Actions */}
            {trainSummary && !isTraining && (
                <div className={`bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl border border-[#630ed4]/10 shrink-0 ${isCompact ? 'p-2' : 'p-3'}`}>
                    <div className="flex items-center gap-1.5 mb-1"><span className={isCompact ? 'text-xs' : 'text-sm'}>📝</span><span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold text-[#630ed4] uppercase tracking-wider`}>Summary</span></div>
                    <p className={`${isCompact ? 'text-[9px]' : 'text-[11px]'} text-gray-700 leading-relaxed`}>
                        {isCompact ? trainSummary.split('. ').slice(0, 2).join('. ') + '.' : trainSummary}
                    </p>
                </div>
            )}

            {finalAccuracy !== null && !isTraining && (
                <div className="flex gap-2 shrink-0 pb-2">
                    <button onClick={onExportModel} className={`${isCompact ? 'py-1.5 px-3 text-[9px]' : 'py-2.5 px-4 text-xs'} font-bold border-2 border-[#630ed4] text-[#630ed4] rounded-xl cursor-pointer bg-white hover:bg-[#f5f3ff] transition-all`}>
                        💾 Export
                    </button>
                </div>
            )}
        </div>
    )
}
