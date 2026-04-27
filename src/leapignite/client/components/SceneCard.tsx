/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Image, X } from 'lucide-react';
import { JuniorScene } from '../types';

interface SceneCardProps {
    scene: JuniorScene;
    active: boolean;
    onClick: () => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
}

export default function SceneCard({ scene, active, onClick, onDelete, onEdit }: SceneCardProps) {
    const label = scene.backdropName || scene.name || `Scene ${scene.id}`;

    // Get first sprite from scene for thumbnail
    const firstSprite = scene.sprites?.[0];
    const spriteThumb = firstSprite?.costumes?.default as string || null;
    const hasSpriteImage = spriteThumb && typeof spriteThumb === 'string' && spriteThumb.includes('/');

    // Scene background
    const hasBackdropImage = !!scene.backgroundImage;
    const bgStyle = hasBackdropImage
        ? `url(${scene.backgroundImage}) center/cover no-repeat`
        : (scene.background || '#FFFFFF');

    return (
        <div
            onClick={onClick}
            style={{
                position: "relative",
                width: "88px",
                background: "white",
                borderRadius: "12px",
                border: active ? "3px solid #7B4FC4" : "2px solid #E0E0E0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                overflow: "hidden",
                boxShadow: active ? "0 4px 14px rgba(123, 79, 196, 0.35)" : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
                flexShrink: 0,
            }}
        >
            {/* Scene Thumbnail Area */}
            <div style={{
                width: "100%",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: bgStyle,
                position: "relative",
            }}>
                {/* Edit Badge (top-left) */}
                <div
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(scene.id); }}
                    style={{
                        position: "absolute",
                        top: "3px",
                        left: "3px",
                        width: "24px",
                        height: "24px",
                        background: "#7B4FC4",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                        boxShadow: "0 2px 6px rgba(123,79,196,0.4)",
                        transition: "transform 0.15s",
                    }}
                    title="Change Backdrop"
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                    <Image size={12} color="white" />
                </div>

                {/* Delete Badge (top-right) */}
                {onDelete && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onDelete && onDelete(scene.id); }}
                        style={{
                            position: "absolute",
                            top: "3px",
                            right: "3px",
                            width: "24px",
                            height: "24px",
                            background: "#7B4FC4",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 2,
                            boxShadow: "0 2px 6px rgba(123,79,196,0.4)",
                            transition: "transform 0.15s",
                        }}
                        title="Delete Scene"
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <X size={12} color="white" />
                    </div>
                )}

                {/* Show sprite in center if no backdrop image */}
                {!hasBackdropImage && (
                    hasSpriteImage ? (
                        <img src={spriteThumb} alt={label} style={{ maxWidth: "36px", maxHeight: "36px", objectFit: "contain", zIndex: 1 }} />
                    ) : (
                        <span style={{ fontSize: "24px", zIndex: 1 }}>{(firstSprite?.costumes?.default as string) || "🎬"}</span>
                    )
                )}

                {/* Show small sprite overlay on backdrop */}
                {hasBackdropImage && hasSpriteImage && (
                    <img
                        src={spriteThumb}
                        alt="sprite"
                        style={{
                            position: "absolute",
                            bottom: "4px",
                            right: "4px",
                            width: "22px",
                            height: "22px",
                            objectFit: "contain",
                            zIndex: 1,
                        }}
                    />
                )}
            </div>

            {/* Label */}
            <div style={{
                width: "100%",
                fontSize: "10px",
                fontWeight: "700",
                color: "white",
                background: active ? "#7B4FC4" : "#9575CD",
                padding: "5px 4px",
                textAlign: "center",
                letterSpacing: "0.3px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
            }}>
                {label}
            </div>
        </div>
    );
}
