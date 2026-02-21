import React from 'react';
import SpriteCard from './SpriteCard';
import SceneCard from './SceneCard';
import { Flag, RotateCw, Camera, Grid3X3, Maximize, Minimize, Octagon, Square } from 'lucide-react';

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
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onUndo,
    onRedo,
    onScreenshot,
    onToggleGrid,
    onFullscreen,
    showGrid = true,
    spriteX = 0,
    spriteY = 0
}) {

    return (
        <div style={{ width: "40%", height: "100%", display: "flex", flexDirection: "column", borderLeft: "1px solid #ddd", overflow: "hidden", position: "relative" }}>

            {/* SCRATCH-STYLE STAGE HEADER */}
            <div style={{
                height: "42px",
                background: "#f0f0f0",
                borderBottom: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
            }}>
                {/* Left: Run Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Green Flag Button */}
                    <button
                        onClick={onGreenFlag}
                        style={{
                            width: "38px",
                            height: "38px",
                            border: "none",
                            borderRadius: "50%",
                            background: "linear-gradient(180deg, #4ade80 0%, #22c55e 100%)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                            transition: "all 0.15s",
                        }}
                        title="Run (Green Flag)"
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <Flag size={18} fill="#fff" stroke="#fff" />
                    </button>

                    {/* Red Stop Button */}
                    <button
                        onClick={onStop}
                        style={{
                            width: "38px",
                            height: "38px",
                            border: "none",
                            borderRadius: "50%",
                            background: "linear-gradient(180deg, #f87171 0%, #ef4444 100%)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                            transition: "all 0.15s",
                        }}
                        title="Stop All"
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <Octagon size={18} fill="#fff" stroke="#fff" />
                    </button>
                </div>

                {/* Center: Sprite Coordinates */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#fff",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    border: "1px solid #e5e5e5",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#555",
                }}>
                    <span style={{ color: "#4C97FF" }}>x: <strong>{spriteX}</strong></span>
                    <span style={{ color: "#9966FF" }}>y: <strong>{spriteY}</strong></span>
                </div>

                {/* Right: View Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                        onClick={onToggleGrid}
                        style={{
                            width: "28px",
                            height: "28px",
                            border: showGrid ? "2px solid #7B4FC4" : "1px solid #ccc",
                            borderRadius: "4px",
                            background: showGrid ? "rgba(123,79,196,0.1)" : "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        title={showGrid ? "Hide Grid" : "Show Grid"}
                    >
                        <Grid3X3 size={16} color={showGrid ? "#7B4FC4" : "#999"} />
                    </button>
                    <button
                        onClick={onFullscreen}
                        style={{
                            width: "28px",
                            height: "28px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            background: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        title="Fullscreen"
                    >
                        <Maximize size={16} color="#666" />
                    </button>
                </div>
            </div>

            {/* STAGE AREA - PictoBlox Grid Style */}
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
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
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

            {/* SPRITES PANEL - PictoBlox Style */}
            <div style={{
                height: "100px",
                background: "#f0f0f0",
                borderTop: "2px solid #ddd",
                display: "flex",
                alignItems: "center",
                padding: "8px 15px",
                gap: "10px",
                overflowX: "auto"
            }} className='no-scrollbar'>
                {/* Add Sprite Button (Bear Icon) */}
                <div
                    onClick={onAddSprite}
                    style={{
                        width: "50px",
                        height: "50px",
                        background: "white",
                        border: "2px dashed #ccc",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "28px",
                        flexShrink: 0
                    }}
                    title="Add Sprite"
                >
                    🐻
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

            {/* SCENES PANEL - PictoBlox Style */}
            <div style={{
                height: "100px",
                background: "#f0f0f0",
                borderTop: "2px solid #ddd",
                display: "flex",
                alignItems: "center",
                padding: "8px 15px",
                gap: "10px",
                overflowX: "auto"
            }} className='no-scrollbar'>
                {/* Add Scene Button (Clapperboard Icon) */}
                <div
                    onClick={onAddScene}
                    style={{
                        width: "50px",
                        height: "50px",
                        background: "white",
                        border: "2px dashed #ccc",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "28px",
                        flexShrink: 0
                    }}
                    title="Add Scene"
                >
                    🎬
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

        </div>
    );

}
