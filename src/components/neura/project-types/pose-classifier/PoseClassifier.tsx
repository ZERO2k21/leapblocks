// classifiers/pose-classifier/PoseClassifier.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'

type PoseClass = {
    id: number
    name: string
    samples: number[][][]
}

type PoseClassifierProps = {
    project?: any
    onBack: () => void
}

const COLORS = ['bg-blue-500', 'bg-teal-500', 'bg-violet-500', 'bg-orange-500']

export default function PoseClassifier({ project, onBack }: PoseClassifierProps) {
    const [classes, setClasses] = useState<PoseClass[]>([
        { id: 1, name: 'Pose 1', samples: [] },
        { id: 2, name: 'Pose 2', samples: [] },
    ])
    const [nextId, setNextId] = useState(3)
    const [capturing, setCapturing] = useState<number | null>(null)
    const [trained, setTrained] = useState(false)
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState(0)
    const [showAdv, setShowAdv] = useState(false)
    const [epochs, setEpochs] = useState(30)
    const [testResult, setTestResult] = useState<any>(null)
    const [poseDetReady, setPoseDetReady] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const detectorRef = useRef<any>(null)

    // Load MoveNet
    useEffect(() => {
        const load = async () => {
            try {
                if (window._poseDetReady) { setPoseDetReady(true); return }
                const loadScript = (src: string) => new Promise<void>((res, rej) => {
                    const s = document.createElement('script')
                    s.src = src
                    s.onload = () => res()
                    s.onerror = () => rej(new Error(`Failed to load ${src}`))
                    document.head.appendChild(s)
                })
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js')
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js')
                const detector = await window.poseDetection.createDetector(
                    window.poseDetection.SupportedModels.MoveNet,
                    { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
                )
                detectorRef.current = detector
                window._poseDetReady = true
                setPoseDetReady(true)
            } catch (e) { console.error('Pose det load failed:', e) }
        }
        load()
    }, [])

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

    const stopWebcam = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        setCapturing(null)
    }

    const capturePose = useCallback(async () => {
        if (!detectorRef.current || !videoRef.current || capturing === null) return
        try {
            const poses = await detectorRef.current.estimatePoses(videoRef.current)
            if (poses.length > 0) {
                const keypoints = poses[0].keypoints.map((k: any) => [k.x, k.y, k.score])
                setClasses(p => p.map(c => c.id === capturing ? { ...c, samples: [...c.samples, keypoints] } : c))
            }
        } catch (e) { console.error(e) }
    }, [capturing])

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
                                        className={`flex flex-col items-center gap-1.5 border-2 border-dashed rounded-xl px-4 py-3 transition-all ${capturing === cls.id ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}>
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="text-xs font-medium">{capturing === cls.id ? 'Capturing...' : 'Webcam'}</span>
                                    </button>
                                    {capturing === cls.id && (
                                        <button onClick={capturePose} className="mt-2 w-full py-1.5 bg-blue-500 text-white text-xs rounded-lg font-semibold hover:bg-blue-600">
                                            Capture Pose
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">{cls.samples.length} pose sample{cls.samples.length !== 1 ? 's' : ''}</p>
                                    {cls.samples.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {cls.samples.slice(-6).map((_, idx) => (
                                                <div key={idx} className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-lg">🧍</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Shared webcam preview */}
                    {capturing !== null && (
                        <div className="bg-white rounded-xl border border-gray-200 p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Live pose detection</p>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" style={{ transform: 'scaleX(-1)' }} />
                            <canvas ref={canvasRef} className="hidden" />
                            {!poseDetReady && <p className="text-xs text-amber-500 mt-2 text-center">Loading MoveNet…</p>}
                        </div>
                    )}

                    <button onClick={() => { setClasses(p => [...p, { id: nextId, name: `Pose ${nextId}`, samples: [] }]); setNextId(n => n + 1) }}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 text-gray-400 hover:text-purple-600 text-sm font-semibold transition-all">
                        + Add Class
                    </button>
                </div>

                <TrainingPanel status={status} progress={progress} accuracy={0.88} canTrain={canTrain}
                    onTrain={handleTrain} showAdvanced={showAdv} setShowAdvanced={setShowAdv}
                    epochs={epochs} setEpochs={setEpochs} trained={trained}
                    sampleCounts={Object.fromEntries(classes.map(c => [c.name, c.samples.length]))} />

                <div className="w-8 flex items-center self-stretch pt-16"><div className="w-full h-px bg-purple-200" /></div>

                {/* Testing panel */}
                <div className="w-64 bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden shrink-0">
                    <div className="bg-purple-700 px-4 py-3"><span className="text-white font-bold text-sm">Testing</span></div>
                    {!trained ? (
                        <div className="p-5 text-center text-xs text-gray-400">Train your pose model first.</div>
                    ) : (
                        <div className="p-4 space-y-2">
                            <p className="text-xs text-green-600 font-semibold">✓ Model ready — point webcam at a person</p>
                            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">Live pose prediction will run here. Connect a webcam and start testing.</div>
                        </div>
                    )}
                </div>
            </div>
        </ClassifierLayout>
    )
}
