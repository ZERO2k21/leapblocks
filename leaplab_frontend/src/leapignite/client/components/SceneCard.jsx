/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Image, X } from 'lucide-react';

const CARD_STYLE = {
    position: 'relative', width: '88px', background: 'white', borderRadius: '12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s ease', flexShrink: 0,
};

const ACTIVE_BORDER = '3px solid #7B4FC4';
const INACTIVE_BORDER = '2px solid #E0E0E0';
const ACTIVE_SHADOW = '0 4px 14px rgba(123, 79, 196, 0.35)';
const INACTIVE_SHADOW = '0 1px 4px rgba(0,0,0,0.06)';

const THUMB_STYLE = {
    width: '100%', height: '60px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', position: 'relative',
};

const BADGE_BASE = {
    position: 'absolute', top: '3px', width: '24px', height: '24px',
    background: '#7B4FC4', borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    zIndex: 2, boxShadow: '0 2px 6px rgba(123,79,196,0.4)',
    transition: 'transform 0.15s',
};

const LABEL_STYLE = {
    width: '100%', fontSize: '10px', fontWeight: '700', color: 'white',
    padding: '5px 4px', textAlign: 'center', letterSpacing: '0.3px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};

function SceneBadge({ onClick, title, icon, side }) {
    return (
        <div
            onClick={onClick}
            style={{ ...BADGE_BASE, [side]: '3px' }}
            title={title}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
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

    const SPRITE_OVERLAY_STYLE = {
        position: 'absolute', bottom: '4px', right: '4px',
        width: '22px', height: '22px', objectFit: 'contain', zIndex: 1,
    };

    return (
        <div
            onClick={onClick}
            style={{
                ...CARD_STYLE,
                border: active ? ACTIVE_BORDER : INACTIVE_BORDER,
                boxShadow: active ? ACTIVE_SHADOW : INACTIVE_SHADOW,
            }}
        >
            <div style={{ ...THUMB_STYLE, background: bgStyle }}>
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
                        <img src={spriteThumb} alt={label} style={{ maxWidth: '36px', maxHeight: '36px', objectFit: 'contain', zIndex: 1 }} />
                    ) : (
                        <span style={{ fontSize: '24px', zIndex: 1 }}>{firstSprite?.costumes?.default || '🎬'}</span>
                    )
                ) : hasSpriteImage && (
                    <img src={spriteThumb} alt="sprite" style={SPRITE_OVERLAY_STYLE} />
                )}
            </div>

            <div style={{ ...LABEL_STYLE, background: active ? '#7B4FC4' : '#9575CD' }}>
                {label}
            </div>
        </div>
    );
}
