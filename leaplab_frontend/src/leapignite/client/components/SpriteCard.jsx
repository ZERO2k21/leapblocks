/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Pencil, Trash2, Plus, Minus } from 'lucide-react';

const isLetterOrNumber = (sprite) =>
    sprite.type?.startsWith('letter_') || sprite.id?.startsWith('letter_') ||
    sprite.type?.startsWith('number_') || sprite.id?.startsWith('number_');

const BADGE_BASE = {
    position: 'absolute', top: '3px', width: '22px', height: '22px',
    background: '#7B4FC4', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', zIndex: 2,
    boxShadow: '0 1px 4px rgba(123,79,196,0.3)', transition: 'transform 0.15s',
};

const IMAGE_AREA_STYLE = {
    width: '100%', height: '82px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'transparent', padding: '6px', position: 'relative',
};

const LABEL_BAR_STYLE = {
    width: '100%', fontSize: '10px', fontWeight: '700', color: 'white',
    background: '#7B4FC4', padding: '4px 0', textAlign: 'center', letterSpacing: '0.3px',
};

const SIZE_BTN_BASE = {
    width: '20px', height: '20px', background: '#7B4FC4', borderRadius: '5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    zIndex: 2, boxShadow: '0 1px 4px rgba(123,79,196,0.3)', transition: 'transform 0.15s', pointerEvents: 'auto',
};

const SIZE_BAR_STYLE = {
    position: 'absolute', bottom: '0', left: 0, right: 0,
    display: 'flex', justifyContent: 'space-between',
    padding: '0 3px 3px 3px', pointerEvents: 'none',
};

const getCardStyle = ({ isHoveredWhileDragging, active, isSuccess }) => ({
    position: 'relative', width: '110px',
    background: isHoveredWhileDragging ? 'rgba(255,191,0,0.1)' : 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)', borderRadius: '10px',
    border: isHoveredWhileDragging ? '3px solid #FFBF00'
        : (active ? '3px solid #7B4FC4' : '2px solid rgba(224,224,224,0.5)'),
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    cursor: 'pointer', overflow: 'hidden',
    boxShadow: isSuccess ? '0 0 25px #22c55e'
        : (isHoveredWhileDragging ? '0 4px 15px rgba(255,191,0,0.4)'
            : (active ? '0 3px 12px rgba(123,79,196,0.3)' : '0 1px 4px rgba(0,0,0,0.06)')),
    transition: 'all 0.2s ease', flexShrink: 0,
    transform: isSuccess ? 'scale(1.1)' : (isHoveredWhileDragging ? 'scale(1.05)' : 'scale(1)'),
    zIndex: (isHoveredWhileDragging || isSuccess) ? 10 : 1,
});

const getSpriteTextStyle = (sprite) => {
    const ln = isLetterOrNumber(sprite);
    return {
        fontSize: ln ? '56px' : '48px', fontWeight: '900',
        color: sprite.textColor || '#FF8C1A',
        fontFamily: ln ? '"Arial Black", sans-serif' : 'inherit',
        WebkitTextStroke: ln ? '2px black' : 'none',
        textShadow: ln ? '4px 4px 0px rgba(0,0,0,1)' : 'none',
        lineHeight: 1,
    };
};

function ActionBadge({ side, title, icon, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                ...BADGE_BASE,
                [side]: '3px',
                borderRadius: side === 'left' ? '50%' : '5px',
            }}
            title={title}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
            {icon}
        </div>
    );
}

export default function SpriteCard({
    sprite, active, onClick, onDelete, onEdit,
    isDraggingBlock, onBlocksDropped,
    isSuccess
}) {
    const [isHoveredWhileDragging, setIsHoveredWhileDragging] = React.useState(false);

    const handleMouseUp = () => {
        if (isDraggingBlock && onBlocksDropped) {
            console.log(`[SpriteCard] Dropped blocks onto: ${sprite.name}`);
            onBlocksDropped(sprite.id);
        }
        setIsHoveredWhileDragging(false);
    };

    const handleSizeChange = (e, delta) => {
        e.stopPropagation();
        const currentSize = sprite.size || 100;
        const newSize = Math.max(10, Math.min(300, currentSize + delta));
        if (window.changeSize) {
            window.changeSize(sprite.id, delta);
        } else if (window.updateSprite) {
            window.updateSprite(sprite.id, { size: newSize });
        }
    };

    const spriteImage = sprite.costumes?.[sprite.currentCostume] || null;
    const displayIcon = sprite.costumes?.[sprite.currentCostume] || '🐻';
    const label = sprite.name;

    return (
        <div
            onClick={onClick}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => isDraggingBlock && setIsHoveredWhileDragging(true)}
            onMouseLeave={() => setIsHoveredWhileDragging(false)}
            data-sprite-id={sprite.id}
            style={getCardStyle({ isHoveredWhileDragging, active, isSuccess })}
        >
            {isSuccess && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(34, 197, 94, 0.15)', zIndex: 5, pointerEvents: 'none',
                    animation: 'pulse 0.5s infinite alternate',
                }} />
            )}

            <div style={IMAGE_AREA_STYLE}>
                <ActionBadge
                    side="left"
                    title="Edit Sprite"
                    icon={<Pencil size={11} color="white" />}
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(sprite.id); }}
                />
                <ActionBadge
                    side="right"
                    title="Delete Sprite"
                    icon={<Trash2 size={11} color="white" />}
                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(sprite.id); }}
                />

                {spriteImage || (typeof displayIcon === 'string' && displayIcon.includes('/')) ? (
                    <img src={spriteImage || displayIcon} alt={label} style={{ maxWidth: '76px', maxHeight: '76px', objectFit: 'contain' }} />
                ) : (
                    <span style={getSpriteTextStyle(sprite)}>{displayIcon}</span>
                )}
            </div>

            <div style={LABEL_BAR_STYLE}>{label}</div>

            <div style={SIZE_BAR_STYLE}>
                <div
                    onClick={(e) => handleSizeChange(e, 10)}
                    style={SIZE_BTN_BASE}
                    title="Increase Size"
                >
                    <Plus size={10} color="white" strokeWidth={2.5} />
                </div>
                <div
                    onClick={(e) => handleSizeChange(e, -10)}
                    style={SIZE_BTN_BASE}
                    title="Decrease Size"
                >
                    <Minus size={10} color="white" strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
}
