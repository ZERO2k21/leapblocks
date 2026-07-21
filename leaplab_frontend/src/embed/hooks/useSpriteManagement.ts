import { useCallback } from 'react';
import Blockly from '@blockly-runtime';
import { spriteManager } from '../../engine/SpriteManager';
import { animationVM } from '../../vm/AnimationVM';
import { setActiveSpriteId } from '../../runtime/RuntimeBridge';
import { migrateWorkspaceBlocks } from '../../utils/blocklyMigration';
import type { EditorMode } from '../../types/intermediateTypes';

export function useSpriteManagement(
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    activeSpriteIdRef: React.MutableRefObject<string | null>,
    spriteWorkspacesRef: React.MutableRefObject<Map<string, object>>,
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>,
    handleWorkspaceChange: (event: any) => void,
    saveCurrentSpriteWorkspace: () => void,
    addLog: (msg: string) => void,
    selectedSpriteId: string | null,
    setSelectedSpriteId: React.Dispatch<React.SetStateAction<string | null>>,
    editorMode: EditorMode,
    setEditorMode: React.Dispatch<React.SetStateAction<EditorMode>>,
    workspaceTab: 'blocks' | 'python' | 'costumes' | 'sounds',
    setWorkspaceTab: React.Dispatch<React.SetStateAction<'blocks' | 'python' | 'costumes' | 'sounds'>>,
    compiledScripts: any[],
    sprites: any[],
    syncAllWorkspacesRef: React.MutableRefObject<(() => any[]) | null>,
    variableMonitorsRef: React.MutableRefObject<{ name: string; type?: string }[]>,
    listMonitorsRef: React.MutableRefObject<{ name: string }[]>,
    tableMonitorsRef: React.MutableRefObject<{ name: string }[]>,
) {
    const loadSpriteWorkspace = useCallback((spriteId: string) => {
        activeSpriteIdRef.current = spriteId;

        const sprite = spriteManager.getSprite(spriteId);
        if (sprite) {
            const sName = sprite.name.toLowerCase();
            if (sName.includes('pencil') || sName.includes('pen')) {
                sprite.autoDetectPenTip();
            }
        }

        if (!workspaceRef.current) {
            console.log('[APP] Workspace unmounted, deferred loading for sprite:', spriteId);
            return;
        }

        const json = spriteWorkspacesRef.current.get(spriteId);
        const ws = workspaceRef.current;
        if (!ws) return;

        isLoadingWorkspaceRef.current = true;
        Blockly.Events.disable();
        console.log('[APP] Switching workspace to:', spriteId);

        try {
            workspaceRef.current.clear();

            if (json && Object.keys(json).length > 0) {
                const migratedJson = migrateWorkspaceBlocks(json);
                Blockly.serialization.workspaces.load(migratedJson, workspaceRef.current);
                console.log('[APP] Successfully loaded workspace for target:', spriteId);

                if (sprite && sprite.costumes && sprite.costumes.length > 0) {
                    const costumeNames = sprite.costumes.map((c: any) => c.name);
                    const defaultCostume = costumeNames[0] || '';
                    const allBlocks = workspaceRef.current.getAllBlocks(false);
                    for (const block of allBlocks) {
                        if (block.type === 'looks_switch_costume' || block.type === 'looks_switchcostumeto') {
                            const val = block.getFieldValue('COSTUME');
                            if (!val || !costumeNames.includes(val)) {
                                if (defaultCostume) {
                                    block.setFieldValue(defaultCostume, 'COSTUME');
                                }
                            }
                        }
                    }
                }
            } else {
                console.log('[APP] Initialized empty workspace for target:', spriteId);
            }

            variableMonitorsRef.current.forEach((m: any) => {
                const existing = ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name);
                if (!existing) {
                    ws.getVariableMap().createVariable(m.name, m.type || '');
                }
            });
            listMonitorsRef.current.forEach((m: any) => {
                const existing = ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name);
                if (!existing) {
                    ws.getVariableMap().createVariable(m.name, 'list');
                }
            });
            tableMonitorsRef.current.forEach((m: any) => {
                const existing = ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name);
                if (!existing) {
                    ws.getVariableMap().createVariable(m.name, 'table');
                }
            });
        } catch (err) {
            console.error('[APP] Error loading workspace JSON:', err);
        } finally {
            Blockly.Events.enable();

            const toolbox = workspaceRef.current.getToolbox() as any;
            if (toolbox?.getSelectedItem?.()) {
                workspaceRef.current.refreshToolboxSelection();
            } else if (toolbox && typeof toolbox.selectItemByPosition === 'function') {
                toolbox.selectItemByPosition(0);
            }

            const flyout = workspaceRef.current.getFlyout() as any;
            if (flyout?.reflowInternal_) flyout.reflowInternal_();

            setTimeout(() => {
                isLoadingWorkspaceRef.current = false;
                if (workspaceRef.current) {
                    handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
                }
            }, 50);
        }
    }, [handleWorkspaceChange]);

    const switchEditorMode = useCallback((newMode: EditorMode) => {
        if (newMode === editorMode) return;
        saveCurrentSpriteWorkspace();
        setEditorMode(newMode);
        if (newMode === 'upload') {
            setWorkspaceTab('blocks');
        }
        addLog(`Switched to ${newMode === 'stage' ? 'Stage' : 'Upload'} Mode`);
    }, [editorMode, addLog, saveCurrentSpriteWorkspace]);

    const handleSoundChange = useCallback(() => {
        if (workspaceRef.current) {
            try {
                workspaceRef.current.refreshToolboxSelection?.();
            } catch {}
        }
    }, []);

    const handleWorkspaceTabChange = useCallback((newTab: 'blocks' | 'python' | 'costumes' | 'sounds') => {
        if (newTab === workspaceTab) return;
        saveCurrentSpriteWorkspace();
        setWorkspaceTab(newTab);
        addLog(`Switched to ${newTab} tab`);
    }, [workspaceTab, saveCurrentSpriteWorkspace, addLog, loadSpriteWorkspace]);

    const handleSpriteSelect = useCallback((newId: string) => {
        if (newId === selectedSpriteId) {
            syncAllWorkspacesRef.current?.();
            animationVM.triggerSpriteClick(newId);
            return;
        }

        if (workspaceRef.current) {
            (workspaceRef.current as any).highlightBlock(null);
        }

        saveCurrentSpriteWorkspace();
        setSelectedSpriteId(newId);
        loadSpriteWorkspace(newId);
    }, [selectedSpriteId, compiledScripts, saveCurrentSpriteWorkspace, loadSpriteWorkspace]);

    const handleSpriteClick = useCallback((id: string) => {
        if (id !== selectedSpriteId) {
            handleSpriteSelect(id);
        }
        setActiveSpriteId(id);
        syncAllWorkspacesRef.current?.();
        animationVM.triggerSpriteClick(id);
    }, [selectedSpriteId, handleSpriteSelect]);

    const getDefaultSoundForSprite = useCallback((tags?: string[], name?: string): { name: string; src: string } => {
        const t = (tags || []).map(s => s.toLowerCase());
        const n = (name || '').toLowerCase();
        if (t.includes('cat') || n.includes('cat')) return { name: 'Meow', src: 'assets/sounds/83c36d806dc92327b9e7049a565c6bff.wav' };
        if (t.includes('dog') || n.includes('dog')) return { name: 'Bark', src: 'assets/sounds/cd8fa8390b0efdd281882533fbfcfcfb.wav' };
        if (t.includes('bird') || n.includes('bird') || n.includes('parrot') || n.includes('toucan') || n.includes('duck')) return { name: 'Chirp', src: 'assets/sounds/3b8236bbb288019d93ae38362e865972.wav' };
        if (t.includes('animals') || t.includes('animal')) return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };
        if (t.includes('people') || t.includes('person') || t.includes('dance') || t.includes('dancing')) return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };
        if (t.includes('sports') || t.includes('sport')) return { name: 'Boing', src: 'assets/sounds/53a3c2e27d1fb5fdb14aaf0cb41e7889.wav' };
        if (n.includes('robot')) return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };
        return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };
    }, []);

    return {
        loadSpriteWorkspace,
        switchEditorMode,
        handleSoundChange,
        handleWorkspaceTabChange,
        handleSpriteSelect,
        handleSpriteClick,
        getDefaultSoundForSprite,
    };
}
