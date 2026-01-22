/**
 * Hint Manager
 * Suggests actions based on state and idleness.
 */
export class HintManager {
    static getHint(idleTimeMs, goalConfig, blockCount) {
        if (idleTimeMs < 5000) return null; // No hint if active

        // 1. Goal Hints
        if (goalConfig?.type === "reach_target") {
            if (blockCount === 0) return "Try dragging a block!";
            return "Can you make the bear move to the star?";
        }

        // 2. General Hints
        if (blockCount > 0) return "Click the Green Flag to run!";

        return "Drag a block from the left!";
    }
}
