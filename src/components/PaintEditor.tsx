import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import {
    X, Undo, Redo, Save, Trash2, Square, Circle, Pen, Eraser,
    Type, Move, MousePointer2, PaintBucket, Camera, Minus,
    Triangle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
    FlipHorizontal, FlipVertical, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine,
    Plus, Smile, Search, MinusCircle, PlusCircle, Star, Heart, Pentagon, Hexagon
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
    mode = 'junior'
}) => {
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<string>('pencil');
    const [fillColor, setFillColor] = useState('#A855F7');
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [brushSize, setBrushSize] = useState(5);
    const [zoom, setZoom] = useState(1);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [activeImage, setActiveImage] = useState<string>(initialImage || '');

    // Initialize Canvas
    useEffect(() => {
        const canvas = new fabric.Canvas('fabric-canvas', {
            width: 600,
            height: 450,
            backgroundColor: '#ffffff',
            isDrawingMode: true,
            selection: true,
            skipTargetFind: false
        });

        canvasRef.current = canvas;

        if (activeImage) {
            const isSVG = activeImage.includes('<svg') || activeImage.endsWith('.svg');

            if (isSVG) {
                const handleLoadedSVG = (objects: fabric.Object[], options: any) => {
                    if (!objects || objects.length === 0) {
                        console.error('[PAINT] No objects found in SVG:', activeImage);
                        return;
                    }
                    const group = fabric.util.groupSVGElements(objects, options);

                    // Center it
                    group.set({
                        left: canvas.width! / 2,
                        top: canvas.height! / 2,
                        originX: 'center',
                        originY: 'center',
                    });

                    // ── SCALE TO FIT ─────────────────────────────────
                    const pad = 40; // Padding
                    const scale = Math.min(
                        (canvas.width! - pad) / (group.width! || 1),
                        (canvas.height! - pad) / (group.height! || 1)
                    );
                    if (scale < 1) group.scale(scale);

                    if (mode === 'junior') {
                        canvas.add(group);
                    } else {
                        // "Explode" group into canvas for intermediate style editing
                        if (group.type === 'group') {
                            const items = (group as fabric.Group).getObjects();
                            (group as any)._restoreObjectsState();
                            canvas.remove(group);
                            for (let i = 0; i < items.length; i++) {
                                canvas.add(items[i]);
                            }
                        } else {
                            canvas.add(group);
                        }
                    }
                    canvas.renderAll();
                    saveState();
                };

                if (activeImage.includes('<svg')) {
                    fabric.loadSVGFromString(activeImage, handleLoadedSVG);
                } else {
                    fabric.loadSVGFromURL(activeImage, handleLoadedSVG);
                }
            } else {
                console.log('[PAINT] Loading image from URL:', activeImage);
                fabric.Image.fromURL(activeImage, (img) => {
                    if (!img) {
                        console.error('[PAINT] Failed to load image:', activeImage);
                        return;
                    }
                    img.set({
                        left: canvas.width! / 2,
                        top: canvas.height! / 2,
                        originX: 'center',
                        originY: 'center',
                    });

                    // ── SCALE TO FIT ─────────────────────────────────
                    const pad = 40;
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
        }
        else {
            saveState();
        }

        canvas.on('object:added', saveState);
        canvas.on('object:modified', saveState);
        canvas.on('object:removed', saveState);

        // Selection Listener for active colors
        canvas.on('selection:created', (e) => {
            const obj = e.selected?.[0];
            if (obj) {
                if (typeof obj.fill === 'string') setFillColor(obj.fill);
                if (typeof obj.stroke === 'string') setOutlineColor(obj.stroke);
            }
        });

        return () => {
            canvas.dispose();
        };
    }, [activeImage]); // Reload when activeImage changes

    // Tool Management
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = false;

        if (activeTool === 'pencil') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = outlineColor;
            canvas.freeDrawingBrush.width = brushSize;
        } else if (activeTool === 'eraser') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = '#ffffff';
            canvas.freeDrawingBrush.width = brushSize * 2;
        } else if (activeTool === 'select') {
            canvas.isDrawingMode = false;
        }
    }, [activeTool, outlineColor, brushSize]);

    // Apply Style to Selection
    useEffect(() => {
        const canvas = canvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            activeObject.set({
                fill: fillColor,
                stroke: outlineColor,
                strokeWidth: strokeWidth
            });
            canvas?.renderAll();
        }
    }, [fillColor, outlineColor, strokeWidth]);

    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const json = JSON.stringify(canvas.toJSON());
        setHistory(prev => [...prev.slice(0, historyIndex + 1), json]);
        setHistoryIndex(prev => prev + 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const canvas = canvasRef.current;
            const newIndex = historyIndex - 1;
            canvas?.loadFromJSON(JSON.parse(history[newIndex]), () => {
                canvas.renderAll();
                setHistoryIndex(newIndex);
            });
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const canvas = canvasRef.current;
            const newIndex = historyIndex + 1;
            canvas?.loadFromJSON(JSON.parse(history[newIndex]), () => {
                canvas.renderAll();
                setHistoryIndex(newIndex);
            });
        }
    };

    const addShape = (type: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let shape;
        const props = {
            left: canvas.width! / 2,
            top: canvas.height! / 2,
            fill: fillColor,
            stroke: outlineColor,
            strokeWidth: strokeWidth,
            originX: 'center' as const,
            originY: 'center' as const,
        };

        switch (type) {
            case 'rect': shape = new fabric.Rect({ ...props, width: 100, height: 100 }); break;
            case 'circle': shape = new fabric.Circle({ ...props, radius: 50 }); break;
            case 'triangle': shape = new fabric.Triangle({ ...props, width: 100, height: 100 }); break;
            case 'star': {
                // Approximate star with path or custom logic
                shape = new fabric.Path('M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z', props);
                break;
            }
            case 'heart': {
                shape = new fabric.Path('M 272.70141,238.71731 \
                    C 206.46141,238.71731 152.70141,292.47731 152.70141,358.71731 \
                    C 152.70141,493.56731 308.93409,531.41861 372.70141,638.71731 \
                    C 436.46873,531.41861 592.70141,493.56731 592.70141,358.71731 \
                    C 592.70141,292.47731 538.94141,238.71731 472.70141,238.71731 \
                    C 422.08141,238.71731 378.14141,270.06731 358.85741,314.40331 \
                    C 340.52141,270.06731 296.09141,238.71731 272.70141,238.71731 z', { ...props, scaleX: 0.2, scaleY: 0.2 });
                break;
            }
        }

        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
            setActiveTool('select');
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const pngData = canvas.toDataURL({ format: 'png', multiplier: 2 });
            const svgData = canvas.toSVG();
            onSave(pngData, svgData);
        }
    };

    const flip = (direction: 'h' | 'v') => {
        const canvas = canvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            if (direction === 'h') activeObject.set('flipX', !activeObject.flipX);
            else activeObject.set('flipY', !activeObject.flipY);
            canvas?.renderAll();
        }
    };

    const changeLayer = (action: 'front' | 'back' | 'top' | 'bottom') => {
        const canvas = canvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            switch (action) {
                case 'front': canvas?.bringForward(activeObject); break;
                case 'back': canvas?.sendBackwards(activeObject); break;
                case 'top': canvas?.bringToFront(activeObject); break;
                case 'bottom': canvas?.sendToBack(activeObject); break;
            }
            canvas?.renderAll();
        }
    };

    const deleteActive = () => {
        const canvas = canvasRef.current;
        const activeObjects = canvas?.getActiveObjects();
        if (activeObjects) {
            canvas?.discardActiveObject();
            activeObjects.forEach((obj) => {
                canvas?.remove(obj);
            });
            canvas?.renderAll();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100/90 backdrop-blur-md flex items-center justify-center font-sans overflow-hidden">
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-[95vw] h-[90vh] flex flex-col overflow-hidden border border-slate-200">

                {/* 1. TOP HEADER */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/50">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                            <button onClick={undo} disabled={historyIndex <= 0} title="Undo" className="p-2 hover:bg-white rounded-lg transition-all disabled:opacity-30">
                                <Undo size={20} className="text-slate-600" />
                            </button>
                            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo" className="p-2 hover:bg-white rounded-lg transition-all disabled:opacity-30">
                                <Redo size={20} className="text-slate-600" />
                            </button>
                        </div>
                        <div className="h-6 w-px bg-slate-200 mx-2" />
                        <span className="text-slate-500 font-medium text-sm">Mode: <span className="text-indigo-600 uppercase font-bold">{mode}</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                            <X size={24} className="text-slate-400 hover:text-slate-600" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* 2. LEFT TOOLBAR */}
                    <div className="w-20 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-4 gap-2 overflow-y-auto no-scrollbar">
                        <ToolIconButton active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon={<MousePointer2 size={24} />} title="Select" />
                        <ToolIconButton active={activeTool === 'pencil'} onClick={() => setActiveTool('pencil')} icon={<Pen size={24} />} title="Pencil" />
                        <ToolIconButton active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={24} />} title="Eraser" />
                        <ToolIconButton active={activeTool === 'bucket'} onClick={() => setActiveTool('bucket')} icon={<PaintBucket size={24} />} title="Fill" />
                        <ToolIconButton active={false} onClick={() => { }} icon={<Type size={24} />} title="Text" />
                        <ToolIconButton active={false} onClick={() => { }} icon={<Camera size={24} />} title="Camera" />

                        <div className="w-12 h-px bg-slate-200 my-2" />

                        <ToolIconButton active={false} onClick={() => addShape('line')} icon={<Minus size={24} />} title="Line" />
                        <ToolIconButton active={false} onClick={() => addShape('circle')} icon={<Circle size={24} />} title="Circle" />
                        <ToolIconButton active={false} onClick={() => addShape('rect')} icon={<Square size={24} />} title="Rectangle" />
                        <ToolIconButton active={false} onClick={() => addShape('triangle')} icon={<Triangle size={24} />} title="Triangle" />
                        <ToolIconButton active={false} onClick={() => addShape('star')} icon={<Star size={24} />} title="Star" />
                        <ToolIconButton active={false} onClick={() => addShape('heart')} icon={<Heart size={24} />} title="Heart" />

                        <div className="w-12 h-px bg-slate-200 my-2" />

                        <ToolIconButton active={false} onClick={() => { }} icon={<Plus size={24} />} title="Add" />
                        <ToolIconButton active={false} onClick={() => { }} icon={<Smile size={24} />} title="Icons" />
                    </div>

                    {/* 3. CENTER CANVAS AREA */}
                    <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center relative overflow-hidden">
                        <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white"
                            style={{
                                backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjhmOGY4Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmOGY4ZjgiLz48L3N2Zz4=')`,
                            }}>
                            <canvas id="fabric-canvas" className="cursor-crosshair" />

                            {/* Zoom Controls Overlay */}
                            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                <button onClick={() => setZoom(prev => prev * 1.1)} className="p-2 bg-white shadow-md rounded-full hover:bg-slate-50 transition-all text-slate-500"><PlusCircle size={20} /></button>
                                <button onClick={() => setZoom(1)} className="p-2 bg-white shadow-md rounded-full hover:bg-slate-50 transition-all text-slate-500 font-bold text-sm">=</button>
                                <button onClick={() => setZoom(prev => prev * 0.9)} className="p-2 bg-white shadow-md rounded-full hover:bg-slate-50 transition-all text-slate-500"><MinusCircle size={20} /></button>
                            </div>
                        </div>
                    </div>

                    {/* 4. RIGHT SIDEBAR */}
                    <div className="w-72 border-l border-slate-100 flex flex-col bg-slate-50/50">
                        {/* Name & Title */}
                        <div className="p-4 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{spriteName}</span>
                                <Pen size={14} className="text-slate-400" />
                            </div>
                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex items-center justify-center">
                                <div className="w-32 h-32 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                    {activeImage && <img src={activeImage} className="max-w-full max-h-full object-contain" alt="Preview" />}
                                </div>
                            </div>
                        </div>

                        {/* Costume List */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-600">Costumes</span>
                                <button className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"><Plus size={18} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {costumes.map((c, i) => (
                                    <div
                                        key={c.id || i}
                                        onClick={() => setActiveImage(c.image)}
                                        className={`aspect-square rounded-2xl border-4 transition-all cursor-pointer flex items-center justify-center relative group p-2 ${activeImage === c.image
                                            ? 'border-indigo-500 bg-white shadow-lg shadow-indigo-100'
                                            : 'border-transparent bg-slate-50 hover:bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                            {c.image.includes('<svg') ?
                                                <div dangerouslySetInnerHTML={{ __html: c.image }} className="w-full h-full object-contain" /> :
                                                <img src={c.image} className="w-full h-full object-contain" alt={c.name} />
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer Controls */}
                        <div className="p-4 grid grid-cols-2 gap-2 border-t border-slate-100">
                            <ActionButton onClick={() => changeLayer('front')} icon={<ArrowUp size={20} />} label="Bring Forward" />
                            <ActionButton onClick={() => changeLayer('back')} icon={<ArrowDown size={20} />} label="Send Back" />
                            <ActionButton onClick={() => changeLayer('top')} icon={<ArrowUpToLine size={20} />} label="Bring to Front" />
                            <ActionButton onClick={() => changeLayer('bottom')} icon={<ArrowDownToLine size={20} />} label="Send to Back" />
                            <ActionButton onClick={() => flip('h')} icon={<FlipHorizontal size={20} />} label="Flip H" />
                            <ActionButton onClick={() => flip('v')} icon={<FlipVertical size={20} />} label="Flip V" />
                            <ActionButton onClick={deleteActive} icon={<Trash2 size={20} />} label="Delete Object" className="col-span-2 text-rose-500 hover:bg-rose-50" />
                        </div>
                    </div>
                </div>

                {/* 5. BOTTOM STYLE BAR */}
                <div className="h-24 border-t border-slate-100 bg-white flex items-center px-8 gap-12">
                    <div className="flex gap-8 items-center">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fill</span>
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-none p-0" />
                                <button onClick={() => setFillColor('transparent')} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-white transition-all">
                                    <div className="w-6 h-1 bg-rose-500 -rotate-45" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Outline</span>
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <input type="color" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-none p-0" />
                                <div className="flex items-center px-2 font-bold text-slate-600 text-sm gap-2">
                                    <Minus size={14} className="cursor-pointer" onClick={() => setStrokeWidth(Math.max(0, strokeWidth - 1))} />
                                    {strokeWidth}
                                    <Plus size={14} className="cursor-pointer" onClick={() => setStrokeWidth(strokeWidth + 1)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {['#EF4444', '#F97316', '#FACC15', '#22C55E', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#FFFFFF', '#64748B', '#000000'].map(c => (
                            <button
                                key={c}
                                onClick={() => setFillColor(c)}
                                className={`w-10 h-10 rounded-full border-4 transition-all shrink-0 ${fillColor === c ? 'border-indigo-500 scale-110 shadow-lg' : 'border-white'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-1 min-w-[150px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Brush Size: {brushSize}</span>
                        <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                    </div>

                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 shrink-0"
                    >
                        <Save size={20} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToolIconButton = ({ active, onClick, icon, title }: any) => (
    <button
        onClick={onClick}
        title={title}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'text-slate-500 hover:bg-slate-200'
            }`}
    >
        {icon}
    </button>
);

const ActionButton = ({ onClick, icon, label, className = "" }: any) => (
    <button
        onClick={onClick}
        title={label}
        className={`flex items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 shadow-sm active:scale-95 ${className}`}
    >
        {icon}
    </button>
);

export default PaintEditor;
