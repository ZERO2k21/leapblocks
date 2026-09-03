import React, { useState } from 'react'

interface DatasetSettingsProps {
    headers: string[]
    rows: (string | number)[][]
    disabledRows: Set<number>
    disabledCols: Set<number>
    onHeadersChange: (headers: string[]) => void
    onRowsChange: (rows: (string | number)[][]) => void
    onDisabledRowsChange: (rows: Set<number>) => void
    onDisabledColsChange: (cols: Set<number>) => void
}

export default function DatasetSettings({
    headers,
    rows,
    disabledRows,
    disabledCols,
    onHeadersChange,
    onRowsChange,
    onDisabledRowsChange,
    onDisabledColsChange
}: DatasetSettingsProps) {
    const [selectedCol, setSelectedCol] = useState<number | null>(null)
    const [selectedRow, setSelectedRow] = useState<number | null>(null)
    const [addColCount, setAddColCount] = useState(1)
    const [addRowCount, setAddRowCount] = useState(1)
    const [replaceFrom, setReplaceFrom] = useState('')
    const [replaceTo, setReplaceTo] = useState('')

    const handleShuffle = () => {
        const indexed = rows.map((r, i) => ({ r, i }))
        for (let i = indexed.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
        }
        onRowsChange(indexed.map(x => x.r))
    }

    const handleAddColumns = () => {
        const newHeaders = [...headers]
        for (let i = 0; i < addColCount; i++) {
            newHeaders.push(`Feature ${headers.length + 1}`)
        }
        onHeadersChange(newHeaders)
        const newRows = rows.map(row => [...row, ...Array(addColCount).fill(0)])
        onRowsChange(newRows)
    }

    const handleAddRows = () => {
        const newRow = Array(headers.length).fill(0)
        const newRows = [...rows, ...Array(addRowCount).fill(newRow)]
        onRowsChange(newRows)
    }

    const handleDeleteSelectedCol = () => {
        if (selectedCol === null || selectedCol >= headers.length) return
        onHeadersChange(headers.filter((_, i) => i !== selectedCol))
        onRowsChange(rows.map(row => row.filter((_, i) => i !== selectedCol)))
        const newDisabled = new Set<number>()
        disabledCols.forEach(c => {
            if (c < selectedCol) newDisabled.add(c)
            else if (c > selectedCol) newDisabled.add(c - 1)
        })
        onDisabledColsChange(newDisabled)
        setSelectedCol(null)
    }

    const handleDeleteSelectedRow = () => {
        if (selectedRow === null || selectedRow >= rows.length) return
        onRowsChange(rows.filter((_, i) => i !== selectedRow))
        const newDisabled = new Set<number>()
        disabledRows.forEach(r => {
            if (r < selectedRow) newDisabled.add(r)
            else if (r > selectedRow) newDisabled.add(r - 1)
        })
        onDisabledRowsChange(newDisabled)
        setSelectedRow(null)
    }

    const handleCopySelectedCol = () => {
        if (selectedCol === null || selectedCol >= headers.length) return
        const newHeaders = [...headers]
        newHeaders.splice(selectedCol + 1, 0, `${headers[selectedCol]} (copy)`)
        onHeadersChange(newHeaders)
        const newRows = rows.map(row => {
            const newRow = [...row]
            newRow.splice(selectedCol + 1, 0, row[selectedCol])
            return newRow
        })
        onRowsChange(newRows)
    }

    const handleCopySelectedRow = () => {
        if (selectedRow === null || selectedRow >= rows.length) return
        const newRows = [...rows]
        newRows.splice(selectedRow + 1, 0, [...rows[selectedRow]])
        onRowsChange(newRows)
    }

    const handleReset = (type: 'col' | 'row') => {
        if (type === 'col') {
            onDisabledColsChange(new Set())
            setSelectedCol(null)
        } else {
            onDisabledRowsChange(new Set())
            setSelectedRow(null)
        }
    }

    const handleToggleCol = (action: 'enable' | 'disable') => {
        if (selectedCol === null) return
        const newDisabled = new Set(disabledCols)
        if (action === 'disable') newDisabled.add(selectedCol)
        else newDisabled.delete(selectedCol)
        onDisabledColsChange(newDisabled)
    }

    const handleToggleRow = (action: 'enable' | 'disable') => {
        if (selectedRow === null) return
        const newDisabled = new Set(disabledRows)
        if (action === 'disable') newDisabled.add(selectedRow)
        else newDisabled.delete(selectedRow)
        onDisabledRowsChange(newDisabled)
    }

    const handleTextToNumber = () => {
        if (selectedCol === null) return
        const map = new Map<string, number>()
        let nextId = 0
        const newRows = rows.map(row => {
            const newRow = [...row]
            const val = String(newRow[selectedCol])
            if (isNaN(Number(val)) || val === '') {
                if (!map.has(val)) map.set(val, nextId++)
                newRow[selectedCol] = map.get(val)!
            }
            return newRow
        })
        onRowsChange(newRows)
    }

    const handleReplace = () => {
        if (selectedCol === null || !replaceFrom) return
        const newRows = rows.map(row => {
            const newRow = [...row]
            if (String(newRow[selectedCol]) === replaceFrom) {
                newRow[selectedCol] = isNaN(Number(replaceTo)) ? replaceTo : Number(replaceTo)
            }
            return newRow
        })
        onRowsChange(newRows)
    }

    const Button = ({ onClick, children, active, small }: { onClick: () => void; children: React.ReactNode; active?: boolean; small?: boolean }) => (
        <button
            onClick={onClick}
            className={`${small ? 'py-1 px-2 text-[9px]' : 'py-1.5 px-3 text-[10px]'} rounded-lg font-bold border-none transition-all ${
                active ? 'bg-[#630ed4] text-white' : 'bg-[#630ed4]/10 text-[#630ed4] hover:bg-[#630ed4]/20'
            }`}
        >
            {children}
        </button>
    )

    return (
        <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl p-3 border border-[#630ed4]/10" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <div className="text-[10px] font-bold text-[#630ed4] tracking-widest uppercase mb-2">⚙️ Dataset Settings</div>

            {/* Row 1: Shuffle + Set as Output */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-600">Dataset:</span>
                <Button onClick={handleShuffle}>Shuffle</Button>
                <div className="w-px h-4 bg-[#630ed4]/20" />
                <span className="text-[10px] font-bold text-gray-600">Selected column:</span>
                <Button onClick={() => {}} active={false}>Set as Output</Button>
            </div>

            {/* Row 2: Add features + Add rows */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-600">Add</span>
                <input
                    type="number"
                    min="1"
                    max="20"
                    value={addColCount}
                    onChange={(e) => setAddColCount(Math.max(1, Number(e.target.value)))}
                    className="w-10 py-1 px-1.5 rounded border border-[#630ed4]/20 text-[10px] font-bold text-center bg-white"
                />
                <span className="text-[10px] font-bold text-gray-600">Features(columns)</span>
                <Button onClick={handleAddColumns}>Add</Button>
                <div className="w-px h-4 bg-[#630ed4]/20" />
                <span className="text-[10px] font-bold text-gray-600">Add</span>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={addRowCount}
                    onChange={(e) => setAddRowCount(Math.max(1, Number(e.target.value)))}
                    className="w-10 py-1 px-1.5 rounded border border-[#630ed4]/20 text-[10px] font-bold text-center bg-white"
                />
                <span className="text-[10px] font-bold text-gray-600">Dataset size(rows)</span>
                <Button onClick={handleAddRows}>Add</Button>
            </div>

            {/* Row 3: Column operations */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-gray-600">Selected columns:</span>
                <select
                    value={selectedCol ?? ''}
                    onChange={(e) => setSelectedCol(e.target.value ? Number(e.target.value) : null)}
                    className="py-1 px-2 rounded border border-[#630ed4]/20 text-[10px] font-bold bg-white"
                >
                    <option value="">Select...</option>
                    {headers.map((h, i) => (
                        <option key={i} value={i}>{h} {disabledCols.has(i) ? '(disabled)' : ''}</option>
                    ))}
                </select>
                <Button onClick={handleCopySelectedCol} small>Create Copy</Button>
                <Button onClick={handleDeleteSelectedCol} small>Delete</Button>
                <Button onClick={() => handleReset('col')} small>Reset</Button>
                <div className="w-px h-4 bg-[#630ed4]/20" />
                <Button onClick={() => handleToggleCol('enable')} small>Enable</Button>
                <Button onClick={() => handleToggleCol('disable')} small>Disable</Button>
            </div>

            {/* Row 4: Row operations */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-gray-600">Selected rows:</span>
                <select
                    value={selectedRow ?? ''}
                    onChange={(e) => setSelectedRow(e.target.value ? Number(e.target.value) : null)}
                    className="py-1 px-2 rounded border border-[#630ed4]/20 text-[10px] font-bold bg-white"
                >
                    <option value="">Select...</option>
                    {rows.map((_, i) => (
                        <option key={i} value={i}>Row {i + 1} {disabledRows.has(i) ? '(disabled)' : ''}</option>
                    ))}
                </select>
                <Button onClick={handleCopySelectedRow} small>Create Copy</Button>
                <Button onClick={handleDeleteSelectedRow} small>Delete</Button>
                <Button onClick={() => handleReset('row')} small>Reset</Button>
                <div className="w-px h-4 bg-[#630ed4]/20" />
                <Button onClick={() => handleToggleRow('enable')} small>Enable</Button>
                <Button onClick={() => handleToggleRow('disable')} small>Disable</Button>
            </div>

            {/* Row 5: Preprocessing */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#630ed4]/10">
                <span className="text-[10px] font-bold text-gray-600">Selected columns(Preprocessing):</span>
                <Button onClick={handleTextToNumber} small>Text to Number</Button>
                <div className="w-px h-4 bg-[#630ed4]/20" />
                <input
                    value={replaceFrom}
                    onChange={(e) => setReplaceFrom(e.target.value)}
                    placeholder="Text or Number"
                    className="w-20 py-1 px-1.5 rounded border border-[#630ed4]/20 text-[10px] bg-white"
                />
                <span className="text-[10px] font-bold text-gray-600">to</span>
                <input
                    value={replaceTo}
                    onChange={(e) => setReplaceTo(e.target.value)}
                    placeholder="Number"
                    className="w-16 py-1 px-1.5 rounded border border-[#630ed4]/20 text-[10px] bg-white"
                />
                <Button onClick={handleReplace} small>Replace</Button>
            </div>
        </div>
    )
}
