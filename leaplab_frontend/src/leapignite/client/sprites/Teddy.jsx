/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';
import useSpriteDrag, { getPenTipOffset } from './useSpriteDrag';
import SpriteDisplay from './spriteRenderer';

const normalizeSpriteKey = (value) => String(value || '').trim().toLowerCase();
const SPRITE_BOX_SIZE = 80;
const SPRITE_CENTER = SPRITE_BOX_SIZE / 2;

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

    const { isDragging, handleMouseDown, handleTouchStart } = useSpriteDrag({
        x, y, angle, size, scaleX, mirrored, onClick, onDragStateChange,
        isPenSprite, updateStore, penColor, isPenDown,
    });

    // Get Pencil Tip precisely based on sprite direction and size
    const getPencilTip = (currentX, currentY, currentAngle, currentSize) => {
        if (isPenSprite) {
            const offset = getPenTipOffset(currentAngle, currentSize, scaleXRef.current, mirroredRef.current);
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

        // Register pen drawing callback for useSpriteSystem movement
        // This ensures pen lines are drawn when sprites move via moveRelative/goToGrid
        if (!window._spritePenCallbacks) window._spritePenCallbacks = {};
        window._spritePenCallbacks[id] = (spriteId, oldX, oldY, newX, newY) => {
            if (spriteId !== id) return;
            if (!penRef.current || !window.drawSegment) return;

            const currentAngle = angleRef.current;
            const currentSize = sizeRef.current;
            const oldTip = getPencilTip(oldX, oldY, currentAngle, currentSize);
            const newTip = getPencilTip(newX, newY, currentAngle, currentSize);
            const activeColor = window.penColor || '#FF0000';
            const activeSize = window.penSize || 4;
            window.drawSegment(oldTip.x, oldTip.y, newTip.x, newTip.y, activeColor, activeSize);
        };

        // Cleanup: unregister this sprite when it unmounts
        return () => {
            if (window._spriteActions) {
                delete window._spriteActions[id];
            }
            if (window._spritePenCallbacks) {
                delete window._spritePenCallbacks[id];
            }
        };
    }, [id]); // Re-bind only if ID changes (refs handle state access)

    // Jiggle animation state
    const [jiggleKey, setJiggleKey] = useState(0);

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
                className={`select-none touch-none ${jiggleKey > 0 ? 'sprite-jiggle' : ''} ${visible ? 'block' : 'hidden'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                key={`sprite-wrapper-${jiggleKey}`} // Force re-mount to re-trigger animation
                style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: `rotate(${angle}deg) scale(${(size / 100) * (isDragging && !isPenSprite ? 1.15 : 1)}) scaleX(${mirrored ? -scaleX : scaleX})`,
                    transition: isDragging ? 'transform 0.1s ease-out' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.2s, left 0.2s',
                    opacity: visible ? 1 : 0.5,
                    zIndex: isDragging ? 50 : (active ? 20 : 10),
                    filter: isDragging
                        ? 'drop-shadow(0 15px 15px rgba(0,0,0,0.3)) brightness(1.1)'
                        : (active ? 'drop-shadow(0 0 8px rgba(123,79,196,0.6))' : 'none'),
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <SpriteDisplay
                    speech={speech}
                    type={type}
                    id={id}
                    costumes={costumes}
                    currentCostume={currentCostume}
                    textColor={textColor}
                    isPenDown={isPenDown}
                    isPenSprite={isPenSprite}
                    penColor={penColor}
                    mirrored={mirrored}
                    scaleX={scaleX}
                    angle={angle}
                    size={size}
                    x={x}
                    y={y}
                />
            </div>
            {/* Stage Feedback Toast */}
            {active && feedback && (
                <div className="fixed top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-6 py-3.75 rounded-xl text-xl font-bold z-[100] pointer-events-none">
                    {feedback}
                </div>
            )}
        </React.Fragment>
    );
}
