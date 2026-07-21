export type AppMode = 'home' | 'blocks' | 'python' | 'notebook' | 'ml' | 'xr';

export type EditorMode = 'stage' | 'upload';

export interface VariableMonitorState {
    id: string;
    name: string;
    type: 'Number' | 'String';
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    value: number | string;
    x: number;
    y: number;
    zIndex?: number;
    mode?: 'normal' | 'large' | 'slider';
    sliderMin?: number;
    sliderMax?: number;
}

export const DEFAULT_VARIABLE_MONITOR_MODE: 'normal' = 'normal';
export const DEFAULT_VARIABLE_SLIDER_MIN = 0;
export const DEFAULT_VARIABLE_SLIDER_MAX = 100;

export const hasFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

export const normalizeVariableMonitor = (monitor: VariableMonitorState, index = 0): VariableMonitorState => ({
    ...monitor,
    visible: monitor.visible ?? true,
    value: monitor.value ?? (monitor.type === 'String' ? '' : 0),
    x: hasFiniteNumber(monitor.x) ? monitor.x : 10,
    y: hasFiniteNumber(monitor.y) ? monitor.y : 10 + (index * 30),
    zIndex: hasFiniteNumber(monitor.zIndex) ? monitor.zIndex : 100 + index,
    mode: monitor.mode || DEFAULT_VARIABLE_MONITOR_MODE,
    sliderMin: hasFiniteNumber(monitor.sliderMin) ? monitor.sliderMin : DEFAULT_VARIABLE_SLIDER_MIN,
    sliderMax: hasFiniteNumber(monitor.sliderMax) ? monitor.sliderMax : DEFAULT_VARIABLE_SLIDER_MAX
});

export interface ListMonitorState {
    id: string;
    name: string;
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    items: (string | number)[];
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}

export interface TableMonitorState {
    id: string;
    name: string;
    rows: number;
    cols: number;
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    data: (string | number)[][];
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}
