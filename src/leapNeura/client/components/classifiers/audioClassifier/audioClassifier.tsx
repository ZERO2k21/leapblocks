// classifiers/audio-classifier/AudioClassifier.tsx
import { useState, useRef } from 'react'
import ClassifierLayout from '../../common/classifierLayout'
import TrainingPanel from '../../common/trainingPanel'

type AudioClass = {
    id: number
    name: string
    samples: string[]
}

type TestResult = {
    label: string
    confidences: Record<string, number>
}

type AudioClassifierProps = {
    project?: any
    onBack: () => void
}

const COLORS = ['bg-pink-500', 'bg-teal-500', 'bg-violet-500', 'bg-orange-500']

export default function AudioClassifier({ project, onBack }: AudioClassifierProps) {
    const [classes, setClasses] = useState<AudioClass[]>([
        { id: 1, name: 'Sound 1', samples: [] },
        { id: 2, name: 'Sound 2', samples: [] },
    ])
    const [nextId, setNextId] = useState(3)
    const [recording, setRecording] = useState<number | null>(null)
    const [trained, setTrained] = useState(false)
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState(0)
    const [showAdv, setShowAdv] = useState(false)
    const [epochs, setEpochs] = useState(30)
    const [testResult, setTestResult] = useState<TestResult | null>(null)
    const mediaRecRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const testRecRef = useRef<MediaRecorder | null>(null)
    const testChunks = useRef<Blob[]>([])

    const startRecording = async (classId: number) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            chunksRef.current = []
            mediaRecRef.current = new MediaRecorder(stream)
            mediaRecRef.current.ondataavailable = (e: BlobEvent) => chunksRef.current.push(e.data)
            mediaRecRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setClasses(p => p.map(c => c.id === classId ? { ...c, samples: [...c.samples, url] } : c))
                stream.getTracks().forEach(t => t.stop())
            }
            mediaRecRef.current.start()
            setRecording(classId)
        } catch {
            alert('Microphone access denied.')
        }
    }

    const stopRecording = () => {
        mediaRecRef.current?.stop()
        setRecording(null)
    }

    const addClass = () => {
        setClasses(p => [...p, { id: nextId, name: `Sound ${nextId}`, samples: [] }])
        setNextId(n => n + 1)
    }

    const handleTrain = async () => {
        setStatus('training'); setProgress(0)
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(r => setTimeout(r, 120))
            setProgress(i)
        }
        setTrained(true); setStatus('done')
    }

    const handleTestRecord = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            testChunks.current = []
            testRecRef.current = new MediaRecorder(stream)
            testRecRef.current.ondataavailable = (e: BlobEvent) => testChunks.current.push(e.data)
            testRecRef.current.onstop = () => {
                // Simulate prediction
                const winner = classes[Math.floor(Math.random() * classes.length)]
                const conf: Record<string, number> = {}
                classes.forEach((c) => {
                    conf[c.name] = c.name === winner.name ? 0.82 + Math.random() * 0.1 : Math.random() * 0.2
                })
                setTestResult({ label: winner.name, confidences: conf })
                stream.getTracks().forEach(t => t.stop())
            }
            testRecRef.current.start()
            setTimeout(() => { testRecRef.current?.stop() }, 2000)
        } catch {
            alert('Microphone access denied.')
        }
    }

    const canTrain = classes.filter(c => c.samples.length > 0).length >= 2

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="flex gap-6 items-start">
                {/* Class cards */}
                <div className="flex flex-col gap-4 flex-1">
                    {classes.map((cls, i) => (
                        <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className={`${COLORS[i % COLORS.length]} px-4 py-2.5 flex items-center justify-between`}>
                                <span className="text-white font-bold text-sm">{cls.name}</span>
                                <button onClick={() => setClasses(p => p.filter(c => c.id !== cls.id))} className="text-white/70 hover:text-white">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-4 flex gap-3 items-start">
                                <button
                                    onMouseDown={() => startRecording(cls.id)}
                                    onMouseUp={stopRecording} onMouseLeave={stopRecording}
                                    className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl px-5 py-3 transition-all ${recording === cls.id ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}>
                                    <svg width="20" height="20" fill={recording === cls.id ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                                    </svg>
                                    <span className="text-xs font-medium">{recording === cls.id ? '● REC' : 'Hold to Record'}</span>
                                </button>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">{cls.samples.length} recording{cls.samples.length !== 1 ? 's' : ''}</p>
                                    <div className="flex flex-col gap-1">
                                        {cls.samples.slice(-3).map((url, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className="text-gray-400"><path d="M12 3v9.28a4 4 0 100 5.44V3z" /></svg>
                                                <audio src={url} controls className="h-6 flex-1" style={{ maxWidth: 160 }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button onClick={addClass} className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-400 hover:text-purple-600 text-sm font-semibold transition-all">
                        + Add Class
                    </button>
                </div>

                {/* Training */}
                <TrainingPanel status={status} progress={progress} accuracy={0.9} canTrain={canTrain}
                    onTrain={handleTrain} showAdvanced={showAdv} setShowAdvanced={setShowAdv}
                    epochs={epochs} setEpochs={setEpochs} trained={trained} />

                <div className="w-8 flex items-center self-stretch pt-16"><div className="w-full h-px bg-purple-200" /></div>

                {/* Testing */}
                <div className="w-64 bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden shrink-0">
                    <div className="bg-purple-700 px-4 py-3"><span className="text-white font-bold text-sm">Testing</span></div>
                    {!trained ? (
                        <div className="p-5 text-center text-xs text-gray-400">Train a model first to test it here.</div>
                    ) : (
                        <div className="p-4 space-y-3">
                            <button onClick={handleTestRecord}
                                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /></svg>
                                Record 2s & Predict
                            </button>
                            {testResult && (
                                <div className="space-y-2">
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex justify-between">
                                        <span className="text-xs text-purple-600 font-semibold">Prediction</span>
                                        <span className="text-xs font-bold text-purple-900">{testResult.label}</span>
                                    </div>
                                    {Object.entries(testResult.confidences).map(([label, conf]) => (
                                        <div key={label}>
                                            <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="font-bold">{Math.round(conf * 100)}%</span></div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${conf * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ClassifierLayout>
    )
}
