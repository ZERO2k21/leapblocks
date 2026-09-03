import { useRef, useState, useCallback } from 'react'
import type { UseNeuraProjectReturn } from './useNeuraProject'
import { parseCSV } from '../ml/utils/csvParser'
import { analyzeColumns, encodeRows, encodeSingleInput, decodeOutput } from '../ml/utils/encoding'
import { TabularClassifier } from '../ml/classifiers/TabularClassifier'
import type { TabularColumnInfo, TabularConfig, TabularTaskType, TabularTrainMetrics } from '../types/neura.types'

export type TabularStep = 'collect' | 'configure' | 'train' | 'test'
export type CollectMode = 'choose' | 'editing'

export interface TabularState {
    step: TabularStep
    collectMode: CollectMode
    csvData: { headers: string[]; rows: (string | number)[][]; columnTypes: ('numeric' | 'text')[]; droppedRows: number } | null
    columnInfos: TabularColumnInfo[]
    featureIndices: number[]
    targetIndex: number
    taskType: TabularTaskType
    config: TabularConfig
    isTraining: boolean
    currentEpoch: number
    epochResults: number[]
    valEpochResults: number[]
    trainMetrics: TabularTrainMetrics[]
    finalAccuracy: number | null
    trainSummary: string
    isDragging: boolean
    newRowCount: number
    newColCount: number
    editHeaders: string[]
    editRows: (string | number)[][]
    disabledRows: Set<number>
    disabledCols: Set<number>
    dataReady: boolean
    hasDataForStep: (s: TabularStep) => boolean
}

export interface TabularActions {
    setStep: (step: TabularStep) => void
    setCollectMode: (mode: CollectMode) => void
    setCsvData: (data: TabularState['csvData']) => void
    setTaskType: (type: TabularTaskType) => void
    setConfig: (config: TabularConfig | ((prev: TabularConfig) => TabularConfig)) => void
    setFeatureIndices: (indices: number[] | ((prev: number[]) => number[])) => void
    setTargetIndex: (index: number) => void
    setIsDragging: (dragging: boolean) => void
    setNewRowCount: (count: number) => void
    setNewColCount: (count: number) => void
    setEditHeaders: (headers: string[]) => void
    setEditRows: (rows: (string | number)[][]) => void
    setDisabledRows: (rows: Set<number>) => void
    setDisabledCols: (cols: Set<number>) => void
    handleFileUpload: (file: File) => Promise<void>
    handleDrop: (e: React.DragEvent) => Promise<void>
    handleCreateDataset: () => void
    handleUseEditedData: () => void
    handleFeatureToggle: (index: number) => void
    handleTrain: () => Promise<void>
    handlePredict: (values: (string | number)[]) => Promise<{ value: string | number; confidence?: number; probabilities?: Record<string, number> } | null>
    handleExportModel: () => Promise<void>
    handleStepClick: (s: TabularStep) => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
}

const STEP_DATA_FLAGS: Record<TabularStep, (args: { dataReady: boolean; featureIndices: number[]; finalAccuracy: number | null }) => boolean> = {
    collect: ({ dataReady }) => dataReady,
    configure: ({ featureIndices }) => featureIndices.length > 0,
    train: ({ finalAccuracy }) => finalAccuracy !== null,
    test: ({ finalAccuracy }) => finalAccuracy !== null,
}

export function useTabularState(mode: UseNeuraProjectReturn): TabularState & TabularActions {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new TabularClassifier())

    const [step, setStep] = useState<TabularStep>('collect')
    const [collectMode, setCollectMode] = useState<CollectMode>('choose')
    const [csvData, setCsvData] = useState<TabularState['csvData']>(null)
    const [columnInfos, setColumnInfos] = useState<TabularColumnInfo[]>([])
    const [featureIndices, setFeatureIndices] = useState<number[]>([])
    const [targetIndex, setTargetIndex] = useState(0)
    const [taskType, setTaskType] = useState<TabularTaskType>('classification')
    const [config, setConfig] = useState<TabularConfig>({ epochs: 50, batchSize: 16, learningRate: 0.01, taskType: 'classification', valSplit: 0.2 })

    const [isTraining, setIsTraining] = useState(false)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const [epochResults, setEpochResults] = useState<number[]>([])
    const [valEpochResults, setValEpochResults] = useState<number[]>([])
    const [trainMetrics, setTrainMetrics] = useState<TabularTrainMetrics[]>([])
    const [finalAccuracy, setFinalAccuracy] = useState<number | null>(null)
    const [trainSummary, setTrainSummary] = useState('')

    const [isDragging, setIsDragging] = useState(false)
    const [newRowCount, setNewRowCount] = useState(12)
    const [newColCount, setNewColCount] = useState(10)
    const [editHeaders, setEditHeaders] = useState<string[]>([])
    const [editRows, setEditRows] = useState<(string | number)[][]>([])
    const [disabledRows, setDisabledRows] = useState<Set<number>>(new Set())
    const [disabledCols, setDisabledCols] = useState<Set<number>>(new Set())

    const dataReady = csvData !== null

    const hasDataForStep = useCallback((s: TabularStep): boolean => {
        return STEP_DATA_FLAGS[s]({ dataReady, featureIndices, finalAccuracy })
    }, [dataReady, featureIndices, finalAccuracy])

    const applyDataToState = useCallback((headers: string[], rows: (string | number)[][]) => {
        const columnTypes: ('numeric' | 'text')[] = headers.map((_, i) => {
            let numericCount = 0
            let total = 0
            for (const row of rows) {
                const val = row[i]
                if (val === '' || val === null || val === undefined) continue
                total++
                if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) numericCount++
            }
            return total > 0 && numericCount / total > 0.8 ? 'numeric' : 'text'
        })
        const infos = analyzeColumns(headers, rows, columnTypes)
        const numericCols = infos.filter((c: TabularColumnInfo) => c.type === 'numeric' && !c.isZeroVariance)
        const defaultTarget = numericCols.length > 0 ? numericCols[numericCols.length - 1].index : infos[infos.length - 1].index
        const defaultFeatures = infos.filter((c: TabularColumnInfo) => c.index !== defaultTarget && !c.isZeroVariance).map((c: TabularColumnInfo) => c.index)

        setCsvData({ headers, rows, columnTypes, droppedRows: 0 })
        setColumnInfos(infos)
        setTargetIndex(defaultTarget)
        setFeatureIndices(defaultFeatures.length > 0 ? defaultFeatures : infos.filter((c: TabularColumnInfo) => c.index !== defaultTarget).map((c: TabularColumnInfo) => c.index))
    }, [])

    const handleFileUpload = useCallback(async (file: File) => {
        if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
            alert('Please upload a CSV file')
            return
        }
        const text = await file.text()
        const parsed = parseCSV(text)
        if (parsed.rows.length === 0) {
            alert('Could not read this file as CSV — check the format')
            return
        }
        if (parsed.rows.length < 2) {
            alert('Need at least 2 rows of data to train')
            return
        }
        applyDataToState(parsed.headers, parsed.rows)
        setStep('configure')
    }, [applyDataToState])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) await handleFileUpload(file)
    }, [handleFileUpload])

    const handleCreateDataset = useCallback(() => {
        const headers = Array.from({ length: newColCount }, (_, i) => `Feature ${i + 1}`)
        headers.push('Output')
        const rows = Array.from({ length: newRowCount }, () => Array(newColCount + 1).fill(0))
        setEditHeaders(headers)
        setEditRows(rows)
        setDisabledRows(new Set())
        setDisabledCols(new Set())
        setCollectMode('editing')
    }, [newRowCount, newColCount])

    const handleUseEditedData = useCallback(() => {
        const activeRows = editRows.filter((_, i) => !disabledRows.has(i))
        const activeHeaders = editHeaders.filter((_, i) => !disabledCols.has(i))
        const activeData = activeRows.map(row => row.filter((_, i) => !disabledCols.has(i)))
        if (activeRows.length < 2) {
            alert('Need at least 2 active rows to train')
            return
        }
        if (activeHeaders.length < 2) {
            alert('Need at least 1 feature + 1 output column')
            return
        }
        applyDataToState(activeHeaders, activeData)
        setStep('configure')
    }, [editHeaders, editRows, disabledRows, disabledCols, applyDataToState])

    const handleFeatureToggle = useCallback((index: number) => {
        setFeatureIndices(prev => {
            if (prev.includes(index)) return prev.filter(i => i !== index)
            return [...prev, index]
        })
    }, [])

    const handleTrain = useCallback(async () => {
        if (!csvData || featureIndices.length === 0) return
        setIsTraining(true)
        setEpochResults([])
        setValEpochResults([])
        setTrainMetrics([])
        setFinalAccuracy(null)
        setCurrentEpoch(0)
        setTrainSummary('')

        const updatedConfig = { ...config, taskType }
        setConfig(updatedConfig)

        try {
            classifierRef.current.clear()
            const encoded = encodeRows(csvData.rows, columnInfos)

            const { trainLoss, valAccuracy } = await classifierRef.current.train(
                encoded,
                targetIndex,
                featureIndices,
                updatedConfig,
                columnInfos,
                (metrics: TabularTrainMetrics) => {
                    setCurrentEpoch(metrics.epoch)
                    setTrainMetrics(prev => [...prev, metrics])
                    if (taskType === 'classification') {
                        setEpochResults(prev => [...prev, metrics.trainMetric])
                        setValEpochResults(prev => [...prev, metrics.valMetric])
                    } else {
                        const baseline = trainMetrics.length > 0 ? trainMetrics[0].trainLoss : metrics.trainLoss * 10 || 1
                        setEpochResults(prev => [...prev, 1 - Math.min(1, metrics.trainLoss / baseline)])
                        setValEpochResults(prev => [...prev, 1 - Math.min(1, metrics.valLoss / baseline)])
                    }
                }
            )

            const isClassification = taskType === 'classification'
            const accuracyPct = isClassification ? Math.round(valAccuracy * 100) : null
            setFinalAccuracy(accuracyPct ?? Math.round((1 - Math.min(1, trainLoss)) * 100))

            const correlations = classifierRef.current.getCorrelations(encoded, featureIndices, targetIndex)
            const topCorrelated = correlations.sort((a: { correlation: number; featureName: string }, b: { correlation: number; featureName: string }) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 2)
            const summaryLines = [
                `Trained for ${config.epochs} epochs on ${csvData.rows.length} rows.`,
                isClassification
                    ? `Validation accuracy: ${Math.round(valAccuracy * 100)}%`
                    : `Final loss: ${trainLoss.toFixed(4)}`,
                topCorrelated.length > 0
                    ? `Top correlated features: ${topCorrelated.map(c => `${c.featureName} (${c.correlation.toFixed(2)})`).join(', ')}`
                    : ''
            ].filter(Boolean)
            setTrainSummary(summaryLines.join(' '))

            mode.setDataAccuracy(accuracyPct ?? Math.round((1 - Math.min(1, trainLoss)) * 100))
            mode.setDataModelTrained(true)
        } catch (err) {
            console.error('[TabularPanel] Training error:', err)
            alert('Training failed. Please try again.')
        }
        setIsTraining(false)
    }, [csvData, featureIndices, targetIndex, taskType, config, columnInfos, mode, trainMetrics])

    const handlePredict = useCallback(async (values: (string | number)[]) => {
        const allValues = encodeSingleInput(values, columnInfos)
        const result = await classifierRef.current.predict(allValues, featureIndices, config)
        const targetInfo = columnInfos[targetIndex]
        return {
            value: decodeOutput(result.value as number, taskType, targetInfo),
            confidence: result.confidence,
            probabilities: result.probabilities
        }
    }, [columnInfos, featureIndices, config, targetIndex, taskType])

    const handleExportModel = useCallback(async () => {
        try {
            const exported = await classifierRef.current.exportModel()
            exported.taskType = taskType
            const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `numbers_cr_model.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('[TabularPanel] Export error:', err)
        }
    }, [taskType])

    const handleStepClick = useCallback((s: TabularStep) => {
        if (hasDataForStep(s)) {
            setStep(s)
            if (s === 'collect') setCollectMode('choose')
        }
    }, [hasDataForStep])

    return {
        step, collectMode, csvData, columnInfos, featureIndices, targetIndex,
        taskType, config, isTraining, currentEpoch, epochResults, valEpochResults,
        trainMetrics, finalAccuracy, trainSummary, isDragging,
        newRowCount, newColCount, editHeaders, editRows, disabledRows, disabledCols,
        dataReady, hasDataForStep,
        setStep, setCollectMode, setCsvData, setTaskType, setConfig,
        setFeatureIndices, setTargetIndex, setIsDragging,
        setNewRowCount, setNewColCount, setEditHeaders, setEditRows,
        setDisabledRows, setDisabledCols,
        handleFileUpload, handleDrop, handleCreateDataset, handleUseEditedData,
        handleFeatureToggle, handleTrain, handlePredict, handleExportModel,
        handleStepClick, fileInputRef,
    }
}
