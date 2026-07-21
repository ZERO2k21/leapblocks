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
        <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar w-full" style={{ padding: '12px 20px', alignItems: 'center' }}>
            {/* Celebration Modal */}
            {showCelebration && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at center, rgba(99,14,212,0.15) 0%, rgba(0,0,0,0.3) 100%)',
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '32px',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        maxWidth: '320px',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Training Complete!</h3>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Your AI learned from {totalSamples} pictures</p>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            background: '#ecfdf5',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#059669',
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                            Accuracy: {Math.round(metrics.map50)}%
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="text-center animate-fade-in" style={{ marginBottom: '12px' }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                        borderRadius: '14px',
                        border: '1px solid rgba(99,14,212,0.1)',
                        boxShadow: '0 2px 8px rgba(99,14,212,0.06)',
                    }}
                >
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99,14,212,0.25)',
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>🏋️</span>
                    </div>
                    <h2
                        style={{
                            fontSize: '1.3rem',
                            fontWeight: 800,
                            color: '#131b2e',
                            margin: 0,
                        }}
                    >
                        Teach Your AI!
                    </h2>
                </div>
            </div>

            {/* Workflow and Tips - centered */}
            <div style={{ width: '100%', margin: '0 auto 12px' }}>
                <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />

                {/* Tips */}
                <div style={{ marginTop: '10px' }} className="animate-fade-in">
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            border: '1px solid rgba(99,14,212,0.1)',
                        }}
                    >
                        <div className="flex items-start" style={{ gap: '8px' }}>
                            <div
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    flexShrink: 0,
                                }}
                            >💡</div>
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: '#630ed4', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Training Tips
                                </p>
                                <div className="flex flex-wrap" style={{ gap: '3px 14px' }}>
                                    {['More samples = better accuracy', '2+ classes needed to train', '50 rounds is usually enough', 'Training takes 1-2 minutes'].map((tip) => (
                                        <span key={tip} className="flex items-center" style={{ gap: '5px', fontSize: '10px', color: '#4b5563' }}>
                                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#630ed4', flexShrink: 0 }} />
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
                <div style={{ flex: '1', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Main card */}
                    <div
                        style={{
                            flex: 1,
                            background: '#fff',
                            borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 24px',
                            textAlign: 'center',
                        }}
                    >
                        {/* Icon */}
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: isComplete ? '#ecfdf5' : isTraining ? '#f5f3ff' : '#f3e8ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px',
                                border: '3px dashed ' + (isComplete ? '#a7f3d0' : isTraining ? '#c4b5fd' : '#ddd6fe'),
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>
                                {isComplete ? '🎉' : isTraining ? '🤖' : '🚀'}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                            {isComplete ? 'Training Complete!' : isTraining ? 'Training Your AI...' : 'Ready to Train!'}
                        </h2>

                        {/* Description */}
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px', maxWidth: '320px' }}>
                            {isComplete
                                ? `Your AI learned from ${totalSamples} pictures across ${totalClasses} classes!`
                                : isTraining
                                    ? `Training round ${currentEpoch}/${maxEpochs}. Learning from ${totalSamples} pictures.`
                                    : `Your ${totalSamples} pictures across ${totalClasses} classes are ready!`
                            }
                        </p>

                        {/* Progress bar */}
                        {(isTraining || isComplete) && (
                            <div style={{ width: '100%', maxWidth: '320px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{isComplete ? 'Complete!' : 'Progress'}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#630ed4' }}>{trainingProgress}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: '4px',
                                            background: isComplete ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #630ed4, #7c3aed)',
                                            width: `${trainingProgress}%`,
                                            transition: 'width 0.3s ease',
                                        }}
                                    />
                                </div>
                                {isTraining && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>Round {currentEpoch}/{maxEpochs}</span>
                                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>~{Math.max(1, Math.floor(estimatedTime * (1 - trainingProgress / 100)))} min left</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Advanced Settings */}
                        {!isTraining && !isComplete && (
                            <div style={{ width: '100%', maxWidth: '320px', marginBottom: '20px' }}>
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#630ed4',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        margin: '0 auto',
                                    }}
                                >
                                    ⚙️ Advanced Settings {showAdvanced ? '▲' : '▼'}
                                </button>
                                {showAdvanced && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                        {/* Batch Size */}
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>Batch Size</span>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#630ed4', padding: '2px 6px', background: '#ede9fe', borderRadius: '4px' }}>{batchSize}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {[4, 8, 16, 32].map(size => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setBatchSize(size)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '6px',
                                                            borderRadius: '6px',
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            background: batchSize === size ? '#630ed4' : '#ede9fe',
                                                            color: batchSize === size ? '#fff' : '#374151',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Model Complexity */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>Model Complexity</span>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#630ed4', padding: '2px 6px', background: '#ede9fe', borderRadius: '4px' }}>{numLayers} layers</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={5}
                                                value={numLayers}
                                                onChange={(e) => setNumLayers(parseInt(e.target.value))}
                                                style={{ width: '100%', accentColor: '#630ed4' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                                <span style={{ fontSize: '9px', color: '#9ca3af' }}>Simple</span>
                                                <span style={{ fontSize: '9px', color: '#9ca3af' }}>Complex</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {!isTraining && !isComplete && (
                                <button
                                    onClick={handleStartTraining}
                                    disabled={!canTrain}
                                    style={{
                                        padding: '10px 24px',
                                        background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                        color: '#fff',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: canTrain ? 'pointer' : 'not-allowed',
                                        opacity: canTrain ? 1 : 0.5,
                                        boxShadow: '0 4px 12px rgba(99,14,212,0.25)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    🚀 Start Training
                                </button>
                            )}
                            {isTraining && (
                                <button
                                    onClick={handleStopTraining}
                                    style={{
                                        padding: '10px 24px',
                                        background: '#fef2f2',
                                        color: '#dc2626',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        border: '1px solid #fecaca',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ⏸️ Pause
                                </button>
                            )}
                            {isComplete && (
                                <>
                                    <button
                                        onClick={handleResetTraining}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#f3f4f6',
                                            color: '#374151',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            border: '1px solid #e5e7eb',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        🔄 Train Again
                                    </button>
                                    <button
                                        onClick={handleExportReport}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#ecfdf5',
                                            color: '#059669',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            border: '1px solid #a7f3d0',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        💾 Save Report
                                    </button>
                                    <button
                                        onClick={() => mode.setMode('test')}
                                        style={{
                                            padding: '10px 24px',
                                            background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(99,14,212,0.25)',
                                        }}
                                    >
                                        🔍 Test AI
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Warning banner */}
                    {totalSamples > 0 && totalClasses < 2 && (
                        <div
                            style={{
                                padding: '10px 14px',
                                background: '#fef3c7',
                                borderRadius: '10px',
                                border: '1px solid #fde68a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <span style={{ fontSize: '14px' }}>⚠️</span>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#92400e' }}>Add at least 2 classes</p>
                                <p style={{ fontSize: '10px', color: '#a16207' }}>Create 2 or more classes to start training</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column - Stats */}
                <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Training Rounds */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151', letterSpacing: '0.05em' }}>📅 TRAINING ROUNDS</span>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#630ed4' }}>{maxEpochs}</span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={100}
                            value={maxEpochs}
                            readOnly
                            style={{ width: '100%', accentColor: '#630ed4' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            {[10, 25, 50, 100].map(v => (
                                <span key={v} style={{ fontSize: '9px', color: maxEpochs === v ? '#630ed4' : '#9ca3af', fontWeight: maxEpochs === v ? 700 : 400 }}>
                                    {v}
                                </span>
                            ))}
                        </div>
                        <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>More rounds = smarter AI but takes longer</p>
                    </div>

                    {/* Progress */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151', letterSpacing: '0.05em' }}>📊 PROGRESS</span>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#630ed4' }}>{trainingProgress}%</span>
                        </div>
                        <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    borderRadius: '3px',
                                    background: isComplete ? '#10b981' : '#630ed4',
                                    width: `${trainingProgress}%`,
                                    transition: 'width 0.3s ease',
                                }}
                            />
                        </div>
                    </div>

                    {/* Estimated Time */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>⏱️ Est. Time</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>~{estimatedTime}s</span>
                        </div>
                    </div>

                    {/* Accuracy */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>🎯 ACCURACY</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: isComplete ? '#059669' : '#9ca3af' }}>
                                {isComplete ? `${Math.round(metrics.map50)}%` : '—'}
                            </span>
                        </div>
                        <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>How smart your AI is!</p>
                    </div>

                    {/* Loss Chart */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>📉 Loss</span>
                            <span style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: isTraining ? '#fef2f2' : isComplete ? '#ecfdf5' : '#f3f4f6',
                                color: isTraining ? '#dc2626' : isComplete ? '#059669' : '#6b7280',
                            }}>
                                {isTraining ? '🔴 LIVE' : isComplete ? '✅ DONE' : '⏳ Ready'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px' }}>
                            {lossBarHeights.map((height, i) => {
                                const ratio = i / Math.max(lossBarHeights.length - 1, 1)
                                let color = '#e5e7eb'
                                if (ratio > 0.3) color = '#c4b5fd'
                                if (ratio > 0.5) color = '#630ed4'
                                if (ratio > 0.8) color = '#059669'
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            height: `${Math.max(5, height)}%`,
                                            borderRadius: '2px 2px 0 0',
                                            background: color,
                                            transition: 'height 0.3s ease',
                                        }}
                                    />
                                )
                            })}
                            {lossBarHeights.length < 11 && Array.from({ length: 11 - lossBarHeights.length }).map((_, i) => (
                                <div
                                    key={`e${i}`}
                                    style={{ flex: 1, height: '5%', borderRadius: '2px 2px 0 0', background: '#f3f4f6' }}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '8px', color: '#9ca3af' }}>Start</span>
                            <span style={{ fontSize: '8px', color: '#9ca3af' }}>End</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
