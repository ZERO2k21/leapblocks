import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

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
    const label = sprite.name;

    // Use actual sprite image if available, otherwise emoji
    const spriteImage = sprite.costumes?.[sprite.currentCostume] || null;
    const displayIcon = sprite.costumes?.[sprite.currentCostume] || "🐻";

    return (
        <div
            onClick={onClick}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => isDraggingBlock && setIsHoveredWhileDragging(true)}
            onMouseLeave={() => setIsHoveredWhileDragging(false)}
            data-sprite-id={sprite.id}
            style={{
                position: "relative",
                width: "110px",
                background: isHoveredWhileDragging ? "rgba(255, 191, 0, 0.1)" : "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(8px)",
                borderRadius: "10px",
                border: isHoveredWhileDragging 
                    ? "3px solid #FFBF00" 
                    : (active ? "3px solid #7B4FC4" : "2px solid rgba(224, 224, 224, 0.5)"),
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                overflow: "hidden",
                boxShadow: isSuccess 
                    ? "0 0 25px #22c55e"
                    : (isHoveredWhileDragging 
                        ? "0 4px 15px rgba(255, 191, 0, 0.4)" 
                        : (active ? "0 3px 12px rgba(123, 79, 196, 0.3)" : "0 1px 4px rgba(0,0,0,0.06)")),
                transition: "all 0.2s ease",
                flexShrink: 0,
                transform: isSuccess ? "scale(1.1)" : (isHoveredWhileDragging ? "scale(1.05)" : "scale(1)"),
                zIndex: (isHoveredWhileDragging || isSuccess) ? 10 : 1,
            }}
        >
            {/* Success Overlay */}
            {isSuccess && (
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(34, 197, 94, 0.15)",
                    zIndex: 5,
                    pointerEvents: "none",
                    animation: "pulse 0.5s infinite alternate",
                }} />
            )}
            {/* Sprite Image Area */}
            <div style={{
                width: "100%",
                height: "82px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                padding: "6px",
                position: "relative",
            }}>
                {/* Edit Badge (top-left) */}
                <div
                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(sprite.id); }}
                    style={{
                        position: "absolute",
                        top: "3px",
                        left: "3px",
                        width: "22px",
                        height: "22px",
                        background: "#7B4FC4",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                        boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
                        transition: "transform 0.15s",
                    }}
                    title="Edit Sprite"
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                    <Pencil size={11} color="white" />
                </div>

                {/* Delete Badge (top-right) */}
                <div
                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(sprite.id); }}
                    style={{
                        position: "absolute",
                        top: "3px",
                        right: "3px",
                        width: "22px",
                        height: "22px",
                        background: "#7B4FC4",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                        boxShadow: "0 1px 4px rgba(123,79,196,0.3)",
                        transition: "transform 0.15s",
                    }}
                    title="Delete Sprite"
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                    <Trash2 size={11} color="white" />
                </div>
                
                {/* Sprite Image */}
                {spriteImage || (typeof displayIcon === 'string' && displayIcon.includes('/')) ? (
                    <img src={spriteImage || displayIcon} alt={label} style={{ maxWidth: "76px", maxHeight: "76px", objectFit: "contain" }} />
                ) : (
                    <span style={{
                        fontSize: (sprite.type?.startsWith('letter_') || sprite.id?.startsWith('letter_') || sprite.type?.startsWith('number_') || sprite.id?.startsWith('number_')) ? "56px" : "48px",
                        fontWeight: "900",
                        color: sprite.textColor || '#FF8C1A',
                        fontFamily: (sprite.type?.startsWith('letter_') || sprite.id?.startsWith('letter_') || sprite.type?.startsWith('number_') || sprite.id?.startsWith('number_'))
                            ? '"Arial Black", sans-serif'
                            : 'inherit',
                        WebkitTextStroke: (sprite.type?.startsWith('letter_') || sprite.id?.startsWith('letter_') || sprite.type?.startsWith('number_') || sprite.id?.startsWith('number_'))
                            ? '2px black'
                            : 'none',
                        textShadow: (sprite.type?.startsWith('letter_') || sprite.id?.startsWith('letter_') || sprite.type?.startsWith('number_') || sprite.id?.startsWith('number_'))
                            ? '4px 4px 0px rgba(0,0,0,1)'
                            : 'none',
                        lineHeight: 1,
                    }}>
                        {displayIcon}
                    </span>
                )}
            </div>

            {/* Label */}
            <div style={{
                width: "100%",
                fontSize: "10px",
                fontWeight: "700",
                color: "white",
                background: "#7B4FC4",
                padding: "4px 0",
                textAlign: "center",
                letterSpacing: "0.3px",
            }}>
                {label}
            </div>
        </div>
    );
}
