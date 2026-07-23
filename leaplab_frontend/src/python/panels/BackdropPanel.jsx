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
            <div className="py-2.5 px-3 pb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider">BACKDROPS</span>
                <button
                    type="button"
                    onClick={onBrowseBackdrops}
                    title="Browse Backdrops"
                    className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-transparent border-0 cursor-pointer py-0.5 px-1 hover:text-purple-700 transition-colors"
                >
                    <Plus size={12} /> Add
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
                {BACKDROP_LIBRARY.map(bd => (
                    <div
                        key={bd.name}
                        onClick={() => handleSetBackdrop(bd)}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer mb-1 border transition-all duration-200 ${
                            backdrop === bd.img
                                ? "bg-purple-100 border-purple-500"
                                : "bg-transparent border-transparent hover:bg-purple-50"
                        }`}
                    >
                        <div className="w-9 h-6 rounded overflow-hidden shrink-0 border border-slate-300 bg-white">
                            {bd.img ? (
                                <img src={bd.img} alt={bd.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white flex items-center justify-center text-xs text-slate-400">Blank</div>
                            )}
                        </div>
                        <span className="text-xs text-slate-800">{bd.name}</span>
                        {backdrop === bd.img && <span className="ml-auto text-xs text-purple-600 font-bold">✓</span>}
                    </div>
                ))}
            </div>
        </>
    );
}
