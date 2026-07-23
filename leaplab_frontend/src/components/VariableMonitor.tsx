/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import { STAGE_CONFIG } from '../engine/StageConfig';

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
                className={`variable-monitor mode-${mode} select-none touch-manipulation inline-flex items-center gap-1 min-h-5.5 font-sans text-xs text-black ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                } ${
                    mode === 'large'
                        ? 'bg-transparent border-none shadow-none p-0'
                        : mode === 'slider'
                        ? 'bg-[#edeff2] border border-[#bcc5ce] rounded-md p-1 px-1.5 flex-col'
                        : 'bg-[#edeff2] border border-[#bcc5ce] rounded-md p-0.75 px-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onContextMenu={handleContextMenu}
            >
                {mode === 'normal' && (
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <span className="font-bold text-[#575E75] mx-0.5">{name}</span>
                        <span className="bg-[#FF8C1A] p-0.25 px-2 rounded-xs text-white font-bold font-sans text-center border border-black/10 min-w-7.5">{displayValue}</span>
                    </div>
                )}
                {mode === 'large' && (
                    <div className="flex items-center justify-center">
                        <span className="bg-[#FF8C1A] p-1.5 px-4 text-white text-sm font-bold text-center rounded-md border border-black/10 min-w-10 shadow-md">{displayValue}</span>
                    </div>
                )}
                {mode === 'slider' && (
                    <div className="flex flex-col items-center gap-2 w-full min-w-[120px]">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-[#575E75] mx-0.5">{name}</span>
                            <span className="bg-[#FF8C1A] p-0.25 px-2 rounded-xs text-white font-bold font-sans text-center border border-black/10 min-w-7.5">{displayValue}</span>
                        </div>
                        {isNumber ? (
                            <input
                                type="range"
                                min={sliderMin}
                                max={sliderMax}
                                value={Number(value) || 0}
                                onChange={(e) => onValueChange?.(Number(e.target.value))}
                                className="w-full mx-0.5"
                            />
                        ) : (
                            <div className="text-slate-400 text-[10px]">Not a number</div>
                        )}
                    </div>
                )}
            </div>

            {/* Context Menu Portal / Overlay */}
            {contextMenu && (
                <div 
                    className="fixed bg-white border border-slate-300 shadow-[2px_2px_5px_rgba(0,0,0,0.2)] rounded-md py-1 font-sans text-xs z-[9999] min-w-[140px]"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y,
                    }}
                >
                    <div className="py-1.5 pl-6 pr-4 cursor-pointer relative text-slate-800 hover:bg-slate-100" onClick={() => handleMenuClick('normal')}>
                        {mode === 'normal' && <span className="absolute left-2 font-bold">✓</span>} normal readout
                    </div>
                    <div className="py-1.5 pl-6 pr-4 cursor-pointer relative text-slate-800 hover:bg-slate-100" onClick={() => handleMenuClick('large')}>
                        {mode === 'large' && <span className="absolute left-2 font-bold">✓</span>} large readout
                    </div>
                    <div className="py-1.5 pl-6 pr-4 cursor-pointer relative text-slate-800 hover:bg-slate-100" onClick={() => handleMenuClick('slider')}>
                        {mode === 'slider' && <span className="absolute left-2 font-bold">✓</span>} slider
                    </div>
                    {mode === 'slider' && (
                        <div className="py-1.5 pl-6 pr-4 cursor-pointer relative text-slate-800 hover:bg-slate-100" onClick={() => {
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

export default VariableMonitor;
