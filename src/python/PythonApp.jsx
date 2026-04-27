/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { StageProvider, useStage } from "../context/StageContext";
import Logo, { CreoleapLogo } from "../components/Logo";
import {
    Home,
    Play,
    Square,
    Undo,
    Redo,
    Save,
    Settings,
    Trash2,
    Maximize,
    Upload,
    Clock,
    Cpu,
    RefreshCw,
    Plus,
    FileText,
    Terminal,
    TerminalSquare,
    ClipboardList,
    Loader,
    LoaderCircle,
    CheckCircle,
    CheckCircle2,
    Library,
    LibraryBig,
    FileUp,
    Zap,
    Plug,
    FileCode2,
    AlertCircle,
    ChevronDown,
    FolderOpen,
    File,
    Share,
} from "lucide-react";
import { fileService } from "../services/FileService";
import { SkulptEngine } from "../leapignite/server/engine/SkulptEngine";
import { FULL_CATALOG } from "../components/SpriteLibrary";
import SerialMonitor from "../components/SerialMonitor";
import { createIntermediateBlocksBridge, useSpriteBridge, getDefaultSpritePresets } from "./SpriteBridge";
import BoardSelectionModal, { getBoards } from "../leapignite/client/components/BoardSelectionModal";

// ─── Import Modular Components ─────────────────────────────────────────────────
import SidePanel from "./panels/SidePanel";
import EditorPanel from "./panels/EditorPanel";
import StagePanel from "./panels/StagePanel";
import MonacoEditor from "./editor/MonacoEditor";
import StatusBar from "./editor/StatusBar";
import TerminalPanel from "./terminal/TerminalPanel";

// ─── Dropdown Menu (Glassmorphism) ────────────────────────────────────────────
function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onCloseRef.current();
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen]);

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'all 0.2s ease',
                    background: isOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
                    backdropFilter: isOpen ? 'blur(4px)' : 'none',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = isOpen ? 'rgba(255,255,255,0.18)' : 'transparent'; }}
            >
                {Icon && <Icon size={14} strokeWidth={2.2} style={{ opacity: 0.9 }} />}
                {label}
                <ChevronDown
                    size={12}
                    strokeWidth={2.5}
                    style={{
                        opacity: 0.5,
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    minWidth: 160,
                    overflow: 'hidden',
                    zIndex: 1000,
                    padding: '4px 0',
                    animation: 'pyMenuSlideIn 0.1s ease-out',
                }}>
                    <style>{`
                        @keyframes pyMenuSlideIn {
                            from { opacity: 0; transform: translateY(-4px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '4px 12px' }} />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: '7px 14px',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: 12,
                                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#bbb' : '#374151',
                                    transition: 'all 0.12s ease',
                                }}
                                onMouseEnter={e => {
                                    if (!item.disabled) {
                                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'; // Purple hover
                                        e.currentTarget.style.color = '#5A2D82';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = item.disabled ? '#bbb' : '#374151';
                                }}
                            >
                                {item.icon && <item.icon size={14} color="#7C3AED" strokeWidth={2} style={{ opacity: 0.8 }} />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 4px', borderRadius: 4 }}>
                                        {item.shortcut}
                                    </span>
                                )}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── CSS Animations ───────────────────────────────────────────────────────────
function injectPythonIDEAnimations() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('python-ide-animations')) return;
    const style = document.createElement('style');
    style.id = 'python-ide-animations';
    style.textContent = `
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
    document.head.appendChild(style);
}
injectPythonIDEAnimations();

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

// Map board IDs to names for template generation
// Lazy init to avoid TDZ when BOARDS is not yet initialized after scope hoisting
let _BOARD_NAME_BY_ID;
function getBoardNameById() {
    if (!_BOARD_NAME_BY_ID) {
        _BOARD_NAME_BY_ID = getBoards().reduce((acc, b) => {
            acc[b.id] = b.name;
            return acc;
        }, {});
    }
    return _BOARD_NAME_BY_ID;
}


// ─── Default Files ─────────────────────────────────────────────────────────────
const DEFAULT_FILES = {};


const BOARD_UPLOAD_CONFIG = {
    arduino_uno: {
        fileName: "arduino_uno.ino",
        fqbn: "arduino:avr:uno",
        runtimeLabel: "Arduino Uno",
    },
    arduino_mega: {
        fileName: "arduino_mega.ino",
        fqbn: "arduino:avr:mega",
        runtimeLabel: "Arduino Mega",
    },
    arduino_nano: {
        fileName: "arduino_nano.ino",
        fqbn: "arduino:avr:nano",
        runtimeLabel: "Arduino Nano",
    },
    esp32: {
        fileName: "esp32.cpp",
        fqbn: "esp32:esp32:esp32c3",
        runtimeLabel: "ESP32-C3",
    },
};

const getBoardConfig = (boardId) => BOARD_UPLOAD_CONFIG[boardId] || BOARD_UPLOAD_CONFIG.arduino_uno;

const getFileExtension = (fileName = "") => {
    const dotIndex = fileName.lastIndexOf(".");
    return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
};

const BOARD_HEADER_EXTENSIONS = new Set([".h", ".hpp"]);
const BOARD_SOURCE_EXTENSIONS = new Set([".ino", ".cpp", ".cc", ".c"]);

const isBoardUploadFile = (fileName, boardEntryFile) => {
    if (fileName === boardEntryFile) return true;
    const extension = getFileExtension(fileName);
    return BOARD_HEADER_EXTENSIONS.has(extension) || BOARD_SOURCE_EXTENSIONS.has(extension);
};

const sortUploadFiles = (fileNames, preferredFile) => [...fileNames].sort((left, right) => {
    if (left === preferredFile) return -1;
    if (right === preferredFile) return 1;
    return left.localeCompare(right);
});

const getLibraryBaseName = (rawName = "") => {
    const stripped = rawName.replace(/\.(h|hpp|cpp|cc|c)$/i, "").trim();
    const normalized = stripped.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    return normalized || "MyLibrary";
};

const getLibraryClassName = (baseName) => {
    const words = baseName.replace(/_/g, " ").split(/\s+/).filter(Boolean);
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("") || "MyLibrary";
};

const getUniqueLibraryBaseName = (rawName, existingFiles) => {
    const baseName = getLibraryBaseName(rawName);
    let candidate = baseName;
    let suffix = 2;

    while (
        existingFiles?.[`${candidate}.h`] ||
        existingFiles?.[`${candidate}.hpp`] ||
        existingFiles?.[`${candidate}.cpp`] ||
        existingFiles?.[`${candidate}.cc`] ||
        existingFiles?.[`${candidate}.c`]
    ) {
        candidate = `${baseName}_${suffix}`;
        suffix += 1;
    }

    return candidate;
};

const buildMicroPythonTemplate = (boardName) => `# LeapBlocks Python Upload Mode
# Project logic in MicroPython for ${boardName}.
# Keep board-specific firmware in the C++ file.

from machine import Pin
import time

status_led = Pin(2, Pin.OUT)

print("Booting ${boardName} project...")

for cycle in range(3):
    status_led.value(1)
    print("Cycle", cycle + 1, "- LED on")
    time.sleep(0.3)
    status_led.value(0)
    print("Cycle", cycle + 1, "- LED off")
    time.sleep(0.3)

print("Project ready.")
`;

const buildBoardTemplate = (boardId) => {
    if (boardId === "esp32") {
        return `// This C++ code is generated by LeapBlocks

#include <Arduino.h>

void setup() {
    // put your setup code here, to run once:

}

void loop() {
    // put your main code here, to run repeatedly:

}
`;
    }

    return `// This C++ code is generated by LeapBlocks

void setup() {
    // put your setup code here, to run once:

}

void loop() {
    // put your main code here, to run repeatedly:

}
`;
};

const buildLibraryHeaderTemplate = (rawName) => {
    const baseName = getLibraryBaseName(rawName);
    const className = getLibraryClassName(baseName);
    const includeGuard = `${baseName.toUpperCase()}_H`;

    return {
        fileName: `${baseName}.h`,
        content: `#ifndef ${includeGuard}
#define ${includeGuard}

class ${className} {
public:
    ${className}();
    void begin();
};

#endif
`,
    };
};

const buildLibraryCppTemplate = (rawName) => {
    const baseName = getLibraryBaseName(rawName);
    const className = getLibraryClassName(baseName);

    return {
        fileName: `${baseName}.cpp`,
        content: `#include "${baseName}.h"

${className}::${className}() {
}

void ${className}::begin() {
}
`,
    };
};

const normalizeCppInclude = (rawValue = "") => {
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) return "";

    if (trimmedValue.startsWith("#include")) {
        return trimmedValue.replace(/\s+/g, " ").trim();
    }

    if (trimmedValue.startsWith("<") || trimmedValue.startsWith("\"")) {
        return `#include ${trimmedValue}`;
    }

    const headerName = /\.[a-z0-9]+$/i.test(trimmedValue) ? trimmedValue : `${trimmedValue}.h`;
    return `#include <${headerName}>`;
};

const insertIncludeLineIntoSource = (sourceCode = "", includeLine) => {
    if (!includeLine) return sourceCode;
    const existingLines = sourceCode.split("\n");
    if (existingLines.some((line) => line.trim() === includeLine)) {
        return sourceCode;
    }

    let insertIndex = 0;
    while (insertIndex < existingLines.length) {
        const trimmedLine = existingLines[insertIndex].trim();

        if (
            !trimmedLine ||
            trimmedLine.startsWith("//") ||
            trimmedLine.startsWith("/*") ||
            trimmedLine.startsWith("*") ||
            trimmedLine.startsWith("*/")
        ) {
            insertIndex += 1;
            continue;
        }

        if (trimmedLine.startsWith("#include")) {
            while (insertIndex < existingLines.length && existingLines[insertIndex].trim().startsWith("#include")) {
                insertIndex += 1;
            }
        }
        break;
    }

    const nextLines = [...existingLines];
    nextLines.splice(insertIndex, 0, includeLine);
    return nextLines.join("\n");
};

const createUploadFiles = (boardId) => {
    const boardConfig = getBoardConfig(boardId);
    const boardName = getBoardNameById()[boardId] || boardConfig.runtimeLabel;

    return {
        "main.py": buildMicroPythonTemplate(boardName),
        [boardConfig.fileName]: buildBoardTemplate(boardId),
    };
};

const formatPortLabel = (port) => {
    if (!port) return "";
    if (port.path === "BRIDGE_DETECTED") {
        return `Driver issue: ${port.manufacturer || "Unknown bridge"}`;
    }
    return `${port.path}${port.manufacturer ? ` (${port.manufacturer})` : ""}`;
};


// ─── Sprite Library (from shared component) ─────────────────────────────────
// Lazy init to avoid TDZ when FULL_CATALOG is not yet initialized after scope hoisting
let _SPRITE_LIBRARY;
function getSpriteLibrary() {
    if (!_SPRITE_LIBRARY) {
        _SPRITE_LIBRARY = FULL_CATALOG.map(sprite => ({
            name: sprite.name,
            img: sprite.image || sprite.emoji,
            type: sprite.id,
            costumes: sprite.costumes || [],
            category: sprite.category
        }));
    }
    return _SPRITE_LIBRARY;
}

// ─── Backdrop Library (from shared component) ───────────────────────────────
const BACKDROP_LIBRARY = [
    { name: 'Blank', img: null, id: 'blank' },
    // Preset backdrops
    { name: 'Maze', img: 'assets/backdrops/maze.svg', id: 'maze' },
    { name: 'Park', img: 'assets/backdrops/park.svg', id: 'park' },
    { name: 'Underwater', img: 'assets/backdrops/underwater.svg', id: 'underwater' },
    { name: 'Space', img: 'assets/backdrops/space_bg.svg', id: 'space' },
    { name: 'City', img: 'assets/backdrops/city.svg', id: 'city' },
    { name: 'Arctic', img: 'assets/backdrops/Artic.png', id: 'arctic' },
    { name: 'Beach', img: 'assets/backdrops/Beach.png', id: 'beach' },
    { name: 'Castle', img: 'assets/backdrops/Castle.png', id: 'castle' },
    { name: 'Galaxy', img: 'assets/backdrops/Space.png', id: 'galaxy' },
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
    { id: 'music', name: 'Music', icon: '🎵', desc: 'Play notes and instruments', code: '# Music\nfrom music import play_note' },
    { id: 'pen', name: 'Pen', icon: '✏', desc: 'Draw lines on stage canvas', code: '# Pen\nfrom pen import pen_down, pen_up' },
    { id: 'ml', name: 'Machine Learning', icon: '🧠', desc: 'KNN classifier, image AI', code: '# ML\nfrom ml import KNNClassifier' },
    { id: 'face', name: 'Face Detection', icon: '👁', desc: 'Detect faces via camera', code: '# Face\nfrom face import FaceDetection' },
    { id: 'speech', name: 'Speech', icon: '🗣', desc: 'TTS and speech recognition', code: '# Speech\nfrom speech import say, listen' },
    { id: 'iot', name: 'IoT / Quarky', icon: '⚡', desc: 'Control LEDs, sensors', code: '# Quarky\nfrom quarky import Quarky' },
    { id: 'arduino', name: 'Arduino', icon: '🔌', desc: 'Digital and analog pins', code: '# Arduino\nfrom arduino import Arduino' },
];

// ─── Pip Package Registry (Skulpt-compatible stdlib modules + Advanced Libraries) ──
let _PIP_PACKAGES = null;
const getPipPackages = () => {
    if (!_PIP_PACKAGES) {
        _PIP_PACKAGES = [
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
    }
    return _PIP_PACKAGES;
};

// ─── Main Component ────────────────────────────────────────────────────────────
function PythonApp({ onBack, onSwitchToNotebook, onSwitchToBlocks, onSwitchToCostumes }) {
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
    const [projectName, setProjectName] = useState("My Project");
    const [workflowMode, setWorkflowMode] = useState("ide");
    const [activeFile, setActiveFile] = useState("");
    const [projectFiles, setProjectFiles] = useState(DEFAULT_FILES);
    const [editorCursor, setEditorCursor] = useState({ line: 1, col: 1 });
    const monacoRef = useRef(null);
    const editorRef = useRef(null);
    const [uploadView, setUploadView] = useState("project");
    const [selectedBoard, setSelectedBoard] = useState("arduino_uno");
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [uploadProjectFiles, setUploadProjectFiles] = useState(() => createUploadFiles("arduino_uno"));
    const [uploadActiveFile, setUploadActiveFile] = useState("main.py");
    const [uploadPanelTab, setUploadPanelTab] = useState("terminal");
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isUploadingFirmware, setIsUploadingFirmware] = useState(false);
    const [showBoardCppMenu, setShowBoardCppMenu] = useState(false);
    const [uploadProgressMessage, setUploadProgressMessage] = useState("");
    const [baudRate, setBaudRate] = useState(115200);
    const [lineEnding, setLineEnding] = useState("");
    const [serialMessages, setSerialMessages] = useState([]);
    const [uploadTerminalOutput, setUploadTerminalOutput] = useState([
        { text: "Python upload mode ready. Switch between MicroPython and board firmware files.", type: "info", ts: new Date() },
    ]);
    const [uploadLogMessages, setUploadLogMessages] = useState([
        "Upload mode initialized",
    ]);

    // ─── Project File Handlers ─────────────────────────────────────────────────────
    const fileInputRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    const handleNewProject = () => {
        if (!window.confirm("Create a new project? All unsaved work will be lost.")) return;
        setProjectName("My Project");
        setProjectFiles(DEFAULT_FILES);
        setActiveFile("");
        resetStage();
    };

    const handleSaveProject = () => {
        const payload = {
            projectFiles,
            activeFile,
            sprites,
            backdrop,
        };
        fileService.saveProject(projectName, "python", payload);
    };

    const handleOpenProject = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = '.leap,.lbproject,application/json';
            fileInputRef.current.click();
        }
    };

    const handleFileLoad = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await fileService.loadProject(file);
            const validation = fileService.validateProject(data, "python");
            if (!validation.isValid) {
                alert(validation.error);
                return;
            }

            setProjectName(data.projectName || "My Project");
            setProjectFiles(data.projectFiles || DEFAULT_FILES);
            setActiveFile(data.activeFile || "");

            if (data.sprites && Array.isArray(data.sprites) && data.sprites.length > 0) {
                setSprites(data.sprites);
                setSelectedSpriteId(data.sprites[0].id);
            } else {
                resetStage();
            }
            if (data.backdrop) setBackdropImg(data.backdrop);

        } catch (err) {
            alert('Failed to load project: ' + err.message);
        } finally {
            e.target.value = "";
        }
    };

    const handleShareProject = () => {
        const payload = {
            projectFiles,
            activeFile,
            sprites,
            backdrop,
        };
        fileService.shareProject(projectName, "python", payload);
    };

    // Terminal / REPL
    const [activePanel, setActivePanel] = useState("terminal"); // "terminal" | "repl" | "debugger" | "pip"
    const _isWebMode = !window.electronAPI?.isElectron;
    const [terminalOutput, setTerminalOutput] = useState([
        { text: "╔══════════════════════════════════════════════════════════════╗", type: "info", ts: new Date() },
        { text: "║  Leaplab CODEX.v1.0                                          ║", type: "info", ts: new Date() },
        { text: "║  ─────────────────────────────────────────────────────────── ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+Enter or F5 to run code                       ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Escape to stop execution                           ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+` to toggle REPL mode                         ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+S to save project                             ║", type: "info", ts: new Date() },
        { text: "╚══════════════════════════════════════════════════════════════╝", type: "info", ts: new Date() },
        { text: "", type: "info", ts: new Date() },
        {
            text: _isWebMode
                ? "🌐 Web Mode — Python runs in-browser via Skulpt. No install needed!"
                : "🖥 Desktop Mode — Native Python connected. Ready!",
            type: "success", ts: new Date()
        },
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
    const [packages, setPackages] = useState(() => getPipPackages());
    const [pipFilter, setPipFilter] = useState("");

    const [sidePanel, setSidePanel] = useState("files");
    const [spriteFilter, setSpriteFilter] = useState("");
    const [installedExtensions, setInstalledExtensions] = useState([]);

    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        defaultValue: "",
        onSubmit: null,
    });
    const [modalInput, setModalInput] = useState("");

    // Sprite Library Modal state
    const [showSpriteLibrary, setShowSpriteLibrary] = useState(false);
    const [libraryMode, setLibraryMode] = useState("sprite"); // "sprite" or "costume"

    // Engine ref
    const skulptRef = useRef(null);
    const boardCppMenuRef = useRef(null);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const addLog = useCallback((text, type = "log") => {
        setTerminalOutput(prev => [...prev, { text, type, ts: new Date() }]);
    }, []);

    const selectedBoardConfig = getBoardConfig(selectedBoard);
    const selectedBoardName = getBoardNameById()[selectedBoard] || selectedBoardConfig.runtimeLabel;
    const activeBoardFile = selectedBoardConfig.fileName;
    const protectedUploadFiles = new Set(["main.py", activeBoardFile]);
    const visibleUploadFiles = uploadView === "board"
        ? sortUploadFiles(
            Object.keys(uploadProjectFiles).filter((file) => isBoardUploadFile(file, activeBoardFile)),
            activeBoardFile
        )
        : sortUploadFiles(
            Object.keys(uploadProjectFiles).filter((file) => !isBoardUploadFile(file, activeBoardFile)),
            "main.py"
        );

    const addUploadMessage = useCallback((text, type = "info") => {
        setUploadTerminalOutput((prev) => [...prev, { text, type, ts: new Date() }]);
        setUploadLogMessages((prev) => [...prev, text]);
    }, []);

    const openTextPrompt = useCallback((title, message, defaultValue, onSubmit) => {
        setModalInput(defaultValue || "");
        setModalState({
            isOpen: true,
            title,
            message,
            defaultValue: defaultValue || "",
            onSubmit,
        });
    }, []);

    const onOpenAssetLibrary = useCallback((mode) => {
        setLibraryMode(mode || "sprite");
        setShowSpriteLibrary(true);
    }, []);

    const activeMode = activeFile === "stage.py" ? "stage" : (sprites.some(s => s.name.toLowerCase().replace(/\s+/g, '_') + '.py' === activeFile || s.id === activeFile) ? "sprite" : "mixed");

    const handleModalCancel = useCallback(() => {
        setModalState({
            isOpen: false,
            title: "",
            message: "",
            defaultValue: "",
            onSubmit: null,
        });
        setModalInput("");
    }, []);

    const handleModalSubmit = useCallback(() => {
        const nextValue = modalInput.trim();
        if (!nextValue) return;

        modalState.onSubmit?.(nextValue);
        handleModalCancel();
    }, [handleModalCancel, modalInput, modalState]);

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

                    // Convert pixel coordinates to leap coordinates
                    const scaleX = stageSize.w / 480;
                    const scaleY = stageSize.h / 360;
                    const centerX = stageSize.w / 2;
                    const centerY = stageSize.h / 2;
                    const offset = 40; // sprite half-size

                    if (updates.x !== undefined) {
                        // leapX = (pixelX - centerX + offset) / scaleX
                        newProps.position.x = (updates.x - centerX + offset) / scaleX;
                        newProps.x = newProps.position.x; // Also set legacy property
                    }
                    if (updates.y !== undefined) {
                        // Y is inverted: leapY = (centerY - pixelY - offset) / scaleY
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

        // Helper to convert pixel coordinates to leap coordinates
        window.pixelToleap = (pixelX, pixelY) => {
            const leapX = (pixelX - stageSize.w / 2 + 40) / (stageSize.w / 480);
            const leapY = (stageSize.h / 2 - pixelY - 40) / (stageSize.h / 360);
            return { x: leapX, y: leapY };
        };

        // Helper to convert leap coordinates to pixel coordinates
        window.leapToPixel = (leapX, leapY) => {
            const pixelX = (stageSize.w / 2) + (leapX * (stageSize.w / 480)) - 40;
            const pixelY = (stageSize.h / 2) - (leapY * (stageSize.h / 360)) - 40;
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
                        const preset = getDefaultSpritePresets()[name.toLowerCase()] || {
                            name,
                            type: 'robot', // Default to robot type for initialization
                            costumes: { default: "assets/sprites/robot/robot_idle.svg" }
                        };

                        const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
                        const newSprite = {
                            id,
                            name: preset.name || name,
                            type: preset.type || 'robot',
                            position: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                            direction: 0,
                            size: 100,
                            visible: true,
                            speech: '',
                            currentCostume: 'default',
                            costumes: preset.costumes || { default: "assets/sprites/robot/robot_idle.svg" },
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
                        if (dir === "UP") dy = d;  // In leap, UP increases Y
                        if (dir === "DOWN") dy = -d; // In leap, DOWN decreases Y
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

    // ── NATIVE PYTHON IPC LISTENERS ──────────────────────────────────────────
    useEffect(() => {
        if (!window.electronAPI?.isElectron) return;

        window.electronAPI.onPythonOutput((data) => {
            addLog(data.replace(/\n$/, ""), "log");
        });
        window.electronAPI.onPythonError((data) => {
            addLog(data, "error");
        });
        window.electronAPI.onPythonExit((code) => {
            if (code === 0) {
                addLog(`✓ Program finished successfully`, "success");
            } else if (code !== null) {
                addLog(`✗ Program exited with code ${code}`, "warning");
            }
            setIsRunning(false);
        });
        window.electronAPI.onPythonReplOutput((data) => {
            addLog(data.replace(/\n$/, ""), "log");
        });
        window.electronAPI.onPythonReplError((data) => {
            addLog(data, "error");
        });
        window.electronAPI.onPythonPipOutput((data) => {
            addLog(data.replace(/\n$/, ""), "log");
        });
        window.electronAPI.onPythonPipError((data) => {
            addLog(data, "error");
        });
    }, [addLog]);

    useEffect(() => {
        if (activePanel === "repl" && window.electronAPI?.isElectron) {
            window.electronAPI.pythonReplStart();
            addLog(`>>> Native Python REPL Connected.`, "success");
        } else if (activePanel === "repl" && !window.electronAPI?.isElectron) {
            addLog(`>>> Python REPL Ready (in-browser Skulpt engine).`, "success");
        }
    }, [activePanel, addLog]);

    // ── Run ───────────────────────────────────────────────────────────────────
    // NOTE: function declarations (not const arrows) so they hoist above the
    // keyboard-shortcuts useEffect that references them in its deps array.
    async function handleRun() {
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
            if (window.electronAPI?.isElectron) {
                await window.electronAPI.pythonRun(code);
            } else {
                await skulptRef.current.runPython(code);

                const endTime = performance.now();
                const duration = ((endTime - startTime) / 1000).toFixed(3);
                addLog(`────────────────────────────────────────`, "info");
                addLog(`✓ Program finished successfully in ${duration}s`, "success");
            }

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
            if (!window.electronAPI?.isElectron) {
                setIsRunning(false);
            }
        }
    }

    function handleStop() {
        setIsRunning(false);
        addLog("⏹ Execution stopped by user.", "warning");
        if (window.electronAPI?.isElectron) {
            window.electronAPI.pythonStop();
        }
    }

    function handleClear() { setTerminalOutput([]); }

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
            if (window.electronAPI?.isElectron) {
                await window.electronAPI.pythonReplSend(line);
            } else {
                const startTime = performance.now();
                await skulptRef.current.runRepl(line);
                const endTime = performance.now();
                const duration = ((endTime - startTime) / 1000).toFixed(3);

                // Show execution time for REPL if > 100ms
                if (endTime - startTime > 100) {
                    addLog(`⏱ Executed in ${duration}s`, "info");
                }
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

    const handleCreateNewFile = () => {
        let baseName = "new_file";
        let ext = ".py";
        let fileName = `${baseName}${ext}`;
        let counter = 1;
        while (projectFiles[fileName]) {
            fileName = `${baseName}${counter}${ext}`;
            counter++;
        }
        setProjectFiles((prev) => ({
            ...prev,
            [fileName]: "",
        }));
        setActiveFile(fileName);
        addLog(`Created new file: ${fileName}`, "success");
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

    const addPreparedFilesToUploadProject = (preparedFiles, successLabel, nextView = "project") => {
        if (!preparedFiles.length) return;

        const importedNames = [];
        setUploadProjectFiles((prev) => {
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
            setUploadView(nextView);
            setUploadActiveFile(lastImported);
        }

        addUploadMessage(`${successLabel}: ${importedNames.join(", ")}`, "success");
    };

    const handleCreateUploadPythonFile = () => {
        openTextPrompt(
            "New MicroPython File",
            "Enter a file name for the new MicroPython file.",
            "module.py",
            (requestedName) => {
                let createdFileName = "";

                setUploadProjectFiles((prev) => {
                    createdFileName = getUniqueFileName(requestedName, prev);
                    return {
                        ...prev,
                        [createdFileName]: `# ${createdFileName}\n\n`,
                    };
                });

                if (createdFileName) {
                    setUploadView("project");
                    setUploadActiveFile(createdFileName);
                    addUploadMessage(`Created ${createdFileName}`, "success");
                }
            }
        );
    };

    const handleAddUploadPythonFile = () => {
        openFilePicker(".py,.mpy", async (files) => {
            try {
                const selectedFiles = Array.isArray(files) ? files : [files];
                const preparedFiles = await Promise.all(
                    selectedFiles.map(async (file) => ({
                        name: file.name,
                        content: await readTextFile(file),
                    }))
                );

                addPreparedFilesToUploadProject(preparedFiles, "Imported MicroPython file", "project");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to import MicroPython files.";
                addUploadMessage(message, "error");
            }
        }, { multiple: true });
    };

    const handleCreateUploadLibrary = () => {
        openTextPrompt(
            "Add New Library",
            "Enter the library name. LeapBlocks will create matching .h and .cpp files.",
            "my_library",
            (requestedName) => {
                let headerFileName = "";

                setUploadProjectFiles((prev) => {
                    const uniqueBaseName = getUniqueLibraryBaseName(requestedName, prev);
                    const headerFile = buildLibraryHeaderTemplate(uniqueBaseName);
                    const cppFile = buildLibraryCppTemplate(uniqueBaseName);
                    headerFileName = headerFile.fileName;

                    return {
                        ...prev,
                        [headerFile.fileName]: headerFile.content,
                        [cppFile.fileName]: cppFile.content,
                    };
                });

                setUploadView("board");
                setUploadActiveFile(headerFileName || `${getLibraryBaseName(requestedName)}.h`);
                addUploadMessage("Created library files", "success");
            }
        );
    };

    const handleUploadHeaderFile = () => {
        openFilePicker(".h,.hpp", async (files) => {
            try {
                const selectedFiles = Array.isArray(files) ? files : [files];
                const preparedFiles = await Promise.all(
                    selectedFiles.map(async (file) => ({
                        name: file.name,
                        content: await readTextFile(file),
                    }))
                );
                addPreparedFilesToUploadProject(preparedFiles, "Imported header file", "board");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to import header files.";
                addUploadMessage(message, "error");
            }
        }, { multiple: true });
    };

    const handleUploadCppFile = () => {
        openFilePicker(".cpp,.cc,.c,.ino", async (files) => {
            try {
                const selectedFiles = Array.isArray(files) ? files : [files];
                const preparedFiles = await Promise.all(
                    selectedFiles.map(async (file) => ({
                        name: file.name,
                        content: await readTextFile(file),
                    }))
                );
                addPreparedFilesToUploadProject(preparedFiles, "Imported C++ file", "board");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to import C++ files.";
                addUploadMessage(message, "error");
            }
        }, { multiple: true });
    };

    const handleImportCppLibrary = () => {
        openTextPrompt(
            "Import C++ Library",
            'Enter a library header like Wire.h, <Servo.h>, or "MyLibrary.h".',
            "Wire.h",
            (requestedLibrary) => {
                const includeLine = normalizeCppInclude(requestedLibrary);
                const currentSource = uploadProjectFiles[activeBoardFile] || buildBoardTemplate(selectedBoard);
                const nextSource = insertIncludeLineIntoSource(currentSource, includeLine);

                setUploadProjectFiles((prev) => {
                    const previousSource = prev[activeBoardFile] || buildBoardTemplate(selectedBoard);
                    const updatedSource = insertIncludeLineIntoSource(previousSource, includeLine);

                    if (updatedSource === previousSource) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [activeBoardFile]: updatedSource,
                    };
                });
                setUploadView("board");
                setUploadActiveFile(activeBoardFile);

                if (nextSource === currentSource) {
                    addUploadMessage(`${includeLine} is already included in ${activeBoardFile}.`, "info");
                    return;
                }

                addUploadMessage(`Imported C++ library into ${activeBoardFile}: ${includeLine}`, "success");
            }
        );
    };

    const handleReplaceBoardFirmware = () => {
        openFilePicker(".ino,.cpp,.c,.h,.hpp", async (file) => {
            try {
                const content = await readTextFile(file);
                setUploadProjectFiles((prev) => ({
                    ...prev,
                    [activeBoardFile]: content,
                }));
                setUploadView("board");
                setUploadActiveFile(activeBoardFile);
                addUploadMessage(`Imported board firmware into ${activeBoardFile}`, "success");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to import board firmware.";
                addUploadMessage(message, "error");
            }
        });
    };

    const handleDeleteUploadFile = (file) => {
        if (protectedUploadFiles.has(file)) {
            addUploadMessage(`${file} is required in upload mode and cannot be deleted.`, "warning");
            return;
        }

        if (!window.confirm(`Delete ${file}?`)) return;

        setUploadProjectFiles((prev) => {
            const next = { ...prev };
            delete next[file];
            return next;
        });
        setUploadActiveFile("main.py");
        addUploadMessage(`Deleted ${file}`, "warning");
    };

    const boardCppActions = [
        {
            label: "Upload a header file",
            description: "Import .h or .hpp files into the board workspace.",
            icon: FileText,
            onClick: handleUploadHeaderFile,
        },
        {
            label: "Upload a new cpp file",
            description: "Add .cpp, .cc, .c, or .ino source files.",
            icon: FileUp,
            onClick: handleUploadCppFile,
        },
        {
            label: "Import C++ library",
            description: "Insert a #include statement into the main board file.",
            icon: LibraryBig,
            onClick: handleImportCppLibrary,
        },
    ];

    const handleUndoEditor = () => {
        editorRef.current?.trigger("python-upload-mode", "undo", null);
    };

    const handleRedoEditor = () => {
        editorRef.current?.trigger("python-upload-mode", "redo", null);
    };

    // ── PIP ───────────────────────────────────────────────────────────────────
    // ── PIP Package Installation ──────────────────────────────────────────────
    const handleInstall = (pkgName) => {
        const pkg = getPipPackages().find(p => p.name === pkgName);
        if (!pkg) return;

        // Mark package as installed
        setPackages(prev => prev.map(p => p.name === pkgName ? { ...p, installed: true } : p));

        // Provide appropriate feedback based on package type
        if (pkg.builtin) {
            addLog(`✓ ${pkgName} enabled (built-in module)`, "success");
            addLog(`  → Ready to import in your Python scripts`, "info");
        } else {
            addLog(`⏳ Installing ${pkgName} via pip...`, "info");
            setActivePanel("terminal");
            if (window.electronAPI?.isElectron) {
                window.electronAPI.pythonPipInstall(pkgName);
            } else {
                // Web mode: simulate install with feedback
                setTimeout(() => {
                    addLog(`✓ ${pkgName} registered (web mode)`, "success");
                    addLog(`  ⚠ Browser mode uses Skulpt — only built-in modules run natively.`, "warning");
                    addLog(`  → For full library support, use the LeapLab desktop app.`, "info");
                }, 600);
            }

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
        const spriteImage = sp.img || sp.image || sp.emoji || 'assets/sprites/robot/robot_idle.svg';
        const spriteCostumes = sp.costumes && sp.costumes.length > 0
            ? sp.costumes.reduce((acc, c, i) => ({ ...acc, [`costume_${i}`]: c }), { default: spriteImage })
            : { default: spriteImage };
        const newSprite = {
            id,
            name: sp.name,
            type: sp.type || 'sprite',
            position: { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 },
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

    useEffect(() => {
        setUploadProjectFiles((prev) => {
            if (prev[activeBoardFile]) return prev;
            return {
                ...prev,
                [activeBoardFile]: buildBoardTemplate(selectedBoard),
            };
        });
    }, [activeBoardFile, selectedBoard]);

    useEffect(() => {
        if (uploadView === "board") {
            if (!uploadProjectFiles[uploadActiveFile] || !isBoardUploadFile(uploadActiveFile, activeBoardFile)) {
                setUploadActiveFile(activeBoardFile);
            }
            return;
        }

        setShowBoardCppMenu(false);

        if (
            uploadActiveFile === activeBoardFile ||
            !uploadProjectFiles[uploadActiveFile] ||
            isBoardUploadFile(uploadActiveFile, activeBoardFile)
        ) {
            setUploadActiveFile("main.py");
        }
    }, [uploadView, activeBoardFile, uploadActiveFile, uploadProjectFiles]);

    useEffect(() => {
        if (workflowMode !== "upload" || uploadView !== "board" || !showBoardCppMenu) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (!boardCppMenuRef.current?.contains(event.target)) {
                setShowBoardCppMenu(false);
            }
        };

        window.addEventListener("mousedown", handlePointerDown);
        return () => window.removeEventListener("mousedown", handlePointerDown);
    }, [showBoardCppMenu, uploadView, workflowMode]);

    useEffect(() => {
        if (workflowMode !== "upload" && showBoardCppMenu) {
            setShowBoardCppMenu(false);
        }
    }, [showBoardCppMenu, workflowMode]);

    useEffect(() => {
        if (!window.electronAPI) return undefined;

        window.electronAPI.onSerialData((data) => {
            setSerialMessages((prev) => [...prev, data]);
        });

        window.electronAPI.onConnectionChange((connected) => {
            setIsConnected(connected);
            addUploadMessage(connected ? "Board connection opened." : "Board connection closed.", connected ? "success" : "warning");
        });

        window.electronAPI.onUploadProgress((progress, message) => {
            const nextMessage = `${progress}%: ${message}`;
            setUploadProgressMessage(nextMessage);
            setUploadTerminalOutput((prev) => {
                if (prev[prev.length - 1]?.text === nextMessage) {
                    return prev;
                }
                return [...prev, { text: nextMessage, type: "info", ts: new Date() }];
            });
        });

        return () => {
            window.electronAPI?.removeAllListeners?.();
        };
    }, [addUploadMessage]);

    const refreshPorts = useCallback(async () => {
        if (!window.electronAPI?.getPorts) {
            addUploadMessage("Serial support is unavailable in this renderer.", "warning");
            return;
        }

        try {
            const nextPorts = await window.electronAPI.getPorts();
            setPorts(nextPorts || []);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to scan serial ports.";
            addUploadMessage(message, "error");
        }
    }, [addUploadMessage]);

    useEffect(() => {
        if (workflowMode !== "upload") return undefined;

        refreshPorts();

        const timer = window.setInterval(() => {
            if (!selectedPort && !isConnected) {
                refreshPorts();
            }
        }, 5000);

        return () => window.clearInterval(timer);
    }, [workflowMode, selectedPort, isConnected, refreshPorts]);

    const handleConnectToBoard = useCallback(async () => {
        if (!window.electronAPI) {
            addUploadMessage("Serial support is unavailable in this renderer.", "warning");
            return;
        }

        if (isConnected) {
            const disconnectResult = await window.electronAPI.disconnectPort();
            if (disconnectResult?.success) {
                setIsConnected(false);
                addUploadMessage(`Disconnected from ${selectedPort || "board"}.`, "warning");
            } else {
                addUploadMessage(disconnectResult?.error || "Unable to disconnect from the current board.", "error");
            }
            return;
        }

        if (!selectedPort) {
            addUploadMessage("Select a COM port before connecting.", "warning");
            return;
        }

        if (selectedPort === "BRIDGE_DETECTED") {
            addUploadMessage("A USB bridge was detected without a usable COM port. Install the required driver first.", "error");
            return;
        }

        const connectResult = await window.electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
        if (connectResult?.success) {
            setIsConnected(true);
            addUploadMessage(`Connected to ${selectedPort}.`, "success");
        } else {
            addUploadMessage(connectResult?.error || "Unable to connect to the selected port.", "error");
        }
    }, [addUploadMessage, baudRate, isConnected, selectedBoard, selectedPort]);

    const handleSendSerial = useCallback(async (message) => {
        if (!window.electronAPI?.sendSerial) {
            addUploadMessage("Serial support is unavailable in this renderer.", "warning");
            return;
        }

        try {
            await window.electronAPI.sendSerial(message);
            setSerialMessages((prev) => [...prev, `> ${message}`]);
        } catch (error) {
            const nextMessage = error instanceof Error ? error.message : "Unable to send serial data.";
            addUploadMessage(nextMessage, "error");
        }
    }, [addUploadMessage]);

    const handleUploadFirmware = useCallback(async () => {
        if (!window.electronAPI?.uploadCode) {
            addUploadMessage("Upload support is unavailable in this renderer.", "warning");
            return;
        }

        if (!selectedPort) {
            addUploadMessage("Select a COM port before uploading.", "warning");
            return;
        }

        const boardCode = uploadProjectFiles[activeBoardFile] || "";
        if (!boardCode.trim()) {
            addUploadMessage(`No board firmware found in ${activeBoardFile}.`, "warning");
            return;
        }

        setUploadPanelTab("terminal");
        setIsUploadingFirmware(true);
        setUploadProgressMessage(`Preparing ${activeBoardFile}...`);
        addUploadMessage(`Uploading ${activeBoardFile} to ${selectedBoardName} on ${selectedPort}.`, "info");

        const shouldReconnect = isConnected;

        try {
            if (shouldReconnect) {
                await window.electronAPI.disconnectPort();
                setIsConnected(false);
            }

            const result = await window.electronAPI.uploadCode(
                boardCode,
                selectedPort,
                selectedBoardConfig.fqbn
            );

            if (result?.success) {
                setUploadProgressMessage("Upload complete.");
                addUploadMessage(`Upload complete for ${selectedBoardName}.`, "success");
            } else {
                const message = result?.error || "Upload failed.";
                setUploadProgressMessage(message);
                addUploadMessage(message, "error");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unexpected upload failure.";
            setUploadProgressMessage(message);
            addUploadMessage(message, "error");
        } finally {
            if (shouldReconnect && selectedPort) {
                const reconnectResult = await window.electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
                if (reconnectResult?.success) {
                    setIsConnected(true);
                    addUploadMessage(`Reconnected to ${selectedPort}.`, "success");
                }
            }
            setIsUploadingFirmware(false);
        }
    }, [activeBoardFile, addUploadMessage, baudRate, isConnected, selectedBoard, selectedBoardConfig.fqbn, selectedBoardName, selectedPort, uploadProjectFiles]);

    const handleWorkflowModeChange = (nextMode) => {
        if (nextMode === workflowMode) return;
        setWorkflowMode(nextMode);
        const modeLabels = { stage: "Stage", upload: "Upload", ide: "IDE" };
        addUploadMessage(`Switched to ${modeLabels[nextMode] || nextMode} mode.`, "info");
    };

    const handleUploadViewChange = (nextView) => {
        setUploadView(nextView);
        if (nextView === "board") {
            setUploadActiveFile(activeBoardFile);
        } else if (!visibleUploadFiles.includes(uploadActiveFile)) {
            setUploadActiveFile("main.py");
        }
    };

    const renderUploadOutput = () => {
        if (uploadPanelTab === "serial") {
            return (
                <SerialMonitor
                    baudRate={baudRate}
                    setBaudRate={setBaudRate}
                    lineEnding={lineEnding}
                    setLineEnding={setLineEnding}
                    messages={serialMessages}
                    setMessages={setSerialMessages}
                    onSendMessage={handleSendSerial}
                    isConnected={isConnected}
                />
            );
        }

        const lines = uploadPanelTab === "log"
            ? uploadLogMessages.map((text) => ({ text, type: "info" }))
            : uploadTerminalOutput;

        return (
            <div style={{
                flex: 1,
                overflowY: "auto",
                background: "#fff",
                padding: "12px 14px",
                fontFamily: "'Cascadia Code', Consolas, monospace",
                fontSize: 12,
                lineHeight: 1.55,
            }}>
                {lines.map((entry, index) => {
                    const type = entry.type || "info";
                    const color = type === "error"
                        ? "#D14343"
                        : type === "success"
                            ? "#2E7D32"
                            : type === "warning"
                                ? "#A56A00"
                                : "#4B5563";

                    return (
                        <div key={`${entry.text}-${index}`} style={{ color, marginBottom: 6 }}>
                            {entry.text}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderUploadWorkspace = () => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                <aside style={{
                    width: 278,
                    borderRight: `1px solid ${C.BORDER}`,
                    background: "#F7F7FB",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    position: "relative",
                }}>
                    <div style={{
                        padding: "10px 12px",
                        borderBottom: `1px solid ${C.BORDER}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.TEXT, letterSpacing: "0.04em" }}>
                                Project Files
                            </div>
                            <div style={{ fontSize: 10, color: C.MUTED, marginTop: 2 }}>
                                {uploadView === "board"
                                    ? "Main sketch, library headers, and C++ source files."
                                    : "Click a file, then type in the center editor."}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button
                                onClick={uploadView === "board" ? handleCreateUploadLibrary : handleCreateUploadPythonFile}
                                style={{
                                    border: `1px solid ${C.BORDER}`,
                                    background: "#fff",
                                    color: C.TEXT,
                                    borderRadius: 6,
                                    padding: "5px 8px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                {uploadView === "board" ? "New Library" : "New .py"}
                            </button>
                            <button
                                onClick={uploadView === "board" ? handleReplaceBoardFirmware : handleAddUploadPythonFile}
                                style={{
                                    border: "none",
                                    background: C.PURPLE,
                                    color: "#fff",
                                    borderRadius: 6,
                                    padding: "5px 8px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                {uploadView === "board" ? "Import Main" : "Import .py"}
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: uploadView === "board" ? "8px 0 132px" : "8px 0" }}>
                        {visibleUploadFiles.map((file) => {
                            const isBoardSource = file === activeBoardFile;
                            const isSelected = uploadActiveFile === file;
                            const fileExtension = getFileExtension(file);
                            const fileCategoryLabel = isBoardSource
                                ? selectedBoardName
                                : BOARD_HEADER_EXTENSIONS.has(fileExtension)
                                    ? "Header library"
                                    : BOARD_SOURCE_EXTENSIONS.has(fileExtension)
                                        ? "C++ source"
                                        : "MicroPython project";
                            return (
                                <div
                                    key={file}
                                    onClick={() => setUploadActiveFile(file)}
                                    style={{
                                        padding: "10px 12px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        borderLeft: isSelected ? `3px solid ${C.PURPLE}` : "3px solid transparent",
                                        background: isSelected ? "#EFE8FF" : "transparent",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                        <div style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 6,
                                            background: isBoardSource ? "#E3F2FD" : "#E8F5E9",
                                            color: isBoardSource ? "#1D4ED8" : "#2E7D32",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            {isBoardSource ? <FileCode2 size={13} /> : <FileText size={13} />}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: C.TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {file}
                                            </div>
                                            <div style={{ fontSize: 10, color: C.MUTED }}>
                                                {fileCategoryLabel}
                                            </div>
                                        </div>
                                    </div>
                                    {!protectedUploadFiles.has(file) && (
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleDeleteUploadFile(file);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: C.MUTED,
                                                cursor: "pointer",
                                                padding: 2,
                                            }}
                                            title="Delete file"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{
                        borderTop: `1px solid ${C.BORDER}`,
                        padding: 12,
                        background: "#FAFAFC",
                        display: "grid",
                        gap: 10,
                    }}>
                        <div style={{
                            border: `1px solid ${C.BORDER}`,
                            borderRadius: 10,
                            background: "#fff",
                            padding: 10,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <Cpu size={14} color={C.PURPLE} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.TEXT }}>Board</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.TEXT }}>{selectedBoardName}</div>
                            <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>{activeBoardFile}</div>
                        </div>
                        <div style={{
                            border: `1px solid ${C.BORDER}`,
                            borderRadius: 10,
                            background: "#fff",
                            padding: 10,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <Plug size={14} color={isConnected ? C.GREEN : C.MUTED} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.TEXT }}>Connection</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.TEXT }}>
                                {selectedPort ? formatPortLabel(ports.find((port) => port.path === selectedPort) || { path: selectedPort }) : "No port selected"}
                            </div>
                            <div style={{ fontSize: 11, color: isConnected ? C.GREEN : C.MUTED, marginTop: 2 }}>
                                {isConnected ? "Connected" : "Disconnected"}
                            </div>
                        </div>
                    </div>

                    {uploadView === "board" && (
                        <div style={{
                            position: "absolute",
                            left: 12,
                            bottom: 12,
                            zIndex: 2,
                        }}
                            ref={boardCppMenuRef}
                        >
                            {showBoardCppMenu && (
                                <div style={{
                                    position: "absolute",
                                    left: 0,
                                    bottom: 72,
                                    width: 236,
                                    display: "grid",
                                    gap: 8,
                                    padding: 10,
                                    borderRadius: 18,
                                    border: "1px solid rgba(123, 79, 196, 0.16)",
                                    background: "rgba(255, 255, 255, 0.98)",
                                    boxShadow: "0 20px 36px rgba(91, 45, 130, 0.22)",
                                    backdropFilter: "blur(16px)",
                                }}>
                                    {boardCppActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.label}
                                                onClick={() => {
                                                    setShowBoardCppMenu(false);
                                                    action.onClick();
                                                }}
                                                title={action.label}
                                                style={{
                                                    width: "100%",
                                                    border: "none",
                                                    borderRadius: 14,
                                                    padding: "10px 12px",
                                                    background: "#F8F5FF",
                                                    color: C.TEXT,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                }}
                                            >
                                                <div style={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 12,
                                                    background: "linear-gradient(180deg, #7B4FC4 0%, #5A2D82 100%)",
                                                    color: "#fff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}>
                                                    <Icon size={16} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>
                                                        {action.label}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: C.MUTED, marginTop: 2, lineHeight: 1.35 }}>
                                                        {action.description}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <button
                                onClick={() => setShowBoardCppMenu((prev) => !prev)}
                                title={showBoardCppMenu ? "Hide C++ tools" : "Show C++ tools"}
                                style={{
                                    width: 58,
                                    height: 58,
                                    borderRadius: "50%",
                                    border: "4px solid #F3E8FF",
                                    background: showBoardCppMenu
                                        ? "linear-gradient(180deg, #7B4FC4 0%, #5A2D82 100%)"
                                        : "#E91E63",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: showBoardCppMenu
                                        ? "0 12px 26px rgba(91, 45, 130, 0.3)"
                                        : "0 10px 24px rgba(233, 30, 99, 0.28)",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 800 }}>
                                    <Plus size={16} />
                                    <span>C++</span>
                                </div>
                            </button>
                        </div>
                    )}
                </aside>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        <div style={{
                            height: 34,
                            borderBottom: `1px solid ${C.BORDER}`,
                            background: uploadView === "board" ? "#FFFFFF" : "#F3F4F6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 12px",
                            fontSize: 12,
                            color: C.TEXT,
                            gap: 12,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                {uploadActiveFile === activeBoardFile ? <FileCode2 size={14} /> : <FileText size={14} />}
                                <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {uploadActiveFile}
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: C.MUTED }}>
                                {uploadActiveFile === activeBoardFile ? `${selectedBoardName} firmware` : "MicroPython project file"}
                            </div>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
                            <MonacoEditor
                                projectFiles={uploadProjectFiles}
                                activeFile={uploadActiveFile}
                                setProjectFiles={setUploadProjectFiles}
                                editorRef={editorRef}
                                monacoRef={monacoRef}
                                editorCursor={editorCursor}
                                isRunning={isUploadingFirmware}
                                onRun={handleUploadFirmware}
                                onCursorChange={setEditorCursor}
                                editorOptions={uploadView === "board" ? {
                                    fontSize: 16,
                                    fontFamily: "Consolas, 'Courier New', monospace",
                                    lineHeight: 30,
                                    glyphMargin: false,
                                    minimap: { enabled: false },
                                    lineNumbersMinChars: 3,
                                    overviewRulerLanes: 0,
                                    hideCursorInOverviewRuler: true,
                                    scrollbar: {
                                        verticalScrollbarSize: 10,
                                        horizontalScrollbarSize: 10,
                                    },
                                } : {
                                    minimap: { enabled: false },
                                }}
                            />
                        </div>

                        <div style={{
                            height: 26,
                            background: "#F3F4F6",
                            borderTop: `1px solid ${C.BORDER}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "0 12px",
                            fontSize: 11,
                            color: C.MUTED,
                            flexShrink: 0,
                        }}>
                            <span>{uploadActiveFile === activeBoardFile ? "Board C++" : "MicroPython"}</span>
                            <span>Ln {editorCursor.line}, Col {editorCursor.col}</span>
                            <span style={{ marginLeft: "auto" }}>
                                {uploadProgressMessage || "Ready to edit"}
                            </span>
                        </div>
                    </div>

                    <div style={{
                        height: 244,
                        borderTop: `1px solid ${C.BORDER}`,
                        background: "#F8F9FB",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px 0",
                            gap: 10,
                        }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                {[
                                    { id: "terminal", label: "Terminal", icon: TerminalSquare },
                                    { id: "log", label: "Log", icon: ClipboardList },
                                    { id: "serial", label: "Serial Monitor", icon: Plug },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const active = uploadPanelTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setUploadPanelTab(tab.id)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                border: active ? `1px solid ${C.PURPLE}` : `1px solid ${C.BORDER}`,
                                                background: active ? "#F3EEFF" : "#fff",
                                                color: active ? C.PURPLE : C.TEXT,
                                                borderRadius: 8,
                                                padding: "7px 12px",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            <Icon size={14} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleUploadFirmware}
                                disabled={isUploadingFirmware}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    border: "none",
                                    background: isUploadingFirmware ? "#C4B5FD" : C.PURPLE,
                                    color: "#fff",
                                    borderRadius: 8,
                                    padding: "9px 14px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: isUploadingFirmware ? "not-allowed" : "pointer",
                                }}
                            >
                                {isUploadingFirmware ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={15} />}
                                {isUploadingFirmware ? "Uploading..." : "Upload Code"}
                            </button>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, padding: "10px 12px 12px" }}>
                            <div style={{ height: "100%", border: `1px solid ${C.BORDER}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                                {renderUploadOutput()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
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
                height: 60,
                background: "#0a015a",//"#080a25",
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                justifyContent: "space-between",
                color: "#fff",
                zIndex: 100,
                flexShrink: 0,
                overflow: "hidden",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Back to Home"
                    >
                        <Home size={19} strokeWidth={2.2} />
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={onBack}>
                        <Logo height={50} />
                        <span style={{ color: "#ffffffff", fontSize: 17, fontWeight: 1000, letterSpacing: "0.08em", fontFamily: "'sego ui',Inter,system-ui,sans-serif" }}>CODEX</span>
                    </div>
                    <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.71)" }} />

                    <DropdownMenu
                        label="File"
                        isOpen={openMenuId === 'file'}
                        onToggle={() => setOpenMenuId(openMenuId === 'file' ? null : 'file')}
                        onClose={() => setOpenMenuId(null)}
                        items={[
                            { label: 'New Project', icon: File, onClick: handleNewProject, shortcut: 'Ctrl+N' },
                            { label: 'Open from your computer', icon: FolderOpen, onClick: handleOpenProject, shortcut: 'Ctrl+O' },
                            { divider: true },
                            { label: 'Save to your computer', icon: Save, onClick: handleSaveProject, shortcut: 'Ctrl+S' },
                            { divider: true },
                            { label: 'Share', icon: Share, onClick: handleShareProject }
                        ]}
                    />

                    <DropdownMenu
                        label="Edit"
                        isOpen={openMenuId === 'edit'}
                        onToggle={() => setOpenMenuId(openMenuId === 'edit' ? null : 'edit')}
                        onClose={() => setOpenMenuId(null)}
                        items={[
                            { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => editorRef.current?.trigger('keyboard', 'undo', null) },
                            { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => editorRef.current?.trigger('keyboard', 'redo', null) },
                        ]}
                    />

                    {["Tutorials", "Board", "Connect"].map((menuLabel) => (
                        <span
                            key={menuLabel}
                            style={{ fontSize: 15, cursor: "pointer", opacity: 0.9, padding: "4px 8px", borderRadius: 4 }}
                            onClick={() => {
                                if (menuLabel === "Board") {
                                    setIsBoardModalOpen(true);
                                }
                                if (menuLabel === "Connect" && workflowMode === "upload") {
                                    handleConnectToBoard();
                                }
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.opacity = 1; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = 0.9; }}
                        >
                            {menuLabel}
                        </span>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                    {/* Project name */}
                    <div style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            style={{ background: "transparent", border: "none", color: "#fff", width: 90, outline: "none", fontSize: 14, fontWeight: 500 }}
                        />
                        <Save size={15} style={{ opacity: 0.8, cursor: "pointer" }} onClick={handleSaveProject} title="Save Project" />
                    </div>
                    {/* Mode/IDE/Stage/Upload buttons */}
                    <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ padding: "5px 10px", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Mode</div>
                        <button
                            onClick={() => handleWorkflowModeChange("ide")}
                            style={{
                                padding: "5px 10px",
                                background: workflowMode === "ide" ? "#7C3AED" : "transparent",
                                color: workflowMode === "ide" ? "#fff" : "rgba(255,255,255,0.8)",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: "pointer",
                                border: "none",
                            }}
                        >
                            IDE
                        </button>
                        <button
                            onClick={() => handleWorkflowModeChange("stage")}
                            style={{
                                padding: "5px 10px",
                                background: workflowMode === "stage" ? "#4CAF50" : "transparent",
                                color: workflowMode === "stage" ? "#fff" : "rgba(255,255,255,0.8)",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: "pointer",
                                border: "none",
                            }}
                        >
                            Stage
                        </button>
                        <button
                            onClick={() => handleWorkflowModeChange("upload")}
                            style={{
                                padding: "5px 10px",
                                background: workflowMode === "upload" ? "#4CAF50" : "transparent",
                                color: workflowMode === "upload" ? "#fff" : "rgba(255,255,255,0.8)",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: "pointer",
                                border: "none",
                            }}
                        >
                            Upload
                        </button>
                    </div>
                    <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)" }} />
                    {/* Upload Firmware button */}
                    <button
                        onClick={() => {
                            if (workflowMode !== "upload") {
                                handleWorkflowModeChange("upload");
                                return;
                            }
                            handleUploadFirmware();
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 500 }}
                    >
                        <Upload size={15} /> {workflowMode === "upload" ? "Upload Code" : "Open Upload"}
                    </button>
                    <div style={{ display: "flex", gap: 4 }}>
                        <div style={{ width: 38, height: 30, borderRadius: 4, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Maximize size={15} />
                        </div>
                        <div style={{ width: 38, height: 30, borderRadius: 4, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Settings size={15} />
                        </div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FF9800", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>
                        👤
                    </div>
                </div>

                {/* CREOLEAP Right Logo */}
                <div style={{
                    marginLeft: 12,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                }}>
                    <CreoleapLogo height={200} />
                </div>
            </header>

            {/* ══ SECOND TOOLBAR (PictoBlox Style) ══════════════════════════════ */}
            {workflowMode === "stage" ? (
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
                            <div title="Undo (Ctrl+Z)" onClick={() => editorRef.current?.trigger('keyboard', 'undo', null)} style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <Undo size={16} />
                            </div>
                            <div title="Redo (Ctrl+Y)" onClick={() => editorRef.current?.trigger('keyboard', 'redo', null)} style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <Redo size={16} />
                            </div>
                            <div title="Copy (Ctrl+C)" onClick={() => editorRef.current?.trigger('keyboard', 'editor.action.clipboardCopyAction', null)} style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: 14 }}>📋</span>
                            </div>
                            <div title="Paste (Ctrl+V)" onClick={() => editorRef.current?.trigger('keyboard', 'editor.action.clipboardPasteAction', null)} style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <span style={{ fontSize: 14 }}>📄</span>
                            </div>
                            <div title="Delete" onClick={() => { if (window.confirm('Clear active file?')) { const ed = editorRef.current; if (ed) { ed.setValue(''); } } }} style={{ cursor: "pointer", padding: "4px 6px", color: "#666", borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
            ) : workflowMode === "upload" ? (
                <div style={{
                    position: "sticky",
                    top: 44,
                    height: 48,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${C.BORDER}`,
                    zIndex: 90,
                    flexShrink: 0,
                    gap: 16,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", background: "#ECE7F8", border: `1px solid ${C.BORDER}` }}>
                            <button
                                onClick={() => handleUploadViewChange("project")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "7px 14px",
                                    border: "none",
                                    background: uploadView === "project" ? C.PURPLE : "transparent",
                                    color: uploadView === "project" ? "#fff" : C.TEXT,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                <FileText size={14} />
                                MicroPython
                            </button>
                            <button
                                onClick={() => handleUploadViewChange("board")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "7px 14px",
                                    border: "none",
                                    background: uploadView === "board" ? C.PURPLE : "transparent",
                                    color: uploadView === "board" ? "#fff" : C.TEXT,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                <FileCode2 size={14} />
                                Board C++
                            </button>
                        </div>
                        <div style={{ width: 1, height: 22, background: C.BORDER }} />
                        <button
                            onClick={() => setIsBoardModalOpen(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                border: `1px solid ${C.BORDER}`,
                                background: "#fff",
                                borderRadius: 8,
                                padding: "7px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                color: C.TEXT,
                                cursor: "pointer",
                            }}
                        >
                            <Cpu size={14} color={C.PURPLE} />
                            {selectedBoardName}
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <select
                            value={selectedPort}
                            onChange={(e) => setSelectedPort(e.target.value)}
                            style={{
                                border: `1px solid ${C.BORDER}`,
                                borderRadius: 8,
                                padding: "7px 10px",
                                fontSize: 12,
                                color: C.TEXT,
                                minWidth: 180,
                                outline: "none",
                                background: "#fff",
                            }}
                        >
                            <option value="">{ports.length ? "Select Port" : "No Ports Found"}</option>
                            {ports.map((port) => (
                                <option key={port.path} value={port.path}>
                                    {formatPortLabel(port)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={refreshPorts}
                            title="Refresh Ports"
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                border: `1px solid ${C.BORDER}`,
                                background: "#fff",
                                color: C.TEXT,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <RefreshCw size={15} />
                        </button>
                        <button
                            onClick={handleConnectToBoard}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                border: "none",
                                background: isConnected ? C.GREEN : "#EEF2FF",
                                color: isConnected ? "#fff" : C.TEXT,
                                borderRadius: 8,
                                padding: "8px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            <Plug size={14} />
                            {isConnected ? "Disconnect" : "Connect"}
                        </button>
                        <div style={{ width: 1, height: 22, background: C.BORDER }} />
                        <button onClick={handleUndoEditor} title="Undo" style={{ border: `1px solid ${C.BORDER}`, background: "#fff", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.TEXT }}>
                            <Undo size={15} />
                        </button>
                        <button onClick={handleRedoEditor} title="Redo" style={{ border: `1px solid ${C.BORDER}`, background: "#fff", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.TEXT }}>
                            <Redo size={15} />
                        </button>
                        <div style={{ width: 1, height: 22, background: C.BORDER }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: uploadProgressMessage ? C.TEXT : C.MUTED }}>
                            {uploadProgressMessage ? (
                                isUploadingFirmware ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={15} color={C.GREEN} />
                            ) : (
                                <AlertCircle size={15} color={C.MUTED} />
                            )}
                            <span>{uploadProgressMessage || "Board ready"}</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* IDE Mode Toolbar — VS Code inspired dark theme */
                <div style={{
                    position: "relative",
                    height: 42,
                    background: "#1e1e2e",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #313244",
                    zIndex: 100,
                    flexShrink: 0,
                }}>
                    {/* Left: File tabs */}
                    <div style={{ display: "flex", alignItems: "center", gap: 0, overflow: "hidden" }}>
                        {Object.keys(projectFiles).map((fname) => (
                            <div
                                key={fname}
                                onClick={() => setActiveFile(fname)}
                                style={{
                                    padding: "6px 14px",
                                    background: activeFile === fname ? "#2d2d3f" : "transparent",
                                    color: activeFile === fname ? "#cdd6f4" : "#6c7086",
                                    fontSize: 12,
                                    fontWeight: activeFile === fname ? 600 : 400,
                                    cursor: "pointer",
                                    borderRight: "1px solid #313244",
                                    borderBottom: activeFile === fname ? "2px solid #7C3AED" : "2px solid transparent",
                                    transition: "all 0.15s",
                                    whiteSpace: "nowrap",
                                    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                                }}
                            >
                                {fname}
                            </div>
                        ))}
                    </div>
                    {/* Right: Editing tools + Run/Stop */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                            <button title="Undo" onClick={() => { if (editorRef.current) editorRef.current.trigger('keyboard', 'undo', null); }} style={{ cursor: "pointer", padding: "4px 6px", color: "#6c7086", borderRadius: 4, background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                                <Undo size={15} />
                            </button>
                            <button title="Redo" onClick={() => { if (editorRef.current) editorRef.current.trigger('keyboard', 'redo', null); }} style={{ cursor: "pointer", padding: "4px 6px", color: "#6c7086", borderRadius: 4, background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                                <Redo size={15} />
                            </button>
                        </div>
                        <div style={{ width: 1, height: 20, background: "#313244" }} />
                        <button onClick={() => handleRun()} title="Run (Ctrl+Enter)" disabled={isRunning}
                            style={{
                                cursor: isRunning ? "not-allowed" : "pointer",
                                padding: "5px 12px",
                                background: isRunning ? "#45475a" : "#4CAF50",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                transition: "all 0.2s",
                            }}>
                            {isRunning ? (
                                <><span style={{ animation: "spin 1s linear infinite" }}>&#x2699;</span> Running...</>
                            ) : (
                                <><Play size={12} fill="#fff" /> Run</>
                            )}
                        </button>
                        <button onClick={() => handleStop()} title="Stop (Escape)"
                            style={{
                                cursor: "pointer",
                                padding: "5px 10px",
                                background: "#45475a",
                                color: "#f38ba8",
                                border: "none",
                                borderRadius: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                transition: "all 0.2s",
                            }}>
                            <Square size={10} fill="#f38ba8" /> Stop
                        </button>
                    </div>
                </div>
            )}

            {/* ══ MAIN WORKSPACE ═══════════════════════════════════════════════ */}
            {workflowMode === "stage" ? (
                <div style={{ flex: 1, display: "flex", overflow: "auto", minHeight: 0 }}>



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
                        onAddNewFile={handleCreateNewFile}
                        spriteFilter={spriteFilter}
                        setSpriteFilter={setSpriteFilter}
                        addSpriteFromLibrary={addSpriteFromLibrary}
                        SPRITE_LIBRARY={getSpriteLibrary()}
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
                        onCursorChange={setEditorCursor}
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
                        activeMode={activeMode}
                        onOpenAssetLibrary={onOpenAssetLibrary}
                    />
                </div>
            ) : workflowMode === "upload" ? (
                renderUploadWorkspace()
            ) : (
                /* IDE Mode Workspace — SidePanel + Editor (left) + Terminal (right) */
                <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, background: "#1e1e2e" }}>

                    {/* ── LEFT SIDEBAR (File Explorer) ── */}
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
                        onAddNewFile={handleCreateNewFile}
                        spriteFilter={spriteFilter}
                        setSpriteFilter={setSpriteFilter}
                        addSpriteFromLibrary={addSpriteFromLibrary}
                        SPRITE_LIBRARY={getSpriteLibrary()}
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

                    {/* ── CENTER: Code Editor ── */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #313244" }}>
                        {Object.keys(projectFiles).length === 0 ? (
                            <div style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#6c7086",
                                gap: 16,
                                fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                            }}>
                                <FileCode2 size={48} strokeWidth={1.2} style={{ opacity: 0.4 }} />
                                <div style={{ fontSize: 16, fontWeight: 500, color: "#8b8fa3" }}>No files yet</div>
                                <div style={{ fontSize: 13, color: "#585b70" }}>Create a new file from the sidebar to get started</div>
                                <button
                                    onClick={() => handleCreateNewFile()}
                                    style={{
                                        marginTop: 8,
                                        padding: "8px 20px",
                                        background: "#7C3AED",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 6,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        transition: "background 0.2s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#6D28D9"}
                                    onMouseLeave={e => e.currentTarget.style.background = "#7C3AED"}
                                >
                                    <Plus size={14} /> New File
                                </button>
                            </div>
                        ) : (
                            <>
                                <MonacoEditor
                                    projectFiles={projectFiles}
                                    activeFile={activeFile}
                                    setProjectFiles={setProjectFiles}
                                    editorRef={editorRef}
                                    monacoRef={monacoRef}
                                    editorCursor={editorCursor}
                                    isRunning={isRunning}
                                    onRun={handleRun}
                                    onCursorChange={setEditorCursor}
                                    editorOptions={{ theme: "vs-dark" }}
                                />
                                <StatusBar
                                    editorCursor={editorCursor}
                                    isRunning={isRunning}
                                    activeFile={activeFile}
                                />
                            </>
                        )}
                    </div>

                    {/* ── RIGHT: Terminal / REPL (full height) ── */}
                    <div style={{ width: 380, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
                        <style>{`.ide-terminal-full > div:first-child { height: 100% !important; flex: 1 !important; }`}</style>
                        <div className="ide-terminal-full" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <TerminalPanel
                                activePanel={activePanel}
                                setActivePanel={setActivePanel}
                                terminalOutput={terminalOutput}
                                replInput={replInput}
                                setReplInput={setReplInput}
                                handleReplSubmit={handleReplSubmit}
                                handleReplKey={handleReplKey}
                                terminalEndRef={terminalEndRef}
                                replInputRef={replInputRef}
                                isRunning={isRunning}
                                onRun={handleRun}
                                onStop={handleStop}
                                onClear={handleClear}
                                packages={packages}
                                pipFilter={pipFilter}
                                setPipFilter={setPipFilter}
                                handleInstall={handleInstall}
                            />
                        </div>
                    </div>
                </div>
            )}

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

            <BoardSelectionModal
                isOpen={isBoardModalOpen}
                onClose={() => setIsBoardModalOpen(false)}
                onSelect={(boardId, boardName) => {
                    setSelectedBoard(boardId);
                    setIsBoardModalOpen(false);
                    setUploadView("board");
                    setUploadActiveFile(getBoardConfig(boardId).fileName);
                    addUploadMessage(`Selected board: ${boardName}`, "success");
                }}
                currentBoard={selectedBoard}
            />

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
                            {libraryMode === "costume" ? "Choose a Costume" : "Choose a Sprite"}
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
                                {getSpriteLibrary().map(sp => (
                                    <div
                                        key={sp.name}
                                        onClick={() => {
                                            if (libraryMode === "costume" && selectedSpriteId) {
                                                const costumeId = `costume_${Date.now()}`;
                                                const img = sp.img || sp.image || sp.emoji;
                                                updateSpriteProperty(selectedSpriteId, 'costumes', {
                                                    ...sprites.find(s => s.id === selectedSpriteId).costumes,
                                                    [costumeId]: img
                                                });
                                                updateSpriteProperty(selectedSpriteId, 'currentCostume', costumeId);
                                                addLog(`Added costume to ${sprites.find(s => s.id === selectedSpriteId).name}`, 'success');
                                            } else {
                                                addSpriteFromLibrary(sp);
                                            }
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

            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileLoad} accept=".leap,.lbproject,application/json" />
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


