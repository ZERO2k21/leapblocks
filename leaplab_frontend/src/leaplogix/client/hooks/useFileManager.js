/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useCallback, useEffect } from "react";
import { fileService } from "../../../Electra/Client/Src/services/FileService";
import { useCloudProjectStore } from "../../../store/cloudProjectStore";
import { getUniqueFileName, getFallbackActiveFile } from "../utils/fileUtils";
import { showToast } from "../../../leapignite/client/components/Toast";

const DEFAULT_ACTIVE_FILE = "main.py";
const DEFAULT_FILES = {
    [DEFAULT_ACTIVE_FILE]: 'print("Hello from LeapBlocks Python!")\n',
};

export function useFileManager({ addLog, sprites, backdrop, setSprites, setSelectedSpriteId, setBackdropImg, resetStage }) {
    const [projectName, setProjectName] = useState("My Project");
    const [activeFile, setActiveFile] = useState(DEFAULT_ACTIVE_FILE);
    const [projectFiles, setProjectFiles] = useState(DEFAULT_FILES);

    const handleNewProject = useCallback(() => {
        if (!window.confirm("Create a new project? All unsaved work will be lost.")) return;
        setProjectName("My Project");
        setProjectFiles(DEFAULT_FILES);
        setActiveFile(DEFAULT_ACTIVE_FILE);
        resetStage();
    }, [resetStage]);

    const handleSaveProject = useCallback(async () => {
        const payload = {
            projectFiles,
            activeFile,
            sprites,
            backdrop,
        };
        try {
            await fileService.saveProject(projectName, "python", payload);
            showToast("Project saved successfully!", "success");
        } catch (err) {
            console.error('[useFileManager] Failed to save project:', err);
            alert(err?.message || 'Failed to save project. Please make sure you are signed in.');
        }
    }, [projectName, projectFiles, activeFile, sprites, backdrop]);

    const handleDownloadProject = useCallback(() => {
        const payload = {
            projectFiles,
            activeFile,
            sprites,
            backdrop,
        };
        fileService.saveProjectLocally(projectName, "python", payload);
    }, [projectName, projectFiles, activeFile, sprites, backdrop]);

    const loadProjectData = useCallback((data) => {
        try {
            const validation = fileService.validateProject(data, "python");
            if (!validation.isValid) {
                alert(validation.error);
                return;
            }

            const nextProjectFiles = data.projectFiles && Object.keys(data.projectFiles).length ? data.projectFiles : DEFAULT_FILES;
            setProjectName(data.projectName || "My Project");
            setProjectFiles(nextProjectFiles);
            setActiveFile(getFallbackActiveFile(nextProjectFiles, data.activeFile));

            if (data.sprites && Array.isArray(data.sprites) && data.sprites.length > 0) {
                setSprites(data.sprites);
                setSelectedSpriteId(data.sprites[0].id);
            } else {
                resetStage();
            }
            if (data.backdrop) setBackdropImg(data.backdrop);
        } catch (err) {
            alert('Failed to load project: ' + err.message);
        }
    }, [setSprites, setSelectedSpriteId, setBackdropImg, resetStage]);

    const handleOpenProject = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = '.leap,.lbproject,application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const data = await fileService.loadProject(file);
                loadProjectData(data);
            } catch (err) {
                alert('Failed to load project: ' + err.message);
            }
        };
        input.click();
    }, [loadProjectData]);

    // Auto-load project from cloud storage (My Projects)
    useEffect(() => {
        const { pendingProject, clearPendingProject } = useCloudProjectStore.getState();
        if (!pendingProject || pendingProject.mode !== 'python') return;

        let cancelled = false;
        (async () => {
            try {
                if (cancelled) return;
                loadProjectData(pendingProject.data);
                clearPendingProject();
            } catch (err) {
                console.error('[useFileManager] Failed to load project from cloud:', err);
                alert('Failed to load project: ' + err.message);
            }
        })();

        return () => { cancelled = true; };
    }, [loadProjectData]);

    const handleShareProject = useCallback(() => {
        const payload = {
            projectFiles,
            activeFile,
            sprites,
            backdrop,
        };
        fileService.shareProject(projectName, "python", payload);
    }, [projectName, projectFiles, activeFile, sprites, backdrop]);

    const handleDeleteFile = useCallback((file) => {
        if (Object.keys(projectFiles).length <= 1) return;
        if (!window.confirm(`Delete ${file}?`)) return;
        setProjectFiles(prev => {
            const next = { ...prev };
            delete next[file];
            return next;
        });
        if (activeFile === file) setActiveFile(Object.keys(projectFiles).find(f => f !== file));
    }, [projectFiles, activeFile]);

    const handleCreateNewFile = useCallback(() => {
        let baseName = "new_file";
        let ext = ".py";
        let fileName = `${baseName}${ext}`;
        let counter = 1;
        while (projectFiles[fileName]) {
            fileName = `${baseName}${counter}${ext}`;
            counter++;
        }
        setProjectFiles((prev) => ({
            ...prev,
            [fileName]: "",
        }));
        setActiveFile(fileName);
        addLog(`Created new file: ${fileName}`, "success");
    }, [projectFiles, addLog]);

    const handleCreateNewTextFile = useCallback(() => {
        let baseName = "new_file";
        let ext = ".txt";
        let fileName = `${baseName}${ext}`;
        let counter = 1;
        while (projectFiles[fileName]) {
            fileName = `${baseName}${counter}${ext}`;
            counter++;
        }
        setProjectFiles((prev) => ({
            ...prev,
            [fileName]: "",
        }));
        setActiveFile(fileName);
        addLog(`Created new file: ${fileName}`, "success");
    }, [projectFiles, addLog]);

    const handleRenameFile = useCallback((oldName, newName) => {
        if (!newName || newName === oldName) return;
        if (projectFiles[newName]) {
            alert(`A file named "${newName}" already exists.`);
            return;
        }
        setProjectFiles((prev) => {
            const entries = Object.entries(prev);
            const next = {};
            entries.forEach(([name, content]) => {
                if (name === oldName) {
                    next[newName] = content;
                } else {
                    next[name] = content;
                }
            });
            return next;
        });
        if (activeFile === oldName) {
            setActiveFile(newName);
        }
        addLog(`Renamed ${oldName} to ${newName}`, "success");
    }, [projectFiles, activeFile, addLog]);

    const handleOpenPythonFile = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".py";
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = String(event.target?.result || "");
                    const fileName = getUniqueFileName(file.name, projectFiles);
                    setProjectFiles((prev) => ({ ...prev, [fileName]: content }));
                    setActiveFile(fileName);
                    addLog(`Loaded Python file: ${fileName}`, "success");
                };
                reader.readAsText(file);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to open Python file.";
                addLog(message, "error");
            }
        };
        input.click();
    }, [projectFiles, addLog]);

    return {
        projectName,
        setProjectName,
        activeFile,
        setActiveFile,
        projectFiles,
        setProjectFiles,
        handleNewProject,
        handleSaveProject,
        handleDownloadProject,
        handleOpenProject,
        handleShareProject,
        handleDeleteFile,
        handleCreateNewFile,
        handleCreateNewTextFile,
        handleRenameFile,
        handleOpenPythonFile,
    };
}

export default useFileManager;
