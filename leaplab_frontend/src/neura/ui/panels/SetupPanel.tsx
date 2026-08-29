import React from 'react'
import type { TabularColumnInfo, TabularTaskType } from '../../types/neura.types'
import DataTable from '../components/DataTable'
import ColumnSelector from '../components/ColumnSelector'

interface SetupPanelProps {
    density: 'full' | 'compact'
    csvData: { headers: string[]; rows: (string | number)[][]; columnTypes: ('numeric' | 'text')[]; droppedRows: number } | null
    columnInfos: TabularColumnInfo[]
    featureIndices: number[]
    targetIndex: number
    taskType: TabularTaskType
    onFeatureToggle: (index: number) => void
    onTargetChange: (index: number) => void
    onTaskTypeChange: (type: TabularTaskType) => void
}

export default function SetupPanel({
    density,
    csvData,
    columnInfos,
    featureIndices,
    targetIndex,
    taskType,
    onFeatureToggle,
    onTargetChange,
    onTaskTypeChange,
}: SetupPanelProps) {
    const isCompact = density === 'compact'

    if (!csvData) return null

    return (
        <div className={`flex flex-col ${isCompact ? 'py-2 px-2 gap-2' : 'py-3 px-4 gap-3'} overflow-y-auto neura-scrollbar`}>
            {!isCompact && (
                <div className="shrink-0">
                    <DataTable headers={csvData.headers} rows={csvData.rows} columnInfos={columnInfos} readOnly />
                </div>
            )}
            <div className="shrink-0">
                <ColumnSelector
                    columnInfos={columnInfos}
                    featureIndices={featureIndices}
                    targetIndex={targetIndex}
                    taskType={taskType}
                    onFeatureToggle={onFeatureToggle}
                    onTargetChange={onTargetChange}
                    onTaskTypeChange={onTaskTypeChange}
                />
            </div>
        </div>
    )
}
