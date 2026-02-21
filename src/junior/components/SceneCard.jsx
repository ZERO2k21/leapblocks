import React from 'react';
import { Film } from 'lucide-react';

export default function SceneCard({ scene, active, onClick, onDelete, onEdit }) {
    const label = scene.name || `Scene ${scene.id}`;

    // Get first sprite from scene for thumbnail
    const thumbnail = scene.sprites?.[0]?.image || null;
    const thumbnailEmoji = scene.sprites?.[0]?.costumes?.default || "🎬";

    // Scene background color
    const bgColor = scene.background || "#FFFFFF";

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
                {/* Film/Clapperboard Icon */}
                <div style={{
                    width: "18px",
                    height: "18px",
                    background: active ? "white" : "#7B4FC4",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <Film size={10} color={active ? "#7B4FC4" : "white"} />
                </div>

                {/* Pencil/Edit Icon */}
                <div
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(scene.id); }}
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
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={active ? "#7B4FC4" : "white"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                </div>
            </div>

            {/* Scene Thumbnail Area */}
            <div style={{
                width: "100%",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: bgColor,
                padding: "5px",
                position: "relative"
            }}>
                {thumbnail ? (
                    <img src={thumbnail} alt={label} style={{ maxWidth: "40px", maxHeight: "40px", objectFit: "contain" }} />
                ) : (
                    <span style={{ fontSize: "24px" }}>{thumbnailEmoji}</span>
                )}

                {/* Small scene indicator */}
                <div style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "12px",
                    height: "12px",
                    background: "#E74C3C",
                    borderRadius: "2px"
                }} />
            </div>

            {/* Label */}
            <div style={{
                width: "100%",
                fontSize: "9px",
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
