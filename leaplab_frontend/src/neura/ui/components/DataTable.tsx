import React, { useState, useCallback } from 'react'
import type { TabularColumnInfo } from '../../types/neura.types'

interface DataTableProps {
    headers: string[]
    rows: (string | number)[][]
    columnInfos: TabularColumnInfo[]
    maxRows?: number
    readOnly?: boolean
    onHeadersChange?: (headers: string[]) => void
    onRowsChange?: (rows: (string | number)[][]) => void
    disabledRows?: Set<number>
    disabledCols?: Set<number>
}

export default function DataTable({
    headers,
    rows,
    columnInfos,
    maxRows = 50,
    readOnly = true,
    onHeadersChange,
    onRowsChange,
    disabledRows = new Set(),
    disabledCols = new Set()
}: DataTableProps) {
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
    const displayRows = rows.slice(0, maxRows)

    const handleCellChange = useCallback((rowIdx: number, colIdx: number, value: string) => {
        if (!onRowsChange) return
        const newRows = rows.map((row, ri) => {
            if (ri !== rowIdx) return row
            return row.map((cell, ci) => {
                if (ci !== colIdx) return cell
                const num = Number(value)
                return value !== '' && !isNaN(num) ? num : value
            })
        })
        onRowsChange(newRows)
    }, [rows, onRowsChange])

    const handleHeaderChange = useCallback((colIdx: number, value: string) => {
        if (!onHeadersChange) return
        const newHeaders = [...headers]
        newHeaders[colIdx] = value
        onHeadersChange(newHeaders)
    }, [headers, onHeadersChange])

    const getSignalLabel = (info: TabularColumnInfo): { text: string; color: string } => {
        if (info.isZeroVariance) return { text: 'no variance', color: 'bg-amber-100 text-amber-700' }
        if (info.missingCount > 0) return { text: `${info.missingCount} missing`, color: 'bg-orange-100 text-orange-700' }
        if (info.uniqueValues <= 2 && info.type === 'text') return { text: 'low variety', color: 'bg-sky-100 text-sky-700' }
        return { text: 'good signal', color: 'bg-emerald-100 text-emerald-700' }
    }

    return (
        <div className={`w-full overflow-auto rounded-xl border border-gray-200 bg-white text-xs ${!readOnly ? 'max-h-[400px]' : ''}`}>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe]">
                        <th className="py-2 px-3 text-left font-bold text-[#630ed4] border-b border-gray-200 w-10">#</th>
                        {headers.map((h, i) => {
                            const info = columnInfos[i]
                            return (
                                <th key={i} className="border-b border-gray-200 p-0">
                                    {readOnly ? (
                                        <div className="py-2 px-3 flex items-center gap-1.5">
                                            <span className="font-bold text-[#630ed4] whitespace-nowrap">{h}</span>
                                            {info?.isZeroVariance && (
                                                <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold" title="Zero variance — won't help the model">⚠</span>
                                            )}
                                            <span className="text-[8px] bg-[#eaedff] text-[#630ed4] px-1 py-0.5 rounded font-bold">
                                                {info?.type === 'numeric' ? '123' : 'ABC'}
                                            </span>
                                        </div>
                                    ) : (
                                        <input
                                            value={h}
                                            onChange={(e) => handleHeaderChange(i, e.target.value)}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            disabled={disabledCols.has(i)}
                                            className={`w-full py-2 px-3 text-left font-bold text-[#630ed4] bg-transparent border-none outline-none text-xs ${
                                                disabledCols.has(i) ? 'opacity-40 cursor-not-allowed' : 'cursor-text hover:bg-[#f5f3ff]'
                                            }`}
                                        />
                                    )}
                                </th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody>
                    {displayRows.map((row, ri) => (
                        <tr key={ri} className={`${!readOnly && disabledRows.has(ri) ? 'bg-red-50 opacity-50' : ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="py-1.5 px-3 text-gray-400 font-mono border-b border-gray-100">{ri + 1}</td>
                            {row.map((val, ci) => {
                                const info = columnInfos[ci]
                                const displayVal = info?.labelMap && typeof val === 'string'
                                    ? `${val} → ${info.labelMap[val] ?? '?'}`
                                    : String(val)

                                if (readOnly) {
                                    return (
                                        <td key={ci} className="py-1.5 px-3 border-b border-gray-100 font-mono whitespace-nowrap">
                                            {info?.type === 'numeric'
                                                ? <span className="text-[#630ed4] font-semibold">{typeof val === 'number' ? val.toFixed(val % 1 === 0 ? 0 : 2) : val}</span>
                                                : <span className="text-gray-700">{displayVal}</span>
                                            }
                                        </td>
                                    )
                                }

                                const isEditing = editingCell?.row === ri && editingCell?.col === ci
                                const isDisabled = disabledRows.has(ri) || disabledCols.has(ci)
                                return (
                                    <td
                                        key={ci}
                                        className={`border-b border-gray-100 p-0 ${isDisabled ? 'opacity-40' : ''}`}
                                        onClick={() => !isDisabled && setEditingCell({ row: ri, col: ci })}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {isEditing ? (
                                            <input
                                                autoFocus
                                                value={val}
                                                onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onBlur={() => setEditingCell(null)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null) }}
                                                className="w-full py-1 px-2 text-xs font-mono bg-[#f5f3ff] outline-none border-none"
                                            />
                                        ) : (
                                            <div className={`py-1 px-2 font-mono whitespace-nowrap text-xs ${typeof val === 'number' ? 'text-[#630ed4]' : 'text-gray-700'} ${!isDisabled ? 'cursor-text hover:bg-gray-100' : ''}`}>
                                                {String(val)}
                                            </div>
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            {rows.length === 0 && !readOnly && (
                <div className="py-8 text-center text-gray-400 text-xs">Click cells to edit values</div>
            )}
            {rows.length > maxRows && (
                <div className="py-2 px-3 bg-gray-50 text-gray-500 text-center border-t border-gray-200 font-bold">
                    Showing {maxRows} of {rows.length} rows
                </div>
            )}
        </div>
    )
}
