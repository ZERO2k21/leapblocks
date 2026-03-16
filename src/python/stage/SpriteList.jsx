import React from "react";
import { Plus, Eye, EyeOff } from "lucide-react";

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

export default function SpriteList({ sprites, selectedSpriteId, setSelectedSpriteId, setShowSpriteLibrary, updateSpriteProperty }) {
    return (
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.TEXT, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Sprites ({sprites.length})</span>
                <button onClick={() => setShowSpriteLibrary(true)}
                    style={{
                        padding: "6px 12px",
                        background: C.PURPLE,
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.DARK_PURPLE; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.PURPLE; }}
                >
                    <Plus size={14} /> Add Sprite
                </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12, flex: 1 }}>
                {sprites.map(sp => (
                    <div key={sp.id} onClick={() => setSelectedSpriteId(sp.id)}
                        style={{ 
                            padding: "12px 8px", 
                            background: selectedSpriteId === sp.id ? C.LIGHT_PURPLE : "#F9FAFB", 
                            border: `2px solid ${selectedSpriteId === sp.id ? C.PURPLE : "#E5E7EB"}`, 
                            borderRadius: 10, 
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.15s",
                            position: "relative"
                        }}
                        onMouseEnter={e => { if (selectedSpriteId !== sp.id) { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.borderColor = "#C0C0C0"; }}}
                        onMouseLeave={e => { if (selectedSpriteId !== sp.id) { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#E5E7EB"; }}}
                    >
                        <div style={{ 
                            width: 72, 
                            height: 72, 
                            background: "#fff", 
                            borderRadius: 8, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            border: "1px solid #E5E7EB",
                            flexShrink: 0,
                            overflow: "hidden"
                        }}>
                            <img src={sp.costumes[sp.currentCostume]} style={{ width: 64, height: 64, objectFit: "contain" }} alt={sp.name} />
                        </div>
                        <div style={{ width: "100%", textAlign: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.TEXT, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sp.name}</div>
                            <div style={{ fontSize: 10, color: C.MUTED }}>x: {Math.round(sp.position?.x ?? sp.x ?? 0)}, y: {Math.round(sp.position?.y ?? sp.y ?? 0)}</div>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); updateSpriteProperty(sp.id, 'visible', !sp.visible); }}
                            style={{ 
                                position: "absolute",
                                top: 6,
                                right: 6,
                                padding: 4, 
                                borderRadius: 4, 
                                cursor: "pointer", 
                                color: sp.visible ? C.PURPLE : "#999",
                                background: sp.visible ? C.LIGHT_PURPLE : "#F3F4F6",
                                transition: "all 0.15s"
                            }}
                            title={sp.visible ? "Hide sprite" : "Show sprite"}
                        >
                            {sp.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
