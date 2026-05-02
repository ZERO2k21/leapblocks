/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef } from "react";
import Blockly from "../../../leapembed/server/blockly/runtime";
import { fileService } from "../../../leapembed/server/services/fileService";
import { JuniorScene, JuniorSprite } from "../types";

const cloneWorkspaceData = (workspaceJson: any) => JSON.parse(JSON.stringify(workspaceJson || {}));

interface UseJuniorProjectProps {
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
    scenes: JuniorScene[];
    setScenes: React.Dispatch<React.SetStateAction<JuniorScene[]>>;
    currentSceneId: string;
    setCurrentSceneId: React.Dispatch<React.SetStateAction<string>>;
    activeSpriteIdRef: React.MutableRefObject<string | null>;
    setActiveSpriteId: React.Dispatch<React.SetStateAction<string | null>>;
    stopBlocks: () => void;
    projectName: string;
    setProjectName: React.Dispatch<React.SetStateAction<string>>;
    saveCurrentWorkspace: () => void;
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>;
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>;
}

export function useJuniorProject({
    workspaceRef,
    scenes,
    setScenes,
    currentSceneId,
    setCurrentSceneId,
    activeSpriteIdRef,
    setActiveSpriteId,
    stopBlocks,
    projectName,
    setProjectName,
    saveCurrentWorkspace,
    spriteWorkspacesRef,
    isLoadingWorkspaceRef
}: UseJuniorProjectProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'new' | 'open' | null>(null);

    const executeNewProject = () => {
        // Clear all per-sprite workspaces
        if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
            spriteWorkspacesRef.current.clear();
            console.log('[JuniorProject] Cleared all sprite workspaces');
        }

        if (workspaceRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            try {
                workspaceRef.current.clear();
            } finally {
                Blockly.Events.enable();
                setTimeout(() => {
                    isLoadingWorkspaceRef.current = false;
                }, 50);
            }
        }

        const id = `robot_default`;
        const newSprite: JuniorSprite = {
            id: id,
            name: "Robot",
            type: "robot",
            x: 200,
            y: 150,
            angle: 0,
            size: 100,
            visible: true,
            mirrored: false,
            speech: null,
            costumes: {
                default: "assets/sprites/robot/robot_idle.svg",
                wave1: "assets/sprites/robot/robot_wave1.svg",
                wave2: "assets/sprites/robot/robot_wave2.svg",
                talk: "assets/sprites/robot/robot_talk1.svg"
            },
            currentCostume: "default",
            blocks: {}
        };

        const defaultScene: JuniorScene = {
            id: "scene1",
            name: "Scene 1",
            background: "white",
            sprites: [newSprite]
        };

        setScenes([defaultScene]);
        setCurrentSceneId("scene1");
        setActiveSpriteId(id);
        activeSpriteIdRef.current = id;
        setProjectName('Untitled');
        console.log('[JuniorApp] New project created');
    };

    const handleNewProject = () => {
        setPendingAction('new');
        setShowUnsavedModal(true);
    };

    const handleSaveProject = (isSilent = false) => {
        saveCurrentWorkspace();
        setTimeout(() => {
            const payload = {
                scenes: scenes,
            };
            fileService.saveProject(projectName, 'junior', payload);
            console.log(`[JuniorApp] Project saved: ${projectName}`);
        }, 50);
    };

    const handleShareProject = () => {
        saveCurrentWorkspace();
        setTimeout(() => {
            const payload = { scenes };
            fileService.shareProject(projectName, 'junior', payload);
            console.log(`[JuniorApp] Project shared: ${projectName}`);
        }, 50);
    };

    const executeOpenProject = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = '.leap,.lbproject,application/json';
            fileInputRef.current.click();
        }
    };

    const handleOpenProject = () => {
        setPendingAction('open');
        setShowUnsavedModal(true);
    };

    const confirmUnsavedAction = (saveFirst: boolean) => {
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
    };

    const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await fileService.loadProject(file);
            const validation = fileService.validateProject(data, 'junior');

            if (!validation.isValid) {
                alert(validation.error);
                return;
            }

            if (!data.scenes) throw new Error('Invalid Junior project file (missing scenes array)');

            console.log(`[JuniorApp] Loading project: ${data.projectName || 'Untitled'}`);

            if (stopBlocks) stopBlocks();

            // Clear per-sprite workspaces and initialize from loaded project
            if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
                spriteWorkspacesRef.current.clear();
                // Pre-populate sprite workspaces from loaded data
                data.scenes.forEach((scene: JuniorScene) => {
                    scene.sprites.forEach((sprite: JuniorSprite) => {
                        if (sprite.blocks && Object.keys(sprite.blocks).length > 0) {
                            spriteWorkspacesRef.current.set(sprite.id, cloneWorkspaceData(sprite.blocks));
                            console.log(`[JuniorProject] Pre-loaded workspace for sprite: ${sprite.id}`);
                        }
                    });
                });
            }

            if (workspaceRef.current) {
                isLoadingWorkspaceRef.current = true;
                Blockly.Events.disable();
                try {
                    workspaceRef.current.clear();
                } finally {
                    Blockly.Events.enable();
                    setTimeout(() => {
                        isLoadingWorkspaceRef.current = false;
                    }, 50);
                }
            }

            setProjectName(data.projectName || 'My Project');
            setScenes(data.scenes);

            const firstScene = data.scenes[0];
            if (firstScene) {
                setCurrentSceneId(firstScene.id);
                const firstSprite = firstScene.sprites[0];
                if (firstSprite) {
                    const newId = firstSprite.id;
                    setActiveSpriteId(newId);
                    activeSpriteIdRef.current = newId;

                    // Load workspace for first sprite
                    setTimeout(() => {
                        if (workspaceRef.current) {
                            isLoadingWorkspaceRef.current = true;
                            Blockly.Events.disable();
                            try {
                                const json = spriteWorkspacesRef?.current?.get(newId) || cloneWorkspaceData(firstSprite.blocks);
                                if (json && Object.keys(json).length > 0) {
                                    Blockly.serialization.workspaces.load(cloneWorkspaceData(json), workspaceRef.current);
                                    console.log(`[JuniorProject] Loaded workspace for first sprite: ${newId}`);
                                }
                            } catch (err) {
                                console.error('[JuniorProject] Error loading workspace:', err);
                            } finally {
                                Blockly.Events.enable();
                                setTimeout(() => {
                                    isLoadingWorkspaceRef.current = false;
                                }, 50);
                            }
                        }
                    }, 100);
                } else {
                    setActiveSpriteId(null);
                    activeSpriteIdRef.current = null;
                    if (workspaceRef.current) workspaceRef.current.clear();
                }
            }

            console.log('[JuniorApp] Project loaded successfully');
        } catch (err: any) {
            console.error('Failed to load project:', err);
            alert('Failed to load project file: ' + err.message);
        } finally {
            e.target.value = "";
        }
    };

    return {
        fileInputRef,
        showUnsavedModal,
        setShowUnsavedModal,
        handleNewProject,
        handleSaveProject,
        handleShareProject,
        handleOpenProject,
        confirmUnsavedAction,
        handleFileLoad,
        pendingAction,
        setPendingAction
    };
}
