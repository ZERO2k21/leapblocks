/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * Runtime Engine for LeapBlocks
 * Handles sprite state, variable management, and block execution.
 */
import { spriteManager } from '../engine/SpriteManager';
import { motionEngine } from '../engine/MotionEngine';
import { costumeEngine } from '../engine/CostumeEngine';
import { soundManager } from '../engine/SoundManager';
import variableStore from '../store/variableStore';

declare global {
    interface Window {
        mouseX?: number;
        mouseY?: number;
        leapTimerStart?: number;
    }
}

export interface BlockField {
    value?: any;
    id?: string;
    name?: string;
}

export interface FlattenedBlock {
    opcode: string;
    id?: string;
    type?: string;
    fields: Record<string, BlockField>;
    inputs: Record<string, any>;
    next: FlattenedBlock | null;
    proccode?: string;
    block?: {
        fields?: Record<string, BlockField>;
    };
    value?: any;
}

export class LeapRuntime {
    public isRunning: boolean;
    public activeScripts: Set<any>;
    public spritesBlocks: Map<string, FlattenedBlock[]>;

    // Monitor callbacks
    public onShowVariable: ((varName: string) => void) | null;
    public onHideVariable: ((varName: string) => void) | null;
    public onShowList: ((listName: string) => void) | null;
    public onHideList: ((listName: string) => void) | null;
    public onLog: ((msg: string) => void) | null;

    public _onBroadcast?: ((msg: string) => void) | null;
    public _onBroadcastAndWait?: ((msg: string) => Promise<void> | void) | null;

    constructor() {
        this.isRunning = false;
        this.activeScripts = new Set();
        this.spritesBlocks = new Map();

        // Monitor callbacks
        this.onShowVariable = null;
        this.onHideVariable = null;
        this.onShowList = null;
        this.onHideList = null;
        this.onLog = null;
    }

    triggerFlag(): void {
        this.isRunning = true;
        this.triggerEvent('event_whenflagclicked');
        this.triggerEvent('arduino_setup'); // Compatibility
    }

    triggerClick(spriteId: string): void {
        this.triggerEvent('event_whenthisspriteclicked', {}, false, spriteId);
        this.triggerEvent('event_sprite_clicked', {}, false, spriteId);
    }

    /**
     * Executes a block AST starting from a specific opcode
     * @param block - The block JSON from Blockly or AST
     * @param spriteId - ID of the sprite executing the script
     */
    async executeBlock(block: any, spriteId: string): Promise<void> {
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
                case 'looks_switchcostumeto': {
                    const costumeVal = fields.COSTUME ? fields.COSTUME.value : await this.getInputValue(inputs.COSTUME, spriteId);
                    if (costumeVal && typeof costumeVal === 'string') {
                        costumeEngine.setCostume(sprite, costumeVal);
                    }
                    break;
                }
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
                case 'sound_play': {
                    const sound = fields.SOUND_MENU ? fields.SOUND_MENU.value : await this.getInputValue(inputs.SOUND_MENU, spriteId);
                    await soundManager.playSound(sprite, sound, false);
                    break;
                }
                case 'sound_playuntildone': {
                    const sound = fields.SOUND_MENU ? fields.SOUND_MENU.value : await this.getInputValue(inputs.SOUND_MENU, spriteId);
                    await soundManager.playSound(sprite, sound, true);
                    break;
                }
                case 'sound_stopallsounds':
                    soundManager.stopAll();
                    break;
                case 'sound_changevolumeby':
                    sprite.changeVolume(Number(await this.getInputValue(inputs.VOLUME, spriteId)));
                    break;
                case 'sound_setvolumeto':
                    sprite.setVolume(Number(await this.getInputValue(inputs.VOLUME, spriteId)));
                    break;
                case 'sound_changeeffectby':
                    sprite.changeSoundEffect(
                        (fields.EFFECT ? fields.EFFECT.value : await this.getInputValue(inputs.EFFECT, spriteId)).toLowerCase() === 'pan' ? 'pan' : 'pitch',
                        Number(await this.getInputValue(inputs.VALUE, spriteId))
                    );
                    break;
                case 'sound_seteffectto':
                    sprite.setSoundEffect(
                        (fields.EFFECT ? fields.EFFECT.value : await this.getInputValue(inputs.EFFECT, spriteId)).toLowerCase() === 'pan' ? 'pan' : 'pitch',
                        Number(await this.getInputValue(inputs.VALUE, spriteId))
                    );
                    break;
                case 'sound_cleareffects':
                    sprite.clearSoundEffects();
                    break;

                // ═══════════════════════════════════════════════════════════════════════
                // EVENT
                // ═══════════════════════════════════════════════════════════════════════
                case 'event_broadcast': {
                    const broadcastMsg = fields.BROADCAST_INPUT ? fields.BROADCAST_INPUT.value : await this.getInputValue(inputs.BROADCAST_INPUT || inputs.MESSAGE, spriteId);
                    this.triggerEvent('event_whenbroadcastreceived', { BROADCAST_OPTION: { value: broadcastMsg } });
                    // Also trigger AnimationVM broadcast for cross-sprite compiled scripts
                    if (typeof this._onBroadcast === 'function') {
                        this._onBroadcast(broadcastMsg);
                    }
                    break;
                }
                case 'event_broadcast_wait':
                case 'event_broadcastandwait': {
                    const broadcastWaitMsg = fields.BROADCAST_INPUT ? fields.BROADCAST_INPUT.value : await this.getInputValue(inputs.BROADCAST_INPUT || inputs.MESSAGE, spriteId);
                    await this.triggerEvent('event_whenbroadcastreceived', { BROADCAST_OPTION: { value: broadcastWaitMsg } }, true);
                    // Also trigger AnimationVM broadcast_wait for cross-sprite compiled scripts
                    if (typeof this._onBroadcastAndWait === 'function') {
                        await this._onBroadcastAndWait(broadcastWaitMsg);
                    }
                    break;
                }
                // "When" blocks are event triggers, not executable blocks themselves.
                // They are handled by the runtime's event system, not executed directly.
                case 'event_whenflagclicked':
                case 'event_flag_clicked':
                case 'event_whenkeypressed':
                case 'event_key_pressed':
                case 'event_whenthisspriteclicked':
                case 'event_sprite_clicked':
                case 'event_whenbroadcastreceived':
                case 'event_receive':
                case 'event_whenbackdropswitchesto':
                case 'event_backdrop_switch':
                case 'event_whengreaterthan':
                case 'event_greater_than':
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
                case 'control_stop': {
                    const stopType = fields.STOP_OPTION ? (fields.STOP_OPTION.value || fields.STOP_OPTION) : 'all';
                    if (stopType === 'all') {
                        this.stopAll();
                    } else if (stopType === 'this script' || stopType === 'this') {
                        return; // Exit script execution loop
                    }
                    break;
                }

                // ═══════════════════════════════════════════════════════════════════════
                // DATA (Variables & Lists)
                // ═══════════════════════════════════════════════════════════════════════
                case 'data_setvariableto':
                    {
                        const varName = fields.VARIABLE ? fields.VARIABLE.id || fields.VARIABLE.name : null;
                        const val = await this.getInputValue(inputs.VALUE, spriteId);
                        variableStore.setVariable(varName, val);
                        this.onLog?.(`Variable '${varName}' set to ${val}`);
                    }
                    break;
                case 'data_changevariableby':
                    {
                        const cVarName = fields.VARIABLE ? fields.VARIABLE.id || fields.VARIABLE.name : null;
                        const cValRaw = Number(await this.getInputValue(inputs.VALUE, spriteId));
                        const currentRaw = Number(variableStore.getVariable(cVarName));
                        const cVal = Number.isNaN(cValRaw) ? 0 : cValRaw;
                        const currentValue = Number.isNaN(currentRaw) ? 0 : currentRaw;
                        const newValue = currentValue + cVal;
                        variableStore.setVariable(cVarName, newValue);
                        this.onLog?.(`Variable '${cVarName}' changed by ${cVal} (New value: ${newValue})`);
                    }
                    break;
                case 'data_addtolist':
                    {
                        const addListName = fields.LIST ? fields.LIST.name || fields.LIST.id : await this.getInputValue(inputs.LIST, spriteId);
                        const item = await this.getInputValue(inputs.ITEM, spriteId);
                        variableStore.addToList(addListName, item);
                        this.onLog?.(`List '${addListName}': Added item '${item}'`);
                    }
                    break;
                case 'data_deleteoflist':
                    {
                        const delListName = fields.LIST ? fields.LIST.name || fields.LIST.id : await this.getInputValue(inputs.LIST, spriteId);
                        const idx = await this.getInputValue(inputs.INDEX, spriteId);
                        variableStore.deleteFromList(delListName, idx);
                        this.onLog?.(`List '${delListName}': Deleted item at index ${idx}`);
                    }
                    break;
                case 'data_deletealloflist':
                    {
                        const clrListName = fields.LIST ? fields.LIST.name || fields.LIST.id : await this.getInputValue(inputs.LIST, spriteId);
                        variableStore.deleteAllOfList(clrListName);
                        this.onLog?.(`List '${clrListName}': Deleted all items`);
                    }
                    break;
                case 'data_showvariable':
                    {
                        const showVarName = fields.VARIABLE ? fields.VARIABLE.name || fields.VARIABLE.id : await this.getInputValue(inputs.VARIABLE, spriteId);
                        if (this.onShowVariable) this.onShowVariable(showVarName);
                        this.onLog?.(`Show variable: ${showVarName}`);
                    }
                    break;
                case 'data_hidevariable':
                    {
                        const hideVarName = fields.VARIABLE ? fields.VARIABLE.name || fields.VARIABLE.id : await this.getInputValue(inputs.VARIABLE, spriteId);
                        if (this.onHideVariable) this.onHideVariable(hideVarName);
                        this.onLog?.(`Hide variable: ${hideVarName}`);
                    }
                    break;
                case 'data_showlist':
                    {
                        const showListName = fields.LIST ? fields.LIST.name || fields.LIST.id : await this.getInputValue(inputs.LIST, spriteId);
                        if (this.onShowList) this.onShowList(showListName);
                        this.onLog?.(`Show list: ${showListName}`);
                    }
                    break;
                case 'data_hidelist':
                    {
                        const hideListName = fields.LIST ? fields.LIST.name || fields.LIST.id : await this.getInputValue(inputs.LIST, spriteId);
                        if (this.onHideList) this.onHideList(hideListName);
                        this.onLog?.(`Hide list: ${hideListName}`);
                    }
                    break;

                // ═══════════════════════════════════════════════════════════════════════
                // PROCEDURES (My Blocks)
                // ═══════════════════════════════════════════════════════════════════════
                case 'procedures_call':
                    const proccode = block.proccode;
                    const def = (this as any).getProcedureDefinition ? (this as any).getProcedureDefinition(proccode) : null;
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
                    window.leapTimerStart = Date.now();
                    break;

                default:
                    console.warn(`[LeapRuntime] Unknown opcode: ${opcode}`);
            }
        } catch (e) {
            console.error(`[LeapRuntime] Error executing ${opcode}:`, e);
        }

        // Execute next block
        if (block.next) {
            await this.executeBlock(block.next, spriteId);
        }
    }

    /**
     * Resolves an input value
     */
    async getInputValue(input: any, spriteId: string): Promise<any> {
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

    async executeReporter(block: any, spriteId: string): Promise<any> {
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
            case 'operator_gt': {
                const v1 = await this.getInputValue(inputs.OPERAND1, spriteId);
                const v2 = await this.getInputValue(inputs.OPERAND2, spriteId);
                const n1 = Number(v1), n2 = Number(v2);
                if (!isNaN(n1) && !isNaN(n2)) return n1 > n2;
                return String(v1) > String(v2);
            }
            case 'operator_lt': {
                const v1 = await this.getInputValue(inputs.OPERAND1, spriteId);
                const v2 = await this.getInputValue(inputs.OPERAND2, spriteId);
                const n1 = Number(v1), n2 = Number(v2);
                if (!isNaN(n1) && !isNaN(n2)) return n1 < n2;
                return String(v1) < String(v2);
            }
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
                return fields.NUMBER_NAME === 'number' ? ((sprite?.currentCostumeIndex ?? 0) + 1) : (sprite?.currentCostume?.name ?? '');

            // SENSING REPORTERS
            case 'sensing_timer':
                return (Date.now() - (window.leapTimerStart || Date.now())) / 1000;
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

    async syncSprite(spriteId: string, json: any): Promise<void> {
        if (!json || !json.blocks) {
            this.spritesBlocks.delete(spriteId);
            return;
        }
        const blocks = json.blocks.blocks || [];
        this.spritesBlocks.set(spriteId, blocks.map((b: any) => this.flattenBlock(b)).filter(Boolean) as FlattenedBlock[]);
        console.log(`[LeapRuntime] Synced workspace for sprite: ${spriteId}`);
    }

    loadProject(workspaces: Map<string, any>): void {
        this.spritesBlocks = new Map();
        for (const [spriteId, json] of workspaces.entries()) {
            this.syncSprite(spriteId, json);
        }
        console.log(`[LeapRuntime] Loaded project with ${this.spritesBlocks.size} sprites`);
    }

    async triggerEvent(opcode: string, condition: Record<string, any> = {}, wait: boolean = false, spriteIdOnly: string | null = null): Promise<void> {
        if (!this.isRunning) {
            if (opcode === 'event_whenthisspriteclicked' || opcode === 'event_sprite_clicked') {
                this.isRunning = true; // Sprite click starts block execution even if stopped
            } else {
                return;
            }
        }

        const promises: Promise<void>[] = [];
        for (const [spriteId, blocks] of this.spritesBlocks.entries()) {
            if (spriteIdOnly && spriteId !== spriteIdOnly) continue;

            const sprite = spriteManager.getSprite(spriteId);
            if (!sprite) continue;

            for (const block of blocks) {
                // Support both standard leap opcodes and modernized aliases
                const blockOpcode = block.opcode;
                const isMatch = blockOpcode === opcode ||
                    (opcode === 'event_whenflagclicked' && blockOpcode === 'event_flag_clicked') ||
                    (opcode === 'event_whenbroadcastreceived' && blockOpcode === 'event_receive') ||
                    (opcode === 'event_whenthisspriteclicked' && blockOpcode === 'event_sprite_clicked') ||
                    (opcode === 'event_whenbackdropswitchesto' && blockOpcode === 'event_backdrop_switch') ||
                    (opcode === 'event_whengreaterthan' && blockOpcode === 'event_greater_than');

                if (isMatch) {
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

    flattenBlock(block: any): FlattenedBlock | null {
        if (!block) return null;
        const flattened: FlattenedBlock = {
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
                if ((val as any).block) flattened.inputs[key] = this.flattenBlock((val as any).block);
                else if ((val as any).shadow) flattened.inputs[key] = this.flattenBlock((val as any).shadow);
            }
        }
        if (block.next && block.next.block) {
            flattened.next = this.flattenBlock(block.next.block);
        }
        return flattened;
    }

    stopAll(): void {
        this.isRunning = false;
        this.activeScripts.clear();
        console.log('[LeapRuntime] Stopped all scripts');
    }
}

let _leapRuntime: LeapRuntime | null = null;
export function getLeapRuntime(): LeapRuntime {
    if (!_leapRuntime) _leapRuntime = new LeapRuntime();
    return _leapRuntime;
}
export const leapRuntime = new Proxy({} as LeapRuntime, {
    get(_target, prop: keyof LeapRuntime) {
        const instance = getLeapRuntime();
        const value = instance[prop];
        return typeof value === 'function' ? (value as Function).bind(instance) : value;
    },
    set(_target, prop: keyof LeapRuntime, value: any) {
        (getLeapRuntime() as any)[prop] = value;
        return true;
    }
});
export default leapRuntime;
