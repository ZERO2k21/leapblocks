/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

/**
 * Shared floating workspace control buttons (Zoom In, Zoom Out, Undo, Redo, Reset Zoom).
 * Positioned in the bottom-right corner of the workspace.
 * 
 * Props:
 *   workspaceRef  – React ref to the Blockly WorkspaceSvg
 *   onAfterZoom   – optional callback fired after every zoom (e.g. to reset flyout scale)
 *   style         – optional extra container style overrides
 *   startScale    – optional reset zoom target (default: 1.0)
 */
export default function WorkspaceControls({ workspaceRef, onAfterZoom, style, startScale = 1.0 }) {
    const resetFlyout = () => {
        if (onAfterZoom) onAfterZoom();
    };

    const zoomIn = () => {
        const ws = workspaceRef.current;
        if (!ws) return;
        const m = ws.getMetrics();
        ws.zoom(m.viewWidth / 2, m.viewHeight / 2, 1);
        resetFlyout();
    };

    const zoomOut = () => {
        const ws = workspaceRef.current;
        if (!ws) return;
        const m = ws.getMetrics();
        ws.zoom(m.viewWidth / 2, m.viewHeight / 2, -1);
        resetFlyout();
    };

    const undo = () => workspaceRef.current?.undo(false);
    const redo = () => workspaceRef.current?.undo(true);

    const resetZoom = () => {
        const ws = workspaceRef.current;
        if (!ws) return;
        ws.setScale(startScale);
        ws.scrollCenter();
        resetFlyout();
    };

    const btnClass = "w-9 h-9 rounded-full bg-white/95 border [border-width:1.5px] border-slate-200 shadow-md flex items-center justify-center text-slate-500 transition-all duration-200 outline-none p-0 backdrop-blur-md hover:bg-slate-100 hover:scale-110 hover:shadow-lg hover:text-slate-800 active:scale-95 active:shadow-sm";

    return (
        <div className="absolute right-[14px] bottom-[14px] flex flex-col gap-1.5 z-[90]" style={style}>
            <button className={btnClass} onClick={undo} title="Undo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10h10a5 5 0 0 1 0 10H9" />
                    <polyline points="7 14 3 10 7 6" />
                </svg>
            </button>
            <button className={btnClass} onClick={redo} title="Redo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10H11a5 5 0 0 0 0 10h4" />
                    <polyline points="17 14 21 10 17 6" />
                </svg>
            </button>
            <button className={btnClass} onClick={zoomIn} title="Zoom In">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>
            <button className={btnClass} onClick={zoomOut} title="Zoom Out">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>
            <button className={btnClass} onClick={resetZoom} title="Reset Zoom">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    );
}
