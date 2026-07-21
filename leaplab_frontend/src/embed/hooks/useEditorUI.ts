import { useCallback, useEffect } from 'react';
import type React from 'react';
import Blockly from '@blockly-runtime';
import { EXTENSIONS, registerExtensions } from '../../extensions/extensionDefinitions';
import { stageManager } from '../../engine/StageManager';

export function useEditorUI(
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    installedExtensionsRef: React.MutableRefObject<Set<string>>,
    setInstalledExtensions: React.Dispatch<React.SetStateAction<Set<string>>>,
    isFullscreen: boolean,
    setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>,
    setFullscreenScale: React.Dispatch<React.SetStateAction<number>>,
    setShowBackdropLibrary: React.Dispatch<React.SetStateAction<boolean>>,
    setBackdropRefresh: React.Dispatch<React.SetStateAction<number>>,
) {
    const handleAddExtension = useCallback((extId: string) => {
        if (!workspaceRef.current) return;

        const id = extId.replace(/-/g, '_');
        const ext = EXTENSIONS[id];

        if (ext) {
            registerExtensions(Blockly, [id]);

            if (!installedExtensionsRef.current.has(id)) {
                installedExtensionsRef.current = new Set([...installedExtensionsRef.current, id]);
                setInstalledExtensions(new Set(installedExtensionsRef.current));
            }
        } else {
            console.warn(`[Extension] Unknown extension ID: ${extId}`);
        }
    }, [workspaceRef, installedExtensionsRef, setInstalledExtensions]);

    const handleFullscreen = () => {
        if (!isFullscreen) {
            setIsFullscreen(true);
            const scaleX = window.innerWidth / 480;
            const scaleY = (window.innerHeight - 48) / 310;
            setFullscreenScale(Math.min(scaleX, scaleY));
        } else {
            setIsFullscreen(false);
            setFullscreenScale(1);
        }
    };

    useEffect(() => {
        const updateScale = () => {
            if (isFullscreen) {
                const scaleX = window.innerWidth / 480;
                const scaleY = (window.innerHeight - 48) / 310;
                setFullscreenScale(Math.min(scaleX, scaleY));
            } else {
                setFullscreenScale(1);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);

        return () => {
            window.removeEventListener('resize', updateScale);
        };
    }, [isFullscreen, setFullscreenScale]);

    const handleBackdropSelect = async (name: string, src: string) => {
        await stageManager.addBackdrop(name, src);
        stageManager.setBackdrop(name);
        setShowBackdropLibrary(false);
        setBackdropRefresh(prev => prev + 1);
        window.dispatchEvent(new Event('leap-stage-update'));
    };

    return { handleAddExtension, handleFullscreen, handleBackdropSelect };
}
