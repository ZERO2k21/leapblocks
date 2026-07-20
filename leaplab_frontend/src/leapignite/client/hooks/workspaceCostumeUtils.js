/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { showToast } from "../components/Toast";

export function handleEditSprite(sprites, setPaintEditor, spriteId) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;

    const costumeNameMap = {
        default: 'Idle',
        wave1: 'Wave 1',
        wave2: 'Wave 2',
        talk: 'Talk',
        costume1: 'Photoroom',
        costume2: 'Preview 1',
        costume3: 'Preview 2',
        costume4: 'Wave 2',
        costume5: 'Wave 3',
        costume6: 'Wave 4'
    };

    setPaintEditor({
        isOpen: true,
        type: 'sprite',
        targetId: spriteId,
        initialImage: sprite.costumes?.[sprite.currentCostume || 'default'] || null,
        costumes: Object.entries(sprite.costumes || {}).map(([id, src]) => ({
            id,
            name: costumeNameMap[id] || id,
            image: src
        })),
        spriteName: sprite.name,
        mode: 'junior'
    });
}

export function handleEditScene(scenes, setBackdropEditSceneId, setIsBackdropChooserOpen, sceneId) {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    setBackdropEditSceneId(sceneId);
    setIsBackdropChooserOpen(true);
}

export function handleBackdropSelect(backdropEditSceneId, currentSceneId, setScenes, setIsBackdropChooserOpen, setBackdropEditSceneId, name, src, solidColor) {
    const targetId = backdropEditSceneId || currentSceneId;
    if (src) {
        setScenes(prev => prev.map(scene => {
            if (scene.id !== targetId) return scene;
            return {
                ...scene,
                background: `url(${src}) center/cover no-repeat`,
                backgroundImage: src,
                backdropName: name
            };
        }));
    } else if (solidColor) {
        setScenes(prev => prev.map(scene => {
            if (scene.id !== targetId) return scene;
            return {
                ...scene,
                background: solidColor,
                backgroundImage: null,
                backdropName: name
            };
        }));
    }
    setIsBackdropChooserOpen(false);
    setBackdropEditSceneId(null);
}

export function handleBackdropPaint(backdropEditSceneId, currentSceneId, scenes, setIsBackdropChooserOpen, setPaintEditor) {
    setIsBackdropChooserOpen(false);
    const targetId = backdropEditSceneId || currentSceneId;
    const scene = scenes.find(s => s.id === targetId);
    setPaintEditor({
        isOpen: true,
        type: 'backdrop',
        targetId: targetId,
        initialImage: null,
        mode: 'junior',
        costumes: scenes.map(s => ({
            id: s.id,
            name: s.backdropName || s.name,
            image: s.backgroundImage || s.background
        }))
    });
}

export function handlePaintSave(paintEditor, setPaintEditor, currentSceneId, setScenes, imageData, svgData, name, rotationCenter) {
    const savedData = imageData;
    const costumeKey = name ? name.toLowerCase().replace(/\s+/g, '_') : 'custom';

    if (paintEditor.type === 'sprite') {
        setScenes(prev => prev.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            return {
                ...scene,
                sprites: scene.sprites.map(sprite => {
                    if (sprite.id !== paintEditor.targetId) return sprite;
                    return {
                        ...sprite,
                        costumes: {
                            ...sprite.costumes,
                            [costumeKey]: savedData
                        },
                        currentCostume: costumeKey
                    };
                })
            };
        }));
    } else if (paintEditor.type === 'backdrop') {
        setScenes(prev => prev.map(scene => {
            if (scene.id !== paintEditor.targetId) return scene;
            return { ...scene, background: `url(${imageData})`, backgroundImage: imageData };
        }));
    }
    setPaintEditor({ ...paintEditor, isOpen: false });
}

export function handleDeleteCostume(paintEditor, sprites, currentSceneId, setScenes, setPaintEditor, index) {
    if (paintEditor.type !== 'sprite' || !paintEditor.targetId) return;

    const sprite = sprites.find(s => s.id === paintEditor.targetId);
    if (!sprite) return;

    const costumeKeys = Object.keys(sprite.costumes);
    if (costumeKeys.length <= 1) {
        showToast("Cannot delete the last costume!", 'warning');
        return;
    }

    const keyToDelete = costumeKeys[index];
    if (!confirm(`Delete costume?`)) return;

    setScenes(prev => prev.map(scene => {
        if (scene.id !== currentSceneId) return scene;
        return {
            ...scene,
            sprites: scene.sprites.map(s => {
                if (s.id !== paintEditor.targetId) return s;
                const newCostumes = { ...s.costumes };
                delete newCostumes[keyToDelete];

                let nextCostume = s.currentCostume;
                if (s.currentCostume === keyToDelete) {
                    nextCostume = Object.keys(newCostumes)[0];
                }

                return { ...s, costumes: newCostumes, currentCostume: nextCostume };
            })
        };
    }));

    setPaintEditor(prev => ({
        ...prev,
        costumes: prev.costumes.filter((_, i) => i !== index)
    }));
}

export function handleDuplicateCostume(paintEditor, sprites, currentSceneId, setScenes, setPaintEditor, index) {
    if (paintEditor.type !== 'sprite' || !paintEditor.targetId) return;

    const sprite = sprites.find(s => s.id === paintEditor.targetId);
    if (!sprite) return;

    const costumeKeys = Object.keys(sprite.costumes);
    const keyToCopy = costumeKeys[index];
    const dataToCopy = sprite.costumes[keyToCopy];

    const newKey = `${keyToCopy}_copy_${Date.now()}`;

    setScenes(prev => prev.map(scene => {
        if (scene.id !== currentSceneId) return scene;
        return {
            ...scene,
            sprites: scene.sprites.map(s => {
                if (s.id !== paintEditor.targetId) return s;
                return {
                    ...s,
                    costumes: { ...s.costumes, [newKey]: dataToCopy },
                    currentCostume: newKey
                };
            })
        };
    }));

    setPaintEditor(prev => ({
        ...prev,
        costumes: [
            ...prev.costumes,
            { id: newKey, name: `${newKey}`, image: dataToCopy }
        ]
    }));
}

export function handleSwitchCostume(paintEditor, sprites, scenes, currentSceneId, setScenes, setCurrentSceneId, setPaintEditor, index) {
    if (!paintEditor.targetId) return;

    if (paintEditor.type === 'sprite') {
        const sprite = sprites.find(s => s.id === paintEditor.targetId);
        if (!sprite) return;
        const costumeKeys = Object.keys(sprite.costumes);
        const costumeKey = costumeKeys[index];
        setScenes(prev => prev.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            return {
                ...scene,
                sprites: scene.sprites.map(s => {
                    if (s.id !== paintEditor.targetId) return s;
                    return { ...s, currentCostume: costumeKey };
                })
            };
        }));
        setPaintEditor(prev => ({
            ...prev,
            initialImage: sprite.costumes[costumeKey]
        }));
    } else if (paintEditor.type === 'backdrop') {
        const sceneToSwitchTo = scenes[index];
        if (!sceneToSwitchTo) return;
        setCurrentSceneId(sceneToSwitchTo.id);
        setPaintEditor(prev => ({
            ...prev,
            targetId: sceneToSwitchTo.id,
            initialImage: sceneToSwitchTo.backgroundImage || sceneToSwitchTo.background,
            spriteName: sceneToSwitchTo.backdropName || sceneToSwitchTo.name
        }));
    }
}

export function handleRenameCostume(paintEditor, sprites, scenes, currentSceneId, setScenes, setPaintEditor, index, newName) {
    if (!paintEditor.targetId) return;

    if (paintEditor.type === 'sprite') {
        const sprite = sprites.find(s => s.id === paintEditor.targetId);
        if (!sprite) return;
        const oldKey = Object.keys(sprite.costumes)[index];
        const newKey = newName.toLowerCase().replace(/\s+/g, '_');

        setScenes(prev => prev.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            return {
                ...scene,
                sprites: scene.sprites.map(s => {
                    if (s.id !== paintEditor.targetId) return s;
                    const newCostumes = {};
                    Object.entries(s.costumes).forEach(([k, v]) => {
                        if (k === oldKey) newCostumes[newKey] = v;
                        else newCostumes[k] = v;
                    });
                    return {
                        ...s,
                        costumes: newCostumes,
                        currentCostume: s.currentCostume === oldKey ? newKey : s.currentCostume
                    };
                })
            };
        }));
    } else if (paintEditor.type === 'backdrop') {
        const sceneToRename = scenes[index];
        if (!sceneToRename) return;
        setScenes(prev => prev.map((s, i) => {
            if (i !== index) return s;
            return { ...s, backdropName: newName };
        }));
    }

    setPaintEditor(prev => ({
        ...prev,
        costumes: prev.costumes.map((c, i) => i === index ? { ...c, name: newName } : c)
    }));
}
