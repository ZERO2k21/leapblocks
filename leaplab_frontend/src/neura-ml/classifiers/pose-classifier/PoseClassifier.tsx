/**
 * PoseClassifier — Capture body pose samples. (Pure Tailwind)
 */
import { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';
import type { ClassifierBaseProps, ClassData, TrainingStatus } from '../../types';

export default function PoseClassifier({ project, onBack }: ClassifierBaseProps): React.JSX.Element {
  const [classes, setClasses] = useState<ClassData[]>([
    { id: 0, name: 'Pose 1', samples: [] },
    { id: 1, name: 'Pose 2', samples: [] },
  ]);
  const [modelTrained, setModelTrained] = useState<boolean>(false);
  const [status, setStatus] = useState<TrainingStatus>('idle');
  const [progress, setProgress] = useState<number>(0);

  const handleAddSamples = (classId: number, dataURL: string): void => { setClasses(classes.map((cls) => cls.id === classId ? { ...cls, samples: [...cls.samples, { preview: dataURL }] } : cls)); };
  const handleTrain = async (): Promise<void> => { setStatus('training'); for (let i = 0; i <= 100; i += 5) { await new Promise((r) => setTimeout(r, 80)); setProgress(i); } setModelTrained(true); setStatus('done'); };
  const canTrain = classes.filter((c) => c.samples.length > 0).length >= 2;

  return (
    <ClassifierLayout project={project} onBack={onBack}>
      <div className="flex h-full divide-x divide-gray-200">
        <div className="flex-[1.2] p-4 min-w-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pose Classes</h3>
            <button onClick={() => setClasses((p) => [...p, { id: Date.now(), name: `Pose ${p.length + 1}`, samples: [] }])} className="flex items-center gap-1 px-3 py-1.5 text-violet-600 text-xs font-semibold rounded-lg hover:bg-violet-50 transition-colors">+ Add Class</button>
          </div>
          <div className="flex flex-col gap-3">
            {classes.map((cls: ClassData, i: number) => (
              <ClassCard key={cls.id} classData={cls} index={i} onAddSamples={handleAddSamples} onDelete={() => setClasses((p) => p.filter((c) => c.id !== cls.id))} />
            ))}
          </div>
        </div>
        <div className="w-px bg-gray-200" />
        <div className="w-[320px] shrink-0 p-4">
          <TrainingPanel status={status} progress={progress} canTrain={canTrain} onTrain={handleTrain} trained={modelTrained} sampleCounts={Object.fromEntries(classes.map((c) => [c.name, c.samples.length]))} />
        </div>
        <div className="w-px bg-gray-200" />
        <div className="w-[320px] shrink-0 p-4">
          <TestingPanel trained={modelTrained} classes={classes} />
        </div>
      </div>
    </ClassifierLayout>
  );
}
