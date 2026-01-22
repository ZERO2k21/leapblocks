/**
 * Goal Manager
 * Evaluates execution state against lesson goals.
 */
export class GoalManager {
    static checkGoal(goalConfig, sprites, activeSpriteId) {
        if (!goalConfig) return { complete: false };

        if (goalConfig.type === "reach_target") {
            const sprite = sprites.find(s => s.id === activeSpriteId);
            if (!sprite) return { complete: false };

            const tx = goalConfig.target.x;
            const ty = goalConfig.target.y;
            const tol = goalConfig.target.tolerance || 30;

            const dx = Math.abs(sprite.x - tx);
            const dy = Math.abs(sprite.y - ty);

            // Junior "Reach" usually means getting close enough
            if (dx < tol && dy < tol) {
                return { complete: true, message: "You reached the target!" };
            }
        }

        return { complete: false };
    }
}
