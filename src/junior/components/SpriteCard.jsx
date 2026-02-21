import React from 'react';
import { Pencil, X } from 'lucide-react';

export default function SpriteCard({ sprite, active, onClick, onDelete, onEdit }) {
    const label = sprite.name;

    // Use actual sprite image if available, otherwise emoji
    const spriteImage = sprite.image || null;
    const displayIcon = sprite.costumes?.default || "🐻";

    return (
        <div
            onClick={onClick}
            style={{
                position: "relative",
                width: "75px",
                background: "white",
                borderRadius: "8px",
                border: active ? "3px solid #7B4FC4" : "2px solid #E0E0E0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                overflow: "hidden",
                boxShadow: active ? "0 2px 8px rgba(123, 79, 196, 0.3)" : "0 1px 3px rgba(0,0,0,0.08)",
            }}
        >
            {/* Top Icon Bar */}
            <div style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                padding: "3px",
                background: active ? "#7B4FC4" : "#E8E8E8"
            }}>
                {/* Pencil/Edit Icon */}
                <div
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(sprite.id); }}
                    style={{
                        width: "18px",
                        height: "18px",
                        background: active ? "white" : "#7B4FC4",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                >
                    <Pencil size={10} color={active ? "#7B4FC4" : "white"} />
                </div>

                {/* X/Delete Icon */}
                <div
                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(sprite.id); }}
                    style={{
                        width: "18px",
                        height: "18px",
                        background: active ? "white" : "#7B4FC4",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                >
                    <X size={12} color={active ? "#7B4FC4" : "white"} />
                </div>
            </div>

            {/* Sprite Image Area */}
            <div style={{
                width: "100%",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "white",
                padding: "5px"
            }}>
                {spriteImage || (typeof displayIcon === 'string' && displayIcon.includes('/')) ? (
                    <img src={spriteImage || displayIcon} alt={label} style={{ maxWidth: "45px", maxHeight: "45px", objectFit: "contain" }} />
                ) : (
                    <span style={{ fontSize: "32px" }}>{displayIcon}</span>
                )}
            </div>

            {/* Label */}
            <div style={{
                width: "100%",
                fontSize: "10px",
                fontWeight: "600",
                color: "white",
                background: "#7B4FC4",
                padding: "4px 0",
                textAlign: "center"
            }}>
                {label}
            </div>
        </div>
    );
}
