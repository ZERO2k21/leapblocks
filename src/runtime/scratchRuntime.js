/**
 * Scratch-compatible Runtime Engine for LeapBlocks
 * Handles sprite state, variable management, and block execution.
 */
import { spriteManager } from '../engine/SpriteManager';
import { motionEngine } from '../engine/MotionEngine';
import { costumeEngine } from '../engine/CostumeEngine';
import { soundManager } from '../engine/SoundManager';
import variableStore from '../store/variableStore';

class ScratchRuntime {
    constructor() {
        this.isRunning = false;
        this.activeScripts = new Set();
    }

    /**
     * Executes a block AST starting from a specific opcode
     * @param {Object} block - The block JSON from Blockly or AST
     * @param {string} spriteId - ID of the sprite executing the script
     */
    async executeBlock(block, spriteId) {
        if (!block) return;
        const sprite = spriteManager.getSprite(spriteId);
        if (!sprite) return;

        const opcode = block.opcode || block.type;
        const inputs = block.inputs || {};
        const fields = block.fields || {};

        console.log(`[ScratchRuntime] Executing: ${opcode}`, { spriteId, inputs });

        switch (opcode) {
            // ═══════════════════════════════════════════════════════════════════════
            // MOTION
            // ═══════════════════════════════════════════════════════════════════════
            case 'motion_movesteps':
                const steps = await this.getInputValue(inputs.STEPS, spriteId);
                motionEngine.move(sprite, Number(steps));
                break;

            case 'motion_turnright':
                const degreesR = await this.getInputValue(inputs.DEGREES, spriteId);
                motionEngine.turnRight(sprite, Number(degreesR));
                break;

            case 'motion_turnleft':
                const degreesL = await this.getInputValue(inputs.DEGREES, spriteId);
                motionEngine.turnLeft(sprite, Number(degreesL));
                break;

            case 'motion_gotoxy':
                const x = await this.getInputValue(inputs.X, spriteId);
                const y = await this.getInputValue(inputs.Y, spriteId);
                motionEngine.goTo(sprite, Number(x), Number(y));
                break;

            case 'motion_pointindirection':
                const dir = await this.getInputValue(inputs.DIRECTION, spriteId);
                motionEngine.pointInDirection(sprite, Number(dir));
                break;

            // ═══════════════════════════════════════════════════════════════════════
            // LOOKS
            // ═══════════════════════════════════════════════════════════════════════
            case 'looks_say':
                const sayMsg = await this.getInputValue(inputs.MESSAGE, spriteId);
                sprite.say(String(sayMsg));
                break;

            case 'looks_show':
                costumeEngine.show(sprite);
                break;

            case 'looks_hide':
                costumeEngine.hide(sprite);
                break;

            // ═══════════════════════════════════════════════════════════════════════
            // VARIABLES & LISTS (Using variableStore)
            // ═══════════════════════════════════════════════════════════════════════
            case 'data_setvariableto':
                const varName = fields.VARIABLE ? fields.VARIABLE.id || fields.VARIABLE.name : null;
                const varVal = await this.getInputValue(inputs.VALUE, spriteId);
                if (varName) variableStore.setVariable(varName, varVal);
                break;

            case 'data_changevariableby':
                const cVarName = fields.VARIABLE ? fields.VARIABLE.id || fields.VARIABLE.name : null;
                const cVarVal = await this.getInputValue(inputs.VALUE, spriteId);
                if (cVarName) {
                    const current = variableStore.getVariable(cVarName);
                    variableStore.setVariable(cVarName, Number(current) + Number(cVarVal));
                }
                break;

            case 'data_addtolist':
                const listName = fields.LIST ? fields.LIST.id || fields.LIST.name : null;
                const listItem = await this.getInputValue(inputs.ITEM, spriteId);
                if (listName) variableStore.addToList(listName, listItem);
                break;

            // ═══════════════════════════════════════════════════════════════════════
            // CONTROL
            // ═══════════════════════════════════════════════════════════════════════
            case 'control_wait':
                const duration = await this.getInputValue(inputs.DURATION, spriteId);
                await new Promise(resolve => setTimeout(resolve, Number(duration) * 1000));
                break;

            case 'control_repeat':
                const times = await this.getInputValue(inputs.TIMES, spriteId);
                const substack = inputs.SUBSTACK;
                for (let i = 0; i < Number(times); i++) {
                    await this.executeBlock(substack, spriteId);
                }
                break;

            default:
                console.warn(`[ScratchRuntime] Unknown opcode: ${opcode}`);
        }

        // Execute next block in sequence
        if (block.next) {
            await this.executeBlock(block.next, spriteId);
        }
    }

    /**
     * Resolves an input (could be a literal value or another block/reporter)
     */
    async getInputValue(input, spriteId) {
        if (!input) return 0;
        if (typeof input !== 'object') return input;
        
        // If it's a block (reporter/boolean), execute it and return value
        if (input.opcode) {
            return await this.executeReporter(input, spriteId);
        }
        
        return input.value ?? 0;
    }

    async executeReporter(block, spriteId) {
        const opcode = block.opcode;
        switch (opcode) {
            case 'operator_add':
                const a = await this.getInputValue(block.inputs.NUM1, spriteId);
                const b = await this.getInputValue(block.inputs.NUM2, spriteId);
                return Number(a) + Number(b);
            case 'data_variable':
                const varName = block.fields.VARIABLE ? block.fields.VARIABLE.name : null;
                return variableStore.getVariable(varName);
            case 'motion_xposition':
                const sprite = spriteManager.getSprite(spriteId);
                return sprite ? sprite.x : 0;
            default:
                return 0;
        }
    }
}

export const scratchRuntime = new ScratchRuntime();
export default scratchRuntime;
