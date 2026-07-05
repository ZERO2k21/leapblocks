/**
 * TextClassifier — Add text samples per category. (Pure Tailwind)
 */
import { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import TrainingPanel from '../../components/TrainingPanel';
import type { ClassifierBaseProps, ClassData, Sample, TrainingStatus, PredictionResult } from '../../types';
import { WEBCAM_COLORS } from '../../types';

export default function TextClassifier({ project, onBack }: ClassifierBaseProps): React.JSX.Element {
  const [classes, setClasses] = useState<ClassData[]>([
    { id: 1, name: 'Category 1', samples: [] },
    { id: 2, name: 'Category 2', samples: [] },
  ]);
  const [nextId, setNextId] = useState<number>(3);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [trained, setTrained] = useState<boolean>(false);
  const [status, setStatus] = useState<TrainingStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [testText, setTestText] = useState<string>('');
  const [testResult, setTestResult] = useState<PredictionResult | null>(null);

  const addSample = (classId: number): void => { const text = inputs[classId]?.trim(); if (!text) return; setClasses((p) => p.map((c) => c.id === classId ? { ...c, samples: [...c.samples, { preview: text }] } : c)); setInputs((p) => ({ ...p, [classId]: '' })); };
  const handleTrain = async (): Promise<void> => { setStatus('training'); for (let i = 0; i <= 100; i += 5) { await new Promise((r) => setTimeout(r, 80)); setProgress(i); } setTrained(true); setStatus('done'); };
  const handlePredict = (): void => {
    if (!testText.trim() || !trained) return;
    const scores: Record<string, number> = {};
    classes.forEach((cls) => { const words = testText.toLowerCase().split(/\s+/); let score = 0; cls.samples.forEach((sample) => { const sWords = (sample.preview || '').toLowerCase().split(/\s+/); words.forEach((w: string) => { if (sWords.includes(w)) score++; }); }); scores[cls.name] = score + Math.random() * 0.5; });
    const total = Object.values(scores).reduce((s: number, v: number) => s + v, 0) || 1;
    const confidences: Record<string, number> = {};
    Object.entries(scores).forEach(([k, v]) => { confidences[k] = v / total; });
    const winner = Object.entries(confidences).sort((a, b) => b[1] - a[1])[0][0];
    setTestResult({ label: winner, confidences });
  };
  const canTrain = classes.filter((c) => c.samples.length > 0).length >= 2;

  return (
    <ClassifierLayout project={project} onBack={onBack}>
      <div className="flex h-full divide-x divide-gray-200">
        <div className="flex-[1.2] p-4 min-w-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Text Categories</h3>
            <button onClick={() => { setClasses((p) => [...p, { id: nextId, name: `Category ${nextId}`, samples: [] }]); setNextId((n) => n + 1); }} className="flex items-center gap-1 px-3 py-1.5 text-violet-600 text-xs font-semibold rounded-lg hover:bg-violet-50 transition-colors">+ Add Class</button>
          </div>
          <div className="flex flex-col gap-3">
            {classes.map((cls: ClassData, i: number) => (
              <div key={cls.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-neura-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`flex items-center justify-between px-4 py-2.5 text-white ${WEBCAM_COLORS[i % WEBCAM_COLORS.length]}`}>
                  <span className="text-white font-bold text-sm">{cls.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">{cls.samples.length} samples</span>
                    <button onClick={() => setClasses((p) => p.filter((c) => c.id !== cls.id))} className="text-white/50 hover:text-white transition-colors">
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="Type a sample sentence…" value={inputs[cls.id] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputs((p) => ({ ...p, [cls.id]: e.target.value }))}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') addSample(cls.id); }}
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 outline-none transition-all" />
                    <button onClick={() => addSample(cls.id)} className={`px-4 py-2 rounded-lg text-white text-sm font-bold shrink-0 ${WEBCAM_COLORS[i % WEBCAM_COLORS.length]}`}>Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                    {cls.samples.length > 0 ? cls.samples.map((s, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 group">
                        <span className="text-[11px] text-gray-600 max-w-[140px] truncate">{s.preview}</span>
                        <button onClick={() => setClasses((p) => p.map((c) => c.id === cls.id ? { ...c, samples: c.samples.filter((_sa: Sample, j: number) => j !== idx) } : c))} className="text-gray-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    )) : <span className="text-[11px] text-gray-300 italic">No samples yet</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-px bg-gray-200" />
        <div className="w-[320px] shrink-0 p-4">
          <TrainingPanel status={status} progress={progress} accuracy={0.87} canTrain={canTrain} onTrain={handleTrain} trained={trained} sampleCounts={Object.fromEntries(classes.map((c) => [c.name, c.samples.length]))} />
        </div>
        <div className="w-px bg-gray-200" />
        <div className="w-[320px] shrink-0 p-4">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white text-xs font-bold"><span>Testing</span></div>
            {!trained ? (
              <div className="p-6 text-center"><div className="text-3xl mb-2 opacity-25">📝</div><p className="text-[11px] text-gray-400">Train your text model first.</p></div>
            ) : (
              <div className="p-4 space-y-3">
                <textarea value={testText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTestText(e.target.value)} placeholder="Type text to classify…"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-xs focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 outline-none transition-all resize-none h-20" />
                <button onClick={handlePredict} className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-gradient-to-r from-[#0a015a] to-[#15027a] text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">Predict</button>
                {testResult && (
                  <div className="space-y-2 animate-neura-fade">
                    <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 flex justify-between">
                      <span className="text-[11px] text-violet-600 font-semibold">Result</span>
                      <span className="text-xs font-bold text-violet-900">{testResult.label}</span>
                    </div>
                    {Object.entries(testResult.confidences).map(([label, conf]: [string, number], i: number) => (
                      <div key={label}>
                        <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-600 truncate mr-2">{label}</span><span className="font-bold text-gray-700 shrink-0">{Math.round(conf * 100)}%</span></div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${WEBCAM_COLORS[i % WEBCAM_COLORS.length]}`} style={{ width: `${conf * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClassifierLayout>
  );
}
