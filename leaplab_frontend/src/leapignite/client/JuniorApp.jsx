/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
import Blockly from "@blockly-runtime";
import { javascriptGenerator } from '@blockly-runtime';
import Teddy from "./sprites/Teddy";
import RightPanel from "./components/RightPanel";
import BackdropChooser from "./components/BackdropChooser";
import JuniorMenuBar from "./components/JuniorMenuBar";
import PositionPicker from "./components/PositionPicker";
import DirectionPicker from "./components/DirectionPicker";
import InstrumentPicker from "./components/InstrumentPicker";
import PianoPicker from "./components/PianoPicker";
import PaintEditor from "../../components/PaintEditor";
import { SpriteLibrary } from "../../components/SpriteLibrary";
import WorkspaceControls from "../../components/WorkspaceControls";
import WorkspaceTrash from "../../components/WorkspaceTrash";
import GoalPopup from "./components/GoalPopup";
import SuccessModal from "./components/SuccessModal";
import UnsavedWarningModal from "./components/UnsavedWarningModal";
import JuniorSoundRecorder from "./components/JuniorSoundRecorder";
import IgniteExtensionLibrary from "./components/IgniteExtensionLibrary";
import { getJuniorBlocks, getJuniorToolbox } from "../../blocks/junior-blocks";
import { useSpriteSystem } from "./hooks/useSpriteSystem";
import { useJuniorWorkspace } from "./hooks/useJuniorWorkspace";
import { useJuniorExecution } from "./hooks/useJuniorExecution";
import { useJuniorProject } from "./hooks/useJuniorProject";
import { useJuniorWindowActions } from "./hooks/useJuniorWindowActions";
import { useJuniorUIHandlers } from "./hooks/useJuniorUIHandlers";
import { getLessonConfig } from "../server/engine/LessonConfig";
import { GoalManager } from "../server/engine/GoalManager";

import { AudioEngine } from "../../Leap-audio/src/AudioEngine";
import { initRuntime } from "../../runtime/RuntimeBridge";
import { gettingStartedTutorial } from "./tutorials/gettingStarted";
import { moveRoboTutorial } from "./tutorials/moveRobo";
import { makeSoundsTutorial } from "./tutorials/makeSounds";
import JuniorTutorialOverlay from "./components/JuniorTutorialOverlay";
import { ToastProvider, useToast } from "./components/Toast";
import { useCloudProjectStore } from "../../store/cloudProjectStore";
import { useStageSize } from "./hooks/useStageSize";
import { useIdleHints } from "./hooks/useIdleHints";
import { useWindowFunctions } from "./hooks/useWindowFunctions";
import SpriteCostumePreview from "./components/SpriteCostumePreview";
import CategoryButton from "./components/CategoryButton";

const TUTORIALS = {
    'getting_started': gettingStartedTutorial,
    'move_robo': moveRoboTutorial,
    'make_sounds': makeSoundsTutorial
};

import "../../components/workspace/WorkspaceControls.css";

// Robot Assets
const robotIdle = "assets/sprites/robot/robot_idle.svg";
const robotWave1 = "assets/sprites/robot/image-Photoroom.png";
const robotWave2 = "assets/sprites/robot/image-removebg-preview (1).png";
const robotTalk1 = "assets/sprites/robot/image-removebg-preview.png";

// ─── Lazy initialization to avoid TDZ errors in production builds ─────────
let _audioEngine, _blocksRegistered;

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

const cloneWorkspaceData = (workspaceJson) => JSON.parse(JSON.stringify(workspaceJson || {}));

export default function JuniorApp({ onBack, projectUrl }) {
    return (
        <ToastProvider>
            <JuniorAppInner onBack={onBack} projectUrl={projectUrl} />
        </ToastProvider>
    );
}

function JuniorAppInner({ onBack, projectUrl }) {
    // Ensure blocks are registered on first render
    ensureBlocksRegistered();

    // Get lazily-initialized singletons
    const audioEngine = getAudioEngine();
    const toast = useToast();

    // Initialize modular runtime on mount
    useEffect(() => {
        initRuntime();
    }, []);

    // Refs
    const workspaceRef = useRef(null);
    const blocklyDiv = useRef(null);
    const canvasRef = useRef(null);
    const cameraVideoRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const activeSpriteIdRef = useRef(null);
    const scenesRef = useRef(null);
    const stageContainerRef = useRef(null);
    const timeoutRefs = useRef({});
    const isLoadingWorkspaceRef = useRef(false);
    const handleSpriteSelectRef = useRef(null);

    // UI state
    const [projectName, setProjectName] = useState("Untitled Project");
    const [isDraggingSpriteOnStage, setIsDraggingSpriteOnStage] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isSoundRecorderOpen, setIsSoundRecorderOpen] = useState(false);
    const [recordingCount, setRecordingCount] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const draggedBlockRef = useRef(null);
    const [isDraggingBlock, setIsDraggingBlock] = useState(false);
    const [successSpriteId, setSuccessSpriteId] = useState(null);
    const stageSize = useStageSize(stageContainerRef);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Modals state
    const [isSpriteModalOpen, setIsSpriteModalOpen] = useState(false);
    const [isBackdropChooserOpen, setIsBackdropChooserOpen] = useState(false);
    const [backdropEditSceneId, setBackdropEditSceneId] = useState(null);
    const [currentTutorialId, setCurrentTutorialId] = useState(null);
    const [isGoalOpen, setIsGoalOpen] = useState(false);
    const [goalDescription, setGoalDescription] = useState('');

    const handleTutorialStart = (tutorialId) => setCurrentTutorialId(tutorialId);
    const handleTutorialClose = () => setCurrentTutorialId(null);
    const currentTutorial = currentTutorialId ? TUTORIALS[currentTutorialId] : null;

    // Paint Editor
    const [paintEditor, setPaintEditor] = useState({
        isOpen: false,
        type: 'sprite',
        targetId: null,
        initialImage: null,
        costumes: [],
        spriteName: '',
        mode: 'junior'
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
                    currentCostume: "default",
                    blocks: {
                        blocks: {
                            languageVersion: 0,
                            blocks: []
                        }
                    }
                }
            ]
        }
    ]);

    const [activeSpriteId, setActiveSpriteId] = useState("robot_default");
    const [winMessage, setWinMessage] = useState(null);

    // Sync globals used by dropdowns and runtime helpers.
    useEffect(() => {
        const getJuniorSoundOptions = () => {
            const assets = audioEngine.soundBank?.assets || {};
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
        window.activeSpriteId = activeSpriteId;

        // Override any stale global from other editors before Blockly builds dropdowns.
        window.getActiveSpriteSounds = getJuniorSoundOptions;
        window.getActiveSpriteCostumes = getActiveSpriteCostumes;

        return () => {
            delete window.activeSpriteId;
            if (window.getActiveSpriteSounds === getJuniorSoundOptions) {
                delete window.getActiveSpriteSounds;
            }
            if (window.getActiveSpriteCostumes === getActiveSpriteCostumes) {
                delete window.getActiveSpriteCostumes;
            }
        };
    }, [scenes, activeSpriteId]);

    const currentScene = scenes?.find(s => s.id === currentSceneId) || scenes?.[0];
    const sprites = currentScene?.sprites || [];

    // Per-sprite workspace storage: maps spriteId -> Blockly serialized JSON (synchronous ref-based storage)
    const spriteWorkspacesRef = useRef(new Map());
    const currentToolboxContentsRef = useRef([]);

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
    }, [currentSceneId]);

    const handleBlocksDropped = useCallback((targetSpriteId, blockData) => {
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

        if (window.jiggle) window.jiggle(targetSpriteId);

        // Flash success
        setSuccessSpriteId(targetSpriteId);
        setTimeout(() => setSuccessSpriteId(null), 1000);

        // Auto-switch to the target sprite so the user can see the blocks immediately
        setTimeout(() => {
            handleSpriteSelectRef.current?.(targetSpriteId);
        }, 300);
    }, []);

    // Load workspace blocks from the per-sprite map
    const loadSpriteWorkspace = useCallback((spriteId) => {
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
                } else {
                    // Safety fallback: use events blocks so flyout is never empty on first load
                    console.log('[JuniorApp] Using fallback events blocks for flyout');
                    const fallbackBlocks = [
                        { kind: "block", type: "event_flag" },
                        { kind: "block", type: "event_up" },
                        { kind: "block", type: "event_down" },
                        { kind: "block", type: "event_press" },
                        { kind: "block", type: "broadcast_message" },
                        { kind: "block", type: "when_receive_message" }
                    ];
                    flyout.show(fallbackBlocks);
                    if (flyout.reflowInternal_) flyout.reflowInternal_();
                    currentToolboxContentsRef.current = fallbackBlocks;
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
        onBlocksDropped: handleBlocksDropped
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
        isLoadingWorkspaceRef,
        audioEngine,
        installedExtensionsRef: wp.installedExtensionsRef,
        restoreExtensions: wp.restoreExtensions
    });

    // Auto-load project from URL parameter (?project=<url>)
    useEffect(() => {
        if (!projectUrl) return;

        let cancelled = false;

        (async () => {
            try {
                console.log('[JuniorApp] Loading project from URL...');
                const resp = await fetch(projectUrl);
                if (!resp.ok) throw new Error(`Failed to fetch project: ${resp.status}`);
                const data = await resp.json();

                if (cancelled) return;

                await project.loadProjectData(data);
            } catch (err) {
                console.error('Failed to load project from URL:', err);
            }
        })();

        return () => { cancelled = true; };
    }, [projectUrl]);

    // Auto-load project from cloud storage (My Projects)
    useEffect(() => {
        const { pendingProject, clearPendingProject } = useCloudProjectStore.getState();
        if (!pendingProject || pendingProject.mode !== 'junior') return;

        let cancelled = false;
        (async () => {
            try {
                if (cancelled) return;
                console.log('[JuniorApp] Loading project from cloud...');
                await project.loadProjectData(pendingProject.data);
                clearPendingProject();
            } catch (err) {
                console.error('Failed to load project from cloud:', err);
            }
        })();

        return () => { cancelled = true; };
    }, [project]);

    // Wrapper for backward compatibility - delegates to loadSpriteWorkspace
    const loadWorkspace = (sprite) => {
        loadSpriteWorkspace(sprite.id);
    };

    // Handle scene selection: save old, load new
    const handleSceneSelect = useCallback((newSceneId) => {
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
    }, [currentSceneId, scenes, saveCurrentWorkspace, loadSpriteWorkspace]);

    // Handle sprite selection: save old, load new
    const handleSpriteSelect = useCallback((newId) => {
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
        const config = getLessonConfig();
        if (config.goal && !winMessage) {
            const result = GoalManager.checkGoal(config.goal, sprites, activeSpriteId);
            if (result.complete) {
                setWinMessage(result.message);
            }
        }
    }, [sprites, activeSpriteId, winMessage]);

    // Show goal popup when lesson starts (if goal has description)
    useEffect(() => {
        const config = getLessonConfig();
        if (config.goal && config.goal.description) {
            setGoalDescription(config.goal.description);
            setIsGoalOpen(true);
        }
    }, []);

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
    }, []); // Empty deps - only run on mount

    useIdleHints(workspaceRef);
    useWindowFunctions(canvasRef);

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);



    return (
        <div className="junior-mode" style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f8f9fc" }}>
            <style>{`
                @keyframes pulse { from { opacity:0.5; transform:scale(1); } to { opacity:0.8; transform:scale(1.05); } }

                .junior-mode .blocklySvg .blocklyBlockBackground { rx:12px !important; ry:12px !important; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
                .junior-mode .blocklyText:not(.blocklyEditableText .blocklyText):not(.blocklyFieldRect + .blocklyText):not(.blocklyDropdownText):not(.junior-block-icon):not(.junior-icon):not(.junior-icon-large) { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; font-size:13px; font-weight:700; fill:#fff !important; overflow-wrap:break-word !important; word-break:break-word !important; }
                .junior-mode .blocklyDropdownText { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif !important; font-size:13px !important; font-weight:700 !important; }
                .junior-mode .blocklyBlock { min-width:100px; margin-bottom:8px; }
                .junior-mode .blocklySvg text.blocklyText { pointer-events:none; }
                .junior-mode .blocklyFlyout .blocklyBlock { min-width:100px; }
                .junior-mode .blocklyFlyout text.blocklyText { pointer-events:none; }
                .junior-mode .blocklySvg image, .junior-mode .blocklySvg .junior-icon, .junior-mode .blocklySvg .junior-icon-large, .junior-mode .blocklySvg .junior-block-icon { margin-right:6px; }
                .junior-mode .blocklyEditableText>rect { fill:#fff !important; stroke:none !important; rx:14px !important; ry:14px !important; fill-opacity:1 !important; stroke-width:0 !important; }
                .junior-mode .blocklyEditableText:hover>rect { stroke:#ddd !important; stroke-width:2px !important; }
                .junior-mode .blocklyEditableText>text, .junior-mode .blocklyEditableText>text.blocklyText, .junior-mode .blocklyNonEditableText>text, .junior-mode .blocklyNonEditableText>text.blocklyText, .junior-mode g[class*="blocklyEditableText"]>text, .junior-mode g[class*="blocklyNonEditableText"]>text { fill:#000 !important; font-size:13px !important; font-weight:700 !important; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif !important; transform:translateY(2px); }
                .junior-mode .blocklyEditableText>rect, .junior-mode .blocklyNonEditableText>rect { fill:#fff !important; stroke:none !important; rx:14px !important; ry:14px !important; fill-opacity:1 !important; stroke-width:0 !important; }
                .junior-mode .blocklyPath { stroke-width:0 !important; }
                .junior-mode .blocklyBlockCanvas .blocklyBlock { margin-top:2px; }
                .junior-mode .blocklyToolboxDiv { transform:scale(1) !important; background:#f5f5f5 !important; border-top:1px solid #e0e0e0 !important; padding:0 !important; }
                .junior-mode .blocklyFlyout { transform-origin:left top !important; z-index:50 !important; }
                .junior-mode .blocklyFlyout .blocklyFlyoutBlock { transform:scale(1) !important; }
                .junior-mode .blocklySvg .junior-icon, .junior-mode .blocklySvg .junior-block-icon { font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji','Segoe UI',sans-serif !important; font-size:16px !important; font-weight:700 !important; fill:white !important; }
                .junior-mode .blocklySvg .junior-icon-large { font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji','Segoe UI',sans-serif !important; font-size:18px !important; font-weight:700 !important; fill:white !important; }
                .junior-mode .blocklyFlyoutBackground { fill:#f0f0f0 !important; fill-opacity:0.97 !important; stroke:#e0e0e0 !important; stroke-width:1 !important; }
                .junior-mode .blocklyFlyout .blocklyScrollbarHandle { fill:#c0c0c0 !important; rx:4px !important; ry:4px !important; }
                .junior-mode .blocklyFlyout .blocklyScrollbarBackground { fill:transparent !important; }
                .junior-mode .blocklySvg { width:100% !important; height:100% !important; }
                .junior-mode .blocklyMainWorkspaceScrollbar .blocklyScrollbarHorizontal { height:8px !important; }
                .junior-mode .blocklyFlyout .blocklyDraggable { cursor:grab !important; }
                .junior-mode .blocklyFlyout .blocklyDraggable:active { cursor:grabbing !important; }

                .junior-mode .no-scrollbar::-webkit-scrollbar { display:none; }
                .junior-mode .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
                .junior-mode .slim-scrollbar::-webkit-scrollbar { height:4px; }
                .junior-mode .slim-scrollbar::-webkit-scrollbar-track { background:transparent; }
                .junior-mode .slim-scrollbar::-webkit-scrollbar-thumb { background:#c4c4c4; border-radius:4px; }
                .junior-mode .slim-scrollbar::-webkit-scrollbar-thumb:hover { background:#a0a0a0; }
                .junior-mode .slim-scrollbar { scrollbar-width:thin; scrollbar-color:#c4c4c4 transparent; }

                .junior-mode g[data-category="looks"] .blocklyBlockBackground { fill:#9B5DE5 !important; }
                .junior-mode g[data-category="looks"] .blocklyPath { stroke:#7B44C7; stroke-width:1px; }
                .junior-mode g[data-category="looks"] text.blocklyText { fill:#fff !important; font-weight:700; }
                .junior-mode g[data-category="looks"] .blocklyEditableText > rect { fill:white !important; rx:14; ry:14; stroke:none; }
                .junior-mode g[data-category="looks"] .blocklyEditableText > text.blocklyText { fill:#5A2D82 !important; font-weight:700; }
                .junior-mode g[data-category="looks"] .blocklyDropdownText { fill:#5A2D82 !important; }

                .junior-mode g[data-category="sound"] .blocklyBlockBackground { fill:#CF63CF !important; }
                .junior-mode g[data-category="sound"] .blocklyPath { stroke:#A84DA0; stroke-width:1px; }
                .junior-mode g[data-category="sound"] text.blocklyText { fill:#fff !important; font-weight:700; }

                .junior-mode g[data-category="control"] .blocklyBlockBackground { fill:#FFAB19 !important; }
                .junior-mode g[data-category="control"] .blocklyPath { stroke:#CF8B00; stroke-width:1px; }
                .junior-mode g[data-category="control"] text.blocklyText { fill:#fff !important; font-weight:700; }

                .junior-mode g[data-category="events"] .blocklyBlockBackground { fill:#FFBF00 !important; }
                .junior-mode g[data-category="events"] .blocklyPath { stroke:#CC9900; stroke-width:1px; }
                .junior-mode g[data-category="events"] text.blocklyText { fill:#fff !important; font-weight:700; }

                .junior-mode g[data-category="pen"] .blocklyBlockBackground { fill:#0FBD8C !important; }
                .junior-mode g[data-category="pen"] .blocklyPath { stroke:#0A8C6A; stroke-width:1px; }
                .junior-mode g[data-category="pen"] text.blocklyText { fill:#fff !important; font-weight:700; }

                .junior-mode g[data-category="motion"] .blocklyBlockBackground { fill:#4C97FF !important; }
                .junior-mode g[data-category="motion"] .blocklyPath { stroke:#3A7BD5; stroke-width:1px; }
                .junior-mode g[data-category="motion"] text.blocklyText { fill:#fff !important; font-weight:700; }
            `}</style>
            <input type="file" ref={project.fileInputRef} style={{ display: "none" }} accept=".json" onChange={project.handleFileLoad} />

            <JuniorMenuBar
                projectName={projectName}
                onProjectNameChange={setProjectName}
                onFileAction={handlers.handleFileMenu}
                onEditAction={handlers.handleEditMenu}
                onTutorialStart={handleTutorialStart}
                onBack={onBack}
                onDownload={project.handleDownloadProject}
                onSave={project.handleSaveProject}
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
                <IgniteExtensionLibrary
                    onClose={() => wp.setIsExtensionLibraryOpen(false)}
                    onSelectExtension={wp.handleAddExtension}
                />
            )}

            {wp.showInstPicker && (
                <InstrumentPicker
                    position={wp.pickerPos}
                    onClose={() => wp.setShowInstPicker(false)}
                    onPick={(inst) => {
                        if (wp.activeBlock) {
                            wp.activeBlock.setFieldValue(inst, "INSTRUMENT");
                            if (audioEngine.instrumentPlayer) {
                                audioEngine.instrumentPlayer.setInstrument(inst);
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
                    onPreview={(note, octave) => {
                        if (audioEngine.instrumentPlayer) {
                            audioEngine.instrumentPlayer.playNoteForDuration(note, octave, 0.3);
                        }
                    }}
                    onPick={(note, octave) => {
                        if (wp.activeBlock) {
                            wp.activeBlock.setFieldValue(note, "NOTE");
                            wp.activeBlock.setFieldValue(octave.toString(), "OCTAVE");
                        }
                    }}
                />
            )}

            <div style={{ flex: 1, display: "flex", overflow: 'hidden', gap: 0 }}>
                <div id="wrapper" style={{ width: "60%", height: "100%", position: "relative", zIndex: 20, overflow: 'hidden', background: '#f0f2f8' }}>
                    <SpriteCostumePreview sprites={sprites} activeSpriteId={activeSpriteId} />
                    <div id="blocklyDiv" ref={blocklyDiv} className="workspace" style={{ width: "100%", height: "100%" }}></div>

                    <WorkspaceControls workspaceRef={workspaceRef} onAfterZoom={wp.resetFlyoutScale} style={{ bottom: `${wp.flyoutHeight + 110}px`, right: '16px' }} />
                    <WorkspaceTrash workspaceRef={workspaceRef} />

                    <div className="junior-toolbar" style={{
                        position: "absolute",
                        left: "16px",
                        right: "16px",
                        bottom: `${wp.flyoutHeight}px`,
                        height: "58px",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        zIndex: 90,
                        background: "#ffffff",
                        border: "1px solid #e8ecf2",
                        padding: "0 0 0 6px",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                        overflow: "hidden"
                    }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", height: "100%", overflowX: "auto", paddingRight: "8px", paddingLeft: "4px" }} className="no-scrollbar">
                            {wp.categories.map((cat, i) => (
                                <CategoryButton key={cat.id || i} category={cat} isActive={wp.activeCategory === cat.id} onClick={() => wp.handleCategoryClick(cat.id)} />
                            ))}
                        </div>

                        <button
                            className="junior-extensions-btn"
                            onClick={() => wp.setIsExtensionLibraryOpen(true)}
                            title="Add More Blocks"
                            style={{
                                width: "56px",
                                height: "46px",
                                background: "linear-gradient(135deg, #0a015a, #1a0a7a)",
                                border: "none",
                                borderRadius: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                                position: "relative",
                                flexShrink: 0,
                                marginLeft: "auto",
                                marginRight: "6px",
                                boxShadow: "0 2px 8px rgba(10,1,90,0.2)"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #12017a, #2a0a9a)"; e.currentTarget.style.transform = "scale(1.04)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #0a015a, #1a0a7a)"; e.currentTarget.style.transform = "scale(1)"; }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none" style={{ transform: "rotate(15deg) scale(0.9) translate(1px, -2px)" }}>
                                <path d="M19 14.5a2.5 2.5 0 1 1-5 0V14h-3v4.5a2.5 2.5 0 1 1-5 0V14H4.5a2.5 2.5 0 1 1 0-5H4V6c0-1.1.9-2 2-2h3V2.5a2.5 2.5 0 1 1 5 0V4h3c1.1 0 2 .9 2 2v3h1.5a2.5 2.5 0 1 1 0 5H19v.5z" />
                            </svg>
                            <span style={{ position: "absolute", top: "6px", right: "10px", fontWeight: "900", fontSize: "14px", color: "white", lineHeight: 1 }}>+</span>
                        </button>
                    </div>
                </div>

                <RightPanel
                    sprites={sprites}
                    scenes={scenes}
                    currentSprite={activeSpriteId}
                    currentScene={currentSceneId}
                    onSelectSprite={handleSpriteSelect}
                    onAddSprite={() => setIsSpriteModalOpen(true)}
                    onDeleteSprite={sprites.length > 1 ? handlers.deleteSprite : null}
                    onSelectScene={handleSceneSelect}
                    onAddScene={handlers.addScene}
                    onDeleteScene={scenes.length > 1 ? handlers.deleteScene : null}
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
                                onDragStateChange={(dragging) => setIsDraggingSpriteOnStage(dragging)}
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
                    onPick={(dir) => {
                        if (wp.activeBlock) {
                            if (typeof wp.activeBlock.setDirection === "function") {
                                wp.activeBlock.setDirection(dir);
                            } else {
                                try { wp.activeBlock.direction = dir; } catch (e) { /* ignore */ }
                            }
                            if (window.moveRelative) window.moveRelative(dir);
                        }
                        wp.setShowDirPicker(false);
                        wp.setActiveBlock(null);
                    }}
                />
            )}

            {winMessage && (
                <SuccessModal
                    message={winMessage}
                    onRestart={() => window.resetBear()}
                    onNext={() => {
                        window.resetBear();
                        toast("Next lesson coming soon!");
                    }}
                />
            )}

            {isSpriteModalOpen && (
                <SpriteLibrary
                    isOpen={isSpriteModalOpen}
                    onClose={() => setIsSpriteModalOpen(false)}
                    onSelectSprite={(entry) => {
                        handlers.addSprite(entry);
                    }}
                    onPaintSprite={() => {
                        setIsSpriteModalOpen(false);
                        toast('Paint editor - select a sprite first, then edit its costume');
                    }}
                />
            )}

            {paintEditor.isOpen && (
                <PaintEditor
                    isOpen={paintEditor.isOpen}
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

            <GoalPopup
                isOpen={isGoalOpen}
                goalText={goalDescription}
                onClose={() => setIsGoalOpen(false)}
            />
        </div>
    );
}



