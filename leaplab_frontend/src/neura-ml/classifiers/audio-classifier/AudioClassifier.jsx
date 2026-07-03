/**
 * AudioClassifier — Record audio samples per class, train, and test.
 */
import React, { useState, useRef } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';

const COLORS = ['neura-color-0', 'neura-color-1', 'neura-color-2', 'neura-color-3', 'neura-color-4', 'neura-color-5'];
const COLOR_TEXT = ['text-red-700', 'text-teal-700', 'text-violet-700', 'text-orange-700', 'text-pink-700', 'text-blue-700'];

export default function AudioClassifier({ project, onBack }) {
    const [classes, setClasses] = useState([
        { id: 0, name: 'Sound 1', samples: [] },
        { id: 1, name: 'Sound 2', samples: [] },
    ]);
    const [recording, setRecording] = useState(null);
    const [modelTrained, setModelTrained] = useState(false);
    const [trained, setTrained] = useState(false);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async (classId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, samples: [...c.samples, { audio: blob, preview: url }] } : c));
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            setRecording(classId);
        } catch { alert('Microphone access denied.'); }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(null);
    };

    const handleTrain = async () => {
        setStatus('training');
        for (let i = 0; i <= 100; i += 5) { await new Promise((r) => setTimeout(r, 80)); setProgress(i); }
        setTrained(true); setStatus('done'); setModelTrained(true);
    };

    const canTrain = classes.filter((c) => c.samples.length > 0).length >= 2;

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="neura-panels">
                {/* LEFT: Classes */}
                <div className="neura-panel neura-panel-left">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sound Classes</h3>
                        <button onClick={() => setClasses((p) => [...p, { id: Date.now(), name: `Sound ${p.length + 1}`, samples: [] }])} className="neura-btn-ghost text-violet-600">
                            + Add Class
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {classes.map((cls, i) => (
                            <div key={cls.id} className="neura-class-card animate-neura-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className={`neura-class-header ${COLORS[i % COLORS.length]}`}>
                                    <span className="text-white font-bold text-sm">{cls.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/60 text-xs">{cls.samples.length} clips</span>
                                        <button onClick={() => setClasses((p) => p.filter((c) => c.id !== cls.id))} className="text-white/50 hover:text-white">
                                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <button
                                        onClick={() => recording === cls.id ? stopRecording() : startRecording(cls.id)}
                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                                            recording === cls.id
                                                ? 'bg-red-500 text-white animate-pulse shadow-lg'
                                                : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700 border-2 border-dashed border-gray-200 hover:border-violet-300'
                                        }`}
                                    >
                                        {recording === cls.id ? '⏹ Stop Recording' : '🎙️ Record Audio'}
                                    </button>
                                    {cls.samples.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {cls.samples.slice(-5).map((s, idx) => (
                                                <div key={idx} className="w-9 h-9 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-violet-100 transition-colors">
                                                    🔊
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="neura-panel-divider" />

                {/* CENTER: Training */}
                <div className="neura-panel neura-panel-center">
                    <TrainingPanel status={status} progress={progress} canTrain={canTrain} onTrain={handleTrain} trained={trained}
                        sampleCounts={Object.fromEntries(classes.map((c) => [c.name, c.samples.length]))} />
                </div>

                <div className="neura-panel-divider" />

                {/* RIGHT: Testing */}
                <div className="neura-panel neura-panel-right">
                    <TestingPanel trained={trained} classes={classes} />
                </div>
            </div>
        </ClassifierLayout>
    );
}
