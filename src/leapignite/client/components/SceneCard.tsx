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

    const firstSprite = scene.sprites?.[0];
    const spriteThumb = firstSprite?.costumes?.default as string || null;
    const hasSpriteImage = spriteThumb && typeof spriteThumb === 'string' && spriteThumb.includes('/');

    const hasBackdropImage = !!scene.backgroundImage;
    const bgStyle = hasBackdropImage
        ? `url(${scene.backgroundImage}) center/cover no-repeat`
        : (scene.background || '#FFFFFF');

    return (
        <div
            onClick={onClick}
            className={`relative w-[88px] bg-white rounded-xl flex flex-col items-center cursor-pointer overflow-hidden transition-all duration-200 flex-shrink-0 ${
                active
                    ? 'border-[3px] border-[#7B4FC4] shadow-[0_4px_14px_rgba(123,79,196,0.35)]'
                    : 'border-2 border-[#E0E0E0] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
            }`}
        >
            {/* Scene Thumbnail */}
            <div
                className="w-full h-[60px] flex items-center justify-center relative"
                style={{ background: bgStyle }}
            >
                {/* Edit Badge */}
                <div
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(scene.id); }}
                    className="absolute top-[3px] left-[3px] w-6 h-6 bg-[#7B4FC4] rounded-full flex items-center justify-center cursor-pointer z-[2] shadow-[0_2px_6px_rgba(123,79,196,0.4)] transition-transform hover:scale-[1.15]"
                    title="Change Backdrop"
                >
                    <Image size={12} color="white" />
                </div>

                {/* Delete Badge */}
                {onDelete && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onDelete && onDelete(scene.id); }}
                        className="absolute top-[3px] right-[3px] w-6 h-6 bg-[#7B4FC4] rounded-full flex items-center justify-center cursor-pointer z-[2] shadow-[0_2px_6px_rgba(123,79,196,0.4)] transition-transform hover:scale-[1.15]"
                        title="Delete Scene"
                    >
                        <X size={12} color="white" />
                    </div>
                )}

                {/* Sprite in center if no backdrop */}
                {!hasBackdropImage && (
                    hasSpriteImage ? (
                        <img src={spriteThumb} alt={label} className="max-w-[36px] max-h-[36px] object-contain z-[1]" />
                    ) : (
                        <span className="text-2xl z-[1]">{(firstSprite?.costumes?.default as string) || "🎬"}</span>
                    )
                )}

                {/* Small sprite overlay on backdrop */}
                {hasBackdropImage && hasSpriteImage && (
                    <img
                        src={spriteThumb}
                        alt="sprite"
                        className="absolute bottom-1 right-1 w-[22px] h-[22px] object-contain z-[1]"
                    />
                )}
            </div>

            {/* Label */}
            <div className={`w-full text-[10px] font-bold text-white py-[5px] px-1 text-center tracking-[0.3px] whitespace-nowrap overflow-hidden text-ellipsis ${
                active ? 'bg-[#7B4FC4]' : 'bg-[#9575CD]'
            }`}>
                {label}
            </div>
        </div>
    );
}
