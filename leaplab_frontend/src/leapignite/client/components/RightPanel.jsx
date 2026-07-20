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

const styles = {
    panel: {
        width: "40%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid #e4e7ed",
        overflow: "hidden",
        position: "relative",
        background: "#f8f9fc",
    },
    gridOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: "linear-gradient(to right, #d5d5d5 1px, transparent 1px), linear-gradient(to bottom, #d5d5d5 1px, transparent 1px)",
        backgroundSize: "calc(100% / 20) calc(100% / 20)",
        pointerEvents: "none",
        zIndex: 2,
    },
    fullscreenTopbar: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '64px',
        background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 100,
    },
    spritesPanel: {
        background: "#ffffff",
        borderTop: "1px solid #e8ecf2",
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        gap: "10px",
        overflowX: "auto",
        minHeight: "106px",
    },
    scenesPanel: {
        background: "#ffffff",
        borderTop: "1px solid #e8ecf2",
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        gap: "10px",
        overflowX: "auto",
        minHeight: "106px",
    },
    actionBar: {
        background: "#ffffff",
        borderTop: "1px solid #e8ecf2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 16px",
        gap: "14px",
        boxShadow: "0 -1px 4px rgba(0,0,0,0.02)",
    },
    addSprite: {
        width: "52px",
        height: "52px",
        background: "#f8f9fc",
        border: "2px dashed #d0d5dd",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        position: "relative",
        transition: "border-color 0.2s, background 0.2s",
    },
    addSpriteBadge: {
        position: "absolute", top: "-4px", right: "-4px",
        width: "18px", height: "18px", borderRadius: "50%",
        background: "#7B4FC4", color: "white",
        fontSize: "12px", fontWeight: "bold",
        display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1, boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
    },
    addScene: {
        width: "56px",
        height: "84px",
        background: "#f8f9fc",
        border: "2px dashed #d0d5dd",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        position: "relative",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        gap: "4px",
    },
    addSceneBadge: {
        position: "absolute", top: "-5px", right: "-5px",
        width: "20px", height: "20px", borderRadius: "50%",
        background: "#7B4FC4", color: "white",
        fontSize: "13px", fontWeight: "bold",
        display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1, boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
    },
    crosshairV: {
        position: "absolute",
        width: "1px",
        height: "100%",
        background: "rgba(123,79,196,0.35)",
        pointerEvents: "none",
        zIndex: 40,
    },
    crosshairH: {
        position: "absolute",
        width: "100%",
        height: "1px",
        background: "rgba(123,79,196,0.35)",
        pointerEvents: "none",
        zIndex: 40,
    },
    coordLabel: {
        position: "absolute",
        transform: "translate(8px, -28px)",
        background: "linear-gradient(135deg, #7B4FC4, #6B3FAF)",
        color: "white",
        fontSize: "10px",
        fontWeight: "700",
        padding: "3px 8px",
        borderRadius: "6px",
        pointerEvents: "none",
        zIndex: 45,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(123,79,196,0.3)",
    },
    yAxis: {
        width: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        fontSize: "9px",
        color: "#999",
        background: "#f0f2f8",
        borderRight: "1px solid #e4e7ed",
    },
    xAxis: {
        height: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 6px",
        fontSize: "9px",
        color: "#999",
        background: "#f0f2f8",
        borderTop: "1px solid #e4e7ed",
    },
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
        <div style={styles.yAxis}>
            {Array.from({ length: 23 }, (_, i) => 23 - i).map(n => {
                const isHighlighted = isDraggingSprite && spriteGridY !== null && Math.round(spriteGridY) === n;
                return (
                    <span key={n} style={{
                        color: isHighlighted ? "#fff" : (n % 5 === 0 ? "#7B4FC4" : "#bbb"),
                        fontWeight: isHighlighted ? "800" : "normal",
                        fontSize: isHighlighted ? "11px" : "9px",
                        background: isHighlighted ? "#7B4FC4" : "transparent",
                        borderRadius: "4px",
                        padding: isHighlighted ? "1px 4px" : "0",
                        transition: "all 0.12s",
                    }}>{n}</span>
                );
            })}
        </div>
    );

    const renderXAxisLabels = () => (
        <div style={styles.xAxis}>
            {Array.from({ length: 21 }, (_, i) => i).map(n => {
                const isHighlighted = isDraggingSprite && spriteGridX !== null && Math.round(spriteGridX) === n;
                return (
                    <span key={n} style={{
                        color: isHighlighted ? "#fff" : (n % 5 === 0 ? "#7B4FC4" : "#bbb"),
                        fontWeight: isHighlighted ? "800" : "normal",
                        fontSize: isHighlighted ? "11px" : "9px",
                        minWidth: "14px",
                        textAlign: "center",
                        background: isHighlighted ? "#7B4FC4" : "transparent",
                        borderRadius: "4px",
                        padding: isHighlighted ? "1px 4px" : "0",
                        transition: "all 0.12s",
                    }}>{n}</span>
                );
            })}
        </div>
    );

    const renderGridLines = () => showGrid && <div style={styles.gridOverlay} />;

    const renderFullscreenOverlay = () => isFullscreen && (
        <div style={styles.fullscreenTopbar}>
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
            <div style={{ ...styles.crosshairV, left: `${(spriteGridX / 20) * 100}%` }} />
            <div style={{ ...styles.crosshairH, top: `${((20 - spriteGridY) / 20) * 100}%` }} />
            <div style={{ ...styles.coordLabel, left: `${(spriteGridX / 20) * 100}%`, top: `${((20 - spriteGridY) / 20) * 100}%` }}>
                ({Math.round(spriteGridX)}, {Math.round(spriteGridY)})
            </div>
        </>
    );

    const renderAddSpriteButton = () => (
        <div
            onClick={onAddSprite}
            style={styles.addSprite}
            title="Add Sprite"
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#7B4FC4"; e.currentTarget.style.background = "#f3effa"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d0d5dd"; e.currentTarget.style.background = "#f8f9fc"; }}
        >
            <span style={{ fontSize: "26px", filter: "grayscale(0.5)" }}>🤖</span>
            <span style={styles.addSpriteBadge}>+</span>
        </div>
    );

    const renderAddSceneButton = () => (
        <div
            onClick={onAddScene}
            style={styles.addScene}
            title="Add Scene"
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#7B4FC4"; e.currentTarget.style.background = "#f3effa"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(123,79,196,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d0d5dd"; e.currentTarget.style.background = "#f8f9fc"; e.currentTarget.style.boxShadow = "none"; }}
        >
            <span style={{ fontSize: "24px" }}>🎬</span>
            <span style={styles.addSceneBadge}>+</span>
        </div>
    );

    const renderSpritesPanel = () => (
        <div style={styles.spritesPanel} className='slim-scrollbar'>
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
        <div style={styles.scenesPanel} className='slim-scrollbar'>
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
        <div style={styles.actionBar}>
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
        <div style={styles.panel}>
            <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden", background: "#f0f2f8" }}>
                {showGrid && renderYAxisLabels()}

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{
                        flex: 1,
                        position: "relative",
                        background: "#ffffff",
                        border: showGrid ? "1px solid #e4e7ed" : "none",
                        borderRadius: "4px",
                        overflow: "hidden",
                        margin: showGrid ? "6px 6px 0 0" : "0",
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
