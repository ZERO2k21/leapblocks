export interface ParseResult {
    headers: string[]
    rows: (string | number)[][]
    columnTypes: ('numeric' | 'text')[]
    totalRows: number
    droppedRows: number
}

function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                current += ch
            }
        } else {
            if (ch === '"') {
                inQuotes = true
            } else if (ch === ',') {
                result.push(current.trim())
                current = ''
            } else {
                current += ch
            }
        }
    }
    result.push(current.trim())
    return result
}

function detectColumnTypes(rows: (string | number)[][], colIndex: number): 'numeric' | 'text' {
    let numericCount = 0
    let total = 0
    for (const row of rows) {
        const val = row[colIndex]
        if (val === '' || val === null || val === undefined) continue
        total++
        if (typeof val === 'number' || (typeof val === 'string' && val !== '' && !isNaN(Number(val)))) {
            numericCount++
        }
    }
    return total > 0 && numericCount / total > 0.8 ? 'numeric' : 'text'
}

export function parseCSV(csvString: string): ParseResult {
    const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length < 2) {
        return { headers: [], rows: [], columnTypes: [], totalRows: 0, droppedRows: 0 }
    }

    const headers = parseCSVLine(lines[0])
    const rawRows: string[][] = []
    for (let i = 1; i < lines.length; i++) {
        const parsed = parseCSVLine(lines[i])
        if (parsed.length === headers.length) {
            rawRows.push(parsed)
        }
    }

    const numericRows: (string | number)[][] = rawRows.map(row =>
        row.map(val => {
            const num = Number(val)
            return val !== '' && !isNaN(num) ? num : val
        })
    )

    const columnTypes: ('numeric' | 'text')[] = headers.map((_, i) =>
        detectColumnTypes(numericRows, i)
    )

    const cleanedRows: (string | number)[][] = []
    let droppedRows = 0
    for (const row of numericRows) {
        const hasEmpty = row.some((val, i) => {
            if (val === '' || val === null || val === undefined) return true
            if (columnTypes[i] === 'numeric' && typeof val === 'string' && val !== '') return isNaN(Number(val))
            return false
        })
        if (hasEmpty) {
            droppedRows++
        } else {
            cleanedRows.push(row)
        }
    }

    return {
        headers,
        rows: cleanedRows,
        columnTypes,
        totalRows: cleanedRows.length,
        droppedRows
    }
}
