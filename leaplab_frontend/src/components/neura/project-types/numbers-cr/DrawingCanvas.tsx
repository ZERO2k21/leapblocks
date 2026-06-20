/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * DrawingCanvas — HTML5 Canvas for drawing digits (0-9)
 * Captures 28×28 grayscale images for MNIST-style digit recognition
 */

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface DrawingCanvasHandle {
    clear: () => void
    capture: () => ImageData | null
}

interface DrawingCanvasProps {
    width?: number
    height?: number
    strokeColor?: string
    bgColor?: string
    strokeWidth?: number
    onCapture?: (imageData: ImageData) => void
    clearTrigger?: number
    className?: string
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
    (
        {
            width = 280,
            height = 280,
            strokeColor = '#ffffff',
            bgColor = '#0d0d1a',
            strokeWidth = 16,
            onCapture,
            clearTrigger = 0,
            className = '',
        },
        ref
    ) => {
        const canvasRef = useRef<HTMLCanvasElement>(null)
        const [isDrawing, setIsDrawing] = useState(false)
        const lastPoint = useRef<{ x: number; y: number } | null>(null)

        // Initialize canvas
        useEffect(() => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, width, height)
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.strokeStyle = strokeColor
            ctx.lineWidth = strokeWidth
        }, [bgColor, strokeColor, strokeWidth, width, height])

        // Clear when trigger changes
        useEffect(() => {
            if (clearTrigger > 0) clearCanvas()
        }, [clearTrigger])

        const clearCanvas = useCallback(() => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, width, height)
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.strokeStyle = strokeColor
            ctx.lineWidth = strokeWidth
        }, [bgColor, strokeColor, strokeWidth, width, height])

        const getPos = (e: React.MouseEvent | React.TouchEvent) => {
            const canvas = canvasRef.current
            if (!canvas) return { x: 0, y: 0 }
            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height

            if ('touches' in e) {
                const touch = e.touches[0]
                return {
                    x: (touch.clientX - rect.left) * scaleX,
                    y: (touch.clientY - rect.top) * scaleY,
                }
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            }
        }

        const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault()
            const pos = getPos(e)
            lastPoint.current = pos
            setIsDrawing(true)

            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            ctx.beginPath()
            ctx.arc(pos.x, pos.y, strokeWidth / 2, 0, Math.PI * 2)
            ctx.fillStyle = strokeColor
            ctx.fill()
        }

        const draw = (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault()
            if (!isDrawing || !lastPoint.current) return

            const pos = getPos(e)
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            ctx.beginPath()
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y)

            // Smooth line with quadratic curve
            const midX = (lastPoint.current.x + pos.x) / 2
            const midY = (lastPoint.current.y + pos.y) / 2
            ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midX, midY)

            ctx.strokeStyle = strokeColor
            ctx.lineWidth = strokeWidth
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.stroke()

            lastPoint.current = pos
        }

        const stopDraw = () => {
            setIsDrawing(false)
            lastPoint.current = null
        }

        const capture = useCallback((): ImageData | null => {
            const canvas = canvasRef.current
            if (!canvas) return null

            // Create 28×28 canvas (MNIST format)
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = 28
            tempCanvas.height = 28
            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) return null

            // Black background (MNIST format)
            tempCtx.fillStyle = '#000000'
            tempCtx.fillRect(0, 0, 28, 28)

            // Draw white digit on black background
            tempCtx.drawImage(canvas, 0, 0, 28, 28)

            return tempCtx.getImageData(0, 0, 28, 28)
        }, [])

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            clear: clearCanvas,
            capture,
        }))

        return (
            <div className={`relative ${className}`}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '1 / 1',
                        borderRadius: 12,
                        cursor: 'crosshair',
                        touchAction: 'none',
                        border: '1px solid #1e1e2e',
                    }}
                />
                {/* Crosshair guide */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        opacity: 0.08,
                    }}
                >
                    <svg width={width * 0.6} height={height * 0.6} viewBox="0 0 100 100" fill="none">
                        <line x1="50" y1="0" x2="50" y2="100" stroke="#fff" strokeWidth="0.5" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#fff" strokeWidth="0.5" />
                        <rect x="10" y="10" width="80" height="80" stroke="#fff" strokeWidth="0.5" fill="none" />
                    </svg>
                </div>
            </div>
        )
    }
)

DrawingCanvas.displayName = 'DrawingCanvas'
export default DrawingCanvas
