import { useState, useRef, useCallback } from 'react';

const SPRITE_BOX_SIZE = 80;
const SPRITE_CENTER = SPRITE_BOX_SIZE / 2;
const PEN_TIP_LOCAL = { x: 7, y: 79 };

export function getPenTipOffset(
    currentAngle = 0,
    currentSize = 100,
    currentScaleX = 1,
    currentMirrored = false
): { x: number; y: number } {
    const angleRad = (Number(currentAngle) || 0) * Math.PI / 180;
    const sizeScale = Math.max(0.1, (Number(currentSize) || 100) / 100);
    const horizontalDirection = (currentMirrored ? -currentScaleX : currentScaleX) < 0 ? -1 : 1;

    const baseX = (PEN_TIP_LOCAL.x - SPRITE_CENTER) * horizontalDirection * sizeScale;
    const baseY = (PEN_TIP_LOCAL.y - SPRITE_CENTER) * sizeScale;

    const rotatedX = (Math.cos(angleRad) * baseX) - (Math.sin(angleRad) * baseY);
    const rotatedY = (Math.sin(angleRad) * baseX) + (Math.cos(angleRad) * baseY);

    return {
        x: SPRITE_CENTER + rotatedX,
        y: SPRITE_CENTER + rotatedY
    };
}

interface UseSpriteDragProps {
    x: number;
    y: number;
    angle: number;
    size: number;
    scaleX: number;
    mirrored: boolean;
    onClick?: () => void;
    onDragStateChange?: (dragging: boolean) => void;
    isPenSprite?: boolean;
    updateStore: (partial: Partial<{ x: number; y: number }>) => void;
    penColor?: string;
    isPenDown?: boolean;
    fullscreenScale?: number;
}

interface DragRef {
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    didDrag: boolean;
    parentLeft: number;
    parentTop: number;
    prevDrawPoint: { x: number; y: number } | null;
    tipOffsetX: number;
    tipOffsetY: number;
    stageEl: HTMLElement | null;
    scale: number;
}

declare global {
    interface Window {
        drawSegment?: (x1: number, y1: number, x2: number, y2: number, color: string, size: number) => void;
        penColor?: string;
        penSize?: number;
    }
}

export default function useSpriteDrag({
    x, y, angle, size, scaleX, mirrored, onClick, onDragStateChange,
    isPenSprite, updateStore, penColor, isPenDown, fullscreenScale = 1,
}: UseSpriteDragProps): {
    isDragging: boolean;
    handleMouseDown: (e: React.MouseEvent) => void;
    handleTouchStart: (e: React.TouchEvent) => void;
} {
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<DragRef>({ startX: 0, startY: 0, origX: 0, origY: 0, didDrag: false, parentLeft: 0, parentTop: 0, prevDrawPoint: null, tipOffsetX: 0, tipOffsetY: 0, stageEl: null, scale: 1 });

    const startDrag = useCallback((clientX: number, clientY: number) => {
        const stageEl = dragRef.current.stageEl;
        const rect = stageEl?.getBoundingClientRect();
        const stageLeft = rect?.left || 0;
        const stageTop = rect?.top || 0;
        const pointerX = clientX - stageLeft;
        const pointerY = clientY - stageTop;
        const tipOffset = getPenTipOffset(angle, size, scaleX, mirrored);

        dragRef.current = {
            startX: clientX,
            startY: clientY,
            origX: x,
            origY: y,
            didDrag: false,
            parentLeft: stageLeft,
            parentTop: stageTop,
            prevDrawPoint: isPenSprite ? { x: pointerX, y: pointerY } : null,
            tipOffsetX: tipOffset.x,
            tipOffsetY: tipOffset.y,
            stageEl,
            scale: fullscreenScale,
        };

        setIsDragging(true);
        if (onDragStateChange) onDragStateChange(true);
    }, [x, y, angle, size, scaleX, mirrored, isPenSprite, onDragStateChange, fullscreenScale]);

    const moveDrag = useCallback((clientX: number, clientY: number) => {
        const scale = dragRef.current.scale || 1;
        const dx = (clientX - dragRef.current.startX) / scale;
        const dy = (clientY - dragRef.current.startY) / scale;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragRef.current.didDrag = true;
        }
        const pointerPoint = {
            x: (clientX - dragRef.current.parentLeft) / scale,
            y: (clientY - dragRef.current.parentTop) / scale
        };
        const newX = isPenSprite
            ? (pointerPoint.x - dragRef.current.tipOffsetX)
            : (dragRef.current.origX + dx);
        const newY = isPenSprite
            ? (pointerPoint.y - dragRef.current.tipOffsetY)
            : (dragRef.current.origY + dy);

        if (isPenSprite && window.drawSegment) {
            if (dragRef.current.prevDrawPoint) {
                const activeColor = window.penColor || penColor;
                const activeSize = window.penSize || 4;
                window.drawSegment(
                    dragRef.current.prevDrawPoint.x,
                    dragRef.current.prevDrawPoint.y,
                    pointerPoint.x,
                    pointerPoint.y,
                    activeColor,
                    activeSize
                );
            }
            dragRef.current.prevDrawPoint = pointerPoint;
        }

        updateStore({ x: newX, y: newY });
    }, [isPenSprite, penColor, updateStore]);

    const endDrag = useCallback(() => {
        setIsDragging(false);
        if (onDragStateChange) onDragStateChange(false);
        if (!dragRef.current.didDrag && onClick) {
            onClick();
        }
    }, [onClick, onDragStateChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const stageEl = e.currentTarget.parentElement;
        dragRef.current.stageEl = stageEl;
        startDrag(e.clientX, e.clientY);

        const handleMouseMove = (me: MouseEvent) => {
            me.preventDefault();
            moveDrag(me.clientX, me.clientY);
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            endDrag();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [startDrag, moveDrag, endDrag]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        const stageEl = e.currentTarget.parentElement;
        dragRef.current.stageEl = stageEl;
        startDrag(touch.clientX, touch.clientY);

        const handleTouchMove = (te: TouchEvent) => {
            te.preventDefault();
            const t = te.touches[0];
            moveDrag(t.clientX, t.clientY);
        };
        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            endDrag();
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }, [startDrag, moveDrag, endDrag]);

    return {
        isDragging,
        handleMouseDown,
        handleTouchStart,
    };
}
