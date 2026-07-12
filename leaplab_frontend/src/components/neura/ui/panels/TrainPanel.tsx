import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'

interface TrainPanelProps {
    mode: UseNeuraProjectReturn
}

interface TrainingMetrics {
    loss: number
    boxLoss: number
    clsLoss: number
    objLoss: number
    map50: number
    map5095: number
    recall: number
    precision: number
    fps: number
    latency: number
}

interface EpochData {
    epoch: number
    loss: number
    map50: number
    boxLoss: number
    clsLoss: number
    objLoss: number
}

function calculateInitialMetrics(totalSamples: number, totalClasses: number): TrainingMetrics {
    const sampleFactor = Math.min(totalSamples / 100, 1)
    const classFactor = Math.min(totalClasses / 10, 1)
    const baseQuality = 0.3 + (sampleFactor * 0.3) + (classFactor * 0.2)

    return {
        loss: 2.5 - (baseQuality * 0.8),
        boxLoss: 1.2 - (baseQuality * 0.4),
        clsLoss: 0.8 - (baseQuality * 0.3),
        objLoss: 0.5 - (baseQuality * 0.1),
        map50: baseQuality * 30,
        map5095: baseQuality * 20,
        recall: baseQuality * 40,
        precision: baseQuality * 35,
        fps: 28 + Math.random() * 4,
        latency: 35 - (sampleFactor * 5)
    }
}

function calculateEpochMetrics(
    epoch: number,
    maxEpochs: number,
    totalSamples: number,
    totalClasses: number,
    prevMetrics: TrainingMetrics
): { metrics: TrainingMetrics; epochData: EpochData } {
    const sampleBonus = Math.min(totalSamples / 200, 0.15)
    const classBonus = Math.min(totalClasses / 20, 0.1)
    const progress = epoch / maxEpochs

    const newLoss = Math.max(0.05, prevMetrics.loss * (0.92 + Math.random() * 0.06))
    const newBoxLoss = Math.max(0.02, prevMetrics.boxLoss * (0.91 + Math.random() * 0.07))
    const newClsLoss = Math.max(0.01, prevMetrics.clsLoss * (0.90 + Math.random() * 0.08))
    const newObjLoss = Math.max(0.01, prevMetrics.objLoss * (0.93 + Math.random() * 0.05))

    const ceiling = 0.65 + sampleBonus + classBonus
    const mapGain = (1 - progress) * 0.15 * (1 + Math.random() * 0.1)
    const newMap50 = Math.min(ceiling * 100, prevMetrics.map50 + mapGain * 100)
    const newMap5095 = Math.min(ceiling * 75, prevMetrics.map5095 + mapGain * 70)
    const newRecall = Math.min(ceiling * 110, prevMetrics.recall + mapGain * 90)
    const newPrecision = Math.min(ceiling * 105, prevMetrics.precision + mapGain * 85)

    return {
        metrics: {
            loss: newLoss, boxLoss: newBoxLoss, clsLoss: newClsLoss, objLoss: newObjLoss,
            map50: newMap50, map5095: newMap5095, recall: newRecall, precision: newPrecision,
            fps: 30 + Math.random() * 5, latency: 28 + Math.random() * 8
        },
        epochData: { epoch, loss: newLoss, map50: newMap50, boxLoss: newBoxLoss, clsLoss: newClsLoss, objLoss: newObjLoss }
    }
}

export default function TrainPanel({ mode }: TrainPanelProps) {
    const [isTraining, setIsTraining] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [trainingProgress, setTrainingProgress] = useState(0)
    const [currentEpoch, setCurrentEpoch] = useState(0)
    const [maxEpochs] = useState(50)
    const [metrics, setMetrics] = useState<TrainingMetrics>(() =>
        calculateInitialMetrics(mode.getTotalSamples(), mode.project?.classes.length || 0)
    )
    const [epochHistory, setEpochHistory] = useState<EpochData[]>([])
    const [estimatedTime, setEstimatedTime] = useState(0)
    const [showCelebration, setShowCelebration] = useState(false)
    const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const totalSamples = mode.getTotalSamples()
    const totalClasses = mode.project?.classes.length || 0
    const WORKFLOW_STEPS = ['Collect', 'Label Objects', 'Teach AI', 'Find Things']
    const currentStepIndex = 2

    useEffect(() => {
        const baseTime = 14
        setEstimatedTime(Math.max(5, Math.floor(baseTime + totalSamples / 100 + totalClasses / 5)))
    }, [totalSamples, totalClasses])

    useEffect(() => {
        return () => { if (trainingIntervalRef.current) clearInterval(trainingIntervalRef.current) }
    }, [])

    useEffect(() => {
        if (isComplete) {
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 5000)
        }
    }, [isComplete])

    const runTrainingEpoch = useCallback((epoch: number) => {
        if (epoch > maxEpochs) {
            setIsTraining(false); setIsComplete(true)
            if (trainingIntervalRef.current) { clearInterval(trainingIntervalRef.current); trainingIntervalRef.current = null }
            return
        }
        setCurrentEpoch(epoch)
        setTrainingProgress(Math.floor((epoch / maxEpochs) * 100))
        setMetrics(prev => {
            const { metrics: newMetrics, epochData } = calculateEpochMetrics(epoch, maxEpochs, totalSamples, totalClasses, prev)
            setEpochHistory(h => [...h, epochData])
            return newMetrics
        })
    }, [maxEpochs, totalSamples, totalClasses])

    const handleStartTraining = useCallback(() => {
        setIsTraining(true); setIsComplete(false); setTrainingProgress(0); setCurrentEpoch(0); setEpochHistory([])
        setMetrics(calculateInitialMetrics(totalSamples, totalClasses))
        let epoch = 1
        trainingIntervalRef.current = setInterval(() => { runTrainingEpoch(epoch); epoch++ }, 400)
    }, [totalSamples, totalClasses, runTrainingEpoch])

    const handleStopTraining = useCallback(() => {
        if (trainingIntervalRef.current) { clearInterval(trainingIntervalRef.current); trainingIntervalRef.current = null }
        setIsTraining(false)
    }, [])

    const handleResetTraining = useCallback(() => {
        setIsComplete(false); setTrainingProgress(0); setCurrentEpoch(0); setEpochHistory([])
        setMetrics(calculateInitialMetrics(totalSamples, totalClasses))
    }, [totalSamples, totalClasses])

    const lossChartData = epochHistory.length > 0 ? epochHistory.map(e => e.loss) : [metrics.loss]
    const mapChartData = epochHistory.length > 0 ? epochHistory.map(e => e.map50) : [metrics.map50]
    const maxLoss = Math.max(...lossChartData, 1)
    const lossBarHeights = lossChartData.map(l => (l / maxLoss) * 100)

    const mapLinePoints = useMemo(() => mapChartData.map((v, i) => ({
        x: (i / Math.max(mapChartData.length - 1, 1)) * 400,
        y: 128 - (v / 100) * 120
    })), [mapChartData])

    const mapLinePath = mapLinePoints.length > 1
        ? `M${mapLinePoints.map(p => `${p.x} ${p.y}`).join(' L')}`
        : `M0 ${128 - (mapChartData[0] / 100) * 120} L400 ${128 - (mapChartData[0] / 100) * 120}`

    const finalMap = mapChartData[mapChartData.length - 1] || 0

    const classPerformances = useMemo(() =>
        mode.project?.classes.map(() => Math.min(95, metrics.map50 + (Math.random() * 20 - 10))) || [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [metrics.map50, mode.project?.classes.length]
    )

    const f1Score = (2 * (metrics.precision / 100) * (metrics.recall / 100) / ((metrics.precision / 100) + (metrics.recall / 100) || 1))

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {showCelebration && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="text-center animate-bounce">
                        <div className="text-6xl mb-4">🎉</div>
                        <div className="text-2xl font-bold text-primary" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Great Job!</div>
                        <div className="text-lg text-on-surface-variant">Your AI is ready to find objects!</div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>🤖 Teach Your AI</h1>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Step {currentStepIndex + 1} of 4</span>
            </div>

            <div className="mb-6">
                <div className="relative h-2 bg-outline-variant rounded-full">
                    <div className="absolute top-0 left-0 h-full bg-secondary rounded-full transition-all duration-700" style={{ width: `${(currentStepIndex / 3) * 100}%` }} />
                    {WORKFLOW_STEPS.map((_, idx) => (
                        <div key={idx} className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white z-10 transition-all ${idx < currentStepIndex ? 'bg-secondary text-on-secondary' : idx === currentStepIndex ? 'bg-primary text-on-primary pulse-active' : 'bg-surface-container-highest border-2 border-outline-variant text-on-surface-variant'}`} style={{ left: `${(idx / 3) * 100}%`, transform: 'translate(-50%, -50%)' }}>
                            {idx < currentStepIndex ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg> : <span className="text-sm font-semibold">{idx + 1}</span>}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-3">
                    {WORKFLOW_STEPS.map((step, idx) => (
                        <span key={step} className={`text-xs font-semibold ${idx === currentStepIndex ? 'text-primary' : 'text-on-surface-variant'}`}>{step}</span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Main CTA */}
                <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="text-center z-10 max-w-lg">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-secondary-container">
                            {isComplete ? <span className="text-4xl">✅</span> : isTraining ? <span className="text-4xl animate-spin">🤖</span> : <span className="text-4xl">🚀</span>}
                        </div>
                        <h2 className="text-2xl font-bold text-on-surface mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {isComplete ? '🎉 Teaching Complete!' : isTraining ? '🤖 Teaching Your AI...' : '🚀 Ready to Teach AI'}
                        </h2>
                        <p className="text-base text-on-surface-variant mb-6">
                            {isComplete ? `Your AI learned from ${totalSamples} pictures across ${totalClasses} object types! Accuracy: ${finalMap.toFixed(1)}%` : isTraining ? `Training round ${currentEpoch}/${maxEpochs}. Learning from ${totalSamples} pictures.` : `Your ${totalSamples} pictures across ${totalClasses} object types are ready!`}
                        </p>
                        {(isTraining || isComplete) && (
                            <div className="mb-6 w-full max-w-md mx-auto">
                                <div className="flex justify-between mb-2"><span className="text-sm text-on-surface-variant">{isComplete ? 'Complete!' : 'Progress'}</span><span className="text-sm font-bold text-primary">{trainingProgress}%</span></div>
                                <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${trainingProgress}%` }} /></div>
                                {isTraining && <div className="flex justify-between mt-2 text-xs text-on-surface-variant"><span>Round {currentEpoch}/{maxEpochs}</span><span>~{Math.max(1, Math.floor(estimatedTime * (1 - trainingProgress / 100)))} min left</span></div>}
                            </div>
                        )}
                        <div className="flex gap-4 justify-center">
                            {!isTraining && !isComplete && <button onClick={handleStartTraining} disabled={totalSamples === 0} className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold text-base hover:shadow-[4px_4px_0px_0px_#630ed4] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">Start Teaching <span className="text-lg">▶️</span></button>}
                            {isTraining && <button onClick={handleStopTraining} className="bg-error-container text-on-error-container px-8 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all flex items-center gap-2"><span className="text-lg">⏸️</span> Pause</button>}
                            {isComplete && <><button onClick={handleResetTraining} className="bg-surface-container-high text-on-surface px-6 py-4 rounded-xl font-bold text-base hover:bg-surface-container-highest transition-all">🔄 Teach Again</button><button onClick={() => mode.setMode('test')} className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-base hover:shadow-md transition-all flex items-center gap-2">🔍 Find Things</button></>}
                        </div>
                        <div className="mt-6 flex justify-center gap-8">
                            <div className="flex items-center gap-2 text-on-surface-variant"><span className="text-lg">🧠</span><span className="text-sm font-semibold">AI Engine: Ready</span></div>
                            <div className="flex items-center gap-2 text-on-surface-variant"><span className="text-lg">⏱️</span><span className="text-sm font-semibold">Est: {estimatedTime} min</span></div>
                        </div>
                    </div>
                </div>

                {/* Dataset Health */}
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6">
                    <h3 className="text-base font-bold text-on-surface mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📊 Dataset Health</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white border border-outline-variant rounded-lg"><div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold text-on-surface-variant">Pictures</span><span className="text-base font-bold text-primary">{totalSamples}</span></div><div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden"><div className="bg-primary h-full" style={{ width: `${Math.min(totalSamples / 10, 100)}%` }} /></div></div>
                        <div className="p-4 bg-white border border-outline-variant rounded-lg"><div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold text-on-surface-variant">Object Types</span><span className="text-base font-bold text-primary">{totalClasses}</span></div><div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden"><div className="bg-secondary h-full" style={{ width: `${Math.min(totalClasses / 8, 100)}%` }} /></div></div>
                        <div className="p-4 bg-white border border-outline-variant rounded-lg"><div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold text-on-surface-variant">Enhancements</span><span className="text-base font-bold text-primary">ON</span></div><div className="flex flex-wrap gap-2"><span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold">FLIP</span><span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold">ROTATE</span><span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold">BRIGHT</span></div></div>
                    </div>
                </div>

                {/* Learning Score */}
                <div className="col-span-12 md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4"><div><h4 className="text-base font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📉 Learning Score</h4><p className="text-sm text-on-surface-variant mt-1">Lower = smarter AI!</p></div><div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isTraining ? 'bg-error-container text-on-error-container' : isComplete ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>{isTraining ? 'LIVE' : isComplete ? 'DONE' : 'Ready'}</div></div>
                    <div className="h-36 flex items-end gap-1 mb-4">
                        {lossBarHeights.map((height, i) => { const ratio = i / Math.max(lossBarHeights.length - 1, 1); let c = 'bg-outline-variant'; if (ratio > 0.3) c = 'bg-primary-container'; if (ratio > 0.5) c = 'bg-primary'; if (ratio > 0.8) c = 'bg-secondary'; return <div key={i} className={`w-full rounded-t transition-all duration-500 ${c}`} style={{ height: `${Math.max(5, height)}%` }} /> })}
                        {lossBarHeights.length < 11 && Array.from({ length: 11 - lossBarHeights.length }).map((_, i) => <div key={`e${i}`} className="w-full rounded-t bg-surface-container-highest" style={{ height: '5%' }} />)}
                    </div>
                    <div className="flex justify-between text-xs font-mono text-on-surface-variant"><span>Round 0</span><span>Round {isTraining ? currentEpoch : isComplete ? maxEpochs : '50'}</span><span>Goal</span></div>
                    <div className="mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                        <div className="flex items-center gap-2 mb-3"><span className="text-lg">📊</span><span className="text-sm font-semibold text-on-surface-variant">Score Details</span></div>
                        <div className="grid grid-cols-3 gap-4"><div className="text-center"><div className="text-base font-bold text-primary">{metrics.boxLoss.toFixed(3)}</div><div className="text-xs text-on-surface-variant">Shape</div></div><div className="text-center"><div className="text-base font-bold text-secondary">{metrics.clsLoss.toFixed(3)}</div><div className="text-xs text-on-surface-variant">Name</div></div><div className="text-center"><div className="text-base font-bold text-tertiary">{metrics.objLoss.toFixed(3)}</div><div className="text-xs text-on-surface-variant">Object</div></div></div>
                    </div>
                </div>

                {/* Accuracy Score */}
                <div className="col-span-12 md:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4"><div><h4 className="text-base font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📈 Accuracy Score</h4><p className="text-sm text-on-surface-variant mt-1">Higher = better at finding objects!</p></div><div className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-secondary-container text-on-secondary-container">GOAL: 85%</div></div>
                    <div className="h-36 relative mb-4">
                        <div className="absolute inset-0 flex flex-col justify-between opacity-10"><div className="border-t border-on-surface w-full" /><div className="border-t border-on-surface w-full" /><div className="border-t border-on-surface w-full" /><div className="border-t border-on-surface w-full" /></div>
                        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
                            <path d={`${mapLinePath} L${mapLinePoints.length > 0 ? mapLinePoints[mapLinePoints.length - 1].x : 400} 128 L0 128 Z`} fill="url(#mapGradient)" opacity="0.2" />
                            <path d={mapLinePath} fill="none" stroke="#630ed4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {mapLinePoints.length > 0 && <circle cx={mapLinePoints[mapLinePoints.length - 1].x} cy={mapLinePoints[mapLinePoints.length - 1].y} fill={isComplete ? '#006c44' : '#630ed4'} r="6" />}
                            <defs><linearGradient id="mapGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#630ed4" stopOpacity="0.3" /><stop offset="100%" stopColor="#630ed4" stopOpacity="0" /></linearGradient></defs>
                        </svg>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-on-surface-variant"><span>Low</span><span>Medium</span><span>High</span></div>
                    <div className="mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                        <div className="flex items-center gap-2 mb-3"><span className="text-lg">🎯</span><span className="text-sm font-semibold text-on-surface-variant">Detection Scores</span></div>
                        <div className="grid grid-cols-3 gap-4"><div className="text-center"><div className="text-base font-bold text-primary">{metrics.map50.toFixed(1)}%</div><div className="text-xs text-on-surface-variant">Accuracy</div></div><div className="text-center"><div className="text-base font-bold text-secondary">{metrics.map5095.toFixed(1)}%</div><div className="text-xs text-on-surface-variant">Precision</div></div><div className="text-center"><div className="text-base font-bold text-tertiary">{metrics.recall.toFixed(1)}%</div><div className="text-xs text-on-surface-variant">Recall</div></div></div>
                    </div>
                </div>

                {/* Speed */}
                <div className="col-span-12 md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                    <h4 className="text-base font-bold text-on-surface mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>⚡ Speed</h4>
                    <div className="space-y-4">
                        <div className="p-4 bg-white border border-outline-variant rounded-lg flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">⚡</span><span className="text-sm font-semibold text-on-surface-variant">Speed</span></div><span className="text-base font-bold text-on-surface">{metrics.fps.toFixed(1)} fps</span></div>
                        <div className="p-4 bg-white border border-outline-variant rounded-lg flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">⏱️</span><span className="text-sm font-semibold text-on-surface-variant">Response</span></div><span className="text-base font-bold text-on-surface">{metrics.latency.toFixed(0)}ms</span></div>
                    </div>
                </div>

                {/* Finds vs Misses */}
                <div className="col-span-12 md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                    <h4 className="text-base font-bold text-on-surface mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📊 Finds vs Misses</h4>
                    <div className="relative h-32 mb-4">
                        <div className="absolute inset-0 flex flex-col justify-between opacity-10"><div className="border-t border-on-surface w-full" /><div className="border-t border-on-surface w-full" /><div className="border-t border-on-surface w-full" /></div>
                        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 160 100">
                            <path d={`M0 100 Q40 ${100 - metrics.precision} 80 ${100 - metrics.precision * 0.8} T160 ${100 - metrics.precision * 0.6}`} fill="none" stroke="#630ed4" strokeWidth="2" strokeLinecap="round" />
                            <path d={`M0 ${100 - metrics.recall * 0.6} Q40 ${100 - metrics.recall * 0.8} 80 ${100 - metrics.recall} T160 100`} fill="none" stroke="#006c44" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="flex justify-center gap-6 text-xs"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-on-surface-variant">Finds</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary" /><span className="text-on-surface-variant">Misses</span></div></div>
                    <div className="mt-4 p-3 bg-surface-container-low rounded-lg border border-outline-variant text-center"><div className="text-xs text-on-surface-variant uppercase mb-1">Overall Grade</div><div className="text-xl font-bold text-primary">{f1Score.toFixed(3)}</div></div>
                </div>

                {/* Object Types */}
                <div className="col-span-12 md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                    <h4 className="text-base font-bold text-on-surface mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>🏷️ Object Types</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {mode.project?.classes.slice(0, 6).map((cls, i) => (
                            <div key={cls.id} className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: cls.color }} />
                                <span className="text-sm font-semibold text-on-surface flex-1 truncate">{cls.name}</span>
                                <div className="w-20 h-2 bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${classPerformances[i] || 0}%`, backgroundColor: cls.color }} /></div>
                                <span className="text-xs font-mono text-on-surface-variant w-10 text-right">{(classPerformances[i] || 0).toFixed(0)}%</span>
                            </div>
                        ))}
                        {(!mode.project?.classes || mode.project.classes.length === 0) && <p className="text-sm text-on-surface-variant text-center py-6">No object types yet</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}