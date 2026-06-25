/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from '@blockly-runtime';
import type { CompiledScript, ScriptStep } from '../vm/AnimationVM';
import { animationVM } from '../vm/AnimationVM';
import { hardwareAdapter } from '../hardware/HardwareAdapter';
import { stageManager } from '../engine/StageManager';

/** Convert pen color number (0-200) to hex color */
function penNumberToHex(value: number): string {
    if (value <= 0) return '#000000';
    if (value >= 200) return '#FFFFFF';
    const hue = (value / 200) * 360;
    const h = hue / 360;
    const s = 1;
    const l = 0.5;
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
            case 'sensing_touching_color':
            case 'sensing_touchingcolor': {
                const color = conditionBlock.getFieldValue('COLOR');
                return () => animationVM.isTouchingColor(color, this.spriteId);
            }
            case 'sensing_color_touching_color':
            case 'sensing_coloristouchingcolor': {
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
                    console.log(`[AnimationVM] Checking digital sensor ${sensor} on pin ${pin}`);
                    return false; // Default to false for simulation
                };
            }
            case 'fd_is_expression': {
                const expr = conditionBlock.getFieldValue('EXPRESSION') ?? 'happy';
                return () => {
                    const emotion = (window as any).runtime?.face?.getEmotion() ?? '';
                    return emotion.toLowerCase() === expr;
                };
            }
            case 'fd_is_class_detected': {
                const classN = Number(conditionBlock.getFieldValue('CLASS_N') ?? 1);
                return () => {
                    return !!(window as any).runtime?.face?.isClassDetected?.(classN);
                };
            }
            case 'video_sense_motion':
                return () => !!(window as any).runtime?.videoSensing?.isMotionDetected();

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

        if (id) {
            const variable = ws.getVariableById(id);
            if (variable) return (variable as any).name;

            // Fallback: The stored value might be the variable name instead of the ID
            // (e.g. if the block was created from a checkbox reporter replacement).
            // Try to find the variable by name across all types.
            const byName = ws.getVariable(id, 'Number')
                || ws.getVariable(id, 'String')
                || ws.getVariable(id, '')
                || ws.getVariable(id);
            if (byName) return (byName as any).name;
        }

        // Last resort: get the human-readable text from the field itself.
        const field = block.getField('VARIABLE') || block.getField('VAR') || block.getField('LIST');
        const nameFallback = field ? field.getText() : (id || 'unknown');

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
            // Checkbox reporters from the flyout that weren't replaced with data_variable
            case 'variable_reporter_checkbox': {
                const name = valueBlock.getFieldValue('VARIABLE');
                return () => animationVM.getVariable(name);
            }
            case 'data_itemoflist': {
                const list = this.getVariableName(valueBlock);
                const idxFunc = this.compileNumberValue(valueBlock, 'INDEX');
                return () => animationVM.getListItem(list, idxFunc());
            }
            // Operator blocks should always resolve as numbers
            case 'operator_add':
            case 'operator_subtract':
            case 'operator_multiply':
            case 'operator_divide':
            case 'operator_random':
            case 'operator_mod':
            case 'operator_round':
            case 'operator_round_to_decimals':
            case 'operator_mathop':
            case 'operator_length':
            case 'math_number':
            case 'arduino_number':
            case 'sensing_timer':
            case 'sensing_loudness':
            case 'sensing_days_since_2000':
            case 'sensing_current':
            case 'sensing_distance_to':
            case 'sensing_mouse_x':
            case 'sensing_mouse_y':
            case 'motion_x_position':
            case 'motion_y_position':
            case 'motion_direction':
            case 'looks_size':
            case 'looks_costume_number':
            case 'looks_backdrop_number':
            case 'sound_volume':
            case 'data_lengthoflist':
            case 'data_itemnumoflist': {
                const numFunc = this.compileNumberValue(block, inputName);
                return () => numFunc();
            }
            // String-producing blocks
            case 'operator_join':
            case 'operator_letter_of':
            case 'text':
            case 'looks_costume_name':
            case 'looks_backdrop_name':
            case 'data_listcontents':
            case 'data_tablecontents':
            case 'data_getvalueattable':
            case 'sensing_username': {
                const strFunc = this.compileStringValue(block, inputName);
                return () => strFunc();
            }
            // sensing_answer can be string or number depending on context — return raw value
            case 'sensing_answer': {
                return () => {
                    const ans = animationVM.getAnswer();
                    const num = Number(ans);
                    return isNaN(num) ? ans : num;
                };
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
            // e.g. leapBlocks.ts defines looks_say with field_input named MESSAGE
            const fieldVal = block.getFieldValue(inputName);
            if (fieldVal !== null && fieldVal !== undefined) {
                const capturedVal = String(fieldVal);
                console.info(`[Compiler] Using field fallback for '${inputName}' on ${block.type}: "${capturedVal}"`);
                return () => capturedVal;
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
            case 'text': {
                const textVal = String(valueBlock.getFieldValue('TEXT') ?? '');
                return () => textVal;
            }
            case 'math_number':
            case 'arduino_number': {
                const numVal = String(valueBlock.getFieldValue('NUM') ?? '0');
                return () => numVal;
            }
            case 'variables_get': {
                const name = this.getVariableName(valueBlock);
                return () => String(animationVM.getVariable(name));
            }
            case 'data_variable': {
                const name = this.getVariableName(valueBlock);
                return () => String(animationVM.getVariable(name));
            }
            // Checkbox reporters from the flyout that weren't replaced with data_variable
            case 'variable_reporter_checkbox': {
                const name = valueBlock.getFieldValue('VARIABLE');
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

            // ── Face Detection string reporters ────────────────────────────
            case 'fd_get_expression':
            case 'fd_emotion':
                return () => (window as any).runtime?.face?.getEmotion() ?? '';
            case 'fd_face_count':
                return () => String((window as any).runtime?.face?.getFaceCount() ?? 0);
            case 'fd_face_x': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => String((window as any).runtime?.face?.getX(n) ?? 0);
            }
            case 'fd_face_y': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => String((window as any).runtime?.face?.getY(n) ?? 0);
            }
            case 'fd_get_dimension': {
                const dim = valueBlock.getFieldValue('DIM') || 'width';
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => {
                    const face = (window as any).runtime?.face;
                    if (!face) return '0';
                    return String(dim === 'width' ? face.getWidth(n) : face.getHeight(n));
                };
            }
            case 'fd_get_xy_position': {
                const axis = (valueBlock.getFieldValue('AXIS') || 'x').toLowerCase();
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => {
                    const face = (window as any).runtime?.face;
                    if (!face) return '0';
                    return String(axis === 'x' ? face.getX(n) : face.getY(n));
                };
            }
            case 'fd_is_expression': {
                const expr = valueBlock.getFieldValue('EXPRESSION') ?? 'happy';
                return () => {
                    const emotion = (window as any).runtime?.face?.getEmotion() ?? '';
                    return String(emotion.toLowerCase() === expr);
                };
            }

            case 'fd_get_class_detected': {
                const faceN = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.face?.getClassOfFace?.(faceN) ?? '';
            }


            // ── Hand Pose string reporters ─────────────────────────────────
            case 'hp_guess_sign':
                return () => (window as any).runtime?.handPose?.getSign() ?? '';

            // ── ML Environment string reporters ───────────────────────────
            case 'ml_get_prediction':
                return () => (window as any).runtime?.ml?.getPrediction() ?? '';

            // ── Body Detection string reporters ────────────────────────────
            case 'bd_body_count':
                return () => String((window as any).runtime?.bodyDetection?.getBodyCount() ?? 0);
            case 'bd_get_x': {
                const bdLm = valueBlock.getFieldValue('PART') || 'nose';
                const bdN = Number(valueBlock.getFieldValue('BODY') ?? 1);
                return () => String((window as any).runtime?.bodyDetection?.getX(bdLm, bdN) ?? 0);
            }
            case 'bd_get_y': {
                const bdLm2 = valueBlock.getFieldValue('PART') || 'nose';
                const bdN2 = Number(valueBlock.getFieldValue('BODY') ?? 1);
                return () => String((window as any).runtime?.bodyDetection?.getY(bdLm2, bdN2) ?? 0);
            }

            // ── Object Detection string reporters ──────────────────────────
            case 'object_label': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.objectDetection?.getLabel(n) ?? '';
            }

            case 'object_count':
                return () => String((window as any).runtime?.objectDetection?.getNumberOfObjects() ?? 0);
            case 'object_x': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => String((window as any).runtime?.objectDetection?.getX(n) ?? 0);
            }
            case 'object_y': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => String((window as any).runtime?.objectDetection?.getY(n) ?? 0);
            }
            case 'object_confidence': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => String((window as any).runtime?.objectDetection?.getConfidence(n) ?? 0);
            }

            // ── Text to Speech reporters ────────────────────────────────────
            case 'tts_is_speaking':
                return () => String((window as any).runtime?.tts?.isSpeaking() ?? false);

            // ── Speech Recognition string reporters ─────────────────────────
            case 'speech_get_last_result':
                return () => (window as any).runtime?.speech?.getLastResult() ?? '';
            case 'speech_is_listening':
                return () => String((window as any).runtime?.speech?.isListening() ?? false);

            // ── Text Recognition (OCR) string reporters ────────────────────
            case 'ocr_get_text':
                return () => (window as any).runtime?.ocr?.getLastResult() ?? '';
            case 'ocr_contains': {
                const phrase = valueBlock.getFieldValue('PHRASE') || '';
                return () => String((window as any).runtime?.ocr?.contains(phrase) ?? false);
            }

            // ── Weather Data string reporters ──────────────────────────────
            case 'weather_condition':
                return () => (window as any).runtime?.weather?.getCondition() ?? '';
            case 'weather_is_raining':
                return () => String((window as any).runtime?.weather?.isRaining() ?? false);

            // ── Translate string reporters ──────────────────────────────────
            case 'translate_last_result':
                return () => (window as any).runtime?.translate?.getLastResult() ?? '';

            // ── Data Logger string reporters ────────────────────────────────
            case 'logger_get_entry': {
                const idx = Number(valueBlock.getFieldValue('INDEX') ?? 1);
                return () => (window as any).runtime?.logger?.getEntry(idx) ?? '';
            }
            case 'logger_get_label': {
                const idx2 = Number(valueBlock.getFieldValue('INDEX') ?? 1);
                return () => (window as any).runtime?.logger?.getLabel(idx2) ?? '';
            }

            // ── Computer Vision string reporters ────────────────────────────
            case 'vision_get_object_name': {
                const vIdx = Number(valueBlock.getFieldValue('INDEX') ?? 1);
                return () => (window as any).runtime?.vision?.getObjectName(vIdx) ?? '';
            }
            case 'vision_is_object_present': {
                const vName = valueBlock.getFieldValue('NAME') || '';
                return () => String((window as any).runtime?.vision?.isObjectPresent(vName) ?? false);
            }
            case 'vision_get_emotion': {
                const vFaceIdx = Number(valueBlock.getFieldValue('INDEX') ?? 1);
                return () => (window as any).runtime?.vision?.getEmotion(vFaceIdx) ?? 'neutral';
            }

            // ── Video Player string reporter ───────────────────────────────
            case 'video_get_source':
                return () => (window as any).runtime?.video?.getSource() ?? '';

            // ── QR Scanner string reporter ────────────────────────────────
            case 'qr_get_text':
                return () => (window as any).runtime?.qrScanner?.getText() ?? '';

            // ── Makey Makey string reporter ──────────────────────────────
            case 'makey_get_key':
                return () => (window as any).runtime?.makeyMakey?.getLastKey() ?? '';

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
                    return () => num;
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
            case 'arduino_number': {
                const val = valueBlock.getFieldValue('NUM');
                const numVal = val !== null ? Number(val) : 0;
                return () => numVal;
            }
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
            // Checkbox reporters from the flyout that weren't replaced with data_variable
            case 'variable_reporter_checkbox': {
                const vrName = valueBlock.getFieldValue('VARIABLE');
                return () => {
                    const value = animationVM.getVariable(vrName);
                    const num = Number(value);
                    return isNaN(num) ? 0 : num;
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

            // ── Face Detection reporter blocks ─────────────────────────────
            case 'fd_face_count':
                return () => (window as any).runtime?.face?.getFaceCount() ?? 0;
            case 'fd_face_x': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.face?.getX(n) ?? 0;
            }
            case 'fd_face_y': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.face?.getY(n) ?? 0;
            }
            case 'fd_emotion': {
                // emotion is a string — convert to number (0 if not numeric)
                return () => {
                    const e = (window as any).runtime?.face?.getEmotion() ?? '';
                    const n = Number(e);
                    return isNaN(n) ? 0 : n;
                };
            }
            case 'fd_is_expression': {
                const expr = valueBlock.getFieldValue('EXPRESSION') ?? 'happy';
                const faceN = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => {
                    const emotion = (window as any).runtime?.face?.getEmotion() ?? '';
                    return emotion.toLowerCase() === expr ? 1 : 0;
                };
            }
            case 'fd_get_x_position': {
                const axis = valueBlock.getFieldValue('AXIS') ?? 'x';
                const faceN = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => axis === 'x'
                    ? ((window as any).runtime?.face?.getX(faceN) ?? 0)
                    : ((window as any).runtime?.face?.getY(faceN) ?? 0);
            }
            case 'fd_get_landmark_pos': {
                const axis2 = valueBlock.getFieldValue('AXIS') ?? 'x';
                const lm = valueBlock.getFieldValue('LANDMARK') ?? 'left_eye';
                const faceN2 = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.face?.getLandmark?.(lm, faceN2, axis2) ?? 0;
            }
            case 'fd_get_landmark_num': {
                const axis3 = valueBlock.getFieldValue('AXIS') ?? 'x';
                const lmN = Number(valueBlock.getFieldValue('LANDMARK_N') ?? 1);
                const faceN3 = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.face?.getLandmarkByIndex?.(lmN, faceN3, axis3) ?? 0;
            }
            case 'fd_get_xy_position': {
                const axis4 = valueBlock.getFieldValue('AXIS') ?? 'x';
                const faceN4 = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => axis4 === 'x'
                    ? ((window as any).runtime?.face?.getX(faceN4) ?? 0)
                    : ((window as any).runtime?.face?.getY(faceN4) ?? 0);
            }
            case 'fd_is_class_detected': {
                const classN = Number(valueBlock.getFieldValue('CLASS_N') ?? 1);
                return () => (window as any).runtime?.face?.isClassDetected?.(classN) ? 1 : 0;
            }

            // ── Hand Pose reporter blocks ──────────────────────────────────
            case 'hp_finger_x': {
                const finger = valueBlock.getFieldValue('FINGER') || 'index';
                return () => (window as any).runtime?.handPose?.getLandmarkX(finger) ?? 0;
            }
            case 'hp_finger_y': {
                const finger = valueBlock.getFieldValue('FINGER') || 'index';
                return () => (window as any).runtime?.handPose?.getLandmarkY(finger) ?? 0;
            }

            // ── Body Detection reporter blocks ─────────────────────────────
            case 'bd_body_count':
                return () => (window as any).runtime?.bodyDetection?.getBodyCount() ?? 0;
            case 'bd_get_x': {
                const lm = valueBlock.getFieldValue('PART') || 'nose';
                const n = Number(valueBlock.getFieldValue('BODY') ?? 1);
                return () => (window as any).runtime?.bodyDetection?.getX(lm, n) ?? 0;
            }
            case 'bd_get_y': {
                const lm = valueBlock.getFieldValue('PART') || 'nose';
                const n = Number(valueBlock.getFieldValue('BODY') ?? 1);
                return () => (window as any).runtime?.bodyDetection?.getY(lm, n) ?? 0;
            }
            case 'bd_is_part_visible': {
                const partName = valueBlock.getFieldValue('PART') || 'nose';
                const bodyIdx = Number(valueBlock.getFieldValue('BODY') ?? 1);
                return () => {
                    const bd = (window as any).runtime?.bodyDetection;
                    if (!bd) return 0;
                    const x = bd.getX(partName, bodyIdx);
                    const y = bd.getY(partName, bodyIdx);
                    return (x !== 0 || y !== 0) ? 1 : 0;
                };
            }

            // ── ML Environment reporter blocks ─────────────────────────────
            case 'ml_get_confidence':
                return () => (window as any).runtime?.ml?.getConfidence() ?? 0;
            case 'ml_is_class': {
                const target = valueBlock.getFieldValue('CLASS') || '';
                return () => (window as any).runtime?.ml?.isClass(target) ? 1 : 0;
            }
            case 'ml_get_class_count':
                return () => (window as any).runtime?.ml?.getClassCount() ?? 0;
            case 'ml_get_sample_count': {
                const mlSampleLabel = valueBlock.getFieldValue('LABEL') || 'class1';
                return () => (window as any).runtime?.ml?.getSampleCount(mlSampleLabel) ?? 0;
            }
            case 'ml_is_trained':
                return () => (window as any).runtime?.ml?.isTrained() ? 1 : 0;

            // ── Object Detection reporter blocks ───────────────────────────

            case 'object_count':
                return () => (window as any).runtime?.objectDetection?.getNumberOfObjects() ?? 0;
            case 'object_x': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.objectDetection?.getX(n) ?? 0;
            }
            case 'object_y': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.objectDetection?.getY(n) ?? 0;
            }
            case 'object_confidence': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.objectDetection?.getConfidence(n) ?? 0;
            }
            case 'object_label': {
                const n = Number(valueBlock.getFieldValue('N') ?? 1);
                return () => (window as any).runtime?.objectDetection?.getLabel(n) ?? '';
            }

            // ── Text to Speech number reporters ─────────────────────────────
            case 'tts_get_rate':
                return () => (window as any).runtime?.tts?.getRate() ?? 1;
            case 'tts_get_volume':
                return () => (window as any).runtime?.tts?.getVolume() ?? 1;
            case 'tts_is_speaking':
                return () => (window as any).runtime?.tts?.isSpeaking() ? 1 : 0;

            // ── Speech Recognition number reporters ─────────────────────────
            case 'speech_get_confidence':
                return () => (window as any).runtime?.speech?.getConfidence() ?? 0;
            case 'speech_is_listening':
                return () => (window as any).runtime?.speech?.isListening() ? 1 : 0;

            // ── Text Recognition (OCR) number reporters ─────────────────────
            case 'ocr_get_word_count':
                return () => (window as any).runtime?.ocr?.getWordCount() ?? 0;

            // ── Weather Data number reporters ───────────────────────────────
            case 'weather_temperature':
                return () => (window as any).runtime?.weather?.getTemperature() ?? 0;
            case 'weather_humidity':
                return () => (window as any).runtime?.weather?.getHumidity() ?? 0;
            case 'weather_wind_speed':
                return () => (window as any).runtime?.weather?.getWindSpeed() ?? 0;
            case 'weather_is_raining':
                return () => (window as any).runtime?.weather?.isRaining() ? 1 : 0;

            // ── Data Logger number reporters ────────────────────────────────
            case 'logger_get_count':
                return () => (window as any).runtime?.logger?.getCount() ?? 0;

            // ── Computer Vision number reporters ────────────────────────────
            case 'vision_get_object_count':
                return () => (window as any).runtime?.vision?.getObjectCount() ?? 0;
            case 'vision_get_object_confidence': {
                const vCIdx = Number(valueBlock.getFieldValue('INDEX') ?? 1);
                return () => (window as any).runtime?.vision?.getObjectConfidence(vCIdx) ?? 0;
            }
            case 'vision_get_object_x': {
                const vXIdx = Number(valueBlock.getFieldValue('INDEX') ?? 1);
                return () => (window as any).runtime?.vision?.getObjectX(vXIdx) ?? 0;
            }
            case 'vision_get_object_y': {
                const vYIdx = Number(valueBlock.getFieldValue('INDEX') ?? 1);
                return () => (window as any).runtime?.vision?.getObjectY(vYIdx) ?? 0;
            }
            case 'vision_get_face_count':
                return () => (window as any).runtime?.vision?.getFaceCount() ?? 0;

            // ── Music reporter ─────────────────────────────────────────────
            case 'music_get_tempo':
                return () => (window as any).runtime?.music?.getTempo() ?? 60;

            // ── Video Player number reporters ─────────────────────────────
            case 'video_get_time':
                return () => (window as any).runtime?.video?.getCurrentTime() ?? 0;
            case 'video_get_duration':
                return () => (window as any).runtime?.video?.getDuration() ?? 0;
            case 'video_get_percent':
                return () => (window as any).runtime?.video?.getPercent() ?? 0;

            // ── Video Player boolean reporters ─────────────────────────────
            case 'video_is_playing':
                return () => (window as any).runtime?.video?.isPlaying() ? 1 : 0;
            case 'video_is_loaded':
                return () => (window as any).runtime?.video?.isLoaded() ? 1 : 0;

            // ── Video Sensing number reporters ─────────────────────────────
            case 'video_motion_level':
                return () => (window as any).runtime?.videoSensing?.getMotionLevel() ?? 0;
            case 'video_sense_direction':
                return () => (window as any).runtime?.videoSensing?.getDirection() ?? 0;

            // ── QR Scanner number reporter ────────────────────────────────
            case 'qr_get_count':
                return () => (window as any).runtime?.qrScanner?.getCount() ?? 0;

            // ── Physics Engine number reporters ───────────────────────────
            case 'physics_get_velocity_x': {
                const pvxSprite = valueBlock.getFieldValue('SPRITE') || '';
                return () => (window as any).runtime?.physics?.getVelocityX(pvxSprite) ?? 0;
            }
            case 'physics_get_velocity_y': {
                const pvySprite = valueBlock.getFieldValue('SPRITE') || '';
                return () => (window as any).runtime?.physics?.getVelocityY(pvySprite) ?? 0;
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
        let trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'procedure' | 'physics_collision';
        let triggerKey: string | undefined;

        compilerLog.block(block.type, 'checking trigger type...');

        switch (block.type) {
            // Green flag — support both old internal name and leap-standard name
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
            case 'physics_on_collision':
                trigger = 'physics_collision';
                triggerKey = (block.getFieldValue('SPRITE1') || '') + ':' + (block.getFieldValue('SPRITE2') || '');
                compilerLog.info(`  Trigger: physics collision (${triggerKey})`);
                break;
            case 'makey_on_key':
                trigger = 'key';
                triggerKey = block.getFieldValue('KEY') || 'space';
                compilerLog.info(`  Trigger: makey makey key (${triggerKey})`);
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
            // Motion (support both internal underscore names and leap-standard concatenated names)
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

            // Looks (support both internal and leap-standard names)
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
            case 'looks_mirror':
                step = { type: 'mirror' };
                break;

            // Control & Arduino Control
            case 'control_wait':
            case 'arduino_delay': {
                // leapBlocks uses DURATION, animation-blocks uses SECS
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
            case 'pen_setPenColorToNumber': {
                const val = Number(block.getFieldValue('COLOR')) || 0;
                const hex = penNumberToHex(val);
                step = { type: 'pen_setPenColorToColor', color: hex };
                break;
            }
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

            // Advanced pen blocks (extension) — delegate to runtime bridge
            case 'pen_enable_drag':
            case 'pen_set_draw_mode':
            case 'pen_set_buffer':
                // These are runtime-only features; emit a no-op step so the block
                // doesn't break compilation. The JS generator path handles them.
                step = { type: 'pen_clear' }; // harmless no-op placeholder
                break;

            // Realistic pencil drawing blocks
            case 'pen_go_to_mouse':
                step = { type: 'go_to_mouse_with_pen', penDown: true };
                break;
            case 'pen_go_to_mouse_up':
                step = { type: 'go_to_mouse_with_pen', penDown: false };
                break;
            case 'pen_point_towards_mouse_smooth':
                step = { type: 'point_towards_mouse_smooth', smoothFactor: 0.25 };
                break;

            // Face Detection extension blocks
            case 'fd_camera':
            case 'fd_analyze': {
                const action = block.getFieldValue('ACTION') || 'analyze';
                step = { type: 'fd_action', action } as any;
                break;
            }
            // New reference-style blocks
            case 'fd_video_on_stage': {
                const state = block.getFieldValue('STATE') || 'on';
                const transparency = Number(block.getFieldValue('TRANSPARENCY') ?? 0);
                step = { type: 'fd_action', action: state, transparency } as any;
                break;
            }
            case 'fd_analyse_image': {
                const src = block.getFieldValue('SOURCE') || 'camera';
                step = { type: 'fd_action', action: src === 'camera' ? 'on' : 'analyze' } as any;
                break;
            }
            case 'fd_show_bounding_box': {
                const boxState = block.getFieldValue('STATE') || 'show';
                step = { type: 'fd_report', feature: block.type, state: boxState } as any;
                break;
            }
            case 'fd_set_threshold': {
                const threshold = Number(block.getFieldValue('THRESHOLD') ?? 0.5);
                step = { type: 'fd_report', feature: block.type, threshold } as any;
                break;
            }
            case 'fd_add_class': {
                const classN = Number(block.getFieldValue('CLASS_N') ?? 1);
                const className = block.getFieldValue('CLASS_NAME') || 'Jarvis';
                const classSource = block.getFieldValue('SOURCE') || 'camera';
                step = { type: 'fd_report', feature: block.type, classN, className, classSource } as any;
                break;
            }
            case 'fd_reset_class':
            case 'fd_do_face_matching': {
                // These are runtime-only operations — execute via fd_report step
                step = { type: 'fd_report', feature: block.type } as any;
                break;
            }
            case 'fd_count':
            case 'fd_get_num_faces':
            case 'fd_get_expression':
            case 'fd_guess_emotion':
            case 'fd_feature':
            case 'fd_detect': {
                const feature = block.getFieldValue('FEATURE') || '';
                step = { type: 'fd_report', feature } as any;
                break;
            }

            // Object Detection extension blocks
            case 'object_detect':
                step = { type: 'object_detect' } as any;
                break;
            case 'object_when_detected': {
                const objectType = block.getFieldValue('OBJECT') || 'cat';
                step = { type: 'object_when_detected', objectType } as any;
                break;
            }

            // Music extension blocks
            case 'music_play_note': {
                const note = Number(block.getFieldValue('NOTE') || 60);
                const beats = Number(block.getFieldValue('BEATS') || 0.25);
                step = { type: 'music_play_note', note, beats } as any;
                break;
            }

            // Hand Pose
            case 'hp_camera':
            case 'hp_analyze':
                step = { type: 'hp_action', action: block.getFieldValue('ACTION') || 'analyze' } as any;
                break;
            case 'hp_move_with':
                step = { type: 'hp_move_with', finger: block.getFieldValue('FINGER') } as any;
                break;
            case 'hp_guess_sign':
                step = { type: 'hp_report', feature: 'sign' } as any;
                break;
            case 'hp_when_sign': {
                const signName = block.getFieldValue('SIGN') || '2';
                step = { type: 'hp_when_sign', sign: signName } as any;
                break;
            }

            // Body Detection
            case 'bd_camera':
                step = { type: 'bd_action', action: block.getFieldValue('STATE') || 'analyze' } as any;
                break;
            case 'bd_analyze':
                step = { type: 'bd_action', action: 'analyze' } as any;
                break;

            // ML Environment
            case 'ml_add_sample': {
                const mlLabel = block.getFieldValue('LABEL') || 'class1';
                step = { type: 'ml_add_sample', label: mlLabel } as any;
                break;
            }
            case 'ml_train':
                step = { type: 'ml_train' } as any;
                break;
            case 'ml_clear_all':
                step = { type: 'ml_clear_all' } as any;
                break;
            case 'ml_clear_class': {
                const mlClearLabel = block.getFieldValue('LABEL') || 'class1';
                step = { type: 'ml_clear_class', label: mlClearLabel } as any;
                break;
            }
            case 'ml_analyze':
                step = { type: 'ml_action', action: block.getFieldValue('ACTION') || 'on' } as any;
                break;

            // Text to Speech extension blocks
            case 'tts_speak': {
                const msg = this.compileStringValue(block, 'MESSAGE');
                step = { type: 'tts_speak', message: msg } as any;
                break;
            }
            case 'tts_set_voice': {
                const voice = this.compileStringValue(block, 'VOICE');
                step = { type: 'tts_set_voice', voice } as any;
                break;
            }
            case 'tts_set_rate': {
                const rate = this.compileNumberValue(block, 'RATE');
                step = { type: 'tts_set_rate', rate } as any;
                break;
            }
            case 'tts_set_volume': {
                const volume = this.compileNumberValue(block, 'VOLUME');
                step = { type: 'tts_set_volume', volume } as any;
                break;
            }
            case 'tts_set_pitch': {
                const pitch = this.compileNumberValue(block, 'PITCH');
                step = { type: 'tts_set_pitch', pitch } as any;
                break;
            }
            case 'tts_stop':
                step = { type: 'tts_stop' } as any;
                break;

            // Speech Recognition extension blocks
            case 'speech_start_listening':
                step = { type: 'speech_start_listening' } as any;
                break;
            case 'speech_stop_listening':
                step = { type: 'speech_stop_listening' } as any;
                break;
            case 'speech_set_language': {
                const lang = block.getFieldValue('LANGUAGE') || 'en-US';
                step = { type: 'speech_set_language', language: lang } as any;
                break;
            }
            case 'speech_on_result': {
                step = { type: 'speech_on_result', body: this.compileStatementInput(block, 'BODY') } as any;
                break;
            }

            // Text Recognition (OCR) extension blocks
            case 'ocr_from_camera':
                step = { type: 'ocr_from_camera' } as any;
                break;
            case 'ocr_from_image': {
                const ocrSource = block.getFieldValue('SOURCE') || 'uploaded';
                step = { type: 'ocr_from_image', source: ocrSource } as any;
                break;
            }

            // Weather Data extension blocks
            case 'weather_get_for_city': {
                const city = block.getFieldValue('CITY') || 'London';
                step = { type: 'weather_get_for_city', city } as any;
                break;
            }
            case 'weather_get_for_location': {
                const lat = Number(block.getFieldValue('LAT') || 0);
                const lon = Number(block.getFieldValue('LON') || 0);
                step = { type: 'weather_get_for_location', lat, lon } as any;
                break;
            }

            // Translate extension blocks
            case 'translate_text': {
                const text = block.getFieldValue('TEXT') || '';
                const lang = block.getFieldValue('TARGET_LANG') || 'en';
                step = { type: 'translate_text', text, targetLang: lang } as any;
                break;
            }
            case 'translate_set_source': {
                const srcLang = block.getFieldValue('SOURCE_LANG') || 'auto';
                step = { type: 'translate_set_source', sourceLang: srcLang } as any;
                break;
            }
            case 'translate_set_target': {
                const tgtLang = block.getFieldValue('TARGET_LANG') || 'en';
                step = { type: 'translate_set_target', targetLang: tgtLang } as any;
                break;
            }

            // Data Logger extension blocks
            case 'logger_log': {
                const logVal = this.compileStringValue(block, 'VALUE');
                step = { type: 'logger_log', value: logVal } as any;
                break;
            }
            case 'logger_log_with_label': {
                const logVal2 = this.compileStringValue(block, 'VALUE');
                const logLabel = block.getFieldValue('LABEL') || 'data';
                step = { type: 'logger_log_with_label', value: logVal2, label: logLabel } as any;
                break;
            }
            case 'logger_clear':
                step = { type: 'logger_clear' } as any;
                break;
            case 'logger_save_to_csv':
                step = { type: 'logger_save_to_csv' } as any;
                break;
            case 'logger_on_new_entry': {
                step = { type: 'logger_on_new_entry', body: this.compileStatementInput(block, 'BODY') } as any;
                break;
            }

            // Computer Vision extension blocks
            case 'vision_camera_on':
                step = { type: 'vision_camera_on' } as any;
                break;
            case 'vision_camera_off':
                step = { type: 'vision_camera_off' } as any;
                break;
            case 'vision_analyze':
                step = { type: 'vision_analyze' } as any;
                break;
            case 'vision_detect_objects':
                step = { type: 'vision_detect_objects' } as any;
                break;
            case 'vision_draw_bounding_boxes': {
                const state = block.getFieldValue('STATE') || 'off';
                step = { type: 'vision_draw_bounding_boxes', state } as any;
                break;
            }

            // Video Player extension blocks
            case 'video_set_source': {
                const url = block.getFieldValue('URL') || '';
                step = { type: 'video_set_source', url } as any;
                break;
            }
            case 'video_play':
                step = { type: 'video_play' } as any;
                break;
            case 'video_pause':
                step = { type: 'video_pause' } as any;
                break;
            case 'video_stop':
                step = { type: 'video_stop' } as any;
                break;
            case 'video_show':
                step = { type: 'video_show' } as any;
                break;
            case 'video_hide':
                step = { type: 'video_hide' } as any;
                break;
            case 'video_set_speed': {
                const speed = Number(block.getFieldValue('SPEED') || 1);
                step = { type: 'video_set_speed', speed } as any;
                break;
            }
            case 'video_set_volume': {
                const volume = Number(block.getFieldValue('VOLUME') || 100);
                step = { type: 'video_set_volume', volume } as any;
                break;
            }
            case 'video_seek': {
                const seekTime = Number(block.getFieldValue('TIME') || 0);
                step = { type: 'video_seek', time: seekTime } as any;
                break;
            }
            case 'video_set_position': {
                const vx = Number(block.getFieldValue('X') || 50);
                const vy = Number(block.getFieldValue('Y') || 50);
                const vsize = Number(block.getFieldValue('SIZE') || 100);
                step = { type: 'video_set_position', x: vx, y: vy, size: vsize } as any;
                break;
            }
            case 'video_set_loop': {
                const loopState = block.getFieldValue('LOOP') || 'off';
                step = { type: 'video_set_loop', loop: loopState === 'on' } as any;
                break;
            }
            case 'video_set_sensitivity': {
                const vsThreshold = Number(block.getFieldValue('THRESHOLD') || 30);
                step = { type: 'vs_set_sensitivity', threshold: vsThreshold } as any;
                break;
            }
            case 'qr_scan_camera':
                step = { type: 'qr_scan_camera' } as any;
                break;
            case 'qr_scan_image': {
                const qrSource = block.getFieldValue('SOURCE') || '';
                step = { type: 'qr_scan_image', source: qrSource } as any;
                break;
            }
            case 'physics_start':
                step = { type: 'physics_start' } as any;
                break;
            case 'physics_stop':
                step = { type: 'physics_stop' } as any;
                break;
            case 'physics_set_gravity': {
                const pgx = Number(block.getFieldValue('GX') || 0);
                const pgy = Number(block.getFieldValue('GY') || 1);
                step = { type: 'physics_set_gravity', gx: pgx, gy: pgy } as any;
                break;
            }
            case 'physics_add_body': {
                const pbSprite = block.getFieldValue('SPRITE') || '';
                step = { type: 'physics_add_body', spriteId: pbSprite } as any;
                break;
            }
            case 'physics_add_force': {
                const pfSprite = block.getFieldValue('SPRITE') || '';
                const pfx = Number(block.getFieldValue('FX') || 0);
                const pfy = Number(block.getFieldValue('FY') || -0.01);
                step = { type: 'physics_add_force', spriteId: pfSprite, fx: pfx, fy: pfy } as any;
                break;
            }
            case 'physics_set_bounce': {
                const pbVal = Number(block.getFieldValue('VALUE') || 0.5);
                step = { type: 'physics_set_bounce', value: pbVal } as any;
                break;
            }
            case 'physics_set_mass': {
                const pmVal = Number(block.getFieldValue('VALUE') || 1);
                step = { type: 'physics_set_mass', value: pmVal } as any;
                break;
            }
            case 'physics_set_static': {
                const psSprite = block.getFieldValue('SPRITE') || '';
                const psVal = block.getFieldValue('VALUE') || 'no';
                step = { type: 'physics_set_static', spriteId: psSprite, value: psVal } as any;
                break;
            }
            case 'makey_set_key': {
                const mmSignal = block.getFieldValue('SIGNAL') || '';
                const mmKey = block.getFieldValue('KEY') || '';
                step = { type: 'mm_set_key', signal: mmSignal, key: mmKey } as any;
                break;
            }

            case 'music_set_instrument': {
                const instrument = Number(block.getFieldValue('INST') || 1);
                step = { type: 'music_set_instrument', instrument } as any;
                break;
            }
            case 'music_play_drum': {
                const drum = Number(block.getFieldValue('DRUM') || 1);
                const beats = Number(block.getFieldValue('BEATS') || 0.25);
                step = { type: 'music_play_drum', drum, beats } as any;
                break;
            }
            case 'music_set_tempo': {
                const bpm = Number(block.getFieldValue('BPM') || 60);
                step = { type: 'music_set_tempo', bpm } as any;
                break;
            }
            case 'music_change_tempo': {
                const amount = Number(block.getFieldValue('AMOUNT') || 20);
                step = { type: 'music_change_tempo', amount } as any;
                break;
            }
            case 'music_rest': {
                const beats = Number(block.getFieldValue('BEATS') || 0.25);
                step = { type: 'music_rest', beats } as any;
                break;
            }

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
