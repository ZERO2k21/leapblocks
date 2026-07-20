/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import SpriteCard from './SpriteCard';
import SceneCard from './SceneCard';
import { Flag, RotateCw, CameraOff, Grid3X3, Maximize, Minimize, Square, Circle, ScanFace, Image as ImageIcon, MicOff } from 'lucide-react';
import Logo from '../../../components/Logo';
import { showToast } from './Toast';
import ActionIcon from './ActionIcon';

// ── Style Constants ────────────────────────────────────────────────────────
const PANEL_STYLE = {
    width: "40%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #ddd",
    overflow: "hidden",
    position: "relative",
};

const GRID_OVERLAY_STYLE = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: "linear-gradient(to right, #d5d5d5 1px, transparent 1px), linear-gradient(to bottom, #d5d5d5 1px, transparent 1px)",
    backgroundSize: "calc(100% / 20) calc(100% / 20)",
    pointerEvents: "none",
    zIndex: 2,
};

const FULLSCREEN_TOPBAR_STYLE = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '64px',
    background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', zIndex: 100,
};

const SPRITES_PANEL_STYLE = {
    background: "#f2f2f2",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    gap: "10px",
    overflowX: "auto",
    minHeight: "100px",
};

const SCENES_PANEL_STYLE = {
    background: "#f2f2f2",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    gap: "10px",
    overflowX: "auto",
    minHeight: "100px",
};

const ACTION_BAR_STYLE = {
    background: "#fafafa",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    gap: "16px",
};

const ADD_SPRITE_STYLE = {
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
};

const ADD_SPRITE_BADGE_STYLE = {
    position: "absolute", top: "-4px", right: "-4px",
    width: "16px", height: "16px", borderRadius: "50%",
    background: "#7B4FC4", color: "white",
    fontSize: "12px", fontWeight: "bold",
    display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1,
};

const ADD_SCENE_STYLE = {
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
};

const ADD_SCENE_BADGE_STYLE = {
    position: "absolute", top: "-5px", right: "-5px",
    width: "18px", height: "18px", borderRadius: "50%",
    background: "#7B4FC4", color: "white",
    fontSize: "13px", fontWeight: "bold",
    display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1, boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
};

const CROSSHAIR_V_LINE_STYLE = {
    position: "absolute",
    width: "1px",
    height: "100%",
    background: "rgba(123,79,196,0.35)",
    pointerEvents: "none",
    zIndex: 40,
};

const CROSSHAIR_H_LINE_STYLE = {
    ...CROSSHAIR_V_LINE_STYLE,
    width: "100%",
    height: "1px",
};

const COORDINATE_LABEL_STYLE = {
    position: "absolute",
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
};

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

    const renderYAxisLabels = () => (
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
    );

    const renderXAxisLabels = () => (
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
    );

    const renderGridLines = () => showGrid && (
        <div style={GRID_OVERLAY_STYLE} />
    );

    const renderFullscreenOverlay = () => isFullscreen && (
        <div style={FULLSCREEN_TOPBAR_STYLE}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ActionIcon icon={<Circle size={22} fill="#c9c9c9ff" color="#c9c9c9ff" />} label="Record" onClick={() => showToast('Record feature coming soon', 'info')} outlineColor="transparent" size={42} />
                <ActionIcon icon={<ScanFace size={22} color="#c9c9c9ff" />} label="Face Tracking" onClick={() => showToast('Face tracking coming soon', 'info')} outlineColor="#c9c9c9ff" size={42} />
                <ActionIcon icon={<ImageIcon size={22} color="#c9c9c9ff" />} label="Add Image/Backdrop" onClick={() => showToast('Images coming soon', 'info')} outlineColor="#c9c9c9ff" size={42} />
                <ActionIcon icon={<MicOff size={20} color="#c9c9c9ff" strokeWidth={2.5} />} label="Mic Off" onClick={() => showToast('Mic toggle coming soon', 'info')} outlineColor="transparent" size={42} />
                <div style={{ background: '#c9c9c9ff', color: 'white', fontWeight: 600, fontSize: '15px', padding: '6px 18px', borderRadius: '25px', letterSpacing: '1px', marginLeft: '4px' }}>
                    0 : 00
                </div>
            </div>
        </div>
    );

    const renderCrosshair = () => isDraggingSprite && spriteGridX !== null && spriteGridY !== null && showGrid && (
        <>
            <div style={{ ...CROSSHAIR_V_LINE_STYLE, left: `${(spriteGridX / 20) * 100}%` }} />
            <div style={{ ...CROSSHAIR_H_LINE_STYLE, top: `${((20 - spriteGridY) / 20) * 100}%` }} />
            <div style={{ ...COORDINATE_LABEL_STYLE, left: `${(spriteGridX / 20) * 100}%`, top: `${((20 - spriteGridY) / 20) * 100}%` }}>
                ({Math.round(spriteGridX)}, {Math.round(spriteGridY)})
            </div>
        </>
    );

    const renderAddSpriteButton = () => (
        <div
            onClick={onAddSprite}
            style={ADD_SPRITE_STYLE}
            title="Add Sprite"
            onMouseEnter={e => e.currentTarget.style.borderColor = "#7B4FC4"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#ccc"}
        >
            <span style={{ fontSize: "26px", filter: "grayscale(0.5)" }}>🤖</span>
            <span style={ADD_SPRITE_BADGE_STYLE}>+</span>
        </div>
    );

    const renderAddSceneButton = () => (
        <div
            onClick={onAddScene}
            style={ADD_SCENE_STYLE}
            title="Add Scene"
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#7B4FC4"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(123,79,196,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.boxShadow = "none"; }}
        >
            <span style={{ fontSize: "24px" }}>🎬</span>
            <span style={ADD_SCENE_BADGE_STYLE}>+</span>
        </div>
    );

    const renderSpritesPanel = () => (
        <div style={SPRITES_PANEL_STYLE} className='slim-scrollbar'>
            {renderAddSpriteButton()}
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
    );

    const renderScenesPanel = () => (
        <div style={SCENES_PANEL_STYLE} className='slim-scrollbar'>
            {renderAddSceneButton()}
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
    );

    const renderActionBar = () => (
        <div style={ACTION_BAR_STYLE}>
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
            <ActionIcon
                icon={<RotateCw size={22} color="#7B4FC4" strokeWidth={2.5} />}
                label="Reset"
                onClick={onReset}
                outlineColor="#7B4FC4"
            />
            <ActionIcon
                icon={<CameraOff size={22} color={isCameraOn ? "#fff" : "#7B4FC4"} strokeWidth={2} />}
                label="Camera"
                onClick={onCamera}
                outlineColor="#7B4FC4"
                active={isCameraOn}
                activeBg="#7B4FC4"
            />
            <ActionIcon
                icon={<Grid3X3 size={22} color={showGrid ? "#fff" : "#7B4FC4"} strokeWidth={2} />}
                label="Grid"
                onClick={onToggleGrid}
                outlineColor="#7B4FC4"
                active={showGrid}
                activeBg="#7B4FC4"
            />
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
    );

    return (
        <div style={PANEL_STYLE}>
            <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden", background: "#f5f5f5" }}>
                {showGrid && renderYAxisLabels()}

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{
                        flex: 1,
                        position: "relative",
                        background: "#fafafa",
                        border: showGrid ? "1px solid #d0d0d0" : "none",
                        borderRadius: "6px",
                        overflow: "hidden",
                    }}>
                        {renderGridLines()}
                        {renderFullscreenOverlay()}
                        {children}
                        {renderCrosshair()}
                    </div>

                    {showGrid && renderXAxisLabels()}
                </div>
            </div>

            {renderSpritesPanel()}
            {renderScenesPanel()}
            {renderActionBar()}
        </div>
    );
}
