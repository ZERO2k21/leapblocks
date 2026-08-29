import React from 'react'
import type { TabularColumnInfo, TabularTaskType } from '../../types/neura.types'
import NumericTestPanel from '../components/NumericTestPanel'

interface TabularTestPanelProps {
    density: 'full' | 'compact'
    columnInfos: TabularColumnInfo[]
    featureIndices: number[]
    targetIndex: number
    taskType: TabularTaskType
    onPredict: (values: (string | number)[]) => Promise<{ value: string | number; confidence?: number; probabilities?: Record<string, number> } | null>
    onExportModel: () => Promise<void>
}

export default function TabularTestPanel({
    density,
    columnInfos,
    featureIndices,
    targetIndex,
    taskType,
    onPredict,
    onExportModel,
}: TabularTestPanelProps) {
    const isCompact = density === 'compact'

    return (
        <div className={`flex flex-col ${isCompact ? 'py-2 px-2 gap-2' : 'py-3 px-4 gap-3'} overflow-y-auto neura-scrollbar`}>
            <NumericTestPanel
                columnInfos={columnInfos}
                featureIndices={featureIndices}
                targetIndex={targetIndex}
                taskType={taskType}
                onPredict={onPredict}
            />
            <div className="flex gap-2 shrink-0 pb-2">
                <button onClick={onExportModel} className={`flex-1 ${isCompact ? 'py-1.5 text-[10px]' : 'py-2.5 text-xs'} font-bold border-none bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl cursor-pointer shadow-md hover:opacity-95 transition-all`}>
                    💾 Export Model
                </button>
            </div>
        </div>
    )
}
