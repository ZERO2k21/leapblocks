import React, { useState, useRef, useEffect, useCallback } from "react";
import Editor, { loader } from "@monaco-editor/react";

loader.config({
    paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
    'vs/nls': { availableLanguages: {} },
});

// Tell Monaco to not use web workers (avoids CSP blob: errors in Electron/strict CSP environments)
if (typeof window !== 'undefined') {
    window.MonacoEnvironment = {
        getWorker: function (_workerId, _label) {
            return null; // Fall back to main thread (no workers)
        }
    };
}

import {
    Folder, Play, Square, Undo, Redo, Search, Save, Bell, Settings, User,
    Plus, Maximize, Hash, Terminal as TerminalIcon, BookOpen, Trash2,
    Package, Bug, ChevronRight, ChevronDown, X, RefreshCw, Download,
    Eye, EyeOff, RotateCcw, FileText, Zap, HelpCircle, Scissors, Copy, Clipboard,
    StopCircle, PlayCircle, FileCode, Layers, Image, Volume2, ChevronLeft,
    MoreVertical, Grid, MousePointer, Type, PaintBucket, Eraser, Circle, Square as SquareIcon
} from "lucide-react";
import { SkulptEngine } from "../junior/engine/SkulptEngine";
import Teddy from "../junior/sprites/Teddy";
import PythonIDEGuide from "./PythonIDEGuide";
import { FULL_CATALOG } from "../components/SpriteLibrary";
import { BackdropLibrary as BackdropLib } from "../components/BackdropLibrary";

// ─── Theme (PictoBlox Colors) ─────────────────────────────────────────────────
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

// ─── Pip Package Registry (Skulpt-compatible stdlib modules) ───────────────────
const PIP_PACKAGES = [
    { name: "math", desc: "Mathematical functions", installed: true, builtin: true },
    { name: "random", desc: "Random number generation", installed: true, builtin: true },
    { name: "time", desc: "Time access & conversions", installed: true, builtin: true },
    { name: "json", desc: "JSON encoder/decoder", installed: true, builtin: true },
    { name: "re", desc: "Regular expressions", installed: true, builtin: true },
    { name: "sys", desc: "System-specific parameters", installed: true, builtin: true },
    { name: "os", desc: "Operating system interface", installed: false, builtin: false },
    { name: "datetime", desc: "Date and time classes", installed: false, builtin: true },
    { name: "collections", desc: "Container data types", installed: false, builtin: true },
    { name: "itertools", desc: "Iterator building blocks", installed: false, builtin: true },
    { name: "functools", desc: "Higher-order functions", installed: false, builtin: true },
    { name: "string", desc: "String constants/classes", installed: false, builtin: true },
    { name: "operator", desc: "Standard operators", installed: false, builtin: true },
    { name: "copy", desc: "Shallow/deep copy ops", installed: false, builtin: true },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PythonApp({ onBack }) {
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
        { text: "LeapBlocks Python IDE ready. Click ▶ Run to execute.", type: "info", ts: new Date() }
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

    // ── Run ───────────────────────────────────────────────────────────────────
    const handleRun = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setTerminalOutput([]);
        addLog(`▶ Running ${activeFile}...`, "info");
        // reset stage
        if (skulptRef.current?.callbacks?.actions?.softResetAll) skulptRef.current.callbacks.actions.softResetAll();
        setDebugVars([]);
        setDebugLine(null);
        try {
            await skulptRef.current.runPython(projectFiles[activeFile]);
            addLog("✓ Program finished.", "success");
        } catch (e) {
            addLog("✗ " + (typeof e === 'string' ? e : e?.message || e?.toString?.() || JSON.stringify(e) || "Unknown error"), "error");
        } finally {
            setIsRunning(false);
        }
    };

    const handleStop = () => { setIsRunning(false); };
    const handleClear = () => setTerminalOutput([]);

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
            await skulptRef.current.runRepl(line);
        } catch (e) { /* error already output via onErr */ }
        setActivePanel("terminal"); // Show output
    };

    const handleReplKey = (e) => {
        if (e.key === "Enter") { handleReplSubmit(); return; }
        if (e.key === "ArrowUp") {
            const idx = Math.min(replHistIdx + 1, replHistory.length - 1);
            setReplHistIdx(idx);
            setReplInput(replHistory[idx] || "");
        }
        if (e.key === "ArrowDown") {
            const idx = Math.max(replHistIdx - 1, -1);
            setReplHistIdx(idx);
            setReplInput(idx === -1 ? "" : replHistory[idx]);
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

    // ── PIP ───────────────────────────────────────────────────────────────────
    const handleInstall = (pkgName) => {
        setPackages(prev => prev.map(p => p.name === pkgName ? { ...p, installed: true } : p));
        addLog(`✓ Installed ${pkgName} (via Skulpt stdlib)`, "success");
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
            <header style={{
                height: 48, background: C.PURPLE, display: "flex",
                alignItems: "center", padding: "0 16px",
                justifyContent: "space-between", color: "#fff", zIndex: 100,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onClick={onBack}>
                        <span style={{ fontSize: 20, fontWeight: "bold" }}>PictoBlox</span>
                    </div>
                    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.3)" }} />
                    {["File", "Edit", "Tutorials", "Board", "Connect"].map(m => (
                        <span key={m} style={{ fontSize: 13, cursor: "pointer", opacity: 0.85, letterSpacing: "0.01em" }}
                            onMouseEnter={e => e.target.style.opacity = 1}
                            onMouseLeave={e => e.target.style.opacity = 0.85}
                        >{m}</span>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Project name */}
                    <div style={{ background: "rgba(0,0,0,0.25)", padding: "4px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                        <input defaultValue="My Project" style={{ background: "transparent", border: "none", color: "#fff", width: 100, outline: "none", fontSize: 13 }} />
                        <Save size={14} style={{ opacity: 0.8 }} />
                    </div>
                    {/* Mode buttons */}
                    <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ padding: "6px 12px", background: C.PURPLE, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mode</div>
                        <div style={{ padding: "6px 12px", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Stage</div>
                        <div style={{ padding: "6px 12px", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Upload</div>
                    </div>
                    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.3)" }} />
                    <button onClick={() => setShowGuide(g => !g)}
                        title="Help & Guide"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: showGuide ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        <HelpCircle size={14} /> Guide
                    </button>
                    <Bell size={18} style={{ cursor: "pointer", opacity: 0.8 }} />
                    <Settings size={18} style={{ cursor: "pointer", opacity: 0.8 }} />
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={16} />
                    </div>
                </div>
            </header>

            {/* ══ SECOND TOOLBAR ═══════════════════════════════════════════════ */}
            <div style={{
                height: 40, background: "#fff", display: "flex",
                alignItems: "center", padding: "0 16px",
                justifyContent: "space-between", borderBottom: `1px solid ${C.BORDER}`,
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Blocks/Python tabs */}
                    <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ padding: "6px 16px", background: "#f0f0f0", color: C.MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Blocks</div>
                        <div style={{ padding: "6px 16px", background: C.PURPLE, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Python</div>
                    </div>
                    <div style={{ width: 1, height: 20, background: C.BORDER }} />
                    {/* Costumes/Sounds tabs */}
                    <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ padding: "6px 16px", background: C.PURPLE, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Costumes</div>
                        <div style={{ padding: "6px 16px", background: "#f0f0f0", color: C.MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sounds</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Editing tools */}
                    <div style={{ display: "flex", gap: 4 }}>
                        <div title="Undo" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                            <Undo size={16} />
                        </div>
                        <div title="Redo" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                            <Redo size={16} />
                        </div>
                        <div title="Copy" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                            <span style={{ fontSize: 14 }}>📋</span>
                        </div>
                        <div title="Paste" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                            <span style={{ fontSize: 14 }}>📄</span>
                        </div>
                        <div title="Delete" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                            <Trash2 size={16} />
                        </div>
                    </div>
                    <div style={{ width: 1, height: 20, background: C.BORDER }} />
                    {/* Green flag + Red stop */}
                    <div style={{ display: "flex", gap: 4 }}>
                        <div onClick={handleRun} title="Run" style={{ cursor: "pointer", padding: "4px 8px", color: C.GREEN, borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 16 }}>🚩</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Run</span>
                        </div>
                        <div onClick={handleStop} title="Stop" style={{ cursor: "pointer", padding: "4px 8px", color: C.RED, borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <Square size={16} fill={C.RED} />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Stop</span>
                        </div>
                    </div>
                </div>
            </div>

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
                <div style={{ width: 44, background: C.DARK_PURPLE, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, gap: 4, flexShrink: 0 }}>
                    {[
                        { id: "files",      icon: <Folder size={20} />,  tip: "Project Files" },
                        { id: "sprites",    icon: <span style={{fontSize:16}}>🧸</span>,  tip: "Add Sprite from Library", action: () => setShowSpriteLibrary(true) },
                        { id: "backdrops",  icon: <span style={{fontSize:16}}>🖼</span>,  tip: "Choose Backdrop" },
                        { id: "extensions", icon: <span style={{fontSize:16}}>🧩</span>,  tip: "Add Extension" },
                        { id: "search",     icon: <Search size={20} />,  tip: "Search" },
                        { id: "debug",      icon: <Bug size={20} />,     tip: "Debugger" },
                        { id: "packages",   icon: <Package size={20} />, tip: "PIP Packages" },
                    ].map(({ id, icon, tip, action }) => (
                        <div key={id} onClick={() => { if (action) action(); else setSidePanel(id); }}
                            title={tip}
                            style={{
                                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 8, cursor: "pointer", color: sidePanel === id ? "#fff" : "rgba(255,255,255,0.5)",
                                background: sidePanel === id ? "rgba(255,255,255,0.15)" : "transparent",
                                transition: "all 0.2s",
                            }}>
                            {icon}
                        </div>
                    ))}
                    <div style={{flex:1}} />
                    {/* Upload CSV */}
                    <div onClick={handleCSVUpload} title="Upload CSV file"
                        style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.6)",marginBottom:2}}>
                        <span style={{fontSize:16}}>📊</span>
                    </div>
                    {/* Upload Python */}
                    <div onClick={handlePythonUpload} title="Upload Python file (.py)"
                        style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.6)",marginBottom:8}}>
                        <span style={{fontSize:16}}>🐍</span>
                    </div>
                </div>

                {/* ── LEFT SIDEBAR ── */}
                <div style={{ width: 200, background: "#fff", borderRight: `1px solid ${C.BORDER}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

                    {sidePanel === "files" && (
                        <>
                            <div style={{ padding: "10px 12px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Project Files</span>
                                <div style={{ display: "flex", gap: 4 }}>
                                    <div onClick={handleAddFile} title="New File" style={{ cursor: "pointer", color: C.MUTED, padding: 2, borderRadius: 4 }}>
                                        <Plus size={14} />
                                    </div>
                                    <div title="Refresh" style={{ cursor: "pointer", color: C.MUTED, padding: 2, borderRadius: 4 }}>
                                        <RefreshCw size={14} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto" }}>
                                {Object.keys(projectFiles).map(file => (
                                    <div key={file}
                                        onClick={() => setActiveFile(file)}
                                        style={{
                                            padding: "6px 12px", fontSize: 13, cursor: "pointer",
                                            background: activeFile === file ? C.LIGHT_PURPLE : "transparent",
                                            color: activeFile === file ? C.PURPLE : C.TEXT,
                                            display: "flex", alignItems: "center", gap: 8,
                                            transition: "background 0.15s",
                                            borderLeft: activeFile === file ? `3px solid ${C.PURPLE}` : "3px solid transparent",
                                        }}
                                        onMouseEnter={e => { if (activeFile !== file) e.currentTarget.style.background = "#F5F5F5"; }}
                                        onMouseLeave={e => { if (activeFile !== file) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <div style={{ width: 16, height: 16, background: "#E8F5E9", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FileText size={10} style={{ color: "#2E7D32" }} />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: activeFile === file ? 600 : 400 }}>{file}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Modules/Libraries Section */}
                            <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "10px 12px 6px" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Modules/Libraries</span>
                            </div>
                            <div style={{ padding: "0 12px 12px" }}>
                                <div style={{ 
                                    padding: "6px 8px", fontSize: 12, cursor: "pointer",
                                    background: "#F5F5F5", borderRadius: 6,
                                    display: "flex", alignItems: "center", gap: 8,
                                }}>
                                    <div style={{ width: 16, height: 16, background: "#E3F2FD", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ fontSize: 10 }}>📦</span>
                                    </div>
                                    <span>Sprite</span>
                                </div>
                            </div>
                        </>
                    )}

                    
                    {sidePanel === "sprites" && (
                        <>
                        <div style={{padding:"10px 12px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:11,fontWeight:700,color:C.MUTED,letterSpacing:"0.08em"}}>SPRITE LIBRARY</span>
                        </div>
                        <input value={spriteFilter} onChange={e=>setSpriteFilter(e.target.value)}
                            placeholder="Search sprites..."
                            style={{margin:"0 8px 8px",padding:"5px 8px",fontSize:12,border:`1px solid ${C.BORDER}`,borderRadius:6,outline:"none",width:"calc(100% - 16px)"}} />
                        <div style={{flex:1,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,padding:"0 8px 8px"}}>
                            {SPRITE_LIBRARY.filter(s=>s.name.toLowerCase().includes(spriteFilter.toLowerCase())).map(sp=>(
                                <div key={sp.name} onClick={()=>addSpriteFromLibrary(sp)}
                                    style={{background:"#F5F0FF",border:"2px solid transparent",borderRadius:10,padding:8,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}
                                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.PURPLE;e.currentTarget.style.background=C.LIGHT_PURPLE;}}
                                    onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.background="#F5F0FF";}}>
                                    <img src={sp.img} alt={sp.name} style={{width:44,height:44,objectFit:"contain"}} onError={e=>{e.target.style.display="none";}} />
                                    <div style={{fontSize:10,fontWeight:600,color:C.TEXT,marginTop:4}}>{sp.name}</div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}

                    {sidePanel === "backdrops" && (
                        <>
                        <div style={{padding:"10px 12px 6px"}}>
                            <span style={{fontSize:11,fontWeight:700,color:C.MUTED,letterSpacing:"0.08em"}}>BACKDROPS</span>
                        </div>
                        <div style={{flex:1,overflowY:"auto",padding:"0 8px 8px"}}>
                            {BACKDROP_LIBRARY.map(bd=>(
                                <div key={bd.name} onClick={()=>handleSetBackdrop(bd)}
                                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:8,cursor:"pointer",marginBottom:4,background:backdrop===bd.img?"#EDE7F6":"transparent",border:backdrop===bd.img?`1px solid ${C.PURPLE}`:"1px solid transparent",transition:"all 0.2s"}}
                                    onMouseEnter={e=>e.currentTarget.style.background="#F5F0FF"}
                                    onMouseLeave={e=>e.currentTarget.style.background=backdrop===bd.img?"#EDE7F6":"transparent"}>
                                    <div style={{width:36,height:24,borderRadius:4,overflow:"hidden",flexShrink:0,background:bd.img?"#ddd":"#fff",border:"1px solid #ddd"}}>
                                        {bd.img && <img src={bd.img} alt={bd.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />}
                                        {!bd.img && <div style={{width:"100%",height:"100%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#999"}}>Blank</div>}
                                    </div>
                                    <span style={{fontSize:12,color:C.TEXT}}>{bd.name}</span>
                                    {backdrop===bd.img && <span style={{marginLeft:"auto",fontSize:10,color:C.PURPLE}}>✓</span>}
                                </div>
                            ))}
                        </div>
                        </>
                    )}

                    {sidePanel === "extensions" && (
                        <>
                        <div style={{padding:"10px 12px 6px"}}>
                            <span style={{fontSize:11,fontWeight:700,color:C.MUTED,letterSpacing:"0.08em"}}>EXTENSIONS</span>
                        </div>
                        <div style={{flex:1,overflowY:"auto",padding:"0 8px 8px"}}>
                            {EXTENSIONS.map(ext=>{
                                const isIn = !!installedExtensions.find(e=>e.id===ext.id);
                                return (
                                <div key={ext.id} style={{background:"#F9F6FF",border:`1px solid ${isIn?C.PURPLE:C.BORDER}`,borderRadius:8,padding:"8px 10px",marginBottom:6,cursor:"pointer"}} onClick={()=>installExtension(ext)}>
                                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                        <span style={{fontSize:18}}>{ext.icon}</span>
                                        <span style={{fontSize:12,fontWeight:700,color:C.TEXT}}>{ext.name}</span>
                                        {isIn && <span style={{marginLeft:"auto",fontSize:10,color:C.GREEN,fontWeight:700}}>✓ Added</span>}
                                    </div>
                                    <div style={{fontSize:11,color:C.MUTED,lineHeight:1.4}}>{ext.desc}</div>
                                    {!isIn && <div style={{marginTop:6,fontSize:10,color:C.PURPLE,fontWeight:700}}>+ Click to Add</div>}
                                </div>);
                            })}
                        </div>
                        </>
                    )}

                    {sidePanel === "packages" && (
                        <>
                            <div style={{ padding: "10px 12px 8px" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.08em" }}>PIP PACKAGES</span>
                                <input
                                    value={pipFilter} onChange={e => setPipFilter(e.target.value)}
                                    placeholder="Search packages..."
                                    style={{ marginTop: 8, width: "100%", padding: "5px 8px", border: `1px solid ${C.BORDER}`, borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                                />
                            </div>
                            <div style={{ flex: 1, overflowY: "auto" }}>
                                {packages.filter(p => p.name.includes(pipFilter.toLowerCase())).map(pkg => (
                                    <div key={pkg.name} style={{ padding: "8px 12px", borderBottom: `1px solid ${C.BORDER}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: C.TEXT }}>{pkg.name}</span>
                                            {pkg.installed ? (
                                                <span style={{ fontSize: 10, color: C.GREEN, fontWeight: 700 }}>● READY</span>
                                            ) : (
                                                <button onClick={() => handleInstall(pkg.name)}
                                                    style={{ fontSize: 10, padding: "2px 8px", background: C.PURPLE, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700 }}>
                                                    <Download size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />INSTALL
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>{pkg.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {sidePanel === "debug" && (
                        <>
                            <div style={{ padding: "10px 12px" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.08em" }}>DEBUGGER</span>
                            </div>
                            <div style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
                                {debugLine && (
                                    <div style={{ padding: "6px 10px", background: "#FFF3E0", borderRadius: 6, marginBottom: 8, fontSize: 12, border: "1px solid #FFB74D" }}>
                                        ⚡ Paused at line {debugLine}
                                    </div>
                                )}
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, marginBottom: 6 }}>VARIABLES</div>
                                {debugVars.length === 0 ? (
                                    <div style={{ fontSize: 12, color: C.MUTED, fontStyle: "italic" }}>Run code to watch variables</div>
                                ) : (
                                    debugVars.map((v, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.BORDER}`, fontSize: 12 }}>
                                            <span style={{ color: C.BLUE, fontFamily: "monospace" }}>{v.name}</span>
                                            <span style={{ color: C.ORANGE, fontFamily: "monospace" }}>{v.value}</span>
                                        </div>
                                    ))
                                )}
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, marginBottom: 6 }}>CALL STACK</div>
                                    <div style={{ fontSize: 12, color: C.MUTED, fontStyle: "italic" }}>No active debug session</div>
                                </div>
                            </div>
                        </>
                    )}

                    {sidePanel === "search" && (
                        <>
                            <div style={{ padding: "10px 12px" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.08em" }}>SEARCH</span>
                                <input
                                    placeholder="Search in files..."
                                    style={{ marginTop: 8, width: "100%", padding: "5px 8px", border: `1px solid ${C.BORDER}`, borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                                />
                            </div>
                            <div style={{ padding: "8px 12px", fontSize: 12, color: C.MUTED, fontStyle: "italic" }}>Type to search across all files.</div>
                        </>
                    )}
                </div>

                {/* ── EDITOR + TERMINAL ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* File Tabs */}
                    <div style={{ display: "flex", background: "#EFEFEF", borderBottom: `1px solid ${C.BORDER}`, overflowX: "auto", flexShrink: 0, height: 36 }}>
                        {Object.keys(projectFiles).map(file => (
                            <div key={file}
                                onClick={() => setActiveFile(file)}
                                style={{
                                    padding: "0 16px", height: "100%", display: "flex", alignItems: "center", gap: 8,
                                    cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
                                    background: activeFile === file ? "#fff" : "transparent",
                                    color: activeFile === file ? C.PURPLE : C.MUTED,
                                    borderBottom: activeFile === file ? `2px solid ${C.PURPLE}` : "2px solid transparent",
                                    borderRight: `1px solid ${C.BORDER}`,
                                    fontWeight: activeFile === file ? 600 : 400,
                                }}
                            >
                                <FileText size={12} />
                                {file}
                            </div>
                        ))}
                    </div>

                    {/* Monaco Editor */}
                    <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                        <Editor
                            height="100%"
                            language="python"
                            theme="vs"
                            value={projectFiles[activeFile] || ""}
                            onChange={(val) => setProjectFiles(prev => ({ ...prev, [activeFile]: val || "" }))}
                            onMount={(editor, monaco) => {
                                editorRef.current = editor;
                                monacoRef.current = monaco;
                                editor.onDidChangeCursorPosition(e => {
                                    setEditorCursor({ line: e.position.lineNumber, col: e.position.column });
                                });
                                // Add Ctrl+Enter to run
                                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                                    handleRun();
                                });
                                // Add Python completions
                                monaco.languages.registerCompletionItemProvider("python", {
                                    provideCompletionItems: (model, position) => ({
                                        suggestions: [
                                            "Sprite", "print", "input", "range", "len", "str", "int", "float", "list", "dict", "set",
                                            "move_right", "move_left", "move_up", "move_down", "say", "goto", "set_x", "set_y",
                                            "hide", "show", "set_size", "point_in_direction",
                                        ].map(kw => ({
                                            label: kw,
                                            kind: monaco.languages.CompletionItemKind.Keyword,
                                            insertText: kw,
                                            range: model.getWordAtPosition(position) ? {
                                                startLineNumber: position.lineNumber,
                                                endLineNumber: position.lineNumber,
                                                startColumn: model.getWordAtPosition(position).startColumn,
                                                endColumn: model.getWordAtPosition(position).endColumn,
                                            } : { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column, endColumn: position.column }
                                        }))
                                    })
                                });
                            }}
                            options={{
                                fontSize: 14,
                                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                                fontLigatures: true,
                                minimap: { enabled: true },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                lineNumbers: "on",
                                glyphMargin: true,
                                folding: true,
                                renderLineHighlight: "line",
                                tabSize: 4,
                                wordWrap: "off",
                                suggestOnTriggerCharacters: true,
                                quickSuggestions: true,
                            }}
                        />
                    </div>

                    {/* Status Bar */}
                    <div style={{ height: 22, background: C.DARK_PURPLE, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 11, color: "rgba(255,255,255,0.85)", gap: 16, flexShrink: 0 }}>
                        <span>Python 3</span>
                        <span>Ln {editorCursor.line}, Col {editorCursor.col}</span>
                        <span>{isRunning ? "● Running" : "○ Ready"}</span>
                        <span style={{ marginLeft: "auto" }}>{activeFile}</span>
                    </div>

                    {/* ── TERMINAL PANEL ── */}
                    <div style={{ height: 220, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.BORDER}`, background: "#fff", flexShrink: 0 }}>
                        {/* Panel Tabs */}
                        <div style={{ display: "flex", background: "#F5F5F5", borderBottom: `1px solid ${C.BORDER}`, height: 32, alignItems: "center" }}>
                            {[
                                { id: "terminal", label: "Terminal", icon: <span style={{ fontSize: 12 }}>▶</span> },
                                { id: "log", label: "Log", icon: <FileText size={12} /> },
                                { id: "serial", label: "Serial Monitor", icon: <TerminalIcon size={12} /> },
                            ].map(({ id, label, icon }) => (
                                <div key={id} onClick={() => { setActivePanel(id); if (id === "repl") setTimeout(() => replInputRef.current?.focus(), 80); }}
                                    style={{
                                        padding: "0 14px", height: "100%", display: "flex", alignItems: "center", gap: 6,
                                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                                        color: activePanel === id ? C.PURPLE : C.MUTED,
                                        borderBottom: activePanel === id ? `2px solid ${C.PURPLE}` : "2px solid transparent",
                                        background: activePanel === id ? "#fff" : "transparent",
                                    }}>
                                    {icon} {label}
                                </div>
                            ))}
                            <div style={{ marginLeft: "auto", display: "flex", gap: 4, paddingRight: 8 }}>
                                <div onClick={handleRun} title="Run All" style={{ cursor: "pointer", padding: "4px 8px", color: C.GREEN, borderRadius: 4, fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                    <Play size={12} /> Run All
                                </div>
                                <div onClick={() => { setActivePanel("repl"); setTimeout(() => replInputRef.current?.focus(), 80); }} title="REPL Mode" style={{ cursor: "pointer", padding: "4px 8px", color: C.PURPLE, borderRadius: 4, fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                    <span style={{ fontSize: 10 }}>{">>>"}</span> REPL Mode
                                </div>
                                <div onClick={handleStop} title="Stop" style={{ cursor: "pointer", padding: "4px 8px", color: C.RED, borderRadius: 4, fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                    <Square size={12} /> Stop
                                </div>
                                <div onClick={handleClear} title="Clear" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                    <Trash2 size={12} /> Clear
                                </div>
                            </div>
                        </div>

                        {/* Terminal Output */}
                        {activePanel === "terminal" && (
                            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6 }}>
                                {terminalOutput.length === 0 ? (
                                    <div style={{ color: "#aaa", fontStyle: "italic" }}>— Output will appear here —</div>
                                ) : terminalOutput.map((log, i) => (
                                    <div key={i} style={{
                                        color: log.type === "error" ? "#E53935" : log.type === "success" ? "#2E7D32" : log.type === "info" ? "#1565C0" : log.type === "repl-in" ? C.PURPLE : "#333",
                                        marginBottom: 2,
                                        paddingLeft: log.type === "repl-in" ? 0 : 4,
                                    }}>
                                        {log.type === "repl-in" ? <span style={{ userSelect: "none", color: C.MUTED }}>{">>> "}</span> : null}
                                        {log.text}
                                    </div>
                                ))}
                                <div ref={terminalEndRef} />
                            </div>
                        )}

                        {/* REPL */}
                        {activePanel === "repl" && (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <div style={{ padding: "6px 14px", fontSize: 11, color: C.MUTED, borderBottom: `1px solid ${C.BORDER}` }}>
                                    Interactive Python REPL — type commands and press Enter
                                </div>
                                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6 }}>
                                    <div style={{ color: C.MUTED }}>Python 3 (Skulpt) — LeapBlocks Interactive Shell</div>
                                    <div style={{ color: C.MUTED, marginBottom: 8 }}>Type Python code and press Enter. Use ↑/↓ for history.</div>
                                </div>
                                <div style={{ display: "flex", borderTop: `1px solid ${C.BORDER}`, padding: "6px 10px", alignItems: "center", gap: 8, background: "#FAFAFA" }}>
                                    <span style={{ color: C.PURPLE, fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{">>>"}</span>
                                    <input
                                        ref={replInputRef}
                                        value={replInput}
                                        onChange={e => setReplInput(e.target.value)}
                                        onKeyDown={handleReplKey}
                                        placeholder="Enter Python expression or statement..."
                                        style={{ flex: 1, border: "none", outline: "none", fontFamily: "'Fira Code', monospace", fontSize: 13, background: "transparent", color: C.TEXT }}
                                    />
                                    <button onClick={handleReplSubmit}
                                        style={{ padding: "4px 12px", background: C.PURPLE, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                                        Run
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Log */}
                        {activePanel === "log" && (
                            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6 }}>
                                {terminalOutput.length === 0 ? (
                                    <div style={{ color: "#aaa", fontStyle: "italic" }}>— Log output will appear here —</div>
                                ) : terminalOutput.map((log, i) => (
                                    <div key={i} style={{
                                        color: log.type === "error" ? "#E53935" : log.type === "success" ? "#2E7D32" : log.type === "info" ? "#1565C0" : "#333",
                                        marginBottom: 2,
                                    }}>
                                        <span style={{ color: C.MUTED, marginRight: 8 }}>[{log.ts?.toLocaleTimeString() || ""}]</span>
                                        {log.text}
                                    </div>
                                ))}
                                <div ref={terminalEndRef} />
                            </div>
                        )}

                        {/* Serial Monitor */}
                        {activePanel === "serial" && (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <div style={{ padding: "6px 14px", fontSize: 11, color: C.MUTED, borderBottom: `1px solid ${C.BORDER}` }}>
                                    Serial Monitor — Connect to Arduino/ESP32
                                </div>
                                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6, background: "#1E1E1E", color: "#D4D4D4" }}>
                                    <div style={{ color: "#6A9955" }}>// Serial monitor output will appear here</div>
                                    <div style={{ color: "#6A9955" }}>// Click "Connect" to establish serial connection</div>
                                </div>
                                <div style={{ display: "flex", borderTop: `1px solid ${C.BORDER}`, padding: "6px 10px", alignItems: "center", gap: 8, background: "#FAFAFA" }}>
                                    <input
                                        placeholder="Enter data to send..."
                                        style={{ flex: 1, border: `1px solid ${C.BORDER}`, outline: "none", fontFamily: "'Fira Code', monospace", fontSize: 13, background: "#fff", color: C.TEXT, padding: "4px 8px", borderRadius: 4 }}
                                    />
                                    <button
                                        style={{ padding: "4px 12px", background: C.PURPLE, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── STAGE PANEL ── */}
                <div style={{ width: 380, display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.BORDER}`, background: "#fff", flexShrink: 0 }}>
                    {/* Stage Controls */}
                    <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px", background: C.PURPLE, gap: 8 }}>
                        {["stage", "sprites", "backdrops"].map(v => (
                            <div key={v} onClick={() => setStageView(v)}
                                style={{ 
                                    padding: "6px 14px", 
                                    borderRadius: 6, 
                                    cursor: "pointer", 
                                    fontSize: 12, 
                                    fontWeight: 600, 
                                    background: stageView === v ? "rgba(255,255,255,0.2)" : "transparent", 
                                    color: "#fff",
                                    transition: "all 0.2s"
                                }}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </div>
                        ))}
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            <div onClick={resetStage} title="Reset Stage" style={{ cursor: "pointer", color: "#fff", padding: 6, borderRadius: 6, background: "rgba(255,255,255,0.1)" }}>
                                <RotateCcw size={16} />
                            </div>
                            <div title="Fullscreen" style={{ cursor: "pointer", color: "#fff", padding: 6, borderRadius: 6, background: "rgba(255,255,255,0.1)" }}>
                                <Maximize size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Stage Canvas */}
                    {stageView === "stage" && (
                        <div style={{ flex: 1, position: "relative", background: backdrop ? "transparent" : "#fff", overflow: "hidden" }}>
                            {/* Backdrop image */}
                            {backdrop && <img src={backdrop} alt="backdrop" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}} />}
                            {/* Sprites - x/y are relative to stage center */}
                            <div style={{ width: "100%", height: "100%", position: "relative" }} ref={stageRef}>
                                {sprites.map(sp => sp.visible && (
                                    <Teddy key={sp.id} id={sp.id} type={sp.type} active={sp.id === selectedSpriteId}
                                        x={(stageSize.w / 2) + (sp.x * (stageSize.w / 480)) - 40}
                                        y={(stageSize.h / 2) - (sp.y * (stageSize.h / 360)) - 40}
                                        angle={sp.angle} size={sp.size}
                                        visible={sp.visible} currentCostume={sp.currentCostume}
                                        costumes={sp.costumes} speech={sp.speech}
                                        onClick={() => setSelectedSpriteId(sp.id)}
                                        onDragStateChange={(dragging) => {
                                            if (!dragging) {
                                                // When drag ends, convert pixel position back to scratch coordinates
                                                const pixelX = (stageSize.w / 2) + (sp.x * (stageSize.w / 480)) - 40;
                                                const pixelY = (stageSize.h / 2) - (sp.y * (stageSize.h / 360)) - 40;
                                                // The Teddy component updates via window.updateSprite, so we need to listen
                                            }
                                        }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sprites Panel - Vertical list like PictoBlox */}
                    {stageView === "sprites" && (
                        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em", marginBottom: 12, textTransform: "uppercase" }}>Sprites ({sprites.length})</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {sprites.map(sp => (
                                    <div key={sp.id} onClick={() => setSelectedSpriteId(sp.id)}
                                        style={{ 
                                            padding: "10px 12px", 
                                            background: selectedSpriteId === sp.id ? C.LIGHT_PURPLE : "#F9FAFB", 
                                            border: `2px solid ${selectedSpriteId === sp.id ? C.PURPLE : "#E5E7EB"}`, 
                                            borderRadius: 8, 
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            transition: "all 0.15s"
                                        }}
                                        onMouseEnter={e => { if (selectedSpriteId !== sp.id) { e.currentTarget.style.background = "#F3F4F6"; }}}
                                        onMouseLeave={e => { if (selectedSpriteId !== sp.id) { e.currentTarget.style.background = "#F9FAFB"; }}}
                                    >
                                        <div style={{ 
                                            width: 48, 
                                            height: 48, 
                                            background: "#fff", 
                                            borderRadius: 8, 
                                            display: "flex", 
                                            alignItems: "center", 
                                            justifyContent: "center",
                                            border: "1px solid #E5E7EB",
                                            flexShrink: 0
                                        }}>
                                            <img src={sp.costumes[sp.currentCostume]} style={{ width: 40, height: 40, objectFit: "contain" }} alt={sp.name} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: C.TEXT, marginBottom: 4 }}>{sp.name}</div>
                                            <div style={{ fontSize: 11, color: C.MUTED }}>x: {Math.round(sp.x)}, y: {Math.round(sp.y)}</div>
                                        </div>
                                        <div onClick={(e) => { e.stopPropagation(); updateSpriteProperty(sp.id, 'visible', !sp.visible); }}
                                            style={{ 
                                                padding: 6, 
                                                borderRadius: 6, 
                                                cursor: "pointer", 
                                                color: sp.visible ? C.PURPLE : "#999",
                                                background: sp.visible ? C.LIGHT_PURPLE : "#F3F4F6",
                                                transition: "all 0.15s",
                                                flexShrink: 0
                                            }}>
                                            {sp.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowSpriteLibrary(true)}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    marginTop: 12,
                                    background: "#F9FAFB",
                                    border: `2px dashed #D1D5DB`,
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: C.PURPLE,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    transition: "all 0.15s"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = C.LIGHT_PURPLE; e.currentTarget.style.borderColor = C.PURPLE; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
                            >
                                <Plus size={16} /> Add Sprite
                            </button>
                        </div>
                    )}

                    {/* Backdrops Panel */}
                    {stageView === "backdrops" && (
                        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase" }}>Choose Backdrop</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                {BACKDROP_LIBRARY.map(bd => (
                                    <div key={bd.name} onClick={() => handleSetBackdrop(bd)}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                            padding: "10px",
                                            borderRadius: 10,
                                            cursor: "pointer",
                                            background: backdrop === bd.img ? C.LIGHT_PURPLE : "#fff",
                                            border: `2px solid ${backdrop === bd.img ? C.PURPLE : "#E0E0E0"}`,
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={e => { if (backdrop !== bd.img) { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#C0C0C0"; }}}
                                        onMouseLeave={e => { if (backdrop !== bd.img) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E0E0E0"; }}}
                                    >
                                        <div style={{
                                            width: "100%",
                                            height: 60,
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            background: bd.img ? "#ddd" : "#F5F5F5",
                                            border: "1px solid #E0E0E0"
                                        }}>
                                            {bd.img && <img src={bd.img} alt={bd.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                            {!bd.img && <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#999" }}>Blank</div>}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: C.TEXT, textAlign: "center" }}>{bd.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sprite List (below stage) - Vertical layout like PictoBlox */}
                    <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "12px", background: "#fff", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, maxHeight: 200, overflowY: "auto" }}>
                        {sprites.map(sp => (
                            <div key={sp.id} onClick={() => setSelectedSpriteId(sp.id)}
                                style={{ 
                                    padding: "8px 10px", 
                                    background: selectedSpriteId === sp.id ? C.LIGHT_PURPLE : "#F9FAFB", 
                                    border: `2px solid ${selectedSpriteId === sp.id ? C.PURPLE : "#E5E7EB"}`, 
                                    borderRadius: 8, 
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    transition: "all 0.15s"
                                }}>
                                <img src={sp.costumes[sp.currentCostume]} style={{ width: 40, height: 40, objectFit: "contain" }} alt={sp.name} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.TEXT }}>{sp.name}</div>
                                    <div style={{ fontSize: 10, color: C.MUTED }}>x: {Math.round(sp.x)}, y: {Math.round(sp.y)}</div>
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); updateSpriteProperty(sp.id, 'visible', !sp.visible); }}
                                    style={{ 
                                        padding: 4, 
                                        borderRadius: 4, 
                                        cursor: "pointer", 
                                        color: sp.visible ? C.PURPLE : "#999",
                                        background: sp.visible ? C.LIGHT_PURPLE : "transparent"
                                    }}>
                                    {sp.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setShowSpriteLibrary(true)}
                            style={{ 
                                padding: "10px", 
                                background: "#F9FAFB", 
                                border: `2px dashed #D1D5DB`, 
                                borderRadius: 8, 
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                color: C.PURPLE,
                                fontSize: 13,
                                fontWeight: 600,
                                transition: "all 0.15s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.LIGHT_PURPLE; e.currentTarget.style.borderColor = C.PURPLE; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
                        >
                            <Plus size={18} />
                            <span>Add Sprite</span>
                        </button>
                    </div>

                    {/* Sprite Properties - PictoBlox style */}
                    <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "12px 14px", background: "#fff", flexShrink: 0 }}>
                        {/* Sprite Name Row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.MUTED }}>Sprite</span>
                            <input 
                                type="text" 
                                value={selectedSprite?.name || ''} 
                                onChange={e => updateSpriteProperty(selectedSpriteId, 'name', e.target.value)}
                                style={{ 
                                    flex: 1, 
                                    padding: "6px 10px", 
                                    border: `1px solid ${C.BORDER}`, 
                                    borderRadius: 6, 
                                    fontSize: 13, 
                                    fontWeight: 600,
                                    background: "#F9FAFB"
                                }}
                            />
                        </div>
                        
                        {/* Position Row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 12, color: C.MUTED }}>↔</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.MUTED }}>x</span>
                            <input 
                                type="number" 
                                value={Math.round(selectedSprite?.x || 0)} 
                                onChange={e => updateSpriteProperty(selectedSpriteId, 'x', parseFloat(e.target.value) || 0)}
                                style={{ 
                                    width: 60, 
                                    padding: "5px 8px", 
                                    border: `1px solid ${C.BORDER}`, 
                                    borderRadius: 6, 
                                    fontSize: 12, 
                                    fontWeight: 600,
                                    background: "#F9FAFB",
                                    textAlign: "center"
                                }}
                            />
                            <span style={{ fontSize: 12, color: C.MUTED }}>↕</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.MUTED }}>y</span>
                            <input 
                                type="number" 
                                value={Math.round(selectedSprite?.y || 0)} 
                                onChange={e => updateSpriteProperty(selectedSpriteId, 'y', parseFloat(e.target.value) || 0)}
                                style={{ 
                                    width: 60, 
                                    padding: "5px 8px", 
                                    border: `1px solid ${C.BORDER}`, 
                                    borderRadius: 6, 
                                    fontSize: 12, 
                                    fontWeight: 600,
                                    background: "#F9FAFB",
                                    textAlign: "center"
                                }}
                            />
                        </div>
                        
                        {/* Show/Hide, Size, Direction Row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Show/Hide Toggle */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.MUTED }}>Show</span>
                                <div style={{ display: "flex", gap: 4 }}>
                                    <button onClick={() => updateSpriteProperty(selectedSpriteId, 'visible', true)}
                                        style={{ 
                                            padding: "4px 8px", 
                                            background: selectedSprite?.visible ? C.PURPLE : "#F3F4F6", 
                                            border: `1px solid ${selectedSprite?.visible ? C.PURPLE : "#D1D5DB"}`, 
                                            borderRadius: 4, 
                                            cursor: "pointer",
                                            color: selectedSprite?.visible ? "#fff" : "#9CA3AF"
                                        }}>
                                        <Eye size={14} />
                                    </button>
                                    <button onClick={() => updateSpriteProperty(selectedSpriteId, 'visible', false)}
                                        style={{ 
                                            padding: "4px 8px", 
                                            background: !selectedSprite?.visible ? C.PURPLE : "#F3F4F6", 
                                            border: `1px solid ${!selectedSprite?.visible ? C.PURPLE : "#D1D5DB"}`, 
                                            borderRadius: 4, 
                                            cursor: "pointer",
                                            color: !selectedSprite?.visible ? "#fff" : "#9CA3AF"
                                        }}>
                                        <EyeOff size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Size */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.MUTED }}>Size</span>
                                <input 
                                    type="number" 
                                    value={selectedSprite?.size || 100} 
                                    onChange={e => updateSpriteProperty(selectedSpriteId, 'size', parseFloat(e.target.value) || 100)}
                                    style={{ 
                                        width: 55, 
                                        padding: "5px 8px", 
                                        border: `1px solid ${C.BORDER}`, 
                                        borderRadius: 6, 
                                        fontSize: 12, 
                                        fontWeight: 600,
                                        background: "#F9FAFB",
                                        textAlign: "center"
                                    }}
                                />
                            </div>
                            
                            {/* Direction */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.MUTED }}>Direction</span>
                                <input 
                                    type="number" 
                                    value={selectedSprite?.angle || 90} 
                                    onChange={e => updateSpriteProperty(selectedSpriteId, 'angle', parseFloat(e.target.value) || 90)}
                                    style={{ 
                                        width: 55, 
                                        padding: "5px 8px", 
                                        border: `1px solid ${C.BORDER}`, 
                                        borderRadius: 6, 
                                        fontSize: 12, 
                                        fontWeight: 600,
                                        background: "#F9FAFB",
                                        textAlign: "center"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
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

// ─── Sub Components ────────────────────────────────────────────────────────────
function PropInput({ label, value, onChange }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "0.04em" }}>{label}</span>
            <input
                value={value !== undefined && value !== null ? String(value) : ''}
                onChange={e => onChange(e.target.value)}
                style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid #E0E0E0`, background: "#fff", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box" }}
            />
        </div>
    );
}
