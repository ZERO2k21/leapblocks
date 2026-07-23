/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Image, X } from 'lucide-react';



function SceneBadge({ onClick, title, icon, side }) {
    return (
        <div
            onClick={onClick}
            className={`absolute top-[3px] w-6 h-6 bg-[#7B4FC4] rounded-full flex items-center justify-center cursor-pointer z-[2] shadow-[0_2px_6px_rgba(123,79,196,0.4)] transition-transform hover:scale-115 ${
                side === 'left' ? 'left-[3px]' : 'right-[3px]'
            }`}
            title={title}
        >
            {icon}
        </div>
    );
}

export default function SceneCard({ scene, active, onClick, onDelete, onEdit }) {
    const label = scene.backdropName || scene.name || `Scene ${scene.id}`;

    // Get first sprite from scene for thumbnail
    const firstSprite = scene.sprites?.[0];
    const spriteThumb = firstSprite?.costumes?.default || null;
    const hasSpriteImage = spriteThumb && typeof spriteThumb === 'string' && spriteThumb.includes('/');

    // Scene background
    const hasBackdropImage = !!scene.backgroundImage;
    const bgStyle = hasBackdropImage
        ? `url(${scene.backgroundImage}) center/cover no-repeat`
        : (scene.background || '#FFFFFF');

    return (
        <div
            onClick={onClick}
            className={`relative w-[88px] bg-white rounded-xl flex flex-col items-center cursor-pointer overflow-hidden transition-all duration-200 shrink-0 ${
                active
                    ? 'border-[3px] border-[#7B4FC4] shadow-[0_4px_14px_rgba(123,79,196,0.35)]'
                    : 'border-2 border-gray-300 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
            }`}
        >
            <div className="w-full h-[60px] flex items-center justify-center relative" style={{ background: bgStyle }}>
                <SceneBadge
                    side="left"
                    title="Change Backdrop"
                    icon={<Image size={12} color="white" />}
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(scene.id); }}
                />
                {onDelete && (
                    <SceneBadge
                        side="right"
                        title="Delete Scene"
                        icon={<X size={12} color="white" />}
                        onClick={(e) => { e.stopPropagation(); onDelete && onDelete(scene.id); }}
                    />
                )}

                {!hasBackdropImage ? (
                    hasSpriteImage ? (
                        <img src={spriteThumb} alt={label} className="max-w-9 max-h-9 object-contain z-[1]" />
                    ) : (
                        <span className="text-2xl z-[1]">{firstSprite?.costumes?.default || '🎬'}</span>
                    )
                ) : hasSpriteImage && (
                    <img src={spriteThumb} alt="sprite" className="absolute bottom-1 right-1 w-5.5 h-5.5 object-contain z-[1]" />
                )}
            </div>

            <div className={`w-full text-[10px] font-bold text-white py-1.25 px-1 text-center tracking-[0.3px] whitespace-nowrap overflow-hidden text-ellipsis ${
                active ? 'bg-[#7B4FC4]' : 'bg-[#9575CD]'
            }`}>
                {label}
            </div>
        </div>
    );
}
