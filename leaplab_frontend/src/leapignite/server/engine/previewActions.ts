declare global {
    interface Window {
        moveRelative?: (spriteId: string, dir: string, steps: number) => void;
        turnRight?: (spriteId: string, times: number) => void;
        turnLeft?: (spriteId: string, times: number) => void;
        jump?: (spriteId: string, times: number) => void;
        penDown?: (spriteId: string) => void;
        penUp?: (spriteId: string) => void;
        setPenColor?: (color: string) => void;
        setPenSize?: (size: number) => void;
        stampSprite?: (spriteId: string) => void;
        clearPen?: () => void;
        showFeedback?: (msg: string) => void;
        activeSpriteId?: string;
    }
}

export const previewActions: Record<string, (block: any) => void> = {
    move_right: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "RIGHT", Number(b?.getFieldValue("STEPS") || 1)),
    move_left: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "LEFT", Number(b?.getFieldValue("STEPS") || 1)),
    move_up: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "UP", Number(b?.getFieldValue("STEPS") || 1)),
    move_down: (b) => window.moveRelative(window.activeSpriteId || "robot_default", "DOWN", Number(b?.getFieldValue("STEPS") || 1)),

    turn_right: (b) => window.turnRight(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("TIMES") || 1)),
    turn_left: (b) => window.turnLeft(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("TIMES") || 1)),

    jump: (b) => window.jump(window.activeSpriteId || "robot_default", Number(b?.getFieldValue("TIMES") || 1)),

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
