import Blockly from '@blockly-runtime';
import type { CompiledScript, ScriptStep } from '../vm/AnimationVM';
import { animationVM } from '../vm/AnimationVM';
import { hardwareAdapter } from '../hardware/HardwareAdapter';
import { stageManager } from '../engine/StageManager';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION GENERATOR - Compiles blocks to executable scripts
// ═══════════════════════════════════════════════════════════════════════════

// Logging utility for AnimationCompiler
const compilerLog = {
    info: (msg: string, data?: any) => console.log(`[AnimationCompiler] ${msg}`, data ?? ''),
    block: (type: string, result?: string) => console.log(`[AnimationCompiler.Block] ${type} → ${result ?? 'compiled'}`),
    warn: (msg: string, data?: any) => console.warn(`[AnimationCompiler.Warn] ${msg}`, data ?? ''),
    error: (msg: string, err?: any) => console.error(`[AnimationCompiler.Error] ${msg}`, err ?? ''),
};

export class AnimationCompiler {
    private spriteId: string;

    constructor(spriteId: string) {
        this.spriteId = spriteId;
        compilerLog.info(`Compiler created for sprite: ${spriteId}`);
    }

    // Compile a condition input block into a runtime function
    private compileCondition(block: Blockly.Block, inputName: string): () => boolean {
        const input = block.getInput(inputName);
        if (!input || !input.connection) return () => false;

        const conditionBlock = input.connection.targetBlock();
        if (!conditionBlock) return () => false;

        switch (conditionBlock.type) {
            case 'sensing_key_pressed': {
                const key = conditionBlock.getFieldValue('KEY');
                return () => animationVM.isKeyPressed(key);
            }
            case 'sensing_touching': {
                const object = conditionBlock.getFieldValue('OBJECT');
                return () => animationVM.isTouching(object, this.spriteId);
            }
            case 'sensing_touching_color': {
                const color = conditionBlock.getFieldValue('COLOR');
                return () => animationVM.isTouchingColor(color, this.spriteId);
            }
            case 'sensing_color_touching_color': {
                const color1 = conditionBlock.getFieldValue('COLOR1');
                const color2 = conditionBlock.getFieldValue('COLOR2');
                return () => animationVM.isColorTouchingColor(color1, color2, this.spriteId);
            }
            case 'sensing_mouse_down':
                return () => animationVM.isMouseDown();
            case 'event_greater_than': {
                const sensor = conditionBlock.getFieldValue('SENSOR');
                const value = Number(conditionBlock.getFieldValue('VALUE'));
                if (sensor === 'loudness') return () => animationVM.getLoudness() > value;
                if (sensor === 'timer') return () => animationVM.getTimer() > value;
                if (sensor === 'timer') return () => animationVM.getTimer() > value;
                return () => false;
            }
            case 'operator_contains': {
                const str1 = String(conditionBlock.getFieldValue('STRING1'));
                const str2 = String(conditionBlock.getFieldValue('STRING2'));
                return () => str1.includes(str2);
            }
            case 'data_listcontainsitem': {
                const list = this.getVariableName(conditionBlock);
                const item = this.compileStringValue(conditionBlock, 'ITEM');
                // Note: compileStringValue returns a closure, so we need to call it inside the returned closure
                // Wait, compileStringValue returns () => string.
                // compileCondition returns () => boolean.
                // I need to bind compilation time `item` closure to runtime.
                // Actually `item` here calls `this.compileStringValue` which traverses the tree.
                // So `item` is `() => string`.
                return () => animationVM.listContains(list, item());
            }
            case 'arduino_digital_sensor': {
                const sensor = conditionBlock.getFieldValue('SENSOR');
                const pin = conditionBlock.getFieldValue('PIN');
                return () => {
                    // For now, we'll return false if not connected, or try to get latest state
                    // In a full implementation, we'd have a background polling task in VM
                    // that updates a state map.
                    // For the "Live" feature to feel responsive, we'll assume the VM 
                    // or hardwareAdapter provides a way to get the last known state.
                    console.log(`[AnimationVM] Checking digital sensor ${sensor} on pin ${pin}`);
                    return false; // Default to false for simulation
                };
            }
            default:
                console.warn('[AnimationCompiler] Unknown condition block:', conditionBlock.type);
                return () => false;
        }
    }

    private getVariableId(block: Blockly.Block): string {
        return block.getFieldValue('VARIABLE');
    }

    private getVariableName(block: Blockly.Block): string {
        const id = this.getVariableId(block);
        const ws = block.workspace;
        const variable = ws.getVariableById(id);
        return variable ? (variable as any).name : id;
    }

    // Compile a value input block into a runtime string/number function
    private compileStringValue(block: Blockly.Block, inputName: string): () => string {
        const input = block.getInput(inputName);
        // If no input connection or target, try to get field value (for backward compat or direct fields)
        if (!input || !input.connection || !input.connection.targetBlock()) {
            return () => String(block.getFieldValue(inputName) || '');
        }

        const valueBlock = input.connection.targetBlock();
        if (!valueBlock) return () => '';

        switch (valueBlock.type) {
            case 'text':
                return () => String(valueBlock.getFieldValue('TEXT'));
            case 'math_number':
                return () => String(valueBlock.getFieldValue('NUM'));
            case 'variables_get': {
                const id = valueBlock.getFieldValue('VAR');
                const ws = valueBlock.workspace;
                const variable = ws.getVariableById(id);
                const name = variable ? (variable as any).name : id;
                return () => String(animationVM.getVariable(name));
            }
            case 'operator_join': {
                const val1 = this.compileStringValue(valueBlock, 'STRING1');
                const val2 = this.compileStringValue(valueBlock, 'STRING2');
                return () => String(val1()) + String(val2());
            }
            case 'data_listcontents': {
                const list = this.getVariableName(valueBlock);
                return () => animationVM.getListContents(list);
            }
            case 'data_tablecontents': {
                const table = this.getVariableName(valueBlock);
                // For tablecontents, we'll return a string representation for now
                return () => JSON.stringify(animationVM.getTable(table));
            }
            case 'data_getvalueattable': {
                const table = this.getVariableName(valueBlock);
                const colFunc = this.compileStringValue(valueBlock, 'COLUMN');
                const rowFunc = this.compileNumberValue(valueBlock, 'ROW');
                return () => {
                    const col = colFunc();
                    const row = rowFunc();
                    // col could be a name or a number string
                    const colNum = Number(col);
                    return String(animationVM.getValueAtTable(table, isNaN(colNum) ? col : colNum, row));
                };
            }
            case 'data_gettablecount': {
                const table = this.getVariableName(valueBlock);
                const type = valueBlock.getFieldValue('TYPE') as 'row' | 'column';
                return () => String(animationVM.getTableCount(table, type));
            }
            case 'data_gettimestamp': {
                return () => new Date().toLocaleString();
            }
            case 'data_itemoflist': {
                const list = this.getVariableName(valueBlock);
                const idxFunc = this.compileNumberValue(valueBlock, 'INDEX');
                return () => animationVM.getListItem(list, idxFunc());
            }
            case 'operator_letter_of': {
                const letterFunc = () => Number(valueBlock.getFieldValue('LETTER'));
                const stringFunc = () => String(valueBlock.getFieldValue('STRING'));
                return () => {
                    const idx = Math.floor(letterFunc());
                    const str = stringFunc();
                    return idx > 0 && idx <= str.length ? str[idx - 1] : '';
                };
            }
            case 'looks_costume_name': {
                const sprite = animationVM.getSprite(this.spriteId);
                return () => {
                    if (!sprite || !sprite.currentCostume) return '';
                    return sprite.currentCostume.name;
                };
            }
            case 'looks_backdrop_name': {
                return () => {
                    const backdrop = stageManager.currentBackdrop;
                    return backdrop ? backdrop.name : '';
                };
            }
            default: {
                // Try compileNumberValue as fallback, convert to string
                const numFunc = this.compileNumberValue(block, inputName);
                return () => String(numFunc());
            }
        }
    }

    // Compile a value input block into a runtime number function
    private compileNumberValue(block: Blockly.Block, inputName: string): () => number {
        const input = block.getInput(inputName);
        if (!input || !input.connection) return () => 0;

        const valueBlock = input.connection.targetBlock();
        if (!valueBlock) return () => 0;

        switch (valueBlock.type) {
            case 'math_number':
                return () => Number(valueBlock.getFieldValue('NUM'));
            case 'sensing_mouse_x':
                return () => animationVM.getMouseX();
            case 'sensing_mouse_y':
                return () => animationVM.getMouseY();
            case 'motion_x_position': {
                const sprite = animationVM.getSprite(this.spriteId);
                return () => sprite?.x ?? 0;
            }
            case 'motion_y_position': {
                const sprite = animationVM.getSprite(this.spriteId);
                return () => sprite?.y ?? 0;
            }
            case 'motion_direction': {
                const sprite = animationVM.getSprite(this.spriteId);
                return () => sprite?.direction ?? 90;
            }
            case 'looks_size': {
                const sprite = animationVM.getSprite(this.spriteId);
                return () => sprite?.size ?? 100;
            }
            case 'looks_costume_number': {
                const sprite = animationVM.getSprite(this.spriteId);
                return () => {
                    if (!sprite || !sprite.costumes || sprite.costumes.length === 0) return 0;
                    return sprite.currentCostumeIndex + 1; // 1-based index
                };
            }
            case 'looks_backdrop_number': {
                // Access stageManager to get current backdrop index
                const stageMgr = stageManager; // capture reference
                return () => {
                    const current = stageMgr.currentBackdrop;
                    if (!current) return 0;
                    // Since stageManager doesn't expose index directly, we need to compute from array
                    const all = stageMgr.getAllBackdrops();
                    const idx = all.findIndex(b => b.name === current.name);
                    return idx >= 0 ? idx + 1 : 1; // 1-based
                };
            }
            case 'sensing_distance_to': {
                const target = valueBlock.getFieldValue('OBJECT');
                return () => animationVM.getDistanceTo(target, this.spriteId);
            }
            case 'sensing_timer':
                return () => animationVM.getTimer();
            case 'sensing_loudness':
                return () => animationVM.getLoudness();
            case 'sensing_days_since_2000':
                return () => animationVM.getDaysSince2000();
            case 'sensing_current': {
                const unit = valueBlock.getFieldValue('CURRENTMENU');
                return () => animationVM.getCurrentTime(unit);
            }
            case 'arduino_ultrasonic': {
                const trig = valueBlock.getFieldValue('TRIG');
                const echo = valueBlock.getFieldValue('ECHO');
                return () => {
                    const distance = hardwareAdapter.getUltrasonicSync(trig, echo);
                    return distance;
                };
            }
            case 'variables_get': {
                // Important: We need to get variable name by ID since that's how Blockly stores it
                const id = valueBlock.getFieldValue('VAR');
                const ws = valueBlock.workspace;
                const variable = ws.getVariableById(id);
                const name = variable ? (variable as any).name : id;
                return () => Number(animationVM.getVariable(name)); // compileNumberValue forces return number
            }
            case 'operator_length': {
                const stringFunc = () => String(valueBlock.getFieldValue('STRING'));
                return () => stringFunc().length;
            }
            case 'data_lengthoflist': {
                const list = this.getVariableName(valueBlock);
                return () => animationVM.getListLength(list);
            }
            case 'data_itemnumoflist': {
                const list = this.getVariableName(valueBlock);
                const itemFunc = this.compileStringValue(valueBlock, 'ITEM');
                return () => animationVM.getListItemNum(list, itemFunc());
            }
            case 'sensing_of': {
                const property = valueBlock.getFieldValue('PROPERTY');
                const object = valueBlock.getFieldValue('OBJECT');
                return () => {
                    if (object === '_stage_') {
                        // Stage properties
                        if (property === 'backdrop #') return stageManager.getAllBackdrops().findIndex(b => b.name === stageManager.currentBackdrop?.name) + 1;
                        if (property === 'backdrop name') return 0; // Name is string, will be handled by compileStringValue
                        if (property === 'volume') return 100;
                        return 0;
                    }
                    const target = animationVM.getSprite(object);
                    if (!target) return 0;
                    if (property === 'x position') return target.x;
                    if (property === 'y position') return target.y;
                    if (property === 'direction') return target.direction;
                    if (property === 'costume #') return target.currentCostumeIndex + 1;
                    if (property === 'size') return target.size;
                    if (property === 'volume') return 100;
                    return 0;
                };
            }
            default:
                compilerLog.warn(`Unknown value block: ${valueBlock.type}`);
                return () => 0;
        }
    }

    compile(workspace: Blockly.Workspace): CompiledScript[] {
        const scripts: CompiledScript[] = [];
        const topBlocks = workspace.getTopBlocks(true);

        compilerLog.info('═══════════════════════════════════════════════════════');
        compilerLog.info(`Compiling workspace for sprite: ${this.spriteId}`);
        compilerLog.info(`Found ${topBlocks.length} top-level blocks`);

        for (const block of topBlocks) {
            compilerLog.block(block.type, 'processing...');
            const script = this.compileTopBlock(block);
            if (script) {
                compilerLog.info(`  ✓ Compiled: trigger=${script.trigger}, steps=${script.steps.length}`);
                script.steps.forEach((step, i) => {
                    compilerLog.info(`    Step ${i + 1}: ${step.type}`);
                });
                scripts.push(script);
            } else {
                compilerLog.info(`  ✗ Skipped (not an event block)`);
            }
        }

        compilerLog.info(`Total compiled scripts: ${scripts.length}`);
        compilerLog.info('═══════════════════════════════════════════════════════');

        return scripts;
    }

    private compileTopBlock(block: Blockly.Block): CompiledScript | null {
        let trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'procedure';
        let triggerKey: string | undefined;

        compilerLog.block(block.type, 'checking trigger type...');

        switch (block.type) {
            case 'event_flag_clicked':
            case 'arduino_setup':
                trigger = 'flag';
                compilerLog.info(`  Trigger: flag (green flag or arduino setup)`);
                break;
            case 'event_sprite_clicked':
            case 'event_stage_clicked':
                trigger = 'sprite_click';
                compilerLog.info(`  Trigger: sprite_click (sprite or stage)`);
                break;
            case 'event_key_pressed':
                trigger = 'key';
                triggerKey = block.getFieldValue('KEY');
                compilerLog.info(`  Trigger: key (${triggerKey})`);
                break;
            case 'event_receive':
                trigger = 'broadcast_receive';
                triggerKey = block.getFieldValue('MESSAGE');
                compilerLog.info(`  Trigger: broadcast receive (${triggerKey})`);
                break;
            case 'event_clone_start':
                trigger = 'clone';
                compilerLog.info(`  Trigger: clone start`);
                break;
            case 'event_backdrop_switch':
                trigger = 'backdrop_switch';
                triggerKey = block.getFieldValue('BACKDROP');
                compilerLog.info(`  Trigger: backdrop switch (${triggerKey})`);
                break;
            case 'event_greater_than':
                trigger = 'greater_than';
                triggerKey = block.getFieldValue('SENSOR') + ':' + block.getFieldValue('VALUE');
                compilerLog.info(`  Trigger: greater than (${triggerKey})`);
                break;
            case 'procedures_defnoreturn':
                trigger = 'procedure';
                triggerKey = block.getFieldValue('NAME');
                compilerLog.info(`  Trigger: custom procedure (${triggerKey})`);
                break;
            default:
                compilerLog.info(`  Not an event block, returning null`);
                return null; // Not an event block
        }

        const steps: ScriptStep[] = [];
        let nextBlock = block.getNextBlock();
        while (nextBlock) {
            const step = this.compileBlock(nextBlock);
            if (step) steps.push(step);
            nextBlock = nextBlock.getNextBlock();
        }

        return { trigger, triggerKey, spriteId: this.spriteId, steps };
    }

    private compileBlock(block: Blockly.Block): ScriptStep | null {
        let step: ScriptStep | null = null;
        switch (block.type) {
            // Motion
            case 'motion_move_steps':
                step = { type: 'move_steps', steps: Number(block.getFieldValue('STEPS')) };
                break;
            case 'motion_move_left':
                step = { type: 'change_x', dx: -Math.abs(Number(block.getFieldValue('STEPS'))) };
                break;
            case 'motion_move_up':
                step = { type: 'change_y', dy: Math.abs(Number(block.getFieldValue('STEPS'))) };
                break;
            case 'motion_move_down':
                step = { type: 'change_y', dy: -Math.abs(Number(block.getFieldValue('STEPS'))) };
                break;
            case 'motion_turn_right':
                step = { type: 'turn_right', degrees: Number(block.getFieldValue('DEGREES')) };
                break;
            case 'motion_turn_left':
                step = { type: 'turn_left', degrees: Number(block.getFieldValue('DEGREES')) };
                break;
            case 'motion_go_to_xy':
                step = { type: 'go_to_xy', x: Number(block.getFieldValue('X')), y: Number(block.getFieldValue('Y')) };
                break;
            case 'motion_glide_to_xy':
                step = { type: 'glide_to_xy', secs: Number(block.getFieldValue('SECS')), x: Number(block.getFieldValue('X')), y: Number(block.getFieldValue('Y')) };
                break;
            case 'motion_point_direction':
                step = { type: 'point_direction', direction: Number(block.getFieldValue('DIRECTION')) };
                break;
            case 'motion_change_x':
                step = { type: 'change_x', dx: Number(block.getFieldValue('DX')) };
                break;
            case 'motion_change_y':
                step = { type: 'change_y', dy: Number(block.getFieldValue('DY')) };
                break;
            case 'motion_set_x':
                step = { type: 'set_x', x: Number(block.getFieldValue('X')) };
                break;
            case 'motion_set_y':
                step = { type: 'set_y', y: Number(block.getFieldValue('Y')) };
                break;
            // New PictoBlox motion blocks
            case 'motion_go_to':
                step = { type: 'go_to', target: block.getFieldValue('TO') as 'random' | 'mouse' | string };
                break;
            case 'motion_glide_to':
                step = { type: 'glide_to', secs: Number(block.getFieldValue('SECS')), target: block.getFieldValue('TO') as 'random' | 'mouse' | string };
                break;
            case 'motion_point_towards':
                step = { type: 'point_towards', towards: block.getFieldValue('TOWARDS') as 'mouse' | 'random' | string };
                break;
            case 'motion_if_on_edge_bounce':
                step = { type: 'if_on_edge_bounce' };
                break;
            case 'motion_set_rotation_style':
                step = { type: 'set_rotation_style', style: block.getFieldValue('STYLE') as 'left-right' | 'all around' | 'none' };
                break;

            // Looks
            case 'looks_say':
                step = { type: 'say', message: String(block.getFieldValue('MESSAGE') || block.getFieldValue('MSG') || '') };
                break;
            case 'looks_say_for_secs':
                step = { type: 'say_for_secs', message: String(block.getFieldValue('MESSAGE') || block.getFieldValue('MSG') || ''), secs: Number(block.getFieldValue('SECS')) };
                break;
            case 'looks_show':
                step = { type: 'show' };
                break;
            case 'looks_hide':
                step = { type: 'hide' };
                break;
            case 'looks_next_costume':
                step = { type: 'next_costume' };
                break;
            case 'looks_set_size':
                step = { type: 'set_size', size: Number(block.getFieldValue('SIZE')) };
                break;
            case 'looks_change_size':
                step = { type: 'change_size', change: Number(block.getFieldValue('CHANGE')) };
                break;
            case 'looks_set_effect':
                step = { type: 'set_effect', effect: block.getFieldValue('EFFECT') as 'ghost' | 'brightness', value: Number(block.getFieldValue('VALUE')) };
                break;
            case 'looks_clear_effects':
                step = { type: 'clear_effects' };
                break;
            case 'looks_change_effect':
                step = { type: 'change_effect', effect: block.getFieldValue('EFFECT'), change: Number(block.getFieldValue('CHANGE')) };
                break;
            // New Looks blocks
            case 'looks_think':
                step = { type: 'think', message: String(block.getFieldValue('MESSAGE') || block.getFieldValue('MSG') || '') };
                break;
            case 'looks_think_for_secs':
                step = { type: 'think_for_secs', message: String(block.getFieldValue('MESSAGE') || block.getFieldValue('MSG') || ''), secs: Number(block.getFieldValue('SECS')) };
                break;
            case 'looks_switch_costume':
                step = { type: 'switch_costume', costume: block.getFieldValue('COSTUME') };
                break;
            case 'looks_switch_backdrop':
                step = { type: 'switch_backdrop', backdrop: block.getFieldValue('BACKDROP') };
                break;
            case 'looks_next_backdrop':
                step = { type: 'next_backdrop' };
                break;
            case 'looks_go_to_layer':
                step = { type: 'go_to_layer', layer: block.getFieldValue('LAYER') as 'front' | 'back' };
                break;
            case 'looks_go_forward_layers':
                step = { type: 'go_forward_layers', direction: block.getFieldValue('DIRECTION') as 'forward' | 'backward', layers: Number(block.getFieldValue('LAYERS')) };
                break;

            // Control & Arduino Control
            case 'control_wait':
            case 'arduino_delay':
                step = { type: 'wait', secs: Number(block.getFieldValue('SECS')) };
                break;
            case 'control_repeat':
            case 'arduino_repeat':
                step = { type: 'repeat', times: Number(block.getFieldValue('TIMES')), body: this.compileStatementInput(block, 'DO') };
                break;
            case 'control_forever':
            case 'arduino_loop':
                step = { type: 'forever', body: this.compileStatementInput(block, 'DO') };
                break;
            case 'control_if':
            case 'arduino_if':
                step = { type: 'if', condition: this.compileCondition(block, 'CONDITION'), body: this.compileStatementInput(block, 'DO') };
                break;
            case 'control_if_else':
            case 'arduino_if_else':
                step = { type: 'if_else', condition: this.compileCondition(block, 'CONDITION'), body: this.compileStatementInput(block, 'DO'), elseBody: this.compileStatementInput(block, 'ELSE') };
                break;
            case 'control_wait_until':
            case 'arduino_wait_until':
                step = { type: 'wait_until', condition: this.compileCondition(block, 'CONDITION') };
                break;
            case 'control_repeat_until':
            case 'arduino_repeat_until':
                step = { type: 'repeat_until', condition: this.compileCondition(block, 'CONDITION'), body: this.compileStatementInput(block, 'DO') };
                break;
            case 'control_stop':
            case 'arduino_stop': {
                const stopOption = block.getFieldValue('STOP_OPTION') || block.getFieldValue('MODE');
                if (stopOption === 'this script' || stopOption === 'this') {
                    step = { type: 'stop_this_script' };
                } else {
                    step = { type: 'stop_all' };
                }
                break;
            }
            case 'control_create_clone':
                step = { type: 'create_clone', target: block.getFieldValue('CLONE_OPTION') };
                break;
            case 'control_delete_clone':
                step = { type: 'delete_clone' };
                break;

            // Events - broadcast
            case 'event_broadcast':
                step = { type: 'broadcast', message: block.getFieldValue('MESSAGE') };
                break;
            case 'event_broadcast_wait':
                step = { type: 'broadcast_wait', message: block.getFieldValue('MESSAGE') };
                break;

            // Sound
            case 'sound_play':
                step = { type: 'play_sound', sound: block.getFieldValue('SOUND') };
                break;
            case 'sound_play_until_done':
                step = { type: 'play_sound_until_done', sound: block.getFieldValue('SOUND') };
                break;
            case 'sound_stop_all':
                step = { type: 'stop_all_sounds' };
                break;
            case 'sound_set_volume':
                step = { type: 'set_volume', volume: Number(block.getFieldValue('VOLUME')) };
                break;
            case 'sound_change_volume':
                step = { type: 'change_volume', change: Number(block.getFieldValue('VOLUME')) };
                break;
            case 'sound_set_effect':
                step = {
                    type: 'set_sound_effect',
                    effect: block.getFieldValue('EFFECT') as 'pitch' | 'pan',
                    value: Number(block.getFieldValue('VALUE'))
                };
                break;
            case 'sound_change_effect':
                step = {
                    type: 'change_sound_effect',
                    effect: block.getFieldValue('EFFECT') as 'pitch' | 'pan',
                    value: Number(block.getFieldValue('VALUE'))
                };
                break;
            case 'sound_clear_effects':
                step = { type: 'clear_sound_effects' };
                break;

            // Pen blocks
            case 'pen_clear':
                step = { type: 'pen_clear' };
                break;
            case 'pen_stamp':
                step = { type: 'pen_stamp' };
                break;
            case 'pen_penDown':
                step = { type: 'pen_penDown' };
                break;
            case 'pen_penUp':
                step = { type: 'pen_penUp' };
                break;
            case 'pen_setPenColorToColor':
                step = { type: 'pen_setPenColorToColor', color: block.getFieldValue('COLOR') };
                break;
            case 'pen_changePenSizeBy':
                step = { type: 'pen_changePenSizeBy', size: Number(block.getFieldValue('SIZE')) };
                break;
            case 'pen_setPenSizeTo':
                step = { type: 'pen_setPenSizeTo', size: Number(block.getFieldValue('SIZE')) };
                break;
            case 'pen_changePenColorParamBy':
                step = { type: 'pen_changePenColorParamBy', param: block.getFieldValue('PARAM'), change: Number(block.getFieldValue('CHANGE')) };
                break;
            case 'pen_setPenColorParamTo':
                step = { type: 'pen_setPenColorParamTo', param: block.getFieldValue('PARAM'), value: Number(block.getFieldValue('VALUE')) };
                break;

            // Sensing
            case 'ask':
            case 'sensing_ask':
                step = { type: 'ask', question: block.getFieldValue('QUESTION') };
                break;
            case 'sensing_reset_timer':
                step = { type: 'reset_timer' };
                break;
            
            // Procedures
            case 'procedures_callnoreturn': {
                // Determine procedure name
                const proccode = block.getFieldValue('NAME') || (block as any).getMutation?.name || 'unknown';
                step = { type: 'procedures_call', proccode };
                break;
            }

            // Hardware blocks & Arduino Blocks
            case 'hw_set_digital':
            case 'arduino_digital_write':
            case 'arduino_relay':
                step = {
                    type: 'hw_set_digital',
                    pin: block.getFieldValue('PIN'),
                    value: (block.getFieldValue('VALUE') === '1' || block.getFieldValue('VALUE') === 'HIGH' || block.getFieldValue('STATE') === 'HIGH')
                };
                break;
            case 'hw_set_led':
                step = { type: 'hw_set_led', on: block.getFieldValue('STATE') === '1' };
                break;
            case 'arduino_led':
                step = { type: 'hw_set_pwm', pin: block.getFieldValue('PIN'), value: Number(block.getFieldValue('BRIGHTNESS')) };
                break;
            case 'hw_set_pwm':
            case 'arduino_analog_write':
                step = { type: 'hw_set_pwm', pin: block.getFieldValue('PIN'), value: Number(block.getFieldValue('VALUE')) };
                break;
            case 'hw_set_servo':
            case 'arduino_servo':
                step = { type: 'hw_set_servo', pin: block.getFieldValue('PIN'), angle: Number(block.getFieldValue('ANGLE')) };
                break;
            case 'hw_set_motor':
            case 'arduino_motor': {
                const motor = block.getFieldValue('MOTOR');
                const motorId = motor === 'A' ? 1 : (motor === 'B' ? 2 : Number(motor));
                const dir = block.getFieldValue('DIR') || 'forward';
                const speedVal = Number(block.getFieldValue('SPEED') || block.getFieldValue('VALUE') || 255);
                let speed = speedVal;
                if (dir === 'backward') speed = -speedVal;
                else if (dir === 'stop') speed = 0;
                step = { type: 'hw_set_motor', motor: motorId, speed };
                break;
            }
            case 'hw_stop_motors':
                step = { type: 'hw_stop_motors' };
                break;
            case 'hw_play_tone':
            case 'arduino_tone':
                step = {
                    type: 'hw_play_tone',
                    pin: block.getFieldValue('PIN'),
                    freq: Number(block.getFieldValue('FREQ')),
                    duration: Number(block.getFieldValue('DURATION') || 0) || 500 // Default 500ms if not specified
                };
                break;
            case 'hw_stop_tone':
            case 'arduino_notone':
                step = { type: 'hw_stop_tone', pin: block.getFieldValue('PIN') };
                break;


            // Variable blocks
            case 'data_setvariableto':
                step = {
                    type: 'data_setvariableto',
                    variable: this.getVariableName(block),
                    value: this.compileStringValue(block, 'VALUE') // Assume string for now to support both numbers and strings
                };
                break;
            case 'data_changevariableby':
                step = {
                    type: 'data_changevariableby',
                    variable: this.getVariableName(block),
                    value: this.compileNumberValue(block, 'VALUE')
                };
                break;
            case 'data_showvariable':
                step = { type: 'data_showvariable', variable: this.getVariableName(block) };
                break;
            case 'data_hidevariable':
                step = { type: 'data_hidevariable', variable: this.getVariableName(block) };
                break;

            // List blocks
            case 'data_addtolist':
                step = {
                    type: 'list_add',
                    list: this.getVariableName(block),
                    item: this.compileStringValue(block, 'ITEM')
                };
                break;
            case 'data_deleteoflist':
                step = {
                    type: 'list_delete',
                    list: this.getVariableName(block),
                    index: this.compileNumberValue(block, 'INDEX')
                };
                break;
            case 'data_deletealloflist':
                step = { type: 'list_delete_all', list: this.getVariableName(block) };
                break;
            case 'data_insertatlist':
                step = {
                    type: 'list_insert',
                    list: this.getVariableName(block),
                    index: this.compileNumberValue(block, 'INDEX'),
                    item: this.compileStringValue(block, 'ITEM')
                };
                break;
            case 'data_replaceitemoflist':
                step = {
                    type: 'list_replace',
                    list: this.getVariableName(block),
                    index: this.compileNumberValue(block, 'INDEX'),
                    item: this.compileStringValue(block, 'ITEM')
                };
                break;
            case 'data_showlist':
                step = { type: 'list_show', list: this.getVariableName(block) };
                break;
            case 'data_hidelist':
                step = { type: 'list_hide', list: this.getVariableName(block) };
                break;

            // Table blocks
            case 'data_setintable':
                step = {
                    type: 'table_set',
                    table: this.getVariableName(block),
                    col: this.compileStringValue(block, 'COLUMN'),
                    row: this.compileNumberValue(block, 'ROW'),
                    value: this.compileStringValue(block, 'VALUE')
                };
                break;
            case 'data_addcolumn':
                step = {
                    type: 'table_add_column',
                    table: this.getVariableName(block),
                    col: this.compileStringValue(block, 'COLUMN')
                };
                break;
            case 'data_deletecolumn':
                step = {
                    type: 'table_delete_column',
                    table: this.getVariableName(block),
                    col: this.compileStringValue(block, 'COLUMN')
                };
                break;
            case 'data_showtable':
                step = {
                    type: 'table_show',
                    table: this.getVariableName(block),
                    format: block.getFieldValue('FORMAT')
                };
                break;
            case 'data_hidetable':
                step = {
                    type: 'table_hide',
                    table: this.getVariableName(block)
                };
                break;
            case 'data_deleterow':
                step = {
                    type: 'table_delete_row',
                    table: this.getVariableName(block),
                    row: this.compileNumberValue(block, 'ROW')
                };
                break;
            case 'data_cleartable':
                step = {
                    type: 'table_clear',
                    table: this.getVariableName(block)
                };
                break;
            case 'data_exporttable':
                step = {
                    type: 'table_export',
                    table: this.getVariableName(block)
                };
                break;

            default:
                compilerLog.warn(`Unknown statement block: ${block.type}`);
                step = null; // Ensure step is null for unknown blocks
                break;
        }

        if (step) {
            step.blockId = block.id;
        }

        return step;
    }

    private compileStatementInput(block: Blockly.Block, inputName: string): ScriptStep[] {
        const steps: ScriptStep[] = [];
        const input = block.getInput(inputName);
        if (!input) return steps;

        let innerBlock = input.connection?.targetBlock();
        while (innerBlock) {
            const step = this.compileBlock(innerBlock);
            if (step) steps.push(step);
            innerBlock = innerBlock.getNextBlock();
        }

        return steps;
    }

    public compileStack(block: Blockly.Block): CompiledScript | null {
        // Find the top-most block of this stack
        let root = block;
        while (root.getPreviousBlock()) {
            root = root.getPreviousBlock()!;
        }

        // If it's a hat block, use the normal compile logic
        const script = this.compileTopBlock(root);
        if (script) return script;

        // If it's not a hat block, compile the stack starting from root
        const steps: ScriptStep[] = [];
        let curr: Blockly.Block | null = root;
        while (curr) {
            const step = this.compileBlock(curr);
            if (step) steps.push(step);
            curr = curr.getNextBlock();
        }

        if (steps.length === 0) return null;
        return { trigger: 'flag', spriteId: this.spriteId, steps };
    }
}
