/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { showToast } from "../components/Toast";
import {
    handleEditSprite,
    handleEditScene,
    handleBackdropSelect,
    handleBackdropPaint,
    handlePaintSave,
    handleDeleteCostume,
    handleDuplicateCostume,
    handleSwitchCostume,
    handleRenameCostume
} from "./workspaceCostumeUtils";
import { addSprite, addScene, deleteSprite, deleteScene } from "./workspaceSpriteSceneUtils";
import { toggleCamera } from "./workspaceCameraUtils";

export function useJuniorUIHandlers({
    sprites,
    scenes,
    setScenes,
    currentSceneId,
    setCurrentSceneId,
    setActiveSpriteId,
    workspaceRef,
    scenesRef,
    paintEditor,
    setPaintEditor,
    backdropEditSceneId,
    setBackdropEditSceneId,
    setIsBackdropChooserOpen,
    saveCurrentWorkspace,
    setIsSpriteModalOpen,
    isCameraOn,
    setIsCameraOn,
    cameraStreamRef,
    cameraVideoRef,
    recordingCount,
    setRecordingCount,
    audioEngine,
    project,
    isLoadingWorkspaceRef,
    spriteWorkspacesRef,
    activeSpriteIdRef
}) {
    const handleToggleCamera = async () => {
        await toggleCamera(isCameraOn, setIsCameraOn, cameraStreamRef, cameraVideoRef);
    };

    window.setCameraOn = async (on) => {
        if (on && !isCameraOn) {
            await handleToggleCamera();
        } else if (!on && isCameraOn) {
            await handleToggleCamera();
        }
    };

    const handleSaveRecording = (audioData) => {
        const name = `Recording ${recordingCount}`;
        setRecordingCount(prev => prev + 1);
        audioEngine.soundBank.assets[name] = audioData.blobUrl;
        if (!audioEngine.soundBank.recordedSounds) audioEngine.soundBank.recordedSounds = {};
        audioEngine.soundBank.recordedSounds[name] = {
            samples: Array.from(audioData.samples),
            sampleRate: audioData.sampleRate
        };
        showToast(`Saved as '${name}'. You can now select it in the 'play sound' block dropdown!`, 'success');
    };

    const toggleFullscreen = () => {
        const stageContainer = document.querySelector('.stage')?.parentElement;
        if (!stageContainer) return;

        if (!document.fullscreenElement) {
            stageContainer.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    const handleFileMenu = (action) => {
        if (action === "save" || action === "save_as") project.handleSaveProject();
        if (action === "open" || action === "load") project.handleOpenProject();
        if (action === "new_project" || action === "new" || action === "new_workspace") project.handleNewProject();
        if (action === "share to") project.handleShareProject();

        if (["qr", "examples", "guide", "record"].includes(action)) {
            showToast(`Feature '${action}' coming soon!`, 'info');
        }
    };

    const handleEditMenu = (action) => {
        if (action === "restore") showToast("Restore workspace feature coming soon!", 'info');
        if (action === "undo") workspaceRef.current?.undo(false);
        if (action === "redo") workspaceRef.current?.undo(true);
    };

    return {
        handleEditSprite: (spriteId) => handleEditSprite(sprites, setPaintEditor, spriteId),
        handleEditScene: (sceneId) => handleEditScene(scenes, setBackdropEditSceneId, setIsBackdropChooserOpen, sceneId),
        handleBackdropSelect: (name, src, solidColor) => handleBackdropSelect(backdropEditSceneId, currentSceneId, setScenes, setIsBackdropChooserOpen, setBackdropEditSceneId, name, src, solidColor),
        handleBackdropPaint: () => handleBackdropPaint(backdropEditSceneId, currentSceneId, scenes, setIsBackdropChooserOpen, setPaintEditor),
        handlePaintSave: (imageData, svgData, name, rotationCenter) => handlePaintSave(paintEditor, setPaintEditor, currentSceneId, setScenes, imageData, svgData, name, rotationCenter),
        addSprite: (spriteData) => addSprite(workspaceRef, activeSpriteIdRef, spriteWorkspacesRef, saveCurrentWorkspace, scenes, currentSceneId, setScenes, scenesRef, isLoadingWorkspaceRef, setActiveSpriteId, setIsSpriteModalOpen, spriteData),
        addScene: () => addScene(scenes, setScenes, setCurrentSceneId),
        deleteSprite: (spriteId) => deleteSprite(sprites, workspaceRef, activeSpriteIdRef, isLoadingWorkspaceRef, spriteWorkspacesRef, currentSceneId, setScenes, setActiveSpriteId, spriteId),
        deleteScene: (sceneId) => deleteScene(scenes, setScenes, setCurrentSceneId, setActiveSpriteId, sceneId),
        toggleCamera: handleToggleCamera,
        handleSaveRecording,
        toggleFullscreen,
        handleFileMenu,
        handleEditMenu,
        handleDeleteCostume: (index) => handleDeleteCostume(paintEditor, sprites, currentSceneId, setScenes, setPaintEditor, index),
        handleDuplicateCostume: (index) => handleDuplicateCostume(paintEditor, sprites, currentSceneId, setScenes, setPaintEditor, index),
        handleSwitchCostume: (index) => handleSwitchCostume(paintEditor, sprites, scenes, currentSceneId, setScenes, setCurrentSceneId, setPaintEditor, index),
        handleRenameCostume: (index, newName) => handleRenameCostume(paintEditor, sprites, scenes, currentSceneId, setScenes, setPaintEditor, index, newName)
    };
}
