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
                style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' }}
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
                    <div style={{
                        color: textColor || '#FF8C1A',
                        fontSize: '90px',
                        fontWeight: '900',
                        fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif',
                        WebkitTextStroke: '4px black',
                        textShadow: '8px 8px 0px rgba(0,0,0,1)',
                        lineHeight: 1,
                        display: 'inline-block',
                        userSelect: 'none',
                        transform: 'scale(1.1)',
                    }}>
                        {costumeValue}
                    </div>
                );
            }
            return (
                <span style={{
                    fontSize: '60px',
                    lineHeight: 1,
                    display: 'block',
                    textAlign: 'center',
                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))'
                }}>
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
                <div style={{
                    position: 'absolute', bottom: '100%', left: '50%',
                    transform: `translateX(-50%) scaleX(${mirrored ? -scaleX : scaleX})`,
                    background: 'white', border: '2px solid #333', borderRadius: '8px',
                    padding: '3px 8px', marginBottom: '6px', whiteSpace: 'nowrap',
                    zIndex: 10, fontSize: '13px', fontWeight: '600', color: '#333',
                }}>
                    {speech}
                </div>
            )}

            <div style={{
                fontSize: '50px',
                lineHeight: 1,
                transform: (isPenDown && isPenSprite) ? 'rotate(-5deg)' : 'none',
                transformOrigin: `${relativeTipX}px ${relativeTipY}px`
            }}>
                {renderIcon({ type, id, costumes, currentCostume, textColor, imgError, setImgError })}
            </div>

            {isPenDown && isPenSprite && (
                <div style={{
                    position: 'absolute',
                    left: `${relativeTipX}px`,
                    top: `${relativeTipY}px`,
                    transform: 'translate(-50%, -50%)',
                    width: Math.max(6, (window.penSize || 5)),
                    height: Math.max(6, (window.penSize || 5)),
                    borderRadius: '50%',
                    backgroundColor: penIndicatorColor,
                    boxShadow: `0 0 6px ${penIndicatorColor}, 0 0 12px ${penIndicatorColor}40`,
                    animation: 'penPulse 1s ease-in-out infinite',
                    zIndex: 5,
                    pointerEvents: 'none',
                }} />
            )}
        </>
    );
}
