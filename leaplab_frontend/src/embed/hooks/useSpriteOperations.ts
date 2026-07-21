import { useCallback } from 'react';
import type React from 'react';
import Blockly from '@blockly-runtime';
import { Sprite } from '../../stage/Sprite';
import type { SpriteType } from '../../stage/Sprite';
import { animationVM } from '../../vm/AnimationVM';

export function useSpriteOperations(
    sprites: Sprite[],
    setSprites: React.Dispatch<React.SetStateAction<Sprite[]>>,
    selectedSpriteId: string | null,
    setSelectedSpriteId: React.Dispatch<React.SetStateAction<string | null>>,
    addLog: (msg: string) => void,
    triggerUpdate: () => void,
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>,
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>,
    activeSpriteIdRef: React.MutableRefObject<string | null>,
    uploadSpriteFileRef: React.MutableRefObject<HTMLInputElement | null>,
    saveCurrentSpriteWorkspace: () => void,
    loadSpriteWorkspace: (spriteId: string) => void,
    getDefaultSoundForSprite: (tags?: string[], name?: string) => { name: string; src: string },
) {

    const addSprite = useCallback((spriteType: SpriteType = 'cat') => {
        saveCurrentSpriteWorkspace();

        const id = `sprite_${Date.now()}`;
        const typeNames: Record<SpriteType, string> = { cat: 'Cat', ball: 'Ball', arrow: 'Arrow', robot: 'Robot' };
        const name = `${typeNames[spriteType]} ${sprites.filter(s => s.spriteType === spriteType).length + 1}`;
        const newSprite = new Sprite(id, name, triggerUpdate, spriteType);

        const spreadPositions = [
            { x: 120, y: 0 }, { x: -120, y: 0 }, { x: 0, y: 80 },
            { x: 0, y: -80 }, { x: -160, y: 100 }, { x: 160, y: 100 },
            { x: -160, y: -100 }, { x: 160, y: -100 },
        ];
        const MIN_DIST = 80;
        let assigned = false;
        for (const pos of spreadPositions) {
            const tooClose = sprites.some(s => {
                const dx = Math.abs(s.x - pos.x);
                const dy = Math.abs(s.y - pos.y);
                return dx < MIN_DIST && dy < MIN_DIST;
            });
            if (!tooClose) {
                newSprite.setX(pos.x);
                newSprite.setY(pos.y);
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            const offsetX = Math.floor(Math.random() * 60) - 30;
            const offsetY = Math.floor(Math.random() * 60) - 30;
            newSprite.setX(offsetX);
            newSprite.setY(offsetY);
        }

        animationVM.registerSprite(newSprite);
        const defaultSound = getDefaultSoundForSprite([], name);
        newSprite.addSound(defaultSound.name, defaultSound.src);

        spriteWorkspacesRef.current.set(id, {});

        if (workspaceRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
            isLoadingWorkspaceRef.current = false;
        }

        activeSpriteIdRef.current = id;
        setSelectedSpriteId(id);
        addLog(`Added sprite: ${name}`);
    }, [sprites, addLog, triggerUpdate, saveCurrentSpriteWorkspace, setSelectedSpriteId, activeSpriteIdRef, spriteWorkspacesRef, workspaceRef, isLoadingWorkspaceRef, getDefaultSoundForSprite]);

    const handleUploadSprite = useCallback(() => {
        uploadSpriteFileRef.current?.click();
    }, [uploadSpriteFileRef]);

    const handleUploadSpriteFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const src = String(event.target?.result || '');
            const name = file.name.replace(/\.[^/.]+$/, '');

            saveCurrentSpriteWorkspace();

            const id = `sprite_${Date.now()}`;
            const newSprite = new Sprite(id, name, triggerUpdate, 'cat');

            const spreadPositions = [
                { x: 120, y: 0 }, { x: -120, y: 0 }, { x: 0, y: 80 },
                { x: 0, y: -80 }, { x: -160, y: 100 }, { x: 160, y: 100 },
            ];
            const MIN_DIST = 80;
            let assigned = false;
            for (const pos of spreadPositions) {
                const tooClose = sprites.some(s => Math.abs(s.x - pos.x) < MIN_DIST && Math.abs(s.y - pos.y) < MIN_DIST);
                if (!tooClose) { newSprite.setX(pos.x); newSprite.setY(pos.y); assigned = true; break; }
            }
            if (!assigned) {
                newSprite.setX(Math.floor(Math.random() * 60) - 30);
                newSprite.setY(Math.floor(Math.random() * 60) - 30);
            }

            await newSprite.addCostume(name, src);
            newSprite.switchCostume(name);

            const defaultSound = getDefaultSoundForSprite([], name);
            await newSprite.addSound(defaultSound.name, defaultSound.src);

            animationVM.registerSprite(newSprite);
            spriteWorkspacesRef.current.set(id, {});

            if (workspaceRef.current) {
                isLoadingWorkspaceRef.current = true;
                Blockly.Events.disable();
                workspaceRef.current.clear();
                Blockly.Events.enable();
                setTimeout(() => { isLoadingWorkspaceRef.current = false; }, 50);
            }

            activeSpriteIdRef.current = id;
            setSelectedSpriteId(id);
            triggerUpdate();
            addLog(`Uploaded sprite: ${name}`);
        };
        reader.readAsDataURL(file);

        if (uploadSpriteFileRef.current) uploadSpriteFileRef.current.value = '';
    }, [sprites, addLog, triggerUpdate, saveCurrentSpriteWorkspace, setSelectedSpriteId, activeSpriteIdRef, spriteWorkspacesRef, workspaceRef, isLoadingWorkspaceRef, uploadSpriteFileRef, getDefaultSoundForSprite]);

    const handleRemoveBackground = useCallback(async (spriteId: string) => {
        const sprite = sprites.find(s => s.id === spriteId);
        if (!sprite || !sprite.currentCostume) return;

        addLog(`Removing background for ${sprite.name}...`);
        const imagePath = sprite.currentCostume.image.src;
        const relativePath = imagePath.split('assets/')[1];
        if (!relativePath) {
            addLog('Error: Could not resolve image path');
            return;
        }

        const fullRelativePath = `public/assets/${relativePath}`;
        try {
            const result = await window.electronAPI.removeBackground(fullRelativePath);
            if (result.success) {
                addLog(`Background removed for ${sprite.name}`);
                let finalSrc = imagePath;
                if (imagePath.toLowerCase().endsWith('.jpeg') || imagePath.toLowerCase().endsWith('.jpg')) {
                    finalSrc = imagePath.replace(/\.(jpeg|jpg)$/i, '.png');
                }
                const name = sprite.currentCostume.name;
                const cacheBuster = `t=${Date.now()}`;
                const newSrc = `${finalSrc}${finalSrc.includes('?') ? '&' : '?'}${cacheBuster}`;
                await sprite.addCostume(name, newSrc);
                triggerUpdate();
                window.dispatchEvent(new Event('leap-stage-update'));
            } else {
                addLog(`Failed to remove background: ${result.error}`);
            }
        } catch (e) {
            addLog('Error in background removal');
            console.error(e);
        }
    }, [sprites, addLog, triggerUpdate]);

    const deleteSprite = useCallback((id: string) => {
        animationVM.unregisterSprite(id);
        spriteWorkspacesRef.current.delete(id);
        setSprites(prev => prev.filter(s => s.id !== id));
        if (selectedSpriteId === id) {
            const remaining = sprites.filter(s => s.id !== id);
            const newSelected = remaining.length > 0 ? remaining[0].id : null;
            setSelectedSpriteId(newSelected);
            if (newSelected) loadSpriteWorkspace(newSelected);
            else if (workspaceRef.current) workspaceRef.current.clear();
        }
        addLog('Deleted sprite');
    }, [sprites, selectedSpriteId, addLog, loadSpriteWorkspace, setSprites, setSelectedSpriteId, spriteWorkspacesRef, workspaceRef]);

    return { addSprite, handleUploadSprite, handleUploadSpriteFile, handleRemoveBackground, deleteSprite };
}
