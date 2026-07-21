interface GoalConfig {
    type?: string;
    target?: {
        x: number;
        y: number;
        tolerance?: number;
    };
}

interface GoalResult {
    complete: boolean;
    message?: string;
}

export class GoalManager {
    static checkGoal(goalConfig: GoalConfig | null | undefined, sprites: any[], activeSpriteId: string): GoalResult {
        if (!goalConfig) return { complete: false };

        if (goalConfig.type === "reach_target") {
            const sprite = sprites.find(s => s.id === activeSpriteId);
            if (!sprite) return { complete: false };

            const tx = goalConfig.target!.x;
            const ty = goalConfig.target!.y;
            const tol = goalConfig.target!.tolerance || 30;

            const dx = Math.abs(sprite.x - tx);
            const dy = Math.abs(sprite.y - ty);

            if (dx < tol && dy < tol) {
                return { complete: true, message: "You reached the target!" };
            }
        }

        return { complete: false };
    }
}
