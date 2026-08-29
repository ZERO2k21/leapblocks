import type { TabularColumnInfo } from '../../types/neura.types'

export function analyzeColumns(
    headers: string[],
    rows: (string | number)[][],
    columnTypes: ('numeric' | 'text')[]
): TabularColumnInfo[] {
    return headers.map((name, index) => {
        const values = rows.map(r => r[index])
        const missingCount = values.filter(v => v === '' || v === null || v === undefined).length
        const nonMissing = values.filter(v => v !== '' && v !== null && v !== undefined)
        const uniqueValues = new Set(nonMissing.map(String)).size
        const isZeroVariance = uniqueValues <= 1

        let labelMap: Record<string, number> | undefined
        let reverseLabelMap: Record<number, string> | undefined

        if (columnTypes[index] === 'text' && uniqueValues > 0) {
            const uniqueSorted = [...new Set(nonMissing.map(String))].sort()
            labelMap = {}
            reverseLabelMap = {}
            uniqueSorted.forEach((val, i) => {
                labelMap![val] = i
                reverseLabelMap![i] = val
            })
        }

        return {
            index,
            name,
            type: columnTypes[index],
            uniqueValues,
            missingCount,
            isZeroVariance,
            labelMap,
            reverseLabelMap
        }
    })
}

export function encodeRows(
    rows: (string | number)[][],
    columnInfos: TabularColumnInfo[]
): number[][] {
    return rows.map(row =>
        row.map((val, colIdx) => {
            const info = columnInfos[colIdx]
            if (info.type === 'text' && info.labelMap) {
                return info.labelMap[String(val)] ?? 0
            }
            return typeof val === 'number' ? val : Number(val) || 0
        })
    )
}

export function encodeSingleInput(
    values: (string | number)[],
    columnInfos: TabularColumnInfo[]
): number[] {
    return values.map((val, colIdx) => {
        const info = columnInfos[colIdx]
        if (info.type === 'text' && info.labelMap) {
            return info.labelMap[String(val)] ?? 0
        }
        return typeof val === 'number' ? val : Number(val) || 0
    })
}

export function decodeOutput(
    raw: number,
    taskType: 'classification' | 'regression',
    targetColumnInfo: TabularColumnInfo
): string | number {
    if (taskType === 'regression') {
        return raw
    }
    if (targetColumnInfo.reverseLabelMap) {
        const idx = Math.round(raw)
        return targetColumnInfo.reverseLabelMap[idx] ?? String(idx)
    }
    return String(Math.round(raw))
}
