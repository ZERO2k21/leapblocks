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
            className={`absolute top-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer z-10 shadow-md transition-transform hover:scale-110 ${
                side === 'left' ? 'left-1' : 'right-1'
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
            className={`relative w-22 bg-white rounded-xl flex flex-col items-center cursor-pointer overflow-hidden transition-all duration-200 shrink-0 ${
                active
                    ? 'border-2 border-purple-600 shadow-lg shadow-purple-600/30'
                    : 'border-2 border-gray-300 shadow-sm hover:border-purple-400'
            }`}
        >
            <div className="w-full h-14 flex items-center justify-center relative" style={{ background: bgStyle }}>
                <SceneBadge
                    side="left"
                    title="Change Backdrop"
                    icon={<Image size={12} className="text-white" />}
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(scene.id); }}
                />
                {onDelete && (
                    <SceneBadge
                        side="right"
                        title="Delete Scene"
                        icon={<X size={12} className="text-white" />}
                        onClick={(e) => { e.stopPropagation(); onDelete && onDelete(scene.id); }}
                    />
                )}

                {!hasBackdropImage ? (
                    hasSpriteImage ? (
                        <img src={spriteThumb} alt={label} className="max-w-9 max-h-9 object-contain z-0" />
                    ) : (
                        <span className="text-2xl z-0">{firstSprite?.costumes?.default || '🎬'}</span>
                    )
                ) : hasSpriteImage && (
                    <img src={spriteThumb} alt="sprite" className="absolute bottom-1 right-1 w-5 h-5 object-contain z-0" />
                )}
            </div>

            <div className={`w-full text-xs font-bold text-white py-1 px-1 text-center tracking-wide whitespace-nowrap overflow-hidden text-ellipsis ${
                active ? 'bg-purple-600' : 'bg-purple-500'
            }`}>
                {label}
            </div>
        </div>
    );
}
