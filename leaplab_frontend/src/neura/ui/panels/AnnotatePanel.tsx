import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import type { BoundingBox } from '../../types/neura.types'
import { ensureCocoSsd } from '../../ml/loadScript'

interface AnnotatePanelProps {
    mode: UseNeuraProjectReturn
}

const TOOL_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6']

function getNextToolColor(existingBoxes: BoundingBox[]): string {
    const usedColors = existingBoxes.map(b => b.color)
    return TOOL_COLORS.find(c => !usedColors.includes(c)) || TOOL_COLORS[0]
}

export default function AnnotatePanel({ mode }: AnnotatePanelProps) {
    const canvasRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const labelInputRef = useRef<HTMLInputElement>(null)
    const autoDetectModelRef = useRef<any>(null)
    const autoDetectGenerationRef = useRef(0)
    const [isDrawing, setIsDrawing] = useState(false)
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
    const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null)
    const [dragBox, setDragBox] = useState<{ boxId: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
    const [resizeBox, setResizeBox] = useState<{ boxId: string; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number } | null>(null)
    const [undoStack, setUndoStack] = useState<BoundingBox[][]>([])
    const [redoStack, setRedoStack] = useState<BoundingBox[][]>([])
    const [elapsed, setElapsed] = useState(0)
    const [sessionStart] = useState(() => Date.now())
    const [annotationImage, setAnnotationImage] = useState<string | null>(null)
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [editingBoxId, setEditingBoxId] = useState<string | null>(null)
    const [editingLabel, setEditingLabel] = useState('')
    const [isAutoDetecting, setIsAutoDetecting] = useState(false)
    const [showBoxList, setShowBoxList] = useState(true)

    const currentStepIndex = ['collect', 'annotate', 'train', 'test'].indexOf(mode.mode)
    const totalBoxes = mode.currentAnnotation?.boxes.length || 0
    const progress = Math.min((totalBoxes / 10) * 100, 100)
    const selectedClass = mode.getSelectedClass()
    const defaultLabel = selectedClass?.name || 'Object'

    useEffect(() => {
        if (mode.selectedClassId && !annotationImage) {
            const cls = mode.getSelectedClass()
            const lastSample = cls?.samples[cls.samples.length - 1]
            if (lastSample) {
                try {
                    const parsed = JSON.parse(lastSample.data)
                    if (parsed.imageUrl) {
                        setAnnotationImage(parsed.imageUrl)
                        setImageSize({ width: 800, height: 600 })
                        mode.setCurrentAnnotation({ id: lastSample.id, imageUrl: parsed.imageUrl, boxes: parsed.boxes || [], imageName: parsed.imageName || 'annotated', timestamp: lastSample.timestamp })
                    }
                } catch { /* raw data URL, skip */ }
            }
        }
    }, [mode.selectedClassId])

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        const dataUrl = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file) })
        const img = new Image(); img.src = dataUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            setTimeout(() => resolve(), 5000)
        })
        if (!img.complete || img.naturalWidth === 0) return
        setAnnotationImage(dataUrl); setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
        mode.addAnnotation({ imageUrl: dataUrl, boxes: [], imageName: file.name })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [mode])

    useEffect(() => {
        const interval = setInterval(() => { setElapsed(Math.floor((Date.now() - sessionStart) / 1000)) }, 1000)
        return () => clearInterval(interval)
    }, [sessionStart])

    const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` }

    const saveUndoState = useCallback(() => {
        if (mode.currentAnnotation) {
            setUndoStack(prev => {
                const next = [...prev, [...mode.currentAnnotation!.boxes]]
                return next.length > 50 ? next.slice(-50) : next
            })
            setRedoStack([])
        }
    }, [mode.currentAnnotation])

    const handleUndo = useCallback(() => {
        if (undoStack.length > 0 && mode.currentAnnotation) {
            const prevBoxes = undoStack[undoStack.length - 1]
            setRedoStack(prev => [...prev, [...mode.currentAnnotation!.boxes]]); setUndoStack(prev => prev.slice(0, -1))
            mode.setCurrentAnnotation({ ...mode.currentAnnotation, boxes: prevBoxes })
        }
    }, [undoStack, mode])

    const handleRedo = useCallback(() => {
        if (redoStack.length > 0 && mode.currentAnnotation) {
            const nextBoxes = redoStack[redoStack.length - 1]
            setUndoStack(prev => [...prev, [...mode.currentAnnotation!.boxes]]); setRedoStack(prev => prev.slice(0, -1))
            mode.setCurrentAnnotation({ ...mode.currentAnnotation, boxes: nextBoxes })
        }
    }, [redoStack, mode])

    const getRelativePos = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 }
        const rect = canvasRef.current.getBoundingClientRect()
        return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (mode.activeTool === 'delete') return
        if (mode.activeTool === 'box') { const pos = getRelativePos(e); saveUndoState(); setIsDrawing(true); setDrawStart(pos); setDrawCurrent(pos) }
    }, [mode.activeTool, getRelativePos, saveUndoState])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDrawing && drawStart) { const pos = getRelativePos(e); setDrawCurrent(pos) }
        if (dragBox) {
            const pos = getRelativePos(e); const dx = pos.x - dragBox.startX; const dy = pos.y - dragBox.startY
            mode.updateBox(dragBox.boxId, { x: Math.max(0, Math.min(100 - (mode.currentAnnotation?.boxes.find(b => b.id === dragBox.boxId)?.width || 0), dragBox.origX + dx)), y: Math.max(0, Math.min(100 - (mode.currentAnnotation?.boxes.find(b => b.id === dragBox.boxId)?.height || 0), dragBox.origY + dy)) })
        }
        if (resizeBox) {
            const pos = getRelativePos(e); const dx = pos.x - resizeBox.startX; const dy = pos.y - resizeBox.startY
            const box = mode.currentAnnotation?.boxes.find(b => b.id === resizeBox.boxId)
            if (!box) return
            let newX = resizeBox.origX; let newY = resizeBox.origY; let newW = resizeBox.origW; let newH = resizeBox.origH
            if (resizeBox.handle.includes('e')) newW = Math.max(2, Math.min(100 - resizeBox.origX, resizeBox.origW + dx))
            if (resizeBox.handle.includes('w')) { newX = Math.max(0, resizeBox.origX + dx); newW = Math.max(2, resizeBox.origW - dx) }
            if (resizeBox.handle.includes('s')) newH = Math.max(2, Math.min(100 - resizeBox.origY, resizeBox.origH + dy))
            if (resizeBox.handle.includes('n')) { newY = Math.max(0, resizeBox.origY + dy); newH = Math.max(2, resizeBox.origH - dy) }
            mode.updateBox(resizeBox.boxId, { x: newX, y: newY, width: newW, height: newH })
        }
    }, [isDrawing, drawStart, dragBox, resizeBox, getRelativePos, mode])

    const handleMouseUp = useCallback(() => {
        if (isDrawing && drawStart && drawCurrent) {
            const x = Math.min(drawStart.x, drawCurrent.x); const y = Math.min(drawStart.y, drawCurrent.y)
            const width = Math.abs(drawCurrent.x - drawStart.x); const height = Math.abs(drawCurrent.y - drawStart.y)
            if (width > 1 && height > 1) {
                const color = getNextToolColor(mode.currentAnnotation?.boxes || [])
                const newBox = { label: defaultLabel, x, y, width: Math.min(width, 100 - x), height: Math.min(height, 100 - y), color }
                mode.addBox(newBox)
            }
        }
        setIsDrawing(false); setDrawStart(null); setDrawCurrent(null); setDragBox(null); setResizeBox(null)
    }, [isDrawing, drawStart, drawCurrent, mode, defaultLabel])

    const handleBoxMouseDown = useCallback((e: React.MouseEvent, boxId: string) => {
        e.stopPropagation()
        if (mode.activeTool === 'delete') { saveUndoState(); mode.removeBox(boxId); return }
        mode.setSelectedBoxId(boxId)
        const pos = getRelativePos(e); const box = mode.currentAnnotation?.boxes.find(b => b.id === boxId)
        if (box) { saveUndoState(); setDragBox({ boxId, startX: pos.x, startY: pos.y, origX: box.x, origY: box.y }) }
    }, [mode, getRelativePos, saveUndoState])

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, boxId: string, handle: string) => {
        e.stopPropagation()
        const pos = getRelativePos(e); const box = mode.currentAnnotation?.boxes.find(b => b.id === boxId)
        if (box) { saveUndoState(); setResizeBox({ boxId, handle, startX: pos.x, startY: pos.y, origX: box.x, origY: box.y, origW: box.width, origH: box.height }) }
    }, [mode, getRelativePos, saveUndoState])

    const handleStartEditLabel = useCallback((boxId: string, currentLabel: string) => {
        setEditingBoxId(boxId)
        setEditingLabel(currentLabel)
        setTimeout(() => labelInputRef.current?.focus(), 0)
    }, [])

    const handleSaveLabel = useCallback(() => {
        if (editingBoxId && editingLabel.trim()) {
            mode.updateBox(editingBoxId, { label: editingLabel.trim() })
        }
        setEditingBoxId(null)
        setEditingLabel('')
    }, [editingBoxId, editingLabel, mode])

    const handleAutoDetect = useCallback(async () => {
        if (!annotationImage || !canvasRef.current) return
        setIsAutoDetecting(true)
        const generation = ++autoDetectGenerationRef.current
        try {
            if (!autoDetectModelRef.current) {
                const cocoSsd = await ensureCocoSsd()
                autoDetectModelRef.current = await cocoSsd.load()
            }
            if (generation !== autoDetectGenerationRef.current) return
            const img = new Image()
            img.src = annotationImage
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(() => resolve(), 5000)
            })
            if (!img.complete || img.naturalWidth === 0) { setIsAutoDetecting(false); return }
            if (generation !== autoDetectGenerationRef.current) return
            const results = await autoDetectModelRef.current.detect(img)
            if (generation !== autoDetectGenerationRef.current) return
            const canvasRect = canvasRef.current.getBoundingClientRect()
            const imgElement = canvasRef.current.querySelector('img')
            if (!imgElement) { setIsAutoDetecting(false); return }
            const imgRect = imgElement.getBoundingClientRect()
            const offsetX = (imgRect.left - canvasRect.left) / canvasRect.width * 100
            const offsetY = (imgRect.top - canvasRect.top) / canvasRect.height * 100
            const scaleX = (imgRect.width / canvasRect.width) * 100
            const scaleY = (imgRect.height / canvasRect.height) * 100
            saveUndoState()
            const color = getNextToolColor(mode.currentAnnotation?.boxes || [])
            results.forEach((r: any) => {
                const [bx, by, bw, bh] = r.bbox
                const x = offsetX + (bx / img.naturalWidth) * scaleX
                const y = offsetY + (by / img.naturalHeight) * scaleY
                const width = (bw / img.naturalWidth) * scaleX
                const height = (bh / img.naturalHeight) * scaleY
                if (width > 1 && height > 1) {
                    mode.addBox({ label: r.class, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), width: Math.min(width, 100 - Math.max(0, Math.min(100, x))), height: Math.min(height, 100 - Math.max(0, Math.min(100, y))), color })
                }
            })
            setSavedMessage(`🎯 Auto-detected ${results.length} objects!`)
            setTimeout(() => setSavedMessage(null), 2000)
        } catch (err) {
            console.error('[AnnotatePanel] Auto-detect failed:', err)
            setSavedMessage('⚠️ Auto-detect failed. Try drawing boxes manually.')
            setTimeout(() => setSavedMessage(null), 2000)
        }
        setIsAutoDetecting(false)
    }, [annotationImage, mode, saveUndoState])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingBoxId) {
                if (e.key === 'Enter') handleSaveLabel()
                if (e.key === 'Escape') { setEditingBoxId(null); setEditingLabel('') }
                return
            }
            if (e.key === 'Delete' || e.key === 'Backspace') { if (mode.selectedBoxId) { saveUndoState(); mode.removeBox(mode.selectedBoxId) } }
            if (e.key === 'b' || e.key === 'B') mode.setActiveTool('box')
            if (e.key === 'Escape') mode.setSelectedBoxId(null)
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo() }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo() }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mode, saveUndoState, handleUndo, handleRedo, editingBoxId, handleSaveLabel])

    const handleSave = useCallback(() => {
        if (!annotationImage || !mode.selectedClassId) return
        const annotationData = JSON.stringify({
            imageUrl: annotationImage,
            boxes: mode.currentAnnotation?.boxes || [],
            imageName: mode.currentAnnotation?.imageName || 'annotated'
        })
        const saved = mode.addSample(mode.selectedClassId, { type: 'image', data: annotationData })
        if (!saved) { setSavedMessage('⚠️ Sample limit reached!'); setTimeout(() => setSavedMessage(null), 2000); return }
        const className = mode.getSelectedClass()?.name || 'class'
        setSavedMessage(`✅ Saved ${mode.currentAnnotation?.boxes.length || 0} boxes to ${className}!`)
        setTimeout(() => setSavedMessage(null), 2000)
    }, [annotationImage, mode])

    const previewBox = isDrawing && drawStart && drawCurrent ? { x: Math.min(drawStart.x, drawCurrent.x), y: Math.min(drawStart.y, drawCurrent.y), width: Math.abs(drawCurrent.x - drawStart.x), height: Math.abs(drawCurrent.y - drawStart.y) } : null

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {savedMessage && (
                <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 20px', background: '#006c44', color: '#fff', borderRadius: '12px', fontSize: '12px', fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                    {savedMessage}
                </div>
            )}

            {/* Header */}
            <div style={{ padding: '12px 20px 8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏷️</div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#131b2e', lineHeight: 1.2 }}>Label Your Objects!</h2>
                        <p style={{ fontSize: '10px', color: '#6b7280' }}>Draw boxes around things AI should find 🔍</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '4px 10px', background: progress >= 100 ? '#d1fae5' : '#f5f3ff', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: progress >= 100 ? '#006c44' : '#630ed4' }}>
                        {Math.round(progress)}%
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '0 20px', flexShrink: 0, marginBottom: '8px' }}>
                <div style={{ position: 'relative', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'visible' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'linear-gradient(90deg, #006c44, #10b981)', borderRadius: '4px', transition: 'width 0.5s', width: `${progress}%` }} />
                    {['Collect', 'Label', 'Train', 'Test'].map((_, idx) => (
                        <div key={idx} style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: idx === currentStepIndex ? '16px' : '12px', height: idx === currentStepIndex ? '16px' : '12px', borderRadius: '50%', border: '2px solid #fff', zIndex: 10, background: idx < currentStepIndex ? '#006c44' : idx === currentStepIndex ? '#630ed4' : '#ccc3d8', left: `${(idx / 3) * 100}%`, boxShadow: idx === currentStepIndex ? '0 0 8px rgba(99,14,212,0.4)' : 'none' }} />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    {[
                        { emoji: '📸', label: 'Collect', done: currentStepIndex > 0 },
                        { emoji: '🏷️', label: 'Label', done: currentStepIndex > 1 },
                        { emoji: '🏋️', label: 'Train', done: currentStepIndex > 2 },
                        { emoji: '🧪', label: 'Test', done: currentStepIndex > 3 }
                    ].map((step, idx) => (
                        <span key={step.label} style={{ fontSize: '9px', color: idx === currentStepIndex ? '#630ed4' : step.done ? '#006c44' : '#9ca3af', fontWeight: idx === currentStepIndex ? 700 : 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {step.done ? '✅' : step.emoji} {step.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Main content - horizontal split */}
            <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0, padding: '0 20px 12px', overflow: 'hidden' }}>
                {/* Left - Canvas */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ position: 'relative', flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', minHeight: 0 }}>
                        {/* Toolbar */}
                        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.95)', padding: '6px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <button onClick={() => mode.setActiveTool('box')} style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '12px', background: mode.activeTool === 'box' ? '#630ed4' : 'transparent', color: mode.activeTool === 'box' ? '#fff' : '#4a4455', border: 'none', cursor: 'pointer' }}>⬜</button>
                            <button onClick={handleAutoDetect} disabled={isAutoDetecting || !annotationImage} style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '12px', background: isAutoDetecting ? '#f59e0b' : 'transparent', color: isAutoDetecting ? '#fff' : '#4a4455', border: 'none', cursor: 'pointer', opacity: !annotationImage ? 0.4 : 1 }}>🤖</button>
                            <div style={{ width: '100%', height: '1px', background: '#e5e7eb', margin: '2px 0' }} />
                            <button onClick={() => mode.setActiveTool('delete')} style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '12px', background: mode.activeTool === 'delete' ? '#ba1a1a' : 'transparent', color: mode.activeTool === 'delete' ? '#fff' : '#4a4455', border: 'none', cursor: 'pointer' }}>🗑️</button>
                        </div>

                        {/* Box count / Timer */}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 20, background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', gap: '10px', fontSize: '9px', fontWeight: 600 }}>
                            <span>📦 {totalBoxes}</span>
                            <span>⏱️ {formatTime(elapsed)}</span>
                        </div>

                        {/* Auto-detect loading */}
                        {isAutoDetecting && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '32px', height: '32px', border: '2px solid #630ed4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#4a4455' }}>🤖 Detecting objects...</p>
                                </div>
                            </div>
                        )}

                        {/* Canvas area */}
                        <div ref={canvasRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', cursor: 'crosshair', userSelect: 'none' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                            {annotationImage ? (
                                <img src={annotationImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>🖼️</span>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#4a4455', marginBottom: '4px' }}>Upload a picture to start labeling!</p>
                                    <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '10px' }}>or use camera from Collect step</p>
                                    <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>📂 Upload Picture</button>
                                </div>
                            )}

                            {/* Bounding boxes */}
                            {mode.currentAnnotation?.boxes.map((box) => (
                                <div key={box.id} style={{ position: 'absolute', left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`, border: `2px solid ${box.color}`, backgroundColor: `${box.color}1a`, cursor: 'move', zIndex: mode.selectedBoxId === box.id ? 10 : 1 }} onMouseDown={(e) => handleBoxMouseDown(e, box.id)} onDoubleClick={() => handleStartEditLabel(box.id, box.label)}>
                                    {editingBoxId === box.id ? (
                                        <input ref={labelInputRef} value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)} onBlur={handleSaveLabel} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') { setEditingBoxId(null); setEditingLabel('') } }} style={{ position: 'absolute', top: '-20px', left: 0, padding: '2px 6px', fontSize: '9px', fontWeight: 700, color: '#fff', background: box.color, border: '2px solid #fff', borderRadius: '4px', minWidth: '50px', outline: 'none', zIndex: 30 }} onClick={(e) => e.stopPropagation()} />
                                    ) : (
                                        <div style={{ position: 'absolute', top: '-18px', left: 0, padding: '2px 6px', fontSize: '9px', fontWeight: 700, color: '#fff', background: box.color, borderRadius: '4px 4px 0 0', whiteSpace: 'nowrap', cursor: 'text', zIndex: 20 }} onDoubleClick={(e) => { e.stopPropagation(); handleStartEditLabel(box.id, box.label) }}>{box.label}</div>
                                    )}
                                    {mode.selectedBoxId === box.id && (
                                        <>
                                            <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '8px', height: '8px', background: '#fff', border: `1px solid ${box.color}`, cursor: 'nw-resize', zIndex: 30 }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'nw')} />
                                            <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#fff', border: `1px solid ${box.color}`, cursor: 'ne-resize', zIndex: 30 }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'ne')} />
                                            <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '8px', height: '8px', background: '#fff', border: `1px solid ${box.color}`, cursor: 'sw-resize', zIndex: 30 }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'sw')} />
                                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '8px', height: '8px', background: '#fff', border: `1px solid ${box.color}`, cursor: 'se-resize', zIndex: 30 }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'se')} />
                                        </>
                                    )}
                                </div>
                            ))}

                            {previewBox && previewBox.width > 0.5 && previewBox.height > 0.5 && (
                                <div style={{ position: 'absolute', left: `${previewBox.x}%`, top: `${previewBox.y}%`, width: `${previewBox.width}%`, height: `${previewBox.height}%`, border: '2px dashed #630ed4', background: 'rgba(99,14,212,0.08)', pointerEvents: 'none', zIndex: 10 }} />
                            )}
                        </div>

                        {/* Bottom toolbar */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4a4455', fontWeight: 700, fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>📂 Upload</button>
                                <button onClick={handleUndo} disabled={undoStack.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4a4455', fontWeight: 700, fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer', opacity: undoStack.length === 0 ? 0.3 : 1 }}>↩️ Undo</button>
                                <button onClick={handleRedo} disabled={redoStack.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4a4455', fontWeight: 700, fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer', opacity: redoStack.length === 0 ? 0.3 : 1 }}>↪️ Redo</button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#4a4455' }}>🔍</span>
                                    <input type="range" min="50" max="200" value={mode.zoom} onChange={(e) => mode.setZoom(Number(e.target.value))} style={{ width: '60px', height: '3px', accentColor: '#630ed4' }} />
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#4a4455' }}>{mode.zoom}%</span>
                                </div>
                                <button onClick={handleSave} disabled={!annotationImage || !mode.selectedClassId} style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '8px', fontSize: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: !annotationImage || !mode.selectedClassId ? 0.4 : 1 }}>💾 Save</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                    {/* Boxes list */}
                    <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <h3 style={{ fontSize: '10px', fontWeight: 700, color: '#131b2e' }}>📦 Boxes ({totalBoxes})</h3>
                            <button onClick={() => setShowBoxList(!showBoxList)} style={{ fontSize: '9px', color: '#630ed4', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>{showBoxList ? 'Hide' : 'Show'}</button>
                        </div>
                        {showBoxList && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '100px', overflowY: 'auto' }}>
                                {mode.currentAnnotation?.boxes.length === 0 && (
                                    <p style={{ fontSize: '9px', color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>No boxes yet. Draw one!</p>
                                )}
                                {mode.currentAnnotation?.boxes.map((box, i) => (
                                    <div key={box.id} onClick={() => mode.setSelectedBoxId(box.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', borderRadius: '6px', cursor: 'pointer', background: mode.selectedBoxId === box.id ? '#f5f3ff' : 'transparent', border: mode.selectedBoxId === box.id ? '1px solid #630ed4' : '1px solid transparent' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: box.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#131b2e', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{box.label}</span>
                                        <span style={{ fontSize: '8px', color: '#9ca3af' }}>{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Edit label */}
                    {mode.selectedBoxId && mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId) && (
                        <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', flexShrink: 0 }}>
                            <h3 style={{ fontSize: '10px', fontWeight: 700, color: '#131b2e', marginBottom: '6px' }}>✏️ Edit Label</h3>
                            <input value={editingBoxId === mode.selectedBoxId ? editingLabel : (mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId)?.label || '')} onChange={(e) => { if (editingBoxId === mode.selectedBoxId) setEditingLabel(e.target.value); else { setEditingBoxId(mode.selectedBoxId); setEditingLabel(e.target.value) } }} onFocus={() => { if (editingBoxId !== mode.selectedBoxId) { const box = mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId); if (box) { setEditingBoxId(mode.selectedBoxId); setEditingLabel(box.label) } } }} onBlur={handleSaveLabel} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') { setEditingBoxId(null); setEditingLabel('') } }} style={{ width: '100%', padding: '6px 8px', fontSize: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} placeholder="Enter label..." />
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                {selectedClass && <button onClick={() => { if (editingBoxId === mode.selectedBoxId) setEditingLabel(selectedClass.name); else { setEditingBoxId(mode.selectedBoxId); setEditingLabel(selectedClass.name) } }} style={{ flex: 1, padding: '4px', background: '#f5f3ff', color: '#630ed4', borderRadius: '6px', fontSize: '9px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Use Class</button>}
                                <button onClick={() => { saveUndoState(); mode.removeBox(mode.selectedBoxId!) }} style={{ flex: 1, padding: '4px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '9px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>🗑️ Delete</button>
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        <h3 style={{ fontSize: '10px', fontWeight: 700, color: '#131b2e', marginBottom: '6px' }}>💡 Tips</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '9px', color: '#4a4455' }}>• Double-click box to rename</span>
                            <span style={{ fontSize: '9px', color: '#4a4455' }}>• Drag boxes to move them</span>
                            <span style={{ fontSize: '9px', color: '#4a4455' }}>• Use corners to resize</span>
                            <span style={{ fontSize: '9px', color: '#4a4455' }}>• Press <kbd style={{ padding: '1px 4px', background: '#f5f3ff', borderRadius: '3px', fontSize: '8px' }}>B</kbd> for box tool</span>
                            <span style={{ fontSize: '9px', color: '#4a4455' }}>• Press <kbd style={{ padding: '1px 4px', background: '#f5f3ff', borderRadius: '3px', fontSize: '8px' }}>DEL</kbd> to remove</span>
                            <span style={{ fontSize: '9px', color: '#4a4455' }}>• Press <kbd style={{ padding: '1px 4px', background: '#f5f3ff', borderRadius: '3px', fontSize: '8px' }}>Ctrl+Z</kbd> to undo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
