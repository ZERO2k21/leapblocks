import React from "react";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function SpriteProperties({ selectedSprite, selectedSpriteId, updateSpriteProperty }) {
    // Get position values (support both old x/y and new position.x/position.y)
    const spriteX = selectedSprite?.position?.x ?? selectedSprite?.x ?? 0;
    const spriteY = selectedSprite?.position?.y ?? selectedSprite?.y ?? 0;
    const spriteDirection = selectedSprite?.direction ?? selectedSprite?.angle ?? 0;
    
    // Get costume list for switching
    const costumeKeys = Object.keys(selectedSprite?.costumes || {});
    const currentCostumeIndex = costumeKeys.indexOf(selectedSprite?.currentCostume);
    
    const handlePrevCostume = () => {
        if (costumeKeys.length <= 1) return;
        const newIndex = currentCostumeIndex <= 0 ? costumeKeys.length - 1 : currentCostumeIndex - 1;
        updateSpriteProperty(selectedSpriteId, 'currentCostume', costumeKeys[newIndex]);
    };
    
    const handleNextCostume = () => {
        if (costumeKeys.length <= 1) return;
        const newIndex = (currentCostumeIndex + 1) % costumeKeys.length;
        updateSpriteProperty(selectedSpriteId, 'currentCostume', costumeKeys[newIndex]);
    };
    
    return (
        <div style={{ borderTop: "1px solid #E0E0E0", padding: "10px 12px", background: "#fff", flexShrink: 0 }}>
            {/* Sprite Name Row (PictoBlox Style) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#666", minWidth: 40 }}>Sprite</span>
                <input 
                    type="text" 
                    value={selectedSprite?.name || ''} 
                    onChange={e => updateSpriteProperty(selectedSpriteId, 'name', e.target.value)}
                    style={{ 
                        flex: 1, 
                        padding: "5px 8px", 
                        border: "1px solid #E0E0E0", 
                        borderRadius: 4, 
                        fontSize: 12, 
                        fontWeight: 600,
                        background: "#F5F5F5",
                        color: "#333"
                    }}
                />
            </div>
            
            {/* Position Row (PictoBlox Style) */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#666" }}>↔</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#666" }}>x</span>
                <input 
                    type="number" 
                    value={Math.round(spriteX)} 
                    onChange={e => updateSpriteProperty(selectedSpriteId, 'x', parseFloat(e.target.value) || 0)}
                    style={{ 
                        width: 50, 
                        padding: "4px 6px", 
                        border: "1px solid #E0E0E0", 
                        borderRadius: 4, 
                        fontSize: 11, 
                        fontWeight: 600,
                        background: "#F5F5F5",
                        textAlign: "center",
                        color: "#333"
                    }}
                />
                <span style={{ fontSize: 11, color: "#666" }}>↕</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#666" }}>y</span>
                <input 
                    type="number" 
                    value={Math.round(spriteY)} 
                    onChange={e => updateSpriteProperty(selectedSpriteId, 'y', parseFloat(e.target.value) || 0)}
                    style={{ 
                        width: 50, 
                        padding: "4px 6px", 
                        border: "1px solid #E0E0E0", 
                        borderRadius: 4, 
                        fontSize: 11, 
                        fontWeight: 600,
                        background: "#F5F5F5",
                        textAlign: "center",
                        color: "#333"
                    }}
                />
            </div>
            
            {/* Show/Hide, Size, Direction Row (PictoBlox Style) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                {/* Show/Hide Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#666" }}>Show</span>
                    <div style={{ display: "flex", gap: 2 }}>
                        <button onClick={() => updateSpriteProperty(selectedSpriteId, 'visible', true)}
                            style={{ 
                                padding: "4px 6px", 
                                background: selectedSprite?.visible ? "#6B46C1" : "#F5F5F5", 
                                border: `1px solid ${selectedSprite?.visible ? "#6B46C1" : "#E0E0E0"}`, 
                                borderRadius: 4, 
                                cursor: "pointer",
                                color: selectedSprite?.visible ? "#fff" : "#999"
                            }}>
                            <Eye size={12} />
                        </button>
                        <button onClick={() => updateSpriteProperty(selectedSpriteId, 'visible', false)}
                            style={{ 
                                padding: "4px 6px", 
                                background: !selectedSprite?.visible ? "#6B46C1" : "#F5F5F5", 
                                border: `1px solid ${!selectedSprite?.visible ? "#6B46C1" : "#E0E0E0"}`, 
                                borderRadius: 4, 
                                cursor: "pointer",
                                color: !selectedSprite?.visible ? "#fff" : "#999"
                            }}>
                            <EyeOff size={12} />
                        </button>
                    </div>
                </div>
                
                {/* Size */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#666" }}>Size</span>
                    <input 
                        type="number" 
                        value={selectedSprite?.size || 100} 
                        onChange={e => updateSpriteProperty(selectedSpriteId, 'size', parseFloat(e.target.value) || 100)}
                        style={{ 
                            width: 50, 
                            padding: "4px 6px", 
                            border: "1px solid #E0E0E0", 
                            borderRadius: 4, 
                            fontSize: 11, 
                            fontWeight: 600,
                            background: "#F5F5F5",
                            textAlign: "center",
                            color: "#333"
                        }}
                    />
                </div>
                
                {/* Direction */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#666" }}>Direction</span>
                    <input 
                        type="number" 
                        value={spriteDirection} 
                        onChange={e => updateSpriteProperty(selectedSpriteId, 'direction', parseFloat(e.target.value) || 0)}
                        style={{ 
                            width: 50, 
                            padding: "4px 6px", 
                            border: "1px solid #E0E0E0", 
                            borderRadius: 4, 
                            fontSize: 11, 
                            fontWeight: 600,
                            background: "#F5F5F5",
                            textAlign: "center",
                            color: "#333"
                        }}
                    />
                </div>
            </div>
            
            {/* Costume Switcher Row */}
            {costumeKeys.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #E0E0E0" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#666", minWidth: 50 }}>Costume</span>
                    <button 
                        onClick={handlePrevCostume}
                        style={{ 
                            padding: "4px 6px", 
                            background: "#F5F5F5", 
                            border: "1px solid #E0E0E0", 
                            borderRadius: 4, 
                            cursor: "pointer",
                            color: "#666",
                            display: "flex",
                            alignItems: "center"
                        }}>
                        <ChevronLeft size={14} />
                    </button>
                    <span style={{ 
                        fontSize: 11, 
                        fontWeight: 600, 
                        color: "#333",
                        flex: 1,
                        textAlign: "center",
                        background: "#F5F5F5",
                        padding: "4px 8px",
                        borderRadius: 4,
                        border: "1px solid #E0E0E0"
                    }}>
                        {selectedSprite?.currentCostume || 'default'} ({currentCostumeIndex + 1}/{costumeKeys.length})
                    </span>
                    <button 
                        onClick={handleNextCostume}
                        style={{ 
                            padding: "4px 6px", 
                            background: "#F5F5F5", 
                            border: "1px solid #E0E0E0", 
                            borderRadius: 4, 
                            cursor: "pointer",
                            color: "#666",
                            display: "flex",
                            alignItems: "center"
                        }}>
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
