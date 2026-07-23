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

function ActionBadge({ side, title, icon, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`absolute top-1 w-5.5 h-5.5 bg-purple-600 flex items-center justify-center cursor-pointer z-10 shadow-sm transition-transform hover:scale-110 ${
                side === 'left' ? 'left-1 rounded-full' : 'right-1 rounded-md'
            }`}
            title={title}
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

    const ln = isLetterOrNumber(sprite);

    return (
        <div
            onClick={onClick}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => isDraggingBlock && setIsHoveredWhileDragging(true)}
            onMouseLeave={() => setIsHoveredWhileDragging(false)}
            data-sprite-id={sprite.id}
            className={`relative w-28 backdrop-blur-md rounded-lg flex flex-col items-center cursor-pointer overflow-hidden transition-all duration-200 shrink-0 ${
                isSuccess
                    ? 'scale-110 z-10 shadow-2xl shadow-green-500/50 border-2 border-purple-600 bg-white/70'
                    : isHoveredWhileDragging
                        ? 'scale-105 z-10 shadow-lg shadow-amber-400/40 border-2 border-amber-400 bg-amber-400/10'
                        : active
                            ? 'border-2 border-purple-600 shadow-md shadow-purple-600/30 bg-white/70'
                            : 'border-2 border-gray-200/50 shadow-sm bg-white/70'
            }`}
        >
            {isSuccess && (
                <div className="absolute inset-0 bg-green-500/15 z-0 pointer-events-none animate-pulse" />
            )}

            <div className="w-full h-20 flex items-center justify-center bg-transparent p-1.5 relative">
                <ActionBadge
                    side="left"
                    title="Edit Sprite"
                    icon={<Pencil size={11} className="text-white" />}
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(sprite.id); }}
                />
                <ActionBadge
                    side="right"
                    title="Delete Sprite"
                    icon={<Trash2 size={11} className="text-white" />}
                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(sprite.id); }}
                />

                {spriteImage || (typeof displayIcon === 'string' && displayIcon.includes('/')) ? (
                    <img src={spriteImage || displayIcon} alt={label} className="max-w-18 max-h-18 object-contain" />
                ) : (
                    <span
                        className={`font-black leading-none ${ln ? 'text-5xl font-mono [text-shadow:4px_4px_0px_rgba(0,0,0,1)]' : 'text-4xl'}`}
                        style={{ color: sprite.textColor || '#FF8C1A', WebkitTextStroke: ln ? '2px black' : 'none' }}
                    >
                        {displayIcon}
                    </span>
                )}
            </div>

            <div className="w-full text-xs font-bold text-white bg-purple-600 py-1 text-center tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>

            <div className="absolute bottom-0 left-0 right-0 flex justify-between p-1 pointer-events-none">
                <div
                    onClick={(e) => handleSizeChange(e, 10)}
                    className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center cursor-pointer z-10 shadow-sm transition-transform hover:scale-110 pointer-events-auto"
                    title="Increase Size"
                >
                    <Plus size={10} className="text-white" strokeWidth={2.5} />
                </div>
                <div
                    onClick={(e) => handleSizeChange(e, -10)}
                    className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center cursor-pointer z-10 shadow-sm transition-transform hover:scale-110 pointer-events-auto"
                    title="Decrease Size"
                >
                    <Minus size={10} className="text-white" strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
}
