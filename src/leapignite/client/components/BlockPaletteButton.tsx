/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef } from 'react';
import { previewActions } from "../../server/engine/previewActions";

let lastPreview = 0;

function safePreview(fn: () => void) {
    const now = Date.now();
    // 300ms Cooldown
    if (now - lastPreview > 300) {
        fn();
        lastPreview = now;
    }
}

interface BlockPaletteButtonProps {
    type: string;
    icon: string;
    label: string;
    onDragStart: (e: React.PointerEvent, type: string) => void;
}

export default function BlockPaletteButton({ type, icon, label, onDragStart }: BlockPaletteButtonProps) {
    const [isActive, setIsActive] = useState(false);
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };

        // Notify parent to start listening for global moves (vital for drag)
        onDragStart(e, type);
    };

    const triggerPreview = () => {
        setIsActive(true);
        setTimeout(() => setIsActive(false), 200); // Visual Pulse

        if ((previewActions as any)[type]) {
            safePreview(() => (previewActions as any)[type]());
        }
    };

    return (
        <div
            className={`palette-block ${isActive ? 'active-pulse' : ''}`}
            onPointerDown={handlePointerDown}
            style={{
                width: "80px",
                height: "60px",
                margin: "5px",
                background: "#5FA8F5", // Default blue, should override based on type/category
                borderRadius: "18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.1s, box-shadow 0.1s",
                userSelect: "none",
                position: "relative" // For stacking context
            }}
        >
            <div className="icon" style={{ width: "32px", height: "32px", pointerEvents: "none" }}>
                <img src={icon} alt={label} style={{ width: "100%", height: "100%" }} />
            </div>
            {/* Junior blocks don't usually have labels on the block itself in palette, 
                but user showed label code. We'll render it small. */}
            {/* <div className="label" style={{ fontSize: "10px", color: "white", marginTop: "2px" }}>{label}</div> */}
        </div>
    );
}
