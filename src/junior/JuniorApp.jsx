import { useRef, useState, useEffect } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import defineLeapBlocks from "./blocks/blocks";
import Teddy from "./sprites/Teddy";
import RightPanel from "./components/RightPanel";
import BackdropChooser from "./components/BackdropChooser";
import JuniorMenuBar from "./components/JuniorMenuBar";
import {
    Footprints, Eye, Flag, Hand, Volume2, PenTool,
    Settings, MessageCircle, Trophy, Play, Square,
    RotateCcw, ZoomIn, ZoomOut, Maximize, Zap,
    Radar, Calculator, Database, Mic
} from "lucide-react";

// Import Custom Renderer
import { registerLeapRenderer } from "./blocks/LeapRenderer";
import "./styles/juniorBlocks.css"; // Import styles
import "./styles/positionPicker.css"; // Import Picker styles
import "./styles/directionPicker.css"; // Import Direction Picker styles
import "./styles/juniorLooksBlocks.css"; // Import Looks styles
import { previewActions } from "./engine/previewActions"; // Import Preview Actions
import { looksPreview } from "./engine/looksPreview"; // Import Looks Preview
import PositionPicker from "./components/PositionPicker"; // Import Picker Component
import DirectionPicker from "./components/DirectionPicker"; // Import Direction Picker
import InstrumentPicker from "./components/InstrumentPicker"; // Import Instrument Picker
import PianoPicker from "./components/PianoPicker"; // Import Piano Picker
import PaintEditor from "../components/PaintEditor";
import { SpriteLibrary } from "../components/SpriteLibrary";
import WorkspaceControls from "../components/WorkspaceControls";
import WorkspaceTrash from "../components/WorkspaceTrash";
import { executionEngine } from "../engine/ExecutionEngine";
import { projectManager } from "../engine/ProjectManager";
import { spriteManager } from "../engine/SpriteManager";
import { stageManager } from "../engine/StageManager";

// Block Definitions
// Block Definitions
import defineLooksBlocks from "./blocks/looksBlocks";
import defineSoundBlocks from "./blocks/soundBlocks";

// Robot Assets (Static paths from public/)
const robotIdle = "/assets/sprites/robot/robot_idle.svg";
const robotWave1 = "/assets/sprites/robot/robot_wave1.svg";
const robotWave2 = "/assets/sprites/robot/robot_wave2.svg";
const robotTalk1 = "/assets/sprites/robot/robot_talk1.svg";

// Categories
const CATEGORIES = [
    { id: "motion", name: "Motion", color: "#4C97FF", icon: <Footprints fill="currentColor" stroke="none" /> },
    { id: "looks", name: "Looks", color: "#9966FF", icon: <Eye fill="currentColor" stroke="none" /> },
    { id: "sound", name: "Sound", color: "#CF63CF", icon: <Volume2 fill="currentColor" stroke="none" /> },
    { id: "events", name: "Events", color: "#FFBF00", icon: <Flag fill="currentColor" stroke="none" /> },
    { id: "control", name: "Control", color: "#FFAB19", icon: <Hand fill="currentColor" stroke="none" /> },
    { id: "pen", name: "Pen", color: "#0FBD8C", icon: <PenTool fill="currentColor" stroke="none" /> },
];

// JSON Definition of Blocks for each category
const categoryContents = {
    motion: [
        { kind: "block", type: "move_right" },
        { kind: "block", type: "move_left" },
        { kind: "block", type: "move_up" },
        { kind: "block", type: "move_down" },
        { kind: "block", type: "turn_right" },
        { kind: "block", type: "turn_left" },
        { kind: "block", type: "jump" },
        { kind: "block", type: "go_to_location" },
        { kind: "block", type: "go_random" },
        { kind: "block", type: "change_speed" }
    ],
    looks: [
        { kind: "block", type: "say_text" },
        { kind: "block", type: "show_sprite" },
        { kind: "block", type: "hide_sprite" },
        { kind: "block", type: "change_size" },
        { kind: "block", type: "looks_reset_size" },
        { kind: "block", type: "looks_next_costume" },
        { kind: "block", type: "looks_change_costume" },
        { kind: "block", type: "looks_mirror" },
        { kind: "block", type: "select_sprite" },
        { kind: "block", type: "switch_scene" }
    ],
    control: [
        { kind: "block", type: "control_forever" },
        { kind: "block", type: "control_repeat" },
        { kind: "block", type: "control_wait" },
        { kind: "block", type: "control_stop" },
        { kind: "block", type: "control_scene" }
    ],
    events: [
        { kind: "block", type: "event_flag" },
        { kind: "block", type: "event_up" },
        { kind: "block", type: "event_down" },
        { kind: "block", type: "event_press" },
        { kind: "block", type: "broadcast_message" },
        { kind: "block", type: "when_receive_message" }
    ],
    sound: [
        { kind: "block", type: "sound_play" },
        { kind: "button", text: "🎤", callbackKey: "RECORD_SOUND" },
        { kind: "block", type: "sound_play_music" },
        { kind: "block", type: "sound_instrument" },
        { kind: "block", type: "sound_note" },
        { kind: "block", type: "sound_stop" }
    ],
    pen: [
        { kind: "block", type: "pen_down" },
        { kind: "block", type: "pen_up" },
        { kind: "block", type: "pen_set_color" },
        { kind: "block", type: "pen_set_size" },
        { kind: "block", type: "pen_stamp" },
        { kind: "block", type: "pen_eraser" }
    ],
    sensing: [
        // Sensing blocks will be implemented
        // { kind: "block", type: "sensing_touching" },
        // { kind: "block", type: "sensing_mouse_x" },
        // { kind: "block", type: "sensing_mouse_y" },
    ],
    operators: [
        // Operator blocks will be implemented
        // { kind: "block", type: "operator_add" },
        // { kind: "block", type: "operator_subtract" },
        // { kind: "block", type: "operator_random" },
    ],
    variables: [
        // Variable blocks will be implemented
        // { kind: "block", type: "variable_set" },
        // { kind: "block", type: "variable_change" },
    ]
};

// --- JUNIOR BACKEND INTEGRATION ---
import { Interpreter as LeapInterpreter, ExecutionStop } from "./engine/Interpreter";
import { useSpriteSystem } from "./hooks/useSpriteSystem";
import { getLessonConfig } from "./engine/LessonConfig";
import { GoalManager } from "./engine/GoalManager";
import { HintManager } from "./engine/HintManager";
import { AudioEngine } from "../scratch-audio/src/AudioEngine";
import { Scratch3SoundBlocks } from "../scratch-vm/src/extensions/scratch3_sound/index.js";
import { Scratch3MusicBlocks } from "../scratch-vm/src/extensions/scratch3_music/index.js";
import { WorkspaceValidator } from "./engine/WorkspaceValidator";
import { fileService } from "../services/FileService";
import defineExtensionBlocks from "./blocks/extensionBlocks";
import JuniorExtensionLibrary from "./components/JuniorExtensionLibrary";

// Initialize the Audio Environment natively
const audioEngine = new AudioEngine();
const runtimeShim = { audioEngine };
const soundBlocksExt = new Scratch3SoundBlocks(runtimeShim);
const musicBlocksExt = new Scratch3MusicBlocks(runtimeShim);


import SuccessModal from "./components/SuccessModal"; // Import Modal
import UnsavedWarningModal from "./components/UnsavedWarningModal";
import JuniorSoundRecorder from "./components/JuniorSoundRecorder";

export default function JuniorApp({ onBack }) {
    const workspaceRef = useRef(null); // Stores the Blockly Workspace Instance
    const blocklyDiv = useRef(null);   // Stores the DIV element
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null); // Canvas for Pen
    const cameraVideoRef = useRef(null); // Camera video element
    const cameraStreamRef = useRef(null); // Camera MediaStream
    const isRunning = useRef(false); // Ref for execution state
    const [isBlocksRunning, setIsBlocksRunning] = useState(false); // UI state for run/stop toggle
    const activeSpriteIdRef = useRef(null); // Ref for active sprite ID for highlighting
    const scenesRef = useRef(null); // Ref for latest scenes state to avoid stale closures
    const previewRevertTimerRef = useRef(null); // For block preview auto-revert
    const isLoadingWorkspaceRef = useRef(false); // To block autosave during workspace load
    const [projectName, setProjectName] = useState("Untitled Project");
    const [activeCategory, setActiveCategory] = useState("motion");
    const [categories, setCategories] = useState(CATEGORIES);
    const [categoryBlocks, setCategoryBlocks] = useState(categoryContents);
    const [isExtensionLibraryOpen, setIsExtensionLibraryOpen] = useState(false);
    const stageContainerRef = useRef(null); // Ref for stage container to measure dimensions
    const [isDraggingSpriteOnStage, setIsDraggingSpriteOnStage] = useState(false);

    // Camera State
    const [isCameraOn, setIsCameraOn] = useState(false);

    // Recording State
    const [isSoundRecorderOpen, setIsSoundRecorderOpen] = useState(false);
    // (Legacy recording state left for reference, though replaced by modal)
    const [isRecording, setIsRecording] = useState(false);
    const [recordingCount, setRecordingCount] = useState(1);

    // Connection State
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connected
    const [connectedDevice, setConnectedDevice] = useState(null);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [selectedBoardName, setSelectedBoardName] = useState(null);

    // UI Mode State (Stage vs Upload)
    const [appMode, setAppMode] = useState("stage"); // "stage" | "upload"
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);

    // Unsaved Changes Modal State
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'new' or 'open'

    // UI State for Pickers
    const [showPicker, setShowPicker] = useState(false);
    const [pickerCallback, setPickerCallback] = useState(null);
    const [showDirPicker, setShowDirPicker] = useState(false);
    const [showInstPicker, setShowInstPicker] = useState(false);
    const [showPianoPicker, setShowPianoPicker] = useState(false);
    const [pickerPos, setPickerPos] = useState(null);
    const [activeBlock, setActiveBlock] = useState(null);
    const timeoutRefs = useRef({}); // Store timeouts for speech bubbles

    // Paint Editor State
    const [paintEditor, setPaintEditor] = useState({
        isOpen: false,
        type: 'sprite', // 'sprite' | 'backdrop'
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
    const [winMessage, setWinMessage] = useState(null); // Win Message State

    // Derived State
    const currentScene = scenes?.find(s => s.id === currentSceneId) || scenes?.[0];
    const sprites = currentScene?.sprites || [];

    // --- GOAL CHECKING (Reactive) ---
    useEffect(() => {
        const config = getLessonConfig();
        if (config.goal && !winMessage) {
            const result = GoalManager.checkGoal(config.goal, sprites, activeSpriteId);
            if (result.complete) {
                setWinMessage(result.message);
            }
        }
    }, [sprites, activeSpriteId, winMessage]);

    // --- WORKSPACE SWITCHING (Per-Sprite) ---
    useEffect(() => {
        if (!workspaceRef.current || !activeSpriteId) return;

        // Skip if this sprite is already the one in the workspace
        if (activeSpriteIdRef.current === activeSpriteId && !isLoadingWorkspaceRef.current) {
            // Check if workspace is empty but sprite has blocks (initial cold load)
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
                // Tiny delay to ensure layout events are processed before we allow autosave
                setTimeout(() => {
                    isLoadingWorkspaceRef.current = false;
                }, 50);
            }
        }
    }, [activeSpriteId, sprites, currentSceneId]);

    // --- HINT SYSTEM ---
    const [hint, setHint] = useState(null);
    const lastInteraction = useRef(null); // Init in effect for purity

    useEffect(() => {
        if (!lastInteraction.current) lastInteraction.current = Date.now();
        const interval = setInterval(() => {
            const idle = Date.now() - lastInteraction.current;
            const config = getLessonConfig();
            const count = workspaceRef.current?.getAllBlocks(false).length || 0;

            // Import HintManager dynamically or assuming imported
            // (We will add import)
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

    // --- UI/MODAL STATE ---
    const [isSpriteModalOpen, setIsSpriteModalOpen] = useState(false);
    const [isBackdropChooserOpen, setIsBackdropChooserOpen] = useState(false);
    const [backdropEditSceneId, setBackdropEditSceneId] = useState(null);

    // --- PAINT EDITOR HANDLERS ---
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

    // Handle backdrop selection from BackdropChooser
    const handleBackdropSelect = (name, src, solidColor) => {
        const targetId = backdropEditSceneId || currentSceneId;
        if (src) {
            // Image backdrop
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
            // Solid color backdrop
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

    // Handle "Paint Custom" from BackdropChooser
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

    // Helper: Add Sprite (Delegating to System mainly for storage)
    const addSprite = (spriteData = null) => {
        saveCurrentWorkspace();
        const newId = `sprite_${Date.now()}`;

        let costumes = { default: "🐻" };
        let spriteName = "Bear";
        let spriteType = "bear";

        if (spriteData && typeof spriteData === 'object') {
            // From SpriteLibrary selection
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
            // Legacy string-based type
            const type = spriteData || 'robot';
            spriteType = type;
            spriteName = type.charAt(0).toUpperCase() + type.slice(1);

            if (type === "robot") {
                costumes = {
                    default: robotIdle,
                    wave1: robotWave1,
                    wave2: robotWave2,
                    talk: robotTalk1
                };
            } else if (type === "bear") {
                costumes = { default: "🐻", wave: "👋", angry: "😠" };
            } else if (type === "dog") {
                costumes = { default: "🐶", wave: "🐩", bark: "🗣️" };
            } else if (type === "cat") {
                costumes = { default: "🐱", sleep: "😴", wave: "🐾" };
            }
        }

        // Calculate a unique position that doesn't overlap with existing sprites
        // Stage is 480x360 (20x15 grid at 24px cells)
        const CELL_SIZE = 24;
        const existingSprites = currentScene?.sprites || [];

        // Predefined spread-out positions (in pixels) across the stage
        const spreadPositions = [
            { x: 14 * CELL_SIZE, y: 6 * CELL_SIZE },   // Right area
            { x: 5 * CELL_SIZE, y: 6 * CELL_SIZE },    // Left area
            { x: 10 * CELL_SIZE, y: 3 * CELL_SIZE },   // Top center
            { x: 10 * CELL_SIZE, y: 10 * CELL_SIZE },  // Bottom center
            { x: 3 * CELL_SIZE, y: 3 * CELL_SIZE },    // Top-left
            { x: 16 * CELL_SIZE, y: 3 * CELL_SIZE },   // Top-right
            { x: 3 * CELL_SIZE, y: 10 * CELL_SIZE },   // Bottom-left
            { x: 16 * CELL_SIZE, y: 10 * CELL_SIZE },  // Bottom-right
            { x: 7 * CELL_SIZE, y: 8 * CELL_SIZE },    // Mid-left
            { x: 12 * CELL_SIZE, y: 4 * CELL_SIZE },   // Mid-right-top
        ];

        // Find a position not too close to existing sprites
        const MIN_DISTANCE = CELL_SIZE * 3; // At least 3 cells apart
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

        // Fallback: random position if all predefined spots are taken
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
        setScenes(prev => prev.map(s => {
            if (s.id === currentSceneId) return { ...s, sprites: [...s.sprites, newSprite] };
            return s;
        }));
        setActiveSpriteId(newId);
        setIsSpriteModalOpen(false);
    };

    // Load blocks from a specific sprite
    const loadWorkspace = (sprite) => {
        if (!workspaceRef.current) return;
        const json = sprite?.blocks || {};
        Blockly.serialization.workspaces.load(json, workspaceRef.current);
    };

    // Handle Sprite Selection (Save Old -> Set New)
    const handleSpriteSelect = (newId) => {
        if (newId === activeSpriteId) return;
        saveCurrentWorkspace();
        setActiveSpriteId(newId);
    };

    // Handle Scene Selection (Save Old Sprite -> Switch Scene -> Load New Scene's 1st Sprite)
    const handleSceneSelect = (newSceneId) => {
        if (newSceneId === currentSceneId) return;
        saveCurrentWorkspace(); // Save the current sprite of the CURRENT scene

        setCurrentSceneId(newSceneId);

        // Find the new scene to start with its first sprite
        const newScene = scenes.find(s => s.id === newSceneId);
        if (newScene && newScene.sprites.length > 0) {
            setActiveSpriteId(newScene.sprites[0].id);
        } else {
            setActiveSpriteId(null);
            if (workspaceRef.current) workspaceRef.current.clear();
        }
    };





    const handleNextScene = () => {
        const currentIndex = scenes.findIndex(s => s.id === currentSceneId);
        const nextIndex = (currentIndex + 1) % scenes.length;
        handleSceneSelect(scenes[nextIndex].id);
    };

    // --- BIND WINDOW ACTIONS TO FSM ---
    useEffect(() => {
        window.getLeapProjectData = () => ({ scenes, currentSceneId, activeSpriteId, sprites });

        // Expose State Updaters using the SAFE FSM Actions
        window.updateSprite = (id, updates) => spriteActions.update(id, updates);

        // Move Relative (Clamped)
        window.moveRelative = (dir) => {
            const id = window.activeSpriteId || activeSpriteId;
            spriteActions.moveRelative(id, dir);
        };

        // Grid Move (Clamped)
        window.goToLocation = (x, y) => {
            const id = window.activeSpriteId || activeSpriteId;
            spriteActions.goToGrid(id, x, y);
        };

        // Reset Logic
        window.resetBear = () => {
            setWinMessage(null); // Clear Win State
            spriteActions.resetAll();
        };

        // Size Logic
        window.changeSize = (id, delta) => {
            spriteActions.update(id, {
                size: (prev) => prev + delta
            });
        };

        // Standard Getters
        window.getCurrentSceneId = () => currentSceneId;
        window.getActiveSpriteId = () => activeSpriteId;
        window.switchScene = (sceneId) => handleSceneSelect(sceneId);
        window.changeScene = () => handleNextScene();

        // Selection Logic
        window.selectSprite = (spriteIdOrName) => {
            const sprite = sprites.find(s => s.id === spriteIdOrName || s.id.includes(spriteIdOrName.toLowerCase()) || s.type === spriteIdOrName.toLowerCase());
            if (sprite) {
                handleSpriteSelect(sprite.id);
            }
        };

        // Aliases for Looks blocks
        window.setVisible = (id, val) => spriteActions.update(id, { visible: val });
        window.showSprite = (id) => window.setVisible(id || window.activeSpriteId || "robot_default", true);
        window.hideSprite = (id) => window.setVisible(id || window.activeSpriteId || "robot_default", false);

        window.say = (id, text) => {
            const tid = id || window.activeSpriteId || "robot_default";
            if (timeoutRefs.current[tid]) clearTimeout(timeoutRefs.current[tid]);
            spriteActions.update(tid, { speech: text });
            timeoutRefs.current[tid] = setTimeout(() => {
                spriteActions.update(tid, { speech: null });
                delete timeoutRefs.current[tid];
            }, 3000);
        };

        // Go to Random Position
        window.goToRandom = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            const randomX = Math.floor(Math.random() * 15) + 1;
            const randomY = Math.floor(Math.random() * 10) + 1;
            spriteActions.goToGrid(tid, randomX, randomY);
        };

        // ... Set Speed etc ...
        window.animationSpeed = 500; // Default

        // Set Sprite Color (Fill Color for 3D Sticker)
        window.setSpriteColor = (id, color) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, { textColor: color });
        };

        // Reset Size
        window.resetSize = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, { size: 100 });
        };

        // Next Costume
        window.nextCostume = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            // Use top-level functional update to get the LATEST sprite state
            spriteActions.update(tid, (current) => {
                if (current.costumes) {
                    const keys = Object.keys(current.costumes);
                    if (keys.length > 1) {
                        const currentKey = current.currentCostume || "default";
                        const idx = keys.indexOf(currentKey);
                        // Fallback if current key not found (shouldn't happen with proper init)
                        const nextIdx = (idx === -1) ? 0 : (idx + 1) % keys.length;
                        return { currentCostume: keys[nextIdx] };
                    }
                }
                return {};
            });
        };

        // Change Costume
        window.changeCostume = (id, costume) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, { currentCostume: costume });
        };

        // Mirror Sprite
        window.mirrorSprite = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, (prev) => ({ mirrored: !prev.mirrored }));
        };

        // Stamp Sprite - dispatches to sprite's stamp action
        window.stampSprite = (id) => {
            // Dispatch to the sprite's registered stamp action
            const handler = window._spriteActions?.[id];
            if (handler && handler.stamp) {
                handler.stamp();
            }
        };

        // Stamp implementation: draw sprite appearance onto the pen canvas
        window.stampSpriteOnCanvas = (spriteId, sx, sy, costumeVal, spriteSize) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const scale = (spriteSize || 100) / 100;
            const drawSize = 50 * scale;

            // Check if costumeValue is an image path
            if (typeof costumeVal === 'string' && (
                costumeVal.includes('/') ||
                costumeVal.startsWith('http') ||
                costumeVal.includes('data:image') ||
                costumeVal.endsWith('.png') ||
                costumeVal.endsWith('.jpg') ||
                costumeVal.endsWith('.svg')
            )) {
                // Draw image onto canvas
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    ctx.drawImage(img, sx, sy, drawSize, drawSize);
                };
                img.src = costumeVal;
            } else {
                // Draw emoji text onto canvas
                ctx.font = `${Math.round(drawSize)}px serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(costumeVal || '✏️', sx, sy);
            }

            if (window.showFeedback) window.showFeedback("Stamped!");
        };

        // Pen Color
        window.penColor = "#FF0000"; // Default red
        window.setPenColor = (color) => {
            window.penColor = color;
        };

        // Pen Size
        window.penSize = 5; // Default
        window.setPenSize = (size) => {
            window.penSize = parseInt(size);
        };

        // Sound Manager Hooks
        window.playSound = (name) => {
            soundBlocksExt.playSound({ SOUND_MENU: name }, { target: { id: window.activeSpriteId || activeSpriteId } });
        };
        window.playNote = (note, octave) => {
            musicBlocksExt.playNoteForDuration({ NOTE: note, OCTAVE: octave, DURATION: 0.5 });
        };
        window.setInstrument = (inst) => {
            musicBlocksExt.setInstrument({ INSTRUMENT: inst });
        };
        window.stopAllSounds = () => {
            window.speechSynthesis.cancel();
            soundBlocksExt.stopAllSounds();
        };

        window.playMusic = (name) => {
            musicBlocksExt.playMusic({ MUSIC: name });
        };
        window.stopMusic = () => {
            musicBlocksExt.stopMusic();
        };

        // Stop Execution - Throws ExecutionStop error to halt execution immediately
        window.stopExecution = () => {
            throw new ExecutionStop("Execution stopped by Stop block");
        };

        // ... (Keep Sounds/Pen)

    }, [spriteActions, activeSpriteId, currentSceneId, sprites]); // Added sprites to dependencies

    // ... (Blockly Injection)

    // BLOCK LIMIT ENFORCEMENT (Config Aware)
    // Inside useEffect for Blockly:
    // const config = getLessonConfig();
    // const MAX_BLOCKS = config.maxBlocks;
    // In the existing useEffect, find checkBlockLimit and update it.


    // Helper: Add Scene
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

    // NOTE: Workspace loading is handled by the "WORKSPACE SWITCHING (Per-Sprite)" effect above (line ~268).
    // That effect properly disables Blockly events during load to prevent autosave corruption.

    // Convert JSON blocks to XML string + FILTERING
    const getToolboxXml = (catId) => {
        const config = getLessonConfig();
        const allowedShapes = config.allowedShapes || ["stack", "hat", "c-block", "cap"];

        // Import ValidBlocks for shape checking
        // Since ValidBlocks is in BlockRegistry, we need to import it or duplicate knowing.
        // For efficiency, we assume blocks have a 'shape' or use the BlockRegistry if imported.
        // Actually, we imported BlockRegistry? No, we didn't import ValidBlocks in App.jsx yet.
        // Let's rely on block defaults or just filter by implicit knowledge for now,
        // OR better: Assume categoryContents contains the definitive list, 
        // actually we might want to hide 'loop' blocks in Beginner mode.
        // Let's implement a simple filter:

        let blocks = categoryBlocks[catId] || [];

        // Filter by shape/type if config demands
        if (!allowedShapes.includes("c-block")) {
            // Remove repeats/forever
            blocks = blocks.filter(b => !["control_forever", "control_repeat"].includes(b.type));
        }

        let xml = '<xml xmlns="https://developers.google.com/blockly/xml">';
        blocks.forEach(b => {
            if (b.kind === "button") {
                xml += `<button text="${b.text}" callbackKey="${b.callbackKey}"></button>`;
            } else {
                xml += `<block type="${b.type}">`;
                // Add default values
                if (b.type === 'looks_call') xml += `<field name="NAME">Tobi</field>`;
                if (b.type === 'sound_animal') xml += `<field name="VAL">grunt</field>`;
                xml += `</block>`;
            }
        });
        xml += '</xml>';
        return xml;
    };

    useEffect(() => {
        // Defines blocks using the current Blockly instance
        defineLeapBlocks(Blockly, javascriptGenerator);
        defineLooksBlocks(Blockly, javascriptGenerator);
        defineSoundBlocks(Blockly, javascriptGenerator);
        defineExtensionBlocks(Blockly, javascriptGenerator);

        // Dynamic Dropdown Colors: Update highlight color based on block color
        if (!Blockly.FieldDropdown.prototype._originalShowEditor) {
            Blockly.FieldDropdown.prototype._originalShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
            Blockly.FieldDropdown.prototype.showEditor_ = function (opt_e) {
                const block = this.getSourceBlock();
                if (block) {
                    const color = block.getColour();
                    document.documentElement.style.setProperty('--blockly-menu-highlight-color', color);
                    // Add a subtle tint for the background (10% opacity)
                    const tint = color.startsWith('#') ? `${color}1A` : 'rgba(0,0,0,0.05)';
                    document.documentElement.style.setProperty('--blockly-menu-bg-color', tint);
                }
                this._originalShowEditor(opt_e);
            };
        }

        // Register Custom Renderer
        registerLeapRenderer(Blockly);

        // Initialize Blockly
        // We use blocklyDiv.current to target the DOM element specifically
        // Assign the Result (Workspace) to workspaceRef.current
        if (blocklyDiv.current) {
            workspaceRef.current = Blockly.inject(blocklyDiv.current, {
                toolbox: getToolboxXml("motion"),
                scrollbars: false,
                trashcan: false,
                horizontalLayout: true,
                toolboxPosition: "end",
                renderer: 'leap',
                sounds: false,
                zoom: {
                    controls: false,
                    wheel: true,
                    startScale: 0.8,
                    maxScale: 3,
                    minScale: 0.3,
                    scaleSpeed: 1.2
                },
                move: { scrollbars: true, drag: true, wheel: false }
            });

            const flyout = workspaceRef.current.getFlyout();
            if (flyout) {
                flyout.autoClose = false;
            }

            // --- SOUND RECORDER CALLBACK ---
            workspaceRef.current.registerButtonCallback('RECORD_SOUND', () => {
                setIsSoundRecorderOpen(true);
            });

            // FLYOUT CONFIG: Full-size blocks, fixed height for horizontal bottom strip
            const workspace = workspaceRef.current;
            const initFlyout = workspace.getFlyout();
            if (initFlyout) {
                const FIXED_SCALE = 1.0;
                initFlyout.getFlyoutScale = () => FIXED_SCALE;
                if (initFlyout.getWorkspace()) {
                    initFlyout.getWorkspace().setScale(FIXED_SCALE);
                }
                // Force flyout to a comfortable height for blocks
                initFlyout.height_ = 140;
            }

            // Force Blockly to recalculate layout after flyout changes
            setTimeout(() => {
                workspace.resize();
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }

        // UI Event Listener for Custom Interactions (Grid Picker & Direction Picker)
        workspaceRef.current.addChangeListener((e) => {
            if (e.type === Blockly.Events.CLICK) {
                const block = workspaceRef.current.getBlockById(e.blockId);
                if (!block) return;

                // 1. Grid Picker (go_to_location)
                if (block.type === "go_to_location") {
                    setPickerCallback(() => (x, y) => {
                        block.posX = x;
                        block.posY = y;
                        if (window.goToLocation) window.goToLocation(x, y);
                    });
                    setShowPicker(true);
                }

                // 2. Direction Picker (move_relative)
                if (block.type === "move_relative") {
                    setActiveBlock(block);
                    setShowDirPicker(true);
                }

                // 2b. Instrument Picker (sound_instrument)
                if (block.type === "sound_instrument") {
                    setActiveBlock(block);
                    // Get block position for the picker
                    const xy = block.getRelativeToSurfaceXY();
                    const scale = workspaceRef.current.getScale();
                    const injectionDiv = workspaceRef.current.getInjectionDiv();
                    const bBox = injectionDiv.getBoundingClientRect();

                    setPickerPos({
                        x: bBox.left + (xy.x * scale) + (block.width / 2 * scale) - 90, // Center the 180px picker
                        y: bBox.top + (xy.y * scale) + (block.height * scale) + 10
                    });
                    setShowInstPicker(true);
                }

                // 2c. Piano Picker (sound_note)
                if (block.type === "sound_note") {
                    setActiveBlock(block);
                    const xy = block.getRelativeToSurfaceXY();
                    const scale = workspaceRef.current.getScale();
                    const injectionDiv = workspaceRef.current.getInjectionDiv();
                    const bBox = injectionDiv.getBoundingClientRect();

                    setPickerPos({
                        x: bBox.left + (xy.x * scale) + (block.width / 2 * scale) - 160, // Center 320px wide picker
                        y: bBox.top + (xy.y * scale) + (block.height * scale) + 10
                    });
                    setShowPianoPicker(true);
                }

                // 3. PROPER PREVIEW (Unified with Auto-Revert)
                const sid = activeSpriteIdRef.current || window.activeSpriteId || activeSpriteId;
                const latestScenes = scenesRef.current || scenes;
                let activeSprite = null;
                for (const scene of latestScenes) {
                    activeSprite = scene.sprites.find(s => s.id === sid);
                    if (activeSprite) break;
                }
                if (!activeSprite) return;

                // Cancel any previous revert timer
                if (previewRevertTimerRef.current) {
                    clearTimeout(previewRevertTimerRef.current);
                    previewRevertTimerRef.current = null;
                }

                // Save current sprite state before preview
                const savedState = {
                    x: activeSprite.x,
                    y: activeSprite.y,
                    angle: activeSprite.angle,
                    size: activeSprite.size,
                    visible: activeSprite.visible,
                    mirrored: activeSprite.mirrored,
                    speech: activeSprite.speech,
                    currentCostume: activeSprite.currentCostume
                };

                let previewed = false;
                if (looksPreview[block.type]) {
                    looksPreview[block.type](block);
                    previewed = true;
                } else if (previewActions[block.type]) {
                    previewActions[block.type](block);
                    previewed = true;
                }

                // Add jiggle animation for visual feedback on block interaction
                if (previewed) {
                    if (window.jiggle) window.jiggle(activeSprite.id);

                    // Revert to original state after 2 seconds
                    previewRevertTimerRef.current = setTimeout(() => {
                        console.log(`[JuniorApp] Reverting preview for ${activeSprite.name}`);
                        spriteActions.update(activeSprite.id, savedState);
                        previewRevertTimerRef.current = null;
                    }, 2000);
                }
            }
        });

        // --- PREVIEW ACTION IMPLEMENTATION ---
        // Listen for Clicks on the Flyout (Toolbox)
        const flyout = workspaceRef.current.getFlyout();
        if (flyout) {
            const flyoutWs = flyout.getWorkspace();
            flyoutWs.addChangeListener((e) => {
                if (e.type === Blockly.Events.CLICK) {
                    const block = flyoutWs.getBlockById(e.blockId);
                    if (!block) return;

                    const sid = activeSpriteIdRef.current || window.activeSpriteId || activeSpriteId;
                    const latestScenes = scenesRef.current || scenes;
                    let activeSprite = null;
                    for (const scene of latestScenes) {
                        activeSprite = scene.sprites.find(s => s.id === sid);
                        if (activeSprite) break;
                    }
                    if (!activeSprite) return;

                    // Cancel any previous revert timer
                    if (previewRevertTimerRef.current) {
                        clearTimeout(previewRevertTimerRef.current);
                        previewRevertTimerRef.current = null;
                    }

                    // Save state
                    const savedState = {
                        x: activeSprite.x,
                        y: activeSprite.y,
                        angle: activeSprite.angle,
                        size: activeSprite.size,
                        visible: activeSprite.visible,
                        mirrored: activeSprite.mirrored,
                        speech: activeSprite.speech,
                        currentCostume: activeSprite.currentCostume
                    };

                    let previewed = false;
                    if (looksPreview[block.type]) {
                        looksPreview[block.type](block);
                        previewed = true;
                    } else if (previewActions[block.type]) {
                        previewActions[block.type](block);
                        previewed = true;
                    }

                    if (previewed) {
                        if (window.jiggle) window.jiggle(activeSprite.id);

                        previewRevertTimerRef.current = setTimeout(() => {
                            console.log(`[JuniorApp] Reverting flyout preview for ${activeSprite.name}`);
                            spriteActions.update(activeSprite.id, savedState);
                            previewRevertTimerRef.current = null;
                        }, 2000);
                    }
                }
            });
        }

        // BLOCK LIMIT & AUTOSAVE (Strict Workspace Flow)
        const handleWorkspaceChange = (e) => {
            if (e.type === Blockly.Events.UI) return;

            // 1. AUTOSAVE to sprite state
            saveCurrentWorkspace();

            // 2. BLOCK LIMIT
            if (e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_MOVE) {
                const config = getLessonConfig();
                const MAX_BLOCKS = config.maxBlocks || 500;

                // Count Check
                const blocks = workspaceRef.current.getAllBlocks(false);
                if (blocks.length > MAX_BLOCKS) {
                    alert(`Lesson Limit: You can only use ${MAX_BLOCKS} blocks!`);
                    // Undo via generic undo or dispose specific if we knew it
                    setTimeout(() => workspaceRef.current.undo(false), 0);
                    return;
                }

                // 3. STRICT VALIDATION (Hat & Loops)
                // We ignore orphans during editing to allow drag-and-drop
                // 3. STRICT VALIDATION (Hat & Loops)
                // We ignore orphans during editing to allow drag-and-drop
                const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current);
                if (!validation.isValid) {
                    // Check if it's an Orphan error (Allow orphans while editing)
                    if (validation.error.includes("connected to a Start") || validation.error.includes("Start block")) {
                        // Just warn or ignore during edit
                        // console.warn("Orphan block detected (ignored during edit)");
                    } else {
                        // Hard Reject (Duplicate Hat, Deep Loops)
                        alert(validation.error);
                        if (validation.victim) {
                            setTimeout(() => validation.victim.dispose(), 0);
                        }
                    }
                }
            }
        };
        workspaceRef.current.addChangeListener(handleWorkspaceChange);

        // Fresh layout
        window.dispatchEvent(new Event('resize'));
        // Cleanup on unmount
        return () => {
            if (workspaceRef.current) workspaceRef.current.dispose();
        };
    }, []);

    // --- PEN & SOUND API ---
    useEffect(() => {
        // Pen API
        window.drawSegment = (x1, y1, x2, y2, color, width) => {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.lineCap = "round";
                ctx.lineJoin = "round"; // smooth strokes
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

        // Sound API
        window.playSound = (name) => {
            if (!name) return;
            // soundBlocksExt is defined at module level in JuniorApp.jsx
            soundBlocksExt.playSound({ SOUND: name }, { target: { id: activeSpriteIdRef.current || 'stage' } });
        };

        window.playNote = (note, octave) => {
            musicBlocksExt.playNoteForDuration({ NOTE: note, OCTAVE: octave, DURATION: 0.5 }, { target: { id: activeSpriteIdRef.current || 'stage' } });
        };

        window.setInstrument = (instrument) => {
            musicBlocksExt.setInstrument({ INSTRUMENT: instrument }, { target: { id: activeSpriteIdRef.current || 'stage' } });
        };

        window.stopAllSounds = () => {
            soundBlocksExt.stopAllSounds();
        };

        window.getActiveSpriteSounds = () => {
            // Get built-in sounds
            const builtIn = [
                ["Pop", "pop"],
                ["Boing", "boing"],
                ["Clap", "clap"],
                ["Meow", "meow"],
                ["Bark", "bark"]
            ];

            // Get user recordings from the soundBank
            const recordings = Object.keys(audioEngine.soundBank.assets)
                .filter(name => name.startsWith("Recording"))
                .map(name => [name, name]);

            return [...builtIn, ...recordings];
        };

    }, []);

    // Sync state helpers for Async Execution
    useEffect(() => {
        activeSpriteIdRef.current = activeSpriteId;
        scenesRef.current = scenes; // Keep ref in sync for stale-state prevention
        window.activeSpriteId = activeSpriteId; // Legacy support
        window.isActive = () => isRunning.current; // Global stop flag
        window.wait = (s) => new Promise(r => setTimeout(r, s * 1000));

        // Setup broadcast listener for inter-sprite communication
        if (interpreterRef.current) {
            const getSpriteEntries = () => {
                const latestScenes = scenesRef.current || scenes;
                const currentSprites = latestScenes.find(s => s.id === currentSceneId)?.sprites || [];
                return currentSprites
                    .filter(sprite => sprite.blocks && Object.keys(sprite.blocks).length > 0)
                    .map(sprite => ({ spriteId: sprite.id, blocks: sprite.blocks }));
            };
            interpreterRef.current.setupBroadcastListener(getSpriteEntries, Blockly);
        }

        // Broadcast helper for blocks to call
        window.broadcastMessage = (message) => {
            console.log(`[Junior] Broadcasting: "${message}"`);
            window.dispatchEvent(new CustomEvent('leap-broadcast', { detail: { message } }));
        };
    }, [activeSpriteId, scenes, currentSceneId]);



    const handleCategoryClick = (catId) => {
        setActiveCategory(catId);
        if (workspaceRef.current) {
            workspaceRef.current.updateToolbox(getToolboxXml(catId));
            // Ensure flyout blocks render at correct scale after update
            resetFlyoutScale();
            setTimeout(() => workspaceRef.current?.resize(), 50);
        }
    };

    const handleAddExtension = (extId) => {
        setIsExtensionLibraryOpen(false);

        let newCategory = null;
        let newBlocks = [];

        if (extId === 'face_detection') {
            if (!categories.find(c => c.id === 'face_detection')) {
                newCategory = { id: "face_detection", name: "Face Detection", color: "#D43D41", icon: <span>👤</span> };
                newBlocks = [
                    { kind: "block", type: "fd_camera" },
                    { kind: "block", type: "fd_analyze" },
                    { kind: "block", type: "fd_count" },
                    { kind: "block", type: "fd_guess_emotion" },
                    { kind: "block", type: "fd_feature" },
                    { kind: "block", type: "fd_when_emotion" }
                ];
            }
        } else if (extId === 'hand_pose') {
            if (!categories.find(c => c.id === 'hand_pose')) {
                newCategory = { id: "hand_pose", name: "Hand Pose", color: "#D43D41", icon: <span>✋</span> };
                newBlocks = [
                    { kind: "block", type: "hp_camera" },
                    { kind: "block", type: "hp_analyze" },
                    { kind: "block", type: "hp_move_with" },
                    { kind: "block", type: "hp_guess_sign" },
                    { kind: "block", type: "hp_when_sign" }
                ];
            }
        }

        if (newCategory) {
            setCategories(prev => [...prev, newCategory]);
            setCategoryBlocks(prev => ({ ...prev, [extId]: newBlocks }));
            // Automatically switch to the new category
            setTimeout(() => handleCategoryClick(extId), 50);
        }
    };

    // --- JUNIOR BACKEND INTEGRATION ---

    // Inside App component:
    const interpreterRef = useRef(null);

    // Initialize Interpreter
    useEffect(() => {
        interpreterRef.current = new LeapInterpreter(workspaceRef, javascriptGenerator, {
            onRun: () => {
                isRunning.current = true;
                setIsBlocksRunning(true);
            },
            onStop: () => {
                isRunning.current = false;
                setIsBlocksRunning(false);
            },
            onHighlight: (id, spriteId) => {
                if (workspaceRef.current && (!spriteId || spriteId === activeSpriteIdRef.current)) {
                    workspaceRef.current.highlightBlock(id);
                }
            }
        });
    }, []);

    // --- ASYNC EXECUTION ENGINE (Layered) ---
    const runBlocks = async () => {
        // STRICT VALIDATION (Orphans & Rules)
        const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current);
        if (!validation.isValid) {
            // Ignore Orphan errors for execution (just don't run them)
            if (!validation.error.includes("connected to a Start") && !validation.error.includes("Start block")) {
                alert(`Oops! ${validation.error}`);
                return;
            }
        }

        if (isRunning.current) {
            stopBlocks();
            await window.wait(0.1);
        }

        // Check if execution was paused (stopped by stop block)
        if (interpreterRef.current?.isPaused) {
            console.log("Resuming paused execution...");
            setIsBlocksRunning(true);
            interpreterRef.current.resumeExecution();
            return;
        }

        // Fresh start - Soft reset: clear visual state but PRESERVE sprite positions
        // Sprites execute from wherever the user placed them on the stage
        const currentSceneSprites = scenes.find(s => s.id === currentSceneId)?.sprites || [];
        if (currentSceneSprites.length > 0) {
            spriteActions.softResetAll();
        }
        // Clear pen drawings from previous execution
        if (window.clearPen) window.clearPen();
        await window.wait(0.3);

        // Gather block data for ALL sprites in the current scene
        const currentScene = scenes.find(s => s.id === currentSceneId);
        if (!currentScene) return;

        const spriteEntries = currentScene.sprites.map(sprite => {
            // For the active sprite, always use the live workspace data to capture unsaved changes
            if (sprite.id === activeSpriteId && workspaceRef.current) {
                return {
                    spriteId: sprite.id,
                    blocks: Blockly.serialization.workspaces.save(workspaceRef.current)
                };
            }
            // For others, use their saved blocks
            return {
                spriteId: sprite.id,
                blocks: sprite.blocks || {}
            };
        });

        console.log(`[Junior] Running blocks for all sprites in scene: ${currentScene.name}`);
        if (interpreterRef.current) {
            await interpreterRef.current.runAllSpritesStacks(['event_flag', 'event_flag_clicked'], spriteEntries, Blockly);
        }
    };

    const handleSpriteClick = async (clickedId) => {
        // First save any current workspace blocks
        saveCurrentWorkspace();

        // Wait briefly for state flush
        await new Promise(r => setTimeout(r, 50));

        const latestScenes = scenesRef.current || scenes;
        const currentScene = latestScenes.find(s => s.id === currentSceneId);
        if (!currentScene) return;

        const sprite = currentScene.sprites.find(s => s.id === clickedId);

        if (sprite && sprite.blocks && Object.keys(sprite.blocks).length > 0) {
            const spriteEntries = [{ spriteId: clickedId, blocks: sprite.blocks }];
            interpreterRef.current?.runAllSpritesStacks(['event_press', 'event_sprite_clicked'], spriteEntries, Blockly);
        } else if (clickedId === activeSpriteId) {
            // Fallback for current active sprite workspace
            interpreterRef.current?.runStacks(['event_press', 'event_sprite_clicked']);
        }
    };

    const stopBlocks = () => {
        interpreterRef.current?.stopAll();
        interpreterRef.current?.clearPauseFlag(); // Clear pause flag on manual stop
        executionEngine.stopAll();
        if (window.stopAll) window.stopAll();
        setIsBlocksRunning(false);
    };

    // Full reset: stops blocks AND resets sprite position to defaults
    const handleReset = () => {
        stopBlocks(); // This already clears pause flag
        if (window.hardResetBear) window.hardResetBear();
    };

    // --- CAMERA TOGGLE ---
    const toggleCamera = async () => {
        if (isCameraOn) {
            // Stop camera
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
                cameraStreamRef.current = null;
            }
            if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = null;
            }
            setIsCameraOn(false);
        } else {
            // Start camera
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

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Sync video stream to the video element after it renders
    useEffect(() => {
        if (isCameraOn && cameraVideoRef.current && cameraStreamRef.current) {
            cameraVideoRef.current.srcObject = cameraStreamRef.current;
        }
    }, [isCameraOn]);

    // --- SAVE / LOAD (ProjectManager Integration) ---
    const saveCurrentWorkspace = () => {
        if (!workspaceRef.current || !activeSpriteIdRef.current || isLoadingWorkspaceRef.current) return;
        const json = Blockly.serialization.workspaces.save(workspaceRef.current);

        // Find the current sprite and update its blocks
        const scenesCopy = [...(scenesRef.current || scenes)];
        const currentScene = scenesCopy.find(s => s.id === currentSceneId);
        if (currentScene) {
            const sprite = currentScene.sprites.find(s => s.id === activeSpriteIdRef.current);
            if (sprite) {
                // Only update if changed
                if (JSON.stringify(sprite.blocks) !== JSON.stringify(json)) {
                    sprite.blocks = json;
                    setScenes(scenesCopy);
                    console.log(`[JuniorApp] Saved workspace blocks to sprite: ${sprite.name}`);
                }
            }
        }
    };

    const executeNewProject = () => {
        if (workspaceRef.current) {
            // Clear the Blockly workspace
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
        }

        // Create default robot sprite mapped to the junior format
        const id = `robot_default`;
        const newSprite = {
            id: id,
            name: "Robot",
            type: "robot",
            x: 200, // Centered logically for Junior
            y: 150,
            angle: 0,
            size: 100,
            visible: true,
            mirrored: false,
            speech: null,
            costumes: {
                default: "/assets/sprites/robot/robot_idle.svg",
                wave1: "/assets/sprites/robot/robot_wave1.svg",
                wave2: "/assets/sprites/robot/robot_wave2.svg",
                talk: "/assets/sprites/robot/robot_talk1.svg"
            },
            currentCostume: "default",
            blocks: {}
        };

        const defaultScene = {
            id: "scene1",
            name: "Scene 1",
            background: "white",
            sprites: [newSprite]
        };

        setScenes([defaultScene]);
        setCurrentSceneId("scene1");
        setActiveSpriteId(id);
        activeSpriteIdRef.current = id;
        setProjectName('Untitled');
        console.log('[JuniorApp] New project created');
    };

    const handleNewProject = () => {
        setPendingAction('new');
        setShowUnsavedModal(true);
    };

    const handleSaveProject = (isSilent = false) => {
        // 1. Force save of current workspace if it's active
        saveCurrentWorkspace();

        // 2. Prepare the project data structure
        setTimeout(() => {
            const latestScenes = scenesRef.current || scenes;

            const payload = {
                scenes: latestScenes, // Junior mode relies entirely on the scenes array
            };

            fileService.saveProject(projectName, 'junior', payload);
            console.log(`[JuniorApp] Project saved: ${projectName}`);
        }, 50);
    };

    const executeOpenProject = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = '.leap,.lbproject,application/json';
            fileInputRef.current.click();
        }
    };

    const handleOpenProject = () => {
        setPendingAction('open');
        setShowUnsavedModal(true);
    };

    const confirmUnsavedAction = (saveFirst) => {
        setShowUnsavedModal(false);
        if (saveFirst) {
            handleSaveProject(true);
            // Wait slightly for the save download to trigger before clearing/opening
            setTimeout(() => {
                if (pendingAction === 'new') executeNewProject();
                if (pendingAction === 'open') executeOpenProject();
                setPendingAction(null);
            }, 500);
        } else {
            if (pendingAction === 'new') executeNewProject();
            if (pendingAction === 'open') executeOpenProject();
            setPendingAction(null);
        }
    };

    const handleFileLoad = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await fileService.loadProject(file);
            const validation = fileService.validateProject(data, 'junior');

            if (!validation.isValid) {
                alert(validation.error);
                return;
            }

            if (!data.scenes) throw new Error('Invalid Junior project file (missing scenes array)');

            console.log(`[JuniorApp] Loading project: ${data.projectName || 'Untitled'}`);

            // Full Reset before loading
            stopBlocks();
            if (workspaceRef.current) {
                Blockly.Events.disable();
                workspaceRef.current.clear();
                Blockly.Events.enable();
            }

            setProjectName(data.projectName || 'My Project');

            // Restore imported state
            setScenes(data.scenes);
            const firstScene = data.scenes[0];
            if (firstScene) {
                setCurrentSceneId(firstScene.id);
                const firstSprite = firstScene.sprites[0];
                if (firstSprite) {
                    const newId = firstSprite.id;
                    setActiveSpriteId(newId);
                    activeSpriteIdRef.current = newId;

                    // Give React time to re-render sprites, then inject blocks into workspace
                    setTimeout(() => {
                        if (workspaceRef.current && firstSprite.blocks) {
                            try {
                                Blockly.Events.disable();
                                Blockly.serialization.workspaces.load(firstSprite.blocks, workspaceRef.current);
                            } finally {
                                Blockly.Events.enable();
                            }
                        }
                    }, 100);
                } else {
                    setActiveSpriteId(null);
                    activeSpriteIdRef.current = null;
                    if (workspaceRef.current) workspaceRef.current.clear();
                }
            }

            console.log('[JuniorApp] Project loaded successfully');
        } catch (err) {
            console.error('Failed to load project:', err);
            alert('Failed to load project file: ' + err.message);
        } finally {
            e.target.value = "";
        }
    };

    // HANDLING MENUS (Enhanced)
    const handleFileMenu = (action) => {
        if (action === "save" || action === "save_as") handleSaveProject();
        if (action === "open" || action === "load") handleOpenProject();
        if (action === "new_project" || action === "new" || action === "new_workspace") handleNewProject();

        if (["qr", "examples", "guide", "record"].includes(action)) {
            alert(`Feature '${action}' coming soon!`);
        }
    };

    const handleEditMenu = (action) => {
        if (action === "restore") alert("Restore workspace feature coming soon!");
        if (action === "undo") workspaceRef.current?.undo(false);
        if (action === "redo") workspaceRef.current?.undo(true);
    };

    const resetFlyoutScale = () => {
        const flyout = workspaceRef.current?.getFlyout();
        if (flyout && flyout.getWorkspace()) {
            flyout.getWorkspace().setScale(1.0);
        }
    };

    // --- RECORDING ---
    const handleSaveRecording = (audioData) => {
        // audioData contains { blob, buffer, blobUrl }
        const name = `Recording ${recordingCount}`;
        setRecordingCount(prev => prev + 1);

        // Feed to global soundBank explicitly so the engine can look it up
        audioEngine.soundBank.assets[name] = audioData.blobUrl;

        // In a full implementation, we would save this to the sprite's sound collection.
        // For the current JuniorApp, we'll alert the user and make it available.
        alert(`Saved as '${name}'. You can now select it in the 'play sound' block dropdown!`);
    };

    // --- DELETE SPRITE ---
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

        // Switch to first remaining sprite
        const remaining = sprites.filter(s => s.id !== spriteId);
        if (remaining.length > 0) {
            setActiveSpriteId(remaining[0].id);
        }
    };

    // --- DELETE SCENE ---
    const deleteScene = (sceneId) => {
        if (scenes.length <= 1) {
            alert("Cannot delete the last scene!");
            return;
        }
        if (!confirm(`Delete scene?`)) return;

        setScenes(prev => prev.filter(s => s.id !== sceneId));

        // Switch to first remaining scene
        const remaining = scenes.filter(s => s.id !== sceneId);
        if (remaining.length > 0) {
            setCurrentSceneId(remaining[0].id);
            setActiveSpriteId(remaining[0].sprites[0]?.id || null);
        }
    };

    // --- SCREENSHOT ---
    const [stageRef] = useState({ current: null });
    const takeScreenshot = () => {
        const stage = document.querySelector('.stage');
        if (!stage) return;

        // Create a simple canvas screenshot
        const canvas = document.createElement('canvas');
        const rect = stage.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Use html2canvas-like approach (simplified)
        alert("📷 Screenshot saved! (Feature expanding soon)");
    };

    // --- GRID TOGGLE ---
    const [showGrid, setShowGrid] = useState(true);
    const toggleGrid = () => {
        setShowGrid(prev => !prev);
    };

    // --- FULLSCREEN ---
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Listen for fullscreen changes (e.g. user presses ESC)
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullscreen = () => {
        const stageContainer = document.querySelector('.stage')?.parentElement;
        if (!stageContainer) return;

        if (!document.fullscreenElement) {
            stageContainer.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".json" onChange={handleFileLoad} />

            {/* JUNIOR MENU BAR - Simplified (no hardware features) */}
            <JuniorMenuBar
                projectName={projectName}
                onProjectNameChange={setProjectName}
                onFileAction={handleFileMenu}
                onEditAction={handleEditMenu}
                onBack={onBack}
            />

            {/* CONNECT MODAL - Keep for now but rarely used in Junior */}
            {isConnectModalOpen && (
                <ConnectModal
                    onClose={() => setIsConnectModalOpen(false)}
                    status={connectionStatus}
                    setStatus={setConnectionStatus}
                    setDevice={setConnectedDevice}
                    currentDevice={connectedDevice}
                />
            )}

            {/* JUNIOR SOUND RECORDER MODAL */}
            <JuniorSoundRecorder
                isOpen={isSoundRecorderOpen}
                onClose={() => setIsSoundRecorderOpen(false)}
                onSave={handleSaveRecording}
            />

            {/* JUNIOR EXTENSION LIBRARY MODAL */}
            {isExtensionLibraryOpen && (
                <JuniorExtensionLibrary
                    onClose={() => setIsExtensionLibraryOpen(false)}
                    onSelectExtension={handleAddExtension}
                />
            )}

            {showInstPicker && (
                <InstrumentPicker
                    position={pickerPos}
                    onClose={() => setShowInstPicker(false)}
                    onPick={(inst) => {
                        if (activeBlock) {
                            activeBlock.setFieldValue(inst, "INSTRUMENT");
                            // Update audio engine instrument immediately
                            musicBlocksExt.setInstrument({ INSTRUMENT: inst });
                        }
                    }}
                />
            )}

            {showPianoPicker && (
                <PianoPicker
                    position={pickerPos}
                    initialNote={activeBlock?.getFieldValue("NOTE")}
                    initialOctave={parseInt(activeBlock?.getFieldValue("OCTAVE") || "4")}
                    onClose={() => setShowPianoPicker(false)}
                    onPreview={(note, octave) => {
                        musicBlocksExt.playNoteForDuration({ NOTE: note, OCTAVE: octave, DURATION: 0.3 });
                    }}
                    onPick={(note, octave) => {
                        if (activeBlock) {
                            activeBlock.setFieldValue(note, "NOTE");
                            activeBlock.setFieldValue(octave.toString(), "OCTAVE");
                        }
                    }}
                />
            )}

            <div style={{ flex: 1, display: "flex", overflow: 'hidden' }}>
                <div id="wrapper" style={{ width: "60%", height: "100%", position: "relative" }}>
                    {/* Selected Sprite Indicator overlay */}
                    {appMode === 'stage' && (
                        (() => {
                            const activeSprite = sprites.find(s => s.id === activeSpriteId);
                            if (activeSprite && activeSprite.currentCostume) {
                                // Use static import for robot or fallback to currentCostume src if it's dynamic
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
                                        imgSrc = val; // Emoji
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
                        })()
                    )}
                    <div id="blocklyDiv" ref={blocklyDiv} className="workspace" style={{ width: "100%", height: "100%" }}></div>

                    {/* ════ FLOATING WORKSPACE CONTROLS (shared component) ════ */}
                    <WorkspaceControls workspaceRef={workspaceRef} onAfterZoom={resetFlyoutScale} style={{ bottom: '210px', right: '14px' }} />
                    <WorkspaceTrash workspaceRef={workspaceRef} />

                    {/* ════ CATEGORY BAR (bottom, full width tube) ════ */}
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
                        overflow: "hidden" /* Essential for the right button to respect border radius */
                    }}>
                        {/* Scrollable Categories List */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", height: "100%", overflowX: "auto", paddingRight: "10px" }} className="no-scrollbar">
                            {categories.map(cat => (
                                <CategoryButton key={cat.id} category={cat} isActive={activeCategory === cat.id} onClick={() => handleCategoryClick(cat.id)} />
                            ))}
                        </div>

                        {/* Add Blocks Button */}
                        <button
                            onClick={() => setIsExtensionLibraryOpen(true)}
                            title="Add More Blocks"
                            style={{
                                width: "68px",
                                height: "58px", /* Slightly larger to combat border-radius clipping artifacts */
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
                            onMouseEnter={e => {
                                e.currentTarget.style.background = "#793ba8";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "#662d91";
                            }}
                        >
                            {/* Updated puzzle icon with + matching screenshot */}
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
                    onDeleteSprite={sprites.length > 1 ? deleteSprite : null}
                    onSelectScene={handleSceneSelect}
                    onAddScene={addScene}
                    onDeleteScene={scenes.length > 1 ? deleteScene : null}
                    onEditSprite={handleEditSprite}
                    onEditScene={handleEditScene}
                    onGreenFlag={runBlocks}
                    onStop={stopBlocks}
                    onReset={handleReset}
                    onCamera={toggleCamera}
                    onToggleGrid={toggleGrid}
                    onFullscreen={toggleFullscreen}
                    showGrid={showGrid}
                    isRunning={isBlocksRunning}
                    isCameraOn={isCameraOn}
                    isFullscreen={isFullscreen}
                    isDraggingSprite={isDraggingSpriteOnStage}
                    spriteGridX={(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (!activeSprite || !stageContainerRef.current) return null;
                        const w = stageContainerRef.current.offsetWidth || 1;
                        const spriteCenter = activeSprite.x + 40; // offset for sprite icon center
                        return Math.max(0, Math.min(20, (spriteCenter / w) * 20));
                    })()}
                    spriteGridY={(() => {
                        const activeSprite = sprites.find(s => s.id === activeSpriteId);
                        if (!activeSprite || !stageContainerRef.current) return null;
                        const h = stageContainerRef.current.offsetHeight || 1;
                        const spriteCenter = activeSprite.y + 40; // offset for sprite icon center
                        return Math.max(1, Math.min(15, 15 - (spriteCenter / h) * 15));
                    })()}
                >
                    {/* STAGE CHILDREN */}
                    <div ref={stageContainerRef} className="stage" style={{
                        width: '100%', height: '100%', position: "relative", overflow: "visible",
                        background: currentScene.backgroundImage
                            ? `url(${currentScene.backgroundImage}) center/cover no-repeat`
                            : (currentScene.background || 'transparent'),
                    }}>
                        {/* Camera Video Backdrop */}
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
                                onClick={() => handleSpriteClick(sprite.id)}
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

            {/* SPRITE LIBRARY MODAL */}

            {/* BACKDROP CHOOSER MODAL */}
            {isBackdropChooserOpen && (
                <BackdropChooser
                    onSelect={handleBackdropSelect}
                    onPaint={handleBackdropPaint}
                    onClose={() => { setIsBackdropChooserOpen(false); setBackdropEditSceneId(null); }}
                />
            )}

            {/* POSITION PICKER MODAL */}
            {showPicker && (
                <PositionPicker
                    onPick={(x, y) => {
                        if (pickerCallback) pickerCallback(x, y);
                    }}
                    onClose={() => {
                        setShowPicker(false);
                        setPickerCallback(null);
                    }}
                />
            )}

            {/* DIRECTION PICKER MODAL */}
            {showDirPicker && (
                <DirectionPicker
                    onPick={(dir) => {
                        if (activeBlock) {
                            // activeBlock.direction = dir; // Avoid direct mutation if possible, but for Blockly blocks it might be necessary.
                            // Better: use Blockly API to set field if this is a block object.
                            // Assuming activeBlock is a JS object from our state? No, it's a Blockly block.
                            // Blockly blocks are mutable. But React state shouldn't hold mutable complex objects if we can avoid it.
                            // However, the error 'This value cannot be modified' usually comes from strict mode or frozen objects.
                            // If activeBlock is a real Blockly Block, we can modify it.
                            // If it's a serializable object, we should copy.
                            // Let's assume it's a Block and safe to mutate in this context, 
                            // BUT if it was set via useState, React freezes it in some dev tools.
                            // Workaround: Don't store the block in state, store ID, or clone for state.
                            // For now, let's just bypass the linter if it's a false positive on a class instance,
                            // OR if `activeBlock` is really a frozen state object.
                            // If it is a Block instance:
                            if (activeBlock.setFieldValue) {
                                activeBlock.setFieldValue(dir, 'DIR'); // Example field update
                            } else {
                                // It might be a simple object wrapper.
                                // Let's try to update safely.
                                // Actually, standard Blockly blocks don't have 'direction' property directly usually? 
                                // Maybe it's a custom property we added.
                                try { activeBlock.direction = dir; } catch (e) { console.warn("Could not set direction", e); }
                            }

                            // Preview Immediately
                            if (window.moveRelative) window.moveRelative(dir);
                        }
                        setShowDirPicker(false);
                        setActiveBlock(null);
                    }}
                />
            )}
            {/* SUCCESS MODAL */}
            {winMessage && (
                <SuccessModal
                    message={winMessage}
                    onRestart={() => window.resetBear()} // Resets state
                    onNext={() => {
                        window.resetBear();
                        alert("Next lesson coming soon!");
                        // Future: loadLesson(nextId)
                    }}
                />
            )}

            {/* SPRITE LIBRARY MODAL */}
            {isSpriteModalOpen && (
                <SpriteLibrary
                    isOpen={isSpriteModalOpen}
                    onClose={() => setIsSpriteModalOpen(false)}
                    onSelectSprite={(entry) => {
                        addSprite(entry);
                    }}
                    onPaintSprite={() => {
                        setIsSpriteModalOpen(false);
                        alert('Paint editor - select a sprite first, then edit its costume');
                    }}
                />
            )}

            {/* PAINT EDITOR MODAL */}
            {paintEditor.isOpen && (
                <PaintEditor
                    isOpen={paintEditor.isOpen}
                    onClose={() => setPaintEditor({ ...paintEditor, isOpen: false })}
                    onSave={handlePaintSave}
                    initialImage={paintEditor.initialImage}
                    costumes={paintEditor.costumes}
                    spriteName={paintEditor.spriteName}
                    mode={paintEditor.mode}
                />
            )}

            <UnsavedWarningModal
                isOpen={showUnsavedModal}
                onYes={() => confirmUnsavedAction(true)}
                onNo={() => confirmUnsavedAction(false)}
                onCancel={() => {
                    setShowUnsavedModal(false);
                    setPendingAction(null);
                }}
            />

        </div>
    );
}

function ControlButton({ onClick, icon, title }) {
    return <button onClick={onClick} title={title} style={{ width: "36px", height: "36px", background: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold", color: "#555" }}>{icon}</button>;
}

function CategoryButton({ category, isActive, onClick }) {
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
    )
}

/* ─────────────── Floating Workspace Control Button ─────────────── */
function WorkspaceControl({ icon, title, onClick }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.92)",
                border: "1px solid #ddd",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#666",
                transition: "all 0.15s",
                outline: "none",
                padding: 0,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = "#f0f0f0";
                e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.92)";
                e.currentTarget.style.transform = "scale(1)";
            }}
        >
            {icon}
        </button>
    );
}
