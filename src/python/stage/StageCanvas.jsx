import React from "react";
import Teddy from "../../junior/sprites/Teddy";

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

const scratchToPixel = (scratchX, scratchY, stageW, stageH, spriteSize = 80) => {
    // Scale factor: 480 Scratch units = stageW pixels
    const scaleX = stageW / 480;
    const scaleY = stageH / 360;
    
    // Convert: pixelX = centerX + (scratchX * scaleX) - halfSpriteSize
    // Convert: pixelY = centerY - (scratchY * scaleY) - halfSpriteSize (Y is inverted)
    const pixelX = (stageW / 2) + (scratchX * scaleX) - (spriteSize / 2);
    const pixelY = (stageH / 2) - (scratchY * scaleY) - (spriteSize / 2);
    
    return { pixelX, pixelY };
};

const pixelToScratch = (pixelX, pixelY, stageW, stageH, spriteSize = 80) => {
    const scaleX = stageW / 480;
    const scaleY = stageH / 360;
    
    // Solve for scratchX: scratchX = (pixelX - centerX + halfSpriteSize) / scaleX
    // Solve for scratchY: scratchY = (centerY - pixelY - halfSpriteSize) / scaleY
    const scratchX = (pixelX - (stageW / 2) + (spriteSize / 2)) / scaleX;
    const scratchY = ((stageH / 2) - pixelY - (spriteSize / 2)) / scaleY;
    
    return { scratchX, scratchY };
};

export default function StageCanvas({ sprites, selectedSpriteId, setSelectedSpriteId, backdrop, stageRef, stageSize }) {
    return (
        <div style={{ flex: 1, position: "relative", background: backdrop ? "transparent" : "#fff", overflow: "hidden" }}>
            {/* Backdrop image */}
            {backdrop && <img src={backdrop} alt="backdrop" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}} />}
            
            {/* Stage coordinate grid (for debugging) */}
            {/* <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.1)" }} />
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.1)" }} />
            </div> */}
            
            {/* Sprites - using position object with x/y */}
            <div style={{ width: "100%", height: "100%", position: "relative" }} ref={stageRef}>
                {sprites.map(sp => {
                    if (!sp.visible) return null;
                    
                    // Get position from either position object or direct x/y
                    const scratchX = sp.position?.x ?? sp.x ?? 0;
                    const scratchY = sp.position?.y ?? sp.y ?? 0;
                    const angle = sp.direction ?? sp.angle ?? 0;
                    const size = sp.size ?? 100;
                    
                    // Convert Scratch coords to pixel coords
                    const { pixelX, pixelY } = scratchToPixel(scratchX, scratchY, stageSize.w, stageSize.h);
                    
                    return (
                        <Teddy 
                            key={sp.id} 
                            id={sp.id} 
                            type={sp.type} 
                            active={sp.id === selectedSpriteId}
                            x={pixelX}
                            y={pixelY}
                            angle={angle} 
                            size={size}
                            visible={sp.visible} 
                            currentCostume={sp.currentCostume}
                            costumes={sp.costumes} 
                            speech={sp.speech}
                            onClick={() => setSelectedSpriteId(sp.id)}
                            onDragStateChange={(dragging) => {
                                // Drag updates are handled by Teddy via window.updateSprite
                            }} 
                        />
                    );
                })}
            </div>
        </div>
    );
}

// Export helpers for use in other components
export { scratchToPixel, pixelToScratch };
