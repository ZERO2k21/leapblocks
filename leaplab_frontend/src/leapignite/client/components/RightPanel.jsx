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
    showGrid = false,
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
        <div className="w-6 flex flex-col justify-between items-center py-1.5 text-[9px] text-gray-400 bg-[#f0f2f8] border-r border-[#e4e7ed]">
            {Array.from({ length: 23 }, (_, i) => 23 - i).map(n => {
                const isHighlighted = isDraggingSprite && spriteGridY !== null && Math.round(spriteGridY) === n;
                return (
                    <span
                        key={n}
                        style={{ background: isHighlighted ? "#7B4FC4" : "transparent" }}
                        className={`transition-all rounded px-1 ${
                            isHighlighted
                                ? "text-white font-extrabold text-[11px] py-0.5"
                                : (n % 5 === 0 ? "text-[#7B4FC4] font-normal text-[9px]" : "text-gray-400 font-normal text-[9px]")
                        }`}
                    >
                        {n}
                    </span>
                );
            })}
        </div>
    );

    const renderXAxisLabels = () => (
        <div className="h-5 flex justify-between items-center px-1.5 text-[9px] text-gray-400 bg-[#f0f2f8] border-t border-[#e4e7ed]">
            {Array.from({ length: 21 }, (_, i) => i).map(n => {
                const isHighlighted = isDraggingSprite && spriteGridX !== null && Math.round(spriteGridX) === n;
                return (
                    <span
                        key={n}
                        style={{ background: isHighlighted ? "#7B4FC4" : "transparent" }}
                        className={`min-w-[14px] text-center transition-all rounded px-1 ${
                            isHighlighted
                                ? "text-white font-extrabold text-[11px] py-0.5"
                                : (n % 5 === 0 ? "text-[#7B4FC4] font-normal text-[9px]" : "text-gray-400 font-normal text-[9px]")
                        }`}
                    >
                        {n}
                    </span>
                );
            })}
        </div>
    );

    const renderGridLines = () => showGrid && (
        <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#d5d5d5_1px,transparent_1px),linear-gradient(to_bottom,#d5d5d5_1px,transparent_1px)] bg-[length:calc(100%/20)_calc(100%/20)] pointer-events-none z-[2]" />
    );

    const renderFullscreenOverlay = () => isFullscreen && (
        <div className="absolute top-0 left-0 w-full h-[64px] bg-gradient-to-r from-[#0a015a] to-[#080a25] border-b border-white/10 flex items-center justify-between px-4 z-[100]">
            <div className="flex items-center gap-5">
                <button onClick={onFullscreen} className="bg-transparent border-none cursor-pointer p-0">
                    <div className="w-10.5 h-10.5 bg-white rounded-lg flex items-center justify-center shadow-xs">
                        <Minimize size={22} color="#313848ff" strokeWidth={2.5} />
                    </div>
                </button>
                <div className="flex items-center gap-2.5">
                    <Logo height={32} />
                    <div className="flex flex-col border-l border-slate-300 pl-3">
                        <span className="text-[#e8cd00ff] text-xs font-extrabold tracking-wider">LEAPBLOCKS</span>
                        <span className="text-[#c9c9c9ff] text-[13px] font-bold leading-none">Junior</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
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

            <div className="flex items-center gap-2.5">
                <ActionIcon icon={<Circle size={22} fill="#c9c9c9ff" color="#c9c9c9ff" />} label="Record" onClick={() => showToast('Record feature coming soon', 'info')} outlineColor="transparent" size={42} />
                <ActionIcon icon={<ScanFace size={22} color="#c9c9c9ff" />} label="Face Tracking" onClick={() => showToast('Face tracking coming soon', 'info')} outlineColor="#c9c9c9ff" size={42} />
                <ActionIcon icon={<ImageIcon size={22} color="#c9c9c9ff" />} label="Add Image/Backdrop" onClick={() => showToast('Images coming soon', 'info')} outlineColor="#c9c9c9ff" size={42} />
                <ActionIcon icon={<MicOff size={20} color="#c9c9c9ff" strokeWidth={2.5} />} label="Mic Off" onClick={() => showToast('Mic toggle coming soon', 'info')} outlineColor="transparent" size={42} />
                <div className="bg-[#c9c9c9ff] text-white font-semibold text-[15px] px-4.5 py-1.5 rounded-full tracking-wider ml-1">
                    0 : 00
                </div>
            </div>
        </div>
    );

    const renderCrosshair = () => isDraggingSprite && spriteGridX !== null && spriteGridY !== null && showGrid && (
        <>
            <div style={{ left: `${(spriteGridX / 20) * 100}%` }} className="absolute w-px h-full bg-[#7B4FC4]/35 pointer-events-none z-[40]" />
            <div style={{ top: `${((20 - spriteGridY) / 20) * 100}%` }} className="absolute w-full h-px bg-[#7B4FC4]/35 pointer-events-none z-[40]" />
            <div style={{ left: `${(spriteGridX / 20) * 100}%`, top: `${((20 - spriteGridY) / 20) * 100}%` }} className="absolute translate-x-2 -translate-y-7 bg-gradient-to-r from-[#7B4FC4] to-[#6B3FAF] text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none z-[45] whitespace-nowrap shadow-md shadow-purple-600/30">
                ({Math.round(spriteGridX)}, {Math.round(spriteGridY)})
            </div>
        </>
    );

    const renderAddSpriteButton = () => (
        <div
            onClick={onAddSprite}
            title="Add Sprite"
            className="w-[52px] h-[52px] bg-[#f8f9fc] border-2 border-dashed border-[#d0d5dd] rounded-xl flex items-center justify-center cursor-pointer shrink-0 relative transition-colors hover:border-[#7B4FC4] hover:bg-[#f3effa]"
        >
            <span className="text-[26px] filter grayscale-50">🤖</span>
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#7B4FC4] text-white text-xs font-bold flex items-center justify-center leading-none shadow-md shadow-purple-600/30">+</span>
        </div>
    );

    const renderAddSceneButton = () => (
        <div
            onClick={onAddScene}
            title="Add Scene"
            className="w-[56px] h-[84px] bg-[#f8f9fc] border-2 border-dashed border-[#d0d5dd] rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0 relative transition-all gap-1 hover:border-[#7B4FC4] hover:bg-[#f3effa] hover:shadow-md hover:shadow-purple-600/15"
        >
            <span className="text-2xl">🎬</span>
            <span className="absolute -top-1.25 -right-1.25 w-5 h-5 rounded-full bg-[#7B4FC4] text-white text-[13px] font-bold flex items-center justify-center leading-none shadow-md shadow-purple-600/30">+</span>
        </div>
    );

    const renderSpritesPanel = () => (
        <div className="bg-white border-t border-[#e8ecf2] flex items-center p-3 px-4 gap-2.5 overflow-x-auto min-h-[106px] slim-scrollbar">
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
        <div className="bg-white border-t border-[#e8ecf2] flex items-center p-3 px-4 gap-2.5 overflow-x-auto min-h-[106px] slim-scrollbar">
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
        <div className="bg-white border-t border-[#e8ecf2] flex items-center justify-center p-3 px-4 gap-3.5 shadow-[0_-1px_4px_rgba(0,0,0,0.02)]">
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
        <div className="w-2/5 h-full flex flex-col border-l border-[#e4e7ed] overflow-hidden relative bg-[#f8f9fc]">
            <div className="flex-1 relative flex overflow-hidden bg-[#f0f2f8]">
                {showGrid && renderYAxisLabels()}

                <div className="flex-1 flex flex-col">
                    <div className={`flex-1 relative bg-white rounded-xs overflow-hidden ${
                        showGrid ? 'border border-[#e4e7ed] m-1.5 mb-0 ml-0' : 'border-none m-0'
                    }`}>
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
