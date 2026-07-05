/**
 * TrainingPanel — Model training controls with premium progress bar.
 */
import { useState } from 'react';
import type { TrainingPanelProps } from '../types';

export default function TrainingPanel({
  status,
  progress = 0,
  accuracy = 0,
  canTrain = false,
  onTrain,
  showAdvanced: extShowAdvanced,
  setShowAdvanced: extSetShowAdvanced,
  epochs: extEpochs,
  setEpochs: extSetEpochs,
  trained = false,
  sampleCounts = {},
  isTraining,
  modelTrained,
}: TrainingPanelProps): React.JSX.Element {
  const [intShowAdvanced, setIntShowAdvanced] = useState<boolean>(false);
  const [intEpochs, setIntEpochs] = useState<number>(50);

  const showAdvanced = extShowAdvanced !== undefined ? extShowAdvanced : intShowAdvanced;
  const setShowAdvanced = extSetShowAdvanced || setIntShowAdvanced;
  const epochs = extEpochs !== undefined ? extEpochs : intEpochs;
  const setEpochs = extSetEpochs || setIntEpochs;

  const actualStatus = status || (isTraining ? 'training' : modelTrained ? 'trained' : 'idle');
  const actualTrained = trained || modelTrained || actualStatus === 'trained';
  const totalSamples = Object.values(sampleCounts).reduce(
    (s: number, v: number) => s + v,
    0
  );

  return (
    <div className="neura-side-panel animate-neura-slide-up neura-delay-2">
      {/* Header */}
      <div className="neura-side-panel-header bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              actualTrained ? 'bg-green-400' : 'bg-white/25'
            }`}
          />
          <span>Training</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/30 rounded-md px-2 py-0.5">
          <span className="text-yellow-400 text-[10px]">🐍</span>
          <div className="w-7 h-3.5 bg-yellow-400 rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
          </div>
          <span className="text-blue-300 text-[10px] font-bold">JS</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Status */}
        {actualStatus === 'training' ? (
          <div className="animate-neura-fade">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Extracting features…</span>
              <span className="text-violet-600 font-bold">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="neura-progress">
              <div
                className="neura-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : actualTrained ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 animate-neura-bounce">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-green-700 text-xs font-bold">
                Model trained
              </span>
            </div>
            <div className="text-green-600 text-[11px] pl-6">
              {accuracy > 0
                ? `${Math.round(accuracy * 100)}% accuracy`
                : 'Ready to test'}
              {totalSamples > 0 && ` · ${totalSamples} samples`}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-gray-400 leading-relaxed">
            {!canTrain
              ? 'Add samples to at least 2 classes to train.'
              : 'Ready to train your model.'}
          </div>
        )}

        {/* Train button */}
        <button
          onClick={onTrain}
          disabled={!canTrain || actualStatus === 'training'}
          className="neura-btn-primary w-full"
        >
          {actualStatus === 'training' && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-neura-spin" />
          )}
          {actualStatus === 'training'
            ? 'Training…'
            : actualTrained
              ? 'Retrain Model'
              : 'Train Model'}
        </button>

        {/* Advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-violet-600 text-xs font-semibold hover:text-violet-700 transition-colors"
        >
          <span>Advanced</span>
          <svg
            width="12"
            height="12"
            fill="currentColor"
            viewBox="0 0 24 24"
            className={`transition-transform duration-200 ${
              showAdvanced ? 'rotate-180' : ''
            }`}
          >
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-3 animate-neura-slide-up">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Epochs</span>
                <span className="text-violet-600 font-bold">{epochs}</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={epochs}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEpochs(+e.target.value)
                }
                className="w-full accent-violet-600 h-1.5"
              />
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              In-browser via TF.js · MobileNet transfer learning · No data
              leaves your device.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
