/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from '../blockly/runtime';

// ═══════════════════════════════════════════════════════════════════════════
// PYTHON CODE GENERATOR - Custom generator for LeapBlocks animation blocks
// Deferred initialization to avoid TDZ errors from webpack chunk splitting.
// ═══════════════════════════════════════════════════════════════════════════

// Order of operations (similar to Python precedence)
const ORDER_NONE = 99;
const ORDER_LOWEST = 0;

function statementToCode(gen: any, block: Blockly.Block, code: string): string {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    if (nextBlock) {
        const nextCode = gen.blockToCode(nextBlock) as string;
        return code + nextCode;
    }
    return code;
}

function indentCode(code: string): string {
    const lines = code.split('\n');
    const indented = lines.map(line => line ? '    ' + line : line);
    return indented.join('\n');
}

let _pythonGenerator: any = null;

export const pythonGenerator = new Proxy({} as any, {
    get(_target, prop) {
        if (!_pythonGenerator) {
            initPythonGenerator();
        }
        const value = _pythonGenerator[prop];
        return typeof value === 'function' ? value.bind(_pythonGenerator) : value;
    },
    set(_target, prop, value) {
        if (!_pythonGenerator) {
            initPythonGenerator();
        }
        _pythonGenerator[prop] = value;
        return true;
    }
});

export function initPythonGenerator(): void {
    if (_pythonGenerator) return;

    console.log('[GENERATOR] Initializing Python generator for animation blocks...');

    // Create Python generator as a separate object instead of attaching to frozen Blockly
    _pythonGenerator = {
        forBlock: {},
        workspaceToCode: function (workspace: Blockly.Workspace) {
            // Default implementation if not overridden below
            return '';
        },
        blockToCode: function (block: Blockly.Block) { return ''; },
        valueToCode: function (block: Blockly.Block, name: string, order: number) { return ''; },
        statementToCode: function (block: Blockly.Block, name: string) { return ''; },
        scrub_: function (block: Blockly.Block, code: string) { return code; },
        INDENT: '    ',
        defineMethods: function (definitions: any) { },
        finish: function () { return ''; },
        init: function () { }
    };

    const pythonGen = _pythonGenerator;

    // ═══════════════════════════════════════════════════════════════════════════
    // MOTION BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════

    pythonGen.forBlock['motion_move_steps'] = function (block: Blockly.Block): string {
        const steps = block.getFieldValue('STEPS');
        return `sprite.move(${steps})\n`;
    };

    pythonGen.forBlock['motion_turn_right'] = function (block: Blockly.Block): string {
        const degrees = block.getFieldValue('DEGREES');
        return `sprite.turn_right(${degrees})\n`;
    };

    pythonGen.forBlock['motion_turn_left'] = function (block: Blockly.Block): string {
        const degrees = block.getFieldValue('DEGREES');
        return `sprite.turn_left(${degrees})\n`;
    };

    pythonGen.forBlock['motion_go_to_xy'] = function (block: Blockly.Block): string {
        const gen = this;
        const x = gen.valueToCode(block, 'X', ORDER_NONE) || '0';
        const y = gen.valueToCode(block, 'Y', ORDER_NONE) || '0';
        return `sprite.go_to_xy(${x}, ${y})\n`;
    };

    pythonGen.forBlock['motion_glide_to_xy'] = function (block: Blockly.Block): string {
        const gen = this;
        const secs = block.getFieldValue('SECS');
        const x = gen.valueToCode(block, 'X', ORDER_NONE) || '0';
        const y = gen.valueToCode(block, 'Y', ORDER_NONE) || '0';
        return `await sprite.glide_to_xy(${secs}, ${x}, ${y})\n`;
    };

    pythonGen.forBlock['motion_point_direction'] = function (block: Blockly.Block): string {
        const gen = this;
        const direction = gen.valueToCode(block, 'DIRECTION', ORDER_NONE) || '0';
        return `sprite.point_in_direction(${direction})\n`;
    };

    pythonGen.forBlock['motion_change_x'] = function (block: Blockly.Block): string {
        const gen = this;
        const dx = gen.valueToCode(block, 'DX', ORDER_NONE) || '0';
        return `sprite.change_x(${dx})\n`;
    };

    pythonGen.forBlock['motion_change_y'] = function (block: Blockly.Block): string {
        const gen = this;
        const dy = gen.valueToCode(block, 'DY', ORDER_NONE) || '0';
        return `sprite.change_y(${dy})\n`;
    };

    pythonGen.forBlock['motion_set_x'] = function (block: Blockly.Block): string {
        const gen = this;
        const x = gen.valueToCode(block, 'X', ORDER_NONE) || '0';
        return `sprite.set_x(${x})\n`;
    };

    pythonGen.forBlock['motion_set_y'] = function (block: Blockly.Block): string {
        const gen = this;
        const y = gen.valueToCode(block, 'Y', ORDER_NONE) || '0';
        return `sprite.set_y(${y})\n`;
    };

    pythonGen.forBlock['motion_go_to'] = function (block: Blockly.Block): string {
        const target = block.getFieldValue('TO');
        if (target === 'random' || target === '_random_') {
            return `sprite.go_to_random()\n`;
        } else if (target === 'mouse' || target === '_mouse_') {
            return `sprite.go_to_mouse()\n`;
        } else {
            return `sprite.go_to_sprite("${target}")\n`;
        }
    };

    pythonGen.forBlock['motion_glide_to'] = function (block: Blockly.Block): string {
        const gen = this;
        const secs = block.getFieldValue('SECS');
        const target = block.getFieldValue('TO');
        if (target === 'random' || target === '_random_') {
            return `await sprite.glide_to_random(${secs})\n`;
        } else if (target === 'mouse' || target === '_mouse_') {
            return `await sprite.glide_to_mouse(${secs})\n`;
        } else {
            return `await sprite.glide_to_sprite(${secs}, "${target}")\n`;
        }
    };

    pythonGen.forBlock['motion_point_towards'] = function (block: Blockly.Block): string {
        const towards = block.getFieldValue('TOWARDS');
        if (towards === 'mouse') {
            return `sprite.point_towards_mouse()\n`;
        } else if (towards === 'random') {
            return `sprite.point_towards_random()\n`;
        } else {
            return `sprite.point_towards_sprite("${towards}")\n`;
        }
    };

    pythonGen.forBlock['motion_if_on_edge_bounce'] = function (block: Blockly.Block): string {
        return `sprite.if_on_edge_bounce()\n`;
    };

    pythonGen.forBlock['motion_set_rotation_style'] = function (block: Blockly.Block): string {
        const style = block.getFieldValue('STYLE');
        return `sprite.set_rotation_style("${style}")\n`;
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // LOOKS BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════

    pythonGen.forBlock['looks_say'] = function (block: Blockly.Block): string {
        const gen = this;
        const message = gen.valueToCode(block, 'MESSAGE', ORDER_NONE) || '""';
        return `sprite.say(${message})\n`;
    };

    pythonGen.forBlock['looks_say_for_secs'] = function (block: Blockly.Block): string {
        const gen = this;
        const message = gen.valueToCode(block, 'MESSAGE', ORDER_NONE) || '""';
        const secs = block.getFieldValue('SECS');
        return `sprite.say(${message}, ${secs})\n`;
    };

    pythonGen.forBlock['looks_think'] = function (block: Blockly.Block): string {
        const gen = this;
        const message = gen.valueToCode(block, 'MESSAGE', ORDER_NONE) || '""';
        return `sprite.think(${message})\n`;
    };

    pythonGen.forBlock['looks_think_for_secs'] = function (block: Blockly.Block): string {
        const gen = this;
        const message = gen.valueToCode(block, 'MESSAGE', ORDER_NONE) || '""';
        const secs = block.getFieldValue('SECS');
        return `sprite.think(${message}, ${secs})\n`;
    };

    pythonGen.forBlock['looks_switch_costume'] = function (block: Blockly.Block): string {
        const costume = block.getFieldValue('COSTUME');
        return `sprite.switch_costume("${costume}")\n`;
    };

    pythonGen.forBlock['looks_next_costume'] = function (block: Blockly.Block): string {
        return `sprite.next_costume()\n`;
    };

    pythonGen.forBlock['looks_switch_backdrop'] = function (block: Blockly.Block): string {
        const backdrop = block.getFieldValue('BACKDROP');
        return `stage.switch_backdrop("${backdrop}")\n`;
    };

    pythonGen.forBlock['looks_next_backdrop'] = function (block: Blockly.Block): string {
        return `stage.next_backdrop()\n`;
    };

    pythonGen.forBlock['looks_change_size_by'] = function (block: Blockly.Block): string {
        const gen = this;
        const change = gen.valueToCode(block, 'CHANGE', ORDER_NONE) || '0';
        return `sprite.change_size(${change})\n`;
    };

    pythonGen.forBlock['looks_set_size'] = function (block: Blockly.Block): string {
        const gen = this;
        const size = gen.valueToCode(block, 'SIZE', ORDER_NONE) || '100';
        return `sprite.set_size(${size})\n`;
    };

    pythonGen.forBlock['looks_change_effect_by'] = function (block: Blockly.Block): string {
        const effect = block.getFieldValue('EFFECT');
        const gen = this;
        const change = gen.valueToCode(block, 'CHANGE', ORDER_NONE) || '0';
        return `sprite.change_effect("${effect}", ${change})\n`;
    };

    pythonGen.forBlock['looks_set_effect'] = function (block: Blockly.Block): string {
        const effect = block.getFieldValue('EFFECT');
        const gen = this;
        const value = gen.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
        return `sprite.set_effect("${effect}", ${value})\n`;
    };

    pythonGen.forBlock['looks_clear_effects'] = function (block: Blockly.Block): string {
        return `sprite.clear_effects()\n`;
    };

    pythonGen.forBlock['looks_show'] = function (block: Blockly.Block): string {
        return `sprite.show()\n`;
    };

    pythonGen.forBlock['looks_hide'] = function (block: Blockly.Block): string {
        return `sprite.hide()\n`;
    };

    // Reporter blocks (return values)
    pythonGen.forBlock['looks_costume_number'] = function (block: Blockly.Block): string {
        return 'sprite.get_costume_number()';
    };

    pythonGen.forBlock['looks_costume_name'] = function (block: Blockly.Block): string {
        return 'sprite.get_costume_name()';
    };

    pythonGen.forBlock['looks_backdrop_number'] = function (block: Blockly.Block): string {
        return 'stage.get_backdrop_number()';
    };

    pythonGen.forBlock['looks_backdrop_name'] = function (block: Blockly.Block): string {
        return 'stage.get_backdrop_name()';
    };

    pythonGen.forBlock['looks_size'] = function (block: Blockly.Block): string {
        return 'sprite.get_size()';
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUND BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════

    pythonGen.forBlock['sound_play'] = function (block: Blockly.Block): string {
        const sound = block.getFieldValue('SOUND');
        return `sprite.play_sound("${sound}")\n`;
    };

    pythonGen.forBlock['sound_play_until_done'] = function (block: Blockly.Block): string {
        const sound = block.getFieldValue('SOUND');
        return `await sprite.play_sound_until_done("${sound}")\n`;
    };

    pythonGen.forBlock['sound_stop_all'] = function (block: Blockly.Block): string {
        return `sprite.stop_all_sounds()\n`;
    };

    pythonGen.forBlock['sound_set_volume'] = function (block: Blockly.Block): string {
        const gen = this;
        const volume = gen.valueToCode(block, 'VOLUME', ORDER_NONE) || '100';
        return `sprite.set_volume(${volume})\n`;
    };

    pythonGen.forBlock['sound_change_volume'] = function (block: Blockly.Block): string {
        const gen = this;
        const change = gen.valueToCode(block, 'CHANGE', ORDER_NONE) || '0';
        return `sprite.change_volume(${change})\n`;
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTROL BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════

    pythonGen.forBlock['control_wait'] = function (block: Blockly.Block): string {
        const secs = block.getFieldValue('SECS');
        return `await asyncio.sleep(${secs})\n`;
    };

    pythonGen.forBlock['control_repeat'] = function (block: Blockly.Block): string {
        const gen = this;
        const times = gen.valueToCode(block, 'TIMES', ORDER_NONE) || '10';
        const branch = gen.statementToCode(block, 'DO');
        if (branch) {
            return `for _ in range(${times}):\n${indentCode(branch)}\n`;
        }
        return '';
    };

    pythonGen.forBlock['control_forever'] = function (block: Blockly.Block): string {
        const gen = this;
        const branch = gen.statementToCode(block, 'DO');
        if (branch) {
            return `while True:\n${indentCode(branch)}\n`;
        }
        return '';
    };

    pythonGen.forBlock['control_if'] = function (block: Blockly.Block): string {
        const gen = this;
        const condition = gen.valueToCode(block, 'CONDITION', ORDER_NONE) || 'True';
        const branch = gen.statementToCode(block, 'DO');
        if (branch) {
            return `if ${condition}:\n${indentCode(branch)}\n`;
        }
        return '';
    };

    pythonGen.forBlock['control_if_else'] = function (block: Blockly.Block): string {
        const gen = this;
        const condition = gen.valueToCode(block, 'CONDITION', ORDER_NONE) || 'True';
        const thenBranch = gen.statementToCode(block, 'DO0');
        const elseBranch = gen.statementToCode(block, 'DO1');
        let code = `if ${condition}:\n`;
        if (thenBranch) {
            code += indentCode(thenBranch) + '\n';
        }
        code += 'else:\n';
        if (elseBranch) {
            code += indentCode(elseBranch) + '\n';
        }
        return code;
    };

    pythonGen.forBlock['control_wait_until'] = function (block: Blockly.Block): string {
        const gen = this;
        const condition = gen.valueToCode(block, 'CONDITION', ORDER_NONE) || 'True';
        return `while not ${condition}:\n    await asyncio.sleep(0.1)\n`;
    };

    pythonGen.forBlock['control_repeat_until'] = function (block: Blockly.Block): string {
        const gen = this;
        const condition = gen.valueToCode(block, 'CONDITION', ORDER_NONE) || 'False';
        const branch = gen.statementToCode(block, 'DO');
        if (branch) {
            return `while not ${condition}:\n${indentCode(branch)}\n`;
        }
        return '';
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CLONE BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════

    pythonGen.forBlock['control_create_clone'] = function (block: Blockly.Block): string {
        const target = block.getFieldValue('CLONE_OPTION');
        if (target === 'myself' || target === '_myself_') {
            return `sprite.create_clone()\n`;
        } else {
            return `sprite.create_clone_of("${target}")\n`;
        }
    };

    pythonGen.forBlock['control_delete_clone'] = function (block: Blockly.Block): string {
        return `sprite.delete_this_clone()\n`;
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // PEN BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════

    pythonGen.forBlock['pen_clear'] = function (block: Blockly.Block): string {
        return `pen.clear()\n`;
    };

    pythonGen.forBlock['pen_stamp'] = function (block: Blockly.Block): string {
        return `pen.stamp()\n`;
    };

    pythonGen.forBlock['pen_penDown'] = function (block: Blockly.Block): string {
        return `pen.down()\n`;
    };

    pythonGen.forBlock['pen_penUp'] = function (block: Blockly.Block): string {
        return `pen.up()\n`;
    };

    pythonGen.forBlock['pen_setPenColorToColor'] = function (block: Blockly.Block): string {
        const color = block.getFieldValue('COLOR');
        return `pen.set_color("${color}")\n`;
    };

    pythonGen.forBlock['pen_changePenSizeBy'] = function (block: Blockly.Block): string {
        const gen = this;
        const size = gen.valueToCode(block, 'SIZE', ORDER_NONE) || '1';
        return `pen.change_size(${size})\n`;
    };

    pythonGen.forBlock['pen_setPenSizeTo'] = function (block: Blockly.Block): string {
        const gen = this;
        const size = gen.valueToCode(block, 'SIZE', ORDER_NONE) || '1';
        return `pen.set_size(${size})\n`;
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT BLOCKS - Generate async def functions
    // ═══════════════════════════════════════════════════════════════════════════

    function getEventHandlerName(blockType: string): string | null {
        switch (blockType) {
            case 'event_flag_clicked': return 'when_green_flag_clicked';
            case 'event_sprite_clicked': return 'when_sprite_clicked';
            case 'event_key_pressed': return 'when_key_pressed';
            case 'event_clone_start': return 'when_i_start_as_a_clone';
            default: return null;
        }
    }

    // Override workspaceToCode to generate proper Python structure
    const originalWorkspaceToCode = pythonGen.workspaceToCode;
    pythonGen.workspaceToCode = function (workspace: Blockly.Workspace): string {
        if (!workspace) return '';

        const blocks = workspace.getTopBlocks(true);
        const hatBlocks = blocks.filter(b =>
            b.type.startsWith('event_') ||
            b.type === 'arduino_setup' ||
            b.type === 'arduino_loop'
        );
        const otherBlocks = blocks.filter(b => !hatBlocks.includes(b));

        let code = '# LeapBlocks Python Code\n';
        code += '# Generated from animation blocks\n\n';
        code += 'import asyncio\n';
        code += 'from leapblocks import Sprite, Stage, Pen\n\n';
        code += '# Create sprite and stage\n';
        code += 'sprite = Sprite("sprite1")\n';
        code += 'stage = Stage()\n';
        code += 'pen = Pen(sprite)\n\n';

        if (hatBlocks.length > 0) {
            code += '# ════════════════════════════════════════════════════════════\n';
            code += '# Event Handlers\n';
            code += '# ════════════════════════════════════════════════════════════\n\n';

            for (const block of hatBlocks) {
                const handlerName = getEventHandlerName(block.type);
                if (handlerName) {
                    // For event blocks, generate a function definition
                    const branch = this.statementToCode(block, 'DO');
                    code += `async def ${handlerName}():`;
                    if (branch && branch.trim()) {
                        code += '\n' + indentCode(branch) + '\n';
                    } else {
                        code += ' pass\n';
                    }
                    code += '\n';
                } else {
                    // Other hat blocks (like arduino_setup) use default generator
                    const blockCode = this.blockToCode(block) as string;
                    if (blockCode) {
                        code += blockCode + '\n';
                    }
                }
            }
            code += '\n';
        }

        if (otherBlocks.length > 0) {
            code += '# ════════════════════════════════════════════════════════════\n';
            code += '# Main Code\n';
            code += '# ════════════════════════════════════════════════════════════\n\n';
            code += 'async def main():\n';

            let mainBody = '';
            for (const block of otherBlocks) {
                const blockCode = this.blockToCode(block) as string;
                if (blockCode) {
                    mainBody += blockCode;
                }
            }

            if (mainBody.trim()) {
                code += indentCode(mainBody) + '\n';
            } else {
                code += '    pass\n';
            }
            code += '\nif __name__ == "__main__":\n';
            code += '    asyncio.run(main())\n';
        }

        return code;
    };

    console.log('[GENERATOR] Python generator extensions loaded successfully');
}
