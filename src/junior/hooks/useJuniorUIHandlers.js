import * as Blockly from "@blockly-runtime";

const normalizeJuniorSpriteType = (rawType) => {
    const normalized = String(rawType || "").trim().toLowerCase();

    if (!normalized) return "custom";
    if (normalized === "pen" || normalized === "drawing_pen") return "pen";
    if (normalized.includes("pencil")) return "pencil";
    if (normalized.includes("drawing_pen")) return "pen";

    return normalized;
};

const cloneWorkspaceData = (workspaceJson) => JSON.parse(JSON.stringify(workspaceJson || {}));

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

    const handleEditSprite = (spriteId) => {
        const sprite = sprites.find(s => s.id === spriteId);
        if (!sprite) return;

        // Map costume IDs to display names
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
    };

    const handleEditScene = (sceneId) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;
        setBackdropEditSceneId(sceneId);
        setIsBackdropChooserOpen(true);
    };

    const handleBackdropSelect = (name, src, solidColor) => {
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
    };

    const handleBackdropPaint = () => {
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
    };

    const handlePaintSave = (imageData, svgData, name) => {
        // Use PNG data for stable rendering in sprite cards and stage preview.
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
    };

    const handleDeleteCostume = (index) => {
        if (paintEditor.type !== 'sprite' || !paintEditor.targetId) return;
        
        const sprite = sprites.find(s => s.id === paintEditor.targetId);
        if (!sprite) return;
        
        const costumeKeys = Object.keys(sprite.costumes);
        if (costumeKeys.length <= 1) {
            alert("Cannot delete the last costume!");
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

        // Update paint editor state to reflect deletion
        setPaintEditor(prev => ({
            ...prev,
            costumes: prev.costumes.filter((_, i) => i !== index)
        }));
    };

    const handleDuplicateCostume = (index) => {
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

        // Update paint editor state to reflect duplication
        setPaintEditor(prev => ({
            ...prev,
            costumes: [
                ...prev.costumes, 
                { id: newKey, name: `${newKey}`, image: dataToCopy }
            ]
        }));
    };

    const handleSwitchCostume = (index) => {
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
            // Update editor initial image to the switched costume
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
    };

    const handleRenameCostume = (index, newName) => {
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
    };

    const addSprite = (spriteData = null) => {
        // Save current workspace to ref immediately before clearing
        if (workspaceRef && workspaceRef.current && spriteWorkspacesRef && spriteWorkspacesRef.current && activeSpriteIdRef && activeSpriteIdRef.current) {
            const activeId = activeSpriteIdRef.current;
            const json = cloneWorkspaceData(Blockly.serialization.workspaces.save(workspaceRef.current));
            spriteWorkspacesRef.current.set(activeId, cloneWorkspaceData(json));
            console.log(`[useJuniorUIHandlers] Saved workspace to ref for sprite: ${activeId}`);
        }
        
        saveCurrentWorkspace();
        const newId = `sprite_${Date.now()}`;

        let costumes = { default: "🐻" };
        let spriteName = "Bear";
        let spriteType = "bear";

        if (spriteData && typeof spriteData === 'object') {
            spriteName = spriteData.name || 'Sprite';
            spriteType = normalizeJuniorSpriteType(spriteData.id || spriteData.name || 'custom');

            if (spriteData.costumes && spriteData.costumes.length > 0) {
                costumes = {};
                spriteData.costumes.forEach((c, index) => {
                    const key = index === 0 ? 'default' : `costume${index}`;
                    costumes[key] = c;
                });
            } else if (spriteData.image) {
                costumes = { default: spriteData.image };
            } else if (spriteData.emoji) {
                costumes = { default: spriteData.emoji };
            }
        } else {
            const type = spriteData || 'robot';
            spriteType = normalizeJuniorSpriteType(type);
            spriteName = type.charAt(0).toUpperCase() + type.slice(1);

            if (type === "robot") {
                costumes = {
                    default: '/assets/sprites/robot/robot_idle.svg',
                    wave1: '/assets/sprites/robot/image-Photoroom.png',
                    wave2: '/assets/sprites/robot/image-removebg-preview (1).png',
                    talk: '/assets/sprites/robot/image-removebg-preview.png'
                };
            } else if (type === "bear") {
                costumes = { default: "🐻", wave: "👋", angry: "😠" };
            } else if (type === "dog") {
                costumes = { default: "🐶", wave: "🐩", bark: "🗣️" };
            } else if (type === "cat") {
                costumes = { default: "🐱", sleep: "😴", wave: "🐾" };
            }
        }

        const CELL_SIZE = 24;
        const currentScene = scenes.find(s => s.id === currentSceneId);
        const existingSprites = currentScene?.sprites || [];
        const spreadPositions = [
            { x: 14 * CELL_SIZE, y: 6 * CELL_SIZE },   
            { x: 5 * CELL_SIZE, y: 6 * CELL_SIZE },    
            { x: 10 * CELL_SIZE, y: 3 * CELL_SIZE },   
            { x: 10 * CELL_SIZE, y: 10 * CELL_SIZE },  
            { x: 3 * CELL_SIZE, y: 3 * CELL_SIZE },    
            { x: 16 * CELL_SIZE, y: 3 * CELL_SIZE },   
            { x: 3 * CELL_SIZE, y: 10 * CELL_SIZE },   
            { x: 16 * CELL_SIZE, y: 10 * CELL_SIZE },  
            { x: 7 * CELL_SIZE, y: 8 * CELL_SIZE },    
            { x: 12 * CELL_SIZE, y: 4 * CELL_SIZE },   
        ];

        const MIN_DISTANCE = CELL_SIZE * 3; 
        let newX = 200, newY = 150;

        let foundPosition = false;
        for (const pos of spreadPositions) {
            const tooClose = existingSprites.some(s => {
                const dx = Math.abs(s.x - pos.x);
                const dy = Math.abs(s.y - pos.y);
                return dx < MIN_DISTANCE && dy < MIN_DISTANCE;
            });
            if (!tooClose) {
                newX = pos.x;
                newY = pos.y;
                foundPosition = true;
                break;
            }
        }

        if (!foundPosition) {
            newX = Math.floor(Math.random() * 14 + 3) * CELL_SIZE;
            newY = Math.floor(Math.random() * 9 + 3) * CELL_SIZE;
        }

        const newSprite = {
            id: newId,
            name: spriteName,
            type: spriteType,
            x: newX, y: newY, angle: 0, size: 100, visible: true,
            mirrored: false,
            costumes: costumes,
            currentCostume: "default",
            textColor: (spriteType.startsWith('letter_') || spriteType.startsWith('number_')) ? "#FF8C1A" : "#575E75",
            blocks: {}
        };
        
        // Update scenes and immediately update scenesRef to ensure workspace loading works
        setScenes(prev => {
            const updated = prev.map(s => {
                if (s.id === currentSceneId) return { ...s, sprites: [...s.sprites, newSprite] };
                return s;
            });
            // Update scenesRef immediately so the workspace loading effect can find the new sprite
            if (scenesRef && scenesRef.current) {
                scenesRef.current = updated;
            }
            return updated;
        });
        
        // Initialize empty workspace for the new sprite in ref storage
        if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
            spriteWorkspacesRef.current.set(newId, {});
            console.log(`[useJuniorUIHandlers] Initialized empty workspace for new sprite: ${newId}`);
        }
        
        // Clear workspace before switching to new sprite (matching Intermediate Blocks pattern)
        // Set loading flag to prevent change listener from saving empty state
        if (isLoadingWorkspaceRef) {
            isLoadingWorkspaceRef.current = true;
        }
        if (workspaceRef && workspaceRef.current) {
            Blockly.Events.disable();
            try {
                workspaceRef.current.clear();
                console.log(`[useJuniorUIHandlers] Cleared workspace for new sprite: ${newId}`);
            } finally {
                Blockly.Events.enable();
                // Update the ref to point to the new sprite immediately
                if (activeSpriteIdRef) {
                    activeSpriteIdRef.current = newId;
                }
                // Reset loading flag after a short delay to ensure any async events are swallowed
                setTimeout(() => {
                    if (isLoadingWorkspaceRef) {
                        isLoadingWorkspaceRef.current = false;
                    }
                }, 50);
            }
        } else {
            // Even if workspace ref is not available, update the active sprite ref
            if (activeSpriteIdRef) {
                activeSpriteIdRef.current = newId;
            }
        }
        
        setActiveSpriteId(newId);
        setIsSpriteModalOpen(false);
    };

    const addScene = () => {
        const newId = `scene${scenes.length + 1}`;
        const newScene = {
            id: newId,
            name: `Scene ${scenes.length + 1}`,
            background: "white",
            sprites: []
        };
        setScenes([...scenes, newScene]);
        setCurrentSceneId(newId);
    };

    const deleteSprite = (spriteId) => {
        if (sprites.length <= 1) {
            alert("Cannot delete the last sprite!");
            return;
        }
        if (!confirm(`Delete sprite?`)) return;

        // Save current workspace before deletion
        if (workspaceRef && workspaceRef.current && activeSpriteIdRef && activeSpriteIdRef.current && !isLoadingWorkspaceRef?.current) {
            const json = cloneWorkspaceData(Blockly.serialization.workspaces.save(workspaceRef.current));
            if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
                spriteWorkspacesRef.current.set(activeSpriteIdRef.current, cloneWorkspaceData(json));
            }
        }

        // Clean up workspace from ref storage
        if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
            spriteWorkspacesRef.current.delete(spriteId);
            console.log(`[useJuniorUIHandlers] Deleted workspace for sprite: ${spriteId}`);
        }

        setScenes(prev => prev.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            const updatedSprites = scene.sprites.filter(s => s.id !== spriteId);
            return { ...scene, sprites: updatedSprites };
        }));

        const remaining = sprites.filter(s => s.id !== spriteId);
        if (remaining.length > 0) {
            const newActiveId = remaining[0].id;
            setActiveSpriteId(newActiveId);
            
            // Load workspace for the new active sprite (matching Intermediate Blocks pattern)
            if (workspaceRef && workspaceRef.current && spriteWorkspacesRef && spriteWorkspacesRef.current) {
                isLoadingWorkspaceRef.current = true;
                Blockly.Events.disable();
                try {
                    const json = spriteWorkspacesRef.current.get(newActiveId);
                    workspaceRef.current.clear();
                    if (json && Object.keys(json).length > 0) {
                        Blockly.serialization.workspaces.load(cloneWorkspaceData(json), workspaceRef.current);
                        console.log(`[useJuniorUIHandlers] Loaded workspace for new active sprite: ${newActiveId}`);
                    }
                } catch (err) {
                    console.error(`[useJuniorUIHandlers] Error loading workspace after delete:`, err);
                } finally {
                    Blockly.Events.enable();
                    if (activeSpriteIdRef) {
                        activeSpriteIdRef.current = newActiveId;
                    }
                    setTimeout(() => {
                        isLoadingWorkspaceRef.current = false;
                    }, 50);
                }
            }
        }
    };

    const deleteScene = (sceneId) => {
        if (scenes.length <= 1) {
            alert("Cannot delete the last scene!");
            return;
        }
        if (!confirm(`Delete scene?`)) return;

        setScenes(prev => prev.filter(s => s.id !== sceneId));

        const remaining = scenes.filter(s => s.id !== sceneId);
        if (remaining.length > 0) {
            setCurrentSceneId(remaining[0].id);
            setActiveSpriteId(remaining[0].sprites[0]?.id || null);
        }
    };

    const toggleCamera = async () => {
        if (isCameraOn) {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
                cameraStreamRef.current = null;
            }
            if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = null;
            }
            setIsCameraOn(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                cameraStreamRef.current = stream;
                if (cameraVideoRef.current) {
                    cameraVideoRef.current.srcObject = stream;
                }
                setIsCameraOn(true);
            } catch (err) {
                console.error('Camera error:', err);
                alert('Could not access camera. Please allow camera permissions.');
            }
        }
    };

    const handleSaveRecording = (audioData) => {
        const name = `Recording ${recordingCount}`;
        setRecordingCount(prev => prev + 1);
        audioEngine.soundBank.assets[name] = audioData.blobUrl;
        alert(`Saved as '${name}'. You can now select it in the 'play sound' block dropdown!`);
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
            alert(`Feature '${action}' coming soon!`);
        }
    };

    const handleEditMenu = (action) => {
        if (action === "restore") alert("Restore workspace feature coming soon!");
        if (action === "undo") workspaceRef.current?.undo(false);
        if (action === "redo") workspaceRef.current?.undo(true);
    };

    return {
        handleEditSprite,
        handleEditScene,
        handleBackdropSelect,
        handleBackdropPaint,
        handlePaintSave,
        addSprite,
        addScene,
        deleteSprite,
        deleteScene,
        toggleCamera,
        handleSaveRecording,
        toggleFullscreen,
        handleFileMenu,
        handleEditMenu,
        handleDeleteCostume,
        handleDuplicateCostume,
        handleSwitchCostume,
        handleRenameCostume
    };
}
