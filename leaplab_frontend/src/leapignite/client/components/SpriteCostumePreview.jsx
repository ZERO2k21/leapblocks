import React from "react";

export default function SpriteCostumePreview({ sprites, activeSpriteId }) {
    const activeSprite = sprites.find(s => s.id === activeSpriteId);
    if (!activeSprite || !activeSprite.currentCostume) return null;

    let imgSrc = null;
    let isEmoji = false;

    if (activeSprite.type === 'robot' && activeSprite.costumes) {
        imgSrc = activeSprite.costumes[activeSprite.currentCostume];
    } else if (activeSprite.currentCostume && typeof activeSprite.currentCostume === 'object' && activeSprite.currentCostume.image) {
        imgSrc = activeSprite.currentCostume.image.src;
    } else if (activeSprite.costumes && activeSprite.costumes[activeSprite.currentCostume]) {
        const val = activeSprite.costumes[activeSprite.currentCostume];
        if (typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('/') || val.startsWith('http') || val.endsWith('.png') || val.endsWith('.jpg') || val.endsWith('.svg'))) {
            imgSrc = val;
        } else if (typeof val === 'string') {
            imgSrc = val;
            isEmoji = true;
        }
    }

    if (!imgSrc && !isEmoji) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '60px',
            height: '60px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(5px)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid #0a015a',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '6px',
        }}>
            {(!isEmoji && imgSrc) ? (
                <img
                    src={imgSrc}
                    alt={activeSprite.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
            ) : (
                <span style={{ fontSize: '36px' }}>{imgSrc}</span>
            )}
        </div>
    );
}
