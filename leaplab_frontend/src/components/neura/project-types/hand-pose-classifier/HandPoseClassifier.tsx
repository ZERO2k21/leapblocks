// classifiers/hand-pose-classifier/HandPoseClassifier.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--ml-surface)', border: '1px solid var(--ml-border-strong)', borderRadius: 20, padding: 28, width: 400, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.bg }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: 'var(--ml-text-primary)', fontSize: 15 }}>
                            Capture for <em style={{ fontStyle: 'normal', color: color.bg }}>{classLabel}</em>
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ml-text-muted)', padding: 4 }}><X size={18} /></button>
                </div>
                {error ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ml-error-text, #ef4444)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{error}</div>
                ) : (
                    <>
                        <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--ml-bg)', position: 'relative', marginBottom: 16 }}>
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
                            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />
                            {capturing && <div style={{ position: 'absolute', top: 10, right: 10, background: '#ff4444', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />REC</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                                onMouseDown={() => setCapturing(true)} onMouseUp={() => setCapturing(false)} onMouseLeave={() => setCapturing(false)}
                                onTouchStart={() => setCapturing(true)} onTouchEnd={() => setCapturing(false)}
                                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: capturing ? color.bg : '#1e1e30', border: `1.5px solid ${capturing ? color.bg : 'var(--ml-border-strong)'}`, color: capturing ? '#fff' : 'var(--ml-text-secondary)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}>
                                {capturing ? '● Recording…' : 'Hold to Capture'}
                            </button>
                            <button onClick={handleSingleCapture} style={{ padding: '12px 16px', borderRadius: 10, background: '#1e1e30', border: '1.5px solid var(--ml-border-strong)', color: 'var(--ml-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Camera size={16} />
                            </button>
                        </div>
                        {count > 0 && <div style={{ textAlign: 'center', marginTop: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: color.bg, fontWeight: 600 }}>{count} gesture{count !== 1 ? 's' : ''} captured</div>}
                    </>
                )}
                <button onClick={onClose} style={{ width: '100%', marginTop: 14, padding: '10px 0', borderRadius: 10, background: 'transparent', border: '1.5px solid var(--ml-border-strong)', color: 'var(--ml-text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: 'pointer' }}>Done</button>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--ml-surface)', border: '1px solid var(--ml-border-strong)', borderRadius: 20, padding: 28, width: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed' }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: 'var(--ml-text-primary)', fontSize: 15 }}>
                            Predict — Show a hand gesture
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ml-text-muted)', padding: 4 }}><X size={18} /></button>
                </div>
                {error ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ml-error-text, #ef4444)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{error}</div>
                ) : (
                    <>
                        <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--ml-bg)', position: 'relative', marginBottom: 16 }}>
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
                            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />
                            {/* Live status badge */}
                            <div style={{ position: 'absolute', top: 10, right: 10, background: noHand ? '#6b7280' : '#22C55E', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: noHand ? 'none' : 'pulse 1.5s infinite' }} />
                                {noHand ? 'No hand' : 'LIVE'}
                            </div>
                        </div>

                        {/* Live prediction result */}
                        {result ? (
                            <div style={{ background: 'var(--ml-well)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--ml-text-primary)', fontWeight: 700 }}>{result.label}</span>
                                </div>
                                {Object.entries(result.confidences).map(([label, conf]) => (
                                    <div key={label} style={{ marginBottom: 6 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                                            <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                                            <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{Math.round((conf as number) * 100)}%</span>
                                        </div>
                                        <div style={{ height: 4, background: 'var(--ml-border)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(conf as number) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 2, transition: 'width 0.2s' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '16px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ml-text-muted)' }}>
                                {noHand ? 'Show your hand to the camera' : 'Detecting…'}
                            </div>
                        )}
                    </>
                )}
                <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10, background: 'transparent', border: '1.5px solid var(--ml-border-strong)', color: 'var(--ml-text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: 'pointer' }}>Done</button>
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
    }, [classes, trained, nextId, epochs])

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
        return landmarks.map(k => [(k[0] - minX) / rangeX, (k[1] - minY) / rangeY, k[2]]).flat()
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
            <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
                {/* Gesture Cards Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {classes.map((cls, i) => {
                        const color = COLORS[i % COLORS.length]
                        const isHovered = hoveredCard === cls.id

                        return (
                            <div
                                key={cls.id}
                                style={{
                                    background: 'var(--ml-surface)',
                                    border: `1px solid ${isHovered ? color.border : 'var(--ml-border)'}`,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    transform: isHovered ? 'translateY(-2px)' : 'none',
                                    boxShadow: isHovered ? `0 8px 24px ${color.glow}` : 'none'
                                }}
                                onMouseEnter={() => setHoveredCard(cls.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                {/* Gradient Header */}
                                <div style={{
                                    background: `linear-gradient(135deg, ${color.bg} 0%, ${color.light} 100%)`,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                        {editingId === cls.id ? (
                                            <input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && commitRename()}
                                                autoFocus
                                                style={{
                                                    background: 'rgba(0,0,0,0.25)',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    padding: '3px 8px',
                                                    color: '#fff',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    width: '100%',
                                                    outline: 'none'
                                                }}
                                            />
                                        ) : (
                                            <span style={{
                                                color: '#fff',
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 700,
                                                fontSize: 14,
                                                letterSpacing: '-0.01em',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.15)'
                                            }}>
                                                {cls.name}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                                        {editingId === cls.id ? (
                                            <>
                                                <button onClick={commitRename} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => { setEditingId(null) }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startRename(cls)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteClass(cls.id)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div style={{ padding: 16 }}>
                                    {/* Sample count badge */}
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        background: color.bg + '18',
                                        color: color.bg,
                                        padding: '4px 12px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 700,
                                        marginBottom: 12
                                    }}>
                                        <Activity size={12} />
                                        {cls.samples.length} gesture{cls.samples.length !== 1 ? 's' : ''} captured
                                    </div>

                                    {/* Hand pose illustration and thumbnail grid */}
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        {/* Main illustration */}
                                        <div style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 12,
                                            background: `linear-gradient(135deg, ${color.bg}15 0%, ${color.light}10 100%)`,
                                            border: `1px solid ${color.bg}30`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: color.bg,
                                            flexShrink: 0
                                        }}>
                                            <HandPoseIllustration gestureIndex={i} size={40} />
                                        </div>

                                        {/* Thumbnail grid */}
                                        <div style={{ flex: 1 }}>
                                            {cls.samples.length > 0 ? (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {cls.samples.slice(-6).map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                width: 44,
                                                                height: 44,
                                                                borderRadius: 10,
                                                                background: 'var(--ml-well)',
                                                                border: `1.5px solid var(--ml-border-strong)`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: color.bg,
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer'
                                                            }}
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
                                                        <div style={{
                                                            width: 44,
                                                            height: 44,
                                                            borderRadius: 10,
                                                            background: color.bg + '12',
                                                            border: `1.5px solid ${color.bg}30`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 11,
                                                            color: color.bg,
                                                            fontWeight: 700
                                                        }}>
                                                            +{cls.samples.length - 6}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{
                                                    height: 44,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--ml-text-muted)',
                                                    fontSize: 12,
                                                    fontFamily: "'DM Sans', sans-serif"
                                                }}>
                                                    No gestures captured yet
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                        <button
                                            onClick={() => setWebcamFor(cls.id)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 0',
                                                borderRadius: 10,
                                                background: 'var(--ml-well)',
                                                border: '1.5px dashed var(--ml-border-strong)',
                                                color: 'var(--ml-text-secondary)',
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                transition: 'all 0.2s ease'
                                            }}
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
                    <button
                        onClick={addClass}
                        style={{
                            width: '100%',
                            padding: '16px 0',
                            borderRadius: 16,
                            border: '2px dashed var(--ml-border-strong)',
                            background: 'transparent',
                            color: 'var(--ml-text-secondary)',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#7c3aed'
                            e.currentTarget.style.color = '#a78bfa'
                            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--ml-border-strong)'
                            e.currentTarget.style.color = 'var(--ml-text-secondary)'
                            e.currentTarget.style.background = 'transparent'
                        }}
                    >
                        <Plus size={16} />
                        Add Class
                    </button>
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
                />

                {/* Divider */}
                <div style={{ width: 32, display: 'flex', alignItems: 'center', paddingTop: 64 }}>
                    <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, #7c3aed40, transparent)' }} />
                </div>

                {/* Testing Panel */}
                <div style={{
                    width: 256,
                    background: 'var(--ml-surface)',
                    border: '1px solid var(--ml-border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    flexShrink: 0
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                        padding: '14px 16px'
                    }}>
                        <span style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 14,
                            fontFamily: "'DM Sans', sans-serif"
                        }}>Testing</span>
                    </div>

                    <div style={{ padding: 20 }}>
                        {!trained ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                {/* Camera + hand illustration */}
                                <svg width="80" height="64" viewBox="0 0 80 64" fill="none" style={{ opacity: 0.4, marginBottom: 12 }}>
                                    {/* Camera body */}
                                    <rect x="18" y="16" width="44" height="32" rx="4" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
                                    <circle cx="40" cy="32" r="10" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
                                    <circle cx="40" cy="32" r="5" fill="#7c3aed" opacity="0.2" />
                                    {/* Hand silhouette */}
                                    <path d="M36 26 L40 20 L44 26 L44 38 L36 38Z" fill="#7c3aed" opacity="0.3" />
                                    {/* Question mark */}
                                    <text x="62" y="28" fontSize="16" fill="#7c3aed" opacity="0.5" fontWeight="bold">?</text>
                                </svg>
                                <p style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 12,
                                    color: 'var(--ml-text-muted)',
                                    lineHeight: 1.6,
                                    margin: 0
                                }}>
                                    Train your hand pose model first
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {/* Success indicator */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'var(--ml-success-bg)',
                                    border: '1px solid var(--ml-success-border)',
                                    borderRadius: 10,
                                    padding: '10px 12px'
                                }}>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: 'var(--ml-success-dot)',
                                        boxShadow: '0 0 8px var(--ml-success-dot)'
                                    }} />
                                    <span style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: 12,
                                        color: 'var(--ml-success-text)',
                                        fontWeight: 600
                                    }}>Model ready</span>
                                </div>

                                {/* Instructions */}
                                <div style={{
                                    background: 'var(--ml-well)',
                                    borderRadius: 10,
                                    padding: 12,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 11,
                                        color: 'var(--ml-text-secondary)',
                                        fontFamily: "'DM Sans', sans-serif"
                                    }}>
                                        <Camera size={12} />
                                        Show hand gestures to camera
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 11,
                                        color: 'var(--ml-text-secondary)',
                                        fontFamily: "'DM Sans', sans-serif"
                                    }}>
                                        <Hand size={12} />
                                        Results appear in real-time
                                    </div>
                                </div>

                                {/* Capture & Predict button */}
                                <button onClick={() => {
                                    if (!knnRef.current) { showToast('Train your model first.', 'error'); return }
                                    setShowPredictModal(true)
                                }} style={{
                                    width: '100%',
                                    padding: '11px 0',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                    color: '#fff',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <Camera size={14} />
                                    Capture & Predict
                                </button>

                                {/* Prediction results placeholder */}
                                {testResult && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}>
                                            <div style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                background: 'var(--ml-success-dot)',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                            <span style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 12,
                                                color: 'var(--ml-text-primary)',
                                                fontWeight: 600
                                            }}>{testResult.label}</span>
                                        </div>
                                        {Object.entries(testResult.confidences).map(([label, conf]) => (
                                            <div key={label}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: 10,
                                                    marginBottom: 3
                                                }}>
                                                    <span style={{ color: 'var(--ml-text-secondary)' }}>{label}</span>
                                                    <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Mono', monospace" }}>
                                                        {Math.round((conf as number) * 100)}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: 3,
                                                    background: 'var(--ml-well)',
                                                    borderRadius: 2,
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${(conf as number) * 100}%`,
                                                        background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                                                        borderRadius: 2
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
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
