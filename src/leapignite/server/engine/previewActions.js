/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export const previewActions = {
    move_right: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "RIGHT", Number(b?.getFieldValue("STEPS") || 1)),
    move_left: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "LEFT", Number(b?.getFieldValue("STEPS") || 1)),
    move_up: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "UP", Number(b?.getFieldValue("STEPS") || 1)),
    move_down: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "DOWN", Number(b?.getFieldValue("STEPS") || 1)),

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
