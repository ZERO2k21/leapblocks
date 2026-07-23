/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { useLogix } from "../context/LogixContext";

export default function SpriteLibraryModal() {
    const ctx = useLogix();

    if (!ctx.showSpriteLibrary) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl w-[600px] max-h-[80vh] shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col">
                <div className="bg-[#8B5CF6] text-white p-3 px-4 text-base font-bold flex justify-between items-center">
                    {ctx.libraryMode === "costume" ? "Choose a Costume" : "Choose a Sprite"}
                    <div onClick={() => ctx.setShowSpriteLibrary(false)} className="cursor-pointer text-xl font-bold">×</div>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-3">
                        {ctx.getSpriteLibrary().map(sp => (
                            <div key={sp.name} onClick={() => {
                                if (ctx.libraryMode === "costume" && ctx.selectedSpriteId) {
                                    const costumeId = `costume_${Date.now()}`;
                                    const img = sp.img || sp.image || sp.emoji;
                                    ctx.updateSpriteProperty(ctx.selectedSpriteId, 'costumes', {
                                        ...ctx.sprites.find(s => s.id === ctx.selectedSpriteId).costumes,
                                        [costumeId]: img
                                    });
                                    ctx.updateSpriteProperty(ctx.selectedSpriteId, 'currentCostume', costumeId);
                                    ctx.addLog(`Added costume to ${ctx.sprites.find(s => s.id === ctx.selectedSpriteId).name}`, 'success');
                                } else {
                                    ctx.addSpriteFromLibrary(sp);
                                }
                                ctx.setShowSpriteLibrary(false);
                            }} className="bg-[#F5F0FF] border-2 border-transparent hover:border-[#8B5CF6] rounded-xl p-3 cursor-pointer text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                <img src={sp.img} alt={sp.name} className="w-12 h-12 object-contain mx-auto" onError={e => { e.currentTarget.style.display = 'none'; }} />
                                <div className="text-[11px] font-semibold text-slate-800 mt-1.5">{sp.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
