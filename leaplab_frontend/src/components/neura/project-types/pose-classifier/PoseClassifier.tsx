// classifiers/pose-classifier/PoseClassifier.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
import AddClassButton from '../../components/AddClassButton'
import ProjectTestingPanel from '../../components/ProjectTestingPanel'
import { KNNClassifier } from '../../ml/KNNClassifier'
import { ensureTf, ensurePoseDetection } from '../../ml/loadScript'
import { showToast } from '../../../../leapignite/client/components/Toast'
import { Camera, PersonStanding, Trash2, Edit2, Check, X, Plus, Activity, Users } from 'lucide-react'

type PoseClass = {
    id: number
    name: string
    samples: number[][][]
}

type PoseClassifierProps = {
    project?: any
    onBack: () => void
    onDataChange?: (data: Record<string, any>) => void
}

const COLORS = [
    { bg: '#22c55e', light: '#4ade80', glow: 'rgba(34, 197, 94, 0.3)', border: 'rgba(34, 197, 94, 0.3)' },
    { bg: '#06b6d4', light: '#22d3ee', glow: 'rgba(6, 182, 212, 0.3)', border: 'rgba(6, 182, 212, 0.3)' },
    { bg: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.3)', border: 'rgba(139, 92, 246, 0.3)' },
    { bg: '#f97316', light: '#fb923c', glow: 'rgba(249, 115, 22, 0.3)', border: 'rgba(249, 115, 22, 0.3)' },
    { bg: '#ec4899', light: '#f472b6', glow: 'rgba(236, 72, 153, 0.3)', border: 'rgba(236, 72, 153, 0.3)' },
    { bg: '#3b82f6', light: '#60a5fa', glow: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.3)' },
]

// MoveNet COCO 17-keypoint skeleton connections
const POSE_CONNECTIONS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // head
    [0, 5], [5, 7], [7, 9],                // left arm
    [0, 6], [6, 8], [8, 10],               // right arm
    [5, 6],                                 // shoulders
    [5, 11], [6, 12],                       // torso
    [11, 12],                               // hips
    [11, 13], [13, 15],                     // left leg
    [12, 14], [14, 16],                     // right leg
]

function drawBodySkeleton(ctx: CanvasRenderingContext2D, keypoints: number[][], w: number, h: number, color: string) {
    ctx.clearRect(0, 0, w, h)
    if (!keypoints || keypoints.length < 17) return
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.6
    for (const [a, b] of POSE_CONNECTIONS) {
        const ka = keypoints[a], kb = keypoints[b]
        if (!ka || !kb) continue
        ctx.beginPath()
        ctx.moveTo(ka[0] * w, ka[1] * h)
        ctx.lineTo(kb[0] * w, kb[1] * h)
        ctx.stroke()
    }
    ctx.globalAlpha = 1
    for (let i = 0; i < keypoints.length; i++) {
        const k = keypoints[i]
        if (!k) continue
        const x = k[0] * w, y = k[1] * h
        const r = i === 0 ? 5 : (i <= 4 ? 4 : 3)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = i <= 4 ? '#fff' : color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
    }
}

function PoseIllustration({ poseIndex, size = 48 }: { poseIndex: number; size?: number }) {
    const illustrations = [
        // Standing pose - neutral upright position
        <svg key="standing" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="8" r="4" fill="currentColor" opacity="0.8"/>
            <line x1="24" y1="12" x2="24" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="24" y1="16" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="16" x2="32" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="28" x2="18" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="28" x2="30" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <circle cx="24" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Walking pose - dynamic stride
        <svg key="walking" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <circle cx="22" cy="8" r="4" fill="currentColor" opacity="0.8"/>
            <line x1="22" y1="12" x2="24" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="23" y1="16" x2="14" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="23" y1="16" x2="32" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="26" x2="16" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="26" x2="34" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <circle cx="14" cy="20" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="32" cy="22" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Running pose - action sprint
        <svg key="running" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <circle cx="20" cy="6" r="4" fill="currentColor" opacity="0.8"/>
            <line x1="20" y1="10" x2="26" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="22" y1="14" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="22" y1="14" x2="34" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="26" y1="24" x2="14" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="26" y1="24" x2="38" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <circle cx="12" cy="18" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="34" cy="16" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Jumping pose - energetic leap
        <svg key="jumping" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="6" r="4" fill="currentColor" opacity="0.8"/>
            <line x1="24" y1="10" x2="24" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="24" y1="14" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="14" x2="34" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="22" x2="16" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="22" x2="32" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <circle cx="14" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="34" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Sitting pose - relaxed position
        <svg key="sitting" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <circle cx="22" cy="8" r="4" fill="currentColor" opacity="0.8"/>
            <line x1="22" y1="12" x2="22" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="22" y1="16" x2="14" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="22" y1="16" x2="30" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="22" y1="26" x2="14" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="22" y1="26" x2="34" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="14" y1="28" x2="14" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="34" y1="28" x2="34" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <circle cx="14" cy="22" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
        // Dancing pose - expressive movement
        <svg key="dancing" width={size} height={size} viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="6" r="4" fill="currentColor" opacity="0.8"/>
            <line x1="24" y1="10" x2="24" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="24" y1="14" x2="12" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="14" x2="36" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="26" x2="16" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="24" y1="26" x2="32" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <circle cx="12" cy="10" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="36" cy="18" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>,
    ]
    return illustrations[poseIndex % illustrations.length]
}

function PersonIllustration({ size = 80 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.8} viewBox="0 0 80 64" fill="none" style={{ opacity: 0.5 }}>
            <circle cx="40" cy="12" r="8" stroke="#8b5cf6" strokeWidth="1.5" fill="none"/>
            <circle cx="40" cy="12" r="4" fill="#8b5cf6" opacity="0.15"/>
            <line x1="40" y1="20" x2="40" y2="42" stroke="#8b5cf6" strokeWidth="1.5"/>
            <line x1="40" y1="26" x2="28" y2="36" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="40" y1="26" x2="52" y2="36" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="40" y1="42" x2="30" y2="58" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="40" y1="42" x2="50" y2="58" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="28" cy="36" r="2" fill="#8b5cf6" opacity="0.3"/>
            <circle cx="52" cy="36" r="2" fill="#8b5cf6" opacity="0.3"/>
            <circle cx="30" cy="58" r="2" fill="#8b5cf6" opacity="0.3"/>
            <circle cx="50" cy="58" r="2" fill="#8b5cf6" opacity="0.3"/>
            <path d="M20 30 C16 26 16 34 20 38" stroke="#8b5cf6" strokeWidth="1" opacity="0.3" fill="none"/>
            <path d="M60 30 C64 26 64 34 60 38" stroke="#8b5cf6" strokeWidth="1" opacity="0.3" fill="none"/>
        </svg>
    )
}

// ─── POSE WEBCAM MODAL ──────────────────────────────────────────────────────
function PoseWebcamModal({ classLabel, color, classId, onCapture, onClose, detectorRef }: {
    classLabel: string
    color: { bg: string; light: string }
    classId: number
    onCapture: (classId: number, keypoints: number[][]) => void
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
                        const poses = await detectorRef.current.estimatePoses(v)
                        if (poses.length > 0 && poses[0].keypoints) {
                            drawBodySkeleton(ctx, poses[0].keypoints.map((k: any) => [k.x, k.y, k.score ?? 0]), c.width, c.height, color.bg)
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
            const poses = await detectorRef.current.estimatePoses(v)
            if (poses.length > 0 && poses[0].keypoints) {
                return poses[0].keypoints.map((k: any) => [k.x, k.y, k.score ?? 0])
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
            const kp = await captureOnce()
            if (kp) { onCapture(classId, kp); setCount(n => n + 1) }
        }, 300)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [capturing, classId, onCapture, captureOnce])

    const handleSingleCapture = async () => {
        const kp = await captureOnce()
        if (kp) { onCapture(classId, kp); setCount(n => n + 1) }
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
                        {count > 0 && <div style={{ textAlign: 'center', marginTop: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: color.bg, fontWeight: 600 }}>{count} pose{count !== 1 ? 's' : ''} captured</div>}
                    </>
                )}
                <button onClick={onClose} style={{ width: '100%', marginTop: 14, padding: '10px 0', borderRadius: 10, background: 'transparent', border: '1.5px solid var(--ml-border-strong)', color: 'var(--ml-text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: 'pointer' }}>Done</button>
            </div>
        </div>
    )
}

// ─── POSE PREDICT MODAL ─────────────────────────────────────────────────────
function PosePredictModal({ onClose, onResult, detectorRef, knnRef, normalizeKeypoints }: {
    onClose: () => void
    onResult: (result: { label: string; confidences: Record<string, number> }) => void
    detectorRef: React.MutableRefObject<any>
    knnRef: React.MutableRefObject<KNNClassifier | null>
    normalizeKeypoints: (keypoints: number[][]) => number[]
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number | null>(null)
    const intervalRef = useRef<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState<{ label: string; confidences: Record<string, number> } | null>(null)
    const [noPose, setNoPose] = useState(false)

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
                        const poses = await detectorRef.current.estimatePoses(v)
                        if (poses.length > 0 && poses[0].keypoints) {
                            drawBodySkeleton(ctx, poses[0].keypoints.map((k: any) => [k.x, k.y, k.score ?? 0]), c.width, c.height, '#8b5cf6')
                        } else { ctx.clearRect(0, 0, c.width, c.height) }
                    } catch { /* busy */ }
                }
            }
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [loading, error, detectorRef])

    useEffect(() => {
        if (loading || error) return
        intervalRef.current = setInterval(async () => {
            const v = videoRef.current
            if (!v || !detectorRef.current || !knnRef.current) return
            if (!v.videoWidth || !v.videoHeight) return
            try {
                const poses = await detectorRef.current.estimatePoses(v)
                if (poses.length > 0 && poses[0].keypoints) {
                    setNoPose(false)
                    const keypoints = poses[0].keypoints.map((k: any) => [k.x, k.y, k.score ?? 0])
                    const normalized = normalizeKeypoints(keypoints)
                    if (normalized.length > 0) {
                        const r = await knnRef.current.predictFromData(new Float32Array(normalized), 3)
                        if (r) { setResult(r); onResult(r) }
                    }
                } else {
                    setNoPose(true)
                    setResult(null)
                }
            } catch { /* busy */ }
        }, 300)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [loading, error, detectorRef, knnRef, normalizeKeypoints, onResult])

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--ml-surface)', border: '1px solid var(--ml-border-strong)', borderRadius: 20, padding: 28, width: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: 'var(--ml-text-primary)', fontSize: 15 }}>
                            Predict — Show a pose
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
                            <div style={{ position: 'absolute', top: 10, right: 10, background: noPose ? '#6b7280' : '#22C55E', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: noPose ? 'none' : 'pulse 1.5s infinite' }} />
                                {noPose ? 'No pose' : 'LIVE'}
                            </div>
                        </div>
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
                                            <div style={{ height: '100%', width: `${(conf as number) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: 2, transition: 'width 0.2s' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '16px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ml-text-muted)' }}>
                                {noPose ? 'Show your full body to the camera' : 'Detecting…'}
                            </div>
                        )}
                    </>
                )}
                <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10, background: 'transparent', border: '1.5px solid var(--ml-border-strong)', color: 'var(--ml-text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: 'pointer' }}>Done</button>
            </div>
        </div>
    )
}

export default function PoseClassifier({ project, onBack, onDataChange }: PoseClassifierProps) {
    const [classes, setClasses] = useState<PoseClass[]>([
        { id: 1, name: 'Pose 1', samples: [] },
        { id: 2, name: 'Pose 2', samples: [] },
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
    const [poseDetReady, setPoseDetReady] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [restored, setRestored] = useState(false)
    const [accuracy, setAccuracy] = useState(0)
    const detectorRef = useRef<any>(null)
    const knnRef = useRef<KNNClassifier | null>(null)

    // Deserialize: restore from saved project on mount
    useEffect(() => {
        if (project?.classes?.length > 0 && !restored) {
            const restoredClasses: PoseClass[] = project.classes.map((c: any) => ({
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
                { id: 1, name: 'Pose 1', samples: [] },
                { id: 2, name: 'Pose 2', samples: [] },
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
                    color: COLORS[ci % COLORS.length]?.bg || '#22c55e',
                    samples: c.samples.map((kps, i) => ({
                        id: `pose-${c.id}-${i}`,
                        type: 'keypoints' as const,
                        data: JSON.stringify(kps),
                        timestamp: Date.now(),
                    })),
                })),
                modelTrained: trained,
                projectData: { nextId, epochs },
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [classes, trained, nextId, epochs, onDataChange])

    // Load MoveNet on demand (first camera open)
    const ensureDetector = useCallback(async () => {
        if (detectorRef.current) return detectorRef.current
        try {
            const poseDetection = await ensurePoseDetection()
            const detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
            )
            detectorRef.current = detector
            window._poseDetReady = true
            setPoseDetReady(true)
            return detector
        } catch (e) { console.error('Pose det load failed:', e); return null }
    }, [])

    const addPoseSample = useCallback((classId: number, keypoints: number[][]) => {
        setClasses(p => p.map(c => c.id === classId ? { ...c, samples: [...c.samples, keypoints] } : c))
    }, [])

    const normalizeKeypoints = useCallback((keypoints: number[][]): number[] => {
        const flat = keypoints.flat()
        if (flat.length === 0) return []
        const xs = keypoints.map(k => k[0])
        const ys = keypoints.map(k => k[1])
        const minX = Math.min(...xs), maxX = Math.max(...xs)
        const minY = Math.min(...ys), maxY = Math.max(...ys)
        const rangeX = (maxX - minX) || 1
        const rangeY = (maxY - minY) || 1
        return keypoints.map(k => [(k[0] - minX) / rangeX, (k[1] - minY) / rangeY, k[2] ?? 0]).flat()
    }, [])

    const handleTrain = async () => {
        if (!poseDetReady) {
            showToast('Pose detector is still loading. Please try again in a moment.', 'error')
            return
        }
        setStatus('training')
        setProgress(0)
        try {
            const knn = new KNNClassifier()
            knnRef.current = knn
            let loaded = 0
            const total = classes.reduce((s, c) => s + c.samples.length, 0)
            for (const cls of classes) {
                for (const kps of cls.samples) {
                    const normalized = normalizeKeypoints(kps)
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
                for (const kps of cls.samples) {
                    const normalized = normalizeKeypoints(kps)
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

    const startRename = (cls: PoseClass) => {
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
        setClasses(p => [...p, { id: nextId, name: `Pose ${nextId}`, samples: [] }])
        setNextId(n => n + 1)
    }

    // Ensure detector loaded when webcam or predict modal opens
    useEffect(() => {
        if (webcamFor !== null || showPredictModal) {
            ensureDetector()
        }
    }, [webcamFor, showPredictModal, ensureDetector])

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
                {/* Pose Cards Column */}
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
                                                    color: 'var(--ml-text-primary)',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    width: '100%',
                                                    outline: 'none'
                                                }}
                                            />
                                        ) : (
                                            <span style={{ color: 'var(--ml-text-primary)', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>{cls.name}</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {editingId === cls.id ? (
                                            <>
                                                <button onClick={commitRename} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ml-text-primary)' }}>
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ml-text-primary)' }}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startRename(cls)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ml-text-primary)', transition: 'all 0.2s ease' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteClass(cls.id)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ml-text-primary)', transition: 'all 0.2s ease' }}>
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
                                        background: `${color.bg}18`,
                                        color: color.bg,
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        fontFamily: "'DM Sans', sans-serif",
                                        marginBottom: 12
                                    }}>
                                        <Users size={12} />
                                        {cls.samples.length} pose sample{cls.samples.length !== 1 ? 's' : ''}
                                    </div>

                                    {/* Pose illustration + thumbnail grid */}
                                    <div style={{
                                        background: 'var(--ml-well)',
                                        borderRadius: 10,
                                        padding: 12,
                                        marginBottom: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12
                                    }}>
                                        <PoseIllustration poseIndex={i} size={40} />
                                        <div style={{ flex: 1 }}>
                                            {cls.samples.length > 0 ? (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {cls.samples.slice(-5).map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: 8,
                                                                background: `${color.bg}15`,
                                                                border: `1px solid ${color.border}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <PersonStanding size={16} style={{ color: color.bg }} />
                                                        </div>
                                                    ))}
                                                    {cls.samples.length > 5 && (
                                                        <div style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 8,
                                                            background: 'var(--ml-border)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 10,
                                                            color: 'var(--ml-text-secondary)',
                                                            fontFamily: "'DM Mono', monospace"
                                                        }}>
                                                            +{cls.samples.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--ml-border)', border: '1px solid #2a2a3d' }} />
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--ml-border)', border: '1px solid #2a2a3d' }} />
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--ml-border)', border: '1px solid #2a2a3d' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Webcam button */}
                                    <button
                                        onClick={() => setWebcamFor(cls.id)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            borderRadius: 10,
                                            border: `2px dashed ${color.border}`,
                                            background: 'transparent',
                                            color: 'var(--ml-text-secondary)',
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Camera size={14} />
                                        Webcam
                                    </button>
                                </div>
                            </div>
                        )
                    })}

                    {/* Add Class button */}
                    <AddClassButton onClick={addClass} accentColor="#22c55e" />
                </div>

                {/* Training Panel */}
                <TrainingPanel status={status} progress={progress} accuracy={accuracy} canTrain={canTrain}
                    onTrain={handleTrain} showAdvanced={showAdv} setShowAdvanced={setShowAdv}
                    epochs={epochs} setEpochs={setEpochs} trained={trained}
                    sampleCounts={Object.fromEntries(classes.map(c => [c.name, c.samples.length]))}
                    mlDescription="Using MoveNet pose estimation + KNN classifier. All computation runs in-browser — no data leaves your device." />

                {/* Divider */}
                <div style={{ width: 32, display: 'flex', alignItems: 'self-stretch', paddingTop: 64 }}>
                    <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)' }} />
                </div>

                {/* Testing Panel */}
                <ProjectTestingPanel
                    icon={<Activity size={16} className="text-white" />}
                    accentColor="#8b5cf6"
                    trained={trained}
                    emptyText="Train your pose model to start testing"
                    emptyIllustration={<PersonIllustration size={80} />}
                >
                    {/* Model ready indicator */}
                    <div style={{
                        background: 'var(--ml-success-bg)',
                        border: '1px solid #1a3a25',
                        borderRadius: 10,
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ml-success-dot)', boxShadow: '0 0 8px rgba(32,201,151,0.5)' }} />
                        <span style={{ color: 'var(--ml-success-text)', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>Model ready</span>
                    </div>

                    {/* Capture & Predict button */}
                    <button onClick={() => {
                        if (!knnRef.current) { showToast('Train your model first.', 'error'); return }
                        setShowPredictModal(true)
                    }} style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                        color: 'var(--ml-text-primary)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                        transition: 'all 0.2s ease'
                    }}>
                        <Camera size={14} />
                        Capture & Predict
                    </button>

                    {/* Prediction results */}
                    {testResult && (
                        <div>
                            <div style={{
                                background: 'rgba(139,92,246,0.1)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                borderRadius: 8,
                                padding: '8px 12px',
                                marginBottom: 12
                            }}>
                                <span style={{ color: '#a78bfa', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700 }}>Prediction</span>
                            </div>
                            {classes.map((cls, i) => {
                                const color = COLORS[i % COLORS.length]
                                const conf = testResult.confidences?.[cls.name] || 0
                                return (
                                    <div key={cls.id} style={{ marginBottom: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}>{cls.name}</span>
                                            <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{(conf * 100).toFixed(0)}%</span>
                                        </div>
                                        <div style={{ height: 4, background: 'var(--ml-border)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${conf * 100}%`, background: `linear-gradient(90deg, ${color.bg}, ${color.light})`, borderRadius: 2, transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Instructions when no result */}
                    {!testResult && (
                        <div style={{ textAlign: 'center', paddingTop: 8 }}>
                            <p style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Sans', sans-serif", fontSize: 11, lineHeight: 1.5 }}>
                                Point your webcam at a person to see pose predictions
                            </p>
                        </div>
                    )}
                </ProjectTestingPanel>
            </div>

            {/* Pose Webcam Modal */}
            {webcamFor !== null && (
                <PoseWebcamModal
                    classLabel={classes.find(c => c.id === webcamFor)?.name || 'Pose'}
                    color={COLORS[classes.findIndex(c => c.id === webcamFor) % COLORS.length] || COLORS[0]}
                    classId={webcamFor}
                    onCapture={addPoseSample}
                    onClose={() => setWebcamFor(null)}
                    detectorRef={detectorRef}
                />
            )}

            {/* Pose Predict Modal */}
            {showPredictModal && trained && (
                <PosePredictModal
                    onClose={() => setShowPredictModal(false)}
                    onResult={(r) => setTestResult(r)}
                    detectorRef={detectorRef}
                    knnRef={knnRef}
                    normalizeKeypoints={normalizeKeypoints}
                />
            )}
        </ClassifierLayout>
    )
}
