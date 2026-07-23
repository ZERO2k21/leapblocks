/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { Plus } from "lucide-react";

export default function BackdropPanel({ BACKDROP_LIBRARY, backdrop, handleSetBackdrop, onBrowseBackdrops }) {
    return (
        <>
            <div className="p-[10px_12px_6px] flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 tracking-wider">BACKDROPS</span>
                <button
                    onClick={onBrowseBackdrops}
                    title="Browse Backdrops"
                    className="flex items-center gap-1 text-[10px] font-bold text-[#8B5CF6] bg-transparent border-none cursor-pointer p-[2px_4px] hover:text-purple-700"
                >
                    <Plus size={12} /> Add
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-[0_8px_8px]">
                {BACKDROP_LIBRARY.map(bd => (
                    <div key={bd.name} onClick={() => handleSetBackdrop(bd)}
                        className={`flex items-center gap-2 p-[7px_8px] rounded-lg cursor-pointer mb-1 border transition-all duration-200 ${
                            backdrop === bd.img
                                ? "bg-[#EDE7F6] border-[#8B5CF6]"
                                : "bg-transparent border-transparent hover:bg-[#F5F0FF]"
                        }`}>
                        <div className="w-9 h-6 rounded overflow-hidden shrink-0 border border-gray-300 bg-white">
                            {bd.img ? (
                                <img src={bd.img} alt={bd.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white flex items-center justify-center text-[9px] text-gray-400">Blank</div>
                            )}
                        </div>
                        <span className="text-xs text-gray-800">{bd.name}</span>
                        {backdrop === bd.img && <span className="ml-auto text-[10px] color-[#8B5CF6] text-[#8B5CF6]">✓</span>}
                    </div>
                ))}
            </div>
        </>
    );
}
