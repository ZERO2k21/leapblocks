import { WorkspaceValidator } from "./WorkspaceValidator";

/**
 * Junior Interpreter Controller
 * managing threads and safe execution.
 */
export class Interpreter {
    constructor(workspaceRef, generator, callbacks) {
        this.workspaceRef = workspaceRef;
        this.generator = generator;
        this.callbacks = callbacks; // { onRun:(), onStop:(), ... }
        this.runningThreads = new Set();
        this.isActive = false;
    }

    start() {
        if (this.isActive) this.stopAll();
        this.isActive = true;

        // Notify State Manager (Visuals)
        if (this.callbacks.onRun) this.callbacks.onRun();
    }

    stopAll() {
        this.isActive = false;
        this.runningThreads.clear();
        if (this.callbacks.onStop) this.callbacks.onStop();
    }

    /**
     * Executes all stacks matching the criteria (e.g., Flag clicked)
     * @param {string} triggerType - 'event_flag' | 'event_press'
     * @param {string} spriteId - optional filter
     */
    async runStacks(triggerType, spriteId = null) {
        if (!this.workspaceRef.current) return;

        // Ensure we are active
        if (!this.isActive) this.start();

        const topBlocks = this.workspaceRef.current.getTopBlocks(true);
        const validStacks = topBlocks.filter(b => b.type === triggerType);

        if (validStacks.length === 0) {
            this.stopAll();
            return;
        }

        // We map block execution into an array of Promises so we can wait until ALL finish
        const stackPromises = validStacks.map(block => {
            // VALIDATE
            const check = WorkspaceValidator.validateStack(block);
            if (!check.isValid) {
                console.warn(`Validation Error on stack starting with ${block.type}: ${check.error}`);
                alert(`⚠️ Oops! ${check.error}`);
                return Promise.resolve(); // Resolves safely for invalid stacked code
            }

            // INITIALIZE GENERATOR (required before blockToCode in Blockly v12+)
            this.generator.init(this.workspaceRef.current);

            // GENERATE
            const code = this.generator.blockToCode(block);

            // EXECUTE
            return this.executeThread(code);

            // NOTE: Goal Checking is handled Reactively in App.jsx based on State Changes
        });

        // Wait for all execution threads to finish.
        await Promise.all(stackPromises);

        // If the workspace is still considered 'active' by the time all blocks finish running,
        // we trigger a global stop to revert UI states back to 'play'.
        if (this.isActive) {
            this.stopAll();
        }
    }

    async executeThread(code) {
        if (!code) return;

        // JUNIOR SAFETY: Timeout after 2 minutes to prevent truly infinite freezes
        const TIMEOUT_MS = 120000;

        // Wrapper to allow timeout
        const runUserCode = async () => {
            // Safe async execution wrapper
            // Note: eval() in strict mode or module might not behave as expected with 'await', 
            // but here we wrap in async IIFE string effectively.
            // We use Function constructor or indirect eval to ensure global scope if needed, 
            // or just eval() as before but cleaner.
            const asyncCode = `(async () => { 
                try {
                    ${code} 
                } catch(e) { 
                    throw e;
                }
            })()`;
            await eval(asyncCode);
        };

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Execution Timeout: Stack took too long!")), TIMEOUT_MS)
        );

        try {
            await Promise.race([runUserCode(), timeoutPromise]);
        } catch (e) {
            console.warn("Interpreter Safety:", e.message);
            // If timeout or error, force stop
            this.stopAll();
            alert(`⚠️ Script stopped: ${e.message}`);
        }
    }
}
