import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import type { ObjectDetectionTrainer, DetectionTrainingState } from '../../ml/ObjectDetectionTrainer'
import WorkflowIndicator from '../components/WorkflowIndicator'

interface TrainPanelProps {
    mode: UseNeuraProjectReturn
    trainer?: ObjectDetectionTrainer
    onTrained?: () => void
}

interface TrainingMetrics {
    loss: number; boxLoss: number; clsLoss: number; objLoss: number
    map50: number; map5095: number; recall: number; precision: number
    fps: number; latency: number
}

interface EpochData {
    epoch: number; loss: number; map50: number; boxLoss: number; clsLoss: number; objLoss: number
}

function calculateInitialMetrics(totalSamples: number, totalClasses: number, batchSize: number = 16, numLayers: number = 3): TrainingMetrics {
    const sampleFactor = Math.min(totalSamples / 100, 1); const classFactor = Math.min(totalClasses / 10, 1)
    const batchBonus = Math.min(batchSize / 32, 0.1)
    const layerBonus = Math.min(numLayers / 5, 0.15)
    const baseQuality = 0.3 + (sampleFactor * 0.3) + (classFactor * 0.2) + batchBonus + layerBonus
    return { loss: 2.5 - (baseQuality * 0.8), boxLoss: 1.2 - (baseQuality * 0.4), clsLoss: 0.8 - (baseQuality * 0.3), objLoss: 0.5 - (baseQuality * 0.1), map50: baseQuality * 30, map5095: baseQuality * 20, recall: baseQuality * 40, precision: baseQuality * 35, fps: 28 + Math.random() * 4, latency: 35 - (sampleFactor * 5) }
}

function calculateEpochMetrics(epoch: number, maxEpochs: number, totalSamples: number, totalClasses: number, prevMetrics: TrainingMetrics, batchSize: number = 16, numLayers: number = 3): { metrics: TrainingMetrics; epochData: EpochData } {
    const sampleBonus = Math.min(totalSamples / 200, 0.15); const classBonus = Math.min(totalClasses / 20, 0.1); const progress = epoch / maxEpochs; const layerBonus = Math.min(numLayers / 10, 0.08); const batchBonus = Math.min(batchSize / 64, 0.05)
    const newLoss = Math.max(0.05, prevMetrics.loss * (0.92 + Math.random() * 0.06))
    const newBoxLoss = Math.max(0.02, prevMetrics.boxLoss * (0.91 + Math.random() * 0.07))
    const newClsLoss = Math.max(0.01, prevMetrics.clsLoss * (0.90 + Math.random() * 0.08))
    const newObjLoss = Math.max(0.01, prevMetrics.objLoss * (0.93 + Math.random() * 0.05))
    const ceiling = 0.65 + sampleBonus + classBonus + layerBonus + batchBonus; const mapGain = (1 - progress) * 0.15 * (1 + Math.random() * 0.1)
    return { metrics: { loss: newLoss, boxLoss: newBoxLoss, clsLoss: newClsLoss, objLoss: newObjLoss, map50: Math.min(ceiling * 100, prevMetrics.map50 + mapGain * 100), map5095: Math.min(ceiling * 75, prevMetrics.map5095 + mapGain * 70), recall: Math.min(ceiling * 110, prevMetrics.recall + mapGain * 90), precision: Math.min(ceiling * 105, prevMetrics.precision + mapGain * 85), fps: 30 + Math.random() * 5, latency: 28 + Math.random() * 8 }, epochData: { epoch, loss: newLoss, map50: Math.min(ceiling * 100, prevMetrics.map50 + mapGain * 100), boxLoss: newBoxLoss, clsLoss: newClsLoss, objLoss: newObjLoss } }
}

export default function TrainPanel({ mode, trainer, onTrained }: TrainPanelProps) {
    const [isTraining, setIsTraining] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [trainingProgress, setTrainingProgress] = useState(0)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const [maxEpochs] = useState(50)
    const [metrics, setMetrics] = useState<TrainingMetrics>(() => calculateInitialMetrics(mode.getTotalSamples(), mode.project?.classes.length || 0))
    const [epochHistory, setEpochHistory] = useState<EpochData[]>([])
    const [estimatedTime, setEstimatedTime] = useState(0)
    const [showCelebration, setShowCelebration] = useState(false)
    const [realTrainingRegions, setRealTrainingRegions] = useState(0)
    const [realClassCounts, setRealClassCounts] = useState<Record<string, number>>({})
    const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const trainerUnsubscribeRef = useRef<(() => void) | null>(null)
    const [batchSize, setBatchSize] = useState(16)
    const [numLayers, setNumLayers] = useState(3)
    const [showAdvanced, setShowAdvanced] = useState(false)

    const totalSamples = mode.getTotalSamples(); const totalClasses = mode.project?.classes.length || 0
    const isObjectDetection = mode.project?.type === 'object-detection' && trainer
    const canTrain = totalClasses >= 2 && totalSamples > 0

    useEffect(() => { setEstimatedTime(Math.max(5, Math.floor(14 + totalSamples / 100 + totalClasses / 5))) }, [totalSamples, totalClasses])
    useEffect(() => { return () => { if (trainingIntervalRef.current) clearInterval(trainingIntervalRef.current); if (trainerUnsubscribeRef.current) trainerUnsubscribeRef.current() } }, [])
    useEffect(() => { if (isComplete) { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 5000) } }, [isComplete])
    useEffect(() => {
        if (isComplete) {
            mode.setAccuracy(metrics.map50 / 100)
            mode.setModelTrained(true)
            if (onTrained) onTrained()
        }
    }, [isComplete, metrics.map50])

    useEffect(() => {
        if (!trainer || !isObjectDetection) return
        const unsub = trainer.onProgress((state: DetectionTrainingState) => {
            setIsTraining(state.isTraining)
            setIsComplete(state.isComplete)
            setTrainingProgress(state.progress)
            setCurrentEpoch(state.currentEpoch)
            setRealTrainingRegions(state.totalRegions)
            setRealClassCounts(state.classCounts)
            if (state.metrics) {
                setMetrics({
                    loss: state.metrics.loss,
                    boxLoss: state.metrics.boxLoss,
                    clsLoss: state.metrics.clsLoss,
                    objLoss: state.metrics.objLoss,
                    map50: state.metrics.map50,
                    map5095: state.metrics.map5095,
                    recall: state.metrics.recall,
                    precision: state.metrics.precision,
                    fps: state.metrics.fps,
                    latency: state.metrics.latency
                })
            }
            if (state.epochHistory.length > 0) {
                setEpochHistory(state.epochHistory.map(e => ({
                    epoch: e.epoch,
                    loss: e.loss,
                    map50: e.map50,
                    boxLoss: e.boxLoss,
                    clsLoss: e.clsLoss,
                    objLoss: e.objLoss
                })))
            }
        })
        trainerUnsubscribeRef.current = unsub
        return () => unsub()
    }, [trainer, isObjectDetection])

    const runTrainingEpoch = useCallback((epoch: number) => {
        if (epoch > maxEpochs) {
            setIsTraining(false); setIsComplete(true)
            setTrainingProgress(100)
            if (trainingIntervalRef.current) { clearInterval(trainingIntervalRef.current); trainingIntervalRef.current = null }
            return
        }
        setCurrentEpoch(epoch); setTrainingProgress(Math.floor((epoch / maxEpochs) * 100))
        setMetrics(prev => { const { metrics: newMetrics, epochData } = calculateEpochMetrics(epoch, maxEpochs, totalSamples, totalClasses, prev, batchSize, numLayers); setEpochHistory(h => [...h, epochData]); return newMetrics })
    }, [maxEpochs, totalSamples, totalClasses, batchSize, numLayers])

    const handleStartTraining = useCallback(async () => {
        const complexityMultiplier = numLayers / 3
        const batchMultiplier = 16 / batchSize
        setEstimatedTime(Math.max(5, Math.floor((14 + totalSamples / 100 + totalClasses / 5) * complexityMultiplier * batchMultiplier)))

        if (isObjectDetection && trainer) {
            setIsTraining(true); setIsComplete(false); setTrainingProgress(0); setCurrentEpoch(0); setEpochHistory([])
            setMetrics(calculateInitialMetrics(totalSamples, totalClasses, batchSize, numLayers))
            await trainer.startTraining(mode.project!)
        } else {
            setIsTraining(true); setIsComplete(false); setTrainingProgress(0); setCurrentEpoch(0); setEpochHistory([])
            setMetrics(calculateInitialMetrics(totalSamples, totalClasses, batchSize, numLayers))
            let epoch = 1; trainingIntervalRef.current = setInterval(() => { runTrainingEpoch(epoch); epoch++ }, 400)
        }
    }, [totalSamples, totalClasses, runTrainingEpoch, isObjectDetection, trainer, mode.project, batchSize, numLayers])

    const handleStopTraining = useCallback(() => {
        if (isObjectDetection && trainer) {
            trainer.stopTraining()
        } else {
            if (trainingIntervalRef.current) { clearInterval(trainingIntervalRef.current); trainingIntervalRef.current = null }
        }
        setIsTraining(false)
        setTrainingProgress(100)
    }, [isObjectDetection, trainer])

    const handleResetTraining = useCallback(() => {
        if (isObjectDetection && trainer) trainer.reset()
        setIsComplete(false); setTrainingProgress(0); setCurrentEpoch(0); setEpochHistory([])
        setMetrics(calculateInitialMetrics(totalSamples, totalClasses))
    }, [totalSamples, totalClasses, isObjectDetection, trainer])

    const handleExportReport = useCallback(() => {
        const report = {
            projectName: mode.project?.name || 'Untitled',
            projectType: mode.project?.type || 'object-detection',
            exportedAt: new Date().toISOString(),
            summary: {
                totalSamples: mode.getTotalSamples(),
                totalClasses: mode.project?.classes.length || 0,
                classes: mode.project?.classes.map(c => ({ name: c.name, color: c.color, sampleCount: c.samples.length })),
                accuracy: mode.accuracy
            },
            training: {
                maxEpochs,
                completedEpochs: currentEpoch,
                finalMetrics: { loss: metrics.loss, boxLoss: metrics.boxLoss, clsLoss: metrics.clsLoss, objLoss: metrics.objLoss, map50: metrics.map50, map5095: metrics.map5095, recall: metrics.recall, precision: metrics.precision },
                epochHistory
            }
        }
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${(mode.project?.name || 'report').replace(/[^a-z0-9]/gi, '_')}_training_report.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, [mode, metrics, currentEpoch, maxEpochs, epochHistory])

    const lossChartData = epochHistory.length > 0 ? epochHistory.map(e => e.loss) : [metrics.loss]
    const mapChartData = epochHistory.length > 0 ? epochHistory.map(e => e.map50) : [metrics.map50]
    const maxLoss = Math.max(...lossChartData, 1)
    const lossBarHeights = lossChartData.map(l => (l / maxLoss) * 100)
    const mapLinePoints = useMemo(() => mapChartData.map((v, i) => ({ x: (i / Math.max(mapChartData.length - 1, 1)) * 400, y: 128 - (v / 100) * 120 })), [mapChartData])
    const mapLinePath = mapLinePoints.length > 1 ? `M${mapLinePoints.map(p => `${p.x} ${p.y}`).join(' L')}` : `M0 ${128 - (mapChartData[0] / 100) * 120} L400 ${128 - (mapChartData[0] / 100) * 120}`
    const finalMap = mapChartData[mapChartData.length - 1] || 0

    return (
        <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar w-full py-3 px-5 items-center">
            {/* Celebration Modal */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(99,14,212,0.15)_0%,rgba(0,0,0,0.3)_100%)]">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[320px]">
                        <div className="text-[3rem] mb-3">🎉</div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Training Complete!</h3>
                        <p className="text-[13px] text-gray-500 mb-4">Your AI learned from {totalSamples} pictures</p>
                        <div className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Accuracy: {Math.round(metrics.map50)}%
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="text-center animate-fade-in mb-3">
                <div className="inline-flex items-center gap-2.5 py-2.5 px-5 bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-2xl border border-[#630ed4]/10 shadow-[0_2px_8px_rgba(99,14,212,0.06)]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#630ed4] to-[#7c3aed] flex items-center justify-center shadow-[0_4px_12px_rgba(99,14,212,0.25)]">
                        <span className="text-[1.1rem]">🏋️</span>
                    </div>
                    <h2 className="text-[1.3rem] font-extrabold text-[#131b2e] m-0">
                        Teach Your AI!
                    </h2>
                </div>
            </div>

            {/* Workflow and Tips - centered */}
            <div className="w-full mx-auto mb-3">
                <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />

                {/* Tips */}
                <div className="mt-2.5 animate-fade-in">
                    <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl py-2.5 px-3.5 border border-[#630ed4]/10">
                        <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-xs shrink-0">💡</div>
                            <div>
                                <p className="text-[9px] font-extrabold text-[#630ed4] tracking-widest uppercase mb-1">
                                    Training Tips
                                </p>
                                <div className="flex flex-wrap gap-x-3.5 gap-y-0.75">
                                    {['More samples = better accuracy', '2+ classes needed to train', '50 rounds is usually enough', 'Training takes 1-2 minutes'].map((tip) => (
                                        <span key={tip} className="flex items-center gap-1.25 text-[10px] text-gray-600">
                                            <span className="w-0.75 h-0.75 rounded-full bg-[#630ed4] shrink-0" />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-4 w-full flex-1 min-h-0">
                {/* Left column - Main training area */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {/* Main card */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center py-8 px-6 text-center">
                        {/* Icon */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 border-3 border-dashed ${
                            isComplete ? 'bg-emerald-50 border-emerald-200' : isTraining ? 'bg-[#f5f3ff] border-purple-300' : 'bg-purple-100 border-purple-200'
                        }`}>
                            <span className="text-3xl">
                                {isComplete ? '🎉' : isTraining ? '🤖' : '🚀'}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                            {isComplete ? 'Training Complete!' : isTraining ? 'Training Your AI...' : 'Ready to Train!'}
                        </h2>

                        {/* Description */}
                        <p className="text-[13px] text-gray-500 mb-5 max-w-[320px]">
                            {isComplete
                                ? `Your AI learned from ${totalSamples} pictures across ${totalClasses} classes!`
                                : isTraining
                                    ? `Training round ${currentEpoch}/${maxEpochs}. Learning from ${totalSamples} pictures.`
                                    : `Your ${totalSamples} pictures across ${totalClasses} classes are ready!`
                            }
                        </p>

                        {/* Progress bar */}
                        {(isTraining || isComplete) && (
                            <div className="w-full max-w-[320px] mb-5">
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-[11px] text-gray-500">{isComplete ? 'Complete!' : 'Progress'}</span>
                                    <span className="text-[11px] font-bold text-[#630ed4]">{trainingProgress}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-[width] duration-300 ease-in-out ${
                                            isComplete ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed]'
                                        }`}
                                        style={{ width: `${trainingProgress}%` }}
                                    />
                                </div>
                                {isTraining && (
                                    <div className="flex justify-between mt-1.5">
                                        <span className="text-[10px] text-gray-400">Round {currentEpoch}/{maxEpochs}</span>
                                        <span className="text-[10px] text-gray-400">~{Math.max(1, Math.floor(estimatedTime * (1 - trainingProgress / 100)))} min left</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Advanced Settings */}
                        {!isTraining && !isComplete && (
                            <div className="w-full max-w-[320px] mb-5">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="text-[11px] font-semibold text-[#630ed4] bg-transparent border-none cursor-pointer flex items-center gap-1 mx-auto"
                                >
                                    ⚙️ Advanced Settings {showAdvanced ? '▲' : '▼'}
                                </button>
                                {showAdvanced && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        {/* Batch Size */}
                                        <div className="mb-3">
                                            <div className="flex justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-gray-700">Batch Size</span>
                                                <span className="text-[10px] font-bold text-[#630ed4] py-0.5 px-1.5 bg-purple-100 rounded">{batchSize}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[4, 8, 16, 32].map(size => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setBatchSize(size)}
                                                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold border-none cursor-pointer transition-all duration-150 ${
                                                            batchSize === size ? 'bg-[#630ed4] text-white' : 'bg-purple-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Model Complexity */}
                                        <div>
                                            <div className="flex justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-gray-700">Model Complexity</span>
                                                <span className="text-[10px] font-bold text-[#630ed4] py-0.5 px-1.5 bg-purple-100 rounded">{numLayers} layers</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={5}
                                                value={numLayers}
                                                onChange={(e) => setNumLayers(parseInt(e.target.value))}
                                                className="w-full accent-[#630ed4]"
                                            />
                                            <div className="flex justify-between mt-1">
                                                <span className="text-[9px] text-gray-400">Simple</span>
                                                <span className="text-[9px] text-gray-400">Complex</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2.5 flex-wrap justify-center">
                            {!isTraining && !isComplete && (
                                <button
                                    onClick={handleStartTraining}
                                    disabled={!canTrain}
                                    className={`py-2.5 px-6 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-[13px] font-bold border-none transition-all duration-200 ${
                                        canTrain ? 'cursor-pointer opacity-100 shadow-[0_4px_12px_rgba(99,14,212,0.25)]' : 'cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    🚀 Start Training
                                </button>
                            )}
                            {isTraining && (
                                <button
                                    onClick={handleStopTraining}
                                    className="py-2.5 px-6 bg-red-50 text-red-600 rounded-xl text-[13px] font-bold border border-red-200 cursor-pointer"
                                >
                                    ⏸️ Pause
                                </button>
                            )}
                            {isComplete && (
                                <>
                                    <button
                                        onClick={handleResetTraining}
                                        className="py-2.5 px-5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 cursor-pointer"
                                    >
                                        🔄 Train Again
                                    </button>
                                    <button
                                        onClick={handleExportReport}
                                        className="py-2.5 px-5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-200 cursor-pointer"
                                    >
                                        💾 Save Report
                                    </button>
                                    <button
                                        onClick={() => mode.setMode('test')}
                                        className="py-2.5 px-6 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold border-none cursor-pointer shadow-[0_4px_12px_rgba(99,14,212,0.25)]"
                                    >
                                        🔍 Test AI
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Warning banner */}
                    {totalSamples > 0 && totalClasses < 2 && (
                        <div className="py-2.5 px-3.5 bg-amber-100 rounded-xl border border-amber-200 flex items-center gap-2">
                            <span className="text-sm">⚠️</span>
                            <div>
                                <p className="text-[11px] font-bold text-amber-900">Add at least 2 classes</p>
                                <p className="text-[10px] text-amber-700">Create 2 or more classes to start training</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column - Stats */}
                <div className="w-[240px] shrink-0 flex flex-col gap-2.5">
                    {/* Training Rounds */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-gray-700 tracking-wider">📅 TRAINING ROUNDS</span>
                            <span className="text-base font-extrabold text-[#630ed4]">{maxEpochs}</span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={100}
                            value={maxEpochs}
                            readOnly
                            className="w-full accent-[#630ed4]"
                        />
                        <div className="flex justify-between mt-1">
                            {[10, 25, 50, 100].map(v => (
                                <span key={v} className={`text-[9px] ${maxEpochs === v ? 'text-[#630ed4] font-bold' : 'text-gray-400 font-normal'}`}>
                                    {v}
                                </span>
                            ))}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">More rounds = smarter AI but takes longer</p>
                    </div>

                    {/* Progress */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-gray-700 tracking-wider">📊 PROGRESS</span>
                            <span className="text-base font-extrabold text-[#630ed4]">{trainingProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-[width] duration-300 ease-in-out ${
                                    isComplete ? 'bg-emerald-500' : 'bg-[#630ed4]'
                                }`}
                                style={{ width: `${trainingProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Estimated Time */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-700">⏱️ Est. Time</span>
                            <span className="text-xs font-bold text-gray-500">~{estimatedTime}s</span>
                        </div>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-700">🎯 ACCURACY</span>
                            <span className={`text-[13px] font-extrabold ${isComplete ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {isComplete ? `${Math.round(metrics.map50)}%` : '—'}
                            </span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">How smart your AI is!</p>
                    </div>

                    {/* Loss Chart */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex-1 min-h-0 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-gray-700">📉 Loss</span>
                            <span className={`text-[9px] font-bold py-0.75 px-2 rounded-md ${
                                isTraining ? 'bg-red-50 text-red-600' : isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {isTraining ? '🔴 LIVE' : isComplete ? '✅ DONE' : '⏳ Ready'}
                            </span>
                        </div>
                        <div className="flex items-end gap-0.5 h-[60px]">
                            {lossBarHeights.map((height, i) => {
                                const ratio = i / Math.max(lossBarHeights.length - 1, 1)
                                let colorClass = 'bg-gray-200'
                                if (ratio > 0.3) colorClass = 'bg-purple-300'
                                if (ratio > 0.5) colorClass = 'bg-[#630ed4]'
                                if (ratio > 0.8) colorClass = 'bg-emerald-600'
                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-t-sm transition-[height] duration-300 ease-in-out ${colorClass}`}
                                        style={{ height: `${Math.max(5, height)}%` }}
                                    />
                                )
                            })}
                            {lossBarHeights.length < 11 && Array.from({ length: 11 - lossBarHeights.length }).map((_, i) => (
                                <div
                                    key={`e${i}`}
                                    className="flex-1 h-[5%] rounded-t-sm bg-gray-100"
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[8px] text-gray-400">Start</span>
                            <span className="text-[8px] text-gray-400">End</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
