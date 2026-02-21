import { spriteManager } from './SpriteManager';
import { stageManager } from './StageManager';
import { motionEngine } from './MotionEngine';
import { costumeEngine } from './CostumeEngine';

class ExecutionEngine {
    private isRunning = false;

    runEvent(eventName: string) {
        console.log(`[ExecutionEngine] Running event: ${eventName}`);
        this.isRunning = true;

        spriteManager.getAllSprites().forEach(sprite => {
            const scripts = sprite.scripts;
            scripts.forEach(script => {
                if (script.event === eventName) {
                    this.runBlocks(sprite, script.blocks);
                }
            });
        });
    }

    async runBlocks(sprite: any, blocks: any[]) {
        for (const block of blocks) {
            if (!this.isRunning) break;

            try {
                switch (block.type) {
                    case 'move':
                        motionEngine.move(sprite, block.value || 10);
                        break;
                    case 'nextCostume':
                        costumeEngine.nextCostume(sprite);
                        break;
                    case 'nextBackdrop':
                        stageManager.nextBackdrop();
                        break;
                    case 'wait':
                        await new Promise(resolve => setTimeout(resolve, (block.value || 1) * 1000));
                        break;
                    // Add more mappings as needed
                    default:
                        console.warn(`[ExecutionEngine] Unknown block type: ${block.type}`);
                }
            } catch (error) {
                console.error(`[ExecutionEngine] Error running block ${block.type}:`, error);
            }
        }
    }

    stopAll() {
        this.isRunning = false;
        console.log('[ExecutionEngine] All scripts stopped');
    }
}

export const executionEngine = new ExecutionEngine();
export default executionEngine;
