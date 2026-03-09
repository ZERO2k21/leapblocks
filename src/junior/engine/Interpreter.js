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
        this.callbacks = callbacks; // { onRun:(), onStop:(), onHighlight:(id), ... }
        this.runningThreads = new Set();
        this.isActive = false;
        this.wasPaused = false; // Track if execution was paused by stop block

        // Pause/Resume state
        this.isPaused = false;
        this.pausePromise = null;
        this.resolvePause = null;

        // Active thread tracking
        this.activeThreadsCount = 0;

        // Expose pause check globally so blocks can await it
        if (typeof window !== 'undefined') {
            window.checkPause = async () => {
                if (this.isPaused && this.pausePromise) {
                    await this.pausePromise;
                }
            };
            window.pauseExecution = () => this.pauseExecution();
            // Global highlight helper for Junior blocks
            window.highlightBlock = (blockId, spriteId) => {
                if (this.callbacks.onHighlight) {
                    this.callbacks.onHighlight(blockId, spriteId);
                }
            };
        }
    }

    start() {
        if (this.isActive) this.stopAll();
        this.isActive = true;
        this.wasPaused = false; // Reset pause flag on new start
        this.isPaused = false;
        this.pausePromise = null;
        this.resolvePause = null;
        this.activeThreadsCount = 0;

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
        this.activeThreadsCount = 0;

        // Clear highlights
        if (this.callbacks.onHighlight) this.callbacks.onHighlight(null);

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
     * @param {string|Array<string>} triggerTypes - 'event_flag' | 'event_press' or array
     * @param {string} spriteId - optional filter
     */
    async runStacks(triggerTypes, spriteId = null) {
        if (!this.workspaceRef.current) return;

        // Ensure we are active
        if (!this.isActive) this.start();

        const topBlocks = this.workspaceRef.current.getTopBlocks(true);
        const types = Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes];
        const validStacks = topBlocks.filter(b => types.includes(b.type));

        if (validStacks.length === 0) {
            // Only stop if this is a primary trigger
            if (types.some(t => t.includes('flag'))) {
                this.stopAll();
            }
            return;
        }

        // Configure statement prefix for highlighting
        this.generator.STATEMENT_PREFIX = 'window.highlightBlock(%1, window.activeSpriteId);\n';

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
            return this.executeThread(code, spriteId || window.activeSpriteId);

            // NOTE: Goal Checking is handled Reactively in App.jsx based on State Changes
        });

        this.activeThreadsCount += stackPromises.length;

        // Wait for all execution threads to finish.
        try {
            await Promise.all(stackPromises);
        } finally {
            this.activeThreadsCount -= stackPromises.length;
            if (this.isActive && this.activeThreadsCount <= 0) {
                this.stopAll();
            }
        }
    }

    /**
     * Executes stacks for ALL sprites concurrently.
     * @param {string|Array<string>} triggerTypes - 'event_flag' | 'event_press' | 'event_broadcast' or array
     * @param {Array<{spriteId: string, blocks: object}>} spriteEntries - sprites with their saved workspace JSON
     * @param {object} Blockly - the Blockly instance
     * @param {string} broadcastMessage - optional, for broadcast triggers only
     */
    async runAllSpritesStacks(triggerTypes, spriteEntries, Blockly, broadcastMessage = null) {
        if (!this.workspaceRef.current) return;

        // Ensure we are active
        if (!this.isActive) this.start();

        // Configure statement prefix: Set activeSpriteId BEFORE EVERY BLOCK to prevent race conditions
        // The %1 is the block ID (for highlighting). We inject spriteId restoration via wrapped code.
        this.generator.STATEMENT_PREFIX = 'window.highlightBlock(%1, window.activeSpriteId);\n';

        const allThreadPromises = [];

        for (const { spriteId, blocks } of spriteEntries) {
            if (!blocks || Object.keys(blocks).length === 0) continue;

            let tempWs = null;
            try {
                // Disable Blockly events during temp workspace operations
                // This prevents FocusManager from trying to focus the unregistered workspace
                Blockly.Events.disable();

                tempWs = new Blockly.Workspace();
                Blockly.serialization.workspaces.load(blocks, tempWs);

                Blockly.Events.enable();

                const topBlocks = tempWs.getTopBlocks(true);
                let validStacks;

                if (triggerTypes === 'event_broadcast') {
                    validStacks = topBlocks.filter(b => {
                        if (b.type !== 'when_receive_message') return false;
                        const msg = b.getFieldValue && b.getFieldValue('MESSAGE');
                        return msg === broadcastMessage;
                    });
                } else {
                    const types = Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes];
                    validStacks = topBlocks.filter(b => types.includes(b.type));
                }

                for (const block of validStacks) {
                    const check = WorkspaceValidator.validateStack(block);
                    if (!check.isValid) {
                        console.warn(`Validation Error on stack for sprite ${spriteId}: ${check.error}`);
                        continue;
                    }

                    this.generator.init(tempWs);
                    const code = this.generator.blockToCode(block);
                    if (!code) continue;

                    const wrappedCode = this._wrapCodeWithSpriteContext(code, spriteId);
                    allThreadPromises.push(this.executeThread(wrappedCode, spriteId));
                }

                tempWs.dispose();
                tempWs = null;
            } catch (e) {
                // Re-enable events if they were disabled
                Blockly.Events.enable();
                console.error(`Error generating code for sprite ${spriteId}:`, e);
                if (tempWs) { try { tempWs.dispose(); } catch (_) { } }
            }
        }

        if (allThreadPromises.length === 0) {
            // Only stop if this was the primary trigger (flag), not a broadcast
            const types = Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes];
            if (types.some(t => t.includes('flag'))) this.stopAll();
            return;
        }

        this.activeThreadsCount += allThreadPromises.length;
        console.log(`[Interpreter] Running ${allThreadPromises.length} threads across ${spriteEntries.length} sprites`);

        // Wait for all execution threads across all sprites to finish
        try {
            await Promise.all(allThreadPromises);
        } finally {
            this.activeThreadsCount -= allThreadPromises.length;
            if (this.isActive && this.activeThreadsCount <= 0) {
                this.stopAll();
            }
        }
    }

    /**
     * Wraps generated code so that window.activeSpriteId is restored before
     * every async operation (await), preventing race conditions during
     * concurrent multi-sprite execution.
     */
    _wrapCodeWithSpriteContext(code, spriteId) {
        const setter = `window.activeSpriteId = "${spriteId}";\n`;
        // Insert sprite context restoration before every line that could yield
        // (contains await) and at the very start
        const lines = code.split('\n');
        const wrappedLines = lines.map(line => {
            if (line.trim().startsWith('await ') || line.trim().startsWith('if(window.checkPause)')) {
                return setter + line;
            }
            return line;
        });
        return setter + wrappedLines.join('\n');
    }

    /**
     * Handle broadcast messages for inter-sprite communication.
     * When a sprite sends a broadcast, this finds all sprites with
     * matching 'when_receive_message' hat blocks and runs them.
     */
    setupBroadcastListener(spriteEntriesGetter, Blockly) {
        // Remove old listener if exists
        if (this._broadcastHandler) {
            window.removeEventListener('leap-broadcast', this._broadcastHandler);
        }

        this._broadcastBlockly = Blockly;
        this._getSpriteEntries = spriteEntriesGetter;

        this._broadcastHandler = (e) => {
            const message = e.detail?.message;
            if (!message) return;
            console.log(`[Interpreter] Broadcast received: "${message}"`);

            const entries = this._getSpriteEntries();
            if (entries && entries.length > 0) {
                this.runAllSpritesStacks('event_broadcast', entries, this._broadcastBlockly, message);
            }
        };

        window.addEventListener('leap-broadcast', this._broadcastHandler);
    }

    async executeThread(code, spriteId) {
        if (!code) return;

        // JUNIOR SAFETY: Timeout after 2 minutes to prevent truly infinite freezes
        const TIMEOUT_MS = 120000;

        // Wrapper to allow timeout
        const runUserCode = async () => {
            // Safe async execution wrapper
            const asyncCode = `(async () => { 
                try {
                    ${code} 
                } catch(e) { 
                    throw e;
                } finally {
                    // Clear highlighting for this sprite if it finishes
                    if (window.activeSpriteId === "${spriteId}") {
                        window.highlightBlock(null);
                    }
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
