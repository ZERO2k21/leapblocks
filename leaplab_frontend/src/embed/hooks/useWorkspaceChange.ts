import { useCallback } from 'react';
import type React from 'react';
import Blockly from '@blockly-runtime';
import { arduinoGenerator } from '../../generators/arduino-generator';
import { AnimationCompiler } from '../../generators/animation-generator';
import { spriteManager } from '../../engine/SpriteManager';
import type { CompiledScript } from '../../vm/AnimationVM';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from '../../types/intermediateTypes';
import { log } from '../utils/log';

export function useWorkspaceChange(
    editorMode: string,
    appMode: string,
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>,
    setVariableMonitors: React.Dispatch<React.SetStateAction<VariableMonitorState[]>>,
    setListMonitors: React.Dispatch<React.SetStateAction<ListMonitorState[]>>,
    setTableMonitors: React.Dispatch<React.SetStateAction<TableMonitorState[]>>,
    setGeneratedCode: React.Dispatch<React.SetStateAction<string>>,
    setCompiledScripts: React.Dispatch<React.SetStateAction<CompiledScript[]>>,
    setToolboxUpdateKey: React.Dispatch<React.SetStateAction<number>>,
    activeSpriteIdRef: React.MutableRefObject<string | null>,
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>,
) {
    const handleWorkspaceChange = useCallback((event: Blockly.Events.Abstract) => {
        if (event.isUiEvent) return;
        if (!workspaceRef.current) return;
        if (isLoadingWorkspaceRef.current) {
            return;
        }

        if (event.type === Blockly.Events.VAR_CREATE) {
            const createEvent = event as any;
            const varName = createEvent.varName || createEvent.json?.name;
            const varType = createEvent.json?.type || '';

            if (varName) {
                if (varType === '' || varType === 'Number' || varType === 'String') {
                    setVariableMonitors(prev => {
                        if (prev.find(m => m.name === varName)) return prev;
                        return [...prev, {
                            id: `var_${Date.now()}`,
                            name: varName,
                            type: 'Number',
                            scope: 'all_sprites' as const,
                            visible: false,
                            value: 0,
                            x: 10, y: 10 + (prev.length * 30)
                        }];
                    });
                } else if (varType === 'list') {
                    setListMonitors(prev => {
                        if (prev.find(m => m.name === varName)) return prev;
                        return [...prev, {
                            id: `list_${Date.now()}`,
                            name: varName,
                            scope: 'all_sprites' as const,
                            visible: true,
                            x: 10, y: 10 + (prev.length * 30),
                            items: [],
                            width: 100, height: 200
                        } as ListMonitorState];
                    });
                } else if (varType === 'table') {
                    setTableMonitors(prev => {
                        if (prev.find(m => m.name === varName)) return prev;
                        return [...prev, {
                            id: `table_${Date.now()}`,
                            name: varName,
                            scope: 'all_sprites' as const,
                            visible: true,
                            x: 10, y: 10 + (prev.length * 30),
                            data: [],
                            rows: 0, cols: 0,
                            width: 250, height: 200
                        } as TableMonitorState];
                    });
                }
                setToolboxUpdateKey(k => k + 1);
            }
        } else if (event.type === Blockly.Events.VAR_RENAME) {
            const renameEvent = event as any;
            const oldName = renameEvent.oldName;
            const newName = renameEvent.newName;

            setVariableMonitors(prev => prev.map(m => m.name === oldName ? { ...m, name: newName } : m));
            setListMonitors(prev => prev.map(m => m.name === oldName ? { ...m, name: newName } : m));
            setTableMonitors(prev => prev.map(m => m.name === oldName ? { ...m, name: newName } : m));
        } else if (event.type === Blockly.Events.VAR_DELETE) {
            const deleteEvent = event as any;
            const deletedName = deleteEvent.varName;

            setVariableMonitors(prev => prev.filter(m => m.name !== deletedName));
            setListMonitors(prev => prev.filter(m => m.name !== deletedName));
            setTableMonitors(prev => prev.filter(m => m.name !== deletedName));
            setToolboxUpdateKey(k => k + 1);
        }

        try {
            if (editorMode === 'upload') {
                const code = arduinoGenerator.workspaceToCode(workspaceRef.current);
                const formattedCode = `// LeapBlocks - Arduino Code\n\n${code || 'void setup() {\n  // Setup code here\n}\n\nvoid loop() {\n  // Loop code here\n}'}`;
                setGeneratedCode(formattedCode);
            } else {
                const compileTargetId = activeSpriteIdRef.current;

                const liveSprites = spriteManager.getAllSprites();

                const sprite = liveSprites.find(s => s.id === compileTargetId);

                if (sprite) {
                    const compiler = new AnimationCompiler(sprite.id);
                    const scripts = compiler.compile(workspaceRef.current);

                    setCompiledScripts(prev => {
                        const otherSpritesScripts = prev.filter(s => s.spriteId !== sprite.id);
                        return [...otherSpritesScripts, ...scripts];
                    });

                    sprite.setScripts(scripts);

                    const modeLabel = 'Stage Mode';
                    setGeneratedCode(`// ${modeLabel} - ${scripts.length} script(s) compiled\n// Click 🏳️ to run animation`);
                } else {
                    setGeneratedCode('// Add a sprite to start programming!');
                }
            }

            const activeId = activeSpriteIdRef.current;
            if (activeId && workspaceRef.current) {
                const json = Blockly.serialization.workspaces.save(workspaceRef.current);
                spriteWorkspacesRef.current.set(activeId, json);
            }
        } catch (e) {
            console.error('[APP] Code generation error:', e);
            log.generator('Code generation error', e);
        }
    }, [editorMode, appMode, setToolboxUpdateKey, workspaceRef, isLoadingWorkspaceRef,
        setVariableMonitors, setListMonitors, setTableMonitors, setGeneratedCode,
        setCompiledScripts, activeSpriteIdRef, spriteWorkspacesRef]);

    return { handleWorkspaceChange };
}
