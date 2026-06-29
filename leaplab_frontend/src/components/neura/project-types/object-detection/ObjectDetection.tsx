// classifiers/object-detection/ObjectDetection.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import StepIndicator from '../../components/StepIndicator'
import { ensureTf, ensureCocoSsd } from '../../ml/loadScript'
import { showToast } from '../../../../leapignite/client/components/Toast'

type Detection = {
    class: string
    score: number
    bbox: number[]
}

type ObjectDetectionProps = {
    project?: any
    onBack: () => void
    onDataChange?: (data: Record<string, any>) => void
}

const CLASS_COLORS: Record<string, string> = {
    person: '#3B82F6',
    car: '#F59E0B',
    truck: '#D97706',
    bus: '#F97316',
    motorcycle: '#EF4444',
    bicycle: '#10B981',
    cat: '#8B5CF6',
    dog: '#EC4899',
    bird: '#06B6D4',
    bottle: '#22C55E',
    chair: '#6366F1',
    couch: '#A855F7',
    tv: '#14B8A6',
    laptop: '#3B82F6',
    cell: '#F43F5E',
    keyboard: '#6366F1',
    mouse: '#6366F1',
    book: '#F59E0B',
    clock: '#06B6D4',
    vase: '#8B5CF6',
    scissors: '#EF4444',
    teddy: '#EC4899',
    hair: '#F59E0B',
    toothbrush: '#10B981',
    sink: '#6366F1',
    refrigerator: '#14B8A6',
    oven: '#F97316',
    microwave: '#F59E0B',
    toaster: '#EF4444',
    remote: '#6366F1',
    dining: '#A855F7',
    toilet: '#06B6D4',
    backpack: '#10B981',
    umbrella: '#F59E0B',
    handbag: '#A855F7',
    tie: '#EF4444',
    suitcase: '#F97316',
    frisbee: '#10B981',
    skis: '#3B82F6',
    snowboard: '#3B82F6',
    sports: '#EF4444',
    kite: '#F59E0B',
    baseball: '#10B981',
    skateboard: '#A855F7',
    surfboard: '#06B6D4',
    tennis: '#F59E0B',
    cup: '#F97316',
    fork: '#6366F1',
    knife: '#94A3B8',
    spoon: '#94A3B8',
    bowl: '#F59E0B',
    banana: '#F59E0B',
    apple: '#EF4444',
    sandwich: '#F97316',
    orange: '#F97316',
    broccoli: '#22C55E',
    carrot: '#F97316',
    hot: '#EF4444',
    pizza: '#F97316',
    donut: '#EC4899',
    cake: '#F59E0B',
    bed: '#14B8A6',
    potted: '#22C55E',
}
const DEFAULT_COLOR = '#F97316'

function getClassColor(cls: string): string {
    const lower = cls.toLowerCase()
    for (const [key, color] of Object.entries(CLASS_COLORS)) {
        if (lower.includes(key)) return color
    }
    return DEFAULT_COLOR
}

export default function ObjectDetection({ project, onBack, onDataChange }: ObjectDetectionProps) {
    const [modelReady, setModelReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadProgress, setLoadProgress] = useState(0)
    const [detections, setDetections] = useState<Detection[]>([])
    const [running, setRunning] = useState(false)
    const [fps, setFps] = useState(0)
    const [restored, setRestored] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const modelRef = useRef<any | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number | null>(null)
    const fpsFrames = useRef<number[]>([])

    // Deserialize: mark as restored on mount
    useEffect(() => {
        if (project && !restored) {
            setRestored(true)
        }
    }, [project])

    // Serialize: minimal state sync (pre-trained model, no custom classes)
    useEffect(() => {
        if (!restored || !onDataChange) return
        onDataChange({
            classes: [],
            modelTrained: modelReady,
            projectData: { model: 'coco-ssd' },
        })
    }, [modelReady])

    const loadModel = async () => {
        setLoading(true)
        setLoadProgress(0)
        try {
            // Start camera in parallel with model load so feed is warm when model is ready
            const streamPromise = navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            setLoadProgress(15)
            const [cocoSsd, stream] = await Promise.all([
                (async () => {
                    await ensureTf()
                    setLoadProgress(45)
                    const cs = await ensureCocoSsd()
                    setLoadProgress(70)
                    const model = await cs.load()
                    setLoadProgress(100)
                    return model
                })(),
                streamPromise.catch(() => null),
            ])
            modelRef.current = cocoSsd
            if (stream && videoRef.current) {
                streamRef.current = stream
                videoRef.current.srcObject = stream
            }
            setModelReady(true)
        } catch (e) { console.error('COCO-SSD load failed:', e) }
        setLoading(false)
    }

    const startDetection = async () => {
        try {
            if (!streamRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
                streamRef.current = stream
                if (videoRef.current) videoRef.current.srcObject = stream
            }
            setRunning(true)
            fpsFrames.current = []
            const detect = async () => {
                const v = videoRef.current, c = canvasRef.current
                if (!v || !c || !streamRef.current) return

                const now = performance.now()
                fpsFrames.current.push(now)
                fpsFrames.current = fpsFrames.current.filter(t => now - t < 1000)
                setFps(fpsFrames.current.length)

                const preds: any[] = await modelRef.current.detect(v)
                setDetections(preds)
                const ctx = c.getContext('2d')
                if (!ctx) return
                c.width = v.videoWidth; c.height = v.videoHeight
                ctx.clearRect(0, 0, c.width, c.height)
                preds.forEach((pred: any) => {
                    const [x, y, w, h] = pred.bbox
                    const color = getClassColor(pred.class)
                    const label = `${pred.class} ${Math.round(pred.score * 100)}%`

                    ctx.strokeStyle = color
                    ctx.lineWidth = 2.5
                    ctx.strokeRect(x, y, w, h)

                    const labelH = 22
                    const labelW = ctx.measureText(label).width + 12
                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.roundRect(x, y - labelH - 2, Math.max(labelW, w), labelH, [4, 4, 0, 0])
                    ctx.fill()

                    ctx.fillStyle = '#fff'
                    ctx.font = 'bold 11px "DM Sans", sans-serif'
                    ctx.fillText(label, x + 6, y - 7)
                })
                rafRef.current = requestAnimationFrame(detect)
            }
            if (videoRef.current) videoRef.current.onloadedmetadata = detect
        } catch { showToast('Camera access denied.', 'error') }
    }

    const stopDetection = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        streamRef.current?.getTracks().forEach(t => t.stop())
        setRunning(false); setDetections([]); setFps(0)
    }

    const captureSnapshot = useCallback(() => {
        const v = videoRef.current, c = canvasRef.current
        if (!v || !c) return
        const snap = document.createElement('canvas')
        snap.width = v.videoWidth; snap.height = v.videoHeight
        const ctx = snap.getContext('2d')
        if (!ctx) return
        ctx.drawImage(v, 0, 0)
        ctx.drawImage(c, 0, 0)
        const a = document.createElement('a')
        a.href = snap.toDataURL('image/png')
        a.download = `detection-${Date.now()}.png`
        a.click()
    }, [])

    useEffect(() => () => stopDetection(), [])

    const sortedDetections = [...detections].sort((a, b) => b.score - a.score)
    const uniqueClasses = [...new Set(detections.map(d => d.class))]

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;600&display=swap');
                @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: var(--ml-bg); }
                ::-webkit-scrollbar-thumb { background: var(--ml-border-strong); border-radius: 3px; }
            `}</style>

            <div className="flex-1 text-ml-text-primary font-sans min-h-0">
                <div className="mx-auto py-6 px-7 flex flex-col gap-5" style={{ maxWidth: 900 }}>

                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold uppercase" style={{ color: '#F97316', letterSpacing: '0.08em' }}>Object Detection</div>
                            <div className="text-[18px] font-bold text-ml-text-primary" style={{ letterSpacing: '-0.02em' }}>COCO-SSD Live Detector</div>
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-4">
                        <StepIndicator number="01" label="LOAD" title="Load Model" accentColor="#F97316" />
                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #F9731640, transparent)' }} />
                        <StepIndicator number="02" label="DETECT" title="Live Detection" accentColor="#F97316" />
                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #F9731640, transparent)' }} />
                        <StepIndicator number="03" label="RESULTS" title="View Results" accentColor="#F97316" />
                    </div>

                    {/* Model Loading Card */}
                    {!modelReady && (
                        <div className="bg-ml-surface border border-ml-border rounded-2xl p-10 flex flex-col items-center gap-4 animate-fade-in-scale neura-card-glow">
                            {/* Crosshair SVG */}
                            <div className="relative w-25 h-25 mb-2">
                                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                                    {/* Outer ring pulse */}
                                    <circle cx="50" cy="50" r="40" stroke="#F97316" strokeWidth="1.5" opacity="0.2">
                                        <animate attributeName="r" values="35;45;35" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    {/* Middle ring */}
                                    <circle cx="50" cy="50" r="28" stroke="#FB923C" strokeWidth="1.5" opacity="0.3">
                                        <animate attributeName="r" values="28;32;28" dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                    {/* Inner ring */}
                                    <circle cx="50" cy="50" r="16" stroke="#F97316" strokeWidth="2" opacity="0.5" />
                                    {/* Center dot */}
                                    <circle cx="50" cy="50" r="4" fill="#F97316">
                                        <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
                                    </circle>
                                    {/* Crosshair lines */}
                                    <line x1="50" y1="6" x2="50" y2="22" stroke="#F97316" strokeWidth="1.5" opacity="0.4" />
                                    <line x1="50" y1="78" x2="50" y2="94" stroke="#F97316" strokeWidth="1.5" opacity="0.4" />
                                    <line x1="6" y1="50" x2="22" y2="50" stroke="#F97316" strokeWidth="1.5" opacity="0.4" />
                                    <line x1="78" y1="50" x2="94" y2="50" stroke="#F97316" strokeWidth="1.5" opacity="0.4" />
                                    {/* Corner brackets */}
                                    <path d="M18 30 L18 18 L30 18" stroke="#FB923C" strokeWidth="2" fill="none" opacity="0.5" />
                                    <path d="M70 18 L82 18 L82 30" stroke="#FB923C" strokeWidth="2" fill="none" opacity="0.5" />
                                    <path d="M82 70 L82 82 L70 82" stroke="#FB923C" strokeWidth="2" fill="none" opacity="0.5" />
                                    <path d="M30 82 L18 82 L18 70" stroke="#FB923C" strokeWidth="2" fill="none" opacity="0.5" />
                                </svg>
                                {loading && (
                                    <div className="absolute inset-0 rounded-full" style={{ border: '3px solid transparent', borderTopColor: '#F97316', animation: 'spin 1s linear infinite' }} />
                                )}
                            </div>

                            <div className="text-center">
                                <div className="text-[17px] font-bold text-ml-text-primary mb-1.5">COCO-SSD Object Detection</div>
                                <div className="text-[13px] text-ml-text-secondary" style={{ lineHeight: 1.6, maxWidth: 400 }}>
                                    Detects 80+ common objects in real-time using a pre-trained model. No training needed — just load and point your camera.
                                </div>
                            </div>

                            {/* Feature pills with shimmer */}
                            <div className="flex gap-2 flex-wrap justify-center">
                                {['80+ Classes', 'Pre-trained', 'Real-time', 'In-browser'].map(f => (
                                    <span key={f} className="px-3 py-1 rounded-[20px] text-[11px] font-semibold neura-shimmer" style={{ background: '#F9731612', border: '1px solid #F9731630', color: '#FB923C', letterSpacing: '0.02em' }}>{f}</span>
                                ))}
                            </div>

                            {/* Load progress with premium bar */}
                            {loading && (
                                <div className="w-full" style={{ maxWidth: 320 }}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-xs text-ml-text-secondary">Loading model…</span>
                                        <span className="text-xs font-mono font-semibold" style={{ color: '#F97316' }}>{loadProgress}%</span>
                                    </div>
                                    <div className="neura-progress-premium">
                                        <div className="neura-progress-fill" style={{ width: `${loadProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            <button onClick={loadModel} disabled={loading}
                                className="px-8 py-[13px] rounded-xl border-0 font-sans font-bold text-sm flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: loading ? 'var(--ml-btn-idle)' : 'linear-gradient(135deg, #F97316, #FB923C)',
                                    color: loading ? 'var(--ml-text-muted)' : '#fff',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    letterSpacing: '-0.01em',
                                    boxShadow: loading ? 'none' : '0 4px 20px #F9731640',
                                }}>
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full" style={{ border: '2px solid var(--ml-text-disabled)', borderTopColor: '#F97316', animation: 'spin 0.8s linear infinite' }} />
                                        Loading…
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Load Detection Model
                                    </>
                                )}
                            </button>

                            <div className="text-[11px] text-ml-text-muted text-center">
                                Model size: ~10 MB · Powered by TensorFlow.js
                            </div>
                        </div>
                    )}

                    {/* Camera & Detection (when model ready) */}
                    {modelReady && (
                        <>
                            {/* Controls bar */}
                            <div className="flex items-center gap-3" style={{ animation: 'fade-in 0.3s ease' }}>
                                <button onClick={running ? stopDetection : startDetection}
                                    className="px-6 py-[11px] rounded-xl border-0 text-white font-sans font-bold text-[13px] cursor-pointer flex items-center gap-2 transition-all duration-200"
                                    style={{
                                        background: running ? 'linear-gradient(135deg, #EF4444, #F87171)' : 'linear-gradient(135deg, #F97316, #FB923C)',
                                        boxShadow: running ? '0 4px 20px #EF444440' : '0 4px 20px #F9731640',
                                    }}>
                                    {running ? (
                                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>Stop</>
                                    ) : (
                                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>Start Camera</>
                                    )}
                                </button>

                                {running && (
                                    <button onClick={captureSnapshot}
                                        className="px-5 py-[11px] rounded-xl border border-ml-border-strong bg-ml-btn-idle text-ml-text-secondary font-sans font-semibold text-[13px] cursor-pointer flex items-center gap-1.5 transition-all duration-200"
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F97316'; (e.currentTarget as HTMLButtonElement).style.color = '#F97316'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ml-border-strong)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ml-text-secondary)'; }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                        Snapshot
                                    </button>
                                )}

                                {/* Status badges */}
                                <div className="ml-auto flex gap-2 items-center">
                                    {running && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-ml-success-bg border border-ml-success-border">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-dot-pulse" />
                                            <span className="text-[11px] font-bold" style={{ color: '#22C55E', letterSpacing: '0.05em' }}>LIVE</span>
                                        </div>
                                    )}
                                    {running && (
                                        <div className="px-3 py-1.5 rounded-[10px] bg-ml-surface border border-ml-border text-[11px] text-ml-text-secondary font-mono font-semibold">
                                            {fps} FPS
                                        </div>
                                    )}
                                    {running && (
                                        <div className="px-3 py-1.5 rounded-[10px] text-[11px] font-bold" style={{ background: '#F9731612', border: '1px solid #F9731630', color: '#F97316' }}>
                                            {detections.length} object{detections.length !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Viewfinder */}
                            <div className="relative bg-ml-well border border-ml-border rounded-2xl overflow-hidden" style={{ minHeight: 360, animation: 'fade-in 0.3s ease' }}>
                                <video ref={videoRef} autoPlay playsInline muted className="w-full block" />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                                {/* Corner frame markers */}
                                {[
                                    { top: 12, left: 12, rotate: 'none' },
                                    { top: 12, right: 12, rotate: '90' },
                                    { bottom: 12, right: 12, rotate: '180' },
                                    { bottom: 12, left: 12, rotate: '270' },
                                ].map((pos, i) => (
                                    <div key={i} className="absolute w-7 h-7 pointer-events-none" style={{ ...pos } as any}>
                                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ transform: `rotate(${pos.rotate}deg)` }}>
                                            <path d="M2 10 L2 2 L10 2" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                                        </svg>
                                    </div>
                                ))}

                                {/* Idle overlay when not running */}
                                {!running && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(10,10,18,0.85)' }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                        <span className="text-[13px] text-ml-text-muted font-medium">Click "Start Camera" to begin detection</span>
                                    </div>
                                )}
                            </div>

                            {/* Detection Results Card */}
                            {detections.length > 0 && (
                                <div className="bg-ml-surface border border-ml-border rounded-2xl p-5 animate-slide-in-up neura-card-glow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-bold text-ml-text-secondary uppercase" style={{ letterSpacing: '0.05em' }}>Detected Objects</div>
                                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold animate-celebration" style={{ background: '#F9731618', color: '#F97316' }}>{detections.length}</span>
                                        </div>
                                        <div className="text-[11px] text-ml-text-muted">
                                            {uniqueClasses.length} unique class{uniqueClasses.length !== 1 ? 'es' : ''}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        {sortedDetections.map((d, i) => {
                                            const color = getClassColor(d.class)
                                            const pct = Math.round(d.score * 100)
                                            return (
                                                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-ml-well" style={{ transition: 'background 0.15s' }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--ml-btn-idle)'}
                                                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--ml-well)'}>
                                                    <div className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: color }} />
                                                    <span className="text-[13px] font-semibold text-ml-text-primary capitalize" style={{ minWidth: 80 }}>{d.class}</span>
                                                    <div className="flex-1 h-1.5 rounded-[3px] overflow-hidden" style={{ background: 'var(--ml-border)' }}>
                                                        <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}CC)`, transition: 'width 0.3s' }} />
                                                    </div>
                                                    <span className="text-xs text-ml-text-secondary font-mono font-semibold text-right" style={{ minWidth: 36 }}>{pct}%</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ClassifierLayout>
    )
}
