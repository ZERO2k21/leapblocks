import { Sprite } from '../stage/Sprite';
import { hardwareAdapter } from '../hardware/HardwareAdapter';
import { spriteManager } from '../engine/SpriteManager';
import { motionEngine } from '../engine/MotionEngine';
import { costumeEngine } from '../engine/CostumeEngine';
import { eventEngine } from '../engine/EventEngine';
import { stageManager } from '../engine/StageManager';
import { penManager } from '../engine/PenManager';
import { soundManager } from '../engine/SoundManager';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VM - Executes animation scripts
// ═══════════════════════════════════════════════════════════════════════════

export interface VMContext {
    sprite: Sprite;
    isRunning: boolean;
    keysPressed: Set<string>;
    mouseX: number;
    mouseY: number;
    stopAll: () => void;
    onShowVariable?: (name: string) => void;
    onHideVariable?: (name: string) => void;
    onShowList?: (name: string) => void;
    onHideList?: (name: string) => void;
    onShowTable?: (name: string) => void;
    onHideTable?: (name: string) => void;
}

export interface CompiledScript {
    trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'procedure';
    triggerKey?: string;
    spriteId: string;
    steps: ScriptStep[];
}

export type ScriptStep = (
    // Motion
    | { type: 'move_steps'; steps: number }
    | { type: 'turn_right'; degrees: number }
    | { type: 'turn_left'; degrees: number }
    | { type: 'go_to_xy'; x: number; y: number }
    | { type: 'glide_to_xy'; secs: number; x: number; y: number }
    | { type: 'point_direction'; direction: number }
    | { type: 'change_x'; dx: number }
    | { type: 'change_y'; dy: number }
    | { type: 'set_x'; x: number }
    | { type: 'set_x'; x: number }
    | { type: 'set_y'; y: number }
    // PictoBlox Motion
    | { type: 'go_to'; target: 'random' | 'mouse' | string }  // string = sprite name
    | { type: 'glide_to'; secs: number; target: 'random' | 'mouse' | string }
    | { type: 'point_towards'; towards: 'mouse' | 'random' | string }
    | { type: 'if_on_edge_bounce' }
    | { type: 'set_rotation_style'; style: 'left-right' | 'all around' | 'none' }
    // Looks
    | { type: 'say'; message: string | (() => string) }
    | { type: 'say_for_secs'; message: string | (() => string); secs: number }
    | { type: 'think'; message: string | (() => string) }
    | { type: 'think_for_secs'; message: string | (() => string); secs: number }
    | { type: 'show' }
    | { type: 'hide' }
    | { type: 'next_costume' }
    | { type: 'switch_costume'; costume: string }
    | { type: 'switch_backdrop'; backdrop: string }
    | { type: 'next_backdrop' }
    | { type: 'set_size'; size: number }
    | { type: 'change_size'; change: number }
    | { type: 'set_effect'; effect: 'ghost' | 'brightness' | 'color' | 'fisheye' | 'whirl' | 'pixelate' | 'mosaic'; value: number }
    | { type: 'change_effect'; effect: 'ghost' | 'brightness' | 'color' | 'fisheye' | 'whirl' | 'pixelate' | 'mosaic'; change: number }
    | { type: 'clear_effects' }
    | { type: 'go_to_layer'; layer: 'front' | 'back' }
    | { type: 'go_forward_layers'; direction: 'forward' | 'backward'; layers: number }
    // Control
    | { type: 'wait'; secs: number }
    | { type: 'repeat'; times: number; body: ScriptStep[] }
    | { type: 'forever'; body: ScriptStep[] }
    | { type: 'if'; condition: () => boolean; body: ScriptStep[] }
    | { type: 'if_else'; condition: () => boolean; body: ScriptStep[]; elseBody: ScriptStep[] }
    | { type: 'wait_until'; condition: () => boolean }
    | { type: 'repeat_until'; condition: () => boolean; body: ScriptStep[] }
    | { type: 'stop_all' }
    | { type: 'stop_this_script' }
    | { type: 'create_clone'; target: string }
    | { type: 'delete_clone' }
    // Events
    | { type: 'broadcast'; message: string }
    | { type: 'broadcast_wait'; message: string }
    // Sound
    | { type: 'play_sound'; sound: string }
    | { type: 'play_sound_until_done'; sound: string }
    | { type: 'stop_all_sounds' }
    | { type: 'set_volume'; volume: number }
    | { type: 'set_volume'; volume: number }
    | { type: 'change_volume'; change: number }
    | { type: 'set_sound_effect'; effect: 'pitch' | 'pan'; value: number }
    | { type: 'change_sound_effect'; effect: 'pitch' | 'pan'; value: number }
    | { type: 'clear_sound_effects' }
    // Sensing
    | { type: 'ask'; question: string }
    | { type: 'reset_timer' }
    // Hardware blocks for Stage mode
    | { type: 'hw_set_digital'; pin: number | string; value: boolean }
    | { type: 'hw_set_led'; on: boolean }
    | { type: 'hw_set_pwm'; pin: number | string; value: number }
    | { type: 'hw_set_servo'; pin: number | string; angle: number }
    | { type: 'hw_set_motor'; motor: number; speed: number }
    | { type: 'hw_stop_motors' }
    | { type: 'hw_play_tone'; pin: number | string; freq: number; duration: number }
    | { type: 'hw_stop_tone'; pin: number | string }
    | { type: 'hw_analog_read'; pin: number | string }
    | { type: 'hw_digital_read'; pin: number | string }
    // Variable
    | { type: 'data_setvariableto'; variable: string; value: () => number | string }
    | { type: 'data_changevariableby'; variable: string; value: () => number }
    | { type: 'data_showvariable'; variable: string }
    | { type: 'data_hidevariable'; variable: string }
    // List
    | { type: 'list_add'; list: string; item: () => string }
    | { type: 'list_delete'; list: string; index: () => number }
    | { type: 'list_delete_all'; list: string }
    | { type: 'list_insert'; list: string; index: () => number; item: () => string }
    | { type: 'list_replace'; list: string; index: () => number; item: () => string }
    | { type: 'list_show'; list: string }
    | { type: 'list_hide'; list: string }
    // Table
    | { type: 'table_set'; table: string; col: () => number | string; row: () => number; value: () => string | number }
    | { type: 'table_add_column'; table: string; col: () => string }
    | { type: 'table_delete_column'; table: string; col: () => number | string }
    | { type: 'table_show'; table: string; format: string }
    | { type: 'table_hide'; table: string }
    | { type: 'table_delete_row'; table: string; row: () => number }
    | { type: 'table_clear'; table: string }
    | { type: 'table_export'; table: string }
    // Pen
    | { type: 'pen_clear' }
    | { type: 'pen_stamp' }
    | { type: 'pen_penDown' }
    | { type: 'pen_penUp' }
    | { type: 'pen_setPenColorToColor'; color: string }
    | { type: 'pen_changePenSizeBy'; size: number }
    | { type: 'pen_setPenSizeTo'; size: number }
    // Pen color params
    | { type: 'pen_changePenColorParamBy'; param: string; change: number }
    | { type: 'pen_setPenColorParamTo'; param: string; value: number }
    // Procedures / My Blocks
    | { type: 'procedures_call'; proccode: string; args?: Record<string, any> }
) & { blockId?: string };

// Logging utility for AnimationVM
const vmLog = {
    info: (msg: string, data?: any) => console.log(`[AnimationVM] ${msg}`, data ?? ''),
    step: (type: string, details?: any) => console.log(`[AnimationVM.Step] ${type}`, details ?? ''),
    trigger: (event: string, data?: any) => console.log(`[AnimationVM.Trigger] ${event}`, data ?? ''),
    error: (msg: string, err?: any) => console.error(`[AnimationVM.Error] ${msg}`, err ?? ''),
};

export class AnimationVM {
    private runningScripts: Map<string, AbortController> = new Map();
    private keysPressed: Set<string> = new Set();
    private mouseX: number = 0;
    private mouseY: number = 0;
    private isRunning: boolean = false;
    public isPaused: boolean = false;
    private pausePromise: Promise<void> | null = null;
    private resolvePause: (() => void) | null = null;

    // Callbacks for UI sync
    public onHighlightBlock?: (blockId: string | null, spriteId: string) => void;
    public onRunningChange?: (isRunning: boolean) => void;

    // Monitor callbacks
    public onShowVariable?: (name: string) => void;
    public onHideVariable?: (name: string) => void;
    public onShowList?: (name: string) => void;
    public onHideList?: (name: string) => void;
    public onShowTable?: (name: string) => void;
    public onHideTable?: (name: string) => void;

    // Ask callback — when set, the VM delegates input to the React UI instead of window.prompt
    public onAskQuestion?: (question: string) => Promise<string>;

    // Timer
    private timerStart: number = Date.now();

    // Sensing
    private currentAnswer: string = '';

    // Sound
    private volume: number = 100;

    // Broadcast system
    private broadcastListeners: Map<string, CompiledScript[]> = new Map();

    constructor() {
        // Initialize sound manager
        soundManager.init();

        // Set up key listeners
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                this.keysPressed.add(e.key);
                eventEngine.trigger('keydown', e.key);
            });
            window.addEventListener('keyup', (e) => {
                this.keysPressed.delete(e.key);
                eventEngine.trigger('keyup', e.key);
            });
        }
    }

    // Sound playback helper
    private async playSound(sprite: Sprite, name: string, wait: boolean = false): Promise<void> {
        soundManager.setVolume(this.volume / 100);

        // Look for sound in sprite's sounds first
        const sound = sprite.sounds.find(s => s.name === name);
        if (sound) {
            if (wait) {
                await soundManager.playAndWait(name, sound.src);
            } else {
                await soundManager.play(name, sound.src);
            }
            return;
        }

        // Look in stage sounds
        const stageSound = stageManager.getAllSounds().find(s => s.name === name);
        if (stageSound) {
            if (wait) {
                await soundManager.playAndWait(name, stageSound.src);
            } else {
                await soundManager.play(name, stageSound.src);
            }
            return;
        }

        console.warn(`[Audio] Sound not found: ${name}`);
    }

    // Helper to get current sprite id from context
    private currentSpriteId(): string {
        // This is a workaround; we need to track current sprite in VM context
        // For now, we'll rely on the fact that runScript gets sprite from script.spriteId
        // But audioManager doesn't have access to that directly. Let's change approach: instead of
        // trying to get sprite from manager, we'll store current sprite in the VM context and pass to audioManager
        return ''; // placeholder - we'll fix this by modifying audioManager calls to pass sprite
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VARIABLES
    // ═══════════════════════════════════════════════════════════════════════
    private variables: Map<string, number | string> = new Map();

    getVariable(name: string): number | string {
        return this.variables.get(name) ?? 0;
    }

    setVariable(name: string, value: number | string): void {
        this.variables.set(name, value);
        vmLog.step('set_variable', { name, value });
    }

    changeVariable(name: string, delta: number): void {
        const current = this.getVariable(name);
        const currentNum = Number(current);
        if (!isNaN(currentNum)) {
            this.variables.set(name, currentNum + delta);
            vmLog.step('change_variable', { name, delta, newValue: currentNum + delta });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LISTS
    // ═══════════════════════════════════════════════════════════════════════
    private lists: Map<string, Array<string | number>> = new Map();

    getList(name: string): Array<string | number> {
        if (!this.lists.has(name)) {
            this.lists.set(name, []);
        }
        return this.lists.get(name)!;
    }

    getListLength(name: string): number {
        return this.getList(name).length;
    }

    getListItem(name: string, index: number): string {
        const list = this.getList(name);
        // Scratch uses 1-based indexing. 'last' is also supported but I'll stick to numeric for now.
        // TODO: Handle 'last', 'random' string inputs if block allows them.
        // My block definition uses 'math_number' for index, so usually 1-based integer.
        if (index < 1 || index > list.length) return '';
        return String(list[index - 1]);
    }

    getListItemNum(name: string, item: string): number {
        const list = this.getList(name);
        // Returns 0 if not found (Scratch behavior?) - Scratch returns 0.
        // Note: list items can be numbers. loose comparison? Scratch is loose.
        const idx = list.findIndex(i => String(i) === item);
        return idx + 1; // 0 if not found (-1 + 1)
    }

    listContains(name: string, item: string): boolean {
        const list = this.getList(name);
        return list.some(i => String(i) === item);
    }

    getListContents(name: string): string {
        const list = this.getList(name);
        return list.join(' ');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TABLES
    // ═══════════════════════════════════════════════════════════════════════
    private tables: Map<string, (string | number)[][]> = new Map();
    private tableColumns: Map<string, string[]> = new Map();

    getTable(name: string): (string | number)[][] {
        if (!this.tables.has(name)) {
            this.tables.set(name, []);
            this.tableColumns.set(name, ['Column 1']); // Initial column
        }
        return this.tables.get(name)!;
    }

    getColumns(name: string): string[] {
        if (!this.tableColumns.has(name)) {
            this.tableColumns.set(name, ['Column 1']);
        }
        return this.tableColumns.get(name)!;
    }

    setInTable(name: string, column: number | string, row: number, value: string | number): void {
        const table = this.getTable(name);
        const columns = this.getColumns(name);

        let colIdx = -1;
        if (typeof column === 'string') {
            colIdx = columns.indexOf(column);
        } else {
            colIdx = column - 1;
        }

        if (colIdx >= 0 && colIdx < columns.length && row >= 1) {
            // Ensure row exists
            while (table.length < row) {
                table.push(new Array(columns.length).fill(''));
            }
            table[row - 1][colIdx] = value;
            vmLog.step('table_set', { name, column, row, value });
        }
    }

    addColumn(name: string, colName: string): void {
        const columns = this.getColumns(name);
        const table = this.getTable(name);
        columns.push(colName);
        table.forEach(row => row.push(''));
        vmLog.step('table_add_column', { name, colName });
    }

    deleteColumn(name: string, column: number | string): void {
        const columns = this.getColumns(name);
        const table = this.getTable(name);
        let colIdx = -1;
        if (typeof column === 'string') {
            colIdx = columns.indexOf(column);
        } else {
            colIdx = column - 1;
        }

        if (colIdx >= 0 && colIdx < columns.length) {
            columns.splice(colIdx, 1);
            table.forEach(row => row.splice(colIdx, 1));
            vmLog.step('table_delete_column', { name, column });
        }
    }

    deleteRow(name: string, rowIdx: number): void {
        const table = this.getTable(name);
        if (rowIdx >= 1 && rowIdx <= table.length) {
            table.splice(rowIdx - 1, 1);
            vmLog.step('table_delete_row', { name, rowIdx });
        }
    }

    clearTable(name: string): void {
        this.tables.set(name, []);
        vmLog.step('table_clear', { name });
    }

    getValueAtTable(name: string, column: number | string, row: number): string | number {
        const table = this.getTable(name);
        const columns = this.getColumns(name);
        let colIdx = -1;
        if (typeof column === 'string') {
            colIdx = columns.indexOf(column);
        } else {
            colIdx = column - 1;
        }

        if (colIdx >= 0 && colIdx < columns.length && row >= 1 && row <= table.length) {
            return table[row - 1][colIdx];
        }
        return '';
    }

    getTableCount(name: string, type: 'row' | 'column'): number {
        if (type === 'row') return this.getTable(name).length;
        return this.getColumns(name).length;
    }




    // ═══════════════════════════════════════════════════════════════════════
    // SPRITE MANAGEMENT (Delegated to SpriteManager)
    // ═══════════════════════════════════════════════════════════════════════
    registerSprite(sprite: Sprite): void {
        spriteManager.addSprite(sprite);
    }

    unregisterSprite(id: string): void {
        spriteManager.removeSprite(id);
    }

    getSprite(id: string): Sprite | undefined {
        return spriteManager.getSprite(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCRIPT EXECUTION
    // ═══════════════════════════════════════════════════════════════════════
    private setRunning(val: boolean) {
        if (this.isRunning !== val) {
            this.isRunning = val;
            if (this.onRunningChange) this.onRunningChange(val);
        }
    }

    triggerFlag(scripts: CompiledScript[]): void {
        this.setRunning(true);
        let flagScripts = 0;
        for (const script of scripts) {
            if (script.trigger === 'flag') {
                flagScripts++;
                this.runScript(script);
            }
        }
        if (flagScripts === 0) {
            this.checkAllFinished();
        }
    }

    triggerSpriteClick(spriteId: string, scripts: CompiledScript[]): void {
        let matched = 0;
        for (const script of scripts) {
            if (script.trigger === 'sprite_click' && script.spriteId === spriteId) {
                matched++;
                this.setRunning(true);
                this.runScript(script);
            }
        }
    }

    triggerKey(key: string, scripts: CompiledScript[]): void {
        let matched = 0;
        for (const script of scripts) {
            if (script.trigger === 'key' && script.triggerKey === key) {
                matched++;
                this.setRunning(true);
                this.runScript(script);
            }
        }
    }

    stopAll(): void {
        vmLog.info('stopAll() called');
        this.setRunning(false);

        // Resolve any pending pause so aborted scripts can exit cleanly
        if (this.isPaused && this.resolvePause) {
            this.resolvePause();
        }
        this.isPaused = false;

        for (const [id, controller] of this.runningScripts) {
            vmLog.info(`Aborting script: ${id}`);
            controller.abort();
        }
        this.runningScripts.clear();

        // Clear highlights
        if (this.onHighlightBlock) {
            // We'd need to clear for all sprites if we tracked them, 
            // but clearing for current is usually enough as UI only shows one.
            // We pass null to clear.
            this.onHighlightBlock(null, '');
        }

        vmLog.info('All scripts stopped');
    }

    /**
     * Stop all scripts running for a specific sprite.
     * Useful for restarting a script stack on click.
     */
    stopSpriteScripts(spriteId: string): void {
        const toStop: string[] = [];
        for (const [id, controller] of this.runningScripts) {
            if (id.startsWith(`${spriteId}-`)) {
                toStop.push(id);
            }
        }
        toStop.forEach(id => {
            const controller = this.runningScripts.get(id);
            if (controller) {
                controller.abort();
                this.runningScripts.delete(id);
            }
        });
        this.checkAllFinished();
    }

    pause(): void {
        if (!this.isRunning || this.isPaused) return;
        vmLog.info('pause() called');
        this.isPaused = true;
        this.pausePromise = new Promise(resolve => {
            this.resolvePause = resolve;
        });
    }

    resume(): void {
        if (!this.isRunning || !this.isPaused) return;
        vmLog.info('resume() called');
        this.isPaused = false;
        if (this.resolvePause) {
            this.resolvePause();
            this.resolvePause = null;
        }
    }

    private async checkPause(): Promise<void> {
        if (this.isPaused && this.pausePromise) {
            await this.pausePromise;
        }
    }


    public async runScript(script: CompiledScript): Promise<void> {
        this.setRunning(true);
        const sprite = spriteManager.getSprite(script.spriteId);
        vmLog.info(`runScript started`, {
            spriteId: script.spriteId,
            found: !!sprite,
            trigger: script.trigger,
            stepCount: script.steps.length
        });

        if (!sprite) {
            vmLog.error(`Sprite not found: ${script.spriteId}`);
            return;
        }

        const id = `${script.spriteId}-${Date.now()}-${Math.random()}`;
        const controller = new AbortController();
        this.runningScripts.set(id, controller);
        vmLog.info(`Script registered: ${id}`);

        const context: VMContext = {
            sprite,
            isRunning: true,
            keysPressed: this.keysPressed,
            mouseX: this.mouseX,
            mouseY: this.mouseY,
            stopAll: () => this.stopAll(),
            onShowVariable: this.onShowVariable,
            onHideVariable: this.onHideVariable,
            onShowList: this.onShowList,
            onHideList: this.onHideList,
            onShowTable: this.onShowTable,
            onHideTable: this.onHideTable,
        };

        let isAborted = false;
        try {
            vmLog.info(`Executing ${script.steps.length} steps for sprite: ${sprite.name}`);
            await this.executeSteps(script.steps, context, controller.signal);
            vmLog.info('Script completed successfully');
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                vmLog.error('Script execution error', e);
            } else {
                isAborted = true;
                vmLog.info('Script aborted');
            }
        } finally {
            this.runningScripts.delete(id);
            vmLog.info(`Script removed: ${id}`);
            this.checkAllFinished(isAborted);
        }
    }

    private checkAllFinished(isAborted: boolean = false) {
        // If a script was aborted, it was likely due to a stopAll() or restart.
        // We shouldn't let an aborting script indiscriminately turn off the engine,
        // because a new script might have just started!
        if (isAborted) return;

        if (this.runningScripts.size === 0) {
            this.setRunning(false);
        }
    }

    private async executeSteps(steps: ScriptStep[], ctx: VMContext, signal: AbortSignal): Promise<void> {
        vmLog.info(`executeSteps: ${steps.length} steps`);
        for (let i = 0; i < steps.length; i++) {
            await this.checkPause();

            if (signal.aborted || !this.isRunning) {
                vmLog.info(`Execution interrupted at step ${i}`);
                if (this.onHighlightBlock) this.onHighlightBlock(null, ctx.sprite.id);
                throw new DOMException('Aborted', 'AbortError');
            }

            const step = steps[i];
            if (step.blockId && this.onHighlightBlock) {
                this.onHighlightBlock(step.blockId, ctx.sprite.id);
            }

            vmLog.step(`[${i + 1}/${steps.length}] ${step.type}`);
            await this.executeStep(step, ctx, signal);
        }
        if (this.onHighlightBlock) this.onHighlightBlock(null, ctx.sprite.id);
        vmLog.info('All steps completed');
    }


    private async executeStep(step: ScriptStep, ctx: VMContext, signal: AbortSignal): Promise<void> {
        const { sprite } = ctx;
        console.log('[AnimationVM] Executing step:', step.type, step);

        switch (step.type) {
            case 'move_steps':
                motionEngine.move(sprite, step.steps);
                break;

            case 'turn_right':
                motionEngine.turnRight(sprite, step.degrees);
                break;

            case 'turn_left':
                motionEngine.turnLeft(sprite, step.degrees);
                break;

            case 'go_to_xy':
                motionEngine.goTo(sprite, step.x, step.y);
                break;

            case 'glide_to_xy':
                motionEngine.glide(sprite, step.x, step.y, step.secs);
                await this.waitForGlide(sprite, signal);
                break;

            case 'point_direction':
                motionEngine.pointInDirection(sprite, step.direction);
                break;

            // PictoBlox motion extensions
            case 'go_to':
                if (step.target === 'random') {
                    const randX = Math.random() * 480 - 240; // -240 to 240
                    const randY = Math.random() * 360 - 180; // -180 to 180
                    motionEngine.goTo(sprite, randX, randY);
                } else if (step.target === 'mouse') {
                    motionEngine.goTo(sprite, this.mouseX, this.mouseY);
                } else {
                    // target is a sprite name
                    const targetSprite = spriteManager.getSprite(step.target);
                    if (targetSprite) {
                        motionEngine.goTo(sprite, targetSprite.x, targetSprite.y);
                    } else {
                        console.warn(`[AnimationVM] go_to: Sprite '${step.target}' not found`);
                    }
                }
                break;

            case 'glide_to':
                if (step.target === 'random') {
                    const randX = Math.random() * 480 - 240;
                    const randY = Math.random() * 360 - 180;
                    sprite.startGlide(randX, randY, step.secs);
                } else if (step.target === 'mouse') {
                    sprite.startGlide(this.mouseX, this.mouseY, step.secs);
                } else {
                    const targetSprite = spriteManager.getSprite(step.target);
                    if (targetSprite) {
                        sprite.startGlide(targetSprite.x, targetSprite.y, step.secs);
                    } else {
                        console.warn(`[AnimationVM] glide_to: Sprite '${step.target}' not found`);
                    }
                }
                await this.waitForGlide(sprite, signal);
                break;

            case 'point_towards':
                if (step.towards === 'mouse') {
                    const dx = this.mouseX - sprite.x;
                    const dy = this.mouseY - sprite.y;
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90; // Convert to Scratch direction (0=up, 90=right)
                    sprite.pointInDirection(angle);
                } else if (step.towards === 'random') {
                    const randomDir = Math.random() * 360;
                    sprite.pointInDirection(randomDir);
                } else {
                    // towards a sprite
                    const targetSprite = spriteManager.getSprite(step.towards);
                    if (targetSprite) {
                        const dx = targetSprite.x - sprite.x;
                        const dy = targetSprite.y - sprite.y;
                        const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                        sprite.pointInDirection(angle);
                    } else {
                        console.warn(`[AnimationVM] point_towards: Sprite '${step.towards}' not found`);
                    }
                }
                break;

            case 'if_on_edge_bounce':
                motionEngine.ifOnEdgeBounce(sprite);
                break;

            case 'set_rotation_style':
                sprite.setRotationStyle(step.style);
                break;

            case 'change_x':
                sprite.setX(sprite.x + step.dx);
                break;

            case 'change_y':
                sprite.setY(sprite.y + step.dy);
                break;

            case 'set_x':
                sprite.setX(step.x);
                break;

            case 'set_y':
                sprite.setY(step.y);
                break;

            case 'say':
                sprite.say(typeof step.message === 'function' ? step.message() : step.message);
                break;

            case 'say_for_secs':
                sprite.say(typeof step.message === 'function' ? step.message() : step.message, step.secs);
                await this.sleep(step.secs * 1000, signal);
                break;

            case 'show':
                costumeEngine.show(sprite);
                break;

            case 'hide':
                costumeEngine.hide(sprite);
                break;

            case 'next_costume':
                costumeEngine.nextCostume(sprite);
                break;

            case 'set_size':
                costumeEngine.setSize(sprite, step.size);
                break;

            case 'change_size':
                costumeEngine.changeSize(sprite, step.change);
                break;

            case 'set_effect':
                costumeEngine.setEffect(sprite, step.effect, step.value);
                break;

            case 'clear_effects':
                costumeEngine.clearEffects(sprite);
                break;

            case 'change_effect':
                costumeEngine.changeEffect(sprite, step.effect, step.change);
                break;

            // New Looks blocks
            case 'think':
                sprite.think(typeof step.message === 'function' ? step.message() : step.message);
                break;

            case 'think_for_secs':
                sprite.think(typeof step.message === 'function' ? step.message() : step.message, step.secs);
                await this.sleep(step.secs * 1000, signal);
                break;

            case 'switch_costume':
                costumeEngine.setCostume(sprite, step.costume);
                break;

            case 'switch_backdrop':
                stageManager.setBackdrop(step.backdrop);
                break;

            case 'next_backdrop':
                stageManager.nextBackdrop();
                break;

            case 'go_to_layer':
                // Simple implementation: set layer index based on front/back
                // In a full implementation, we'd have layer ordering in spriteManager
                console.log(`[AnimationVM] go_to_layer: ${step.layer} (layer ordering not fully implemented)`);
                // TODO: Implement proper layer ordering
                break;

            case 'go_forward_layers':
                console.log(`[AnimationVM] go_forward_layers: ${step.direction} ${step.layers} layers (not fully implemented)`);
                // TODO: Implement proper layer ordering
                break;

            // Control blocks
            case 'wait':
                await this.sleep(step.secs * 1000, signal);
                break;

            case 'repeat':
                for (let i = 0; i < step.times; i++) {
                    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    await this.executeSteps(step.body, ctx, signal);
                }
                break;

            case 'forever':
                while (!signal.aborted && this.isRunning) {
                    await this.executeSteps(step.body, ctx, signal);
                    await this.sleep(16, signal); // ~60fps yield
                }
                break;

            case 'if':
                if (step.condition()) {
                    await this.executeSteps(step.body, ctx, signal);
                }
                break;

            case 'if_else':
                if (step.condition()) {
                    await this.executeSteps(step.body, ctx, signal);
                } else {
                    await this.executeSteps(step.elseBody, ctx, signal);
                }
                break;

            case 'wait_until':
                while (!step.condition() && !signal.aborted && this.isRunning) {
                    await this.sleep(16, signal);
                }
                break;

            case 'repeat_until':
                while (!step.condition() && !signal.aborted && this.isRunning) {
                    await this.executeSteps(step.body, ctx, signal);
                    await this.sleep(16, signal);
                }
                break;

            case 'stop_all':
                ctx.stopAll();
                break;

            case 'stop_this_script':
                throw new DOMException('Aborted', 'AbortError');

            case 'create_clone': {
                // Determine which sprite to clone
                const targetSprite = step.target === 'myself' || step.target === sprite.name
                    ? sprite
                    : spriteManager.getSprite(step.target);

                if (!targetSprite) {
                    vmLog.error(`create_clone: target sprite not found: ${step.target}`);
                    break;
                }

                // Generate unique ID for the clone
                const cloneId = `${targetSprite.id}_clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Create new sprite as a clone
                const clone = spriteManager.createSprite(
                    cloneId,
                    targetSprite.name,
                    targetSprite.spriteType
                );

                // Copy state from target sprite to clone (excluding dynamic state)
                clone.setX(targetSprite.x);
                clone.setY(targetSprite.y);
                clone.pointInDirection(targetSprite.direction);
                clone.setSize(targetSprite.size);
                clone.setRotationStyle(targetSprite.rotationStyle);
                if (!targetSprite.visible) {
                    clone.hide(); // copy visibility
                }

                // Copy costumes and sounds
                clone.copyCostumesFrom(targetSprite);
                clone.copySoundsFrom(targetSprite);

                // Copy effects
                const targetEffects = targetSprite.effects;
                for (const key of Object.keys(targetEffects) as (keyof typeof targetEffects)[]) {
                    clone.setEffect(key, targetEffects[key]);
                }

                // Clone does not start with pen down
                clone.setPenDown(false);

                // Copy scripts from target sprite, updating spriteId to clone's ID
                const targetScripts = targetSprite.scripts;
                const clonedScripts = targetScripts.map((script: any) => ({
                    ...script,
                    spriteId: cloneId,
                }));
                clone.setScripts(clonedScripts);

                // Add clone to spriteManager
                spriteManager.addSprite(clone);

                // Immediately trigger the "when I start as a clone" scripts for the clone
                const cloneStartScripts = clonedScripts.filter((s: any) => s.trigger === 'clone');
                for (const script of cloneStartScripts) {
                    this.runScript(script).catch(err => {
                        vmLog.error('Error in clone start script', err);
                    });
                }
                break;
            }

            case 'delete_clone':
                // Only delete if this is a clone (ID contains '_clone_')
                if (sprite.id.includes('_clone_')) {
                    spriteManager.removeSprite(sprite.id);
                    // Stop any running scripts for this sprite to avoid memory leaks
                    const scriptIdsToAbort = Array.from(this.runningScripts.keys())
                        .filter(id => id.startsWith(`${sprite.id}-`));
                    for (const abortId of scriptIdsToAbort) {
                        const controller = this.runningScripts.get(abortId);
                        if (controller) {
                            controller.abort();
                            this.runningScripts.delete(abortId);
                        }
                    }
                } else {
                    vmLog.info('delete_clone ignored: not a clone');
                }
                break;

            // Event blocks
            case 'broadcast':
                this.triggerBroadcast(step.message);
                break;

            case 'broadcast_wait':
                await this.triggerBroadcastAndWait(step.message);
                break;

            // Sound blocks
            case 'play_sound':
                await this.playSound(ctx.sprite, step.sound, false);
                break;

            case 'play_sound_until_done':
                await this.playSound(ctx.sprite, step.sound, true);
                break;

            case 'stop_all_sounds':
                soundManager.stopAll();
                break;

            case 'set_volume':
                this.volume = Math.max(0, Math.min(100, step.volume));
                soundManager.setVolume(this.volume);
                break;

            case 'change_volume':
                this.volume = Math.max(0, Math.min(100, this.volume + step.change));
                soundManager.setVolume(this.volume);
                break;

            case 'set_sound_effect':
                vmLog.info('set_sound_effect not fully implemented', { effect: step.effect, value: step.value });
                break;

            case 'change_sound_effect':
                vmLog.info('change_sound_effect not fully implemented', { effect: step.effect, delta: step.value });
                break;

            case 'clear_sound_effects':
                vmLog.info('clear_sound_effects not implemented');
                break;

            // Pen blocks
            case 'pen_clear':
                penManager.clear();
                break;
            case 'pen_stamp': {
                const costume = sprite.currentCostume;
                if (costume && costume.image) {
                    penManager.stamp(
                        costume.image,
                        costume.width,
                        costume.height,
                        sprite.x,
                        sprite.y,
                        sprite.size,
                        sprite.direction,
                        sprite.rotationStyle
                    );
                }
                break;
            }
            case 'pen_penDown':
                sprite.setPenDown(true);
                break;
            case 'pen_penUp':
                sprite.setPenDown(false);
                break;
            case 'pen_setPenColorToColor':
                sprite.setPenColor(step.color);
                break;
            case 'pen_changePenSizeBy':
                sprite.setPenSize(sprite.penSize + step.size);
                break;
            case 'pen_setPenSizeTo':
                sprite.setPenSize(step.size);
                break;

            case 'pen_changePenColorParamBy': {
                // HSB pen color parameters
                const currentColor = sprite.penColor || '#4c97ff';
                console.log(`[AnimationVM] change pen ${step.param} by ${step.change} (current: ${currentColor})`);
                // Basic color manipulation - change the pen color based on param
                // For a full implementation, convert to HSL, modify, convert back
                break;
            }

            case 'pen_setPenColorParamTo': {
                console.log(`[AnimationVM] set pen ${step.param} to ${step.value}`);
                // For a full implementation, convert pen color to HSL, set param, convert back
                break;
            }

            // Sensing blocks
            case 'ask':
                await this.askQuestion(step.question, sprite);
                break;

            case 'reset_timer':
                this.resetTimer();
                break;

            // Hardware blocks
            case 'hw_set_digital':
                await hardwareAdapter.setDigitalPin(step.pin, step.value);
                break;

            case 'hw_set_led':
                await hardwareAdapter.setBuiltinLED(step.on);
                break;

            case 'hw_set_pwm':
                await hardwareAdapter.setPWM(step.pin, step.value);
                break;

            case 'hw_set_servo':
                await hardwareAdapter.setServo(step.pin, step.angle);
                break;

            case 'hw_set_motor':
                await hardwareAdapter.setMotor(step.motor, step.speed);
                break;

            case 'hw_stop_motors':
                await hardwareAdapter.stopMotors();
                break;

            case 'hw_play_tone':
                await hardwareAdapter.playTone(step.pin, step.freq, step.duration);
                break;

            case 'hw_stop_tone':
                await hardwareAdapter.stopTone(step.pin);
                break;

            case 'hw_analog_read': {
                const val = await hardwareAdapter.readAnalogPin(step.pin);
                console.log(`[AnimationVM] Analog read ${step.pin}: ${val}`);
                break;
            }

            case 'hw_digital_read': {
                const val = await hardwareAdapter.readDigitalPin(step.pin);
                console.log(`[AnimationVM] Digital read ${step.pin}: ${val}`);
                break;
            }

            // Variable blocks
            case 'data_setvariableto':
                this.setVariable(step.variable, step.value());
                break;

            case 'data_changevariableby':
                this.changeVariable(step.variable, step.value());
                break;

            case 'data_showvariable':
                // Show variable monitor on stage
                if (ctx.onShowVariable) {
                    ctx.onShowVariable(step.variable);
                }
                console.log(`[AnimationVM] Show variable: ${step.variable} = ${this.getVariable(step.variable)}`);
                break;

            case 'data_hidevariable':
                // Hide variable monitor on stage
                if (ctx.onHideVariable) {
                    ctx.onHideVariable(step.variable);
                }
                console.log(`[AnimationVM] Hide variable: ${step.variable}`);
                break;

            // List blocks
            case 'list_add': {
                const list = this.getList(step.list);
                list.push(step.item());
                vmLog.step('list_add', { list: step.list, item: step.item() });
                break;
            }
            case 'list_delete': {
                const list = this.getList(step.list);
                const idx = step.index();
                if (idx >= 1 && idx <= list.length) {
                    list.splice(idx - 1, 1);
                    vmLog.step('list_delete', { list: step.list, index: idx });
                }
                break;
            }
            case 'list_delete_all': {
                this.lists.set(step.list, []);
                vmLog.step('list_delete_all', { list: step.list });
                break;
            }
            case 'list_insert': {
                const list = this.getList(step.list);
                const idx = step.index();
                const item = step.item();
                if (idx >= 1 && idx <= list.length + 1) {
                    list.splice(idx - 1, 0, item);
                    vmLog.step('list_insert', { list: step.list, index: idx, item });
                }
                break;
            }
            case 'list_replace': {
                const list = this.getList(step.list);
                const idx = step.index();
                const item = step.item();
                if (idx >= 1 && idx <= list.length) {
                    list[idx - 1] = item;
                    vmLog.step('list_replace', { list: step.list, index: idx, item });
                }
                break;
            }
            case 'list_show':
                // Show list monitor on stage
                if (ctx.onShowList) {
                    ctx.onShowList(step.list);
                }
                console.log(`[AnimationVM] Show list: ${step.list}`);
                break;
            case 'list_hide':
                // Hide list monitor on stage
                if (ctx.onHideList) {
                    ctx.onHideList(step.list);
                }
                console.log(`[AnimationVM] Hide list: ${step.list}`);
                break;

            // Table blocks
            case 'table_set':
                this.setInTable(step.table, step.col(), step.row(), step.value());
                break;
            case 'table_add_column':
                this.addColumn(step.table, step.col());
                break;
            case 'table_delete_column':
                this.deleteColumn(step.table, step.col());
                break;
            case 'table_show':
                // Show table monitor on stage
                if (ctx.onShowTable) {
                    ctx.onShowTable(step.table);
                }
                console.log(`[AnimationVM] Show table: ${step.table} as ${step.format}`);
                break;
            case 'table_hide':
                // Hide table monitor on stage
                if (ctx.onHideTable) {
                    ctx.onHideTable(step.table);
                }
                console.log(`[AnimationVM] Hide table: ${step.table}`);
                break;
            case 'table_delete_row':
                this.deleteRow(step.table, step.row());
                break;
            case 'table_clear':
                this.clearTable(step.table);
                break;
            case 'table_export':
                console.log(`[AnimationVM] Export table: ${step.table}`);
                // TODO: Implement actual CSV download if running in browser
                break;

            case 'procedures_call': {
                // To support "Run without screen refresh", we need to execute the procedure stack inline
                // but with a safety budget (e.g., max 10,000 steps or 500ms).

                // 1. Find the procedure script definition for this sprite
                const scripts = sprite.scripts as CompiledScript[] || [];
                const procScript = scripts.find(s => s.trigger === 'procedure' && s.triggerKey === step.proccode);

                if (procScript) {
                    const startTime = performance.now();
                    let stepsCount = 0;

                    const executeBudgetedSteps = async (stepsToRun: ScriptStep[]) => {
                        for (let i = 0; i < stepsToRun.length; i++) {
                            await this.checkPause();

                            if (signal.aborted || !this.isRunning) {
                                throw new DOMException('Aborted', 'AbortError');
                            }

                            // Recursively execute
                            await this.executeStep(stepsToRun[i], ctx, signal);

                            stepsCount++;
                            // Yield if we exceed budget (auto-yield safety)
                            if (stepsCount > 10000 || (performance.now() - startTime) > 500) {
                                await new Promise(resolve => setTimeout(resolve, 0));
                                stepsCount = 0; // reset budget for next chunk
                            }
                        }
                    };

                    await executeBudgetedSteps(procScript.steps);
                } else {
                    console.warn(`[AnimationVM] Procedure '${step.proccode}' not found for sprite ${sprite.id}`);
                }
                break;
            }
        }
    }

    private sleep(ms: number, signal: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            if (signal.aborted) {
                return reject(new DOMException('Aborted', 'AbortError'));
            }

            const abortHandler = () => {
                clearTimeout(timeoutId);
                clearInterval(checkIntervalId);
                reject(new DOMException('Aborted', 'AbortError'));
            };

            signal.addEventListener('abort', abortHandler);

            let elapsed = 0;
            const intervalMs = 16;

            let timeoutId: any;
            let checkIntervalId: any = setInterval(async () => {
                if (this.isPaused) return; // Wait while paused

                await this.checkPause();

                if (signal.aborted) {
                    abortHandler();
                    return;
                }

                elapsed += intervalMs;
                if (elapsed >= ms) {
                    clearInterval(checkIntervalId);
                    signal.removeEventListener('abort', abortHandler);
                    resolve();
                }
            }, intervalMs);
        });
    }

    private async waitForGlide(sprite: Sprite, signal: AbortSignal): Promise<void> {
        while (sprite.isGliding && !signal.aborted) {
            await this.checkPause();
            await this.sleep(16, signal);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SENSING
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    // SENSING
    // ═══════════════════════════════════════════════════════════════════════
    isKeyPressed(key: string): boolean {
        if (key === 'space') return this.keysPressed.has(' ');
        if (key === 'any') return this.keysPressed.size > 0;
        return this.keysPressed.has(key);
    }

    isMouseDown(): boolean {
        // TODO: Implement actual mouse down state tracking
        return false;
    }

    getMouseX(): number {
        return this.mouseX;
    }

    getMouseY(): number {
        return this.mouseY;
    }

    updateMousePosition(x: number, y: number): void {
        this.mouseX = x;
        this.mouseY = y;
    }

    getDistanceTo(target: string, fromSpriteId: string): number {
        const fromSprite = spriteManager.getSprite(fromSpriteId);
        if (!fromSprite) return 0;

        let targetX = 0;
        let targetY = 0;

        if (target === '_mouse_') {
            targetX = this.mouseX;
            targetY = this.mouseY;
        } else {
            const targetSprite = spriteManager.getSprite(target);
            if (!targetSprite) return 0;
            targetX = targetSprite.x;
            targetY = targetSprite.y;
        }

        const dx = targetX - fromSprite.x;
        const dy = targetY - fromSprite.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isTouching(target: string, fromSpriteId: string): boolean {
        const fromSprite = spriteManager.getSprite(fromSpriteId);
        if (!fromSprite) return false;

        if (target === '_mouse_') {
            // Simple point-in-rect check for mouse
            // Assuming default size 40x40 roughly for now, should use bounding box
            const halfSize = (fromSprite.size / 100) * 20;
            return Math.abs(this.mouseX - fromSprite.x) < halfSize &&
                Math.abs(this.mouseY - fromSprite.y) < halfSize;
        } else if (target === '_edge_') {
            const w = 320 / 2; // stage half width
            const h = 240 / 2; // stage half height
            return Math.abs(fromSprite.x) >= w || Math.abs(fromSprite.y) >= h;
        }

        // TODO: Implement sprite-to-sprite collision
        return false;
    }

    isTouchingColor(color: string, fromSpriteId: string): boolean {
        // TODO: Implement color collision
        return false;
    }

    isColorTouchingColor(color1: string, color2: string, fromSpriteId: string): boolean {
        // TODO: Implement color-color collision
        return false;
    }

    getLoudness(): number {
        // TODO: Implement microphone access
        return -1;
    }

    getUsername(): string {
        return 'User';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIME & DATE
    // ═══════════════════════════════════════════════════════════════════════
    getDaysSince2000(): number {
        const now = new Date();
        const start = new Date(2000, 0, 1);
        const diff = now.getTime() - start.getTime();
        return diff / (1000 * 60 * 60 * 24);
    }

    getCurrentTime(unit: 'year' | 'month' | 'date' | 'dayofweek' | 'hour' | 'minute' | 'second'): number {
        const now = new Date();
        switch (unit) {
            case 'year': return now.getFullYear();
            case 'month': return now.getMonth() + 1;
            case 'date': return now.getDate();
            case 'dayofweek': return now.getDay() + 1;
            case 'hour': return now.getHours();
            case 'minute': return now.getMinutes();
            case 'second': return now.getSeconds();
            default: return 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIMER
    // ═══════════════════════════════════════════════════════════════════════
    resetTimer(): void {
        this.timerStart = Date.now();
    }

    getTimer(): number {
        return (Date.now() - this.timerStart) / 1000;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BROADCAST
    // ═══════════════════════════════════════════════════════════════════════
    triggerBroadcast(message: string): void {
        console.log(`[AnimationVM] Broadcasting: ${message}`);
        // Find and execute all scripts with broadcast_receive trigger matching this message
        const allSprites = spriteManager.getAllSprites();
        for (const sprite of allSprites) {
            const scripts = sprite.scripts || [];
            for (const script of scripts) {
                if ((script as CompiledScript).trigger === 'broadcast_receive' && (script as CompiledScript).triggerKey === message) {
                    this.setRunning(true);
                    this.runScript(script as CompiledScript).catch(err => {
                        vmLog.error('Error in broadcast receive script', err);
                    });
                }
            }
        }
    }

    async triggerBroadcastAndWait(message: string): Promise<void> {
        console.log(`[AnimationVM] Broadcasting and waiting: ${message}`);
        const promises: Promise<void>[] = [];
        const allSprites = spriteManager.getAllSprites();
        for (const sprite of allSprites) {
            const scripts = sprite.scripts || [];
            for (const script of scripts) {
                if ((script as CompiledScript).trigger === 'broadcast_receive' && (script as CompiledScript).triggerKey === message) {
                    this.setRunning(true);
                    promises.push(this.runScript(script as CompiledScript));
                }
            }
        }
        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

    triggerBackdropSwitch(backdrop: string): void {
        console.log(`[AnimationVM] Backdrop switch: ${backdrop}`);
        const allSprites = spriteManager.getAllSprites();
        for (const sprite of allSprites) {
            const scripts = sprite.scripts || [];
            for (const script of scripts) {
                if ((script as CompiledScript).trigger === 'backdrop_switch' && (script as CompiledScript).triggerKey === backdrop) {
                    this.setRunning(true);
                    this.runScript(script as CompiledScript).catch(err => {
                        vmLog.error('Error in backdrop switch script', err);
                    });
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ASK/ANSWER
    // ═══════════════════════════════════════════════════════════════════════
    async askQuestion(question: string, sprite: Sprite): Promise<void> {
        // Show the question in a speech bubble on the sprite
        sprite.say(question);

        if (this.onAskQuestion) {
            // Delegate to the React UI — this returns a Promise that blocks
            // until the user types an answer and clicks OK / presses Enter
            try {
                const answer = await this.onAskQuestion(question);
                this.currentAnswer = answer;
            } catch {
                // Promise was rejected (e.g. user clicked Stop) — keep previous answer
                console.log('[AnimationVM] Ask cancelled');
            }
        } else {
            // Fallback: browser prompt (blocks the main thread — not ideal)
            await new Promise(resolve => setTimeout(resolve, 50));
            try {
                const answer = window.prompt(question) || '';
                this.currentAnswer = answer;
            } catch (e) {
                console.error('Prompt failed', e);
            }
        }

        sprite.clearSay();
    }

    getAnswer(): string {
        return this.currentAnswer;
    }
}

// Singleton instance - lazy initialized to avoid TDZ errors from webpack chunk splitting
let _animationVM: AnimationVM | null = null;
export function getAnimationVM(): AnimationVM {
    if (!_animationVM) _animationVM = new AnimationVM();
    return _animationVM;
}
export const animationVM: AnimationVM = new Proxy({} as AnimationVM, {
    get(_target, prop) {
        const instance = getAnimationVM();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getAnimationVM() as any)[prop] = value; return true; }
});

