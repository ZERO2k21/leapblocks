/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";

// ─── Coordinate Conversion Helpers ─────────────────────────────────────────
// leap coordinates: center is (0,0), X ranges -240 to 240, Y ranges -180 to 180
// Pixel coordinates: top-left is (0,0), Y increases downward

const leapToPixel = (leapX, leapY, stageW, stageH, spriteSize = 60) => {
    // Scale factor: 480 leap units = stageW pixels
    const scaleX = stageW / 480;
    const scaleY = stageH / 360;

    // Convert: pixelX = centerX + (leapX * scaleX) - halfSpriteSize
    // Convert: pixelY = centerY - (leapY * scaleY) - halfSpriteSize (Y is inverted)
    const pixelX = (stageW / 2) + (leapX * scaleX) - (spriteSize / 2);
    const pixelY = (stageH / 2) - (leapY * scaleY) - (spriteSize / 2);

    return { pixelX, pixelY };
};

const pixelToleap = (pixelX, pixelY, stageW, stageH, spriteSize = 60) => {
    const scaleX = stageW / 480;
    const scaleY = stageH / 360;

    // Solve for leapX: leapX = (pixelX - centerX + halfSpriteSize) / scaleX
    // Solve for leapY: leapY = (centerY - pixelY - halfSpriteSize) / scaleY
    const leapX = (pixelX - (stageW / 2) + (spriteSize / 2)) / scaleX;
    const leapY = ((stageH / 2) - pixelY - (spriteSize / 2)) / scaleY;

    return { leapX, leapY };
};

// Simple sprite renderer for Python IDE
const SpriteRenderer = ({ sprite, isSelected, onClick, stageWidth, stageHeight, isDragging, setIsDragging, setDraggingSpriteId, draggingSpriteId, updateSpriteProperty, stageRef }) => {
    const leapX = sprite.position?.x ?? sprite.x ?? 0;
    const leapY = sprite.position?.y ?? sprite.y ?? 0;
    const angle = sprite.direction ?? sprite.angle ?? 0;
    const size = sprite.size ?? 100;
    const isVisible = sprite.visible !== false;

    const { pixelX, pixelY } = leapToPixel(leapX, leapY, stageWidth, stageHeight);

    const costumes = sprite.costumes || {};
    const currentCostume = sprite.currentCostume || 'default';
    const costumeValue = costumes[currentCostume] || costumes.default || 'assets/sprites/robot/robot_idle.svg';

    const isImage = costumeValue.includes('/') || costumeValue.endsWith('.png') || costumeValue.endsWith('.svg') || costumeValue.endsWith('.jpg');

    if (!isVisible) return null;

    const dragRef = { startX: 0, startY: 0, origLeapX: 0, origLeapY: 0, didDrag: false };

    const getPointerPos = (clientX, clientY) => {
        const stageEl = stageRef?.current;
        if (!stageEl) return { px: 0, py: 0 };
        const rect = stageEl.getBoundingClientRect();
        return {
            px: clientX - rect.left,
            py: clientY - rect.top,
        };
    };

    const startDrag = (clientX, clientY) => {
        const { px, py } = getPointerPos(clientX, clientY);
        dragRef.startX = px;
        dragRef.startY = py;
        dragRef.origLeapX = leapX;
        dragRef.origLeapY = leapY;
        dragRef.didDrag = false;
        setIsDragging(true);
        setDraggingSpriteId(sprite.id);
    };

    const moveDrag = (clientX, clientY) => {
        const { px, py } = getPointerPos(clientX, clientY);
        const dx = px - dragRef.startX;
        const dy = py - dragRef.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragRef.didDrag = true;
        }
        const scaleX = stageWidth / 480;
        const scaleY = stageHeight / 360;
        const newLeapX = dragRef.origLeapX + dx / scaleX;
        const newLeapY = dragRef.origLeapY - dy / scaleY;
        updateSpriteProperty?.(sprite.id, 'x', Math.round(newLeapX));
        updateSpriteProperty?.(sprite.id, 'y', Math.round(newLeapY));
    };

    const endDrag = () => {
        setIsDragging(false);
        setDraggingSpriteId(null);
    };

    const handleMouseDown = (e) => {
        e.stopPropagation();
        startDrag(e.clientX, e.clientY);
        const handleMove = (me) => { me.preventDefault(); moveDrag(me.clientX, me.clientY); };
        const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            endDrag();
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    };

    const handleTouchStart = (e) => {
        e.stopPropagation();
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
        const handleMove = (te) => { te.preventDefault(); const t = te.touches[0]; moveDrag(t.clientX, t.clientY); };
        const handleEnd = () => {
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
            endDrag();
        };
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    };

    return (
        <div
            onClick={onClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`absolute w-[60px] h-[60px] flex items-center justify-center touch-none select-none ${
                isDragging && draggingSpriteId === sprite.id ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
                left: pixelX,
                top: pixelY,
                transform: `rotate(${angle}deg) scale(${size / 100})`,
                zIndex: isSelected || (isDragging && draggingSpriteId === sprite.id) ? 20 : 10,
                filter: isSelected || (isDragging && draggingSpriteId === sprite.id)
                    ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                transition: isDragging && draggingSpriteId === sprite.id ? 'none' : 'all 0.2s ease',
            }}
        >
            {isImage ? (
                <img
                    src={costumeValue}
                    alt={sprite.name}
                    className="w-full h-full object-contain pointer-events-none"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <span className="text-[40px] leading-none pointer-events-none">{costumeValue}</span>
            )}
            {sprite.speech && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 rounded-xl px-2 py-1 mb-2 whitespace-nowrap text-xs font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-30 pointer-events-none">
                    {sprite.speech}
                </div>
            )}
            {isSelected && (
                <div className="absolute -inset-1 border-2 border-dashed border-[#8B5CF6] rounded-lg pointer-events-none" />
            )}
        </div>
    );
};

export default function StageCanvas({ sprites, selectedSpriteId, setSelectedSpriteId, backdrop, stageRef, stageSize, updateSpriteProperty }) {
    // Dragging state for sprite highlight on drag
    const [draggingSpriteId, setDraggingSpriteId] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);

    // Use stageSize from props or default to 480x310 (matching STAGE_CONFIG)
    const stageWidth = stageSize?.w || 480;
    const stageHeight = stageSize?.h || 310;

    const handlePointerUp = () => {
        setIsDragging(false);
        setDraggingSpriteId(null);
    };

    return (
        <div
            className={`w-full h-full relative overflow-hidden rounded-lg touch-none ${
                backdrop ? "bg-transparent" : "bg-[#F5F5F5]"
            }`}
            ref={stageRef}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchEnd={handlePointerUp}
        >
            {/* Backdrop image */}
            {backdrop && (
                <img
                    src={backdrop}
                    alt="backdrop"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
            )}

            {/* Stage coordinate grid (subtle) */}
            <div className="absolute inset-0 pointer-events-none z-[1] opacity-20">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400" />
            </div>

            {/* Sprites */}
            <div className="absolute inset-0 z-[2]">
                {sprites.map(sp => (
                    <SpriteRenderer
                        key={sp.id}
                        sprite={sp}
                        isSelected={sp.id === selectedSpriteId}
                        onClick={() => setSelectedSpriteId(sp.id)}
                        stageWidth={stageWidth}
                        stageHeight={stageHeight}
                        isDragging={isDragging}
                        setIsDragging={setIsDragging}
                        setDraggingSpriteId={setDraggingSpriteId}
                        draggingSpriteId={draggingSpriteId}
                        updateSpriteProperty={updateSpriteProperty}
                        stageRef={stageRef}
                    />
                ))}

                {/* Empty state message when no sprites */}
                {sprites.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xs">
                        <img src="assets/sprites/robot/robot_idle.svg" alt="Empty stage" className="w-16 h-16 opacity-50 mb-2" />
                        <span>No sprites yet</span>
                        <span className="text-[10px]">Click "Add Sprite" to get started</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export helpers for use in other components
export { leapToPixel, pixelToleap };
