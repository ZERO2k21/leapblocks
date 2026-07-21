import { WorkspaceValidator } from "./WorkspaceValidator";
import { showToast } from "../../client/components/Toast";

class ExecutionStop extends Error {
    constructor(message = "Execution stopped by Stop block") {
        super(message);
        this.name = "ExecutionStop";
    }
}

class ExecutionAbort extends Error {
    constructor(message = "Execution aborted") {
        super(message);
        this.name = "ExecutionAbort";
    }
}

interface InterpreterCallbacks {
    onRun?: () => void;
    onStop?: () => void;
    onHighlight?: (blockId: string | null, spriteId?: string) => void;
}

interface SpriteEntry {
    spriteId: string;
    blocks: any;
}

type ValidTypes = string | string[];

declare global {
    interface Window {
        checkPause?: () => Promise<void>;
        isActive?: () => boolean;
        pauseExecution?: () => void;
        highlightBlock?: (blockId: string | null, spriteId?: string) => void;
        activeSpriteId?: string;
    }
}

export class Interpreter {
    workspaceRef: React.RefObject<any>;
    generator: any;
    callbacks: InterpreterCallbacks;
    runningThreads: Set<any>;
    isActive: boolean;
    wasPaused: boolean;
    isPaused: boolean;
    pausePromise: Promise<void> | null;
    resolvePause: (() => void) | null;
    activeThreadsCount: number;
    _broadcastHandler?: ((e: CustomEvent) => void) | null;
    _broadcastBlockly?: any;
    _getSpriteEntries?: () => SpriteEntry[];

    constructor(workspaceRef: React.RefObject<any>, generator: any, callbacks: InterpreterCallbacks) {
        this.workspaceRef = workspaceRef;
        this.generator = generator;
        this.callbacks = callbacks;
        this.runningThreads = new Set();
        this.isActive = false;
        this.wasPaused = false;
        this.isPaused = false;
        this.pausePromise = null;
        this.resolvePause = null;
        this.activeThreadsCount = 0;

        if (typeof window !== 'undefined') {
            window.checkPause = async () => {
                if (this.isPaused && this.pausePromise) {
                    await this.pausePromise;
                }
            };
            window.isActive = () => this.isActive;
            window.pauseExecution = () => this.pauseExecution();
            window.highlightBlock = (blockId, spriteId) => {
                if (this.callbacks.onHighlight) {
                    this.callbacks.onHighlight(blockId, spriteId);
                }
            };
        }
    }

    start(): void {
        if (this.isActive) this.stopAll();
        this.isActive = true;
        this.wasPaused = false;
        this.isPaused = false;
        this.pausePromise = null;
        this.resolvePause = null;
        this.activeThreadsCount = 0;

        if (this.callbacks.onRun) this.callbacks.onRun();
    }

    stopAll(): void {
        this.isActive = false;
        this.isPaused = false;
        if (this.resolvePause) {
            this.resolvePause();
            this.resolvePause = null;
        }
        this.runningThreads.clear();
        this.activeThreadsCount = 0;

        if (this.callbacks.onHighlight) this.callbacks.onHighlight(null);

        if (this.callbacks.onStop) this.callbacks.onStop();
    }

    pauseExecution(): void {
        if (this.isPaused) return;
        this.isPaused = true;
        this.wasPaused = true;
        this.pausePromise = new Promise<void>(resolve => {
            this.resolvePause = resolve;
        });

        if (this.callbacks.onStop) this.callbacks.onStop();
    }

    resumeExecution(): void {
        if (!this.isPaused) return;
        this.isPaused = false;
        if (this.resolvePause) {
            this.resolvePause();
            this.resolvePause = null;
        }
        if (this.callbacks.onRun) this.callbacks.onRun();
    }

    isPausedAndClear(): boolean {
        const wasPaused = this.wasPaused;
        this.wasPaused = false;
        return wasPaused;
    }

    clearPauseFlag(): void {
        this.wasPaused = false;
        this.isPaused = false;
    }

    async runStacks(triggerTypes: ValidTypes, spriteId: string | null = null): Promise<void> {
        if (!this.workspaceRef.current) return;

        if (!this.isActive) this.start();

        const topBlocks = this.workspaceRef.current.getTopBlocks(true);
        const types = Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes];
        const validStacks = topBlocks.filter((b: any) => types.includes(b.type));

        if (validStacks.length === 0) {
            if (types.some(t => t.includes('flag'))) {
                this.stopAll();
            }
            return;
        }

        const stackPromises = validStacks.map((block: any) => {
            const currentSpriteId = spriteId || window.activeSpriteId;
            this.generator.STATEMENT_PREFIX = `window.activeSpriteId = "${currentSpriteId}";\nwindow.highlightBlock(%1, "${currentSpriteId}");\n`;

            const check = WorkspaceValidator.validateStack(block);
            if (!check.isValid) {
                console.warn(`Validation Error on stack starting with ${block.type}: ${check.error}`);
                showToast(`Oops! ${check.error}`, 'error');
                return Promise.resolve();
            }

            this.generator.init(this.workspaceRef.current);

            const code = this.generator.blockToCode(block);

            return this.executeThread(code, spriteId || window.activeSpriteId);
        });

        this.activeThreadsCount += stackPromises.length;

        try {
            await Promise.all(stackPromises);
        } finally {
            this.activeThreadsCount -= stackPromises.length;
            if (this.isActive && this.activeThreadsCount <= 0) {
                this.stopAll();
            }
        }
    }

    async runAllSpritesStacks(triggerTypes: ValidTypes, spriteEntries: SpriteEntry[], Blockly: any, broadcastMessage: string | null = null): Promise<void> {
        if (!this.workspaceRef.current) return;

        if (!this.isActive) this.start();

        const allThreadPromises: Promise<void>[] = [];

        for (const { spriteId, blocks } of spriteEntries) {
            this.generator.STATEMENT_PREFIX = `window.activeSpriteId = "${spriteId}";\nwindow.highlightBlock(%1, "${spriteId}");\n`;

            if (!blocks || Object.keys(blocks).length === 0) continue;

            let tempWs: any = null;
            try {
                Blockly.Events.disable();

                tempWs = new Blockly.Workspace();
                Blockly.serialization.workspaces.load(blocks, tempWs);

                Blockly.Events.enable();

                const topBlocks = tempWs.getTopBlocks(true);
                let validStacks: any[];

                if (triggerTypes === 'event_broadcast') {
                    validStacks = topBlocks.filter((b: any) => {
                        if (b.type !== 'when_receive_message') return false;
                        const msg = b.getFieldValue && b.getFieldValue('MESSAGE');
                        return msg === broadcastMessage;
                    });
                } else {
                    const types = Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes];
                    validStacks = topBlocks.filter((b: any) => types.includes(b.type));
                }

                for (const block of validStacks) {
                    const check = WorkspaceValidator.validateStack(block);
                    if (!check.isValid) {
                        console.warn(`Validation Error on stack for sprite ${spriteId}: ${check.error}`);
                        continue;
                    }

                    this.generator.init(tempWs);

                    console.log(`[Interpreter] [${spriteId}] Executing block: ${block.type}`);

                    const code = this.generator.blockToCode(block);
                    if (!code) {
                        console.warn(`[Interpreter] [${spriteId}] No code generated for block: ${block.type}`);
                        continue;
                    }

                    console.log(`[Interpreter] [${spriteId}] Generated code for broadcast reception:`, code.trim().split("\n")[0]);

                    const wrappedCode = this._wrapCodeWithSpriteContext(code, spriteId);
                    allThreadPromises.push(this.executeThread(wrappedCode, spriteId));
                }

                tempWs.dispose();
                tempWs = null;
            } catch (e) {
                Blockly.Events.enable();
                console.error(`Error generating code for sprite ${spriteId}:`, e);
                if (tempWs) { try { tempWs.dispose(); } catch (_) { } }
            }
        }

        if (allThreadPromises.length === 0) {
            const types = Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes];
            if (types.some(t => t.includes('flag'))) this.stopAll();
            return;
        }

        this.activeThreadsCount += allThreadPromises.length;
        console.log(`[Interpreter] Running ${allThreadPromises.length} threads across ${spriteEntries.length} sprites`);

        try {
            await Promise.all(allThreadPromises);
        } finally {
            this.activeThreadsCount -= allThreadPromises.length;
            if (this.isActive && this.activeThreadsCount <= 0) {
                this.stopAll();
            }
        }
    }

    _wrapCodeWithSpriteContext(code: string, spriteId: string): string {
        const setter = `window.activeSpriteId = "${spriteId}";\n`;
        const regex = /(await\s+[^;]+;)/g;
        let wrappedCode = code.replace(regex, `$1\n${setter}`);
        return setter + wrappedCode;
    }

    setupBroadcastListener(spriteEntriesGetter: () => SpriteEntry[], Blockly: any): void {
        if (this._broadcastHandler) {
            window.removeEventListener('leap-broadcast', this._broadcastHandler as any);
        }

        this._broadcastBlockly = Blockly;
        this._getSpriteEntries = spriteEntriesGetter;

        this._broadcastHandler = (e: CustomEvent) => {
            const message = (e.detail as any)?.message;
            if (!message) return;
            console.log(`[Interpreter] Broadcast received: "${message}"`);

            const entries = this._getSpriteEntries!();
            if (entries && entries.length > 0) {
                console.log(`[Interpreter] Triggering stacks for ${entries.length} sprites for broadcast: "${message}"`);
                this.runAllSpritesStacks('event_broadcast', entries, this._broadcastBlockly!, message);
            } else {
                console.warn(`[Interpreter] No sprite entries found for broadcast: "${message}"`);
            }
        };

        window.addEventListener('leap-broadcast', this._broadcastHandler as any);
    }

    async executeThread(code: string, spriteId: string): Promise<void> {
        if (!code) return;

        const TIMEOUT_MS = 120000;

        const runUserCode = async () => {
            const asyncCode = `(async () => { 
                try {
                    ${code} 
                } catch(e) { 
                    throw e;
                } finally {
                    window.highlightBlock(null, "${spriteId}");
                }
            })()`;
            await eval(asyncCode);
        };

        const timeoutPromise = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("Execution Timeout: Stack took too long!")), TIMEOUT_MS)
        );

        try {
            await Promise.race([runUserCode(), timeoutPromise]);
        } catch (e: any) {
            if (e instanceof ExecutionStop) {
                console.log("Execution stopped by Stop block - preserving sprite state");
                this.pauseExecution();
                return;
            }
            if (e instanceof ExecutionAbort) {
                return;
            }

            console.warn("Interpreter Safety:", e.message);
            this.stopAll();
            showToast(`Script stopped: ${e.message}`, 'error');
        }
    }
}

export { ExecutionStop, ExecutionAbort };
