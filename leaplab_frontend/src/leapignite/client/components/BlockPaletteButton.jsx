/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef } from 'react';
import { previewActions } from "../../server/engine/previewActions";

let lastPreview = 0;

function safePreview(fn) {
    const now = Date.now();
    // 300ms Cooldown
    if (now - lastPreview > 300) {
        fn();
        lastPreview = now;
    }
}

export default function BlockPaletteButton({ type, icon, label, onDragStart }) {
    const [isActive, setIsActive] = useState(false);
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e) => {
        isDragging.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };

        // Notify parent to start listening for global moves (vital for drag)
        onDragStart(e, type);
    };

    // We only handle the CLICK here. The actual DRAG movement is handled by the parent overlay
    // to ensure the element can move outside this container.
    // However, we need to know if it was a click or a slight move that ended.

    // Actually, the parent (BlockPalette) will handle the global move/up.
    // But we need to trigger the PREVIEW if the parent tells us "It was just a click".

    // SIMPLER APPROACH:
    // We handle local state. If the parent detects a drag, it takes over.
    // If the parent detects a MouseUp without Drag, it calls our 'onClick'.

    const triggerPreview = () => {
        setIsActive(true);
        setTimeout(() => setIsActive(false), 200); // Visual Pulse

        if (previewActions[type]) {
            safePreview(() => previewActions[type]());
        }
    };

    return (
        <div
            className={`palette-block w-20 h-14 m-1 bg-sky-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-transform duration-100 select-none relative ${isActive ? 'active-pulse scale-95' : ''}`}
            onPointerDown={handlePointerDown}
        >
            <div className="icon w-8 h-8 pointer-events-none">
                <img src={icon} alt={label} className="w-full h-full" />
            </div>
        </div>
    );
}
