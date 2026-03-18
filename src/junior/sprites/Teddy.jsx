import React, { useState, useEffect, useRef } from 'react';

export default function Sprite({ id, type, active, x, y, angle, size, visible, speech, currentCostume, costumes, mirrored, textColor, onClick, onDragStateChange }) {
    // Local ephemeral state (speech bubbles, feedback)
    // Speech is now propped from App.jsx store
    const [scaleX, setScaleX] = useState(1);
    const [feedback, setFeedback] = useState(null);

    // Pen State (Kept local for now, could be prop if needed for save/load)
    const [isPenDown, setIsPenDown] = useState(false);
    const [penColor, setPenColor] = useState("#000000");

    // Helper: detect if this is a pen-type sprite
    const isPenSprite = ['pencil', 'pen', 'drawing_pen'].includes(type) ||
        ['pencil', 'pen', 'drawing_pen'].includes(id?.toLowerCase?.());

    // Offset calculated dynamically now

    // REFS to hold Props for EVENT HANDLERS (Closure Trap Fix)
    const xRef = useRef(x);
    const yRef = useRef(y);
    const angleRef = useRef(angle);
    const penRef = useRef(isPenDown);
    const activeRef = useRef(active);

    useEffect(() => { xRef.current = x; }, [x]);
    useEffect(() => { yRef.current = y; }, [y]);
    useEffect(() => { angleRef.current = angle; }, [angle]);
    useEffect(() => { penRef.current = isPenDown; }, [isPenDown]);
    useEffect(() => { activeRef.current = active; }, [active]);

    // Helpers to dispatch updates to App.jsx Store
    const updateStore = (updates) => {
        if (window.updateSprite) {
            window.updateSprite(id, updates);
        }
    };

    // Get Pencil Tip precisely based on sprite direction and size
    const getPencilTip = (currentX, currentY, currentAngle, currentSize) => {
        // Sprite Center is at +40, +40 inside the 80x80 bounding box
        const centerX = currentX + 40;
        const centerY = currentY + 40;

        if (isPenSprite) {
            const angleRad = currentAngle * Math.PI / 180;
            const offsetX = 28;
            const offsetY = 18;

            const tipX =
                centerX +
                Math.cos(angleRad) * offsetX -
                Math.sin(angleRad) * offsetY;

            const tipY =
                centerY +
                Math.sin(angleRad) * offsetX +
                Math.cos(angleRad) * offsetY;

            return { x: tipX, y: tipY };
        }

        return { x: centerX, y: centerY };
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
            const currentSize = size;
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

        window.resetBear = () => {
            // Soft reset: keep position, reset visual state only
            // Lets sprites start from where user dragged them
            updateStore({ angle: 0, size: 100, visible: true, currentCostume: "default", speech: null });
            setScaleX(1);
            setFeedback(null);
            setIsPenDown(false);
        };

        window.hardResetBear = () => {
            // Full reset: also resets position with per-sprite offset
            const spriteIndex = Object.keys(window._spriteActions || {}).indexOf(id);
            const offsetX = spriteIndex * 100;
            updateStore({ x: 120 + offsetX, y: 150, angle: 0, size: 100, visible: true, currentCostume: "default", speech: null });
            setScaleX(1);
            setFeedback(null);
            setIsPenDown(false);
        };

        // Global Feedback handler
        if (id === 'teddy' || id === 'robot_default') {
            window.showFeedback = (msg) => {
                setFeedback(msg);
                setTimeout(() => setFeedback(null), 1000);
            };
            window.changeScene = () => window.showFeedback("Scene Changed! \u{1F5BC}\u{FE0F}");
            window.stopAll = () => window.showFeedback("STOPPED \u{1F6D1}");
        }

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

        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: x,
            origY: y,
            didDrag: false,
            parentLeft: rect?.left || 0,
            parentTop: rect?.top || 0,
            prevTip: null,
        };

        // Drawing While Dragging - Store initial tip
        dragRef.current.prevTip = getPencilTip(x, y, angleRef.current, size);

        setIsDragging(true);
        if (onDragStateChange) onDragStateChange(true);

        const handleMouseMove = (me) => {
            const dx = me.clientX - dragRef.current.startX;
            const dy = me.clientY - dragRef.current.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                dragRef.current.didDrag = true;
            }
            const newX = dragRef.current.origX + dx;
            const newY = dragRef.current.origY + dy;

            // If it's a pen sprite, draw while dragging!
            if (isPenSprite && window.drawSegment) {
                const tip = getPencilTip(newX, newY, angleRef.current, size);

                if (dragRef.current.prevTip) {
                    const activeColor = window.penColor || penColor;
                    const activeSize = window.penSize || 4;

                    window.drawSegment(
                        dragRef.current.prevTip.x,
                        dragRef.current.prevTip.y,
                        tip.x,
                        tip.y,
                        activeColor,
                        activeSize
                    );
                }

                dragRef.current.prevTip = tip;
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
    const isPenType = ['pencil', 'pen', 'drawing_pen'].includes(type) ||
        ['pencil', 'pen', 'drawing_pen'].includes(id?.toLowerCase?.());

    // Calculate current tip dynamically for render positions
    const renderTip = getPencilTip(x, y, angle, size);

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
                    transform: `rotate(${angle}deg) scale(${(size / 100) * (isDragging ? 1.15 : 1)}) scaleX(${mirrored ? -scaleX : scaleX})`,
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
