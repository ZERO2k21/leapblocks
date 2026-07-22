/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * SpritePanel
 *
 * KEY LAYOUT RULE FOR FABs:
 *   The "Add Sprite" and "Add Backdrop" buttons must ALWAYS be visible at the
 *   bottom of the panel, regardless of how many sprites are added.
 *
 *   WRONG: absolute-positioned inside the scrollable grid → gets pushed off-screen
 *   RIGHT: fixed footer row (flex-shrink-0) BELOW the scrollable grid
 *
 * GRID RULES:
 *   • Fixed 5 columns (grid-cols-5) — not auto-fill
 *   • maxHeight: 172px locks the grid to 2 visible rows
 *   • overflow-y-auto always on — scrollbar appears automatically when 3rd row starts
 *   • Cards auto-align left-to-right, top-to-bottom
 */

import React, { useState, useEffect } from "react";
import './SpritePanel.css';
import { Sprite, SpriteType } from "./Sprite";
import { ActionMenu } from "./ActionMenu";
import type { StageManager } from '../engine/StageManager';
import { resolveAssetPath } from '../embed/utils/assetPaths';

const SPRITE_TYPES: { type: SpriteType; name: string; emoji: string; color: string }[] = [
  { type: "cat", name: "Cat", emoji: "🐱", color: "#FF8C1A" },
  { type: "ball", name: "Ball", emoji: "⚽", color: "#2980B9" },
  { type: "arrow", name: "Arrow", emoji: "➤", color: "#E74C3C" },
  { type: "robot", name: "Robot", emoji: "🤖", color: "#7D8C9C" },
];

interface SpritePanelProps {
  sprites: Sprite[];
  selectedSpriteId: string | null;
  onSelectSprite: (id: string) => void;
  onAddSprite: (type: SpriteType) => void;
  onDeleteSprite: (id: string) => void;
  onRemoveBackground?: (spriteId: string) => void;
  onOpenSpriteLibrary?: () => void;
  onOpenBackdropLibrary?: () => void;
  onUploadSprite?: () => void;
  stageManager: StageManager;
  backdropVersion?: number;
  isFullscreen?: boolean;
  onCopyCodeToSprite?: (sourceSpriteId: string, targetSpriteId: string) => void;
}

export const SpritePanel: React.FC<SpritePanelProps> = ({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
  onOpenSpriteLibrary,
  onOpenBackdropLibrary,
  onUploadSprite,
  stageManager,
  backdropVersion: _backdropVersion,
  isFullscreen = false,
  onCopyCodeToSprite,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStageUpdate = () => setTick((t) => t + 1);
    window.addEventListener('leap-stage-update', handleStageUpdate);
    return () => window.removeEventListener('leap-stage-update', handleStageUpdate);
  }, []);

  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId);
  const isStageSelected = selectedSpriteId === "stage";
  const normalSprites = sprites.filter(s => s.id !== "stage" && !s.id.includes("_clone_"));

  const cloneCounts = sprites.reduce((acc: Record<string, number>, s) => {
    if (s.id.includes("_clone_")) {
      const base = s.id.split("_clone_")[0];
      acc[base] = (acc[base] || 0) + 1;
    }
    return acc;
  }, {});

  const backdropCount = stageManager.getAllBackdrops().length;
  const currentBackdropSrc = stageManager.getCurrentBackdrop()?.src;

  const handleAddSprite = (type: SpriteType) => { onAddSprite(type); setShowPicker(false); };

  // Scrollbar triggers when sprites exceed 2 visible rows (5 cols × 2 rows = 10)
  // i.e. as soon as the 3rd row starts forming — kept for reference
  const _needsScroll = normalSprites.length > 10;

  // ── colour tokens ────────────────────────────────────────────────────────
  const dk = isFullscreen;
  const panelBg = dk ? "bg-[#16161a]" : "bg-white";
  const gridBg = dk ? "bg-[#111115]" : "bg-[#F8F9FB]";
  const infoBg = dk ? "bg-[#1c1c21]" : "bg-white";
  const borderCol = dk ? "border-gray-700" : "border-gray-100";
  const sidebarBg = dk ? "bg-[#1c1c21]" : "bg-white";

  const pill = `px-3 py-1.5 border ${borderCol} rounded-xl text-xs font-semibold
    focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none
    ${dk ? "bg-[#26262d] text-gray-100" : "bg-slate-50 text-slate-700"}
    disabled:opacity-40 transition-all`;

  const numPill = `w-[58px] px-1.5 py-1.5 border ${borderCol} rounded-xl text-xs font-bold text-center
    focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none
    ${dk ? "bg-[#26262d] text-gray-100" : "bg-slate-50 text-slate-700"}
    disabled:opacity-40 transition-all`;

  const lbl = `text-[11px] font-bold flex-shrink-0 uppercase tracking-wider ${dk ? "text-gray-400" : "text-slate-400"}`;

  return (
    <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${panelBg}`}>

      {/* ══════════════════════════════════════════════════════════════════
          INFO BAR
          ══════════════════════════════════════════════════════════════════ */}
      <div className={`px-4 py-3 border-b ${borderCol} ${infoBg} flex-shrink-0`}>

        {/* Row 1: Sprite | [Name] | ↔ x [val] | ↕ y [val] */}
        <div className="flex items-center gap-3 min-w-0">
          <span className={lbl}>{isStageSelected ? "Stage" : "Sprite"}</span>
          <input
            type="text"
            value={selectedSprite?.name ?? ""}
            onChange={(e) => selectedSprite?.setName?.(e.target.value)}
            disabled={isStageSelected || !selectedSprite}
            className={`flex-1 min-w-0 text-center ${pill}`}
          />
          {!isStageSelected && selectedSprite && (
            <>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-xs select-none font-mono ${dk ? "text-gray-400" : "text-slate-400"}`}>↔</span>
                <span className={lbl}>x</span>
                <input type="number" value={Math.round(selectedSprite.x)}
                  onChange={(e) => selectedSprite.setX?.(Number(e.target.value))}
                  className={numPill} />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-xs select-none font-mono ${dk ? "text-gray-400" : "text-slate-400"}`}>↕</span>
                <span className={lbl}>y</span>
                <input type="number" value={Math.round(selectedSprite.y)}
                  onChange={(e) => selectedSprite.setY?.(Number(e.target.value))}
                  className={numPill} />
              </div>
            </>
          )}
        </div>

        {/* Row 2: Show [👁][🚫] | Size [val] | Direction [val] */}
        <div className="flex items-center gap-3.5 mt-2.5 min-w-0">
          {!isStageSelected && selectedSprite ? (
            <>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={lbl}>Show</span>
                <button onClick={() => selectedSprite.show?.()} title="Show"
                  className={`w-8 h-8 border-2 rounded-xl flex items-center justify-center transition-all duration-150
                    ${selectedSprite.visible
                      ? "border-[#7b44c7] bg-[#7b44c7] text-white shadow-md shadow-purple-200"
                      : `${borderCol} ${dk ? "bg-[#26262d] text-gray-400" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:border-slate-300"}`}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button onClick={() => selectedSprite.hide?.()} title="Hide"
                  className={`w-8 h-8 border-2 rounded-xl flex items-center justify-center transition-all duration-150
                    ${!selectedSprite.visible
                      ? "border-[#7b44c7] bg-[#7b44c7] text-white shadow-md shadow-purple-200"
                      : `${borderCol} ${dk ? "bg-[#26262d] text-gray-400" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:border-slate-300"}`}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={lbl}>Size</span>
                <input type="number" value={Math.round(selectedSprite.size)}
                  onChange={(e) => selectedSprite.setSize?.(Number(e.target.value))}
                  className={numPill} />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={lbl}>Direction</span>
                <input type="number" value={Math.round(selectedSprite.direction)}
                  onChange={(e) => selectedSprite.pointInDirection?.(Number(e.target.value))}
                  className={numPill} />
              </div>
            </>
          ) : (
            <p className={`text-xs font-medium ${dk ? "text-gray-500" : "text-slate-400"}`}>
              Stage backdrops cannot be moved or hidden.
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN ROW: sprite grid + stage sidebar
          ─────────────────────────────────────────────────────────────────
          Layout contract:
            GRID_H   = 190px  (2+ rows of cards, scrolls after 10 sprites)
            FOOTER_H = 60px   (FAB row, same on both sides)
            TOTAL    = 250px  (both columns identical height → FABs aligned)
          ══════════════════════════════════════════════════════════════════ */}
      <div className={`flex flex-1 min-h-0 ${gridBg}`} style={{ overflow: 'visible' }}>

        {/* ── LEFT: sprite grid + FAB footer ──────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ overflow: 'visible' }}>

          {/* Scrollable grid */}
          <div
            className={`p-4 grid grid-cols-5 gap-3.5 content-start
              overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent`}
            style={{ flex: '1 1 0', maxHeight: '200px' }}
          >
            {normalSprites.map((sprite) => {
              const isSelected = selectedSpriteId === sprite.id;
              const cloneCount = cloneCounts[sprite.id] ?? 0;

              return (
                <div
                  key={sprite.id}
                  data-sprite-id={sprite.id}
                  draggable={true}
                  onClick={() => onSelectSprite(sprite.id)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', sprite.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (sourceId && sourceId !== sprite.id) {
                      onCopyCodeToSprite?.(sourceId, sprite.id);
                    }
                  }}
                  className={`relative group flex flex-col rounded-[20px] cursor-pointer
                    transition-all duration-200 border-2 select-none
                    ${isSelected
                      ? `border-[#7b44c7] ring-4 ring-purple-400/25 ${dk ? "bg-[#1e1a2e]" : "bg-white"} shadow-lg shadow-purple-500/20 scale-[1.02]`
                      : `border-slate-200/90 ${dk ? "bg-[#1c1c21] border-gray-700" : "bg-white hover:border-[#7b44c7]/50 hover:shadow-md hover:shadow-purple-100 hover:-translate-y-0.5"}`
                    }`}
                  style={{ aspectRatio: '1 / 1' }}
                >
                  {/* Delete button — playful purple circle with cross */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSprite(sprite.id); }}
                    title="Delete sprite"
                    className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full
                      bg-[#7b44c7] text-white flex items-center justify-center
                      shadow-md transition-all duration-150 z-30
                      hover:bg-rose-500 hover:scale-110 active:scale-95
                      ${isSelected ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"}`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  {/* Clone badge */}
                  {cloneCount > 0 && (
                    <div className="absolute -top-1.5 -left-1.5 bg-amber-400 text-amber-950
                      text-[10px] font-black w-5 h-5 rounded-full border-2 border-white
                      flex items-center justify-center z-30 shadow-sm">
                      {cloneCount}
                    </div>
                  )}

                  {/* Sprite image container */}
                  <div className={`flex-1 flex items-center justify-center p-0.5 min-h-0 overflow-hidden w-full rounded-t-[18px]
                    ${isSelected
                      ? (dk ? "bg-[#251f38]" : "bg-gradient-to-b from-purple-50/70 to-white")
                      : (dk ? "bg-[#18181c]" : "bg-gradient-to-b from-slate-50/90 to-white group-hover:from-purple-50/40")
                    }`}>
                    {(() => {
                      const getCostumeSrc = (c: any): string => {
                        if (!c) return '';
                        if (typeof c === 'string') return c;
                        if (typeof c === 'object' && c.src && typeof c.src === 'string') return c.src;
                        if (c.image) {
                          if (typeof c.image === 'string') return c.image;
                          if (typeof c.image === 'object' && c.image.src && typeof c.image.src === 'string') return c.image.src;
                        }
                        return '';
                      };
                      const rawSrc = getCostumeSrc(sprite.currentCostume);
                      let costumeImgSrc = resolveAssetPath(rawSrc);
                      if (costumeImgSrc && !costumeImgSrc.startsWith('http') && !costumeImgSrc.startsWith('data:') && !costumeImgSrc.startsWith('blob:') && !costumeImgSrc.startsWith('/')) {
                        costumeImgSrc = '/' + costumeImgSrc;
                      }

                      return costumeImgSrc ? (
                        <img
                          src={costumeImgSrc}
                          alt={sprite.name}
                          className="w-full h-full object-contain scale-125 filter drop-shadow-md transition-transform duration-200 group-hover:scale-135"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-4xl select-none filter drop-shadow-sm">
                          {sprite.name.toLowerCase().includes("robot") ? "🤖" : "🍎"}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Name badge */}
                  <div className={`text-center text-[10px] font-extrabold py-0.5 px-1
                    truncate flex-shrink-0 transition-colors rounded-b-[18px] leading-snug tracking-tight
                    ${isSelected
                      ? "bg-[#7b44c7] text-white shadow-inner"
                      : `${dk ? "bg-[#26262d] text-gray-300 group-hover:bg-[#322c42] group-hover:text-purple-300" : "bg-slate-100 text-slate-700 group-hover:bg-purple-100/80 group-hover:text-purple-900"}`
                    }`}>
                    {sprite.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── FAB footer — fixed 60px, always at bottom ───────────── */}
          <div className={`flex items-center justify-center px-4 border-t ${borderCol} ${gridBg}`}
            style={{ height: '60px', minHeight: '60px', overflow: 'visible' }}>
            <ActionMenu
              mainIcon={
                /* Bear face icon */
                <svg viewBox="0 0 36 36" fill="white" width="22" height="22">
                  <circle cx="10" cy="11" r="5" fill="white" />
                  <circle cx="26" cy="11" r="5" fill="white" />
                  <circle cx="18" cy="20" r="11" fill="white" />
                  <circle cx="14" cy="18" r="1.8" fill="#E6194B" />
                  <circle cx="22" cy="18" r="1.8" fill="#E6194B" />
                  <path d="M15 24 Q18 26.5 21 24" stroke="#E6194B" strokeWidth="1.2"
                    fill="none" strokeLinecap="round" />
                  <circle cx="28" cy="8" r="5" fill="#E6194B" />
                  <path d="M28 5.5 L28 10.5 M25.5 8 L30.5 8" stroke="white" strokeWidth="1.6"
                    strokeLinecap="round" />
                </svg>
              }
              tooltipLabel="Add Sprite"
              actions={[
                {
                  id: "upload",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                  ),
                  label: "Upload",
                  onClick: () => onUploadSprite?.(),
                },
                {
                  id: "surprise",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity="0.8" />
                      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" opacity="0.6" />
                    </svg>
                  ),
                  label: "Surprise!",
                  onClick: () => handleAddSprite(
                    SPRITE_TYPES[Math.floor(Math.random() * SPRITE_TYPES.length)].type
                  ),
                },
                {
                  id: "paint",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                      <circle cx="11" cy="11" r="2" fill="white" />
                    </svg>
                  ),
                  label: "Paint",
                  onClick: () => { },
                },
                {
                  id: "library",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  ),
                  label: "Choose a Sprite",
                  onClick: onOpenSpriteLibrary ?? (() => setShowPicker(!showPicker)),
                },
              ]}
            />
          </div>
        </div>

        {/* ── RIGHT: stage sidebar ──────────────────────────────────── */}
        <div className={`w-[96px] flex-shrink-0 border-l ${borderCol}
          ${sidebarBg} flex flex-col`} style={{ overflow: 'visible' }}>

          {/* Sidebar content */}
          <div className="flex-1 min-h-0 flex flex-col">

            {/* Stage card */}
            <div
              data-sprite-id="stage"
              onClick={() => onSelectSprite('stage')}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const sourceId = e.dataTransfer.getData('text/plain');
                if (sourceId && sourceId !== 'stage') {
                  onCopyCodeToSprite?.(sourceId, 'stage');
                }
              }}
              className={`mx-3.5 mt-4 mb-2 rounded-[20px] cursor-pointer transition-all duration-200 border-2 select-none overflow-hidden
                ${isStageSelected
                  ? `border-[#7b44c7] ring-4 ring-purple-400/25 ${dk ? "bg-[#1e1a2e]" : "bg-white"} shadow-lg shadow-purple-500/20 scale-[1.02]`
                  : `border-slate-200/90 ${dk ? "bg-[#1c1c21] border-gray-700" : "bg-white hover:border-[#7b44c7]/50 hover:shadow-md hover:shadow-purple-100 hover:-translate-y-0.5"}`
                }`}
            >
              {/* "Stage" header */}
              <div className={`text-center text-[12px] font-extrabold py-1.5 transition-colors tracking-wide
                ${isStageSelected
                  ? "bg-[#7b44c7] text-white"
                  : `${dk ? "bg-[#26262d] text-gray-300" : "bg-slate-100 text-slate-700 group-hover:bg-purple-100/80 group-hover:text-purple-900"}`
                }`}>
                Stage
              </div>

              {/* Backdrop thumbnail */}
              <div
                className={`w-full overflow-hidden ${dk ? "bg-[#26262d]" : "bg-slate-50"}`}
                style={{ aspectRatio: '4/3' }}>
                {currentBackdropSrc ? (
                  <img
                    src={currentBackdropSrc}
                    alt="backdrop"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke={dk ? "#4b5563" : "#c4c9d4"} strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="14" rx="2" />
                      <polyline points="3 15 8 10 13 14" />
                      <polyline points="13 14 16 11 21 15" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Backdrops count */}
            <div className="text-center flex-shrink-0 pb-4 mt-2">
              <p className={`text-[12px] leading-tight font-bold tracking-widest ${dk ? "text-gray-400" : "text-gray-400"}`}>
                Backdrops
              </p>
              <p className={`text-xl font-extrabold leading-tight mt-0.5
                ${dk ? "text-[#7b44c7]/80" : "text-[#7b44c7]"}`}>
                {backdropCount}
              </p>
            </div>

            {/* Spacer */}
            <div className="flex-1" />
          </div>

          {/* FAB footer — fixed 60px */}
          <div className={`flex items-center justify-center px-4 border-t ${borderCol} ${sidebarBg}`}
            style={{ height: '60px', minHeight: '60px', overflow: 'visible' }}>
            <ActionMenu
              mainIcon={
                /* Image+ icon */
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="16" height="12" rx="2" />
                  <polyline points="2 13 7 8 11 12" />
                  <polyline points="11 12 14 9 18 13" />
                  <line x1="16" y1="19" x2="22" y2="19" />
                  <line x1="19" y1="16" x2="19" y2="22" />
                </svg>
              }
              tooltipLabel="Add Backdrop"
              actions={[
                {
                  id: "upload",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                  ),
                  label: "Upload",
                  onClick: () => { },
                },
                {
                  id: "surprise",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity="0.8" />
                    </svg>
                  ),
                  label: "Surprise!",
                  onClick: () => { },
                },
                {
                  id: "paint",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                      <circle cx="11" cy="11" r="2" fill="white" />
                    </svg>
                  ),
                  label: "Paint",
                  onClick: () => { },
                },
                {
                  id: "library",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  ),
                  label: "Choose a Backdrop",
                  onClick: onOpenBackdropLibrary ?? (() => { }),
                },
              ]}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SpritePanel;
