interface GoalConfig {
    type?: string;
}

export class HintManager {
    static getHint(idleTimeMs: number, goalConfig: GoalConfig | null | undefined, blockCount: number): string | null {
        if (idleTimeMs < 5000) return null;

        if (goalConfig?.type === "reach_target") {
            if (blockCount === 0) return "Try dragging a block!";
            return "Can you make the bear move to the star?";
        }

        if (blockCount > 0) return "Click the Green Flag to run!";

        return "Drag a block from the left!";
    }
}
