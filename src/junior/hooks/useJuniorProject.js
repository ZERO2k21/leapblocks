import { useState, useRef } from "react";
import * as Blockly from "blockly";
import { fileService } from "../../services/FileService";

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
    saveCurrentWorkspace
}) {
    const fileInputRef = useRef(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'new' or 'open'

    const executeNewProject = () => {
        if (workspaceRef.current) {
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
        }

        const id = `robot_default`;
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
                default: "/assets/sprites/robot/robot_idle.svg",
                wave1: "/assets/sprites/robot/robot_wave1.svg",
                wave2: "/assets/sprites/robot/robot_wave2.svg",
                talk: "/assets/sprites/robot/robot_talk1.svg"
            },
            currentCostume: "default",
            blocks: {}
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
            const payload = {
                scenes: scenes,
            };
            fileService.saveProject(projectName, 'junior', payload);
            console.log(`[JuniorApp] Project saved: ${projectName}`);
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
                alert(validation.error);
                return;
            }

            if (!data.scenes) throw new Error('Invalid Junior project file (missing scenes array)');

            console.log(`[JuniorApp] Loading project: ${data.projectName || 'Untitled'}`);

            if (stopBlocks) stopBlocks();
            if (workspaceRef.current) {
                Blockly.Events.disable();
                workspaceRef.current.clear();
                Blockly.Events.enable();
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

                    setTimeout(() => {
                        if (workspaceRef.current && firstSprite.blocks) {
                            try {
                                Blockly.Events.disable();
                                Blockly.serialization.workspaces.load(firstSprite.blocks, workspaceRef.current);
                            } finally {
                                Blockly.Events.enable();
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
        handleOpenProject,
        confirmUnsavedAction,
        handleFileLoad,
        pendingAction,
        setPendingAction
    };
}
