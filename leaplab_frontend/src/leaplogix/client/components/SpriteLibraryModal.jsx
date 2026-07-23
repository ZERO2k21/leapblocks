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
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] shadow-2xl overflow-hidden flex flex-col mx-4">
                <div className="bg-violet-500 text-white py-3 px-4 text-base font-bold flex justify-between items-center">
                    <span>{ctx.libraryMode === "costume" ? "Choose a Costume" : "Choose a Sprite"}</span>
                    <button 
                        type="button" 
                        onClick={() => ctx.setShowSpriteLibrary(false)} 
                        className="cursor-pointer text-xl font-bold hover:text-violet-200 transition-colors leading-none bg-transparent border-0 text-white"
                    >
                        ×
                    </button>
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
                            }} className="bg-purple-50 border-2 border-transparent hover:border-violet-500 rounded-xl p-3 cursor-pointer text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                <img src={sp.img} alt={sp.name} className="w-12 h-12 object-contain mx-auto" onError={e => { e.currentTarget.classList.add('hidden'); }} />
                                <div className="text-xs font-semibold text-slate-800 mt-1.5">{sp.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
