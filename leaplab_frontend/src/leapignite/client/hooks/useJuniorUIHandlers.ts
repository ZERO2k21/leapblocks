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

interface UseJuniorUIHandlersProps {
    sprites: any[];
    scenes: any[];
    setScenes: React.Dispatch<React.SetStateAction<any[]>>;
    currentSceneId: string;
    setCurrentSceneId: (id: string) => void;
    setActiveSpriteId: (id: string) => void;
    workspaceRef: React.RefObject<any>;
    scenesRef: React.MutableRefObject<any>;
    paintEditor: any;
    setPaintEditor: (editor: any) => void;
    backdropEditSceneId: string | null;
    setBackdropEditSceneId: (id: string | null) => void;
    setIsBackdropChooserOpen: (open: boolean) => void;
    saveCurrentWorkspace: () => void;
    setIsSpriteModalOpen: (open: boolean) => void;
    isCameraOn: boolean;
    setIsCameraOn: (on: boolean) => void;
    cameraStreamRef: React.MutableRefObject<MediaStream | null>;
    cameraVideoRef: React.RefObject<HTMLVideoElement | null>;
    recordingCount: number;
    setRecordingCount: React.Dispatch<React.SetStateAction<number>>;
    audioEngine: any;
    project: any;
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>;
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>;
    activeSpriteIdRef: React.MutableRefObject<string>;
}

declare global {
    interface Window {
        setCameraOn?: (on: boolean) => Promise<void>;
    }
}

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
}: UseJuniorUIHandlersProps) {
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

    const handleSaveRecording = (audioData: { blobUrl: string; samples: any; sampleRate: number }) => {
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
            (stageContainer as any).requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    const handleFileMenu = (action: string) => {
        if (action === "save" || action === "save_as") project.handleSaveProject();
        if (action === "open" || action === "load") project.handleOpenProject();
        if (action === "new_project" || action === "new" || action === "new_workspace") project.handleNewProject();
        if (action === "share to") project.handleShareProject();

        if (["qr", "examples", "guide", "record"].includes(action)) {
            showToast(`Feature '${action}' coming soon!`, 'info');
        }
    };

    const handleEditMenu = (action: string) => {
        if (action === "restore") showToast("Restore workspace feature coming soon!", 'info');
        if (action === "undo") workspaceRef.current?.undo(false);
        if (action === "redo") workspaceRef.current?.undo(true);
    };

    return {
        handleEditSprite: (spriteId: string) => handleEditSprite(sprites, setPaintEditor, spriteId),
        handleEditScene: (sceneId: string) => handleEditScene(scenes, setBackdropEditSceneId, setIsBackdropChooserOpen, sceneId),
        handleBackdropSelect: (name: string, src: string | null, solidColor: string | null) => handleBackdropSelect(backdropEditSceneId, currentSceneId, setScenes, setIsBackdropChooserOpen, setBackdropEditSceneId, name, src, solidColor),
        handleBackdropPaint: () => handleBackdropPaint(backdropEditSceneId, currentSceneId, scenes, setIsBackdropChooserOpen, setPaintEditor),
        handlePaintSave: (imageData: string, svgData: string, name: string, rotationCenter: { x: number; y: number }) => handlePaintSave(paintEditor, setPaintEditor, currentSceneId, setScenes, imageData, svgData, name, rotationCenter),
        addSprite: (spriteData?: any) => addSprite(workspaceRef, activeSpriteIdRef, spriteWorkspacesRef, saveCurrentWorkspace, scenes, currentSceneId, setScenes, scenesRef, isLoadingWorkspaceRef, setActiveSpriteId, setIsSpriteModalOpen, spriteData),
        addScene: () => addScene(scenes, setScenes, setCurrentSceneId),
        deleteSprite: (spriteId: string) => deleteSprite(sprites, workspaceRef, activeSpriteIdRef, isLoadingWorkspaceRef, spriteWorkspacesRef, currentSceneId, setScenes, setActiveSpriteId, spriteId),
        deleteScene: (sceneId: string) => deleteScene(scenes, setScenes, setCurrentSceneId, setActiveSpriteId, sceneId),
        toggleCamera: handleToggleCamera,
        handleSaveRecording,
        toggleFullscreen,
        handleFileMenu,
        handleEditMenu,
        handleDeleteCostume: (index: number) => handleDeleteCostume(paintEditor, sprites, currentSceneId, setScenes, setPaintEditor, index),
        handleDuplicateCostume: (index: number) => handleDuplicateCostume(paintEditor, sprites, currentSceneId, setScenes, setPaintEditor, index),
        handleSwitchCostume: (index: number) => handleSwitchCostume(paintEditor, sprites, scenes, currentSceneId, setScenes, setCurrentSceneId, setPaintEditor, index),
        handleRenameCostume: (index: number, newName: string) => handleRenameCostume(paintEditor, sprites, scenes, currentSceneId, setScenes, setPaintEditor, index, newName)
    };
}
