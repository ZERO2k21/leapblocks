// classifiers/hand-pose-classifier/HandPoseClassifier.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
import AddClassButton from '../../components/AddClassButton'
import ProjectTestingPanel from '../../components/ProjectTestingPanel'
import { KNNClassifier } from '../../ml/KNNClassifier'
import { ensureTf, ensureHandPose } from '../../ml/loadScript'
import { showToast } from '../../../../leapignite/client/components/Toast'
import { Camera, Hand, Trash2, Edit2, Check, X, Plus, Activity } from 'lucide-react'

declare const handPoseDetection: any

type HandPoseClass = {
    id: number
    name: string
    samples: number[][][]
}

type HandPoseClassifierProps = {
    project?: any
    onBack: () => void
    onDataChange?: (data: Record<string, any>) => void
}

const COLORS = [
    { bg: '#7c3aed', light: '#a78bfa', glow: 'rgba(124, 58, 237, 0.3)', border: 'rgba(124, 58, 237, 0.3)' },
    { bg: '#f97316', light: '#fb923c', glow: 'rgba(249, 115, 22, 0.3)', border: 'rgba(249, 115, 22, 0.3)' },
    { bg: '#14b8a6', light: '#2dd4bf', glow: 'rgba(20, 184, 166, 0.3)', border: 'rgba(20, 184, 166, 0.3)' },
    { bg: '#ec4899', light: '#f472b6', glow: 'rgba(236, 72, 153, 0.3)', border: 'rgba(236, 72, 153, 0.3)' },
    { bg: '#eab308', light: '#facc15', glow: 'rgba(234, 179, 8, 0.3)', border: 'rgba(234, 179, 8, 0.3)' },
    { bg: '#ef4444', light: '#f87171', glow: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.3)' },
]

// MediaPipe hand skeleton connections (21 keypoints)
const HAND_CONNECTIONS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17],
]

function drawHandSkeleton(ctx: CanvasRenderingContext2D, landmarks: number[][], w: number, h: number, color: string) {
    ctx.clearRect(0, 0, w, h)
    if (!landmarks || landmarks.length < 21) return
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.6
    for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a][0] * w, landmarks[a][1] * h)
        ctx.lineTo(landmarks[b][0] * w, landmarks[b][1] * h)
        ctx.stroke()
    }
    ctx.globalAlpha = 1
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i][0] * w, y = landmarks[i][1] * h
        const r = i === 0 ? 5 : (i % 4 === 0 ? 4 : 3)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = i % 4 === 0 ? '#fff' : color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
    }
}

// ─── HAND WEBCAM MODAL ──────────────────────────────────────────────────────
function HandWebcamModal({ classLabel, color, classId, onCapture, onClose, detectorRef }: {
    classLabel: string
    color: { bg: string; light: string }
    classId: number
    onCapture: (classId: number, landmarks: number[][]) => void
    onClose: () => void
    detectorRef: React.MutableRefObject<any>
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number | null>(null)
    const intervalRef = useRef<any>(null)
    const [capturing, setCapturing] = useState(false)
    const [count, setCount] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } as any })
            .then(stream => {
                streamRef.current = stream
                if (videoRef.current) videoRef.current.srcObject = stream
                setLoading(false)
            })
            .catch(() => setError('Camera access denied. Please allow camera permissions.'))
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
        }
    }, [])

    useEffect(() => {
        if (loading || error) return
        let running = true
        const draw = async () => {
            if (!running) return
            const v = videoRef.current, c = overlayRef.current
            if (v && c && detectorRef.current && v.videoWidth && v.videoHeight) {
                c.width = v.videoWidth; c.height = v.videoHeight
                const ctx = c.getContext('2d')
                if (ctx) {
                    try {
                        const hands = await detectorRef.current.estimateHands(v, { flipHorizontal: true })
                        if (hands.length > 0 && hands[0].keypoints) {
                            drawHandSkeleton(ctx, hands[0].keypoints.map((k: any) => [k.x, k.y, k.z ?? 0]), c.width, c.height, color.bg)
                        } else { ctx.clearRect(0, 0, c.width, c.height) }
                    } catch { /* busy */ }
                }
            }
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [loading, error, color.bg, detectorRef])

    const captureOnce = useCallback(async () => {
        if (!detectorRef.current || !videoRef.current) return null
        const v = videoRef.current
        if (!v.videoWidth || !v.videoHeight) return null
        try {
            const hands = await detectorRef.current.estimateHands(v, { flipHorizontal: true })
            if (hands.length > 0 && hands[0].keypoints) {
                return hands[0].keypoints.map((k: any) => [k.x, k.y, k.z ?? 0])
            }
        } catch { /* busy */ }
        return null
    }, [detectorRef])

    useEffect(() => {
        if (!capturing) {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
            return
        }
        intervalRef.current = setInterval(async () => {
            const lm = await captureOnce()
            if (lm) { onCapture(classId, lm); setCount(n => n + 1) }
        }, 300)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [capturing, classId, onCapture, captureOnce])

    const handleSingleCapture = async () => {
        const lm = await captureOnce()
        if (lm) { onCapture(classId, lm); setCount(n => n + 1) }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center">
            <div className="bg-ml-surface border border-ml-border-strong rounded-[20px] p-7 w-[400px] shadow-modal">
                <div className="flex items-center justify-between mb-[18px]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color.bg }} />
                        <span className="font-sans font-semibold text-ml-text-primary text-[15px]">
                            Capture for <em className="not-italic" style={{ color: color.bg }}>{classLabel}</em>
                        </span>
                    </div>
                    <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ml-text-muted p-1"><X size={18} /></button>
                </div>
                {error ? (
                    <div className="py-6 text-center text-ml-error-text font-sans text-sm">{error}</div>
                ) : (
                    <>
                        <div className="rounded-xl overflow-hidden bg-ml-bg relative mb-4">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full block -scale-x-100" />
                            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none" />
                            {capturing && <div className="absolute top-2.5 right-2.5 bg-[#ff4444] rounded-md px-2 py-[3px] text-xs font-sans text-white font-semibold flex items-center gap-[5px]"><span className="w-[7px] h-[7px] rounded-full bg-white inline-block" />REC</div>}
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button
                                onMouseDown={() => setCapturing(true)} onMouseUp={() => setCapturing(false)} onMouseLeave={() => setCapturing(false)}
                                onTouchStart={() => setCapturing(true)} onTouchEnd={() => setCapturing(false)}
                                className="flex-1 py-3 rounded-[10px] font-sans font-semibold text-sm cursor-pointer transition-all duration-150"
                                style={{ background: capturing ? color.bg : '#1e1e30', border: `1.5px solid ${capturing ? color.bg : 'var(--ml-border-strong)'}`, color: capturing ? '#fff' : 'var(--ml-text-secondary)' }}>
                                {capturing ? '● Recording…' : 'Hold to Capture'}
                            </button>
                            <button onClick={handleSingleCapture} className="px-4 py-3 rounded-[10px] bg-[#1e1e30] border-[1.5px] border-ml-border-strong text-ml-text-secondary cursor-pointer flex items-center">
                                <Camera size={16} />
                            </button>
                        </div>
                        {count > 0 && <div className="text-center mt-3 font-sans text-[13px] font-semibold" style={{ color: color.bg }}>{count} gesture{count !== 1 ? 's' : ''} captured</div>}
                    </>
                )}
                <button onClick={onClose} className="w-full mt-3.5 py-2.5 rounded-[10px] bg-transparent border-[1.5px] border-ml-border-strong text-ml-text-muted font-sans text-sm cursor-pointer">Done</button>
            </div>
        </div>
    )
}

// ─── HAND PREDICT MODAL ─────────────────────────────────────────────────────
function HandPredictModal({ onClose, onResult, detectorRef, knnRef, normalizeLandmarks }: {
    onClose: () => void
    onResult: (result: { label: string; confidences: Record<string, number> }) => void
    detectorRef: React.MutableRefObject<any>
    knnRef: React.MutableRefObject<KNNClassifier | null>
    normalizeLandmarks: (landmarks: number[][]) => number[]
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number | null>(null)
    const intervalRef = useRef<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [noHand, setNoHand] = useState(false)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } as any })
            .then(stream => {
                streamRef.current = stream
                if (videoRef.current) videoRef.current.srcObject = stream
                setLoading(false)
            })
            .catch(() => setError('Camera access denied. Please allow camera permissions.'))
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
        }
    }, [])

    // Real-time skeleton overlay
    useEffect(() => {
        if (loading || error) return
        let running = true
        const draw = async () => {
            if (!running) return
            const v = videoRef.current, c = overlayRef.current
            if (v && c && detectorRef.current && v.videoWidth && v.videoHeight) {
                c.width = v.videoWidth; c.height = v.videoHeight
                const ctx = c.getContext('2d')
                if (ctx) {
                    try {
                        const hands = await detectorRef.current.estimateHands(v, { flipHorizontal: true })
                        if (hands.length > 0 && hands[0].keypoints) {
                            drawHandSkeleton(ctx, hands[0].keypoints.map((k: any) => [k.x, k.y, k.z ?? 0]), c.width, c.height, '#7c3aed')
                        } else { ctx.clearRect(0, 0, c.width, c.height) }
                    } catch { /* busy */ }
                }
            }
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [loading, error, detectorRef])

    // Continuous prediction loop
    useEffect(() => {
        if (loading || error) return
        intervalRef.current = setInterval(async () => {
            const v = videoRef.current
            if (!v || !detectorRef.current || !knnRef.current) return
            if (!v.videoWidth || !v.videoHeight) return
            try {
                const hands = await detectorRef.current.estimateHands(v, { flipHorizontal: true })
                if (hands.length > 0 && hands[0].keypoints) {
                    setNoHand(false)
                    const landmarks = hands[0].keypoints.map((k: any) => [k.x, k.y, k.z ?? 0])
                    const normalized = normalizeLandmarks(landmarks)
                    if (normalized.length > 0) {
                        const r = await knnRef.current.predictFromData(new Float32Array(normalized), 3)
                        if (r) { setResult(r); onResult(r) }
                    }
                } else {
                    setNoHand(true)
                    setResult(null)
                }
            } catch { /* busy */ }
        }, 300)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [loading, error, detectorRef, knnRef, normalizeLandmarks, onResult])

    return (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center">
            <div className="bg-ml-surface border border-ml-border-strong rounded-[20px] p-7 w-[420px] shadow-modal">
                <div className="flex items-center justify-between mb-[18px]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
                        <span className="font-sans font-semibold text-ml-text-primary text-[15px]">
                            Predict — Show a hand gesture
                        </span>
                    </div>
                    <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ml-text-muted p-1"><X size={18} /></button>
                </div>
                {error ? (
                    <div className="py-6 text-center text-ml-error-text font-sans text-sm">{error}</div>
                ) : (
                    <>
                        <div className="rounded-xl overflow-hidden bg-ml-bg relative mb-4">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full block -scale-x-100" />
                            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none" />
                            {/* Live status badge */}
                            <div className="absolute top-2.5 right-2.5 rounded-md px-2 py-[3px] text-xs font-sans text-white font-semibold flex items-center gap-[5px]" style={{ background: noHand ? '#6b7280' : '#22C55E' }}>
                                <span className="w-[7px] h-[7px] rounded-full bg-white inline-block" style={{ animation: noHand ? 'none' : 'pulse 1.5s infinite' }} />
                                {noHand ? 'No hand' : 'LIVE'}
                            </div>
                        </div>

                        {/* Live prediction result */}
                        {result ? (
                            <div className="bg-ml-well rounded-xl p-3.5 mb-3">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <div className="w-2 h-2 rounded-full bg-[#22C55E]" style={{ boxShadow: '0 0 8px #22C55E' }} />
                                    <span className="font-sans text-sm text-ml-text-primary font-bold">{result.label}</span>
                                </div>
                                {Object.entries(result.confidences).map(([label, conf]) => (
                                    <div key={label} className="mb-1.5">
                                        <div className="flex justify-between text-[11px] mb-0.5">
                                            <span className="text-ml-text-secondary font-sans">{label}</span>
                                            <span className="text-ml-text-secondary font-mono font-semibold">{Math.round((conf as number) * 100)}%</span>
                                        </div>
                                        <div className="h-1 bg-ml-border rounded-sm overflow-hidden">
                                            <div className="h-full rounded-sm bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] transition-all duration-200" style={{ width: `${(conf as number) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 font-sans text-[13px] text-ml-text-muted">
                                {noHand ? 'Show your hand to the camera' : 'Detecting…'}
                            </div>
                        )}
                    </>
                )}
                <button onClick={onClose} className="w-full mt-2 py-2.5 rounded-[10px] bg-transparent border-[1.5px] border-ml-border-strong text-ml-text-muted font-sans text-sm cursor-pointer">Done</button>
            </div>
        </div>
    )
}

// Hand pose SVG illustrations for different gestures
function HandPoseIllustration({ gestureIndex, size = 48 }: { gestureIndex: number; size?: number }) {
    const illustrations = [
        // Open palm
        <svg key="palm" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <path d="M24 8C24 8 20 4 18 8C16 12 20 16 20 16L16 12C14 8 10 12 14 18L18 24L14 28C12 24 8 28 12 34L18 40H30L36 34C40 28 36 24 34 28L30 24L34 18C38 12 34 8 32 12L28 16L28 8C28 4 24 8 24 8Z" fill="currentColor" opacity="0.8"/>
            <circle cx="18" cy="20" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="24" cy="16" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="30" cy="20" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Thumbs up
        <svg key="thumbsup" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <path d="M18 40H12C10 40 8 38 8 36V28C8 26 10 24 12 24H16L20 12C20 8 24 8 24 12V20H32C34 20 36 22 36 24V26L34 36C33.5 38 32 40 30 40H18Z" fill="currentColor" opacity="0.8"/>
            <path d="M24 20V12" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
            <circle cx="24" cy="8" r="2" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Peace sign
        <svg key="peace" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <path d="M16 40H12C10 40 8 38 8 36V28C8 26 10 24 12 24H16L18 16L14 12C12 8 16 8 18 12L22 20L24 12C24 8 28 8 28 12L26 20L30 16C32 12 36 16 34 20L30 24H34C36 24 38 26 38 28V36C38 38 36 40 34 40H16Z" fill="currentColor" opacity="0.8"/>
            <circle cx="20" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="28" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Fist
        <svg key="fist" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <path d="M14 20H34C36 20 38 22 38 24V32C38 36 34 40 30 40H18C14 40 10 36 10 32V24C10 22 12 20 14 20Z" fill="currentColor" opacity="0.8"/>
            <path d="M16 20V16C16 14 18 12 20 12H28C30 12 32 14 32 16V20" fill="currentColor" opacity="0.6"/>
            <line x1="18" y1="26" x2="30" y2="26" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
            <line x1="18" y1="30" x2="30" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
        </svg>,
        // Pointing
        <svg key="point" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <path d="M24 4C24 4 22 8 24 12L26 20H22L20 12C18 8 22 4 24 4Z" fill="currentColor" opacity="0.9"/>
            <path d="M16 40H12C10 40 8 38 8 36V28C8 26 10 24 12 24H16L18 32H30V24H34C36 24 38 26 38 28V36C38 38 36 40 34 40H16Z" fill="currentColor" opacity="0.8"/>
            <circle cx="24" cy="4" r="2" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Rock on
        <svg key="rockon" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <path d="M14 40H12C10 40 8 38 8 36V28C8 26 10 24 12 24H16L18 16L14 12C12 8 16 8 18 12L22 20" fill="currentColor" opacity="0.8"/>
            <path d="M22 4L24 12L26 4C26 2 24 2 22 4Z" fill="currentColor" opacity="0.9"/>
            <path d="M28 4L30 12L32 4C32 2 30 2 28 4Z" fill="currentColor" opacity="0.9"/>
            <path d="M30 20H34C36 20 38 22 38 24V32C38 36 34 40 30 40H22V24H18" fill="currentColor" opacity="0.7"/>
        </svg>,
    ]
    return illustrations[gestureIndex % illustrations.length]
}

export default function HandPoseClassifier({ project, onBack, onDataChange }: HandPoseClassifierProps) {
    const [classes, setClasses] = useState<HandPoseClass[]>([
        { id: 1, name: 'Gesture 1', samples: [] },
        { id: 2, name: 'Gesture 2', samples: [] },
    ])
    const [nextId, setNextId] = useState(3)
    const [webcamFor, setWebcamFor] = useState<number | null>(null)
    const [showPredictModal, setShowPredictModal] = useState(false)
    const [trained, setTrained] = useState(false)
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState(0)
    const [showAdv, setShowAdv] = useState(false)
    const [epochs, setEpochs] = useState(30)
    const [testResult, setTestResult] = useState<any>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [restored, setRestored] = useState(false)
    const [handDetReady, setHandDetReady] = useState(false)
    const [accuracy, setAccuracy] = useState(0)
    const detectorRef = useRef<any>(null)
    const knnRef = useRef<KNNClassifier | null>(null)

    // Deserialize: restore from saved project on mount
    useEffect(() => {
        if (project?.classes?.length > 0 && !restored) {
            const restoredClasses: HandPoseClass[] = project.classes.map((c: any) => ({
                id: Number(c.id),
                name: c.name,
                samples: (c.samples || []).map((s: any) => {
                    if (typeof s.data === 'string') {
                        try { return JSON.parse(s.data) } catch { return [] }
                    }
                    return s.data ?? s
                }),
            }))
            setClasses(restoredClasses.length > 0 ? restoredClasses : [
                { id: 1, name: 'Gesture 1', samples: [] },
                { id: 2, name: 'Gesture 2', samples: [] },
            ])
            setNextId(restoredClasses.length > 0 ? Math.max(...restoredClasses.map(c => c.id)) + 1 : 3)
            setTrained(project.modelTrained || false)
            if (project.projectData?.epochs) setEpochs(project.projectData.epochs)
            setRestored(true)
        }
    }, [project])

    // Serialize: sync state back to parent (debounced)
    useEffect(() => {
        if (!restored || !onDataChange) return
        const timer = setTimeout(() => {
            onDataChange({
                classes: classes.map((c, ci) => ({
                    id: String(c.id),
                    name: c.name,
                    color: COLORS[ci % COLORS.length]?.bg || '#7c3aed',
                    samples: c.samples.map((landmarks, i) => ({
                        id: `hand-${c.id}-${i}`,
                        type: 'keypoints' as const,
                        data: JSON.stringify(landmarks),
                        timestamp: Date.now(),
                    })),
                })),
                modelTrained: trained,
                projectData: { nextId, epochs },
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [classes, trained, nextId, epochs, onDataChange])

    // Load MediaPipe Hands detector on demand (first camera open)
    const ensureDetector = useCallback(async () => {
        if (detectorRef.current) return detectorRef.current
        try {
            const handPoseDetection = await ensureHandPose()
            const model = handPoseDetection.SupportedModels.MediaPipeHands
            const detector = await handPoseDetection.createDetector(model, {
                runtime: 'mediapipe',
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240'
            })
            detectorRef.current = detector
            setHandDetReady(true)
            return detector
        } catch (e) { console.error('Hand pose detector load failed:', e); return null }
    }, [])

    // Preload detector when webcam modal opens
    useEffect(() => {
        if (webcamFor !== null && !detectorRef.current) {
            ensureDetector()
        }
    }, [webcamFor, ensureDetector])

    const addGestureSample = useCallback((classId: number, landmarks: number[][]) => {
        setClasses(p => p.map(c => c.id === classId ? { ...c, samples: [...c.samples, landmarks] } : c))
    }, [])

    const normalizeLandmarks = useCallback((landmarks: number[][]): number[] => {
        const xs = landmarks.map(k => k[0])
        const ys = landmarks.map(k => k[1])
        const minX = Math.min(...xs), maxX = Math.max(...xs)
        const minY = Math.min(...ys), maxY = Math.max(...ys)
        const rangeX = (maxX - minX) || 1
        const rangeY = (maxY - minY) || 1
        return landmarks.map(k => [(k[0] - minX) / rangeX, (k[1] - minY) / rangeY, k[2] ?? 0]).flat()
    }, [])

    const handleTrain = async () => {
        setStatus('training')
        setProgress(0)
        try {
            const knn = new KNNClassifier()
            knnRef.current = knn
            let loaded = 0
            const total = classes.reduce((s, c) => s + c.samples.length, 0)
            for (const cls of classes) {
                for (const landmarks of cls.samples) {
                    const normalized = normalizeLandmarks(landmarks)
                    if (normalized.length > 0) {
                        await knn.addExampleFromData(new Float32Array(normalized), cls.name)
                    }
                    loaded++
                    setProgress(Math.round((loaded / total) * 100))
                }
            }

            let correct = 0, evaluated = 0
            const tf = await ensureTf()
            for (const cls of classes) {
                for (const landmarks of cls.samples) {
                    const normalized = normalizeLandmarks(landmarks)
                    if (normalized.length === 0) continue
                    const emb = tf.tensor1d(new Float32Array(normalized))
                    const pred = await knn.predictClass(emb, 3)
                    emb.dispose()
                    if (pred && pred.label === cls.name) correct++
                    evaluated++
                }
            }
            const acc = evaluated > 0 ? correct / evaluated : 0
            setAccuracy(acc)
            setTrained(true)
            setStatus('done')
        } catch (e) {
            console.error('Training failed:', e)
            setStatus('idle')
        }
    }

    const canTrain = classes.filter(c => c.samples.length > 0).length >= 2

    const startRename = (cls: HandPoseClass) => {
        setEditingId(cls.id)
        setEditName(cls.name)
    }

    const commitRename = () => {
        if (editingId !== null && editName.trim()) {
            setClasses(p => p.map(c => c.id === editingId ? { ...c, name: editName.trim() } : c))
        }
        setEditingId(null)
    }

    const deleteClass = (id: number) => {
        setClasses(p => p.filter(c => c.id !== id))
    }

    const addClass = () => {
        setClasses(p => [...p, { id: nextId, name: `Gesture ${nextId}`, samples: [] }])
        setNextId(n => n + 1)
    }

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="flex gap-6 items-stretch flex-1 min-h-0">
                {/* Gesture Cards Column */}
                <div className="flex-1 flex flex-col gap-4">
                    {classes.map((cls, i) => {
                        const color = COLORS[i % COLORS.length]
                        const isHovered = hoveredCard === cls.id

                        return (
                            <div
                                key={cls.id}
                                className="bg-ml-surface rounded-2xl overflow-hidden transition-all duration-300 ease-out"
                                style={{
                                    border: `1px solid ${isHovered ? color.border : 'var(--ml-border)'}`,
                                    transform: isHovered ? 'translateY(-2px)' : 'none',
                                    boxShadow: isHovered ? `0 8px 24px ${color.glow}` : 'none'
                                }}
                                onMouseEnter={() => setHoveredCard(cls.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                {/* Gradient Header */}
                                <div
                                    className="flex items-center justify-between px-4 py-3"
                                    style={{ background: `linear-gradient(135deg, ${color.bg} 0%, ${color.light} 100%)` }}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {editingId === cls.id ? (
                                            <input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && commitRename()}
                                                autoFocus
                                                className="bg-black/25 border-none rounded-md px-2 py-[3px] text-white font-sans text-sm font-semibold w-full outline-none"
                                            />
                                        ) : (
                                            <span className="text-white font-sans font-bold text-sm tracking-tight overflow-hidden text-ellipsis whitespace-nowrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                                                {cls.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        {editingId === cls.id ? (
                                            <>
                                                <button onClick={commitRename} className="bg-white/25 border-none rounded-md px-1.5 py-1 cursor-pointer text-white flex items-center transition-colors duration-150">
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => { setEditingId(null) }} className="bg-white/15 border-none rounded-md px-1.5 py-1 cursor-pointer text-white flex items-center transition-colors duration-150">
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startRename(cls)} className="bg-white/20 border-none rounded-md px-1.5 py-1 cursor-pointer text-white flex items-center transition-colors duration-150">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteClass(cls.id)} className="bg-white/15 border-none rounded-md px-1.5 py-1 cursor-pointer text-white flex items-center transition-colors duration-150">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-4">
                                    {/* Sample count badge */}
                                    <div
                                        className="inline-flex items-center gap-1.5 text-xs font-sans font-bold mb-3"
                                        style={{ background: color.bg + '18', color: color.bg, padding: '4px 12px', borderRadius: 8 }}
                                    >
                                        <Activity size={12} />
                                        {cls.samples.length} gesture{cls.samples.length !== 1 ? 's' : ''} captured
                                    </div>

                                    {/* Hand pose illustration and thumbnail grid */}
                                    <div className="flex gap-3 items-start">
                                        {/* Main illustration */}
                                        <div
                                            className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${color.bg}15 0%, ${color.light}10 100%)`, border: `1px solid ${color.bg}30`, color: color.bg }}
                                        >
                                            <HandPoseIllustration gestureIndex={i} size={40} />
                                        </div>

                                        {/* Thumbnail grid */}
                                        <div className="flex-1">
                                            {cls.samples.length > 0 ? (
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {cls.samples.slice(-6).map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="w-[44px] h-[44px] rounded-[10px] bg-ml-well border-[1.5px] border-ml-border-strong flex items-center justify-center cursor-pointer transition-all duration-200"
                                                            style={{ color: color.bg }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.borderColor = color.bg
                                                                e.currentTarget.style.transform = 'scale(1.1)'
                                                                e.currentTarget.style.boxShadow = `0 2px 10px ${color.glow}`
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.borderColor = 'var(--ml-border-strong)'
                                                                e.currentTarget.style.transform = 'scale(1)'
                                                                e.currentTarget.style.boxShadow = 'none'
                                                            }}
                                                        >
                                                            <Hand size={18} />
                                                        </div>
                                                    ))}
                                                    {cls.samples.length > 6 && (
                                                        <div
                                                            className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center text-[11px] font-bold"
                                                            style={{ background: color.bg + '12', border: `1.5px solid ${color.bg}30`, color: color.bg }}
                                                        >
                                                            +{cls.samples.length - 6}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-[44px] flex items-center justify-center text-ml-text-muted text-xs font-sans">
                                                    No gestures captured yet
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => setWebcamFor(cls.id)}
                                            className="flex-1 py-2.5 rounded-[10px] bg-ml-well border-[1.5px] border-dashed border-ml-border-strong text-ml-text-secondary font-sans text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200"
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = color.bg
                                                e.currentTarget.style.color = color.bg
                                                e.currentTarget.style.background = color.bg + '10'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'var(--ml-border-strong)'
                                                e.currentTarget.style.color = 'var(--ml-text-secondary)'
                                                e.currentTarget.style.background = 'var(--ml-well)'
                                            }}
                                        >
                                            <Camera size={14} />
                                            Webcam
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Add Class button */}
                    <AddClassButton onClick={addClass} accentColor="#7c3aed" />
                </div>

                {/* Training Panel */}
                <TrainingPanel
                    status={status}
                    progress={progress}
                    accuracy={accuracy}
                    canTrain={canTrain}
                    onTrain={handleTrain}
                    showAdvanced={showAdv}
                    setShowAdvanced={setShowAdv}
                    epochs={epochs}
                    setEpochs={setEpochs}
                    trained={trained}
                    sampleCounts={Object.fromEntries(classes.map(c => [c.name, c.samples.length]))}
                    mlDescription="Using MediaPipe hand landmarks + KNN classifier. All computation runs in-browser — no data leaves your device."
                />

                {/* Divider */}
                <div className="w-8 flex items-center pt-16">
                    <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, #7c3aed40, transparent)' }} />
                </div>

                {/* Testing Panel */}
                <ProjectTestingPanel
                    icon={<Activity size={16} className="text-white" />}
                    accentColor="#7c3aed"
                    trained={trained}
                    emptyText="Train your hand pose model first"
                    emptyIllustration={
                        <svg width="80" height="64" viewBox="0 0 80 64" fill="none" className="opacity-40 mb-3">
                            <rect x="18" y="16" width="44" height="32" rx="4" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
                            <circle cx="40" cy="32" r="10" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
                            <circle cx="40" cy="32" r="5" fill="#7c3aed" opacity="0.2" />
                            <path d="M36 26 L40 20 L44 26 L44 38 L36 38Z" fill="#7c3aed" opacity="0.3" />
                            <text x="62" y="28" fontSize="16" fill="#7c3aed" opacity="0.5" fontWeight="bold">?</text>
                        </svg>
                    }
                >
                    {/* Success indicator */}
                    <div className="flex items-center gap-2 bg-ml-success-bg border border-ml-success-border rounded-[10px] py-2.5 px-3">
                        <div className="w-2 h-2 rounded-full bg-ml-success-dot" style={{ boxShadow: '0 0 8px var(--ml-success-dot)' }} />
                        <span className="font-sans text-xs text-ml-success-text font-semibold">Model ready</span>
                    </div>

                    {/* Instructions */}
                    <div className="bg-ml-well rounded-[10px] p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-ml-text-secondary font-sans">
                            <Camera size={12} />
                            Show hand gestures to camera
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-ml-text-secondary font-sans">
                            <Hand size={12} />
                            Results appear in real-time
                        </div>
                    </div>

                    {/* Capture & Predict button */}
                    <button onClick={() => {
                        if (!knnRef.current) { showToast('Train your model first.', 'error'); return }
                        setShowPredictModal(true)
                    }} className="w-full py-[11px] rounded-[10px] border-none bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white font-sans font-bold text-[13px] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200" style={{ boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                        <Camera size={14} />
                        Capture & Predict
                    </button>

                    {/* Prediction results */}
                    {testResult && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-ml-success-dot" style={{ animation: 'pulse 2s infinite' }} />
                                <span className="font-sans text-xs text-ml-text-primary font-semibold">{testResult.label}</span>
                            </div>
                            {Object.entries(testResult.confidences).map(([label, conf]) => (
                                <div key={label}>
                                    <div className="flex justify-between text-[10px] mb-[3px]">
                                        <span className="text-ml-text-secondary">{label}</span>
                                        <span className="text-ml-text-secondary font-mono">
                                            {Math.round((conf as number) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-[3px] bg-ml-well rounded-sm overflow-hidden">
                                        <div className="h-full rounded-sm bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]" style={{ width: `${(conf as number) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ProjectTestingPanel>
            </div>

            {/* Hand Webcam Modal */}
            {webcamFor !== null && (
                <HandWebcamModal
                    classLabel={classes.find(c => c.id === webcamFor)?.name || 'Gesture'}
                    color={COLORS[classes.findIndex(c => c.id === webcamFor) % COLORS.length] || COLORS[0]}
                    classId={webcamFor}
                    onCapture={addGestureSample}
                    onClose={() => setWebcamFor(null)}
                    detectorRef={detectorRef}
                />
            )}

            {/* Hand Predict Modal */}
            {showPredictModal && trained && (
                <HandPredictModal
                    onClose={() => setShowPredictModal(false)}
                    onResult={(r) => setTestResult(r)}
                    detectorRef={detectorRef}
                    knnRef={knnRef}
                    normalizeLandmarks={normalizeLandmarks}
                />
            )}
        </ClassifierLayout>
    )
}
