/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * SpritePanel - Final Tailwind Version (Matching LEAPLAB Stage Look)
 */

import React, { useState } from "react";
import { Sprite, SpriteType } from "./Sprite";
import { ActionMenu } from "./ActionMenu";
import type { StageManager } from '../engine/StageManager';

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
  backdropVersion,
  isFullscreen = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId);
  const isStageSelected = selectedSpriteId === 'stage';

  const normalSprites = sprites.filter(s => s.id !== 'stage' && !s.id.includes('_clone_'));

  const cloneCounts = sprites.reduce((acc: Record<string, number>, s) => {
    if (s.id.includes('_clone_')) {
      const base = s.id.split('_clone_')[0];
      acc[base] = (acc[base] || 0) + 1;
    }
    return acc;
  }, {});

  const backdropCount = stageManager.getAllBackdrops().length;
  const currentBackdropSrc = stageManager.getCurrentBackdrop()?.src;

  const handleAddSprite = (type: SpriteType) => {
    onAddSprite(type);
    setShowPicker(false);
  };

  return (
    <div className={`flex flex-col h-full rounded-3xl border overflow-hidden bg-white shadow-sm
      ${isFullscreen ? 'border-gray-700 bg-[#16161a]' : 'border-gray-200'}`}>

      {/* Sprite Properties Bar */}
      <div className={`px-6 py-4 border-b ${isFullscreen ? 'bg-[#1c1c21] border-gray-700' : 'bg-[#F0F4FA] border-gray-200'}`}>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">
              {isStageSelected ? 'STAGE' : 'SPRITE'}
            </label>
            <input
              type="text"
              value={selectedSprite?.name || ''}
              onChange={(e) => selectedSprite?.setName?.(e.target.value)}
              disabled={isStageSelected || !selectedSprite}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-sm focus:border-violet-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>

          {!isStageSelected && selectedSprite && (
            <div className="flex gap-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">x</span>
                <input
                  type="number"
                  value={Math.round(selectedSprite.x)}
                  onChange={(e) => selectedSprite.setX?.(Number(e.target.value))}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-2xl text-center text-sm focus:border-violet-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">y</span>
                <input
                  type="number"
                  value={Math.round(selectedSprite.y)}
                  onChange={(e) => selectedSprite.setY?.(Number(e.target.value))}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-2xl text-center text-sm focus:border-violet-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Size, Direction, Show/Hide */}
        <div className="flex items-center gap-8 mt-4">
          {!isStageSelected && selectedSprite ? (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Show</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => selectedSprite.show?.()}
                    className={`px-4 py-2 border rounded-2xl text-lg ${selectedSprite.visible ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-gray-300'}`}
                  >
                    👁
                  </button>
                  <button
                    onClick={() => selectedSprite.hide?.()}
                    className={`px-4 py-2 border rounded-2xl text-lg ${!selectedSprite.visible ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-gray-300'}`}
                  >
                    🙈
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Size</label>
                <input
                  type="number"
                  value={Math.round(selectedSprite.size)}
                  onChange={(e) => selectedSprite.setSize?.(Number(e.target.value))}
                  className="w-20 px-4 py-2 border border-gray-300 rounded-2xl text-center focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Direction</label>
                <input
                  type="number"
                  value={Math.round(selectedSprite.direction)}
                  onChange={(e) => selectedSprite.pointInDirection?.(Number(e.target.value))}
                  className="w-20 px-4 py-2 border border-gray-300 rounded-2xl text-center focus:border-violet-500"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">Stage backdrops cannot be moved or hidden.</p>
          )}
        </div>
      </div>

      {/* Main Content - Sprites + Stage */}
      <div className="flex flex-1 min-h-0 bg-white">
        {/* Sprites Area - 5 Column Grid */}
        <div className="flex-1 p-5 overflow-auto slim-scrollbar grid grid-cols-5 gap-4 content-start">
          {normalSprites.map((sprite) => {
            const isSelected = selectedSpriteId === sprite.id;
            const cloneCount = cloneCounts[sprite.id] || 0;

            return (
              <div
                key={sprite.id}
                onClick={() => onSelectSprite(sprite.id)}
                className={`relative bg-white border-2 rounded-2xl p-3 cursor-pointer transition-all hover:shadow-md group
                  ${isSelected ? 'border-violet-600 shadow-violet-200' : 'border-gray-200 hover:border-gray-300'}`}
              >
                {isSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSprite(sprite.id); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xl leading-none shadow hover:bg-red-600 z-10"
                  >
                    ×
                  </button>
                )}

                {cloneCount > 0 && (
                  <div className="absolute -top-2 -left-2 bg-amber-500 text-white text-xs font-bold px-2 rounded-full border-2 border-white">
                    {cloneCount}
                  </div>
                )}

                <div className="h-20 flex items-center justify-center mb-3">
                  {sprite.currentCostume?.image?.src ? (
                    <img
                      src={sprite.currentCostume.image.src}
                      alt={sprite.name}
                      className="max-h-20 object-contain"
                    />
                  ) : (
                    <span className="text-6xl">{sprite.name.includes('Robot') ? '🤖' : '🍎'}</span>
                  )}
                </div>

                <div className={`text-center text-xs font-medium py-2 rounded-xl truncate
                  ${isSelected ? 'bg-violet-600 text-white' : 'bg-gray-50 text-slate-700'}`}>
                  {sprite.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage Area */}
        <div className="w-[130px] border-l border-gray-100 bg-white flex flex-col">
          <div className="bg-violet-600 text-white py-3 text-center font-semibold text-sm">
            Stage
          </div>

          <div className="flex-1 p-4 flex flex-col items-center justify-center">
            <div className="w-full aspect-square bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-inner mb-4">
              {currentBackdropSrc ? (
                <img
                  src={currentBackdropSrc}
                  alt="Backdrop"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center">
                  <span className="text-7xl opacity-40">🌅</span>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">Backdrops</p>
              <p className="text-2xl font-bold text-violet-600 mt-0.5">{backdropCount}</p>
            </div>
          </div>

          {/* Add Backdrop Button */}
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <ActionMenu
              mainIcon="🌄"
              color="#7C3AED"
              tooltipLabel="Add Backdrop"
              actions={[
                { id: 'library', icon: '🔍', label: 'Choose Backdrop', onClick: onOpenBackdropLibrary },
                { id: 'surprise', icon: '✨', label: 'Surprise' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Floating Add Sprite Button */}
      <div className="absolute bottom-6 left-6 z-30">
        <ActionMenu
          mainIcon="➕"
          color="#8B5CF6"
          tooltipLabel="Add Sprite"
          actions={[
            { id: 'library', icon: '🔍', label: 'Library', onClick: onOpenSpriteLibrary || (() => setShowPicker(!showPicker)) },
            { id: 'surprise', icon: '✨', label: 'Surprise Sprite', onClick: () => handleAddSprite(SPRITE_TYPES[Math.floor(Math.random() * SPRITE_TYPES.length)].type) },
          ]}
        />
      </div>
    </div>
  );
};

export default SpritePanel;