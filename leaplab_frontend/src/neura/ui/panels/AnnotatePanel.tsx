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
        await new Promise<void>((resolve) => { img.onload = () => resolve() })
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
        if (mode.currentAnnotation) { setUndoStack(prev => [...prev, [...mode.currentAnnotation!.boxes]]); setRedoStack([]) }
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
        try {
            const cocoSsd = await ensureCocoSsd()
            const model = await cocoSsd.load()
            const img = new Image()
            img.src = annotationImage
            await new Promise<void>((resolve) => { img.onload = () => resolve() })
            const results = await model.detect(img)
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
        <div className="flex-1 flex gap-4 p-4 overflow-hidden neura-scrollbar">
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-3 w-full">
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#006c44] bg-[#d1fae5] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            🏷️ Step {currentStepIndex + 1}: Label Objects
                        </span>
                        <span className="text-[10px] font-bold text-[#4a4455]">{Math.round(progress)}% done</span>
                    </div>
                    <div className="relative h-1.5 bg-[#dae2fd] rounded-full overflow-visible">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#006c44] to-[#10b981] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        {['Collect', 'Label', 'Train', 'Test'].map((_, idx) => (
                            <div key={idx} className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white z-10 transition-all ${idx < currentStepIndex ? 'w-3.5 h-3.5 bg-[#006c44]' : idx === currentStepIndex ? 'w-5 h-5 bg-[#630ed4] ring-4 ring-[#eaedff] animate-pulse' : 'w-3.5 h-3.5 bg-[#ccc3d8]'}`} style={{ left: `${(idx / 3) * 100}%` }} />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-[#4a4455]">
                        {['Collect', 'Label', 'Train', 'Test'].map((step, idx) => (
                            <span key={step} className={idx === currentStepIndex ? 'font-bold text-[#630ed4]' : 'opacity-60'}>{idx === 0 ? '📸 ' : idx === 1 ? '🏷️ ' : idx === 2 ? '🏋️ ' : '🧪 '}{step}</span>
                        ))}
                    </div>
                </div>

                <div className="relative bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0">
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-[#dae2fd] shadow-sm">
                        <button onClick={() => mode.setActiveTool('box')} className={`p-2 rounded-lg transition-all hover:scale-110 text-sm ${mode.activeTool === 'box' ? 'bg-[#630ed4] text-white' : 'hover:bg-[#eaedff] text-[#4a4455]'}`} title="Draw Box (B)">⬜</button>
                        <button onClick={handleAutoDetect} disabled={isAutoDetecting || !annotationImage} className={`p-2 rounded-lg transition-all hover:scale-110 text-sm ${isAutoDetecting ? 'bg-[#f59e0b] text-white animate-pulse' : 'hover:bg-[#eaedff] text-[#4a4455]'}`} title="Auto-Detect Objects">🤖</button>
                        <div className="w-full h-px bg-[#ccc3d8] my-1" />
                        <button onClick={() => mode.setActiveTool('delete')} className={`p-2 rounded-lg transition-all hover:scale-110 text-sm ${mode.activeTool === 'delete' ? 'bg-[#ba1a1a] text-white' : 'hover:bg-[#fee2e2] text-[#4a4455]'}`} title="Delete (DEL)">🗑️</button>
                    </div>

                    <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#dae2fd] flex gap-3 text-[10px] font-medium">
                        <div className="flex items-center gap-1">
                            <span className="text-sm">📦</span>
                            <span>{totalBoxes} Box{totalBoxes !== 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm">⏱️</span>
                            <span>{formatTime(elapsed)}</span>
                        </div>
                    </div>

                    {isAutoDetecting && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30">
                            <div className="text-center">
                                <div className="w-10 h-10 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs font-bold text-[#4a4455]">🤖 Detecting objects...</p>
                            </div>
                        </div>
                    )}

                    <div ref={canvasRef} className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#dae2fd] cursor-crosshair select-none" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                        {annotationImage ? (
                            <img src={annotationImage} alt="Annotation target" className="absolute inset-0 w-full h-full object-contain" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#eaedff] to-[#dae2fd] flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-5xl mb-3 block">🖼️</span>
                                    <p className="text-[#4a4455] text-sm font-bold mb-1">Upload a picture to start labeling!</p>
                                    <p className="text-[#7b7487] text-xs mb-3">or use camera from the Collect step 📸</p>
                                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md transition-all">📂 Upload Picture</button>
                                </div>
                            </div>
                        )}

                        {mode.currentAnnotation?.boxes.map((box) => (
                            <div key={box.id} className={`absolute border-2 cursor-move transition-all ${mode.selectedBoxId === box.id ? 'shadow-lg z-10' : 'hover:shadow-md'}`}
                                style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`, borderColor: box.color, backgroundColor: `${box.color}1a` }}
                                onMouseDown={(e) => handleBoxMouseDown(e, box.id)} onDoubleClick={() => handleStartEditLabel(box.id, box.label)}>
                                {editingBoxId === box.id ? (
                                    <input ref={labelInputRef} value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)} onBlur={handleSaveLabel} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') { setEditingBoxId(null); setEditingLabel('') } }} className="absolute -top-6 left-0 px-1.5 py-0.5 text-[9px] font-bold text-white rounded z-30 min-w-[60px] border-2 border-white" style={{ backgroundColor: box.color }} onClick={(e) => e.stopPropagation()} />
                                ) : (
                                    <div className="absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap z-20 rounded-t-md cursor-text" style={{ backgroundColor: box.color }} onDoubleClick={(e) => { e.stopPropagation(); handleStartEditLabel(box.id, box.label) }}>{box.label}</div>
                                )}
                                {mode.selectedBoxId === box.id && (
                                    <>
                                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border cursor-nw-resize z-30 rounded-sm" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'nw')} />
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border cursor-ne-resize z-30 rounded-sm" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'ne')} />
                                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border cursor-sw-resize z-30 rounded-sm" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'sw')} />
                                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border cursor-se-resize z-30 rounded-sm" style={{ borderColor: box.color }} onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'se')} />
                                    </>
                                )}
                            </div>
                        ))}

                        {previewBox && previewBox.width > 0.5 && previewBox.height > 0.5 && (
                            <div className="absolute border-2 border-dashed pointer-events-none z-10 border-[#630ed4] bg-[#630ed4]/[0.08]" style={{ left: `${previewBox.x}%`, top: `${previewBox.y}%`, width: `${previewBox.width}%`, height: `${previewBox.height}%` }} />
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm border-t border-[#dae2fd] flex justify-between items-center z-20">
                        <div className="flex gap-3">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-[#4a4455] font-bold hover:text-[#630ed4] transition-all text-xs">
                                <span className="text-sm">📂</span> Upload
                            </button>
                            <button onClick={handleUndo} disabled={undoStack.length === 0} className="flex items-center gap-1 text-[#4a4455] font-bold hover:text-[#630ed4] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs">
                                <span className="text-sm">↩️</span> Undo
                            </button>
                            <button onClick={handleRedo} disabled={redoStack.length === 0} className="flex items-center gap-1 text-[#4a4455] font-bold hover:text-[#630ed4] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs">
                                <span className="text-sm">↪️</span> Redo
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-[#4a4455] uppercase">🔍 Zoom:</span>
                                <input type="range" min="50" max="200" value={mode.zoom} onChange={(e) => mode.setZoom(Number(e.target.value))} className="w-20 h-1 bg-[#dae2fd] rounded-lg appearance-none cursor-pointer accent-[#630ed4]" />
                                <span className="text-[9px] font-bold text-[#4a4455]">{mode.zoom}%</span>
                            </div>
                            <button onClick={handleSave} disabled={!annotationImage || !mode.selectedClassId} className="bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white px-5 py-2 rounded-xl font-bold text-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                💾 Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-64 flex flex-col gap-3 shrink-0">
                <div className="bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#131b2e]">📦 Boxes ({totalBoxes})</h3>
                        <button onClick={() => setShowBoxList(!showBoxList)} className="text-[10px] text-[#630ed4] font-bold hover:underline">{showBoxList ? 'Hide' : 'Show'}</button>
                    </div>
                    {showBoxList && (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto neura-scrollbar">
                            {mode.currentAnnotation?.boxes.length === 0 && (
                                <p className="text-[10px] text-[#7b7487] text-center py-2">No boxes yet. Draw one on the image!</p>
                            )}
                            {mode.currentAnnotation?.boxes.map((box, i) => (
                                <div key={box.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${mode.selectedBoxId === box.id ? 'bg-[#eaedff] ring-1 ring-[#630ed4]' : 'hover:bg-[#f2f3ff]'}`} onClick={() => mode.setSelectedBoxId(box.id)}>
                                    <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: box.color }} />
                                    <span className="text-[10px] font-bold text-[#131b2e] flex-1 truncate">{box.label}</span>
                                    <span className="text-[8px] text-[#7b7487]">{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {mode.selectedBoxId && mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId) && (
                    <div className="bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-3 shadow-sm">
                        <h3 className="text-xs font-bold text-[#131b2e] mb-2">✏️ Edit Label</h3>
                        <input ref={labelInputRef} value={editingBoxId === mode.selectedBoxId ? editingLabel : (mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId)?.label || '')} onChange={(e) => { if (editingBoxId === mode.selectedBoxId) setEditingLabel(e.target.value); else { setEditingBoxId(mode.selectedBoxId); setEditingLabel(e.target.value) } }} onFocus={() => { if (editingBoxId !== mode.selectedBoxId) { const box = mode.currentAnnotation?.boxes.find(b => b.id === mode.selectedBoxId); if (box) { setEditingBoxId(mode.selectedBoxId); setEditingLabel(box.label) } } }} onBlur={handleSaveLabel} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') { setEditingBoxId(null); setEditingLabel('') } }} className="w-full px-2 py-1.5 text-xs border border-[#dae2fd] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#630ed4]" placeholder="Enter label..." />
                        <div className="flex gap-2 mt-2">
                            {selectedClass && <button onClick={() => { if (editingBoxId === mode.selectedBoxId) { setEditingLabel(selectedClass.name) } else { setEditingBoxId(mode.selectedBoxId); setEditingLabel(selectedClass.name) } }} className="flex-1 px-2 py-1 bg-[#eaedff] text-[#630ed4] rounded-lg text-[10px] font-bold hover:bg-[#dae2fd] transition-all">Use Class Name</button>}
                            <button onClick={() => { saveUndoState(); mode.removeBox(mode.selectedBoxId!) }} className="flex-1 px-2 py-1 bg-[#fee2e2] text-[#991b1b] rounded-lg text-[10px] font-bold hover:bg-[#fecaca] transition-all">🗑️ Delete</button>
                        </div>
                    </div>
                )}

                <div className="bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-3 shadow-sm">
                    <h3 className="text-xs font-bold text-[#131b2e] mb-2">💡 Tips</h3>
                    <ul className="space-y-1">
                        <li className="text-[10px] text-[#4a4455]">• Double-click box to rename</li>
                        <li className="text-[10px] text-[#4a4455]">• Drag boxes to move them</li>
                        <li className="text-[10px] text-[#4a4455]">• Use corner handles to resize</li>
                        <li className="text-[10px] text-[#4a4455]">• Press <kbd className="px-1 bg-[#eaedff] rounded">B</kbd> for box tool</li>
                        <li className="text-[10px] text-[#4a4455]">• Press <kbd className="px-1 bg-[#eaedff] rounded">DEL</kbd> to remove</li>
                        <li className="text-[10px] text-[#4a4455]">• Press <kbd className="px-1 bg-[#eaedff] rounded">Ctrl+Z</kbd> to undo</li>
                    </ul>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border border-[#dae2fd] rounded-2xl p-3 shadow-sm">
                    <h3 className="text-xs font-bold text-[#131b2e] mb-2">📊 Progress</h3>
                    <p className="text-[10px] text-[#4a4455]">{totalBoxes > 5 ? 'Great job! Your annotations are looking good! 🌟' : `Add ${Math.max(0, 6 - totalBoxes)} more boxes to start training!`}</p>
                </div>
            </div>
        </div>
    )
}
