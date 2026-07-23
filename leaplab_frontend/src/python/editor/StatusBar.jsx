/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";

export default function StatusBar({ editorCursor, isRunning, activeFile }) {
    return (
        <div className="h-5.5 bg-[#7C3AED] flex items-center px-3 text-[11px] text-white/85 gap-4 shrink-0 font-sans">
            <span>Python 3</span>
            <span>Ln {editorCursor.line}, Col {editorCursor.col}</span>
            <span>{isRunning ? "● Running" : "○ Ready"}</span>
            <span className="ml-auto">{activeFile}</span>
        </div>
    );
}
