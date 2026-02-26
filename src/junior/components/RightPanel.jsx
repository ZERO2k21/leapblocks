import React from 'react';
import SpriteCard from './SpriteCard';
import SceneCard from './SceneCard';
import { Flag, RotateCw, Camera, Grid3X3, Maximize, Minimize, Square } from 'lucide-react';

export default function RightPanel({
    children,
    sprites = [],
    scenes = [],
    currentSprite,
    currentScene,
    onSelectSprite,
    onAddSprite,
    onDeleteSprite,
    onSelectScene,
    onAddScene,
    onDeleteScene,
    onEditSprite,
    onEditScene,
    onGreenFlag,
    onStop,
    onReset,
    onCamera,
    onToggleGrid,
    onFullscreen,
    showGrid = true,
    isRunning = false,
    isCameraOn = false,
    isFullscreen = false,
}) {

    return (
        <div style={{ width: "40%", height: "100%", display: "flex", flexDirection: "column", borderLeft: "1px solid #ddd", overflow: "hidden", position: "relative" }}>

            {/* STAGE AREA */}
            <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden", background: "#f5f5f5" }}>
                {/* Y-Axis Labels */}
                {showGrid && (
                    <div style={{ width: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: "9px", color: "#999" }}>
                        {[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                            <span key={n} style={{ color: n % 5 === 0 ? "#7B4FC4" : "#bbb" }}>{n}</span>
                        ))}
                    </div>
                )}

                {/* Grid Stage Container */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Grid Area */}
                    <div style={{
                        flex: 1,
                        position: "relative",
                        background: "#f8f8f8",
                        backgroundImage: showGrid ? "radial-gradient(circle, #ddd 1.5px, transparent 1.5px)" : "none",
                        backgroundSize: "20px 20px",
                    }}>
                        {children}
                    </div>

                    {/* X-Axis Labels */}
                    {showGrid && (
                        <div style={{ height: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 5px", fontSize: "9px", color: "#999" }}>
                            {Array.from({ length: 21 }, (_, i) => i).map(n => (
                                <span key={n} style={{ color: n % 5 === 0 ? "#7B4FC4" : "#bbb", minWidth: "12px", textAlign: "center" }}>{n}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════ BOTTOM PANELS ═══════════════ */}

            {/* SPRITES PANEL */}
            <div style={{
                background: "#f2f2f2",
                borderTop: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                gap: "10px",
                overflowX: "auto",
                minHeight: "100px",
            }} className='no-scrollbar'>
                {/* Add Sprite Button */}
                <div
                    onClick={onAddSprite}
                    style={{
                        width: "48px",
                        height: "48px",
                        background: "white",
                        border: "2px dashed #ccc",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        position: "relative",
                        transition: "border-color 0.2s",
                    }}
                    title="Add Sprite"
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#7B4FC4"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#ccc"}
                >
                    <span style={{ fontSize: "26px", filter: "grayscale(0.5)" }}>🤖</span>
                    <span style={{
                        position: "absolute", top: "-4px", right: "-4px",
                        width: "16px", height: "16px", borderRadius: "50%",
                        background: "#7B4FC4", color: "white",
                        fontSize: "12px", fontWeight: "bold",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        lineHeight: 1,
                    }}>+</span>
                </div>

                {/* Sprite Cards */}
                {sprites.map(sprite => (
                    <SpriteCard
                        key={sprite.id}
                        sprite={sprite}
                        active={sprite.id === currentSprite}
                        onClick={() => onSelectSprite(sprite.id)}
                        onDelete={() => onDeleteSprite && onDeleteSprite(sprite.id)}
                        onEdit={() => onEditSprite && onEditSprite(sprite.id)}
                    />
                ))}
            </div>

            {/* SCENES PANEL */}
            <div style={{
                background: "#f2f2f2",
                borderTop: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                gap: "10px",
                overflowX: "auto",
                minHeight: "100px",
            }} className='no-scrollbar'>
                {/* Add Scene Button */}
                <div
                    onClick={onAddScene}
                    style={{
                        width: "52px",
                        height: "80px",
                        background: "white",
                        border: "2px dashed #ccc",
                        borderRadius: "12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        position: "relative",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        gap: "4px",
                    }}
                    title="Add Scene"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#7B4FC4"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(123,79,196,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.boxShadow = "none"; }}
                >
                    <span style={{ fontSize: "24px" }}>🎬</span>
                    <span style={{
                        position: "absolute", top: "-5px", right: "-5px",
                        width: "18px", height: "18px", borderRadius: "50%",
                        background: "#7B4FC4", color: "white",
                        fontSize: "13px", fontWeight: "bold",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        lineHeight: 1, boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
                    }}>+</span>
                </div>

                {/* Scene Cards */}
                {scenes.map(scene => (
                    <SceneCard
                        key={scene.id}
                        scene={scene}
                        active={scene.id === currentScene}
                        onClick={() => onSelectScene(scene.id)}
                        onDelete={() => onDeleteScene && onDeleteScene(scene.id)}
                        onEdit={() => onEditScene && onEditScene(scene.id)}
                    />
                ))}
            </div>

            {/* ═══════════════ ACTION ICONS BAR ═══════════════ */}
            <div style={{
                background: "#fafafa",
                borderTop: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 16px",
                gap: "16px",
            }}>
                {/* GREEN FLAG / STOP TOGGLE */}
                {isRunning ? (
                    <ActionIcon
                        icon={<Square size={22} fill="#fff" stroke="#fff" />}
                        label="Stop"
                        bgColor="#ef4444"
                        hoverBg="#dc2626"
                        onClick={onStop}
                        active
                        activeBg="#ef4444"
                    />
                ) : (
                    <ActionIcon
                        icon={<Flag size={22} fill="#fff" stroke="#fff" />}
                        label="Run"
                        bgColor="#22c55e"
                        hoverBg="#16a34a"
                        onClick={onGreenFlag}
                    />
                )}

                {/* RESET */}
                <ActionIcon
                    icon={<RotateCw size={22} color="#7B4FC4" strokeWidth={2.5} />}
                    label="Reset"
                    onClick={onReset}
                    outlineColor="#7B4FC4"
                />

                {/* CAMERA */}
                <ActionIcon
                    icon={<Camera size={22} color={isCameraOn ? "#fff" : "#7B4FC4"} strokeWidth={2} />}
                    label="Camera"
                    onClick={onCamera}
                    outlineColor="#7B4FC4"
                    active={isCameraOn}
                    activeBg="#7B4FC4"
                />

                {/* GRID */}
                <ActionIcon
                    icon={<Grid3X3 size={22} color={showGrid ? "#fff" : "#7B4FC4"} strokeWidth={2} />}
                    label="Grid"
                    onClick={onToggleGrid}
                    outlineColor="#7B4FC4"
                    active={showGrid}
                    activeBg="#7B4FC4"
                />

                {/* FULLSCREEN */}
                <ActionIcon
                    icon={isFullscreen
                        ? <Minimize size={22} color="#7B4FC4" strokeWidth={2} />
                        : <Maximize size={22} color="#7B4FC4" strokeWidth={2} />
                    }
                    label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    onClick={onFullscreen}
                    outlineColor="#7B4FC4"
                />
            </div>
        </div>
    );
}

/* ─────────────── Action Icon Button ─────────────── */
function ActionIcon({ icon, label, onClick, bgColor, hoverBg, outlineColor, active, activeBg }) {
    const [hovered, setHovered] = React.useState(false);

    const isFilled = !!bgColor || active;
    const bg = active && activeBg
        ? activeBg
        : bgColor
            ? (hovered ? (hoverBg || bgColor) : bgColor)
            : hovered
                ? "rgba(123,79,196,0.1)"
                : "transparent";

    return (
        <button
            onClick={onClick}
            title={label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                border: outlineColor && !isFilled ? `2.5px solid ${outlineColor}` : "none",
                background: bg,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                transform: hovered ? "scale(1.1)" : "scale(1)",
                boxShadow: hovered ? "0 4px 12px rgba(123,79,196,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                outline: "none",
                padding: 0,
            }}
        >
            {icon}
        </button>
    );
}
