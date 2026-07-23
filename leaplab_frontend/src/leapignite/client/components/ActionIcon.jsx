/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

/* ─────────────── Action Icon Button ─────────────── */
export default function ActionIcon({ icon, label, onClick, bgColor, hoverBg, outlineColor, active, activeBg, size = 48 }) {
    const [hovered, setHovered] = React.useState(false);

    const isFilled = !!bgColor || active;
    const bg = active && activeBg
        ? activeBg
        : bgColor
            ? (hovered ? (hoverBg || bgColor) : bgColor)
            : hovered
                ? "rgba(123,79,196,0.1)"
                : "transparent";

    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="rounded-xl cursor-pointer flex items-center justify-center transition-all duration-200 outline-none p-0 hover:scale-110 hover:shadow-lg shadow-sm"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                border: outlineColor && !isFilled && outlineColor !== "transparent" ? `2.5px solid ${outlineColor}` : "none",
                background: bg,
            }}
        >
            {icon}
        </button>
    );
}
