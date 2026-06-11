/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useRef } from "react";
import Blockly from "@blockly-runtime";
import { fileService } from "../../../Electra/Client/Src/services/FileService";
import { showToast } from "../components/Toast";

const cloneWorkspaceData = (workspaceJson) => JSON.parse(JSON.stringify(workspaceJson || {}));

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
    isLoadingWorkspaceRef,
    audioEngine
}) {
    const fileInputRef = useRef(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'new' or 'open'

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
        const defaultBlockId = 'start_block_1';
        const newSprite = {
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
            blocks: {
                languageVersion: 0,
                blocks: [{
                    type: "event_flag",
                    id: defaultBlockId,
                    x: 60,
                    y: 60
                }]
            }
        };

        const defaultScene = {
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
            const recordedSounds = audioEngine?.soundBank?.recordedSounds || {};
            const payload = {
                scenes: scenes,
                recordedSounds: recordedSounds
            };
            fileService.saveProject(projectName, 'junior', payload);
            console.log(`[JuniorApp] Project saved: ${projectName}`);
        }, 50);
    };

    const handleShareProject = () => {
        saveCurrentWorkspace();
        setTimeout(() => {
            const recordedSounds = audioEngine?.soundBank?.recordedSounds || {};
            const payload = { scenes, recordedSounds };
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

    const confirmUnsavedAction = (saveFirst) => {
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

    const handleFileLoad = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await fileService.loadProject(file);
            const validation = fileService.validateProject(data, 'junior');

            if (!validation.isValid) {
                showToast(validation.error, 'error');
                return;
            }

            if (!data.scenes) throw new Error('Invalid Junior project file (missing scenes array)');

            console.log(`[JuniorApp] Loading project: ${data.projectName || 'Untitled'}`);

            if (stopBlocks) stopBlocks();

            // Clear per-sprite workspaces and initialize from loaded project
            if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
                spriteWorkspacesRef.current.clear();
                // Pre-populate sprite workspaces from loaded data
                data.scenes.forEach(scene => {
                    scene.sprites.forEach(sprite => {
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

            // Restore recorded sounds
            if (data.recordedSounds && audioEngine?.soundBank) {
                for (const [name, { samples, sampleRate }] of Object.entries(data.recordedSounds)) {
                    audioEngine.soundBank.restoreRecordedSound(name, samples, sampleRate);
                }
                console.log(`[JuniorProject] Restored ${Object.keys(data.recordedSounds).length} recorded sound(s)`);
            }

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
        } catch (err) {
            console.error('Failed to load project:', err);
            showToast('Failed to load project file: ' + err.message, 'error');
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
