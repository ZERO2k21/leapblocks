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
    isLoadingWorkspaceRef
}) {

    const handleEditSprite = (spriteId) => {
        const sprite = sprites.find(s => s.id === spriteId);
        if (!sprite) return;
        setPaintEditor({
            isOpen: true,
            type: 'sprite',
            targetId: spriteId,
            initialImage: sprite.costumes?.[sprite.currentCostume || 'default'] || null,
            costumes: Object.entries(sprite.costumes || {}).map(([id, src]) => ({ id, name: id, image: src })),
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

    const handlePaintSave = (imageData, svgData, name) => {
        const savedData = svgData || imageData;
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

    const addSprite = (spriteData = null) => {
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
                    wave1: '/assets/sprites/robot/robot_wave1.svg',
                    wave2: '/assets/sprites/robot/robot_wave2.svg',
                    talk: '/assets/sprites/robot/robot_talk1.svg'
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
        
        // Clear workspace before switching to new sprite
        // Set loading flag to prevent change listener from saving empty state
        if (isLoadingWorkspaceRef) {
            isLoadingWorkspaceRef.current = true;
        }
        if (workspaceRef && workspaceRef.current) {
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
            // Reset loading flag after a short delay
            setTimeout(() => {
                if (isLoadingWorkspaceRef) {
                    isLoadingWorkspaceRef.current = false;
                }
            }, 50);
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

        setScenes(prev => prev.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            const updatedSprites = scene.sprites.filter(s => s.id !== spriteId);
            return { ...scene, sprites: updatedSprites };
        }));

        const remaining = sprites.filter(s => s.id !== spriteId);
        if (remaining.length > 0) {
            setActiveSpriteId(remaining[0].id);
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
