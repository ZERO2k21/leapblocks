import { ValidBlocks, Rules } from "./BlockRegistry";

interface ValidationResult {
    isValid: boolean;
    error?: string;
    victim?: any;
}

export class WorkspaceValidator {
    static validateWorkspace(workspace: any): ValidationResult {
        const blocks = workspace.getAllBlocks(false);

        const flagBlocks = blocks.filter((b: any) => b.type === 'event_flag');
        if (flagBlocks.length > 1) {
            return { isValid: false, error: "Only one Start (Green Flag) block allowed!", victim: flagBlocks[1] };
        }

        for (let block of blocks) {
            const def = (ValidBlocks as any)[block.type];
            if (!def) continue;

            if (def.shape === 'stack' || def.shape === 'c-block' || def.shape === 'cap') {
                return { isValid: false, error: "Blocks must be connected to a Start block!", victim: block };
            }
        }

        for (let block of blocks) {
            const res = this.validateStack(block);
            if (!res.isValid) return { ...res, victim: block };
        }

        return { isValid: true };
    }

    static validateStack(rootBlock: any): ValidationResult {
        if (!rootBlock) return { isValid: false, error: "No block provided" };

        return this.scanChildren(rootBlock, 0);
    }

    static scanChildren(block: any, loopDepth: number): ValidationResult {
        let current = block;
        while (current) {
            const def = (ValidBlocks as any)[current.type];
            let nextLoopDepth = loopDepth;

            if (def && def.isLoop) {
                nextLoopDepth++;
                if (nextLoopDepth > Rules.MaxLoopDepth) {
                    return { isValid: false, error: "Too many nested loops! Junior only allows 1 level." };
                }

                const times = current.getFieldValue("TIMES");
                if (times && parseInt(times) > 5) {
                    return { isValid: false, error: "Junior Rule: Max repeat is 5!" };
                }
            }

            if (current.inputList) {
                for (let input of current.inputList) {
                    if (input.type === 3) {
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
