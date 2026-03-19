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
// Scratch coordinates: center is (0,0), X ranges -240 to 240, Y ranges -180 to 180
// Pixel coordinates: top-left is (0,0), Y increases downward

const scratchToPixel = (scratchX, scratchY, stageW, stageH, spriteSize = 60) => {
    // Scale factor: 480 Scratch units = stageW pixels
    const scaleX = stageW / 480;
    const scaleY = stageH / 360;
    
    // Convert: pixelX = centerX + (scratchX * scaleX) - halfSpriteSize
    // Convert: pixelY = centerY - (scratchY * scaleY) - halfSpriteSize (Y is inverted)
    const pixelX = (stageW / 2) + (scratchX * scaleX) - (spriteSize / 2);
    const pixelY = (stageH / 2) - (scratchY * scaleY) - (spriteSize / 2);
    
    return { pixelX, pixelY };
};

const pixelToScratch = (pixelX, pixelY, stageW, stageH, spriteSize = 60) => {
    const scaleX = stageW / 480;
    const scaleY = stageH / 360;
    
    // Solve for scratchX: scratchX = (pixelX - centerX + halfSpriteSize) / scaleX
    // Solve for scratchY: scratchY = (centerY - pixelY - halfSpriteSize) / scaleY
    const scratchX = (pixelX - (stageW / 2) + (spriteSize / 2)) / scaleX;
    const scratchY = ((stageH / 2) - pixelY - (spriteSize / 2)) / scaleY;
    
    return { scratchX, scratchY };
};

// Simple sprite renderer for Python IDE
const SpriteRenderer = ({ sprite, isSelected, onClick, stageWidth, stageHeight, isDragging, setIsDragging, setDraggingSpriteId, draggingSpriteId }) => {
    const scratchX = sprite.position?.x ?? sprite.x ?? 0;
    const scratchY = sprite.position?.y ?? sprite.y ?? 0;
    const angle = sprite.direction ?? sprite.angle ?? 0;
    const size = sprite.size ?? 100;
    const isVisible = sprite.visible !== false;
    
    // Convert Scratch coords to pixel coords
    const { pixelX, pixelY } = scratchToPixel(scratchX, scratchY, stageWidth, stageHeight);
    
    // Get current costume
    const costumes = sprite.costumes || {};
    const currentCostume = sprite.currentCostume || 'default';
    const costumeValue = costumes[currentCostume] || costumes.default || '/assets/sprites/robot/robot_idle.svg';
    
    // Determine if it's an image path or emoji
    const isImage = costumeValue.includes('/') || costumeValue.endsWith('.png') || costumeValue.endsWith('.svg') || costumeValue.endsWith('.jpg');
    
    if (!isVisible) return null;
    
    const handleMouseDown = (e) => {
        e.stopPropagation();
        setIsDragging(true);
        setDraggingSpriteId(sprite.id);
    };

    return (
        <div
            onClick={onClick}
            onMouseDown={handleMouseDown}
            style={{
                position: 'absolute',
                left: pixelX,
                top: pixelY,
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transform: `rotate(${angle}deg) scale(${size / 100})`,
                zIndex: isSelected || (isDragging && draggingSpriteId === sprite.id) ? 20 : 10,
                filter: isSelected || (isDragging && draggingSpriteId === sprite.id)
                    ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                transition: 'all 0.2s ease',
            }}
        >
            {isImage ? (
                <img 
                    src={costumeValue} 
                    alt={sprite.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            ) : (
                <span style={{ fontSize: 40, lineHeight: 1 }}>{costumeValue}</span>
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
                    zIndex: 30
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

export default function StageCanvas({ sprites, selectedSpriteId, setSelectedSpriteId, backdrop, stageRef, stageSize }) {
    // Dragging state for sprite highlight on drag
    const [draggingSpriteId, setDraggingSpriteId] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);

    // Use stageSize from props or default to 356x240
    const stageWidth = stageSize?.w || 356;
    const stageHeight = stageSize?.h || 240;

    const handleMouseUp = () => {
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
                borderRadius: 8
            }}
            ref={stageRef}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                        <img src="/assets/sprites/robot/robot_idle.svg" alt="Empty stage" style={{ width: 64, height: 64, opacity: 0.5, marginBottom: 8 }} />
                        <span>No sprites yet</span>
                        <span style={{ fontSize: 10 }}>Click "Add Sprite" to get started</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export helpers for use in other components
export { scratchToPixel, pixelToScratch };
