import * as Blockly from "blockly";

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
            default: 'default',
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

        const currentId = sprite.currentCostume || 'default';
        const initialVector = sprite.costumes?.[`vector_${currentId}`];
        const initialDisplay = sprite.costumes?.[currentId];

        setPaintEditor({
            isOpen: true,
            type: 'sprite',
            targetId: spriteId,
            initialImage: initialVector || initialDisplay || null,
            costumes: Object.entries(sprite.costumes || {})
                .filter(([id]) => !id.startsWith('vector_'))
                .map(([id, src]) => ({ 
                    id, 
                    name: costumeNameMap[id] || id, 
                    image: src,
                    vectorImage: sprite.costumes[`vector_${id}`]
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
            costumes: [],
            spriteName: scene?.name || `Scene`,
            mode: 'junior'
        });
    };

    const handleDeleteCostume = (index) => {
        console.log(`[DEBUG_BREAKPOINT] handleDeleteCostume triggered for index: ${index}`);
        const spriteId = paintEditor.targetId;
        const costumeToDelete = paintEditor.costumes[index];
        
        if (!costumeToDelete) {
            console.error('[DEBUG_BREAKPOINT] Costume not found at index:', index);
            return;
        }

        console.log(`[DEBUG_BREAKPOINT] Deleting costume: ${costumeToDelete.name} (${costumeToDelete.id}) from sprite: ${spriteId}`);

        setScenes(prev => prev.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            return {
                ...scene,
                sprites: scene.sprites.map(sprite => {
                    if (sprite.id !== spriteId) return sprite;
                    const newCostumes = { ...sprite.costumes };
                    delete newCostumes[costumeToDelete.id];
                    delete newCostumes[`vector_${costumeToDelete.id}`];
                    
                    // If we deleted the current costume, pick another one
                    let nextCurrent = sprite.currentCostume;
                    if (sprite.currentCostume === costumeToDelete.id) {
                        const remainingKeys = Object.keys(newCostumes);
                        nextCurrent = remainingKeys.length > 0 ? remainingKeys[0] : null;
                    }

                    return {
                        ...sprite,
                        costumes: newCostumes,
                        currentCostume: nextCurrent
                    };
                })
            };
        }));

        // Update paint editor state
        const newCostumes = paintEditor.costumes.filter((_, i) => i !== index);
        setPaintEditor(prev => ({
            ...prev,
            costumes: newCostumes
        }));
        console.log('[DEBUG_BREAKPOINT] handleDeleteCostume: State updates dispatched');
    };

    const handleDuplicateCostume = (index) => {
        console.log(`[DEBUG_BREAKPOINT] handleDuplicateCostume triggered for index: ${index}`);
        const spriteId = paintEditor.targetId;
        const costumeToDuplicate = paintEditor.costumes[index];
        
        if (!costumeToDuplicate) return;

        const newId = `costume_${Date.now()}`;
        const newName = `${costumeToDuplicate.name} Copy`;
        
        console.log(`[DEBUG_BREAKPOINT] Duplicating costume to: ${newName} (${newId})`);

        setScenes(prev => prev.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            return {
                ...scene,
                sprites: scene.sprites.map(sprite => {
                    if (sprite.id !== spriteId) return sprite;
                    return {
                        ...sprite,
                        costumes: {
                            ...sprite.costumes,
                            [newId]: costumeToDuplicate.image,
                            [`vector_${newId}`]: costumeToDuplicate.vectorImage
                        }
                    };
                })
            };
        }));

        // Update paint editor state
        const newCostumes = [...paintEditor.costumes];
        newCostumes.splice(index + 1, 0, {
            id: newId,
            name: newName,
            image: costumeToDuplicate.image,
            vectorImage: costumeToDuplicate.vectorImage
        });
        
        setPaintEditor(prev => ({
            ...prev,
            costumes: newCostumes
        }));
        console.log('[DEBUG_BREAKPOINT] handleDuplicateCostume: State updates dispatched');
    };

    const handlePaintSave = (imageData, svgData, name, originalId, shouldClose = true) => {
        // Use PNG for display (consistent, small, reliable), SVG for vector editing
        const displayData = imageData; 
        const vectorData = svgData;
        
        let costumeKey = originalId;
        if (!costumeKey) {
            costumeKey = name ? name.toLowerCase().replace(/\s+/g, '_') : `costume_${Date.now()}`;
        }

        console.log(`[DEBUG_BREAKPOINT][JuniorApp] handlePaintSave triggered (Key: ${costumeKey}, shouldClose: ${shouldClose})`);

        if (paintEditor.type === 'sprite') {
            const targetSpriteId = paintEditor.targetId;
            
            // Sync the costumes in the current paintEditor state so the editor component remains stable
            const updatedCostumes = paintEditor.costumes.map(c => {
                if (c.id === costumeKey) {
                    return { ...c, image: displayData, vectorImage: vectorData };
                }
                return c;
            });
            setPaintEditor(prev => ({ ...prev, costumes: updatedCostumes }));

            setScenes(prev => prev.map(scene => {
                if (scene.id !== currentSceneId) return scene;
                return {
                    ...scene,
                    sprites: scene.sprites.map(sprite => {
                        if (sprite.id !== targetSpriteId) return sprite;
                        return {
                            ...sprite,
                            costumes: {
                                ...sprite.costumes,
                                [costumeKey]: displayData, // Standard field for UI previews (PNG)
                                [`vector_${costumeKey}`]: vectorData // Source for editor (SVG)
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

        if (shouldClose) {
            console.log(`[DEBUG_BREAKPOINT][JuniorApp] Closing editor as requested`);
            setPaintEditor({ ...paintEditor, isOpen: false });
        } else {
            console.log(`[DEBUG_BREAKPOINT][JuniorApp] keeping editor open (auto-save)`);
        }
    };

    const addSprite = (spriteData = null) => {
        // Save current workspace to ref immediately before clearing
        if (workspaceRef && workspaceRef.current && spriteWorkspacesRef && spriteWorkspacesRef.current && activeSpriteIdRef && activeSpriteIdRef.current) {
            const activeId = activeSpriteIdRef.current;
            const json = Blockly.serialization.workspaces.save(workspaceRef.current);
            spriteWorkspacesRef.current.set(activeId, json);
            console.log(`[useJuniorUIHandlers] Saved workspace to ref for sprite: ${activeId}`);
        }
        
        saveCurrentWorkspace();
        const newId = `sprite_${Date.now()}`;

        let costumes = { default: "🐻" };
        let spriteName = "Bear";
        let spriteType = "bear";

        if (spriteData && typeof spriteData === 'object') {
            spriteName = spriteData.name || 'Sprite';
            spriteType = spriteData.id || spriteData.name?.toLowerCase() || 'custom';

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
            spriteType = type;
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
            const json = Blockly.serialization.workspaces.save(workspaceRef.current);
            if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
                spriteWorkspacesRef.current.set(activeSpriteIdRef.current, json);
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
                        Blockly.serialization.workspaces.load(json, workspaceRef.current);
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
        handleDeleteCostume,
        handleDuplicateCostume,
        addSprite,
        addScene,
        deleteSprite,
        deleteScene,
        toggleCamera,
        handleSaveRecording,
        toggleFullscreen,
        handleFileMenu,
        handleEditMenu
    };
}
