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
        <div className="absolute top-4 right-4 w-[60px] h-[60px] bg-white/85 backdrop-blur-sm rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-2 border-[#0a015a] pointer-events-none z-10 flex justify-center items-center p-1.5">
            {(!isEmoji && imgSrc) ? (
                <img
                    src={imgSrc}
                    alt={activeSprite.name}
                    className="max-w-full max-h-full object-contain"
                />
            ) : (
                <span className="text-4xl">{imgSrc}</span>
            )}
        </div>
    );
}
