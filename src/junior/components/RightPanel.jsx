import React from 'react';
import SpriteCard from './SpriteCard';
import SceneCard from './SceneCard';
import { Flag, RotateCw, Camera, Grid3X3, Maximize, Minimize } from 'lucide-react';

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
    showGrid = true
}) {

    return (
        <div style={{ width: "40%", height: "100%", display: "flex", flexDirection: "column", borderLeft: "1px solid #ddd", overflow: "hidden", position: "relative" }}>

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
                    />
                ))}
            </div>

            {/* CONTROL BAR - PictoBlox Style */}
            <div style={{
                height: "50px",
                background: "white",
                borderTop: "2px solid #ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "0 15px",
                gap: "12px"
            }}>
                {/* Green Flag */}
                <button
                    onClick={onGreenFlag}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "5px"
                    }}
                    title="Run"
                >
                    <Flag size={28} fill="#2ECC71" stroke="#27AE60" strokeWidth={1} />
                </button>

                {/* Rotate/Reset */}
                <button
                    onClick={onZoomReset}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "5px"
                    }}
                    title="Reset"
                >
                    <RotateCw size={24} color="#7B4FC4" strokeWidth={2.5} />
                </button>

                {/* Camera/Screenshot */}
                <button
                    onClick={onScreenshot}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "5px"
                    }}
                    title="Take Screenshot"
                >
                    <Camera size={24} color="#7B4FC4" strokeWidth={2} />
                </button>

                {/* Grid Toggle */}
                <button
                    onClick={onToggleGrid}
                    style={{
                        background: showGrid ? "rgba(123, 79, 196, 0.1)" : "none",
                        border: showGrid ? "2px solid #7B4FC4" : "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        padding: "5px"
                    }}
                    title={showGrid ? "Hide Grid" : "Show Grid"}
                >
                    <Grid3X3 size={24} color="#7B4FC4" strokeWidth={2} />
                </button>

                {/* Fullscreen */}
                <button
                    onClick={onFullscreen}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "5px"
                    }}
                    title="Fullscreen"
                >
                    <Maximize size={24} color="#7B4FC4" strokeWidth={2} />
                </button>
            </div>

        </div>
    );

}
