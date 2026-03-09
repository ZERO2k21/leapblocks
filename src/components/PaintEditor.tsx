import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
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
    onDuplicateSound
}: PaintEditorProps) {
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTool, setActiveTool] = useState<string>('select');
    const [fillColor, setFillColor] = useState('#855CD6');
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [zoom, setZoom] = useState(1);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [activeImage, setActiveImage] = useState<string>(initialImage || '');
    const [costumeName, setCostumeName] = useState(spriteName);
    const [clipboard, setClipboard] = useState<fabric.Object | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // Initialize Canvas
    useEffect(() => {
        const canvas = new fabric.Canvas('fabric-canvas', {
            width: 800,
            height: 600,
            backgroundColor: 'transparent',
            isDrawingMode: false,
            selection: true,
        });

        canvasRef.current = canvas;

        if (activeImage) {
            const isSVG = activeImage.includes('<svg') || activeImage.endsWith('.svg');
            if (isSVG) {
                const handleLoadedSVG = (objects: fabric.Object[], options: any) => {
                    const group = fabric.util.groupSVGElements(objects, options);
                    group.set({
                        left: canvas.width! / 2,
                        top: canvas.height! / 2,
                        originX: 'center',
                        originY: 'center',
                    });
                    const pad = 60;
                    const scale = Math.min(
                        (canvas.width! - pad) / (group.width! || 1),
                        (canvas.height! - pad) / (group.height! || 1)
                    );
                    if (scale < 1) group.scale(scale);

                    if (group.type === 'group') {
                        const items = (group as fabric.Group).getObjects();
                        (group as any)._restoreObjectsState();
                        canvas.remove(group);
                        items.forEach(item => canvas.add(item));
                    } else {
                        canvas.add(group);
                    }
                    canvas.renderAll();
                    saveState();
                };
                if (activeImage.includes('<svg')) fabric.loadSVGFromString(activeImage, handleLoadedSVG);
                else fabric.loadSVGFromURL(activeImage, handleLoadedSVG);
            } else {
                fabric.Image.fromURL(activeImage, (img) => {
                    img.set({
                        left: canvas.width! / 2,
                        top: canvas.height! / 2,
                        originX: 'center',
                        originY: 'center',
                    });
                    const pad = 60;
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

        canvas.on('object:added', () => saveState());
        canvas.on('object:modified', () => saveState());
        canvas.on('object:removed', () => saveState());

        return () => {
            canvas.dispose();
        };
    }, [activeImage]);

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
        const canvas = canvasRef.current;
        if (!canvas) return;
        const json = JSON.stringify(canvas.toJSON());
        setHistory(prev => {
            const next = [...prev.slice(0, historyIndex + 1), json];
            return next.slice(-50);
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    };

    const undo = () => {
        if (historyIndex > 0) {
            const canvas = canvasRef.current;
            const state = history[historyIndex - 1];
            canvas?.loadFromJSON(JSON.parse(state), () => {
                canvas.renderAll();
                setHistoryIndex(historyIndex - 1);
            });
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const canvas = canvasRef.current;
            const state = history[historyIndex + 1];
            canvas?.loadFromJSON(JSON.parse(state), () => {
                canvas.renderAll();
                setHistoryIndex(historyIndex + 1);
            });
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
            activeObjects.forEach(obj => canvas?.remove(obj));
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

            {/* Costume Library Modal */}
            <CostumeLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onSelectCostume={(name, src) => {
                    onSave(src, undefined, name);
                    setIsLibraryOpen(false);
                }}
            />

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
                                    onClick={() => setActiveImage(c.image)}
                                    className={`w-[80px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-1 bg-white cursor-pointer relative ${activeImage === c.image ? 'border-[#855CD6] shadow-sm' : 'border-gray-200'}`}
                                >
                                    <span className="absolute top-1 left-1.5 text-[10px] text-gray-500 font-bold">{i + 1}</span>
                                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                        <img src={c.image} className="max-w-full max-h-[50px] object-contain" alt={c.name} />
                                    </div>
                                    <div className="w-full text-[10px] text-center truncate text-gray-700 font-medium px-0.5 mt-0.5" title={c.name}>{c.name}</div>
                                </div>

                                {/* Context Actions (Hover) */}
                                <div className={`absolute -top-2 -right-2 flex-col gap-1 z-10 hidden group-hover:flex ${activeImage === c.image ? 'flex' : ''}`}>
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
                                { id: 'surprise', icon: '✨', label: 'Surprise', onClick: () => {
                                    // Pick a random costume from built-in library
                                    const idx = Math.floor(Math.random() * DEFAULT_COSTUMES.length);
                                    const costume = DEFAULT_COSTUMES[idx];
                                    onSave(costume.src, undefined, costume.name);
                                }},
                                { id: 'paint', icon: '🖌️', label: 'Paint', onClick: () => { /* already in editor */ } },
                                { id: 'search', icon: '🔍', label: 'Choose a Costume', onClick: () => setIsLibraryOpen(true) },
                            ]}
                        />
                    </div>
                </div>

                {/* 2. MAIN EDITOR AREA */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* TOP TOOLBAR ROW 1 */}
                    <div className="h-14 px-6 border-b border-gray-100 flex items-center bg-white">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400">{title === 'Backdrop Editor' ? 'Backdrop' : 'Costume'}</span>
                                <input
                                    type="text"
                                    value={costumeName}
                                    onChange={(e) => setCostumeName(e.target.value)}
                                    className="bg-[#f8f8f8] border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-600 outline-none focus:border-[#855CD6] w-32"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ToolBtn onClick={undo} icon={<Undo size={18} />} title="Undo" />
                                <ToolBtn onClick={redo} icon={<Redo size={18} />} title="Redo" />
                            </div>
                            <div className="h-6 w-px bg-gray-100" />
                            <div className="flex items-center gap-4">
                                <ToolBtnHorizontal onClick={groupObjects} icon={<Combine size={18} />} label="Group" />
                                <ToolBtnHorizontal onClick={ungroupObjects} icon={<Ungroup size={18} />} label="Ungroup" />
                            </div>
                            <div className="h-6 w-px bg-gray-100" />
                            <div className="flex items-center gap-1">
                                <ToolBtnVertical onClick={() => handleLayering('forward')} icon={<ArrowUp size={16} />} label="Forward" />
                                <ToolBtnVertical onClick={() => handleLayering('backward')} icon={<ArrowDown size={16} />} label="Backward" />
                                <ToolBtnVertical onClick={() => handleLayering('front')} icon={<MoveUp size={16} />} label="Front" />
                                <ToolBtnVertical onClick={() => handleLayering('back')} icon={<MoveDown size={16} />} label="Back" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><Undo size={22} /></button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><Redo size={22} /></button>
                        </div>
                    </div>

                    {/* TOP TOOLBAR ROW 2 */}
                    <div className="h-14 px-6 border-b border-gray-100 flex items-center bg-white gap-8">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Fill</span>
                                <div className="flex items-center gap-1 bg-[#f8f8f8] p-1 rounded-lg border border-gray-200">
                                    <div className="w-8 h-8 rounded-md cursor-pointer border border-gray-100 shadow-sm" style={{ backgroundColor: fillColor }}>
                                        <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                    <ChevronDown size={12} className="text-gray-400 mr-1" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Outline</span>
                                <div className="flex items-center gap-1 bg-[#f8f8f8] p-1 rounded-lg border border-gray-200">
                                    <div className="w-8 h-8 rounded-md cursor-pointer border border-gray-100 shadow-sm" style={{ backgroundColor: outlineColor }}>
                                        <input type="color" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} className="w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                    <ChevronDown size={12} className="text-gray-400 mr-1" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Thickness</span>
                                <div className="bg-[#f8f8f8] px-4 py-1.5 rounded-full border border-gray-200 text-sm font-bold text-gray-600 flex items-center justify-center min-w-[50px]">
                                    {strokeWidth}
                                </div>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-gray-100" />

                        <div className="flex items-center gap-4">
                            <ToolBtnHorizontal onClick={copy} icon={<Copy size={18} />} label="Copy" />
                            <ToolBtnHorizontal onClick={paste} icon={<Clipboard size={18} />} label="Paste" />
                            <ToolBtnHorizontal onClick={deleteActive} icon={<Trash2 size={18} />} label="Delete" color="text-rose-500" />
                        </div>

                        <div className="h-6 w-px bg-gray-100" />

                        <div className="flex items-center gap-4">
                            <ToolBtnHorizontal onClick={() => handleFlip('h')} icon={<FlipHorizontal size={18} />} label="Flip Horizontal" />
                            <ToolBtnHorizontal onClick={() => handleFlip('v')} icon={<FlipVertical size={18} />} label="Flip Vertical" />
                        </div>
                    </div>

                    <div className="flex-1 flex relative">
                        {/* DRAWING TOOLS (VERTICAL) */}
                        <div className="w-16 border-r border-gray-100 flex flex-col items-center py-4 gap-4 bg-white">
                            <DrawTool active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon={<MousePointer2 size={24} fill={activeTool === 'select' ? 'white' : 'transparent'} />} />
                            <DrawTool active={activeTool === 'reshape'} onClick={() => setActiveTool('reshape')} icon={<MousePointer size={24} />} />
                            <DrawTool active={activeTool === 'brush'} onClick={() => setActiveTool('brush')} icon={<Pen size={22} />} />
                            <DrawTool active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={22} />} />
                            <DrawTool active={activeTool === 'fill'} onClick={() => setActiveTool('fill')} icon={<PaintBucket size={22} />} />
                            <DrawTool active={activeTool === 'text'} onClick={() => addShape('text')} icon={<Type size={22} />} />
                            <DrawTool active={activeTool === 'line'} onClick={() => addShape('line')} icon={<Minus size={24} className="-rotate-45" />} />
                            <DrawTool active={activeTool === 'circle'} onClick={() => addShape('circle')} icon={<Circle size={22} />} />
                            <DrawTool active={activeTool === 'rect'} onClick={() => addShape('rect')} icon={<Square size={22} />} />
                        </div>

                        {/* CANVAS AREA */}
                        <div className="flex-1 bg-[#f8fafe] flex items-center justify-center p-8 overflow-hidden relative">
                            <div className="relative shadow-2xl border border-gray-100 bg-white"
                                style={{
                                    backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjhmOGY4Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmOGY4ZjgiLz48L3N2Zz4=')`,
                                    width: '800px', height: '600px',
                                    transform: `scale(${zoom})`
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

const ToolBtn = ({ onClick, icon, title }: any) => (
    <button onClick={onClick} title={title} className="p-2 hover:bg-gray-50 rounded-lg text-[#855CD6] bg-[#f8f6ff] transition-all active:scale-95">
        {icon}
    </button>
);

const ToolBtnHorizontal = ({ onClick, icon, label, color = "text-[#855CD6]" }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 hover:bg-gray-50 rounded-lg transition-all active:scale-95">
        <div className={color}>{icon}</div>
        <span className="text-[10px] font-bold text-gray-400 capitalize">{label}</span>
    </button>
);

const ToolBtnVertical = ({ onClick, icon, label }: any) => (
    <button onClick={onClick} className="flex flex-col items-center px-1.5 hover:bg-gray-50 rounded-lg group">
        <div className="text-gray-400 group-hover:text-[#855CD6]">{icon}</div>
        <span className="text-[8px] font-bold text-gray-300 group-hover:text-gray-400 uppercase tracking-tighter">{label}</span>
    </button>
);

const DrawTool = ({ active, onClick, icon }: any) => (
    <button
        onClick={onClick}
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-[#855CD6] text-white shadow-lg shadow-purple-100' : 'text-gray-400 hover:bg-gray-100'}`}
    >
        {icon}
    </button>
);

export default PaintEditor;
