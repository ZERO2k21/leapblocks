import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

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
                width: "80px",
                background: "white",
                borderRadius: "10px",
                border: active ? "3px solid #7B4FC4" : "2px solid #E0E0E0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                overflow: "hidden",
                boxShadow: active ? "0 3px 12px rgba(123, 79, 196, 0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
                flexShrink: 0,
            }}
        >
            {/* Sprite Image Area */}
            <div style={{
                width: "100%",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "white",
                padding: "6px",
                position: "relative",
            }}>
                {/* Edit Badge (top-left) */}
                <div
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(sprite.id); }}
                    style={{
                        position: "absolute",
                        top: "3px",
                        left: "3px",
                        width: "22px",
                        height: "22px",
                        background: "#7B4FC4",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                        boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
                        transition: "transform 0.15s",
                    }}
                    title="Edit Sprite"
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                    <Pencil size={11} color="white" />
                </div>

                {/* Delete Badge (top-right) */}
                <div
                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(sprite.id); }}
                    style={{
                        position: "absolute",
                        top: "3px",
                        right: "3px",
                        width: "22px",
                        height: "22px",
                        background: "#7B4FC4",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                        boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
                        transition: "transform 0.15s",
                    }}
                    title="Delete Sprite"
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                    <Trash2 size={11} color="white" />
                </div>

                {/* Sprite Image */}
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
                fontWeight: "700",
                color: "white",
                background: "#7B4FC4",
                padding: "4px 0",
                textAlign: "center",
                letterSpacing: "0.3px",
            }}>
                {label}
            </div>
        </div>
    );
}
