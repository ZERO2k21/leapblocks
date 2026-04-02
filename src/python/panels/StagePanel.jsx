import React from "react";
import { Plus, Trash2, CheckCircle2, Upload, Sparkles, Paintbrush, Search, ImagePlus } from "lucide-react";
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
                src="/assets/sprites/robot/robot_idle.svg"
                alt="Robot"
                style={{ width: 48, height: 48 }}
            />
        );
    }

    if (spriteType === "cat") return "\u{1F431}";
    if (spriteType === "ball") return "\u26BD";
    return "\u{1F3AD}";
};

function AddCard({ label, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                minWidth: 92,
                minHeight: 112,
                padding: 14,
                borderRadius: 18,
                border: "none",
                background: "linear-gradient(180deg, #7C3AED 0%, #8B5CF6 100%)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 12px 28px rgba(139,92,246,0.18)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 16px 32px rgba(139,92,246,0.24)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(139,92,246,0.18)";
            }}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                }}
            >
                <Plus size={18} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", textAlign: "center" }}>
                {label}
            </div>
        </div>
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
                    />

                    <div style={{
                        position: "absolute",
                        top: 18,
                        right: 18,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                    }}>
                    {[
                        { Icon: Upload, label: "Upload", action: () => onOpenAssetLibrary?.("sprite") },
                        { Icon: Sparkles, label: "Magic", action: () => onOpenAssetLibrary?.("sprite") },
                        { Icon: Paintbrush, label: "Paint", action: () => onOpenAssetLibrary?.("backdrop") },
                        { Icon: Search, label: "Search", action: () => onOpenAssetLibrary?.("sprite") },
                    ].map(({ Icon, action, label }) => (
                        <button
                            key={label}
                            onClick={action}
                            type="button"
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 18,
                                border: "none",
                                background: "rgba(255,255,255,0.18)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 16px 32px rgba(15, 23, 42, 0.16)",
                                backdropFilter: "blur(12px)",
                            }}
                            title={label}
                        >
                            <Icon size={18} />
                        </button>
                    ))}

                    <div style={{ position: "relative" }}>
                        <div style={{
                            position: "absolute",
                            right: "calc(100% + 10px)",
                            top: "50%",
                            transform: "translateY(-50%)",
                            padding: "10px 14px",
                            borderRadius: 12,
                            background: "#4e0072",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            boxShadow: "0 14px 32px rgba(0,0,0,0.18)",
                        }}>
                            {activeMode === "stage" ? "Choose a Backdrop" : "Choose a Sprite"}
                        </div>
                        <button
                            onClick={() => onOpenAssetLibrary?.(activeMode === "stage" ? "backdrop" : "sprite")}
                            type="button"
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                border: "4px solid rgba(255,255,255,0.8)",
                                background: "#5b0082",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 18px 36px rgba(239,68,68,0.28)",
                            }}
                            title={activeMode === "stage" ? "Choose a Backdrop" : "Choose a Sprite"}
                        >
                            <ImagePlus size={28} />
                        </button>
                    </div>
                </div>
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
                            {activeMode === "sprite" ? (
                                selectedSprite ? (
                                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                                        <AddCard label="Add Costume" onClick={() => onOpenAssetLibrary?.("costume")} />
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
                                                        borderRadius: 14,
                                                        border: `1px solid ${isSelected ? "#D8B4FE" : "transparent"}`,
                                                        background: isSelected ? "#F8F5FF" : "#F9FAFB",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        position: "relative",
                                                        boxShadow: isSelected ? "0 10px 24px rgba(139,92,246,0.12)" : "none",
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <div style={{
                                                            position: "absolute",
                                                            top: 8,
                                                            right: 8,
                                                            width: 22,
                                                            height: 22,
                                                            borderRadius: "50%",
                                                            background: "#fff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
                                                        }}>
                                                            <CheckCircle2 size={14} color={C.PURPLE} />
                                                        </div>
                                                    )}
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
                                    <AddCard label="Add Sprite" onClick={() => onOpenAssetLibrary?.("sprite")} />
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
                                                    borderRadius: 14,
                                                    border: `1px solid ${isSelected ? "#D8B4FE" : "transparent"}`,
                                                    background: isSelected ? "#F8F5FF" : "#F9FAFB",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    position: "relative",
                                                    boxShadow: isSelected ? "0 10px 24px rgba(139,92,246,0.12)" : "none",
                                                }}
                                            >
                                                {isSelected && (
                                                    <div style={{
                                                        position: "absolute",
                                                        top: 8,
                                                        left: 8,
                                                        width: 22,
                                                        height: 22,
                                                        borderRadius: "50%",
                                                        background: "#fff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
                                                    }}>
                                                        <CheckCircle2 size={14} color={C.PURPLE} />
                                                    </div>
                                                )}
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
                            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                                {activeMode === "stage" && (
                                    <AddCard label="Add Backdrop" onClick={() => onOpenAssetLibrary?.("backdrop")} />
                                )}
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
                                                borderRadius: 14,
                                                border: `1px solid ${isSelected ? "#D8B4FE" : "transparent"}`,
                                                background: isSelected ? "#F8F5FF" : "#F9FAFB",
                                                cursor: "pointer",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 6,
                                                position: "relative",
                                                boxShadow: isSelected ? "0 10px 24px rgba(139,92,246,0.12)" : "none",
                                            }}
                                        >
                                            {isSelected && (
                                                <div style={{
                                                    position: "absolute",
                                                    top: 8,
                                                    right: 8,
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: "50%",
                                                    background: "#fff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
                                                }}>
                                                    <CheckCircle2 size={14} color={C.PURPLE} />
                                                </div>
                                            )}
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
