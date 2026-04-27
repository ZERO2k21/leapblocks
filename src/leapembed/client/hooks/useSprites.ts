/**
 * useSprites.ts
 * Sprite add/delete/select, workspace load/save, sprite-related window globals.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import Blockly from '../../server/blockly/runtime';
import { Sprite } from '../stage/Sprite';
import type { SpriteType } from '../stage/Sprite';
import { animationVM } from '../../server/vm/animationVM';
import { spriteManager } from '../../server/engine/spriteManager';
import { stageManager } from '../../server/engine/stageManager';
import { setActiveSpriteId } from '../../server/runtime/runtimeBridge';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from './useMonitors';
import type { CompiledScript } from '../../server/vm/animationVM';
import { AnimationCompiler } from '../../server/generators/animationGenerator';

interface UseSpritesOptions {
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
    variableMonitors: VariableMonitorState[];
    listMonitors: ListMonitorState[];
    tableMonitors: TableMonitorState[];
    handleWorkspaceChange: (e: Blockly.Events.Abstract) => void;
    setCompiledScripts: (v: CompiledScript[] | ((p: CompiledScript[]) => CompiledScript[])) => void;
    addLog: (msg: string) => void;
}

export function useSprites({
    workspaceRef, variableMonitors, listMonitors, tableMonitors,
    handleWorkspaceChange, setCompiledScripts, addLog,
}: UseSpritesOptions) {
    const [sprites, setSprites] = useState<Sprite[]>(spriteManager.getAllSprites());
    const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);

    const spriteWorkspacesRef = useRef<Map<string, object>>(new Map());
    const activeSpriteIdRef = useRef<string | null>(null);
    const isLoadingWorkspaceRef = useRef(false);

    // Keep sprites in sync with spriteManager (handles clones etc.)
    useEffect(() => {
        const sync = () => setSprites([...spriteManager.getAllSprites()]);
        spriteManager.setUpdateCallback(sync);
        sync();
        return () => spriteManager.setUpdateCallback(() => { });
    }, []);

    // ─── Force re-render helper ───────────────────────────────────────────────
    const [, forceUpdate] = useState({});
    const triggerUpdate = useCallback(() => forceUpdate({}), []);

    // ─── Save current workspace ───────────────────────────────────────────────
    const saveCurrentSpriteWorkspace = useCallback(() => {
        const id = activeSpriteIdRef.current;
        if (!workspaceRef.current || !id) return;
        const json = Blockly.serialization.workspaces.save(workspaceRef.current);
        spriteWorkspacesRef.current.set(id, json);
    }, [workspaceRef]);

    // ─── Load workspace for a sprite ─────────────────────────────────────────
    const loadSpriteWorkspace = useCallback((spriteId: string) => {
        activeSpriteIdRef.current = spriteId;

        // Auto-detect pen tip for pencil sprites
        const sprite = spriteManager.getSprite(spriteId);
        if (sprite) {
            const n = sprite.name.toLowerCase();
            if (n.includes('pencil') || n.includes('pen')) sprite.autoDetectPenTip();
        }

        if (!workspaceRef.current) return;

        const json = spriteWorkspacesRef.current.get(spriteId);
        const ws = workspaceRef.current;

        isLoadingWorkspaceRef.current = true;
        Blockly.Events.disable();

        try {
            ws.clear();
            if (json && Object.keys(json).length > 0) {
                Blockly.serialization.workspaces.load(json, ws);
            }

            // Sync variables/lists/tables into this workspace's variable map
            variableMonitors.forEach(m => {
                if (!ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name)) {
                    ws.getVariableMap().createVariable(m.name, m.type || '');
                }
            });
            listMonitors.forEach(m => {
                if (!ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name)) {
                    ws.getVariableMap().createVariable(m.name, 'list');
                }
            });
            tableMonitors.forEach(m => {
                if (!ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name)) {
                    ws.getVariableMap().createVariable(m.name, 'table');
                }
            });
        } catch (err) {
            console.error('[Sprites] Error loading workspace:', err);
        } finally {
            Blockly.Events.enable();

            const toolbox = ws.getToolbox() as any;
            if (toolbox?.getSelectedItem?.()) ws.refreshToolboxSelection();
            else if (toolbox?.selectItemByPosition) toolbox.selectItemByPosition(0);

            const flyout = ws.getFlyout() as any;
            if (flyout?.reflowInternal_) flyout.reflowInternal_();

            setTimeout(() => {
                isLoadingWorkspaceRef.current = false;
                if (workspaceRef.current) {
                    handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
                }
            }, 50);
        }
    }, [workspaceRef, variableMonitors, listMonitors, tableMonitors, handleWorkspaceChange]);

    // ─── Select sprite ────────────────────────────────────────────────────────
    const handleSpriteSelect = useCallback((newId: string) => {
        if (newId === selectedSpriteId) {
            animationVM.triggerSpriteClick(newId);
            return;
        }
        if (workspaceRef.current) {
            try { (workspaceRef.current as any).highlightBlock(null); } catch { }
        }
        saveCurrentSpriteWorkspace();
        setSelectedSpriteId(newId);
        loadSpriteWorkspace(newId);
    }, [selectedSpriteId, saveCurrentSpriteWorkspace, loadSpriteWorkspace, workspaceRef]);

    const handleSpriteClick = useCallback((id: string) => {
        if (id !== selectedSpriteId) handleSpriteSelect(id);
        setActiveSpriteId(id);
        animationVM.triggerSpriteClick(id);
    }, [selectedSpriteId, handleSpriteSelect]);

    // ─── Add sprite ───────────────────────────────────────────────────────────
    const getDefaultSound = useCallback((tags?: string[], name?: string) => {
        const t = (tags || []).map(s => s.toLowerCase());
        const n = (name || '').toLowerCase();
        if (t.includes('cat') || n.includes('cat')) return { name: 'Meow', src: 'assets/sounds/83c36d806dc92327b9e7049a565c6bff.wav' };
        if (t.includes('dog') || n.includes('dog')) return { name: 'Bark', src: 'assets/sounds/cd8fa8390b0efdd281882533fbfcfcfb.wav' };
        if (t.includes('bird') || n.includes('bird')) return { name: 'Chirp', src: 'assets/sounds/3b8236bbb288019d93ae38362e865972.wav' };
        return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };
    }, []);

    const addSprite = useCallback((spriteType: SpriteType = 'cat') => {
        saveCurrentSpriteWorkspace();
        const id = `sprite_${Date.now()}`;
        const typeNames: Record<SpriteType, string> = { cat: 'Cat', ball: 'Ball', arrow: 'Arrow', robot: 'Robot' };
        const name = `${typeNames[spriteType]} ${sprites.filter(s => s.spriteType === spriteType).length + 1}`;
        const newSprite = new Sprite(id, name, triggerUpdate, spriteType);

        // Spread positions
        const positions = [
            { x: 120, y: 0 }, { x: -120, y: 0 }, { x: 0, y: 80 }, { x: 0, y: -80 },
            { x: -160, y: 100 }, { x: 160, y: 100 }, { x: -160, y: -100 }, { x: 160, y: -100 },
        ];
        let placed = false;
        for (const pos of positions) {
            if (!sprites.some(s => Math.abs(s.x - pos.x) < 80 && Math.abs(s.y - pos.y) < 80)) {
                newSprite.setX(pos.x); newSprite.setY(pos.y); placed = true; break;
            }
        }
        if (!placed) {
            newSprite.setX(Math.floor(Math.random() * 60) - 30);
            newSprite.setY(Math.floor(Math.random() * 60) - 30);
        }

        animationVM.registerSprite(newSprite);
        const snd = getDefaultSound([], name);
        newSprite.addSound(snd.name, snd.src);
        spriteWorkspacesRef.current.set(id, {});

        if (workspaceRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
            setTimeout(() => { isLoadingWorkspaceRef.current = false; }, 50);
        }

        activeSpriteIdRef.current = id;
        setSelectedSpriteId(id);
        addLog(`Added sprite: ${name}`);
    }, [sprites, addLog, triggerUpdate, saveCurrentSpriteWorkspace, workspaceRef, getDefaultSound]);

    // ─── Add sprite from library ──────────────────────────────────────────────
    const addSpriteFromLibrary = useCallback(async (entry: any) => {
        saveCurrentSpriteWorkspace();
        const id = `sprite_${Date.now()}`;
        const newSprite = new Sprite(id, entry.name, triggerUpdate, 'cat');
        newSprite.setX(Math.floor(Math.random() * 160) - 80);
        newSprite.setY(Math.floor(Math.random() * 120) - 60);

        if (entry.costumes && entry.costumes.length > 0) {
            for (const src of entry.costumes) {
                const cName = src.split('/').pop()?.replace(/\.[^.]+$/, '') || 'costume';
                await newSprite.addCostume(cName, src);
            }
        } else if (entry.image) {
            await newSprite.addCostume(entry.name, entry.image);
        }

        const snd = getDefaultSound(entry.tags, entry.name);
        await newSprite.addSound(snd.name, snd.src);

        animationVM.registerSprite(newSprite);
        spriteWorkspacesRef.current.set(id, {});

        if (workspaceRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
            setTimeout(() => { isLoadingWorkspaceRef.current = false; }, 50);
        }

        activeSpriteIdRef.current = id;
        setSelectedSpriteId(id);
        triggerUpdate();
        window.dispatchEvent(new Event('leap-stage-update'));
        addLog(`Added sprite: ${entry.name}`);
    }, [saveCurrentSpriteWorkspace, triggerUpdate, addLog, workspaceRef, getDefaultSound]);

    // ─── Delete sprite ────────────────────────────────────────────────────────
    const deleteSprite = useCallback((id: string) => {
        animationVM.unregisterSprite(id);
        spriteWorkspacesRef.current.delete(id);
        setSprites(prev => prev.filter(s => s.id !== id));
        if (selectedSpriteId === id) {
            const remaining = sprites.filter(s => s.id !== id);
            const next = remaining.length > 0 ? remaining[0].id : null;
            setSelectedSpriteId(next);
            if (next) loadSpriteWorkspace(next);
            else if (workspaceRef.current) workspaceRef.current.clear();
        }
        addLog('Deleted sprite');
    }, [sprites, selectedSpriteId, addLog, loadSpriteWorkspace, workspaceRef]);

    // ─── Remove background ────────────────────────────────────────────────────
    const handleRemoveBackground = useCallback(async (spriteId: string) => {
        const sprite = sprites.find(s => s.id === spriteId);
        if (!sprite?.currentCostume) return;
        addLog(`Removing background for ${sprite.name}...`);
        const src = sprite.currentCostume.image.src;
        const rel = src.split('assets/')[1];
        if (!rel) { addLog('Error: Could not resolve image path'); return; }
        try {
            const result = await (window as any).electronAPI.removeBackground(`public/assets/${rel}`);
            if (result.success) {
                let finalSrc = src;
                if (src.match(/\.(jpeg|jpg)$/i)) finalSrc = src.replace(/\.(jpeg|jpg)$/i, '.png');
                const newSrc = `${finalSrc}${finalSrc.includes('?') ? '&' : '?'}t=${Date.now()}`;
                await sprite.addCostume(sprite.currentCostume.name, newSrc);
                triggerUpdate();
                window.dispatchEvent(new Event('leap-stage-update'));
                addLog(`Background removed for ${sprite.name}`);
            } else {
                addLog(`Failed: ${result.error}`);
            }
        } catch { addLog('Error in background removal'); }
    }, [sprites, addLog, triggerUpdate]);

    // ─── Expose window globals for Blockly generators ─────────────────────────
    useEffect(() => {
        (window as any).getActiveSpriteSounds = () => {
            const id = activeSpriteIdRef.current;
            if (!id) return [];
            if (id === 'stage') return stageManager.getAllSounds().map((s: any) => s.name);
            return animationVM.getSprite(id)?.sounds?.map((s: any) => s.name) || [];
        };
        (window as any).getActiveSpriteCostumes = () => {
            const id = activeSpriteIdRef.current;
            if (!id) return [];
            return animationVM.getSprite(id)?.costumes?.map((c: any) => c.name) || [];
        };
        (window as any).getActiveStageBackdrops = () =>
            stageManager.getAllBackdrops().map((b: any) => b.name);
        (window as any).getBroadcastMessages = () => animationVM.getBroadcastMessages();
        (window as any).getAllSpriteNames = () => {
            const activeId = activeSpriteIdRef.current;
            const seen = new Set<string>();
            return spriteManager.getAllSprites()
                .filter(s => !s.id.includes('_clone_') && s.id !== activeId && !seen.has(s.name))
                .map(s => { seen.add(s.name); return s.name; });
        };
        (window as any).setPenTip = (nx: number, ny: number) => {
            const sprite = spriteManager.getSprite(activeSpriteIdRef.current || '');
            if (sprite) sprite.setPenTipOffset(nx, ny);
        };
        (window as any).autoDetectPenTip = () => {
            const sprite = spriteManager.getSprite(activeSpriteIdRef.current || '');
            if (sprite) sprite.autoDetectPenTip();
        };
        (window as any).spriteManager = spriteManager;
        (window as any).createNewBroadcast = (cb: (name: string | null) => void) => {
            const name = window.prompt('New message name:');
            if (name) { animationVM.registerBroadcast(name); cb(name); } else cb(null);
        };
        return () => {
            ['getActiveSpriteSounds', 'getActiveSpriteCostumes', 'getActiveStageBackdrops',
                'getAllSpriteNames', 'onToggleVisibility', 'setPenTip', 'autoDetectPenTip',
                'spriteManager', 'createNewBroadcast', 'getBroadcastMessages']
                .forEach(k => delete (window as any)[k]);
        };
    }, []);

    return {
        sprites, setSprites,
        selectedSpriteId, setSelectedSpriteId,
        spriteWorkspacesRef,
        activeSpriteIdRef,
        isLoadingWorkspaceRef,
        triggerUpdate,
        saveCurrentSpriteWorkspace,
        loadSpriteWorkspace,
        handleSpriteSelect,
        handleSpriteClick,
        addSprite,
        addSpriteFromLibrary,
        deleteSprite,
        handleRemoveBackground,
        getDefaultSound,
    };
}
