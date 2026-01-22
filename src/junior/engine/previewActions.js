export const previewActions = {
    move_right: (b) => window.moveForward(window.activeSpriteId || "teddy", Number(b?.getFieldValue("STEPS") || 1)),
    move_left: (b) => window.moveBackward(window.activeSpriteId || "teddy", Number(b?.getFieldValue("STEPS") || 1)),
    move_up: (b) => window.moveUp(window.activeSpriteId || "teddy", Number(b?.getFieldValue("STEPS") || 1)),
    move_down: (b) => window.moveDown(window.activeSpriteId || "teddy", Number(b?.getFieldValue("STEPS") || 1)),

    turn_right: (b) => window.turnRight(window.activeSpriteId || "teddy", Number(b?.getFieldValue("TIMES") || 1)),
    turn_left: (b) => window.turnLeft(window.activeSpriteId || "teddy", Number(b?.getFieldValue("TIMES") || 1)),

    jump: (b) => window.jump(window.activeSpriteId || "teddy", Number(b?.getFieldValue("TIMES") || 1)),
};
