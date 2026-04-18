import { useState } from 'react'

/**
 * Enhanced TrainingPanel with modern Tailwind styling
 * Features: Python/JS toggle, progress tracking, advanced settings, status indicators
 * 
 * Props:
 * - status: 'idle' | 'training' | 'trained'
 * - progress: number (0-100)
 * - accuracy: number (0-1)
 * - canTrain: boolean
 * - onTrain: () => void
 * - showAdvanced: boolean (optional, managed internally if not provided)
 * - setShowAdvanced: (boolean) => void (optional)
 * - epochs: number (optional, managed internally if not provided)
 * - setEpochs: (number) => void (optional)
 * - trained: boolean (alias for status === 'trained')
 * - sampleCounts: { [className]: number } (optional)
 */
export default function TrainingPanel({
    status,
    progress = 0,
    accuracy = 0,
    canTrain = false,
    onTrain,
    showAdvanced: externalShowAdvanced,
    setShowAdvanced: externalSetShowAdvanced,
    epochs: externalEpochs,
    setEpochs: externalSetEpochs,
    trained = false,
    sampleCounts = {},
    // Legacy props for backward compatibility
    isTraining,
    modelTrained
}) {
    // Internal state management (used if external state not provided)
    const [internalShowAdvanced, setInternalShowAdvanced] = useState(false)
    const [internalEpochs, setInternalEpochs] = useState(50)

    // Use external state if provided, otherwise use internal
    const showAdvanced = externalShowAdvanced !== undefined ? externalShowAdvanced : internalShowAdvanced
    const setShowAdvanced = externalSetShowAdvanced || setInternalShowAdvanced
    const epochs = externalEpochs !== undefined ? externalEpochs : internalEpochs
    const setEpochs = externalSetEpochs || setInternalEpochs

    // Backward compatibility: map legacy props to new props
    const actualStatus = status || (isTraining ? 'training' : modelTrained ? 'trained' : 'idle')
    const actualTrained = trained || modelTrained || actualStatus === 'trained'

    const totalSamples = Object.values(sampleCounts).reduce((s, v) => s + v, 0)

    return (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden w-64 shrink-0">
            {/* Header */}
            <div className="bg-purple-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${actualTrained ? 'bg-green-400' : 'bg-white/30'} transition-all`} />
                    <span className="text-white font-bold text-sm">Training</span>
                </div>
                {/* Python / JS toggle */}
                <div className="flex items-center gap-1.5 bg-purple-900/50 rounded-lg p-1">
                    <span className="text-yellow-400 text-xs">🐍</span>
                    <div className="w-8 h-4 bg-yellow-400 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
                    </div>
                    <span className="text-blue-300 text-xs font-bold">JS</span>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
                {/* Status / progress */}
                {actualStatus === 'training' ? (
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-500">Extracting features…</span>
                            <span className="text-purple-600 font-bold">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : actualTrained ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <div className="text-green-700 text-xs font-bold mb-0.5">✓ Model trained</div>
                        <div className="text-green-600 text-xs">
                            {accuracy > 0 ? `${Math.round(accuracy * 100)}% accuracy` : 'Ready to test'}
                            {totalSamples > 0 && ` · ${totalSamples} samples`}
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-400 leading-relaxed">
                        {!canTrain ? 'Add samples to at least 2 classes to train.' : 'Ready to train your model.'}
                    </div>
                )}

                {/* Train button */}
                <button
                    onClick={onTrain}
                    disabled={!canTrain || actualStatus === 'training'}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-100 disabled:text-gray-300 text-white font-bold text-sm rounded-lg transition-colors"
                >
                    {actualStatus === 'training' ? 'Training…' : actualTrained ? 'Retrain Model' : 'Train Model'}
                </button>

                {/* Advanced toggle */}
                <button
                    onClick={() => setShowAdvanced(a => !a)}
                    className="flex items-center gap-1 text-purple-600 text-xs font-semibold"
                >
                    <span>Advanced</span>
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                        <path d="M7 10l5 5 5-5H7z" />
                    </svg>
                </button>

                {showAdvanced && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Epochs</span>
                                <span className="text-purple-600 font-bold">{epochs}</span>
                            </div>
                            <input
                                type="range"
                                min={5}
                                max={100}
                                step={5}
                                value={epochs}
                                onChange={e => setEpochs(+e.target.value)}
                                className="w-full accent-purple-600"
                            />
                        </div>
                        <p className="text-xs text-gray-400">In-browser via TF.js · MobileNet transfer learning · No data leaves your device.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
