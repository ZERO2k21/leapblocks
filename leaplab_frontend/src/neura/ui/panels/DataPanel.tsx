import React from 'react'
import type { TabularColumnInfo } from '../../types/neura.types'
import DataTable from '../components/DataTable'
import DatasetSettings from '../components/DatasetSettings'

interface DataPanelProps {
    density: 'full' | 'compact'
    collectMode: 'choose' | 'editing'
    csvData: { headers: string[]; rows: (string | number)[][]; columnTypes: ('numeric' | 'text')[]; droppedRows: number } | null
    columnInfos: TabularColumnInfo[]
    editHeaders: string[]
    editRows: (string | number)[][]
    disabledRows: Set<number>
    disabledCols: Set<number>
    isDragging: boolean
    newRowCount: number
    newColCount: number
    fileInputRef: React.RefObject<HTMLInputElement | null>
    onSetCollectMode: (mode: 'choose' | 'editing') => void
    onFileUpload: (file: File) => Promise<void>
    onDrop: (e: React.DragEvent) => Promise<void>
    onCreateDataset: () => void
    onUseEditedData: () => void
    onEditHeadersChange: (headers: string[]) => void
    onEditRowsChange: (rows: (string | number)[][]) => void
    onDisabledRowsChange: (rows: Set<number>) => void
    onDisabledColsChange: (cols: Set<number>) => void
    onIsDraggingChange: (dragging: boolean) => void
    onNewRowCountChange: (count: number) => void
    onNewColCountChange: (count: number) => void
}

export default function DataPanel({
    density,
    collectMode,
    csvData,
    columnInfos,
    editHeaders,
    editRows,
    disabledRows,
    disabledCols,
    isDragging,
    newRowCount,
    newColCount,
    fileInputRef,
    onSetCollectMode,
    onFileUpload,
    onDrop,
    onCreateDataset,
    onUseEditedData,
    onEditHeadersChange,
    onEditRowsChange,
    onDisabledRowsChange,
    onDisabledColsChange,
    onIsDraggingChange,
    onNewRowCountChange,
    onNewColCountChange,
}: DataPanelProps) {
    const isCompact = density === 'compact'

    if (collectMode === 'choose' && !csvData) {
        return (
            <div className={`flex flex-col ${isCompact ? 'py-2 px-2 gap-2' : 'flex-1 items-center justify-center py-8 px-5'}`}>
                {!isCompact && (
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#630ed4]/10 to-[#7c3aed]/10 flex items-center justify-center">
                            <span className="text-3xl">📊</span>
                        </div>
                        <h2 className="text-lg font-extrabold text-[#131b2e] mb-1">Add Your Data</h2>
                        <p className="text-xs text-gray-500">Upload a CSV or build a dataset from scratch</p>
                    </div>
                )}
                {isCompact && (
                    <div className="text-center mb-2">
                        <h3 className="text-xs font-extrabold text-[#131b2e]">Add Data</h3>
                    </div>
                )}
                <div className={`flex ${isCompact ? 'gap-2' : 'flex-col sm:flex-row gap-3 w-full max-w-[500px]'}`}>
                    <div
                        onDragOver={(e) => { e.preventDefault(); onIsDraggingChange(true) }}
                        onDragLeave={() => onIsDraggingChange(false)}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer group ${
                            isCompact ? 'p-3' : 'p-6'
                        } ${isDragging ? 'border-[#630ed4] bg-[#f5f3ff] scale-[1.02]' : 'border-gray-200 bg-white hover:border-[#630ed4]/50 hover:bg-[#f5f3ff]/30'}`}
                    >
                        <div className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-2 rounded-xl bg-[#630ed4]/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <svg className={`${isCompact ? 'w-4 h-4' : 'w-6 h-6'} text-[#630ed4]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <p className={`${isCompact ? 'text-[10px]' : 'text-sm'} font-bold text-[#131b2e] mb-0.5`}>Upload CSV</p>
                        <p className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-gray-400`}>{isCompact ? 'CSV' : 'Drag & drop or click'}</p>
                    </div>

                    <div
                        onClick={onCreateDataset}
                        className={`flex-1 border-2 border-dashed border-gray-200 rounded-2xl text-center transition-all cursor-pointer bg-white hover:border-[#630ed4]/50 hover:bg-[#f5f3ff]/30 group ${
                            isCompact ? 'p-3' : 'p-6'
                        }`}
                    >
                        <div className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-2 rounded-xl bg-[#630ed4]/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <svg className={`${isCompact ? 'w-4 h-4' : 'w-6 h-6'} text-[#630ed4]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <p className={`${isCompact ? 'text-[10px]' : 'text-sm'} font-bold text-[#131b2e] mb-0.5`}>Create Dataset</p>
                        <p className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-gray-400`}>{isCompact ? 'Blank' : 'Build from scratch'}</p>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileUpload(f); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="hidden"
                />
            </div>
        )
    }

    if (collectMode === 'choose' && csvData) {
        return (
            <div className={`flex flex-col ${isCompact ? 'py-2 px-2 gap-2' : 'py-3 px-4 gap-3'}`}>
                <DataTable headers={csvData.headers} rows={csvData.rows} columnInfos={columnInfos} readOnly maxRows={isCompact ? 10 : 50} />
                <button
                    onClick={() => onSetCollectMode('editing')}
                    className={`${isCompact ? 'py-1.5 text-[9px]' : 'py-2 text-[10px]'} font-bold text-[#630ed4] bg-[#f5f3ff] rounded-lg border-none cursor-pointer hover:bg-[#ede9fe] transition-all`}
                >
                    ✏️ Edit Data
                </button>
            </div>
        )
    }

    if (collectMode === 'editing') {
        return (
            <div className={`flex flex-col ${isCompact ? 'py-2 px-2 gap-2' : 'py-3 px-4 gap-3'} overflow-y-auto neura-scrollbar`}>
                {!isCompact && (
                    <div className="flex items-center justify-between shrink-0">
                        <button onClick={() => onSetCollectMode('choose')} className="text-[10px] font-bold text-[#630ed4] bg-[#f5f3ff] py-1.5 px-3 rounded-lg border-none cursor-pointer hover:bg-[#ede9fe]">← Back</button>
                        <div className="text-center">
                            <h2 className="text-sm font-extrabold text-[#131b2e]">Edit Dataset</h2>
                            <p className="text-[9px] text-gray-400">{editRows.length} rows · {editHeaders.length} cols</p>
                        </div>
                        <button
                            onClick={onUseEditedData}
                            className="text-[10px] font-bold text-white bg-gradient-to-br from-[#630ed4] to-[#7c3aed] py-1.5 px-3 rounded-lg border-none cursor-pointer shadow-[0_2px_8px_rgba(99,14,212,0.25)] hover:opacity-95 transition-all"
                        >
                            Use This Data →
                        </button>
                    </div>
                )}
                {isCompact && (
                    <div className="flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-bold text-[#131b2e]">Edit</span>
                        <button onClick={onUseEditedData} className="text-[9px] font-bold text-white bg-[#630ed4] py-1 px-2 rounded border-none cursor-pointer">Done</button>
                    </div>
                )}
                <DataTable
                    headers={editHeaders}
                    rows={editRows}
                    columnInfos={columnInfos.length > 0 ? columnInfos : editHeaders.map((_, i) => ({ index: i, name: editHeaders[i], type: 'numeric' as const, uniqueValues: 0, missingCount: 0, isZeroVariance: false }))}
                    readOnly={false}
                    onHeadersChange={onEditHeadersChange}
                    onRowsChange={onEditRowsChange}
                    disabledRows={disabledRows}
                    disabledCols={disabledCols}
                />
                {!isCompact && (
                    <DatasetSettings
                        headers={editHeaders}
                        rows={editRows}
                        disabledRows={disabledRows}
                        disabledCols={disabledCols}
                        onHeadersChange={onEditHeadersChange}
                        onRowsChange={onEditRowsChange}
                        onDisabledRowsChange={onDisabledRowsChange}
                        onDisabledColsChange={onDisabledColsChange}
                    />
                )}
            </div>
        )
    }

    return null
}
