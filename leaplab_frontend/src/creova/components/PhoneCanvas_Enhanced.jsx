/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Enhanced Phone Canvas - Matches Leap App Inventor Viewer functionality
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, X as XIcon, Wifi, Battery, Signal, ChevronLeft, RotateCw, ChevronDown, Trash2 } from 'lucide-react';
import ComponentIcon from './ComponentIcon';

export default function PhoneCanvasEnhanced({ appState }) {
    const { screens, activeScreen, selectedId, addComponent, setSelectedId, setActiveScreen, addScreen, deleteScreen, media, designViewport, setDesignViewport } = appState;
    const [deviceType, setDeviceType] = useState(designViewport?.deviceType || 'phone'); // 'phone', 'tablet7', 'tablet10'
    const [orientation, setOrientation] = useState(designViewport?.orientation || 'portrait'); // 'portrait', 'landscape'
    const [dragOver, setDragOver] = useState(false);
    const [dropTarget, setDropTarget] = useState(null); // Track which container is being dragged over
    const [draggedComponentId, setDraggedComponentId] = useState(null);
    const [dropTargetComponent, setDropTargetComponent] = useState(null); // { id: string, position: 'before' | 'after' | 'inside' }
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const resolveMediaUrl = (filename) => {
        if (!filename) return null;
        if (filename.startsWith('data:') || filename.startsWith('http://') || filename.startsWith('https://')) return filename;
        const item = (media || []).find(m => m.filename === filename);
        return item ? item.data : null;
    };
    const [isAddingScreen, setIsAddingScreen] = useState(false);
    const [deleteScreenTarget, setDeleteScreenTarget] = useState(null);
    const [newScreenName, setNewScreenName] = useState('');
    const [currentTime, setCurrentTime] = useState('12:00');
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isEditingDimensions, setIsEditingDimensions] = useState(false);
    const [editWidth, setEditWidth] = useState('');
    const [editHeight, setEditHeight] = useState('');
    const [customPhoneDimensions, setCustomPhoneDimensions] = useState(null); // { width, height } when user sets custom

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hrs = String(now.getHours()).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            setCurrentTime(`${hrs}:${mins}`);
        };
        updateClock();
        const interval = setInterval(updateClock, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize(prev => {
                    if (prev.width === width && prev.height === height) return prev;
                    return { width, height };
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
    const components = currentScreen?.components || [];
    const nonVisibleComponents = currentScreen?.nonVisibleComponents || [];

    // Device dimensions (width x height in portrait) - Updated to match Leap MockForm
    const deviceDimensions = {
        phone: customPhoneDimensions || { width: 412, height: 915, label: 'Phone' },
        tablet7: { width: 600, height: 960, label: 'Tablet 7"' },
        tablet10: { width: 800, height: 1280, label: 'Tablet 10"' },
        monitor: { width: 800, height: 1280, label: 'Monitor' } // default landscape display will flip this to 1280x800
    };

    const currentDimensions = deviceDimensions[deviceType];
    const displayWidth = orientation === 'portrait' ? currentDimensions.width : currentDimensions.height;
    const displayHeight = orientation === 'portrait' ? currentDimensions.height : currentDimensions.width;

    useEffect(() => {
        if (!designViewport) return;
        if (designViewport.deviceType && designViewport.deviceType !== deviceType) {
            setDeviceType(designViewport.deviceType);
        }
        if (designViewport.orientation && designViewport.orientation !== orientation) {
            setOrientation(designViewport.orientation);
        }
    }, [designViewport?.deviceType, designViewport?.orientation]);

    useEffect(() => {
        if (!designViewport) return;
        const { width, height, deviceType: dvType } = designViewport;
        const defaults = {
            phone: { width: 412, height: 915 },
            tablet7: { width: 600, height: 960 },
            tablet10: { width: 800, height: 1280 },
            monitor: { width: 800, height: 1280 }
        };
        const activePreset = defaults[dvType || 'phone'];
        if (activePreset) {
            const isDefault = (width === activePreset.width && height === activePreset.height) ||
                (width === activePreset.height && height === activePreset.width);
            if (!isDefault && width && height) {
                const isLandscape = width > height;
                const baseW = isLandscape ? height : width;
                const baseH = isLandscape ? width : height;
                setCustomPhoneDimensions({ width: baseW, height: baseH, label: 'Custom' });
            }
        }
    }, [designViewport]);

    useEffect(() => {
        const screenOri = currentScreen?.screenOrientation;
        if (!screenOri) return;

        const lowerOri = screenOri.toLowerCase();
        if (lowerOri.includes('portrait')) {
            setOrientation('portrait');
        } else if (lowerOri.includes('landscape')) {
            setOrientation('landscape');
        }
    }, [currentScreen?.screenOrientation]);

    useEffect(() => {
        if (!setDesignViewport) return;
        setDesignViewport(prev => {
            const next = { width: displayWidth, height: displayHeight, deviceType, orientation };
            if (
                prev?.width === next.width &&
                prev?.height === next.height &&
                prev?.deviceType === next.deviceType &&
                prev?.orientation === next.orientation
            ) {
                return prev;
            }
            return next;
        });
    }, [displayWidth, displayHeight, deviceType, orientation, setDesignViewport]);

    const mapFeatureTypes = ['Marker', 'LineString', 'Polygon', 'Rectangle', 'Circle', 'FeatureCollection'];

    const findComponentById = (id, list) => {
        for (const comp of list) {
            if (comp.id === id) return comp;
            if (comp.children) {
                const found = findComponentById(id, comp.children);
                if (found) return found;
            }
        }
        return null;
    };

    const handleComponentDragStart = (e, compId) => {
        e.stopPropagation();
        e.dataTransfer.setData('draggedComponentId', compId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedComponentId(compId);
    };

    const handleComponentDragEnd = (e) => {
        setDraggedComponentId(null);
        setDropTargetComponent(null);
        setDropTarget(null);
    };

    const handleComponentDragOver = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();

        const activeDraggedId = e.dataTransfer.types.includes('draggedcomponentid')
            ? (e.dataTransfer.getData('draggedComponentId') || draggedComponentId)
            : draggedComponentId;

        if (!activeDraggedId || activeDraggedId === targetId) return;

        const targetNode = findComponentById(targetId, components);
        if (!targetNode) return;

        // Prevent dropping inside self/descendants
        if (targetNode.children && findComponentById(activeDraggedId, targetNode.children)) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const isArrangement = ['HorizontalArrangement', 'HorizontalScrollArrangement', 'VerticalArrangement', 'VerticalScrollArrangement', 'TableArrangement', 'AbsoluteArrangement', 'Map'].includes(targetNode.type);

        const relativeY = e.clientY - rect.top;

        let position = 'after';
        if (isArrangement) {
            const edgeThresholdY = Math.min(12, rect.height * 0.2);
            if (relativeY < edgeThresholdY) {
                position = 'before';
            } else if (relativeY > rect.height - edgeThresholdY) {
                position = 'after';
            } else {
                position = 'inside';
            }
        } else {
            const isTopHalf = relativeY < rect.height / 2;
            position = isTopHalf ? 'before' : 'after';
        }

        setDropTargetComponent({ id: targetId, position });
        if (position === 'inside') {
            setDropTarget(targetId);
        } else {
            setDropTarget(null);
        }
    };

    const handleComponentDragLeave = (e) => {
        e.stopPropagation();
        setDropTargetComponent(null);
        setDropTarget(null);
    };

    const handleDropOnComponent = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedId = e.dataTransfer.getData('draggedComponentId') || draggedComponentId;
        setDropTargetComponent(null);
        setDropTarget(null);

        if (!draggedId || draggedId === targetId) return;

        // Check cycle
        const draggedNode = findComponentById(draggedId, components);
        if (draggedNode && draggedNode.children && findComponentById(targetId, draggedNode.children)) {
            return;
        }

        // Determine drop position
        const targetNode = findComponentById(targetId, components);
        if (!targetNode) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const isArrangement = ['HorizontalArrangement', 'HorizontalScrollArrangement', 'VerticalArrangement', 'VerticalScrollArrangement', 'TableArrangement', 'AbsoluteArrangement', 'Map'].includes(targetNode.type);

        const relativeY = e.clientY - rect.top;
        let position = 'after';

        if (isArrangement) {
            const edgeThresholdY = Math.min(12, rect.height * 0.2);
            if (relativeY < edgeThresholdY) {
                position = 'before';
            } else if (relativeY > rect.height - edgeThresholdY) {
                position = 'after';
            } else {
                position = 'inside';
            }
        } else {
            const isTopHalf = relativeY < rect.height / 2;
            position = isTopHalf ? 'before' : 'after';
        }

        if (appState.moveComponent) {
            appState.moveComponent(draggedId, targetId, position);
        }
    };

    const handleDrop = (e, targetContainerId = null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        setDropTarget(null);

        const type = e.dataTransfer.getData('componentType');
        const componentData = e.dataTransfer.getData('componentData');
        const draggedId = e.dataTransfer.getData('draggedComponentId') || draggedComponentId;

        if (draggedId) {
            const targetId = targetContainerId || currentScreen.id;
            if (draggedId !== targetId) {
                const position = targetContainerId ? 'inside' : 'after';
                if (appState.moveComponent) {
                    appState.moveComponent(draggedId, targetId, position);
                }
            }
            return;
        }

        if (!type) return;

        // Validate: Map containers only accept map features
        if (targetContainerId) {
            const target = findComponentById(targetContainerId, components);
            if (target && target.type === 'Map' && !mapFeatureTypes.includes(type)) {
                return; // Reject non-map features dropped on Map
            }
            if (target && target.type !== 'Map' && mapFeatureTypes.includes(type)) {
                return; // Reject map features dropped on non-Map containers
            }
        } else {
            // Dropping on Screen directly - reject map features if not inside a Map
            if (mapFeatureTypes.includes(type)) {
                return; // Map features need a Map container
            }
        }

        let visible;
        if (componentData) {
            try {
                const parsed = JSON.parse(componentData);
                visible = parsed.visible;
            } catch {
                visible = undefined;
            }
        }

        // If dropping into a container, select it first
        if (targetContainerId) {
            setSelectedId(targetContainerId);
        }

        addComponent(type, { visible });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleAddScreen = () => {
        if (newScreenName.trim() && !screens.find(s => s.id === newScreenName.trim())) {
            if (addScreen) {
                addScreen(newScreenName.trim());
            }
            setActiveScreen(newScreenName.trim());
            setNewScreenName('');
            setIsAddingScreen(false);
        }
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const toggleOrientation = () => {
        setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
    };

    const handleSaveDimensions = () => {
        const w = parseInt(editWidth, 10);
        const h = parseInt(editHeight, 10);
        if (w >= 100 && w <= 3000 && h >= 100 && h <= 3000) {
            if (orientation === 'landscape') {
                setCustomPhoneDimensions({ width: h, height: w, label: 'Custom' });
            } else {
                setCustomPhoneDimensions({ width: w, height: h, label: 'Custom' });
            }
            setDeviceType('phone');
            setIsEditingDimensions(false);
        } else {
            alert('Please enter valid dimensions between 100 and 3000 px.');
        }
    };

    const renderComponentPreview = (comp) => {
        const isSelected = comp.id === selectedId;
        const baseClasses = `cursor-pointer ${isSelected
            ? 'ring-2 ring-blue-500 z-10'
            : 'hover:ring-2 hover:ring-slate-200'
            } relative`;

        const LENGTH_AUTO = -1;
        const LENGTH_FILL = -2;

        const resolveLength = (propValue, percentProp) => {
            if (propValue === LENGTH_FILL) return '100%';
            if (propValue === LENGTH_AUTO) return 'auto';
            if (typeof propValue === 'number' && propValue > 0) return `${propValue}px`;
            if (percentProp != null) return `${percentProp}%`;
            return 'auto';
        };

        // Dynamic styles from props
        const style = {
            backgroundColor: comp.props.BackgroundColor || comp.props.backgroundColor,
            color: comp.props.TextColor || comp.props.textColor,
            fontSize: comp.props.FontSize ? `${comp.props.FontSize}px` : undefined,
            fontWeight: comp.props.FontBold ? 'bold' : 'normal',
            fontStyle: comp.props.FontItalic ? 'italic' : 'normal',
            width: resolveLength(comp.props.Width, comp.props.WidthPercent),
            height: resolveLength(comp.props.Height, comp.props.HeightPercent),
            textAlign: comp.props.TextAlignment || 'left',
            display: comp.props.Visible === false ? 'none' : undefined,
        };

        const handleClick = (e) => {
            e.stopPropagation();
            setSelectedId(comp.id);
        };

        // Render based on component type
        switch (comp.type) {
            case 'Button':
            case 'ListPicker':
            case 'DatePicker':
            case 'TimePicker':
            case 'ContactPicker':
            case 'EmailPicker':
            case 'PhoneNumberPicker':
            case 'ImagePicker':
            case 'FilePicker': {
                const shape = comp.props.Shape || 'default';
                const borderRadius = shape === 'rounded' ? '9999px' :
                    shape === 'rectangular' ? '0px' :
                        shape === 'oval' ? '50%' : '12px';
                return (
                    <button
                        key={comp.id}
                        className={`${baseClasses} px-3 py-2 text-sm flex items-center`}
                        style={{
                            ...style,
                            minHeight: style.height === 'auto' ? '36px' : undefined,
                            justifyContent: style.textAlign === 'center' ? 'center' :
                                style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            backgroundColor: style.backgroundColor || '#E0E0E0',
                            color: style.color || '#000000',
                            borderRadius,
                            border: '1px solid #BDBDBD',
                            cursor: 'pointer',
                            fontFamily: 'sans-serif'
                        }}
                        onClick={handleClick}
                        disabled={comp.props.Enabled === false}
                    >
                        {comp.props.Text || comp.type}
                    </button>
                );
            }

            case 'Label':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} text-slate-900`}
                        style={{
                            ...style,
                            padding: '2px 0',
                            display: 'inline'
                        }}
                        onClick={handleClick}
                    >
                        {comp.props.Text || 'Label'}
                    </div>
                );

            case 'TextBox':
            case 'PasswordTextBox':
                return (
                    <input
                        key={comp.id}
                        type={comp.type === 'PasswordTextBox' ? 'password' : 'text'}
                        placeholder={comp.props.Hint || ''}
                        className={`${baseClasses} px-2 py-1.5 text-sm border border-slate-400`}
                        style={{
                            ...style,
                            minHeight: style.height === 'auto' ? '32px' : undefined,
                            backgroundColor: '#FFFFFF'
                        }}
                        onClick={handleClick}
                        disabled={comp.props.Enabled === false}
                        readOnly
                    />
                );

            case 'Image':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden`}
                        style={{
                            ...style
                        }}
                        onClick={handleClick}
                    >
                        {comp.props.Picture ? (
                            <img src={resolveMediaUrl(comp.props.Picture)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl">🖼️</span>
                        )}
                    </div>
                );

            case 'CheckBox':
                return (
                    <label
                        key={comp.id}
                        className={`${baseClasses} flex items-center gap-1.5 cursor-pointer py-1 px-0.5 text-slate-900 text-sm`}
                        style={style}
                        onClick={handleClick}
                    >
                        <input
                            type="checkbox"
                            checked={comp.props.Checked || false}
                            className="w-4 h-4 border-slate-400"
                            readOnly
                        />
                        <span>{comp.props.Text || 'CheckBox'}</span>
                    </label>
                );

            case 'Switch':
                return (
                    <label
                        key={comp.id}
                        className={`${baseClasses} flex items-center gap-1.5 cursor-pointer py-1 px-0.5 text-slate-900 text-sm`}
                        style={style}
                        onClick={handleClick}
                    >
                        <div className={`w-10 h-5 rounded-full transition-colors shrink-0 flex items-center ${comp.props.On ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${comp.props.On ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                        </div>
                        <span>{comp.props.Text || 'Switch'}</span>
                    </label>
                );

            case 'Slider':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} py-1.5 px-0.5`}
                        style={style}
                        onClick={handleClick}
                    >
                        <input
                            type="range"
                            min={comp.props.MinValue || 0}
                            max={comp.props.MaxValue || 100}
                            value={comp.props.ThumbPosition || 50}
                            className="w-full cursor-pointer"
                            readOnly
                        />
                    </div>
                );

            case 'Spinner':
                return (
                    <select
                        key={comp.id}
                        className={`${baseClasses} px-2 py-1.5 text-sm border border-slate-400 bg-white`}
                        style={{
                            ...style,
                            minHeight: style.height === 'auto' ? '32px' : undefined
                        }}
                        onClick={handleClick}
                        disabled={comp.props.Enabled === false}
                    >
                        <option>{comp.props.Text || comp.props.Selection || 'Select...'}</option>
                    </select>
                );

            case 'ListView': {
                const items = comp.props.Elements || ['Item 1', 'Item 2', 'Item 3'];
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border border-slate-300 overflow-hidden`}
                        style={{ ...style, minHeight: '100px' }}
                        onClick={handleClick}
                    >
                        {items.map((item, idx) => (
                            <div key={idx} className="px-3 py-2 border-b border-slate-200 last:border-b-0 text-sm text-slate-900">
                                {item}
                            </div>
                        ))}
                    </div>
                );
            }

            case 'WebViewer':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border border-slate-300 bg-white flex items-center justify-center`}
                        style={{ ...style, minHeight: '180px' }}
                        onClick={handleClick}
                    >
                        <div className="text-center text-slate-900">
                            <span className="text-3xl block mb-1">🌐</span>
                            <span className="text-sm">WebViewer</span>
                        </div>
                    </div>
                );

            case 'HorizontalArrangement':
            case 'HorizontalScrollArrangement':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-slate-200 p-4 transition-all duration-200 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50/50' : ''
                            }`}
                        style={{
                            ...style,
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '5px',
                            minHeight: '60px',
                            justifyContent: comp.props.AlignHorizontal === 'Center' || comp.props.AlignHorizontal === '2' || comp.props.AlignHorizontal === 2 ? 'center' :
                                comp.props.AlignHorizontal === 'Right' || comp.props.AlignHorizontal === '3' || comp.props.AlignHorizontal === 3 ? 'flex-end' : 'flex-start',
                            alignItems: comp.props.AlignVertical === 'Center' || comp.props.AlignVertical === '2' || comp.props.AlignVertical === 2 ? 'center' :
                                comp.props.AlignVertical === 'Bottom' || comp.props.AlignVertical === '3' || comp.props.AlignVertical === 3 ? 'flex-end' : 'flex-start'
                        }}
                        onClick={handleClick}
                        onDrop={(e) => handleDrop(e, comp.id)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropTarget(comp.id);
                        }}
                        onDragLeave={(e) => {
                            e.stopPropagation();
                            setDropTarget(null);
                        }}
                    >
                        {comp.children && comp.children.length > 0 ? (
                            comp.children.map(child => renderDraggableComponentPreview(child))
                        ) : (
                            <div className="text-slate-900 text-sm italic font-medium flex items-center justify-center flex-1">
                                Drop components here (Horizontal)
                            </div>
                        )}
                    </div>
                );

            case 'VerticalArrangement':
            case 'VerticalScrollArrangement':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-slate-200 p-4 transition-all duration-200 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50/50' : ''
                            }`}
                        style={{
                            ...style,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            minHeight: '60px',
                            alignItems: comp.props.AlignHorizontal === 'Center' || comp.props.AlignHorizontal === '2' || comp.props.AlignHorizontal === 2 ? 'center' :
                                comp.props.AlignHorizontal === 'Right' || comp.props.AlignHorizontal === '3' || comp.props.AlignHorizontal === 3 ? 'flex-end' : 'flex-start',
                            justifyContent: comp.props.AlignVertical === 'Center' || comp.props.AlignVertical === '2' || comp.props.AlignVertical === 2 ? 'center' :
                                comp.props.AlignVertical === 'Bottom' || comp.props.AlignVertical === '3' || comp.props.AlignVertical === 3 ? 'flex-end' : 'flex-start'
                        }}
                        onClick={handleClick}
                        onDrop={(e) => handleDrop(e, comp.id)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropTarget(comp.id);
                        }}
                        onDragLeave={(e) => {
                            e.stopPropagation();
                            setDropTarget(null);
                        }}
                    >
                        {comp.children && comp.children.length > 0 ? (
                            comp.children.map(child => renderDraggableComponentPreview(child))
                        ) : (
                            <div className="text-slate-900 text-sm italic font-medium flex items-center justify-center flex-1">
                                Drop components here (Vertical)
                            </div>
                        )}
                    </div>
                );

            case 'TableArrangement': {
                const numCols = comp.props.Columns || 2;
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-slate-200 p-4 transition-all duration-200 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50/50' : ''
                            }`}
                        style={{
                            ...style,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${numCols}, 1fr)`,
                            gap: '5px',
                            minHeight: '100px',
                            justifyContent: comp.props.AlignHorizontal === 'Center' || comp.props.AlignHorizontal === '2' || comp.props.AlignHorizontal === 2 ? 'center' :
                                comp.props.AlignHorizontal === 'Right' || comp.props.AlignHorizontal === '3' || comp.props.AlignHorizontal === 3 ? 'flex-end' : 'flex-start',
                            alignItems: comp.props.AlignVertical === 'Center' || comp.props.AlignVertical === '2' || comp.props.AlignVertical === 2 ? 'center' :
                                comp.props.AlignVertical === 'Bottom' || comp.props.AlignVertical === '3' || comp.props.AlignVertical === 3 ? 'flex-end' : 'flex-start'
                        }}
                        onClick={handleClick}
                        onDrop={(e) => handleDrop(e, comp.id)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropTarget(comp.id);
                        }}
                        onDragLeave={(e) => {
                            e.stopPropagation();
                            setDropTarget(null);
                        }}
                    >
                        {comp.children && comp.children.length > 0 ? (
                            comp.children.map(child => renderDraggableComponentPreview(child))
                        ) : (
                            <div className="text-slate-900 text-sm italic font-medium col-span-2 flex items-center justify-center">
                                Drop components here (Table)
                            </div>
                        )}
                    </div>
                );
            }

            case 'AbsoluteArrangement':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-slate-200 relative transition-all duration-200 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50/50' : ''}`}
                        style={{
                            ...style,
                            minHeight: '80px',
                            justifyContent: comp.props.AlignHorizontal === 'Center' || comp.props.AlignHorizontal === '2' || comp.props.AlignHorizontal === 2 ? 'center' :
                                comp.props.AlignHorizontal === 'Right' || comp.props.AlignHorizontal === '3' || comp.props.AlignHorizontal === 3 ? 'flex-end' : 'flex-start',
                            alignItems: comp.props.AlignVertical === 'Center' || comp.props.AlignVertical === '2' || comp.props.AlignVertical === 2 ? 'center' :
                                comp.props.AlignVertical === 'Bottom' || comp.props.AlignVertical === '3' || comp.props.AlignVertical === 3 ? 'flex-end' : 'flex-start'
                        }}
                        onClick={handleClick}
                        onDrop={(e) => handleDrop(e, comp.id)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropTarget(comp.id); }}
                        onDragLeave={() => setDropTarget(null)}
                    >
                        {comp.children && comp.children.length > 0 ? (
                            comp.children.map(child => (
                                <div key={child.id} className="absolute"
                                    style={{
                                        left: child.props.X || 0,
                                        top: child.props.Y || 0,
                                        ...(child.type === 'Button' || child.type === 'Label'
                                            ? { width: child.props.Width ? `${child.props.Width}px` : undefined }
                                            : {}),
                                        zIndex: child.props.Z || 1
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedId(child.id); }}
                                >
                                    {renderDraggableComponentPreview(child)}
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-900 text-sm italic font-medium flex items-center justify-center min-h-[100px]">
                                Drop components here (Absolute)
                            </div>
                        )}
                    </div>
                );

            case 'Canvas':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border border-slate-300 bg-white relative overflow-hidden`}
                        style={style}
                        onClick={handleClick}
                        onDrop={(e) => handleDrop(e, comp.id)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropTarget(comp.id); }}
                        onDragLeave={() => setDropTarget(null)}
                    >
                        {(!comp.children || comp.children.length === 0) ? (
                            <div className="w-full h-full flex items-center justify-center text-slate-900" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, #f0f0f0 0px, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px)'
                            }}>
                                <span className="text-2xl">🎨</span>
                            </div>
                        ) : (
                            comp.children.map(child => {
                                const isBall = child.type === 'Ball';
                                const isSprite = child.type === 'ImageSprite';
                                if (!isBall && !isSprite) return null;
                                const cx = child.props.X || 0;
                                const cy = child.props.Y || 0;
                                const visible = child.props.Visible !== false;
                                if (!visible) return null;
                                if (isBall) {
                                    const r = child.props.Radius || 5;
                                    return (
                                        <div key={child.id} className="absolute rounded-full bg-black cursor-pointer hover:ring-2 hover:ring-blue-500"
                                            style={{
                                                left: cx, top: cy, width: r * 2, height: r * 2,
                                                backgroundColor: child.props.PaintColor || '#000000',
                                                zIndex: child.props.Z || 1
                                            }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(child.id); }}
                                        />
                                    );
                                }
                                if (isSprite) {
                                    const sw = child.props.Width === -2 ? '100%' : child.props.Width === -1 ? 40 : (typeof child.props.Width === 'number' && child.props.Width > 0 ? child.props.Width : 40);
                                    const sh = child.props.Height === -2 ? '100%' : child.props.Height === -1 ? 40 : (typeof child.props.Height === 'number' && child.props.Height > 0 ? child.props.Height : 40);
                                    return (
                                        <div key={child.id} className="absolute cursor-pointer hover:ring-2 hover:ring-blue-500 flex items-center justify-center bg-slate-200 text-xs font-bold text-slate-900 overflow-hidden"
                                            style={{
                                                left: cx, top: cy, width: sw, height: sh,
                                                zIndex: child.props.Z || 1,
                                                backgroundImage: child.props.Picture ? `url(${resolveMediaUrl(child.props.Picture)})` : undefined,
                                                backgroundSize: 'contain',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'center'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(child.id); }}
                                        >
                                            {!child.props.Picture && '👾'}
                                        </div>
                                    );
                                }
                                return null;
                            })
                        )}
                    </div>
                );

            case 'Map':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-sky-300 transition-all duration-200 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50/50' : 'bg-sky-50/30'}`}
                        style={{
                            ...style,
                            minHeight: '120px',
                            position: 'relative',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23bae6fd' fill-opacity='0.3'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: '40px 40px'
                        }}
                        onClick={handleClick}
                        onDrop={(e) => handleDrop(e, comp.id)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropTarget(comp.id); }}
                        onDragLeave={() => setDropTarget(null)}
                    >
                        {comp.children && comp.children.length > 0 ? (
                            <div className="flex flex-col gap-1 p-2">
                                {comp.children.map(child => renderDraggableComponentPreview(child))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center min-h-[120px] text-sky-700 text-sm font-semibold gap-2">
                                <span>🗺️</span>
                                <span>Drop map features here</span>
                            </div>
                        )}
                    </div>
                );

            case 'Polygon':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-white border border-slate-200`}
                        style={{
                            ...style,
                            width: '52px',
                            height: '34px',
                            padding: '0',
                            overflow: 'hidden',
                            borderRadius: '4px'
                        }}
                        onClick={handleClick}
                    >
                        <svg width="52" height="34" viewBox="0 0 52 34">
                            <path d="M1 31L26 2L51 31Z" fill="#F44336" stroke="black" strokeWidth="1" />
                        </svg>
                    </div>
                );

            case 'Circle':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-white border border-slate-200`}
                        style={{
                            ...style,
                            width: '14px',
                            height: '14px',
                            padding: '0',
                            overflow: 'hidden',
                            borderRadius: '4px'
                        }}
                        onClick={handleClick}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14">
                            <circle cx="7" cy="7" r="5" fill="#F44336" stroke="black" strokeWidth="1" />
                        </svg>
                    </div>
                );

            case 'Marker':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-white border border-slate-200`}
                        style={{
                            ...style,
                            width: '30px',
                            height: '50px',
                            padding: '0',
                            overflow: 'hidden',
                            borderRadius: '4px'
                        }}
                        onClick={handleClick}
                    >
                        <svg width="30" height="50" viewBox="9 0 31 50">
                            <path d="M25 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 35.135 15 35.135s15-26.924 15-35.135c0-8.21-6.716-14.866-15-14.866zm-.049 19.312c-2.557 0-4.629-2.055-4.629-4.588 0-2.535 2.072-4.589 4.629-4.589 2.559 0 4.631 2.054 4.631 4.589 0 2.533-2.072 4.588-4.631 4.588z" fill="#F44336" stroke="black" strokeWidth="1" />
                        </svg>
                    </div>
                );

            case 'LineString':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-white border border-slate-200`}
                        style={{
                            ...style,
                            width: '42px',
                            height: '44px',
                            padding: '0',
                            overflow: 'hidden',
                            borderRadius: '4px'
                        }}
                        onClick={handleClick}
                    >
                        <svg width="42" height="44" viewBox="0 0 42 44">
                            <path d="M1 1L41 43" stroke="black" strokeWidth="3" />
                        </svg>
                    </div>
                );

            case 'Rectangle':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-white border border-slate-200`}
                        style={{
                            ...style,
                            width: '52px',
                            height: '32px',
                            padding: '0',
                            overflow: 'hidden',
                            borderRadius: '4px'
                        }}
                        onClick={handleClick}
                    >
                        <svg width="52" height="32" viewBox="0 0 52 32">
                            <rect x="1" y="1" width="50" height="30" fill="#F44336" stroke="black" strokeWidth="1" />
                        </svg>
                    </div>
                );

            case 'FeatureCollection':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-amber-50 border border-dashed border-amber-300`}
                        style={{
                            ...style,
                            minHeight: '40px',
                            borderRadius: '8px',
                            padding: '4px'
                        }}
                        onClick={handleClick}
                    >
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                            <span>📑</span>
                            <span>FC</span>
                        </div>
                        {comp.children && comp.children.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {comp.children.map(child => renderDraggableComponentPreview(child))}
                            </div>
                        )}
                    </div>
                );

            case 'VideoPlayer':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-black flex items-center justify-center`}
                        style={style}
                        onClick={handleClick}
                    >
                        <span className="text-4xl">▶️</span>
                    </div>
                );

            case 'CircularProgress':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} flex items-center justify-center`}
                        style={{
                            ...style,
                            width: style.width === 'auto' ? '48px' : style.width,
                            height: style.height === 'auto' ? '48px' : style.height,
                            minWidth: '36px',
                            minHeight: '36px'
                        }}
                        onClick={handleClick}
                    >
                        <svg viewBox="0 0 48 48" style={{ width: '100%', height: '100%', maxWidth: '48px', maxHeight: '48px' }}>
                            <circle cx="24" cy="24" r="20" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                            <circle cx="24" cy="24" r="20" fill="none"
                                stroke={comp.props.Color || '#3B82F6'}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${((comp.props.Progress || 0) / (comp.props.Maximum || 100)) * 125.6} 125.6`}
                                transform="rotate(-90 24 24)"
                                style={{ transition: 'stroke-dasharray 0.3s ease' }}
                            />
                            <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
                                fontSize="10" fontWeight="bold" fill="#475569">
                                {comp.props.Indeterminate ? '' : `${Math.round((comp.props.Progress || 0) / (comp.props.Maximum || 100) * 100)}%`}
                            </text>
                            {comp.props.Indeterminate && (
                                <circle cx="24" cy="4" r="3" fill={comp.props.Color || '#3B82F6'}>
                                    <animateTransform attributeName="transform" type="rotate"
                                        from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite" />
                                </circle>
                            )}
                        </svg>
                    </div>
                );

            case 'LinearProgress':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses}`}
                        style={{
                            ...style,
                            minHeight: '20px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        onClick={handleClick}
                    >
                        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
                            <div
                                className="h-full rounded-full transition-all duration-300 ease-in-out"
                                style={{
                                    width: comp.props.Indeterminate ? '40%' : `${Math.min(100, Math.max(0, ((comp.props.Progress || 0) / (comp.props.Maximum || 100)) * 100))}%`,
                                    backgroundColor: comp.props.Color || '#3B82F6',
                                    ...(comp.props.Indeterminate ? { animation: 'linear-progress-indeterminate 1.5s ease-in-out infinite' } : {})
                                }}
                            />
                        </div>
                    </div>
                );

            default:
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} p-2 bg-slate-50 border border-slate-200 text-center`}
                        style={style}
                        onClick={handleClick}
                    >
                        <div className="text-sm font-semibold text-slate-900">{comp.type}</div>
                        <div className="text-xs text-slate-900 mt-0.5">{comp.id}</div>
                    </div>
                );
        }
    };

    const renderDraggableComponentPreview = (comp) => {
        const childElement = renderComponentPreview(comp);
        if (!childElement) return null;

        const isDropTarget = dropTargetComponent && dropTargetComponent.id === comp.id;
        const dropIndicatorStyle = isDropTarget
            ? (dropTargetComponent.position === 'before'
                ? { borderTop: '3px solid #3b82f6', borderTopLeftRadius: '0px', borderTopRightRadius: '0px' }
                : dropTargetComponent.position === 'after'
                    ? { borderBottom: '3px solid #3b82f6', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px' }
                    : { outline: '2px solid #3b82f6', outlineOffset: '-2px' })
            : {};

        const isDragged = draggedComponentId === comp.id;
        const dragOpacity = isDragged ? { opacity: 0.4 } : {};

        return React.cloneElement(childElement, {
            draggable: true,
            onDragStart: (e) => handleComponentDragStart(e, comp.id),
            onDragEnd: handleComponentDragEnd,
            onDragOver: (e) => handleComponentDragOver(e, comp.id),
            onDragLeave: handleComponentDragLeave,
            onDrop: (e) => handleDropOnComponent(e, comp.id),
            style: {
                ...(childElement.props.style || {}),
                ...dropIndicatorStyle,
                ...dragOpacity,
                cursor: 'grab'
            }
        });
    };

    const phoneHeaderFooter = (currentScreen.showStatusBar !== false ? 48 : 0) + (currentScreen.titleVisible !== false ? 56 : 0) + 40; // status + title + nav
    const tabletHeaderFooter = (currentScreen.showStatusBar !== false ? 24 : 0) + (currentScreen.titleVisible !== false ? 56 : 0) + 48; // status + title + nav
    const headerFooterHeight = deviceType === 'phone' ? phoneHeaderFooter : tabletHeaderFooter;
    const frameWidth = displayWidth;
    const frameHeight = displayHeight + headerFooterHeight;
    // Cap maximum scale of phone at 0.8 and tablet/monitor at 0.7 to keep it balanced
    const maxScale = deviceType === 'phone' ? 0.8 : 0.7;
    const scale = containerSize.width > 0 && containerSize.height > 0
        ? Math.min(maxScale, Math.min((containerSize.width - 48) / frameWidth, (containerSize.height - 48) / frameHeight))
        : 0.7; // default fallback scale


    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden" onClick={() => setSelectedId(currentScreen.id)}>
            {/* Professional Top Bar - Fixed at top of canvas pane */}
            <div className="w-full bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-6 z-30 shadow-sm" style={{ height: '64px' }}>
                <div className="flex items-center gap-6">
                    {/* Screen Selector - Tab Style */}
                    <div className="flex items-center gap-4">
                        <span className="text-[15px] font-extrabold text-slate-900 uppercase tracking-wider select-none">Screens</span>
                        <div style={{ height: '38px' }} className="flex bg-slate-200/50 p-1 rounded-xl gap-2 items-center">
                            {screens.map(screen => (
                                <div key={screen.id} className="relative group/screen flex items-center">
                                    <button
                                        onClick={() => {
                                            setActiveScreen(screen.id);
                                            setSelectedId(screen.id);
                                        }}
                                        style={{
                                            height: '30px',
                                            paddingLeft: '16px',
                                            paddingRight: screen.id === 'Screen1' ? '16px' : '32px'
                                        }}
                                        className={`rounded-lg text-[14px] font-bold flex items-center justify-center transition-all ${activeScreen === screen.id
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-900 hover:text-slate-950 hover:bg-white/40'}`}
                                    >
                                        {screen.id}
                                    </button>
                                    {screen.id !== 'Screen1' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteScreenTarget(screen.id);
                                            }}
                                            style={{ width: '16px', height: '16px' }}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-100/50 transition-all opacity-0 group-hover/screen:opacity-100"
                                            title="Delete Screen"
                                        >
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isAddingScreen ? (
                                <div style={{ height: '30px' }} className="flex items-center gap-1.5 bg-white rounded-lg px-2 shadow-sm border border-blue-200">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Name"
                                        style={{ fontSize: '13px', fontWeight: '700' }}
                                        className="w-16 outline-none text-slate-900"
                                        value={newScreenName}
                                        onChange={(e) => setNewScreenName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddScreen()}
                                    />
                                    <button onClick={handleAddScreen} className="text-green-600 hover:bg-green-50 p-0.5 rounded flex items-center justify-center">
                                        <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setIsAddingScreen(false)} className="text-red-600 hover:bg-red-50 p-0.5 rounded flex items-center justify-center">
                                        <XIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingScreen(true)}
                                    style={{ height: '30px', width: '30px' }}
                                    className="text-slate-900 hover:text-blue-600 hover:bg-white/40 rounded-lg flex items-center justify-center transition-all"
                                    title="Add Screen"
                                >
                                    <Plus className="h-[18px] w-[18px]" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Viewport Toolbar controls */}
                <div className="flex items-center gap-3 shrink-0 select-none font-sans">
                    <style>{`
                        .viewport-select:hover + .viewport-chevron {
                            color: #2563eb;
                        }
                    `}</style>

                    {/* Device Selector */}
                    <div className="relative flex items-center">
                        <select
                            value={deviceType}
                            onChange={(e) => {
                                const newType = e.target.value;
                                setDeviceType(newType);
                                if (newType !== 'custom') {
                                    setCustomPhoneDimensions(null);
                                }
                            }}
                            style={{
                                height: '34px',
                                paddingLeft: '12px',
                                paddingRight: '32px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                            className="viewport-select bg-slate-100 hover:bg-slate-200/60 text-slate-800 outline-none appearance-none cursor-pointer border border-slate-200/80 transition-all"
                        >
                            <option value="phone">Phone (412×915)</option>
                            <option value="tablet7">Tablet 7" (600×960)</option>
                            <option value="tablet10">Tablet 10" (800×1280)</option>
                            <option value="monitor">Monitor (1280×800)</option>
                            {customPhoneDimensions && <option value="custom">Custom</option>}
                        </select>
                        <ChevronDown className="viewport-chevron absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors" />
                    </div>

                    {/* Orientation Toggle */}
                    <button
                        onClick={toggleOrientation}
                        style={{ height: '34px', width: '34px', borderRadius: '10px' }}
                        className="flex items-center justify-center bg-slate-100 hover:bg-slate-200/60 text-slate-800 border border-slate-200/80 transition-all active:scale-95 cursor-pointer"
                        title={`Switch to ${orientation === 'portrait' ? 'Landscape' : 'Portrait'}`}
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Dimensions / Inline Editor */}
                    {isEditingDimensions ? (
                        <div style={{ height: '34px', borderRadius: '10px' }} className="flex items-center gap-1 bg-white border border-blue-400 px-2 shadow-sm">
                            <input
                                type="number"
                                placeholder="W"
                                style={{ width: '46px', fontSize: '12px' }}
                                className="text-center outline-none text-slate-800 font-mono font-bold bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={editWidth}
                                onChange={(e) => setEditWidth(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveDimensions()}
                                min="100"
                                max="3000"
                            />
                            <span className="text-slate-400 text-[10px] font-bold select-none">×</span>
                            <input
                                type="number"
                                placeholder="H"
                                style={{ width: '46px', fontSize: '12px' }}
                                className="text-center outline-none text-slate-800 font-mono font-bold bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={editHeight}
                                onChange={(e) => setEditHeight(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveDimensions()}
                                min="100"
                                max="3000"
                            />
                            <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-0.5">
                                <button
                                    onClick={handleSaveDimensions}
                                    className="text-green-600 hover:bg-green-50 p-0.5 rounded transition-colors flex items-center justify-center cursor-pointer"
                                    title="Save"
                                >
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => setIsEditingDimensions(false)}
                                    className="text-red-600 hover:bg-red-50 p-0.5 rounded transition-colors flex items-center justify-center cursor-pointer"
                                    title="Cancel"
                                >
                                    <XIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setEditWidth(String(displayWidth));
                                setEditHeight(String(displayHeight));
                                setIsEditingDimensions(true);
                            }}
                            style={{ height: '34px', borderRadius: '10px', paddingLeft: '12px', paddingRight: '12px' }}
                            className="bg-slate-100 hover:bg-slate-200/60 hover:text-blue-600 hover:border-blue-200 text-slate-800 border border-slate-200/80 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
                            title="Edit Canvas Dimensions"
                        >
                            <span>&nbsp;{displayWidth} × {displayHeight} px&nbsp;</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Workspace Content Area */}
            <div
                ref={containerRef}
                className="flex-1 w-full overflow-auto flex flex-col items-center justify-start gap-4 p-4 min-h-0 relative bg-gradient-to-br from-slate-50 to-slate-100"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at center, rgba(255, 122, 0, 0.04) 0%, transparent 70%),
                        radial-gradient(#cbd5e1 1.5px, transparent 1.5px),
                        linear-gradient(rgba(255, 122, 0, 0.01) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 24px 24px, 96px 96px',
                    backgroundPosition: 'center, 0 0, 0 0'
                }}
            >
                {/* Scaled Device Container */}
                <div style={{
                    width: `${frameWidth * scale}px`,
                    height: `${frameHeight * scale}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'width 0.3s, height 0.3s',
                    margin: 'auto'
                }}>
                    <div
                        ref={canvasRef}
                        className={`transition-all duration-300 ${deviceType === 'phone'
                            ? 'bg-white border-none rounded-[40px] shadow-[0_0_0_12px_#0f172a,0_0_0_13px_rgba(255,255,255,0.1),0_25px_50px_-12px_rgba(15,23,42,0.35)] flex flex-col overflow-hidden relative box-sizing-border-box hover:shadow-[0_0_0_12px_#1e293b,0_0_0_13px_rgba(255,255,255,0.15),0_30px_60px_-15px_rgba(15,23,42,0.45)]'
                            : 'bg-white border-4 border-slate-600 rounded-2xl shadow-[0_25px_50px_-12px_rgba(15,23,42,0.15),0_0_0_1px_rgba(15,23,42,0.05)] flex flex-col overflow-hidden relative hover:border-slate-700 hover:shadow-[0_30px_60px_-15px_rgba(15,23,42,0.2),0_0_0_1px_rgba(15,23,42,0.08)]'
                            } ${dragOver ? 'scale-[1.02] border-blue-500 shadow-[0_0_0_4px_rgba(37,99,235,0.15),0_30px_60px_-15px_rgba(37,99,235,0.25)]' : ''}`}
                        style={{
                            width: `${frameWidth}px`,
                            height: `${frameHeight}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                            position: 'absolute',
                            flexShrink: 0,
                            boxSizing: 'border-box'
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {/* Status Bar */}
                        {currentScreen.showStatusBar !== false && (
                            deviceType === 'phone' ? (
                                <div className="h-12 bg-white text-slate-900 px-[38px] pt-[15px] flex items-center justify-between text-[11px] font-semibold font-sans pointer-events-none select-none relative border-b border-black/[0.015]">
                                    <span className="font-bold w-[50px] tracking-[-0.01em]">{currentTime}</span>
                                    <div className="absolute left-1/2 -translate-x-1/2 w-[95px] h-[24px] bg-black rounded-[12px] top-[11px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[inset_0_0_4px_rgba(255,255,255,0.12)] after:absolute after:right-[18px] after:top-1/2 after:-translate-y-1/2 after:w-[5px] after:h-[5px] after:bg-slate-900 after:rounded-full after:shadow-[inset_0_0_1px_1px_#1e293b] after:opacity-80" />
                                    <div className="flex items-center gap-1.5 w-[50px] justify-end">
                                        <Signal className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.2} />
                                        <Wifi className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.2} />
                                        <Battery className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.2} />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-6 bg-slate-100 text-slate-900 px-3.5 flex items-center justify-between text-[11px] font-bold tracking-[0.02em] pointer-events-none select-none border-b border-slate-200">
                                    <span className="font-mono font-extrabold text-slate-900">{currentTime}</span>
                                    <div className="flex items-center gap-1.5">
                                        <Signal className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.5} />
                                        <Wifi className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.5} />
                                        <Battery className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.5} />
                                    </div>
                                </div>
                            )
                        )}

                        {/* Title Bar */}
                        {currentScreen.titleVisible !== false && (
                            deviceType === 'phone' ? (
                                <div className="h-14 bg-white text-slate-900 px-6 flex items-center justify-between border-b border-black/5 relative font-sans">
                                    <span className="text-blue-600 text-[15px] font-bold cursor-pointer flex items-center gap-1 transition-opacity duration-200 select-none hover:opacity-70">
                                        <ChevronLeft className="h-5 w-5" strokeWidth={3} />
                                        <span>Screen</span>
                                    </span>
                                    <span className="text-[18px] font-extrabold absolute left-1/2 -translate-x-1/2 max-w-[180px] truncate tracking-[-0.015em]">{currentScreen.title || activeScreen}</span>
                                    <button className="bg-transparent border-none text-blue-600 text-2xl cursor-pointer py-1 px-2 rounded transition-all duration-200 leading-none hover:bg-blue-500/8">⋮</button>
                                </div>
                            ) : (
                                <div className="h-14 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-black/10 shadow-sm">
                                    <span className="text-[18px] font-extrabold tracking-[-0.012em] truncate">{currentScreen.title || activeScreen}</span>
                                    <button className="bg-transparent border-none text-white text-2xl cursor-pointer py-1 px-2 rounded transition-all duration-200 leading-none hover:text-white hover:bg-white/8">⋮</button>
                                </div>
                            )
                        )}

                        {/* Screen Content */}
                        <div
                            className="overflow-y-auto relative flex flex-col flex-1 w-full pb-16"
                            style={{
                                height: `${displayHeight}px`,
                                backgroundColor: currentScreen.backgroundColor || '#ffffff',
                                backgroundImage: (() => {
                                    const url = resolveMediaUrl(currentScreen.backgroundImage);
                                    return url ? `url(${url})` : undefined;
                                })(),
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div
                                className="flex flex-col gap-[5px] p-2 min-h-full w-full relative flex-grow"
                                style={{
                                    alignItems: currentScreen.alignHorizontal === 'Center' ? 'center' :
                                        currentScreen.alignHorizontal === 'Right' ? 'flex-end' : 'flex-start',
                                    justifyContent: currentScreen.alignVertical === 'Center' ? 'center' :
                                        currentScreen.alignVertical === 'Bottom' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                {components.length === 0 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                                        <div className="text-slate-900 text-[15px] font-bold leading-relaxed">
                                            Drag components from the<br />palette to build your app.
                                        </div>
                                    </div>
                                ) : (
                                    components.map(comp => renderDraggableComponentPreview(comp))
                                )}
                            </div>
                        </div>

                        {/* Watermark Statement */}
                        <div
                            className="w-full text-center py-2.5 text-xs text-slate-400 font-medium border-t select-none pointer-events-none z-20 shrink-0"
                            style={{
                                backgroundColor: currentScreen.backgroundColor || '#ffffff',
                                borderColor: currentScreen.backgroundColor === '#ffffff' || !currentScreen.backgroundColor ? '#f1f5f9' : 'rgba(0,0,0,0.05)'
                            }}
                        >
                            Created by Creoleap Technologies
                        </div>
                        {/* Nav Bar */}
                        {deviceType === 'phone' ? (
                            <div className="h-10 bg-white flex items-center justify-center relative pointer-events-none select-none border-t border-black/[0.015]">
                                <div className="w-[120px] h-[5px] bg-black rounded-[2.5px] opacity-80" />
                            </div>
                        ) : (
                            <div className="h-12 bg-slate-900 border-t border-white/10 flex items-center justify-center pointer-events-none select-none">
                                <div className="flex items-center gap-[72px]">
                                    <span className="text-white text-[15px] font-medium transition-colors duration-200">◁</span>
                                    <span className="text-white text-[18px] font-medium transition-colors duration-200">○</span>
                                    <span className="text-white text-[15px] font-medium transition-colors duration-200">□</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Non-Visible Components Bar Pro */}
                {nonVisibleComponents.length > 0 && (
                    <div className="w-full max-w-[360px] mx-auto bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-md flex flex-col gap-2 z-10 shrink-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-[0.15em] whitespace-nowrap mx-auto">Non-Visible Components</span>
                            <span className="text-[9px] bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded-full font-bold">{nonVisibleComponents.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {nonVisibleComponents.map(comp => (
                                <div
                                    key={comp.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all shadow-sm border ${selectedId === comp.id ? 'bg-white text-blue-600 border-blue-200 shadow-md scale-105' : 'bg-white text-slate-900 border-slate-200 hover:border-blue-200'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(comp.id);
                                    }}
                                >
                                    <ComponentIcon type={comp.type} size={18} className="shrink-0" />
                                    <span className="uppercase tracking-[0.08em]">{comp.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {deleteScreenTarget && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
                    onClick={() => setDeleteScreenTarget(null)}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            width: '420px',
                            maxWidth: '90vw',
                            margin: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1px solid #f1f5f9'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px 24px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#ffffff',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    backgroundColor: '#fff1f2',
                                    color: '#f43f5e',
                                    border: '1px solid #fecdd3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Trash2 style={{ width: '22px', height: '22px' }} />
                                </div>
                                <span style={{
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    color: '#1e293b',
                                    letterSpacing: '-0.02em'
                                }}>Delete Screen</span>
                            </div>
                            <button
                                onClick={() => setDeleteScreenTarget(null)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                    marginLeft: '12px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    e.currentTarget.style.color = '#1e293b';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#94a3b8';
                                }}
                                title="Close"
                            >
                                <XIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '8px 24px 20px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '14px',
                                borderRadius: '14px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #f1f5f9',
                                marginBottom: '14px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #e2e8f0',
                                    flexShrink: 0,
                                    color: '#4f46e5'
                                }}>
                                    <ComponentIcon type="Screen" size={24} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: '#1e293b',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '240px',
                                        lineHeight: 1.2
                                    }}>{deleteScreenTarget}</div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: '#94a3b8',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        marginTop: '4px'
                                    }}>
                                        Screen Component
                                    </div>
                                </div>
                            </div>
                            <p style={{
                                fontSize: '13px',
                                color: '#64748b',
                                fontWeight: 500,
                                lineHeight: 1.7,
                                margin: 0
                            }}>
                                Deleting <span style={{ fontWeight: 800, color: '#1e293b' }}>{deleteScreenTarget}</span> will permanently remove all components on this screen.
                            </p>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '28px 24px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            alignItems: 'center',
                            backgroundColor: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={() => setDeleteScreenTarget(null)}
                                style={{
                                    minWidth: '120px',
                                    padding: '14px 28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#f8fafc',
                                    color: '#334155',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    e.currentTarget.style.color = '#0f172a';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                    e.currentTarget.style.color = '#334155';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteScreen(deleteScreenTarget);
                                    setDeleteScreenTarget(null);
                                }}
                                style={{
                                    minWidth: '130px',
                                    padding: '14px 28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    border: 'none',
                                    backgroundColor: '#e11d48',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#be123c';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(225, 29, 72, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e11d48';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(225, 29, 72, 0.25)';
                                }}
                            >
                                <Trash2 style={{ width: '18px', height: '18px' }} />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
