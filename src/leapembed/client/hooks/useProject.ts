/**
 * useProject.ts
 * Handles save, load, and new project operations.
 */
import { useState, useCallback } from 'react';
import Blockly from '../../server/blockly/runtime';
import { Sprite } from '../stage/Sprite';
import { animationVM } from '../../server/vm/animationVM';
import { spriteManager } from '../../server/engine/spriteManager';
import { stageManager } from '../../server/engine/stageManager';
import { fileService } from '../../server/services/fileService';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from './useMonitors';
import { normalizeVariableMonitor } from './useMonitors';

interface UseProjectOptions {
    sprites: Sprite[];
    spriteWorkspacesRef: React.MutableRefObject<Map<string, object>>;
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
    activeSpriteIdRef: React.MutableRefObject<string | null>;
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>;
    variableMonitors: VariableMonitorState[];
    listMonitors: ListMonitorState[];
    tableMonitors: TableMonitorState[];
    setSprites: (s: Sprite[] | ((prev: Sprite[]) => Sprite[])) => void;
    setSelectedSpriteId: (id: string | null) => void;
    setProjectName: (name: string) => void;
    setVariableMonitors: (v: any) => void;
    setListMonitors: (v: any) => void;
    setTableMonitors: (v: any) => void;
    setCompiledScripts: (v: any) => void;
    setIsRunning: (v: boolean) => void;
    triggerUpdate: () => void;
    addLog: (msg: string) => void;
    loadSpriteWorkspace: (id: string) => void;
    projectName: string;
}

export function useProject({
    sprites, spriteWorkspacesRef, workspaceRef, activeSpriteIdRef,
    isLoadingWorkspaceRef, variableMonitors, listMonitors, tableMonitors,
    setSprites, setSelectedSpriteId, setProjectName,
    setVariableMonitors, setListMonitors, setTableMonitors,
    setCompiledScripts, setIsRunning, triggerUpdate, addLog,
    loadSpriteWorkspace, projectName,
}: UseProjectOptions) {
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    // ─── Save ─────────────────────────────────────────────────────────────────

    const handleSaveProject = useCallback((isSilent = false) => {
        const activeId = activeSpriteIdRef.current;
        if (workspaceRef.current && activeId) {
            const json = Blockly.serialization.workspaces.save(workspaceRef.current);
            spriteWorkspacesRef.current.set(activeId, json);
        }

        const spritesData = sprites.map(s => ({
            id: s.id, name: s.name, spriteType: s.spriteType,
            x: s.x, y: s.y, direction: s.direction, size: s.size, visible: s.visible,
            volume: s.volume, soundEffects: { ...s.soundEffects },
            sounds: (s.id === 'stage' ? stageManager.getAllSounds() : s.sounds)
                .map((snd: any) => ({ name: snd.name, src: snd.src })),
            costumes: s.costumes.map((c: any) => ({ name: c.name, src: c.image.src })),
        }));

        const workspacesData: Record<string, any> = {};
        spriteWorkspacesRef.current.forEach((val, key) => {
            if (val && Object.keys(val).length > 0) workspacesData[key] = val;
        });

        fileService.saveProject(projectName, 'intermediate', {
            sprites: spritesData,
            workspaces: workspacesData,
            monitors: { variables: variableMonitors, lists: listMonitors, tables: tableMonitors },
        });
        addLog(`Project saved: ${projectName}`);
    }, [projectName, sprites, variableMonitors, listMonitors, tableMonitors, addLog,
        activeSpriteIdRef, workspaceRef, spriteWorkspacesRef]);

    // ─── New project ──────────────────────────────────────────────────────────

    const executeNewProject = useCallback(() => {
        sprites.forEach(s => animationVM.unregisterSprite(s.id));
        setSprites([]);
        setSelectedSpriteId(null);
        setProjectName('Untitled');
        spriteWorkspacesRef.current.clear();

        if (workspaceRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
            setTimeout(() => { isLoadingWorkspaceRef.current = false; }, 50);
        }

        setVariableMonitors([]);
        setListMonitors([]);
        setTableMonitors([]);
        setCompiledScripts([]);
        setIsRunning(false);
        animationVM.resetState();
        stageManager.reset();

        const stageSprite = new Sprite('stage', 'Stage', triggerUpdate, 'cat');
        stageSprite.hide();
        animationVM.registerSprite(stageSprite);
        spriteWorkspacesRef.current.set('stage', {});

        const robotId = 'sprite_default';
        const robotSprite = new Sprite(robotId, 'Robot', triggerUpdate, 'robot');
        robotSprite.setX(0); robotSprite.setY(0);
        spriteWorkspacesRef.current.set(robotId, {});

        const loadAssets = async () => {
            await robotSprite.addCostume('idle', 'assets/sprites/robot/robot_idle.svg');
            await robotSprite.addCostume('wave 1', 'assets/sprites/robot/image-removebg-preview (1).png');
            await robotSprite.addCostume('wave 2', 'assets/sprites/robot/image-Photoroom.png');
            await robotSprite.addCostume('talk', 'assets/sprites/robot/image-removebg-preview.png');
            await robotSprite.addSound('Meow', 'assets/sounds/meow.wav');
            animationVM.registerSprite(robotSprite);
            setSprites([stageSprite, robotSprite]);
            activeSpriteIdRef.current = robotId;
            setSelectedSpriteId(robotId);
            triggerUpdate();
            window.dispatchEvent(new Event('leap-stage-update'));
        };
        loadAssets().catch(err => console.error('[Project] Failed to init assets:', err));
        addLog('New project created');
    }, [sprites, triggerUpdate, addLog, spriteWorkspacesRef, workspaceRef,
        isLoadingWorkspaceRef, activeSpriteIdRef, setSprites, setSelectedSpriteId,
        setProjectName, setVariableMonitors, setListMonitors, setTableMonitors,
        setCompiledScripts, setIsRunning]);

    // ─── Open project ─────────────────────────────────────────────────────────

    const executeOpenProject = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.leap,.lbproject,application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const data = await fileService.loadProject(file);
                const validation = fileService.validateProject(data, 'intermediate');
                if (!validation.isValid) { alert(validation.error); return; }
                if (!data.sprites || !data.workspaces) throw new Error('Invalid project file');

                addLog(`Loading project: ${data.projectName || 'Untitled'}`);
                sprites.forEach(s => animationVM.unregisterSprite(s.id));
                spriteWorkspacesRef.current.clear();
                if (workspaceRef.current) workspaceRef.current.clear();
                setProjectName(data.projectName || 'My Project');

                const newSprites: Sprite[] = [];
                stageManager.clearSounds();

                for (const sData of data.sprites) {
                    const s = new Sprite(sData.id, sData.name, triggerUpdate, sData.spriteType || 'cat');
                    s.setX(sData.x); s.setY(sData.y);
                    s.pointInDirection(sData.direction); s.setSize(sData.size);
                    if (sData.visible) s.show(); else s.hide();
                    if (typeof sData.volume === 'number') s.setVolume(sData.volume);
                    if (sData.soundEffects) {
                        if (typeof sData.soundEffects.pitch === 'number') s.setSoundEffect('pitch', sData.soundEffects.pitch);
                        if (typeof sData.soundEffects.pan === 'number') s.setSoundEffect('pan', sData.soundEffects.pan);
                    }
                    for (const c of sData.costumes) await s.addCostume(c.name, c.src);
                    if (Array.isArray(sData.sounds)) {
                        if (sData.id === 'stage') {
                            for (const snd of sData.sounds) await stageManager.addSound(snd.name, snd.src);
                        } else {
                            for (const snd of sData.sounds) await s.addSound(snd.name, snd.src);
                        }
                    }
                    newSprites.push(s);
                    animationVM.registerSprite(s);
                }

                Object.keys(data.workspaces).forEach(id => {
                    spriteWorkspacesRef.current.set(id, data.workspaces[id]);
                });

                if (data.monitors) {
                    setVariableMonitors((data.monitors.variables || []).map(
                        (m: VariableMonitorState, i: number) => normalizeVariableMonitor(m, i)
                    ));
                    setListMonitors(data.monitors.lists || []);
                    setTableMonitors(data.monitors.tables || []);
                } else {
                    setVariableMonitors([]); setListMonitors([]); setTableMonitors([]);
                }

                setSprites(newSprites);
                const firstId = newSprites.length > 0 ? newSprites[0].id : null;
                setSelectedSpriteId(firstId);

                if (firstId) {
                    let attempts = 0;
                    const tryLoad = () => {
                        if (workspaceRef.current) {
                            loadSpriteWorkspace(firstId);
                            triggerUpdate();
                            addLog('Project loaded successfully');
                        } else if (attempts < 10) {
                            attempts++;
                            setTimeout(tryLoad, 200);
                        } else {
                            addLog('Project loaded (Workspace loading delayed)');
                        }
                    };
                    tryLoad();
                } else {
                    triggerUpdate();
                    addLog('Project loaded (Empty)');
                }
            } catch (err: any) {
                console.error('Failed to load project:', err);
                alert(`Failed to load project: ${err.message}`);
            }
        };
        input.click();
    }, [sprites, triggerUpdate, addLog, spriteWorkspacesRef, workspaceRef,
        setSprites, setSelectedSpriteId, setProjectName, setVariableMonitors,
        setListMonitors, setTableMonitors, loadSpriteWorkspace]);

    // ─── Unsaved warning flow ─────────────────────────────────────────────────

    const handleNewProject = useCallback(() => {
        setPendingAction('new'); setShowUnsavedModal(true);
    }, []);

    const handleOpenProject = useCallback(() => {
        setPendingAction('open'); setShowUnsavedModal(true);
    }, []);

    const confirmUnsavedAction = useCallback((saveFirst: boolean) => {
        setShowUnsavedModal(false);
        if (saveFirst) {
            handleSaveProject(true);
            setTimeout(() => {
                if (pendingAction === 'new') executeNewProject();
                if (pendingAction === 'open') executeOpenProject();
                setPendingAction(null);
            }, 500);
        } else {
            if (pendingAction === 'new') executeNewProject();
            if (pendingAction === 'open') executeOpenProject();
            setPendingAction(null);
        }
    }, [pendingAction, handleSaveProject, executeNewProject, executeOpenProject]);

    return {
        showUnsavedModal, setShowUnsavedModal,
        pendingAction,
        handleNewProject,
        handleOpenProject,
        handleSaveProject,
        executeNewProject,
        executeOpenProject,
        confirmUnsavedAction,
    };
}
