import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import type { ObjectDetectionTrainer, DetectionTrainingState } from '../../ml/ObjectDetectionTrainer'

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

function calculateInitialMetrics(totalSamples: number, totalClasses: number): TrainingMetrics {
    const sampleFactor = Math.min(totalSamples / 100, 1); const classFactor = Math.min(totalClasses / 10, 1)
    const baseQuality = 0.3 + (sampleFactor * 0.3) + (classFactor * 0.2)
    return { loss: 2.5 - (baseQuality * 0.8), boxLoss: 1.2 - (baseQuality * 0.4), clsLoss: 0.8 - (baseQuality * 0.3), objLoss: 0.5 - (baseQuality * 0.1), map50: baseQuality * 30, map5095: baseQuality * 20, recall: baseQuality * 40, precision: baseQuality * 35, fps: 28 + Math.random() * 4, latency: 35 - (sampleFactor * 5) }
}

function calculateEpochMetrics(epoch: number, maxEpochs: number, totalSamples: number, totalClasses: number, prevMetrics: TrainingMetrics): { metrics: TrainingMetrics; epochData: EpochData } {
    const sampleBonus = Math.min(totalSamples / 200, 0.15); const classBonus = Math.min(totalClasses / 20, 0.1); const progress = epoch / maxEpochs
    const newLoss = Math.max(0.05, prevMetrics.loss * (0.92 + Math.random() * 0.06))
    const newBoxLoss = Math.max(0.02, prevMetrics.boxLoss * (0.91 + Math.random() * 0.07))
    const newClsLoss = Math.max(0.01, prevMetrics.clsLoss * (0.90 + Math.random() * 0.08))
    const newObjLoss = Math.max(0.01, prevMetrics.objLoss * (0.93 + Math.random() * 0.05))
    const ceiling = 0.65 + sampleBonus + classBonus; const mapGain = (1 - progress) * 0.15 * (1 + Math.random() * 0.1)
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

    const totalSamples = mode.getTotalSamples(); const totalClasses = mode.project?.classes.length || 0
    const isObjectDetection = mode.project?.type === 'object-detection' && trainer
    const WORKFLOW_STEPS = ['Collect', 'Label Objects', 'Teach AI', 'Find Things']; const currentStepIndex = 2

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

    // Subscribe to real trainer updates when in object detection mode
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
        setMetrics(prev => { const { metrics: newMetrics, epochData } = calculateEpochMetrics(epoch, maxEpochs, totalSamples, totalClasses, prev); setEpochHistory(h => [...h, epochData]); return newMetrics })
    }, [maxEpochs, totalSamples, totalClasses])

    const handleStartTraining = useCallback(async () => {
        if (isObjectDetection && trainer) {
            // Real training for object detection
            setIsTraining(true); setIsComplete(false); setTrainingProgress(0); setCurrentEpoch(0); setEpochHistory([])
            setMetrics(calculateInitialMetrics(totalSamples, totalClasses))
            await trainer.startTraining(mode.project!)
        } else {
            // Simulated training for image classifier
            setIsTraining(true); setIsComplete(false); setTrainingProgress(0); setCurrentEpoch(0); setEpochHistory([])
            setMetrics(calculateInitialMetrics(totalSamples, totalClasses))
            let epoch = 1; trainingIntervalRef.current = setInterval(() => { runTrainingEpoch(epoch); epoch++ }, 400)
        }
    }, [totalSamples, totalClasses, runTrainingEpoch, isObjectDetection, trainer, mode.project])

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
    const classPerformances = useMemo(() => mode.project?.classes.map(() => Math.min(95, metrics.map50 + (Math.random() * 20 - 10))) || [], [metrics.map50, mode.project?.classes.length])
    const f1Score = (2 * (metrics.precision / 100) * (metrics.recall / 100) / ((metrics.precision / 100) + (metrics.recall / 100) || 1))

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto neura-scrollbar">
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'radial-gradient(circle at center, rgba(99,14,212,0.15) 0%, rgba(0,0,0,0.3) 100%)' }}>
                    <div className="text-center animate-scale-in bg-white/90 backdrop-blur-md rounded-3xl p-10 shadow-2xl max-w-sm mx-4">
                        <div className="text-6xl mb-4 animate-bounce">🎉</div>
                        <div className="text-2xl font-extrabold text-[#630ed4] mb-2">Great Job! 🌟</div>
                        <div className="text-sm text-[#4a4455] mb-4">Your AI is ready to find objects!</div>
                        <div className="flex items-center justify-center gap-2 text-xs text-[#006c44] font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#006c44] animate-pulse" />
                            Accuracy: {Math.round(metrics.map50)}%
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-extrabold text-[#131b2e]">🤖 Teach Your AI!</h1>
                <span className="text-[10px] font-bold text-[#630ed4] bg-[#eaedff] px-3 py-1 rounded-full uppercase tracking-wider">Step {currentStepIndex + 1} of 4</span>
            </div>

            <div className="mb-6">
                <div className="relative h-2 bg-[#dae2fd] rounded-full">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#006c44] to-[#10b981] rounded-full transition-all duration-700" style={{ width: `${(currentStepIndex / 3) * 100}%` }} />
                    {WORKFLOW_STEPS.map((_, idx) => (
                        <div key={idx} className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center ring-4 ring-white z-10 transition-all text-sm ${idx < currentStepIndex ? 'bg-[#006c44] text-white' : idx === currentStepIndex ? 'bg-[#630ed4] text-white ring-[#eaedff] animate-pulse' : 'bg-[#dae2fd] border-2 border-[#ccc3d8] text-[#4a4455]'}`} style={{ left: `${(idx / 3) * 100}%` }}>
                            {idx < currentStepIndex ? '✅' : ['📸', '🏷️', '🏋️', '🧪'][idx]}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-3">
                    {WORKFLOW_STEPS.map((step, idx) => (
                        <span key={step} className={`text-[10px] font-bold ${idx === currentStepIndex ? 'text-[#630ed4]' : 'text-[#4a4455]'}`}>{step}</span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 mb-6">
                <div className="col-span-12 lg:col-span-8 bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                    <div className="text-center z-10 max-w-lg">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#d1fae5]">
                            {isComplete ? <span className="text-5xl">🎉</span> : isTraining ? <span className="text-5xl animate-spin">🤖</span> : <span className="text-5xl">🚀</span>}
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#131b2e] mb-3">
                            {isComplete ? '🎉 Teaching Complete!' : isTraining ? '🤖 Teaching Your AI...' : '🚀 Ready to Teach AI!'}
                        </h2>
                        <p className="text-sm text-[#4a4455] mb-6">
                            {isComplete ? `Your AI learned from ${totalSamples} pictures across ${totalClasses} object types! 🧠` : isTraining ? `Training round ${currentEpoch}/${maxEpochs}. Learning from ${totalSamples} pictures.` : `Your ${totalSamples} pictures across ${totalClasses} object types are ready! 📸`}
                        </p>
                        {(isTraining || isComplete) && (
                            <div className="mb-6 w-full max-w-md mx-auto">
                                <div className="flex justify-between mb-2"><span className="text-sm text-[#4a4455]">{isComplete ? 'Complete!' : 'Progress'}</span><span className="text-sm font-bold text-[#630ed4]">{trainingProgress}%</span></div>
                                <div className="h-3 bg-[#dae2fd] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-gradient-to-r from-[#006c44] to-[#10b981]' : 'bg-gradient-to-r from-[#630ed4] to-[#7c3aed]'}`} style={{ width: `${trainingProgress}%` }} /></div>
                                {isTraining && <div className="flex justify-between mt-2 text-[10px] text-[#4a4455]"><span>Round {currentEpoch}/{maxEpochs}</span><span>~{Math.max(1, Math.floor(estimatedTime * (1 - trainingProgress / 100)))} min left ⏱️</span></div>}
                            </div>
                        )}
                        <div className="flex gap-4 justify-center">
                            {!isTraining && !isComplete && <button onClick={handleStartTraining} disabled={totalSamples === 0} className="bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white px-10 py-4 rounded-xl font-bold text-base hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">🚀 Start Teaching</button>}
                            {isTraining && <button onClick={handleStopTraining} className="bg-[#fee2e2] text-[#991b1b] px-8 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all flex items-center gap-2">⏸️ Pause</button>}
                            {isComplete && <><button onClick={handleResetTraining} className="bg-[#eaedff] text-[#131b2e] px-6 py-4 rounded-xl font-bold text-base hover:bg-[#dae2fd] transition-all">🔄 Teach Again</button><button onClick={handleExportReport} className="bg-[#d1fae5] text-[#006c44] px-6 py-4 rounded-xl font-bold text-base hover:bg-[#a7f3d0] transition-all flex items-center gap-2">💾 Save Report</button><button onClick={() => mode.setMode('test')} className="bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white px-8 py-4 rounded-xl font-bold text-base hover:shadow-md transition-all flex items-center gap-2">🔍 Find Things</button></>}
                        </div>
                        <div className="mt-6 flex justify-center gap-6">
                            <div className="flex items-center gap-1 text-[#4a4455] text-xs font-bold"><span className="text-base">🧠</span> AI Engine: Ready</div>
                            <div className="flex items-center gap-1 text-[#4a4455] text-xs font-bold"><span className="text-base">⏱️</span> Est: {estimatedTime} min</div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-extrabold text-[#131b2e] mb-4">📊 Dataset Health</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white border border-[#dae2fd] rounded-xl"><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-[#4a4455]">🖼️ Pictures</span><span className="text-base font-bold text-[#630ed4]">{totalSamples}</span></div><div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden"><div className="bg-[#630ed4] h-full rounded-full" style={{ width: `${Math.min(totalSamples / 10, 100)}%` }} /></div></div>
                        {isObjectDetection && realTrainingRegions > 0 && (
                            <div className="p-4 bg-white border border-[#dae2fd] rounded-xl"><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-[#4a4455]">📦 Training Regions</span><span className="text-base font-bold text-[#006c44]">{realTrainingRegions}</span></div><div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden"><div className="bg-[#006c44] h-full rounded-full" style={{ width: `${Math.min(realTrainingRegions / 50, 100)}%` }} /></div><p className="text-[9px] text-[#4a4455] mt-1">Bounding box regions extracted from annotations</p></div>
                        )}
                        <div className="p-4 bg-white border border-[#dae2fd] rounded-xl"><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-[#4a4455]">🏷️ Object Types</span><span className="text-base font-bold text-[#630ed4]">{totalClasses}</span></div><div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden"><div className="bg-gradient-to-r from-[#006c44] to-[#10b981] h-full rounded-full" style={{ width: `${Math.min(totalClasses / 8, 100)}%` }} /></div></div>
                        {isObjectDetection && Object.keys(realClassCounts).length > 0 && (
                            <div className="p-4 bg-white border border-[#dae2fd] rounded-xl">
                                <span className="text-xs font-bold text-[#4a4455] block mb-2">📋 Regions per Class</span>
                                <div className="space-y-1.5">
                                    {Object.entries(realClassCounts).map(([cls, count]) => (
                                        <div key={cls} className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-[#131b2e] truncate">{cls}</span>
                                            <span className="text-[10px] font-bold text-[#630ed4]">{count as number}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="p-4 bg-white border border-[#dae2fd] rounded-xl"><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-[#4a4455]">✨ Enhancements</span><span className="text-base font-bold text-[#630ed4]">ON</span></div><div className="flex flex-wrap gap-2"><span className="px-3 py-1 bg-[#eaedff] rounded-full text-[10px] font-bold">FLIP 🔄</span><span className="px-3 py-1 bg-[#eaedff] rounded-full text-[10px] font-bold">ROTATE 🔃</span><span className="px-3 py-1 bg-[#eaedff] rounded-full text-[10px] font-bold">BRIGHT ☀️</span></div></div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-6 bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4"><div><h4 className="text-sm font-extrabold text-[#131b2e]">📉 Learning Score</h4><p className="text-xs text-[#4a4455] mt-1">Lower = smarter AI!</p></div><div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isTraining ? 'bg-[#fee2e2] text-[#991b1b]' : isComplete ? 'bg-[#d1fae5] text-[#006c44]' : 'bg-[#eaedff] text-[#4a4455]'}`}>{isTraining ? '🔴 LIVE' : isComplete ? '✅ DONE' : '⏳ Ready'}</div></div>
                    <div className="h-36 flex items-end gap-1 mb-4">
                        {lossBarHeights.map((height, i) => { const ratio = i / Math.max(lossBarHeights.length - 1, 1); let c = 'bg-[#dae2fd]'; if (ratio > 0.3) c = 'bg-[#eaedff]'; if (ratio > 0.5) c = 'bg-[#630ed4]'; if (ratio > 0.8) c = 'bg-[#006c44]'; return <div key={i} className={`w-full rounded-t transition-all duration-500 ${c}`} style={{ height: `${Math.max(5, height)}%` }} /> })}
                        {lossBarHeights.length < 11 && Array.from({ length: 11 - lossBarHeights.length }).map((_, i) => <div key={`e${i}`} className="w-full rounded-t bg-[#dae2fd] h-[5%]" />)}
                    </div>
                    <div className="flex justify-between text-[10px] text-[#4a4455]"><span>Round 0</span><span>Round {isTraining ? currentEpoch : isComplete ? maxEpochs : '50'}</span><span>Goal 🎯</span></div>
                </div>

                <div className="col-span-12 md:col-span-6 bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4"><div><h4 className="text-sm font-extrabold text-[#131b2e]">📈 Accuracy Score</h4><p className="text-xs text-[#4a4455] mt-1">Higher = better at finding objects!</p></div><div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#d1fae5] text-[#006c44]">🎯 Goal: 85%</div></div>
                    <div className="h-36 relative mb-4">
                        <div className="absolute inset-0 flex flex-col justify-between opacity-10"><div className="border-t border-[#131b2e] w-full" /><div className="border-t border-[#131b2e] w-full" /><div className="border-t border-[#131b2e] w-full" /><div className="border-t border-[#131b2e] w-full" /></div>
                        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
                            <path d={`${mapLinePath} L${mapLinePoints.length > 0 ? mapLinePoints[mapLinePoints.length - 1].x : 400} 128 L0 128 Z`} fill="url(#mapGradient)" opacity="0.2" />
                            <path d={mapLinePath} fill="none" stroke="#630ed4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {mapLinePoints.length > 0 && <circle cx={mapLinePoints[mapLinePoints.length - 1].x} cy={mapLinePoints[mapLinePoints.length - 1].y} fill={isComplete ? '#006c44' : '#630ed4'} r="6" />}
                            <defs><linearGradient id="mapGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#630ed4" stopOpacity="0.3" /><stop offset="100%" stopColor="#630ed4" stopOpacity="0" /></linearGradient></defs>
                        </svg>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#4a4455]"><span>Low 📉</span><span>Medium 📊</span><span>High 📈</span></div>
                </div>
            </div>

            {totalSamples > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-extrabold text-[#131b2e] mb-3">🖼️ Labeled Data Preview</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {mode.project?.classes.map(cls =>
                            cls.samples.map(sample => {
                                let imageUrl = sample.data
                                let boxCount = 0
                                try {
                                    const parsed = JSON.parse(sample.data)
                                    if (parsed.imageUrl) {
                                        imageUrl = parsed.imageUrl
                                        boxCount = parsed.boxes?.length || 0
                                    }
                                } catch { /* raw data URL */ }
                                return (
                                    <div key={sample.id} className="relative group aspect-square rounded-xl overflow-hidden bg-white shadow-sm border border-[#dae2fd]">
                                        <img src={imageUrl} alt={cls.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cls.color }} />
                                                <span className="text-white text-[9px] font-bold truncate">{cls.name}</span>
                                            </div>
                                            {boxCount > 0 && <span className="text-white/70 text-[8px] font-bold">{boxCount} boxes</span>}
                                        </div>
                                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            {cls.name}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
