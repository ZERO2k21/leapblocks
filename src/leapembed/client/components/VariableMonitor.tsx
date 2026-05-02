/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import { STAGE_CONFIG } from '../../server/engine/stageConfig';

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
    stageWidth?: number;
    stageHeight?: number;
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
    stageWidth = STAGE_CONFIG.WIDTH,
    stageHeight = STAGE_CONFIG.HEIGHT,
    onPositionChange,
    onPointerDown,
    onModeChange,
    onValueChange,
    onSliderRangeChange
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
    const activePointerIdRef = useRef<number | null>(null);
    const didDragRef = useRef(false);
    const lastTapTimeRef = useRef(0);
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

    const handleModeCycle = () => {
        const cycle: Record<string, 'normal' | 'large' | 'slider'> = {
            normal: 'large',
            large: 'slider',
            slider: 'normal'
        };
        onModeChange?.(cycle[mode] || 'normal');
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (contextMenu) setContextMenu(null);
        onPointerDown?.();
        // Only drag from left click, and ignore if clicking input slider
        if (e.button !== 0 || (e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
        activePointerIdRef.current = e.pointerId;
        didDragRef.current = false;
        setIsDragging(false);
        dragStartRef.current = { x: e.clientX, y: e.clientY, startX: x, startY: y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (activePointerIdRef.current !== e.pointerId) return;

        // Automatically detect inherited scale to keep drag 1:1 with mouse
        let scale = 1;
        let parent = e.currentTarget.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.transform && style.transform !== 'none') {
                const matrix = style.transform.match(/^matrix\((.+)\)$/);
                if (matrix) {
                    scale = parseFloat(matrix[1].split(',')[0]);
                    break;
                }
            }
            parent = parent.parentElement;
        }

        const dx = (e.clientX - dragStartRef.current.x) / scale;
        const dy = (e.clientY - dragStartRef.current.y) / scale;

        if (!didDragRef.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) {
            return;
        }

        didDragRef.current = true;
        lastTapTimeRef.current = 0;
        if (!isDragging) {
            setIsDragging(true);
        }

        let newX = dragStartRef.current.startX + dx;
        let newY = dragStartRef.current.startY + dy;

        // Strict Clamping to Stage Boundaries
        const element = e.currentTarget as HTMLElement;
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        newX = Math.max(0, Math.min(newX, stageWidth - width));
        newY = Math.max(0, Math.min(newY, stageHeight - height));

        onPositionChange?.(newX, newY);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        activePointerIdRef.current = null;
        const wasTap = !didDragRef.current && (e.target as HTMLElement).tagName.toLowerCase() !== 'input';
        didDragRef.current = false;
        setIsDragging(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        if (!wasTap) {
            return;
        }

        const now = Date.now();
        if (now - lastTapTimeRef.current <= 350) {
            lastTapTimeRef.current = 0;
            handleModeCycle();
            return;
        }

        lastTapTimeRef.current = now;
    };

    const handlePointerCancel = (e: React.PointerEvent) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        activePointerIdRef.current = null;
        didDragRef.current = false;
        setIsDragging(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
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
                onPointerCancel={handlePointerCancel}
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
                            const parsedMin = Number(min);
                            const parsedMax = Number(max);
                            if (Number.isFinite(parsedMin) && Number.isFinite(parsedMax)) {
                                onSliderRangeChange?.(Math.min(parsedMin, parsedMax), Math.max(parsedMin, parsedMax));
                            }
                            setContextMenu(null);
                        }}>change slider range</div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: '#edeff2', // Light gray standard base
        borderRadius: '6px',
        padding: '3px 4px',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
        border: '1px solid #bcc5ce',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: '11px',
        color: 'black',
        userSelect: 'none',
        touchAction: 'manipulation',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        minHeight: '22px'
    },
    largeContainer: {
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0
    },
    sliderContainer: {
        backgroundColor: '#edeff2',
        border: '1px solid #bcc5ce',
        padding: '4px 6px',
        display: 'inline-flex',
        flexDirection: 'column',
    },
    normalContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
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
        gap: '8px',
        width: '100%',
        minWidth: '120px'
    },
    name: {
        fontWeight: 'bold',
        color: '#575E75', // Darker gray for label
        marginLeft: '2px',
        marginRight: '2px'
    },
    value: {
        backgroundColor: '#FF8C1A', // PictoBlox orange
        padding: '1px 8px',
        borderRadius: '4px',
        color: 'white',
        fontWeight: 'bold',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        textAlign: 'center',
        border: '1px solid rgba(0,0,0,0.1)',
        minWidth: '30px'
    },
    largeValue: {
        backgroundColor: '#FF8C1A',
        padding: '6px 16px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
        borderRadius: '6px',
        border: '1px solid rgba(0,0,0,0.1)',
        minWidth: '40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
