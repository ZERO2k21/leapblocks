/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { JuniorSprite } from '../types';

interface SpriteCardProps {
    sprite: JuniorSprite;
    active: boolean;
    onClick: () => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    isDraggingBlock?: boolean;
    onBlocksDropped?: (spriteId: string, blocks?: any) => void;
    isSuccess?: boolean;
}

export default function SpriteCard({ 
    sprite, active, onClick, onDelete, onEdit, 
    isDraggingBlock, onBlocksDropped,
    isSuccess
}: SpriteCardProps) {
    const [isHoveredWhileDragging, setIsHoveredWhileDragging] = React.useState(false);

    const handleMouseUp = () => {
        if (isDraggingBlock && onBlocksDropped) {
            console.log(`[SpriteCard] Dropped blocks onto: ${sprite.name}`);
            onBlocksDropped(sprite.id);
        }
        setIsHoveredWhileDragging(false);
    };
    const label = sprite.name;

    const spriteImage = (sprite.costumes?.[sprite.currentCostume || 'default'] as string) || null;
    const displayIcon = (sprite.costumes?.[sprite.currentCostume || 'default'] as string) || "🐻";

    const isLetterOrNumber = sprite.type?.startsWith('letter_') || sprite.id?.startsWith('letter_') || sprite.type?.startsWith('number_') || sprite.id?.startsWith('number_');

    // Build dynamic classes
    const borderClass = isHoveredWhileDragging
        ? 'border-[3px] border-[#FFBF00]'
        : active
            ? 'border-[3px] border-[#7B4FC4]'
            : 'border-2 border-[#E0E0E0]/50';

    const bgClass = isHoveredWhileDragging ? 'bg-[rgba(255,191,0,0.1)]' : 'bg-white/70';

    const shadowClass = isSuccess
        ? 'shadow-[0_0_25px_#22c55e]'
        : isHoveredWhileDragging
            ? 'shadow-[0_4px_15px_rgba(255,191,0,0.4)]'
            : active
                ? 'shadow-[0_3px_12px_rgba(123,79,196,0.3)]'
                : 'shadow-[0_1px_4px_rgba(0,0,0,0.06)]';

    const scaleClass = isSuccess ? 'scale-110' : isHoveredWhileDragging ? 'scale-105' : 'scale-100';
    const zClass = (isHoveredWhileDragging || isSuccess) ? 'z-10' : 'z-[1]';

    return (
        <div
            onClick={onClick}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => isDraggingBlock && setIsHoveredWhileDragging(true)}
            onMouseLeave={() => setIsHoveredWhileDragging(false)}
            data-sprite-id={sprite.id}
            className={`relative w-[110px] backdrop-blur-[8px] rounded-[10px] flex flex-col items-center cursor-pointer overflow-hidden transition-all duration-200 flex-shrink-0 ${bgClass} ${borderClass} ${shadowClass} ${scaleClass} ${zClass}`}
        >
            {/* Success Overlay */}
            {isSuccess && (
                <div className="absolute inset-0 bg-green-500/15 z-[5] pointer-events-none animate-pulse" />
            )}

            {/* Sprite Image Area */}
            <div className="w-full h-[82px] flex items-center justify-center bg-transparent p-1.5 relative">
                {/* Edit Badge */}
                <div
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(sprite.id); }}
                    className="absolute top-[3px] left-[3px] w-[22px] h-[22px] bg-[#7B4FC4] rounded-full flex items-center justify-center cursor-pointer z-[2] shadow-[0_1px_4px_rgba(123,79,196,0.3)] transition-transform hover:scale-[1.15]"
                    title="Edit Sprite"
                >
                    <Pencil size={11} color="white" />
                </div>

                {/* Delete Badge */}
                <div
                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(sprite.id); }}
                    className="absolute top-[3px] right-[3px] w-[22px] h-[22px] bg-[#7B4FC4] rounded-[5px] flex items-center justify-center cursor-pointer z-[2] shadow-[0_1px_4px_rgba(123,79,196,0.3)] transition-transform hover:scale-[1.15]"
                    title="Delete Sprite"
                >
                    <Trash2 size={11} color="white" />
                </div>
                
                {/* Sprite Image */}
                {spriteImage || (typeof displayIcon === 'string' && displayIcon.includes('/')) ? (
                    <img src={spriteImage || displayIcon} alt={label} className="max-w-[76px] max-h-[76px] object-contain" />
                ) : (
                    <span
                        className="leading-none"
                        style={{
                            fontSize: isLetterOrNumber ? '56px' : '48px',
                            fontWeight: 900,
                            color: sprite.textColor || '#FF8C1A',
                            fontFamily: isLetterOrNumber ? '"Arial Black", sans-serif' : 'inherit',
                            WebkitTextStroke: isLetterOrNumber ? '2px black' : 'none',
                            textShadow: isLetterOrNumber ? '4px 4px 0px rgba(0,0,0,1)' : 'none',
                        }}
                    >
                        {displayIcon}
                    </span>
                )}
            </div>

            {/* Label */}
            <div className="w-full text-[10px] font-bold text-white bg-[#7B4FC4] py-1 text-center tracking-[0.3px]">
                {label}
            </div>
        </div>
    );
}
