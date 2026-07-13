import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import type { BoundingBox, AnnotationToolType } from '../../../../types/neura.types'

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

    const WORKFLOW_STEPS = ['Collect', 'Label Objects', 'Teach AI', 'Find Things']
    const currentStepIndex = ['collect', 'annotate', 'train', 'test'].indexOf(mode.mode)
    const totalBoxes = mode.currentAnnotation?.boxes.length || 0
    const progress = Math.min((totalBoxes / 10) * 100, 100)

    // Image upload handler
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })

        // Get image dimensions
        const img = new Image()
        img.src = dataUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
        })

        setAnnotationImage(dataUrl)
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })

        // Create a new annotation for this image
        mode.addAnnotation({
            imageUrl: dataUrl,
            boxes: [],
            imageName: file.name
        })

        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [mode])

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - sessionStart) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [sessionStart])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    // Save state for undo
    const saveUndoState = useCallback(() => {
        if (mode.currentAnnotation) {
            setUndoStack(prev => [...prev, [...mode.currentAnnotation!.boxes]])
            setRedoStack([])
        }
    }, [mode.currentAnnotation])

    const handleUndo = useCallback(() => {
        if (undoStack.length > 0 && mode.currentAnnotation) {
            const prevBoxes = undoStack[undoStack.length - 1]
            setRedoStack(prev => [...prev, [...mode.currentAnnotation!.boxes]])
            setUndoStack(prev => prev.slice(0, -1))
            // Restore boxes
            const updated = { ...mode.currentAnnotation, boxes: prevBoxes }
            mode.setCurrentAnnotation(updated)
        }
    }, [undoStack, mode])

    const handleRedo = useCallback(() => {
        if (redoStack.length > 0 && mode.currentAnnotation) {
            const nextBoxes = redoStack[redoStack.length - 1]
            setUndoStack(prev => [...prev, [...mode.currentAnnotation!.boxes]])
            setRedoStack(prev => prev.slice(0, -1))
            const updated = { ...mode.currentAnnotation, boxes: nextBoxes }
            mode.setCurrentAnnotation(updated)
        }
    }, [redoStack, mode])

    // Get relative position from mouse event
    const getRelativePos = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 }
        const rect = canvasRef.current.getBoundingClientRect()
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        }
    }, [])

    // Mouse handlers for drawing
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (mode.activeTool === 'delete') return
        if (mode.activeTool === 'box') {
            const pos = getRelativePos(e)
            saveUndoState()
            setIsDrawing(true)
            setDrawStart(pos)
            setDrawCurrent(pos)
        }
    }, [mode.activeTool, getRelativePos, saveUndoState])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDrawing && drawStart) {
            const pos = getRelativePos(e)
            setDrawCurrent(pos)
        }
        if (dragBox) {
            const pos = getRelativePos(e)
            const dx = pos.x - dragBox.startX
            const dy = pos.y - dragBox.startY
            mode.updateBox(dragBox.boxId, {
                x: Math.max(0, Math.min(100 - (mode.currentAnnotation?.boxes.find(b => b.id === dragBox.boxId)?.width || 0), dragBox.origX + dx)),
                y: Math.max(0, Math.min(100 - (mode.currentAnnotation?.boxes.find(b => b.id === dragBox.boxId)?.height || 0), dragBox.origY + dy))
            })
        }
        if (resizeBox) {
            const pos = getRelativePos(e)
            const dx = pos.x - resizeBox.startX
            const dy = pos.y - resizeBox.startY
            const box = mode.currentAnnotation?.boxes.find(b => b.id === resizeBox.boxId)
            if (!box) return

            let newX = resizeBox.origX
            let newY = resizeBox.origY
            let newW = resizeBox.origW
            let newH = resizeBox.origH

            if (resizeBox.handle.includes('e')) {
                newW = Math.max(2, Math.min(100 - resizeBox.origX, resizeBox.origW + dx))
            }
            if (resizeBox.handle.includes('w')) {
                newX = Math.max(0, resizeBox.origX + dx)
                newW = Math.max(2, resizeBox.origW - dx)
            }
            if (resizeBox.handle.includes('s')) {
                newH = Math.max(2, Math.min(100 - resizeBox.origY, resizeBox.origH + dy))
            }
            if (resizeBox.handle.includes('n')) {
                newY = Math.max(0, resizeBox.origY + dy)
                newH = Math.max(2, resizeBox.origH - dy)
            }

            mode.updateBox(resizeBox.boxId, { x: newX, y: newY, width: newW, height: newH })
        }
    }, [isDrawing, drawStart, dragBox, resizeBox, getRelativePos, mode])

    const handleMouseUp = useCallback(() => {
        if (isDrawing && drawStart && drawCurrent) {
            const x = Math.min(drawStart.x, drawCurrent.x)
            const y = Math.min(drawStart.y, drawCurrent.y)
            const width = Math.abs(drawCurrent.x - drawStart.x)
            const height = Math.abs(drawCurrent.y - drawStart.y)

            if (width > 1 && height > 1) {
                const color = getNextToolColor(mode.currentAnnotation?.boxes || [])
                mode.addBox({
                    label: 'Object',
                    x,
                    y,
                    width: Math.min(width, 100 - x),
                    height: Math.min(height, 100 - y),
                    color
                })
            }
        }
        setIsDrawing(false)
        setDrawStart(null)
        setDrawCurrent(null)
        setDragBox(null)
        setResizeBox(null)
    }, [isDrawing, drawStart, drawCurrent, mode])

    // Box interaction handlers
    const handleBoxMouseDown = useCallback((e: React.MouseEvent, boxId: string) => {
        e.stopPropagation()
        if (mode.activeTool === 'delete') {
            saveUndoState()
            mode.removeBox(boxId)
            return
        }
        mode.setSelectedBoxId(boxId)
        const pos = getRelativePos(e)
        const box = mode.currentAnnotation?.boxes.find(b => b.id === boxId)
        if (box) {
            saveUndoState()
            setDragBox({
                boxId,
                startX: pos.x,
                startY: pos.y,
                origX: box.x,
                origY: box.y
            })
        }
    }, [mode, getRelativePos, saveUndoState])

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, boxId: string, handle: string) => {
        e.stopPropagation()
        const pos = getRelativePos(e)
        const box = mode.currentAnnotation?.boxes.find(b => b.id === boxId)
        if (box) {
            saveUndoState()
            setResizeBox({
                boxId,
                handle,
                startX: pos.x,
                startY: pos.y,
                origX: box.x,
                origY: box.y,
                origW: box.width,
                origH: box.height
            })
        }
    }, [mode, getRelativePos, saveUndoState])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (mode.selectedBoxId) {
                    saveUndoState()
                    mode.removeBox(mode.selectedBoxId)
                }
            }
            if (e.key === 'b' || e.key === 'B') {
                mode.setActiveTool('box')
            }
            if (e.key === 'Escape') {
                mode.setSelectedBoxId(null)
            }
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault()
                handleUndo()
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault()
                handleRedo()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mode, saveUndoState, handleUndo, handleRedo])

    // Preview box while drawing
    const previewBox = isDrawing && drawStart && drawCurrent ? {
        x: Math.min(drawStart.x, drawCurrent.x),
        y: Math.min(drawStart.y, drawCurrent.y),
        width: Math.abs(drawCurrent.x - drawStart.x),
        height: Math.abs(drawCurrent.y - drawStart.y)
    } : null

    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto neura-scrollbar">
            {/* ── Workflow Stepper ── */}
            <div className="mb-6 w-full">
                <div className="flex justify-between mb-3">
                    <span className="text-[10px] font-mono font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Step {currentStepIndex + 1}: {WORKFLOW_STEPS[currentStepIndex]}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-on-surface-variant">
                        {Math.round(progress)}% COMPLETE
                    </span>
                </div>
                <div className="relative h-1 bg-surface-container-highest rounded-full overflow-visible">
                    <div
                        className="absolute top-0 left-0 h-full bg-secondary-fixed-dim rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                    {WORKFLOW_STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white z-10 transition-all ${
                                idx < currentStepIndex
                                    ? 'w-3.5 h-3.5 bg-secondary-fixed'
                                    : idx === currentStepIndex
                                        ? 'w-5 h-5 bg-primary ring-4 ring-primary-fixed animate-pulse'
                                        : 'w-3.5 h-3.5 bg-outline-variant'
                            }`}
                            style={{ left: `${(idx / 3) * 100}%`, transform: 'translate(-50%, -50%)' }}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-3 text-xs text-on-surface-variant">
                    {WORKFLOW_STEPS.map((step, idx) => (
                        <span key={step} className={idx === currentStepIndex ? 'font-bold text-primary' : 'opacity-60'}>
                            {step}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Annotation Tool Area ── */}
            <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                {/* Floating Toolbar */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-surface/90 backdrop-blur-md p-1.5 rounded-lg border border-outline-variant shadow-lg">
                    <button
                        onClick={() => mode.setActiveTool('box')}
                        className={`p-2 rounded transition-all hover:scale-110 ${
                            mode.activeTool === 'box'
                                ? 'bg-primary text-on-primary'
                                : 'hover:bg-surface-variant text-on-surface'
                        }`}
                        title="Draw Box (B)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3h18v18H3z" />
                            <path d="M3 9h18M9 3v18" />
                        </svg>
                    </button>
                    <button
                        onClick={() => mode.setActiveTool('polygon')}
                        className={`p-2 rounded transition-all hover:scale-110 ${
                            mode.activeTool === 'polygon'
                                ? 'bg-primary text-on-primary'
                                : 'hover:bg-surface-variant text-on-surface'
                        }`}
                        title="Draw Polygon"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l4 13h12l4-13-10-5z" />
                        </svg>
                    </button>
                    <div className="w-full h-px bg-outline-variant my-1" />
                    <button
                        onClick={() => mode.setActiveTool('delete')}
                        className={`p-2 rounded transition-all hover:scale-110 ${
                            mode.activeTool === 'delete'
                                ? 'bg-error-container text-error'
                                : 'hover:bg-error-container hover:text-error text-on-surface'
                        }`}
                        title="Delete Selection (DEL)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                    </button>
                </div>

                {/* Stats Overlay */}
                <div className="absolute top-4 right-4 z-20 bg-surface/90 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <span>{totalBoxes} Box{totalBoxes !== 1 ? 'es' : ''} Drawn</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{formatTime(elapsed)} elapsed</span>
                    </div>
                </div>

                {/* Main Canvas */}
                <div
                    ref={canvasRef}
                    className="relative aspect-video w-full overflow-hidden flex items-center justify-center bg-surface-dim cursor-crosshair select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Uploaded annotation image */}
                    {annotationImage ? (
                        <img
                            src={annotationImage}
                            alt="Annotation target"
                            className="absolute inset-0 w-full h-full object-contain"
                        />
                    ) : (
                        /* Placeholder image */
                        <div className="absolute inset-0 bg-gradient-to-br from-surface-container to-surface-dim flex items-center justify-center">
                            <div className="text-center">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <p className="text-on-surface-variant text-sm font-semibold">Upload a picture to start labeling</p>
                                <p className="text-on-surface-variant/60 text-xs mt-1 mb-3">or use camera from the Collect step</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-bold hover:shadow-md transition-all"
                                >
                                    Upload Picture
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing bounding boxes */}
                    {mode.currentAnnotation?.boxes.map((box) => (
                        <div
                            key={box.id}
                            className={`absolute border-2 cursor-move transition-all ${
                                mode.selectedBoxId === box.id
                                    ? 'shadow-lg z-10'
                                    : 'hover:shadow-md'
                            }`}
                            style={{
                                left: `${box.x}%`,
                                top: `${box.y}%`,
                                width: `${box.width}%`,
                                height: `${box.height}%`,
                                borderColor: box.color,
                                backgroundColor: `${box.color}1a`
                            }}
                            onMouseDown={(e) => handleBoxMouseDown(e, box.id)}
                        >
                            {/* Label tag */}
                            <div
                                className="absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-white whitespace-nowrap z-20"
                                style={{ backgroundColor: box.color }}
                            >
                                {box.label}
                            </div>

                            {/* Corner handles */}
                            {mode.selectedBoxId === box.id && (
                                <>
                                    <div
                                        className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border cursor-nw-resize z-30"
                                        style={{ borderColor: box.color }}
                                        onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'nw')}
                                    />
                                    <div
                                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border cursor-ne-resize z-30"
                                        style={{ borderColor: box.color }}
                                        onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'ne')}
                                    />
                                    <div
                                        className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border cursor-sw-resize z-30"
                                        style={{ borderColor: box.color }}
                                        onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'sw')}
                                    />
                                    <div
                                        className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border cursor-se-resize z-30"
                                        style={{ borderColor: box.color }}
                                        onMouseDown={(e) => handleResizeMouseDown(e, box.id, 'se')}
                                    />
                                </>
                            )}
                        </div>
                    ))}

                    {/* Preview box while drawing */}
                    {previewBox && previewBox.width > 0.5 && previewBox.height > 0.5 && (
                        <div
                            className="absolute border-2 border-dashed pointer-events-none z-10"
                            style={{
                                left: `${previewBox.x}%`,
                                top: `${previewBox.y}%`,
                                width: `${previewBox.width}%`,
                                height: `${previewBox.height}%`,
                                borderColor: '#7C3AED',
                                backgroundColor: 'rgba(124, 58, 237, 0.1)'
                            }}
                        />
                    )}
                </div>

                {/* Control Bar */}
                <div className="p-3 bg-surface-container-lowest border-t border-outline-variant flex justify-between items-center">
                    <div className="flex gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 text-on-surface-variant font-medium hover:text-primary transition-all text-xs"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload
                        </button>
                        <button
                            onClick={handleUndo}
                            disabled={undoStack.length === 0}
                            className="flex items-center gap-1.5 text-on-surface-variant font-medium hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7v6h6" />
                                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.69 3L3 13" />
                            </svg>
                            Undo
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={redoStack.length === 0}
                            className="flex items-center gap-1.5 text-on-surface-variant font-medium hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 7v6h-6" />
                                <path d="M3 17a9 9 0 019-9 9 9 0 016.69 3L21 13" />
                            </svg>
                            Redo
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase">Zoom:</span>
                            <input
                                type="range"
                                min="50"
                                max="200"
                                value={mode.zoom}
                                onChange={(e) => mode.setZoom(Number(e.target.value))}
                                className="w-24 h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-[10px] font-mono font-semibold text-on-surface-variant">{mode.zoom}%</span>
                        </div>
                        <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold text-xs hover:shadow-[4px_4px_0px_0px_#630ed4] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all">
                            Save Annotations
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Info Cards ── */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
                    </svg>
                    <h4 className="text-sm font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pro Tip</h4>
                    <p className="text-xs text-on-surface-variant">Use tight bounding boxes for better model precision. Ensure margins around the objects are minimal.</p>
                </div>
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006C44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                    </svg>
                    <h4 className="text-sm font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Shortcuts</h4>
                    <p className="text-xs text-on-surface-variant">Press <kbd className="px-1 bg-surface-variant rounded text-[10px]">B</kbd> for Box, <kbd className="px-1 bg-surface-variant rounded text-[10px]">DEL</kbd> to remove, <kbd className="px-1 bg-surface-variant rounded text-[10px]">Ctrl+Z</kbd> to undo.</p>
                </div>
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#982100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.21 15.89A10 10 0 118 2.83" />
                        <path d="M22 12A10 10 0 0012 2v10z" />
                    </svg>
                    <h4 className="text-sm font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Project Health</h4>
                    <p className="text-xs text-on-surface-variant">{totalBoxes > 5 ? 'Your annotation density is high enough to start a preview training run.' : `Add ${Math.max(0, 6 - totalBoxes)} more annotations to enable training.`}</p>
                </div>
            </div>
        </div>
    )
}
