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
                return () => false;
            }
            case 'operator_gt': {
                const op1Func = this.compileNumberValue(conditionBlock, 'OPERAND1');
                const op2Func = this.compileNumberValue(conditionBlock, 'OPERAND2');
                return () => op1Func() > op2Func();
            }
            case 'operator_lt': {
                const op1Func = this.compileNumberValue(conditionBlock, 'OPERAND1');
                const op2Func = this.compileNumberValue(conditionBlock, 'OPERAND2');
                return () => op1Func() < op2Func();
            }
            case 'operator_equals': {
                const op1Func = this.compileStringValue(conditionBlock, 'OPERAND1');
                const op2Func = this.compileStringValue(conditionBlock, 'OPERAND2');
                return () => op1Func().toLowerCase() === op2Func().toLowerCase();
            }
            case 'operator_and': {
                const op1Func = this.compileCondition(conditionBlock, 'OPERAND1');
                const op2Func = this.compileCondition(conditionBlock, 'OPERAND2');
                return () => op1Func() && op2Func();
            }
            case 'operator_or': {
                const op1Func = this.compileCondition(conditionBlock, 'OPERAND1');
                const op2Func = this.compileCondition(conditionBlock, 'OPERAND2');
                return () => op1Func() || op2Func();
            }
            case 'operator_not': {
                const opFunc = this.compileCondition(conditionBlock, 'OPERAND');
                return () => !opFunc();
            }
            case 'operator_contains': {
                const str1Func = this.compileStringValue(conditionBlock, 'STRING1');
                const str2Func = this.compileStringValue(conditionBlock, 'STRING2');
                return () => str1Func().toLowerCase().includes(str2Func().toLowerCase());
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
        if (variable) return (variable as any).name;
        
        // Fallback: If ID not found, try to get the human-readable text from the field itself.
        // This is critical if the variable was recreated and the block still points to a ghost ID.
        const field = block.getField('VARIABLE') || block.getField('VAR') || block.getField('LIST');
        const nameFallback = field ? field.getText() : id;
        
        compilerLog.warn(`Variable ID not found in workspace: ${id}. Using display text as name: ${nameFallback}`);
        return nameFallback;
    }

    private compileDynamicValue(block: Blockly.Block, inputName: string): () => number | string {
        const input = block.getInput(inputName);
        if (!input || !input.connection) {
            const fieldVal = block.getFieldValue(inputName);
            if (fieldVal !== null && fieldVal !== undefined) {
                return () => String(fieldVal);
            }
            return () => '';
        }

        const valueBlock = input.connection.targetBlock();
        if (!valueBlock) {
            return () => '';
        }

        switch (valueBlock.type) {
            case 'variables_get':
            case 'data_variable': {
                const name = this.getVariableName(valueBlock);
                return () => animationVM.getVariable(name);
            }
            case 'data_itemoflist': {
                const list = this.getVariableName(valueBlock);
                const idxFunc = this.compileNumberValue(valueBlock, 'INDEX');
                return () => animationVM.getListItem(list, idxFunc());
            }
            default: {
                const outputChecks = valueBlock.outputConnection?.getCheck() || [];
                if (outputChecks.includes('Number')) {
                    const numFunc = this.compileNumberValue(block, inputName);
                    return () => numFunc();
                }

                const strFunc = this.compileStringValue(block, inputName);
                return () => strFunc();
            }
        }
    }

    // Compile a value input block into a runtime string/number function
    private compileStringValue(block: Blockly.Block, inputName: string): () => string {
        const input = block.getInput(inputName);

        // Debug: log input resolution
        console.info(`[Compiler] compileStringValue: block=${block.type}, input=${inputName}`);

        if (!input || !input.connection) {
            // Fallback: check if the name corresponds to a direct field (field_input)
            // e.g. scratchBlocks.ts defines looks_say with field_input named MESSAGE
            const fieldVal = block.getFieldValue(inputName);
            if (fieldVal !== null && fieldVal !== undefined) {
                console.info(`[Compiler] Using field fallback for '${inputName}' on ${block.type}: "${fieldVal}"`);
                return () => {
                    // Re-read at runtime so live edits to the field are reflected
                    const v = block.getFieldValue(inputName);
                    return v !== null && v !== undefined ? String(v) : '';
                };
            }
            console.warn(`[Compiler] No input or connection for ${inputName} on ${block.type} - returning empty`);
            return () => '';
        }

        // In Blockly, targetBlock() returns both real blocks AND shadow blocks
        const valueBlock = input.connection.targetBlock();

        console.info(`[Compiler] targetBlock for ${inputName}: ${valueBlock ? valueBlock.type : 'null'}`, valueBlock);

        if (!valueBlock) {
            // No block connected at all - try direct field fallback
            // NOTE: inputName is an INPUT name, not a FIELD name!
            // For shadow-less inputs we default to empty string
            console.warn(`[Compiler] No targetBlock for input '${inputName}' on block '${block.type}' - falling back to empty`);
            return () => '';
        }

        console.info(`[Compiler] Resolving string from block type: ${valueBlock.type}`);

        switch (valueBlock.type) {
            case 'text':
                return () => {
                    const val = valueBlock.getFieldValue('TEXT');
                    // In headless mode, fields might return null if default/empty
                    if (val === null || val === undefined) return '';
                    return String(val);
                };
            case 'math_number':
                return () => {
                    const val = valueBlock.getFieldValue('NUM');
                    if (val === null || val === undefined) return '0';
                    return String(val);
                };
            case 'variables_get': {
                const name = this.getVariableName(valueBlock);
                return () => String(animationVM.getVariable(name));
            }
            case 'data_variable': {
                const name = this.getVariableName(valueBlock);
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
                const letterFunc = this.compileNumberValue(valueBlock, 'LETTER');
                const stringFunc = this.compileStringValue(valueBlock, 'STRING');
                return () => {
                    const idx = Math.floor(letterFunc());
                    const str = stringFunc();
                    return idx > 0 && idx <= str.length ? str[idx - 1] : '';
                };
            }
            case 'sensing_answer': {
                return () => animationVM.getAnswer();
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
                console.warn(`[Compiler] Unknown string block type: ${valueBlock.type} - trying numFunc fallback`);
                // Try compileNumberValue as fallback, convert to string
                const nf = this.compileNumberValue(block, inputName);
                return () => String(nf());
            }
        }
    }

    // Compile a value input block into a runtime number function
    private compileNumberValue(block: Blockly.Block, inputName: string): () => number {
        const input = block.getInput(inputName);
        if (!input || !input.connection) {
            // Fallback: check if the name corresponds to a direct field (field_number)
            const fieldVal = block.getFieldValue(inputName);
            if (fieldVal !== null && fieldVal !== undefined) {
                const num = Number(fieldVal);
                if (!isNaN(num)) {
                    return () => {
                        const v = block.getFieldValue(inputName);
                        const n = Number(v);
                        return isNaN(n) ? 0 : n;
                    };
                }
            }
            console.warn(`[Compiler] compileNumberValue: No input/connection for '${inputName}' on '${block.type}'`);
            return () => 0;
        }

        const valueBlock = input.connection.targetBlock();

        console.info(`[Compiler] compileNumberValue: block=${block.type}, input=${inputName}, targetBlock=${valueBlock?.type ?? 'null'}`);

        if (!valueBlock) {
            console.warn(`[Compiler] compileNumberValue: No targetBlock for input '${inputName}' on '${block.type}'`);
            return () => 0;
        }

        switch (valueBlock.type) {
            case 'text':
            case 'operator_join':
            case 'data_listcontents':
            case 'data_tablecontents':
            case 'data_getvalueattable':
            case 'data_gettablecount':
            case 'sensing_answer':
            case 'sensing_timer':
            case 'sensing_loudness':
            case 'looks_costume_name':
            case 'looks_backdrop_name': {
                // Delegate to compileStringValue and cast to Number for mathematical evaluation
                const strFunc = this.compileStringValue(block, inputName);
                return () => {
                    const num = Number(strFunc());
                    return isNaN(num) ? 0 : num;
                };
            }
            case 'math_number':
                return () => {
                    const val = valueBlock.getFieldValue('NUM');
                    return val !== null ? Number(val) : 0;
                };
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
            case 'sound_volume': {
                const sprite = animationVM.getSprite(this.spriteId);
                return () => sprite?.volume ?? 100;
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
                const name = this.getVariableName(valueBlock);
                return () => {
                    const val = animationVM.getVariable(name);
                    const num = Number(val);
                    return isNaN(num) ? 0 : num;
                };
            }
            case 'data_variable': {
                const dvName = this.getVariableName(valueBlock);
                return () => {
                    const value = animationVM.getVariable(dvName);
                    const num = Number(value);
                    if (isNaN(num)) {
                        compilerLog.warn(`Variable '${dvName}' is not a number:`, value);
                        return 0;
                    }
                    return num;
                };
            }
            case 'operator_add': {
                const num1Func = this.compileNumberValue(valueBlock, 'NUM1');
                const num2Func = this.compileNumberValue(valueBlock, 'NUM2');
                return () => {
                    const n1 = num1Func();
                    const n2 = num2Func();
                    const result = Number(n1) + Number(n2);
                    compilerLog.info(`Addition: ${n1} + ${n2} = ${result}`);
                    return result;
                };
            }
            case 'operator_subtract': {
                const num1Func = this.compileNumberValue(valueBlock, 'NUM1');
                const num2Func = this.compileNumberValue(valueBlock, 'NUM2');
                return () => num1Func() - num2Func();
            }
            case 'operator_multiply': {
                const num1Func = this.compileNumberValue(valueBlock, 'NUM1');
                const num2Func = this.compileNumberValue(valueBlock, 'NUM2');
                return () => num1Func() * num2Func();
            }
            case 'operator_divide': {
                const num1Func = this.compileNumberValue(valueBlock, 'NUM1');
                const num2Func = this.compileNumberValue(valueBlock, 'NUM2');
                return () => {
                    const divisor = num2Func();
                    return divisor !== 0 ? num1Func() / divisor : 0;
                };
            }
            case 'operator_random': {
                const fromFunc = this.compileNumberValue(valueBlock, 'FROM');
                const toFunc = this.compileNumberValue(valueBlock, 'TO');
                return () => {
                    const from = fromFunc();
                    const to = toFunc();
                    if (Number.isInteger(from) && Number.isInteger(to)) {
                        const min = Math.min(from, to);
                        const max = Math.max(from, to);
                        return Math.floor(Math.random() * (max - min + 1)) + min;
                    } else {
                        const min = Math.min(from, to);
                        const max = Math.max(from, to);
                        return Math.random() * (max - min) + min;
                    }
                };
            }
            case 'operator_mod': {
                const num1Func = this.compileNumberValue(valueBlock, 'NUM1');
                const num2Func = this.compileNumberValue(valueBlock, 'NUM2');
                return () => {
                    const n1 = num1Func();
                    const n2 = num2Func();
                    return n2 !== 0 ? n1 % n2 : 0;
                };
            }
            case 'operator_round': {
                const numFunc = this.compileNumberValue(valueBlock, 'NUM');
                return () => Math.round(numFunc());
            }
            case 'operator_round_to_decimals': {
                const numFunc = this.compileNumberValue(valueBlock, 'NUM');
                // The dropdown might return strings like '1', '2' etc. Get it as number natively if possible, else string
                const decimals = Number(valueBlock.getFieldValue('DECIMALS') || 1);
                return () => {
                    const num = numFunc();
                    const multiplier = Math.pow(10, decimals);
                    return Math.round(num * multiplier) / multiplier;
                };
            }
            case 'operator_mathop': {
                const numFunc = this.compileNumberValue(valueBlock, 'NUM');
                const operator = valueBlock.getFieldValue('OPERATOR');
                return () => {
                    const num = numFunc();
                    switch (operator) {
                        case 'abs': return Math.abs(num);
                        case 'floor': return Math.floor(num);
                        case 'ceiling': return Math.ceil(num);
                        case 'sqrt': return num < 0 ? 0 : Math.sqrt(num);
                        case 'sin': return Math.sin((num * Math.PI) / 180);
                        case 'cos': return Math.cos((num * Math.PI) / 180);
                        case 'tan': return Math.tan((num * Math.PI) / 180);
                        case 'asin': return (Math.asin(num) * 180) / Math.PI;
                        case 'acos': return (Math.acos(num) * 180) / Math.PI;
                        case 'atan': return (Math.atan(num) * 180) / Math.PI;
                        case 'ln': return num <= 0 ? 0 : Math.log(num);
                        case 'log': return num <= 0 ? 0 : Math.log10(num);
                        case 'e ^': return Math.exp(num);
                        case '10 ^': return Math.pow(10, num);
                        default: return num;
                    }
                };
            }
            case 'operator_length': {
                const stringFunc = this.compileStringValue(valueBlock, 'STRING');
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
                    const value = animationVM.getSpriteProperty(object, property);
                    const num = Number(value);
                    return Number.isFinite(num) ? num : 0;
                };
            }
            case 'sensing_answer': {
                return () => {
                    const ans = animationVM.getAnswer();
                    const num = Number(ans);
                    return isNaN(num) ? 0 : num;
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
            // Green flag — support both old internal name and Scratch-standard name
            case 'event_flag_clicked':
            case 'event_whenflagclicked':
            case 'arduino_setup':
                trigger = 'flag';
                compilerLog.info(`  Trigger: flag (green flag or arduino setup)`);
                break;
            // Sprite / stage click — support both naming conventions
            case 'event_sprite_clicked':
            case 'event_whenthisspriteclicked':
            case 'event_stage_clicked':
                trigger = 'sprite_click';
                compilerLog.info(`  Trigger: sprite_click (sprite or stage)`);
                break;
            // Key pressed
            case 'event_key_pressed':
            case 'event_whenkeypressed':
                trigger = 'key';
                triggerKey = block.getFieldValue('KEY') || block.getFieldValue('KEY_OPTION');
                compilerLog.info(`  Trigger: key (${triggerKey})`);
                break;
            // Broadcast receive
            case 'event_receive':
            case 'event_whenbroadcastreceived':
                trigger = 'broadcast_receive';
                triggerKey = block.getFieldValue('MESSAGE') || block.getFieldValue('BROADCAST_OPTION');
                compilerLog.info(`  Trigger: broadcast receive (${triggerKey})`);
                break;
            // Clone start
            case 'event_clone_start':
            case 'control_start_as_clone':
                trigger = 'clone';
                compilerLog.info(`  Trigger: clone start`);
                break;
            // Backdrop switch
            case 'event_backdrop_switch':
            case 'event_whenbackdropswitchesto':
                trigger = 'backdrop_switch';
                triggerKey = block.getFieldValue('BACKDROP');
                compilerLog.info(`  Trigger: backdrop switch (${triggerKey})`);
                break;
            // Greater than
            case 'event_greater_than':
            case 'event_whengreaterthan':
                trigger = 'greater_than';
                triggerKey = (block.getFieldValue('SENSOR') || block.getFieldValue('WHEN')) + ':' + block.getFieldValue('VALUE');
                compilerLog.info(`  Trigger: greater than (${triggerKey})`);
                break;
            case 'procedures_defnoreturn':
                trigger = 'procedure';
                triggerKey = block.getFieldValue('NAME');
                compilerLog.info(`  Trigger: custom procedure (${triggerKey})`);
                break;
            default:
                compilerLog.info(`  Not an event block (type: ${block.type}), returning null`);
                return null; // Not an event block
        }

        const steps: ScriptStep[] = [];
        let nextBlock = block.getNextBlock();
        while (nextBlock) {
            const step = this.compileBlock(nextBlock);
            if (step) steps.push(step);
            nextBlock = nextBlock.getNextBlock();
        }

        return {
            trigger,
            triggerKey,
            spriteId: this.spriteId,
            hatBlockId: block.id,
            steps
        };
    }

    private compileBlock(block: Blockly.Block): ScriptStep | null {
        let step: ScriptStep | null = null;
        switch (block.type) {
            // Motion (support both internal underscore names and Scratch-standard concatenated names)
            case 'motion_move_steps':
            case 'motion_movesteps':
                step = { type: 'move_steps', steps: this.compileNumberValue(block, 'STEPS'), blockId: block.id };
                break;
            case 'motion_move_left': {
                const stepsFunc = this.compileNumberValue(block, 'STEPS');
                step = { type: 'change_x', dx: () => -Math.abs(stepsFunc()), blockId: block.id };
                break;
            }
            case 'motion_move_up': {
                const stepsFunc = this.compileNumberValue(block, 'STEPS');
                step = { type: 'change_y', dy: () => Math.abs(stepsFunc()), blockId: block.id };
                break;
            }
            case 'motion_move_down': {
                const stepsFunc = this.compileNumberValue(block, 'STEPS');
                step = { type: 'change_y', dy: () => -Math.abs(stepsFunc()), blockId: block.id };
                break;
            }
            case 'motion_turn_right':
            case 'motion_turnright':
                step = { type: 'turn_right', degrees: this.compileNumberValue(block, 'DEGREES'), blockId: block.id };
                break;
            case 'motion_turn_left':
            case 'motion_turnleft':
                step = { type: 'turn_left', degrees: this.compileNumberValue(block, 'DEGREES'), blockId: block.id };
                break;
            case 'motion_go_to_xy':
            case 'motion_gotoxy':
                step = { type: 'go_to_xy', x: this.compileNumberValue(block, 'X'), y: this.compileNumberValue(block, 'Y'), blockId: block.id };
                break;
            case 'motion_glide_to_xy':
            case 'motion_glidesecstoxy':
                step = { type: 'glide_to_xy', secs: this.compileNumberValue(block, 'SECS'), x: this.compileNumberValue(block, 'X'), y: this.compileNumberValue(block, 'Y'), blockId: block.id };
                break;
            case 'motion_point_direction':
            case 'motion_pointindirection':
                step = { type: 'point_direction', direction: this.compileNumberValue(block, 'DIRECTION'), blockId: block.id };
                break;
            case 'motion_change_x':
            case 'motion_changexby':
                step = { type: 'change_x', dx: this.compileNumberValue(block, 'DX'), blockId: block.id };
                break;
            case 'motion_change_y':
            case 'motion_changeyby':
                step = { type: 'change_y', dy: this.compileNumberValue(block, 'DY'), blockId: block.id };
                break;
            case 'motion_set_x':
            case 'motion_setx':
                step = { type: 'set_x', x: this.compileNumberValue(block, 'X'), blockId: block.id };
                break;
            case 'motion_set_y':
            case 'motion_sety':
                step = { type: 'set_y', y: this.compileNumberValue(block, 'Y'), blockId: block.id };
                break;
            // Motion — go to, glide, point towards, edge bounce, rotation
            case 'motion_go_to':
            case 'motion_goto':
                step = { type: 'go_to', target: block.getFieldValue('TO') as 'random' | 'mouse' | string };
                break;
            case 'motion_glide_to':
            case 'motion_glideto':
                step = { type: 'glide_to', secs: this.compileNumberValue(block, 'SECS'), target: block.getFieldValue('TO') as 'random' | 'mouse' | string, blockId: block.id };
                break;
            case 'motion_point_towards':
            case 'motion_pointtowards':
                step = { type: 'point_towards', towards: block.getFieldValue('TOWARDS') as 'mouse' | 'random' | string };
                break;
            case 'motion_if_on_edge_bounce':
            case 'motion_ifonedgebounce':
                step = { type: 'if_on_edge_bounce' };
                break;
            case 'motion_set_rotation_style':
            case 'motion_setrotationstyle':
                step = { type: 'set_rotation_style', style: block.getFieldValue('STYLE') as 'left-right' | 'all around' | 'none' };
                break;

            // Looks (support both internal and Scratch-standard names)
            case 'looks_say':
                step = { type: 'say', message: this.compileStringValue(block, 'MESSAGE') };
                break;
            case 'looks_say_for_secs':
            case 'looks_sayforsecs':
                step = { type: 'say_for_secs', message: this.compileStringValue(block, 'MESSAGE'), secs: this.compileNumberValue(block, 'SECS') };
                break;
            case 'looks_show':
                step = { type: 'show' };
                break;
            case 'looks_hide':
                step = { type: 'hide' };
                break;
            case 'looks_next_costume':
            case 'looks_nextcostume':
                step = { type: 'next_costume' };
                break;
            case 'looks_set_size':
            case 'looks_setsizeto':
                step = { type: 'set_size', size: Number(block.getFieldValue('SIZE')) };
                break;
            case 'looks_change_size':
            case 'looks_changesizeby':
                step = { type: 'change_size', change: Number(block.getFieldValue('CHANGE')) };
                break;
            case 'looks_set_effect':
            case 'looks_seteffectto':
                step = { type: 'set_effect', effect: block.getFieldValue('EFFECT') as 'ghost' | 'brightness', value: Number(block.getFieldValue('VALUE')) };
                break;
            case 'looks_clear_effects':
            case 'looks_cleargraphiceffects':
                step = { type: 'clear_effects' };
                break;
            case 'looks_change_effect':
            case 'looks_changeeffectby':
                step = { type: 'change_effect', effect: block.getFieldValue('EFFECT'), change: Number(block.getFieldValue('CHANGE') || block.getFieldValue('VALUE')) };
                break;
            // Looks — think, costume, backdrop, layers
            case 'looks_think':
                step = { type: 'think', message: this.compileStringValue(block, 'MESSAGE') };
                break;
            case 'looks_think_for_secs':
            case 'looks_thinkforsecs':
                step = { type: 'think_for_secs', message: this.compileStringValue(block, 'MESSAGE'), secs: this.compileNumberValue(block, 'SECS') };
                break;
            case 'looks_switch_costume':
            case 'looks_switchcostumeto':
                step = { type: 'switch_costume', costume: block.getFieldValue('COSTUME') };
                break;
            case 'looks_switch_backdrop':
            case 'looks_switchbackdropto':
                step = { type: 'switch_backdrop', backdrop: block.getFieldValue('BACKDROP') };
                break;
            case 'looks_next_backdrop':
            case 'looks_nextbackdrop':
                step = { type: 'next_backdrop' };
                break;
            case 'looks_go_to_layer':
            case 'looks_gotofrontback': {
                const layer = block.getFieldValue('LAYER') || block.getFieldValue('FRONT_BACK');
                step = { type: 'go_to_layer', layer: layer as 'front' | 'back' };
                break;
            }
            case 'looks_go_forward_layers':
            case 'looks_goforwardbackwardlayers': {
                const dir = block.getFieldValue('DIRECTION') || block.getFieldValue('FORWARD_BACKWARD');
                const num = Number(block.getFieldValue('LAYERS') || block.getFieldValue('NUM'));
                step = { type: 'go_forward_layers', direction: dir as 'forward' | 'backward', layers: num };
                break;
            }

            // Control & Arduino Control
            case 'control_wait':
            case 'arduino_delay': {
                // scratchBlocks uses DURATION, animation-blocks uses SECS
                const secs = this.compileNumberValue(block, 'SECS') || this.compileNumberValue(block, 'DURATION');
                step = { type: 'wait', secs };
                break;
            }
            case 'control_repeat':
            case 'arduino_repeat': {
                const times = this.compileNumberValue(block, 'TIMES');
                step = { type: 'repeat', times, body: this.compileStatementInput(block, 'DO') };
                break;
            }
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
            case 'control_create_clone_of':
                step = { type: 'create_clone', target: block.getFieldValue('CLONE_OPTION') };
                break;
            case 'control_delete_clone':
            case 'control_delete_this_clone':
                step = { type: 'delete_clone' };
                break;

            // Events - broadcast (support both field names)
            case 'event_broadcast':
                step = { type: 'broadcast', message: block.getFieldValue('MESSAGE') || block.getFieldValue('BROADCAST_INPUT') || block.getFieldValue('BROADCAST_OPTION') };
                break;
            case 'event_broadcast_wait':
            case 'event_broadcastandwait':
                step = { type: 'broadcast_wait', message: block.getFieldValue('MESSAGE') || block.getFieldValue('BROADCAST_INPUT') || block.getFieldValue('BROADCAST_OPTION') };
                break;

            // Sound
            case 'sound_play':
                step = { type: 'play_sound', sound: block.getFieldValue('SOUND') || block.getFieldValue('SOUND_MENU') };
                break;
            case 'sound_play_until_done':
            case 'sound_playuntildone':
                step = { type: 'play_sound_until_done', sound: block.getFieldValue('SOUND') || block.getFieldValue('SOUND_MENU') };
                break;
            case 'sound_stop_all':
            case 'sound_stopallsounds':
                step = { type: 'stop_all_sounds' };
                break;
            case 'sound_set_volume':
            case 'sound_setvolumeto':
                step = { type: 'set_volume', volume: Number(block.getFieldValue('VOLUME')) };
                break;
            case 'sound_change_volume':
            case 'sound_changevolumeby':
                step = { type: 'change_volume', change: Number(block.getFieldValue('VOLUME')) };
                break;
            case 'sound_set_effect':
            case 'sound_seteffectto':
                step = {
                    type: 'set_sound_effect',
                    effect: block.getFieldValue('EFFECT') as 'pitch' | 'pan',
                    value: Number(block.getFieldValue('VALUE'))
                };
                break;
            case 'sound_change_effect':
            case 'sound_changeeffectby':
                step = {
                    type: 'change_sound_effect',
                    effect: block.getFieldValue('EFFECT') as 'pitch' | 'pan',
                    value: Number(block.getFieldValue('VALUE'))
                };
                break;
            case 'sound_clear_effects':
            case 'sound_cleareffects':
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
            case 'sensing_askandwait':
                step = {
                    type: 'ask',
                    question: this.compileStringValue(block, 'QUESTION')
                };
                break;
            case 'sensing_reset_timer':
            case 'sensing_resettimer':
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
                    value: this.compileDynamicValue(block, 'VALUE')
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
