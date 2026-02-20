import * as Blockly from 'blockly';
import { CompiledScript, ScriptStep } from '../vm/AnimationVM';
import { animationVM } from '../vm/AnimationVM';

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
                // Simple assumption: first costume is 1, etc.
                // A real implementation would need to look up index
                return () => 1;
            }
            case 'looks_backdrop_number': {
                // TODO: Implement
                return () => 1;
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
        let trigger: 'flag' | 'sprite_click' | 'key';
        let triggerKey: string | undefined;

        compilerLog.block(block.type, 'checking trigger type...');

        switch (block.type) {
            case 'event_flag_clicked':
            case 'arduino_setup':
                trigger = 'flag';
                compilerLog.info(`  Trigger: flag (green flag or arduino setup)`);
                break;
            case 'event_sprite_clicked':
                trigger = 'sprite_click';
                compilerLog.info(`  Trigger: sprite_click`);
                break;
            case 'event_key_pressed':
                trigger = 'key';
                triggerKey = block.getFieldValue('KEY');
                compilerLog.info(`  Trigger: key (${triggerKey})`);
                break;
            case 'event_receive':
                // TODO: Add 'broadcast' trigger type to CompiledScript
                compilerLog.info(`  Trigger: broadcast receive (TODO)`);
                return null;
            case 'event_clone_start':
                // TODO: Add 'clone' trigger type
                compilerLog.info(`  Trigger: clone start (TODO)`);
                return null;
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
        switch (block.type) {
            // Motion
            case 'motion_move_steps':
                return { type: 'move_steps', steps: Number(block.getFieldValue('STEPS')) };
            case 'motion_turn_right':
                return { type: 'turn_right', degrees: Number(block.getFieldValue('DEGREES')) };
            case 'motion_turn_left':
                return { type: 'turn_left', degrees: Number(block.getFieldValue('DEGREES')) };
            case 'motion_go_to_xy':
                return { type: 'go_to_xy', x: Number(block.getFieldValue('X')), y: Number(block.getFieldValue('Y')) };
            case 'motion_glide_to_xy':
                return { type: 'glide_to_xy', secs: Number(block.getFieldValue('SECS')), x: Number(block.getFieldValue('X')), y: Number(block.getFieldValue('Y')) };
            case 'motion_point_direction':
                return { type: 'point_direction', direction: Number(block.getFieldValue('DIRECTION')) };
            case 'motion_change_x':
                return { type: 'change_x', dx: Number(block.getFieldValue('DX')) };
            case 'motion_change_y':
                return { type: 'change_y', dy: Number(block.getFieldValue('DY')) };
            case 'motion_set_x':
                return { type: 'set_x', x: Number(block.getFieldValue('X')) };
            case 'motion_set_y':
                return { type: 'set_y', y: Number(block.getFieldValue('Y')) };
            // New PictoBlox motion blocks
            case 'motion_go_to':
                return { type: 'go_to', target: block.getFieldValue('TO') as 'random' | 'mouse' };
            case 'motion_glide_to':
                return { type: 'glide_to', secs: Number(block.getFieldValue('SECS')), target: block.getFieldValue('TO') as 'random' | 'mouse' };
            case 'motion_point_towards':
                return { type: 'point_towards', towards: block.getFieldValue('TOWARDS') as 'mouse' | 'random' };
            case 'motion_if_on_edge_bounce':
                return { type: 'if_on_edge_bounce' };
            case 'motion_set_rotation_style':
                return { type: 'set_rotation_style', style: block.getFieldValue('STYLE') as 'left-right' | 'all around' | 'none' };

            // Looks
            case 'looks_say':
                return { type: 'say', message: this.compileStringValue(block, 'MESSAGE') };
            case 'looks_say_for_secs':
                return { type: 'say_for_secs', message: this.compileStringValue(block, 'MESSAGE'), secs: Number(block.getFieldValue('SECS')) };
            case 'looks_show':
                return { type: 'show' };
            case 'looks_hide':
                return { type: 'hide' };
            case 'looks_next_costume':
                return { type: 'next_costume' };
            case 'looks_set_size':
                return { type: 'set_size', size: Number(block.getFieldValue('SIZE')) };
            case 'looks_change_size':
                return { type: 'change_size', change: Number(block.getFieldValue('CHANGE')) };
            case 'looks_set_effect':
                return { type: 'set_effect', effect: block.getFieldValue('EFFECT') as 'ghost' | 'brightness', value: Number(block.getFieldValue('VALUE')) };
            case 'looks_clear_effects':
                return { type: 'clear_effects' };
            // New Looks blocks
            case 'looks_think':
                return { type: 'think', message: this.compileStringValue(block, 'MESSAGE') };
            case 'looks_think_for_secs':
                return { type: 'think_for_secs', message: this.compileStringValue(block, 'MESSAGE'), secs: Number(block.getFieldValue('SECS')) };
            case 'looks_switch_costume':
                return { type: 'switch_costume', costume: block.getFieldValue('COSTUME') };
            case 'looks_switch_backdrop':
                return { type: 'switch_backdrop', backdrop: block.getFieldValue('BACKDROP') };
            case 'looks_next_backdrop':
                return { type: 'next_backdrop' };
            case 'looks_go_to_layer':
                return { type: 'go_to_layer', layer: block.getFieldValue('LAYER') as 'front' | 'back' };
            case 'looks_go_forward_layers':
                return { type: 'go_forward_layers', direction: block.getFieldValue('DIRECTION') as 'forward' | 'backward', layers: Number(block.getFieldValue('LAYERS')) };

            // Control & Arduino Control
            case 'control_wait':
            case 'arduino_delay':
                return { type: 'wait', secs: Number(block.getFieldValue('SECS')) };
            case 'control_repeat':
            case 'arduino_repeat':
                return { type: 'repeat', times: Number(block.getFieldValue('TIMES')), body: this.compileStatementInput(block, 'DO') };
            case 'control_forever':
            case 'arduino_loop':
                return { type: 'forever', body: this.compileStatementInput(block, 'DO') };
            case 'control_if':
            case 'arduino_if':
                return { type: 'if', condition: this.compileCondition(block, 'CONDITION'), body: this.compileStatementInput(block, 'DO') };
            case 'control_if_else':
            case 'arduino_if_else':
                return { type: 'if_else', condition: this.compileCondition(block, 'CONDITION'), body: this.compileStatementInput(block, 'DO'), elseBody: this.compileStatementInput(block, 'ELSE') };
            case 'control_wait_until':
            case 'arduino_wait_until':
                return { type: 'wait_until', condition: this.compileCondition(block, 'CONDITION') };
            case 'control_repeat_until':
            case 'arduino_repeat_until':
                return { type: 'repeat_until', condition: this.compileCondition(block, 'CONDITION'), body: this.compileStatementInput(block, 'DO') };
            case 'control_stop':
            case 'arduino_stop': {
                const stopOption = block.getFieldValue('STOP_OPTION') || block.getFieldValue('MODE');
                if (stopOption === 'this script' || stopOption === 'this') {
                    return { type: 'stop_this_script' };
                }
                return { type: 'stop_all' };
            }
            case 'control_create_clone':
                return { type: 'create_clone', target: block.getFieldValue('CLONE_OPTION') };
            case 'control_delete_clone':
                return { type: 'delete_clone' };

            // Events - broadcast
            case 'event_broadcast':
                return { type: 'broadcast', message: block.getFieldValue('MESSAGE') };
            case 'event_broadcast_wait':
                return { type: 'broadcast_wait', message: block.getFieldValue('MESSAGE') };

            // Sound
            case 'sound_play':
                return { type: 'play_sound', sound: block.getFieldValue('SOUND') };
            case 'sound_play_until_done':
                return { type: 'play_sound_until_done', sound: block.getFieldValue('SOUND') };
            case 'sound_stop_all':
                return { type: 'stop_all_sounds' };
            case 'sound_set_volume':
                return { type: 'set_volume', volume: Number(block.getFieldValue('VOLUME')) };
            case 'sound_change_volume':
                return { type: 'change_volume', change: Number(block.getFieldValue('VOLUME')) };
            case 'sound_set_effect':
                return {
                    type: 'set_sound_effect',
                    effect: block.getFieldValue('EFFECT') as 'pitch' | 'pan',
                    value: Number(block.getFieldValue('VALUE'))
                };
            case 'sound_change_effect':
                return {
                    type: 'change_sound_effect',
                    effect: block.getFieldValue('EFFECT') as 'pitch' | 'pan',
                    value: Number(block.getFieldValue('VALUE'))
                };
            case 'sound_clear_effects':
                return { type: 'clear_sound_effects' };

            // Sensing
            case 'ask':
                return { type: 'ask', question: block.getFieldValue('QUESTION') };
            case 'sensing_reset_timer':
                return { type: 'reset_timer' };

            // Hardware blocks & Arduino Blocks
            case 'hw_set_digital':
            case 'arduino_digital_write':
            case 'arduino_relay':
                return {
                    type: 'hw_set_digital',
                    pin: block.getFieldValue('PIN'),
                    value: (block.getFieldValue('VALUE') === '1' || block.getFieldValue('VALUE') === 'HIGH' || block.getFieldValue('STATE') === 'HIGH')
                };
            case 'hw_set_led':
                return { type: 'hw_set_led', on: block.getFieldValue('STATE') === '1' };
            case 'arduino_led':
                return { type: 'hw_set_pwm', pin: block.getFieldValue('PIN'), value: Number(block.getFieldValue('BRIGHTNESS')) };
            case 'hw_set_pwm':
            case 'arduino_analog_write':
                return { type: 'hw_set_pwm', pin: block.getFieldValue('PIN'), value: Number(block.getFieldValue('VALUE')) };
            case 'hw_set_servo':
            case 'arduino_servo':
                return { type: 'hw_set_servo', pin: block.getFieldValue('PIN'), angle: Number(block.getFieldValue('ANGLE')) };
            case 'hw_set_motor':
            case 'arduino_motor': {
                const motor = block.getFieldValue('MOTOR');
                const motorId = motor === 'A' ? 1 : (motor === 'B' ? 2 : Number(motor));
                const dir = block.getFieldValue('DIR') || 'forward';
                const speedVal = Number(block.getFieldValue('SPEED') || block.getFieldValue('VALUE') || 255);
                let speed = speedVal;
                if (dir === 'backward') speed = -speedVal;
                else if (dir === 'stop') speed = 0;
                return { type: 'hw_set_motor', motor: motorId, speed };
            }
            case 'hw_stop_motors':
                return { type: 'hw_stop_motors' };
            case 'hw_play_tone':
            case 'arduino_tone':
                return {
                    type: 'hw_play_tone',
                    pin: block.getFieldValue('PIN'),
                    freq: Number(block.getFieldValue('FREQ')),
                    duration: Number(block.getFieldValue('DURATION') || 0) || 500 // Default 500ms if not specified
                };
            case 'hw_stop_tone':
            case 'arduino_notone':
                return { type: 'hw_stop_tone', pin: block.getFieldValue('PIN') };


            // Variable blocks
            case 'data_setvariableto':
                return {
                    type: 'data_setvariableto',
                    variable: this.getVariableName(block),
                    value: this.compileStringValue(block, 'VALUE') // Assume string for now to support both numbers and strings
                };
            case 'data_changevariableby':
                return {
                    type: 'data_changevariableby',
                    variable: this.getVariableName(block),
                    value: this.compileNumberValue(block, 'VALUE')
                };
            case 'data_showvariable':
                return { type: 'data_showvariable', variable: this.getVariableName(block) };
            case 'data_hidevariable':
                return { type: 'data_hidevariable', variable: this.getVariableName(block) };

            // List blocks
            case 'data_addtolist':
                return {
                    type: 'list_add',
                    list: this.getVariableName(block),
                    item: this.compileStringValue(block, 'ITEM')
                };
            case 'data_deleteoflist':
                return {
                    type: 'list_delete',
                    list: this.getVariableName(block),
                    index: this.compileNumberValue(block, 'INDEX')
                };
            case 'data_deletealloflist':
                return { type: 'list_delete_all', list: this.getVariableName(block) };
            case 'data_insertatlist':
                return {
                    type: 'list_insert',
                    list: this.getVariableName(block),
                    index: this.compileNumberValue(block, 'INDEX'),
                    item: this.compileStringValue(block, 'ITEM')
                };
            case 'data_replaceitemoflist':
                return {
                    type: 'list_replace',
                    list: this.getVariableName(block),
                    index: this.compileNumberValue(block, 'INDEX'),
                    item: this.compileStringValue(block, 'ITEM')
                };
            case 'data_showlist':
                return { type: 'list_show', list: this.getVariableName(block) };
            case 'data_hidelist':
                return { type: 'list_hide', list: this.getVariableName(block) };

            default:
                console.warn('[AnimationCompiler] Unknown block type:', block.type);
                return null;
        }
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
}
