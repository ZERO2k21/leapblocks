// classifiers/text-classifier/TextClassifier.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'
import { KNNClassifier } from '../../ml/KNNClassifier'
import { ensureUSE } from '../../ml/loadScript'
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
        <div className="bg-ml-well rounded-[10px] px-3 py-2.5 mb-3">
            <svg width="100%" height={lines > 0 ? lines * 10 + 4 : 24} viewBox={`0 0 200 ${lines > 0 ? lines * 10 + 4 : 24}`} fill="none" className="block">
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
        <svg width={size} height={size * 0.8} viewBox="0 0 80 64" fill="none" className="opacity-50">
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
                const encoder = await ensureUSE()
                encoderRef.current = await encoder.load()
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
            let idx = 0
            for (const item of textToClass) {
                const emb = embeddings.slice([idx, 0], [1, -1]).squeeze(0)
                await knn.addExample(emb, item.className)
                emb.dispose()
                loaded++
                idx++
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
            <div className="flex gap-6 items-stretch flex-1 min-h-0">
                {/* Category Cards Column */}
                <div className="flex-1 flex flex-col gap-4">
                    {classes.map((cls, i) => {
                        const color = COLORS[i % COLORS.length]
                        const isHovered = hoveredCard === cls.id
                        const sampleCount = cls.samples.length
                        const wordCount = cls.samples.reduce((s, sample) => s + sample.split(/\s+/).length, 0)

                        return (
                            <div
                                key={cls.id}
                                className="bg-ml-surface border rounded-2xl overflow-hidden transition-all duration-300"
                                style={{
                                    borderColor: isHovered ? color.border : 'var(--ml-border)',
                                    transform: isHovered ? 'translateY(-2px)' : 'none',
                                    boxShadow: isHovered ? `0 8px 24px ${color.glow}` : 'none'
                                }}
                                onMouseEnter={() => setHoveredCard(cls.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                {/* Gradient Header */}
                                <div
                                    className="px-4 py-3 flex items-center justify-between neura-shimmer"
                                    style={{ background: `linear-gradient(135deg, ${color.bg} 0%, ${color.light} 100%)` }}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {editingId === cls.id ? (
                                            <input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && commitRename()}
                                                autoFocus
                                                className="border-none rounded-md text-ml-text-primary font-sans text-sm font-semibold w-full outline-none"
                                                style={{ background: 'rgba(0,0,0,0.25)', padding: '3px 8px' }}
                                            />
                                        ) : (
                                            <span className="text-ml-text-primary font-sans font-bold text-sm truncate" style={{ letterSpacing: '-0.01em', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                                                {cls.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        {editingId === cls.id ? (
                                            <>
                                                <button onClick={commitRename} className="border-none rounded-md cursor-pointer text-ml-text-primary flex items-center transition-colors duration-150" style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 6px' }}>
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="border-none rounded-md cursor-pointer text-ml-text-primary flex items-center transition-colors duration-150" style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 6px' }}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startRename(cls)} className="border-none rounded-md cursor-pointer text-ml-text-primary flex items-center transition-colors duration-150" style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 6px' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteClass(cls.id)} className="border-none rounded-md cursor-pointer text-ml-text-primary flex items-center transition-colors duration-150" style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 6px' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-4">
                                    {/* Stats badges */}
                                    <div className="flex gap-2 mb-3">
                                        <div className="inline-flex items-center rounded-lg text-[11px] font-sans font-bold" style={{ gap: 5, background: color.bg + '18', color: color.bg, padding: '4px 10px' }}>
                                            <Type size={11} />
                                            {sampleCount} sample{sampleCount !== 1 ? 's' : ''}
                                        </div>
                                        <div className="inline-flex items-center bg-ml-well text-ml-text-secondary rounded-lg text-[11px] font-sans font-semibold" style={{ gap: 5, padding: '4px 10px' }}>
                                            <AlignLeft size={11} />
                                            {wordCount} word{wordCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    {/* Text lines illustration */}
                                    <TextLinesIllustration color={color} sampleCount={sampleCount} />

                                    {/* Sample tags */}
                                    {sampleCount > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {cls.samples.slice(-5).map((sample, idx) => {
                                                const actualIdx = cls.samples.length - 5 + idx
                                                const displayIdx = actualIdx >= 0 ? actualIdx : idx
                                                const wordCount = sample.split(/\s+/).length
                                                const isLong = sample.length > 40
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-ml-well rounded-[20px] flex items-center gap-1.5 text-[11px] text-ml-text-secondary font-sans max-w-full transition-all duration-200 cursor-default"
                                                        style={{ border: `1px solid ${color.bg}25`, padding: '5px 10px' }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.borderColor = color.bg + '50'
                                                            e.currentTarget.style.background = color.bg + '08'
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.borderColor = color.bg + '25'
                                                            e.currentTarget.style.background = 'var(--ml-well)'
                                                        }}
                                                    >
                                                        <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ maxWidth: 140 }}>
                                                            {isLong ? sample.slice(0, 40) + '...' : sample}
                                                        </span>
                                                        <span className="rounded text-[9px] font-bold shrink-0" style={{ background: color.bg + '20', color: color.bg, padding: '1px 5px' }}>
                                                            {wordCount}w
                                                        </span>
                                                        <button
                                                            onClick={() => removeSample(cls.id, displayIdx)}
                                                            className="bg-transparent border-none cursor-pointer p-0 flex rounded-[3px] transition-all duration-150 shrink-0"
                                                            style={{ color: 'var(--ml-text-muted)' }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--ml-error-text)' }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ml-text-muted)' }}
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                            {sampleCount > 5 && (
                                                <div className="rounded-[20px] text-[10px] font-bold flex items-center" style={{ background: color.bg + '12', border: `1px solid ${color.bg}30`, padding: '5px 10px', color: color.bg }}>
                                                    +{sampleCount - 5} more
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Text input */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                ref={el => { if (el) inputRefs.current.set(cls.id, el) }}
                                                type="text"
                                                placeholder="Type an example sentence..."
                                                value={inputs[cls.id] || ''}
                                                onChange={e => setInputs(p => ({ ...p, [cls.id]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && addSample(cls.id)}
                                                onFocus={() => setFocusedInput(cls.id)}
                                                onBlur={() => setFocusedInput(null)}
                                                className="w-full bg-ml-well rounded-[10px] px-3 py-2.5 text-ml-text-primary font-sans text-xs outline-none transition-all duration-200"
                                                style={{
                                                    border: `1.5px solid ${focusedInput === cls.id ? color.bg : 'var(--ml-border-strong)'}`,
                                                    boxShadow: focusedInput === cls.id ? `0 0 0 3px ${color.bg}15` : 'none'
                                                }}
                                            />
                                            {(inputs[cls.id] || '').length > 0 && (
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-ml-text-muted font-mono">
                                                    {(inputs[cls.id] || '').length}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => addSample(cls.id)}
                                            disabled={!(inputs[cls.id] || '').trim()}
                                            className="px-4 py-2.5 rounded-[10px] border-none font-sans text-xs font-bold flex items-center transition-all duration-200"
                                            style={{
                                                background: (inputs[cls.id] || '').trim()
                                                    ? `linear-gradient(135deg, ${color.bg}, ${color.light})`
                                                    : 'var(--ml-btn-idle)',
                                                color: (inputs[cls.id] || '').trim() ? 'var(--ml-text-primary)' : 'var(--ml-text-disabled)',
                                                cursor: (inputs[cls.id] || '').trim() ? 'pointer' : 'not-allowed',
                                                gap: 5,
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
                        className="w-full py-4 rounded-2xl text-ml-text-secondary font-sans text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-200"
                        style={{ border: '2px dashed var(--ml-border-strong)', background: 'transparent' }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#8b5cf6'
                            e.currentTarget.style.color = '#a78bfa'
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
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
                <div className="w-8 flex items-center pt-16">
                    <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf640, transparent)' }} />
                </div>

                {/* Testing Panel */}
                <div className="w-64 bg-ml-surface border border-ml-border rounded-2xl overflow-hidden shrink-0">
                    {/* Header */}
                    <div className="px-4 py-3.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}>
                        <FileText size={16} className="text-ml-text-primary" />
                        <span className="text-ml-text-primary font-bold text-sm font-sans">Testing</span>
                    </div>

                    <div className="p-5">
                                {!trained ? (
                                    <div className="flex flex-col items-center text-center">
                                        <DocumentIllustration />
                                        <p className="font-sans text-xs text-ml-text-muted mt-3 leading-relaxed">
                                            Train your text model first.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {/* Success indicator */}
                                        <div className="flex items-center gap-2 bg-ml-success-bg rounded-[10px] px-3 py-2.5 animate-celebration" style={{ border: '1px solid #1a3a25' }}>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-dot-pulse" />
                                            <span className="font-sans text-xs text-ml-success-text font-semibold">Model ready</span>
                                        </div>

                                {/* Textarea */}
                                <textarea
                                    value={testText}
                                    onChange={e => setTestText(e.target.value)}
                                    placeholder="Type text to classify..."
                                    className="w-full bg-ml-well rounded-[10px] px-3 py-2.5 text-ml-text-primary font-sans text-xs outline-none resize-none h-20 transition-colors duration-200"
                                    style={{ border: '1.5px solid var(--ml-border-strong)' }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#8b5cf6' }}
                                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--ml-border-strong)' }}
                                />

                                {/* Character count */}
                                <div className="flex justify-between text-[10px] text-ml-text-muted -mt-2">
                                    <span>{testText.length} characters</span>
                                    <span>{testText.split(/\s+/).filter(Boolean).length} words</span>
                                </div>

                                {/* Predict button */}
                                <button
                                    onClick={handlePredict}
                                    disabled={!testText.trim()}
                                    className="w-full py-[11px] rounded-[10px] border-none font-sans font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all duration-200"
                                    style={{
                                        background: testText.trim()
                                            ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
                                            : 'var(--ml-btn-idle)',
                                        color: testText.trim() ? 'var(--ml-text-primary)' : 'var(--ml-text-disabled)',
                                        cursor: testText.trim() ? 'pointer' : 'not-allowed',
                                        boxShadow: testText.trim() ? '0 4px 14px rgba(139, 92, 246, 0.25)' : 'none'
                                    }}
                                >
                                    <Send size={14} />
                                    Predict
                                </button>

                                {/* Prediction results */}
                                {testResult && (
                                    <div className="flex flex-col gap-2 animate-slide-in-up">
                                        {/* Prediction label */}
                                        <div className="flex items-center justify-between rounded-[10px] px-3 py-2.5" style={{
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                                            border: '1px solid rgba(139, 92, 246, 0.2)'
                                        }}>
                                            <span className="font-sans text-[11px] font-semibold" style={{ color: '#a78bfa' }}>Prediction</span>
                                            <span className="font-sans text-[13px] text-ml-text-primary font-bold">{testResult.label}</span>
                                        </div>

                                        {/* Confidence bars with animation */}
                                        {Object.entries(testResult.confidences).map(([label, conf]) => {
                                            const classIdx = classes.findIndex(c => c.name === label)
                                            const color = COLORS[classIdx >= 0 ? classIdx % COLORS.length : 0]
                                            return (
                                                <div key={label}>
                                                    <div className="flex justify-between text-[11px] mb-1">
                                                        <span className="text-ml-text-secondary font-sans">{label}</span>
                                                        <span className="text-ml-text-secondary font-mono font-semibold">
                                                            {Math.round(conf * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="neura-progress-premium">
                                                        <div className="neura-progress-fill" style={{
                                                            width: `${conf * 100}%`,
                                                            background: `linear-gradient(90deg, ${color.bg}, ${color.light})`,
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
