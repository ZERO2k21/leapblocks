import React, { useState, useEffect } from 'react';
import { getPenTipOffset } from './useSpriteDrag';

const SPRITE_BOX_SIZE = 80;
const SPRITE_CENTER = SPRITE_BOX_SIZE / 2;

export function getEmojiForType(type) {
    if (type === 'robot') return '\u{1F916}';
    if (type === 'dog') return '\u{1F436}';
    if (type === 'cat') return '\u{1F431}';
    return '\u{1F43B}';
}

export function renderIcon({ type, id, costumes, currentCostume, textColor, imgError, setImgError }) {
    let costumeValue = costumes?.[currentCostume] || currentCostume;

    if (Array.isArray(costumes)) {
        const idx = parseInt(currentCostume);
        if (!isNaN(idx) && costumes[idx]) {
            costumeValue = costumes[idx];
        }
    }

    if (!imgError && typeof costumeValue === 'string' && (
        costumeValue.includes('/') ||
        costumeValue.startsWith('http') ||
        costumeValue.includes('data:image') ||
        costumeValue.endsWith('.png') ||
        costumeValue.endsWith('.jpg') ||
        costumeValue.endsWith('.svg')
    )) {
        return (
            <img
                src={costumeValue}
                alt={id}
                className="w-20 h-20 object-contain drop-shadow-md"
                draggable={false}
                onError={() => setImgError(true)}
            />
        );
    }

    if (typeof costumeValue === 'string') {
        const emojiRegex = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/u;
        const isEmoji = emojiRegex.test(costumeValue) || costumeValue.length <= 4;

        if (isEmoji) {
            const isLetterOrNumber = type?.startsWith('letter_') || type?.startsWith('number_') || id?.startsWith('letter_') || id?.startsWith('number_');

            if (isLetterOrNumber) {
                return (
                    <div
                        className="text-8xl font-black font-mono inline-block select-none scale-110 leading-none [text-shadow:8px_8px_0px_rgba(0,0,0,1)]"
                        style={{
                            color: textColor || '#FF8C1A',
                            WebkitTextStroke: '4px black',
                        }}
                    >
                        {costumeValue}
                    </div>
                );
            }
            return (
                <span className="text-6xl leading-none block text-center drop-shadow-md">
                    {costumeValue}
                </span>
            );
        }
    }

    if (currentCostume === "wave") {
        if (type === 'bear') return "\u{1F44B}";
        if (type === 'dog') return "\u{1F415}";
        if (type === 'robot') return "\u{1F916}";
    }
    return getEmojiForType(type);
}

export default function SpriteDisplay({
    speech, type, id, costumes, currentCostume, textColor,
    isPenDown, isPenSprite, penColor, mirrored, scaleX,
    angle, size, x, y,
}) {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [currentCostume]);

    const penIndicatorColor = window.penColor || penColor || '#FF0000';

    const renderTipOffset = isPenSprite
        ? getPenTipOffset(angle, size, scaleX, mirrored)
        : { x: SPRITE_CENTER, y: SPRITE_CENTER };
    const renderTip = {
        x: x + renderTipOffset.x,
        y: y + renderTipOffset.y
    };
    const relativeTipX = renderTip.x - x;
    const relativeTipY = renderTip.y - y;

    return (
        <>
            {speech && (
                <div
                    className="absolute bottom-full left-1/2 bg-white border-2 border-gray-800 rounded-lg px-2 py-1 mb-1.5 whitespace-nowrap z-10 text-xs font-semibold text-gray-800"
                    style={{
                        transform: `translateX(-50%) scaleX(${mirrored ? -scaleX : scaleX})`,
                    }}
                >
                    {speech}
                </div>
            )}

            <div
                className={`text-5xl leading-none ${isPenDown && isPenSprite ? '-rotate-3' : ''}`}
                style={{
                    transformOrigin: `${relativeTipX}px ${relativeTipY}px`
                }}
            >
                {renderIcon({ type, id, costumes, currentCostume, textColor, imgError, setImgError })}
            </div>

            {isPenDown && isPenSprite && (
                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full z-5 pointer-events-none animate-pulse"
                    style={{
                        left: `${relativeTipX}px`,
                        top: `${relativeTipY}px`,
                        width: Math.max(6, (window.penSize || 5)),
                        height: Math.max(6, (window.penSize || 5)),
                        backgroundColor: penIndicatorColor,
                        boxShadow: `0 0 6px ${penIndicatorColor}, 0 0 12px ${penIndicatorColor}40`,
                    }}
                />
            )}
        </>
    );
}
