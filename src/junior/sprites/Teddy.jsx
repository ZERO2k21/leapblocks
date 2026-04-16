/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';

const normalizeSpriteKey = (value) => String(value || '').trim().toLowerCase();
const SPRITE_BOX_SIZE = 80;
const SPRITE_CENTER = SPRITE_BOX_SIZE / 2;
const PEN_TIP_LOCAL = { x: 7, y: 79 };

const isJuniorPenSprite = (...values) => values.some((value) => {
    const normalized = normalizeSpriteKey(value);

    return normalized === 'pencil' ||
        normalized === 'pen' ||
        normalized === 'drawing_pen' ||
        normalized.includes('pencil') ||
        normalized.includes('drawing_pen');
});

export default function Sprite({ id, type, active, x, y, angle, size, visible, speech, currentCostume, costumes, mirrored, textColor, onClick, onDragStateChange }) {
    // Local ephemeral state (speech bubbles, feedback)
    // Speech is now propped from App.jsx store
    const [scaleX, setScaleX] = useState(1);
    const [feedback, setFeedback] = useState(null);

    // Pen State (Kept local for now, could be prop if needed for save/load)
    const [isPenDown, setIsPenDown] = useState(false);
    const [penColor, setPenColor] = useState("#000000");

    // Helper: detect if this is a pen-type sprite
    const isPenSprite = isJuniorPenSprite(type, id);

    // Offset calculated dynamically now

    // REFS to hold Props for EVENT HANDLERS (Closure Trap Fix)
    const xRef = useRef(x);
    const yRef = useRef(y);
    const angleRef = useRef(angle);
    const penRef = useRef(isPenDown);
    const activeRef = useRef(active);
    const sizeRef = useRef(size);
    const scaleXRef = useRef(scaleX);
    const mirroredRef = useRef(mirrored);
    const currentCostumeRef = useRef(currentCostume);
    const costumesRef = useRef(costumes);

    useEffect(() => { xRef.current = x; }, [x]);
    useEffect(() => { yRef.current = y; }, [y]);
    useEffect(() => { angleRef.current = angle; }, [angle]);
    useEffect(() => { penRef.current = isPenDown; }, [isPenDown]);
    useEffect(() => { activeRef.current = active; }, [active]);
    useEffect(() => { sizeRef.current = size; }, [size]);
    useEffect(() => { scaleXRef.current = scaleX; }, [scaleX]);
    useEffect(() => { mirroredRef.current = mirrored; }, [mirrored]);
    useEffect(() => { currentCostumeRef.current = currentCostume; }, [currentCostume]);
    useEffect(() => { costumesRef.current = costumes; }, [costumes]);

    // Helpers to dispatch updates to App.jsx Store
    const updateStore = (updates) => {
        if (window.updateSprite) {
            window.updateSprite(id, updates);
        }
    };

    const getPenTipOffset = (
        currentAngle = 0,
        currentSize = 100,
        currentScaleX = scaleXRef.current,
        currentMirrored = mirroredRef.current
    ) => {
        const angleRad = (Number(currentAngle) || 0) * Math.PI / 180;
        const sizeScale = Math.max(0.1, (Number(currentSize) || 100) / 100);
        const horizontalDirection = (currentMirrored ? -currentScaleX : currentScaleX) < 0 ? -1 : 1;

        const baseX = (PEN_TIP_LOCAL.x - SPRITE_CENTER) * horizontalDirection * sizeScale;
        const baseY = (PEN_TIP_LOCAL.y - SPRITE_CENTER) * sizeScale;

        const rotatedX = (Math.cos(angleRad) * baseX) - (Math.sin(angleRad) * baseY);
        const rotatedY = (Math.sin(angleRad) * baseX) + (Math.cos(angleRad) * baseY);

        return {
            x: SPRITE_CENTER + rotatedX,
            y: SPRITE_CENTER + rotatedY
        };
    };

    // Get Pencil Tip precisely based on sprite direction and size
    const getPencilTip = (currentX, currentY, currentAngle, currentSize) => {
        if (isPenSprite) {
            const offset = getPenTipOffset(currentAngle, currentSize);
            return {
                x: currentX + offset.x,
                y: currentY + offset.y
            };
        }

        return {
            x: currentX + SPRITE_CENTER,
            y: currentY + SPRITE_CENTER
        };
    };

    // Calculate new position based on angle
    const performMove = (step) => {
        const rad = (angleRef.current * Math.PI) / 180;
        const dx = Math.cos(rad) * step;
        const dy = Math.sin(rad) * step;
        updatePos(dx, dy);
    };

    const performMoveY = (dy) => updatePos(0, dy);

    const updatePos = (dx, dy) => {
        const oldX = xRef.current;
        const oldY = yRef.current;
        const newX = oldX + dx;
        const newY = oldY + dy;

        // Draw if pen is down
        if (penRef.current && window.drawSegment) {
            const currentAngle = angleRef.current;
            const currentSize = sizeRef.current;
            const oldTip = getPencilTip(oldX, oldY, currentAngle, currentSize);
            const newTip = getPencilTip(newX, newY, currentAngle, currentSize);

            const activeColor = window.penColor || penColor;
            const activeSize = window.penSize || 4;

            window.drawSegment(oldTip.x, oldTip.y, newTip.x, newTip.y, activeColor, activeSize);
        }

        updateStore({ x: newX, y: newY });
    };

    useEffect(() => {
        // =================================================================
        // SPRITE ACTION REGISTRY
        // Each sprite registers its own handlers keyed by ID.
        // Global functions dispatch to the correct sprite's handler.
        // This allows concurrent multi-sprite execution without conflicts.
        // =================================================================

        if (!window._spriteActions) window._spriteActions = {};

        // Register this sprite's actions under its ID
        window._spriteActions[id] = {
            moveForward: (steps = 1) => performMove(20 * steps),
            moveBackward: (steps = 1) => performMove(-20 * steps),
            moveUp: (steps = 1) => performMoveY(-20 * steps),
            moveDown: (steps = 1) => performMoveY(20 * steps),
            turnRight: (times = 3) => updateStore({ angle: a => a + (15 * times) }),
            turnLeft: (times = 3) => updateStore({ angle: a => a - (15 * times) }),
            jump: (times = 3) => {
                const height = 20 * times;
                performMoveY(-height);
                setTimeout(() => performMoveY(height), 300);
            },
            run: () => {
                performMove(60);
                window.say(id, "Running!! \u{1F3C3}");
            },
            findout: () => {
                window.say(id, "Searching... \u{1F50D}");
                setTimeout(() => window.say(id, "Found it!"), 1000);
            },
            symmetry: () => setScaleX(s => s * -1),
            switchCostume: (name) => updateStore({ currentCostume: name }),
            penDown: () => setIsPenDown(true),
            penUp: () => setIsPenDown(false),
            jiggle: () => setJiggleKey(key => key + 1),
            stamp: () => {
                const costumeValue = Array.isArray(costumesRef.current)
                    ? costumesRef.current[Number(currentCostumeRef.current) || 0]
                    : costumesRef.current?.[currentCostumeRef.current] || currentCostumeRef.current;

                if (window.stampSpriteOnCanvas) {
                    window.stampSpriteOnCanvas(
                        id,
                        xRef.current,
                        yRef.current,
                        costumeValue,
                        sizeRef.current
                    );
                }
            },
        };

        // ---- GLOBAL DISPATCH FUNCTIONS ----
        // These look up the target sprite's registered handler and call it.
        // Safe for concurrent multi-sprite execution.
        const dispatch = (action, tid, ...args) => {
            const handler = window._spriteActions?.[tid];
            if (handler && handler[action]) {
                handler[action](...args);
            }
        };

        window.moveForward = (tid, steps) => dispatch('moveForward', tid, steps);
        window.moveBackward = (tid, steps) => dispatch('moveBackward', tid, steps);
        window.moveUp = (tid, steps) => dispatch('moveUp', tid, steps);
        window.moveDown = (tid, steps) => dispatch('moveDown', tid, steps);
        window.turnRight = (tid, times) => dispatch('turnRight', tid, times);
        window.turnLeft = (tid, times) => dispatch('turnLeft', tid, times);
        window.jump = (tid, times) => dispatch('jump', tid, times);
        window.run = (tid) => dispatch('run', tid);
        window.findout = (tid) => dispatch('findout', tid);
        window.symmetry = (tid) => dispatch('symmetry', tid);
        window.switchCostume = (tid, name) => dispatch('switchCostume', tid, name);
        window.penDown = (tid) => dispatch('penDown', tid);
        window.penUp = (tid) => dispatch('penUp', tid);
        window.jiggle = (tid) => dispatch('jiggle', tid);

        // Cleanup: unregister this sprite when it unmounts
        return () => {
            if (window._spriteActions) {
                delete window._spriteActions[id];
            }
        };
    }, [id]); // Re-bind only if ID changes (refs handle state access)

    // Jiggle animation state
    const [jiggleKey, setJiggleKey] = useState(0);

    // Icon mapping logic (now supports costumes)
    // Fallback logic for safety
    // Track image load errors to fallback gracefully
    const [imgError, setImgError] = useState(false);

    // Reset error state when costume changes
    useEffect(() => {
        setImgError(false);
    }, [currentCostume]);

    const getEmojiForType = () => {
        if (type === 'robot') return '\u{1F916}';
        if (type === 'dog') return '\u{1F436}';
        if (type === 'cat') return '\u{1F431}';
        return '\u{1F43B}';
    };

    const renderIcon = () => {
        // 1. Resolve costume value (can be an index or a key if costumes is a map/array)
        let costumeValue = costumes?.[currentCostume] || currentCostume;

        // If costumes is an array and currentCostume is a numeric string/index
        if (Array.isArray(costumes)) {
            const idx = parseInt(currentCostume);
            if (!isNaN(idx) && costumes[idx]) {
                costumeValue = costumes[idx];
            }
        }

        // 2. If it looks like a path/URL (image) and hasn't errored, render img tag
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

        // 3. If it is an emoji string (check for emoji characters)
        if (typeof costumeValue === 'string') {
            // Check if it's an emoji (contains emoji unicode or is a single emoji character)
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
                // Render emoji with proper styling
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

        // 4. Fallback to emoji logic for legacy string-based states
        if (currentCostume === "wave") {
            if (type === 'bear') return "\u{1F44B}";
            if (type === 'dog') return "\u{1F415}";
            if (type === 'robot') return "\u{1F916}";
        }
        return getEmojiForType();
    };

    // Better: Receive costumes object
    // For now, let's just stick to the Emoji logic above as "Costume" implies.

    // --- DRAG TO MOVE ---
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, didDrag: false });

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.parentElement?.getBoundingClientRect();
        const stageLeft = rect?.left || 0;
        const stageTop = rect?.top || 0;
        const pointerX = e.clientX - stageLeft;
        const pointerY = e.clientY - stageTop;
        const tipOffset = getPenTipOffset(angleRef.current, sizeRef.current, scaleX, mirrored);

        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: x,
            origY: y,
            didDrag: false,
            parentLeft: stageLeft,
            parentTop: stageTop,
            prevDrawPoint: isPenSprite ? { x: pointerX, y: pointerY } : null,
            tipOffsetX: tipOffset.x,
            tipOffsetY: tipOffset.y,
        };

        setIsDragging(true);
        if (onDragStateChange) onDragStateChange(true);

        const handleMouseMove = (me) => {
            const dx = me.clientX - dragRef.current.startX;
            const dy = me.clientY - dragRef.current.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                dragRef.current.didDrag = true;
            }
            const pointerPoint = {
                x: me.clientX - dragRef.current.parentLeft,
                y: me.clientY - dragRef.current.parentTop
            };
            const newX = isPenSprite
                ? (pointerPoint.x - dragRef.current.tipOffsetX)
                : (dragRef.current.origX + dx);
            const newY = isPenSprite
                ? (pointerPoint.y - dragRef.current.tipOffsetY)
                : (dragRef.current.origY + dy);

            // If it's a pen sprite, draw while dragging!
            if (isPenSprite && window.drawSegment) {
                if (dragRef.current.prevDrawPoint) {
                    const activeColor = window.penColor || penColor;
                    const activeSize = window.penSize || 4;

                    window.drawSegment(
                        dragRef.current.prevDrawPoint.x,
                        dragRef.current.prevDrawPoint.y,
                        pointerPoint.x,
                        pointerPoint.y,
                        activeColor,
                        activeSize
                    );
                }

                dragRef.current.prevDrawPoint = pointerPoint;
            }

            updateStore({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsDragging(false);
            if (onDragStateChange) onDragStateChange(false);
            // Only fire click/select if we didn't actually drag
            if (!dragRef.current.didDrag && onClick) {
                onClick();
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Determine pen-down indicator color
    const penIndicatorColor = window.penColor || penColor || '#FF0000';
    const isPenType = isPenSprite;

    // Calculate current tip dynamically for render positions
    const renderTipOffset = isPenSprite
        ? getPenTipOffset(angle, size, scaleX, mirrored)
        : { x: SPRITE_CENTER, y: SPRITE_CENTER };
    const renderTip = {
        x: x + renderTipOffset.x,
        y: y + renderTipOffset.y
    };

    // Relative tip coordinates (for CSS transform origin within bounding box)
    const relativeTipX = renderTip.x - x;
    const relativeTipY = renderTip.y - y;

    return (
        <React.Fragment>
            <style>
                {`
                @keyframes spriteJiggle {
                    0% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.1) rotate(-5deg); filter: brightness(1.2); }
                    50% { transform: scale(1.1) rotate(5deg); filter: brightness(1.2); }
                    75% { transform: scale(1.05) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                .sprite-jiggle {
                    animation: spriteJiggle 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes penPulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.3); opacity: 1; }
                }
                @keyframes penWriting {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-3deg); }
                    75% { transform: rotate(3deg); }
                }
                `}
            </style>
            <div
                className={jiggleKey > 0 ? 'sprite-jiggle' : ''}
                key={`sprite-wrapper-${jiggleKey}`} // Force re-mount to re-trigger animation
                style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: `rotate(${angle}deg) scale(${(size / 100) * (isDragging && !isPenSprite ? 1.15 : 1)}) scaleX(${mirrored ? -scaleX : scaleX})`,
                    transition: isDragging ? 'transform 0.1s ease-out' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.2s, left 0.2s',
                    opacity: visible ? 1 : 0.5,
                    display: visible ? 'block' : 'none',
                    zIndex: isDragging ? 50 : (active ? 20 : 10),
                    cursor: isDragging ? 'grabbing' : 'grab',
                    filter: isDragging
                        ? 'drop-shadow(0 15px 15px rgba(0,0,0,0.3)) brightness(1.1)'
                        : (active ? 'drop-shadow(0 0 8px rgba(123,79,196,0.6))' : 'none'),
                    userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Speech Bubble */}
                {speech && (
                    <div style={{
                        position: 'absolute', bottom: '100%', left: '50%', transform: `translateX(-50%) scaleX(${mirrored ? -scaleX : scaleX})`,
                        background: 'white', border: '2px solid #333', borderRadius: '10px', padding: '5px 10px',
                        marginBottom: '10px', whiteSpace: 'nowrap', zIndex: 10
                    }}>
                        {speech}
                    </div>
                )}

                {/* Avatar */}
                <div style={{
                    fontSize: '50px',
                    lineHeight: 1,
                    transform: (isPenDown && isPenType) ? 'rotate(-5deg)' : 'none',
                    transformOrigin: `${relativeTipX}px ${relativeTipY}px` // Pivot near the tip
                }}>
                    {renderIcon()}
                </div>

                {/* Pen-Down Indicator: colored dot exactly at the drawing tip */}
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
            </div>
            {/* Stage Feedback Toast */}
            {active && feedback && (
                <div style={{
                    position: 'fixed', top: '50%', left: '70%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.7)', color: 'white', padding: '15px 25px', borderRadius: '10px',
                    fontSize: '20px', fontWeight: 'bold', zIndex: 100, pointerEvents: 'none'
                }}>
                    {feedback}
                </div>
            )}
        </React.Fragment>
    );
}
