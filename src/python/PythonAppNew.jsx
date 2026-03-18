import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── CSS Animations ───────────────────────────────────────────────────────────
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .run-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4) !important;
    }
    .run-button:active {
        transform: translateY(0);
    }
    .stop-button:hover {
        background: #EF4444 !important;
        color: #fff !important;
    }
    .terminal-line {
        animation: fadeIn 0.2s ease-out;
    }
`;
if (typeof document !== 'undefined' && !document.getElementById('python-ide-animations')) {
    animationStyles.id = 'python-ide-animations';
    document.head.appendChild(animationStyles);
}

import { SkulptEngine } from "../junior/engine/SkulptEngine";
import { FULL_CATALOG } from "../components/SpriteLibrary";
import { BackdropLibrary as BackdropLib } from "../components/BackdropLibrary";

// ─── Theme (Leapblocks Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    LIGHT_PURPLE: "#EDE9FE",
    PURPLE_BG: "#F5F3FF",
    BORDER: "#E5E7EB",
    BG: "#F9FAFB",
    BG2: "#F3F4F6",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
    RED: "#EF4444",
    BLUE: "#3B82F6",
    ORANGE: "#F59E0B",
    ACCENT: "#8B5CF6",
    HEADER_BG: "#8B5CF6",
};

// ─── Default Files ─────────────────────────────────────────────────────────────
const DEFAULT_FILES = {
    "main.py": `# LeapBlocks Python IDE
# Welcome! Control sprites with Python commands.

sprite = Sprite('Robot')
sprite.say("Hello, World!")
sprite.move(50)
sprite.turn_right()
sprite.go_to(100, 50)

for i in range(5):
    print(f"Step {i + 1}: moving sprite")
    sprite.move(20)

print("Program complete!")
`,
    "utils.py": `# Utility functions
def greet(name):
    return f"Hello, {name}!"

def add(a, b):
    return a + b

print(greet("LeapBlocks"))
print("2 + 3 =", add(2, 3))
`,
};


// ─── Sprite Library (from shared component) ─────────────────────────────────
const SPRITE_LIBRARY = FULL_CATALOG.map(sprite => ({
    name: sprite.name,
    img: sprite.image || sprite.emoji,
    type: sprite.id,
    costumes: sprite.costumes || [],
    category: sprite.category
}));

// ─── Backdrop Library (from shared component) ───────────────────────────────
const BACKDROP_LIBRARY = [
    { name: 'Blank', img: null, id: 'blank' },
    // Preset backdrops
    { name: 'Maze', img: '/assets/backdrops/maze.svg', id: 'maze' },
    { name: 'Park', img: '/assets/backdrops/park.svg', id: 'park' },
    { name: 'Underwater', img: '/assets/backdrops/underwater.svg', id: 'underwater' },
    { name: 'Space', img: '/assets/backdrops/space_bg.svg', id: 'space' },
    { name: 'City', img: '/assets/backdrops/city.svg', id: 'city' },
    { name: 'Arctic', img: '/assets/backdrops/Artic.png', id: 'arctic' },
    { name: 'Beach', img: '/assets/backdrops/Beach.png', id: 'beach' },
    { name: 'Castle', img: '/assets/backdrops/Castle.png', id: 'castle' },
    { name: 'Galaxy', img: '/assets/backdrops/Space.png', id: 'galaxy' },
];
const EXTENSIONS = [
    { id: 'music',   name: 'Music',            icon: '🎵', desc: 'Play notes and instruments', code: '# Music\nfrom music import play_note' },
    { id: 'pen',     name: 'Pen',              icon: '✏', desc: 'Draw lines on stage canvas',  code: '# Pen\nfrom pen import pen_down, pen_up' },
    { id: 'ml',      name: 'Machine Learning', icon: '🧠', desc: 'KNN classifier, image AI',    code: '# ML\nfrom ml import KNNClassifier' },
    { id: 'face',    name: 'Face Detection',   icon: '👁', desc: 'Detect faces via camera',      code: '# Face\nfrom face import FaceDetection' },
    { id: 'speech',  name: 'Speech',           icon: '🗣', desc: 'TTS and speech recognition',   code: '# Speech\nfrom speech import say, listen' },
    { id: 'iot',     name: 'IoT / Quarky',     icon: '⚡', desc: 'Control LEDs, sensors',        code: '# Quarky\nfrom quarky import Quarky' },
    { id: 'arduino', name: 'Arduino',          icon: '🔌', desc: 'Digital and analog pins',      code: '# Arduino\nfrom arduino import Arduino' },
];

// ─── Pip Package Registry (Skulpt-compatible stdlib modules + Advanced Libraries) ──
const PIP_PACKAGES = [
    // ── Built-in Standard Library Modules ──
    { name: "math", desc: "Mathematical functions", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "random", desc: "Random number generation", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "time", desc: "Time access & conversions", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "json", desc: "JSON encoder/decoder", installed: true, builtin: true, category: "core", version: "3.10", tags: ["data"] },
    { name: "re", desc: "Regular expressions", installed: true, builtin: true, category: "core", version: "3.10", tags: ["text"] },
    { name: "sys", desc: "System-specific parameters", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "os", desc: "Operating system interface", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "datetime", desc: "Date and time classes", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "collections", desc: "Container data types (deque, Counter, etc.)", installed: false, builtin: true, category: "core", version: "3.10", tags: ["data"] },
    { name: "itertools", desc: "Iterator building blocks", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "functools", desc: "Higher-order functions and operations", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "string", desc: "String constants and classes", installed: false, builtin: true, category: "core", version: "3.10", tags: ["text"] },
    { name: "operator", desc: "Standard operators as functions", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "copy", desc: "Shallow and deep copy operations", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "typing", desc: "Type hints support", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
    { name: "unittest", desc: "Unit testing framework", installed: false, builtin: true, category: "core", version: "3.10", tags: ["testing"] },
    { name: "csv", desc: "CSV file reading and writing", installed: false, builtin: true, category: "core", version: "3.10", tags: ["data"] },
    { name: "base64", desc: "Base64 encoding and decoding", installed: false, builtin: true, category: "core", version: "3.10", tags: ["encoding"] },
    { name: "hashlib", desc: "Secure hash and message digest", installed: false, builtin: true, category: "core", version: "3.10", tags: ["security"] },
    { name: "logging", desc: "Flexible logging facility", installed: false, builtin: true, category: "core", version: "3.10", tags: ["debug"] },
    { name: "argparse", desc: "Command-line argument parsing", installed: false, builtin: true, category: "core", version: "3.10", tags: ["cli"] },
    { name: "pathlib", desc: "Object-oriented filesystem paths", installed: false, builtin: true, category: "core", version: "3.10", tags: ["files"] },

    // ── Computer Vision & Image Processing ──
    { name: "opencv-python", desc: "OpenCV - Computer vision and image processing", installed: false, builtin: false, category: "computer-vision", version: "4.8.0", tags: ["vision", "image", "video"] },
    { name: "mediapipe", desc: "MediaPipe - ML solutions for vision, audio, and text", installed: false, builtin: false, category: "computer-vision", version: "0.10.8", tags: ["vision", "pose", "hands", "face", "gesture"] },
    { name: "pillow", desc: "PIL Fork - Image processing library", installed: false, builtin: false, category: "computer-vision", version: "10.1.0", tags: ["image", "processing"] },
    { name: "scikit-image", desc: "Image processing algorithms", installed: false, builtin: false, category: "computer-vision", version: "0.22.0", tags: ["vision", "processing"] },
    { name: "imageio", desc: "Image reading and writing library", installed: false, builtin: false, category: "computer-vision", version: "2.31.0", tags: ["image", "video"] },

    // ── Machine Learning & AI ──
    { name: "tensorflow", desc: "TensorFlow - Deep learning framework", installed: false, builtin: false, category: "machine-learning", version: "2.15.0", tags: ["ml", "deep-learning", "neural-networks"] },
    { name: "torch", desc: "PyTorch - Deep learning framework", installed: false, builtin: false, category: "machine-learning", version: "2.1.0", tags: ["ml", "deep-learning", "neural-networks"] },
    { name: "scikit-learn", desc: "Scikit-learn - Machine learning library", installed: false, builtin: false, category: "machine-learning", version: "1.3.2", tags: ["ml", "classification", "regression"] },
    { name: "numpy", desc: "NumPy - Numerical computing library", installed: false, builtin: false, category: "machine-learning", version: "1.26.2", tags: ["math", "arrays", "numerical"] },
    { name: "pandas", desc: "Pandas - Data analysis and manipulation", installed: false, builtin: false, category: "machine-learning", version: "2.1.4", tags: ["data", "analysis", "dataframe"] },
    { name: "matplotlib", desc: "Matplotlib - Plotting library", installed: false, builtin: false, category: "machine-learning", version: "3.8.2", tags: ["visualization", "plotting", "graphs"] },
    { name: "opencv-contrib-python", desc: "OpenCV with extra modules (SIFT, SURF, etc.)", installed: false, builtin: false, category: "computer-vision", version: "4.8.0", tags: ["vision", "advanced"] },

    // ── Speech & Audio ──
    { name: "speechrecognition", desc: "Speech Recognition - Convert speech to text", installed: false, builtin: false, category: "speech", version: "3.10.1", tags: ["speech", "audio", "stt"] },
    { name: "pyttsx3", desc: "pyttsx3 - Text-to-speech (offline)", installed: false, builtin: false, category: "speech", version: "2.90", tags: ["speech", "tts", "voice"] },
    { name: "gTTS", desc: "Google Text-to-Speech", installed: false, builtin: false, category: "speech", version: "2.5.0", tags: ["speech", "tts", "google"] },
    { name: "pyaudio", desc: "PyAudio - Audio I/O library", installed: false, builtin: false, category: "speech", version: "0.2.13", tags: ["audio", "microphone"] },
    { name: "librosa", desc: "Librosa - Audio analysis library", installed: false, builtin: false, category: "speech", version: "0.10.1", tags: ["audio", "music", "analysis"] },
    { name: "sounddevice", desc: "SoundDevice - Audio playback and recording", installed: false, builtin: false, category: "speech", version: "0.4.6", tags: ["audio", "playback"] },
    { name: "whisper", desc: "OpenAI Whisper - Speech recognition model", installed: false, builtin: false, category: "speech", version: "1.1.10", tags: ["speech", "ai", "transcription"] },

    // ── IoT & Hardware ──
    { name: "pyserial", desc: "PySerial - Serial port communication", installed: false, builtin: false, category: "iot", version: "3.5", tags: ["serial", "arduino", "hardware"] },
    { name: "pyfirmata", desc: "PyFirmata - Arduino communication protocol", installed: false, builtin: false, category: "iot", version: "2.3.8", tags: ["arduino", "firmata"] },
    { name: "rpi.gpio", desc: "RPi.GPIO - Raspberry Pi GPIO control", installed: false, builtin: false, category: "iot", version: "0.7.1", tags: ["raspberry-pi", "gpio"] },
    { name: "adafruit-circuitpython", desc: "Adafruit CircuitPython libraries", installed: false, builtin: false, category: "iot", version: "8.0.0", tags: ["adafruit", "circuitpython", "sensors"] },
    { name: "pymata4", desc: "PyMata4 - Arduino Firmata interface", installed: false, builtin: false, category: "iot", version: "3.04", tags: ["arduino", "iot"] },
    { name: "esptool", desc: "ESP Tool - ESP8266/ESP32 flash utility", installed: false, builtin: false, category: "iot", version: "4.7.0", tags: ["esp32", "esp8266", "flash"] },
    { name: "mpy-cross", desc: "MicroPython cross-compiler", installed: false, builtin: false, category: "iot", version: "1.21.0", tags: ["micropython", "embedded"] },
    { name: "smbus2", desc: "SMBus2 - I2C communication library", installed: false, builtin: false, category: "iot", version: "0.4.3", tags: ["i2c", "sensors", "hardware"] },

    // ── Robotics & Control ──
    { name: "roboticstoolbox-python", desc: "Robotics Toolbox - Robot modeling and control", installed: false, builtin: false, category: "hardware", version: "1.0.3", tags: ["robotics", "kinematics", "control"] },
    { name: "pynput", desc: "PyNput - Keyboard and mouse control", installed: false, builtin: false, category: "hardware", version: "1.7.6", tags: ["input", "automation", "control"] },
    { name: "pyvjoy", desc: "PyVJoy - Virtual joystick control", installed: false, builtin: false, category: "hardware", version: "1.0.5", tags: ["joystick", "gamepad", "control"] },
    { name: "gpiozero", desc: "GPIO Zero - GPIO device interface", installed: false, builtin: false, category: "hardware", version: "2.0", tags: ["gpio", "raspberry-pi", "sensors"] },

    // ── Networking & Communication ──
    { name: "requests", desc: "HTTP library for humans", installed: false, builtin: false, category: "utility", version: "2.31.0", tags: ["http", "api", "web"] },
    { name: "flask", desc: "Flask - Lightweight web framework", installed: false, builtin: false, category: "utility", version: "3.0.0", tags: ["web", "server", "api"] },
    { name: "websocket-client", desc: "WebSocket client library", installed: false, builtin: false, category: "utility", version: "1.7.0", tags: ["websocket", "real-time"] },
    { name: "paho-mqtt", desc: "Paho MQTT - IoT messaging protocol", installed: false, builtin: false, category: "iot", version: "1.6.1", tags: ["mqtt", "iot", "messaging"] },
    { name: "paramiko", desc: "Paramiko - SSH2 protocol library", installed: false, builtin: false, category: "utility", version: "3.4.0", tags: ["ssh", "remote", "networking"] },

    // ── Data Processing ──
    { name: "openpyxl", desc: "OpenPyXL - Excel file manipulation", installed: false, builtin: false, category: "utility", version: "3.1.2", tags: ["excel", "spreadsheet"] },
    { name: "pyyaml", desc: "PyYAML - YAML parser and emitter", installed: false, builtin: false, category: "utility", version: "6.0.1", tags: ["yaml", "config"] },
    { name: "lxml", desc: "lxml - XML and HTML processing", installed: false, builtin: false, category: "utility", version: "4.9.4", tags: ["xml", "html", "parsing"] },
    { name: "beautifulsoup4", desc: "Beautiful Soup - Web scraping library", installed: false, builtin: false, category: "utility", version: "4.12.2", tags: ["scraping", "html", "parsing"] },

    // ── GUI & Visualization ──
    { name: "tkinter", desc: "Tkinter - Standard GUI library", installed: false, builtin: true, category: "utility", version: "3.10", tags: ["gui", "desktop"] },
    { name: "pygame", desc: "Pygame - Game development library", installed: false, builtin: false, category: "utility", version: "2.5.2", tags: ["game", "graphics", "multimedia"] },
    { name: "plotly", desc: "Plotly - Interactive visualization", installed: false, builtin: false, category: "utility", version: "5.18.0", tags: ["visualization", "interactive", "graphs"] },
    { name: "seaborn", desc: "Seaborn - Statistical visualization", installed: false, builtin: false, category: "utility", version: "0.13.0", tags: ["visualization", "statistics"] },

    // ── Utilities ──
    { name: "python-dotenv", desc: "Environment variable management", installed: false, builtin: false, category: "utility", version: "1.0.0", tags: ["config", "env"] },
    { name: "schedule", desc: "Job scheduling library", installed: false, builtin: false, category: "utility", version: "1.2.1", tags: ["scheduling", "automation"] },
    { name: " watchdog", desc: "Filesystem events monitoring", installed: false, builtin: false, category: "utility", version: "3.0.0", tags: ["files", "monitoring"] },
    { name: "pillow-simd", desc: "Pillow with SIMD optimizations", installed: false, builtin: false, category: "computer-vision", version: "10.2.0", tags: ["image", "fast"] },
];

// ─── Import Components ─────────────────────────────────────────────────────────
import TopBar from "./layout/TopBar";
import ToolBar from "./layout/ToolBar";
import ActivityBar from "./layout/ActivityBar";
import SidePanel from "./panels/SidePanel";
import EditorPanel from "./panels/EditorPanel";
import StagePanel from "./panels/StagePanel";
import PromptModal from "./modals/PromptModal";
import SpriteLibraryModal from "./modals/SpriteLibraryModal";
import PythonIDEGuide from "./PythonIDEGuide";

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PythonApp({ onBack, onSwitchToNotebook, onSwitchToBlocks }) {
    // Editor state
    const [activeFile, setActiveFile] = useState("main.py");
    const [projectFiles, setProjectFiles] = useState(DEFAULT_FILES);
    const [editorCursor, setEditorCursor] = useState({ line: 1, col: 1 });
    const [showGuide, setShowGuide] = useState(false);
    const monacoRef = useRef(null);
    const stageRef = useRef(null);
    const [stageSize, setStageSize] = useState({ w: 300, h: 240 });
    useEffect(() => {
        if (!stageRef.current) return;
        const obs = new ResizeObserver(entries => {
            for (const e of entries) {
                setStageSize({ w: e.contentRect.width, h: e.contentRect.height });
            }
        });
        obs.observe(stageRef.current);
        return () => obs.disconnect();
    }, []);
    const editorRef = useRef(null);

    // Terminal / REPL
    const [activePanel, setActivePanel] = useState("terminal"); // "terminal" | "repl" | "debugger" | "pip"
    const [terminalOutput, setTerminalOutput] = useState([
        { text: "╔══════════════════════════════════════════════════════════════╗", type: "info", ts: new Date() },
        { text: "║  LeapBlocks Python IDE v1.0                                 ║", type: "info", ts: new Date() },
        { text: "║  ─────────────────────────────────────────────────────────── ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+Enter or F5 to run code                       ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Escape to stop execution                           ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+` to toggle REPL mode                         ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+S to save project                             ║", type: "info", ts: new Date() },
        { text: "╚══════════════════════════════════════════════════════════════╝", type: "info", ts: new Date() },
        { text: "", type: "info", ts: new Date() },
        { text: "Ready to run Python code. Click ▶ Run or press Ctrl+Enter.", type: "success", ts: new Date() },
    ]);
    const [replInput, setReplInput] = useState("");
    const [replHistory, setReplHistory] = useState([]);
    const [replHistIdx, setReplHistIdx] = useState(-1);
    const terminalEndRef = useRef(null);
    const replInputRef = useRef(null);
    const replGlobals = useRef({});

    // Run state
    const [isRunning, setIsRunning] = useState(false);

    // Debugger state
    const [debugBreakpoints, setDebugBreakpoints] = useState(new Set());
    const [debugVars, setDebugVars] = useState([]);
    const [debugLine, setDebugLine] = useState(null);

    // PIP
    const [packages, setPackages] = useState(PIP_PACKAGES);
    const [pipFilter, setPipFilter] = useState("");

    // Sprite / Stage
    const [sprites, setSprites] = useState([{
        id: 'robot-1', name: 'Robot', type: 'robot',
        x: 0, y: 0, angle: 90, size: 100, visible: true,
        speech: '', currentCostume: 'default',
        costumes: { 
            default: "/assets/sprites/robot/robot_idle.svg",
            wave1: "/assets/sprites/robot/robot_wave1.svg",
            wave2: "/assets/sprites/robot/robot_wave2.svg",
            talk: "/assets/sprites/robot/robot_talk1.svg"
        },
        mirrored: false
    }]);
    const [selectedSpriteId, setSelectedSpriteId] = useState('robot-1');
    const selectedSprite = sprites.find(s => s.id === selectedSpriteId);
    const [stageView, setStageView] = useState("stage");
    const [backdrop, setBackdropImg] = useState(null);
    const [sidePanel, setSidePanel] = useState("files");
    const [spriteFilter, setSpriteFilter] = useState("");
    const [installedExtensions, setInstalledExtensions] = useState([]);

    // Modal state
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        defaultValue: '',
        callback: null
    });
    const [modalInput, setModalInput] = useState('');
    
    // Sprite Library Modal state
    const [showSpriteLibrary, setShowSpriteLibrary] = useState(false);

    // Engine ref
    const skulptRef = useRef(null);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const addLog = useCallback((text, type = "log") => {
        setTerminalOutput(prev => [...prev, { text, type, ts: new Date() }]);
    }, []);

    const updateSprite = useCallback((name, props) => {
        setSprites(prev => prev.map(s =>
            s.name.toLowerCase() === name.toLowerCase() ? { ...s, ...props } : s
        ));
    }, []);

    // ── Skulpt Init ───────────────────────────────────────────────────────────
    useEffect(() => {
        // Expose updateSprite globally for Teddy component drag support
        window.updateSprite = (spriteId, updates) => {
            setSprites(prev => prev.map(s => {
                if (s.id !== spriteId) return s;
                const newProps = { ...s };
                // Handle function updates (like angle)
                Object.keys(updates).forEach(key => {
                    if (typeof updates[key] === 'function') {
                        newProps[key] = updates[key](s[key]);
                    } else if (key === 'x' || key === 'y') {
                        // Convert pixel coordinates to scratch coordinates
                        // Pixel x = (stageSize.w / 2) + (scratchX * (stageSize.w / 480)) - 40
                        // Solving for scratchX: scratchX = (pixelX - stageSize.w / 2 + 40) / (stageSize.w / 480)
                        const pixelVal = updates[key];
                        const scale = stageSize[key === 'x' ? 'w' : 'h'] / (key === 'x' ? 480 : 360);
                        const center = stageSize[key === 'x' ? 'w' : 'h'] / 2;
                        const offset = 40; // sprite half-size
                        newProps[key] = (pixelVal - center + offset) / scale;
                    } else {
                        newProps[key] = updates[key];
                    }
                });
                return newProps;
            }));
        };

        // Helper to convert pixel coordinates to scratch coordinates
        window.pixelToScratch = (pixelX, pixelY) => {
            const scratchX = (pixelX - stageSize.w / 2 + 40) / (stageSize.w / 480);
            const scratchY = (stageSize.h / 2 - pixelY - 40) / (stageSize.h / 360);
            return { x: scratchX, y: scratchY };
        };

        // Helper to convert scratch coordinates to pixel coordinates
        window.scratchToPixel = (scratchX, scratchY) => {
            const pixelX = (stageSize.w / 2) + (scratchX * (stageSize.w / 480)) - 40;
            const pixelY = (stageSize.h / 2) - (scratchY * (stageSize.h / 360)) - 40;
            return { x: pixelX, y: pixelY };
        };

        skulptRef.current = new SkulptEngine({
            onOut: (text) => addLog(text.replace(/\n$/, ""), "log"),
            onErr: (text) => addLog(text, "error"),
            actions: {
                moveRelative: (name, dir, steps) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() !== name.toLowerCase()) return s;
                        const d = steps || 20;
                        let dx = 0, dy = 0;
                        if (dir === "RIGHT") dx = d;
                        if (dir === "LEFT") dx = -d;
                        if (dir === "UP") dy = -d;
                        if (dir === "DOWN") dy = d;
                        return { ...s, x: s.x + dx, y: s.y + dy };
                    }));
                },
                moveSteps: (name, steps) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() !== name.toLowerCase()) return s;
                        const rad = (s.angle * Math.PI) / 180;
                        return { ...s, x: s.x + Math.cos(rad) * steps, y: s.y - Math.sin(rad) * steps };
                    }));
                },
                update: (name, props) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() !== name.toLowerCase()) return s;
                        const newProps = { ...s };
                        Object.keys(props).forEach(key => {
                            if (typeof props[key] === 'function') {
                                newProps[key] = props[key](s[key]);
                            } else if (key === 'nextCostume' && props[key]) {
                                // Handle next costume
                                const costumeKeys = Object.keys(s.costumes || {});
                                const currentIdx = costumeKeys.indexOf(s.currentCostume);
                                const nextIdx = (currentIdx + 1) % costumeKeys.length;
                                newProps.currentCostume = costumeKeys[nextIdx] || 'default';
                            } else {
                                newProps[key] = props[key];
                            }
                        });
                        return newProps;
                    }));
                },
                softResetAll: () => setSprites(prev => prev.map(s => ({ ...s, x: 0, y: 0, speech: '', angle: 90, size: 100, visible: true }))),
            }
        });
    }, [addLog, updateSprite]);

    // Auto-scroll terminal
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [terminalOutput]);

    // ── Keyboard Shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+Enter or F5: Run code
            if ((e.ctrlKey && e.key === 'Enter') || e.key === 'F5') {
                e.preventDefault();
                if (!isRunning) handleRun();
            }
            // Escape: Stop execution
            if (e.key === 'Escape' && isRunning) {
                e.preventDefault();
                handleStop();
            }
            // Ctrl+Shift+C: Clear terminal
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                handleClear();
            }
            // Ctrl+`: Toggle REPL
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setActivePanel(prev => prev === 'repl' ? 'terminal' : 'repl');
                if (activePanel !== 'repl') {
                    setTimeout(() => replInputRef.current?.focus(), 100);
                }
            }
            // Ctrl+S: Save (prevent browser save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                addLog("💾 Project auto-saved", "success");
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRunning, activePanel, handleRun, handleStop, handleClear, addLog]);

    // ── Run ───────────────────────────────────────────────────────────────────
    const handleRun = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setTerminalOutput([]);
        
        const startTime = performance.now();
        addLog(`▶ Running ${activeFile}...`, "info");
        addLog(`────────────────────────────────────────`, "info");
        
        // Reset stage
        if (skulptRef.current?.callbacks?.actions?.softResetAll) {
            skulptRef.current.callbacks.actions.softResetAll();
        }
        setDebugVars([]);
        setDebugLine(null);
        
        try {
            // Validate code before execution
            const code = projectFiles[activeFile];
            if (!code || code.trim() === '') {
                addLog("⚠ No code to execute. Write some Python code first!", "warning");
                setIsRunning(false);
                return;
            }
            
            // Check for common syntax issues
            const syntaxWarnings = checkSyntaxWarnings(code);
            if (syntaxWarnings.length > 0) {
                syntaxWarnings.forEach(w => addLog(`⚠ ${w}`, "warning"));
            }
            
            // Execute the code
            await skulptRef.current.runPython(code);
            
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(3);
            addLog(`────────────────────────────────────────`, "info");
            addLog(`✓ Program finished successfully in ${duration}s`, "success");
            
        } catch (e) {
            const errorMsg = typeof e === 'string' ? e : e?.message || e?.toString?.() || JSON.stringify(e) || "Unknown error";
            addLog(`────────────────────────────────────────`, "error");
            addLog(`✗ Execution Error:`, "error");
            addLog(formatErrorMessage(errorMsg), "error");
            
            // Provide helpful suggestions
            const suggestion = getErrorSuggestion(errorMsg);
            if (suggestion) {
                addLog(`💡 Tip: ${suggestion}`, "info");
            }
        } finally {
            setIsRunning(false);
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        addLog("⏹ Execution stopped by user.", "warning");
    };
    
    const handleClear = () => setTerminalOutput([]);
    
    // ── Syntax Warning Checker ────────────────────────────────────────────────
    const checkSyntaxWarnings = (code) => {
        const warnings = [];
        const lines = code.split('\n');
        
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            const trimmed = line.trim();
            
            // Check for common issues
            if (trimmed.includes('print ') && !trimmed.includes('print(') && !trimmed.startsWith('#')) {
                // Python 2 style print - Skulpt might handle this but warn
            }
            
            // Check for unmatched parentheses
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;
            if (openParens !== closeParens && !trimmed.endsWith(':') && !trimmed.startsWith('#')) {
                // Could be multi-line, so just note it
            }
            
            // Check for assignment in condition
            if (trimmed.match(/if\s+\w+\s*=\s*[^=]/)) {
                warnings.push(`Line ${lineNum}: Did you mean '==' instead of '=' in condition?`);
            }
        });
        
        return warnings;
    };
    
    // ── Error Message Formatter ───────────────────────────────────────────────
    const formatErrorMessage = (msg) => {
        // Clean up Skulpt error messages
        let formatted = msg
            .replace(/ParseError/g, 'Syntax Error')
            .replace(/NameError/g, 'Name Error')
            .replace(/TypeError/g, 'Type Error')
            .replace(/ValueError/g, 'Value Error')
            .replace(/AttributeError/g, 'Attribute Error')
            .replace(/ImportError/g, 'Import Error')
            .replace(/IndentationError/g, 'Indentation Error');
        
        // Add line number highlighting
        formatted = formatted.replace(/line (\d+)/gi, 'Line $1');
        
        return formatted;
    };
    
    // ── Error Suggestion Helper ───────────────────────────────────────────────
    const getErrorSuggestion = (errorMsg) => {
        const msg = errorMsg.toLowerCase();
        
        if (msg.includes('nameerror') || msg.includes('not defined')) {
            return "Check if the variable or function name is spelled correctly and defined before use.";
        }
        if (msg.includes('syntaxerror') || msg.includes('parseerror')) {
            return "Check for missing colons (:), parentheses, or quotes in your code.";
        }
        if (msg.includes('typeerror')) {
            return "Check if you're using the correct data types in your operation.";
        }
        if (msg.includes('indentationerror')) {
            return "Make sure your code indentation is consistent (use 4 spaces).";
        }
        if (msg.includes('attributeerror')) {
            return "Check if the object has the method or attribute you're trying to use.";
        }
        if (msg.includes('importerror') || msg.includes('module not found')) {
            return "The module might not be available in Skulpt. Try using built-in modules like math, random, or time.";
        }
        if (msg.includes('timeout') || msg.includes('too long')) {
            return "Your code might have an infinite loop. Check your while/for loops.";
        }
        
        return null;
    };

    // ── REPL ──────────────────────────────────────────────────────────────────
    const handleReplSubmit = async () => {
        const line = replInput.trim();
        if (!line) return;
        
        const newHist = [line, ...replHistory].slice(0, 50);
        setReplHistory(newHist);
        setReplHistIdx(-1);
        setReplInput("");
        
        addLog(`>>> ${line}`, "repl-in");
        
        try {
            const startTime = performance.now();
            await skulptRef.current.runRepl(line);
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(3);
            
            // Show execution time for REPL if > 100ms
            if (endTime - startTime > 100) {
                addLog(`⏱ Executed in ${duration}s`, "info");
            }
        } catch (e) {
            // Error already output via onErr
            const suggestion = getErrorSuggestion(e?.message || e);
            if (suggestion) {
                addLog(`💡 ${suggestion}`, "info");
            }
        }
        setActivePanel("terminal"); // Show output
    };

    const handleReplKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleReplSubmit();
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            const idx = Math.min(replHistIdx + 1, replHistory.length - 1);
            setReplHistIdx(idx);
            setReplInput(replHistory[idx] || "");
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const idx = Math.max(replHistIdx - 1, -1);
            setReplHistIdx(idx);
            setReplInput(idx === -1 ? "" : replHistory[idx]);
        }
        // Tab for autocomplete hint
        if (e.key === "Tab") {
            e.preventDefault();
            // Simple autocomplete for common commands
            const input = replInput.trim();
            const suggestions = {
                'pr': 'print()',
                'sp': 'sprite = Sprite("")',
                'im': 'import ',
                'fo': 'for i in range():',
                'wh': 'while :',
                'de': 'def ():',
                'cl': 'class :',
                'if': 'if :',
                'el': 'else:',
                'ei': 'elif :',
            };
            for (const [prefix, completion] of Object.entries(suggestions)) {
                if (input.startsWith(prefix)) {
                    setReplInput(completion);
                    break;
                }
            }
        }
    };

    // ── Modal Handlers ────────────────────────────────────────────────────────
    const openModal = (title, message, defaultValue, callback) => {
        setModalState({
            isOpen: true,
            title,
            message,
            defaultValue,
            callback
        });
        setModalInput(defaultValue);
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            title: '',
            message: '',
            defaultValue: '',
            callback: null
        });
        setModalInput('');
    };

    const handleModalSubmit = () => {
        if (modalState.callback) {
            modalState.callback(modalInput);
        }
        closeModal();
    };

    const handleModalCancel = () => {
        if (modalState.callback) {
            modalState.callback(null);
        }
        closeModal();
    };

    // ── File Management ────────────────────────────────────────────────────────
    const handleAddFile = () => {
        openModal(
            "New File",
            "Enter file name (e.g. helpers.py):",
            "",
            (name) => {
                if (!name) return;
                const fname = name.endsWith(".py") ? name : name + ".py";
                setProjectFiles(prev => ({ ...prev, [fname]: `# ${fname}\n` }));
                setActiveFile(fname);
            }
        );
    };

    const handleDeleteFile = (file) => {
        if (Object.keys(projectFiles).length <= 1) return;
        if (!confirm(`Delete ${file}?`)) return;
        setProjectFiles(prev => {
            const next = { ...prev };
            delete next[file];
            return next;
        });
        if (activeFile === file) setActiveFile(Object.keys(projectFiles).find(f => f !== file));
    };

    // ── PIP Package Installation ──────────────────────────────────────────────
    const handleInstall = (pkgName) => {
        const pkg = packages.find(p => p.name === pkgName);
        if (!pkg) return;

        // Mark package as installed
        setPackages(prev => prev.map(p => p.name === pkgName ? { ...p, installed: true } : p));

        // Provide appropriate feedback based on package type
        if (pkg.builtin) {
            addLog(`✓ ${pkgName} enabled (built-in module)`, "success");
            addLog(`  → Ready to import in your Python scripts`, "info");
        } else {
            addLog(`✓ ${pkgName} v${pkg.version || 'latest'} installed`, "success");
            
            // Add helpful import examples for popular libraries
            const importExamples = {
                "opencv-python": "import cv2  # OpenCV",
                "mediapipe": "import mediapipe as mp  # MediaPipe",
                "numpy": "import numpy as np  # NumPy",
                "pandas": "import pandas as pd  # Pandas",
                "pillow": "from PIL import Image  # Pillow",
                "tensorflow": "import tensorflow as tf  # TensorFlow",
                "torch": "import torch  # PyTorch",
                "scikit-learn": "from sklearn import *  # Scikit-learn",
                "matplotlib": "import matplotlib.pyplot as plt  # Matplotlib",
                "speechrecognition": "import speech_recognition as sr  # Speech Recognition",
                "pyttsx3": "import pyttsx3  # Text-to-Speech",
                "requests": "import requests  # HTTP requests",
                "flask": "from flask import Flask  # Flask web framework",
                "pyserial": "import serial  # Serial communication",
                "pygame": "import pygame  # Pygame",
            };

            if (importExamples[pkgName]) {
                addLog(`  → Use: ${importExamples[pkgName]}`, "info");
            }

            // Add category-specific tips
            if (pkg.category === "computer-vision") {
                addLog(`  → Tip: Requires camera access for real-time processing`, "info");
            } else if (pkg.category === "speech") {
                addLog(`  → Tip: Requires microphone access for audio input`, "info");
            } else if (pkg.category === "iot") {
                addLog(`  → Tip: Connect your hardware device before use`, "info");
            }
        }
    };


    // Sprite Library - add from library
    const addSpriteFromLibrary = (sp) => {
        const id = sp.name.toLowerCase() + '-' + Date.now();
        // Handle both formats: sp.img (old) or sp.image/sp.costumes (new from shared catalog)
        const spriteImage = sp.img || sp.image || sp.emoji || '🤖';
        const spriteCostumes = sp.costumes && sp.costumes.length > 0 
            ? sp.costumes.reduce((acc, c, i) => ({ ...acc, [`costume_${i}`]: c }), { default: spriteImage })
            : { default: spriteImage };
        const newSprite = { 
            id, 
            name: sp.name, 
            type: sp.type, 
            x: (Math.random()-0.5)*80, 
            y: (Math.random()-0.5)*80, 
            angle: 90, 
            size: 100, 
            visible: true, 
            speech: '', 
            currentCostume: 'default', 
            costumes: spriteCostumes 
        };
        setSprites(prev => [...prev, newSprite]);
        setSelectedSpriteId(id);
        const fname = sp.name + '.py';
        setProjectFiles(prev => prev[fname] ? prev : { ...prev, [fname]: "# " + sp.name + " sprite" + "\nsprite = Sprite('" + sp.name + "')" + "\nsprite.say('Hi! I am " + sp.name + "')" + "\nsprite.move_right(50)\n" });
        setActiveFile(fname);
        addLog('Added sprite: ' + sp.name, 'success');
        setSidePanel('files');
    };
    // Backdrop
    const handleSetBackdrop = (bd) => { setBackdropImg(bd.img || null); addLog('Backdrop: ' + bd.name, 'success'); setSidePanel('files'); };
    // CSV Upload
    const handleCSVUpload = () => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv';
        inp.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const fname = file.name.replace('.csv', '') + '_reader.py';
                const snippet = "import csv\n\n# Auto-generated reader for: " + file.name + "\nrows = []\nfor row in '" + file.name + "'.split(','):\n    rows.append(row)\nprint('Loaded', len(rows), 'items')\n";
                setProjectFiles(prev => ({ ...prev, [fname]: snippet }));
                setActiveFile(fname);
                addLog('CSV uploaded: ' + file.name, 'success');
            };
            reader.readAsText(file);
        };
        inp.click();
    };
    // Python Upload
    const handlePythonUpload = () => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.py';
        inp.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => { setProjectFiles(prev => ({ ...prev, [file.name]: ev.target.result })); setActiveFile(file.name); addLog('Imported: ' + file.name, 'success'); };
            reader.readAsText(file);
        };
        inp.click();
    };
    // Extension install
    const installExtension = (ext) => {
        if (installedExtensions.find(e => e.id === ext.id)) { addLog(ext.name + ' already installed', 'info'); return; }
        setInstalledExtensions(prev => [...prev, ext]);
        const snippet = "\n" + ext.code + "\n";
        setProjectFiles(prev => ({ ...prev, [activeFile]: (prev[activeFile] || '') + snippet }));
        addLog('Extension added: ' + ext.name, 'success');
    };
    // ── Utility ───────────────────────────────────────────────────────────────
    const updateSpriteProperty = (id, prop, value) => {
        const val = isNaN(value) ? value : Number(value);
        setSprites(prev => prev.map(s => s.id === id ? { ...s, [prop]: val } : s));
    };

    const resetStage = () => {
        setSprites(prev => prev.map(s => ({ ...s, x: 0, y: 0, angle: 90, speech: '', size: 100, visible: true })));
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{
            display: "flex", flexDirection: "column",
            height: "100vh", width: "100vw",
            background: C.BG, color: C.TEXT, overflow: "hidden",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>

            {/* ══ TOPBAR ══════════════════════════════════════════════════════ */}
            <TopBar 
                onBack={onBack}
                onSwitchToNotebook={onSwitchToNotebook}
                onSwitchToBlocks={onSwitchToBlocks}
                showGuide={showGuide}
                setShowGuide={setShowGuide}
                mode="python"
                setMode={(newMode) => {
                    if (newMode === "blocks" && onSwitchToBlocks) {
                        onSwitchToBlocks();
                    }
                }}
            />

            {/* ══ SECOND TOOLBAR ═══════════════════════════════════════════════ */}
            <ToolBar 
                isRunning={isRunning}
                onRun={handleRun}
                onStop={handleStop}
            />

            {/* ══ MAIN WORKSPACE ═══════════════════════════════════════════════ */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* ── GUIDE PANEL (slide in from right) ── */}
                {showGuide && (
                    <div style={{
                        position: "absolute", top: 48, right: 0, bottom: 0,
                        width: 440, zIndex: 200, boxShadow: "-4px 0 24px rgba(0,0,0,0.25)",
                        borderLeft: "1px solid #312e5a",
                    }}>
                        <PythonIDEGuide onClose={() => setShowGuide(false)} />
                    </div>
                )}

                {/* ── ACTIVITY BAR ── */}
                <ActivityBar 
                    sidePanel={sidePanel}
                    setSidePanel={setSidePanel}
                    setShowSpriteLibrary={setShowSpriteLibrary}
                    onCSVUpload={handleCSVUpload}
                    onPythonUpload={handlePythonUpload}
                />

                {/* ── LEFT SIDEBAR ── */}
                <SidePanel 
                    sidePanel={sidePanel}
                    projectFiles={projectFiles}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                    handleAddFile={handleAddFile}
                    handleDeleteFile={handleDeleteFile}
                    spriteFilter={spriteFilter}
                    setSpriteFilter={setSpriteFilter}
                    addSpriteFromLibrary={addSpriteFromLibrary}
                    SPRITE_LIBRARY={SPRITE_LIBRARY}
                    BACKDROP_LIBRARY={BACKDROP_LIBRARY}
                    backdrop={backdrop}
                    handleSetBackdrop={handleSetBackdrop}
                    EXTENSIONS={EXTENSIONS}
                    installedExtensions={installedExtensions}
                    installExtension={installExtension}
                    packages={packages}
                    pipFilter={pipFilter}
                    setPipFilter={setPipFilter}
                    handleInstall={handleInstall}
                    debugLine={debugLine}
                    debugVars={debugVars}
                />

                {/* ── EDITOR + TERMINAL ── */}
                <EditorPanel 
                    projectFiles={projectFiles}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                    editorCursor={editorCursor}
                    isRunning={isRunning}
                    onRun={handleRun}
                    onStop={handleStop}
                    onClear={handleClear}
                    activePanel={activePanel}
                    setActivePanel={setActivePanel}
                    terminalOutput={terminalOutput}
                    replInput={replInput}
                    setReplInput={setReplInput}
                    replHistory={replHistory}
                    replHistIdx={replHistIdx}
                    setReplHistory={setReplHistory}
                    setReplHistIdx={setReplHistIdx}
                    handleReplSubmit={handleReplSubmit}
                    handleReplKey={handleReplKey}
                    terminalEndRef={terminalEndRef}
                    replInputRef={replInputRef}
                    editorRef={editorRef}
                    monacoRef={monacoRef}
                    setProjectFiles={setProjectFiles}
                />

                {/* ── STAGE PANEL ── */}
                <StagePanel 
                    stageView={stageView}
                    setStageView={setStageView}
                    sprites={sprites}
                    selectedSpriteId={selectedSpriteId}
                    setSelectedSpriteId={setSelectedSpriteId}
                    backdrop={backdrop}
                    stageRef={stageRef}
                    stageSize={stageSize}
                    setShowSpriteLibrary={setShowSpriteLibrary}
                    updateSpriteProperty={updateSpriteProperty}
                    resetStage={resetStage}
                    BACKDROP_LIBRARY={BACKDROP_LIBRARY}
                    handleSetBackdrop={handleSetBackdrop}
                />
            </div>

            {/* Custom Prompt Modal */}
            <PromptModal 
                modalState={modalState}
                modalInput={modalInput}
                setModalInput={setModalInput}
                handleModalSubmit={handleModalSubmit}
                handleModalCancel={handleModalCancel}
            />

            {/* Sprite Library Modal */}
            <SpriteLibraryModal 
                showSpriteLibrary={showSpriteLibrary}
                setShowSpriteLibrary={setShowSpriteLibrary}
                SPRITE_LIBRARY={SPRITE_LIBRARY}
                addSpriteFromLibrary={addSpriteFromLibrary}
            />
        </div>
    );
}
