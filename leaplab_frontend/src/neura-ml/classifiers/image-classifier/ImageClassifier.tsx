/**
 * ImageClassifier — 3-panel layout: classes | training | testing.
 */
import { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';
import WebcamModal from '../../components/WebcamModal';
import useTFClassifier from '../../hooks/useTFClassifier';
import type { ClassifierBaseProps, ClassData, TrainingStatus, PredictionResult } from '../../types';

export default function ImageClassifier({
  project,
  onBack,
}: ClassifierBaseProps): React.JSX.Element {
  const [classes, setClasses] = useState<ClassData[]>([
    { id: 1, name: 'Class 1', samples: [] },
    { id: 2, name: 'Class 2', samples: [] },
  ]);
  const [activeClass, setActiveClass] = useState<number | null>(null);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [modelTrained, setModelTrained] = useState<boolean>(false);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('idle');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [epochs, setEpochs] = useState<number>(50);

  const { train, predict, isTraining, trainingProgress } = useTFClassifier();

  const handleAddClass = (): void => {
    setClasses([
      ...classes,
      { id: Date.now(), name: `Class ${classes.length + 1}`, samples: [] },
    ]);
  };

  const handleDeleteClass = (classId: number): void => {
    if (classes.length <= 2) return;
    setClasses(classes.filter((c) => c.id !== classId));
  };

  const handleRenameClass = (classId: number, newName: string): void => {
    setClasses(
      classes.map((cls) =>
        cls.id === classId ? { ...cls, name: newName } : cls
      )
    );
  };

  const handleAddSamples = (classId: number, dataURL: string): void => {
    setClasses(
      classes.map((cls) =>
        cls.id === classId
          ? { ...cls, samples: [...cls.samples, { preview: dataURL }] }
          : cls
      )
    );
  };

  const handleWebcamCapture = (dataURL: string): void => {
    if (activeClass === null) return;
    handleAddSamples(activeClass, dataURL);
  };

  const handleFileUpload = (classId: number, files: FileList): void => {
    setClasses(
      classes.map((cls) => {
        if (cls.id !== classId) return cls;
        const newSamples = Array.from(files).map((file: File) => ({
          preview: URL.createObjectURL(file),
        }));
        return { ...cls, samples: [...cls.samples, ...newSamples] };
      })
    );
  };

  const handleTrain = async (): Promise<void> => {
    const hasEnough = classes.every(
      (cls) => cls.samples.length >= 5
    );
    if (!hasEnough) return alert('Each class needs at least 5 samples.');
    setTrainingStatus('training');
    const success = await train(classes);
    if (success) {
      setModelTrained(true);
      setTrainingStatus('trained');
    } else {
      setTrainingStatus('idle');
    }
  };

  const handlePredict = async (
    canvas: HTMLCanvasElement
  ): Promise<PredictionResult> => {
    try {
      const result = await predict(canvas);
      const confidences: Record<string, number> = {};
      if (result && typeof result === 'object' && 'confidences' in result) {
        Object.entries(result.confidences as Record<string, number>).forEach(
          ([classId, confidence]) => {
            const numId = parseInt(classId, 10);
            const name = classes.find((c) => c.id === numId)?.name || 'Unknown';
            confidences[name] = confidence;
          }
        );
      }
      return { label: result.label || '', confidences };
    } catch {
      return { label: '', confidences: {} };
    }
  };

  const sampleCounts: Record<string, number> = classes.reduce(
    (acc: Record<string, number>, cls) => {
      acc[cls.name] = cls.samples.length;
      return acc;
    },
    {}
  );
  const canTrain = classes.every(
    (cls) => cls.samples.length >= 5
  );

  return (
    <ClassifierLayout project={project} onBack={onBack}>
      <div className="neura-panels">
        {/* LEFT: Classes */}
        <div className="neura-panel neura-panel-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Classes
            </h3>
            <button
              onClick={handleAddClass}
              className="neura-btn-ghost text-violet-600 hover:text-violet-700"
            >
              + Add Class
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {classes.map((cls: ClassData, index: number) => (
              <ClassCard
                key={cls.id}
                classData={cls}
                index={index}
                onRename={handleRenameClass}
                onDelete={handleDeleteClass}
                onAddSamples={handleAddSamples}
                onWebcam={() => {
                  setActiveClass(cls.id);
                  setShowWebcam(true);
                }}
                onUpload={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*';
                  input.onchange = (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) {
                      handleFileUpload(cls.id, target.files);
                    }
                  };
                  input.click();
                }}
              />
            ))}
            <button onClick={handleAddClass} className="neura-add-class-btn">
              + Add Class
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="neura-panel-divider" />

        {/* CENTER: Training */}
        <div className="neura-panel neura-panel-center">
          <TrainingPanel
            status={trainingStatus}
            progress={trainingProgress}
            accuracy={0.95}
            canTrain={canTrain}
            onTrain={handleTrain}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            epochs={epochs}
            setEpochs={setEpochs}
            trained={modelTrained}
            sampleCounts={sampleCounts}
          />
        </div>

        {/* Divider */}
        <div className="neura-panel-divider" />

        {/* RIGHT: Testing */}
        <div className="neura-panel neura-panel-right">
          <TestingPanel
            trained={modelTrained}
            predict={handlePredict}
            classes={classes}
          />
        </div>
      </div>

      {showWebcam && (
        <WebcamModal
          classLabel={
            classes.find((c) => c.id === activeClass)?.name || ''
          }
          colorIndex={
            classes.findIndex((c) => c.id === activeClass)
          }
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </ClassifierLayout>
  );
}
