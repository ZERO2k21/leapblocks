import React, { useState, useRef, useEffect, useCallback } from "react";
import { StageProvider, useStage } from "../context/StageContext";
import Logo from "../components/Logo";

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

import { Play, Square, Undo, Redo, Save, Settings, Trash2, Maximize, Upload, Clock } from "lucide-react";
import { SkulptEngine } from "../junior/engine/SkulptEngine";
import { FULL_CATALOG } from "../components/SpriteLibrary";
import { createIntermediateBlocksBridge, useSpriteBridge, DEFAULT_SPRITE_PRESETS } from "./SpriteBridge";

// ─── Import Modular Components ─────────────────────────────────────────────────
import SidePanel from "./panels/SidePanel";
import EditorPanel from "./panels/EditorPanel";
import StagePanel from "./panels/StagePanel";
import PythonIDEGuide from "./PythonIDEGuide";

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

# Create and control the Robot sprite
robot = Sprite('Robot')
robot.say("Hello, World!")
robot.move(50)
robot.turn_right()
robot.go_to(100, 50)

# Create a Cat sprite
cat = Sprite('Cat')
cat.say("Meow!", 3)
cat.move(30)
cat.turn_left()

# Create a Ball sprite
ball = Sprite('Ball')
ball.go_to(-100, -50)
ball.say("I'm a ball!", 2)

# Animate the robot
for i in range(5):
    print(f"Step {i + 1}: moving robot")
    robot.move(20)
    robot.turn_right(15)

print("Program complete!")
`,
    "sprite_test.py": `# Sprite Bridge Test - Demonstrates sprite panel functions
# These functions work with intermediate blocks and Python IDE

print("=== Sprite Bridge Test ===")

# Create sprites
robot = Sprite('Robot')
cat = Sprite('Cat')
ball = Sprite('Ball')

# Test movement
robot.say("Hello from Python!")
robot.move(50)
robot.turn_right()
robot.go_to(100, 50)

# Test appearance
cat.say("Meow!", 3)
cat.set_size(150)
cat.next_costume()

# Test direction
ball.point_in_direction(90)
ball.move(30)

# Test visibility
robot.hide()
print("Robot hidden")
robot.show()
print("Robot shown")

# Test multiple movements
for i in range(3):
    robot.move(20)
    robot.turn_right(45)

print("=== Test Complete ===")
print("Check terminal for sprite action logs!")
`,
    "animation_demo.py": `# Animation Demo - Shows multiple sprites interacting

print("=== Animation Demo ===")

# Create characters
robot = Sprite('Robot')
cat = Sprite('Cat')
ball = Sprite('Ball')

# Position them
robot.go_to(0, 0)
cat.go_to(-100, 50)
ball.go_to(100, -50)

# Make them talk
robot.say("Let's dance!", 2)
cat.say("Meow! 🐱", 2)
ball.say("Wheee! ⚽", 2)

# Robot dance
for i in range(4):
    robot.move(30)
    robot.turn_right(90)
    robot.next_costume()

# Cat dance
cat.move(50)
cat.turn_left(180)
cat.move(50)
cat.turn_left(180)

# Ball bounce
for i in range(3):
    ball.move(40)
    ball.turn_right(180)
    ball.move(40)
    ball.turn_right(180)

print("Dance complete! 💃🕺")
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

const getUniqueFileName = (desiredName, existingFiles) => {
    const files = existingFiles || {};
    const hasExtension = /\.[^./\\]+$/.test(desiredName);
    const fallbackName = hasExtension ? desiredName : `${desiredName}.py`;
    const dotIndex = fallbackName.lastIndexOf(".");
    const base = dotIndex > 0 ? fallbackName.slice(0, dotIndex) : fallbackName;
    const extension = dotIndex > 0 ? fallbackName.slice(dotIndex) : "";

    let candidate = fallbackName;
    let suffix = 2;

    while (files[candidate]) {
        candidate = `${base}_${suffix}${extension}`;
        suffix += 1;
    }

    return candidate;
};

const buildAssetPlaceholder = (file, kind) => [
    `# Imported ${kind} asset`,
    `name = "${file.name}"`,
    `mime_type = "${file.type || "unknown"}"`,
    `size_bytes = ${file.size}`,
    "",
    "# Added from the Python file explorer.",
    "# Replace this placeholder with your own loading or processing code.",
].join("\n");
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
    { name: "watchdog", desc: "Filesystem events monitoring", installed: false, builtin: false, category: "utility", version: "3.0.0", tags: ["files", "monitoring"] },
    { name: "pillow-simd", desc: "Pillow with SIMD optimizations", installed: false, builtin: false, category: "computer-vision", version: "10.2.0", tags: ["image", "fast"] },
];

// ─── Main Component ────────────────────────────────────────────────────────────
function PythonApp({ onBack, onSwitchToNotebook, onSwitchToBlocks, onSwitchToCostumes }) {
    // Get shared stage state from context
    const {
        sprites,
        setSprites,
        selectedSpriteId,
        setSelectedSpriteId,
        selectedSprite,
        backdrop,
        setBackdrop: setBackdropImg,
        stageSize,
        stageRef,
        backdropLibrary,
        addSprite,
        deleteSprite,
        updateSprite,
        updateSpriteProperty,
        resetStage
    } = useStage();
    
    // Editor state
    const [activeFile, setActiveFile] = useState("main.py");
    const [projectFiles, setProjectFiles] = useState(DEFAULT_FILES);
    const [editorCursor, setEditorCursor] = useState({ line: 1, col: 1 });
    const [showGuide, setShowGuide] = useState(false);
    const monacoRef = useRef(null);
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
    
    const [sidePanel, setSidePanel] = useState("files");
    const [spriteFilter, setSpriteFilter] = useState("");
    const [installedExtensions, setInstalledExtensions] = useState([]);

    const modalState = { isOpen: false, title: "", message: "" };
    const modalInput = "";
    const setModalInput = () => undefined;
    const handleModalSubmit = () => undefined;
    const handleModalCancel = () => undefined;

    // Sprite Library Modal state
    const [showSpriteLibrary, setShowSpriteLibrary] = useState(false);

    // Engine ref
    const skulptRef = useRef(null);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const addLog = useCallback((text, type = "log") => {
        setTerminalOutput(prev => [...prev, { text, type, ts: new Date() }]);
    }, []);

    // ── Skulpt Init ───────────────────────────────────────────────────────────
    useEffect(() => {
        // Expose updateSprite globally for Teddy component drag support
        // Accepts either sprite ID or sprite name
        window.updateSprite = (spriteIdOrName, updates) => {
            setSprites(prev => prev.map(s => {
                // Match by ID or by name (case-insensitive)
                if (s.id !== spriteIdOrName && s.name.toLowerCase() !== String(spriteIdOrName).toLowerCase()) return s;
                
                const newProps = { ...s };
                
                // Handle position updates from drag (pixel coordinates)
                if (updates.x !== undefined || updates.y !== undefined) {
                    newProps.position = { ...(s.position || { x: s.x || 0, y: s.y || 0 }) };
                    
                    // Convert pixel coordinates to scratch coordinates
                    const scaleX = stageSize.w / 480;
                    const scaleY = stageSize.h / 360;
                    const centerX = stageSize.w / 2;
                    const centerY = stageSize.h / 2;
                    const offset = 40; // sprite half-size
                    
                    if (updates.x !== undefined) {
                        // scratchX = (pixelX - centerX + offset) / scaleX
                        newProps.position.x = (updates.x - centerX + offset) / scaleX;
                        newProps.x = newProps.position.x; // Also set legacy property
                    }
                    if (updates.y !== undefined) {
                        // Y is inverted: scratchY = (centerY - pixelY - offset) / scaleY
                        newProps.position.y = (centerY - updates.y - offset) / scaleY;
                        newProps.y = newProps.position.y; // Also set legacy property
                    }
                }
                
                // Handle other updates
                Object.keys(updates).forEach(key => {
                    if (key === 'x' || key === 'y') return; // Already handled above
                    if (typeof updates[key] === 'function') {
                        newProps[key] = updates[key](s[key]);
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
                initSprite: (name) => {
                    setSprites(prev => {
                        if (prev.find(s => s.name.toLowerCase() === name.toLowerCase())) return prev;
                        
                        // Add default sprite from library if found, else generic
                        const preset = DEFAULT_SPRITE_PRESETS[name.toLowerCase()] || { 
                            name, 
                            type: 'robot', // Default to robot type for initialization
                            costumes: { default: "/assets/sprites/robot/robot_idle.svg" }
                        };
                        
                        const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
                        const newSprite = { 
                            id, 
                            name: preset.name || name, 
                            type: preset.type || 'robot',
                            position: { x: (Math.random()-0.5)*40, y: (Math.random()-0.5)*40 },
                            direction: 0, 
                            size: 100, 
                            visible: true, 
                            speech: '', 
                            currentCostume: 'default', 
                            costumes: preset.costumes || { default: "/assets/sprites/robot/robot_idle.svg" },
                            mirrored: false
                        };
                        
                        addLog('Initialized sprite: ' + name, 'success');
                        return [...prev, newSprite];
                    });
                },
                moveRelative: (name, dir, steps) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() !== name.toLowerCase()) return s;
                        const d = steps || 20;
                        let dx = 0, dy = 0;
                        if (dir === "RIGHT") dx = d;
                        if (dir === "LEFT") dx = -d;
                        if (dir === "UP") dy = d;  // In Scratch, UP increases Y
                        if (dir === "DOWN") dy = -d; // In Scratch, DOWN decreases Y
                        const pos = s.position || { x: s.x || 0, y: s.y || 0 };
                        addLog(`➡️ ${name}: Move ${dir} ${d} steps`, 'info');
                        return { 
                            ...s, 
                            x: pos.x + dx, 
                            y: pos.y + dy,
                            position: { x: pos.x + dx, y: pos.y + dy }
                        };
                    }));
                },
                moveSteps: (name, steps) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() !== name.toLowerCase()) return s;
                        const angle = s.direction ?? s.angle ?? 0;
                        const rad = (angle * Math.PI) / 180;
                        const pos = s.position || { x: s.x || 0, y: s.y || 0 };
                        const newX = pos.x + Math.cos(rad) * steps;
                        const newY = pos.y + Math.sin(rad) * steps;
                        addLog(`🏃 ${name}: Move ${steps} steps (direction: ${angle}°)`, 'info');
                        return { 
                            ...s, 
                            x: newX, 
                            y: newY,
                            position: { x: newX, y: newY }
                        };
                    }));
                },
                update: (name, props) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() !== name.toLowerCase()) return s;
                        const newProps = { ...s };
                        const pos = s.position || { x: s.x || 0, y: s.y || 0 };
                        newProps.position = { ...pos };
                        
                        // Log sprite action to terminal
                        const actionType = Object.keys(props).join(', ');
                        addLog(`🤖 ${name}: ${actionType}`, 'info');
                        
                        Object.keys(props).forEach(key => {
                            if (typeof props[key] === 'function') {
                                const oldVal = key === 'direction' ? (s.direction ?? s.angle ?? 0) : 
                                               key === 'angle' ? (s.angle ?? s.direction ?? 0) :
                                               s[key];
                                const newVal = props[key](oldVal);
                                newProps[key] = newVal;
                                // Sync direction/angle
                                if (key === 'direction') newProps.angle = newVal;
                                if (key === 'angle') newProps.direction = newVal;
                            } else if (key === 'nextCostume' && props[key]) {
                                // Handle next costume
                                const costumeKeys = Object.keys(s.costumes || {});
                                const currentIdx = costumeKeys.indexOf(s.currentCostume);
                                const nextIdx = (currentIdx + 1) % costumeKeys.length;
                                newProps.currentCostume = costumeKeys[nextIdx] || 'default';
                                addLog(`🎭 ${name}: Changed costume to ${newProps.currentCostume}`, 'info');
                            } else if (key === 'position') {
                                // Merge position updates
                                newProps.position = { ...newProps.position, ...props[key] };
                                newProps.x = newProps.position.x;
                                newProps.y = newProps.position.y;
                            } else if (key === 'x') {
                                newProps.x = props[key];
                                newProps.position.x = props[key];
                            } else if (key === 'y') {
                                newProps.y = props[key];
                                newProps.position.y = props[key];
                            } else {
                                newProps[key] = props[key];
                                // Sync direction/angle
                                if (key === 'direction') newProps.angle = props[key];
                                if (key === 'angle') newProps.direction = props[key];
                            }
                        });
                        return newProps;
                    }));
                },
                softResetAll: () => setSprites(prev => prev.map(s => ({ 
                    ...s, 
                    x: 0, 
                    y: 0, 
                    position: { x: 0, y: 0 },
                    speech: '', 
                    angle: 0, 
                    direction: 0,
                    size: 100, 
                    visible: true 
                }))),
            }
        });

        // Create intermediate blocks bridge for sprite panel functions
        const spriteBridge = createIntermediateBlocksBridge(sprites, setSprites, selectedSpriteId, addLog);
        window.spriteBridge = spriteBridge;
        
        // Expose sprite panel functions globally for intermediate blocks
        window.spritePanelFunctions = {
            move: spriteBridge.move,
            moveRelative: spriteBridge.moveRelative,
            turn: spriteBridge.turn,
            goTo: spriteBridge.goTo,
            say: spriteBridge.say,
            think: spriteBridge.think,
            show: spriteBridge.show,
            hide: spriteBridge.hide,
            setSize: spriteBridge.setSize,
            changeSize: spriteBridge.changeSize,
            nextCostume: spriteBridge.nextCostume,
            switchCostume: spriteBridge.switchCostume,
            pointInDirection: spriteBridge.pointInDirection,
            getPosition: spriteBridge.getPosition,
            getDirection: spriteBridge.getDirection,
            getSize: spriteBridge.getSize,
            isVisible: spriteBridge.isVisible
        };

        return () => {
            delete window.spriteBridge;
            delete window.spritePanelFunctions;
        };
    }, [addLog, updateSprite, sprites, setSprites, selectedSpriteId]);

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

    // ── File Management ────────────────────────────────────────────────────────
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

    const openFilePicker = (accept, onSelect, options = {}) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.multiple = Boolean(options.multiple);
        if (options.capture) {
            input.setAttribute("capture", options.capture);
        }
        input.onchange = (event) => {
            const files = Array.from(event.target.files || []);
            if (!files.length) return;
            onSelect(options.multiple ? files : files[0]);
        };
        input.click();
    };

    const readTextFile = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(String(event.target?.result || ""));
            reader.onerror = () => reject(reader.error || new Error(`Unable to read ${file.name}`));
            reader.readAsText(file);
        });

    const addPreparedFilesToProject = (preparedFiles, successLabel) => {
        if (!preparedFiles.length) return;

        const importedNames = [];
        setProjectFiles((prev) => {
            const next = { ...prev };
            preparedFiles.forEach(({ name, content }) => {
                const nextFileName = getUniqueFileName(name, next);
                next[nextFileName] = content;
                importedNames.push(nextFileName);
            });
            return next;
        });

        const lastImported = importedNames[importedNames.length - 1];
        if (lastImported) {
            setActiveFile(lastImported);
        }
        setSidePanel("files");
        addLog(
            `${successLabel}: ${importedNames.join(", ")}`,
            "success"
        );
    };

    const importTextFiles = (accept, successLabel) => {
        openFilePicker(accept, async (files) => {
            try {
                const preparedFiles = await Promise.all(
                    files.map(async (file) => ({
                        name: file.name,
                        content: await readTextFile(file),
                    }))
                );

                addPreparedFilesToProject(preparedFiles, successLabel);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to import selected files.";
                addLog(message, "error");
            }
        }, { multiple: true });
    };

    const importAssetFiles = (accept, kind, successLabel) => {
        openFilePicker(accept, (files) => {
            const preparedFiles = files.map((file) => ({
                name: file.name,
                content: buildAssetPlaceholder(file, kind),
            }));

            addPreparedFilesToProject(preparedFiles, successLabel);
        }, { multiple: true });
    };

    const handleAddPythonFiles = () => {
        importTextFiles(".py", "Added python file");
    };

    const handleAddImageFiles = () => {
        importAssetFiles("image/*", "image", "Added image file");
    };

    const handleAddTextFiles = () => {
        importTextFiles(".txt,text/plain,.md,.json", "Added text file");
    };

    const handleAddCsvFiles = () => {
        importTextFiles(".csv,text/csv", "Added CSV file");
    };

    // ── PIP ───────────────────────────────────────────────────────────────────
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
        const id = sp.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        // Handle both formats: sp.img (old) or sp.image/sp.costumes (new from shared catalog)
        const spriteImage = sp.img || sp.image || sp.emoji || '/assets/sprites/robot/robot_idle.svg';
        const spriteCostumes = sp.costumes && sp.costumes.length > 0 
            ? sp.costumes.reduce((acc, c, i) => ({ ...acc, [`costume_${i}`]: c }), { default: spriteImage })
            : { default: spriteImage };
        const newSprite = { 
            id, 
            name: sp.name, 
            type: sp.type || 'sprite',
            position: { x: (Math.random()-0.5)*80, y: (Math.random()-0.5)*80 },
            direction: 0, 
            size: 100, 
            visible: true, 
            speech: '', 
            currentCostume: 'default', 
            costumes: spriteCostumes,
            mirrored: false
        };
        setSprites(prev => [...prev, newSprite]);
        setSelectedSpriteId(id);
        const fname = sp.name.replace(/\s+/g, '_') + '.py';
        setProjectFiles(prev => prev[fname] ? prev : { ...prev, [fname]: `# ${sp.name} sprite\n${sp.name.toLowerCase().replace(/\s+/g, '_')} = Sprite('${sp.name}')\n${sp.name.toLowerCase().replace(/\s+/g, '_')}.say('Hi! I am ${sp.name}')\n${sp.name.toLowerCase().replace(/\s+/g, '_')}.move(50)\n` });
        setActiveFile(fname);
        addLog('Added sprite: ' + sp.name, 'success');
        setSidePanel('files');
    };
    // Backdrop
    const handleSetBackdrop = (bd) => { 
        setBackdropImg(bd.img || null); 
        addLog('Backdrop: ' + bd.name, 'success'); 
        setSidePanel('files'); 
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
    // Note: updateSpriteProperty and resetStage are now provided by StageContext

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{
            display: "flex", flexDirection: "column",
            height: "100vh", width: "100vw",
            background: C.BG, color: C.TEXT, overflow: "hidden",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>

            {/* ══ TOPBAR (Junior/Intermediate style) ══════════════════════════════════════ */}
            <header style={{
                position: "sticky",
                top: 0,
                height: 44,
                background: "linear-gradient(180deg, #7B4FC4 0%, #5A2D82 100%)",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                justifyContent: "space-between",
                color: "#fff",
                zIndex: 100,
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={onBack}>
                        <Logo height={34} />
                        <span style={{ color: "#FFD500", fontSize: 14, fontWeight: 800, letterSpacing: "0.08em" }}>PYTHON</span>
                    </div>
                    <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)" }} />
                
                    {["File", "Edit", "Tutorials", "Board", "Connect"].map(m => (
                        <span key={m} style={{ fontSize: 12, cursor: "pointer", opacity: 0.9, padding: "4px 8px", borderRadius: 4 }}
                            onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.15)"; e.target.style.opacity = 1; }}
                            onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.opacity = 0.9; }}
                        >{m}</span>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Project name */}
                    <div style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <input defaultValue="My Project" style={{ background: "transparent", border: "none", color: "#fff", width: 90, outline: "none", fontSize: 12, fontWeight: 500 }} />
                        <Save size={12} style={{ opacity: 0.8, cursor: "pointer" }} />
                    </div>
                    {/* Mode/Stage/Upload buttons */}
                    <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ padding: "5px 10px", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mode</div>
                        <div style={{ padding: "5px 10px", background: "#4CAF50", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Stage</div>
                        <div style={{ padding: "5px 10px", background: "transparent", color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Upload</div>
                    </div>
                    <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)" }} />
                    {/* Upload Firmware button */}
                    <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 500 }}>
                        <Upload size={12} /> Upload Firmware
                    </button>
                    <div style={{ display: "flex", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Clock size={14} />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Maximize size={14} />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Settings size={14} />
                        </div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FF9800", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>
                        👤
                    </div>
                </div>
            </header>

            {/* ══ SECOND TOOLBAR (PictoBlox Style) ══════════════════════════════ */}
            <div style={{
                position: "sticky",
                top: 44,
                height: 42, background: "#fff", display: "flex",
                alignItems: "center", padding: "0 12px",
                justifyContent: "space-between", borderBottom: `1px solid ${C.BORDER}`,
                zIndex: 90,
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Blocks/Python tabs */}
                    <div style={{ display: "flex", background: "#E8E8E8", borderRadius: 4, overflow: "hidden" }}>
                        <div
                            onClick={() => {
                                if (onSwitchToBlocks) {
                                    onSwitchToBlocks();
                                }
                            }}
                            style={{ padding: "6px 14px", background: "#E8E8E8", color: "#666", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRight: "1px solid #ddd" }}
                        >Blocks</div>
                        <div style={{ padding: "6px 14px", background: "#6B46C1", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Python</div>
                    </div>
                    <div style={{ width: 1, height: 20, background: C.BORDER }} />
                    <div style={{ display: "flex", background: "#E8E8E8", borderRadius: 4, overflow: "hidden" }}>
                        <div
                            onClick={() => {
                                if (onSwitchToCostumes) {
                                    onSwitchToCostumes();
                                }
                            }}
                            style={{ padding: "6px 14px", background: "#E8E8E8", color: "#666", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRight: "1px solid #ddd" }}
                        >Costumes</div>
                        <div style={{ padding: "6px 14px", background: "#E8E8E8", color: "#666", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sounds</div>
                    </div>
                    <div style={{ width: 1, height: 20, background: C.BORDER }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Editing tools */}
                    <div style={{ display: "flex", gap: 2 }}>
                        <div title="Undo (Ctrl+Z)" style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }}>
                            <Undo size={16} />
                        </div>
                        <div title="Redo (Ctrl+Y)" style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }}>
                            <Redo size={16} />
                        </div>
                        <div title="Copy (Ctrl+C)" style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }}>
                            <span style={{ fontSize: 14 }}>📋</span>
                        </div>
                        <div title="Paste (Ctrl+V)" style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }}>
                            <span style={{ fontSize: 14 }}>📄</span>
                        </div>
                        <div title="Delete" style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }}>
                            <Trash2 size={16} />
                        </div>
                    </div>
                    <div style={{ width: 1, height: 20, background: C.BORDER }} />
                    {/* Quick Run Button (PictoBlox Green) */}
                    <div onClick={handleRun} title="Run Code (Ctrl+Enter or F5)"
                        className="run-button"
                        style={{
                            cursor: isRunning ? "not-allowed" : "pointer",
                            padding: "6px 14px",
                            background: isRunning ? "#9CA3AF" : "#4CAF50",
                            color: "#fff",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            transition: "all 0.2s",
                        }}>
                        {isRunning ? (
                            <>
                                <span style={{ animation: "spin 1s linear infinite" }}>⚙</span>
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <Play size={12} fill="#fff" />
                                <span>Run</span>
                            </>
                        )}
                    </div>
                    {/* Run All Button */}
                    <div onClick={handleRun} title="Run All"
                        style={{
                            cursor: "pointer",
                            padding: "6px 10px",
                            background: "#E8F5E9",
                            color: "#4CAF50",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            border: "1px solid #C8E6C9",
                        }}>
                        <Play size={10} fill="#4CAF50" />
                        <span>Run All</span>
                    </div>
                    {/* Stop Button (PictoBlox Red) */}
                    <div onClick={handleStop} title="Stop (Escape)"
                        className="stop-button"
                        style={{
                            cursor: "pointer",
                            padding: "6px 12px",
                            background: "#FFEBEE",
                            color: "#F44336",
                            border: "1px solid #FFCDD2",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            transition: "all 0.2s",
                        }}>
                        <Square size={10} fill="#F44336" />
                        <span>Stop</span>
                    </div>
                    <div style={{ width: 1, height: 20, background: C.BORDER }} />
                    {/* REPL Mode Toggle */}
                    <div style={{ 
                        padding: "5px 10px", 
                        background: "#F5F5F5", 
                        color: "#666",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1px solid #E0E0E0"
                    }}>
                        REPL Mode
                    </div>
                    <div title="Stop" style={{ cursor: "pointer", padding: "4px 6px", color: "#F44336", borderRadius: 4 }}>
                        <Square size={14} fill="#F44336" />
                    </div>
                    <div title="Clear" style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }}>
                        <Trash2 size={14} />
                    </div>
                </div>
            </div>

            {/* ══ MAIN WORKSPACE ═══════════════════════════════════════════════ */}
            <div style={{ flex: 1, display: "flex", overflow: "auto", minHeight: 0 }}>

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



                {/* ── LEFT SIDEBAR (PictoBlox Style) ── */}
                <SidePanel 
                    sidePanel={sidePanel}
                    setSidePanel={setSidePanel}
                    projectFiles={projectFiles}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                    handleAddPythonFiles={handleAddPythonFiles}
                    handleAddImageFiles={handleAddImageFiles}
                    handleAddTextFiles={handleAddTextFiles}
                    handleAddCsvFiles={handleAddCsvFiles}
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
                    handleReplSubmit={handleReplSubmit}
                    handleReplKey={handleReplKey}
                    terminalEndRef={terminalEndRef}
                    replInputRef={replInputRef}
                    editorRef={editorRef}
                    monacoRef={monacoRef}
                    setProjectFiles={setProjectFiles}
                    packages={packages}
                    pipFilter={pipFilter}
                    setPipFilter={setPipFilter}
                    handleInstall={handleInstall}
                />

                {/* ── STAGE PANEL ── */}
                <StagePanel 
                    sprites={sprites}
                    selectedSpriteId={selectedSpriteId}
                    setSelectedSpriteId={setSelectedSpriteId}
                    backdrop={backdrop}
                    stageRef={stageRef}
                    stageSize={stageSize}
                    setShowSpriteLibrary={setShowSpriteLibrary}
                    updateSpriteProperty={updateSpriteProperty}
                    BACKDROP_LIBRARY={BACKDROP_LIBRARY}
                    handleSetBackdrop={handleSetBackdrop}
                    deleteSprite={deleteSprite}
                />
            </div>

            {/* Custom Prompt Modal */}
            {modalState.isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        width: '400px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            backgroundColor: C.PURPLE,
                            color: 'white',
                            padding: '12px 16px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            {modalState.title}
                            <div
                                onClick={handleModalCancel}
                                style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
                            >×</div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#575E75' }}>
                                {modalState.message}
                            </div>
                            <input
                                autoFocus
                                type="text"
                                value={modalInput}
                                onChange={(e) => setModalInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleModalSubmit();
                                    if (e.key === 'Escape') handleModalCancel();
                                }}
                                style={{
                                    padding: '12px',
                                    fontSize: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    width: '100%',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            padding: '0 20px 20px',
                        }}>
                            <button onClick={handleModalCancel} style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#666',
                            }}>Cancel</button>
                            <button onClick={handleModalSubmit} style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: C.PURPLE,
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                            }}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sprite Library Modal */}
            {showSpriteLibrary && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        width: '600px',
                        maxHeight: '80vh',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            backgroundColor: C.PURPLE,
                            color: 'white',
                            padding: '12px 16px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            Choose a Sprite
                            <div
                                onClick={() => setShowSpriteLibrary(false)}
                                style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
                            >×</div>
                        </div>
                        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(5, 1fr)', 
                                gap: '12px' 
                            }}>
                                {SPRITE_LIBRARY.map(sp => (
                                    <div 
                                        key={sp.name} 
                                        onClick={() => {
                                            addSpriteFromLibrary(sp);
                                            setShowSpriteLibrary(false);
                                        }}
                                        style={{
                                            background: '#F5F0FF',
                                            border: '2px solid transparent',
                                            borderRadius: 10,
                                            padding: 12,
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = C.PURPLE;
                                            e.currentTarget.style.background = C.LIGHT_PURPLE;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.background = '#F5F0FF';
                                        }}
                                    >
                                        <img 
                                            src={sp.img} 
                                            alt={sp.name} 
                                            style={{ width: 48, height: 48, objectFit: 'contain' }} 
                                            onError={e => { e.target.style.display = 'none'; }} 
                                        />
                                        <div style={{ fontSize: 11, fontWeight: 600, color: C.TEXT, marginTop: 6 }}>
                                            {sp.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );  
}

// Wrap with StageProvider for shared state
export default function PythonAppWithProvider(props) {
    return (
        <StageProvider>
            <PythonApp {...props} />
        </StageProvider>
    );
}


