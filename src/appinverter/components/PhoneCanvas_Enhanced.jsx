/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Enhanced Phone Canvas - Matches Leap App Inventor Viewer functionality
 */
import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, RotateCw, Plus, Check, X as XIcon, Wifi, Battery, Signal } from 'lucide-react';

export default function PhoneCanvasEnhanced({ appState }) {
    const { screens, activeScreen, selectedId, addComponent, setSelectedId, setActiveScreen, addScreen } = appState;
    const [deviceType, setDeviceType] = useState('phone'); // 'phone', 'tablet7', 'tablet10'
    const [orientation, setOrientation] = useState('portrait'); // 'portrait', 'landscape'
    const [dragOver, setDragOver] = useState(false);
    const [dropTarget, setDropTarget] = useState(null); // Track which container is being dragged over
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isAddingScreen, setIsAddingScreen] = useState(false);
    const [newScreenName, setNewScreenName] = useState('');
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [time, setTime] = useState('');

    // Real-time Clock effect
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours().toString().padStart(2, '0');
            let minutes = now.getMinutes().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}`);
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // ResizeObserver for dynamic mockup scaling
    useEffect(() => {
        if (!containerRef.current) return;
        const updateSize = () => {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({
                width: rect.width,
                height: rect.height
            });
        };
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);


    const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
    const components = currentScreen?.components || [];
    const nonVisibleComponents = currentScreen?.nonVisibleComponents || [];

    // Device dimensions (width x height in portrait) - Updated for better visibility
    const deviceDimensions = {
        phone: { width: 390, height: 844, label: 'Phone' },        // iPhone 14 Pro size
        tablet7: { width: 600, height: 960, label: 'Tablet 7"' },
        tablet10: { width: 800, height: 1280, label: 'Tablet 10"' },
        monitor: { width: 1280, height: 800, label: 'Monitor' }
    };

    const currentDimensions = deviceDimensions[deviceType];
    const displayWidth = orientation === 'portrait' ? currentDimensions.width : currentDimensions.height;
    const displayHeight = orientation === 'portrait' ? currentDimensions.height : currentDimensions.width;

    // Determine dynamic properties based on deviceType
    let frameClass = 'phone-frame-pro';
    let screenClass = 'phone-screen-pro';
    let bezelX = 24; // left + right bezel padding
    let bezelY = 24; // top + bottom bezel padding

    if (deviceType === 'tablet7' || deviceType === 'tablet10') {
        frameClass = 'tablet-frame-pro';
        screenClass = 'tablet-screen-pro';
        bezelX = 48; // thicker bezel for tablet (e.g. 24px each side)
        bezelY = 48;
    } else if (deviceType === 'monitor') {
        frameClass = 'monitor-frame-pro';
        screenClass = 'monitor-screen-pro';
        bezelX = 16; // thin bezel for browser (e.g. 8px each side)
        bezelY = 44; // 8px bottom + 36px titlebar top
    }

    const frameWidth = displayWidth + bezelX;
    const frameHeight = displayHeight + bezelY;

    // Calculate dynamic scaling factor to fit preview inside the available container space
    const padding = 48; // Spacing around the device frame
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding - 64; 
    
    const scaleX = availableWidth / frameWidth;
    const scaleY = availableHeight / frameHeight;
    const scale = Math.max(0.2, Math.min(1, Math.min(scaleX, scaleY)));


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
        const baseClasses = `cursor-pointer transition-all ${isSelected
            ? 'ring-2 ring-orange-500 ring-offset-2 shadow-lg z-10'
            : 'hover:ring-2 hover:ring-gray-300'
            } mb-2 relative`;

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
            case 'FilePicker':
                const shape = comp.props.Shape || 'default';
                const borderRadius = shape === 'rounded' ? '20px' :
                    shape === 'rectangular' ? '4px' :
                        shape === 'oval' ? '50%' : '8px';
                return (
                    <button
                        key={comp.id}
                        className={`${baseClasses} px-4 py-2 font-medium`}
                        style={{
                            ...style,
                            backgroundColor: style.backgroundColor || '#3B82F6',
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
                )

            case 'Label':
                return (
                    <div
                        key={comp.id}
                        className={baseClasses}
                        style={{ ...style, padding: '4px' }}
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
                        className={`${baseClasses} px-3 py-2 border border-gray-300 rounded`}
                        style={{ ...style, backgroundColor: '#FFFFFF' }}
                        onClick={handleClick}
                        disabled={comp.props.Enabled === false}
                        readOnly
                    />
                );

            case 'Image':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-gray-200 flex items-center justify-center overflow-hidden`}
                        style={{
                            ...style,
                            width: comp.props.Width || 100,
                            height: comp.props.Height || 100
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
                        className={`${baseClasses} flex items-center space-x-2 cursor-pointer`}
                        style={style}
                        onClick={handleClick}
                    >
                        <input
                            type="checkbox"
                            checked={comp.props.Checked || false}
                            className="w-4 h-4"
                            readOnly
                        />
                        <span>{comp.props.Text || 'CheckBox'}</span>
                    </label>
                );

            case 'Switch':
                return (
                    <label
                        key={comp.id}
                        className={`${baseClasses} flex items-center space-x-2 cursor-pointer`}
                        style={style}
                        onClick={handleClick}
                    >
                        <div className={`w-12 h-6 rounded-full transition-colors ${comp.props.On ? 'bg-orange-500' : 'bg-gray-300'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${comp.props.On ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                        </div>
                        <span>{comp.props.Text || 'Switch'}</span>
                    </label>
                );

            case 'Slider':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} py-2`}
                        style={style}
                        onClick={handleClick}
                    >
                        <input
                            type="range"
                            min={comp.props.MinValue || 0}
                            max={comp.props.MaxValue || 100}
                            value={comp.props.ThumbPosition || 50}
                            className="w-full"
                            readOnly
                        />
                    </div>
                );

            case 'Spinner':
                return (
                    <select
                        key={comp.id}
                        className={`${baseClasses} px-3 py-2 border border-gray-300 rounded bg-white`}
                        style={style}
                        onClick={handleClick}
                    >
                        <option>{comp.props.Text || comp.props.Selection || 'Select...'}</option>
                    </select>
                );

            case 'ListView':
                const items = comp.props.Elements || ['Item 1', 'Item 2', 'Item 3'];
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border border-gray-300 rounded overflow-hidden`}
                        style={{ ...style, minHeight: '100px' }}
                        onClick={handleClick}
                    >
                        {items.map((item, idx) => (
                            <div key={idx} className="px-3 py-2 border-b border-gray-200 hover:bg-gray-50">
                                {item}
                            </div>
                        ))}
                    </div>
                );

            case 'WebViewer':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border border-gray-300 rounded bg-white flex items-center justify-center`}
                        style={{ ...style, minHeight: '200px' }}
                        onClick={handleClick}
                    >
                        <div className="text-center text-gray-500">
                            <span className="text-4xl block mb-2">🌐</span>
                            <span className="text-sm">WebViewer</span>
                        </div>
                    </div>
                );

            case 'HorizontalArrangement':
            case 'HorizontalScrollArrangement':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-gray-300 rounded p-2 ${dropTarget === comp.id ? 'border-orange-500 bg-orange-50/20' : ''
                            }`}
                        style={{ ...style, display: 'flex', flexDirection: 'row', gap: '8px', minHeight: '60px' }}
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
                            <div className="text-gray-400 text-sm italic flex items-center justify-center flex-1">
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
                        className={`${baseClasses} border-2 border-dashed border-gray-300 rounded p-2 ${dropTarget === comp.id ? 'border-orange-500 bg-orange-50/20' : ''
                            }`}
                        style={{ ...style, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px' }}
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
                            <div className="text-gray-400 text-sm italic flex items-center justify-center flex-1">
                                Drop components here (Vertical)
                            </div>
                        )}
                    </div>
                );

            case 'TableArrangement':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border-2 border-dashed border-gray-300 rounded p-2 ${dropTarget === comp.id ? 'border-orange-500 bg-orange-50/20' : ''
                            }`}
                        style={{ ...style, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', minHeight: '100px' }}
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
                            <div className="text-gray-400 text-sm italic col-span-2 flex items-center justify-center">
                                Drop components here (Table)
                            </div>
                        )}
                    </div>
                );

            case 'Canvas':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} border border-gray-400 bg-white`}
                        style={{ ...style, width: comp.props.Width || 300, height: comp.props.Height || 300 }}
                        onClick={handleClick}
                    >
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">🎨</span>
                        </div>
                    </div>
                );

            case 'VideoPlayer':
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} bg-black flex items-center justify-center`}
                        style={{ ...style, width: comp.props.Width || 320, height: comp.props.Height || 240 }}
                        onClick={handleClick}
                    >
                        <span className="text-6xl">▶️</span>
                    </div>
                );

            default:
                return (
                    <div
                        key={comp.id}
                        className={`${baseClasses} p-3 bg-gray-100 border border-gray-300 rounded text-center`}
                        style={style}
                        onClick={handleClick}
                    >
                        <div className="text-sm font-medium text-gray-700">{comp.type}</div>
                        <div className="text-xs text-gray-500 mt-1">{comp.id}</div>
                    </div>
                );
        }
    };

    return (
        <div className="phone-canvas-container-pro h-full flex flex-col relative !overflow-hidden" onClick={() => setSelectedId(null)}>
            {/* Professional Top Bar - Fixed at top of canvas pane */}
            <div className="absolute top-0 left-0 right-0 bg-[#f8fafc] border-b border-slate-200 px-6 py-3 flex items-center justify-between z-30 shadow-sm">
                <div className="flex items-center gap-6">
                    {/* Screen Selector - Tab Style */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Screens</span>
                        <div className="flex bg-slate-200/50 p-1 rounded-lg gap-1">
                            {screens.map(screen => (
                                <button
                                    key={screen.id}
                                    onClick={() => setActiveScreen(screen.id)}
                                    className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeScreen === screen.id
                                        ? 'bg-white text-orange-500 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                                >
                                    {screen.id}
                                </button>
                            ))}
                            {isAddingScreen ? (
                                <div className="flex items-center gap-1 bg-white rounded-md px-2 py-1 shadow-sm border border-orange-200">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Name"
                                        className="w-20 outline-none text-[13px] font-bold text-slate-700"
                                        value={newScreenName}
                                        onChange={(e) => setNewScreenName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddScreen()}
                                    />
                                    <button onClick={handleAddScreen} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                        <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setIsAddingScreen(false)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                        <XIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingScreen(true)}
                                    className="px-3 py-1.5 text-slate-400 hover:text-orange-500 hover:bg-white/40 rounded-md transition-all"
                                    title="Add Screen"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* Device Dimensions Display */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg border border-slate-200">
                        <Monitor className="h-4 w-4 text-slate-400" />
                        <span className="text-[12px] font-mono font-bold text-slate-600">{displayWidth} × {displayHeight}</span>
                    </div>

                    <div className="h-6 w-px bg-slate-300" />

                    {/* Device & Orientation Selectors */}
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-200/50 p-1 rounded-lg gap-1">
                            <button
                                onClick={() => setDeviceType('phone')}
                                className={`p-2 rounded-md transition-all ${deviceType === 'phone' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Phone"
                            >
                                <Smartphone className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setDeviceType('tablet7')}
                                className={`p-2 rounded-md transition-all ${deviceType === 'tablet7' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title='Tablet 7"'
                            >
                                <Tablet className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setDeviceType('tablet10')}
                                className={`p-2 rounded-md transition-all ${deviceType === 'tablet10' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title='Tablet 10"'
                            >
                                <Tablet className="h-4 w-4 scale-110" />
                            </button>
                            <button
                                onClick={() => setDeviceType('monitor')}
                                className={`p-2 rounded-md transition-all ${deviceType === 'monitor' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Monitor"
                            >
                                <Monitor className="h-4 w-4" />
                            </button>
                        </div>

                        <button
                            onClick={toggleOrientation}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-200 text-slate-600 transition-all active:scale-95"
                            title="Toggle Orientation"
                        >
                            <RotateCw className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Workspace Content Area */}
            <div ref={containerRef} className="flex-1 w-full overflow-auto flex flex-col items-center justify-center p-6 min-h-0 relative">
                {/* Scaled Device Container */}
                <div
                    style={{
                        width: `${frameWidth * scale}px`,
                        height: `${frameHeight * scale}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        flexShrink: 0,
                        transition: 'width 0.3s ease, height 0.3s ease'
                    }}
                >
                    {/* Device Frame */}
                    <div
                        ref={canvasRef}
                        className={`${frameClass} transition-all duration-500 ${dragOver ? 'drag-over shadow-[0_60px_120px_-20px_rgba(255,122,0,0.3)]' : ''}`}
                        style={{
                            width: `${frameWidth}px`,
                            height: `${frameHeight}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                            position: 'absolute',
                            flexShrink: 0
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {/* Phone-specific Hardware Buttons */}
                        {deviceType === 'phone' && (
                            <>
                                <div className="volume-up" />
                                <div className="volume-down" />
                                <div className="power-btn" />
                            </>
                        )}

                        {/* Tablet-specific Camera Dot */}
                        {(deviceType === 'tablet7' || deviceType === 'tablet10') && (
                            <div className="tablet-camera-dot-pro" />
                        )}

                        {/* Browser Window Controls for Monitor */}
                        {deviceType === 'monitor' && (
                            <div className="monitor-titlebar-pro">
                                <div className="monitor-window-dots-pro">
                                    <span className="dot dot-close" />
                                    <span className="dot dot-minimize" />
                                    <span className="dot dot-expand" />
                                </div>
                                <div className="monitor-url-bar-pro">
                                    <span>leapblocks.app/appinverter</span>
                                </div>
                                <div className="w-16" />
                            </div>
                        )}

                        <div className={`${screenClass} flex flex-col`}>
                            {/* Status Bar Pro (Phone & Tablet only) */}
                            {(deviceType === 'phone' || deviceType === 'tablet7' || deviceType === 'tablet10') && (
                                <div className="status-bar-pro">
                                    <div className="time">{time || '9:41'}</div>
                                    {deviceType === 'phone' && <div className="phone-notch-pro" />}
                                    <div className="right-icons">
                                        <Signal className="h-3 w-3" />
                                        <Wifi className="h-3 w-3" />
                                        <Battery className="h-3 w-3" />
                                    </div>
                                </div>
                            )}

                            {/* App Title Bar - Precise Centering */}
                            <div className="h-16 bg-slate-900 text-white flex items-center justify-center px-10 shrink-0 relative z-10">
                                <span className="text-[14px] font-black uppercase tracking-[0.15em] opacity-95 text-center w-full truncate">
                                    {currentScreen.title || activeScreen}
                                </span>
                            </div>

                            {/* Screen Content */}
                            <div className="flex-1 overflow-y-auto p-6 relative bg-white">
                                {components.length === 0 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-slate-100 m-6 rounded-[32px] bg-slate-50/30">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 text-4xl shadow-sm border border-slate-100">📱</div>
                                        <div className="text-slate-900 font-extrabold uppercase tracking-[0.15em] text-[12px] mb-2">Workspace Empty</div>
                                        <div className="text-slate-400 text-[12px] font-medium leading-relaxed">Drag components from the<br />palette to begin.</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {components.map(comp => renderComponentPreview(comp))}
                                    </div>
                                )}
                            </div>

                            {/* Home Indicator Pro (Phone only) */}
                            {deviceType === 'phone' && <div className="home-indicator-pro" />}

                            {/* Tablet Home Indicator */}
                            {(deviceType === 'tablet7' || deviceType === 'tablet10') && (
                                <div className="tablet-home-indicator-pro" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Non-Visible Components Bar Pro */}
                {nonVisibleComponents.length > 0 && (
                    <div className="w-full max-w-[450px] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-md flex flex-col gap-3 z-10 mt-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">Non-Visible Components</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{nonVisibleComponents.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {nonVisibleComponents.map(comp => (
                                <div
                                    key={comp.id}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all shadow-sm border ${selectedId === comp.id ? 'bg-white text-orange-500 border-orange-200 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-200'}`}
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


