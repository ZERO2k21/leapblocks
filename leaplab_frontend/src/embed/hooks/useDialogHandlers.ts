import { useCallback } from 'react';
import Blockly from '@blockly-runtime';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from '../../types/intermediateTypes';
import { normalizeVariableMonitor } from '../../types/intermediateTypes';
import type { BlockArgument } from '../../components/MakeBlockDialog';

export function useDialogHandlers(
    setVariableMonitors: React.Dispatch<React.SetStateAction<VariableMonitorState[]>>,
    setListMonitors: React.Dispatch<React.SetStateAction<ListMonitorState[]>>,
    setTableMonitors: React.Dispatch<React.SetStateAction<TableMonitorState[]>>,
    addLog: (message: string) => void,
    selectedSpriteId: string | null,
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
) {
    const handleCreateVariable = (variable: { name: string; type: 'Number' | 'String'; scope: 'all_sprites' | 'this_sprite' }) => {
        setVariableMonitors(prev => {
            const existing = prev.find(m => m.name === variable.name);
            if (existing) {
                return prev.map(m =>
                    m.name === variable.name
                        ? { ...m, type: variable.type, scope: variable.scope, spriteId: variable.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined, visible: true }
                        : m
                );
            }
            const newMonitor = normalizeVariableMonitor({
                id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: variable.name,
                type: variable.type,
                scope: variable.scope,
                spriteId: variable.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
                visible: true,
                value: variable.type === 'Number' ? 0 : '',
                x: 10 + (prev.length * 20),
                y: 10 + (prev.length * 30)
            }, prev.length);
            return [...prev, newMonitor];
        });
        addLog(`Created variable: ${variable.name} (${variable.type})`);
    };

    const handleCreateList = (list: { name: string; scope: 'all_sprites' | 'this_sprite' }) => {
        setListMonitors(prev => {
            const existing = prev.find(m => m.name === list.name);
            if (existing) {
                return prev.map(m =>
                    m.name === list.name
                        ? { ...m, scope: list.scope, spriteId: list.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined, visible: true }
                        : m
                );
            }
            const newMonitor: ListMonitorState = {
                id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: list.name,
                scope: list.scope,
                spriteId: list.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
                visible: true,
                items: [],
                x: 10 + (prev.length * 20),
                y: 60 + (prev.length * 30),
                width: 140,
                height: 180
            };
            return [...prev, newMonitor];
        });
        addLog(`Created list: ${list.name}`);
    };

    const handleCreateTable = (table: { name: string; rows: number; cols: number; scope: 'all_sprites' | 'this_sprite' }) => {
        const emptyData = Array(table.rows).fill(null).map(() => Array(table.cols).fill(''));
        setTableMonitors(prev => {
            const existing = prev.find(m => m.name === table.name);
            if (existing) {
                return prev.map(m =>
                    m.name === table.name
                        ? { ...m, scope: table.scope, spriteId: table.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined, visible: true }
                        : m
                );
            }
            const newMonitor: TableMonitorState = {
                id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: table.name,
                rows: table.rows,
                cols: table.cols,
                scope: table.scope,
                spriteId: table.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
                visible: true,
                data: emptyData,
                x: 10 + (prev.length * 20),
                y: 260 + (prev.length * 30),
                width: 200,
                height: 150
            };
            return [...prev, newMonitor];
        });
        addLog(`Created table: ${table.name} (${table.rows}×${table.cols})`);
    };

    const handleCreateBlock = (block: { name: string; arguments: BlockArgument[]; warp: boolean }) => {
        const ws = workspaceRef.current;
        if (!ws) return;

        Blockly.Events.setGroup(true);
        try {
            let proccode = block.name;
            const argumentnames: string[] = [];
            const argumentids: string[] = [];

            block.arguments.forEach((arg) => {
                if (arg.type === 'label') {
                    proccode += ` ${arg.value}`;
                } else {
                    proccode += arg.type === 'boolean' ? ' %b' : ' %s';
                    argumentnames.push(arg.value);
                    argumentids.push(arg.id);
                }
            });

            const xmlText = `
                <xml>
                    <block type="procedures_definition" x="50" y="50">
                        <statement name="custom_block">
                            <shadow type="procedures_prototype">
                                <mutation 
                                    proccode="${proccode.replace(/"/g, '&quot;')}" 
                                    argumentnames='${JSON.stringify(argumentnames).replace(/"/g, '&quot;')}' 
                                    argumentids='${JSON.stringify(argumentids).replace(/"/g, '&quot;')}' 
                                    warp="${block.warp}" 
                                />
                            </shadow>
                        </statement>
                    </block>
                </xml>`;

            const xmlDom = Blockly.utils.xml.textToDom(xmlText);
            Blockly.Xml.domToWorkspace(xmlDom, ws);

            addLog(`Created custom block: ${block.name}`);
        } catch (e) {
            console.error('Failed to create custom block', e);
            try {
                let mutationXml = `<mutation>`;
                block.arguments.forEach(arg => {
                    if (arg.type !== 'label') {
                        mutationXml += `<arg name="${arg.value}"></arg>`;
                    }
                });
                mutationXml += `</mutation>`;
                const xmlText = `<xml><block type="procedures_defnoreturn" x="50" y="50"><field name="NAME">${block.name}</field>${mutationXml}</block></xml>`;
                const xmlDom = Blockly.utils.xml.textToDom(xmlText);
                Blockly.Xml.domToWorkspace(xmlDom, ws);
            } catch (e2) { }
        } finally {
            Blockly.Events.setGroup(false);
        }
    };

    const handleShowVariable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'variable', true);
    }, []);

    const handleHideVariable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'variable', false);
    }, []);

    const handleShowList = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'list', true);
    }, []);

    const handleHideList = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'list', false);
    }, []);

    const handleShowTable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'table', true);
    }, []);

    const handleHideTable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'table', false);
    }, []);

    return {
        handleCreateVariable,
        handleCreateList,
        handleCreateTable,
        handleCreateBlock,
        handleShowVariable,
        handleHideVariable,
        handleShowList,
        handleHideList,
        handleShowTable,
        handleHideTable,
    };
}
