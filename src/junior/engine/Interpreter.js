import { WorkspaceValidator } from "./WorkspaceValidator";

/**
 * Custom error class to signal execution stop
 * This is thrown by the stop block to immediately halt execution
 */
class ExecutionStop extends Error {
    constructor(message = "Execution stopped by Stop block") {
        super(message);
        this.name = "ExecutionStop";
    }
}

/**
 * Custom error class to signal execution abort (full reset)
 */
class ExecutionAbort extends Error {
    constructor(message = "Execution aborted") {
        super(message);
        this.name = "ExecutionAbort";
    }
}

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
        this.wasPaused = false; // Track if execution was paused by stop block

        // Pause/Resume state
        this.isPaused = false;
        this.pausePromise = null;
        this.resolvePause = null;

        // Expose pause check globally so blocks can await it
        if (typeof window !== 'undefined') {
            window.checkPause = async () => {
                if (this.isPaused && this.pausePromise) {
                    await this.pausePromise;
                }
            };
            window.pauseExecution = () => this.pauseExecution();
        }
    }

    start() {
        if (this.isActive) this.stopAll();
        this.isActive = true;
        this.wasPaused = false; // Reset pause flag on new start
        this.isPaused = false;
        this.pausePromise = null;
        this.resolvePause = null;

        // Notify State Manager (Visuals)
        if (this.callbacks.onRun) this.callbacks.onRun();
    }

    stopAll() {
        this.isActive = false;
        this.isPaused = false;
        // If we are paused, resolving it allows threads to finish/abort gracefully
        if (this.resolvePause) {
            this.resolvePause();
            this.resolvePause = null;
        }
        this.runningThreads.clear();
        if (this.callbacks.onStop) this.callbacks.onStop();
    }

    // Called when execution is paused by stop block (preserves state)
    pauseExecution() {
        if (this.isPaused) return; // already paused
        this.isPaused = true;
        this.wasPaused = true;
        this.pausePromise = new Promise(resolve => {
            this.resolvePause = resolve;
        });

        // Notify UI that we stopped running visually, but we are paused
        if (this.callbacks.onStop) this.callbacks.onStop();
    }

    // Called to resume execution after being paused
    resumeExecution() {
        if (!this.isPaused) return;
        this.isPaused = false;
        if (this.resolvePause) {
            this.resolvePause();
            this.resolvePause = null;
        }
        // Notify UI we are running again
        if (this.callbacks.onRun) this.callbacks.onRun();
    }

    // Check if execution was paused and clear the flag
    isPausedAndClear() {
        const wasPaused = this.wasPaused;
        this.wasPaused = false; // Clear flag after checking
        return wasPaused;
    }

    // Explicitly clear pause flag (for manual stop)
    clearPauseFlag() {
        this.wasPaused = false;
        this.isPaused = false;
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
            // If it's an ExecutionStop error (from stop block), handle gracefully without alert
            if (e instanceof ExecutionStop) {
                console.log("Execution stopped by Stop block - preserving sprite state");
                this.pauseExecution(); // Pause instead of full stop to preserve state
                return; // Don't alert, just stop
            }
            if (e instanceof ExecutionAbort) {
                return; // Just abort gracefully
            }

            console.warn("Interpreter Safety:", e.message);
            // If timeout or error, force stop
            this.stopAll();
            alert(`⚠️ Script stopped: ${e.message}`);
        }
    }
}

// Export ExecutionStop and ExecutionAbort for use in blocks and window scope
export { ExecutionStop, ExecutionAbort };
