/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Stage — UI-refined version (intermediate / embedded stage mode)
 *
 * CHANGES FROM PREVIOUS VERSION:
 * ─────────────────────────────────────────────────────────────────────────────
 * OUTER WRAPPER  (the div that surrounds the canvases)
 *   • Added `display: flex; alignItems: center; justifyContent: center` so the
 *     stage canvas is always centred inside its container — critical for the
 *     intermediate embed layout where the panel shrinks below the canvas's
 *     natural size.
 *   • `backgroundColor` changed from plain `#fff` to `#F8FAFC` (slate-50) — a
 *     slightly warmer white that matches the IDE's workspace background and
 *     prevents a harsh pure-white flash before the first backdrop loads.
 *   • `borderRadius` tightened from 8 px → 6 px to stay consistent with the
 *     IDE's `rounded-lg` system (= 8 px Tailwind ≈ 6 px fits within panel
 *     corners without over-rounding).
 *   • `overflow: hidden` added to the wrapper so the canvas never bleeds
 *     outside its border-radius — was missing before and caused visible
 *     squared corners in Safari.
 *   • `boxShadow` upgraded from `0 2px 8px rgba(0,0,0,0.1)` to
 *     `0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)` — softer
 *     two-layer shadow that reads better at both small and large sizes.
 *
 * CORNER MARKERS
 *   • CORNER_WIDTH / CORNER_HEIGHT reduced from 28 px → 20 px.
 *     In the intermediate (embed) stage the canvas is smaller; 28 px markers
 *     overlap each other at widths < ~120 px.
 *   • BORDER_WIDTH reduced from 4 px → 3 px to stay visually proportional at
 *     the smaller marker size.
 *   • OFFSET recomputed accordingly: -BORDER_WIDTH → -3 px.
 *   • CORNER_RADIUS reduced from 4 px → 3 px for the same proportion reason.
 *   • CORNER_COLOR unchanged (#8b5cf6) — matches the violet accent used
 *     throughout the sprite panel and info bar.
 *
 * CANVAS LAYOUT
 *   • Both `canvasRef` and `penCanvasRef` use `position: absolute; top:0; left:0`
 *     and explicit `width` / `height` props (already present) — no change needed.
 *   • Added `maxWidth: '100%'` and `maxHeight: '100%'` inline styles to both
 *     canvases so in an embed context where the container is narrower than
 *     `width`, the canvas scales down via CSS without distorting the internal
 *     coordinate system. The logical resolution stays at STAGE_CONFIG.WIDTH ×
 *     STAGE_CONFIG.HEIGHT; only the display size adapts.
 *   • `cursor` on main canvas: `draggingSpriteId ? 'grabbing' : 'default'`
 *     (was `crosshair`) — `crosshair` felt technical/raw for end users in the
 *     learner-facing intermediate mode. Using `default` keeps it friendly.
 *
 * DRAG OVERLAY RENDERING (inside `render` callback)
 *   • Label font changed from `bold 12px Arial` → `600 11px system-ui` to
 *     align with the IDE's font stack and avoid Arial's slightly different
 *     metrics on Windows.
 *   • Coordinate lines: `strokeStyle` changed from `#4C97FF` → `#8B5CF6`
 *     (violet) to match the corner-marker and sprite-panel accent colour.
 *   • Label text colour likewise updated to `#8B5CF6`.
 *
 * GRID NUMBERS (showGridNumbers mode)
 *   • Number font changed from `10px Arial` → `10px system-ui` for
 *     consistency.
 *   • Grid line colour: `#e5e5e5` → `#ede9fe` (violet-50) — very faint violet
 *     tint that feels more at home in the LEAPLAB colour palette.
 *   • Center-cross colour: `#ddd` → `#c4b5fd` (violet-300) — slightly more
 *     visible yet still subtle.
 *
 * POINTER / DRAG HANDLERS
 *   • No logic changes — all existing hit-detection, drag, pointer-capture,
 *     and animationVM sync left intact.
 *
 * VIDEO OVERLAY (isCameraOn)
 *   • No changes — works correctly as-is.
 *
 * MONITORS
 *   • No changes — VariableMonitor, ListMonitor, TableMonitor rendering
 *     logic unchanged; they are positioned inside the stage div already.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import './Stage.css';
import { Sprite } from './Sprite';
import { gameLoop } from '../engine/GameLoop';
import { stageManager } from '../engine/StageManager';
import { penManager } from '../engine/PenManager';
import VariableMonitor from '../components/VariableMonitor';
import ListMonitor from '../components/ListMonitor';
import TableMonitor from '../components/TableMonitor';
import { animationVM } from '../vm/AnimationVM';
import { setFaceVideoElement, setVideoPlayerElement } from '../runtime/RuntimeBridge';

// ── Monitor type interfaces (unchanged) ────────────────────────────────────
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
    onListAddItem?: (listName: string, item: string) => void;
    onListEditItem?: (listName: string, index: number, value: string) => void;
    onListDeleteItem?: (listName: string, index: number) => void;
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
    onVariableSliderRangeChange,
    onListAddItem,
    onListEditItem,
    onListDeleteItem
}) => {
    const canvasRef     = useRef<HTMLCanvasElement>(null);
    const penCanvasRef  = useRef<HTMLCanvasElement>(null);
    const videoRef      = useRef<HTMLVideoElement>(null);
    const videoPlaybackRef = useRef<HTMLVideoElement>(null);
    const videoPlaybackContainerRef = useRef<HTMLDivElement>(null);
    const [draggingSpriteId, setDraggingSpriteId] = useState<string | null>(null);
    const [dragOffset,       setDragOffset]       = useState({ x: 0, y: 0 });
    const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

    // ── Camera setup ──────────────────────────────────────────────────────
    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isCameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                        setFaceVideoElement(videoRef.current);
                        if ((window as any).runtime?.bodyDetection) {
                            (window as any).runtime.bodyDetection.setCameraOn("on");
                        }
                    }
                })
                .catch((err) => console.error("Error accessing camera:", err));
        } else {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
            setFaceVideoElement(null);
            if ((window as any).runtime?.bodyDetection) {
                (window as any).runtime.bodyDetection.setCameraOn("off");
            }
        }
        return () => { stream?.getTracks().forEach(t => t.stop()); };
    }, [isCameraOn]);

    // ── Video Player setup ───────────────────────────────────────────────
    useEffect(() => {
        if (videoPlaybackRef.current) {
            setVideoPlayerElement(videoPlaybackRef.current, videoPlaybackContainerRef.current);
        }
        return () => { setVideoPlayerElement(null, null); };
    }, []);

    // ── Canvas click handler (unchanged logic) ─────────────────────────────
    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect   = canvas.getBoundingClientRect();
        const leapX  = ((event.clientX - rect.left)  / rect.width)  * width  - width  / 2;
        const leapY  = height / 2 - ((event.clientY - rect.top) / rect.height) * height;

        const soundManager = (window as any).soundManager;
        if (soundManager?.audioContext?.state === 'suspended') {
            soundManager.audioContext.resume().catch(console.warn);
        }

        let clickedSprite = null;
        for (const sprite of sprites) {
            if (sprite.visible && sprite.isPointInSprite(leapX, leapY)) {
                clickedSprite = sprite;
                break;
            }
        }

        if (clickedSprite && onSpriteSelect) onSpriteSelect(clickedSprite.id);
        else if (onStageClick)               onStageClick(leapX, leapY);
    }, [width, height, sprites, onSpriteSelect, onStageClick]);

    // ── Pen canvas init (unchanged) ────────────────────────────────────────
    useEffect(() => {
        if (penCanvasRef.current) penManager.setPenCanvas(penCanvasRef.current);
        return () => penManager.setPenCanvas(null);
    }, []);

    // ── Render (backdrop → grid → drag overlay → sprites → pen) ───────────
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Backdrop
        ctx.clearRect(0, 0, width, height);
        const backdrop = stageManager.currentBackdrop;
        if (backdrop?.image) {
            ctx.drawImage(backdrop.image, 0, 0, width, height);
        } else if (!isCameraOn) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Grid (showGridNumbers mode)
        if (showGridNumbers) {
            // ── CHANGED: violet-tinted grid lines ─────────────────────────
            ctx.strokeStyle = '#ede9fe';   // was #e5e5e5
            ctx.lineWidth = 1;

            const xCount = 20;
            const yCount = 15;
            const gx = width  / xCount;
            const gy = height / yCount;

            for (let i = 0; i <= xCount; i++) {
                ctx.beginPath();
                ctx.moveTo(i * gx, 0);
                ctx.lineTo(i * gx, height);
                ctx.stroke();
            }
            for (let i = 0; i <= yCount; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * gy);
                ctx.lineTo(width, i * gy);
                ctx.stroke();
            }

            // ── CHANGED: system-ui font instead of Arial ──────────────────
            ctx.fillStyle = '#999';
            ctx.font = '10px system-ui';
            ctx.textAlign = 'center';
            for (let i = 1; i <= xCount; i++) {
                ctx.fillText(String(i), i * gx - gx / 2, height - 4);
            }
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 1; i <= yCount; i++) {
                ctx.fillText(String(i), width - 4, height - (i * gy) + gy / 2);
            }

            // ── CHANGED: violet-300 centre cross ──────────────────────────
            ctx.strokeStyle = '#c4b5fd';   // was #ddd
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);       ctx.lineTo(width / 2, height);
            ctx.moveTo(0, height / 2);      ctx.lineTo(width, height / 2);
            ctx.stroke();
        }

        // 3. Drag overlay
        if (draggingSpriteId) {
            const ds = sprites.find(s => s.id === draggingSpriteId);
            if (ds) {
                const cx = width  / 2 + ds.x;
                const cy = height / 2 - ds.y;

                // ── CHANGED: violet accent on drag lines & label ───────────
                ctx.strokeStyle = '#8B5CF6';   // was #4C97FF
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(cx, 0);      ctx.lineTo(cx, height);
                ctx.moveTo(0, cy);      ctx.lineTo(width, cy);
                ctx.stroke();
                ctx.setLineDash([]);

                // ── CHANGED: system-ui font, violet colour ─────────────────
                ctx.fillStyle = '#8B5CF6';
                ctx.font = '600 11px system-ui';
                ctx.textAlign = 'left';
                ctx.fillText(`X: ${Math.round(ds.x)}  Y: ${Math.round(ds.y)}`, cx + 8, cy - 8);
            }
        }

        // 4. Sprites
        for (const sprite of sprites) {
            sprite.render(ctx, width, height);
        }

        // 5. Pen trails
        const penCanvas = penCanvasRef.current;
        if (penCanvas) {
            const penCtx = penCanvas.getContext('2d');
            if (penCtx) {
                for (const sprite of sprites) {
                    if (sprite.isPenDown && sprite.visible) {
                        const tip = sprite.getPenTipPosition();
                        const cx  = width  / 2 + tip.x;
                        const cy  = height / 2 - tip.y;
                        const prev = prevPositionsRef.current.get(sprite.id);
                        if (prev) {
                            penManager.drawLine(prev.x, prev.y, cx, cy, sprite.penColor, sprite.penSize);
                        }
                        prevPositionsRef.current.set(sprite.id, { x: cx, y: cy });
                    } else {
                        prevPositionsRef.current.delete(sprite.id);
                    }
                }
            }
        }

        // 6. AI Detection Highlighting (Dynamic Tracking)
        if (isCameraOn) {
            const faceRuntime = (window as any).runtime?.face;
            const faces = faceRuntime?.getFaces() || [];
            const videoDim = faceRuntime?.getVideoDimensions() || { width: 640, height: 480 };

            if (faces.length > 0) {
                ctx.lineWidth = 2;
                ctx.textAlign = 'left';

                const scaleX = width / videoDim.width;
                const scaleY = height / videoDim.height;

                faces.forEach((face: any, i: number) => {
                    const { x, y, width: fW, height: fH, emotion } = face;

                    const stageX = x * scaleX;
                    const stageY = y * scaleY;
                    const stageW = fW * scaleX;
                    const stageH = fH * scaleY;
                    const mirroredX = width - stageX - stageW;

                    // Color-code by emotion
                    const colorMap: Record<string, string> = {
                        happy:    '#10b981', // Emerald
                        sad:      '#60a5fa', // Blue
                        angry:    '#ef4444', // Red
                        surprised:'#f59e0b', // Amber
                        fearful:  '#a78bfa', // Violet
                        disgusted:'#84cc16', // Lime
                        neutral:  '#94a3b8', // Slate
                    };
                    const color = colorMap[emotion ?? 'neutral'] ?? '#10b981';

                    ctx.strokeStyle = color;
                    ctx.strokeRect(mirroredX, stageY, stageW, stageH);

                    // Label: "Face 1 • happy"
                    const label = `Face ${i + 1}${emotion ? ` • ${emotion}` : ''}`;
                    ctx.font = 'bold 12px system-ui';
                    const textW = ctx.measureText(label).width + 8;
                    ctx.fillStyle = color;
                    ctx.fillRect(mirroredX, stageY - 18, textW, 18);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, mirroredX + 4, stageY - 4);
                });
            }
        }
    }, [width, height, sprites, showGridNumbers, draggingSpriteId, isCameraOn]);






    // ── Game loop (unchanged) ──────────────────────────────────────────────
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

    // ── Pointer handlers (unchanged logic) ────────────────────────────────
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect   = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left)  * (width  / rect.width))  - width  / 2;
        const mouseY = height / 2 - ((e.clientY - rect.top) * (height / rect.height));

        for (let i = sprites.length - 1; i >= 0; i--) {
            const sprite = sprites[i];
            if (!sprite.visible) continue;
            const scale = sprite.size / 100;
            const w = (sprite.currentCostume?.width  || 80) * scale;
            const h = (sprite.currentCostume?.height || 80) * scale;

            if (Math.abs(mouseX - sprite.x) <= w / 2 && Math.abs(mouseY - sprite.y) <= h / 2) {
                animationVM.setMouseDown(true);
                setDraggingSpriteId(sprite.id);
                setDragOffset({ x: sprite.x - mouseX, y: sprite.y - mouseY });
                sprite.setDragging(true);
                onSpriteSelect?.(sprite.id);
                onSpriteClick?.(sprite.id);
                canvas.setPointerCapture(e.pointerId);
                return;
            }
        }

        animationVM.setMouseDown(true);
        onStageClick?.(mouseX, mouseY);
        onSpriteClick?.('stage');
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left)  * (width  / rect.width))  - width  / 2;
        const my = height / 2 - ((e.clientY - rect.top) * (height / rect.height));

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
            sprite?.setDragging(false);
            setDraggingSpriteId(null);
            canvasRef.current?.releasePointerCapture(e.pointerId);
        }
    };

    // ── Corner marker config ───────────────────────────────────────────────
    // CHANGED: smaller markers (20×20, 3px border) for embed/intermediate size
    const CORNER_W     = 20;   // was 28
    const CORNER_H     = 20;   // was 28
    const BDR_W        = 3;    // was 4
    const CORNER_COLOR = '#8b5cf6';
    const OFF          = -BDR_W;   // flush with edge
    const CORNER_R     = 3;    // was 4

    const cornerBase: React.CSSProperties = {
        position: 'absolute',
        width:  CORNER_W,
        height: CORNER_H,
        zIndex: 1,
        pointerEvents: 'none',
        boxSizing: 'border-box',
    };

    return (
        // ── OUTER WRAPPER ──────────────────────────────────────────────────
        // CHANGED: overflow:hidden added, softer two-layer shadow, flex-center
        // alignment, borderRadius tightened to 6px.
        <div className="relative bg-[#F8FAFC] rounded-[6px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center" style={{ width, height }}>

            {/* ── CORNER MARKERS (smaller, violet) ─────────────────────── */}
            <div style={{ ...cornerBase, top: OFF, left: OFF,
                borderLeft:  `${BDR_W}px solid ${CORNER_COLOR}`,
                borderTop:   `${BDR_W}px solid ${CORNER_COLOR}`,
                borderRadius: `${CORNER_R}px 0 0 0` }} />
            <div style={{ ...cornerBase, top: OFF, right: OFF,
                borderRight: `${BDR_W}px solid ${CORNER_COLOR}`,
                borderTop:   `${BDR_W}px solid ${CORNER_COLOR}`,
                borderRadius: `0 ${CORNER_R}px 0 0` }} />
            <div style={{ ...cornerBase, bottom: OFF, left: OFF,
                borderLeft:   `${BDR_W}px solid ${CORNER_COLOR}`,
                borderBottom: `${BDR_W}px solid ${CORNER_COLOR}`,
                borderRadius: `0 0 0 ${CORNER_R}px` }} />
            <div style={{ ...cornerBase, bottom: OFF, right: OFF,
                borderRight:  `${BDR_W}px solid ${CORNER_COLOR}`,
                borderBottom: `${BDR_W}px solid ${CORNER_COLOR}`,
                borderRadius: `0 0 ${CORNER_R}px 0` }} />

            {/* ── CAMERA OVERLAY ─────────────────────────────────────────── */}
            {isCameraOn && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100"
                />
            )}

            {/* ── VIDEO PLAYBACK OVERLAY ────────────────────────────────────── */}
            <div
                id="video-playback-container"
                ref={videoPlaybackContainerRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full hidden overflow-hidden pointer-events-none z-[1]"
            >
                <video
                    id="video-playback"
                    ref={videoPlaybackRef}
                    playsInline
                    className="w-full h-full object-contain"
                />
            </div>

            {/* ── MAIN CANVAS ──────────────────────────────────────────────── */}
            {/* CHANGED: maxWidth/maxHeight added so canvas scales down in CSS  */}
            {/* when the embed container is smaller than STAGE_CONFIG dimensions */}
            {/* CHANGED: cursor changed to 'default' (was 'crosshair')          */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    display: 'block',
                    maxWidth: '100%',     // NEW — responsive scale-down
                    maxHeight: '100%',    // NEW
                    backgroundColor: isCameraOn ? 'transparent' : '#fff',
                    cursor: draggingSpriteId ? 'grabbing' : 'default',  // CHANGED
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />

            {/* ── PEN TRAIL LAYER ──────────────────────────────────────────── */}
            <canvas
                ref={penCanvasRef}
                width={width}
                height={height}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    maxWidth: '100%',     // NEW — matches main canvas scaling
                    maxHeight: '100%',    // NEW
                    pointerEvents: 'none',
                }}
            />

            {/* ── VARIABLE MONITORS ─────────────────────────────────────────── */}
            {variableMonitors
                .filter(m =>
                    m.visible &&
                    (m.scope === 'all_sprites' ||
                     (m.scope === 'this_sprite' && m.spriteId === selectedSpriteId))
                )
                .map(m => (
                    <VariableMonitor
                        key={m.id}
                        name={m.name}
                        value={m.value}
                        visible={m.visible}
                        x={m.x}
                        y={m.y}
                        stageWidth={width}
                        stageHeight={height}
                        zIndex={m.zIndex}
                        mode={m.mode}
                        sliderMin={m.sliderMin}
                        sliderMax={m.sliderMax}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('variable', m.id, x, y)}
                        onPointerDown={() => onMonitorBringToFront?.('variable', m.id)}
                        onModeChange={(mode) => onVariableModeChange?.(m.id, mode)}
                        onValueChange={(value) => onVariableValueChange?.(m.id, value as number)}
                        onSliderRangeChange={(min, max) => onVariableSliderRangeChange?.(m.id, min, max)}
                    />
                ))}

            {/* ── LIST MONITORS ─────────────────────────────────────────────── */}
            {listMonitors
                .filter(m =>
                    m.visible &&
                    (m.scope === 'all_sprites' ||
                     (m.scope === 'this_sprite' && m.spriteId === selectedSpriteId))
                )
                .map(m => (
                    <ListMonitor
                        key={m.id}
                        name={m.name}
                        items={m.items}
                        visible={m.visible}
                        x={m.x}
                        y={m.y}
                        width={m.width}
                        height={m.height}
                        zIndex={m.zIndex}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('list', m.id, x, y)}
                        onResize={(w, h) => onMonitorResize?.('list', m.id, w, h)}
                        onPointerDown={() => onMonitorBringToFront?.('list', m.id)}
                        onItemAdd={(item) => onListAddItem?.(m.name, item)}
                        onItemEdit={(index, value) => onListEditItem?.(m.name, index, value)}
                        onItemDelete={(index) => onListDeleteItem?.(m.name, index)}
                    />
                ))}

            {/* ── TABLE MONITORS ────────────────────────────────────────────── */}
            {tableMonitors
                .filter(m =>
                    m.visible &&
                    (m.scope === 'all_sprites' ||
                     (m.scope === 'this_sprite' && m.spriteId === selectedSpriteId))
                )
                .map(m => (
                    <TableMonitor
                        key={m.id}
                        name={m.name}
                        data={m.data}
                        visible={m.visible}
                        x={m.x}
                        y={m.y}
                        width={m.width}
                        height={m.height}
                        zIndex={m.zIndex}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('table', m.id, x, y)}
                        onResize={(w, h) => onMonitorResize?.('table', m.id, w, h)}
                        onPointerDown={() => onMonitorBringToFront?.('table', m.id)}
                    />
                ))}

            {/* ── SENSING MONITORS ──────────────────────────────────────────── */}
            {sensingMonitors
                .filter(m => m.visible)
                .map(m => (
                    <VariableMonitor
                        key={m.id}
                        name={m.name}
                        value={m.value}
                        visible={m.visible}
                        x={m.x}
                        y={m.y}
                        stageWidth={width}
                        stageHeight={height}
                        zIndex={m.zIndex}
                        onPositionChange={(x, y) => onMonitorPositionChange?.('sensing', m.id, x, y)}
                        onPointerDown={() => onMonitorBringToFront?.('sensing', m.id)}
                    />
                ))}
        </div>
    );
};

export default Stage;
