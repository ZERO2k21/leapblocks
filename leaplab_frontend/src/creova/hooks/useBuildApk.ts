import { useCallback } from 'react';
import Blockly, { javascriptGenerator } from '@blockly-runtime';
import { countVisibleComponents, buildBlocklyContextFromPayload } from '../utils/projectHelpers';
import '../blocks/generators/reactnative';
import { initializeAllBlocks } from '../blocks/definitions/index';
import { CLOUD_COMPILER_URL } from '../../config/platform';

export type BuildState = 'idle' | 'building' | 'success' | 'error';

export interface UseBuildApkOptions {
  isBuildModalOpen?: boolean;
  setIsBuildModalOpen: (open: boolean) => void;
  buildState?: BuildState;
  setBuildState: (state: BuildState) => void;
  buildLogs?: string[];
  setBuildLogs: React.Dispatch<React.SetStateAction<string[]>>;
  apkPath?: string | null;
  setApkPath: (path: string | null) => void;
  onTranspileFailMessage?: boolean;
}

export function useBuildApk(
  appState: any,
  {
    setIsBuildModalOpen,
    setBuildState,
    setBuildLogs,
    apkPath,
    setApkPath,
    onTranspileFailMessage,
  }: UseBuildApkOptions
) {
  const handleBuildApk = useCallback(async () => {
    const isElectron = typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.buildApk === 'function';

    console.log('[BUILD-UI] Build Production button clicked');
    console.log('[BUILD-UI] Platform:', isElectron ? 'Electron' : 'Web');
    console.log('[BUILD-UI] App state keys:', Object.keys(appState));

    setIsBuildModalOpen(true);
    setBuildState('building');
    setBuildLogs(['[BUILD] Initializing build process...']);
    setApkPath(null);

    try {
      const tStart = Date.now();
      const payload = appState.getSerializedState();
      console.log('[BUILD-UI] Serialized state:', {
        appName: payload.appName,
        packageName: payload.packageName,
        screenCount: payload.screens?.length,
        mediaCount: payload.media?.length,
        hasBlockLogic: !!payload.blockLogic,
        hasBlockly: !!(window as any).__LEAP_BLOCK_XML__
      });
      if (Array.isArray(payload.media) && payload.media.length > 0) {
        payload.media.forEach((item: any, i: number) => {
          const dataStr = item.data ? String(item.data) : '';
          const b64len = dataStr.indexOf(',') >= 0 ? dataStr.length - dataStr.indexOf(',') - 1 : dataStr.length;
          console.log(`[BUILD-UI] payload.media[${i}]: filename="${item.filename}" type="${item.type}" dataLen=${dataStr.length} b64Len=${b64len} hasData=${!!item.data}`);
        });
      }

      const liveBlockXml = typeof window !== 'undefined' ? (window as any).__LEAP_BLOCK_XML__ : null;
      if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
        payload.blockLogic = liveBlockXml;
        console.log('[BUILD-UI] Captured live Blockly XML from window.__LEAP_BLOCK_XML__');
      }
      const visibleComponentCount = countVisibleComponents(payload.screens || []);
      setBuildLogs((prev) => [
        ...prev,
        `[BUILD] Project snapshot: ${(payload.screens || []).length || 1} screen(s), ${visibleComponentCount} visible component(s)`
      ]);

      if (payload.blockLogic && payload.blockLogic.trim().startsWith('<')) {
        try {
          setBuildLogs((prev) => [...prev, '[BUILD] Transpiling block logic to JavaScript...']);
          console.log('[BUILD-UI] Starting Blockly transpilation (XML → JS)');
          initializeAllBlocks();

          const { currentScreen, components } = buildBlocklyContextFromPayload(payload);
          console.log('[BUILD-UI] Blockly context built:', { currentScreenId: currentScreen?.id, componentCount: components?.length });
          (window as any).LeapLab_Components = components;
          (window as any).LeapLab_ActiveScreen = currentScreen;

          const tempWorkspace = new (Blockly as any).Workspace();
          try {
            const xml = (Blockly as any).utils.xml.textToDom(payload.blockLogic);
            (Blockly as any).Xml.domToWorkspace(xml, tempWorkspace);
            console.log('[BUILD-UI] Blocks loaded into workspace:', tempWorkspace.getAllBlocks(false).length, 'blocks');

            if (currentScreen) {
              const flattenVisible = (list: any[] = []): any[] =>
                list.flatMap(item => [item, ...(item.children ? flattenVisible(item.children) : [])]);
              const allComps = [
                ...flattenVisible(currentScreen.components || []),
                ...(currentScreen.nonVisibleComponents || [])
              ];
              const validNames = new Set([
                currentScreen.id,
                ...allComps.map(c => c.id)
              ]);
              const allBlocks = tempWorkspace.getAllBlocks(false);
              let pruned = 0;
              allBlocks.forEach((block: any) => {
                if (block.getField('INSTANCE')) {
                  const instanceName = block.getFieldValue('INSTANCE');
                  if (!instanceName || !validNames.has(instanceName)) {
                    block.dispose(false);
                    pruned++;
                  }
                }
              });
              if (pruned > 0) console.log('[BUILD-UI] Pruned', pruned, 'orphaned blocks');
            }

            const generatedJs = javascriptGenerator.workspaceToCode(tempWorkspace);
            if (generatedJs && generatedJs.trim()) {
              payload.blockLogic = generatedJs;
              setBuildLogs((prev) => [...prev, '[BUILD] Block logic transpiled to JavaScript']);
              console.log('[BUILD-UI] Generated JS length:', generatedJs.length);
            } else {
              payload.blockLogic = '';
              setBuildLogs((prev) => [...prev, '[BUILD] No block logic to transpile']);
            }
          } finally {
            tempWorkspace.dispose();
          }
        } catch (transpileErr: any) {
          console.warn('[BUILD-UI] Block transpilation failed:', transpileErr);
          setBuildLogs((prev) => [...prev, `[BUILD] Block transpilation skipped: ${transpileErr?.message || transpileErr}`]);
          payload.blockLogic = onTranspileFailMessage
            ? `console.warn('[LeapApp] Block transpilation failed:', ${JSON.stringify(transpileErr?.message || transpileErr)});`
            : '';
        }
      } else if (payload.blockLogic) {
        console.log('[BUILD-UI] blockLogic is JS (not XML), length:', payload.blockLogic.length);
      } else {
        console.log('[BUILD-UI] No block logic present');
      }

      if (isElectron && window.electronAPI?.buildApk) {
        setBuildLogs((prev) => [...prev, '[BUILD] Sending build request to Electron main process...']);
        console.log('[BUILD-UI] Calling window.electronAPI.buildApk()');
        const result = await window.electronAPI.buildApk(payload);
        console.log('[BUILD-UI] Electron build result:', result);
        const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
        setBuildLogs((prev) => [...prev, `[BUILD] Electron build completed in ${elapsed}s`]);

        if (result.success) {
          setBuildState('success');
          setApkPath(result.outputPath || null);
          setBuildLogs((prev) => [...prev, '[BUILD] Build complete! APK is ready.']);
          console.log('[BUILD-UI] APK output path:', result.outputPath);
        } else {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `[BUILD] Build failed: ${result.error}`]);
          console.error('[BUILD-UI] Electron build error:', result.error);
        }
      } else {
        const serverLabel = CLOUD_COMPILER_URL.includes('localhost') ? 'local' : 'cloud';
        setBuildLogs((prev) => [...prev, `[BUILD] Sending build request to ${serverLabel} compiler (${CLOUD_COMPILER_URL})...`]);
        console.log('[BUILD-UI] Fetching POST', CLOUD_COMPILER_URL + '/build-apk');
        console.log('[BUILD-UI] Payload keys:', Object.keys(payload));
        console.log('[BUILD-UI] Payload media items:', payload.media?.length || 0);

        const response = await fetch(`${CLOUD_COMPILER_URL}/build-apk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log('[BUILD-UI] Server response status:', response.status);

        if (!response.ok) {
          const text = await response.text();
          console.error('[BUILD-UI] Server error response:', text);
          throw new Error(`Server error: ${response.status} - ${text}`);
        }

        const result = await response.json();
        console.log('[BUILD-UI] Server result:', { success: result.success, downloadUrl: result.downloadUrl, logCount: result.logs?.length, cloudBuildUnsupported: result.cloudBuildUnsupported });
        if (result.logs && result.logs.length) {
          setBuildLogs((prev) => [...prev, ...result.logs]);
        }
        if (result.cloudBuildUnsupported) {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `⚠ ${result.error}`]);
        } else if (result.success) {
          setBuildState('success');
          const fullDownloadUrl = result.downloadUrl?.startsWith('http')
            ? result.downloadUrl
            : `${CLOUD_COMPILER_URL}${result.downloadUrl}`;
          setApkPath(fullDownloadUrl);
          const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
          setBuildLogs((prev) => [...prev, `[BUILD] Build complete! APK ready to download (${elapsed}s).`]);
          console.log('[BUILD-UI] Download URL:', fullDownloadUrl);
        } else {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `[BUILD] Build failed: ${result.error}`]);
          console.error('[BUILD-UI] Server build error:', result.error);
        }
      }
    } catch (error: any) {
      console.error('[BUILD-UI] Build process error:', error);
      setBuildState('error');
      setBuildLogs((prev) => [...prev, `[BUILD] Build failed: ${error?.message || error}`]);
    }
  }, [appState, setIsBuildModalOpen, setBuildState, setBuildLogs, setApkPath, onTranspileFailMessage]);

  const handleOpenFile = useCallback(async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.showInFolder && apkPath && !apkPath.startsWith('http')) {
      await window.electronAPI.showInFolder(apkPath);
    } else if (apkPath) {
      window.open(apkPath, '_blank');
    }
  }, [apkPath]);

  return { handleBuildApk, handleOpenFile };
}
