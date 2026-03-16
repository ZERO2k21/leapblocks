import React from "react";
import StageCanvas from "../stage/StageCanvas";
import SpriteList from "../stage/SpriteList";
import SpriteProperties from "../stage/SpriteProperties";
import { RotateCcw, Maximize, Eye, EyeOff, Plus } from "lucide-react";

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

export default function StagePanel({ 
    stageView, 
    setStageView, 
    sprites, 
    selectedSpriteId, 
    setSelectedSpriteId, 
    backdrop, 
    stageRef, 
    stageSize, 
    setShowSpriteLibrary,
    updateSpriteProperty,
    resetStage,
    BACKDROP_LIBRARY,
    handleSetBackdrop
}) {
    return (
        <div style={{ width: 380, display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.BORDER}`, background: "#fff", flexShrink: 0 }}>
            {/* Stage Controls */}
            <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px", background: C.PURPLE, gap: 8 }}>
                {["stage", "sprites", "backdrops"].map(v => (
                    <div key={v} onClick={() => setStageView(v)}
                        style={{ 
                            padding: "6px 14px", 
                            borderRadius: 6, 
                            cursor: "pointer", 
                            fontSize: 12, 
                            fontWeight: 600, 
                            background: stageView === v ? "rgba(255,255,255,0.2)" : "transparent", 
                            color: "#fff",
                            transition: "all 0.2s"
                        }}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </div>
                ))}
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <div onClick={resetStage} title="Reset Stage" style={{ cursor: "pointer", color: "#fff", padding: 6, borderRadius: 6, background: "rgba(255,255,255,0.1)" }}>
                        <RotateCcw size={16} />
                    </div>
                    <div title="Fullscreen" style={{ cursor: "pointer", color: "#fff", padding: 6, borderRadius: 6, background: "rgba(255,255,255,0.1)" }}>
                        <Maximize size={16} />
                    </div>
                </div>
            </div>

            {/* Stage Canvas */}
            {stageView === "stage" && (
                <StageCanvas 
                    sprites={sprites}
                    selectedSpriteId={selectedSpriteId}
                    setSelectedSpriteId={setSelectedSpriteId}
                    backdrop={backdrop}
                    stageRef={stageRef}
                    stageSize={stageSize}
                />
            )}

            {/* Sprites Panel */}
            {stageView === "sprites" && (
                <SpriteList 
                    sprites={sprites}
                    selectedSpriteId={selectedSpriteId}
                    setSelectedSpriteId={setSelectedSpriteId}
                    setShowSpriteLibrary={setShowSpriteLibrary}
                    updateSpriteProperty={updateSpriteProperty}
                />
            )}

            {/* Backdrops Panel */}
            {stageView === "backdrops" && (
                <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase" }}>Choose Backdrop</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {BACKDROP_LIBRARY.map(bd => (
                            <div key={bd.name} onClick={() => handleSetBackdrop(bd)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    padding: "10px",
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    background: backdrop === bd.img ? C.LIGHT_PURPLE : "#fff",
                                    border: `2px solid ${backdrop === bd.img ? C.PURPLE : "#E0E0E0"}`,
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { if (backdrop !== bd.img) { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#C0C0C0"; }}}
                                onMouseLeave={e => { if (backdrop !== bd.img) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E0E0E0"; }}}
                            >
                                <div style={{
                                    width: "100%",
                                    height: 60,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    background: bd.img ? "#ddd" : "#F5F5F5",
                                    border: "1px solid #E0E0E0"
                                }}>
                                    {bd.img && <img src={bd.img} alt={bd.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                    {!bd.img && <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#999" }}>Blank</div>}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.TEXT, textAlign: "center" }}>{bd.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sprite List (below stage) */}
            <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "12px", background: "#fff", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, maxHeight: 200, overflowY: "auto" }}>
                {sprites.map(sp => (
                    <div key={sp.id} onClick={() => setSelectedSpriteId(sp.id)}
                        style={{ 
                            padding: "8px 10px", 
                            background: selectedSpriteId === sp.id ? C.LIGHT_PURPLE : "#F9FAFB", 
                            border: `2px solid ${selectedSpriteId === sp.id ? C.PURPLE : "#E5E7EB"}`, 
                            borderRadius: 8, 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.15s"
                        }}>
                        <img src={sp.costumes[sp.currentCostume]} style={{ width: 40, height: 40, objectFit: "contain" }} alt={sp.name} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.TEXT }}>{sp.name}</div>
                            <div style={{ fontSize: 10, color: C.MUTED }}>x: {Math.round(sp.x)}, y: {Math.round(sp.y)}</div>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); updateSpriteProperty(sp.id, 'visible', !sp.visible); }}
                            style={{ 
                                padding: 4, 
                                borderRadius: 4, 
                                cursor: "pointer", 
                                color: sp.visible ? C.PURPLE : "#999",
                                background: sp.visible ? C.LIGHT_PURPLE : "transparent"
                            }}>
                            {sp.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </div>
                    </div>
                ))}
                <button onClick={() => setShowSpriteLibrary(true)}
                    style={{ 
                        padding: "10px", 
                        background: "#F9FAFB", 
                        border: `2px dashed #D1D5DB`, 
                        borderRadius: 8, 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        color: C.PURPLE,
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.LIGHT_PURPLE; e.currentTarget.style.borderColor = C.PURPLE; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
                >
                    <Plus size={18} />
                    <span>Add Sprite</span>
                </button>
            </div>

            {/* Sprite Properties */}
            <SpriteProperties 
                selectedSprite={sprites.find(s => s.id === selectedSpriteId)}
                selectedSpriteId={selectedSpriteId}
                updateSpriteProperty={updateSpriteProperty}
            />
        </div>
    );
}
