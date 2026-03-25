import * as Blockly from '@blockly-runtime';
import { CompiledScript, ScriptStep } from '../vm/AnimationVM';

// ═══════════════════════════════════════════════════════════════════════════
// JUNIOR GENERATOR - Compiles junior blocks to executable scripts
// ═══════════════════════════════════════════════════════════════════════════

// Logging utility for JuniorCompiler
const juniorLog = {
    info: (msg: string, data?: any) => console.log(`[JuniorCompiler] ${msg}`, data ?? ''),
    block: (type: string, result?: string) => console.log(`[JuniorCompiler.Block] ${type} → ${result ?? 'compiled'}`),
    warn: (msg: string, data?: any) => console.warn(`[JuniorCompiler.Warn] ${msg}`, data ?? ''),
};

export class JuniorCompiler {
    private spriteId: string;

    constructor(spriteId: string) {
        this.spriteId = spriteId;
        juniorLog.info(`Junior Compiler created for sprite: ${spriteId}`);
    }

    compile(workspace: Blockly.Workspace): CompiledScript[] {
        const scripts: CompiledScript[] = [];
        const topBlocks = workspace.getTopBlocks(true);

        juniorLog.info('═══════════════════════════════════════════════════════');
        juniorLog.info(`Compiling Junior workspace for sprite: ${this.spriteId}`);
        juniorLog.info(`Found ${topBlocks.length} top-level blocks`);

        for (const block of topBlocks) {
            juniorLog.block(block.type, 'processing...');
            const script = this.compileTopBlock(block);
            if (script) {
                juniorLog.info(`  ✓ Compiled: trigger=${script.trigger}, steps=${script.steps.length}`);
                script.steps.forEach((step, i) => {
                    juniorLog.info(`    Step ${i + 1}: ${step.type}`);
                });
                scripts.push(script);
            } else {
                juniorLog.info(`  ✗ Skipped (not a start block)`);
            }
        }

        juniorLog.info(`Total compiled scripts: ${scripts.length}`);
        juniorLog.info('═══════════════════════════════════════════════════════');

        return scripts;
    }

    private compileTopBlock(block: Blockly.Block): CompiledScript | null {
        let trigger: 'flag' | 'sprite_click' | 'key';

        juniorLog.block(block.type, 'checking trigger type...');

        switch (block.type) {
            case 'junior_event_start':
                trigger = 'flag';
                juniorLog.info(`  Trigger: flag (🚀 START)`);
                break;
            case 'junior_event_click':
                trigger = 'sprite_click';
                juniorLog.info(`  Trigger: sprite_click (👆 WHEN CLICKED)`);
                break;
            default:
                juniorLog.info(`  Not a start block, returning null`);
                return null; // Not an event block
        }

        const steps: ScriptStep[] = [];
        let nextBlock = block.getNextBlock();
        let stepCount = 0;
        while (nextBlock) {
            stepCount++;
            juniorLog.block(nextBlock.type, `compiling step ${stepCount}...`);
            const step = this.compileBlock(nextBlock);
            if (step) {
                juniorLog.info(`    → ${step.type}`);
                steps.push(step);
            }
            nextBlock = nextBlock.getNextBlock();
        }

        juniorLog.info(`  Compiled ${steps.length} steps`);
        return { trigger, spriteId: this.spriteId, steps };
    }

    private compileBlock(block: Blockly.Block): ScriptStep | null {
        switch (block.type) {
            // Motion - Junior blocks use fixed values for simplicity
            case 'junior_move_forward':
                return { type: 'move_steps', steps: 50 };
            case 'junior_move_backward':
                return { type: 'move_steps', steps: -50 };
            case 'junior_turn_right':
                return { type: 'turn_right', degrees: 90 };
            case 'junior_turn_left':
                return { type: 'turn_left', degrees: 90 };
            case 'junior_jump':
                // Jump is simulated as a quick up-down motion
                return { type: 'go_to_xy', x: 0, y: 50 }; // Simplified - in real implementation would animate
            case 'junior_go_home':
                return { type: 'go_to_xy', x: 0, y: 0 };

            // Looks
            case 'junior_say_hello':
                return { type: 'say_for_secs', message: 'Hello! 👋', secs: 2 };
            case 'junior_say_goodbye':
                return { type: 'say_for_secs', message: 'Goodbye! 💫', secs: 2 };
            case 'junior_grow':
                return { type: 'change_size', change: 20 };
            case 'junior_shrink':
                return { type: 'change_size', change: -20 };
            case 'junior_show':
                return { type: 'show' };
            case 'junior_hide':
                return { type: 'hide' };
            case 'junior_change_costume':
                return { type: 'next_costume' };

            // Sound
            case 'junior_play_pop':
                return { type: 'play_sound', sound: 'pop' };
            case 'junior_play_meow':
                return { type: 'play_sound', sound: 'meow' };
            case 'junior_play_boing':
                return { type: 'play_sound', sound: 'boing' };

            // Control
            case 'junior_wait':
                return { type: 'wait', secs: 1 }; // Fixed 1 second wait
            case 'junior_repeat_3':
                return { type: 'repeat', times: 3, body: this.compileStatementInput(block, 'DO') };
            case 'junior_repeat_forever':
                return { type: 'forever', body: this.compileStatementInput(block, 'DO') };

            default:
                juniorLog.warn(`Unknown block type: ${block.type}`);
                return null;
        }
    }

    private compileStatementInput(block: Blockly.Block, inputName: string): ScriptStep[] {
        juniorLog.info(`  Compiling statement input: ${inputName}`);
        const steps: ScriptStep[] = [];
        const input = block.getInput(inputName);
        if (!input) {
            juniorLog.warn(`  No input found: ${inputName}`);
            return steps;
        }

        let innerBlock = input.connection?.targetBlock();
        let innerCount = 0;
        while (innerBlock) {
            innerCount++;
            juniorLog.block(innerBlock.type, `inner step ${innerCount}`);
            const step = this.compileBlock(innerBlock);
            if (step) {
                juniorLog.info(`      → ${step.type}`);
                steps.push(step);
            }
            innerBlock = innerBlock.getNextBlock();
        }

        juniorLog.info(`  Statement input compiled: ${steps.length} steps`);
        return steps;
    }
}
