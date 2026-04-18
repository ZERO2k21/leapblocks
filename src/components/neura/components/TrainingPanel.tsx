import * as React from 'react'

type TrainingPanelProps = {
  status: string
  progress: number
  accuracy: number
  canTrain: boolean
  onTrain: () => void
  showAdvanced: boolean
  setShowAdvanced: (value: boolean) => void
  epochs: number
  setEpochs: (value: number) => void
  trained: boolean
  sampleCounts?: Record<string, number>
}

export default function TrainingPanel({
  status,
  progress,
  accuracy,
  canTrain,
  onTrain,
  showAdvanced,
  setShowAdvanced,
  epochs,
  setEpochs,
  trained,
  sampleCounts = {},
}: TrainingPanelProps) {
  return (
    <div className="w-72 bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
      <div className="bg-purple-700 px-4 py-3">
        <span className="text-white font-bold text-sm">Training</span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.18em]">Status</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{status}</p>
        </div>
        <div>
          <div className="text-xs text-gray-500 flex items-center justify-between mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {sampleCounts && Object.keys(sampleCounts).length > 0 && (
          <div className="space-y-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-800">Samples</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sampleCounts).map(([name, count]) => (
                <div key={name} className="rounded-2xl bg-gray-50 px-3 py-2 text-[11px] text-slate-700">
                  {name}: {count}
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onTrain}
          disabled={!canTrain || status === 'training'}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition ${canTrain && status !== 'training' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          {status === 'training' ? 'Training…' : trained ? 'Retrain Model' : 'Train Model'}
        </button>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Advanced</span>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-purple-600 font-semibold">
              {showAdvanced ? 'Hide' : 'Show'}
            </button>
          </div>
          {showAdvanced && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Epochs</span>
                <span>{epochs}</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3 text-xs text-purple-700">
          Accuracy: {Math.round(accuracy * 100)}%
        </div>
      </div>
    </div>
  )
}
