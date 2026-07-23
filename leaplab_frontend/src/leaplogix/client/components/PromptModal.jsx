/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { useLogix } from "../context/LogixContext";

export default function PromptModal() {
    const ctx = useLogix();

    if (!ctx.modalState.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl w-[400px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
                <div className="bg-[#8B5CF6] text-white p-3 px-4 text-base font-bold flex justify-between items-center">
                    {ctx.modalState.title}
                    <div onClick={ctx.handleModalCancel} className="cursor-pointer text-xl font-bold">×</div>
                </div>
                <div className="p-5">
                    <div className="mb-2.5 text-sm text-[#575E75]">{ctx.modalState.message}</div>
                    <input 
                        autoFocus 
                        type="text" 
                        value={ctx.modalInput} 
                        onChange={(e) => ctx.setModalInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') ctx.handleModalSubmit(); if (e.key === 'Escape') ctx.handleModalCancel(); }}
                        className="p-3 text-base rounded-lg border border-slate-200 w-full outline-none box-border font-sans" 
                    />
                </div>
                <div className="flex justify-end gap-3 p-5 pt-0">
                    <button onClick={ctx.handleModalCancel} className="p-2 px-4 rounded-md border border-slate-200 bg-white cursor-pointer text-sm text-slate-500 hover:bg-slate-50">Cancel</button>
                    <button onClick={ctx.handleModalSubmit} className="p-2 px-4 rounded-md border-none bg-[#8B5CF6] color-white text-white cursor-pointer text-sm font-bold hover:bg-purple-700">OK</button>
                </div>
            </div>
        </div>
    );
}
