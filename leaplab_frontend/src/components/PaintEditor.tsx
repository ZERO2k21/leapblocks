/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import {
    Undo, Redo, Copy, Clipboard, Trash2, Square, Circle, Pen, Eraser,
    Type, MousePointer2, PaintBucket, Minus, FlipHorizontal, FlipVertical,
    ChevronDown, ArrowUp, ArrowDown,
    Plus, Search, MousePointer,
    MoveUp, MoveDown, Layers, Image as ImageIcon,
    Combine, Ungroup, Download, Sparkles, Check, Pipette, Camera
} from 'lucide-react';
import { ActionMenu } from '../stage/ActionMenu';
import { CostumeLibrary } from './CostumeLibrary';
import HSBColorPicker from './HSBColorPicker';
import { resolveAssetPath } from '../embed/utils/assetPaths';

// Built-in costumes for "Surprise" feature
const BUILTIN_COSTUMES = [
    { name: 'Robot Idle', src: 'assets/sprites/robot/robot_idle.svg' },
    { name: 'Cat', src: 'assets/sprites/leap/cat.svg' },
    { name: 'Butterfly', src: 'assets/sprites/leap/butterfly.svg' },
    { name: 'Dolphin', src: 'assets/sprites/leap/dolphin.svg' },
    { name: 'Elephant', src: 'assets/sprites/leap/elephant.svg' },
];

interface Costume {
    id: string;
    name: string;
    image: string;
}

interface PaintEditorProps {
    onSave: (imageData: string, svgData?: string, name?: string, rotationCenter?: { x: number; y: number }) => void;
    onClose: () => void;
    title?: string;
    initialImage?: string;
    costumes?: Costume[];
    spriteName?: string;
    mode?: 'junior' | 'intermediate';
    onDeleteSound?: (index: number) => void;
    onDuplicateSound?: (index: number) => void;
    onSwitchCostume?: (index: number) => void;
    onRenameCostume?: (index: number, newName: string) => void;
    onOpenLibrary?: () => void;
    hideCostumeSidebar?: boolean;
}

function PaintEditor({
    onSave,
    onClose,
    title = "Paint Editor",
    initialImage,
    costumes = [],
    spriteName = "Sprite",
    mode = 'intermediate',
    onDeleteSound,
    onDuplicateSound,
    onSwitchCostume,
    onRenameCostume,
    onOpenLibrary,
    hideCostumeSidebar = false
}: PaintEditorProps) {
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const eraserDrawingRef = useRef(false);
    const eraserBaseRef = useRef('');
    const eraserPointsRef = useRef<{ x: number; y: number; }[]>([]);
    const eraserHandlersRef = useRef<{ down: any; move: any; up: any; } | null>(null);
    const isDirtyRef = useRef(false);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [activeTool, setActiveTool] = useState<string>('select');
    const [fillColor, setFillColor] = useState('#855CD6');
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [zoom, setZoom] = useState(1);
    const isBackdropMode = title === 'Backdrop Editor';
    const canvasW = isBackdropMode ? 480 : 800;
    const canvasH = isBackdropMode ? 360 : 600;

    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const historyIndexRef = useRef(-1);
    const isRestoring = useRef(false);

    // Keep ref in sync
    useEffect(() => {
        historyIndexRef.current = historyIndex;
    }, [historyIndex]);

    const [activeImage, setActiveImage] = useState<string>(initialImage || '');
    const [costumeName, setCostumeName] = useState(spriteName);
    const [clipboard, setClipboard] = useState<fabric.Object | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [activeColorPicker, setActiveColorPicker] = useState<'fill' | 'outline' | null>(null);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [activeCostumeIndex, setActiveCostumeIndex] = useState(() => {
        if (costumes && costumes.length > 0 && initialImage) {
            const getSrc = (item: any): string => {
                if (!item) return '';
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item.src && typeof item.src === 'string') return item.src;
                if (item.image) {
                    if (typeof item.image === 'string') return item.image;
                    if (typeof item.image === 'object' && item.image.src && typeof item.image.src === 'string') return item.image.src;
                }
                return '';
            };
            const idx = costumes.findIndex(c => getSrc(c) === initialImage);
            return idx >= 0 ? idx : 0;
        }
        return 0;
    });
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isSettingRotationCenter, setIsSettingRotationCenter] = useState(false);
    const [rotationCenter, setRotationCenter] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
    const [editMode, setEditMode] = useState<'vector' | 'bitmap'>('vector');
    const bitmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const bitmapCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const isBitmapDrawingRef = useRef(false);
    const bitmapLastPointRef = useRef<{ x: number; y: number } | null>(null);
    const bitmapBrushColorRef = useRef('#000000');
    const bitmapBrushSizeRef = useRef(4);

    // Auto BG Removal handler
    const handleAutoRemoveBG = async () => {
        const canvas = canvasRef.current;
        if (!canvas || isRemovingBg) return;

        setIsRemovingBg(true);

        if (window.electronAPI) {
            // Electron: ML-based background removal
            const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
            try {
                const result = await window.electronAPI.removeBackground(dataUrl);
                if (result.success && (result as any).base64) {
                    canvas.clear();

                    fabric.Image.fromURL((result as any).base64, {}).then((img: fabric.FabricImage) => {
                        img.set({
                            left: canvas.width! / 2,
                            top: canvas.height! / 2,
                            originX: 'center',
                            originY: 'center',
                        });

                        // Fit to canvas
                        const pad = isBackdropMode ? 0 : 60;
                        const scale = Math.min(
                            (canvas.width! - pad) / (img.width! || 1),
                            (canvas.height! - pad) / (img.height! || 1)
                        );
                        if (scale < 1) img.scale(scale);

                        canvas.renderAll();
                        saveState();
                    }).catch((err) => {
                        console.error('Failed to load image for BG auto removal:', err);
                    });
                } else {
                    console.error("Auto BG Removal Failed:", result.error);
                }
            } catch (err) {
                console.error("Auto BG IPC Failed:", err);
            }
        } else {
            // Web fallback: flood-fill based background removal
            const cw = canvas.getWidth();
            const ch = canvas.getHeight();
            const currentDataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });

            const img = new Image();
            img.onload = () => {
                const offscreen = document.createElement('canvas');
                offscreen.width = img.width;
                offscreen.height = img.height;
                const offCtx = offscreen.getContext('2d');
                if (!offCtx) { setIsRemovingBg(false); return; }

                offCtx.drawImage(img, 0, 0);
                const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
                const data = imageData.data;
                const w = offscreen.width;
                const h = offscreen.height;

                const tolerance = 40;
                const colorMatch = (idx: number, r0: number, g0: number, b0: number) => {
                    const dr = data[idx] - r0, dg = data[idx + 1] - g0, db = data[idx + 2] - b0;
                    return Math.sqrt(dr * dr + dg * dg + db * db) < tolerance;
                };

                const visited = new Uint8Array(w * h);
                const queue: number[] = [];

                const enqueue = (x: number, y: number) => {
                    if (x < 0 || x >= w || y < 0 || y >= h) return;
                    const pi = y * w + x;
                    if (visited[pi] || data[pi * 4 + 3] === 0) return;
                    visited[pi] = 1;
                    queue.push(x, y);
                };

                const corners: [number, number][] = [
                    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
                    [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
                    [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],
                ];

                for (const [cx, cy] of corners) {
                    const ci = (cy * w + cx) * 4;
                    if (data[ci + 3] === 0) continue;
                    const refR = data[ci], refG = data[ci + 1], refB = data[ci + 2];
                    queue.length = 0;
                    enqueue(cx, cy);
                    while (queue.length > 0) {
                        const y = queue.pop()!;
                        const x = queue.pop()!;
                        const pi = y * w + x;
                        const idx = pi * 4;
                        if (!colorMatch(idx, refR, refG, refB)) continue;
                        data[idx + 3] = 0;
                        enqueue(x + 1, y); enqueue(x - 1, y);
                        enqueue(x, y + 1); enqueue(x, y - 1);
                    }
                }

                offCtx.putImageData(imageData, 0, 0);
                const resultDataUrl = offscreen.toDataURL('image/png');

                canvas.clear();
                fabric.Image.fromURL(resultDataUrl, {}).then((erasedImg: fabric.FabricImage) => {
                    erasedImg.set({
                        left: cw / 2,
                        top: ch / 2,
                        originX: 'center',
                        originY: 'center',
                    });
                    const pad = isBackdropMode ? 0 : 60;
                    const scale = Math.min(
                        (cw - pad) / (erasedImg.width! || 1),
                        (ch - pad) / (erasedImg.height! || 1)
                    );
                    if (scale < 1) erasedImg.scale(scale);
                    canvas.renderAll();
                    saveState();
                }).catch((err) => {
                    console.error('Failed to load erased image (web fallback):', err);
                });
                setIsRemovingBg(false);
            };
            img.onerror = () => setIsRemovingBg(false);
            img.src = currentDataUrl;
            return; // early return since setIsRemovingBg is handled in img.onload
        }
        setIsRemovingBg(false);
    };

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) {
            const canvas = new fabric.Canvas('fabric-canvas', {
                width: canvasW,
                height: canvasH,
                backgroundColor: 'transparent',
                isDrawingMode: false,
                selection: true,
            });

            canvasRef.current = canvas;

            canvas.on('object:added', () => saveState());
            canvas.on('object:modified', () => saveState());
            canvas.on('object:removed', () => saveState());

            return () => {
                canvas.dispose();
                canvasRef.current = null;
            };
        }
    }, []); // Only run once to create the canvas

    // Track dirty state and trigger auto-save
    const markDirty = useCallback(() => { isDirtyRef.current = true; }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handler = () => {
            markDirty();
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(() => {
                try {
                    const json = JSON.stringify(canvas.toJSON());
                    const costumeId = costumes[activeCostumeIndex]?.id || 'default';
                    const key = `paintEditor_draft_${title || 'unknown'}_${spriteName}_${costumeId}`;
                    localStorage.setItem(key, json);
                } catch (_) { }
            }, 1500);
        };
        canvas.on('object:added', handler);
        canvas.on('object:modified', handler);
        canvas.on('object:removed', handler);
        canvas.on('path:created', handler);
        return () => {
            canvas.off('object:added', handler);
            canvas.off('object:modified', handler);
            canvas.off('object:removed', handler);
            canvas.off('path:created', handler);
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [title, markDirty, spriteName, activeCostumeIndex, costumes]);

    // Warn before navigating away with unsaved changes
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirtyRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // Load image or restore draft when active costume changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let isActive = true;

        // Resize canvas if needed
        if (canvas.width !== canvasW || canvas.height !== canvasH) {
            canvas.setDimensions({ width: canvasW, height: canvasH });
        }

        // Clear existing content immediately
        canvas.clear();
        canvas.backgroundColor = 'transparent';

        const costumeId = costumes[activeCostumeIndex]?.id || 'default';

        const getCostumeSrc = (item: any): string => {
            if (!item) return '';
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item.src && typeof item.src === 'string') return item.src;
            if (item.image) {
                if (typeof item.image === 'string') return item.image;
                if (typeof item.image === 'object' && item.image.src && typeof item.image.src === 'string') return item.image.src;
            }
            return '';
        };

        const rawImage = getCostumeSrc(costumes[activeCostumeIndex]) || getCostumeSrc(initialImage) || '';
        console.log('[PaintEditor] Initialize canvas | spriteName:', spriteName, '| costumeId:', costumeId, '| activeCostumeIndex:', activeCostumeIndex, '| rawImage:', rawImage?.slice(0, 80));

        if (rawImage) {
            let imageUri = resolveAssetPath(rawImage);
            if (!imageUri.startsWith('http') && !imageUri.startsWith('data:') && !imageUri.startsWith('blob:') && !imageUri.startsWith('/') && !imageUri.startsWith('<svg')) {
                imageUri = '/' + imageUri;
            }

            const loadImageOntoCanvas = (url: string) => {
                console.log('[PaintEditor] loadImageOntoCanvas starting | url:', url);
                const imgOpts = (url.startsWith('http') && !url.startsWith(window.location.origin)) ? { crossOrigin: 'anonymous' as const } : {};
                fabric.Image.fromURL(url, imgOpts).then(async (img: fabric.FabricImage) => {
                    if (!isActive) return;
                    const elem = img.getElement() as HTMLImageElement;
                    if (elem && typeof elem.decode === 'function') {
                        try {
                            await elem.decode();
                        } catch (e) {
                            // Decode warning ignored
                        }
                    }
                    const imgW = img.width || elem?.naturalWidth || elem?.width || 200;
                    const imgH = img.height || elem?.naturalHeight || elem?.height || 200;
                    console.log('[PaintEditor] fabric.Image.fromURL success | elem size:', imgW, 'x', imgH, '| canvas size:', canvas.width, 'x', canvas.height);

                    canvas.clear();
                    canvas.backgroundColor = 'transparent';
                    img.set({
                        left: canvas.width! / 2,
                        top: canvas.height! / 2,
                        originX: 'center',
                        originY: 'center',
                    });
                    const pad = isBackdropMode ? 0 : 60;
                    const targetScale = Math.min(
                        (canvas.width! - pad) / imgW,
                        (canvas.height! - pad) / imgH
                    );
                    img.scale(targetScale);
                    console.log('[PaintEditor] img scaled to:', targetScale, '| final size on canvas:', imgW * targetScale, 'x', imgH * targetScale);

                    canvas.add(img);
                    canvas.renderAll();
                    canvas.requestRenderAll();
                    saveState();
                    logCanvasState('after image load');

                    // Extra render pass to handle Chromium async SVG rasterization
                    setTimeout(() => {
                        if (isActive && canvasRef.current) {
                            canvasRef.current.renderAll();
                            logCanvasState('after image load delayed render');
                        }
                    }, 100);
                }).catch((err) => {
                    console.error('[PaintEditor] Failed to load image onto canvas:', url, err);
                });
            };

            if (imageUri.startsWith('<svg')) {
                console.log('[PaintEditor] SVG string detected, parsing string...');
                fabric.loadSVGFromString(imageUri).then(({ objects, options }: any) => {
                    if (!isActive) return;
                    const validObjects = objects.filter((o: any) => o !== null);
                    console.log('[PaintEditor] loadSVGFromString parsed objects count:', validObjects.length);
                    if (validObjects.length === 0) {
                        loadImageOntoCanvas(imageUri);
                        return;
                    }
                    canvas.clear();
                    canvas.backgroundColor = 'transparent';
                    const group = fabric.util.groupSVGElements(validObjects, options);
                    group.set({
                        left: canvas.width! / 2,
                        top: canvas.height! / 2,
                        originX: 'center',
                        originY: 'center',
                    });
                    const pad = isBackdropMode ? 0 : 60;
                    const groupW = group.width || 200;
                    const groupH = group.height || 200;
                    const scale = Math.min(
                        (canvas.width! - pad) / groupW,
                        (canvas.height! - pad) / groupH
                    );

                    if (group.type === 'group') {
                        const items = (group as fabric.Group).removeAll();
                        items.forEach(item => {
                            item.set({
                                left: (item.left || 0) * scale,
                                top: (item.top || 0) * scale,
                                scaleX: (item.scaleX || 1) * scale,
                                scaleY: (item.scaleY || 1) * scale,
                            });
                        });
                        canvas.add(...items);
                    } else {
                        group.scale(scale);
                        canvas.add(group);
                    }
                    canvas.renderAll();
                    saveState();
                    logCanvasState('after SVG load');
                }).catch((err) => {
                    console.warn('[PaintEditor] SVG string parse failed, falling back to image loader:', err);
                    loadImageOntoCanvas(imageUri);
                });
            } else {
                loadImageOntoCanvas(imageUri);
            }
        } else {
            console.warn('[PaintEditor] No rawImage provided for costume!');
            saveState();
        }

        return () => {
            isActive = false;
        };
    }, [activeCostumeIndex, costumes, isBackdropMode, canvasW, canvasH, spriteName, title]);

    // Update canvas when initialImage changes (e.g., switching between sprite and stage)
    useEffect(() => {
        if (initialImage !== activeImage) {
            setActiveImage(initialImage || '');
        }
        if (costumes.length > 0 && initialImage) {
            const getSrc = (item: any): string => {
                if (!item) return '';
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item.src && typeof item.src === 'string') return item.src;
                if (item.image) {
                    if (typeof item.image === 'string') return item.image;
                    if (typeof item.image === 'object' && item.image.src && typeof item.image.src === 'string') return item.image.src;
                }
                return '';
            };
            const index = costumes.findIndex(c => getSrc(c) === initialImage);
            if (index >= 0 && index !== activeCostumeIndex) {
                setActiveCostumeIndex(index);
            }
        }
    }, [initialImage, activeImage, costumes, activeCostumeIndex]);

    // Update costume name when spriteName changes (e.g., switching between sprite and stage)
    useEffect(() => {
        setCostumeName(spriteName);
    }, [spriteName, activeCostumeIndex]);

    // Bitmap mode drawing handlers
    useEffect(() => {
        if (editMode !== 'bitmap') return;
        const bitmapCanvas = bitmapCanvasRef.current;
        if (!bitmapCanvas) return;
        const ctx = bitmapCanvas.getContext('2d');
        if (!ctx) return;
        bitmapCtxRef.current = ctx;

        const getPointer = (e: MouseEvent) => {
            const rect = bitmapCanvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (bitmapCanvas.width / rect.width),
                y: (e.clientY - rect.top) * (bitmapCanvas.height / rect.height)
            };
        };

        const floodFill = (startX: number, startY: number, fillColor: string) => {
            const imageData = ctx.getImageData(0, 0, bitmapCanvas.width, bitmapCanvas.height);
            const data = imageData.data;
            const w = bitmapCanvas.width;
            const h = bitmapCanvas.height;
            const startIdx = (Math.round(startY) * w + Math.round(startX)) * 4;
            const startR = data[startIdx], startG = data[startIdx + 1], startB = data[startIdx + 2], startA = data[startIdx + 3];

            // Parse fill color
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1; tempCanvas.height = 1;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.fillStyle = fillColor;
            tempCtx.fillRect(0, 0, 1, 1);
            const fc = tempCtx.getImageData(0, 0, 1, 1).data;

            if (startR === fc[0] && startG === fc[1] && startB === fc[2] && startA === fc[3]) return;

            const tolerance = 32;
            const colorMatch = (idx: number) => {
                return Math.abs(data[idx] - startR) < tolerance &&
                    Math.abs(data[idx + 1] - startG) < tolerance &&
                    Math.abs(data[idx + 2] - startB) < tolerance &&
                    Math.abs(data[idx + 3] - startA) < tolerance;
            };

            const visited = new Uint8Array(w * h);
            const queue: number[] = [Math.round(startX), Math.round(startY)];

            while (queue.length > 0) {
                const y = queue.pop()!;
                const x = queue.pop()!;
                if (x < 0 || x >= w || y < 0 || y >= h) continue;
                const pi = y * w + x;
                if (visited[pi]) continue;
                const idx = pi * 4;
                if (!colorMatch(idx)) continue;
                visited[pi] = 1;
                data[idx] = fc[0]; data[idx + 1] = fc[1]; data[idx + 2] = fc[2]; data[idx + 3] = fc[3];
                queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
            }
            ctx.putImageData(imageData, 0, 0);
        };

        const handleDown = (e: MouseEvent) => {
            if (activeTool !== 'brush' && activeTool !== 'eraser' && activeTool !== 'fill') return;
            const p = getPointer(e);
            isBitmapDrawingRef.current = true;
            bitmapLastPointRef.current = p;

            if (activeTool === 'fill') {
                floodFill(p.x, p.y, outlineColor);
                bitmapBrushColorRef.current = outlineColor;
                isBitmapDrawingRef.current = false;
                return;
            }

            bitmapBrushColorRef.current = activeTool === 'eraser' ? 'eraser' : outlineColor;
            bitmapBrushSizeRef.current = strokeWidth;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = activeTool === 'eraser' ? strokeWidth * 2 : strokeWidth;

            if (activeTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = outlineColor;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
        };

        const handleMove = (e: MouseEvent) => {
            if (!isBitmapDrawingRef.current) return;
            const p = getPointer(e);
            const last = bitmapLastPointRef.current;
            if (!last) return;

            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();

            bitmapLastPointRef.current = p;
        };

        const handleUp = () => {
            if (isBitmapDrawingRef.current) {
                isBitmapDrawingRef.current = false;
                bitmapLastPointRef.current = null;
                ctx.globalCompositeOperation = 'source-over';
            }
        };

        bitmapCanvas.addEventListener('mousedown', handleDown);
        bitmapCanvas.addEventListener('mousemove', handleMove);
        bitmapCanvas.addEventListener('mouseup', handleUp);
        bitmapCanvas.addEventListener('mouseleave', handleUp);

        return () => {
            bitmapCanvas.removeEventListener('mousedown', handleDown);
            bitmapCanvas.removeEventListener('mousemove', handleMove);
            bitmapCanvas.removeEventListener('mouseup', handleUp);
            bitmapCanvas.removeEventListener('mouseleave', handleUp);
        };
    }, [editMode, activeTool, outlineColor, strokeWidth]);

    const logCanvasState = useCallback((reason: string) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.log(`[PaintEditor Canvas State] (${reason}) canvasRef is null`);
            return;
        }
        const objects = canvas.getObjects();
        console.log(`[PaintEditor Canvas State] (${reason})`, {
            objectsCount: objects.length,
            canvasSize: `${canvas.width}x${canvas.height}`,
            backgroundColor: canvas.backgroundColor,
            isDrawingMode: canvas.isDrawingMode,
            objects: objects.map((obj, i) => ({
                index: i,
                type: obj.type,
                left: Math.round(obj.left || 0),
                top: Math.round(obj.top || 0),
                width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
                height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
                opacity: obj.opacity,
                visible: obj.visible,
            }))
        });
    }, []);

    useEffect(() => {
        (window as any).__logPaintEditorCanvasState = (reason = 'manual') => logCanvasState(reason);
    }, [logCanvasState]);

    const saveState = () => {
        if (isRestoring.current || eraserDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        logCanvasState('saveState');
        const json = JSON.stringify(canvas.toJSON());
        setHistory(prev => {
            const currentIdx = historyIndexRef.current;
            const next = [...prev.slice(0, currentIdx + 1), json];
            return next.slice(-50);
        });
        setHistoryIndex(prev => {
            const newIndex = Math.min(prev + 1, 49);
            historyIndexRef.current = newIndex; // update sync to avoid multiple state calls using stale index
            return newIndex;
        });
    };

    // Tool Management
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = false;
        canvas.selection = activeTool === 'select' || activeTool === 'reshape' || activeTool === 'eyedropper';

        // Clean up previous eraser handlers
        if (eraserHandlersRef.current) {
            canvas.off('mouse:down', eraserHandlersRef.current.down);
            canvas.off('mouse:move', eraserHandlersRef.current.move);
            canvas.off('mouse:up', eraserHandlersRef.current.up);
            eraserHandlersRef.current = null;
        }

        if (activeTool === 'brush') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = outlineColor;
            canvas.freeDrawingBrush.width = strokeWidth;
        } else if (activeTool === 'eraser') {
            canvas.isDrawingMode = false;
            canvas.selection = false;

            const cw = canvas.getWidth();
            const ch = canvas.getHeight();
            const eraserRadius = () => strokeWidth * 2;

            const handleEraserMouseDown = (opt: any) => {
                if (activeTool !== 'eraser') return;
                eraserDrawingRef.current = true;
                eraserPointsRef.current = [];

                // Flatten canvas to single bitmap before first erase
                const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
                eraserBaseRef.current = dataUrl;

                const pointer = canvas.getScenePoint(opt.e);
                eraserPointsRef.current.push({ x: pointer.x, y: pointer.y });
            };

            const handleEraserMouseMove = (opt: any) => {
                if (!eraserDrawingRef.current || activeTool !== 'eraser') return;
                const pointer = canvas.getScenePoint(opt.e);
                eraserPointsRef.current.push({ x: pointer.x, y: pointer.y });

                // Live preview on upper canvas
                const ctx = canvas.contextTop;
                ctx.save();
                ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
                ctx.beginPath();
                ctx.arc(pointer.x, pointer.y, eraserRadius(), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };

            const handleEraserMouseUp = () => {
                if (!eraserDrawingRef.current || activeTool !== 'eraser') return;
                eraserDrawingRef.current = false;

                // Clear upper canvas preview
                canvas.clearContext(canvas.contextTop);

                const points = [...eraserPointsRef.current];
                eraserPointsRef.current = [];
                if (points.length === 0) return;

                const baseDataUrl = eraserBaseRef.current;
                if (!baseDataUrl) return;

                const loadImg = (src: string): Promise<HTMLImageElement> =>
                    new Promise((resolve, reject) => {
                        const i = new Image();
                        i.onload = () => resolve(i);
                        i.onerror = reject;
                        i.src = src;
                    });

                loadImg(baseDataUrl).then((baseImg) => {
                    const offscreen = document.createElement('canvas');
                    offscreen.width = cw;
                    offscreen.height = ch;
                    const offCtx = offscreen.getContext('2d');
                    if (!offCtx) return;

                    // Draw base bitmap
                    offCtx.drawImage(baseImg, 0, 0);

                    // Erase along the recorded path
                    offCtx.globalCompositeOperation = 'destination-out';
                    offCtx.fillStyle = 'black';
                    offCtx.lineWidth = eraserRadius() * 2;
                    offCtx.lineCap = 'round';
                    offCtx.lineJoin = 'round';

                    if (points.length === 1) {
                        // Single tap — draw one circle
                        offCtx.beginPath();
                        offCtx.arc(points[0].x, points[0].y, eraserRadius(), 0, Math.PI * 2);
                        offCtx.fill();
                    } else {
                        // Draw connected eraser stroke
                        offCtx.beginPath();
                        offCtx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) {
                            offCtx.lineTo(points[i].x, points[i].y);
                        }
                        offCtx.stroke();
                        // Draw circles at each point for full coverage
                        for (const pt of points) {
                            offCtx.beginPath();
                            offCtx.arc(pt.x, pt.y, eraserRadius(), 0, Math.PI * 2);
                            offCtx.fill();
                        }
                    }

                    offCtx.globalCompositeOperation = 'source-over';

                    const resultUrl = offscreen.toDataURL('image/png');

                    // Clear canvas and replace with erased bitmap
                    canvas.clear();
                    canvas.backgroundColor = 'transparent';

                    return fabric.Image.fromURL(resultUrl, {}).then((resultImg: fabric.FabricImage) => {
                        resultImg.set({
                            left: cw / 2,
                            top: ch / 2,
                            originX: 'center',
                            originY: 'center',
                            selectable: false,
                            evented: false,
                            hoverCursor: 'crosshair',
                        });
                        canvas.add(resultImg);
                        canvas.renderAll();
                        saveState();
                    });
                }).catch((err) => {
                    console.error('Eraser compositing failed:', err);
                });
            };

            canvas.on('mouse:down', handleEraserMouseDown);
            canvas.on('mouse:move', handleEraserMouseMove);
            canvas.on('mouse:up', handleEraserMouseUp);
            eraserHandlersRef.current = {
                down: handleEraserMouseDown,
                move: handleEraserMouseMove,
                up: handleEraserMouseUp,
            };
        }

        const handleMouseDown = (opt: any) => {
            if (activeTool === 'fill' && opt.target) {
                opt.target.set('fill', fillColor);
                canvas.renderAll();
                saveState();
            } else if (activeTool === 'eyedropper') {
                const pointer = canvas.getScenePoint(opt.e);
                const ctx = canvas.lowerCanvasEl?.getContext('2d');
                if (ctx) {
                    const pixel = ctx.getImageData(Math.round(pointer.x), Math.round(pointer.y), 1, 1).data;
                    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
                    setFillColor(hex);
                    setOutlineColor(hex);
                    setActiveTool('select');
                }
            }
        };

        // Reshape: configure custom controls on selection
        const handleSelectionCreated = (opt: any) => {
            if (activeTool !== 'reshape') return;
            const obj = opt.selected?.[0];
            if (!obj) return;
            obj.set({
                transparentCorners: false,
                cornerColor: '#855CD6',
                cornerStrokeColor: '#855CD6',
                borderColor: '#855CD6',
                cornerSize: 12,
                cornerStyle: 'circle',
                borderScaleFactor: 2,
                padding: 4,
            });
            obj.setControlsVisibility({
                mtr: true,  // rotation handle
                tl: true, tr: true, bl: true, br: true,  // corners
                mt: true, mb: true, ml: true, mr: true,  // edge midpoints
            });
            canvas.renderAll();
        };

        const handleSelectionUpdated = (opt: any) => {
            if (activeTool !== 'reshape') return;
            const obj = opt.selected?.[0];
            if (!obj) return;
            obj.set({
                transparentCorners: false,
                cornerColor: '#855CD6',
                cornerStrokeColor: '#855CD6',
                borderColor: '#855CD6',
                cornerSize: 12,
                cornerStyle: 'circle',
                borderScaleFactor: 2,
                padding: 4,
            });
            obj.setControlsVisibility({
                mtr: true,
                tl: true, tr: true, bl: true, br: true,
                mt: true, mb: true, ml: true, mr: true,
            });
            canvas.renderAll();
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('selection:created', handleSelectionCreated);
        canvas.on('selection:updated', handleSelectionUpdated);
        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('selection:created', handleSelectionCreated);
            canvas.off('selection:updated', handleSelectionUpdated);
            if (eraserHandlersRef.current) {
                canvas.off('mouse:down', eraserHandlersRef.current.down);
                canvas.off('mouse:move', eraserHandlersRef.current.move);
                canvas.off('mouse:up', eraserHandlersRef.current.up);
                eraserHandlersRef.current = null;
            }
        };
    }, [activeTool, outlineColor, fillColor, strokeWidth, saveState]);

    const undo = () => {
        if (historyIndex > 0) {
            const canvas = canvasRef.current;
            const state = history[historyIndex - 1];
            if (state) {
                isRestoring.current = true;
                canvas?.loadFromJSON(JSON.parse(state), () => {
                    canvas.renderAll();
                    setHistoryIndex(historyIndex - 1);
                    isRestoring.current = false;
                });
            }
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const canvas = canvasRef.current;
            const state = history[historyIndex + 1];
            if (state) {
                isRestoring.current = true;
                canvas?.loadFromJSON(JSON.parse(state), () => {
                    canvas.renderAll();
                    setHistoryIndex(historyIndex + 1);
                    isRestoring.current = false;
                });
            }
        }
    };

    const copy = () => {
        const canvas = canvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            activeObject.clone().then((cloned: fabric.Object) => setClipboard(cloned));
        }
    };

    const paste = () => {
        const canvas = canvasRef.current;
        if (clipboard) {
            clipboard.clone().then((cloned: fabric.Object) => {
                canvas?.discardActiveObject();
                cloned.set({
                    left: (cloned.left || 0) + 10,
                    top: (cloned.top || 0) + 10,
                    evented: true,
                });
                if (cloned.type === 'activeSelection') {
                    cloned.canvas = canvas!;
                    (cloned as any).forEachObject((obj: fabric.Object) => canvas?.add(obj));
                    cloned.setCoords();
                } else {
                    canvas?.add(cloned);
                }
                canvas?.setActiveObject(cloned);
                canvas?.requestRenderAll();
                setClipboard(cloned);
            });
        }
    };

    const deleteActive = () => {
        const canvas = canvasRef.current;
        const activeObjects = canvas?.getActiveObjects();
        if (activeObjects?.length) {
            canvas?.discardActiveObject();
            activeObjects.forEach((obj: fabric.FabricObject) => canvas?.remove(obj));
            canvas?.renderAll();
        }
    };

    const groupObjects = () => {
        const canvas = canvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (activeObj?.type === 'activeSelection') {
            const items = (activeObj as fabric.ActiveSelection).removeAll();
            const group = new fabric.Group(items);
            canvas?.add(group);
            canvas?.setActiveObject(group);
            canvas?.requestRenderAll();
            saveState();
        }
    };

    const ungroupObjects = () => {
        const canvas = canvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (activeObj?.type === 'group') {
            const items = (activeObj as fabric.Group).removeAll();
            canvas?.remove(activeObj);
            canvas?.add(...items);
            const sel = new fabric.ActiveSelection(items, { canvas: canvas! });
            canvas?.setActiveObject(sel);
            canvas?.requestRenderAll();
            saveState();
        }
    };

    const addShape = (type: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const common = {
            left: canvas.width! / 2,
            top: canvas.height! / 2,
            fill: fillColor,
            stroke: outlineColor,
            strokeWidth: strokeWidth,
            originX: 'center' as const,
            originY: 'center' as const,
        };
        let shape;
        if (type === 'rect') shape = new fabric.Rect({ ...common, width: 100, height: 100 });
        else if (type === 'circle') shape = new fabric.Circle({ ...common, radius: 50 });
        else if (type === 'line') shape = new fabric.Rect({ ...common, width: 150, height: strokeWidth });
        else if (type === 'text') shape = new fabric.IText('Text', { ...common, fill: outlineColor, fontSize: 40 });

        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
            setActiveTool('select');
        }
    };

    const handleFlip = (dir: 'h' | 'v') => {
        const canvas = canvasRef.current;
        const obj = canvas?.getActiveObject();
        if (obj) {
            if (dir === 'h') obj.set('flipX', !obj.flipX);
            else obj.set('flipY', !obj.flipY);
            canvas?.renderAll();
        }
    };

    const handleLayering = (action: 'front' | 'back' | 'forward' | 'backward') => {
        const canvas = canvasRef.current;
        const obj = canvas?.getActiveObject();
        if (obj && canvas) {
            if (action === 'front') canvas.bringObjectToFront(obj);
            else if (action === 'back') canvas.sendObjectToBack(obj);
            else if (action === 'forward') canvas.bringObjectForward(obj);
            else if (action === 'backward') canvas.sendObjectBackwards(obj);
            canvas.renderAll();
        }
    };

    const handleSave = () => {
        let imageData: string;
        let svgDataUrl = '';

        if (editMode === 'bitmap' && bitmapCanvasRef.current) {
            // Save bitmap canvas directly
            imageData = bitmapCanvasRef.current.toDataURL('image/png');
        } else {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const svgString = canvas.toSVG();
            svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

            const objects = canvas.getObjects();

            if (objects.length > 0) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                objects.forEach(obj => {
                    const br = obj.getBoundingRect();
                    minX = Math.min(minX, br.left);
                    minY = Math.min(minY, br.top);
                    maxX = Math.max(maxX, br.left + br.width);
                    maxY = Math.max(maxY, br.top + br.height);
                });

                const pad = 10;
                const left = Math.max(0, Math.floor(minX - pad));
                const top = Math.max(0, Math.floor(minY - pad));
                const width = Math.min(canvas.width! - left, Math.ceil(maxX - minX + pad * 2));
                const height = Math.min(canvas.height! - top, Math.ceil(maxY - minY + pad * 2));

                imageData = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1, left, top, width, height });
            } else {
                imageData = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
            }
        }

        onSave(imageData, svgDataUrl || undefined, costumeName, isSettingRotationCenter ? rotationCenter : undefined);
        isDirtyRef.current = false;
        const costumeId = costumes[activeCostumeIndex]?.id || 'default';
        localStorage.removeItem(`paintEditor_draft_${title || 'unknown'}_${spriteName}_${costumeId}`);
        onClose();
    };

    const loadSrcToCanvas = (src: string, name: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setCostumeName(name);
        canvas.clear();
        canvas.backgroundColor = 'transparent';

        const isSVG = src.includes('<svg') || src.endsWith('.svg');
        if (isSVG) {
            const handleLoadedSVG = ({ objects, options }: any) => {
                const validObjects = objects.filter((o: any) => o !== null);
                const group = fabric.util.groupSVGElements(validObjects, options);
                group.set({
                    left: canvas.width! / 2,
                    top: canvas.height! / 2,
                    originX: 'center',
                    originY: 'center',
                });
                const pad = isBackdropMode ? 0 : 60;
                const scale = Math.min(
                    (canvas.width! - pad) / (group.width! || 1),
                    (canvas.height! - pad) / (group.height! || 1)
                );
                if (scale < 1) group.scale(scale);

                if (group.type === 'group') {
                    const items = (group as fabric.Group).removeAll();
                    canvas.add(...items);
                } else {
                    canvas.add(group);
                }
                canvas.renderAll();
                saveState();
            };
            if (src.includes('<svg')) fabric.loadSVGFromString(src).then(handleLoadedSVG);
            else fabric.loadSVGFromURL(src).then(handleLoadedSVG);
        } else {
            const imgOpts = src.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {};
            fabric.Image.fromURL(src, imgOpts).then((img: fabric.FabricImage) => {
                img.set({
                    left: canvas.width! / 2,
                    top: canvas.height! / 2,
                    originX: 'center',
                    originY: 'center',
                });
                const pad = isBackdropMode ? 0 : 60;
                const scale = Math.min(
                    (canvas.width! - pad) / (img.width! || 1),
                    (canvas.height! - pad) / (img.height! || 1)
                );
                if (scale < 1) img.scale(scale);
                canvas.add(img);
                canvas.renderAll();
                saveState();
            }).catch((err) => {
                console.error('Failed to load image onto canvas:', err);
            });
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            loadSrcToCanvas(dataUrl, fileName);
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const openCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setCameraStream(stream);
            setIsCameraOpen(true);
        } catch (err: any) {
            setCameraError(err.name === 'NotAllowedError'
                ? 'Camera permission denied. Please allow camera access.'
                : err.name === 'NotFoundError'
                    ? 'No camera found on this device.'
                    : 'Failed to access camera.');
        }
    };

    const capturePhoto = (videoEl: HTMLVideoElement) => {
        const offscreen = document.createElement('canvas');
        offscreen.width = videoEl.videoWidth;
        offscreen.height = videoEl.videoHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoEl, 0, 0);
        const dataUrl = offscreen.toDataURL('image/png');
        loadSrcToCanvas(dataUrl, 'Camera Capture');
        closeCamera();
    };

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }
        setIsCameraOpen(false);
        setCameraError(null);
    };

    const switchToBitmap = () => {
        const canvas = canvasRef.current;
        if (!canvas || !bitmapCanvasRef.current) return;

        // Flatten Fabric.js canvas to bitmap
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
        const img = new Image();
        img.onload = () => {
            const bitmapCanvas = bitmapCanvasRef.current;
            const ctx = bitmapCtxRef.current;
            if (!bitmapCanvas || !ctx) return;

            bitmapCanvas.width = canvasW;
            bitmapCanvas.height = canvasH;
            ctx.clearRect(0, 0, bitmapCanvas.width, bitmapCanvas.height);
            ctx.drawImage(img, 0, 0, bitmapCanvas.width, bitmapCanvas.height);
            setEditMode('bitmap');
        };
        img.src = dataUrl;
    };

    const switchToVector = () => {
        const canvas = canvasRef.current;
        const bitmapCanvas = bitmapCanvasRef.current;
        if (!canvas || !bitmapCanvas) return;

        // Capture bitmap as dataURL
        const dataUrl = bitmapCanvas.toDataURL('image/png');
        canvas.clear();
        canvas.backgroundColor = 'transparent';

        fabric.Image.fromURL(dataUrl, {}).then((img: fabric.FabricImage) => {
            img.set({
                left: canvas.width! / 2,
                top: canvas.height! / 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
            });
            canvas.add(img);
            canvas.renderAll();
            setEditMode('vector');
            saveState();
        }).catch((err) => {
            console.error('Failed to convert bitmap to vector:', err);
            setEditMode('vector');
        });
    };

    return (
        <div className={mode === 'junior' ? "fixed inset-0 z-[5000] flex flex-col bg-white select-none overflow-hidden font-sans" : "flex flex-1 w-full h-full bg-white select-none overflow-hidden font-sans border-t border-gray-100"}>
            {/* Hidden file input for uploading costumes */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                style={{ display: 'none' }}
            />

            {/* Costume Library Modal (rendered only if not overridden) */}
            {!onOpenLibrary && (
                <CostumeLibrary
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                    onSelectCostume={(name, src) => {
                        loadSrcToCanvas(src, name);
                        setIsLibraryOpen(false);
                    }}
                />
            )}

            {/* Camera Capture Modal */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-[440px] max-w-[90vw]">
                        <div className="bg-[#7B4FC4] px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Camera size={18} className="text-white" />
                                <span className="text-white font-bold text-[15px]">Camera Capture</span>
                            </div>
                            <button onClick={closeCamera} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-lg font-bold">&times;</button>
                        </div>
                        <div className="p-5">
                            {cameraError ? (
                                <div className="text-center py-8">
                                    <Camera size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 text-sm">{cameraError}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-xl overflow-hidden bg-black mb-4">
                                        <video
                                            data-camera-video
                                            ref={(el) => {
                                                if (el && cameraStream) {
                                                    el.srcObject = cameraStream;
                                                    el.play();
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-auto max-h-[280px] object-contain"
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => {
                                                const video = document.querySelector('[data-camera-video]') as HTMLVideoElement;
                                                if (video) capturePhoto(video);
                                            }}
                                            className="px-7 py-2.5 bg-[#22c55e] text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-green-600 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            <Camera size={18} />
                                            CAPTURE
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 0. JUNIOR HEADER (matches JuniorApp style) */}
            {mode === 'junior' && (
                <div className="h-12 bg-[#7B4FC4] flex items-center px-5 justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Pen size={16} color="white" />
                        </div>
                        <span className="text-white font-bold text-[15px]">Paint Editor</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <ChevronDown size={22} className="rotate-180" />
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden w-full h-full">
                {/* 1. LEFT SIDEBAR (Costumes/Backdrops) */}
                {!hideCostumeSidebar && (
                    <div className="w-[108px] border-r border-gray-200/80 flex flex-col bg-white overflow-hidden shadow-[2px_0_8px_rgba(0,0,0,0.03)]">
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 no-scrollbar relative pb-20">
                            {costumes.map((c, i) => (
                                <div key={c.id || i} className="relative group">
                                    <div
                                        onClick={() => {
                                            setActiveCostumeIndex(i);
                                            if (onSwitchCostume) onSwitchCostume(i);
                                        }}
                                        className={`w-[80px] h-[80px] rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 bg-gray-50 cursor-pointer relative transition-all ${activeCostumeIndex === i ? 'border-[#855CD6] shadow-md shadow-purple-100 bg-purple-50/50 scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                                    >
                                        <span className="absolute top-1.5 left-2 text-[10px] text-gray-400 font-bold">{i + 1}</span>
                                        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                            <img src={c.image} className="max-w-full max-h-[44px] object-contain" alt={c.name} />
                                        </div>
                                        <div className="w-full text-[10px] text-center truncate text-gray-600 font-semibold px-0.5 mt-1" title={c.name}>{c.name}</div>
                                    </div>

                                    {/* Context Actions */}
                                    <div className={`absolute -top-2 -right-2 flex flex-col gap-1 z-10 hidden group-hover:flex ${activeCostumeIndex === i ? '!flex' : ''}`}>
                                        <button
                                            className="w-6 h-6 bg-white border border-gray-200 text-gray-400 hover:text-rose-500 rounded-full flex items-center justify-center shadow-md transition-colors"
                                            title="Delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onDeleteSound) onDeleteSound(i);
                                            }}
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                        <button
                                            className="w-6 h-6 bg-white border border-gray-200 text-gray-400 hover:text-[#855CD6] rounded-full flex items-center justify-center shadow-md transition-colors"
                                            title="Duplicate"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onDuplicateSound) onDuplicateSound(i);
                                            }}
                                        >
                                            <Copy size={11} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Menu (Floating Bottom Left) */}
                        <div className="absolute bottom-4 left-4 z-50">
                            <ActionMenu
                                mainIcon={<ImageIcon size={20} />}
                                color="#855CD6"
                                tooltipLabel="Choose a Costume"
                                actions={[
                                    { id: 'upload', icon: '📁', label: 'Upload Costume', onClick: triggerUpload },
                                    { id: 'camera', icon: '📷', label: 'Camera Capture', onClick: openCamera },
                                    {
                                        id: 'surprise', icon: '✨', label: 'Surprise', onClick: () => {
                                            const idx = Math.floor(Math.random() * BUILTIN_COSTUMES.length);
                                            const costume = BUILTIN_COSTUMES[idx];
                                            loadSrcToCanvas(costume.src, costume.name);
                                        }
                                    },
                                    { id: 'paint', icon: '🖌️', label: 'Paint', onClick: () => { /* already in editor */ } },
                                    { id: 'search', icon: '🔍', label: 'Choose a Costume', onClick: () => onOpenLibrary ? onOpenLibrary() : setIsLibraryOpen(true) },
                                ]}
                            />
                        </div>
                    </div>
                )}

                {/* 2. MAIN EDITOR AREA */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* TOP TOOLBAR ROW 1 */}
                    <div className="h-[60px] px-6 flex items-center bg-white border-b border-gray-100 justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {/* Costume Name */}
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title === 'Backdrop Editor' ? 'Backdrop' : 'Costume'}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={costumeName}
                                        onChange={(e) => setCostumeName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && onRenameCostume) onRenameCostume(activeCostumeIndex, costumeName);
                                            if (e.key === 'Escape') setCostumeName(spriteName);
                                        }}
                                        onBlur={() => {
                                            if (costumeName !== spriteName && onRenameCostume) onRenameCostume(activeCostumeIndex, costumeName);
                                        }}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 outline-none focus:border-[#855CD6] focus:ring-2 focus:ring-purple-100 w-40 transition-all"
                                    />
                                    {costumeName !== spriteName && (
                                        <button
                                            onClick={() => { if (onRenameCostume) onRenameCostume(activeCostumeIndex, costumeName); }}
                                            className="text-emerald-500 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50"
                                            title="Save name"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="w-px h-7 bg-gray-200" />

                            {/* Undo / Redo */}
                            <div className="flex items-center gap-1">
                                <ToolBtn onClick={undo} icon={<Undo size={18} />} title="Undo" disabled={historyIndex <= 0} />
                                <ToolBtn onClick={redo} icon={<Redo size={18} />} title="Redo" disabled={historyIndex >= history.length - 1} />
                            </div>

                            <div className="w-px h-7 bg-gray-200" />

                            {/* Vector / Bitmap Toggle */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => { if (editMode === 'bitmap') switchToVector(); }}
                                    className={`px-7 py-2.5 text-[13px] font-bold rounded-md transition-all duration-200 ${editMode === 'vector' ? 'bg-[#855CD6] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/60'}`}
                                >
                                    Vector
                                </button>
                                <button
                                    onClick={() => { if (editMode === 'vector') switchToBitmap(); }}
                                    className={`px-7 py-2.5 text-[13px] font-bold rounded-md transition-all duration-200 ${editMode === 'bitmap' ? 'bg-[#855CD6] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/60'}`}
                                >
                                    Bitmap
                                </button>
                            </div>

                            <div className="w-px h-7 bg-gray-200" />

                            {/* Group / Ungroup */}
                            <div className="flex items-center gap-1">
                                <ToolBtnVertical onClick={groupObjects} icon={<Combine size={18} />} label="Group" />
                                <ToolBtnVertical onClick={ungroupObjects} icon={<Ungroup size={18} />} label="Ungroup" />
                            </div>

                            <div className="w-px h-7 bg-gray-200" />

                            {/* Layering */}
                            <div className="flex items-center gap-1">
                                <ToolBtnVertical onClick={() => handleLayering('forward')} icon={<ArrowUp size={16} />} label="Forward" />
                                <ToolBtnVertical onClick={() => handleLayering('backward')} icon={<ArrowDown size={16} />} label="Backward" />
                                <ToolBtnVertical onClick={() => handleLayering('front')} icon={<MoveUp size={16} />} label="Front" />
                                <ToolBtnVertical onClick={() => handleLayering('back')} icon={<MoveDown size={16} />} label="Back" />
                            </div>

                            <div className="w-px h-7 bg-gray-200" />

                        </div>
                    </div>

                    {/* TOP TOOLBAR ROW 2 */}
                    <div className="h-[60px] px-6 flex flex-shrink-0 items-center bg-white gap-6 border-b border-gray-200 z-20 relative">
                        {/* Fill Color */}
                        <div className="flex items-center gap-3 relative">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fill</span>
                            <div
                                className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 cursor-pointer hover:border-[#855CD6] hover:bg-purple-50/30 transition-all"
                                onClick={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                            >
                                <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')]" style={{ position: 'relative' }}>
                                    {fillColor !== 'transparent' && <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: fillColor }} />}
                                    {fillColor === 'transparent' && (
                                        <div className="absolute w-[140%] h-[2px] bg-red-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
                                    )}
                                </div>
                                <ChevronDown size={14} className="text-gray-400 mr-1" />
                            </div>
                            {activeColorPicker === 'fill' && (
                                <HSBColorPicker
                                    color={fillColor}
                                    onChange={(c) => {
                                        setFillColor(c);
                                        const canvas = canvasRef.current;
                                        const activeOpt = canvas?.getActiveObject();
                                        if (activeOpt && !activeOpt.isType('path')) {
                                            activeOpt.set('fill', c);
                                            canvas?.renderAll();
                                            saveState();
                                        }
                                    }}
                                    onClose={() => setActiveColorPicker(null)}
                                    title="Fill"
                                    onEyedropper={() => setActiveTool('eyedropper')}
                                />
                            )}
                        </div>

                        {/* Outline Color */}
                        <div className="flex items-center gap-3 relative">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outline</span>
                            <div
                                className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 cursor-pointer hover:border-[#855CD6] hover:bg-purple-50/30 transition-all"
                                onClick={() => setActiveColorPicker(activeColorPicker === 'outline' ? null : 'outline')}
                            >
                                <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')]" style={{ position: 'relative' }}>
                                    {outlineColor !== 'transparent' && <div className="absolute inset-1.5 rounded-md border-[3px]" style={{ borderColor: outlineColor }} />}
                                    {outlineColor === 'transparent' && (
                                        <div className="absolute w-[140%] h-[2px] bg-red-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
                                    )}
                                </div>
                                <ChevronDown size={14} className="text-gray-400 mr-1" />
                            </div>
                            {activeColorPicker === 'outline' && (
                                <HSBColorPicker
                                    color={outlineColor}
                                    onChange={(c) => {
                                        setOutlineColor(c);
                                        const canvas = canvasRef.current;
                                        if (canvas && canvas.freeDrawingBrush && activeTool === 'brush') {
                                            canvas.freeDrawingBrush.color = c;
                                        }
                                        const activeOpt = canvas?.getActiveObject();
                                        if (activeOpt) {
                                            activeOpt.set('stroke', c);
                                            canvas?.renderAll();
                                            saveState();
                                        }
                                    }}
                                    onClose={() => setActiveColorPicker(null)}
                                    title="Outline"
                                    onEyedropper={() => setActiveTool('eyedropper')}
                                />
                            )}
                        </div>

                        {/* Thickness */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Size</span>
                            <input
                                type="number"
                                value={strokeWidth}
                                onChange={(e) => {
                                    const w = Math.max(0, parseInt(e.target.value) || 0);
                                    setStrokeWidth(w);
                                    const canvas = canvasRef.current;
                                    if (canvas && canvas.freeDrawingBrush && activeTool === 'brush') {
                                        canvas.freeDrawingBrush.width = w;
                                    }
                                    const activeOpt = canvas?.getActiveObject();
                                    if (activeOpt) {
                                        activeOpt.set('strokeWidth', w);
                                        canvas?.renderAll();
                                        saveState();
                                    }
                                }}
                                className="bg-gray-50 border border-gray-200 text-center rounded-xl px-2 py-2 text-sm font-bold text-gray-700 w-14 outline-none focus:border-[#855CD6] focus:ring-2 focus:ring-purple-100 transition-all"
                                min="0"
                                max="100"
                            />
                        </div>

                        <div className="w-px h-7 bg-gray-200" />

                        {/* Copy / Paste / Delete */}
                        <div className="flex items-center gap-1">
                            <ToolBtnVertical onClick={copy} icon={<Copy size={18} />} label="Copy" />
                            <ToolBtnVertical onClick={paste} icon={<Clipboard size={18} />} label="Paste" />
                            <ToolBtnVertical onClick={deleteActive} icon={<Trash2 size={18} />} label="Delete" color="hover:text-rose-500" />
                        </div>

                        <div className="w-px h-7 bg-gray-200" />

                        {/* Flip */}
                        <div className="flex items-center gap-1">
                            <ToolBtnVertical onClick={() => handleFlip('h')} icon={<FlipHorizontal size={18} />} label="Flip H" />
                            <ToolBtnVertical onClick={() => handleFlip('v')} icon={<FlipVertical size={18} />} label="Flip V" />
                        </div>

                        <div className="w-px h-7 bg-gray-200" />

                        {/* Auto BG Remove */}
                        <ToolBtnVertical
                            onClick={handleAutoRemoveBG}
                            icon={<Sparkles size={18} />}
                            label="BG Remove"
                            color={isRemovingBg ? "text-purple-500 animate-pulse" : "group-hover:text-purple-500"}
                        />
                    </div>

                    <div className="flex-1 flex relative bg-[#F0F2F5]">
                        {/* DRAWING TOOLS SIDEBAR */}
                        <div className="w-[80px] border-r border-gray-200/80 bg-white flex flex-col items-center py-4 gap-1.5 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
                            <DrawTool active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon={<MousePointer2 size={20} className={activeTool === 'select' ? "fill-white" : ""} />} label="Select" />
                            <DrawTool active={activeTool === 'reshape'} onClick={() => setActiveTool('reshape')} icon={<MousePointer size={20} />} label="Reshape" />

                            <div className="w-9 h-px bg-gray-200 my-1" />

                            <DrawTool active={activeTool === 'brush'} onClick={() => setActiveTool('brush')} icon={<Pen size={20} />} label="Brush" />
                            <DrawTool active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={20} />} label="Eraser" />

                            <div className="w-9 h-px bg-gray-200 my-1" />

                            <DrawTool active={activeTool === 'fill'} onClick={() => setActiveTool('fill')} icon={<PaintBucket size={20} />} label="Fill" />
                            <DrawTool active={activeTool === 'text'} onClick={() => addShape('text')} icon={<Type size={20} />} label="Text" />

                            <div className="w-9 h-px bg-gray-200 my-1" />

                            <DrawTool active={activeTool === 'line'} onClick={() => addShape('line')} icon={<Minus size={20} className="-rotate-45" />} label="Line" />
                            <DrawTool active={activeTool === 'circle'} onClick={() => addShape('circle')} icon={<Circle size={20} />} label="Circle" />
                            <DrawTool active={activeTool === 'rect'} onClick={() => addShape('rect')} icon={<Square size={20} />} label="Rect" />

                            <div className="w-9 h-px bg-gray-200 my-1" />

                            <DrawTool active={activeTool === 'eyedropper'} onClick={() => setActiveTool('eyedropper')} icon={<Pipette size={20} />} label="Pick" />
                        </div>

                        {/* CANVAS AREA */}
                        <div
                            className="flex-1 flex items-center justify-center p-10 overflow-hidden relative"
                            style={{ cursor: activeTool === 'fill' || activeTool === 'eyedropper' ? 'crosshair' : activeTool === 'reshape' ? 'move' : 'default' }}
                        >
                            <div
                                className="relative rounded-xl overflow-hidden"
                                style={{
                                    backgroundColor: '#ffffff',
                                    backgroundImage: `linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)`,
                                    backgroundSize: '20px 20px',
                                    backgroundPosition: '0 0, 10px 10px',
                                    width: `${canvasW}px`,
                                    height: `${canvasH}px`,
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                                    border: '1px solid #e5e7eb',
                                }}
                            >
                                <canvas id="fabric-canvas" />

                                {editMode === 'bitmap' && (
                                    <canvas
                                        ref={bitmapCanvasRef}
                                        className="absolute inset-0 z-10"
                                        style={{
                                            width: `${canvasW}px`,
                                            height: `${canvasH}px`,
                                            cursor: activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'fill' ? 'crosshair' : 'default'
                                        }}
                                    />
                                )}

                                {isSettingRotationCenter && (
                                    <div
                                        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing z-10"
                                        style={{
                                            left: `${rotationCenter.x * 100}%`,
                                            top: `${rotationCenter.y * 100}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            const container = (e.target as HTMLElement).parentElement;
                                            if (!container) return;
                                            const rect = container.getBoundingClientRect();
                                            const onMove = (me: MouseEvent) => {
                                                const x = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
                                                const y = Math.max(0, Math.min(1, (me.clientY - rect.top) / rect.height));
                                                setRotationCenter({ x, y });
                                            };
                                            const onUp = () => {
                                                document.removeEventListener('mousemove', onMove);
                                                document.removeEventListener('mouseup', onUp);
                                            };
                                            document.addEventListener('mousemove', onMove);
                                            document.addEventListener('mouseup', onUp);
                                        }}
                                    >
                                        <div className="w-6 h-6 relative">
                                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 -translate-y-1/2" />
                                            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-red-500 -translate-x-1/2" />
                                            <div className="absolute top-1/2 left-1/2 w-3 h-3 border-2 border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 bg-white/50" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BOTTOM LEFT — Exit Button */}
                            <div className="absolute bottom-6 left-6">
                                <button
                                    onClick={() => {
                                        if (isDirtyRef.current) {
                                            if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
                                        }
                                        onClose();
                                    }}
                                    className="w-12 h-12 bg-white text-gray-500 rounded-2xl flex items-center justify-center shadow-lg border border-gray-200 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-colors active:scale-95"
                                    title="Exit without saving"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </div>

                            {/* BOTTOM RIGHT — Save Button */}
                            <div className="absolute bottom-6 right-6">
                                <button
                                    onClick={handleSave}
                                    className="px-10 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-2xl font-extrabold text-lg flex items-center gap-3 shadow-[0_8px_24px_rgba(34,197,94,0.35)] hover:shadow-[0_12px_32px_rgba(34,197,94,0.45)] transition-[transform,shadow] duration-150 active:scale-[0.97] border border-green-500/20"
                                >
                                    <ImageIcon size={22} strokeWidth={2.5} />
                                    SAVE
                                </button>
                            </div>

                            {/* BOTTOM CENTER — Zoom Controls */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white rounded-2xl border border-gray-200 p-1.5 shadow-xl">
                                <button
                                    onClick={() => setZoom(zoom * 0.9)}
                                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg>
                                </button>
                                <button
                                    onClick={() => setZoom(1)}
                                    className="px-3 py-1.5 text-sm font-black text-[#855CD6] hover:bg-purple-50 rounded-xl transition-colors min-w-[52px] text-center"
                                >
                                    {Math.round(zoom * 100)}%
                                </button>
                                <button
                                    onClick={() => setZoom(zoom * 1.1)}
                                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolBtn = ({ onClick, icon, title, disabled }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-[#855CD6] hover:bg-purple-50 active:scale-95'}`}
    >
        {icon}
    </button>
);

const ToolBtnHorizontal = ({ onClick, icon, label, color = "text-gray-500 hover:text-[#855CD6]" }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all active:scale-95 group">
        <div className={`${color} transition-colors`}>{icon}</div>
        <span className="text-[11px] font-bold text-gray-400 capitalize group-hover:text-gray-600 transition-colors">{label}</span>
    </button>
);

const ToolBtnVertical = ({ onClick, icon, label, color = "group-hover:text-[#855CD6]" }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl group active:scale-95 transition-all hover:bg-gray-100">
        <div className={`text-gray-500 ${color} transition-colors`}>{icon}</div>
        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors leading-none">{label}</span>
    </button>
);

const DrawTool = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        title={label}
        className={`w-[56px] h-[56px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${active ? 'bg-[#855CD6] text-white shadow-lg shadow-purple-200 scale-105' : 'text-gray-500 hover:bg-gray-100 hover:text-[#855CD6] hover:scale-105'}`}
    >
        {icon}
        <span className="text-[9px] font-bold opacity-80 leading-none">{label}</span>
    </button>
);

export default PaintEditor;
