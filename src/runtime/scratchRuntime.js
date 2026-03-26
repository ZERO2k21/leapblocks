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
        this.spritesBlocks = new Map();
        
        // Monitor callbacks
        this.onShowVariable = null;
        this.onHideVariable = null;
        this.onShowList = null;
        this.onHideList = null;
    }

    triggerFlag() {
        this.isRunning = true;
        this.triggerEvent('event_whenflagclicked');
        this.triggerEvent('arduino_setup'); // Compatibility
    }

    triggerClick(spriteId) {
        this.triggerEvent('event_whenthisspriteclicked', {}, false, spriteId);
    }

    /**
     * Executes a block AST starting from a specific opcode
     * @param {Object} block - The block JSON from Blockly or AST
     * @param {string} spriteId - ID of the sprite executing the script
     */
    async executeBlock(block, spriteId) {
        if (!block || !this.isRunning) return;
        const sprite = spriteManager.getSprite(spriteId);
        if (!sprite) return;

        const opcode = block.opcode || block.type;
        const inputs = block.inputs || {};
        const fields = block.fields || {};

        try {
            switch (opcode) {
                // ═══════════════════════════════════════════════════════════════════════
                // MOTION
                // ═══════════════════════════════════════════════════════════════════════
                case 'motion_movesteps':
                    motionEngine.move(sprite, await this.getInputValue(inputs.STEPS, spriteId));
                    break;
                case 'motion_turnright':
                    motionEngine.turnRight(sprite, await this.getInputValue(inputs.DEGREES, spriteId));
                    break;
                case 'motion_turnleft':
                    motionEngine.turnLeft(sprite, await this.getInputValue(inputs.DEGREES, spriteId));
                    break;
                case 'motion_goto':
                    const to = fields.TO ? fields.TO.value : await this.getInputValue(inputs.TO, spriteId);
                    if (to === '_random_') {
                        motionEngine.goTo(sprite, Math.random() * 480 - 240, Math.random() * 360 - 180);
                    } else if (to === '_mouse_') {
                        // Assuming global mouse tracking exists
                        motionEngine.goTo(sprite, window.mouseX || 0, window.mouseY || 0);
                    } else {
                        const target = spriteManager.getSprite(to);
                        if (target) motionEngine.goTo(sprite, target.x, target.y);
                    }
                    break;
                case 'motion_gotoxy':
                    motionEngine.goTo(sprite, await this.getInputValue(inputs.X, spriteId), await this.getInputValue(inputs.Y, spriteId));
                    break;
                case 'motion_glideto':
                    const glideTo = fields.TO ? fields.TO.value : await this.getInputValue(inputs.TO, spriteId);
                    const glideSecs = await this.getInputValue(inputs.SECS, spriteId);
                    let targetX = 0, targetY = 0;
                    if (glideTo === '_random_') {
                        targetX = Math.random() * 480 - 240;
                        targetY = Math.random() * 360 - 180;
                    } else if (glideTo === '_mouse_') {
                        targetX = window.mouseX || 0;
                        targetY = window.mouseY || 0;
                    }
                    motionEngine.glide(sprite, targetX, targetY, glideSecs);
                    await new Promise(resolve => setTimeout(resolve, glideSecs * 1000));
                    break;
                case 'motion_pointindirection':
                    motionEngine.pointInDirection(sprite, await this.getInputValue(inputs.DIRECTION, spriteId));
                    break;
                case 'motion_changexby':
                    sprite.setX(sprite.x + Number(await this.getInputValue(inputs.DX, spriteId)));
                    break;
                case 'motion_setx':
                    sprite.setX(Number(await this.getInputValue(inputs.X, spriteId)));
                    break;
                case 'motion_changeyby':
                    sprite.setY(sprite.y + Number(await this.getInputValue(inputs.DY, spriteId)));
                    break;
                case 'motion_sety':
                    sprite.setY(Number(await this.getInputValue(inputs.Y, spriteId)));
                    break;
                case 'motion_ifonedgebounce':
                    motionEngine.ifOnEdgeBounce(sprite);
                    break;
                case 'motion_setrotationstyle':
                    sprite.setRotationStyle(fields.STYLE ? fields.STYLE.value : 'all around');
                    break;

                // ═══════════════════════════════════════════════════════════════════════
                // LOOKS
                // ═══════════════════════════════════════════════════════════════════════
                case 'looks_say':
                    sprite.say(String(await this.getInputValue(inputs.MESSAGE, spriteId)));
                    break;
                case 'looks_sayforsecs':
                    const sayMsg = await this.getInputValue(inputs.MESSAGE, spriteId);
                    const saySecs = await this.getInputValue(inputs.SECS, spriteId);
                    sprite.say(String(sayMsg));
                    await new Promise(resolve => setTimeout(resolve, saySecs * 1000));
                    sprite.say(''); // Clear
                    break;
                case 'looks_switchcostumeto':
                    costumeEngine.setCostume(sprite, fields.COSTUME ? fields.COSTUME.value : await this.getInputValue(inputs.COSTUME, spriteId));
                    break;
                case 'looks_nextcostume':
                    costumeEngine.nextCostume(sprite);
                    break;
                case 'looks_setsizeto':
                    costumeEngine.setSize(sprite, await this.getInputValue(inputs.SIZE, spriteId));
                    break;
                case 'looks_changesizeby':
                    costumeEngine.changeSize(sprite, await this.getInputValue(inputs.CHANGE, spriteId));
                    break;
                case 'looks_think':
                    sprite.think(String(await this.getInputValue(inputs.MESSAGE, spriteId)));
                    break;
                case 'looks_thinkforsecs':
                    const thinkMsg = await this.getInputValue(inputs.MESSAGE, spriteId);
                    const thinkSecs = await this.getInputValue(inputs.SECS, spriteId);
                    sprite.think(String(thinkMsg));
                    await new Promise(resolve => setTimeout(resolve, thinkSecs * 1000));
                    sprite.think('');
                    break;
                case 'looks_show':
                    costumeEngine.show(sprite);
                    break;
                case 'looks_hide':
                    costumeEngine.hide(sprite);
                    break;
                // ═══════════════════════════════════════════════════════════════════════
                // SOUND
                // ═══════════════════════════════════════════════════════════════════════
                case 'sound_play':
                case 'sound_playuntildone':
                    const sound = fields.SOUND_MENU ? fields.SOUND_MENU.value : await this.getInputValue(inputs.SOUND_MENU, spriteId);
                    await soundManager.playSound(sprite, sound);
                    break;
                case 'sound_stopallsounds':
                    soundManager.stopAll();
                    break;
                case 'sound_changevolumeby':
                    sprite.setVolume(sprite.volume + Number(await this.getInputValue(inputs.VOLUME, spriteId)));
                    break;
                case 'sound_setvolumeto':
                    sprite.setVolume(Number(await this.getInputValue(inputs.VOLUME, spriteId)));
                    break;

                // ═══════════════════════════════════════════════════════════════════════
                // EVENT
                // ═══════════════════════════════════════════════════════════════════════
                case 'event_broadcast':
                    this.triggerEvent('event_whenbroadcastreceived', { BROADCAST_OPTION: { value: await this.getInputValue(inputs.BROADCAST_INPUT, spriteId) } });
                    break;
                case 'event_broadcastandwait':
                    await this.triggerEvent('event_whenbroadcastreceived', { BROADCAST_OPTION: { value: await this.getInputValue(inputs.BROADCAST_INPUT, spriteId) } }, true);
                    break;
                // "When" blocks are event triggers, not executable blocks themselves.
                // They are handled by the runtime's event system, not executed directly.
                case 'event_whenflagclicked':
                case 'event_whenkeypressed':
                case 'event_whenthisspriteclicked':
                case 'event_whenbroadcastreceived':
                case 'event_whenbackdropswitchesto':
                case 'event_whengreaterthan':
                    // No-op, these blocks are entry points for scripts, not actions.
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
                    for (let i = 0; i < Number(times); i++) {
                        if (!this.isRunning) break;
                        await this.executeBlock(inputs.SUBSTACK, spriteId);
                    }
                    break;
                case 'control_forever':
                    while (this.isRunning) {
                        await this.executeBlock(inputs.SUBSTACK, spriteId);
                        await new Promise(resolve => setTimeout(resolve, 10)); // Yield
                    }
                    break;
                case 'control_if':
                    if (await this.getInputValue(inputs.CONDITION, spriteId)) {
                        await this.executeBlock(inputs.SUBSTACK, spriteId);
                    }
                    break;
                case 'control_if_else':
                    if (await this.getInputValue(inputs.CONDITION, spriteId)) {
                        await this.executeBlock(inputs.SUBSTACK, spriteId);
                    } else {
                        await this.executeBlock(inputs.SUBSTACK2, spriteId);
                    }
                    break;
                case 'control_wait_until':
                    while (!(await this.getInputValue(inputs.CONDITION, spriteId)) && this.isRunning) {
                        await new Promise(resolve => setTimeout(resolve, 10)); // Yield
                    }
                    break;
                case 'control_repeat_until':
                    while (!(await this.getInputValue(inputs.CONDITION, spriteId)) && this.isRunning) {
                        await this.executeBlock(inputs.SUBSTACK, spriteId);
                    }
                    break;
                case 'control_stop':
                    const stopType = fields.STOP_OPTION ? fields.STOP_OPTION.value : 'all';
                    if (stopType === 'all') this.stopAll();
                    // TODO: Implement 'this script' and 'other scripts in sprite'
                    break;

                // ═══════════════════════════════════════════════════════════════════════
                // DATA (Variables & Lists)
                // ═══════════════════════════════════════════════════════════════════════
                case 'data_setvariableto':
                    const varName = fields.VARIABLE ? fields.VARIABLE.id || fields.VARIABLE.name : null;
                    variableStore.setVariable(varName, await this.getInputValue(inputs.VALUE, spriteId));
                    break;
                case 'data_changevariableby':
                    const cVarName = fields.VARIABLE ? fields.VARIABLE.id || fields.VARIABLE.name : null;
                    const cVal = Number(await this.getInputValue(inputs.VALUE, spriteId));
                    variableStore.setVariable(cVarName, Number(variableStore.getVariable(cVarName)) + cVal);
                    break;
                case 'data_addtolist':
                    const addListName = fields.LIST ? fields.LIST.name : await this.getInputValue(inputs.LIST, spriteId);
                    variableStore.addToList(addListName, await this.getInputValue(inputs.ITEM, spriteId));
                    break;
                case 'data_deleteoflist':
                    const delListName = fields.LIST ? fields.LIST.name : await this.getInputValue(inputs.LIST, spriteId);
                    variableStore.deleteFromList(delListName, await this.getInputValue(inputs.INDEX, spriteId));
                    break;
                case 'data_deletealloflist':
                    const clrListName = fields.LIST ? fields.LIST.name : await this.getInputValue(inputs.LIST, spriteId);
                    variableStore.deleteAllOfList(clrListName);
                    break;
                case 'data_showvariable':
                    const showVarName = fields.VARIABLE ? fields.VARIABLE.name : await this.getInputValue(inputs.VARIABLE, spriteId);
                    if (this.onShowVariable) this.onShowVariable(showVarName);
                    break;
                case 'data_hidevariable':
                    const hideVarName = fields.VARIABLE ? fields.VARIABLE.name : await this.getInputValue(inputs.VARIABLE, spriteId);
                    if (this.onHideVariable) this.onHideVariable(hideVarName);
                    break;
                case 'data_showlist':
                    const showListName = fields.LIST ? fields.LIST.name : await this.getInputValue(inputs.LIST, spriteId);
                    if (this.onShowList) this.onShowList(showListName);
                    break;
                case 'data_hidelist':
                    const hideListName = fields.LIST ? fields.LIST.name : await this.getInputValue(inputs.LIST, spriteId);
                    if (this.onHideList) this.onHideList(hideListName);
                    break;

                // ═══════════════════════════════════════════════════════════════════════
                // PROCEDURES (My Blocks)
                // ═══════════════════════════════════════════════════════════════════════
                case 'procedures_call':
                    const proccode = block.proccode;
                    const def = this.getProcedureDefinition(proccode);
                    if (def) {
                        // Map arguments
                        // TODO: Implement parameter passing
                        await this.executeBlock(def, spriteId);
                    }
                    break;
                case 'procedures_definition':
                    // This block defines a procedure, it doesn't execute anything itself.
                    // Its purpose is to register the procedure's body.
                    // The actual registration should happen during project loading/parsing.
                    // For runtime execution, it's a no-op.
                    break;

                // ═══════════════════════════════════════════════════════════════════════
                // SENSING
                // ═══════════════════════════════════════════════════════════════════════
                case 'sensing_resettimer':
                    window.scratchTimerStart = Date.now();
                    break;

                default:
                    console.warn(`[ScratchRuntime] Unknown opcode: ${opcode}`);
            }
        } catch (e) {
            console.error(`[ScratchRuntime] Error executing ${opcode}:`, e);
        }

        // Execute next block
        if (block.next) {
            await this.executeBlock(block.next, spriteId);
        }
    }

    /**
     * Resolves an input value
     */
    async getInputValue(input, spriteId) {
        if (!input) return 0;
        if (typeof input !== 'object') return input;
        
        if (input.opcode || input.type) {
            return await this.executeReporter(input, spriteId);
        }
        
        // Handle direct values from Blockly (e.g., shadow blocks)
        if (input.block && input.block.fields && input.block.fields.NUM) {
            return Number(input.block.fields.NUM.value);
        }
        if (input.block && input.block.fields && input.block.fields.TEXT) {
            return String(input.block.fields.TEXT.value);
        }
        if (input.block && input.block.fields && input.block.fields.VARIABLE) {
            return variableStore.getVariable(input.block.fields.VARIABLE.name);
        }

        return input.value !== undefined ? input.value : 0;
    }

    async executeReporter(block, spriteId) {
        const opcode = block.opcode || block.type;
        const inputs = block.inputs || {};
        const fields = block.fields || {};
        const sprite = spriteManager.getSprite(spriteId);

        switch (opcode) {
            // OPERATORS
            case 'operator_add':
                return Number(await this.getInputValue(inputs.NUM1, spriteId)) + Number(await this.getInputValue(inputs.NUM2, spriteId));
            case 'operator_subtract':
                return Number(await this.getInputValue(inputs.NUM1, spriteId)) - Number(await this.getInputValue(inputs.NUM2, spriteId));
            case 'operator_multiply':
                return Number(await this.getInputValue(inputs.NUM1, spriteId)) * Number(await this.getInputValue(inputs.NUM2, spriteId));
            case 'operator_divide':
                return Number(await this.getInputValue(inputs.NUM1, spriteId)) / Number(await this.getInputValue(inputs.NUM2, spriteId));
            case 'operator_random':
                const from = Number(await this.getInputValue(inputs.FROM, spriteId));
                const to = Number(await this.getInputValue(inputs.TO, spriteId));
                return Math.floor(Math.random() * (to - from + 1) + from);
            case 'operator_gt':
                return Number(await this.getInputValue(inputs.OPERAND1, spriteId)) > Number(await this.getInputValue(inputs.OPERAND2, spriteId));
            case 'operator_lt':
                return Number(await this.getInputValue(inputs.OPERAND1, spriteId)) < Number(await this.getInputValue(inputs.OPERAND2, spriteId));
            case 'operator_equals':
                return String(await this.getInputValue(inputs.OPERAND1, spriteId)) === String(await this.getInputValue(inputs.OPERAND2, spriteId));
            case 'operator_and':
                return (await this.getInputValue(inputs.OPERAND1, spriteId)) && (await this.getInputValue(inputs.OPERAND2, spriteId));
            case 'operator_or':
                return (await this.getInputValue(inputs.OPERAND1, spriteId)) || (await this.getInputValue(inputs.OPERAND2, spriteId));
            case 'operator_not':
                return !(await this.getInputValue(inputs.OPERAND, spriteId));
            case 'operator_join':
                return String(await this.getInputValue(inputs.STRING1, spriteId)) + String(await this.getInputValue(inputs.STRING2, spriteId));
            case 'operator_length':
                return String(await this.getInputValue(inputs.STRING, spriteId)).length;
            case 'operator_mod':
                return Number(await this.getInputValue(inputs.NUM1, spriteId)) % Number(await this.getInputValue(inputs.NUM2, spriteId));
            case 'operator_round':
                return Math.round(Number(await this.getInputValue(inputs.NUM, spriteId)));
            case 'operator_mathop':
                const op = fields.OPERATOR ? fields.OPERATOR.value : 'abs';
                const num = Number(await this.getInputValue(inputs.NUM, spriteId));
                switch (op) {
                    case 'abs': return Math.abs(num);
                    case 'floor': return Math.floor(num);
                    case 'ceiling': return Math.ceil(num);
                    case 'sqrt': return Math.sqrt(num);
                    case 'sin': return Math.sin(num * Math.PI / 180);
                    case 'cos': return Math.cos(num * Math.PI / 180);
                    case 'tan': return Math.tan(num * Math.PI / 180);
                    default: return num;
                }
            
            // MOTION REPORTERS
            case 'motion_xposition':
                return sprite?.x || 0;
            case 'motion_yposition':
                return sprite?.y || 0;
            case 'motion_direction':
                return sprite?.direction || 0;

            // LOOKS REPORTERS
            case 'looks_size':
                return sprite?.size || 100;
            case 'looks_costumenumbername':
                return fields.NUMBER_NAME === 'number' ? (sprite?.costumeIndex + 1) : sprite?.costumeName;

            // SENSING REPORTERS
            case 'sensing_timer':
                return (Date.now() - (window.scratchTimerStart || Date.now())) / 1000;
            case 'sensing_username':
                return window.sessionStorage.getItem('username') || 'LeapUser';
            case 'sensing_mousex':
                return window.mouseX || 0;
            case 'sensing_mousey':
                return window.mouseY || 0;

            // DATA REPORTERS
            case 'data_variable':
            case 'variable_reporter_checkbox':
                const varName = block.fields.VARIABLE ? (block.fields.VARIABLE.id || block.fields.VARIABLE.name || block.fields.VARIABLE.value) : null;
                return variableStore.getVariable(varName);
            case 'data_listcontents':
            case 'list_reporter_checkbox':
                const listName = block.fields.LIST ? (block.fields.LIST.id || block.fields.LIST.name || block.fields.LIST.value) : null;
                return variableStore.getList(listName);
            default:
                return 0;
        }
    }
    async syncSprite(spriteId, json) {
        if (!json || !json.blocks) {
            this.spritesBlocks.delete(spriteId);
            return;
        }
        const blocks = json.blocks.blocks || [];
        this.spritesBlocks.set(spriteId, blocks.map(b => this.flattenBlock(b)));
        console.log(`[ScratchRuntime] Synced workspace for sprite: ${spriteId}`);
    }

    loadProject(workspaces) {
        this.spritesBlocks = new Map();
        for (const [spriteId, json] of workspaces.entries()) {
            this.syncSprite(spriteId, json);
        }
        console.log(`[ScratchRuntime] Loaded project with ${this.spritesBlocks.size} sprites`);
    }

    async triggerEvent(opcode, condition = {}, wait = false, spriteIdOnly = null) {
        if (!this.isRunning) return;
        
        const promises = [];
        for (const [spriteId, blocks] of this.spritesBlocks.entries()) {
            if (spriteIdOnly && spriteId !== spriteIdOnly) continue;
            
            const sprite = spriteManager.getSprite(spriteId);
            if (!sprite) continue;

            for (const block of blocks) {
                if (block.opcode === opcode) {
                    let match = true;
                    for (const [key, val] of Object.entries(condition)) {
                        if (block.fields[key]?.value !== val.value) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        const p = this.executeBlock(block.next, spriteId);
                        if (wait) promises.push(p);
                    }
                }
            }
        }
        if (wait) await Promise.all(promises);
    }

    flattenBlock(block) {
        if (!block) return null;
        const flattened = {
            opcode: block.type,
            id: block.id,
            fields: {},
            inputs: {},
            next: null
        };
        if (block.fields) {
            for (const [key, val] of Object.entries(block.fields)) {
                flattened.fields[key] = { value: val };
            }
        }
        if (block.inputs) {
            for (const [key, val] of Object.entries(block.inputs)) {
                if (val.block) flattened.inputs[key] = this.flattenBlock(val.block);
                else if (val.shadow) flattened.inputs[key] = this.flattenBlock(val.shadow);
            }
        }
        if (block.next && block.next.block) {
            flattened.next = this.flattenBlock(block.next.block);
        }
        return flattened;
    }

    stopAll() {
        this.isRunning = false;
        this.activeScripts.clear();
        console.log('[ScratchRuntime] Stopped all scripts');
    }
}

export const scratchRuntime = new ScratchRuntime();
export default scratchRuntime;
