import React, { useState, useEffect, useRef } from 'react';

export default function Sprite({ id, type, active, x, y, angle, size, visible, speech, currentCostume, costumes, mirrored, onClick, onDragStateChange }) {
    // Local ephemeral state (speech bubbles, feedback)
    // Speech is now propped from App.jsx store
    const [scaleX, setScaleX] = useState(1);
    const [feedback, setFeedback] = useState(null);

    // Pen State (Kept local for now, could be prop if needed for save/load)
    const [isPenDown, setIsPenDown] = useState(false);
    const [penColor, setPenColor] = useState("#000000");

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
            const offset = 25; // Center
            window.drawSegment(oldX + offset, oldY + offset, newX + offset, newY + offset, penColor, 4);
        }

        updateStore({ x: newX, y: newY });
    };

    useEffect(() => {
        // Register Global Functions specific to THIS sprite ID
        // Note: These now modify the STORE via updateStore

        const check = (targetId) => targetId === id; // Only run if ID matches

        window.moveForward = (tid, steps = 1) => { if (check(tid)) performMove(20 * steps); };
        window.moveBackward = (tid, steps = 1) => { if (check(tid)) performMove(-20 * steps); };
        window.moveUp = (tid, steps = 1) => { if (check(tid)) performMoveY(-20 * steps); };
        window.moveDown = (tid, steps = 1) => { if (check(tid)) performMoveY(20 * steps); };

        window.turnRight = (tid, times = 3) => { if (check(tid)) updateStore({ angle: a => a + (15 * times) }); };
        window.turnLeft = (tid, times = 3) => { if (check(tid)) updateStore({ angle: a => a - (15 * times) }); };

        window.jump = (tid, times = 3) => {
            if (check(tid)) {
                // Height based on times ? Or fixed? Let's scale it slightly or keep fixed?
                // Request said "Jump [3]" (editable). 
                // Let's assume input maps to 'height multiplier' or 'grid units'.
                // Default was 50 (approx 2.5 grid units).
                // Let's use 20 * times.
                const height = 20 * times;
                performMoveY(-height);
                setTimeout(() => performMoveY(height), 300);
            }
        };

        window.run = (tid) => {
            if (check(tid)) {
                performMove(60);
                window.say(tid, "Running!! 🏃");
            }
        };

        window.findout = (tid) => {
            if (check(tid)) {
                window.say(tid, "Searching... 🔍");
                setTimeout(() => window.say(tid, "Found it!"), 1000);
            }
        };

        window.symmetry = (tid) => { if (check(tid)) setScaleX(s => s * -1); };

        window.symmetry = (tid) => { if (check(tid)) setScaleX(s => s * -1); };

        // window.say, setVisible, changeSize are now handled by App.jsx updates
        // to prevent overwriting global functions logic.


        // Costume
        window.switchCostume = (tid, name) => {
            if (check(tid)) updateStore({ currentCostume: name });
        };

        // Pen
        window.penDown = (tid) => { if (check(tid)) setIsPenDown(true); };
        window.penUp = (tid) => { if (check(tid)) setIsPenDown(false); };

        window.resetBear = () => {
            // Soft reset: keep current position, reset visual/state only
            // This lets sprites run from wherever the user dragged them
            updateStore({ angle: 0, size: 100, visible: true, currentCostume: "default", speech: null });
            setScaleX(1);
            setFeedback(null);
            setIsPenDown(false);
            if (window.clearPen) window.clearPen();
        };

        window.hardResetBear = () => {
            // Full reset: also resets position to defaults
            updateStore({ x: 200 + (id === 'dog' ? 100 : 0), y: 150, angle: 0, size: 100, visible: true, currentCostume: "default", speech: null });
            setScaleX(1);
            setFeedback(null);
            setIsPenDown(false);
            if (window.clearPen) window.clearPen();
        };

        // Global Feedback (Only for first sprite/Teddy just to have a handler)
        if (id === 'teddy') {
            window.showFeedback = (msg) => {
                setFeedback(msg);
                setTimeout(() => setFeedback(null), 1000);
            };
            window.changeScene = () => window.showFeedback("Scene Changed! 🖼️");
            // Updated stopAll to show feedback (ExecutionStop is thrown by the stop block)
            window.stopAll = () => window.showFeedback("STOPPED 🛑");
        }

        // Animation Triggers
        window.jiggle = (tid) => {
            if (check(tid)) {
                setJiggleKey(k => k + 1); // Triggers re-render with animation
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
        if (type === 'robot') return '🤖';
        if (type === 'dog') return '🐶';
        if (type === 'cat') return '🐱';
        return '🐻';
    };

    const renderIcon = () => {
        // 1. If we have a costumes map, try looking up by key
        const costumeValue = costumes?.[currentCostume] || currentCostume;

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

        // 3. If it is an emoji string
        if (typeof costumeValue === 'string' && costumeValue !== "default" && costumeValue !== "wave") {
            return costumeValue;
        }

        // 4. Fallback to emoji logic for legacy string-based states
        if (currentCostume === "wave") {
            if (type === 'bear') return "👋";
            if (type === 'dog') return "🐕";
            if (type === 'robot') return "🤖";
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
        };
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
                <div style={{ fontSize: '50px', lineHeight: 1 }}>
                    {renderIcon()}
                </div>
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
