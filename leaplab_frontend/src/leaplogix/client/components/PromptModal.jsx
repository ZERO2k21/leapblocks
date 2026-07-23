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
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden mx-4">
                <div className="bg-violet-500 text-white py-3 px-4 text-base font-bold flex justify-between items-center">
                    <span>{ctx.modalState.title}</span>
                    <button 
                        type="button"
                        onClick={ctx.handleModalCancel} 
                        className="cursor-pointer text-xl font-bold hover:text-violet-200 transition-colors leading-none bg-transparent border-0 text-white"
                    >
                        ×
                    </button>
                </div>
                <div className="p-5">
                    <div className="mb-2.5 text-sm text-slate-600">{ctx.modalState.message}</div>
                    <input 
                        autoFocus 
                        type="text" 
                        value={ctx.modalInput} 
                        onChange={(e) => ctx.setModalInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') ctx.handleModalSubmit(); if (e.key === 'Escape') ctx.handleModalCancel(); }}
                        className="p-3 text-base rounded-lg border border-slate-200 w-full outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-sans" 
                    />
                </div>
                <div className="flex justify-end gap-3 p-5 pt-0">
                    <button 
                        type="button"
                        onClick={ctx.handleModalCancel} 
                        className="py-2 px-4 rounded-md border border-slate-200 bg-white cursor-pointer text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={ctx.handleModalSubmit} 
                        className="py-2 px-4 rounded-md border-0 bg-violet-500 text-white cursor-pointer text-sm font-bold hover:bg-violet-600 transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
