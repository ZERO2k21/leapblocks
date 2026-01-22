import { ValidBlocks, Rules } from "./BlockRegistry";

/**
 * Validates a Workspace or a Stack of Blocks against Junior Rules.
 */


/**
 * Validates a Workspace or a Stack of Blocks against STRICT Junior Rules.
 */
export class WorkspaceValidator {

    /**
     * Validates an entire workspace state.
     * @param {Object} workspace - The Blockly Workspace instance.
     * @returns {Object} result - { isValid: boolean, error: string, victim: Block }
     */
    static validateWorkspace(workspace) {
        const blocks = workspace.getAllBlocks(false); // Top level blocks

        // 1. Hat Block Rules (Start)
        // Rule: onlyOne("start") -> Max 1 'event_flag'
        const flagBlocks = blocks.filter(b => b.type === 'event_flag');
        if (flagBlocks.length > 1) {
            return { isValid: false, error: "Only one Start (Green Flag) block allowed!", victim: flagBlocks[1] };
        }

        // 2. Orphan Check (Stack Blocks)
        // Rule: if (!insideStart(block)) reject();
        // We check every top-level block. If it's a Stack block (not Hat and not Reporter), it MUST be attached to a Hat.
        // In Blockly, 'top level' means no parent. If a stack block has no parent, it's orphan.
        for (let block of blocks) {
            const def = ValidBlocks[block.type];
            if (!def) continue;

            if (def.shape === 'stack' || def.shape === 'c-block' || def.shape === 'cap') {
                // It's a command block. It must be inside a Hat.
                // Since 'blocks' are top-level roots, if this block IS in this list, it has no parent.
                // So it is an orphan UNLESS it is a Hat.
                return { isValid: false, error: "Blocks must be connected to a Start block!", victim: block };
            }
        }

        // 3. Deep Scan for Loops
        for (let block of blocks) {
            const res = this.validateStack(block);
            if (!res.isValid) return { ...res, victim: block }; // Return error
        }

        return { isValid: true };
    }

    /**
     * scans a block stack to see if it's safe to run.
     * @param {Object} rootBlock - The Blockly Block object.
     * @returns {Object} result - { isValid: boolean, error: string }
     */
    static validateStack(rootBlock) {
        if (!rootBlock) return { isValid: false, error: "No block provided" };

        // Recursive scanner
        return this.scanChildren(rootBlock, 0);
    }

    // Recursive scanner
    static scanChildren(block, loopDepth) {
        let current = block;
        while (current) {
            const def = ValidBlocks[current.type];
            let nextLoopDepth = loopDepth;

            // Rule: Max Loop Nesting
            if (def && def.isLoop) {
                nextLoopDepth++;
                if (nextLoopDepth > Rules.MaxLoopDepth) {
                    return { isValid: false, error: "Too many nested loops! Junior only allows 1 level." };
                }

                // Rule: Max Repeat Count Check (Junior Rule: Max 5)
                // This assumes standard field naming 'TIMES'
                const times = current.getFieldValue("TIMES");
                if (times && parseInt(times) > 5) {
                    return { isValid: false, error: "Junior Rule: Max repeat is 5!" };
                }
            }

            // Check Inner Statements (C-inputs)
            if (current.inputList) {
                for (let input of current.inputList) {
                    if (input.type === 3) { // NEXT_STATEMENT (DO)
                        if (input.connection && input.connection.targetBlock()) {
                            const res = this.scanChildren(input.connection.targetBlock(), nextLoopDepth);
                            if (!res.isValid) return res;
                        }
                    }
                }
            }

            current = current.getNextBlock();
        }
        return { isValid: true };
    }
}
