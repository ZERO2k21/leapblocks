import React, { useState, useEffect, useRef } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import type { ObjectDetectionTrainer } from '../../ml/ObjectDetectionTrainer'
import WorkflowIndicator from '../components/WorkflowIndicator'

interface TrainPanelProps {
    mode: UseNeuraProjectReturn
    trainer?: ObjectDetectionTrainer
    onTrained?: () => void
}

export default function TrainPanel({ mode, trainer, onTrained }: TrainPanelProps) {
    const [isTraining, setIsTraining] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [trainingProgress, setTrainingProgress] = useState(0)
    const [showCelebration, setShowCelebration] = useState(false)
    const trainerUnsubscribeRef = useRef<(() => void) | null>(null)

    const totalSamples = mode.getTotalSamples()
    const totalClasses = mode.project?.classes.length || 0
    const isObjectDetection = mode.project?.type === 'object-detection' && trainer

    // Count annotated samples (samples with bounding boxes) for object detection
    const annotatedCount = React.useMemo(() => {
        if (!isObjectDetection || !mode.project) return totalSamples
        let count = 0
        for (const cls of mode.project.classes) {
            for (const sample of cls.samples) {
                try {
                    const parsed = JSON.parse(sample.data)
                    if (parsed.boxes && parsed.boxes.length > 0) count++
                } catch {
                    // Raw image data (not annotated JSON)
                }
            }
        }
        return count
    }, [mode.project?.classes, isObjectDetection, totalSamples])

    const hasAnnotations = annotatedCount > 0
    const canTrain = totalClasses >= 2 && totalSamples > 0 && (isObjectDetection ? hasAnnotations : true)

    useEffect(() => {
        return () => {
            if (trainerUnsubscribeRef.current) trainerUnsubscribeRef.current()
        }
    }, [])

    useEffect(() => {
        if (isComplete) {
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 5000)
        }
    }, [isComplete])

    useEffect(() => {
        if (isComplete) {
            mode.setAccuracy(1)
            mode.setModelTrained(true)
            if (onTrained) onTrained()
        }
    }, [isComplete])

    useEffect(() => {
        if (!trainer || !isObjectDetection) return
        const unsub = trainer.onProgress((state) => {
            setIsTraining(state.isTraining)
            setIsComplete(state.isComplete)
            setTrainingProgress(state.progress)
        })
        trainerUnsubscribeRef.current = unsub
        return () => unsub()
    }, [trainer, isObjectDetection])

    const handleStartTraining = useRef(async () => {
        if (!canTrain) return

        if (isObjectDetection && trainer) {
            setIsTraining(true)
            setIsComplete(false)
            setTrainingProgress(0)
            await trainer.startTraining(mode.project!)
        }
    }).current

    const handleStopTraining = () => {
        if (isObjectDetection && trainer) {
            trainer.stopTraining()
        }
        setIsTraining(false)
        setTrainingProgress(100)
    }

    const handleResetTraining = () => {
        if (isObjectDetection && trainer) trainer.reset()
        setIsComplete(false)
        setTrainingProgress(0)
    }

    return (
        <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar w-full py-3 px-5 items-center">
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(99,14,212,0.15)_0%,rgba(0,0,0,0.3)_100%)]">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[320px]">
                        <div className="text-[3rem] mb-3">🎉</div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Training Complete!</h3>
                        <p className="text-[13px] text-gray-500 mb-4">Your AI learned from {totalSamples} pictures</p>
                        <div className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Ready to test!
                        </div>
                    </div>
                </div>
            )}

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

            <div className="w-full mx-auto mb-3">
                <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={canTrain} />
                <div className="mt-2.5 animate-fade-in">
                    <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl py-2.5 px-3.5 border border-[#630ed4]/10">
                        <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-xs shrink-0">💡</div>
                            <div>
                                <p className="text-[9px] font-extrabold text-[#630ed4] tracking-widest uppercase mb-1">Training Tips</p>
                                <div className="flex flex-wrap gap-x-3.5 gap-y-0.75">
                                    {['More samples = better accuracy', '2+ classes needed to train', 'Different angles help'].map((tip) => (
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

            <div className="flex flex-col lg:flex-row gap-4 w-full flex-1 min-h-0">
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center py-8 px-6 text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 border-3 border-dashed ${
                            isComplete ? 'bg-emerald-50 border-emerald-200' : isTraining ? 'bg-[#f5f3ff] border-purple-300' : 'bg-purple-100 border-purple-200'
                        }`}>
                            <span className="text-3xl">
                                {isComplete ? '🎉' : isTraining ? '🤖' : '🚀'}
                            </span>
                        </div>

                        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                            {isComplete ? 'Training Complete!' : isTraining ? 'Teaching AI...' : 'Ready to Train!'}
                        </h2>

                        <p className="text-[13px] text-gray-500 mb-5 max-w-[320px]">
                            {isComplete
                                ? `Your AI learned from ${totalSamples} pictures across ${totalClasses} classes!`
                                : isTraining
                                    ? `Processing ${totalSamples} samples...`
                                    : `Your ${totalSamples} pictures across ${totalClasses} classes are ready!`
                            }
                        </p>

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
                            </div>
                        )}

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
                                        onClick={() => mode.setMode('test')}
                                        className="py-2.5 px-6 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold border-none cursor-pointer shadow-[0_4px_12px_rgba(99,14,212,0.25)]"
                                    >
                                        🔍 Test AI
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {totalSamples > 0 && totalClasses < 2 && (
                        <div className="py-2.5 px-3.5 bg-amber-100 rounded-xl border border-amber-200 flex items-center gap-2">
                            <span className="text-sm">⚠️</span>
                            <div>
                                <p className="text-[11px] font-bold text-amber-900">Add at least 2 classes</p>
                                <p className="text-[10px] text-amber-700">Create 2 or more classes to start training</p>
                            </div>
                        </div>
                    )}

                    {isObjectDetection && totalSamples > 0 && !hasAnnotations && (
                        <div className="py-2.5 px-3.5 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
                            <span className="text-sm">🏷️</span>
                            <div>
                                <p className="text-[11px] font-bold text-red-900">No annotations found</p>
                                <p className="text-[10px] text-red-700">Go to Label step and draw bounding boxes around objects in your images. Training needs annotated images to learn where objects are.</p>
                                <button onClick={() => mode.setMode('annotate')} className="mt-2 py-1.5 px-3 bg-red-100 text-red-800 rounded-lg text-[10px] font-bold border-none cursor-pointer hover:bg-red-200 transition-colors">
                                    🏷️ Go to Label Step
                                </button>
                            </div>
                        </div>
                    )}

                    {isObjectDetection && totalSamples > 0 && hasAnnotations && annotatedCount < totalSamples && (
                        <div className="py-2 px-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                            <span className="text-xs">💡</span>
                            <p className="text-[10px] text-amber-700">{annotatedCount} of {totalSamples} images are annotated. Unannotated images won't contribute to training.</p>
                        </div>
                    )}
                </div>

                <div className="w-[240px] shrink-0 flex flex-col gap-2.5">
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

                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-gray-700">🖼️ Samples</span>
                            <span className="text-xs font-bold text-gray-500">{totalSamples}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-gray-700">📁 Classes</span>
                            <span className="text-xs font-bold text-gray-500">{totalClasses}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
