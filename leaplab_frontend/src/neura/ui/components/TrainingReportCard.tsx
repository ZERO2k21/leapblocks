import React from 'react'
import type { TabularTaskType, TabularTrainMetrics } from '../../types/neura.types'

interface TrainingReportCardProps {
    density: 'full' | 'compact'
    taskType: TabularTaskType
    finalAccuracy: number | null
    trainSummary: string
    trainMetrics: TabularTrainMetrics[]
    epochResults: number[]
    valEpochResults: number[]
}

export default function TrainingReportCard({
    density,
    taskType,
    finalAccuracy,
    trainSummary,
    trainMetrics,
    epochResults,
    valEpochResults,
}: TrainingReportCardProps) {
    const isCompact = density === 'compact'

    if (!trainSummary || epochResults.length === 0) return null

    const lastMetric = trainMetrics[trainMetrics.length - 1]
    const firstMetric = trainMetrics[0]

    const getPlainLanguage = (): string => {
        if (taskType === 'classification') {
            const trainAcc = epochResults.length > 0 ? Math.round(epochResults[epochResults.length - 1] * 100) : 0
            const valAcc = valEpochResults.length > 0 ? Math.round(valEpochResults[valEpochResults.length - 1] * 100) : 0
            const gap = trainAcc - valAcc

            if (gap > 15) return `Model memorized the training data (${trainAcc}%) but struggles on new data (${valAcc}%). Try fewer epochs or simpler features.`
            if (gap > 8) return `Decent fit. Training: ${trainAcc}%, validation: ${valAcc}%. A small gap is normal.`
            if (valAcc >= 80) return `Strong performance! ${valAcc}% accuracy on unseen data with minimal overfitting.`
            if (valAcc >= 60) return `Moderate accuracy (${valAcc}%). Consider adding more data or trying different features.`
            return `Low accuracy (${valAcc}%). The model needs more data or better features to learn patterns.`
        } else {
            const trainLoss = lastMetric?.trainLoss.toFixed(4) ?? '...'
            const valLoss = lastMetric?.valLoss.toFixed(4) ?? '...'
            const lossRatio = lastMetric && firstMetric ? (lastMetric.valLoss / firstMetric.trainLoss) : 1

            if (lossRatio > 2) return `Model fits training data well (loss: ${trainLoss}) but validation loss (${valLoss}) is much higher — likely overfitting.`
            if (lossRatio > 1.3) return `Reasonable fit. Train loss: ${trainLoss}, validation: ${valLoss}. Some overfitting detected.`
            return `Good generalization. Train loss: ${trainLoss}, validation: ${valLoss}. Both are close.`
        }
    }

    const plainText = getPlainLanguage()

    if (isCompact) {
        return (
            <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-lg p-2 border border-[#630ed4]/10">
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-[8px] font-bold text-[#630ed4] uppercase">Report</span>
                </div>
                <p className="text-[9px] text-gray-600 leading-relaxed">{plainText}</p>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl p-3 border border-[#630ed4]/10">
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">📊</span>
                <span className="text-[10px] font-bold text-[#630ed4] uppercase tracking-wider">Training Report</span>
            </div>
            <p className="text-[11px] text-gray-700 leading-relaxed mb-2">{plainText}</p>
            <div className="flex gap-3 text-[9px] text-gray-500 font-bold">
                {finalAccuracy !== null && (
                    <span>Final: <span className="text-[#630ed4]">{finalAccuracy}%</span></span>
                )}
                {lastMetric && (
                    <>
                        <span>Train loss: <span className="text-[#630ed4]">{lastMetric.trainLoss.toFixed(4)}</span></span>
                        <span>Val loss: <span className="text-[#630ed4]">{lastMetric.valLoss.toFixed(4)}</span></span>
                    </>
                )}
            </div>
        </div>
    )
}
