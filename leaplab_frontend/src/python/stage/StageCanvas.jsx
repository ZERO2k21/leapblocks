/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";

// ─── Theme (Leapblocks Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    LIGHT_PURPLE: "#EDE9FE",
    PURPLE_BG: "#F5F3FF",
    BORDER: "#E5E7EB",
    BG: "#F9FAFB",
    BG2: "#F3F4F6",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
    RED: "#EF4444",
    BLUE: "#3B82F6",
    ORANGE: "#F59E0B",
    ACCENT: "#8B5CF6",
    HEADER_BG: "#8B5CF6",
};

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
            style={{
                position: 'absolute',
                left: pixelX,
                top: pixelY,
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDragging && draggingSpriteId === sprite.id ? 'grabbing' : 'grab',
                transform: `rotate(${angle}deg) scale(${size / 100})`,
                zIndex: isSelected || (isDragging && draggingSpriteId === sprite.id) ? 20 : 10,
                filter: isSelected || (isDragging && draggingSpriteId === sprite.id)
                    ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                transition: isDragging && draggingSpriteId === sprite.id ? 'none' : 'all 0.2s ease',
                touchAction: 'none',
                userSelect: 'none',
            }}
        >
            {isImage ? (
                <img
                    src={costumeValue}
                    alt={sprite.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            ) : (
                <span style={{ fontSize: 40, lineHeight: 1, pointerEvents: 'none' }}>{costumeValue}</span>
            )}
            {sprite.speech && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'white',
                    border: '2px solid #333',
                    borderRadius: '10px',
                    padding: '4px 8px',
                    marginBottom: '8px',
                    whiteSpace: 'nowrap',
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 30,
                    pointerEvents: 'none',
                }}>
                    {sprite.speech}
                </div>
            )}
            {isSelected && (
                <div style={{
                    position: 'absolute',
                    inset: -4,
                    border: '2px dashed #8B5CF6',
                    borderRadius: 8,
                    pointerEvents: 'none'
                }} />
            )}
        </div>
    );
};

export default function StageCanvas({ sprites, selectedSpriteId, setSelectedSpriteId, backdrop, stageRef, stageSize, updateSpriteProperty }) {
    // Dragging state for sprite highlight on drag
    const [draggingSpriteId, setDraggingSpriteId] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);

    // Use stageSize from props or default to 356x240
    const stageWidth = stageSize?.w || 356;
    const stageHeight = stageSize?.h || 240;

    const handlePointerUp = () => {
        setIsDragging(false);
        setDraggingSpriteId(null);
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: "relative",
                background: backdrop ? "transparent" : "#F5F5F5",
                overflow: "hidden",
                borderRadius: 8,
                touchAction: 'none',
            }}
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
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 0
                    }}
                />
            )}

            {/* Stage coordinate grid (subtle) */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.2 }}>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#999" }} />
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#999" }} />
            </div>

            {/* Sprites */}
            <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
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
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: 12
                    }}>
                        <img src="assets/sprites/robot/robot_idle.svg" alt="Empty stage" style={{ width: 64, height: 64, opacity: 0.5, marginBottom: 8 }} />
                        <span>No sprites yet</span>
                        <span style={{ fontSize: 10 }}>Click "Add Sprite" to get started</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export helpers for use in other components
export { leapToPixel, pixelToleap };
