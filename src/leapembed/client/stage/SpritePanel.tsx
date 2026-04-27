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

import React, { useState, useEffect, useRef } from "react";
import { Sprite, SpriteType } from "./Sprite";
import { ActionMenu } from "./ActionMenu";
import type { StageManager } from '../../server/engine/stageManager';

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
  stageManager: StageManager;
  backdropVersion?: number;
  isFullscreen?: boolean;
}

export const SpritePanel: React.FC<SpritePanelProps> = ({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
  onOpenSpriteLibrary,
  onOpenBackdropLibrary,
  stageManager,
  backdropVersion,   // used to force re-render when backdrop changes
  isFullscreen = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  // Ref to the selected sprite card — used to scroll it into view on selection
  const selectedCardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Re-read backdrop on every backdropVersion change so the thumbnail updates
  const backdropCount = stageManager.getAllBackdrops().length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentBackdropSrc = stageManager.getCurrentBackdrop()?.src ?? null;

  // Scroll the newly selected sprite card into view
  useEffect(() => {
    if (selectedCardRef.current && gridRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSpriteId]);

  const handleAddSprite = (type: SpriteType) => { onAddSprite(type); setShowPicker(false); };

  // Scrollbar triggers when sprites exceed 2 visible rows (5 cols × 2 rows = 10)
  // i.e. as soon as the 3rd row starts forming — kept for reference
  const _needsScroll = normalSprites.length > 10;

  // ── colour tokens ────────────────────────────────────────────────────────
  const dk = isFullscreen;
  const panelBg = dk ? "bg-[#16161a]" : "bg-white";
  const gridBg = dk ? "bg-[#111115]" : "bg-[#F2F2F2]";
  const infoBg = dk ? "bg-[#1c1c21]" : "bg-white";
  const borderCol = dk ? "border-gray-700" : "border-gray-200";
  const sidebarBg = dk ? "bg-[#1c1c21]" : "bg-white";

  const pill = `px-2.5 py-1 border ${borderCol} rounded-full text-xs
    focus:border-violet-500 focus:outline-none
    ${dk ? "bg-[#26262d] text-gray-100" : "bg-white text-slate-800"}
    disabled:opacity-40`;

  const lbl = `text-xs font-medium flex-shrink-0 ${dk ? "text-gray-400" : "text-gray-600"}`;

  return (
    <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${panelBg}`}>

      {/* ══════════════════════════════════════════════════════════════════
          INFO BAR
          ══════════════════════════════════════════════════════════════════ */}
      <div className={`px-3 pt-2 pb-2 border-b ${borderCol} ${infoBg} flex-shrink-0`}>

        {/* Row 1: Sprite | [Name] | ↔ x [val] | ↕ y [val] */}
        <div className="flex items-center gap-2 min-w-0">
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
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-sm select-none ${dk ? "text-gray-400" : "text-gray-500"}`}>↔</span>
                <span className={lbl}>x</span>
                <input type="number" value={Math.round(selectedSprite.x)}
                  onChange={(e) => selectedSprite.setX?.(Number(e.target.value))}
                  className={`w-14 text-center ${pill}`} />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-sm select-none ${dk ? "text-gray-400" : "text-gray-500"}`}>↕</span>
                <span className={lbl}>y</span>
                <input type="number" value={Math.round(selectedSprite.y)}
                  onChange={(e) => selectedSprite.setY?.(Number(e.target.value))}
                  className={`w-14 text-center ${pill}`} />
              </div>
            </>
          )}
        </div>

        {/* Row 2: Show [👁][🚫] | Size [val] | Direction [val] */}
        <div className="flex items-center gap-4 mt-1.5 min-w-0">
          {!isStageSelected && selectedSprite ? (
            <>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={lbl}>Show</span>
                <button onClick={() => selectedSprite.show?.()} title="Show"
                  className={`w-7 h-7 border-2 rounded-lg flex items-center justify-center transition-colors
                    ${selectedSprite.visible
                      ? "border-violet-500 bg-violet-50 text-violet-600"
                      : `${borderCol} ${dk ? "bg-[#26262d] text-gray-400" : "bg-white text-gray-400"}`}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button onClick={() => selectedSprite.hide?.()} title="Hide"
                  className={`w-7 h-7 border-2 rounded-lg flex items-center justify-center transition-colors
                    ${!selectedSprite.visible
                      ? "border-violet-500 bg-violet-50 text-violet-600"
                      : `${borderCol} ${dk ? "bg-[#26262d] text-gray-400" : "bg-white text-gray-400"}`}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={lbl}>Size</span>
                <input type="number" value={Math.round(selectedSprite.size)}
                  onChange={(e) => selectedSprite.setSize?.(Number(e.target.value))}
                  className={`w-16 text-center ${pill}`} />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={lbl}>Direction</span>
                <input type="number" value={Math.round(selectedSprite.direction)}
                  onChange={(e) => selectedSprite.pointInDirection?.(Number(e.target.value))}
                  className={`w-16 text-center ${pill}`} />
              </div>
            </>
          ) : (
            <p className={`text-xs italic ${dk ? "text-gray-500" : "text-gray-400"}`}>
              Stage backdrops cannot be moved or hidden.
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN ROW: sprite grid + stage sidebar
          ─────────────────────────────────────────────────────────────────
          Layout contract:
            GRID_H   = 160px  (2 rows of cards, scrolls after 10 sprites)
            FOOTER_H = 60px   (FAB row, same on both sides)
            TOTAL    = 220px  (both columns identical height → FABs aligned)
          ══════════════════════════════════════════════════════════════════ */}
      <div className={`flex flex-1 min-h-0 ${gridBg}`} style={{ overflow: 'visible' }}>

        {/* ── LEFT: sprite grid + FAB footer ──────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ overflow: 'visible' }}>

          {/* Scrollable grid
           * maxHeight caps at 2 rows (~160px). Content beyond that scrolls.
           * flex-1 + maxHeight: the grid grows up to 160px then scrolls.
           */}
          <div
            ref={gridRef}
            className={`p-2.5 grid grid-cols-5 gap-2 content-start
              overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent`}
            style={{ flex: '1 1 0', maxHeight: '160px' }}
          >
            {normalSprites.map((sprite) => {
              const isSelected = selectedSpriteId === sprite.id;
              const cloneCount = cloneCounts[sprite.id] ?? 0;

              return (
                <div
                  key={sprite.id}
                  ref={isSelected ? selectedCardRef : null}
                  onClick={() => onSelectSprite(sprite.id)}
                  className={`relative group flex flex-col rounded-xl cursor-pointer
                    transition-all duration-150 overflow-visible border-2
                    ${isSelected
                      ? `border-violet-600 ${dk ? "bg-[#1e1a2e]" : "bg-white"} shadow-sm`
                      : `${borderCol} ${dk ? "bg-[#1c1c21]" : "bg-white"} hover:border-violet-300`
                    }`}
                  style={{ aspectRatio: '1 / 1.2' }}
                >
                  {/* Delete — purple circle + trash, overlaps top-right corner */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSprite(sprite.id); }}
                    title="Delete sprite"
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full
                      bg-[#6c3fc5] text-white flex items-center justify-center
                      shadow-md transition-all duration-150 z-20
                      hover:bg-violet-700 hover:scale-110 active:scale-95
                      ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>

                  {/* Clone badge */}
                  {cloneCount > 0 && (
                    <div className="absolute -top-1.5 -left-1.5 bg-amber-500 text-white
                      text-[8px] font-bold w-4 h-4 rounded-full border border-white
                      flex items-center justify-center z-20">
                      {cloneCount}
                    </div>
                  )}

                  {/* Sprite image */}
                  <div className="flex-1 flex items-center justify-center p-1.5 min-h-0 overflow-hidden">
                    {sprite.currentCostume?.image?.src ? (
                      <img
                        src={sprite.currentCostume.image.src}
                        alt={sprite.name}
                        className="max-h-full max-w-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-2xl select-none">
                        {sprite.name.toLowerCase().includes("robot") ? "🤖" : "🍎"}
                      </span>
                    )}
                  </div>

                  {/* Name label */}
                  <div className={`text-center text-[10px] font-semibold py-1 px-0.5
                    truncate flex-shrink-0 transition-colors rounded-b-[10px]
                    ${isSelected
                      ? "bg-violet-600 text-white"
                      : `${dk ? "bg-[#26262d] text-gray-300" : "bg-gray-100 text-slate-600"}`
                    }`}>
                    {sprite.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── FAB footer — fixed 60px, always at bottom ───────────── */}
          <div className={`flex items-center justify-center px-3 border-t ${borderCol} ${gridBg}`}
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
                  onClick: () => { },
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
        <div className={`w-[90px] flex-shrink-0 border-l ${borderCol}
          ${sidebarBg} flex flex-col`} style={{ overflow: 'visible' }}>

          {/* Sidebar content — clickable, highlights when stage is selected */}
          <div className="flex-1 min-h-0 flex flex-col">

            {/* Stage card — clicking selects the stage, highlights with violet border */}
            <div
              onClick={() => onSelectSprite('stage')}
              className={`mx-2 mt-2 mb-1 rounded-xl cursor-pointer transition-all duration-150 overflow-hidden border-2
                ${isStageSelected
                  ? `border-violet-600 ${dk ? "bg-[#1e1a2e]" : "bg-white"} shadow-sm`
                  : `${borderCol} ${dk ? "bg-[#1c1c21]" : "bg-white"} hover:border-violet-300`
                }`}
            >
              {/* "Stage" header — violet bg when selected */}
              <div className={`text-center text-[10px] font-bold py-1 transition-colors
                ${isStageSelected
                  ? "bg-violet-600 text-white"
                  : `${dk ? "bg-[#26262d] text-gray-300" : "bg-gray-100 text-gray-600"}`
                }`}>
                Stage
              </div>

              {/* Backdrop thumbnail */}
              <div
                className={`w-full overflow-hidden ${dk ? "bg-[#26262d]" : "bg-gray-50"}`}
                style={{ aspectRatio: '4/3' }}
              >
                {currentBackdropSrc ? (
                  <img
                    key={`backdrop-${backdropVersion}-${currentBackdropSrc}`}
                    src={currentBackdropSrc}
                    alt="backdrop"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
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
            <div className="text-center flex-shrink-0 pb-1">
              <p className={`text-[10px] leading-tight ${dk ? "text-gray-400" : "text-gray-500"}`}>
                Backdrops
              </p>
              <p className={`text-base font-bold leading-tight
                ${dk ? "text-violet-400" : "text-violet-600"}`}>
                {backdropCount}
              </p>
            </div>

            {/* Spacer */}
            <div className="flex-1" />
          </div>

          {/* FAB footer — fixed 60px, matches sprite FAB footer exactly */}
          <div className={`flex items-center justify-center px-2 border-t ${borderCol} ${sidebarBg}`}
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
