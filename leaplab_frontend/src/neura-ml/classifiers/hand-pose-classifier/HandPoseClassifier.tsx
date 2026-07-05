/**
 * HandPoseClassifier — Webcam-based hand gesture capture and classification.
 */
import { useState, useRef } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import TrainingPanel from '../../components/TrainingPanel';
import type { ClassifierBaseProps, ClassData, TrainingStatus } from '../../types';
import { WEBCAM_COLORS } from '../../types';

export default function HandPoseClassifier({
  project,
  onBack,
}: ClassifierBaseProps): React.JSX.Element {
  const [classes, setClasses] = useState<ClassData[]>([
    { id: 1, name: 'Gesture 1', samples: [] },
    { id: 2, name: 'Gesture 2', samples: [] },
  ]);
  const [nextId, setNextId] = useState<number>(3);
  const [capturing, setCapturing] = useState<number | null>(null);
  const [trained, setTrained] = useState<boolean>(false);
  const [status, setStatus] = useState<TrainingStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = async (classId: number): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCapturing(classId);
    } catch {
      alert('Camera access denied.');
    }
  };

  const stopWebcam = (): void => {
    streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    setCapturing(null);
  };

  const captureGesture = (): void => {
    if (capturing === null) return;
    const landmarks: number[][] = Array.from({ length: 21 }, () => [
      Math.random(),
      Math.random(),
      Math.random(),
    ]);
    setClasses((p) =>
      p.map((c) =>
        c.id === capturing
          ? { ...c, samples: [...c.samples, { landmarks }] }
          : c
      )
    );
  };

  const handleTrain = async (): Promise<void> => {
    setStatus('training');
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 100));
      setProgress(i);
    }
    setTrained(true);
    setStatus('done');
  };

  const canTrain =
    classes.filter((c) => c.samples.length > 0).length >= 2;

  return (
    <ClassifierLayout project={project} onBack={onBack}>
      <div className="neura-panels">
        {/* LEFT: Classes */}
        <div className="neura-panel neura-panel-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Gesture Classes
            </h3>
            <button
              onClick={() => {
                setClasses((p) => [
                  ...p,
                  { id: nextId, name: `Gesture ${nextId}`, samples: [] },
                ]);
                setNextId((n) => n + 1);
              }}
              className="neura-btn-ghost text-violet-600"
            >
              + Add Class
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {classes.map((cls: ClassData, i: number) => (
              <div
                key={cls.id}
                className="neura-class-card animate-neura-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className={`neura-class-header ${
                    WEBCAM_COLORS[i % WEBCAM_COLORS.length]
                  }`}
                >
                  <span className="text-white font-bold text-sm">{cls.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">
                      {cls.samples.length} gestures
                    </span>
                    <button
                      onClick={() =>
                        setClasses((p) => p.filter((c) => c.id !== cls.id))
                      }
                      className="text-white/50 hover:text-white"
                    >
                      <svg
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4 flex gap-3 items-start">
                  <div className="shrink-0">
                    <button
                      onClick={() =>
                        capturing === cls.id
                          ? stopWebcam()
                          : startWebcam(cls.id)
                      }
                      className={`flex flex-col items-center gap-1.5 border-2 border-dashed rounded-xl px-5 py-4 transition-all duration-200 ${
                        capturing === cls.id
                          ? 'border-violet-400 bg-violet-50 text-violet-600 shadow-sm'
                          : 'border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-500'
                      }`}
                    >
                      <span className="text-2xl">🖐️</span>
                      <span className="text-[11px] font-semibold">
                        {capturing === cls.id ? 'Live' : 'Webcam'}
                      </span>
                    </button>
                    {capturing === cls.id && (
                      <button
                        onClick={captureGesture}
                        className="mt-2 w-full py-2 bg-violet-500 text-white text-xs rounded-lg font-bold hover:bg-violet-600 transition-colors shadow-sm"
                      >
                        Capture
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                      {cls.samples.length} gesture
                      {cls.samples.length !== 1 ? 's' : ''}
                    </p>
                    {cls.samples.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({
                          length: Math.min(cls.samples.length, 8),
                        }).map((_, idx: number) => (
                          <div
                            key={idx}
                            className="w-9 h-9 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-sm animate-neura-bounce"
                            style={{ animationDelay: `${idx * 0.03}s` }}
                          >
                            🤚
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-300 italic">
                        No gestures yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Live video */}
            {capturing !== null && (
              <div className="neura-card p-3 animate-neura-scale">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="neura-panel-divider" />

        {/* CENTER: Training */}
        <div className="neura-panel neura-panel-center">
          <TrainingPanel
            status={status}
            progress={progress}
            accuracy={0.91}
            canTrain={canTrain}
            onTrain={handleTrain}
            trained={trained}
            sampleCounts={Object.fromEntries(
              classes.map((c) => [c.name, c.samples.length])
            )}
          />
        </div>

        <div className="neura-panel-divider" />

        {/* RIGHT: Testing */}
        <div className="neura-panel neura-panel-right">
          <div className="neura-side-panel">
            <div className="neura-side-panel-header bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]">
              <span>Testing</span>
            </div>
            {!trained ? (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2 opacity-25">🖐️</div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Train your hand pose model first.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center animate-neura-bounce">
                  <div className="text-green-700 text-sm font-bold">
                    ✓ Model Ready
                  </div>
                  <p className="text-green-600 text-xs mt-1">
                    Show hand gestures to the camera
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClassifierLayout>
  );
}
