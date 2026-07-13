import { useCallback } from 'react';
import { countVisibleComponents, buildBlocklyContextFromPayload } from '../utils/projectHelpers';

export function useBuildApk(appState, {
  isBuildModalOpen,
  setIsBuildModalOpen,
  buildState,
  setBuildState,
  buildLogs,
  setBuildLogs,
  apkPath,
  setApkPath,
  onTranspileFailMessage,
}) {
  const handleBuildApk = useCallback(async () => {
    const isElectron = window.electronAPI && window.electronAPI.buildApk;

    setIsBuildModalOpen(true);
    setBuildState('building');
    setBuildLogs(['Initializing build process...']);
    setApkPath(null);

    try {
      const payload = appState.getSerializedState();
      const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
      if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
        payload.blockLogic = liveBlockXml;
      }
      const visibleComponentCount = countVisibleComponents(payload.screens || []);
      setBuildLogs((prev) => [
        ...prev,
        `Project snapshot: ${(payload.screens || []).length || 1} screen(s), ${visibleComponentCount} visible component(s)`
      ]);

      if (payload.blockLogic && payload.blockLogic.trim().startsWith('<')) {
        try {
          setBuildLogs((prev) => [...prev, 'Transpiling block logic to JavaScript...']);
          const { initializeAllBlocks } = await import('../blocks/definitions/index');
          const Blockly = (await import('blockly')).default || (await import('blockly'));
          const { javascriptGenerator } = await import('blockly/javascript');
          await import('../blocks/generators/reactnative');
          initializeAllBlocks();

          const { currentScreen, components } = buildBlocklyContextFromPayload(payload);
          window.LeapLab_Components = components;
          window.LeapLab_ActiveScreen = currentScreen;

          const tempWorkspace = new Blockly.Workspace();
          try {
            const xml = Blockly.utils.xml.textToDom(payload.blockLogic);
            Blockly.Xml.domToWorkspace(xml, tempWorkspace);

            if (currentScreen) {
              const flattenVisible = (list = []) => list.flatMap(item => [item, ...(item.children ? flattenVisible(item.children) : [])]);
              const allComps = [
                ...flattenVisible(currentScreen.components || []),
                ...(currentScreen.nonVisibleComponents || [])
              ];
              const validNames = new Set([
                currentScreen.id,
                ...allComps.map(c => c.id)
              ]);
              const allBlocks = tempWorkspace.getAllBlocks(false);
              allBlocks.forEach(block => {
                if (block.getField('INSTANCE')) {
                  const instanceName = block.getFieldValue('INSTANCE');
                  if (!instanceName || !validNames.has(instanceName)) {
                    block.dispose(false);
                  }
                }
              });
            }

            const generatedJs = javascriptGenerator.workspaceToCode(tempWorkspace);
            if (generatedJs && generatedJs.trim()) {
              payload.blockLogic = generatedJs;
              setBuildLogs((prev) => [...prev, 'Block logic transpiled to JavaScript']);
            } else {
              payload.blockLogic = '';
              setBuildLogs((prev) => [...prev, 'No block logic to transpile']);
            }
          } finally {
            tempWorkspace.dispose();
          }
        } catch (transpileErr) {
          console.warn('Block transpilation failed, building without block logic:', transpileErr);
          setBuildLogs((prev) => [...prev, `Block transpilation skipped: ${transpileErr.message}`]);
          payload.blockLogic = onTranspileFailMessage
            ? `console.warn('[LeapApp] Block transpilation failed:', ${JSON.stringify(transpileErr.message)});`
            : '';
        }
      }

      if (isElectron) {
        setBuildLogs((prev) => [...prev, 'Sending build request to main process...']);
        const result = await window.electronAPI.buildApk(payload);

        if (result.success) {
          setBuildState('success');
          setApkPath(result.outputPath);
          setBuildLogs((prev) => [...prev, 'Build complete! APK is ready.']);
        } else {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `Build failed: ${result.error}`]);
        }
      } else {
        const { CLOUD_COMPILER_URL } = await import('../../config/platform');
        const serverLabel = CLOUD_COMPILER_URL.includes('localhost') ? 'local' : 'cloud';
        setBuildLogs((prev) => [...prev, `Sending build request to ${serverLabel} compiler (${CLOUD_COMPILER_URL})...`]);

        const response = await fetch(`${CLOUD_COMPILER_URL}/build-apk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Server error: ${response.status} - ${text}`);
        }

        const result = await response.json();
        if (result.logs && result.logs.length) {
          setBuildLogs((prev) => [...prev, ...result.logs]);
        }
        if (result.cloudBuildUnsupported) {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `⚠ ${result.error}`]);
        } else if (result.success) {
          setBuildState('success');
          setApkPath(result.downloadUrl.startsWith('http') ? result.downloadUrl : `${CLOUD_COMPILER_URL}${result.downloadUrl}`);
          setBuildLogs((prev) => [...prev, 'Build complete! APK is ready to download.']);
        } else {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `Build failed: ${result.error}`]);
        }
      }
    } catch (error) {
      setBuildState('error');
      setBuildLogs((prev) => [...prev, `Build failed: ${error.message}`]);
    }
  }, [appState, setIsBuildModalOpen, setBuildState, setBuildLogs, setApkPath, onTranspileFailMessage]);

  const handleOpenFile = useCallback(async () => {
    if (window.electronAPI && window.electronAPI.showInFolder && apkPath && !apkPath.startsWith('http')) {
      await window.electronAPI.showInFolder(apkPath);
    } else if (apkPath) {
      window.open(apkPath, '_blank');
    }
  }, [apkPath]);

  return { handleBuildApk, handleOpenFile };
}
