/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Blockly from '@blockly-runtime';

/**
 * Drag-to-delete trash overlay for the Blockly workspace.
 * When a user drags a block from the workspace toward the toolbox / left edge,
 * a large trash icon appears, indicating the block will be deleted.
 *
 * Props:
 *   workspaceRef – React ref to the Blockly WorkspaceSvg
 */
export default function WorkspaceTrash({ workspaceRef }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isOverTrash, setIsOverTrash] = useState(false);

    const handleDrag = useCallback((event) => {
        if (event.type !== Blockly.Events.BLOCK_DRAG) return;

        if (event.isStart) {
            setIsDragging(true);
        } else {
            // Drag ended
            setIsDragging(false);
            setIsOverTrash(false);
        }
    }, []);

    useEffect(() => {
        const ws = workspaceRef.current;
        if (!ws) return;

        ws.addChangeListener(handleDrag);
        return () => ws.removeChangeListener(handleDrag);
    }, [workspaceRef, handleDrag]);

    // Track mouse position to detect when block is near the toolbox
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            // Treat the left 20% of the viewport as the "trash zone"
            const threshold = window.innerWidth * 0.20;
            setIsOverTrash(e.clientX < threshold);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isDragging]);

    if (!isDragging) return null;

    return (
        <div className={`absolute left-0 top-0 w-[18%] h-full flex items-center justify-center z-[85] pointer-events-none transition-colors duration-200 ${isOverTrash ? 'bg-red-500/10' : ''}`}>
            <div className={`flex flex-col items-center justify-center transition-all duration-200 ${isOverTrash ? 'text-red-500/80 scale-115' : 'text-slate-400/60'}`}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                {isOverTrash && (
                    <div className="text-[22px] font-bold text-red-500/90 mt-0.5 animate-pulse">✕</div>
                )}
            </div>
        </div>
    );
}
