import React, { useState, useCallback } from 'react'

interface EditableDataTableProps {
    headers: string[]
    rows: (string | number)[][]
    onHeadersChange: (headers: string[]) => void
    onRowsChange: (rows: (string | number)[][]) => void
    disabledRows?: Set<number>
    disabledCols?: Set<number>
}

export default function EditableDataTable({
    headers,
    rows,
    onHeadersChange,
    onRowsChange,
    disabledRows = new Set(),
    disabledCols = new Set()
}: EditableDataTableProps) {
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)

    const handleCellChange = useCallback((rowIdx: number, colIdx: number, value: string) => {
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
        const newHeaders = [...headers]
        newHeaders[colIdx] = value
        onHeadersChange(newHeaders)
    }, [headers, onHeadersChange])

    return (
        <div className="w-full overflow-auto rounded-xl border border-gray-200 bg-white text-xs max-h-[400px]">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe]">
                        <th className="py-2 px-2 text-left font-bold text-[#630ed4] border-b border-gray-200 w-8">#</th>
                        {headers.map((h, i) => (
                            <th key={i} className="border-b border-gray-200 p-0">
                                <input
                                    value={h}
                                    onChange={(e) => handleHeaderChange(i, e.target.value)}
                                    disabled={disabledCols.has(i)}
                                    className={`w-full py-2 px-2 text-left font-bold text-[#630ed4] bg-transparent border-none outline-none text-xs ${
                                        disabledCols.has(i) ? 'opacity-40 cursor-not-allowed' : 'cursor-text hover:bg-[#f5f3ff]'
                                    }`}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri} className={`${disabledRows.has(ri) ? 'bg-red-50 opacity-50' : ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="py-1 px-2 text-gray-400 font-mono border-b border-gray-100">{ri + 1}</td>
                            {row.map((val, ci) => {
                                const isEditing = editingCell?.row === ri && editingCell?.col === ci
                                const isDisabled = disabledRows.has(ri) || disabledCols.has(ci)
                                return (
                                    <td
                                        key={ci}
                                        className={`border-b border-gray-100 p-0 ${isDisabled ? 'opacity-40' : ''}`}
                                        onClick={() => !isDisabled && setEditingCell({ row: ri, col: ci })}
                                    >
                                        {isEditing ? (
                                            <input
                                                autoFocus
                                                value={val}
                                                onChange={(e) => handleCellChange(ri, ci, e.target.value)}
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
            {rows.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-xs">Click cells to edit values</div>
            )}
        </div>
    )
}
