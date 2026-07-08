/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
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

const getFileBaseName = (fileName = "") => fileName.replace(/\.[^/.]+$/, "").toLowerCase();

const getActiveMode = (activeFile, sprites) => {
    const baseName = getFileBaseName(activeFile);
    if (!baseName) return "mixed";
    if (baseName === "stage") return "stage";

    const matchesSpriteFile = sprites.some((sprite) => sprite?.name?.toLowerCase() === baseName);
    if (matchesSpriteFile || baseName.includes("robot") || baseName.includes("tobi")) {
        return "sprite";
    }

    return "mixed";
};

const getSpritePreview = (sprite) => {
    const costumes = sprite?.costumes || {};
    return costumes[sprite?.currentCostume] || costumes.default || sprite?.img || null;
};

const isImageSource = (value) =>
    typeof value === "string" &&
    (value.includes("/") ||
        value.startsWith("data:image") ||
        /\.(png|jpe?g|svg|gif|webp)$/i.test(value));

const getSpriteFallback = (spriteType) => {
    if (spriteType === "robot") {
        return (
            <img
                src="assets/sprites/robot/robot_idle.svg"
                alt="Robot"
                style={{ width: 48, height: 48 }}
            />
        );
    }

    if (spriteType === "cat") return "\u{1F431}";
    if (spriteType === "ball") return "\u26BD";
    return "\u{1F3AD}";
};

function ActionButton({ label, onClick }) {
    return (
        <button
            onClick={onClick}
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
            {label}
        </button>
    );
}

export default function StagePanel({
    activeFile,
    sprites,
    selectedSpriteId,
    setSelectedSpriteId,
    backdrop,
    stageRef,
    stageSize,
    onOpenAssetLibrary,
    updateSpriteProperty,
    BACKDROP_LIBRARY,
    handleSetBackdrop,
    deleteSprite,
}) {
    const spriteList = Array.isArray(sprites) ? sprites : [];
    const backdropLibrary = Array.isArray(BACKDROP_LIBRARY) ? BACKDROP_LIBRARY : [];
    const activeMode = getActiveMode(activeFile, spriteList);
    const activeFileBaseName = getFileBaseName(activeFile);
    const fileSprite = spriteList.find((sprite) => sprite?.name?.toLowerCase() === activeFileBaseName) || null;
    const selectedSprite =
        (activeMode === "sprite" ? fileSprite : null) ||
        spriteList.find((sprite) => sprite.id === selectedSpriteId) ||
        spriteList[0] ||
        null;
    const costumeEntries = Object.entries(selectedSprite?.costumes || {});
    const showSpritesPanel = true; // Always allow showing sprites/costumes panel
    const showBackdropsPanel = activeMode !== "sprite";

    const [showSprites, setShowSprites] = React.useState(true);
    const [showBackdrops, setShowBackdrops] = React.useState(true);

    return (
        <div
            style={{
                width: 380,
                display: "flex",
                flexDirection: "column",
                borderLeft: `1px solid ${C.BORDER}`,
                background: "#fff",
                flexShrink: 0,
                minHeight: 0,
                overflowY: "auto",
            }}
        >
            <div style={{ padding: "12px", borderBottom: `1px solid ${C.BORDER}` }}>
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.MUTED,
                        marginBottom: 8,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                    }}
                >
                    Stage
                </div>
                <div
                    style={{
                        width: "100%",
                        height: 240,
                        border: `1px solid ${C.BORDER}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#F5F5F5",
                    }}
                >
                    <StageCanvas
                        sprites={spriteList}
                        selectedSpriteId={selectedSpriteId}
                        setSelectedSpriteId={setSelectedSpriteId}
                        backdrop={backdrop}
                        stageRef={stageRef}
                        stageSize={stageSize || { w: 356, h: 240 }}
                        updateSpriteProperty={updateSpriteProperty}
                    />
                </div>
            </div>

            {activeMode !== "stage" && (
                <SpriteProperties
                    selectedSprite={selectedSprite}
                    selectedSpriteId={selectedSprite?.id || selectedSpriteId}
                    updateSpriteProperty={updateSpriteProperty}
                />
            )}

            <div
                style={{
                    borderTop: `1px solid ${C.BORDER}`,
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: showSpritesPanel ? "pointer" : "default",
                    }}
                    onClick={() => showSpritesPanel && setShowSprites((prev) => !prev)}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: C.MUTED,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        {activeMode === "sprite" ? "Costumes" : "Sprites"}
                    </span>
                    <span style={{ fontSize: 11, color: C.MUTED }}>
                        {showSprites ? "\u25BC" : "\u25B6"}
                    </span>
                </div>

                {showSprites && (
                    <>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <ActionButton
                                    label={activeMode === "sprite" ? "Add Costume" : "Add Sprite"}
                                    onClick={() =>
                                        onOpenAssetLibrary?.(activeMode === "sprite" ? "costume" : "sprite")
                                    }
                                />
                            </div>

                            {activeMode === "sprite" ? (
                                selectedSprite ? (
                                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                                        {costumeEntries.map(([costumeName, costumeValue]) => {
                                            const isSelected = costumeName === selectedSprite.currentCostume;

                                            return (
                                                <div
                                                    key={costumeName}
                                                    onClick={() =>
                                                        updateSpriteProperty?.(selectedSprite.id, "currentCostume", costumeName)
                                                    }
                                                    style={{
                                                        minWidth: 92,
                                                        padding: 8,
                                                        borderRadius: 10,
                                                        border: `2px solid ${isSelected ? C.PURPLE : "#E5E7EB"}`,
                                                        background: isSelected ? C.LIGHT_PURPLE : "#F9FAFB",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 56,
                                                            height: 56,
                                                            borderRadius: 8,
                                                            background: "#fff",
                                                            border: isSelected
                                                                ? `2px solid ${C.PURPLE}`
                                                                : `1px solid ${C.BORDER}`,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {isImageSource(costumeValue) ? (
                                                            <img
                                                                src={costumeValue}
                                                                alt={costumeName}
                                                                style={{
                                                                    width: "90%",
                                                                    height: "90%",
                                                                    objectFit: "contain",
                                                                }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: 28 }}>{costumeValue || "?"}</span>
                                                        )}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            color: isSelected ? C.PURPLE : C.TEXT,
                                                            textAlign: "center",
                                                            maxWidth: 76,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {costumeName}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 12, color: C.MUTED, padding: "6px 0" }}>
                                        No sprite is linked to {activeFile || "this file"} yet.
                                    </div>
                                )
                            ) : (
                                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                                    {spriteList.map((sprite) => {
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
                                                {spriteList.length > 1 && isSelected && (
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

                                                <div
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 8,
                                                        background: isSelected ? "#EDE9FE" : "#fff",
                                                        border: isSelected
                                                            ? `2px solid ${C.PURPLE}`
                                                            : "2px solid transparent",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        overflow: "hidden",
                                                        boxShadow: isSelected
                                                            ? `0 0 0 2px ${C.PURPLE}40`
                                                            : "none",
                                                        transition: "box-shadow 0.2s ease, border 0.2s ease",
                                                    }}
                                                >
                                                    {preview && isImageSource(preview) ? (
                                                        <img
                                                            src={preview}
                                                            alt={sprite.name}
                                                            style={{
                                                                width: "90%",
                                                                height: "90%",
                                                                objectFit: "contain",
                                                            }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: 28 }}>
                                                            {preview || getSpriteFallback(sprite.type)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: isSelected ? C.PURPLE : C.TEXT,
                                                        textAlign: "center",
                                                        maxWidth: 70,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {sprite.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 9,
                                                        color: C.MUTED,
                                                        fontFamily: "monospace",
                                                    }}
                                                >
                                                    x:{Math.round(sprite.position?.x ?? sprite.x ?? 0)} y:
                                                    {Math.round(sprite.position?.y ?? sprite.y ?? 0)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
            </div>

            <div
                style={{
                    borderTop: `1px solid ${C.BORDER}`,
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minHeight: 0,
                }}
            >
                <div
                    onClick={() => showBackdropsPanel && setShowBackdrops((prev) => !prev)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: showBackdropsPanel ? "pointer" : "default",
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: C.MUTED,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        Backdrops
                    </span>
                    <span style={{ fontSize: 11, color: C.MUTED }}>
                        {showBackdropsPanel ? (showBackdrops ? "\u25BC" : "\u25B6") : "\u{1F6AB}"}
                    </span>
                </div>

                {showBackdropsPanel ? (
                    showBackdrops && (
                        <>
                            {activeMode === "stage" && (
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <ActionButton
                                        label="Add Backdrop"
                                        onClick={() => onOpenAssetLibrary?.("backdrop")}
                                    />
                                </div>
                            )}
                            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                                {backdropLibrary.map((backdropEntry) => {
                                    const image = backdropEntry.img || backdropEntry.image || null;
                                    const isSelected = backdrop === image;

                                    return (
                                        <div
                                            key={backdropEntry.id || backdropEntry.name}
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
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: 56,
                                                    borderRadius: 8,
                                                    overflow: "hidden",
                                                    background: "#fff",
                                                    border: `1px solid ${C.BORDER}`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {image ? (
                                                    <img
                                                        src={image}
                                                        alt={backdropEntry.name}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: 11, color: C.MUTED }}>Blank</span>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: C.TEXT,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {backdropEntry.name}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )
                ) : (
                    <div style={{ fontSize: 12, color: C.MUTED, padding: "6px 0" }}>
                        Sprite file selected. Switch to stage.py to edit backdrops.
                    </div>
                )}
            </div>
        </div>
    );
}
