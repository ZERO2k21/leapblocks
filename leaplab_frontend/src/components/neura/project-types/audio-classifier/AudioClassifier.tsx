// classifiers/audio-classifier/AudioClassifier.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
import AddClassButton from '../../components/AddClassButton'
import ProjectTestingPanel from '../../components/ProjectTestingPanel'
import { AudioModel, blobToMelSpectrogram } from './AudioModel'
import { ensureTf } from '../../ml/loadScript'
import { showToast } from '../../../../leapignite/client/components/Toast'
import { Mic, MicOff, Trash2, Edit2, Check, X, Plus, Volume2, Waves, Square, Activity, Play, Pause } from 'lucide-react'

function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

function dataURLToBlob(dataURL: string): Blob {
    const [header, data] = dataURL.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'audio/webm'
    const binary = atob(data)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
    return new Blob([array], { type: mime })
}

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
    onDataChange?: (data: Record<string, any>) => void
}

const COLORS = [
    { bg: '#ec4899', light: '#f472b6', glow: 'rgba(236, 72, 153, 0.3)', border: 'rgba(236, 72, 153, 0.3)' },
    { bg: '#14b8a6', light: '#2dd4bf', glow: 'rgba(20, 184, 166, 0.3)', border: 'rgba(20, 184, 166, 0.3)' },
    { bg: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.3)', border: 'rgba(139, 92, 246, 0.3)' },
    { bg: '#f97316', light: '#fb923c', glow: 'rgba(249, 115, 22, 0.3)', border: 'rgba(249, 115, 22, 0.3)' },
    { bg: '#3b82f6', light: '#60a5fa', glow: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.3)' },
    { bg: '#ef4444', light: '#f87171', glow: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.3)' },
]

// Audio waveform SVG illustration
function WaveformIllustration({ color, isRecording = false, sampleCount = 0 }: { color: typeof COLORS[0]; isRecording?: boolean; sampleCount?: number }) {
    const bars = 24
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            height: 48,
            padding: '8px 0'
        }}>
            {Array.from({ length: bars }).map((_, i) => {
                const baseHeight = sampleCount > 0
                    ? 8 + Math.sin(i * 0.8) * 12 + Math.random() * 8
                    : 4 + Math.sin(i * 0.5) * 6
                const height = isRecording ? baseHeight + Math.sin(Date.now() * 0.01 + i) * 10 : baseHeight
                return (
                    <div
                        key={i}
                        style={{
                            width: 3,
                            height: Math.max(4, height),
                            background: `linear-gradient(180deg, ${color.light}, ${color.bg})`,
                            borderRadius: 2,
                            opacity: isRecording ? 0.9 : 0.5,
                            transition: 'height 0.15s ease, opacity 0.3s ease',
                            animation: isRecording ? `wavePulse 0.5s ease-in-out ${i * 0.03}s infinite alternate` : 'none'
                        }}
                    />
                )
            })}
            <style>{`
                @keyframes wavePulse {
                    from { transform: scaleY(0.7); }
                    to { transform: scaleY(1.3); }
                }
            `}</style>
        </div>
    )
}

// Microphone SVG for testing panel
function MicrophoneIllustration({ size = 80 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.8} viewBox="0 0 80 64" fill="none" style={{ opacity: 0.5 }}>
            {/* Microphone body */}
            <rect x="32" y="8" width="16" height="28" rx="8" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
            <rect x="35" y="12" width="10" height="12" rx="5" fill="#8b5cf6" opacity="0.2" />
            {/* Stand */}
            <path d="M24 32 C24 44 40 48 40 48 C40 48 56 44 56 32" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
            <line x1="40" y1="48" x2="40" y2="56" stroke="#8b5cf6" strokeWidth="1.5" />
            <line x1="32" y1="56" x2="48" y2="56" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
            {/* Sound waves */}
            <path d="M60 20 C64 24 64 32 60 36" stroke="#8b5cf6" strokeWidth="1.2" opacity="0.4" fill="none" />
            <path d="M66 16 C72 22 72 34 66 40" stroke="#8b5cf6" strokeWidth="1.2" opacity="0.3" fill="none" />
            <path d="M12 20 C8 24 8 32 12 36" stroke="#8b5cf6" strokeWidth="1.2" opacity="0.4" fill="none" />
            <path d="M6 16 C0 22 0 34 6 40" stroke="#8b5cf6" strokeWidth="1.2" opacity="0.3" fill="none" />
        </svg>
    )
}

export default function AudioClassifier({ project, onBack, onDataChange }: AudioClassifierProps) {
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
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [testRecording, setTestRecording] = useState(false)
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)
    const [restored, setRestored] = useState(false)
    const [accuracy, setAccuracy] = useState(0)
    const mediaRecRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const testRecRef = useRef<MediaRecorder | null>(null)
    const testChunks = useRef<Blob[]>([])
    const modelRef = useRef<AudioModel | null>(null)

    // Deserialize: restore from saved project on mount
    useEffect(() => {
        if (project?.classes?.length > 0 && !restored) {
            const restoredClasses: AudioClass[] = project.classes.map((c: any) => ({
                id: Number(c.id),
                name: c.name,
                samples: (c.samples || []).map((s: any) => s.data ?? s),
            }))
            setClasses(restoredClasses.length > 0 ? restoredClasses : [
                { id: 1, name: 'Sound 1', samples: [] },
                { id: 2, name: 'Sound 2', samples: [] },
            ])
            setNextId(restoredClasses.length > 0 ? Math.max(...restoredClasses.map(c => c.id)) + 1 : 3)
            setTrained(project.modelTrained || false)
            if (project.projectData?.epochs) setEpochs(project.projectData.epochs)
            setRestored(true)
        }
    }, [project])

    // Serialize: sync state back to parent (debounced, async for blob→base64)
    useEffect(() => {
        if (!restored || !onDataChange) return
        const timer = setTimeout(async () => {
            const serializedClasses = await Promise.all(classes.map(async (c, ci) => ({
                id: String(c.id),
                name: c.name,
                color: COLORS[ci % COLORS.length]?.bg || '#ec4899',
                samples: await Promise.all(c.samples.map(async (sample, i) => {
                    if (sample.startsWith('data:')) {
                        return { id: `aud-${c.id}-${i}`, type: 'audio' as const, data: sample, timestamp: Date.now() }
                    }
                    try {
                        if (sample.startsWith('blob:')) {
                            const resp = await fetch(sample)
                            const blob = await resp.blob()
                            const base64 = await blobToDataURL(blob)
                            return { id: `aud-${c.id}-${i}`, type: 'audio' as const, data: base64, timestamp: Date.now() }
                        }
                        return { id: `aud-${c.id}-${i}`, type: 'audio' as const, data: sample, timestamp: Date.now() }
                    } catch {
                        return { id: `aud-${c.id}-${i}`, type: 'audio' as const, data: '', timestamp: Date.now() }
                    }
                })),
            })))
            onDataChange({
                classes: serializedClasses,
                modelTrained: trained,
                projectData: { nextId, epochs },
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [classes, trained, nextId, epochs])

    const startRecording = async (classId: number) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            chunksRef.current = []
            mediaRecRef.current = new MediaRecorder(stream)
            mediaRecRef.current.ondataavailable = (e: BlobEvent) => chunksRef.current.push(e.data)
            mediaRecRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = await blobToDataURL(blob)
                setClasses(p => p.map(c => c.id === classId ? { ...c, samples: [...c.samples, url] } : c))
                stream.getTracks().forEach(t => t.stop())
            }
            mediaRecRef.current.start()
            setRecording(classId)
        } catch {
            showToast('Microphone access denied.', 'error')
        }
    }

    const stopRecording = useCallback(() => {
        mediaRecRef.current?.stop()
        setRecording(null)
    }, [])

    const addClass = () => {
        setClasses(p => [...p, { id: nextId, name: `Sound ${nextId}`, samples: [] }])
        setNextId(n => n + 1)
    }

    const handleTrain = async () => {
        setStatus('training')
        setProgress(0)
        try {
            await ensureTf()
            const model = new AudioModel()
            modelRef.current = model
            let loaded = 0
            const total = classes.reduce((s, c) => s + c.samples.length, 0)
            for (const cls of classes) {
                for (const sampleUrl of cls.samples) {
                    try {
                        const blob = sampleUrl.startsWith('data:')
                            ? dataURLToBlob(sampleUrl)
                            : await (await fetch(sampleUrl)).blob()
                        const spectrogram = await blobToMelSpectrogram(blob)
                        if (spectrogram && spectrogram.length > 0) {
                            model.addSample(cls.name, spectrogram)
                        }
                    } catch (e) { console.warn('Failed to process sample:', e) }
                    loaded++
                    setProgress(Math.round((loaded / total) * 50))
                }
            }

            const acc = await model.train((p) => {
                setProgress(50 + Math.round(p * 0.5))
            }, 20)
            setAccuracy(acc)
            setTrained(true)
            setStatus('done')
        } catch (e) {
            console.error('Training failed:', e)
            setStatus('idle')
        }
    }

    const handleTestRecord = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            testChunks.current = []
            testRecRef.current = new MediaRecorder(stream)
            testRecRef.current.ondataavailable = (e: BlobEvent) => testChunks.current.push(e.data)
            testRecRef.current.onstop = async () => {
                const blob = new Blob(testChunks.current, { type: 'audio/webm' })
                if (modelRef.current) {
                    try {
                        const spectrogram = await blobToMelSpectrogram(blob)
                        if (spectrogram && spectrogram.length > 0) {
                            const result = await modelRef.current.predict(spectrogram)
                            if (result) setTestResult(result)
                        }
                    } catch (e) { console.error('Prediction failed:', e) }
                }
                stream.getTracks().forEach(t => t.stop())
                setTestRecording(false)
            }
            testRecRef.current.start()
            setTestRecording(true)
            setTimeout(() => { testRecRef.current?.stop() }, 2000)
        } catch {
            showToast('Microphone access denied.', 'error')
        }
    }

    const canTrain = classes.filter(c => c.samples.length > 0).length >= 2

    const startRename = (cls: AudioClass) => {
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

    const deleteSample = (classId: number, sampleIndex: number) => {
        setClasses(p => p.map(c => c.id === classId ? { ...c, samples: c.samples.filter((_, i) => i !== sampleIndex) } : c))
    }

    useEffect(() => {
        return () => {
            mediaRecRef.current?.stop()
            testRecRef.current?.stop()
        }
    }, [])

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
                {/* Sound Cards Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {classes.map((cls, i) => {
                        const color = COLORS[i % COLORS.length]
                        const isHovered = hoveredCard === cls.id
                        const isRecording = recording === cls.id

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
                                            <span style={{
                                                color: 'var(--ml-text-primary)',
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
                                                <button onClick={commitRename} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--ml-text-primary)', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--ml-text-primary)', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startRename(cls)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--ml-text-primary)', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteClass(cls.id)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--ml-text-primary)', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div style={{ padding: 16 }}>
                                    {/* Recording count badge */}
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
                                        <Volume2 size={12} />
                                        {cls.samples.length} recording{cls.samples.length !== 1 ? 's' : ''}
                                    </div>

                                    {/* Waveform illustration */}
                                    <div style={{
                                        background: 'var(--ml-well)',
                                        borderRadius: 10,
                                        padding: '4px 8px',
                                        marginBottom: 12
                                    }}>
                                        <WaveformIllustration
                                            color={color}
                                            isRecording={isRecording}
                                            sampleCount={cls.samples.length}
                                        />
                                    </div>

                                    {/* Audio sample list */}
                                    {cls.samples.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                            {cls.samples.slice(-3).map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        background: 'var(--ml-well)',
                                                        borderRadius: 8,
                                                        padding: '6px 10px',
                                                        border: '1px solid var(--ml-border)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.borderColor = color.bg + '40'
                                                        e.currentTarget.style.background = color.bg + '08'
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.borderColor = 'var(--ml-border)'
                                                        e.currentTarget.style.background = 'var(--ml-well)'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 6,
                                                        background: color.bg + '20',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <Waves size={12} style={{ color: color.bg }} />
                                                    </div>
                                                    <audio
                                                        src={url}
                                                        controls
                                                        style={{ height: 28, flex: 1, maxWidth: 180 }}
                                                    />
                                                    <button
                                                        onClick={() => deleteSample(cls.id, cls.samples.length - 3 + idx)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--ml-text-muted)',
                                                            cursor: 'pointer',
                                                            padding: 4,
                                                            display: 'flex',
                                                            borderRadius: 4,
                                                            transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--ml-error-text)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ml-text-muted)'; e.currentTarget.style.background = 'transparent' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {cls.samples.length > 3 && (
                                                <div style={{
                                                    fontSize: 11,
                                                    color: 'var(--ml-text-secondary)',
                                                    textAlign: 'center',
                                                    padding: '2px 0'
                                                }}>
                                                    +{cls.samples.length - 3} more recording{cls.samples.length - 3 !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Record button */}
                                    <button
                                        onMouseDown={() => startRecording(cls.id)}
                                        onMouseUp={stopRecording}
                                        onMouseEnter={e => {
                                            if (!isRecording) {
                                                e.currentTarget.style.borderColor = color.bg
                                                e.currentTarget.style.color = color.bg
                                                e.currentTarget.style.background = color.bg + '10'
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            stopRecording()
                                            if (!isRecording) {
                                                e.currentTarget.style.borderColor = 'var(--ml-border-strong)'
                                                e.currentTarget.style.color = 'var(--ml-text-secondary)'
                                                e.currentTarget.style.background = 'var(--ml-well)'
                                            }
                                        }}
                                        onTouchStart={() => startRecording(cls.id)}
                                        onTouchEnd={stopRecording}
                                        style={{
                                            width: '100%',
                                            padding: '10px 0',
                                            borderRadius: 10,
                                            background: isRecording
                                                ? `linear-gradient(135deg, #ef4444, #f87171)`
                                                : 'var(--ml-well)',
                                            border: `1.5px dashed ${isRecording ? 'var(--ml-error-text)' : 'var(--ml-border-strong)'}`,
                                            color: isRecording ? 'var(--ml-text-primary)' : 'var(--ml-text-secondary)',
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            transition: 'all 0.2s ease',
                                            boxShadow: isRecording ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                                        }}
                                    >
                                        {isRecording ? (
                                            <>
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: '#fff',
                                                    animation: 'pulse 1s infinite'
                                                }} />
                                                Recording...
                                            </>
                                        ) : (
                                            <>
                                                <Mic size={14} />
                                                Hold to Record
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    })}

                    {/* Add Class button */}
                    <AddClassButton onClick={addClass} accentColor="#8b5cf6" />
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
                    mlDescription="Using CNN-based audio feature extraction + KNN classifier. All computation runs in-browser — no data leaves your device."
                />

                {/* Divider */}
                <div style={{ width: 32, display: 'flex', alignItems: 'center', paddingTop: 64 }}>
                    <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, #8b5cf640, transparent)' }} />
                </div>

                {/* Testing Panel */}
                <ProjectTestingPanel
                    icon={<Waves size={16} className="text-white" />}
                    accentColor="#8b5cf6"
                    trained={trained}
                    emptyText="Train a model first to test it here."
                    emptyIllustration={<MicrophoneIllustration />}
                >
                    {/* Success indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--ml-success-bg)',
                        border: '1px solid #1a3a25',
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

                    {/* Record button */}
                    <button
                        onClick={handleTestRecord}
                        disabled={testRecording}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            borderRadius: 10,
                            background: testRecording
                                ? 'linear-gradient(135deg, #ef4444, #f87171)'
                                : 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                            border: 'none',
                            color: 'var(--ml-text-primary)',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: testRecording ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s ease',
                            boxShadow: testRecording
                                ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                                : '0 4px 14px rgba(139, 92, 246, 0.25)'
                        }}
                    >
                        {testRecording ? (
                            <>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    animation: 'pulse 1s infinite'
                                }} />
                                Recording 2s...
                            </>
                        ) : (
                            <>
                                <Mic size={15} />
                                Record 2s & Predict
                            </>
                        )}
                    </button>

                    {/* Prediction results */}
                    {testResult && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Prediction label */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                borderRadius: 10,
                                padding: '10px 12px'
                            }}>
                                <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 11,
                                    color: '#a78bfa',
                                    fontWeight: 600
                                }}>Prediction</span>
                                <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 13,
                                    color: 'var(--ml-text-primary)',
                                    fontWeight: 700
                                }}>{testResult.label}</span>
                            </div>

                            {/* Confidence bars */}
                            {Object.entries(testResult.confidences).map(([label, conf]) => {
                                const classIdx = classes.findIndex(c => c.name === label)
                                const color = COLORS[classIdx >= 0 ? classIdx % COLORS.length : 0]
                                return (
                                    <div key={label}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: 11,
                                            marginBottom: 4
                                        }}>
                                            <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                                            <span style={{ color: 'var(--ml-text-secondary)', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                                                {Math.round(conf * 100)}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: 4,
                                            background: 'var(--ml-well)',
                                            borderRadius: 2,
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${conf * 100}%`,
                                                background: `linear-gradient(90deg, ${color.bg}, ${color.light})`,
                                                borderRadius: 2,
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ProjectTestingPanel>
            </div>
        </ClassifierLayout>
    )
}
