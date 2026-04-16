import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Sprite } from './Sprite';
import { gameLoop } from '../engine/GameLoop';
import { stageManager } from '../engine/StageManager';
import { penManager } from '../engine/PenManager';
import VariableMonitor from '../components/VariableMonitor';
import ListMonitor from '../components/ListMonitor';
import TableMonitor from '../components/TableMonitor';
import { animationVM } from '../vm/AnimationVM';
import { setFaceVideoElement } from '../runtime/RuntimeBridge';

// Monitor interfaces (matching IntermediateApp)
interface VariableMonitorState {
    id: string;
    name: string;
    type: 'Number' | 'String';
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    value: number | string;
    x: number;
    y: number;
    zIndex?: number;
    mode?: 'normal' | 'large' | 'slider';
    sliderMin?: number;
    sliderMax?: number;
}

export interface ListMonitorState {
    id: string;
    name: string;
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    items: (string | number)[];
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}

export interface TableMonitorState {
    id: string;
    name: string;
    rows: number;
    cols: number;
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    data: (string | number)[][];
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE component
// ═══════════════════════════════════════════════════════════════════════════

import { STAGE_CONFIG } from '../engine/StageConfig';

interface StageProps {
    width?: number;
    height?: number;
    sprites: Sprite[];
    isRunning: boolean;
    onStageClick?: (x: number, y: number) => void;
    showGridNumbers?: boolean;
    onSpriteSelect?: (id: string) => void;
    onSpriteClick?: (id: string) => void;
    isCameraOn?: boolean;
    variableMonitors?: VariableMonitorState[];
    listMonitors?: ListMonitorState[];
    tableMonitors?: TableMonitorState[];
    sensingMonitors?: VariableMonitorState[];
    selectedSpriteId?: string | null;
    onMonitorPositionChange?: (type: 'variable' | 'list' | 'table' | 'sensing', id: string, x: number, y: number) => void;
    onMonitorResize?: (type: 'list' | 'table', id: string, width: number, height: number) => void;
    onMonitorBringToFront?: (type: 'variable' | 'list' | 'table' | 'sensing', id: string) => void;
    onVariableModeChange?: (id: string, mode: 'normal' | 'large' | 'slider') => void;
    onVariableValueChange?: (id: string, value: number | string) => void;
    onVariableSliderRangeChange?: (id: string, min: number, max: number) => void;
}

export const Stage: React.FC<StageProps> = ({
    width = STAGE_CONFIG.WIDTH,
    height = STAGE_CONFIG.HEIGHT,
    sprites,
    isRunning,
    onStageClick,
    onSpriteClick,
    showGridNumbers = false,
    onSpriteSelect,
    isCameraOn = false,
    variableMonitors = [],
    listMonitors = [],
    tableMonitors = [],
    sensingMonitors = [],
    selectedSpriteId = null,
    onMonitorPositionChange,
    onMonitorResize,
    onMonitorBringToFront,
    onVariableModeChange,
    onVariableValueChange,
    onVariableSliderRangeChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const penCanvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [draggingSpriteId, setDraggingSpriteId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    // Track previous positions for pen drawing
    const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isCameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                        // Give FaceRuntime access to the live video element
                        setFaceVideoElement(videoRef.current);
                    }
                })
                .catch((err) => console.error("Error accessing camera:", err));
        } else {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            // Detach from FaceRuntime when camera is off
            setFaceVideoElement(null);
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOn]);

    // Handle canvas click for audio context resume and sprite selection
    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert to leap coordinates (-240 to 240, -180 to 180)
        // Correct math using rect.width/height to handle scaled/responsive canvas
        const leapX = ((x / rect.width) * width) - width / 2;
        const leapY = height / 2 - ((y / rect.height) * height);

        // Resume audio context on user interaction (required by browser autoplay policy)
        const soundManager = (window as any).soundManager;
        if (soundManager && soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
            soundManager.audioContext.resume().then(() => {
                console.log('[Stage] Audio context resumed');
            }).catch((err: any) => {
                console.warn('[Stage] Failed to resume audio context:', err);
            });
        }

        // Check if clicking on a sprite
        let clickedSprite = null;
        for (const sprite of sprites) {
            if (sprite.visible && sprite.isPointInSprite(leapX, leapY)) {
                clickedSprite = sprite;
                break;
            }
        }

        if (clickedSprite && onSpriteSelect) {
            onSpriteSelect(clickedSprite.id);
        } else if (onStageClick) {
            onStageClick(leapX, leapY);
        }
    }, [width, height, sprites, onSpriteSelect, onStageClick]);

    // Initialize pen manager with the pen canvas
    useEffect(() => {
        if (penCanvasRef.current) {
            penManager.setPenCanvas(penCanvasRef.current);
        }
        return () => {
            penManager.setPenCanvas(null);
        };
    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Draw backdrop
        ctx.clearRect(0, 0, width, height);
        const backdrop = stageManager.currentBackdrop;
        if (backdrop && backdrop.image) {
            ctx.drawImage(backdrop.image, 0, 0, width, height);
        } else if (!isCameraOn) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw grid (Leapblocks style)
        if (showGridNumbers) {
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 1;

            const gridSpacing = width / 20;
            const xCount = 20;
            const yCount = 15;

            for (let i = 0; i <= xCount; i++) {
                const x = i * gridSpacing;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let i = 0; i <= yCount; i++) {
                const y = i * (height / 15);
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // 3. Junior numbers
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            for (let i = 1; i <= 20; i++) {
                const x = i * (width / 20) - (width / 40);
                ctx.fillText(String(i), x, height - 4);
            }
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 1; i <= 15; i++) {
                const y = height - (i * (height / 15)) + (height / 30);
                ctx.fillText(String(i), width - 4, y);
            }

            // 4. Center cross
            ctx.strokeStyle = '#ddd';
            ctx.beginPath();
            ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
            ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
            ctx.stroke();
        }

        // 5. Drag overlay
        if (draggingSpriteId) {
            const draggedSprite = sprites.find(s => s.id === draggingSpriteId);
            if (draggedSprite) {
                const cx = width / 2 + draggedSprite.x;
                const cy = height / 2 - draggedSprite.y;

                // Draw coordinate lines
                ctx.strokeStyle = '#4C97FF';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
                ctx.moveTo(0, cy); ctx.lineTo(width, cy);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw label
                ctx.fillStyle = '#4C97FF';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`X: ${Math.round(draggedSprite.x)} Y: ${Math.round(draggedSprite.y)}`, cx + 10, cy - 10);
            }
        }

        // 6. Render sprites
        for (const sprite of sprites) {
            sprite.render(ctx, width, height);
        }

        // 7. Draw pen trails (on separate canvas)
        const penCanvas = penCanvasRef.current;
        if (penCanvas) {
            const penCtx = penCanvas.getContext('2d');
            if (penCtx) {
                for (const sprite of sprites) {
                    if (sprite.isPenDown && sprite.visible) {
                        // Use the tip position, not the sprite center
                        const tip = sprite.getPenTipPosition();
                        const cx = width / 2 + tip.x;
                        const cy = height / 2 - tip.y;

                        const prevPos = prevPositionsRef.current.get(sprite.id);
                        if (prevPos) {
                            penManager.drawLine(
                                prevPos.x, prevPos.y,
                                cx, cy,
                                sprite.penColor,
                                sprite.penSize
                            );
                        }

                        // Store canvas coords directly so we don't re-convert next frame
                        prevPositionsRef.current.set(sprite.id, { x: cx, y: cy });
                    } else {
                        // Pen lifted — clear tracking so next penDown starts fresh
                        prevPositionsRef.current.delete(sprite.id);
                    }
                }
            }
        }
    }, [width, height, sprites, showGridNumbers, draggingSpriteId, isCameraOn]);

    useEffect(() => {
        const handleUpdate = (deltaMs: number) => {
            if (isRunning) {
                for (const sprite of sprites) {
                    if (sprite.isGliding) sprite.updateGlide(deltaMs);
                }
            }
            render();
        };
        gameLoop.addUpdateCallback(handleUpdate);
        gameLoop.start();
        return () => gameLoop.removeUpdateCallback(handleUpdate);
    }, [render, sprites, isRunning]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) * (width / rect.width)) - width / 2;
        const mouseY = height / 2 - ((e.clientY - rect.top) * (height / rect.height));

        // Hit detection (top-most sprite)
        for (let i = sprites.length - 1; i >= 0; i--) {
            const sprite = sprites[i];
            if (!sprite.visible) continue;

            const scale = sprite.size / 100;
            const w = (sprite.currentCostume?.width || 80) * scale; // Approx picking width
            const h = (sprite.currentCostume?.height || 80) * scale;

            if (Math.abs(mouseX - sprite.x) <= w / 2 && Math.abs(mouseY - sprite.y) <= h / 2) {
                animationVM.setMouseDown(true);
                setDraggingSpriteId(sprite.id);
                setDragOffset({ x: sprite.x - mouseX, y: sprite.y - mouseY });
                sprite.setDragging(true); // Trigger drag scale/shadow
                if (onSpriteSelect) onSpriteSelect(sprite.id);
                if (onSpriteClick) onSpriteClick(sprite.id);
                // Capture pointer to track outside canvas
                canvas.setPointerCapture(e.pointerId);
                return;
            }
        }

        animationVM.setMouseDown(true);
        if (onStageClick) onStageClick(mouseX, mouseY);
        if (onSpriteClick) onSpriteClick('stage');
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) * (width / rect.width)) - width / 2;
        const my = height / 2 - ((e.clientY - rect.top) * (height / rect.height));

        // Sync with VM for blocks like "distance to mouse" or "go to mouse"
        animationVM.setMousePosition(mx, my);

        if (draggingSpriteId) {
            const sprite = sprites.find(s => s.id === draggingSpriteId);
            if (sprite) {
                sprite.setX(mx + dragOffset.x);
                sprite.setY(my + dragOffset.y);
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        animationVM.setMouseDown(false);
        if (draggingSpriteId) {
            const sprite = sprites.find(s => s.id === draggingSpriteId);
            if (sprite) {
                sprite.setDragging(false);
            }
            setDraggingSpriteId(null);
            const canvas = canvasRef.current;
            if (canvas) canvas.releasePointerCapture(e.pointerId);
        }
    };

    // --- STAGE CORNER MARKERS CONFIGURATION ---
    const CORNER_WIDTH = 28;
    const CORNER_HEIGHT = 28;
    const BORDER_WIDTH = 4;
    const CORNER_COLOR = '#8b5cf6';
    const OFFSET = -BORDER_WIDTH; // To make it flush with the edge
    const CORNER_RADIUS = 4;

    return (
        <div style={{ position: 'relative', width, height, backgroundColor: '#fff', borderRadius: '8px', overflow: 'visible', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {/* Top-Left Corner */}
            <div style={{ position: 'absolute', top: OFFSET, left: OFFSET, width: CORNER_WIDTH, height: CORNER_HEIGHT, borderLeft: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderTop: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderRadius: `${CORNER_RADIUS}px 0 0 0`, zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' }} />

            {/* Top-Right Corner */}
            <div style={{ position: 'absolute', top: OFFSET, right: OFFSET, width: CORNER_WIDTH, height: CORNER_HEIGHT, borderRight: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderTop: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderRadius: `0 ${CORNER_RADIUS}px 0 0`, zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' }} />

            {/* Bottom-Left Corner */}
            <div style={{ position: 'absolute', bottom: OFFSET, left: OFFSET, width: CORNER_WIDTH, height: CORNER_HEIGHT, borderLeft: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderBottom: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderRadius: `0 0 0 ${CORNER_RADIUS}px`, zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' }} />

            {/* Bottom-Right Corner */}
            <div style={{ position: 'absolute', bottom: OFFSET, right: OFFSET, width: CORNER_WIDTH, height: CORNER_HEIGHT, borderRight: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderBottom: `${BORDER_WIDTH}px solid ${CORNER_COLOR}`, borderRadius: `0 0 ${CORNER_RADIUS}px 0`, zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' }} />

            {isCameraOn && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)' // Mirror effect
                    }}
                />
            )}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    display: 'block',
                    backgroundColor: isCameraOn ? 'transparent' : '#fff',
                    cursor: draggingSpriteId ? 'grabbing' : 'crosshair'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
            {/* Pen trails layer - persists between frames */}
            <canvas
                ref={penCanvasRef}
                width={width}
                height={height}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none', // Let clicks pass through to main canvas
                }}
            />

            {/* Render monitors */}
            {variableMonitors
                .filter(monitor =>
                    monitor.visible &&
                    (monitor.scope === 'all_sprites' ||
                        (monitor.scope === 'this_sprite' && monitor.spriteId === selectedSpriteId))
                )
                .map(monitor => (
                    <VariableMonitor
                        key={monitor.id}
                        name={monitor.name}
                        value={monitor.value}
                        visible={monitor.visible}
                        x={monitor.x}
                        y={monitor.y}
                        stageWidth={width}
                        stageHeight={height}
                        zIndex={monitor.zIndex}
                        mode={monitor.mode}
                        sliderMin={monitor.sliderMin}
                        sliderMax={monitor.sliderMax}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('variable', monitor.id, x, y)}
                        onPointerDown={() => onMonitorBringToFront?.('variable', monitor.id)}
                        onModeChange={(mode) => onVariableModeChange?.(monitor.id, mode)}
                        onValueChange={(value) => onVariableValueChange?.(monitor.id, value as number)}
                        onSliderRangeChange={(min, max) => onVariableSliderRangeChange?.(monitor.id, min, max)}
                    />
                ))}

            {listMonitors
                .filter(monitor =>
                    monitor.visible &&
                    (monitor.scope === 'all_sprites' ||
                        (monitor.scope === 'this_sprite' && monitor.spriteId === selectedSpriteId))
                )
                .map(monitor => (
                    <ListMonitor
                        key={monitor.id}
                        name={monitor.name}
                        items={monitor.items}
                        visible={monitor.visible}
                        x={monitor.x}
                        y={monitor.y}
                        width={monitor.width}
                        height={monitor.height}
                        zIndex={monitor.zIndex}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('list', monitor.id, x, y)}
                        onResize={(w, h) => onMonitorResize?.('list', monitor.id, w, h)}
                        onPointerDown={() => onMonitorBringToFront?.('list', monitor.id)}
                    />
                ))}

            {tableMonitors
                .filter(monitor =>
                    monitor.visible &&
                    (monitor.scope === 'all_sprites' ||
                        (monitor.scope === 'this_sprite' && monitor.spriteId === selectedSpriteId))
                )
                .map(monitor => (
                    <TableMonitor
                        key={monitor.id}
                        name={monitor.name}
                        data={monitor.data}
                        visible={monitor.visible}
                        x={monitor.x}
                        y={monitor.y}
                        width={monitor.width}
                        height={monitor.height}
                        zIndex={monitor.zIndex}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('table', monitor.id, x, y)}
                        onResize={(w, h) => onMonitorResize?.('table', monitor.id, w, h)}
                        onPointerDown={() => onMonitorBringToFront?.('table', monitor.id)}
                    />
                ))}

            {sensingMonitors
                .filter(monitor => monitor.visible)
                .map(monitor => (
                    <VariableMonitor
                        key={monitor.id}
                        name={monitor.name}
                        value={monitor.value}
                        visible={monitor.visible}
                        x={monitor.x}
                        y={monitor.y}
                        stageWidth={width}
                        stageHeight={height}
                        zIndex={monitor.zIndex}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('sensing', monitor.id, x, y)}
                        onPointerDown={() => onMonitorBringToFront?.('sensing', monitor.id)}
                    />
                ))}
        </div>
    );
};


export default Stage;
