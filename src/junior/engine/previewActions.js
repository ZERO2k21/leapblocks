export const previewActions = {
    move_right: (b) => window.moveForward(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("STEPS") || 1)),
    move_left: (b) => window.moveBackward(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("STEPS") || 1)),
    move_up: (b) => window.moveUp(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("STEPS") || 1)),
    move_down: (b) => window.moveDown(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("STEPS") || 1)),

    turn_right: (b) => window.turnRight(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("TIMES") || 1)),
    turn_left: (b) => window.turnLeft(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("TIMES") || 1)),

    jump: (b) => window.jump(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("TIMES") || 1)),

    // --- Pen Previews ---
    pen_down: () => {
        const tid = window.activeSpriteId || "robot_default";
        if (window.penDown) window.penDown(tid);
    },
    pen_up: () => {
        const tid = window.activeSpriteId || "robot_default";
        if (window.penUp) window.penUp(tid);
    },
    pen_set_color: (b) => {
        const color = b?.getFieldValue?.("COLOR") || "#FF0000";
        if (window.setPenColor) window.setPenColor(color);
        if (window.showFeedback) window.showFeedback(`🎨 Color: ${color}`);
    },
    pen_set_size: (b) => {
        const size = b?.getFieldValue?.("SIZE") || "5";
        if (window.setPenSize) window.setPenSize(parseInt(size));
        if (window.showFeedback) window.showFeedback(`📏 Pen Size: ${size}`);
    },
    pen_stamp: () => {
        const tid = window.activeSpriteId || "robot_default";
        if (window.stampSprite) window.stampSprite(tid);
    },
    pen_eraser: () => {
        if (window.clearPen) window.clearPen();
        if (window.showFeedback) window.showFeedback("🧹 Erased!");
    },
};
