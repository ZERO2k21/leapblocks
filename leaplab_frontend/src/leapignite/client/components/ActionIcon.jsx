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
            onClick={onClick}
            title={label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "12px",
                border: outlineColor && !isFilled && outlineColor !== "transparent" ? `2.5px solid ${outlineColor}` : "none",
                background: bg,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                transform: hovered ? "scale(1.1)" : "scale(1)",
                boxShadow: hovered ? "0 4px 12px rgba(123,79,196,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                outline: "none",
                padding: 0,
            }}
        >
            {icon}
        </button>
    );
}
