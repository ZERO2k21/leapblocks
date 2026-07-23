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
    const [isDragging, setIsDragging] = useState(false)

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
                } catch {
                    // Raw data URL (from Collect step) — recover the image
                    if (lastSample.data && lastSample.data.startsWith('data:image')) {
                        setAnnotationImage(lastSample.data)
                        const img = new Image()
                        img.src = lastSample.data
                        img.onload = () => {
                            setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
                        }
                        mode.setCurrentAnnotation({ id: lastSample.id, imageUrl: lastSample.data, boxes: [], imageName: lastSample.data.split('/').pop() || 'image', timestamp: lastSample.timestamp })
                    }
                }
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

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
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

    const getRelativePos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 }
        const rect = canvasRef.current.getBoundingClientRect()
        const touch = 'touches' in e ? (e.touches[0] || (e as React.TouchEvent).changedTouches[0]) : null
        const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX
        const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY
        return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (mode.activeTool === 'delete') return
        if (mode.activeTool === 'box') { const pos = getRelativePos(e); saveUndoState(); setIsDrawing(true); setDrawStart(pos); setDrawCurrent(pos) }
    }, [mode.activeTool, getRelativePos, saveUndoState])

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (mode.activeTool === 'delete') return
        if (mode.activeTool === 'box') {
            const pos = getRelativePos(e); saveUndoState(); setIsDrawing(true); setDrawStart(pos); setDrawCurrent(pos)
        }
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

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
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
                    mode.addBox({ label: defaultLabel, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), width: Math.min(width, 100 - Math.max(0, Math.min(100, x))), height: Math.min(height, 100 - Math.max(0, Math.min(100, y))), color })
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
        <div className="flex-1 flex flex-col overflow-y-auto neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-[0_4px_16px_rgba(0,0,0,0.15)] animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* Header */}
            <div className="pt-4 px-5 pb-3 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center text-xl">🏷️</div>
                    <div>
                        <h2 className="text-lg font-extrabold text-[#131b2e] leading-snug">Label Your Objects!</h2>
                        <p className="text-xs text-gray-500">Draw boxes around things AI should find 🔍</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`py-1.5 px-3.5 rounded-lg text-xs font-bold ${progress >= 100 ? 'bg-emerald-100 text-[#006c44]' : 'bg-[#f5f3ff] text-[#630ed4]'}`}>
                        {Math.round(progress)}%
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 shrink-0 mb-2.5">
                <div className="relative h-2 bg-gray-200 rounded-full overflow-visible">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#006c44] to-emerald-500 rounded-full transition-[width] duration-500" style={{ width: `${progress}%` }} />
                    {['Collect', 'Label', 'Train', 'Test'].map((_, idx) => (
                        <div key={idx} className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white z-10 ${idx === currentStepIndex ? 'w-4 h-4 bg-[#630ed4] shadow-[0_0_8px_rgba(99,14,212,0.4)]' : idx < currentStepIndex ? 'w-3 h-3 bg-[#006c44]' : 'w-3 h-3 bg-[#ccc3d8]'}`} style={{ left: `${(idx / 3) * 100}%` }} />
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    {[
                        { emoji: '📸', label: 'Collect', done: currentStepIndex > 0 },
                        { emoji: '🏷️', label: 'Label', done: currentStepIndex > 1 },
                        { emoji: '🏋️', label: 'Train', done: currentStepIndex > 2 },
                        { emoji: '🧪', label: 'Test', done: currentStepIndex > 3 }
                    ].map((step, idx) => (
                        <span key={step.label} className={`text-[11px] flex items-center gap-1 ${idx === currentStepIndex ? 'text-[#630ed4] font-bold' : step.done ? 'text-[#006c44] font-medium' : 'text-gray-400 font-medium'}`}>
                            {step.done ? '✅' : step.emoji} {step.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Main content - horizontal split */}
            <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0 px-5 pb-3 overflow-auto">
                {/* Left - Canvas */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="relative flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-0">
                        {/* Toolbar */}
                        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 bg-white/95 p-2 rounded-xl border border-gray-200 shadow-sm">
                            <button onClick={() => mode.setActiveTool('box')} className={`p-2 rounded-lg text-sm border-none cursor-pointer ${mode.activeTool === 'box' ? 'bg-[#630ed4] text-white' : 'bg-transparent text-[#4a4455]'}`}>⬜</button>
                            <button onClick={handleAutoDetect} disabled={isAutoDetecting || !annotationImage} className={`p-2 rounded-lg text-sm border-none cursor-pointer ${isAutoDetecting ? 'bg-amber-500 text-white' : 'bg-transparent text-[#4a4455]'} ${!annotationImage ? 'opacity-40' : 'opacity-100'}`}>🤖</button>
                            <div className="w-full h-px bg-gray-200 my-1" />
                            <button onClick={() => mode.setActiveTool('delete')} className={`p-2 rounded-lg text-sm border-none cursor-pointer ${mode.activeTool === 'delete' ? 'bg-red-700 text-white' : 'bg-transparent text-[#4a4455]'}`}>🗑️</button>
                        </div>

                        {/* Box count / Timer */}
                        <div className="absolute top-3 right-3 z-20 bg-white/95 py-1.5 px-3.5 rounded-xl border border-gray-200 flex gap-3.5 text-xs font-semibold text-gray-700 shadow-sm">
                            <span>📦 {totalBoxes}</span>
                            <span>⏱️ {formatTime(elapsed)}</span>
                        </div>

                        {/* Auto-detect loading */}
                        {isAutoDetecting && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-[11px] font-bold text-[#4a4455]">🤖 Detecting objects...</p>
                                </div>
                            </div>
                        )}

                        {/* Canvas area */}
                        <div ref={canvasRef} className={`relative w-full h-full overflow-hidden flex items-center justify-center cursor-crosshair select-none touch-none transition-colors duration-200 ${isDragging ? 'bg-[#f0ebff]' : 'bg-gray-100'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                            {annotationImage ? (
                                <img src={annotationImage} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            ) : (
                                <div className="text-center">
                                    <div className={`contents ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                                        {isDragging ? (
                                            <>
                                                <span className="text-5xl block mb-3">📥</span>
                                                <p className="text-base font-bold text-[#630ed4] mb-1.5">Drop your image here!</p>
                                                <p className="text-xs text-violet-500">Release to upload</p>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-5xl block mb-3">🖼️</span>
                                                <p className="text-base font-bold text-[#4a4455] mb-1.5">Upload a picture to start labeling!</p>
                                                <p className="text-xs text-gray-400 mb-2">or use camera from Collect step</p>
                                                <p className="text-xs text-gray-400 mb-4">Drag & drop an image here</p>
                                                <button onClick={() => fileInputRef.current?.click()} className="py-3 px-6 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-sm font-bold border-none cursor-pointer">📂 Upload Picture</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bounding boxes */}
                            {mode.currentAnnotation?.boxes.map((box) => (
                                <div key={box.id} className="absolute border-2 cursor-move" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`, borderColor: box.color, backgroundColor: `${box.color}1a`, zIndex: mode.selectedBoxId === box.id ? 10 : 1 }} onMouseDown={(e) => handleBoxMouseDown(e, box.id)} onDoubleClick={() => handleStartEditLabel(box.id, box.label)}>
                                    {editingBoxId === box.id ? (
                                        <input ref={labelInputRef} value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)} onBlur={handleSaveLabel} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') { setEditingBoxId(null); setEditingLabel('') } }} className="absolute -top-6 left-0 py-1 px-2 text-[11px] font-bold text-white border-2 border-white rounded-md min-w-[60px] outline-none z-30" style={{ background: box.color }} onClick={(e) => e.stopPropagation()} />
                                    ) : (
                                        <div className="absolute -top-5.5 left-0 py-0.75 px-2 text-[11px] font-bold text-white rounded-t-md whitespace-nowrap cursor-text z-20" style={{ background: box.color }} onDoubleClick={(e) => { e.stopPropagation(); handleStartEditLabel(box.id, box.label) }}>{box.label}</div>
                                    )}
                                    {mode.selectedBoxId === box.id && (
                                        <>
                                            <div className="absolute -top-1.25 -left-1.25 w-2.5 h-2.5 bg-white border-2 cursor-nw-resize z-30" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'nw')} />
                                            <div className="absolute -top-1.25 -right-1.25 w-2.5 h-2.5 bg-white border-2 cursor-ne-resize z-30" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'ne')} />
                                            <div className="absolute -bottom-1.25 -left-1.25 w-2.5 h-2.5 bg-white border-2 cursor-sw-resize z-30" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'sw')} />
                                            <div className="absolute -bottom-1.25 -right-1.25 w-2.5 h-2.5 bg-white border-2 cursor-se-resize z-30" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'se')} />
                                        </>
                                    )}
                                </div>
                            ))}

                            {previewBox && previewBox.width > 0.5 && previewBox.height > 0.5 && (
                                <div className="absolute border-2 border-dashed border-[#630ed4] bg-[#630ed4]/10 pointer-events-none z-10" style={{ left: `${previewBox.x}%`, top: `${previewBox.y}%`, width: `${previewBox.width}%`, height: `${previewBox.height}%` }} />
                            )}
                        </div>

                        {/* Bottom toolbar */}
                        <div className="absolute bottom-0 left-0 right-0 py-2.5 px-4 bg-white/95 border-t border-gray-200 flex justify-between items-center z-20">
                            <div className="flex gap-4">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-[#4a4455] font-bold text-xs bg-transparent border-none cursor-pointer">📂 Upload</button>
                                <button onClick={handleUndo} disabled={undoStack.length === 0} className={`flex items-center gap-1.5 text-[#4a4455] font-bold text-xs bg-transparent border-none ${undoStack.length === 0 ? 'cursor-not-allowed opacity-30' : 'cursor-pointer opacity-100'}`}>↩️ Undo</button>
                                <button onClick={handleRedo} disabled={redoStack.length === 0} className={`flex items-center gap-1.5 text-[#4a4455] font-bold text-xs bg-transparent border-none ${redoStack.length === 0 ? 'cursor-not-allowed opacity-30' : 'cursor-pointer opacity-100'}`}>↪️ Redo</button>
                            </div>
                            <div className="flex items-center gap-3.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#4a4455]">🔍</span>
                                    <input type="range" min="50" max="200" value={mode.zoom} onChange={(e) => mode.setZoom(Number(e.target.value))} className="w-20 h-1 rounded-full appearance-none cursor-pointer accent-[#630ed4]" />
                                    <span className="text-xs font-bold text-[#4a4455]">{mode.zoom}%</span>
                                </div>
                                <button onClick={handleSave} disabled={!annotationImage || !mode.selectedClassId} className={`py-2 px-4.5 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold border-none ${!annotationImage || !mode.selectedClassId ? 'cursor-not-allowed opacity-40' : 'cursor-pointer opacity-100'}`}>💾 Save</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden overflow-y-auto px-1 neura-scrollbar">
                    {/* Boxes list */}
                    <div className="bg-white/85 border border-gray-200 rounded-xl p-4 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-[#131b2e]">📦 Boxes ({totalBoxes})</h3>
                            <button onClick={() => setShowBoxList(!showBoxList)} className="text-xs text-[#630ed4] font-bold bg-transparent border-none cursor-pointer">{showBoxList ? 'Hide' : 'Show'}</button>
                        </div>
                        {showBoxList && (
                            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto neura-scrollbar">
                                {mode.currentAnnotation?.boxes.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-4">No boxes yet. Draw one!</p>
                                )}
                                {mode.currentAnnotation?.boxes.map((box, i) => (
                                    <div key={box.id} onClick={() => mode.setSelectedBoxId(box.id)} className={`flex items-center gap-2.5 py-2 px-3 rounded-lg cursor-pointer border ${mode.selectedBoxId === box.id ? 'bg-[#f5f3ff] border-[#630ed4]' : 'bg-transparent border-transparent'}`}>
                                        <div className="w-2.5 h-2.5 rounded shrink-0" style={{ background: box.color }} />
                                        <span className="text-xs font-semibold text-[#131b2e] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{box.label}</span>
                                        <span className="text-[11px] text-gray-400">{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Edit label */}
                    {mode.selectedBoxId && mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId) && (
                        <div className="bg-white/85 border border-gray-200 rounded-xl p-4 shrink-0">
                            <h3 className="text-sm font-bold text-[#131b2e] mb-2.5">✏️ Edit Label</h3>
                            <input value={editingBoxId === mode.selectedBoxId ? editingLabel : (mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId)?.label || '')} onChange={(e) => { if (editingBoxId === mode.selectedBoxId) setEditingLabel(e.target.value); else { setEditingBoxId(mode.selectedBoxId); setEditingLabel(e.target.value) } }} onFocus={() => { if (editingBoxId !== mode.selectedBoxId) { const box = mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId); if (box) { setEditingBoxId(mode.selectedBoxId); setEditingLabel(box.label) } } }} onBlur={handleSaveLabel} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') { setEditingBoxId(null); setEditingLabel('') } }} className="w-full py-2.5 px-3 text-xs border border-gray-200 rounded-lg outline-none" placeholder="Enter label..." />
                            <div className="flex gap-2 mt-2.5">
                                {selectedClass && <button onClick={() => { if (editingBoxId === mode.selectedBoxId) setEditingLabel(selectedClass.name); else { setEditingBoxId(mode.selectedBoxId); setEditingLabel(selectedClass.name) } }} className="flex-1 p-2 bg-[#f5f3ff] text-[#630ed4] rounded-lg text-xs font-bold border-none cursor-pointer">Use Class</button>}
                                <button onClick={() => { saveUndoState(); mode.removeBox(mode.selectedBoxId!) }} className="flex-1 p-2 bg-red-50 text-red-800 rounded-lg text-xs font-bold border-none cursor-pointer">🗑️ Delete</button>
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="bg-white/85 border border-gray-200 rounded-xl p-4 flex-1 min-h-0 overflow-hidden">
                        <h3 className="text-sm font-bold text-[#131b2e] mb-2.5">💡 Tips</h3>
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-[#4a4455]">• Double-click box to rename</span>
                            <span className="text-xs text-[#4a4455]">• Drag boxes to move them</span>
                            <span className="text-xs text-[#4a4455]">• Use corners to resize</span>
                            <span className="text-xs text-[#4a4455]">• Press <kbd className="py-0.5 px-1.5 bg-[#f5f3ff] rounded text-[11px]">B</kbd> for box tool</span>
                            <span className="text-xs text-[#4a4455]">• Press <kbd className="py-0.5 px-1.5 bg-[#f5f3ff] rounded text-[11px]">DEL</kbd> to remove</span>
                            <span className="text-xs text-[#4a4455]">• Press <kbd className="py-0.5 px-1.5 bg-[#f5f3ff] rounded text-[11px]">Ctrl+Z</kbd> to undo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
