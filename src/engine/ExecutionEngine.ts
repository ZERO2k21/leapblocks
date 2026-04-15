/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
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

let _executionEngine: ExecutionEngine | null = null;
export function getExecutionEngine(): ExecutionEngine {
    if (!_executionEngine) _executionEngine = new ExecutionEngine();
    return _executionEngine;
}
export const executionEngine: ExecutionEngine = new Proxy({} as ExecutionEngine, {
    get(_target, prop) {
        const instance = getExecutionEngine();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getExecutionEngine() as any)[prop] = value; return true; }
});
export default executionEngine;
