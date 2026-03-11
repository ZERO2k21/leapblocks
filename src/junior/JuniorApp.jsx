import { useRef, useState, useEffect } from "react";
import * as Blockly from "blockly";
import Teddy from "./sprites/Teddy";
import RightPanel from "./components/RightPanel";
import BackdropChooser from "./components/BackdropChooser";
import JuniorMenuBar from "./components/JuniorMenuBar";
import PositionPicker from "./components/PositionPicker";
import DirectionPicker from "./components/DirectionPicker";
import InstrumentPicker from "./components/InstrumentPicker";
import PianoPicker from "./components/PianoPicker";
import PaintEditor from "../components/PaintEditor";
import { SpriteLibrary } from "../components/SpriteLibrary";
import WorkspaceControls from "../components/WorkspaceControls";
import WorkspaceTrash from "../components/WorkspaceTrash";
import SuccessModal from "./components/SuccessModal";
import UnsavedWarningModal from "./components/UnsavedWarningModal";
import JuniorSoundRecorder from "./components/JuniorSoundRecorder";
import JuniorExtensionLibrary from "./components/JuniorExtensionLibrary";

import { useSpriteSystem } from "./hooks/useSpriteSystem";
import { useJuniorWorkspace } from "./hooks/useJuniorWorkspace";
import { useJuniorExecution } from "./hooks/useJuniorExecution";
import { useJuniorProject } from "./hooks/useJuniorProject";
import { useJuniorWindowActions } from "./hooks/useJuniorWindowActions";
import { useJuniorUIHandlers } from "./hooks/useJuniorUIHandlers";

import { getLessonConfig } from "./engine/LessonConfig";
import { GoalManager } from "./engine/GoalManager";
import { HintManager } from "./engine/HintManager";

import { AudioEngine } from "../scratch-audio/src/AudioEngine";
import { Scratch3SoundBlocks } from "../scratch-vm/src/extensions/scratch3_sound/index.js";
import { Scratch3MusicBlocks } from "../scratch-vm/src/extensions/scratch3_music/index.js";

// Import styles
import "./styles/juniorBlocks.css";
import "./styles/positionPicker.css";
import "./styles/directionPicker.css";
import "./styles/juniorLooksBlocks.css";

// Robot Assets
const robotIdle = "/assets/sprites/robot/robot_idle.svg";
const robotWave1 = "/assets/sprites/robot/robot_wave1.svg";
const robotWave2 = "/assets/sprites/robot/robot_wave2.svg";
const robotTalk1 = "/assets/sprites/robot/robot_talk1.svg";

const audioEngine = new AudioEngine();
const runtimeShim = { audioEngine };
export const soundBlocksExt = new Scratch3SoundBlocks(runtimeShim);
export const musicBlocksExt = new Scratch3MusicBlocks(runtimeShim);

export default function JuniorApp({ onBack }) {
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

    // UI state
    const [projectName, setProjectName] = useState("Untitled Project");
    const [isDraggingSpriteOnStage, setIsDraggingSpriteOnStage] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isSoundRecorderOpen, setIsSoundRecorderOpen] = useState(false);
    const [recordingCount, setRecordingCount] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Modals state
    const [isSpriteModalOpen, setIsSpriteModalOpen] = useState(false);
    const [isBackdropChooserOpen, setIsBackdropChooserOpen] = useState(false);
    const [backdropEditSceneId, setBackdropEditSceneId] = useState(null);
    
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

    const [activeSpriteId, setActiveSpriteId] = useState("robot_default");
    const [winMessage, setWinMessage] = useState(null);

    // Sync refs
    useEffect(() => {
        scenesRef.current = scenes;
        activeSpriteIdRef.current = activeSpriteId;
        window.activeSpriteId = activeSpriteId;
    }, [scenes, activeSpriteId]);

    const currentScene = scenes?.find(s => s.id === currentSceneId) || scenes?.[0];
    const sprites = currentScene?.sprites || [];

    // --- HOOKS SETUP ---
    const saveCurrentWorkspace = () => {
        if (!workspaceRef.current || !activeSpriteIdRef.current || isLoadingWorkspaceRef.current) return;
        const json = Blockly.serialization.workspaces.save(workspaceRef.current);

        const scenesCopy = [...(scenesRef.current || scenes)];
        const curScene = scenesCopy.find(s => s.id === currentSceneId);
        if (curScene) {
            const sprite = curScene.sprites.find(s => s.id === activeSpriteIdRef.current);
            if (sprite) {
                if (JSON.stringify(sprite.blocks) !== JSON.stringify(json)) {
                    sprite.blocks = json;
                    setScenes(scenesCopy);
                    console.log(`[JuniorApp] Saved workspace blocks to sprite: ${sprite.name}`);
                }
            }
        }
    };

    const wp = useJuniorWorkspace({
        workspaceRef,
        blocklyDiv,
        activeSpriteIdRef,
        scenesRef,
        setIsSoundRecorderOpen,
        saveCurrentWorkspace,
        spriteActions
    });

    const exec = useJuniorExecution({
        workspaceRef,
        scenes,
        currentSceneId,
        activeSpriteIdRef,
        activeSpriteId,
        spriteActions
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
        saveCurrentWorkspace
    });

    const loadWorkspace = (sprite) => {
        if (!workspaceRef.current) return;
        const json = sprite?.blocks || {};
        Blockly.serialization.workspaces.load(json, workspaceRef.current);
    };

    const handleSceneSelect = (newSceneId) => {
        if (newSceneId === currentSceneId) return;
        saveCurrentWorkspace(); 
        setCurrentSceneId(newSceneId);

        const newScene = scenes.find(s => s.id === newSceneId);
        if (newScene && newScene.sprites.length > 0) {
            setActiveSpriteId(newScene.sprites[0].id);
        } else {
            setActiveSpriteId(null);
            if (workspaceRef.current) workspaceRef.current.clear();
        }
    };

    const handleSpriteSelect = (newId) => {
        if (newId === activeSpriteId) return;
        saveCurrentWorkspace();
        setActiveSpriteId(newId);
    };

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
        soundBlocksExt,
        musicBlocksExt,
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
        project
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

    useEffect(() => {
        if (!workspaceRef.current || !activeSpriteId) return;
        if (activeSpriteIdRef.current === activeSpriteId && !isLoadingWorkspaceRef.current) {
            const topBlocks = workspaceRef.current.getTopBlocks(false);
            const activeSprite = sprites.find(s => s.id === activeSpriteId);
            if (topBlocks.length > 0 || !activeSprite?.blocks || Object.keys(activeSprite?.blocks || {}).length === 0) {
                return;
            }
        }

        const activeSprite = sprites.find(s => s.id === activeSpriteId);
        if (activeSprite) {
            console.log(`[JuniorApp] Switching workspace to sprite: ${activeSprite.name}`);
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            try {
                loadWorkspace(activeSprite);
            } finally {
                Blockly.Events.enable();
                activeSpriteIdRef.current = activeSpriteId;
                window.activeSpriteId = activeSpriteId;
                setTimeout(() => {
                    isLoadingWorkspaceRef.current = false;
                }, 50);
            }
        }
    }, [activeSpriteId, sprites, currentSceneId]);

    const [, setHint] = useState(null);
    const lastInteraction = useRef(null);

    useEffect(() => {
        if (!lastInteraction.current) lastInteraction.current = Date.now();
        const interval = setInterval(() => {
            const idle = Date.now() - lastInteraction.current;
            const config = getLessonConfig();
            const count = workspaceRef.current?.getAllBlocks(false).length || 0;
            const msg = HintManager.getHint(idle, config.goal, count);
            setHint(msg);
        }, 1000);

        const resetIdle = () => lastInteraction.current = Date.now();
        window.addEventListener("pointerdown", resetIdle);
        window.addEventListener("keydown", resetIdle);
        return () => {
            clearInterval(interval);
            window.removeEventListener("pointerdown", resetIdle);
            window.removeEventListener("keydown", resetIdle);
        };
    }, []);

    useEffect(() => {
        window.drawSegment = (x1, y1, x2, y2, color, width) => {
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

        window.clearPen = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
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
            <input type="file" ref={project.fileInputRef} style={{ display: "none" }} accept=".json" onChange={project.handleFileLoad} />

            <JuniorMenuBar
                projectName={projectName}
                onProjectNameChange={setProjectName}
                onFileAction={handlers.handleFileMenu}
                onEditAction={handlers.handleEditMenu}
                onBack={onBack}
            />

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
                    onPick={(inst) => {
                        if (wp.activeBlock) {
                            wp.activeBlock.setFieldValue(inst, "INSTRUMENT");
                            musicBlocksExt.setInstrument({ INSTRUMENT: inst });
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
                        musicBlocksExt.playNoteForDuration({ NOTE: note, OCTAVE: octave, DURATION: 0.3 });
                    }}
                    onPick={(note, octave) => {
                        if (wp.activeBlock) {
                            wp.activeBlock.setFieldValue(note, "NOTE");
                            wp.activeBlock.setFieldValue(octave.toString(), "OCTAVE");
                        }
                    }}
                />
            )}

            <div style={{ flex: 1, display: "flex", overflow: 'hidden' }}>
                <div id="wrapper" style={{ width: "60%", height: "100%", position: "relative" }}>
                    {(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (activeSprite && activeSprite.currentCostume) {
                            let imgSrc = null;
                            let isEmoji = false;

                            if (activeSprite.type === 'robot' && activeSprite.costumes) {
                                imgSrc = activeSprite.costumes[activeSprite.currentCostume];
                            } else if (activeSprite.currentCostume && typeof activeSprite.currentCostume === 'object' && activeSprite.currentCostume.image) {
                                imgSrc = activeSprite.currentCostume.image.src;
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
                    spriteGridX={(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (!activeSprite || !stageContainerRef.current) return null;
                        const w = stageContainerRef.current.offsetWidth || 1;
                        const spriteCenter = activeSprite.x + 40;
                        return Math.max(0, Math.min(20, (spriteCenter / w) * 20));
                    })()}
                    spriteGridY={(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (!activeSprite || !stageContainerRef.current) return null;
                        const h = stageContainerRef.current.offsetHeight || 1;
                        const spriteCenter = activeSprite.y + 40;
                        return Math.max(1, Math.min(15, 15 - (spriteCenter / h) * 15));
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
                                onClick={() => exec.handleSpriteClick(sprite.id, saveCurrentWorkspace)}
                                onDragStateChange={(dragging) => setIsDraggingSpriteOnStage(dragging)}
                            />
                        ))}
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={600}
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
                            if (wp.activeBlock.setFieldValue) {
                                wp.activeBlock.setFieldValue(dir, 'DIR');
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
                        alert("Next lesson coming soon!");
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
                        alert('Paint editor - select a sprite first, then edit its costume');
                    }}
                />
            )}

            {paintEditor.isOpen && (
                <PaintEditor
                    isOpen={paintEditor.isOpen}
                    onClose={() => setPaintEditor({ ...paintEditor, isOpen: false })}
                    onSave={handlers.handlePaintSave}
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
function CategoryButton({ category, isActive, onClick }) {
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


