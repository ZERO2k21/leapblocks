/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
// @ts-ignore
import Blockly from "../../leapembed/server/blockly/runtime";
// @ts-ignore
import { javascriptGenerator } from '../../leapembed/server/blockly/runtime';
import Teddy from "./sprites/Teddy";
import RightPanel from "./components/RightPanel";
import BackdropChooser from "./components/BackdropChooser";
import JuniorMenuBar from "./components/JuniorMenuBar";
import PositionPicker from "./components/PositionPicker";
import DirectionPicker from "./components/DirectionPicker";
import InstrumentPicker from "./components/InstrumentPicker";
import PianoPicker from "./components/PianoPicker";
import PaintEditor from "../../leapembed/client/components/PaintEditor";
import { SpriteLibrary } from "../../leapembed/client/components/SpriteLibrary";
import WorkspaceControls from "../../leapembed/client/components/WorkspaceControls";
import WorkspaceTrash from "../../leapembed/client/components/WorkspaceTrash";
import SuccessModal from "./components/SuccessModal";
import UnsavedWarningModal from "./components/UnsavedWarningModal";
import JuniorSoundRecorder from "./components/JuniorSoundRecorder";
import JuniorExtensionLibrary from "./components/JuniorExtensionLibrary";
import { getJuniorBlocks, getJuniorToolbox } from "../../leapembed/server/blocks/juniorBlocks";
import { useSpriteSystem } from "./hooks/useSpriteSystem";
import { useJuniorWorkspace } from "./hooks/useJuniorWorkspace";
import { useJuniorExecution } from "./hooks/useJuniorExecution";
import { useJuniorProject } from "./hooks/useJuniorProject";
import { useJuniorWindowActions } from "./hooks/useJuniorWindowActions";
import { useJuniorUIHandlers } from "./hooks/useJuniorUIHandlers";
import { getLessonConfig } from "../server/engine/LessonConfig";
import { GoalManager } from "../server/engine/GoalManager";
import { HintManager } from "../server/engine/HintManager";
import { AudioEngine } from "../../leapAudio/src/audioEngine";
import { initRuntime } from "../../leapembed/server/runtime/runtimeBridge";
import { gettingStartedTutorial } from "./tutorials/gettingStarted";
import { moveRoboTutorial } from "./tutorials/moveRobo";
import { makeSoundsTutorial } from "./tutorials/makeSounds";
import JuniorTutorialOverlay from "./components/JuniorTutorialOverlay";
import { JuniorProject, JuniorScene, JuniorSprite } from "./types";

const TUTORIALS: Record<string, any> = {
    'getting_started': gettingStartedTutorial,
    'move_robo': moveRoboTutorial,
    'make_sounds': makeSoundsTutorial
};

// Import styles
import "./styles/juniorBlocks.css";
import "./styles/positionPicker.css";
import "./styles/directionPicker.css";
import "./styles/juniorLooksBlocks.css";

// Robot Assets
const robotIdle = "assets/sprites/robot/robot_idle.svg";
const robotWave1 = "assets/sprites/robot/image-Photoroom.png";
const robotWave2 = "assets/sprites/robot/image-removebg-preview (1).png";
const robotTalk1 = "assets/sprites/robot/image-removebg-preview.png";

// ─── Lazy initialization to avoid TDZ errors in production builds ─────────
let _audioEngine: AudioEngine, _blocksRegistered: boolean;

function getAudioEngine() {
    if (!_audioEngine) {
        _audioEngine = new AudioEngine();
    }
    return _audioEngine;
}

function ensureBlocksRegistered() {
    if (!_blocksRegistered) {
        _blocksRegistered = true;
        Blockly.common.defineBlocks(getJuniorBlocks());
        javascriptGenerator.forBlock['junior_change_costume'] = () => 'nextCostume();\n';
    }
}

const cloneWorkspaceData = (workspaceJson: any) => JSON.parse(JSON.stringify(workspaceJson || {}));

interface JuniorAppProps {
    onBack: () => void;
}

export default function JuniorApp({ onBack }: JuniorAppProps) {
    // Ensure blocks are registered on first render
    ensureBlocksRegistered();

    // Get lazily-initialized singletons
    const audioEngine = getAudioEngine();

    // Initialize modular runtime on mount
    useEffect(() => {
        initRuntime();
    }, []);

    // Refs
    const workspaceRef = useRef<any>(null);
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraVideoRef = useRef<HTMLVideoElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const activeSpriteIdRef = useRef<string | null>(null);
    const scenesRef = useRef<JuniorScene[] | null>(null);
    const stageContainerRef = useRef<HTMLDivElement>(null);
    const timeoutRefs = useRef<Record<string, any>>({});
    const isLoadingWorkspaceRef = useRef(false);
    const handleSpriteSelectRef = useRef<((id: string) => void) | null>(null);

    // UI state
    const [projectName, setProjectName] = useState("Untitled Project");
    const [isDraggingSpriteOnStage, setIsDraggingSpriteOnStage] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isSoundRecorderOpen, setIsSoundRecorderOpen] = useState(false);
    const [recordingCount, setRecordingCount] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const draggedBlockRef = useRef<any>(null);
    const [isDraggingBlock, setIsDraggingBlock] = useState(false);
    const [successSpriteId, setSuccessSpriteId] = useState<string | null>(null);
    const [stageSize, setStageSize] = useState({ width: 480, height: 360 });
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const updateStageSize = () => {
            const rect = stageContainerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const nextWidth = Math.max(1, Math.round(rect.width));
            const nextHeight = Math.max(1, Math.round(rect.height));

            setStageSize((prev) => (
                prev.width === nextWidth && prev.height === nextHeight
                    ? prev
                    : { width: nextWidth, height: nextHeight }
            ));
        };

        updateStageSize();

        const stageNode = stageContainerRef.current;
        const resizeObserver = stageNode && typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateStageSize)
            : null;

        resizeObserver?.observe(stageNode!);
        window.addEventListener("resize", updateStageSize);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateStageSize);
        };
    }, []);

    // Modals state
    const [isSpriteModalOpen, setIsSpriteModalOpen] = useState(false);
    const [isBackdropChooserOpen, setIsBackdropChooserOpen] = useState(false);
    const [backdropEditSceneId, setBackdropEditSceneId] = useState<string | null>(null);
    const [currentTutorialId, setCurrentTutorialId] = useState<string | null>(null);

    const handleTutorialStart = (tutorialId: string) => setCurrentTutorialId(tutorialId);
    const handleTutorialClose = () => setCurrentTutorialId(null);
    const currentTutorial = currentTutorialId ? TUTORIALS[currentTutorialId] : null;

    // Paint Editor
    const [paintEditor, setPaintEditor] = useState({
        isOpen: false,
        type: 'sprite' as 'sprite' | 'backdrop',
        targetId: null as string | null,
        initialImage: null as any,
        costumes: [] as any[],
        spriteName: '',
        mode: 'junior' as 'intermediate' | 'junior' | undefined
    });

    // --- SPRITE SYSTEM (FSM) ---
    const { scenes, setScenes, currentSceneId, setCurrentSceneId, actions: spriteActions } = useSpriteSystem([
        {
            id: "scene1",
            name: "Scene 1",
            background: "white",
            backgroundImage: "assets/backdrops/default.jpg",
            backdropName: "Default",
            sprites: [
                {
                    id: "robot_default", name: "Robot", type: "robot",
                    x: 200, y: 150, angle: 0, size: 150, visible: true, mirrored: false, speech: null,
                    costumes: {
                        default: robotIdle,
                        wave1: robotWave1,
                        wave2: robotWave2,
                        talk: robotTalk1
                    },
                    currentCostume: "default"
                }
            ]
        }
    ]);

    const [activeSpriteId, setActiveSpriteId] = useState<string | null>("robot_default");
    const [winMessage, setWinMessage] = useState<string | null>(null);

    // Sync globals used by dropdowns and runtime helpers.
    useEffect(() => {
        const getJuniorSoundOptions = () => {
            const assets = (audioEngine as any).soundBank?.assets || {};
            return Object.keys(assets);
        };

        const getActiveSpriteCostumes = () => {
            const sprite = scenes.find(s => s.id === currentSceneId)?.sprites.find(s => s.id === activeSpriteId);
            if (sprite) {
                return Object.keys(sprite.costumes);
            }
            return [];
        };

        scenesRef.current = scenes;
        (window as any).activeSpriteId = activeSpriteId;

        // Override any stale global from other editors before Blockly builds dropdowns.
        (window as any).getActiveSpriteSounds = getJuniorSoundOptions;
        (window as any).getActiveSpriteCostumes = getActiveSpriteCostumes;

        return () => {
            delete (window as any).activeSpriteId;
            if ((window as any).getActiveSpriteSounds === getJuniorSoundOptions) {
                delete (window as any).getActiveSpriteSounds;
            }
            if ((window as any).getActiveSpriteCostumes === getActiveSpriteCostumes) {
                delete (window as any).getActiveSpriteCostumes;
            }
        };
    }, [scenes, activeSpriteId, currentSceneId]);

    const currentScene = scenes?.find(s => s.id === currentSceneId) || scenes?.[0];
    const sprites = currentScene?.sprites || [];

    // Per-sprite workspace storage: maps spriteId -> Blockly serialized JSON (synchronous ref-based storage)
    const spriteWorkspacesRef = useRef(new Map<string, any>());
    const currentToolboxContentsRef = useRef<any[]>([]);

    // ═══════════════════════════════════════════════════════════════════════
    // SPRITE WORKSPACE MANAGEMENT (Matching Intermediate Blocks Architecture)
    // ═══════════════════════════════════════════════════════════════════════

    // Save current workspace blocks to the per-sprite map
    const saveCurrentWorkspace = useCallback(() => {
        const activeId = activeSpriteIdRef.current;
        if (!workspaceRef.current || !activeId || isLoadingWorkspaceRef.current) return;

        const json = cloneWorkspaceData(Blockly.serialization.workspaces.save(workspaceRef.current));

        // Save to ref for immediate access
        spriteWorkspacesRef.current.set(activeId, cloneWorkspaceData(json));
        console.log(`[JuniorApp] Saved workspace for sprite: ${activeId}`);

        // Also update state for persistence
        setScenes(prevScenes => {
            return prevScenes.map(scene => {
                if (scene.id !== currentSceneId) return scene;

                return {
                    ...scene,
                    sprites: scene.sprites.map(sprite => {
                        if (sprite.id !== activeId) return sprite;

                        if (JSON.stringify(sprite.blocks) !== JSON.stringify(json)) {
                            console.log(`[JuniorApp] Saved workspace blocks to sprite: ${sprite.name}`);
                            return { ...sprite, blocks: cloneWorkspaceData(json) };
                        }
                        return sprite;
                    })
                };
            });
        });
    }, [currentSceneId, setScenes]);

    const handleBlocksDropped = useCallback((targetSpriteId: string, blockData: any) => {
        const blocks = blockData || draggedBlockRef.current;
        if (!blocks || targetSpriteId === activeSpriteIdRef.current) return;

        console.log(`[JuniorApp] Dropped blocks onto sprite: ${targetSpriteId}`);

        let targetWorkspace = spriteWorkspacesRef.current.get(targetSpriteId);
        if (!targetWorkspace) {
            for (const scene of scenesRef.current || []) {
                const sprite = scene.sprites.find(s => s.id === targetSpriteId);
                if (sprite && sprite.blocks) {
                    targetWorkspace = sprite.blocks;
                    break;
                }
            }
        }

        if (!targetWorkspace || !targetWorkspace.blocks) {
            targetWorkspace = {
                blocks: {
                    languageVersion: 0,
                    blocks: []
                }
            };
        }

        const newBlocks = JSON.parse(JSON.stringify(blocks));
        // Ensure the block has a visible position on the workspace
        if (newBlocks.x === undefined) newBlocks.x = 100;
        if (newBlocks.y === undefined) newBlocks.y = 100;

        // Offset so it doesn't overlap exactly if dragged multiple times
        newBlocks.x += (Math.random() * 40);
        newBlocks.y += (Math.random() * 40);

        const updatedWorkspace = {
            ...targetWorkspace,
            blocks: {
                languageVersion: targetWorkspace.blocks.languageVersion || 0,
                blocks: [...(targetWorkspace.blocks.blocks || []), newBlocks]
            }
        };

        spriteWorkspacesRef.current.set(targetSpriteId, cloneWorkspaceData(updatedWorkspace));
        setScenes(prev => prev.map(scene => ({
            ...scene,
            sprites: scene.sprites.map(s => s.id === targetSpriteId ? { ...s, blocks: cloneWorkspaceData(updatedWorkspace) } : s)
        })));

        if ((window as any).jiggle) (window as any).jiggle(targetSpriteId);

        // Flash success
        setSuccessSpriteId(targetSpriteId);
        setTimeout(() => setSuccessSpriteId(null), 1000);

        // Auto-switch to the target sprite so the user can see the blocks immediately
        setTimeout(() => {
            handleSpriteSelectRef.current?.(targetSpriteId);
        }, 300);
    }, [setScenes]);

    // Load workspace blocks from the per-sprite map
    const loadSpriteWorkspace = useCallback((spriteId: string) => {
        if (!workspaceRef.current) {
            console.warn('[JuniorApp] Cannot load workspace: workspaceRef.current is null');
            return;
        }

        // First check ref-based storage (immediate), then fall back to sprite.blocks
        let json = spriteWorkspacesRef.current.get(spriteId);
        if (!json || Object.keys(json).length === 0) {
            // Fallback to sprite.blocks from scenes
            for (const scene of scenesRef.current || []) {
                const sprite = scene.sprites.find(s => s.id === spriteId);
                if (sprite && sprite.blocks && Object.keys(sprite.blocks).length > 0) {
                    json = cloneWorkspaceData(sprite.blocks);
                    break;
                }
            }
        }

        // ALWAYS disable events when manually changing workspace content
        // to prevent handleWorkspaceChange from saving intermediate/wrong states
        isLoadingWorkspaceRef.current = true;
        Blockly.Events.disable();
        try {
            if (json && Object.keys(json).length > 0) {
                console.log(`[JuniorApp] Loading workspace for ${spriteId}:`, json);
                workspaceRef.current.clear();
                Blockly.serialization.workspaces.load(cloneWorkspaceData(json), workspaceRef.current);
                console.log('[JuniorApp] Successfully loaded workspace for sprite:', spriteId);
            } else {
                workspaceRef.current.clear();
                console.log('[JuniorApp] Cleared workspace (no saved blocks) for sprite:', spriteId);
            }
        } catch (err) {
            console.error('[JuniorApp] Error loading workspace JSON:', err);
        } finally {
            Blockly.Events.enable();
            activeSpriteIdRef.current = spriteId; // Update true owner only after loading finishes

            // PERSIST FLYOUT: Ensure flyout stays open after workspace load/clear
            const flyout = workspaceRef.current.getFlyout();
            if (flyout) {
                const contents = currentToolboxContentsRef.current;
                if (contents && contents.length > 0) {
                    console.log('[JuniorApp] Restoring flyout after workspace load');
                    flyout.show(contents);
                    if (flyout.reflowInternal_) flyout.reflowInternal_();
                }
            }

            // Use setTimeout to ensure any strictly asynchronous layout events 
            // thrown by Blockly immediately after enable() are also swallowed.
            setTimeout(() => {
                isLoadingWorkspaceRef.current = false;
            }, 50);
        }
    }, []);

    const wp = useJuniorWorkspace({
        workspaceRef,
        blocklyDiv,
        activeSpriteIdRef,
        scenesRef,
        setIsSoundRecorderOpen,
        saveCurrentWorkspace,
        spriteActions,
        currentToolboxContentsRef,
        isLoadingWorkspaceRef,
        draggedBlockRef,
        setIsDraggingBlock,
        lastMousePosRef,
        onBlocksDropped: handleBlocksDropped as any
    });

    const exec = useJuniorExecution({
        workspaceRef,
        scenes,
        currentSceneId,
        activeSpriteIdRef,
        activeSpriteId,
        spriteActions,
        spriteWorkspacesRef,
        saveCurrentWorkspace
    });

    const project = useJuniorProject({
        workspaceRef,
        scenes,
        setScenes,
        currentSceneId,
        setCurrentSceneId,
        activeSpriteIdRef,
        setActiveSpriteId,
        stopBlocks: exec.stopBlocks,
        projectName,
        setProjectName,
        saveCurrentWorkspace,
        spriteWorkspacesRef,
        isLoadingWorkspaceRef
    });

    // Wrapper for backward compatibility - delegates to loadSpriteWorkspace
    const loadWorkspace = (sprite: JuniorSprite) => {
        loadSpriteWorkspace(sprite.id);
    };

    // Handle scene selection: save old, load new
    const handleSceneSelect = useCallback((newSceneId: string) => {
        if (newSceneId === currentSceneId) return;

        // Clear highlights before switching
        if (workspaceRef.current) {
            workspaceRef.current.highlightBlock(null);
        }

        // Save current workspace before switching
        saveCurrentWorkspace();
        setCurrentSceneId(newSceneId);

        const newScene = scenes.find(s => s.id === newSceneId);
        if (newScene && newScene.sprites.length > 0) {
            const newSpriteId = newScene.sprites[0].id;
            setActiveSpriteId(newSpriteId);
            loadSpriteWorkspace(newSpriteId);
        } else {
            setActiveSpriteId(null);
            // Clear workspace when no sprites in scene
            if (workspaceRef.current) {
                isLoadingWorkspaceRef.current = true;
                Blockly.Events.disable();
                workspaceRef.current.clear();
                Blockly.Events.enable();
                setTimeout(() => {
                    isLoadingWorkspaceRef.current = false;
                }, 50);
            }
        }
    }, [currentSceneId, scenes, saveCurrentWorkspace, loadSpriteWorkspace, setCurrentSceneId]);

    // Handle sprite selection: save old, load new
    const handleSpriteSelect = useCallback((newId: string) => {
        if (newId === activeSpriteId) return;

        // Clear highlights in old workspace before switching
        if (workspaceRef.current) {
            workspaceRef.current.highlightBlock(null);
        }

        // Save current workspace before switching
        saveCurrentWorkspace();

        // Load new sprite's workspace
        setActiveSpriteId(newId);
        loadSpriteWorkspace(newId);
    }, [activeSpriteId, saveCurrentWorkspace, loadSpriteWorkspace]);
    handleSpriteSelectRef.current = handleSpriteSelect;

    const handleNextScene = () => {
        const currentIndex = scenes.findIndex(s => s.id === currentSceneId);
        const nextIndex = (currentIndex + 1) % scenes.length;
        handleSceneSelect(scenes[nextIndex].id);
    };

    useJuniorWindowActions({
        scenes,
        currentSceneId,
        activeSpriteIdRef,
        activeSpriteId,
        sprites,
        spriteActions,
        handleSceneSelect,
        handleNextScene,
        handleSpriteSelect,
        timeoutRefs,
        canvasRef,
        audioEngine,
        setWinMessage
    });

    const handlers = useJuniorUIHandlers({
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
    });

    // --- EFFECT HOOKS ---
    useEffect(() => {
        const config = getLessonConfig() as any;
        if (config.goal && !winMessage) {
            const result = GoalManager.checkGoal(config.goal, sprites, activeSpriteId || '');
            if (result.complete) {
                setWinMessage(result.message || null);
            }
        }
    }, [sprites, activeSpriteId, winMessage]);

    // Initial workspace load effect - only runs once on mount
    useEffect(() => {
        if (!workspaceRef.current || !activeSpriteId) return;

        // Only load if this is the initial load (ref is null)
        if (activeSpriteIdRef.current !== null) return;

        // Find the sprite in the current scene
        let activeSprite = null;
        if (scenesRef.current) {
            for (const scene of scenesRef.current) {
                activeSprite = scene.sprites.find(s => s.id === activeSpriteId);
                if (activeSprite) break;
            }
        }

        if (!activeSprite) {
            activeSprite = sprites.find(s => s.id === activeSpriteId);
        }

        if (activeSprite) {
            console.log(`[JuniorApp] Initial workspace load for sprite: ${activeSprite.name}`);
            loadSpriteWorkspace(activeSpriteId);
        }
    }, [activeSpriteId, loadSpriteWorkspace, sprites]); // Empty deps - only run on mount

    const [, setHint] = useState<string | null>(null);
    const lastInteraction = useRef<number>(0);

    useEffect(() => {
        if (!lastInteraction.current) lastInteraction.current = Date.now();
        const interval = setInterval(() => {
            const idle = Date.now() - lastInteraction.current;
            const config = getLessonConfig() as any;
            const count = workspaceRef.current?.getAllBlocks(false).length || 0;
            const msg = HintManager.getHint(idle, config.goal, count);
            setHint(msg);
        }, 1000);

        const resetIdle = () => (lastInteraction.current = Date.now());
        window.addEventListener("pointerdown", resetIdle);
        window.addEventListener("keydown", resetIdle);
        return () => {
            clearInterval(interval);
            window.removeEventListener("pointerdown", resetIdle);
            window.removeEventListener("keydown", resetIdle);
        };
    }, []);

    useEffect(() => {
        (window as any).drawSegment = (x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        };

        (window as any).clearPen = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        (window as any).wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms * 1000));

        return () => {
            delete (window as any).drawSegment;
            delete (window as any).clearPen;
            delete (window as any).wait;
        };
    }, []);

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
            <style>
                {`
                    @keyframes pulse {
                        from { opacity: 0.5; transform: scale(1); }
                        to { opacity: 0.8; transform: scale(1.05); }
                    }
                `}
            </style>
            <input type="file" ref={project.fileInputRef} style={{ display: "none" }} accept=".json" onChange={project.handleFileLoad} />

            <JuniorMenuBar
                projectName={projectName}
                onProjectNameChange={setProjectName}
                onFileAction={handlers.handleFileMenu}
                onEditAction={handlers.handleEditMenu}
                onTutorialStart={handleTutorialStart}
                onBack={onBack}
            />

            {currentTutorial && (
                <JuniorTutorialOverlay
                    tutorial={currentTutorial}
                    onComplete={handleTutorialClose}
                    onClose={handleTutorialClose}
                />
            )}

            <JuniorSoundRecorder
                isOpen={isSoundRecorderOpen}
                onClose={() => setIsSoundRecorderOpen(false)}
                onSave={handlers.handleSaveRecording}
            />

            {wp.isExtensionLibraryOpen && (
                <JuniorExtensionLibrary
                    onClose={() => wp.setIsExtensionLibraryOpen(false)}
                    onSelectExtension={wp.handleAddExtension}
                />
            )}

            {wp.showInstPicker && (
                <InstrumentPicker
                    position={wp.pickerPos}
                    onClose={() => wp.setShowInstPicker(false)}
                    onPick={(inst: string) => {
                        if (wp.activeBlock) {
                            wp.activeBlock.setFieldValue(inst, "INSTRUMENT");
                            if ((audioEngine as any).instrumentPlayer) {
                                (audioEngine as any).instrumentPlayer.setInstrument(inst);
                            }
                        }
                    }}
                />
            )}

            {wp.showPianoPicker && (
                <PianoPicker
                    position={wp.pickerPos}
                    initialNote={wp.activeBlock?.getFieldValue("NOTE")}
                    initialOctave={parseInt(wp.activeBlock?.getFieldValue("OCTAVE") || "4")}
                    onClose={() => wp.setShowPianoPicker(false)}
                    onPreview={(note: string, octave: number) => {
                        if ((audioEngine as any).instrumentPlayer) {
                            (audioEngine as any).instrumentPlayer.playNoteForDuration(note, octave, 0.3);
                        }
                    }}
                    onPick={(note: string, octave: number) => {
                        if (wp.activeBlock) {
                            wp.activeBlock.setFieldValue(note, "NOTE");
                            wp.activeBlock.setFieldValue(octave.toString(), "OCTAVE");
                        }
                    }}
                />
            )}

            <div style={{ flex: 1, display: "flex", overflow: 'visible' }}>
                <div id="wrapper" style={{ width: "60%", height: "100%", position: "relative", zIndex: 20, overflow: 'visible' }}>
                    {(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (activeSprite && activeSprite.currentCostume) {
                            let imgSrc = null;
                            let isEmoji = false;

                            if (activeSprite.type === 'robot' && activeSprite.costumes) {
                                imgSrc = activeSprite.costumes[activeSprite.currentCostume];
                            } else if (activeSprite.currentCostume && typeof activeSprite.currentCostume === 'object' && (activeSprite.currentCostume as any).image) {
                                imgSrc = (activeSprite.currentCostume as any).image.src;
                            } else if (activeSprite.costumes && activeSprite.costumes[activeSprite.currentCostume]) {
                                const val = activeSprite.costumes[activeSprite.currentCostume];
                                if (typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('/') || val.startsWith('http') || val.endsWith('.png') || val.endsWith('.jpg') || val.endsWith('.svg'))) {
                                    imgSrc = val;
                                } else if (typeof val === 'string') {
                                    imgSrc = val;
                                    isEmoji = true;
                                }
                            }

                            if (imgSrc || isEmoji) {
                                return (
                                    <div style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(255,255,255,0.85)',
                                        backdropFilter: 'blur(5px)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        border: '2px solid #855CD6',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: '6px',
                                    }}>
                                        {(!isEmoji && imgSrc) ? (
                                            <img
                                                src={imgSrc}
                                                alt={activeSprite.name}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '36px' }}>{imgSrc}</span>
                                        )}
                                    </div>
                                );
                            }
                        }
                        return null;
                    })()}
                    <div id="blocklyDiv" ref={blocklyDiv} className="workspace" style={{ width: "100%", height: "100%" }}></div>

                    <WorkspaceControls workspaceRef={workspaceRef} onAfterZoom={wp.resetFlyoutScale} style={{ bottom: '210px', right: '14px' }} />
                    <WorkspaceTrash workspaceRef={workspaceRef} />

                    <div style={{
                        position: "absolute",
                        left: "14px",
                        right: "14px",
                        bottom: "145px",
                        height: "56px",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        zIndex: 90,
                        background: "#f4f4f4",
                        border: "1px solid #e0e0e0",
                        padding: "0 0 0 8px",
                        borderRadius: "30px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        overflow: "hidden"
                    }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", height: "100%", overflowX: "auto", paddingRight: "10px" }} className="no-scrollbar">
                            {wp.categories.map((cat, i) => (
                                <CategoryButton key={cat.id || i} category={cat} isActive={wp.activeCategory === cat.id} onClick={() => wp.handleCategoryClick(cat.id)} />
                            ))}
                        </div>

                        <button
                            onClick={() => wp.setIsExtensionLibraryOpen(true)}
                            title="Add More Blocks"
                            style={{
                                width: "68px",
                                height: "58px",
                                background: "#762eadff",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                                position: "relative",
                                flexShrink: 0
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#793ba8"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#662d91"; }}
                        >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" stroke="none" style={{ transform: "rotate(15deg) scale(0.9) translate(1px, -2px)" }}>
                                <path d="M19 14.5a2.5 2.5 0 1 1-5 0V14h-3v4.5a2.5 2.5 0 1 1-5 0V14H4.5a2.5 2.5 0 1 1 0-5H4V6c0-1.1.9-2 2-2h3V2.5a2.5 2.5 0 1 1 5 0V4h3c1.1 0 2 .9 2 2v3h1.5a2.5 2.5 0 1 1 0 5H19v.5z" />
                            </svg>
                            <span style={{ position: "absolute", top: "8px", right: "12px", fontWeight: "900", fontSize: "16px", color: "white", lineHeight: 1 }}>+</span>
                        </button>
                    </div>
                </div>

                <RightPanel
                    sprites={sprites}
                    scenes={scenes}
                    currentSprite={activeSpriteId || ''}
                    currentScene={currentSceneId}
                    onSelectSprite={handleSpriteSelect}
                    onAddSprite={() => setIsSpriteModalOpen(true)}
                    onDeleteSprite={sprites.length > 1 ? handlers.deleteSprite : undefined}
                    onSelectScene={handleSceneSelect}
                    onAddScene={handlers.addScene}
                    onDeleteScene={scenes.length > 1 ? handlers.deleteScene : undefined}
                    onEditSprite={handlers.handleEditSprite}
                    onEditScene={handlers.handleEditScene}
                    onGreenFlag={exec.runBlocks}
                    onStop={exec.stopBlocks}
                    onReset={exec.handleReset}
                    onCamera={handlers.toggleCamera}
                    onToggleGrid={() => setShowGrid(!showGrid)}
                    onFullscreen={handlers.toggleFullscreen}
                    showGrid={showGrid}
                    isRunning={exec.isBlocksRunning}
                    isCameraOn={isCameraOn}
                    isFullscreen={isFullscreen}
                    isDraggingSprite={isDraggingSpriteOnStage}
                    isDraggingBlock={isDraggingBlock}
                    onBlocksDropped={handleBlocksDropped}
                    successSpriteId={successSpriteId}
                    spriteGridX={(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (!activeSprite || !stageContainerRef.current) return null;
                        const w = stageContainerRef.current.offsetWidth || 1;
                        const spriteCenter = activeSprite.x + 40;
                        return Math.max(-1, Math.min(22, (spriteCenter / w) * 20));
                    })()}
                    spriteGridY={(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (!activeSprite || !stageContainerRef.current) return null;
                        const h = stageContainerRef.current.offsetHeight || 1;
                        const spriteCenter = activeSprite.y + 40;
                        return Math.max(-1, Math.min(22, 23 - (spriteCenter / h) * 23));
                    })()}
                >
                    <div ref={stageContainerRef} className="stage" style={{
                        width: '100%', height: '100%', position: "relative", overflow: "visible",
                        background: currentScene.backgroundImage
                            ? `url(${currentScene.backgroundImage}) center/cover no-repeat`
                            : (currentScene.background || 'transparent'),
                    }}>
                        {isCameraOn && (
                            <video
                                ref={cameraVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    zIndex: 0,
                                    transform: "scaleX(-1)",
                                    borderRadius: "4px",
                                }}
                            />
                        )}
                        {sprites.map(sprite => (
                            <Teddy
                                key={sprite.id}
                                id={sprite.id}
                                type={sprite.type}
                                active={activeSpriteId === sprite.id}
                                x={sprite.x} y={sprite.y} angle={sprite.angle} size={sprite.size}
                                visible={sprite.visible} currentCostume={sprite.currentCostume}
                                costumes={sprite.costumes}
                                speech={sprite.speech}
                                mirrored={sprite.mirrored}
                                textColor={sprite.textColor}
                                onClick={() => exec.handleSpriteClick(sprite.id)}
                                onDragStateChange={(dragging: boolean) => setIsDraggingSpriteOnStage(dragging)}
                            />
                        ))}
                        <canvas
                            ref={canvasRef}
                            width={stageSize.width}
                            height={stageSize.height}
                            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 5, width: '100%', height: '100%' }}
                        />
                    </div>
                </RightPanel>
            </div>

            {isBackdropChooserOpen && (
                <BackdropChooser
                    onSelect={handlers.handleBackdropSelect}
                    onPaint={handlers.handleBackdropPaint}
                    onClose={() => { setIsBackdropChooserOpen(false); setBackdropEditSceneId(null); }}
                />
            )}

            {wp.showPicker && (
                <PositionPicker
                    onPick={(x, y) => {
                        if (wp.pickerCallback) wp.pickerCallback(x, y);
                    }}
                    onClose={() => {
                        wp.setShowPicker(false);
                        wp.setPickerCallback(null);
                    }}
                />
            )}

            {wp.showDirPicker && (
                <DirectionPicker
                    onPick={(dir: any) => {
                        if (wp.activeBlock) {
                            if (typeof (wp.activeBlock as any).setDirection === "function") {
                                (wp.activeBlock as any).setDirection(dir);
                            } else {
                                try { (wp.activeBlock as any).direction = dir; } catch (e) { /* ignore */ }
                            }
                            if ((window as any).moveRelative) (window as any).moveRelative(dir);
                        }
                        wp.setShowDirPicker(false);
                        wp.setActiveBlock(null);
                    }}
                />
            )}

            {winMessage && (
                <SuccessModal
                    message={winMessage}
                    onRestart={() => (window as any).resetBear()}
                    onNext={() => {
                        (window as any).resetBear();
                        alert("Next lesson coming soon!");
                    }}
                />
            )}

            {isSpriteModalOpen && (
                <SpriteLibrary
                    isOpen={isSpriteModalOpen}
                    onClose={() => setIsSpriteModalOpen(false)}
                    onSelectSprite={(entry: any) => {
                        handlers.addSprite(entry);
                    }}
                    onPaintSprite={() => {
                        setIsSpriteModalOpen(false);
                        alert('Paint editor - select a sprite first, then edit its costume');
                    }}
                />
            )}

            {paintEditor.isOpen && (
                <PaintEditor
                    onClose={() => setPaintEditor({ ...paintEditor, isOpen: false })}
                    onSave={handlers.handlePaintSave}
                    onDeleteSound={handlers.handleDeleteCostume}
                    onDuplicateSound={handlers.handleDuplicateCostume}
                    onSwitchCostume={handlers.handleSwitchCostume}
                    onRenameCostume={handlers.handleRenameCostume}
                    initialImage={paintEditor.initialImage}
                    costumes={paintEditor.costumes}
                    spriteName={paintEditor.spriteName}
                    mode={paintEditor.mode}
                />
            )}

            <UnsavedWarningModal
                isOpen={project.showUnsavedModal}
                onYes={() => project.confirmUnsavedAction(true)}
                onNo={() => project.confirmUnsavedAction(false)}
                onCancel={() => {
                    project.setShowUnsavedModal(false);
                    project.setPendingAction(null);
                }}
            />
        </div>
    );
}

interface CategoryButtonProps {
    category: any;
    isActive: boolean;
    onClick: () => void;
}

function CategoryButton({ category, isActive, onClick }: CategoryButtonProps) {
    if (!category) return null;
    return (
        <button
            onClick={onClick}
            title={category.name}
            style={{
                width: "54px",
                height: "54px",
                borderRadius: "50%",
                background: isActive ? category.color : "white",
                border: isActive ? "2px solid rgba(0,0,0,0.15)" : `2px solid ${category.color}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? "white" : category.color,
                transition: "all 0.15s ease",
                outline: "none",
                padding: 0,
                flexShrink: 0,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
        >
            <div style={{ transform: isActive ? "scale(1.2)" : "scale(1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {category.icon}
            </div>
        </button>
    );
}
