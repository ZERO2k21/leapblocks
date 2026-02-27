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
import PaintEditor from "../components/PaintEditor";
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
        { kind: "block", type: "event_press" }
    ],
    sound: [
        { kind: "block", type: "sound_play" },
        { kind: "block", type: "sound_instrument" },
        { kind: "block", type: "sound_note" },
        { kind: "block", type: "sound_stop_all" }
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
import { Interpreter as LeapInterpreter } from "./engine/Interpreter";
import { useSpriteSystem } from "./hooks/useSpriteSystem";
import { getLessonConfig } from "./engine/LessonConfig";
import { GoalManager } from "./engine/GoalManager";
import { HintManager } from "./engine/HintManager";
import { soundManager } from "./engine/SoundManager";
import { WorkspaceValidator } from "./engine/WorkspaceValidator";

import SuccessModal from "./components/SuccessModal"; // Import Modal

export default function JuniorApp({ onBack }) {
    const workspaceRef = useRef(null); // Stores the Blockly Workspace Instance
    const blocklyDiv = useRef(null);   // Stores the DIV element
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null); // Canvas for Pen
    const cameraVideoRef = useRef(null); // Camera video element
    const cameraStreamRef = useRef(null); // Camera MediaStream
    const isRunning = useRef(false); // Ref for execution state
    const [isBlocksRunning, setIsBlocksRunning] = useState(false); // UI state for run/stop toggle
    const [projectName, setProjectName] = useState("Untitled Project");
    const [activeCategory, setActiveCategory] = useState("motion");
    const stageContainerRef = useRef(null); // Ref for stage container to measure dimensions
    const [isDraggingSpriteOnStage, setIsDraggingSpriteOnStage] = useState(false);

    // Camera State
    const [isCameraOn, setIsCameraOn] = useState(false);

    // Recording State
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

    // UI State for Pickers
    const [showPicker, setShowPicker] = useState(false);
    const [pickerCallback, setPickerCallback] = useState(null);
    const [showDirPicker, setShowDirPicker] = useState(false);
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
                    x: 200, y: 150, angle: 0, size: 100, visible: true, mirrored: false, speech: null,
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
    const currentScene = scenes.find(s => s.id === currentSceneId) || scenes[0];
    const sprites = currentScene.sprites;

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

    // --- WORKSPACE PERSISTENCE LOGIC ---

    // Save current blocks to the Active Sprite in the Store
    const saveCurrentWorkspace = () => {
        if (!workspaceRef.current || !activeSpriteId) return;
        const json = Blockly.serialization.workspaces.save(workspaceRef.current);

        // We use a functional update to ensure we have the latest scenes, 
        // BUT 'activeSpriteId' is a closure capture. 
        // Ideally we pass the ID to save.
        const targetId = activeSpriteId;

        setScenes(prevScenes => prevScenes.map(scene => {
            if (scene.id !== currentSceneId) return scene;
            return {
                ...scene,
                sprites: scene.sprites.map(sprite => {
                    if (sprite.id !== targetId) return sprite;
                    return { ...sprite, blocks: json };
                })
            };
        }));
    };

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

    const handlePaintSave = (imageData, svgData) => {
        const savedData = svgData || imageData;
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
                                custom: savedData
                            },
                            currentCostume: "custom"
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
    const addSprite = (type = "robot") => {
        saveCurrentWorkspace();
        const newId = `sprite_${Date.now()}`;

        let costumes = { default: "🐻" };
        if (type === "robot") {
            costumes = {
                default: robotIdle,
                wave1: robotWave1,
                wave2: robotWave2,
                talk: robotTalk1
            };
        } else if (type === "bear") {
            costumes = { default: "🐻", wave: "👋" };
        } else if (type === "dog") {
            costumes = { default: "🐶", wave: "wave" }; // Key-based wave fallback in Teddy.jsx
        }

        const newSprite = {
            id: newId,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            type: type,
            x: 200, y: 150, angle: 0, size: 100, visible: true,
            mirrored: false,
            costumes: costumes,
            currentCostume: "default",
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
        window.showSprite = () => window.setVisible(window.activeSpriteId || "teddy", true);
        window.hideSprite = () => window.setVisible(window.activeSpriteId || "teddy", false);

        window.say = (id, text) => {
            if (timeoutRefs.current[id]) clearTimeout(timeoutRefs.current[id]);
            spriteActions.update(id, { speech: text });
            timeoutRefs.current[id] = setTimeout(() => {
                spriteActions.update(id, { speech: null });
                delete timeoutRefs.current[id];
            }, 3000);
        };

        // ===========================================
        // NEW PICTOBLOX FUNCTIONS
        // ===========================================

        // Go to Random Position
        window.goToRandom = () => {
            const id = window.activeSpriteId || activeSpriteId;
            const randomX = Math.floor(Math.random() * 15) + 1;
            const randomY = Math.floor(Math.random() * 10) + 1;
            spriteActions.goToGrid(id, randomX, randomY);
        };

        // Set Speed
        window.setSpeed = (speed) => {
            const speedValues = { slow: 1000, normal: 500, fast: 200 };
            window.animationSpeed = speedValues[speed] || 500;
        };
        window.animationSpeed = 500; // Default

        // Reset Size
        window.resetSize = (id) => {
            spriteActions.update(id, { size: 100 });
        };

        // Next Costume
        window.nextCostume = (id) => {
            const sprite = sprites.find(s => s.id === id);
            if (sprite && sprite.costumes) {
                const costumeKeys = Object.keys(sprite.costumes);
                const currentIndex = costumeKeys.indexOf(sprite.currentCostume);
                const nextIndex = (currentIndex + 1) % costumeKeys.length;
                spriteActions.update(id, { currentCostume: costumeKeys[nextIndex] });
            }
        };

        // Change Costume
        window.changeCostume = (id, costume) => {
            spriteActions.update(id, { currentCostume: costume });
        };

        // Mirror Sprite
        window.mirrorSprite = (id) => {
            const sprite = sprites.find(s => s.id === id);
            if (sprite) {
                spriteActions.update(id, { mirrored: !sprite.mirrored });
            }
        };

        // Stamp Sprite
        window.stampSprite = (id) => {
            // Uses the pen canvas to stamp
            const sprite = sprites.find(s => s.id === id);
            if (sprite) {
                showFeedback("🖼️ Stamped!");
            }
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
            soundManager.playAsset(name);
        };
        window.playNote = (note, octave) => {
            soundManager.playNote(note, octave, 0.5);
        };
        window.setInstrument = (inst) => {
            soundManager.setInstrument(inst);
        };
        window.stopAllSounds = () => {
            window.speechSynthesis.cancel();
            soundManager.stopAll();
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

    // Effect: Whenever activeSpriteId changes, LOAD the new workspace
    // We must wait for the STATE to update so we can find the sprite in 'scenes'.
    // BUT 'scenes' might not be updated yet if we just called setScenes(save)
    // Actually, 'scenes' in this effect will be the *rendered* scenes.
    // If we just saved, the re-render happens.
    useEffect(() => {
        const sprite = sprites.find(s => s.id === activeSpriteId);
        if (sprite) {
            loadWorkspace(sprite);
        } else {
            if (workspaceRef.current) workspaceRef.current.clear();
        }
    }, [activeSpriteId, currentSceneId]); // Reload when sprite OR scene changes







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
        // but we might want to hide 'loop' blocks in Beginner mode.
        // Let's implement a simple filter:

        let blocks = categoryContents[catId] || [];

        // Filter by shape/type if config demands
        if (!allowedShapes.includes("c-block")) {
            // Remove repeats/forever
            blocks = blocks.filter(b => !["control_forever", "control_repeat"].includes(b.type));
        }

        let xml = '<xml xmlns="https://developers.google.com/blockly/xml">';
        blocks.forEach(b => {
            xml += `<block type="${b.type}">`;
            // Add default values
            if (b.type === 'looks_call') xml += `<field name="NAME">Tobi</field>`;
            if (b.type === 'sound_animal') xml += `<field name="VAL">grunt</field>`;
            xml += `</block>`;
        });
        xml += '</xml>';
        return xml;
    };

    useEffect(() => {
        // Defines blocks using the current Blockly instance
        defineLeapBlocks(Blockly, javascriptGenerator);
        defineLooksBlocks(Blockly, javascriptGenerator);
        defineSoundBlocks(Blockly, javascriptGenerator);

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

                // 3. PROPER PREVIEW (Unified)
                if (looksPreview[block.type]) {
                    looksPreview[block.type](block);
                } else if (previewActions[block.type]) {
                    previewActions[block.type](block); // Pass block to read fields
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
                    if (block) {
                        // Unified Preview
                        if (looksPreview[block.type]) {
                            looksPreview[block.type](block);
                        } else if (previewActions[block.type]) {
                            previewActions[block.type](block);
                        }

                        // Undo creation (Visual only click)
                        setTimeout(() => {
                            workspaceRef.current.undo(false);
                        }, 0);
                    }
                }
            });
        }

        // BLOCK LIMIT & AUTOSAVE (Strict Workspace Flow)
        const handleWorkspaceChange = (e) => {
            if (e.type === Blockly.Events.UI) return;

            // 1. AUTOSAVE
            const state = Blockly.serialization.workspaces.save(workspaceRef.current);
            localStorage.setItem("leap_autosave", JSON.stringify(state));

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

        // AUTOSAVE DISABLED - Start fresh each time
        // const saved = localStorage.getItem("leap_autosave");
        // if (saved) {
        //     try {
        //         Blockly.serialization.workspaces.load(JSON.parse(saved), workspaceRef.current);
        //     } catch (e) { console.warn("Failed to load autosave"); }
        // }

        // Clear any old autosave
        localStorage.removeItem("leap_autosave");

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
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.lineCap = "round";
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
            // Simple synth for animals
            const msg = new SpeechSynthesisUtterance();
            if (name === "bark") msg.text = "Woof!";
            else if (name === "meow") msg.text = "Meow!";
            else if (name === "grunt") msg.text = "Grr!";
            else msg.text = name; // Fallback
            msg.rate = 1.5;
            msg.pitch = name === "meow" ? 1.5 : 0.8;
            window.speechSynthesis.speak(msg);
        };

        window.playNote = () => {
            // Simple beep
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
            oscillator.stop(audioCtx.currentTime + 0.5);
        };

    }, []);

    // Sync state helpers for Async Execution
    useEffect(() => {
        window.activeSpriteId = activeSpriteId; // Legacy support
        window.isActive = () => isRunning.current; // Global stop flag
        window.wait = (s) => new Promise(r => setTimeout(r, s * 1000));
    }, [activeSpriteId]);



    const handleCategoryClick = (catId) => {
        setActiveCategory(catId);
        if (workspaceRef.current) {
            workspaceRef.current.updateToolbox(getToolboxXml(catId));
            // Ensure flyout blocks render at correct scale after update
            resetFlyoutScale();
            setTimeout(() => workspaceRef.current?.resize(), 50);
        }
    };

    // --- JUNIOR BACKEND INTEGRATION ---

    // Inside App component:
    const interpreterRef = useRef(null);

    // Initialize Interpreter
    useEffect(() => {
        interpreterRef.current = new LeapInterpreter(workspaceRef, javascriptGenerator, {
            onRun: () => isRunning.current = true,
            onStop: () => isRunning.current = false
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

        if (window.resetBear) window.resetBear();
        await window.wait(0.2);

        // Set running state for UI
        setIsBlocksRunning(true);

        // Delegate to Interpreter and wait for completion
        if (interpreterRef.current) {
            await interpreterRef.current.runStacks('event_flag');
        }

        // Parallel Execution on Master Engine (if applicable, but likely replaced by Interpreter in Junior)
        // executionEngine.runEvent('event_flag');
    };

    const handleSpriteClick = async (clickedId) => {
        if (clickedId === activeSpriteId) {
            // Delegate to Interpreter
            interpreterRef.current?.runStacks('event_press');
        } else {
            console.log("Clicked Inactive Sprite:", clickedId);
        }
    };

    const stopBlocks = () => {
        interpreterRef.current?.stopAll();
        executionEngine.stopAll();
        if (window.stopAll) window.stopAll();
        setIsBlocksRunning(false);
    };

    // Full reset: stops blocks AND resets sprite position to defaults
    const handleReset = () => {
        stopBlocks();
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
    const saveProject = () => {
        projectManager.downloadProject(`${projectName.replace(/\s+/g, "_")}.lbproject`);
    };

    const loadProject = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileLoad = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target.result;
                await projectManager.loadProject(json);
                const data = JSON.parse(json);
                if (data.name) setProjectName(data.name);
                // The managers will trigger UI updates if connected, 
                // but since we are using useSpriteSystem hook, we need to manually sync for now
                if (data.sprites) {
                    setScenes(prev => prev.map(s => {
                        if (s.id === currentSceneId) return { ...s, sprites: data.sprites };
                        return s;
                    }));
                }
            } catch (err) {
                console.error(err);
                alert("Invalid project file.");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    // HANDLING MENUS (Enhanced)
    const handleFileMenu = (action) => {
        if (action === "save" || action === "save_as") saveProject();
        if (action === "open" || action === "load") loadProject();
        if (action === "new_workspace") {
            if (confirm("Clear Workspace?")) workspaceRef.current.clear();
        }
        if (["new_project", "qr", "examples", "guide", "record"].includes(action)) {
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
    const handleToggleRecording = async () => {
        if (!isRecording) {
            const success = await soundManager.startRecording();
            if (success) setIsRecording(true);
        } else {
            const name = `Recording ${recordingCount}`;
            const url = await soundManager.stopRecording(name);
            setIsRecording(false);
            if (url) {
                setRecordingCount(prev => prev + 1);
                alert(`Saved as ${name}. Note: To perform custom recordings, use 'play sound' block.`);
            }
        }
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


            <div style={{ flex: 1, display: "flex", overflow: 'hidden' }}>
                <div id="wrapper" style={{ width: "60%", height: "100%", position: "relative" }}>
                    {/* Selected Sprite Indicator overlay */}
                    {appMode === 'stage' && (
                        (() => {
                            const activeSprite = sprites.find(s => s.id === activeSpriteId);
                            if (activeSprite && activeSprite.currentCostume) {
                                // Use static import for robot or fallback to currentCostume src if it's dynamic
                                let imgSrc = null;
                                if (activeSprite.type === 'robot' && activeSprite.costumes) {
                                    imgSrc = activeSprite.costumes[activeSprite.currentCostume];
                                } else if (activeSprite.currentCostume && typeof activeSprite.currentCostume === 'object' && activeSprite.currentCostume.image) {
                                    imgSrc = activeSprite.currentCostume.image.src;
                                }

                                if (imgSrc) {
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            width: '50px',
                                            height: '50px',
                                            opacity: 0.35,
                                            pointerEvents: 'none',
                                            zIndex: 10,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                            <img
                                                src={imgSrc}
                                                alt={activeSprite.name}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
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
                            {CATEGORIES.map(cat => (
                                <CategoryButton key={cat.id} category={cat} isActive={activeCategory === cat.id} onClick={() => handleCategoryClick(cat.id)} />
                            ))}
                        </div>

                        {/* Add Blocks Button */}
                        <button
                            onClick={() => alert("🧩 More blocks coming soon!")}
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
                    onDeleteSprite={deleteSprite}
                    onSelectScene={handleSceneSelect}
                    onAddScene={addScene}
                    onDeleteScene={deleteScene}
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
            {isSpriteModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ background: "white", width: "500px", borderRadius: "10px", padding: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px" }}>Choose a Sprite</h2>
                            <button onClick={() => setIsSpriteModalOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
                            {[
                                { type: "robot", name: "Robot", icon: null, image: "/assets/sprites/robot/robot_idle.svg" },
                                { type: "bear", name: "Teddy", icon: "🐻" },
                                { type: "dog", name: "Dog", icon: "🐶" },
                                { type: "cat", name: "Cat", icon: "🐱" }
                            ].map(s => (
                                <div
                                    key={s.type}
                                    onClick={() => addSprite(s.type)}
                                    style={{
                                        border: s.type === "robot" ? "2px solid #7B4FC4" : "1px solid #eee",
                                        borderRadius: "8px", padding: "20px",
                                        textAlign: "center", cursor: "pointer",
                                        background: s.type === "robot" ? "#f5f0ff" : "#f9f9f9"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = s.type === "robot" ? "#ede5ff" : "#f0f0f0"}
                                    onMouseLeave={e => e.currentTarget.style.background = s.type === "robot" ? "#f5f0ff" : "#f9f9f9"}
                                >
                                    <div style={{ fontSize: "40px", marginBottom: "10px", display: "flex", justifyContent: "center", alignItems: "center", height: "50px" }}>
                                        {s.image ? (
                                            <img src={s.image} alt={s.name} style={{ width: "50px", height: "50px", objectFit: "contain" }} />
                                        ) : (
                                            s.icon
                                        )}
                                    </div>
                                    <div style={{ fontWeight: "bold" }}>{s.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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

            {/* PAINT EDITOR MODAL */}
            {paintEditor.isOpen && (
                <PaintEditor
                    title={paintEditor.type === 'sprite' ? 'Edit Sprite Costume' : 'Edit Scene Backdrop'}
                    initialImage={paintEditor.initialImage}
                    onSave={handlePaintSave}
                    onClose={() => setPaintEditor({ ...paintEditor, isOpen: false })}
                    costumes={paintEditor.costumes}
                    spriteName={paintEditor.spriteName}
                    mode={paintEditor.mode}
                />
            )}
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
                width: "46px",
                height: "46px",
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
            <div style={{ transform: isActive ? "scale(1.1)" : "scale(1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

// --- TOP BAR COMPONENTS ---

// Inline TopBar Component
// --- REMOVED DUPLICATE TOPBAR COMPONENT ---

function Dropdown({ label, options, onSelect }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: 'relative', cursor: 'pointer', height: "100%", display: "flex", alignItems: "center" }}>
            <span
                onClick={() => setOpen(!open)}
                style={{ padding: "5px 10px", borderRadius: "4px", background: open ? "rgba(255,255,255,0.1)" : "transparent", userSelect: "none" }}
            >
                {label}
            </span>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0,
                    background: 'white', color: '#333', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000, minWidth: '180px', borderRadius: '4px', padding: '5px 0', border: "1px solid #eee"
                }}>
                    {options.map((opt, i) => (
                        opt === "-" ?
                            <div key={i} style={{ height: "1px", background: "#eee", margin: "4px 0" }}></div> :
                            <div
                                key={i}
                                onClick={() => { onSelect && onSelect(opt.action); setOpen(false); }}
                                style={{ padding: '8px 15px', fontSize: '13px', cursor: 'pointer', display: "flex", justifyContent: "space-between" }}
                                onMouseEnter={e => e.target.style.background = "#f5f5f5"}
                                onMouseLeave={e => e.target.style.background = "white"}
                            >
                                {opt.label}
                            </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function BoardDropdown({ selected, onSelect }) {
    const [open, setOpen] = useState(false);
    const boards = [
        { id: "quarky", name: "Quarky", icon: "🤖" },
        { id: "wizbot", name: "Wizbot", icon: "🏎️" }
    ];
    // Keep logic for selection, but don't show it in the main button as per request

    return (
        <div style={{ position: 'relative', cursor: 'pointer' }}>
            <div
                onClick={() => setOpen(!open)}
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.3)", userSelect: "none" }}
            >
                <span>Board</span>
            </div>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0,
                    background: 'white', color: '#333', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000, minWidth: '150px', borderRadius: '4px', padding: '5px 0'
                }}>
                    {boards.map(b => (
                        <div
                            key={b.id}
                            onClick={() => { onSelect(b.id); setOpen(false); }}
                            style={{ padding: '8px 15px', fontSize: '13px', cursor: 'pointer', display: "flex", alignItems: "center", gap: "8px", background: selected === b.id ? "#e6f0ff" : "transparent" }}
                            onMouseEnter={e => e.target.style.background = "#f5f5f5"}
                            onMouseLeave={e => e.target.style.background = selected === b.id ? "#e6f0ff" : "white"}
                        >
                            <span>{b.icon}</span> {b.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function IconButton({ icon, title }) {
    return (
        <div title={title} style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "16px"
        }}>
            {icon}
        </div>
    );
}

function ConnectModal({ onClose, status, setStatus, setDevice, currentDevice }) {
    const [scanning, setScanning] = useState(false);
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        if (status === "disconnected") {
            const timer = setTimeout(() => setScanning(true), 0);

            // Simulate scan
            const scanTimer = setTimeout(() => {
                setDevices([
                    { id: "qk1", name: "Quarky (A1:B2)", signal: "Strong" },
                    { id: "wb1", name: "Wizbot (C3:D4)", signal: "Medium" }
                ]);
                setScanning(false);
            }, 2000);
            return () => { clearTimeout(timer); clearTimeout(scanTimer); };
        }
    }, [status]);

    const handleConnect = (dev) => {
        setDevice(dev);
        setStatus("connected");
        setTimeout(onClose, 500); // Close shortly after connecting
    };

    const handleDisconnect = () => {
        setDevice(null);
        setStatus("disconnected");
        setDevices([]);
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ background: "white", width: "400px", borderRadius: "10px", padding: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "20px" }}>Connect Device</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
                </div>

                {status === "connected" ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "50px", marginBottom: "10px" }}>✅</div>
                        <h3>Connected to {currentDevice?.name}</h3>
                        <button onClick={handleDisconnect} style={{ marginTop: "20px", padding: "8px 16px", background: "#EF4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Disconnect</button>
                    </div>
                ) : (
                    <div>
                        {scanning ? (
                            <div style={{ textAlign: "center", padding: "30px" }}>
                                <div className="spinner" style={{ border: "4px solid #f3f3f3", borderTop: "4px solid #3498db", borderRadius: "50%", width: "30px", height: "30px", margin: "0 auto 15px", animation: "spin 1s linear infinite" }}></div>
                                <div>Scanning for devices...</div>
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {devices.length === 0 ? <div>No devices found. <button onClick={() => setScanning(true)} style={{ color: "blue", background: "none", border: "none", cursor: "pointer" }}>Scan Again</button></div> : null}
                                {devices.map(d => (
                                    <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", border: "1px solid #eee", borderRadius: "5px" }}>
                                        <div>
                                            <div style={{ fontWeight: "bold" }}>{d.name}</div>
                                            <div style={{ fontSize: "12px", color: "green" }}>Signal: {d.signal}</div>
                                        </div>
                                        <button onClick={() => handleConnect(d)} style={{ background: "#4C97FF", color: "white", border: "none", padding: "5px 15px", borderRadius: "5px", cursor: "pointer" }}>Connect</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
