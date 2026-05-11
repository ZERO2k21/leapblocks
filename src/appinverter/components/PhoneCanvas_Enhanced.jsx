/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Enhanced Phone Canvas - Matches MIT App Inventor Viewer functionality
 */
import React, { useState, useRef } from 'react';
import { Smartphone, Tablet, Monitor, RotateCw } from 'lucide-react';

export default function PhoneCanvasEnhanced({ appState }) {
    const { screens, activeScreen, selectedId, addComponent, setSelectedId, setActiveScreen } = appState;
    const [deviceType, setDeviceType] = useState('phone'); // 'phone', 'tablet7', 'tablet10'
    const [orientation, setOrientation] = useState('portrait'); // 'portrait', 'landscape'
    const [dragOver, setDragOver] = useState(false);
    const [dropTarget, setDropTarget] = useState(null); // Track which container is being dragged over
    const canvasRef = useRef(null);

    const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
    const components = currentScreen?.components || [];
    const nonVisibleComponents = currentScreen?.nonVisibleComponents || [];

    // Device dimensions (width x height in portrait)
    const deviceDimensions = {
        phone: { width: 360, height: 640, label: 'Phone' },
        tablet7: { width: 600, height: 960, label: 'Tablet 7"' },
        tablet10: { width: 800, height: 1280, label: 'Tablet 10"' }
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

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const toggleOrientation = () => {
        setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
    };

    const renderComponentPreview = (comp) => {
        const isSelected = comp.id === selectedId;
        const baseClasses = `cursor-pointer transition-all ${isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg z-10'
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
                        {comp.props.Text || 'Button'}
                    </button>
                );

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
                        <div className={`w-12 h-6 rounded-full transition-colors ${comp.props.On ? 'bg-blue-500' : 'bg-gray-300'}`}>
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
            case 'ListPicker':
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
                        className={`${baseClasses} border-2 border-dashed border-gray-300 rounded p-2 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50' : ''
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
                        className={`${baseClasses} border-2 border-dashed border-gray-300 rounded p-2 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50' : ''
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
                        className={`${baseClasses} border-2 border-dashed border-gray-300 rounded p-2 ${dropTarget === comp.id ? 'border-blue-500 bg-blue-50' : ''
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
        <div className="flex-1 bg-[#edf1f6] flex flex-col overflow-auto">
            {/* Toolbar */}
            <div className="bg-[#dfe6ee] border-b border-[#c6cfda] px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {/* Device Type Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#465a70]">Device:</span>
                        <div className="flex gap-1 bg-[#eef3f8] border border-[#c6cfda] rounded p-1">
                            <button
                                onClick={() => setDeviceType('phone')}
                                className={`p-1.5 rounded ${deviceType === 'phone' ? 'bg-white shadow-sm' : 'hover:bg-[#e0e8f2]'}`}
                                title="Phone"
                            >
                                <Smartphone className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setDeviceType('tablet7')}
                                className={`p-1.5 rounded ${deviceType === 'tablet7' ? 'bg-white shadow-sm' : 'hover:bg-[#e0e8f2]'}`}
                                title="Tablet 7&quot;"
                            >
                                <Tablet className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setDeviceType('tablet10')}
                                className={`p-1.5 rounded ${deviceType === 'tablet10' ? 'bg-white shadow-sm' : 'hover:bg-[#e0e8f2]'}`}
                                title="Tablet 10&quot;"
                            >
                                <Monitor className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Orientation Toggle */}
                    <button
                        onClick={toggleOrientation}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#eef3f8] hover:bg-[#e0e8f2] border border-[#c6cfda] rounded text-sm font-medium transition-colors"
                        title="Toggle Orientation"
                    >
                        <RotateCw className="h-4 w-4" />
                        {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    </button>

                    {/* Screen Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#465a70]">Screen:</span>
                        <select
                            value={activeScreen}
                            onChange={(e) => setActiveScreen(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-[#b7c4d4] rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#4a90e2]"
                        >
                            {screens.map(screen => (
                                <option key={screen.id} value={screen.id}>{screen.id}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Dimensions Display */}
                <div className="text-xs text-[#5b6b7f]">
                    {displayWidth} × {displayHeight} dp
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-8" onClick={() => setSelectedId(null)}>
                {/* Phone/Tablet Frame */}
                <div
                    ref={canvasRef}
                    className={`bg-white rounded-2xl overflow-hidden shadow-xl border-[6px] border-[#4e5f75] relative flex flex-col shrink-0 transition-all duration-300 ${dragOver ? 'ring-4 ring-[#4a90e2] ring-offset-4' : ''
                        }`}
                    style={{
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {/* Status/Title Bar */}
                    <div className="h-10 bg-[#4a90e2] text-white text-sm flex items-center justify-center font-semibold z-20 border-b border-[#3f79bf] shrink-0">
                        {currentScreen.title || activeScreen}
                    </div>

                    {/* Screen Content */}
                    <div className="flex-1 overflow-y-auto p-4 relative bg-white">
                        {components.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-center p-6 border-2 border-dashed border-gray-300 m-4 rounded-xl">
                                <div>
                                    <div className="text-6xl mb-4">📱</div>
                                    <div className="text-gray-400 font-medium">Drag components here</div>
                                    <div className="text-gray-400 text-sm mt-2">from the Palette on the left</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {components.map(comp => renderComponentPreview(comp))}
                            </div>
                        )}
                    </div>

                    {/* Non-Visible Components Bar */}
                    {nonVisibleComponents.length > 0 && (
                        <div className="bg-gray-50 border-t border-gray-200 p-2 flex items-center gap-2 overflow-x-auto shrink-0">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Non-visible:</span>
                            {nonVisibleComponents.map(comp => (
                                <div
                                    key={comp.id}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${selectedId === comp.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(comp.id);
                                    }}
                                    title={comp.type}
                                >
                                    <span>{comp.icon || '📦'}</span>
                                    <span className="font-medium">{comp.id}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
