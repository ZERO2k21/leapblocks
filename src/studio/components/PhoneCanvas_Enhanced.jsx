/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Enhanced Phone Canvas - Matches Leap App Inventor Viewer functionality
 */
import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, RotateCw, Plus, Check, X as XIcon, Wifi, Battery, Signal, ChevronLeft } from 'lucide-react';

export default function PhoneCanvasEnhanced({ appState }) {
    const { screens, activeScreen, selectedId, addComponent, setSelectedId, setActiveScreen, addScreen, deleteScreen } = appState;
    const [deviceType, setDeviceType] = useState('phone'); // 'phone', 'tablet7', 'tablet10'
    const [orientation, setOrientation] = useState('portrait'); // 'portrait', 'landscape'
    const [dragOver, setDragOver] = useState(false);
    const [dropTarget, setDropTarget] = useState(null); // Track which container is being dragged over
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isAddingScreen, setIsAddingScreen] = useState(false);
    const [newScreenName, setNewScreenName] = useState('');
    const [currentTime, setCurrentTime] = useState('12:00');
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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
                setContainerSize({ width, height });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
    const components = currentScreen?.components || [];
    const nonVisibleComponents = currentScreen?.nonVisibleComponents || [];

    // Device dimensions (width x height in portrait) - Updated for better visibility
    const deviceDimensions = {
        phone: { width: 412, height: 685, label: 'Phone' },        // iPhone 14 Pro size
        tablet7: { width: 600, height: 960, label: 'Tablet 7"' },
        tablet10: { width: 800, height: 1280, label: 'Tablet 10"' },
        monitor: { width: 800, height: 1280, label: 'Monitor' } // default landscape display will flip this to 1280x800
    };

    const currentDimensions = deviceDimensions[deviceType];
    const displayWidth = orientation === 'portrait' ? currentDimensions.width : currentDimensions.height;
    const displayHeight = orientation === 'portrait' ? currentDimensions.height : currentDimensions.width;

    const handleDrop = (e, targetContainerId = null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        setDropTarget(null);

        const type = e.dataTransfer.getData('componentType');
        const componentData = e.dataTransfer.getData('componentData');

        if (!type) return;

        // Calculate drop position relative to canvas
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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

        addComponent(type, x, y, { visible });
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

    const renderComponentPreview = (comp) => {
        const isSelected = comp.id === selectedId;
        const baseClasses = `cursor-pointer transition-all duration-200 ${isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg z-10'
            : 'hover:ring-2 hover:ring-slate-200 hover:shadow-sm'
            } relative rounded-xl`;

        // Dynamic styles from props
        const style = {
            backgroundColor: comp.props.BackgroundColor || comp.props.backgroundColor,
            color: comp.props.TextColor || comp.props.textColor,
            fontSize: comp.props.FontSize ? `${comp.props.FontSize}px` : undefined,
            fontWeight: comp.props.FontBold ? 'bold' : 'normal',
            fontStyle: comp.props.FontItalic ? 'italic' : 'normal',
            width: comp.props.Width === 'Fill parent' ? '100%' :
                comp.props.Width === 'Automatic' ? 'auto' :
                    typeof comp.props.Width === 'number' ? `${comp.props.Width}px` : 'auto',
            height: comp.props.Height === 'Fill parent' ? '100%' :
                comp.props.Height === 'Automatic' ? 'auto' :
                    typeof comp.props.Height === 'number' ? `${comp.props.Height}px` : 'auto',
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
                        className={`${baseClasses} px-5 py-3 font-semibold text-sm tracking-wide shadow-sm flex items-center transition-all duration-200 active:scale-[0.98]`}
                        style={{
                            ...style,
                            minHeight: style.height === 'auto' ? '46px' : undefined,
                            justifyContent: style.textAlign === 'center' ? 'center' :
                                            style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            backgroundColor: style.backgroundColor || '#2563eb',
                            color: style.color || '#FFFFFF',
                            borderRadius,
                            border: 'none',
                            cursor: 'pointer'
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
                            padding: '8px 6px',
                            display: 'block'
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
                        className={`${baseClasses} px-4 py-3 text-sm border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`}
                        style={{ 
                            ...style, 
                            minHeight: style.height === 'auto' ? '46px' : undefined,
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
                        className={`${baseClasses} bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm`}
                        style={{
                            ...style,
                            width: comp.props.Width || 120,
                            height: comp.props.Height || 120,
                            borderRadius: '12px'
                        }}
                        onClick={handleClick}
                    >
                        {comp.props.Picture ? (
                            <img src={comp.props.Picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">🖼️</span>
                        )}
                    </div>
                );

            case 'CheckBox':
                return (
                    <label
                        key={comp.id}
                        className={`${baseClasses} flex items-center space-x-3 cursor-pointer py-2 px-1 text-slate-900 font-medium text-sm`}
                        style={style}
                        onClick={handleClick}
                    >
                        <input
                            type="checkbox"
                            checked={comp.props.Checked || false}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            readOnly
                        />
                        <span>{comp.props.Text || 'CheckBox'}</span>
                    </label>
                );

            case 'Switch':
                return (
                    <label
                        key={comp.id}
                        className={`${baseClasses} flex items-center space-x-3 cursor-pointer py-2 px-1 text-slate-900 font-medium text-sm`}
                        style={style}
                        onClick={handleClick}
                    >
                        <div className={`w-12 h-6 rounded-full transition-colors shrink-0 flex items-center ${comp.props.On ? 'bg-blue-600 shadow-sm shadow-blue-500/25' : 'bg-slate-200'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${comp.props.On ? 'translate-x-6' : 'translate-x-1'}`}></div>
                        </div>
                        <span>{comp.props.Text || 'Switch'}</span>
                    </label>
                );

            case 'Slider':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} py-3 px-1`}
                        style={style}
                        onClick={handleClick}
                    >
                        <input
                            type="range"
                            min={comp.props.MinValue || 0}
                            max={comp.props.MaxValue || 100}
                            value={comp.props.ThumbPosition || 50}
                            className="w-full cursor-pointer accent-blue-600"
                            readOnly
                        />
                    </div>
                );

            case 'Spinner':
                return (
                    <select
                        key={comp.id}
                        className={`${baseClasses} px-4 py-3 text-sm border border-slate-200 bg-white shadow-sm`}
                        style={{
                            ...style,
                            minHeight: style.height === 'auto' ? '46px' : undefined
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
                        className={`${baseClasses} border border-slate-200 overflow-hidden shadow-sm`}
                        style={{ ...style, minHeight: '120px', borderRadius: '12px' }}
                        onClick={handleClick}
                    >
                        {items.map((item, idx) => (
                            <div key={idx} className="px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 text-sm font-medium text-slate-900">
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
                        className={`${baseClasses} border border-slate-200 bg-white flex items-center justify-center shadow-sm`}
                        style={{ ...style, minHeight: '200px', borderRadius: '16px' }}
                        onClick={handleClick}
                    >
                        <div className="text-center text-slate-900">
                            <span className="text-4xl block mb-2">🌐</span>
                            <span className="text-sm font-semibold">WebViewer</span>
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
                        style={{ ...style, display: 'flex', flexDirection: 'row', gap: '12px', minHeight: '76px', borderRadius: '16px' }}
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
                            comp.children.map(child => renderComponentPreview(child))
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
                        style={{ ...style, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '76px', borderRadius: '16px' }}
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
                            comp.children.map(child => renderComponentPreview(child))
                        ) : (
                            <div className="text-slate-900 text-sm italic font-medium flex items-center justify-center flex-1">
                                Drop components here (Vertical)
                            </div>
                        )}
                    </div>
                );

            case 'TableArrangement':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-slate-200 p-4 transition-all duration-200 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50/50' : ''
                            }`}
                        style={{ ...style, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', minHeight: '120px', borderRadius: '16px' }}
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
                            comp.children.map(child => renderComponentPreview(child))
                        ) : (
                            <div className="text-slate-900 text-sm italic font-medium col-span-2 flex items-center justify-center">
                                Drop components here (Table)
                            </div>
                        )}
                    </div>
                );

            case 'Canvas':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border border-slate-300 bg-white shadow-sm`}
                        style={{ ...style, width: comp.props.Width || 300, height: comp.props.Height || 300, borderRadius: '16px' }}
                        onClick={handleClick}
                    >
                        <div className="w-full h-full flex items-center justify-center text-slate-900">
                            <span className="text-4xl">🎨</span>
                        </div>
                    </div>
                );

            case 'VideoPlayer':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-black flex items-center justify-center shadow-md`}
                        style={{ ...style, width: comp.props.Width || 320, height: comp.props.Height || 240, borderRadius: '16px' }}
                        onClick={handleClick}
                    >
                        <span className="text-6xl">▶️</span>
                    </div>
                );

            default:
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} p-4 bg-slate-50 border border-slate-200 shadow-sm text-center`}
                        style={style}
                        onClick={handleClick}
                    >
                        <div className="text-sm font-semibold text-slate-900">{comp.type}</div>
                        <div className="text-xs text-slate-900 mt-1">{comp.id}</div>
                    </div>
                );
        }
    };

    const phoneHeaderFooter = (currentScreen.showStatusBar !== false ? 48 : 0) + (currentScreen.titleVisible !== false ? 56 : 0) + 40; // status + title + nav
    const tabletHeaderFooter = (currentScreen.showStatusBar !== false ? 24 : 0) + (currentScreen.titleVisible !== false ? 56 : 0) + 48; // status + title + nav
    const headerFooterHeight = deviceType === 'phone' ? phoneHeaderFooter : tabletHeaderFooter;
    const frameWidth = displayWidth;
    const frameHeight = displayHeight + headerFooterHeight;
    // Cap maximum scale of phone at 0.72 and tablet/monitor at 0.85 to make it "medium size" with breathing room
    const maxScale = deviceType === 'phone' ? 0.72 : 0.85;
    const scale = containerSize.width > 0 && containerSize.height > 0
        ? Math.min(maxScale, Math.min((containerSize.width - 64) / frameWidth, (containerSize.height - 64) / frameHeight))
        : 0.7; // default fallback scale

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden" onClick={() => setSelectedId(currentScreen.id)}>
            {/* Professional Top Bar - Fixed at top of canvas pane */}
            <div className="w-full bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-30 shadow-sm" style={{ height: '64px' }}>
                <div className="flex items-center gap-6">
                    {/* Screen Selector - Tab Style */}
                    <div className="flex items-center">
                        <span className="text-[15px] font-extrabold text-slate-900 uppercase tracking-wider mr-4 select-none">Screens</span>
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
                                                if (window.confirm(`Delete screen ${screen.id}? This will permanently remove all components on this screen.`)) {
                                                    deleteScreen(screen.id);
                                                }
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
 
                <div className="flex items-center gap-6">
                    {/* Device Dimensions Display */}
                    <div style={{ height: '38px' }} className="flex items-center gap-2.5 px-4 bg-slate-100 rounded-xl border border-slate-200/60 shadow-sm">
                        {deviceType === 'phone' && <Smartphone className="h-[16px] w-[16px] text-slate-900" />}
                        {(deviceType === 'tablet7' || deviceType === 'tablet10') && <Tablet className="h-[16px] w-[16px] text-slate-900" />}
                        {deviceType === 'monitor' && <Monitor className="h-[16px] w-[16px] text-slate-900" />}
                        <span className="text-[14px] font-mono font-bold text-slate-900 tracking-wide">{displayWidth} × {displayHeight}</span>
                    </div>
 
                    <div className="h-5 w-px bg-slate-200" />
 
                    {/* Device & Orientation Selectors */}
                    <div className="flex items-center gap-3">
                        <div style={{ height: '38px' }} className="flex bg-slate-200/50 p-1 rounded-xl gap-1 items-center">
                            <button
                                onClick={() => {
                                    setDeviceType('phone');
                                    setOrientation('portrait');
                                }}
                                style={{ height: '30px', width: '30px' }}
                                className={`rounded-lg flex items-center justify-center transition-all ${deviceType === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-900 hover:text-slate-950'}`}
                                title="Phone"
                            >
                                <Smartphone className="h-[18px] w-[18px]" />
                            </button>
                            <button
                                onClick={() => {
                                    setDeviceType('tablet7');
                                    setOrientation('portrait');
                                }}
                                style={{ height: '30px', width: '30px' }}
                                className={`rounded-lg flex items-center justify-center transition-all ${deviceType === 'tablet7' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-900 hover:text-slate-950'}`}
                                title='Tablet 7"'
                            >
                                <Tablet className="h-[18px] w-[18px]" />
                            </button>
                            <button
                                onClick={() => {
                                    setDeviceType('tablet10');
                                    setOrientation('portrait');
                                }}
                                style={{ height: '30px', width: '30px' }}
                                className={`rounded-lg flex items-center justify-center transition-all ${deviceType === 'tablet10' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-900 hover:text-slate-950'}`}
                                title='Tablet 10"'
                            >
                                <Tablet className="h-[20px] w-[20px]" />
                            </button>
                            <button
                                onClick={() => {
                                    setDeviceType('monitor');
                                    setOrientation('landscape');
                                }}
                                style={{ height: '30px', width: '30px' }}
                                className={`rounded-lg flex items-center justify-center transition-all ${deviceType === 'monitor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-900 hover:text-slate-950'}`}
                                title="Monitor"
                            >
                                <Monitor className="h-[18px] w-[18px]" />
                            </button>
                        </div>
 
                        <button
                            onClick={toggleOrientation}
                            style={{ height: '38px', width: '38px' }}
                            className="flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 text-slate-900 transition-all active:scale-95"
                            title="Toggle Orientation"
                        >
                            <RotateCw className="h-[18px] w-[18px]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Workspace Content Area */}
            <div
                ref={containerRef}
                className="flex-1 w-full overflow-auto flex flex-col items-center justify-start gap-8 p-6 min-h-0 relative bg-gradient-to-br from-slate-50 to-slate-100"
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
                                <div className="h-12 bg-white text-slate-900 px-6 pt-3 flex items-center justify-between text-[11px] font-semibold font-sans pointer-events-none select-none relative border-b border-black/[0.015]">
                                    <span className="font-bold w-[50px] tracking-[-0.01em]">{currentTime}</span>
                                    <div className="absolute left-1/2 -translate-x-1/2 w-[95px] h-[24px] bg-black rounded-[12px] top-[11px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[inset_0_0_4px_rgba(255,255,255,0.12)] hover:w-[110px] hover:h-[26px] hover:top-[10px] after:absolute after:right-[18px] after:top-1/2 after:-translate-y-1/2 after:w-[5px] after:h-[5px] after:bg-slate-900 after:rounded-full after:shadow-[inset_0_0_1px_1px_#1e293b] after:opacity-80" />
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
                            className="overflow-y-auto relative flex flex-col flex-1" 
                            style={{ 
                                height: `${displayHeight}px`,
                                backgroundColor: currentScreen.backgroundColor || '#ffffff'
                            }}
                        >
                            {components.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                    <div className="text-slate-900 text-[15px] font-bold leading-relaxed">
                                        Drag components from the<br />palette to build your app.
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    className="flex flex-col gap-4 p-5 min-h-full w-full"
                                    style={{
                                        alignItems: currentScreen.alignHorizontal === 'Center' ? 'center' :
                                                    currentScreen.alignHorizontal === 'Right' ? 'flex-end' : 'flex-start',
                                        justifyContent: currentScreen.alignVertical === 'Center' ? 'center' :
                                                        currentScreen.alignVertical === 'Bottom' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    {components.map(comp => renderComponentPreview(comp))}
                                </div>
                            )}
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
                    <div className="w-full max-w-[450px] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-md flex flex-col gap-3 z-10 shrink-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-[0.15em] whitespace-nowrap">Non-Visible Components</span>
                            <span className="text-[10px] bg-slate-100 text-slate-900 px-2 py-0.5 rounded-full font-bold">{nonVisibleComponents.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {nonVisibleComponents.map(comp => (
                                <div
                                    key={comp.id}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all shadow-sm border ${selectedId === comp.id ? 'bg-white text-blue-600 border-blue-200 shadow-md scale-105' : 'bg-white text-slate-900 border-slate-200 hover:border-blue-200'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(comp.id);
                                    }}
                                >
                                    <span className="text-lg">{comp.icon || '📦'}</span>
                                    <span className="uppercase tracking-[0.08em]">{comp.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


