import { useState, useRef } from 'react';

const SPRITE_BOX_SIZE = 80;
const SPRITE_CENTER = SPRITE_BOX_SIZE / 2;
const PEN_TIP_LOCAL = { x: 7, y: 79 };

export function getPenTipOffset(
    currentAngle = 0,
    currentSize = 100,
    currentScaleX = 1,
    currentMirrored = false
) {
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

export default function useSpriteDrag({
    x, y, angle, size, scaleX, mirrored, onClick, onDragStateChange,
    isPenSprite, updateStore, penColor, isPenDown,
}) {
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, didDrag: false });

    const startDrag = (clientX, clientY) => {
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
        };

        setIsDragging(true);
        if (onDragStateChange) onDragStateChange(true);
    };

    const moveDrag = (clientX, clientY) => {
        const dx = clientX - dragRef.current.startX;
        const dy = clientY - dragRef.current.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragRef.current.didDrag = true;
        }
        const pointerPoint = {
            x: clientX - dragRef.current.parentLeft,
            y: clientY - dragRef.current.parentTop
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
    };

    const endDrag = () => {
        setIsDragging(false);
        if (onDragStateChange) onDragStateChange(false);
        if (!dragRef.current.didDrag && onClick) {
            onClick();
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const stageEl = e.currentTarget.parentElement;
        dragRef.current.stageEl = stageEl;
        startDrag(e.clientX, e.clientY);

        const handleMouseMove = (me) => {
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
    };

    const handleTouchStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        const stageEl = e.currentTarget.parentElement;
        dragRef.current.stageEl = stageEl;
        startDrag(touch.clientX, touch.clientY);

        const handleTouchMove = (te) => {
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
    };

    return {
        isDragging,
        handleMouseDown,
        handleTouchStart,
    };
}
