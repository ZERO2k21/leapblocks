import React from "react";
import { Plus, Trash2 } from "lucide-react";
import StageCanvas from "../stage/StageCanvas";
import SpriteProperties from "../stage/SpriteProperties";

const C = {
    PURPLE: "#8B5CF6",
    LIGHT_PURPLE: "#EDE9FE",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

const getSpritePreview = (sprite) => {
    const costumes = sprite?.costumes || {};
    return costumes[sprite?.currentCostume] || costumes.default || sprite?.img || null;
};

export default function StagePanel({
    sprites,
    selectedSpriteId,
    setSelectedSpriteId,
    backdrop,
    stageRef,
    stageSize,
    setShowSpriteLibrary,
    updateSpriteProperty,
    BACKDROP_LIBRARY,
    handleSetBackdrop,
    deleteSprite,
}) {
    const [showSprites, setShowSprites] = React.useState(true);
    const [showBackdrops, setShowBackdrops] = React.useState(true);
    const selectedSprite = sprites.find((sprite) => sprite.id === selectedSpriteId) || sprites[0] || null;

    return (
        <div style={{ width: 380, display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.BORDER}`, background: "#fff", flexShrink: 0, minHeight: 0, overflowY: "auto" }}>
            <div style={{ padding: "12px", borderBottom: `1px solid ${C.BORDER}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.MUTED, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Stage
                </div>
                <div style={{ width: "100%", height: 240, border: `1px solid ${C.BORDER}`, borderRadius: 10, overflow: "hidden", background: "#F5F5F5" }}>
                    <StageCanvas
                        sprites={sprites}
                        selectedSpriteId={selectedSpriteId}
                        setSelectedSpriteId={setSelectedSpriteId}
                        backdrop={backdrop}
                        stageRef={stageRef}
                        stageSize={stageSize || { w: 356, h: 240 }}
                    />
                </div>
            </div>

            <SpriteProperties
                selectedSprite={selectedSprite}
                selectedSpriteId={selectedSpriteId}
                updateSpriteProperty={updateSpriteProperty}
            />

            <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setShowSprites(prev => !prev)}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.MUTED, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Sprites
                    </span>
                    <span style={{ fontSize: 11, color: C.MUTED }}>{showSprites ? "▼" : "►"}</span>
                </div>

                {showSprites && (
                    <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: C.MUTED }}>&nbsp;</span>
                            <button
                                onClick={() => setShowSpriteLibrary(true)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 10px",
                                    border: "none",
                                    borderRadius: 6,
                                    background: C.PURPLE,
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                <Plus size={12} />
                                Add Sprite
                            </button>
                        </div>

                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                    {sprites.map((sprite) => {
                        const preview = getSpritePreview(sprite);
                        const isSelected = sprite.id === selectedSpriteId;

                        return (
                            <div
                                key={sprite.id}
                                onClick={() => setSelectedSpriteId(sprite.id)}
                                style={{
                                    minWidth: 86,
                                    padding: 8,
                                    borderRadius: 10,
                                    border: `2px solid ${isSelected ? C.PURPLE : "#E5E7EB"}`,
                                    background: isSelected ? C.LIGHT_PURPLE : "#F9FAFB",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 6,
                                    position: "relative",
                                }}
                            >
                                {sprites.length > 1 && isSelected && (
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            deleteSprite?.(sprite.id);
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: -8,
                                            right: -8,
                                            width: 22,
                                            height: 22,
                                            borderRadius: "50%",
                                            border: "none",
                                            background: "#fff",
                                            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.18)",
                                            color: "#EF4444",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        title={`Delete ${sprite.name}`}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}

                                <div style={{ 
                                    width: 56, 
                                    height: 56, 
                                    borderRadius: 8, 
                                    background: isSelected ? "#EDE9FE" : "#fff", 
                                    border: isSelected ? `2px solid ${C.PURPLE}` : "2px solid transparent", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center", 
                                    overflow: "hidden",
                                    boxShadow: isSelected ? `0 0 0 2px ${C.PURPLE}40` : "none",
                                    transition: "box-shadow 0.2s ease, border 0.2s ease",
                                }}>
                                    {preview ? (
                                        <img src={preview} alt={sprite.name} style={{ width: "90%", height: "90%", objectFit: "contain" }} />
                                    ) : (
                                        <span style={{ fontSize: 28 }}>
                                            {sprite.type === 'robot' ? (
                                                <img src="/assets/sprites/robot/robot_idle.svg" alt="Robot" style={{ width: 48, height: 48 }} />
                                            ) : 
                                             sprite.type === 'cat' ? '🐱' : 
                                             sprite.type === 'ball' ? '⚽' : '🎭'}
                                        </span>
                                    )}
                                </div>
                                <div style={{ 
                                    fontSize: 11, 
                                    fontWeight: 700, 
                                    color: isSelected ? C.PURPLE : C.TEXT, 
                                    textAlign: "center",
                                    maxWidth: 70,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}>{sprite.name}</div>
                                <div style={{ fontSize: 9, color: C.MUTED, fontFamily: "monospace" }}>
                                    x:{Math.round(sprite.position?.x ?? sprite.x ?? 0)} y:{Math.round(sprite.position?.y ?? sprite.y ?? 0)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                    </>
                )}
            </div>

            <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
                <div
                    onClick={() => setShowBackdrops(prev => !prev)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                >
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.MUTED, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Backdrops
                    </span>
                    <span style={{ fontSize: 11, color: C.MUTED }}>{showBackdrops ? "▼" : "►"}</span>
                </div>

                {showBackdrops && (
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                    {BACKDROP_LIBRARY.map((backdropEntry) => {
                        const isSelected = backdrop === (backdropEntry.img || null);

                        return (
                            <div
                                key={backdropEntry.id}
                                onClick={() => handleSetBackdrop(backdropEntry)}
                                style={{
                                    minWidth: 92,
                                    padding: 8,
                                    borderRadius: 10,
                                    border: `2px solid ${isSelected ? C.PURPLE : "#E5E7EB"}`,
                                    background: isSelected ? C.LIGHT_PURPLE : "#F9FAFB",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                }}
                            >
                                <div style={{ width: "100%", height: 56, borderRadius: 8, overflow: "hidden", background: "#fff", border: `1px solid ${C.BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {backdropEntry.img ? (
                                        <img src={backdropEntry.img} alt={backdropEntry.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ fontSize: 11, color: C.MUTED }}>Blank</span>
                                    )}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.TEXT, textAlign: "center" }}>{backdropEntry.name}</div>
                            </div>
                        );
                    })}
                </div>
                )}
            </div>
        </div>
    );
}
