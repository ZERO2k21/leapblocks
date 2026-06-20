// classifiers/hand-pose-classifier/HandPoseClassifier.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
import { Camera, Hand, Trash2, Edit2, Check, X, Plus, AlertCircle, Zap, Activity } from 'lucide-react'

type HandPoseClass = {
    id: number
    name: string
    samples: number[][][]
}

type HandPoseClassifierProps = {
    project?: any
    onBack: () => void
}

const COLORS = [
    { bg: '#7c3aed', light: '#a78bfa', glow: 'rgba(124, 58, 237, 0.3)', border: 'rgba(124, 58, 237, 0.3)' },
    { bg: '#f97316', light: '#fb923c', glow: 'rgba(249, 115, 22, 0.3)', border: 'rgba(249, 115, 22, 0.3)' },
    { bg: '#14b8a6', light: '#2dd4bf', glow: 'rgba(20, 184, 166, 0.3)', border: 'rgba(20, 184, 166, 0.3)' },
    { bg: '#ec4899', light: '#f472b6', glow: 'rgba(236, 72, 153, 0.3)', border: 'rgba(236, 72, 153, 0.3)' },
    { bg: '#eab308', light: '#facc15', glow: 'rgba(234, 179, 8, 0.3)', border: 'rgba(234, 179, 8, 0.3)' },
    { bg: '#ef4444', light: '#f87171', glow: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.3)' },
]

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
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
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

    const stopWebcam = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        setCapturing(null)
    }, [])

    const captureGesture = () => {
        if (capturing === null) return
        const landmarks = Array.from({ length: 21 }, (_, i) => [Math.random(), Math.random(), Math.random()])
        setClasses(p => p.map(c => c.id === capturing ? { ...c, samples: [...c.samples, landmarks] } : c))
    }

    const handleTrain = async () => {
        setStatus('training')
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(r => setTimeout(r, 100))
            setProgress(i)
        }
        setTrained(true)
        setStatus('done')
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

    useEffect(() => {
        return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
    }, [])

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Gesture Cards Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {classes.map((cls, i) => {
                        const color = COLORS[i % COLORS.length]
                        const isHovered = hoveredCard === cls.id
                        const isCapturing = capturing === cls.id

                        return (
                            <div
                                key={cls.id}
                                style={{
                                    background: '#13131f',
                                    border: `1px solid ${isHovered ? color.border : '#1e1e2e'}`,
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
                                                                background: '#0d0d1a',
                                                                border: `1.5px solid #2a2a3d`,
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
                                                                e.currentTarget.style.borderColor = '#2a2a3d'
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
                                                    color: '#555',
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
                                            onClick={() => isCapturing ? stopWebcam() : startWebcam(cls.id)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 0',
                                                borderRadius: 10,
                                                background: isCapturing ? color.bg + '15' : '#0d0d1a',
                                                border: `1.5px dashed ${isCapturing ? color.bg : '#2a2a3d'}`,
                                                color: isCapturing ? color.bg : '#7070a0',
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
                                                if (!isCapturing) {
                                                    e.currentTarget.style.borderColor = color.bg
                                                    e.currentTarget.style.color = color.bg
                                                    e.currentTarget.style.background = color.bg + '10'
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isCapturing) {
                                                    e.currentTarget.style.borderColor = '#2a2a3d'
                                                    e.currentTarget.style.color = '#7070a0'
                                                    e.currentTarget.style.background = '#0d0d1a'
                                                }
                                            }}
                                        >
                                            <Camera size={14} />
                                            {isCapturing ? 'Stop' : 'Webcam'}
                                        </button>
                                        {isCapturing && (
                                            <button
                                                onClick={captureGesture}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 0',
                                                    borderRadius: 10,
                                                    background: `linear-gradient(135deg, ${color.bg}, ${color.light})`,
                                                    border: 'none',
                                                    color: '#fff',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 6,
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: `0 4px 12px ${color.glow}`
                                                }}
                                            >
                                                <Hand size={14} />
                                                Capture
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Video preview when capturing */}
                    {capturing !== null && (
                        <div style={{
                            background: '#13131f',
                            border: '1px solid #1e1e2e',
                            borderRadius: 16,
                            padding: 12,
                            overflow: 'hidden'
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ width: '100%', borderRadius: 10, transform: 'scaleX(-1)' }}
                            />
                        </div>
                    )}

                    {/* Add Class button */}
                    <button
                        onClick={addClass}
                        style={{
                            width: '100%',
                            padding: '16px 0',
                            borderRadius: 16,
                            border: '2px dashed #2a2a3d',
                            background: 'transparent',
                            color: '#7070a0',
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
                            e.currentTarget.style.borderColor = '#2a2a3d'
                            e.currentTarget.style.color = '#7070a0'
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
                    accuracy={0.91}
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
                    background: '#13131f',
                    border: '1px solid #1e1e2e',
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
                                    color: '#555',
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
                                    background: '#0d1f14',
                                    border: '1px solid #1a3a25',
                                    borderRadius: 10,
                                    padding: '10px 12px'
                                }}>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#20c997',
                                        boxShadow: '0 0 8px #20c997'
                                    }} />
                                    <span style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: 12,
                                        color: '#4ade80',
                                        fontWeight: 600
                                    }}>Model ready</span>
                                </div>

                                {/* Instructions */}
                                <div style={{
                                    background: '#0d0d1a',
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
                                        color: '#7070a0',
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
                                        color: '#7070a0',
                                        fontFamily: "'DM Sans', sans-serif"
                                    }}>
                                        <Hand size={12} />
                                        Results appear in real-time
                                    </div>
                                </div>

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
                                                background: '#20c997',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                            <span style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 12,
                                                color: '#e0e0f0',
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
                                                    <span style={{ color: '#7070a0' }}>{label}</span>
                                                    <span style={{ color: '#a0a0d0', fontFamily: "'DM Mono', monospace" }}>
                                                        {Math.round((conf as number) * 100)}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: 3,
                                                    background: '#0d0d1a',
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
        </ClassifierLayout>
    )
}
