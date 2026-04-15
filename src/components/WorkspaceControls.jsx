/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

/**
 * Shared floating workspace control buttons (Zoom In, Zoom Out, Undo, Redo).
 * Positioned in the bottom-right corner of the workspace.
 * 
 * Props:
 *   workspaceRef  – React ref to the Blockly WorkspaceSvg
 *   onAfterZoom   – optional callback fired after every zoom (e.g. to reset flyout scale)
 *   style         – optional extra container style overrides
 */
export default function WorkspaceControls({ workspaceRef, onAfterZoom, style }) {
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

    return (
        <div className="workspace-controls" style={style}>
            <button className="workspace-control-btn" onClick={undo} title="Undo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10h10a5 5 0 0 1 0 10H9" />
                    <polyline points="7 14 3 10 7 6" />
                </svg>
            </button>
            <button className="workspace-control-btn" onClick={redo} title="Redo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10H11a5 5 0 0 0 0 10h4" />
                    <polyline points="17 14 21 10 17 6" />
                </svg>
            </button>
            <button className="workspace-control-btn" onClick={zoomIn} title="Zoom In">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>
            <button className="workspace-control-btn" onClick={zoomOut} title="Zoom Out">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </button>
        </div>
    );
}
