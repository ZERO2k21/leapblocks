import React, { useState, useEffect, useRef } from 'react';

export default function Sprite({ id, type, active, x, y, angle, size, visible, speech, currentCostume }) {
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
            // Reset to defaults (Hardcoded roughly or could store "initialState")
            updateStore({ x: 200 + (id === 'dog' ? 100 : 0), y: 150, angle: 0, size: 100, visible: true, currentCostume: "default", speech: null });
            // setSpeech(null); // Managed by store now
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
            window.stopAll = () => window.showFeedback("STOPPED 🛑");
        }

    }, [id]); // Re-bind only if ID changes (refs handle state access)

    // Icon mapping logic (now supports costumes)
    // Fallback logic for safety
    const renderIcon = () => {
        // If currentCostume is a string value directly (emoji), use it.
        // If it's a key like "default", "wave", look up in... Props? 
        // We passed costumes object in App.jsx but need to pass it down.
        // Actually, passed `{ costumes: { default: "🐻"... } }` inside sprite object.
        // BUT here we only destructured specific props.
        // Let's assume `currentCostume` is the KEY.
        // Ideally we should pass the `costumes` map prop.

        // Simple hack for now based on 'type' to keep it robust if props missing
        if (currentCostume === "wave") {
            if (type === 'bear') return "👋";
            if (type === 'dog') return "🐕";
        }
        if (type === 'dog') return '🐶';
        if (type === 'cat') return '🐱';
        return '🐻'; // Teddy default
    };

    // Better: Receive costumes object
    // For now, let's just stick to the Emoji logic above as "Costume" implies.

    return (
        <React.Fragment>
            <div
                style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: `rotate(${angle}deg) scale(${size / 100}) scaleX(${scaleX})`,
                    transition: 'transform 0.2s, top 0.2s, left 0.2s',
                    opacity: visible ? 1 : 0.5,
                    display: visible ? 'block' : 'none',
                    zIndex: active ? 20 : 10,
                    cursor: 'grab',
                    filter: active ? 'drop-shadow(0 0 5px blue)' : 'none'
                }}
            >
                {/* Speech Bubble */}
                {speech && (
                    <div style={{
                        position: 'absolute', bottom: '100%', left: '50%', transform: `translateX(-50%) scaleX(${scaleX})`,
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
