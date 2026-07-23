/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

export default function SpriteProperties({ selectedSprite, selectedSpriteId, updateSpriteProperty }) {
    // Get position values (support both old x/y and new position.x/position.y)
    const spriteX = selectedSprite?.position?.x ?? selectedSprite?.x ?? 0;
    const spriteY = selectedSprite?.position?.y ?? selectedSprite?.y ?? 0;
    const spriteDirection = selectedSprite?.direction ?? selectedSprite?.angle ?? 0;

    // Get costume list for switching
    const costumeKeys = Object.keys(selectedSprite?.costumes || {});
    const currentCostumeIndex = costumeKeys.indexOf(selectedSprite?.currentCostume);

    const handlePrevCostume = () => {
        if (costumeKeys.length <= 1) return;
        const newIndex = currentCostumeIndex <= 0 ? costumeKeys.length - 1 : currentCostumeIndex - 1;
        updateSpriteProperty(selectedSpriteId, 'currentCostume', costumeKeys[newIndex]);
    };

    const handleNextCostume = () => {
        if (costumeKeys.length <= 1) return;
        const newIndex = (currentCostumeIndex + 1) % costumeKeys.length;
        updateSpriteProperty(selectedSpriteId, 'currentCostume', costumeKeys[newIndex]);
    };

    return (
        <div className="border-t border-gray-200 p-2.5 px-3 bg-white shrink-0">
            {/* Sprite Name Row (LeapBlox Style) */}
            <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[11px] font-semibold text-gray-500 min-w-[40px]">Sprite</span>
                <input
                    type="text"
                    value={selectedSprite?.name || ''}
                    onChange={e => updateSpriteProperty(selectedSpriteId, 'name', e.target.value)}
                    className="flex-1 p-1.5 px-2 border border-gray-200 rounded text-xs font-semibold bg-gray-100 text-gray-800 outline-none focus:border-purple-500"
                />
            </div>

            {/* Position Row (LeapBlox Style) */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] text-gray-500">↔</span>
                <span className="text-[10px] font-semibold text-gray-500">x</span>
                <input
                    type="number"
                    value={Math.round(spriteX)}
                    onChange={e => updateSpriteProperty(selectedSpriteId, 'x', parseFloat(e.target.value) || 0)}
                    className="w-[50px] p-1 px-1.5 border border-gray-200 rounded text-[11px] font-semibold bg-gray-100 text-center text-gray-800 outline-none focus:border-purple-500"
                />
                <span className="text-[11px] text-gray-500">↕</span>
                <span className="text-[10px] font-semibold text-gray-500">y</span>
                <input
                    type="number"
                    value={Math.round(spriteY)}
                    onChange={e => updateSpriteProperty(selectedSpriteId, 'y', parseFloat(e.target.value) || 0)}
                    className="w-[50px] p-1 px-1.5 border border-gray-200 rounded text-[11px] font-semibold bg-gray-100 text-center text-gray-800 outline-none focus:border-purple-500"
                />
            </div>

            {/* Show/Hide, Size, Direction Row (LeapBlox Style) */}
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
                {/* Show/Hide Toggle */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-500">Show</span>
                    <div className="flex gap-0.5">
                        <button 
                            onClick={() => updateSpriteProperty(selectedSpriteId, 'visible', true)}
                            className={`p-1 px-1.5 rounded cursor-pointer transition-all border ${
                                selectedSprite?.visible ? 'bg-purple-700 border-purple-700 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'
                            }`}
                        >
                            <Eye size={12} />
                        </button>
                        <button 
                            onClick={() => updateSpriteProperty(selectedSpriteId, 'visible', false)}
                            className={`p-1 px-1.5 rounded cursor-pointer transition-all border ${
                                !selectedSprite?.visible ? 'bg-purple-700 border-purple-700 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'
                            }`}
                        >
                            <EyeOff size={12} />
                        </button>
                    </div>
                </div>

                {/* Size */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-500">Size</span>
                    <input
                        type="number"
                        value={selectedSprite?.size || 100}
                        onChange={e => updateSpriteProperty(selectedSpriteId, 'size', parseFloat(e.target.value) || 100)}
                        className="w-[50px] p-1 px-1.5 border border-gray-200 rounded text-[11px] font-semibold bg-gray-100 text-center text-gray-800 outline-none focus:border-purple-500"
                    />
                </div>

                {/* Direction */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-500">Direction</span>
                    <input
                        type="number"
                        value={spriteDirection}
                        onChange={e => updateSpriteProperty(selectedSpriteId, 'direction', parseFloat(e.target.value) || 0)}
                        className="w-[50px] p-1 px-1.5 border border-gray-200 rounded text-[11px] font-semibold bg-gray-100 text-center text-gray-800 outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Costume Switcher Row */}
            {costumeKeys.length > 1 && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-semibold text-gray-500 min-w-[50px]">Costume</span>
                    <button
                        onClick={handlePrevCostume}
                        className="p-1 px-1.5 bg-gray-100 border border-gray-200 rounded cursor-pointer text-gray-500 flex items-center hover:bg-gray-200"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[11px] font-semibold text-gray-800 flex-1 text-center bg-gray-100 p-1 px-2 rounded border border-gray-200">
                        {selectedSprite?.currentCostume || 'default'} ({currentCostumeIndex + 1}/{costumeKeys.length})
                    </span>
                    <button
                        onClick={handleNextCostume}
                        className="p-1 px-1.5 bg-gray-100 border border-gray-200 rounded cursor-pointer text-gray-500 flex items-center hover:bg-gray-200"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
