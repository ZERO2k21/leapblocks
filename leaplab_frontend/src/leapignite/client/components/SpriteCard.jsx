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
            className={`absolute top-[3px] w-[22px] h-[22px] bg-[#7B4FC4] flex items-center justify-center cursor-pointer z-[2] shadow-[0_1px_4px_rgba(123,79,196,0.3)] transition-transform hover:scale-115 ${
                side === 'left' ? 'left-[3px] rounded-full' : 'right-[3px] rounded-[5px]'
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
            className={`relative w-[110px] backdrop-blur-md rounded-lg flex flex-col items-center cursor-pointer overflow-hidden transition-all duration-200 shrink-0 ${
                isSuccess
                    ? 'scale-110 z-10 shadow-[0_0_25px_#22c55e] border-[3px] border-[#7B4FC4] bg-white/70'
                    : isHoveredWhileDragging
                        ? 'scale-105 z-10 shadow-[0_4px_15px_rgba(255,191,0,0.4)] border-[3px] border-[#FFBF00] bg-[#FFBF00]/10'
                        : active
                            ? 'border-[3px] border-[#7B4FC4] shadow-[0_3px_12px_rgba(123,79,196,0.3)] bg-white/70'
                            : 'border-2 border-gray-200/50 shadow-[0_1px_4px_rgba(0,0,0,0.06)] bg-white/70'
            }`}
        >
            {isSuccess && (
                <div className="absolute inset-0 bg-green-500/15 z-[5] pointer-events-none animate-pulse" />
            )}

            <div className="w-full h-[82px] flex items-center justify-center bg-transparent p-1.5 relative">
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
                    <img src={spriteImage || displayIcon} alt={label} className="max-w-[76px] max-h-[76px] object-contain" />
                ) : (
                    <span
                        className={`font-black leading-none ${ln ? 'text-[56px] font-mono [text-shadow:4px_4px_0px_rgba(0,0,0,1)]' : 'text-[48px]'}`}
                        style={{ color: sprite.textColor || '#FF8C1A', WebkitTextStroke: ln ? '2px black' : 'none' }}
                    >
                        {displayIcon}
                    </span>
                )}
            </div>

            <div className="w-full text-[10px] font-bold text-white bg-[#7B4FC4] py-1 text-center tracking-[0.3px] whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>

            <div className="absolute bottom-0 left-0 right-0 flex justify-between p-[0_3px_3px_3px] pointer-events-none">
                <div
                    onClick={(e) => handleSizeChange(e, 10)}
                    className="w-5 h-5 bg-[#7B4FC4] rounded-[5px] flex items-center justify-center cursor-pointer z-[2] shadow-[0_1px_4px_rgba(123,79,196,0.3)] transition-transform hover:scale-115 pointer-events-auto"
                    title="Increase Size"
                >
                    <Plus size={10} color="white" strokeWidth={2.5} />
                </div>
                <div
                    onClick={(e) => handleSizeChange(e, -10)}
                    className="w-5 h-5 bg-[#7B4FC4] rounded-[5px] flex items-center justify-center cursor-pointer z-[2] shadow-[0_1px_4px_rgba(123,79,196,0.3)] transition-transform hover:scale-115 pointer-events-auto"
                    title="Decrease Size"
                >
                    <Minus size={10} color="white" strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
}
