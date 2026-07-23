/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { Undo, Redo, Trash2, Play, Square } from "lucide-react";

// ─── Theme (Leapblocks Colors) ─────────────────────────────────────────────────
export default function ToolBar({ isRunning, onRun, onStop }) {
    return (
        <div className="h-10 bg-white flex items-center px-4 justify-between border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
                {/* Blocks/Python tabs */}
                <div className="flex bg-gray-100 rounded-md overflow-hidden">
                    <div className="py-1.5 px-4 bg-gray-100 text-gray-500 text-xs font-semibold cursor-pointer">Blocks</div>
                    <div className="py-1.5 px-4 bg-purple-500 text-white text-xs font-semibold cursor-pointer">Python</div>
                </div>
                <div className="w-px h-5 bg-gray-200" />
                {/* Costumes/Sounds tabs */}
                <div className="flex bg-gray-100 rounded-md overflow-hidden">
                    <div className="py-1.5 px-4 bg-purple-500 text-white text-xs font-semibold cursor-pointer">Costumes</div>
                    <div className="py-1.5 px-4 bg-gray-100 text-gray-500 text-xs font-semibold cursor-pointer">Sounds</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Editing tools */}
                <div className="flex gap-1">
                    <div title="Undo (Ctrl+Z)" className="cursor-pointer p-1 px-1.5 text-gray-500 rounded hover:bg-gray-100">
                        <Undo size={16} />
                    </div>
                    <div title="Redo (Ctrl+Y)" className="cursor-pointer p-1 px-1.5 text-gray-500 rounded hover:bg-gray-100">
                        <Redo size={16} />
                    </div>
                    <div title="Copy (Ctrl+C)" className="cursor-pointer p-1 px-1.5 text-gray-500 rounded hover:bg-gray-100">
                        <span className="text-sm">📋</span>
                    </div>
                    <div title="Paste (Ctrl+V)" className="cursor-pointer p-1 px-1.5 text-gray-500 rounded hover:bg-gray-100">
                        <span className="text-sm">📄</span>
                    </div>
                    <div title="Delete" className="cursor-pointer p-1 px-1.5 text-gray-500 rounded hover:bg-gray-100">
                        <Trash2 size={16} />
                    </div>
                </div>
                <div className="w-px h-5 bg-gray-200" />
                {/* Quick Run Button */}
                <div 
                    onClick={onRun} 
                    title="Run Code (Ctrl+Enter or F5)"
                    className={`run-button py-1.5 px-4 text-white rounded-md flex items-center gap-1.5 text-xs font-bold transition-all ${
                        isRunning 
                            ? 'cursor-not-allowed bg-gray-400 opacity-70' 
                            : 'cursor-pointer bg-emerald-500 shadow-[0_2px_4px_rgba(16,185,129,0.3)] hover:bg-emerald-600'
                    }`}
                >
                    {isRunning ? (
                        <>
                            <span className="animate-spin">⚙</span>
                            <span>Running...</span>
                        </>
                    ) : (
                        <>
                            <Play size={14} className="fill-white text-white" />
                            <span>Run</span>
                        </>
                    )}
                </div>
                <div 
                    onClick={onStop} 
                    title="Stop (Escape)"
                    className="stop-button cursor-pointer py-1.5 px-3 bg-white text-red-500 border border-red-500 rounded-md flex items-center gap-1 text-xs font-semibold transition-all hover:bg-red-50"
                >
                    <Square size={12} className="fill-red-500 text-red-500" />
                    <span>Stop</span>
                </div>
            </div>
        </div>
    );
}
