import { useEffect, useRef, useState, useCallback } from 'react';
import type Blockly from '@blockly-runtime';
import { animationVM } from '../../vm/AnimationVM';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from '../../types/intermediateTypes';

export function useMonitors(
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>,
    setToolboxUpdateKey: React.Dispatch<React.SetStateAction<number>>,
    setAskState: React.Dispatch<React.SetStateAction<{
        isAsking: boolean;
        question: string;
        resolve: ((answer: string) => void) | null;
    }>>
) {
    const [variableMonitors, setVariableMonitors] = useState<VariableMonitorState[]>([]);
    const [listMonitors, setListMonitors] = useState<ListMonitorState[]>([]);
    const [tableMonitors, setTableMonitors] = useState<TableMonitorState[]>([]);
    const [sensingMonitors, setSensingMonitors] = useState<VariableMonitorState[]>([
        { id: 'answer', name: 'answer', type: 'String', scope: 'all_sprites', visible: false, value: '', x: 10, y: 350 },
        { id: 'timer', name: 'timer', type: 'Number', scope: 'all_sprites', visible: false, value: 0, x: 10, y: 380 },
        { id: 'loudness', name: 'loudness', type: 'Number', scope: 'all_sprites', visible: false, value: 0, x: 10, y: 410 }
    ]);

    const variableMonitorsRef = useRef(variableMonitors);
    const listMonitorsRef = useRef(listMonitors);
    const tableMonitorsRef = useRef(tableMonitors);
    const sensingMonitorsRef = useRef(sensingMonitors);
    const syncedVariableMonitorNamesRef = useRef<Set<string>>(new Set());

    useEffect(() => { variableMonitorsRef.current = variableMonitors; }, [variableMonitors]);
    useEffect(() => { listMonitorsRef.current = listMonitors; }, [listMonitors]);
    useEffect(() => { tableMonitorsRef.current = tableMonitors; }, [tableMonitors]);
    useEffect(() => { sensingMonitorsRef.current = sensingMonitors; }, [sensingMonitors]);

    // Keep window monitors in sync for Blockly toolbox checkboxes
    useEffect(() => {
        (window as any)._monitors_for_sync = {
            variable: variableMonitors,
            list: listMonitors,
            table: tableMonitors,
            sensing: sensingMonitors
        };
    }, [variableMonitors, listMonitors, tableMonitors, sensingMonitors]);

    useEffect(() => {
        const activeVariableNames = new Set<string>();
        const previouslySyncedVariableNames = syncedVariableMonitorNamesRef.current;

        variableMonitors.forEach((monitor) => {
            activeVariableNames.add(monitor.name);
            if (!animationVM.hasVariable(monitor.name) || animationVM.getVariable(monitor.name) !== monitor.value) {
                animationVM.setVariable(monitor.name, monitor.value);
            }
        });

        previouslySyncedVariableNames.forEach((name) => {
            if (!activeVariableNames.has(name)) {
                animationVM.deleteVariable(name);
            }
        });

        syncedVariableMonitorNamesRef.current = activeVariableNames;
    }, [variableMonitors]);

    // Sync list monitors to Blockly workspace variable map
    useEffect(() => {
        const ws = workspaceRef.current;
        if (!ws || isLoadingWorkspaceRef.current) return;

        const currentVarMap = ws.getVariableMap();
        if (!currentVarMap) return;

        const existingVars = currentVarMap.getAllVariables() || [];
        const existingListNames = new Set(
            existingVars.filter((v: any) => v.type === 'list').map((v: any) => v.name)
        );

        let changed = false;
        listMonitors.forEach(m => {
            if (!existingListNames.has(m.name)) {
                try {
                    currentVarMap.createVariable(m.name, 'list');
                    changed = true;
                } catch (err) {
                    console.warn('[SyncLists] Failed to create variable in Blockly:', m.name, err);
                }
            }
        });

        if (changed && ws.getToolbox()) {
            setToolboxUpdateKey(k => k + 1);
        }
    }, [listMonitors]);

    // Sync variable monitors to Blockly workspace variable map
    useEffect(() => {
        const ws = workspaceRef.current;
        if (!ws || isLoadingWorkspaceRef.current) return;

        const currentVarMap = ws.getVariableMap();
        if (!currentVarMap) return;

        const existingVars = currentVarMap.getAllVariables() || [];
        const existingVarNames = new Set(
            existingVars.filter((v: any) => v.type === '' || v.type === 'Number' || v.type === 'String').map((v: any) => v.name)
        );

        variableMonitors.forEach(m => {
            if (!existingVarNames.has(m.name)) {
                try {
                    currentVarMap.createVariable(m.name, m.type || '');
                } catch (err) {
                    console.warn('[SyncVars] Failed to create variable in Blockly:', m.name, err);
                }
            }
        });
    }, [variableMonitors]);

    // Sync table monitors to Blockly workspace variable map
    useEffect(() => {
        const ws = workspaceRef.current;
        if (!ws || isLoadingWorkspaceRef.current) return;

        const currentVarMap = ws.getVariableMap();
        if (!currentVarMap) return;

        const existingVars = currentVarMap.getAllVariables() || [];
        const existingTableNames = new Set(
            existingVars.filter((v: any) => v.type === 'table').map((v: any) => v.name)
        );

        tableMonitors.forEach(m => {
            if (!existingTableNames.has(m.name)) {
                try {
                    currentVarMap.createVariable(m.name, 'table');
                } catch (err) {
                    console.warn('[SyncTables] Failed to create variable in Blockly:', m.name, err);
                }
            }
        });
    }, [tableMonitors]);

    const handleMonitorPositionChange = useCallback((type: 'variable' | 'list' | 'table' | 'sensing', id: string, x: number, y: number) => {
        if (type === 'variable') setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'sensing') setSensingMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
    }, []);

    const handleMonitorResize = useCallback((type: 'list' | 'table', id: string, width: number, height: number) => {
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, width, height } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, width, height } : m));
    }, []);

    const handleMonitorBringToFront = useCallback((type: 'variable' | 'list' | 'table' | 'sensing', id: string) => {
        const vMax = Math.max(100, ...variableMonitors.map(m => m.zIndex || 100));
        const lMax = Math.max(100, ...listMonitors.map(m => m.zIndex || 100));
        const tMax = Math.max(100, ...tableMonitors.map(m => m.zIndex || 100));
        const sMax = Math.max(100, ...sensingMonitors.map(m => m.zIndex || 100));
        const maxZ = Math.max(vMax, lMax, tMax, sMax);
        const newZ = maxZ + 1;

        if (type === 'variable') setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
        if (type === 'sensing') setSensingMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
    }, [variableMonitors, listMonitors, tableMonitors, sensingMonitors]);

    const handleVariableModeChange = useCallback((id: string, mode: 'normal' | 'large' | 'slider') => {
        setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, mode } : m));
    }, []);

    const handleVariableValueChange = useCallback((id: string, value: string | number) => {
        setVariableMonitors(prev => {
            const monitor = prev.find(m => m.id === id);
            if (monitor) {
                animationVM.setVariable(monitor.name, value);
                return prev.map(m => m.id === id ? { ...m, value } : m);
            }
            return prev;
        });
    }, []);

    const handleVariableSliderRangeChange = useCallback((id: string, min: number, max: number) => {
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return;
        }
        const nextMin = Math.min(min, max);
        const nextMax = Math.max(min, max);
        setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, sliderMin: nextMin, sliderMax: nextMax } : m));
    }, []);

    const handleListAddItem = useCallback((listName: string, item: string) => {
        setListMonitors(prev => prev.map(m => m.name === listName ? { ...m, items: [...m.items, item] } : m));
        animationVM.addToList(listName, item);
    }, []);

    const handleListEditItem = useCallback((listName: string, index: number, value: string) => {
        setListMonitors(prev => prev.map(m => m.name === listName ? {
            ...m,
            items: m.items.map((item, idx) => idx === index ? value : item)
        } : m));
        animationVM.replaceItemOfList(listName, index + 1, value);
    }, []);

    const handleListDeleteItem = useCallback((listName: string, index: number) => {
        setListMonitors(prev => prev.map(m => m.name === listName ? {
            ...m,
            items: m.items.filter((_, idx) => idx !== index)
        } : m));
        animationVM.deleteOfList(listName, index + 1);
    }, []);

    // Bind AnimationVM execution callbacks to update React state
    useEffect(() => {
        animationVM.onShowVariable = (name) => {
            setVariableMonitors(prev => {
                const existing = prev.find(m => m.name === name);
                if (existing) return prev.map(m => m.name === name ? { ...m, visible: true } : m);
                return prev;
            });
        };
        animationVM.onHideVariable = (name) => setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onShowList = (name) => {
            setListMonitors(prev => {
                const existing = prev.find(m => m.name === name);
                if (existing) return prev.map(m => m.name === name ? { ...m, visible: true } : m);
                return prev;
            });
        };
        animationVM.onHideList = (name) => setListMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onShowTable = (name) => {
            setTableMonitors(prev => {
                const existing = prev.find(m => m.name === name);
                if (existing) return prev.map(m => m.name === name ? { ...m, visible: true } : m);
                return prev;
            });
        };
        animationVM.onHideTable = (name) => setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onAskQuestion = (question: string) => {
            return new Promise<string>((resolve) => {
                setAskState({ isAsking: true, question, resolve });
            });
        };

        animationVM.onStopAll = () => {
            setAskState(prev => {
                if (prev.resolve) prev.resolve('');
                return { isAsking: false, question: '', resolve: null };
            });
        };

        animationVM.onVariableChange = (name, value) => {
            setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, value } : m));
        };

        animationVM.onListChange = (name, value) => {
            setListMonitors(prev => prev.map(m => m.name === name ? { ...m, items: value } : m));
        };

        animationVM.onTableChange = (name, data) => {
            setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, data } : m));
        };

        animationVM.onAnswerChange = (answer: string) => {
            setSensingMonitors(prev => prev.map(m => m.name === 'answer' ? { ...m, value: answer } : m));
        };

        return () => {
            animationVM.onShowVariable = undefined;
            animationVM.onHideVariable = undefined;
            animationVM.onShowList = undefined;
            animationVM.onHideList = undefined;
            animationVM.onShowTable = undefined;
            animationVM.onHideTable = undefined;
            animationVM.onAskQuestion = undefined;
            animationVM.onStopAll = undefined;
            animationVM.onVariableChange = undefined;
            animationVM.onListChange = undefined;
            animationVM.onTableChange = undefined;
            animationVM.onAnswerChange = undefined;
        };
    }, []);

    return {
        variableMonitors, setVariableMonitors,
        listMonitors, setListMonitors,
        tableMonitors, setTableMonitors,
        sensingMonitors, setSensingMonitors,
        variableMonitorsRef, listMonitorsRef, tableMonitorsRef, sensingMonitorsRef,
        handleMonitorPositionChange,
        handleMonitorResize,
        handleMonitorBringToFront,
        handleVariableModeChange,
        handleVariableValueChange,
        handleVariableSliderRangeChange,
        handleListAddItem,
        handleListEditItem,
        handleListDeleteItem,
    };
}
