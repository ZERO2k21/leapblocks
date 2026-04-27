/**
 * useMonitors.ts
 * Manages all on-stage monitor panels: variables, lists, tables, sensing.
 * Wires AnimationVM callbacks so monitors update live during script execution.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { animationVM } from '../../server/vm/animationVM';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hasFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export const normalizeVariableMonitor = (
    monitor: VariableMonitorState,
    index = 0
): VariableMonitorState => ({
    ...monitor,
    visible: monitor.visible ?? true,
    value: monitor.value ?? (monitor.type === 'String' ? '' : 0),
    x: hasFiniteNumber(monitor.x) ? monitor.x : 10,
    y: hasFiniteNumber(monitor.y) ? monitor.y : 10 + index * 30,
    zIndex: hasFiniteNumber(monitor.zIndex) ? monitor.zIndex : 100 + index,
    mode: monitor.mode || 'normal',
    sliderMin: hasFiniteNumber(monitor.sliderMin) ? monitor.sliderMin : 0,
    sliderMax: hasFiniteNumber(monitor.sliderMax) ? monitor.sliderMax : 100,
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMonitors() {
    const [variableMonitors, setVariableMonitors] = useState<VariableMonitorState[]>([]);
    const [listMonitors, setListMonitors] = useState<ListMonitorState[]>([]);
    const [tableMonitors, setTableMonitors] = useState<TableMonitorState[]>([]);
    const [sensingMonitors, setSensingMonitors] = useState<VariableMonitorState[]>([
        { id: 'answer', name: 'answer', type: 'String', scope: 'all_sprites', visible: false, value: '', x: 10, y: 350 },
        { id: 'timer', name: 'timer', type: 'Number', scope: 'all_sprites', visible: false, value: 0, x: 10, y: 380 },
        { id: 'loudness', name: 'loudness', type: 'Number', scope: 'all_sprites', visible: false, value: 0, x: 10, y: 410 },
    ]);

    const variableMonitorsRef = useRef(variableMonitors);
    const listMonitorsRef = useRef(listMonitors);
    const sensingMonitorsRef = useRef(sensingMonitors);
    const syncedVariableMonitorNamesRef = useRef<Set<string>>(new Set());

    useEffect(() => { variableMonitorsRef.current = variableMonitors; }, [variableMonitors]);
    useEffect(() => { listMonitorsRef.current = listMonitors; }, [listMonitors]);
    useEffect(() => { sensingMonitorsRef.current = sensingMonitors; }, [sensingMonitors]);

    // Keep window._monitors_for_sync in sync for toolbox checkboxes
    useEffect(() => {
        (window as any)._monitors_for_sync = {
            variable: variableMonitors,
            list: listMonitors,
            table: tableMonitors,
            sensing: sensingMonitors,
        };
    }, [variableMonitors, listMonitors, tableMonitors, sensingMonitors]);

    // Sync variable values into AnimationVM
    useEffect(() => {
        const activeNames = new Set<string>();
        const prev = syncedVariableMonitorNamesRef.current;
        variableMonitors.forEach(m => {
            activeNames.add(m.name);
            if (!animationVM.hasVariable(m.name) || animationVM.getVariable(m.name) !== m.value) {
                animationVM.setVariable(m.name, m.value);
            }
        });
        prev.forEach(name => { if (!activeNames.has(name)) animationVM.deleteVariable(name); });
        syncedVariableMonitorNamesRef.current = activeNames;
    }, [variableMonitors]);

    // Wire AnimationVM callbacks → React state
    useEffect(() => {
        animationVM.onShowVariable = (name: string) =>
            setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: true } : m));
        animationVM.onHideVariable = (name: string) =>
            setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onShowList = (name: string) =>
            setListMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: true } : m));
        animationVM.onHideList = (name: string) =>
            setListMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onShowTable = (name: string) =>
            setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: true } : m));
        animationVM.onHideTable = (name: string) =>
            setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onVariableChange = (name: string, value: any) =>
            setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, value } : m));
        animationVM.onListChange = (name: string, value: any) =>
            setListMonitors(prev => prev.map(m => m.name === name ? { ...m, items: value } : m));
        animationVM.onTableChange = (name: string, data: any) =>
            setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, data } : m));
        animationVM.onAnswerChange = (answer: string) =>
            setSensingMonitors(prev => prev.map(m => m.name === 'answer' ? { ...m, value: answer } : m));

        return () => {
            animationVM.onShowVariable = undefined;
            animationVM.onHideVariable = undefined;
            animationVM.onShowList = undefined;
            animationVM.onHideList = undefined;
            animationVM.onShowTable = undefined;
            animationVM.onHideTable = undefined;
            animationVM.onVariableChange = undefined;
            animationVM.onListChange = undefined;
            animationVM.onTableChange = undefined;
            animationVM.onAnswerChange = undefined;
        };
    }, []);

    // ─── Position / resize / z-order ─────────────────────────────────────────

    const handleMonitorPositionChange = useCallback((
        type: 'variable' | 'list' | 'table' | 'sensing',
        id: string, x: number, y: number
    ) => {
        if (type === 'variable') setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'sensing') setSensingMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
    }, []);

    const handleMonitorResize = useCallback((
        type: 'list' | 'table', id: string, width: number, height: number
    ) => {
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, width, height } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, width, height } : m));
    }, []);

    const handleMonitorBringToFront = useCallback((
        type: 'variable' | 'list' | 'table' | 'sensing', id: string
    ) => {
        const maxZ = Math.max(
            100,
            ...variableMonitors.map(m => m.zIndex || 100),
            ...listMonitors.map(m => m.zIndex || 100),
            ...tableMonitors.map(m => m.zIndex || 100),
            ...sensingMonitors.map(m => m.zIndex || 100),
        ) + 1;
        if (type === 'variable') setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: maxZ } : m));
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: maxZ } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: maxZ } : m));
        if (type === 'sensing') setSensingMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: maxZ } : m));
    }, [variableMonitors, listMonitors, tableMonitors, sensingMonitors]);

    // ─── Variable-specific ────────────────────────────────────────────────────

    const handleVariableModeChange = useCallback((id: string, mode: 'normal' | 'large' | 'slider') =>
        setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, mode } : m)), []);

    const handleVariableValueChange = useCallback((id: string, value: string | number) => {
        setVariableMonitors(prev => {
            const monitor = prev.find(m => m.id === id);
            if (monitor) animationVM.setVariable(monitor.name, value);
            return prev.map(m => m.id === id ? { ...m, value } : m);
        });
    }, []);

    const handleVariableSliderRangeChange = useCallback((id: string, min: number, max: number) => {
        if (!Number.isFinite(min) || !Number.isFinite(max)) return;
        setVariableMonitors(prev => prev.map(m =>
            m.id === id ? { ...m, sliderMin: Math.min(min, max), sliderMax: Math.max(min, max) } : m
        ));
    }, []);

    // ─── Visibility toggle (called from toolbox checkboxes) ──────────────────

    const handleToggleVisibility = useCallback((name: string, type: string, forceVisible?: boolean) => {
        const setFn =
            type === 'variable' ? setVariableMonitors :
                type === 'list' ? setListMonitors :
                    type === 'table' ? setTableMonitors :
                        setSensingMonitors;

        setFn((prev: any[]) => {
            const existing = prev.find((m: any) => m.name === name);
            const newVisible = forceVisible !== undefined ? forceVisible : !existing?.visible;
            if (existing) return prev.map((m: any) => m.name === name ? { ...m, visible: newVisible } : m);
            if (type === 'sensing') return prev;
            const newY = 10 + prev.length * 30;
            if (type === 'variable') {
                return [...prev, normalizeVariableMonitor({
                    id: `var_${Date.now()}`, name, type: 'Number', scope: 'all_sprites',
                    visible: true, x: 10, y: newY,
                    value: animationVM.hasVariable(name) ? animationVM.getVariable(name) : 0,
                }, prev.length)];
            }
            if (type === 'list') {
                return [...prev, {
                    id: `list_${Date.now()}`, name, scope: 'all_sprites', visible: true,
                    x: 10, y: newY, items: [...animationVM.getList(name)], width: 100, height: 200
                }];
            }
            if (type === 'table') {
                return [...prev, {
                    id: `table_${Date.now()}`, name, scope: 'all_sprites', visible: true,
                    x: 10, y: newY, data: [...animationVM.getTable(name)], width: 300, height: 200
                }];
            }
            return prev;
        });
    }, []);

    return {
        variableMonitors, setVariableMonitors,
        listMonitors, setListMonitors,
        tableMonitors, setTableMonitors,
        sensingMonitors, setSensingMonitors,
        variableMonitorsRef, listMonitorsRef, sensingMonitorsRef,
        handleMonitorPositionChange,
        handleMonitorResize,
        handleMonitorBringToFront,
        handleVariableModeChange,
        handleVariableValueChange,
        handleVariableSliderRangeChange,
        handleToggleVisibility,
        normalizeVariableMonitor,
    };
}
