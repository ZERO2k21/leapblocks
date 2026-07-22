/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { Sprite } from '../stage/Sprite';
import { hardwareAdapter } from '../serial/HardwareAdapter';
import { spriteManager } from '../engine/SpriteManager';
import { motionEngine } from '../engine/MotionEngine';
import { costumeEngine } from '../engine/CostumeEngine';
import { eventEngine } from '../engine/EventEngine';
import { stageManager } from '../engine/StageManager';
import { penManager } from '../engine/PenManager';
import { soundManager } from '../engine/SoundManager';
import { STAGE_CONFIG } from '../engine/StageConfig';

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
    onLog?: (msg: string) => void;
}

export interface CompiledScript {
    trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'hand_sign' | 'procedure' | 'physics_collision';
    triggerKey?: string;
    spriteId: string;
    hatBlockId?: string; // Unique identifier for the hat block that started this script
    steps: ScriptStep[];
}

export type ScriptStep = (
    // Motion
    | { type: 'move_steps'; steps: number | (() => number) }
    | { type: 'turn_right'; degrees: number | (() => number) }
    | { type: 'turn_left'; degrees: number | (() => number) }
    | { type: 'go_to_xy'; x: number | (() => number); y: number | (() => number) }
    | { type: 'glide_to_xy'; secs: number | (() => number); x: number | (() => number); y: number | (() => number) }
    | { type: 'point_direction'; direction: number | (() => number) }
    | { type: 'change_x'; dx: number | (() => number) }
    | { type: 'change_y'; dy: number | (() => number) }
    | { type: 'set_x'; x: number | (() => number) }
    | { type: 'set_y'; y: number | (() => number) }
    // LeapBlox Motion
    | { type: 'go_to'; target: 'random' | 'mouse' | string }  // string = sprite name
    | { type: 'glide_to'; secs: number | (() => number); target: 'random' | 'mouse' | string }
    | { type: 'point_towards'; towards: 'mouse' | 'random' | string }
    | { type: 'if_on_edge_bounce' }
    | { type: 'set_rotation_style'; style: 'left-right' | 'all around' | 'none' }
    // Looks
    | { type: 'say'; message: string | (() => string) }
    | { type: 'say_for_secs'; message: string | (() => string); secs: number | (() => number) }
    | { type: 'think'; message: string | (() => string) }
    | { type: 'think_for_secs'; message: string | (() => string); secs: number | (() => number) }
    | { type: 'show' }
    | { type: 'hide' }
    | { type: 'mirror' }
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
    | { type: 'wait'; secs: number | (() => number) }
    | { type: 'repeat'; times: number | (() => number); body: ScriptStep[] }
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
    | { type: 'ask'; question: string | (() => string) }
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
    // Pencil / realistic drawing steps
    | { type: 'go_to_mouse_with_pen'; penDown?: boolean }
    | { type: 'point_towards_mouse_smooth'; smoothFactor?: number }
    // Object Detection extension
    | { type: 'object_detect' }
    | { type: 'object_when_detected'; objectType: string }
    // Music extension
    | { type: 'music_play_note'; note: number; beats: number }
    | { type: 'music_set_instrument'; instrument: number }
    | { type: 'music_play_drum'; drum: number; beats: number }
    | { type: 'music_set_tempo'; bpm: number }
    | { type: 'music_change_tempo'; amount: number }
    | { type: 'music_rest'; beats: number }
    // Procedures / My Blocks
    | { type: 'procedures_call'; proccode: string; args?: Record<string, any> }
    // Text to Speech
    | { type: 'tts_speak'; message: string | (() => string) }
    | { type: 'tts_set_voice'; voice: string }
    | { type: 'tts_set_rate'; rate: number }
    | { type: 'tts_set_volume'; volume: number }
    | { type: 'tts_set_pitch'; pitch: number }
    | { type: 'tts_stop' }
    // Speech Recognition
    | { type: 'speech_start_listening' }
    | { type: 'speech_stop_listening' }
    | { type: 'speech_set_language'; language: string }
    | { type: 'speech_on_result'; body: ScriptStep[] }
    // Text Recognition (OCR)
    | { type: 'ocr_from_camera' }
    | { type: 'ocr_from_image'; source: string }
    // Weather Data
    | { type: 'weather_get_for_city'; city: string }
    | { type: 'weather_get_for_location'; lat: number; lon: number }
    // Translate
    | { type: 'translate_text'; text: string; targetLang: string }
    | { type: 'translate_set_source'; sourceLang: string }
    | { type: 'translate_set_target'; targetLang: string }
    // Data Logger
    | { type: 'logger_log'; value: string | (() => string) }
    | { type: 'logger_log_with_label'; value: string | (() => string); label: string }
    | { type: 'logger_clear' }
    | { type: 'logger_save_to_csv' }
    | { type: 'logger_on_new_entry'; body: ScriptStep[] }
    | { type: 'vision_camera_on' }
    | { type: 'vision_camera_off' }
    | { type: 'vision_analyze' }
    | { type: 'vision_detect_objects' }
    | { type: 'vision_draw_bounding_boxes'; state: string }
    // Video Player
    | { type: 'video_set_source'; url: string | (() => string) }
    | { type: 'video_play' }
    | { type: 'video_pause' }
    | { type: 'video_stop' }
    | { type: 'video_show' }
    | { type: 'video_hide' }
    | { type: 'video_set_speed'; speed: number | (() => number) }
    | { type: 'video_set_volume'; volume: number | (() => number) }
    | { type: 'video_seek'; time: number | (() => number) }
    | { type: 'video_set_position'; x: number | (() => number); y: number | (() => number); size: number | (() => number) }
    | { type: 'video_set_loop'; loop: boolean }
    // Video Sensing
    | { type: 'vs_set_sensitivity'; threshold: number | (() => number) }
    // QR Scanner
    | { type: 'qr_scan_camera' }
    | { type: 'qr_scan_image'; source: string | (() => string) }
    // Physics Engine
    | { type: 'physics_start' }
    | { type: 'physics_stop' }
    | { type: 'physics_set_gravity'; gx: number | (() => number); gy: number | (() => number) }
    | { type: 'physics_add_body'; spriteId: string | (() => string) }
    | { type: 'physics_add_force'; spriteId: string | (() => string); fx: number | (() => number); fy: number | (() => number) }
    | { type: 'physics_set_bounce'; value: number | (() => number) }
    | { type: 'physics_set_mass'; value: number | (() => number) }
    | { type: 'physics_set_static'; spriteId: string | (() => string); value: string }
    // Makey Makey
    | { type: 'mm_set_key'; signal: string | (() => string); key: string | (() => string) }
) & { blockId?: string };

// Logging utility for AnimationVM
const vmLog = {
    info: (msg: string, data?: any) => console.log(`[AnimationVM] ${msg}`, data ?? ''),
    step: (type: string, details?: any) => console.log(`[AnimationVM.Step] ${type}`, details ?? ''),
    trigger: (event: string, data?: any) => console.log(`[AnimationVM.Trigger] ${event}`, data ?? ''),
    warn: (msg: string, data?: any) => console.warn(`[AnimationVM.Warn] ${msg}`, data ?? ''),
    error: (msg: string, err?: any) => console.error(`[AnimationVM.Error] ${msg}`, err ?? ''),
};

export class AnimationVM {
    private runningScripts: Map<string, {
        controller: AbortController,
        spriteId: string,
        hatBlockId?: string,
        trigger?: string,
        triggerKey?: string
    }> = new Map();
    private keysPressed: Set<string> = new Set();
    private mouseX: number = 0;
    private mouseY: number = 0;
    private isRunning: boolean = false;
    private isMouseDownState: boolean = false;
    private timerStart: number = Date.now();
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
    public onLog?: (msg: string) => void;
    public onAnswerChange?: (answer: string) => void;

    // StopAll callback — called when stopAll() is invoked (from block or UI) so React can clear UI state
    public onStopAll?: () => void;

    // Change callbacks for UI/Monitor synchronization
    public onVariableChange?: (name: string, value: string | number) => void;
    public onListChange?: (name: string, value: (string | number)[]) => void;
    public onTableChange?: (name: string, data: (string | number)[][]) => void;

    // Broadcast sync hook — called right before a message is dispatched
    public onBeforeBroadcast?: (message: string) => void;

    // Timer
    // timerStart is already declared above

    // Sensing
    private currentAnswer: string = '';

    // Broadcast system
    private broadcastListeners: Map<string, CompiledScript[]> = new Map();
    private broadcasts: Set<string> = new Set(['message1']); // Default message like leap
    // Refactor: stageScripts is redundant if the stage is registered as a sprite,
    // but we'll keep it as a proxy for the stage's scripts for backward compatibility if needed.
    public stageScripts: CompiledScript[] = [];

    // Greater-than trigger polling
    private greaterThanPollingId: ReturnType<typeof setInterval> | null = null;
    private greaterThanFired: Set<string> = new Set(); // Track which hat blocks have already fired
    private handSignPollingId: ReturnType<typeof setInterval> | null = null;
    private handSignFired: Set<string> = new Set(); // Track which hand sign hat blocks have fired

    constructor() {
        // Initialize sound manager
        soundManager.init();

        // Set up key listeners
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                const normalized = this.normalizeKey(e);
                if (normalized) {
                    this.keysPressed.add(normalized);
                    // Trigger "when key pressed" hat blocks across all sprites
                    this.triggerKey(normalized);
                }
                eventEngine.trigger('keydown', e.key);
            });
            window.addEventListener('keyup', (e) => {
                const normalized = this.normalizeKey(e);
                if (normalized) {
                    this.keysPressed.delete(normalized);
                }
                eventEngine.trigger('keyup', e.key);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESET STATE (for new project)
    // ═══════════════════════════════════════════════════════════════════════
    resetState(): void {
        console.log('[AnimationVM] Resetting all state for new project');
        // Stop all running scripts
        this.stopAll();
        // Clear variables, lists, tables
        this.variables.clear();
        this.lists.clear();
        this.tables.clear();
        this.broadcasts.clear();
        this.broadcasts.add('message1');
        this.tableColumns.clear();
        // Reset sensing state
        this.currentAnswer = '';
        this.timerStart = Date.now();
        // Clear broadcast listeners
        this.broadcastListeners.clear();
        this.stageScripts = [];
    }

    // Sound playback helper
    private async playSound(sprite: Sprite, name: string, wait: boolean = false, signal?: AbortSignal): Promise<void> {
        // Look for sound in sprite's sounds first (case-insensitive)
        const searchName = name.toLowerCase();
        const sound = sprite.sounds.find(s => s.name.toLowerCase() === searchName);
        const playbackOptions = {
            pan: sprite.soundEffects.pan,
            pitch: sprite.soundEffects.pitch,
            volume: sprite.volume,
        };

        if (sound) {
            if (wait) {
                await soundManager.playAndWait(name, sound.src, playbackOptions, signal);
            } else {
                await soundManager.play(name, sound.src, playbackOptions);
            }
            return;
        }

        // Look in stage sounds (case-insensitive)
        const stageSound = stageManager.getAllSounds().find(s => s.name.toLowerCase() === searchName);
        if (stageSound) {

            if (wait) {
                await soundManager.playAndWait(name, stageSound.src, playbackOptions, signal);
            } else {
                await soundManager.play(name, stageSound.src, playbackOptions);
            }
            return;
        }

        vmLog.warn(`Sound not found for sprite '${sprite.name}': ${name}`);
    }

    // Helper to get current sprite id from context
    private currentSpriteId(): string {
        return ''; // placeholder - we'll fix this by modifying audioManager calls to pass sprite
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VARIABLES
    // ═══════════════════════════════════════════════════════════════════════
    private variables: Map<string, number | string> = new Map();

    hasVariable(name: string): boolean {
        return this.variables.has(name);
    }

    getVariable(name: string): number | string {
        const value = this.variables.get(name);
        if (value === undefined) {
            vmLog.warn(`Variable lookup failed for name: "${name}". Returning 0.`);
            return 0;
        }
        return value;
    }

    setVariable(name: string, value: number | string): void {
        const oldValue = this.variables.get(name);
        this.variables.set(name, value);
        const type = typeof value;
        const msg = `Variable '${name}': ${oldValue !== undefined ? oldValue : '(new)'} -> ${value} (Type: ${type})`;
        vmLog.info(msg);
        this.onLog?.(msg);
        this.onVariableChange?.(name, value);
    }

    deleteVariable(name: string): void {
        if (!this.variables.has(name)) {
            return;
        }

        const oldValue = this.variables.get(name);
        this.variables.delete(name);
        const msg = `Variable '${name}' deleted${oldValue !== undefined ? ` (Last value: ${oldValue})` : ''}`;
        vmLog.info(msg);
        this.onLog?.(msg);
    }

    changeVariable(name: string, delta: number): void {
        const current = this.getVariable(name);
        const currentNum = Number(current);
        const deltaNum = Number(delta);
        const baseValue = Number.isNaN(currentNum) ? 0 : currentNum;
        const changeAmount = Number.isNaN(deltaNum) ? 0 : deltaNum;
        const newValue = baseValue + changeAmount;

        this.variables.set(name, newValue);
        vmLog.step('change_variable', { name, delta: changeAmount, newValue });
        this.onLog?.(`Variable '${name}' changed by ${changeAmount} (New value: ${newValue})`);
        this.onVariableChange?.(name, newValue);
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
        // leap uses 1-based indexing. 'last' is also supported but I'll stick to numeric for now.
        // TODO: Handle 'last', 'random' string inputs if block allows them.
        // My block definition uses 'math_number' for index, so usually 1-based integer.
        if (index < 1 || index > list.length) return '';
        return String(list[index - 1]);
    }

    getListItemNum(name: string, item: string): number {
        const list = this.getList(name);
        // Returns 0 if not found (leap behavior?) - leap returns 0.
        // Note: list items can be numbers. loose comparison? leap is loose.
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

    addToList(name: string, item: string | number): void {
        const list = this.getList(name);
        list.push(item);
        vmLog.step('list_add', { name, item });
        this.onListChange?.(name, [...list]);
    }

    deleteOfList(name: string, index: number): void {
        const list = this.getList(name);
        if (index >= 1 && index <= list.length) {
            list.splice(index - 1, 1);
            vmLog.step('list_delete', { name, index });
            this.onListChange?.(name, [...list]);
        }
    }

    deleteAllOfList(name: string): void {
        this.lists.set(name, []);
        vmLog.step('list_delete_all', { name });
        this.onListChange?.(name, []);
    }

    insertAtList(name: string, index: number, item: string | number): void {
        const list = this.getList(name);
        if (index >= 1 && index <= list.length + 1) {
            list.splice(index - 1, 0, item);
            vmLog.step('list_insert', { name, index, item });
            this.onListChange?.(name, [...list]);
        }
    }

    replaceItemOfList(name: string, index: number, item: string | number): void {
        const list = this.getList(name);
        if (index >= 1 && index <= list.length) {
            list[index - 1] = item;
            vmLog.step('list_replace', { name, index, item });
            this.onListChange?.(name, [...list]);
        }
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
            this.onTableChange?.(name, [...table]);
        }
    }

    addColumn(name: string, colName: string): void {
        const columns = this.getColumns(name);
        const table = this.getTable(name);
        columns.push(colName);
        table.forEach(row => row.push(''));
        vmLog.step('table_add_column', { name, colName });
        this.onTableChange?.(name, [...table]);
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
            this.onTableChange?.(name, [...table]);
        }
    }

    deleteRow(name: string, rowIdx: number): void {
        const table = this.getTable(name);
        if (rowIdx >= 1 && rowIdx <= table.length) {
            table.splice(rowIdx - 1, 1);
            vmLog.step('table_delete_row', { name, rowIdx });
            this.onTableChange?.(name, [...table]);
        }
    }

    clearTable(name: string): void {
        this.tables.set(name, []);
        vmLog.step('table_clear', { name });
        this.onTableChange?.(name, []);
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

    /**
     * Update the global script registry and broadcast listeners.
     * This ensures that all entities have up-to-date scripts for global events.
     */
    setScripts(scripts: CompiledScript[]): void {
        this.broadcastListeners.clear();
        vmLog.info(`Updating global script registry: ${scripts.length} total scripts`);

        scripts.forEach(script => {
            if (script.trigger === 'broadcast_receive') {
                const messageName = script.triggerKey || 'message1';
                // Register message name for dropdowns
                this.registerBroadcast(messageName);

                const key = messageName.toLowerCase();
                const listeners = this.broadcastListeners.get(key) || [];
                listeners.push(script);
                this.broadcastListeners.set(key, listeners);
            }
        });
    }

    triggerFlag(): void {
        vmLog.info('Green flag clicked - stopping all scripts before restart');
        this.stopAll();

        const allSprites = spriteManager.getAllSprites();
        vmLog.info(`TriggerFlag: scanning ${allSprites.length} entities`);
        let flagScripts = 0;

        for (const sprite of allSprites) {
            const scripts = (sprite.scripts as CompiledScript[]) || [];
            for (const script of scripts) {
                if (script.trigger === 'flag') {
                    flagScripts++;
                    this.setRunning(true);
                    this.runScript(script);
                }
            }
        }

        // Start polling for greater_than triggers (e.g. "when timer > 5")
        this.startGreaterThanPolling();

        // Start polling for hand sign triggers (e.g. "when hand sign Thumbs Up")
        this.startHandSignPolling();

        if (flagScripts === 0) {
            this.checkAllFinished();
        }
    }

    triggerSpriteClick(spriteId: string): void {
        let matched = 0;
        const allSprites = spriteManager.getAllSprites();

        for (const sprite of allSprites) {
            // We scan all sprites because multiple sprites (clones) might share the same ID logic 
            // or we might want global listeners. In standard leap, only the clicked sprite responds.
            if (sprite.id !== spriteId) continue;

            const scripts = (sprite.scripts as CompiledScript[]) || [];
            for (const script of scripts) {
                if (script.trigger === 'sprite_click') {
                    matched++;
                    this.setRunning(true);

                    // leap behavior: clicking the sprite restarts its onclick scripts
                    if (script.hatBlockId) {
                        this.stopScriptByHat(sprite.id, script.hatBlockId);
                    }

                    this.runScript(script).catch(err => {
                        vmLog.error(`Error in sprite click script for sprite ${sprite.id}`, err);
                    });
                }
            }
        }

        // Also check Stage if spriteId is 'stage'
        if (spriteId === 'stage') {
            for (const script of this.stageScripts) {
                if (script.trigger === 'sprite_click') {
                    matched++;
                    this.setRunning(true);
                    if (script.hatBlockId) this.stopScriptByHat('stage', script.hatBlockId);
                    this.runScript(script);
                }
            }
        }
    }

    /**
     * Trigger all "when key pressed" scripts across all registered sprites.
     */
    triggerKey(key: string): void {
        const allSprites = spriteManager.getAllSprites();
        let matchedTotal = 0;

        for (const sprite of allSprites) {
            const scripts = (sprite.scripts as CompiledScript[]) || [];
            for (const script of scripts) {
                // Handle matching for specific key or "any"
                if (script.trigger === 'key' && (this.normalizeTriggerKey(script.triggerKey!) === key || script.triggerKey === 'any')) {
                    matchedTotal++;
                    this.setRunning(true);

                    // Stop existing before restart
                    if (script.hatBlockId) {
                        this.stopScriptByHat(sprite.id, script.hatBlockId);
                    }

                    this.runScript(script).catch(err => {
                        vmLog.error(`Error in key pressed script for sprite ${sprite.id}`, err);
                    });
                }
            }
        }

        // Also check Stage
        for (const script of this.stageScripts) {
            if (script.trigger === 'key' && (this.normalizeTriggerKey(script.triggerKey!) === key || script.triggerKey === 'any')) {
                matchedTotal++;
                this.setRunning(true);
                if (script.hatBlockId) this.stopScriptByHat('stage', script.hatBlockId);
                this.runScript(script);
            }
        }

        if (matchedTotal > 0) {
            vmLog.trigger('key_pressed', { key, matchedTotal });
            console.log(`[AnimationVM] Distributed key press '${key}' to ${matchedTotal} script(s) across sprites.`);
        }
    }

    stopAll(): void {
        vmLog.info('stopAll() called');
        this.setRunning(false);

        // Stop greater_than trigger polling
        this.stopGreaterThanPolling();

        // Stop hand sign trigger polling
        this.stopHandSignPolling();

        // Resolve any pending pause so aborted scripts can exit cleanly
        if (this.isPaused && this.resolvePause) {
            this.resolvePause();
        }
        this.isPaused = false;

        for (const [id, data] of this.runningScripts) {
            vmLog.info(`Aborting script: ${id}`);
            data.controller.abort();
        }
        this.runningScripts.clear();
        soundManager.stopAll();

        // Clear highlights
        if (this.onHighlightBlock) {
            // We'd need to clear for all sprites if we tracked them, 
            // but clearing for current is usually enough as UI only shows one.
            // We pass null to clear.
            this.onHighlightBlock(null, '');
        }

        vmLog.info('All scripts stopped');

        // Notify React UI to clear any pending state (ask prompts, etc.)
        if (this.onStopAll) this.onStopAll();
    }

    /**
     * Stop all scripts running for a specific sprite.
     * Useful for restarting a script stack on click.
     */
    stopSpriteScripts(spriteId: string): void {
        const toStop: string[] = [];
        for (const [id, data] of this.runningScripts) {
            if (data.spriteId === spriteId) {
                toStop.push(id);
            }
        }
        toStop.forEach(id => {
            const data = this.runningScripts.get(id);
            if (data) {
                data.controller.abort();
                this.runningScripts.delete(id);
            }
        });
        this.checkAllFinished();
    }

    /**
     * Stop a specific script identified by its hat block.
     * Standard leap behavior: if a broadcast is received, the script for it restarts.
     */
    stopScriptByHat(spriteId: string, hatBlockId: string): void {
        const toStop: string[] = [];
        for (const [id, data] of this.runningScripts) {
            if (data.spriteId === spriteId && data.hatBlockId === hatBlockId) {
                toStop.push(id);
            }
        }
        toStop.forEach(id => {
            const data = this.runningScripts.get(id);
            if (data) {
                data.controller.abort();
                this.runningScripts.delete(id);
            }
        });
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

        // Keep window.__activeSpriteId in sync so window.runtime.pen targets this sprite
        if (typeof window !== 'undefined') {
            (window as any).__activeSpriteId = script.spriteId;
        }

        const id = `${script.spriteId}-${Date.now()}-${Math.random()}`;
        const controller = new AbortController();
        this.runningScripts.set(id, {
            controller,
            spriteId: script.spriteId,
            hatBlockId: script.hatBlockId,
            trigger: script.trigger,
            triggerKey: script.triggerKey
        });
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
            onLog: this.onLog,
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
        for (let i = 0; i < steps.length; i++) {
            await this.checkPause();

            if (signal.aborted || !this.isRunning) {
                if (this.onHighlightBlock) this.onHighlightBlock(null, ctx.sprite.id);
                throw new DOMException('Aborted', 'AbortError');
            }

            const step = steps[i];
            if (step.blockId && this.onHighlightBlock) {
                this.onHighlightBlock(step.blockId, ctx.sprite.id);
            }

            await this.executeStep(step, ctx, signal);
        }
        if (this.onHighlightBlock) this.onHighlightBlock(null, ctx.sprite.id);
    }


    private async executeStep(step: ScriptStep, ctx: VMContext, signal: AbortSignal): Promise<void> {
        const { sprite } = ctx;

        const evalNum = (val: number | (() => number)) => {
            return typeof val === 'function' ? val() : val;
        };

        switch (step.type) {
            case 'move_steps':
                motionEngine.move(sprite, evalNum(step.steps));
                break;

            case 'turn_right':
                motionEngine.turnRight(sprite, evalNum(step.degrees));
                break;

            case 'turn_left':
                motionEngine.turnLeft(sprite, evalNum(step.degrees));
                break;

            case 'go_to_xy':
                motionEngine.goTo(sprite, evalNum(step.x), evalNum(step.y));
                break;

            case 'glide_to_xy':
                motionEngine.glide(sprite, evalNum(step.x), evalNum(step.y), evalNum(step.secs));
                await this.waitForGlide(sprite, signal);
                break;

            case 'point_direction':
                motionEngine.pointInDirection(sprite, evalNum(step.direction));
                break;

            // LeapBlox motion extensions
            case 'go_to':
                motionEngine.goToTarget(step.target, sprite, {
                    width: STAGE_CONFIG.WIDTH,
                    height: STAGE_CONFIG.HEIGHT,
                    mouseX: this.mouseX,
                    mouseY: this.mouseY
                });
                break;

            case 'glide_to':
                {
                    let tx = sprite.x;
                    let ty = sprite.y;

                    if (step.target === 'random' || step.target === '_random_') {
                        tx = (Math.random() - 0.5) * STAGE_CONFIG.WIDTH;
                        ty = (Math.random() - 0.5) * STAGE_CONFIG.HEIGHT;
                    } else if (step.target === 'mouse' || step.target === '_mouse_') {
                        tx = this.mouseX;
                        ty = this.mouseY;
                    } else {
                        const targetSprite = spriteManager.getSprite(step.target);
                        if (targetSprite) {
                            tx = targetSprite.x;
                            ty = targetSprite.y;
                        }
                    }

                    // Strict clamping for glide target too
                    const costume = sprite.currentCostume;
                    const scale = sprite.size / 100;
                    const sw = (costume?.width || 40) * scale;
                    const sh = (costume?.height || 40) * scale;

                    tx = Math.max(-240 + sw / 2, Math.min(240 - sw / 2, tx));
                    ty = Math.max(-180 + sh / 2, Math.min(180 - sh / 2, ty));

                    sprite.startGlide(tx, ty, evalNum(step.secs));
                }
                await this.waitForGlide(sprite, signal);
                break;

            case 'point_towards':
                if (step.towards === 'mouse') {
                    const dx = this.mouseX - sprite.x;
                    const dy = this.mouseY - sprite.y;
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90; // Convert to leap direction (0=up, 90=right)
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
                sprite.setX(sprite.x + evalNum(step.dx));
                break;

            case 'change_y':
                sprite.setY(sprite.y + evalNum(step.dy));
                break;

            case 'set_x':
                sprite.setX(evalNum(step.x));
                break;

            case 'set_y':
                sprite.setY(evalNum(step.y));
                break;

            case 'say':
                sprite.say(typeof step.message === 'function' ? step.message() : step.message);
                break;

            case 'say_for_secs': {
                const rawMessage = typeof step.message === 'function' ? step.message() : step.message;
                const message = rawMessage === null || rawMessage === undefined ? '' : String(rawMessage);
                const secs = typeof step.secs === 'function' ? step.secs() : step.secs;
                vmLog.step(`Executing Say "${message}" for ${secs} seconds`);
                sprite.say(message, secs);
                await this.sleep(secs * 1000, signal);
                if (!signal.aborted && sprite.sayText === message) {
                    sprite.clearSay();
                }
                break;
            }

            case 'show':
                costumeEngine.show(sprite);
                break;

            case 'hide':
                costumeEngine.hide(sprite);
                break;

            case 'mirror':
                costumeEngine.toggleMirror(sprite);
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

            case 'think_for_secs': {
                const rawMessage = typeof step.message === 'function' ? step.message() : step.message;
                const message = rawMessage === null || rawMessage === undefined ? '' : String(rawMessage);
                const secs = typeof step.secs === 'function' ? step.secs() : step.secs;
                sprite.think(message, secs);
                await this.sleep(secs * 1000, signal);
                if (!signal.aborted && sprite.thinkText === message) {
                    sprite.clearThink();
                }
                break;
            }

            case 'switch_costume': {
                // CostumeEngine handles validation, fuzzy matching, and fallback
                const costumeName = step.costume;
                if (costumeName && typeof costumeName === 'string') {
                    costumeEngine.setCostume(sprite, costumeName);
                }
                break;
            }

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
            case 'wait': {
                const secs = typeof step.secs === 'function' ? step.secs() : step.secs;
                await this.sleep(secs * 1000, signal);
                break;
            }
            case 'repeat': {
                const times = typeof step.times === 'function' ? step.times() : step.times;
                for (let i = 0; i < times; i++) {
                    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    await this.executeSteps(step.body, ctx, signal);
                }
                break;
            }

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
                const targetSprite = step.target === '_myself_' || step.target === 'myself' || step.target === sprite.name
                    ? sprite
                    : spriteManager.getSprite(step.target) || spriteManager.getSpriteByName(step.target);

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
                        const scriptData = this.runningScripts.get(abortId);
                        if (scriptData) {
                            scriptData.controller.abort();
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
                await this.playSound(ctx.sprite, step.sound, false, signal);
                break;

            case 'play_sound_until_done':
                await this.playSound(ctx.sprite, step.sound, true, signal);
                break;


            case 'stop_all_sounds':
                soundManager.stopAll();
                break;

            case 'set_volume':
                ctx.sprite.setVolume(step.volume);
                break;

            case 'change_volume':
                ctx.sprite.changeVolume(step.change);
                break;

            case 'set_sound_effect':
                ctx.sprite.setSoundEffect(step.effect, step.value);
                break;

            case 'change_sound_effect':
                ctx.sprite.changeSoundEffect(step.effect, step.value);
                break;

            case 'clear_sound_effects':
                ctx.sprite.clearSoundEffects();
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
                // Stamp a dot at the tip so single-click leaves a mark
                if (penManager.isReady()) {
                    const tip = sprite.getPenTipPosition();
                    const sw = STAGE_CONFIG.WIDTH;
                    const sh = STAGE_CONFIG.HEIGHT;
                    (penManager as any).drawDot(
                        sw / 2 + tip.x,
                        sh / 2 - tip.y,
                        sprite.penColor,
                        sprite.penSize
                    );
                }
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

            // ── Realistic pencil drawing steps ──────────────────────────────
            case 'go_to_mouse_with_pen': {
                const shouldDraw = step.penDown !== false;

                // Compute where the tip currently is (before moving)
                const prevTip = sprite.getPenTipPosition();

                // Position the sprite so its TIP lands on the mouse, not its center.
                // getCenterForTipAt() back-calculates the center offset.
                const center = sprite.getCenterForTipAt(this.mouseX, this.mouseY);
                sprite.setX(center.x);
                sprite.setY(center.y);

                // After moving, the tip is now at mouse position
                const newTip = sprite.getPenTipPosition();

                if (shouldDraw) {
                    sprite.setPenDown(true);
                    if (penManager.isReady()) {
                        const stageW = STAGE_CONFIG.WIDTH;
                        const stageH = STAGE_CONFIG.HEIGHT;
                        // Draw from previous tip to new tip (both in canvas coords)
                        penManager.drawLine(
                            stageW / 2 + prevTip.x, stageH / 2 - prevTip.y,
                            stageW / 2 + newTip.x, stageH / 2 - newTip.y,
                            sprite.penColor,
                            sprite.penSize
                        );
                    }
                } else {
                    sprite.setPenDown(false);
                }
                break;
            }

            case 'point_towards_mouse_smooth': {
                // Tilt the pencil so it leans toward the direction of travel.
                // The pencil tip should point in the direction of mouse movement.
                const smoothFactor = step.smoothFactor ?? 0.3;
                const dx = this.mouseX - sprite.getPenTipPosition().x;
                const dy = this.mouseY - sprite.getPenTipPosition().y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 2) {
                    // atan2(dy, dx) gives math angle (0=right, CCW positive)
                    // leap direction: 90=right, 0=up → leapDir = 90 - mathDeg
                    // But for a pencil leaning toward movement: tip points in travel direction
                    // Pencil image has tip at bottom → when direction=135 (down-left), tip points down-left
                    // So target direction = direction of travel = atan2(-dy, dx) * 180/π + 90
                    // (negative dy because leap y is flipped vs canvas)
                    const targetAngle = Math.atan2(-dy, dx) * (180 / Math.PI) + 90;
                    const currentDir = sprite.direction;

                    // Shortest-path interpolation
                    let delta = targetAngle - currentDir;
                    while (delta > 180) delta -= 360;
                    while (delta < -180) delta += 360;

                    let newDir = currentDir + delta * smoothFactor;
                    while (newDir > 180) newDir -= 360;
                    while (newDir < -180) newDir += 360;

                    sprite.pointInDirection(newDir);
                }
                break;
            }

            // Face Detection extension steps
            case 'fd_action' as any: {
                const fdAction = (step as any).action;
                const fdTransparency = (step as any).transparency;
                // Turn camera on/off via React state callback
                if (typeof window !== 'undefined') {
                    if (fdAction === 'on' || fdAction === 'analyze') {
                        (window as any).__setCameraOn?.(true);
                    } else if (fdAction === 'off') {
                        (window as any).__setCameraOn?.(false);
                    }
                    // Also call face runtime to start/stop detection loop
                    if ((window as any).runtime?.face) {
                        (window as any).runtime.face.analyse(fdAction);
                        // Apply transparency if provided
                        if (fdTransparency !== undefined) {
                            (window as any).runtime.face.setVideoTransparency?.(fdTransparency);
                        }
                    }
                }
                break;
            }
            case 'fd_report' as any: {
                // Statement reporter blocks — execute runtime action and say result
                if (typeof window !== 'undefined' && (window as any).runtime?.face) {
                    const face = (window as any).runtime.face;
                    const feature = (step as any).feature;
                    let result: string;

                    switch (feature) {
                        case 'fd_show_bounding_box': {
                            const boxState = (step as any).state || 'show';
                            face.setBoundingBox?.(boxState);
                            result = '';
                            break;
                        }
                        case 'fd_set_threshold': {
                            const threshold = (step as any).threshold ?? 0.5;
                            face.setThreshold?.(threshold);
                            result = '';
                            break;
                        }
                        case 'fd_add_class': {
                            const classN = (step as any).classN ?? 1;
                            const className = (step as any).className || 'Jarvis';
                            const classSource = (step as any).classSource || 'camera';
                            face.addClass?.(classN, className, classSource);
                            result = '';
                            break;
                        }
                        case 'fd_reset_class':
                            face.resetClasses?.();
                            result = '';
                            break;
                        case 'fd_do_face_matching':
                            await face.doFaceMatching?.('camera');
                            result = '';
                            break;
                        default:
                            // get # faces / get expression
                            result = feature
                                ? String(face.detectFeature(feature) ?? '')
                                : String(face.getFaceCount());
                            sprite.say(result);
                    }
                }
                break;
            }

            // Hand Pose extension steps
            case 'hp_action' as any: {
                const hpAction = (step as any).action;
                if (typeof window !== 'undefined') {
                    if (hpAction === 'on' || hpAction === 'analyze') (window as any).__setCameraOn?.(true);
                    else if (hpAction === 'off') (window as any).__setCameraOn?.(false);
                    if ((window as any).runtime?.handPose) (window as any).runtime.handPose.analyse(hpAction);
                }
                break;
            }
            case 'hp_move_with' as any: {
                const finger = (step as any).finger;
                if (typeof window !== 'undefined' && (window as any).runtime?.handPose) {
                    (window as any).runtime.handPose.moveSpriteToFinger(finger);
                }
                break;
            }
            case 'hp_report' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.handPose) {
                    const sign = (window as any).runtime.handPose.getSign();
                    sprite.say("Sign: " + sign);
                }
                break;
            }

            // Body Detection extension steps (smooth interval-based)
            case 'bd_action' as any: {
                const bdAction = (step as any).action;
                if (typeof window !== 'undefined') {
                    if (bdAction === 'on' || bdAction === 'analyze') {
                        (window as any).__setCameraOn?.(true);
                        (window as any).runtime?.bodyDetection?.setCameraOn?.("on");
                    } else if (bdAction === 'off') {
                        (window as any).__setCameraOn?.(false);
                        (window as any).runtime?.bodyDetection?.setCameraOn?.("off");
                    }
                }
                break;
            }

            // ML Environment extension steps
            case 'ml_action' as any: {
                const mlAction = (step as any).action;
                if (typeof window !== 'undefined' && (window as any).runtime?.ml) {
                    (window as any).runtime.ml.analyse(mlAction);
                }
                break;
            }
            case 'ml_add_sample' as any: {
                const mlLabel = (step as any).label || 'class1';
                if (typeof window !== 'undefined' && (window as any).runtime?.ml) {
                    (window as any).__setCameraOn?.(true);
                    await new Promise(r => setTimeout(r, 500)); // let camera warm up
                    await (window as any).runtime.ml.addSample(mlLabel);
                    vmLog.info(`ML: Added sample for "${mlLabel}"`);
                }
                break;
            }
            case 'ml_train' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.ml) {
                    (window as any).runtime.ml.train();
                    vmLog.info('ML: Model trained');
                }
                break;
            }
            case 'ml_clear_all' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.ml) {
                    (window as any).runtime.ml.clearAll();
                    vmLog.info('ML: Cleared all samples');
                }
                break;
            }
            case 'ml_clear_class' as any: {
                const mlClearLabel = (step as any).label || 'class1';
                if (typeof window !== 'undefined' && (window as any).runtime?.ml) {
                    (window as any).runtime.ml.clearClass(mlClearLabel);
                    vmLog.info(`ML: Cleared class "${mlClearLabel}"`);
                }
                break;
            }


            // Object Detection extension steps
            case 'object_detect' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.objectDetection) {
                    (window as any).__setCameraOn?.(true);
                    const objDet = (window as any).runtime.objectDetection;

                    let attempts = 0;
                    while (!objDet.isVideoReady() && attempts < 20) {
                        await this.sleep(100, signal);
                        attempts++;
                    }

                    await objDet.detectObjects();
                    vmLog.info('Object detection executed');
                }
                break;
            }
            case 'object_when_detected' as any: {
                // Now compiled as 'if' step with condition checking isObjectDetected()
                // This case is kept as a no-op for backward compatibility
                break;
            }

            // Music extension steps
            case 'music_play_note' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.music) {
                    const { note, beats } = step as any;
                    await (window as any).runtime.music.playNote(note, beats);
                    vmLog.info(`Played note ${note} for ${beats} beats`);
                }
                break;
            }
            case 'music_set_instrument' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.music) {
                    const { instrument } = step as any;
                    (window as any).runtime.music.setInstrument(instrument);
                    vmLog.info(`Set instrument to ${instrument}`);
                }
                break;
            }
            case 'music_play_drum' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.music) {
                    const { drum, beats } = step as any;
                    await (window as any).runtime.music.playDrum(drum, beats);
                    vmLog.info(`Played drum ${drum} for ${beats} beats`);
                }
                break;
            }
            case 'music_set_tempo' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.music) {
                    const { bpm } = step as any;
                    (window as any).runtime.music.setTempo(bpm);
                    vmLog.info(`Set tempo to ${bpm} BPM`);
                }
                break;
            }
            case 'music_change_tempo' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.music) {
                    const { amount } = step as any;
                    (window as any).runtime.music.changeTempoBy(amount);
                    vmLog.info(`Changed tempo by ${amount}`);
                }
                break;
            }
            case 'music_rest' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.music) {
                    const { beats } = step as any;
                    await (window as any).runtime.music.rest(beats);
                    vmLog.info(`Rested for ${beats} beats`);
                }
                break;
            }

            // Text to Speech extension steps
            case 'tts_speak' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.tts) {
                    const msg = typeof (step as any).message === 'function' ? (step as any).message() : (step as any).message;
                    await (window as any).runtime.tts.speak(msg);
                    vmLog.info(`Spoke: ${msg}`);
                }
                break;
            }
            case 'tts_set_voice' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.tts) {
                    const voice = typeof (step as any).voice === 'function' ? (step as any).voice() : (step as any).voice;
                    (window as any).runtime.tts.setVoice(voice);
                    vmLog.info(`Set voice to ${voice}`);
                }
                break;
            }
            case 'tts_set_rate' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.tts) {
                    const rate = typeof (step as any).rate === 'function' ? (step as any).rate() : (step as any).rate;
                    (window as any).runtime.tts.setRate(rate);
                    vmLog.info(`Set speech rate to ${rate}`);
                }
                break;
            }
            case 'tts_set_volume' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.tts) {
                    const volume = typeof (step as any).volume === 'function' ? (step as any).volume() : (step as any).volume;
                    (window as any).runtime.tts.setVolume(volume);
                    vmLog.info(`Set speech volume to ${volume}`);
                }
                break;
            }
            case 'tts_set_pitch' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.tts) {
                    const pitch = typeof (step as any).pitch === 'function' ? (step as any).pitch() : (step as any).pitch;
                    (window as any).runtime.tts.setPitch(pitch);
                    vmLog.info(`Set speech pitch to ${pitch}`);
                }
                break;
            }
            case 'tts_stop' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.tts) {
                    (window as any).runtime.tts.stop();
                    vmLog.info('Stopped speaking');
                }
                break;
            }

            // Speech Recognition extension steps
            case 'speech_start_listening' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.speech) {
                    const speech = (window as any).runtime.speech;
                    await new Promise<void>((resolve) => {
                        let resolved = false;
                        const done = () => {
                            if (resolved) return;
                            resolved = true;
                            try { speech.stopListening(); } catch { /* ignore */ }
                            resolve();
                        };
                        speech.onResult(() => {
                            done();
                        });
                        speech.startListening();
                        // Timeout after 10s so we don't hang forever
                        setTimeout(done, 10000);
                    });
                    vmLog.info('Listening complete — speech result received');
                }
                break;
            }
            case 'speech_stop_listening' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.speech) {
                    (window as any).runtime.speech.stopListening();
                    vmLog.info('Stopped listening');
                }
                break;
            }
            case 'speech_set_language' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.speech) {
                    (window as any).runtime.speech.setLanguage((step as any).language);
                    vmLog.info(`Set speech language to ${(step as any).language}`);
                }
                break;
            }
            case 'speech_on_result' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.speech) {
                    const bodySteps = (step as any).body as ScriptStep[];
                    (window as any).runtime.speech.onResult(async (text: string, _conf: number) => {
                        this.setVariable('speech', text);
                        if (bodySteps && bodySteps.length > 0) {
                            const ctx: VMContext = {
                                sprite,
                                isRunning: true,
                                keysPressed: this.keysPressed,
                                mouseX: this.mouseX,
                                mouseY: this.mouseY,
                                stopAll: () => this.stopAll(),
                            };
                            const ctrl = new AbortController();
                            await this.executeSteps(bodySteps, ctx, ctrl.signal);
                        }
                    });
                    vmLog.info('Registered speech result handler');
                }
                break;
            }

            // Text Recognition (OCR) extension steps
            case 'ocr_from_camera' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.ocr) {
                    await (window as any).runtime.ocr.recognizeFromCamera();
                    vmLog.info('OCR from camera complete');
                }
                break;
            }
            case 'ocr_from_image' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.ocr) {
                    const src = (step as any).source || 'uploaded';
                    await (window as any).runtime.ocr.recognizeFromImage(src);
                    vmLog.info(`OCR from image (${src}) complete`);
                }
                break;
            }

            // Weather Data extension steps
            case 'weather_get_for_city' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.weather) {
                    const city = (step as any).city || 'London';
                    await (window as any).runtime.weather.fetchWeather(city);
                    vmLog.info(`Weather fetched for ${city}`);
                }
                break;
            }
            case 'weather_get_for_location' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.weather) {
                    const { lat, lon } = step as any;
                    await (window as any).runtime.weather.fetchWeatherByLocation(lat, lon);
                    vmLog.info(`Weather fetched for ${lat}, ${lon}`);
                }
                break;
            }

            // Translate extension steps
            case 'translate_text' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.translate) {
                    const { text, targetLang } = step as any;
                    await (window as any).runtime.translate.translate(text, targetLang);
                    vmLog.info(`Translated "${text}" to ${targetLang}`);
                }
                break;
            }
            case 'translate_set_source' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.translate) {
                    (window as any).runtime.translate.setSourceLanguage((step as any).sourceLang);
                    vmLog.info(`Set source language to ${(step as any).sourceLang}`);
                }
                break;
            }
            case 'translate_set_target' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.translate) {
                    (window as any).runtime.translate.setTargetLanguage((step as any).targetLang);
                    vmLog.info(`Set target language to ${(step as any).targetLang}`);
                }
                break;
            }

            // Data Logger extension steps
            case 'logger_log' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.logger) {
                    const val = typeof (step as any).value === 'function' ? (step as any).value() : (step as any).value;
                    (window as any).runtime.logger.log(val);
                }
                break;
            }
            case 'logger_log_with_label' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.logger) {
                    const val = typeof (step as any).value === 'function' ? (step as any).value() : (step as any).value;
                    (window as any).runtime.logger.logWithLabel((step as any).label, val);
                }
                break;
            }
            case 'logger_clear' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.logger) {
                    (window as any).runtime.logger.clear();
                    vmLog.info('Log cleared');
                }
                break;
            }
            case 'logger_save_to_csv' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.logger) {
                    (window as any).runtime.logger.saveToCSV();
                    vmLog.info('Log saved as CSV');
                }
                break;
            }
            case 'logger_on_new_entry' as any: {
                if (typeof window !== 'undefined' && (window as any).runtime?.logger) {
                    const bodySteps = (step as any).body as ScriptStep[];
                    (window as any).runtime.logger.onNewEntry((_entry: any) => {
                        if (bodySteps && bodySteps.length > 0) {
                            bodySteps.forEach((s: any) => {
                                if (s.type === 'logger_log') {
                                    const val = typeof s.value === 'function' ? s.value() : s.value;
                                    (window as any).runtime?.logger?.log(val);
                                }
                            });
                        }
                    });
                    vmLog.info('Registered logger on_new_entry handler');
                }
                break;
            }

            // Computer Vision blocks
            case 'vision_camera_on':
                if (typeof window !== 'undefined' && (window as any).runtime?.vision) {
                    (window as any).runtime.vision.cameraOn_();
                    vmLog.info('Vision camera on');
                }
                break;
            case 'vision_camera_off':
                if (typeof window !== 'undefined' && (window as any).runtime?.vision) {
                    (window as any).runtime.vision.cameraOff();
                    vmLog.info('Vision camera off');
                }
                break;
            case 'vision_analyze':
                if (typeof window !== 'undefined' && (window as any).runtime?.vision) {
                    await (window as any).runtime.vision.analyze();
                    vmLog.info('Vision analyze frame');
                }
                break;
            case 'vision_detect_objects':
                if (typeof window !== 'undefined' && (window as any).runtime?.vision) {
                    await (window as any).runtime.vision.detectObjects();
                    vmLog.info('Vision detect objects');
                }
                break;
            case 'vision_draw_bounding_boxes':
                if (typeof window !== 'undefined' && (window as any).runtime?.vision) {
                    (window as any).runtime.vision.setBoundingBoxes((step as any).state);
                    vmLog.info('Vision bounding boxes', (step as any).state);
                }
                break;

            // Video Player blocks
            case 'video_set_source': {
                const videoUrl = typeof (step as any).url === 'function' ? (step as any).url() : (step as any).url;
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.setSource(videoUrl);
                    vmLog.info('Video set source', videoUrl);
                }
                break;
            }
            case 'video_play':
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.play();
                    vmLog.info('Video play');
                }
                break;
            case 'video_pause':
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.pause();
                    vmLog.info('Video pause');
                }
                break;
            case 'video_stop':
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.stop();
                    vmLog.info('Video stop');
                }
                break;
            case 'video_show':
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.show();
                    vmLog.info('Video show');
                }
                break;
            case 'video_hide':
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.hide();
                    vmLog.info('Video hide');
                }
                break;
            case 'video_set_speed': {
                const videoSpeed = typeof (step as any).speed === 'function' ? (step as any).speed() : (step as any).speed;
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.setSpeed(videoSpeed);
                    vmLog.info('Video set speed', videoSpeed);
                }
                break;
            }
            case 'video_set_volume': {
                const videoVol = typeof (step as any).volume === 'function' ? (step as any).volume() : (step as any).volume;
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.setVolume(videoVol);
                    vmLog.info('Video set volume', videoVol);
                }
                break;
            }
            case 'video_seek': {
                const videoTime = typeof (step as any).time === 'function' ? (step as any).time() : (step as any).time;
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.seek(videoTime);
                    vmLog.info('Video seek', videoTime);
                }
                break;
            }
            case 'video_set_position': {
                const videoX = typeof (step as any).x === 'function' ? (step as any).x() : (step as any).x;
                const videoY = typeof (step as any).y === 'function' ? (step as any).y() : (step as any).y;
                const videoSize = typeof (step as any).size === 'function' ? (step as any).size() : (step as any).size;
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.setPosition(videoX, videoY, videoSize);
                    vmLog.info('Video set position', { x: videoX, y: videoY, size: videoSize });
                }
                break;
            }
            case 'video_set_loop': {
                const videoLoop = (step as any).loop;
                if (typeof window !== 'undefined' && (window as any).runtime?.video) {
                    (window as any).runtime.video.setLoop(videoLoop);
                    vmLog.info('Video set loop', videoLoop);
                }
                break;
            }
            case 'vs_set_sensitivity': {
                const vsThreshold = typeof (step as any).threshold === 'function' ? (step as any).threshold() : (step as any).threshold;
                if (typeof window !== 'undefined' && (window as any).runtime?.videoSensing) {
                    (window as any).runtime.videoSensing.setSensitivity(vsThreshold);
                    vmLog.info('Video Sensing set sensitivity', vsThreshold);
                }
                break;
            }
            case 'qr_scan_camera': {
                if (typeof window !== 'undefined' && (window as any).runtime?.qrScanner) {
                    await (window as any).runtime.qrScanner.scanCamera();
                    vmLog.info('QR Scanner: camera scan');
                }
                break;
            }
            case 'qr_scan_image': {
                const qrSource = typeof (step as any).source === 'function' ? (step as any).source() : (step as any).source;
                if (typeof window !== 'undefined' && (window as any).runtime?.qrScanner) {
                    await (window as any).runtime.qrScanner.scanImage(qrSource);
                    vmLog.info('QR Scanner: image scan', qrSource);
                }
                break;
            }
            case 'physics_start': {
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.start();
                    vmLog.info('Physics engine started');
                }
                break;
            }
            case 'physics_stop': {
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.stop();
                    vmLog.info('Physics engine stopped');
                }
                break;
            }
            case 'physics_set_gravity': {
                const pgx = typeof (step as any).gx === 'function' ? (step as any).gx() : (step as any).gx;
                const pgy = typeof (step as any).gy === 'function' ? (step as any).gy() : (step as any).gy;
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.setGravity(pgx, pgy);
                    vmLog.info('Physics set gravity', { x: pgx, y: pgy });
                }
                break;
            }
            case 'physics_add_body': {
                const pbSprite = typeof (step as any).spriteId === 'function' ? (step as any).spriteId() : (step as any).spriteId;
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.addBody(pbSprite);
                    vmLog.info('Physics add body', pbSprite);
                }
                break;
            }
            case 'physics_add_force': {
                const pfSprite = typeof (step as any).spriteId === 'function' ? (step as any).spriteId() : (step as any).spriteId;
                const pfx = typeof (step as any).fx === 'function' ? (step as any).fx() : (step as any).fx;
                const pfy = typeof (step as any).fy === 'function' ? (step as any).fy() : (step as any).fy;
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.addForce(pfSprite, pfx, pfy);
                    vmLog.info('Physics add force', { sprite: pfSprite, fx: pfx, fy: pfy });
                }
                break;
            }
            case 'physics_set_bounce': {
                const pbVal = typeof (step as any).value === 'function' ? (step as any).value() : (step as any).value;
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.setBounce(sprite.id, pbVal);
                    vmLog.info('Physics set bounce', pbVal);
                }
                break;
            }
            case 'physics_set_mass': {
                const pmVal = typeof (step as any).value === 'function' ? (step as any).value() : (step as any).value;
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.setMass(sprite.id, pmVal);
                    vmLog.info('Physics set mass', pmVal);
                }
                break;
            }
            case 'physics_set_static': {
                const psSprite = typeof (step as any).spriteId === 'function' ? (step as any).spriteId() : (step as any).spriteId;
                const psVal = (step as any).value === 'yes';
                if (typeof window !== 'undefined' && (window as any).runtime?.physics) {
                    (window as any).runtime.physics.setStatic(psSprite, psVal);
                    vmLog.info('Physics set static', { sprite: psSprite, value: psVal });
                }
                break;
            }
            case 'mm_set_key': {
                const mmSignal = typeof (step as any).signal === 'function' ? (step as any).signal() : (step as any).signal;
                const mmKey = typeof (step as any).key === 'function' ? (step as any).key() : (step as any).key;
                if (typeof window !== 'undefined' && (window as any).runtime?.makeyMakey) {
                    (window as any).runtime.makeyMakey.setKeyMap(mmSignal, mmKey);
                    vmLog.info('Makey Makey set key', { signal: mmSignal, key: mmKey });
                }
                break;
            }

            // Sensing blocks
            case 'ask': {
                const question = typeof step.question === 'function' ? step.question() : step.question;
                await this.askQuestion(question, sprite);
                break;
            }

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
                {
                    const val = step.value();
                    this.setVariable(step.variable, val);
                    ctx.onLog?.(`Variable '${step.variable}' set to ${val}`);
                }
                break;

            case 'data_changevariableby':
                {
                    const delta = step.value();
                    this.changeVariable(step.variable, delta);
                    // Detailed log is already handled in changeVariable() method
                }
                break;

            case 'data_showvariable':
                if (ctx.onShowVariable) ctx.onShowVariable(step.variable);
                ctx.onLog?.(`Show variable: ${step.variable}`);
                break;

            case 'data_hidevariable':
                if (ctx.onHideVariable) ctx.onHideVariable(step.variable);
                ctx.onLog?.(`Hide variable: ${step.variable}`);
                break;

            // List blocks
            case 'list_add': {
                const list = this.getList(step.list);
                const item = step.item();
                list.push(item);
                ctx.onLog?.(`List '${step.list}': Added item '${item}'`);
                vmLog.step('list_add', { list: step.list, item });
                this.onListChange?.(step.list, [...this.getList(step.list)]);
                break;
            }
            case 'list_delete': {
                const list = this.getList(step.list);
                const idx = step.index();
                if (idx >= 1 && idx <= list.length) {
                    const removed = list.splice(idx - 1, 1);
                    ctx.onLog?.(`List '${step.list}': Deleted item at index ${idx} ('${removed[0]}')`);
                    vmLog.step('list_delete', { list: step.list, index: idx });
                    this.onListChange?.(step.list, [...this.getList(step.list)]);
                }
                break;
            }
            case 'list_delete_all': {
                this.lists.set(step.list, []);
                ctx.onLog?.(`List '${step.list}': Deleted all items`);
                vmLog.step('list_delete_all', { list: step.list });
                this.onListChange?.(step.list, []);
                break;
            }
            case 'list_insert': {
                const list = this.getList(step.list);
                const idx = step.index();
                const item = step.item();
                if (idx >= 1 && idx <= list.length + 1) {
                    list.splice(idx - 1, 0, item);
                    ctx.onLog?.(`List '${step.list}': Inserted '${item}' at index ${idx}`);
                    vmLog.step('list_insert', { list: step.list, index: idx, item });
                    this.onListChange?.(step.list, [...this.getList(step.list)]);
                }
                break;
            }
            case 'list_replace': {
                const list = this.getList(step.list);
                const idx = step.index();
                const item = step.item();
                if (idx >= 1 && idx <= list.length) {
                    list[idx - 1] = item;
                    ctx.onLog?.(`List '${step.list}': Replaced item at index ${idx} with '${item}'`);
                    vmLog.step('list_replace', { list: step.list, index: idx, item });
                    this.onListChange?.(step.list, [...this.getList(step.list)]);
                }
                break;
            }
            case 'list_show':
                if (ctx.onShowList) ctx.onShowList(step.list);
                ctx.onLog?.(`Show list: ${step.list}`);
                break;
            case 'list_hide':
                if (ctx.onHideList) ctx.onHideList(step.list);
                ctx.onLog?.(`Hide list: ${step.list}`);
                break;

            // Table blocks
            case 'table_set':
                {
                    const val = step.value();
                    const row = step.row();
                    const col = step.col();
                    this.setInTable(step.table, col, row, val);
                    ctx.onLog?.(`Table '${step.table}': Set [row: ${row}, col: ${col}] to ${val}`);
                }
                break;
            case 'table_add_column':
                {
                    const col = step.col();
                    this.addColumn(step.table, col);
                    ctx.onLog?.(`Table '${step.table}': Added column '${col}'`);
                }
                break;
            case 'table_delete_column':
                {
                    const col = step.col();
                    this.deleteColumn(step.table, col);
                    ctx.onLog?.(`Table '${step.table}': Deleted column '${col}'`);
                }
                break;
            case 'table_show':
                if (ctx.onShowTable) ctx.onShowTable(step.table);
                ctx.onLog?.(`Show table: ${step.table}`);
                break;
            case 'table_hide':
                if (ctx.onHideTable) ctx.onHideTable(step.table);
                ctx.onLog?.(`Hide table: ${step.table}`);
                break;
            case 'table_delete_row':
                {
                    const row = step.row();
                    this.deleteRow(step.table, row);
                    ctx.onLog?.(`Table '${step.table}': Deleted row ${row}`);
                }
                break;
            case 'table_clear':
                this.clearTable(step.table);
                ctx.onLog?.(`Table '${step.table}': Cleared all data`);
                break;
            case 'table_export':
                ctx.onLog?.(`Export table: ${step.table}`);
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
    // KEY HANDLING & NORMALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Normalize browser KeyboardEvent values to leap block values.
     * Maps ' ' to 'space', 'ArrowUp' to 'ArrowUp', etc.
     */
    private normalizeKey(e: KeyboardEvent): string {
        switch (e.key) {
            case ' ': return 'space';
            case 'ArrowUp': return 'ArrowUp';
            case 'ArrowDown': return 'ArrowDown';
            case 'ArrowLeft': return 'ArrowLeft';
            case 'ArrowRight': return 'ArrowRight';
            case 'Enter': return 'enter';
            default:
                // For direct character keys (a-z, 0-9), use the lowercase key value
                if (e.key.length === 1) return e.key.toLowerCase();
                return e.key;
        }
    }

    /**
     * Normalize legacy block dropdown values to canonical key names.
     * The legacy leapBlocks.ts uses 'left arrow' while normalizeKey() returns 'ArrowLeft'.
     * This ensures both old and new block definitions work correctly.
     */
    private normalizeTriggerKey(key: string): string {
        switch (key) {
            case 'up arrow': return 'ArrowUp';
            case 'down arrow': return 'ArrowDown';
            case 'left arrow': return 'ArrowLeft';
            case 'right arrow': return 'ArrowRight';
            default: return key;
        }
    }

    isKeyPressed(key: string): boolean {
        const normalized = this.normalizeTriggerKey(key);
        if (normalized === 'any') return this.keysPressed.size > 0;
        return this.keysPressed.has(normalized);
    }

    isMouseDown(): boolean {
        return this.isMouseDownState;
    }

    setMouseDown(down: boolean): void {
        this.isMouseDownState = down;
        // Also update any global objects if necessary
        if (typeof window !== 'undefined') {
            (window as any).isMouseDown = down;
        }
    }

    getMouseX(): number {
        return this.mouseX;
    }

    getMouseY(): number {
        return this.mouseY;
    }

    setMousePosition(x: number, y: number): void {
        this.mouseX = x;
        this.mouseY = y;
        // Also update any global objects if necessary
        if (typeof window !== 'undefined') {
            (window as any).mouseX = x;
            (window as any).mouseY = y;
        }
    }

    getDistanceTo(target: string, fromSpriteId: string): number {
        const fromSprite = spriteManager.getSprite(fromSpriteId);
        if (!fromSprite) return 0;

        let targetX = 0;
        let targetY = 0;

        if (target === '_mouse_') {
            targetX = this.mouseX;
            targetY = this.mouseY;
        } else if (target === '_edge_') {
            const minX = Math.abs(fromSprite.x - (-240));
            const maxX = Math.abs(fromSprite.x - 240);
            const minY = Math.abs(fromSprite.y - (-155));
            const maxY = Math.abs(fromSprite.y - 155);
            return Math.min(minX, maxX, minY, maxY);
        } else {
            const targetSprite = spriteManager.getSprite(target) || spriteManager.getSpriteByName(target);
            if (!targetSprite) return 10000;
            targetX = targetSprite.x;
            targetY = targetSprite.y;
        }

        const dx = targetX - fromSprite.x;
        const dy = targetY - fromSprite.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isTouching(target: string, fromSpriteId: string): boolean {
        const fromSprite = spriteManager.getSprite(fromSpriteId);
        if (!fromSprite || !fromSprite.visible) return false;

        // Helper to get bounding box half-dimensions for a sprite
        const getHalfDims = (sprite: Sprite): { hw: number; hh: number } => {
            const scale = sprite.size / 100;
            const costume = sprite.currentCostume;
            const w = (costume?.width || 40) * scale;
            const h = (costume?.height || 40) * scale;
            return { hw: w / 2, hh: h / 2 };
        };

        if (target === '_mouse_') {
            const { hw, hh } = getHalfDims(fromSprite);
            return Math.abs(this.mouseX - fromSprite.x) < hw &&
                Math.abs(this.mouseY - fromSprite.y) < hh;
        } else if (target === '_edge_') {
            const { hw, hh } = getHalfDims(fromSprite);
            // Stage bounds: X from -240 to 240, Y from -155 to 155 (480x310)
            return (fromSprite.x + hw) >= 240 || (fromSprite.x - hw) <= -240 ||
                (fromSprite.y + hh) >= 155 || (fromSprite.y - hh) <= -155;
        }

        // Sprite-to-sprite collision: find target by name (supports clones too)
        const allSprites = spriteManager.getAllSprites();
        for (const other of allSprites) {
            // Match by name (not ID) so clones of the target also count
            if (other.name === target && other.id !== fromSpriteId && other.visible) {
                const fromDims = getHalfDims(fromSprite);
                const otherDims = getHalfDims(other);

                // AABB (Axis-Aligned Bounding Box) overlap test
                const overlapX = Math.abs(fromSprite.x - other.x) < (fromDims.hw + otherDims.hw);
                const overlapY = Math.abs(fromSprite.y - other.y) < (fromDims.hh + otherDims.hh);

                if (overlapX && overlapY) return true;
            }
        }

        return false;
    }

    /**
     * Parse a CSS color string (#rrggbb or #rgb) into [r, g, b].
     */
    private parseColor(color: string): [number, number, number] {
        let hex = color.replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        return [
            parseInt(hex.substring(0, 2), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(4, 6), 16),
        ];
    }

    /**
     * Check if an [r,g,b] pixel matches a target color within tolerance.
     */
    private colorMatches(r: number, g: number, b: number, target: [number, number, number], tolerance = 30): boolean {
        return Math.abs(r - target[0]) <= tolerance &&
            Math.abs(g - target[1]) <= tolerance &&
            Math.abs(b - target[2]) <= tolerance;
    }

    /**
     * Render a single sprite onto a fresh offscreen canvas and return its ImageData.
     */
    private renderSpriteToImageData(sprite: Sprite): ImageData | null {
        const w = STAGE_CONFIG.WIDTH;
        const h = STAGE_CONFIG.HEIGHT;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        sprite.render(ctx, w, h);
        return ctx.getImageData(0, 0, w, h);
    }

    /**
     * Render the stage background (backdrop + all sprites except the given one) onto an offscreen canvas.
     */
    private renderStageWithout(excludeSpriteId: string): ImageData | null {
        const w = STAGE_CONFIG.WIDTH;
        const h = STAGE_CONFIG.HEIGHT;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw backdrop
        const backdrop = stageManager.currentBackdrop;
        if (backdrop && backdrop.image) {
            ctx.drawImage(backdrop.image, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
        }

        // Draw all other visible sprites
        const allSprites = spriteManager.getAllSprites();
        for (const s of allSprites) {
            if (s.id !== excludeSpriteId && s.visible) {
                s.render(ctx, w, h);
            }
        }

        return ctx.getImageData(0, 0, w, h);
    }

    isTouchingColor(color: string, fromSpriteId: string): boolean {
        const sprite = spriteManager.getSprite(fromSpriteId);
        if (!sprite || !sprite.visible) return false;

        const target = this.parseColor(color);
        const spriteData = this.renderSpriteToImageData(sprite);
        const stageData = this.renderStageWithout(fromSpriteId);
        if (!spriteData || !stageData) return false;

        const pixels = spriteData.data;
        const stagePixels = stageData.data;
        const len = pixels.length;

        // For every non-transparent pixel of the sprite, check if the stage pixel at that position matches the target color
        for (let i = 0; i < len; i += 4) {
            if (pixels[i + 3] > 0) { // sprite pixel is non-transparent
                if (this.colorMatches(stagePixels[i], stagePixels[i + 1], stagePixels[i + 2], target)) {
                    return true;
                }
            }
        }
        return false;
    }

    isColorTouchingColor(color1: string, color2: string, fromSpriteId: string): boolean {
        const sprite = spriteManager.getSprite(fromSpriteId);
        if (!sprite || !sprite.visible) return false;

        const target1 = this.parseColor(color1);
        const target2 = this.parseColor(color2);
        const spriteData = this.renderSpriteToImageData(sprite);
        const stageData = this.renderStageWithout(fromSpriteId);
        if (!spriteData || !stageData) return false;

        const pixels = spriteData.data;
        const stagePixels = stageData.data;
        const len = pixels.length;

        // For every pixel where the sprite has color1 and the stage has color2, return true
        for (let i = 0; i < len; i += 4) {
            if (pixels[i + 3] > 0 &&
                this.colorMatches(pixels[i], pixels[i + 1], pixels[i + 2], target1)) {
                if (this.colorMatches(stagePixels[i], stagePixels[i + 1], stagePixels[i + 2], target2)) {
                    return true;
                }
            }
        }
        return false;
    }

    getSpriteProperty(target: string, property: string): any {
        // Handle "Stage" target
        if (target === '_stage_' || target === 'Stage') {
            switch (property) {
                case 'backdrop #':
                case 'backdrop_index':
                    return stageManager.getCurrentBackdropIndex() + 1;
                case 'backdrop name':
                case 'backdrop_name':
                    return stageManager.currentBackdrop?.name || '';
                case 'volume':
                    return this.getSprite('stage')?.volume ?? 100;
                default:
                    return 0;
            }
        }

        const sprite = spriteManager.getSprite(target) || spriteManager.getSpriteByName(target);
        if (!sprite) return 0;

        switch (property) {
            case 'x position':
            case 'x':
                return sprite.x;
            case 'y position':
            case 'y':
                return sprite.y;
            case 'direction':
                return sprite.direction;
            case 'costume #':
            case 'costume_index':
                return sprite.currentCostumeIndex + 1;
            case 'costume name':
            case 'costume_name':
                return sprite.currentCostume?.name || '';
            case 'size':
                return sprite.size;
            case 'volume':
                return sprite.volume;
            default:
                return 0;
        }
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
        // Reset greater_than fired states so timer-based triggers can fire again
        this.greaterThanFired.clear();
    }

    getTimer(): number {
        return (Date.now() - this.timerStart) / 1000;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GREATER-THAN TRIGGER POLLING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Start polling for "when timer/loudness > X" hat blocks.
     * These triggers need a periodic check since they aren't event-driven.
     * Uses edge detection: fires once when the condition transitions from false to true.
     */
    private startGreaterThanPolling(): void {
        this.stopGreaterThanPolling();
        this.greaterThanFired.clear();

        const allSprites = spriteManager.getAllSprites();
        const allScripts: CompiledScript[] = [];

        for (const sprite of allSprites) {
            const scripts = (sprite.scripts as CompiledScript[]) || [];
            for (const script of scripts) {
                if (script.trigger === 'greater_than') {
                    allScripts.push(script);
                }
            }
        }
        // Also check stage scripts
        for (const script of this.stageScripts) {
            if (script.trigger === 'greater_than') {
                allScripts.push(script);
            }
        }

        if (allScripts.length === 0) return;

        vmLog.info(`Starting greater_than polling for ${allScripts.length} script(s)`);

        this.greaterThanPollingId = setInterval(() => {
            if (!this.isRunning) return;

            for (const script of allScripts) {
                if (!script.triggerKey) continue;

                const [sensor, valueStr] = script.triggerKey.split(':');
                const threshold = Number(valueStr);
                if (isNaN(threshold)) continue;

                let currentValue = 0;
                if (sensor === 'timer') {
                    currentValue = this.getTimer();
                } else if (sensor === 'loudness') {
                    currentValue = this.getLoudness() || 0;
                } else {
                    continue;
                }

                const conditionMet = currentValue > threshold;
                const hatId = script.hatBlockId || script.triggerKey;

                if (conditionMet && !this.greaterThanFired.has(hatId)) {
                    // Condition just became true — fire the script (edge trigger)
                    this.greaterThanFired.add(hatId);
                    this.setRunning(true);
                    this.stopScriptByHat(script.spriteId, hatId);
                    this.runScript(script).catch(err => {
                        vmLog.error('Error in greater_than trigger script', err);
                    });
                } else if (!conditionMet) {
                    // Condition no longer met — allow re-firing next time it crosses threshold
                    this.greaterThanFired.delete(hatId);
                }
            }
        }, 100); // Poll every 100ms (matches Leap behavior)
    }

    private stopGreaterThanPolling(): void {
        if (this.greaterThanPollingId !== null) {
            clearInterval(this.greaterThanPollingId);
            this.greaterThanPollingId = null;
        }
        this.greaterThanFired.clear();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HAND SIGN TRIGGER POLLING
    // ═══════════════════════════════════════════════════════════════════════

    private startHandSignPolling(): void {
        this.stopHandSignPolling();
        this.handSignFired.clear();

        const allSprites = spriteManager.getAllSprites();
        const allScripts: CompiledScript[] = [];

        for (const sprite of allSprites) {
            const scripts = (sprite.scripts as CompiledScript[]) || [];
            for (const script of scripts) {
                if (script.trigger === 'hand_sign') {
                    allScripts.push(script);
                }
            }
        }
        for (const script of this.stageScripts) {
            if (script.trigger === 'hand_sign') {
                allScripts.push(script);
            }
        }

        if (allScripts.length === 0) return;

        vmLog.info(`Starting hand_sign polling for ${allScripts.length} script(s)`);

        this.handSignPollingId = setInterval(() => {
            if (!this.isRunning) return;

            for (const script of allScripts) {
                if (!script.triggerKey) continue;

                // detectGesture() returns raw values: '2', '5', 'thumbs_up', 'none'
                // script.triggerKey comes from the dropdown and matches these values directly
                let currentSign = '';
                if (typeof window !== 'undefined' && (window as any).runtime?.handPose) {
                    currentSign = (window as any).runtime.handPose.getSign() || '';
                }

                const conditionMet = currentSign === script.triggerKey;
                const hatId = script.hatBlockId || script.triggerKey;

                if (conditionMet && !this.handSignFired.has(hatId)) {
                    this.handSignFired.add(hatId);
                    this.setRunning(true);
                    this.stopScriptByHat(script.spriteId, hatId);
                    this.runScript(script).catch(err => {
                        vmLog.error('Error in hand_sign trigger script', err);
                    });
                } else if (!conditionMet) {
                    this.handSignFired.delete(hatId);
                }
            }
        }, 100);
    }

    private stopHandSignPolling(): void {
        if (this.handSignPollingId !== null) {
            clearInterval(this.handSignPollingId);
            this.handSignPollingId = null;
        }
        this.handSignFired.clear();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BROADCAST MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    registerBroadcast(message: string): void {
        const msg = message.trim();
        if (msg && !this.broadcasts.has(msg)) {
            this.broadcasts.add(msg);
            vmLog.info(`Registered new broadcast message: "${msg}"`);
        }
    }

    getBroadcastMessages(): string[] {
        return Array.from(this.broadcasts);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BROADCAST
    // ═══════════════════════════════════════════════════════════════════════
    triggerBroadcast(message: string): void {
        vmLog.info(`Broadcasting: ${message}`);
        this.registerBroadcast(message);
        const normalizedMessage = message.toLowerCase();

        // 1. Trigger sync callback to ensure all entities have latest scripts
        if (this.onBeforeBroadcast) {
            this.onBeforeBroadcast(message);
        }

        // Collect scripts to run, then defer execution to break synchronous recursion.
        // Without deferral, triggerBroadcast → runScript → executeSteps → broadcast step
        // → triggerBroadcast creates an infinite synchronous call chain that overflows.
        const scriptsToRun: CompiledScript[] = [];

        // 2. Use the cached broadcast listeners for efficiency
        const listeners = this.broadcastListeners.get(normalizedMessage) || [];

        if (listeners.length > 0) {
            console.log(`[AnimationVM] TriggerBroadcast: Dispatching "${message}" to ${listeners.length} listener(s) in active cache.`);
            for (const script of listeners) {
                this.setRunning(true);
                // Stop any existing instance of THIS script before restarting
                if (script.hatBlockId) {
                    this.stopScriptByHat(script.spriteId, script.hatBlockId);
                }
                const targetSprite = spriteManager.getSprite(script.spriteId);
                console.log(`[AnimationVM]   -> Triggering receiver on sprite: ${targetSprite?.name || script.spriteId}`);
                scriptsToRun.push(script);
            }
        } else {
            // Fallback: Scan all sprites if the cache is empty or doesn't match
            // (This handles cases where setScripts wasn't called correctly)
            let matchedInFallback = 0;
            const allSprites = spriteManager.getAllSprites();
            vmLog.info(`TriggerBroadcast Fallback: scanning ${allSprites.length} entities for message: ${message}`);

            for (const sprite of allSprites) {
                const scripts = (sprite.scripts as CompiledScript[]) || [];
                for (const script of scripts) {
                    if (script.trigger === 'broadcast_receive' && (script.triggerKey || '').toLowerCase() === normalizedMessage) {
                        matchedInFallback++;
                        this.setRunning(true);
                        if (script.hatBlockId) {
                            this.stopScriptByHat(sprite.id, script.hatBlockId);
                        }
                        console.log(`[AnimationVM]   -> Triggering fallback receiver on sprite: ${sprite.name} (${sprite.id})`);
                        scriptsToRun.push(script);
                    }
                }
            }
            if (matchedInFallback > 0) {
                console.log(`[AnimationVM] TriggerBroadcast Fallback: Dispatched "${message}" to ${matchedInFallback} matching script(s) via full scan.`);
            } else {
                console.log(`[AnimationVM] TriggerBroadcast: No receivers found for "${message}" across ${allSprites.length} sprites.`);
            }
        }

        // Defer all script execution to the next microtask to prevent stack overflow
        // from recursive broadcast chains (broadcast triggers script that broadcasts again)
        if (scriptsToRun.length > 0) {
            queueMicrotask(() => {
                for (const script of scriptsToRun) {
                    this.runScript(script).catch(err => {
                        vmLog.error('Error in broadcast receive script', err);
                    });
                }
            });
        }
    }

    triggerPhysicsCollision(sprite1Id: string, sprite2Id: string): void {
        const triggerKey = `${sprite1Id}:${sprite2Id}`;
        const triggerKeyReverse = `${sprite2Id}:${sprite1Id}`;
        vmLog.info(`Physics collision: ${sprite1Id} <-> ${sprite2Id}`);

        const allSprites = spriteManager.getAllSprites();
        for (const sprite of allSprites) {
            const scripts = (sprite.scripts as CompiledScript[]) || [];
            for (const script of scripts) {
                if (script.trigger === 'physics_collision') {
                    const key = script.triggerKey || '';
                    if (key === triggerKey || key === triggerKeyReverse) {
                        this.setRunning(true);
                        if (script.hatBlockId) {
                            this.stopScriptByHat(script.spriteId, script.hatBlockId);
                        }
                        this.runScript(script).catch(err => {
                            vmLog.error('Error in physics collision script', err);
                        });
                    }
                }
            }
        }
    }

    async triggerBroadcastAndWait(message: string): Promise<void> {
        vmLog.info(`Broadcasting and waiting: ${message}`);
        this.registerBroadcast(message);
        const normalizedMessage = message.toLowerCase();

        // 1. Trigger sync callback
        if (this.onBeforeBroadcast) {
            this.onBeforeBroadcast(message);
        }

        // Collect scripts to run, then defer execution to break synchronous recursion.
        const scriptsToRun: CompiledScript[] = [];

        // 2. Use cached listeners if available
        const listeners = this.broadcastListeners.get(normalizedMessage) || [];
        if (listeners.length > 0) {
            for (const script of listeners) {
                this.setRunning(true);
                if (script.hatBlockId) {
                    this.stopScriptByHat(script.spriteId, script.hatBlockId);
                }
                scriptsToRun.push(script);
            }
        } else {
            // Fallback scan
            const allSprites = spriteManager.getAllSprites();
            for (const sprite of allSprites) {
                const scripts = (sprite.scripts as CompiledScript[]) || [];
                for (const script of scripts) {
                    if (script.trigger === 'broadcast_receive' && (script.triggerKey || '').toLowerCase() === normalizedMessage) {
                        this.setRunning(true);
                        if (script.hatBlockId) {
                            this.stopScriptByHat(sprite.id, script.hatBlockId);
                        }
                        scriptsToRun.push(script);
                    }
                }
            }
        }

        if (scriptsToRun.length > 0) {
            // Defer script execution to prevent stack overflow from recursive broadcast chains
            const promises = scriptsToRun.map(script =>
                new Promise<void>((resolve, reject) => {
                    queueMicrotask(() => {
                        this.runScript(script).then(resolve, reject);
                    });
                })
            );
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
                if (this.onAnswerChange) this.onAnswerChange(answer);
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
                if (this.onAnswerChange) this.onAnswerChange(answer);
            } catch (e) {
                console.error('Prompt failed', e);
            }
        }

        sprite.clearSay();
    }

    getAnswer(): string {
        return this.currentAnswer || '';
    }

    getSpeechResult(): string {
        // First check the 'speech' variable (set by speech_on_result handler)
        const variableResult = this.variables.get('speech');
        if (variableResult !== undefined && variableResult !== '') {
            return variableResult as string;
        }
        // Fall back to Web Speech API's _lastResult (set by start listening)
        // This bridges the gap when user blocks use start listening without speech_on_result
        if (typeof window !== 'undefined' && (window as any).runtime?.speech) {
            return (window as any).runtime.speech.getLastResult() || '';
        }
        return '';
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

