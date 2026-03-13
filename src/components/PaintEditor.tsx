import React, { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';
import {
    Undo, Redo, Copy, Clipboard, Trash2, Square, Circle, Pen, Eraser,
    Type, MousePointer2, PaintBucket, Minus, FlipHorizontal, FlipVertical,
    ChevronDown, ArrowUp, ArrowDown,
    Plus, Search, MousePointer,
    MoveUp, MoveDown, Layers, Image as ImageIcon,
    Combine, Ungroup, Download, Sparkles
} from 'lucide-react';
import { ActionMenu } from '../stage/ActionMenu';
import { CostumeLibrary } from './CostumeLibrary';
import HSBColorPicker from './HSBColorPicker';

// Built-in costumes for "Surprise" feature
const BUILTIN_COSTUMES = [
    { name: 'Robot Idle', src: '/assets/sprites/robot/robot_idle.svg' },
    { name: 'Cat', src: '/assets/sprites/scratch/cat.svg' },
    { name: 'Butterfly', src: '/assets/sprites/scratch/butterfly.svg' },
    { name: 'Dolphin', src: '/assets/sprites/scratch/dolphin.svg' },
    { name: 'Elephant', src: '/assets/sprites/scratch/elephant.svg' },
];

interface Costume {
    id: string;
    name: string;
    image: string;
}

interface PaintEditorProps {
    onSave: (imageData: string, svgData?: string, name?: string) => void;
    onClose: () => void;
    title?: string;
    initialImage?: string;
    costumes?: Costume[];
    spriteName?: string;
    mode?: 'junior' | 'intermediate';
    onDeleteSound?: (index: number) => void;
    onDuplicateSound?: (index: number) => void;
    onOpenLibrary?: () => void;
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
    onOpenLibrary
}: PaintEditorProps) {
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
    const [activeCostumeIndex, setActiveCostumeIndex] = useState(0);

    // Auto BG Removal handler
    const handleAutoRemoveBG = async () => {
        const canvas = canvasRef.current;
        if (!canvas || isRemovingBg) return;

        // If there's an active selected object that is an image, we could theoretically just remove its bg.
        // But for a generalized approach, we remove the background of the ENTIRE canvas content.

        setIsRemovingBg(true);
        // Get high quality PNG of current canvas
        const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });

        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.removeBackground(dataUrl);
                if (result.success && (result as any).base64) {
                    // Clear the current canvas and load the new strict-object image
                    canvas.clear();

                    fabric.Image.fromURL((result as any).base64, (img: fabric.FabricImage) => {
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

                        canvas.add(img);
                        canvas.renderAll();
                        saveState();
                    }, { crossOrigin: 'anonymous' });
                } else {
                    console.error("Auto BG Removal Failed:", result.error);
                }
            } catch (err) {
                console.error("Auto BG IPC Failed:", err);
            }
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
            };
        }
    }, []); // Only run once to create the canvas

    // Load image when activeImage changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let isActive = true;

        // Resize canvas if needed
        if (canvas.width !== canvasW || canvas.height !== canvasH) {
            canvas.setWidth(canvasW);
            canvas.setHeight(canvasH);
        }

        // Clear existing content immediately
        canvas.clear();
        canvas.backgroundColor = 'transparent';

        const currentImage = costumes[activeCostumeIndex]?.image || '';

        if (currentImage) {
            const isSVG = currentImage.includes('<svg') || currentImage.endsWith('.svg');
            if (isSVG) {
                const handleLoadedSVG = (objects: fabric.Object[], options: any) => {
                    if (!isActive) return;
                    const group = fabric.util.groupSVGElements(objects, options);
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
                        const items = (group as fabric.Group).getObjects();
                        (group as any)._restoreObjectsState();
                        canvas.remove(group);
                        items.forEach((item: fabric.FabricObject) => canvas.add(item));
                    } else {
                        canvas.add(group);
                    }
                    canvas.renderAll();
                    saveState();
                };
                if (currentImage.includes('<svg')) fabric.loadSVGFromString(currentImage, handleLoadedSVG);
                else fabric.loadSVGFromURL(currentImage, handleLoadedSVG);
            } else {
                fabric.Image.fromURL(currentImage, (img: fabric.FabricImage) => {
                    if (!isActive) return;
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
                }, { crossOrigin: 'anonymous' });
            }
        } else {
            saveState();
        }

        return () => {
            isActive = false;
        };
    }, [activeCostumeIndex, costumes, isBackdropMode, canvasW, canvasH]);

    // Update canvas when initialImage changes (e.g., switching between sprite and stage)
    useEffect(() => {
        if (initialImage !== activeImage) {
            setActiveImage(initialImage || '');
        }
        if (costumes.length > 0) {
            const index = costumes.findIndex(c => c.image === initialImage);
            setActiveCostumeIndex(index >= 0 ? index : 0);
        }
    }, [initialImage, activeImage, costumes]);

    // Update costume name when spriteName changes (e.g., switching between sprite and stage)
    useEffect(() => {
        setCostumeName(spriteName);
    }, [spriteName]);

    // Tool Management
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = false;
        canvas.selection = activeTool === 'select';

        if (activeTool === 'brush') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = outlineColor;
            canvas.freeDrawingBrush.width = strokeWidth;
        } else if (activeTool === 'eraser') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = '#ffffff';
            canvas.freeDrawingBrush.width = strokeWidth * 2;
        }

        const handleMouseDown = (opt: fabric.IEvent) => {
            if (activeTool === 'fill' && opt.target) {
                opt.target.set('fill', fillColor);
                canvas.renderAll();
                saveState();
            }
        };

        canvas.on('mouse:down', handleMouseDown);
        return () => {
            canvas.off('mouse:down', handleMouseDown);
        };
    }, [activeTool, outlineColor, fillColor, strokeWidth]);

    const saveState = () => {
        if (isRestoring.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
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
            activeObject.clone((cloned: fabric.Object) => setClipboard(cloned));
        }
    };

    const paste = () => {
        const canvas = canvasRef.current;
        if (clipboard) {
            clipboard.clone((cloned: fabric.Object) => {
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
            (activeObj as fabric.ActiveSelection).toGroup();
            canvas?.requestRenderAll();
            saveState();
        }
    };

    const ungroupObjects = () => {
        const canvas = canvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (activeObj?.type === 'group') {
            (activeObj as fabric.Group).toActiveSelection();
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
        if (obj) {
            if (action === 'front') canvas?.bringToFront(obj);
            else if (action === 'back') canvas?.sendToBack(obj);
            else if (action === 'forward') canvas?.bringForward(obj);
            else if (action === 'backward') canvas?.sendBackwards(obj);
            canvas?.renderAll();
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Export as SVG data URL (vibrant and sharp)
        const svgString = canvas.toSVG();
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

        // Export as PNG (backup/preview)
        const imageData = canvas.toDataURL({
            format: 'png',
            quality: 1
        });

        onSave(imageData, svgDataUrl, costumeName);
        onClose();
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            // Set as active image (will display in editor)
            setActiveImage(dataUrl);
            // Also save it as a new costume
            onSave(dataUrl, undefined, file.name.replace(/\.[^/.]+$/, '')); // Remove extension
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
                        onSave(src, undefined, name);
                        setIsLibraryOpen(false);
                    }}
                />
            )}

            {/* 0. JUNIOR HEADER (matches JuniorApp style) */}
            {mode === 'junior' && (
                <div className="h-12 bg-[#7B4FC4] flex items-center px-4 justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Pen size={18} color="white" />
                        </div>
                        <span className="text-white font-bold text-lg">Paint Editor</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <ChevronDown size={24} className="rotate-180" />
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden w-full h-full">
                {/* 1. LEFT SIDEBAR (Costumes/Backdrops) */}
                <div className="w-[100px] border-r border-gray-200 flex flex-col bg-[#EDF1F7] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3 no-scrollbar relative pb-20">
                        {costumes.map((c, i) => (
                            <div key={c.id || i} className="relative group">
                                <div
                                    onClick={() => setActiveCostumeIndex(i)}
                                    className={`w-[80px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-1 bg-white cursor-pointer relative ${activeCostumeIndex === i ? 'border-[#855CD6] shadow-sm' : 'border-gray-200'}`}
                                >
                                    <span className="absolute top-1 left-1.5 text-[10px] text-gray-500 font-bold">{i + 1}</span>
                                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                        <img src={c.image} className="max-w-full max-h-[50px] object-contain" alt={c.name} />
                                    </div>
                                    <div className="w-full text-[10px] text-center truncate text-gray-700 font-medium px-0.5 mt-0.5" title={c.name}>{c.name}</div>
                                </div>

                                {/* Context Actions (Hover) */}
                                <div className={`absolute -top-2 -right-2 flex-col gap-1 z-10 hidden group-hover:flex ${activeCostumeIndex === i ? 'flex' : ''}`}>
                                    <button
                                        className="w-6 h-6 bg-white border border-gray-200 text-gray-500 hover:text-rose-500 rounded-full flex items-center justify-center shadow-md transition-colors"
                                        title="Delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onDeleteSound) onDeleteSound(i);
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <button
                                        className="w-6 h-6 bg-white border border-gray-200 text-gray-500 hover:text-[#855CD6] rounded-full flex items-center justify-center shadow-md transition-colors"
                                        title="Duplicate"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onDuplicateSound) onDuplicateSound(i);
                                        }}
                                    >
                                        <Copy size={12} />
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
                                {
                                    id: 'surprise', icon: '✨', label: 'Surprise', onClick: () => {
                                        // Pick a random costume from built-in library
                                        const idx = Math.floor(Math.random() * BUILTIN_COSTUMES.length);
                                        const costume = BUILTIN_COSTUMES[idx];
                                        onSave(costume.src, undefined, costume.name);
                                    }
                                },
                                { id: 'paint', icon: '🖌️', label: 'Paint', onClick: () => { /* already in editor */ } },
                                { id: 'search', icon: '🔍', label: 'Choose a Costume', onClick: () => onOpenLibrary ? onOpenLibrary() : setIsLibraryOpen(true) },
                            ]}
                        />
                    </div>
                </div>

                {/* 2. MAIN EDITOR AREA */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* TOP TOOLBAR ROW 1 */}
                    <div className="h-14 px-6 border-b border-gray-100 flex items-center bg-white justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title === 'Backdrop Editor' ? 'Backdrop' : 'Costume'}</span>
                                <input
                                    type="text"
                                    value={costumeName}
                                    onChange={(e) => setCostumeName(e.target.value)}
                                    className="bg-white border rounded-full px-4 py-1.5 text-sm font-semibold text-gray-600 outline-none focus:border-[#855CD6] focus:ring-2 focus:ring-purple-100 w-32 shadow-sm transition-all"
                                />
                            </div>

                            <div className="h-6 w-px bg-gray-200" />

                            <div className="flex items-center gap-1">
                                <ToolBtn onClick={undo} icon={<Undo size={18} />} title="Undo" disabled={historyIndex <= 0} />
                                <ToolBtn onClick={redo} icon={<Redo size={18} />} title="Redo" disabled={historyIndex >= history.length - 1} />
                            </div>

                            <div className="h-6 w-px bg-gray-200" />

                            <div className="flex items-center gap-3">
                                <ToolBtnVertical onClick={groupObjects} icon={<Combine size={18} />} label="Group" />
                                <ToolBtnVertical onClick={ungroupObjects} icon={<Ungroup size={18} />} label="Ungroup" />
                            </div>

                            <div className="h-6 w-px bg-gray-200" />

                            <div className="flex items-center gap-1">
                                <ToolBtnVertical onClick={() => handleLayering('forward')} icon={<ArrowUp size={16} />} label="Forward" />
                                <ToolBtnVertical onClick={() => handleLayering('backward')} icon={<ArrowDown size={16} />} label="Backward" />
                                <ToolBtnVertical onClick={() => handleLayering('front')} icon={<MoveUp size={16} />} label="Front" />
                                <ToolBtnVertical onClick={() => handleLayering('back')} icon={<MoveDown size={16} />} label="Back" />
                            </div>
                        </div>
                    </div>

                    {/* TOP TOOLBAR ROW 2 */}
                    <div className="h-14 px-6 border-b border-gray-200 flex flex-shrink-0 items-center bg-white gap-6 shadow-sm z-20 relative">
                        <div className="flex items-center gap-4">
                            {/* Fill Color Picker Dropdown */}
                            <div className="flex items-center gap-2 relative">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Fill</span>
                                <div
                                    className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm cursor-pointer hover:border-[#855CD6] transition-colors"
                                    onClick={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                                >
                                    <div className="w-8 h-8 rounded-md border border-gray-100 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')]" style={{ position: 'relative' }}>
                                        {fillColor !== 'transparent' && <div className="absolute inset-0 rounded-md" style={{ backgroundColor: fillColor }} />}
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
                                    />
                                )}
                            </div>

                            {/* Outline Color Picker Dropdown */}
                            <div className="flex items-center gap-2 relative">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Outline</span>
                                <div
                                    className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm cursor-pointer hover:border-[#855CD6] transition-colors"
                                    onClick={() => setActiveColorPicker(activeColorPicker === 'outline' ? null : 'outline')}
                                >
                                    <div className="w-8 h-8 rounded-md border border-gray-100 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')]" style={{ position: 'relative' }}>
                                        {outlineColor !== 'transparent' && <div className="absolute inset-1 rounded-md border-[4px]" style={{ borderColor: outlineColor }} />}
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
                                            // Update stroke for brush tool if active
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
                                    />
                                )}
                            </div>

                            {/* Stroke Width input */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-500 uppercase">Thickness</span>
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
                                    className="bg-white border text-center rounded-lg px-2 py-2 text-sm font-bold text-gray-700 w-14 outline-none focus:border-[#855CD6] shadow-sm"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        <div className="h-8 w-px bg-gray-200" />

                        <div className="flex items-center gap-4">
                            <ToolBtnVertical onClick={copy} icon={<Copy size={18} />} label="Copy" />
                            <ToolBtnVertical onClick={paste} icon={<Clipboard size={18} />} label="Paste" />
                            <ToolBtnVertical onClick={deleteActive} icon={<Trash2 size={18} />} label="Delete" color="hover:text-rose-500" />
                        </div>

                        <div className="h-8 w-px bg-gray-200" />

                        <div className="flex items-center gap-4">
                            <ToolBtnVertical onClick={() => handleFlip('h')} icon={<FlipHorizontal size={18} />} label="Flip Horizontal" />
                            <ToolBtnVertical onClick={() => handleFlip('v')} icon={<FlipVertical size={18} />} label="Flip Vertical" />
                        </div>

                        <div className="h-8 w-px bg-gray-200" />

                        <div className="flex items-center gap-4">
                            <ToolBtnVertical onClick={handleAutoRemoveBG} icon={<Sparkles size={18} />} label="Auto BG Remove" color={isRemovingBg ? "text-purple-500 animate-pulse" : "group-hover:text-purple-500"} />
                        </div>
                    </div>

                    <div className="flex-1 flex relative bg-[#E9EEF2]">
                        {/* DRAWING TOOLS (2-COLUMN GRID matching Scratch) */}
                        <div className="w-[100px] border-r border-[#d9e1e8] bg-white flex flex-col p-2 gap-2 shadow-sm z-10">
                            <div className="grid grid-cols-2 gap-2">
                                <DrawTool active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon={<MousePointer2 size={20} className={activeTool === 'select' ? "fill-white" : ""} />} label="Select" />
                                <DrawTool active={activeTool === 'reshape'} onClick={() => setActiveTool('reshape')} icon={<MousePointer size={20} />} label="Reshape" />

                                <DrawTool active={activeTool === 'brush'} onClick={() => setActiveTool('brush')} icon={<Pen size={20} />} label="Brush" />
                                <DrawTool active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={20} />} label="Eraser" />

                                <DrawTool active={activeTool === 'fill'} onClick={() => setActiveTool('fill')} icon={<PaintBucket size={20} />} label="Fill" />
                                <DrawTool active={activeTool === 'text'} onClick={() => addShape('text')} icon={<Type size={20} />} label="Text" />

                                <DrawTool active={activeTool === 'line'} onClick={() => addShape('line')} icon={<Minus size={22} className="-rotate-45" />} label="Line" />
                                <DrawTool active={activeTool === 'circle'} onClick={() => addShape('circle')} icon={<Circle size={20} />} label="Circle" />

                                <DrawTool active={activeTool === 'rect'} onClick={() => addShape('rect')} icon={<Square size={20} />} label="Rectangle" />
                            </div>
                        </div>

                        {/* CANVAS AREA */}
                        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative" style={{ cursor: activeTool === 'fill' ? 'crosshair' : 'default' }}>
                            <div className="relative shadow-md border-2 border-[#d9e1e8] bg-white rounded-lg overflow-hidden"
                                style={{
                                    backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjhmOGY4Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmOGY4ZjgiLz48L3N2Zz4=')`,
                                    backgroundSize: '20px 20px',
                                    width: `${canvasW}px`, height: `${canvasH}px`,
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center center'
                                }}>
                                <canvas id="fabric-canvas" />
                            </div>

                            {/* BOTTOM ACTIONS */}
                            <div className="absolute bottom-6 left-6">
                                {/* Junior-style Back/Exit Button */}
                                <button
                                    onClick={onClose}
                                    className="w-14 h-14 bg-[#7B4FC4] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-4 border-white"
                                    title="Exit without saving"
                                >
                                    <div className="w-5 h-5 bg-white rounded-sm" />
                                </button>
                            </div>

                            <div className="absolute bottom-6 right-6 flex items-center gap-4">
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-3 bg-[#22c55e] text-white rounded-2xl font-black text-xl flex items-center gap-3 shadow-xl hover:bg-green-600 transition-all hover:scale-105 active:scale-95"
                                >
                                    <ImageIcon size={24} />
                                    SAVE
                                </button>
                            </div>

                            <div className="absolute bottom-6 right-[240px] flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1.5 shadow-lg">
                                <button onClick={() => setZoom(zoom * 0.9)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Search size={20} /></button>
                                <div className="w-px h-5 bg-gray-200 mx-1" />
                                <button onClick={() => setZoom(1)} className="px-3 py-1 text-sm font-black text-[#7B4FC4] hover:bg-purple-50 rounded-lg transition-colors">100%</button>
                                <div className="w-px h-5 bg-gray-200 mx-1" />
                                <button onClick={() => setZoom(zoom * 1.1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Search size={20} /></button>
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
        className={`p-2 rounded-lg transition-all ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-[#855CD6] hover:bg-purple-50 active:scale-95'}`}
    >
        {icon}
    </button>
);

const ToolBtnHorizontal = ({ onClick, icon, label, color = "text-gray-500 hover:text-[#855CD6]" }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 hover:bg-gray-50 rounded-lg transition-all active:scale-95 group py-1">
        <div className={`${color} transition-colors`}>{icon}</div>
        <span className="text-[10px] font-bold text-gray-400 capitalize group-hover:text-gray-600 transition-colors">{label}</span>
    </button>
);

const ToolBtnVertical = ({ onClick, icon, label, color = "group-hover:text-[#855CD6]" }: any) => (
    <button onClick={onClick} className="flex flex-col items-center px-2 py-1 hover:bg-gray-50 rounded-lg group active:scale-95 transition-all">
        <div className={`text-gray-500 ${color} transition-colors`}>{icon}</div>
        <span className="text-[9px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors mt-0.5">{label}</span>
    </button>
);

const DrawTool = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        title={label}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all stroke-2 ${active ? 'bg-[#855CD6] text-white shadow-md' : 'text-[#4d4d4d] hover:bg-[#e8f0fe] hover:text-[#855CD6] hover:shadow-sm bg-[#f8f9fa] border border-[#d9e1e8]'}`}
    >
        {icon}
    </button>
);

export default PaintEditor;
