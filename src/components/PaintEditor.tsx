import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import {
    Undo, Redo, Copy, Clipboard, Trash2, Square, Circle, Pen, Eraser,
    Type, MousePointer2, PaintBucket, Minus, FlipHorizontal, FlipVertical,
    ChevronDown, ArrowUp, ArrowDown,
    Plus, Search, MousePointer,
    MoveUp, MoveDown, Layers, Image as ImageIcon,
    Combine, Ungroup
} from 'lucide-react';

interface Costume {
    id: string;
    name: string;
    image: string;
}

interface PaintEditorProps {
    onSave: (imageData: string, svgData?: string) => void;
    onClose: () => void;
    title?: string;
    initialImage?: string;
    costumes?: Costume[];
    spriteName?: string;
    mode?: 'junior' | 'intermediate';
}

const PaintEditor: React.FC<PaintEditorProps> = ({
    onSave,
    onClose,
    title = "Paint Editor",
    initialImage,
    costumes = [],
    spriteName = "Sprite",
    mode = 'intermediate'
}) => {
    const canvasRef = useRef<fabric.Canvas | null>(null);
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
    }, [activeTool, outlineColor, strokeWidth]);

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

    return (
        <div className="flex flex-1 w-full h-full bg-white select-none overflow-hidden font-sans border-t border-gray-100">
            {/* 1. LEFT SIDEBAR (Costumes/Backdrops) */}
            <div className="w-[100px] border-r border-gray-200 flex flex-col bg-[#EDF1F7] overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3 no-scrollbar">
                    {costumes.map((c, i) => (
                        <div key={c.id || i} className="relative group">
                            <div
                                onClick={() => setActiveImage(c.image)}
                                className={`w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 bg-white cursor-pointer relative ${activeImage === c.image ? 'border-[#855CD6] shadow-sm' : 'border-gray-200'}`}
                            >
                                <span className="absolute top-0.5 left-1 text-[10px] text-gray-400 font-bold">{i + 1}</span>
                                <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                    <img src={c.image} className="max-w-full max-h-full object-contain" alt={c.name} />
                                </div>
                                <div className="w-full text-[9px] text-center truncate text-gray-500 font-medium px-0.5 mt-0.5">{c.name}</div>
                                <div className="text-[8px] text-gray-300">70 x 113</div>
                            </div>
                            {activeImage === c.image && (
                                <button className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#855CD6] text-white rounded-full flex items-center justify-center shadow-md z-10 border border-white">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-[#e0d6ff] rounded-t-3xl flex items-center justify-center cursor-pointer hover:bg-[#d0c0ff] transition-colors mt-auto">
                    <div className="w-10 h-10 bg-[#855CD6] rounded-full flex items-center justify-center text-white shadow-inner">
                        <ImageIcon size={22} fill="white" />
                    </div>
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
                            <button onClick={() => onSave('', '')} className="px-6 py-2.5 bg-[#855CD6] text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-purple-100 hover:bg-[#724bbd] transition-colors">
                                <Layers size={18} />
                                Convert to Bitmap
                            </button>
                        </div>

                        <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                            <button onClick={() => setZoom(zoom * 0.9)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Search size={18} /></button>
                            <div className="w-px h-4 bg-gray-100 mx-1" />
                            <button onClick={() => setZoom(1)} className="px-2 py-1 text-sm font-bold text-gray-400 hover:text-gray-600">=</button>
                            <div className="w-px h-4 bg-gray-100 mx-1" />
                            <button onClick={() => setZoom(zoom * 1.1)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Search size={18} /></button>
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
