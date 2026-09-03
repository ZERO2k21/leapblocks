/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

/* ─────────────── Action Icon Button ─────────────── */
export default function ActionIcon({ icon, label, onClick, bgColor, hoverBg, outlineColor, active, activeBg, size = 48, disabled = false, loading = false }) {
    const [hovered, setHovered] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);

    const isFilled = !!bgColor || active;
    const bg = active && activeBg
        ? activeBg
        : bgColor
            ? (hovered && !disabled && !loading ? (hoverBg || bgColor) : bgColor)
            : hovered && !disabled
                ? "rgba(123,79,196,0.1)"
                : "transparent";

    const handleClick = (e) => {
        if (disabled || loading) return;
        setPressed(true);
        setTimeout(() => setPressed(false), 180);
        onClick?.(e);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            title={label}
            disabled={disabled || loading}
            aria-pressed={active}
            aria-busy={loading}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            onMouseDown={() => !disabled && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            className={`rounded-xl flex items-center justify-center outline-none p-0 shadow-sm focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-1 transition-all duration-200 ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110 hover:shadow-lg active:scale-95"} ${pressed && !disabled ? "scale-95 shadow-inner" : ""} ${loading ? "cursor-wait" : ""}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                border: outlineColor && !isFilled && outlineColor !== "transparent" ? `2.5px solid ${outlineColor}` : "none",
                background: bg,
                transform: pressed && !disabled ? 'scale(0.92)' : hovered && !disabled ? 'scale(1.05)' : 'scale(1)',
            }}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : icon}
        </button>
    );
}
