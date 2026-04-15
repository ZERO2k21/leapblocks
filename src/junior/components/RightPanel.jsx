/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import SpriteCard from './SpriteCard';
import SceneCard from './SceneCard';
import { Flag, RotateCw, Camera, CameraOff, Grid3X3, Maximize, Minimize, Square, Circle, ScanFace, Image as ImageIcon, MicOff, Shrink } from 'lucide-react';
import Logo from '../../components/Logo';

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
    spriteGridX = null,
    spriteGridY = null,
    isDraggingSprite = false,
    isDraggingBlock = false,
    onBlocksDropped = null,
    successSpriteId = null,
}) {

    return (
        <div style={{ width: "40%", height: "100%", display: "flex", flexDirection: "column", borderLeft: "1px solid #ddd", overflow: "hidden", position: "relative" }}>

            {/* STAGE AREA */}
            <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden", background: "#f5f5f5" }}>
                {/* Y-Axis Labels */}
                {showGrid && (
                    <div style={{ width: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: "9px", color: "#999" }}>
                        {Array.from({ length: 23 }, (_, i) => 23 - i).map(n => {
                            const isHighlighted = isDraggingSprite && spriteGridY !== null && Math.round(spriteGridY) === n;
                            return (
                                <span key={n} style={{
                                    color: isHighlighted ? "#fff" : (n % 5 === 0 ? "#7B4FC4" : "#bbb"),
                                    fontWeight: isHighlighted ? "800" : "normal",
                                    fontSize: isHighlighted ? "11px" : "9px",
                                    background: isHighlighted ? "#7B4FC4" : "transparent",
                                    borderRadius: "4px",
                                    padding: isHighlighted ? "1px 3px" : "0",
                                    transition: "all 0.12s ease",
                                }}>{n}</span>
                            );
                        })}
                    </div>
                )}

                {/* Grid Stage Container */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Grid Area */}
                    <div style={{
                        flex: 1,
                        position: "relative",
                        background: "#fafafa",
                        border: showGrid ? "1px solid #d0d0d0" : "none",
                        borderRadius: "6px",
                        overflow: "hidden",
                    }}>
                        {/* Grid Lines Overlay */}
                        {showGrid && (
                            <div style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundImage: "linear-gradient(to right, #d5d5d5 1px, transparent 1px), linear-gradient(to bottom, #d5d5d5 1px, transparent 1px)",
                                backgroundSize: "calc(100% / 20) calc(100% / 20)",
                                pointerEvents: "none",
                                zIndex: 2,
                            }} />
                        )}

                        {/* Fullscreen Topbar Overlay */}
                        {isFullscreen && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '64px',
                                background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0 16px', zIndex: 100,
                            }}>
                                {/* Left Section: Exit & Logo */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <button onClick={onFullscreen} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        <div style={{ width: '42px', height: '42px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                            <Minimize size={22} color="#313848ff" strokeWidth={2.5} />
                                        </div>
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Logo height={32} />
                                        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1.5px solid #cbd5e1', paddingLeft: '12px' }}>
                                            <span style={{ color: '#e8cd00ff', fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em' }}>LEAPBLOCKS</span>
                                            <span style={{ color: '#c9c9c9ff', fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>Junior</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Center Section: Action Icons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isRunning ? (
                                        <ActionIcon icon={<Square size={20} fill="#fff" stroke="#fff" />} label="Stop" bgColor="#ef4444" hoverBg="#dc2626" onClick={onStop} active activeBg="#ef4444" size={42} />
                                    ) : (
                                        <ActionIcon icon={<Flag size={20} fill="#fff" stroke="#fff" />} label="Run" bgColor="#22c55e" hoverBg="#16a34a" onClick={onGreenFlag} size={42} />
                                    )}
                                    <ActionIcon icon={<Square size={20} fill="#f90000ff" stroke="#e7e7e7ff" />} label="Stop Layout" onClick={onStop} outlineColor="transparent" size={42} bgColor="#fecaca" hoverBg="#fca5a5" />
                                    <ActionIcon icon={<RotateCw size={20} color="#e7e7e7ff" strokeWidth={2.5} />} label="Reset" onClick={onReset} outlineColor="transparent" size={42} />
                                    <ActionIcon icon={<CameraOff size={20} color={isCameraOn ? "#fff" : "#e0e0e0ff"} strokeWidth={2} />} label="Camera" onClick={onCamera} outlineColor="transparent" active={isCameraOn} activeBg="#8b5cf6" size={42} />
                                    <ActionIcon icon={<Grid3X3 size={20} color={showGrid ? "#fff" : "#e0e0e0ff"} strokeWidth={2} />} label="Grid" onClick={onToggleGrid} outlineColor="transparent" active={showGrid} activeBg="#8b5cf6" size={42} />
                                </div>

                                {/* Right Section: Record, Face, Image, Mic, Timer */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ActionIcon icon={<Circle size={22} fill="#c9c9c9ff" color="#c9c9c9ff" />} label="Record" onClick={() => alert('Record feature coming soon')} outlineColor="transparent" size={42} />
                                    <ActionIcon icon={<ScanFace size={22} color="#c9c9c9ff" />} label="Face Tracking" onClick={() => alert('Face tracking coming soon')} outlineColor="#c9c9c9ff" size={42} />
                                    <ActionIcon icon={<ImageIcon size={22} color="#c9c9c9ff" />} label="Add Image/Backdrop" onClick={() => alert('Images coming soon')} outlineColor="#c9c9c9ff" size={42} />
                                    <ActionIcon icon={<MicOff size={20} color="#c9c9c9ff" strokeWidth={2.5} />} label="Mic Off" onClick={() => alert('Mic toggle coming soon')} outlineColor="transparent" size={42} />
                                    <div style={{ background: '#c9c9c9ff', color: 'white', fontWeight: 600, fontSize: '15px', padding: '6px 18px', borderRadius: '25px', letterSpacing: '1px', marginLeft: '4px' }}>
                                        0 : 00
                                    </div>
                                </div>
                            </div>
                        )}

                        {children}

                        {/* Crosshair Guide Lines */}
                        {isDraggingSprite && spriteGridX !== null && spriteGridY !== null && showGrid && (
                            <>
                                {/* Vertical line */}
                                <div style={{
                                    position: "absolute",
                                    left: `${(spriteGridX / 20) * 100}%`,
                                    top: 0,
                                    width: "1px",
                                    height: "100%",
                                    background: "rgba(123,79,196,0.35)",
                                    pointerEvents: "none",
                                    zIndex: 40,
                                }} />
                                {/* Horizontal line */}
                                <div style={{
                                    position: "absolute",
                                    top: `${((20 - spriteGridY) / 20) * 100}%`,
                                    left: 0,
                                    width: "100%",
                                    height: "1px",
                                    background: "rgba(123,79,196,0.35)",
                                    pointerEvents: "none",
                                    zIndex: 40,
                                }} />
                                {/* Coordinate Label */}
                                <div style={{
                                    position: "absolute",
                                    left: `${(spriteGridX / 20) * 100}%`,
                                    top: `${((20 - spriteGridY) / 20) * 100}%`,
                                    transform: "translate(8px, -28px)",
                                    background: "#7B4FC4",
                                    color: "white",
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    pointerEvents: "none",
                                    zIndex: 45,
                                    whiteSpace: "nowrap",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                                }}>
                                    ({Math.round(spriteGridX)}, {Math.round(spriteGridY)})
                                </div>
                            </>
                        )}
                    </div>

                    {/* X-Axis Labels */}
                    {showGrid && (
                        <div style={{ height: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 5px", fontSize: "9px", color: "#999" }}>
                            {Array.from({ length: 21 }, (_, i) => i).map(n => {
                                const isHighlighted = isDraggingSprite && spriteGridX !== null && Math.round(spriteGridX) === n;
                                return (
                                    <span key={n} style={{
                                        color: isHighlighted ? "#fff" : (n % 5 === 0 ? "#7B4FC4" : "#bbb"),
                                        fontWeight: isHighlighted ? "800" : "normal",
                                        fontSize: isHighlighted ? "11px" : "9px",
                                        minWidth: "12px",
                                        textAlign: "center",
                                        background: isHighlighted ? "#7B4FC4" : "transparent",
                                        borderRadius: "4px",
                                        padding: isHighlighted ? "1px 3px" : "0",
                                        transition: "all 0.12s ease",
                                    }}>{n}</span>
                                );
                            })}
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
                        isDraggingBlock={isDraggingBlock}
                        onBlocksDropped={onBlocksDropped}
                        isSuccess={sprite.id === successSpriteId}
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
                    icon={<CameraOff size={22} color={isCameraOn ? "#fff" : "#7B4FC4"} strokeWidth={2} />}
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
function ActionIcon({ icon, label, onClick, bgColor, hoverBg, outlineColor, active, activeBg, size = 48 }) {
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
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "12px",
                border: outlineColor && !isFilled && outlineColor !== "transparent" ? `2.5px solid ${outlineColor}` : "none",
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
