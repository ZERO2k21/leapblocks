/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * leapCodex/server/generators/pythonGenerator.ts
 * Python code generator for LeapBlocks animation blocks.
 * Deferred initialization to avoid TDZ errors from webpack chunk splitting.
 */
import Blockly from '../../../leapembed/server/blockly/runtime';

// ═══════════════════════════════════════════════════════════════════════════
// PYTHON CODE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

const ORDER_NONE = 99;

function indentCode(code: string): string {
    return code
        .split('\n')
        .map(line => (line ? '    ' + line : line))
        .join('\n');
}

let _pythonGenerator: any = null;

/** Lazy proxy — safe to import at module scope without triggering TDZ errors. */
export const pythonGenerator = new Proxy({} as any, {
    get(_target, prop) {
        if (!_pythonGenerator) initPythonGenerator();
        const value = _pythonGenerator[prop];
        return typeof value === 'function' ? value.bind(_pythonGenerator) : value;
    },
    set(_target, prop, value) {
        if (!_pythonGenerator) initPythonGenerator();
        _pythonGenerator[prop] = value;
        return true;
    },
});

export function initPythonGenerator(): void {
    if (_pythonGenerator) return;

    console.log('[LeapCodex] Initializing Python generator...');

    _pythonGenerator = {
        forBlock: {},
        workspaceToCode: (_workspace: Blockly.Workspace) => '',
        blockToCode: (_block: Blockly.Block) => '',
        valueToCode: (_block: Blockly.Block, _name: string, _order: number) => '',
        statementToCode: (_block: Blockly.Block, _name: string) => '',
        scrub_: (_block: Blockly.Block, code: string) => code,
        INDENT: '    ',
        defineMethods: (_defs: any) => { },
        finish: () => '',
        init: () => { },
    };

    const gen = _pythonGenerator;

    // ─── Motion ──────────────────────────────────────────────────────────────

    gen.forBlock['motion_move_steps'] = (b: Blockly.Block) =>
        `sprite.move(${b.getFieldValue('STEPS')})\n`;

    gen.forBlock['motion_turn_right'] = (b: Blockly.Block) =>
        `sprite.turn_right(${b.getFieldValue('DEGREES')})\n`;

    gen.forBlock['motion_turn_left'] = (b: Blockly.Block) =>
        `sprite.turn_left(${b.getFieldValue('DEGREES')})\n`;

    gen.forBlock['motion_go_to_xy'] = function (b: Blockly.Block) {
        const x = this.valueToCode(b, 'X', ORDER_NONE) || '0';
        const y = this.valueToCode(b, 'Y', ORDER_NONE) || '0';
        return `sprite.go_to_xy(${x}, ${y})\n`;
    };

    gen.forBlock['motion_glide_to_xy'] = function (b: Blockly.Block) {
        const secs = b.getFieldValue('SECS');
        const x = this.valueToCode(b, 'X', ORDER_NONE) || '0';
        const y = this.valueToCode(b, 'Y', ORDER_NONE) || '0';
        return `await sprite.glide_to_xy(${secs}, ${x}, ${y})\n`;
    };

    gen.forBlock['motion_point_direction'] = function (b: Blockly.Block) {
        const dir = this.valueToCode(b, 'DIRECTION', ORDER_NONE) || '0';
        return `sprite.point_in_direction(${dir})\n`;
    };

    gen.forBlock['motion_change_x'] = function (b: Blockly.Block) {
        return `sprite.change_x(${this.valueToCode(b, 'DX', ORDER_NONE) || '0'})\n`;
    };

    gen.forBlock['motion_change_y'] = function (b: Blockly.Block) {
        return `sprite.change_y(${this.valueToCode(b, 'DY', ORDER_NONE) || '0'})\n`;
    };

    gen.forBlock['motion_set_x'] = function (b: Blockly.Block) {
        return `sprite.set_x(${this.valueToCode(b, 'X', ORDER_NONE) || '0'})\n`;
    };

    gen.forBlock['motion_set_y'] = function (b: Blockly.Block) {
        return `sprite.set_y(${this.valueToCode(b, 'Y', ORDER_NONE) || '0'})\n`;
    };

    gen.forBlock['motion_go_to'] = (b: Blockly.Block) => {
        const t = b.getFieldValue('TO');
        if (t === 'random' || t === '_random_') return `sprite.go_to_random()\n`;
        if (t === 'mouse' || t === '_mouse_') return `sprite.go_to_mouse()\n`;
        return `sprite.go_to_sprite("${t}")\n`;
    };

    gen.forBlock['motion_glide_to'] = (b: Blockly.Block) => {
        const secs = b.getFieldValue('SECS');
        const t = b.getFieldValue('TO');
        if (t === 'random' || t === '_random_') return `await sprite.glide_to_random(${secs})\n`;
        if (t === 'mouse' || t === '_mouse_') return `await sprite.glide_to_mouse(${secs})\n`;
        return `await sprite.glide_to_sprite(${secs}, "${t}")\n`;
    };

    gen.forBlock['motion_point_towards'] = (b: Blockly.Block) => {
        const t = b.getFieldValue('TOWARDS');
        if (t === 'mouse') return `sprite.point_towards_mouse()\n`;
        if (t === 'random') return `sprite.point_towards_random()\n`;
        return `sprite.point_towards_sprite("${t}")\n`;
    };

    gen.forBlock['motion_if_on_edge_bounce'] = () => `sprite.if_on_edge_bounce()\n`;

    gen.forBlock['motion_set_rotation_style'] = (b: Blockly.Block) =>
        `sprite.set_rotation_style("${b.getFieldValue('STYLE')}")\n`;

    // ─── Looks ───────────────────────────────────────────────────────────────

    gen.forBlock['looks_say'] = function (b: Blockly.Block) {
        return `sprite.say(${this.valueToCode(b, 'MESSAGE', ORDER_NONE) || '""'})\n`;
    };

    gen.forBlock['looks_say_for_secs'] = function (b: Blockly.Block) {
        const msg = this.valueToCode(b, 'MESSAGE', ORDER_NONE) || '""';
        return `sprite.say(${msg}, ${b.getFieldValue('SECS')})\n`;
    };

    gen.forBlock['looks_think'] = function (b: Blockly.Block) {
        return `sprite.think(${this.valueToCode(b, 'MESSAGE', ORDER_NONE) || '""'})\n`;
    };

    gen.forBlock['looks_think_for_secs'] = function (b: Blockly.Block) {
        const msg = this.valueToCode(b, 'MESSAGE', ORDER_NONE) || '""';
        return `sprite.think(${msg}, ${b.getFieldValue('SECS')})\n`;
    };

    gen.forBlock['looks_switch_costume'] = (b: Blockly.Block) =>
        `sprite.switch_costume("${b.getFieldValue('COSTUME')}")\n`;

    gen.forBlock['looks_next_costume'] = () => `sprite.next_costume()\n`;

    gen.forBlock['looks_switch_backdrop'] = (b: Blockly.Block) =>
        `stage.switch_backdrop("${b.getFieldValue('BACKDROP')}")\n`;

    gen.forBlock['looks_next_backdrop'] = () => `stage.next_backdrop()\n`;

    gen.forBlock['looks_change_size_by'] = function (b: Blockly.Block) {
        return `sprite.change_size(${this.valueToCode(b, 'CHANGE', ORDER_NONE) || '0'})\n`;
    };

    gen.forBlock['looks_set_size'] = function (b: Blockly.Block) {
        return `sprite.set_size(${this.valueToCode(b, 'SIZE', ORDER_NONE) || '100'})\n`;
    };

    gen.forBlock['looks_change_effect_by'] = function (b: Blockly.Block) {
        const fx = b.getFieldValue('EFFECT');
        return `sprite.change_effect("${fx}", ${this.valueToCode(b, 'CHANGE', ORDER_NONE) || '0'})\n`;
    };

    gen.forBlock['looks_set_effect'] = function (b: Blockly.Block) {
        const fx = b.getFieldValue('EFFECT');
        return `sprite.set_effect("${fx}", ${this.valueToCode(b, 'VALUE', ORDER_NONE) || '0'})\n`;
    };

    gen.forBlock['looks_clear_effects'] = () => `sprite.clear_effects()\n`;
    gen.forBlock['looks_show'] = () => `sprite.show()\n`;
    gen.forBlock['looks_hide'] = () => `sprite.hide()\n`;

    // Reporters
    gen.forBlock['looks_costume_number'] = () => 'sprite.get_costume_number()';
    gen.forBlock['looks_costume_name'] = () => 'sprite.get_costume_name()';
    gen.forBlock['looks_backdrop_number'] = () => 'stage.get_backdrop_number()';
    gen.forBlock['looks_backdrop_name'] = () => 'stage.get_backdrop_name()';
    gen.forBlock['looks_size'] = () => 'sprite.get_size()';

    // ─── Sound ───────────────────────────────────────────────────────────────

    gen.forBlock['sound_play'] = (b: Blockly.Block) =>
        `sprite.play_sound("${b.getFieldValue('SOUND')}")\n`;

    gen.forBlock['sound_play_until_done'] = (b: Blockly.Block) =>
        `await sprite.play_sound_until_done("${b.getFieldValue('SOUND')}")\n`;

    gen.forBlock['sound_stop_all'] = () => `sprite.stop_all_sounds()\n`;

    gen.forBlock['sound_set_volume'] = function (b: Blockly.Block) {
        return `sprite.set_volume(${this.valueToCode(b, 'VOLUME', ORDER_NONE) || '100'})\n`;
    };

    gen.forBlock['sound_change_volume'] = function (b: Blockly.Block) {
        return `sprite.change_volume(${this.valueToCode(b, 'CHANGE', ORDER_NONE) || '0'})\n`;
    };

    // ─── Control ─────────────────────────────────────────────────────────────

    gen.forBlock['control_wait'] = (b: Blockly.Block) =>
        `await asyncio.sleep(${b.getFieldValue('SECS')})\n`;

    gen.forBlock['control_repeat'] = function (b: Blockly.Block) {
        const times = this.valueToCode(b, 'TIMES', ORDER_NONE) || '10';
        const branch = this.statementToCode(b, 'DO');
        return branch ? `for _ in range(${times}):\n${indentCode(branch)}\n` : '';
    };

    gen.forBlock['control_forever'] = function (b: Blockly.Block) {
        const branch = this.statementToCode(b, 'DO');
        return branch ? `while True:\n${indentCode(branch)}\n` : '';
    };

    gen.forBlock['control_if'] = function (b: Blockly.Block) {
        const cond = this.valueToCode(b, 'CONDITION', ORDER_NONE) || 'True';
        const branch = this.statementToCode(b, 'DO');
        return branch ? `if ${cond}:\n${indentCode(branch)}\n` : '';
    };

    gen.forBlock['control_if_else'] = function (b: Blockly.Block) {
        const cond = this.valueToCode(b, 'CONDITION', ORDER_NONE) || 'True';
        const then = this.statementToCode(b, 'DO0');
        const els = this.statementToCode(b, 'DO1');
        let code = `if ${cond}:\n`;
        code += then ? indentCode(then) + '\n' : '    pass\n';
        code += 'else:\n';
        code += els ? indentCode(els) + '\n' : '    pass\n';
        return code;
    };

    gen.forBlock['control_wait_until'] = function (b: Blockly.Block) {
        const cond = this.valueToCode(b, 'CONDITION', ORDER_NONE) || 'True';
        return `while not ${cond}:\n    await asyncio.sleep(0.1)\n`;
    };

    gen.forBlock['control_repeat_until'] = function (b: Blockly.Block) {
        const cond = this.valueToCode(b, 'CONDITION', ORDER_NONE) || 'False';
        const branch = this.statementToCode(b, 'DO');
        return branch ? `while not ${cond}:\n${indentCode(branch)}\n` : '';
    };

    // ─── Clone ───────────────────────────────────────────────────────────────

    gen.forBlock['control_create_clone'] = (b: Blockly.Block) => {
        const t = b.getFieldValue('CLONE_OPTION');
        return (t === 'myself' || t === '_myself_')
            ? `sprite.create_clone()\n`
            : `sprite.create_clone_of("${t}")\n`;
    };

    gen.forBlock['control_delete_clone'] = () => `sprite.delete_this_clone()\n`;

    // ─── Pen ─────────────────────────────────────────────────────────────────

    gen.forBlock['pen_clear'] = () => `pen.clear()\n`;
    gen.forBlock['pen_stamp'] = () => `pen.stamp()\n`;
    gen.forBlock['pen_penDown'] = () => `pen.down()\n`;
    gen.forBlock['pen_penUp'] = () => `pen.up()\n`;

    gen.forBlock['pen_setPenColorToColor'] = (b: Blockly.Block) =>
        `pen.set_color("${b.getFieldValue('COLOR')}")\n`;

    gen.forBlock['pen_changePenSizeBy'] = function (b: Blockly.Block) {
        return `pen.change_size(${this.valueToCode(b, 'SIZE', ORDER_NONE) || '1'})\n`;
    };

    gen.forBlock['pen_setPenSizeTo'] = function (b: Blockly.Block) {
        return `pen.set_size(${this.valueToCode(b, 'SIZE', ORDER_NONE) || '1'})\n`;
    };

    // ─── Events / workspaceToCode ─────────────────────────────────────────────

    const EVENT_HANDLER_MAP: Record<string, string> = {
        event_flag_clicked: 'when_green_flag_clicked',
        event_sprite_clicked: 'when_sprite_clicked',
        event_key_pressed: 'when_key_pressed',
        event_clone_start: 'when_i_start_as_a_clone',
    };

    gen.workspaceToCode = function (workspace: Blockly.Workspace): string {
        if (!workspace) return '';

        const topBlocks = workspace.getTopBlocks(true);
        const hatBlocks = topBlocks.filter(b => b.type.startsWith('event_'));
        const otherBlocks = topBlocks.filter(b => !hatBlocks.includes(b));

        let code = '# LeapBlocks Python Code\n# Generated from animation blocks\n\n';
        code += 'import asyncio\nfrom leapblocks import Sprite, Stage, Pen\n\n';
        code += '# Create sprite and stage\n';
        code += 'sprite = Sprite("sprite1")\nstage = Stage()\npen = Pen(sprite)\n\n';

        if (hatBlocks.length > 0) {
            code += '# ════════════════════════════════════════════════════════════\n';
            code += '# Event Handlers\n';
            code += '# ════════════════════════════════════════════════════════════\n\n';

            for (const block of hatBlocks) {
                const handlerName = EVENT_HANDLER_MAP[block.type];
                if (handlerName) {
                    const branch = this.statementToCode(block, 'DO');
                    code += `async def ${handlerName}():\n`;
                    code += branch?.trim() ? indentCode(branch) + '\n' : '    pass\n';
                    code += '\n';
                } else {
                    const blockCode = this.blockToCode(block) as string;
                    if (blockCode) code += blockCode + '\n';
                }
            }
        }

        if (otherBlocks.length > 0) {
            code += '# ════════════════════════════════════════════════════════════\n';
            code += '# Main Code\n';
            code += '# ════════════════════════════════════════════════════════════\n\n';
            code += 'async def main():\n';

            let body = '';
            for (const block of otherBlocks) {
                const blockCode = this.blockToCode(block) as string;
                if (blockCode) body += blockCode;
            }

            code += body.trim() ? indentCode(body) + '\n' : '    pass\n';
            code += '\nif __name__ == "__main__":\n    asyncio.run(main())\n';
        }

        return code;
    };

    console.log('[LeapCodex] Python generator ready.');
}
