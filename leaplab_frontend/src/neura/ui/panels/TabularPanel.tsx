import React, { useRef, useState, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { parseCSV } from '../../ml/utils/csvParser'
import { analyzeColumns, encodeRows, encodeSingleInput, decodeOutput } from '../../ml/utils/encoding'
import { TabularClassifier } from '../../ml/classifiers/TabularClassifier'
import type { TabularColumnInfo, TabularConfig, TabularTaskType, TabularTrainMetrics } from '../../types/neura.types'
import DataTable from '../components/DataTable'
import DatasetSettings from '../components/DatasetSettings'
import ColumnSelector from '../components/ColumnSelector'
import NumericTestPanel from '../components/NumericTestPanel'

interface TabularPanelProps {
    mode: UseNeuraProjectReturn
}

type TabularStep = 'collect' | 'configure' | 'train' | 'test'
type CollectMode = 'choose' | 'editing'

const STEPS: { id: TabularStep; label: string; emoji: string }[] = [
    { id: 'collect', label: 'Data', emoji: '📊' },
    { id: 'configure', label: 'Setup', emoji: '⚙️' },
    { id: 'train', label: 'Train', emoji: '🧠' },
    { id: 'test', label: 'Test', emoji: '🧪' },
]

const STEP_DATA_FLAGS: Record<TabularStep, (args: { dataReady: boolean; featureIndices: number[]; finalAccuracy: number | null }) => boolean> = {
    collect: ({ dataReady }) => dataReady,
    configure: ({ featureIndices }) => featureIndices.length > 0,
    train: ({ finalAccuracy }) => finalAccuracy !== null,
    test: ({ finalAccuracy }) => finalAccuracy !== null,
}

export default function TabularPanel({ mode }: TabularPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new TabularClassifier())

    const [step, setStep] = useState<TabularStep>('collect')
    const [collectMode, setCollectMode] = useState<CollectMode>('choose')
    const [csvData, setCsvData] = useState<{ headers: string[]; rows: (string | number)[][]; columnTypes: ('numeric' | 'text')[]; droppedRows: number } | null>(null)
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

    const [newRowCount, setNewRowCount] = useState(10)
    const [newColCount, setNewColCount] = useState(3)
    const [editHeaders, setEditHeaders] = useState<string[]>([])
    const [editRows, setEditRows] = useState<(string | number)[][]>([])
    const [disabledRows, setDisabledRows] = useState<Set<number>>(new Set())
    const [disabledCols, setDisabledCols] = useState<Set<number>>(new Set())

    const stepIndex = STEPS.findIndex(s => s.id === step)
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
        const numericCols = infos.filter(c => c.type === 'numeric' && !c.isZeroVariance)
        const defaultTarget = numericCols.length > 0 ? numericCols[numericCols.length - 1].index : infos[infos.length - 1].index
        const defaultFeatures = infos.filter(c => c.index !== defaultTarget && !c.isZeroVariance).map(c => c.index)

        setCsvData({ headers, rows, columnTypes, droppedRows: 0 })
        setColumnInfos(infos)
        setTargetIndex(defaultTarget)
        setFeatureIndices(defaultFeatures.length > 0 ? defaultFeatures : infos.filter(c => c.index !== defaultTarget).map(c => c.index))
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
                (metrics) => {
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
            const topCorrelated = correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 2)
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

            mode.setAccuracy(accuracyPct ?? Math.round((1 - Math.min(1, trainLoss)) * 100))
            mode.setModelTrained(true)
            setStep('test')
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

    const canGoNext = () => {
        if (step === 'collect') return dataReady
        if (step === 'configure') return featureIndices.length > 0
        if (step === 'train') return finalAccuracy !== null
        return false
    }

    const handleStepClick = (s: TabularStep) => {
        if (hasDataForStep(s)) {
            setStep(s)
            if (s === 'collect') setCollectMode('choose')
        }
    }

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {/* Horizontal Step Bar */}
            <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between max-w-[600px] mx-auto">
                    {STEPS.map((s, i) => {
                        const isActive = step === s.id
                        const isDone = stepIndex > i || (stepIndex === i && s.id !== 'collect' && hasDataForStep(s.id))
                        const isClickable = hasDataForStep(s.id) || isActive
                        return (
                            <React.Fragment key={s.id}>
                                {i > 0 && (
                                    <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-300 ${isDone ? 'bg-[#630ed4]' : 'bg-gray-200'}`} />
                                )}
                                <button
                                    onClick={() => handleStepClick(s.id)}
                                    disabled={!isClickable}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold border-none transition-all duration-200 shrink-0 ${
                                        isActive
                                            ? 'bg-[#630ed4] text-white shadow-md shadow-purple-600/20 scale-105'
                                            : isDone
                                                ? 'bg-[#f5f3ff] text-[#630ed4] cursor-pointer hover:bg-[#ede9fe]'
                                                : isClickable
                                                    ? 'bg-violet-50 text-violet-500 cursor-pointer hover:bg-violet-100'
                                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="text-sm">{isDone ? '✓' : s.emoji}</span>
                                    <span>{s.label}</span>
                                    {isDone && s.id === 'collect' && dataReady && (
                                        <span className="text-[8px] bg-[#630ed4]/10 text-[#630ed4] px-1.5 py-0.5 rounded-full">{csvData?.rows.length} rows</span>
                                    )}
                                    {isDone && s.id === 'train' && finalAccuracy !== null && (
                                        <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{finalAccuracy}%</span>
                                    )}
                                </button>
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 min-h-0 flex flex-col">
                {/* ==================== STEP 1: DATA ==================== */}
                {step === 'collect' && collectMode === 'choose' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 px-5">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#630ed4]/10 to-[#7c3aed]/10 flex items-center justify-center">
                                <span className="text-3xl">📊</span>
                            </div>
                            <h2 className="text-lg font-extrabold text-[#131b2e] mb-1">Add Your Data</h2>
                            <p className="text-xs text-gray-500">Upload a CSV or build a dataset from scratch</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[500px]">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex-1 border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${
                                    isDragging ? 'border-[#630ed4] bg-[#f5f3ff] scale-[1.02]' : 'border-gray-200 bg-white hover:border-[#630ed4]/50 hover:bg-[#f5f3ff]/30'
                                }`}
                            >
                                <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-[#630ed4]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-[#630ed4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-[#131b2e] mb-0.5">Upload CSV</p>
                                <p className="text-[10px] text-gray-400">Drag & drop or click</p>
                            </div>

                            <div
                                onClick={handleCreateDataset}
                                className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center transition-all cursor-pointer bg-white hover:border-[#630ed4]/50 hover:bg-[#f5f3ff]/30 group"
                            >
                                <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-[#630ed4]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-[#630ed4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-[#131b2e] mb-0.5">Create Dataset</p>
                                <p className="text-[10px] text-gray-400">Build from scratch</p>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            className="hidden"
                        />
                    </div>
                )}

                {/* STEP 1: EDITING (Editable Table + Settings) */}
                {step === 'collect' && collectMode === 'editing' && (
                    <div className="flex-1 flex flex-col py-3 px-4 gap-3 overflow-y-auto neura-scrollbar">
                        <div className="flex items-center justify-between shrink-0">
                            <button onClick={() => setCollectMode('choose')} className="text-[10px] font-bold text-[#630ed4] bg-[#f5f3ff] py-1.5 px-3 rounded-lg border-none cursor-pointer hover:bg-[#ede9fe]">← Back</button>
                            <div className="text-center">
                                <h2 className="text-sm font-extrabold text-[#131b2e]">Edit Dataset</h2>
                                <p className="text-[9px] text-gray-400">{editRows.length} rows · {editHeaders.length} cols</p>
                            </div>
                            <button
                                onClick={handleUseEditedData}
                                className="text-[10px] font-bold text-white bg-gradient-to-br from-[#630ed4] to-[#7c3aed] py-1.5 px-3 rounded-lg border-none cursor-pointer shadow-[0_2px_8px_rgba(99,14,212,0.25)] hover:opacity-95 transition-all"
                            >
                                Use This Data →
                            </button>
                        </div>
                        <DataTable
                            headers={editHeaders}
                            rows={editRows}
                            columnInfos={columnInfos.length > 0 ? columnInfos : editHeaders.map((_, i) => ({ index: i, name: editHeaders[i], type: 'numeric' as const, uniqueValues: 0, missingCount: 0, isZeroVariance: false }))}
                            readOnly={false}
                            onHeadersChange={setEditHeaders}
                            onRowsChange={setEditRows}
                            disabledRows={disabledRows}
                            disabledCols={disabledCols}
                        />
                        <DatasetSettings
                            headers={editHeaders}
                            rows={editRows}
                            disabledRows={disabledRows}
                            disabledCols={disabledCols}
                            onHeadersChange={setEditHeaders}
                            onRowsChange={setEditRows}
                            onDisabledRowsChange={setDisabledRows}
                            onDisabledColsChange={setDisabledCols}
                        />
                    </div>
                )}

                {/* ==================== STEP 2: SETUP ==================== */}
                {step === 'configure' && csvData && (
                    <div className="flex-1 flex flex-col py-3 px-4 gap-3 overflow-y-auto neura-scrollbar">
                        <div className="shrink-0">
                            <DataTable headers={csvData.headers} rows={csvData.rows} columnInfos={columnInfos} readOnly />
                        </div>
                        <div className="shrink-0">
                            <ColumnSelector
                                columnInfos={columnInfos}
                                featureIndices={featureIndices}
                                targetIndex={targetIndex}
                                taskType={taskType}
                                onFeatureToggle={handleFeatureToggle}
                                onTargetChange={setTargetIndex}
                                onTaskTypeChange={(t) => { setTaskType(t); setConfig(prev => ({ ...prev, taskType: t })) }}
                            />
                        </div>
                        <div className="flex gap-2 shrink-0 pb-2">
                            <button onClick={() => { setStep('collect'); setCollectMode('choose') }} className="py-2.5 px-4 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500 cursor-pointer bg-white hover:bg-gray-50 transition-all">
                                ← Data
                            </button>
                            <button
                                onClick={() => setStep('train')}
                                disabled={featureIndices.length === 0}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-none transition-all ${
                                    featureIndices.length > 0
                                        ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white cursor-pointer shadow-[0_4px_14px_rgba(99,14,212,0.35)]'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Next: Train →
                            </button>
                        </div>
                    </div>
                )}

                {/* ==================== STEP 3: TRAIN ==================== */}
                {step === 'train' && csvData && (
                    <div className="flex-1 flex flex-col py-3 px-4 gap-3 overflow-y-auto neura-scrollbar">
                        {/* Training Config */}
                        <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shrink-0">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Epochs</span>
                                        <span className="text-sm font-extrabold text-[#630ed4]">{config.epochs}</span>
                                    </div>
                                    <input type="range" min="5" max="200" value={config.epochs} onChange={(e) => setConfig(prev => ({ ...prev, epochs: Number(e.target.value) }))} disabled={isTraining} className="w-full h-1.5 rounded-full accent-[#630ed4]" />
                                    <p className="text-[9px] text-gray-400 mt-1 leading-tight">One full pass through your data. Too few → underfits.</p>
                                    <div className="flex gap-1 mt-1">
                                        {[10, 25, 50, 100].map(p => (
                                            <button key={p} onClick={() => setConfig(prev => ({ ...prev, epochs: p }))} disabled={isTraining} className={`flex-1 py-0.5 rounded text-[9px] font-bold border-none ${config.epochs === p ? 'bg-[#630ed4] text-white' : 'bg-violet-100 text-gray-600'}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Batch Size</span>
                                        <span className="text-sm font-extrabold text-[#630ed4]">{config.batchSize}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[8, 16, 32, 64].map(bs => (
                                            <button key={bs} onClick={() => setConfig(prev => ({ ...prev, batchSize: bs }))} disabled={isTraining} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border-none transition-all ${config.batchSize === bs ? 'bg-[#630ed4] text-white' : 'bg-violet-100 text-gray-600 hover:bg-violet-200'}`}>{bs}</button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-1 leading-tight">Rows processed before each weight update. Larger → smoother but slower.</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Learning Rate</span>
                                        <span className="text-sm font-extrabold text-[#630ed4]">{config.learningRate}</span>
                                    </div>
                                    <input type="range" min="0.0001" max="0.1" step="0.0001" value={config.learningRate} onChange={(e) => setConfig(prev => ({ ...prev, learningRate: Number(e.target.value) }))} disabled={isTraining} className="w-full h-1.5 rounded-full accent-[#630ed4]" />
                                    <p className="text-[9px] text-gray-400 mt-1 leading-tight">How big a correction each step makes. Too high → overshoots.</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Val Split</span>
                                        <span className="text-sm font-extrabold text-[#630ed4]">{Math.round(config.valSplit * 100)}%</span>
                                    </div>
                                    <input type="range" min="0.1" max="0.4" step="0.05" value={config.valSplit} onChange={(e) => setConfig(prev => ({ ...prev, valSplit: Number(e.target.value) }))} disabled={isTraining} className="w-full h-1.5 rounded-full accent-[#630ed4]" />
                                    <p className="text-[9px] text-gray-400 mt-1 leading-tight">Portion held out to check if the model generalizes.</p>
                                </div>
                            </div>
                        </div>

                        {/* Train Button */}
                        <button
                            onClick={handleTrain}
                            disabled={isTraining || featureIndices.length === 0}
                            className={`w-full py-3 rounded-xl text-xs font-bold border-none transition-all shrink-0 ${
                                !isTraining && featureIndices.length > 0
                                    ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white cursor-pointer shadow-[0_4px_14px_rgba(99,14,212,0.35)] hover:opacity-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isTraining ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Training... Epoch {currentEpoch}/{config.epochs}
                                </span>
                            ) : finalAccuracy !== null ? '🔄 Retrain' : '🚀 Start Training'}
                        </button>

                        {/* Progress */}
                        {isTraining && (
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shrink-0">
                                <div className="w-full bg-violet-100 h-2 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#630ed4] to-[#7c3aed] transition-all duration-300" style={{ width: `${(currentEpoch / config.epochs) * 100}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Chart */}
                        {epochResults.length > 0 && (
                            <div className="bg-white/85 backdrop-blur-md rounded-xl p-3 border border-gray-200 shrink-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        {taskType === 'classification' ? 'Accuracy' : 'Loss'} vs Epochs
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold text-[#630ed4] flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 rounded-full bg-[#630ed4]" /> Train
                                        </span>
                                        <span className="text-[9px] font-bold text-[#a78bfa] flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 rounded-full bg-[#a78bfa]" /> Validation
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                                    <svg viewBox="0 0 300 140" className="w-full" style={{ height: '120px' }}>
                                        <defs>
                                            <linearGradient id="tabGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#630ed4" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#630ed4" stopOpacity="0.02" />
                                            </linearGradient>
                                            <linearGradient id="tabValGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
                                            </linearGradient>
                                        </defs>
                                        {[0, 0.25, 0.5, 0.75, 1].map(t => {
                                            const maxVal = taskType === 'classification' ? 1 : Math.max(...epochResults, ...valEpochResults, 1)
                                            const y = 16 + 92 - (t * 92)
                                            return <g key={t}><line x1={36} y1={y} x2={284} y2={y} stroke="#f1f5f9" strokeWidth="1" /><text x={30} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="system-ui">{taskType === 'classification' ? `${(t * 100).toFixed(0)}%` : (t * maxVal).toFixed(2)}</text></g>
                                        })}
                                        {epochResults.length > 0 && (() => {
                                            const maxVal = taskType === 'classification' ? 1 : Math.max(...epochResults, ...valEpochResults, 1)
                                            const getX = (i: number) => 36 + (i / (Math.max(epochResults.length, 1) - 1 || 1)) * 248
                                            const getY = (v: number) => 16 + 92 - (v / maxVal) * 92

                                            const trainD = epochResults.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ')
                                            const trainArea = `${trainD} L ${getX(epochResults.length - 1).toFixed(1)} 108 L ${getX(0).toFixed(1)} 108 Z`

                                            const valD = valEpochResults.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ')
                                            const valArea = valEpochResults.length > 0 ? `${valD} L ${getX(valEpochResults.length - 1).toFixed(1)} 108 L ${getX(0).toFixed(1)} 108 Z` : ''

                                            return <>
                                                <path d={trainArea} fill="url(#tabGrad)" />
                                                <path d={trainD} fill="none" stroke="#630ed4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                {epochResults.map((v, i) => <circle key={`t-${i}`} cx={getX(i)} cy={getY(v)} r={i === epochResults.length - 1 ? 4 : 2} fill={i === epochResults.length - 1 ? '#630ed4' : 'white'} stroke="#630ed4" strokeWidth={i === epochResults.length - 1 ? 2 : 1.5} />)}
                                                {valEpochResults.length > 0 && <>
                                                    <path d={valArea} fill="url(#tabValGrad)" />
                                                    <path d={valD} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
                                                    {valEpochResults.map((v, i) => <circle key={`v-${i}`} cx={getX(i)} cy={getY(v)} r={i === valEpochResults.length - 1 ? 4 : 2} fill={i === valEpochResults.length - 1 ? '#a78bfa' : 'white'} stroke="#a78bfa" strokeWidth={i === valEpochResults.length - 1 ? 2 : 1.5} />)}
                                                </>}
                                            </>
                                        })()}
                                        <text x={150} y={136} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600" fontFamily="system-ui">Epochs</text>
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Summary + Actions */}
                        {trainSummary && !isTraining && (
                            <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl p-3 border border-[#630ed4]/10 shrink-0">
                                <div className="flex items-center gap-1.5 mb-1"><span className="text-sm">📝</span><span className="text-[10px] font-bold text-[#630ed4] uppercase tracking-wider">Summary</span></div>
                                <p className="text-[11px] text-gray-700 leading-relaxed">{trainSummary}</p>
                            </div>
                        )}

                        {finalAccuracy !== null && !isTraining && (
                            <div className="flex gap-2 shrink-0 pb-2">
                                <button onClick={() => setStep('configure')} className="py-2.5 px-4 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500 cursor-pointer bg-white hover:bg-gray-50 transition-all">← Setup</button>
                                <button onClick={() => setStep('test')} className="flex-1 py-2.5 rounded-xl text-xs font-bold border-none bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white cursor-pointer shadow-md hover:opacity-95 transition-all">🧪 Test Model</button>
                                <button onClick={handleExportModel} className="py-2.5 px-4 rounded-xl text-xs font-bold border-2 border-[#630ed4] text-[#630ed4] cursor-pointer bg-white hover:bg-[#f5f3ff] transition-all">💾</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ==================== STEP 4: TEST ==================== */}
                {step === 'test' && csvData && (
                    <div className="flex-1 flex flex-col py-3 px-4 gap-3 overflow-y-auto neura-scrollbar">
                        <NumericTestPanel
                            columnInfos={columnInfos}
                            featureIndices={featureIndices}
                            targetIndex={targetIndex}
                            taskType={taskType}
                            onPredict={handlePredict}
                        />
                        <div className="flex gap-2 shrink-0 pb-2">
                            <button onClick={() => setStep('train')} className="py-2.5 px-4 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500 cursor-pointer bg-white hover:bg-gray-50 transition-all">← Train</button>
                            <button onClick={handleExportModel} className="flex-1 py-2.5 rounded-xl text-xs font-bold border-none bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white cursor-pointer shadow-md hover:opacity-95 transition-all">💾 Export Model</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
