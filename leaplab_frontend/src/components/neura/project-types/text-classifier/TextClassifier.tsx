// classifiers/text-classifier/TextClassifier.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
import { KNNClassifier, ensureTf } from '../../ml/KNNClassifier'
import { Type, Trash2, Edit2, Check, X, Plus, FileText, AlignLeft, Hash, Sparkles, Send } from 'lucide-react'

type TextClass = {
    id: number
    name: string
    samples: string[]
}

type TestResult = {
    label: string
    confidences: Record<string, number>
}

type TextClassifierProps = {
    project?: any
    onBack: () => void
    onDataChange?: (data: Record<string, any>) => void
}

const COLORS = [
    { bg: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.3)', border: 'rgba(139, 92, 246, 0.3)' },
    { bg: '#f97316', light: '#fb923c', glow: 'rgba(249, 115, 22, 0.3)', border: 'rgba(249, 115, 22, 0.3)' },
    { bg: '#14b8a6', light: '#2dd4bf', glow: 'rgba(20, 184, 166, 0.3)', border: 'rgba(20, 184, 166, 0.3)' },
    { bg: '#ec4899', light: '#f472b6', glow: 'rgba(236, 72, 153, 0.3)', border: 'rgba(236, 72, 153, 0.3)' },
    { bg: '#3b82f6', light: '#60a5fa', glow: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.3)' },
    { bg: '#ef4444', light: '#f87171', glow: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.3)' },
]

// Text lines SVG illustration
function TextLinesIllustration({ color, sampleCount }: { color: typeof COLORS[0]; sampleCount: number }) {
    const lines = Math.min(sampleCount, 5)
    return (
        <div style={{
            background: '#0d0d1a',
            borderRadius: 10,
            padding: '10px 12px',
            marginBottom: 12
        }}>
            <svg width="100%" height={lines > 0 ? lines * 10 + 4 : 24} viewBox={`0 0 200 ${lines > 0 ? lines * 10 + 4 : 24}`} fill="none" style={{ display: 'block' }}>
                {lines > 0 ? (
                    Array.from({ length: lines }).map((_, i) => (
                        <rect
                            key={i}
                            x="0"
                            y={i * 10}
                            width={60 + (i * 15) % 80}
                            height="4"
                            rx="2"
                            fill={color.bg}
                            opacity={0.25 + i * 0.12}
                        />
                    ))
                ) : (
                    <>
                        <rect x="0" y="4" width="120" height="4" rx="2" fill="#2a2a3d" />
                        <rect x="0" y="14" width="80" height="4" rx="2" fill="#2a2a3d" opacity="0.6" />
                    </>
                )}
            </svg>
        </div>
    )
}

// Document SVG for testing panel idle state
function DocumentIllustration({ size = 80 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.8} viewBox="0 0 80 64" fill="none" style={{ opacity: 0.5 }}>
            {/* Document body */}
            <rect x="16" y="4" width="48" height="56" rx="4" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
            <rect x="16" y="4" width="48" height="12" rx="4" fill="#8b5cf6" opacity="0.1" />
            {/* Corner fold */}
            <path d="M52 4 L64 16 L52 16 Z" fill="#8b5cf6" opacity="0.15" />
            <path d="M52 4 L52 16 L64 16" stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.4" />
            {/* Text lines */}
            <rect x="24" y="22" width="32" height="3" rx="1.5" fill="#8b5cf6" opacity="0.4" />
            <rect x="24" y="30" width="24" height="3" rx="1.5" fill="#8b5cf6" opacity="0.3" />
            <rect x="24" y="38" width="28" height="3" rx="1.5" fill="#8b5cf6" opacity="0.4" />
            <rect x="24" y="46" width="16" height="3" rx="1.5" fill="#8b5cf6" opacity="0.3" />
            {/* Magnifying glass */}
            <circle cx="58" cy="50" r="8" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.5" />
            <line x1="64" y1="56" x2="70" y2="62" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
    )
}

export default function TextClassifier({ project, onBack, onDataChange }: TextClassifierProps) {
    const [classes, setClasses] = useState<TextClass[]>([
        { id: 1, name: 'Category 1', samples: [] },
        { id: 2, name: 'Category 2', samples: [] },
    ])
    const [nextId, setNextId] = useState(3)
    const [inputs, setInputs] = useState<Record<number, string>>({})
    const [trained, setTrained] = useState(false)
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState(0)
    const [showAdv, setShowAdv] = useState(false)
    const [epochs, setEpochs] = useState(30)
    const [testText, setTestText] = useState('')
    const [testResult, setTestResult] = useState<TestResult | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [focusedInput, setFocusedInput] = useState<number | null>(null)
    const [restored, setRestored] = useState(false)
    const [useReady, setUseReady] = useState(false)
    const [accuracy, setAccuracy] = useState(0)
    const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map())
    const encoderRef = useRef<any>(null)
    const knnRef = useRef<KNNClassifier | null>(null)

    // Deserialize: restore from saved project on mount
    useEffect(() => {
        if (project?.classes?.length > 0 && !restored) {
            const restoredClasses: TextClass[] = project.classes.map((c: any) => ({
                id: Number(c.id),
                name: c.name,
                samples: (c.samples || []).map((s: any) => s.data ?? s),
            }))
            setClasses(restoredClasses.length > 0 ? restoredClasses : [
                { id: 1, name: 'Category 1', samples: [] },
                { id: 2, name: 'Category 2', samples: [] },
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
                classes: classes.map(c => ({
                    id: String(c.id),
                    name: c.name,
                    color: COLORS[(c.id - 1) % COLORS.length]?.bg || '#8b5cf6',
                    samples: c.samples.map((text, i) => ({
                        id: `txt-${c.id}-${i}`,
                        type: 'text' as const,
                        data: text,
                        timestamp: Date.now(),
                    })),
                })),
                modelTrained: trained,
                projectData: { nextId, epochs },
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [classes, trained, nextId, epochs])

    const addSample = (classId: number) => {
        const text = inputs[classId]?.trim() ?? ''
        if (!text) return
        setClasses(p => p.map(c => c.id === classId ? { ...c, samples: [...c.samples, text] } : c))
        setInputs(p => ({ ...p, [classId]: '' }))
    }

    const removeSample = (classId: number, sampleIdx: number) => {
        setClasses(p => p.map(c => c.id === classId ? { ...c, samples: c.samples.filter((_, i) => i !== sampleIdx) } : c))
    }

    // Load Universal Sentence Encoder
    useEffect(() => {
        const load = async () => {
            try {
                if (useReady) return
                await ensureTf()
                const loadScript = (src: string) => new Promise<void>((res, rej) => {
                    const existing = document.querySelector(`script[src="${src}"]`)
                    if (existing) { res(); return }
                    const s = document.createElement('script')
                    s.src = src
                    s.onload = () => res()
                    s.onerror = () => rej(new Error(`Failed to load ${src}`))
                    document.head.appendChild(s)
                })
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/universal-sentence-encoder.min.js')
                encoderRef.current = await (window as any).use.load()
                setUseReady(true)
            } catch (e) { console.error('USE load failed:', e) }
        }
        load()
    }, [])

    const embedTexts = useCallback(async (texts: string[]): Promise<any> => {
        if (!encoderRef.current) return null
        return await encoderRef.current.embed(texts)
    }, [])

    const handleTrain = async () => {
        if (!useReady) return
        setStatus('training')
        setProgress(0)
        try {
            const knn = new KNNClassifier()
            knnRef.current = knn
            const allTexts: string[] = []
            const textToClass: { text: string; className: string }[] = []
            for (const cls of classes) {
                for (const sample of cls.samples) {
                    allTexts.push(sample)
                    textToClass.push({ text: sample, className: cls.name })
                }
            }
            if (allTexts.length === 0) { setStatus('idle'); return }
            const embeddings = await embedTexts(allTexts)
            let loaded = 0
            for (const item of textToClass) {
                const idx = allTexts.indexOf(item.text)
                const emb = embeddings.slice([idx, 0], [1, -1]).squeeze(0)
                await knn.addExample(emb, item.className)
                emb.dispose()
                loaded++
                setProgress(Math.round((loaded / allTexts.length) * 100))
                await new Promise(r => setTimeout(r, 5))
            }
            embeddings.dispose()

            let correct = 0, evaluated = 0
            for (const item of textToClass) {
                const emb = await embedTexts([item.text])
                const pred = await knn.predictClass(emb.slice([0, 0], [1, -1]).squeeze(0), 3)
                emb.dispose()
                if (pred && pred.label === item.className) correct++
                evaluated++
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

    const handlePredict = async () => {
        if (!testText.trim() || !trained || !knnRef.current || !encoderRef.current) return
        try {
            const embeddings = await embedTexts([testText.trim()])
            const emb = embeddings.slice([0, 0], [1, -1]).squeeze(0)
            const result = await knnRef.current.predictClass(emb, 3)
            emb.dispose()
            embeddings.dispose()
            if (result) setTestResult(result)
        } catch (e) { console.error('Prediction failed:', e) }
    }

    const canTrain = classes.filter(c => c.samples.length > 0).length >= 2

    const startRename = (cls: TextClass) => {
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
        setClasses(p => [...p, { id: nextId, name: `Category ${nextId}`, samples: [] }])
        setNextId(n => n + 1)
    }

    const totalSamples = classes.reduce((s, c) => s + c.samples.length, 0)
    const totalWords = classes.reduce((s, c) => s + c.samples.reduce((ws, sample) => ws + sample.split(/\s+/).length, 0), 0)

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Category Cards Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {classes.map((cls, i) => {
                        const color = COLORS[i % COLORS.length]
                        const isHovered = hoveredCard === cls.id
                        const sampleCount = cls.samples.length
                        const wordCount = cls.samples.reduce((s, sample) => s + sample.split(/\s+/).length, 0)

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
                                                <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
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
                                    {/* Stats badges */}
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            background: color.bg + '18',
                                            color: color.bg,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 700
                                        }}>
                                            <Type size={11} />
                                            {sampleCount} sample{sampleCount !== 1 ? 's' : ''}
                                        </div>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            background: '#0d0d1a',
                    color: '#7070a0',
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 600
                                        }}>
                                            <AlignLeft size={11} />
                                            {wordCount} word{wordCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    {/* Text lines illustration */}
                                    <TextLinesIllustration color={color} sampleCount={sampleCount} />

                                    {/* Sample tags */}
                                    {sampleCount > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                            {cls.samples.slice(-5).map((sample, idx) => {
                                                const actualIdx = cls.samples.length - 5 + idx
                                                const displayIdx = actualIdx >= 0 ? actualIdx : idx
                                                const wordCount = sample.split(/\s+/).length
                                                const isLong = sample.length > 40
                                                return (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            background: '#0d0d1a',
                                                            border: `1px solid ${color.bg}25`,
                                                            borderRadius: 20,
                                                            padding: '5px 10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            fontSize: 11,
                                                            color: '#a0a0d0',
                                                            fontFamily: "'DM Sans', sans-serif",
                                                            maxWidth: '100%',
                                                            transition: 'all 0.2s ease',
                                                            cursor: 'default'
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.borderColor = color.bg + '50'
                                                            e.currentTarget.style.background = color.bg + '08'
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.borderColor = color.bg + '25'
                                                            e.currentTarget.style.background = '#0d0d1a'
                                                        }}
                                                    >
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                                            {isLong ? sample.slice(0, 40) + '...' : sample}
                                                        </span>
                                                        <span style={{
                                                            background: color.bg + '20',
                                                            color: color.bg,
                                                            padding: '1px 5px',
                                                            borderRadius: 4,
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            flexShrink: 0
                                                        }}>
                                                            {wordCount}w
                                                        </span>
                                                        <button
                                                            onClick={() => removeSample(cls.id, displayIdx)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#555',
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                                display: 'flex',
                                                                borderRadius: 3,
                                                                transition: 'all 0.15s',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = '#555' }}
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                            {sampleCount > 5 && (
                                                <div style={{
                                                    background: color.bg + '12',
                                                    border: `1px solid ${color.bg}30`,
                                                    borderRadius: 20,
                                                    padding: '5px 10px',
                                                    fontSize: 10,
                                                    color: color.bg,
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    +{sampleCount - 5} more
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Text input */}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <input
                                                ref={el => { if (el) inputRefs.current.set(cls.id, el) }}
                                                type="text"
                                                placeholder="Type an example sentence..."
                                                value={inputs[cls.id] || ''}
                                                onChange={e => setInputs(p => ({ ...p, [cls.id]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && addSample(cls.id)}
                                                onFocus={() => setFocusedInput(cls.id)}
                                                onBlur={() => setFocusedInput(null)}
                                                style={{
                                                    width: '100%',
                                                    background: '#0d0d1a',
                                                    border: `1.5px solid ${focusedInput === cls.id ? color.bg : '#2a2a3d'}`,
                                                    borderRadius: 10,
                                                    padding: '10px 12px',
                                                    color: '#e0e0f0',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 12,
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: focusedInput === cls.id ? `0 0 0 3px ${color.bg}15` : 'none'
                                                }}
                                            />
                                            {(inputs[cls.id] || '').length > 0 && (
                                                <span style={{
                                                    position: 'absolute',
                                                    right: 10,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: 9,
                                                    color: '#555',
                                                    fontFamily: "'DM Mono', monospace"
                                                }}>
                                                    {(inputs[cls.id] || '').length}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => addSample(cls.id)}
                                            disabled={!(inputs[cls.id] || '').trim()}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: 10,
                                                background: (inputs[cls.id] || '').trim()
                                                    ? `linear-gradient(135deg, ${color.bg}, ${color.light})`
                                                    : '#1a1a2a',
                                            border: 'none',
                                                color: (inputs[cls.id] || '').trim() ? '#fff' : '#333',
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 12,
                                                fontWeight: 700,
                                                cursor: (inputs[cls.id] || '').trim() ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 5,
                                                transition: 'all 0.2s ease',
                                                boxShadow: (inputs[cls.id] || '').trim() ? `0 2px 8px ${color.glow}` : 'none'
                                            }}
                                        >
                                            <Plus size={13} strokeWidth={2.5} />
                                            Add
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
                            e.currentTarget.style.borderColor = '#8b5cf6'
                            e.currentTarget.style.color = '#a78bfa'
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
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
                    <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, #8b5cf640, transparent)' }} />
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
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <FileText size={16} style={{ color: '#fff' }} />
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
                                <DocumentIllustration />
                                <p style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 12,
                                    color: '#555',
                                    lineHeight: 1.6,
                                    margin: '12px 0 0'
                                }}>
                                    Train your text model first.
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

                                {/* Textarea */}
                                <textarea
                                    value={testText}
                                    onChange={e => setTestText(e.target.value)}
                                    placeholder="Type text to classify..."
                                    style={{
                                        width: '100%',
                                        background: '#0d0d1a',
                                        border: '1.5px solid #2a2a3d',
                                        borderRadius: 10,
                                        padding: '10px 12px',
                                        color: '#e0e0f0',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: 12,
                                        outline: 'none',
                                        resize: 'none',
                                        height: 80,
                                        transition: 'border-color 0.2s ease'
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#8b5cf6' }}
                                    onBlur={e => { e.currentTarget.style.borderColor = '#2a2a3d' }}
                                />

                                {/* Character count */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 10,
                                    color: '#555',
                                    marginTop: -8
                                }}>
                                    <span>{testText.length} characters</span>
                                    <span>{testText.split(/\s+/).filter(Boolean).length} words</span>
                                </div>

                                {/* Predict button */}
                                <button
                                    onClick={handlePredict}
                                    disabled={!testText.trim()}
                                    style={{
                                        width: '100%',
                                        padding: '11px 0',
                                        borderRadius: 10,
                                        background: testText.trim()
                                            ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
                                            : '#1a1a2a',
                                        border: 'none',
                                        color: testText.trim() ? '#fff' : '#333',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        cursor: testText.trim() ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        transition: 'all 0.2s ease',
                                        boxShadow: testText.trim() ? '0 4px 14px rgba(139, 92, 246, 0.25)' : 'none'
                                    }}
                                >
                                    <Send size={14} />
                                    Predict
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
                                                color: '#e0e0f0',
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
                                                        <span style={{ color: '#7070a0', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                                                        <span style={{ color: '#a0a0d0', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                                                            {Math.round(conf * 100)}%
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        height: 4,
                                                        background: '#0d0d1a',
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ClassifierLayout>
    )
}
