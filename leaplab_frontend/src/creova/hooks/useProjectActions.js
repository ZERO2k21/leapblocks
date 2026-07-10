import { useCallback } from 'react';
import { fileService } from '../../Electra/Client/Src/services/FileService';
import { showToast } from '../../leapignite/client/components/Toast';

export function useProjectActions(appState, { projectPath, setProjectPath, fileInputRef, onRedirectToElectra }) {
  const handleNewProject = useCallback(() => {
    if (confirm("Create a new project? Unsaved changes will be lost.")) {
      appState.newProject();
      setProjectPath(null);
      if (typeof window !== 'undefined') {
        window.__LEAP_BLOCK_XML__ = '';
      }
    }
  }, [appState, setProjectPath]);

  const handleOpenProject = useCallback(async () => {
    if (!window.electronAPI || !window.electronAPI.openProject) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const result = await window.electronAPI.openProject();
      if (result && result.data) {
        if (onRedirectToElectra && (result.data.nodes || result.data.edges || result.data.circuit)) {
          onRedirectToElectra(result.data, null, result.projectPath);
          return;
        }
        appState.loadProject(result.data);
        setProjectPath(result.projectPath);
        const pathParts = result.projectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        if (folderName) {
          appState.setAppName(folderName.replace(/\.(leap|lbp)$/i, ''));
        }
      } else if (result && result.error) {
        alert(`Failed to open project: ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to open project:", err);
      alert(`Failed to open project: ${err.message}`);
    }
  }, [appState, setProjectPath, fileInputRef, onRedirectToElectra]);

  const handleWebImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const projectData = JSON.parse(content);
        const nameWithoutExt = file.name.replace(/\.(leap|lbp|json)$/i, '');
        if (onRedirectToElectra && (projectData.nodes || projectData.edges || projectData.circuit)) {
          onRedirectToElectra(projectData, nameWithoutExt, null);
          return;
        }
        appState.loadProject(projectData);
        appState.setAppName(nameWithoutExt);
        setProjectPath(null);
        alert('Project imported successfully!');
      } catch (err) {
        console.error('Failed to parse project file:', err);
        alert('Failed to parse project file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [appState, setProjectPath, onRedirectToElectra]);

  const handleSaveProject = useCallback(async () => {
    try {
      const payload = appState.getSerializedState();
      const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
      if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
        payload.blockLogic = liveBlockXml;
      }
      await fileService.saveProject(appState.appName || 'project', 'creova', payload);
      showToast("Project saved successfully!", "success");
    } catch (err) {
      console.error("Failed to save project:", err);
      alert(`Failed to save project: ${err.message}`);
    }
  }, [appState]);

  const handleDownloadProject = useCallback(() => {
    const payload = appState.getSerializedState();
    const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
    if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
      payload.blockLogic = liveBlockXml;
    }
    fileService.saveProjectLocally(appState.appName || 'project', 'creova', payload);
  }, [appState]);

  const handleSaveAsProject = useCallback(async () => {
    await handleSaveProject();
  }, [handleSaveProject]);

  const handleUndo = useCallback(() => {
    if (typeof window !== 'undefined' && window.Blockly) {
      const workspace = window.Blockly.getMainWorkspace();
      if (workspace) workspace.undo(false);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (typeof window !== 'undefined' && window.Blockly) {
      const workspace = window.Blockly.getMainWorkspace();
      if (workspace) workspace.undo(true);
    }
  }, []);

  return {
    handleNewProject,
    handleOpenProject,
    handleWebImport,
    handleSaveProject,
    handleDownloadProject,
    handleSaveAsProject,
    handleUndo,
    handleRedo,
  };
}
