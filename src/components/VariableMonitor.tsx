import React, { useState, useRef, useEffect } from 'react';

interface VariableMonitorProps {
    name: string;
    value: number | string;
    visible: boolean;
    x?: number;
    y?: number;
    zIndex?: number;
    mode?: 'normal' | 'large' | 'slider';
    sliderMin?: number;
    sliderMax?: number;
    onPositionChange?: (x: number, y: number) => void;
    onPointerDown?: () => void;
    onModeChange?: (mode: 'normal' | 'large' | 'slider') => void;
    onValueChange?: (value: number) => void;
    onSliderRangeChange?: (min: number, max: number) => void;
}

export const VariableMonitor: React.FC<VariableMonitorProps> = ({
    name,
    value,
    visible,
    x = 10,
    y = 10,
    zIndex = 100,
    mode = 'normal',
    sliderMin = 0,
    sliderMax = 100,
    onPositionChange,
    onPointerDown,
    onModeChange,
    onValueChange,
    onSliderRangeChange
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('scroll', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('scroll', handleClickOutside);
        };
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (contextMenu) setContextMenu(null);
        onPointerDown?.();
        // Only drag from left click, and ignore if clicking input slider
        if (e.button !== 0 || (e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY, startX: x, startY: y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        onPositionChange?.(Math.max(-50, dragStartRef.current.startX + dx), Math.max(-50, dragStartRef.current.startY + dy));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onPointerDown?.();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleMenuClick = (newMode: 'normal' | 'large' | 'slider') => {
        onModeChange?.(newMode);
        setContextMenu(null);
    };

    if (!visible) return null;

    const displayValue = typeof value === 'number' ? value.toString() : value;
    const isNumber = typeof value === 'number' && !isNaN(value);

    return (
        <div style={{ position: 'absolute', left: x, top: y, zIndex: zIndex }}>
            <div
                style={{
                    ...styles.container,
                    ...(mode === 'large' ? styles.largeContainer : {}),
                    ...(mode === 'slider' ? styles.sliderContainer : {}),
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
                className={`variable-monitor mode-${mode}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onContextMenu={handleContextMenu}
            >
                {mode === 'normal' && (
                    <div style={styles.normalContent}>
                        <span style={styles.name}>{name}</span>
                        <span style={styles.value}>{displayValue}</span>
                    </div>
                )}
                {mode === 'large' && (
                    <div style={styles.largeContent}>
                        <span style={styles.largeValue}>{displayValue}</span>
                    </div>
                )}
                {mode === 'slider' && (
                    <div style={styles.sliderContentLayout}>
                        <div style={styles.normalContent}>
                            <span style={styles.name}>{name}</span>
                            <span style={styles.value}>{displayValue}</span>
                        </div>
                        {isNumber ? (
                            <input 
                                type="range" 
                                min={sliderMin} 
                                max={sliderMax} 
                                value={Number(value) || 0}
                                onChange={(e) => onValueChange?.(Number(e.target.value))}
                                style={styles.rangeInput}
                            />
                        ) : (
                            <div style={styles.sliderError}>Not a number</div>
                        )}
                    </div>
                )}
            </div>

            {/* Context Menu Portal / Overlay */}
            {contextMenu && (
                <div style={{
                    ...styles.contextMenu,
                    position: 'fixed',
                    left: contextMenu.x,
                    top: contextMenu.y,
                }}>
                    <div style={styles.menuItem} onClick={() => handleMenuClick('normal')}>
                        {mode === 'normal' && <span style={styles.check}>✓</span>} normal readout
                    </div>
                    <div style={styles.menuItem} onClick={() => handleMenuClick('large')}>
                        {mode === 'large' && <span style={styles.check}>✓</span>} large readout
                    </div>
                    <div style={styles.menuItem} onClick={() => handleMenuClick('slider')}>
                        {mode === 'slider' && <span style={styles.check}>✓</span>} slider
                    </div>
                    {mode === 'slider' && (
                        <div style={styles.menuItem} onClick={() => {
                            const min = window.prompt("Slider minimum:", sliderMin.toString()) || sliderMin.toString();
                            const max = window.prompt("Slider maximum:", sliderMax.toString()) || sliderMax.toString();
                            onSliderRangeChange?.(Number(min), Number(max));
                        }}>change slider range</div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: '#FF8C1A', // PictoBlox orange variable color
        borderRadius: '5px',
        padding: '3px',
        boxShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: '11px',
        color: 'black',
        userSelect: 'none',
        border: '1px solid rgba(0,0,0,0.2)',
        minWidth: '60px',
        display: 'inline-block'
    },
    largeContainer: {
        padding: '2px',
        minWidth: '40px'
    },
    sliderContainer: {
        backgroundColor: '#e5eaec',
        borderColor: '#bcc5ce',
        color: 'black',
        padding: '5px',
        borderRadius: '5px',
        minWidth: '100px'
    },
    normalContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
    },
    largeContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sliderContentLayout: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
    },
    name: {
        fontWeight: 'bold',
        color: 'white',
        textShadow: '0 1px 1px rgba(0,0,0,0.2)',
        marginRight: '2px',
        marginLeft: '2px'
    },
    value: {
        backgroundColor: '#FF6400',
        padding: '1px 4px',
        borderRadius: '3px',
        color: 'white',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        textAlign: 'center',
        border: '1px solid rgba(0,0,0,0.1)'
    },
    largeValue: {
        backgroundColor: '#FF6400',
        padding: '5px 12px',
        color: 'white',
        fontSize: '14px',
        textAlign: 'center',
        borderRadius: '3px',
        border: '1px solid rgba(0,0,0,0.1)'
    },
    rangeInput: {
        width: '100%',
        margin: '0 2px'
    },
    sliderError: {
        color: '#999',
        fontSize: '10px'
    },
    contextMenu: {
        backgroundColor: 'white',
        border: '1px solid #ccc',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        padding: '4px 0',
        fontFamily: 'sans-serif',
        fontSize: '12px',
        zIndex: 9999,
        minWidth: '140px'
    },
    menuItem: {
        padding: '6px 16px 6px 24px',
        cursor: 'pointer',
        position: 'relative',
        color: '#333'
    },
    check: {
        position: 'absolute',
        left: '8px',
        fontWeight: 'bold'
    }
};

export default VariableMonitor;
