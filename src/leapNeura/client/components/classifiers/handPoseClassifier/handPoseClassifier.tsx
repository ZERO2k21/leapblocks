// classifiers/hand-pose-classifier/HandPoseClassifier.tsx
import { useState, useRef, useEffect } from 'react'
import ClassifierLayout from '../../common/classifierLayout'
import TrainingPanel from '../../common/trainingPanel'

type HandPoseClass = {
    id: number
    name: string
    samples: number[][][]
}

type HandPoseClassifierProps = {
    project?: any
    onBack: () => void
}

const COLORS = ['bg-violet-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500']

export default function HandPoseClassifier({ project, onBack }: HandPoseClassifierProps) {
    const [classes, setClasses] = useState<HandPoseClass[]>([
        { id: 1, name: 'Gesture 1', samples: [] },
        { id: 2, name: 'Gesture 2', samples: [] },
    ])
    const [nextId, setNextId] = useState(3)
    const [capturing, setCapturing] = useState<number | null>(null)
    const [trained, setTrained] = useState(false)
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState(0)
    const [showAdv, setShowAdv] = useState(false)
    const [epochs, setEpochs] = useState(30)
    const [testResult, setTestResult] = useState<any>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const startWebcam = async (classId: number) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
            setCapturing(classId)
        } catch {
            alert('Camera access denied.')
        }
    }

    const stopWebcam = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setCapturing(null) }

    const captureGesture = () => {
        if (capturing === null) return
        // In production: extract 21 MediaPipe hand landmarks. Here we store a placeholder.
        const landmarks = Array.from({ length: 21 }, (_, i) => [Math.random(), Math.random(), Math.random()])
        setClasses(p => p.map(c => c.id === capturing ? { ...c, samples: [...c.samples, landmarks] } : c))
    }

    const handleTrain = async () => {
        setStatus('training')
        for (let i = 0; i <= 100; i += 10) { await new Promise(r => setTimeout(r, 100)); setProgress(i) }
        setTrained(true); setStatus('done')
    }

    const canTrain = classes.filter(c => c.samples.length > 0).length >= 2

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="flex gap-6 items-start">
                <div className="flex flex-col gap-4 flex-1">
                    {classes.map((cls, i) => (
                        <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className={`${COLORS[i % COLORS.length]} px-4 py-2.5 flex items-center justify-between`}>
                                <span className="text-white font-bold text-sm">{cls.name}</span>
                                <button onClick={() => setClasses(p => p.filter(c => c.id !== cls.id))} className="text-white/70 hover:text-white">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-4 flex gap-3">
                                <div>
                                    <button onClick={() => capturing === cls.id ? stopWebcam() : startWebcam(cls.id)}
                                        className={`flex flex-col items-center gap-1.5 border-2 border-dashed rounded-xl px-4 py-3 transition-all ${capturing === cls.id ? 'border-violet-400 bg-violet-50 text-violet-600' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}>
                                        <span className="text-2xl">🖐️</span>
                                        <span className="text-xs font-medium">{capturing === cls.id ? 'Live' : 'Webcam'}</span>
                                    </button>
                                    {capturing === cls.id && (
                                        <button onClick={captureGesture} className="mt-2 w-full py-1.5 bg-violet-500 text-white text-xs rounded-lg font-semibold hover:bg-violet-600">
                                            Capture
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">{cls.samples.length} gesture{cls.samples.length !== 1 ? 's' : ''} captured</p>
                                    {cls.samples.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {Array.from({ length: Math.min(cls.samples.length, 8) }).map((_, idx) => (
                                                <div key={idx} className="w-9 h-9 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-lg">🤚</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {capturing !== null && (
                        <div className="bg-white rounded-xl border border-gray-200 p-3">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" style={{ transform: 'scaleX(-1)' }} />
                        </div>
                    )}

                    <button onClick={() => { setClasses(p => [...p, { id: nextId, name: `Gesture ${nextId}`, samples: [] }]); setNextId(n => n + 1) }}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 text-gray-400 hover:text-purple-600 text-sm font-semibold transition-all">
                        + Add Class
                    </button>
                </div>

                <TrainingPanel status={status} progress={progress} accuracy={0.91} canTrain={canTrain}
                    onTrain={handleTrain} showAdvanced={showAdv} setShowAdvanced={setShowAdv}
                    epochs={epochs} setEpochs={setEpochs} trained={trained}
                    sampleCounts={Object.fromEntries(classes.map(c => [c.name, c.samples.length]))} />

                <div className="w-8 flex items-center self-stretch pt-16"><div className="w-full h-px bg-purple-200" /></div>

                <div className="w-64 bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden shrink-0">
                    <div className="bg-purple-700 px-4 py-3"><span className="text-white font-bold text-sm">Testing</span></div>
                    {!trained ? (
                        <div className="p-5 text-center text-xs text-gray-400">Train your hand pose model first.</div>
                    ) : (
                        <div className="p-4 text-xs text-green-600 font-semibold">✓ Model ready — show your hand gestures to the camera</div>
                    )}
                </div>
            </div>
        </ClassifierLayout>
    )
}
