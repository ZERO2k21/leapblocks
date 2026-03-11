import React, { useState, useRef, useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";

// Configure Monaco loader to use a stable version and handle Electron context
loader.config({
    paths: {
        vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"
    }
});
import { 
    Folder, 
    Play, 
    Square, 
    Undo, 
    Redo, 
    Search, 
    Save, 
    Bell, 
    Settings, 
    User,
    Plus,
    Maximize,
    Hash,
    Terminal as TerminalIcon,
    BookOpen
} from "lucide-react";
import { SkulptEngine } from "../junior/engine/SkulptEngine";
import Teddy from "../junior/sprites/Teddy";

// --- Theme Colors ---
const COLORS = {
    PURPLE: "#673AB7",
    DARK_PURPLE: "#512DA8",
    LIGHT_PURPLE: "#D1C4E9",
    BG_GREY: "#f0f0f2",
    BORDER: "#ddd",
    TEXT_DARK: "#333",
    TEXT_LIGHT: "#fff",
    ACCENT: "#FFBF00"
};

export default function PythonApp({ onBack }) {
    // --- States ---
    const [activeTab, setActiveTab] = useState("python");
    const [activeFile, setActiveFile] = useState("Tobi.py");
    const [projectFiles, setProjectFiles] = useState({
        "Stage.py": "# Stage script\nprint('Stage initialized')",
        "Tobi.py": "sprite = Sprite('Tobi')\n\nprint(\"Hello! I'm Tobi.\")\nsprite.say(\"Welcome to Python!\")\n\nfor i in range(4):\n    sprite.move_right(50)\n    print(\"Step\", i+1)"
    });
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [activeTerminalTab, setActiveTerminalTab] = useState("terminal");
    const [isRunning, setIsRunning] = useState(false);
    
    // --- Sprite Management ---
    const [sprites, setSprites] = useState([
        {
            id: 'tobi-1',
            name: 'Tobi',
            type: 'robot',
            x: 0,
            y: 0,
            angle: 90,
            size: 100,
            visible: true,
            speech: '',
            currentCostume: 'robot_idle',
            costumes: { robot_idle: "/assets/sprites/robot/robot_idle.svg" }
        }
    ]);
    const [selectedSpriteId, setSelectedSpriteId] = useState('tobi-1');
    const selectedSprite = sprites.find(s => s.id === selectedSpriteId);

    const skulptRef = useRef(null);

    // --- Skulpt Initialization ---
    useEffect(() => {
        skulptRef.current = new SkulptEngine({
            onOut: (text) => setTerminalOutput(prev => [...prev, { text, type: "log" }]),
            onErr: (text) => setTerminalOutput(prev => [...prev, { text, type: "error" }]),
            actions: {
                moveRelative: (name, dir, steps) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() === name.toLowerCase()) {
                            let dx = 0, dy = 0;
                            const d = steps || 20;
                            if (dir === "RIGHT") dx = d;
                            if (dir === "LEFT") dx = -d;
                            if (dir === "UP") dy = -d;
                            if (dir === "DOWN") dy = d;
                            return { ...s, x: s.x + dx, y: s.y + dy };
                        }
                        return s;
                    }));
                },
                moveSteps: (name, steps) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() === name.toLowerCase()) {
                            const rad = (s.angle * Math.PI) / 180;
                            const dx = Math.cos(rad) * steps;
                            const dy = -Math.sin(rad) * steps;
                            return { ...s, x: s.x + dx, y: s.y + dy };
                        }
                        return s;
                    }));
                },
                update: (name, props) => {
                    setSprites(prev => prev.map(s => {
                        if (s.name.toLowerCase() === name.toLowerCase()) {
                            return { ...s, ...props };
                        }
                        return s;
                    }));
                },
                softResetAll: () => {
                   setSprites(prev => prev.map(s => ({ ...s, x: 0, y: 0, speech: '' })));
                }
            }
        });
    }, []);

    const handleRun = async () => {
        setIsRunning(true);
        setTerminalOutput([]);
        skulptRef.current.callbacks.actions.softResetAll();
        try {
            await skulptRef.current.runPython(projectFiles[activeFile]);
        } catch (e) {
            setTerminalOutput(prev => [...prev, { text: e.toString(), type: "error" }]);
        } finally {
            setIsRunning(false);
        }
    };

    const updateSpriteProperty = (id, prop, value) => {
        const val = isNaN(value) ? value : Number(value);
        setSprites(prev => prev.map(s => s.id === id ? { ...s, [prop]: val } : s));
    };

    return (
        <div style={{
            display: "flex", flexDirection: "column", height: "100vh", width: "100vw",
            background: COLORS.BG_GREY, color: COLORS.TEXT_DARK, overflow: "hidden",
            fontFamily: "'Segoe UI', Roboto, sans-serif"
        }}>
            {/* 1. TOP HEADER */}
            <header style={{
                height: "44px", background: COLORS.PURPLE, display: "flex", alignItems: "center",
                padding: "0 12px", justifyContent: "space-between", color: "#fff", zIndex: 100
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ cursor: "pointer" }} onClick={onBack}>
                        <img src="/assets/topbar_logo.svg" alt="Logo" style={{ height: "24px", filter: "brightness(0) invert(1)" }} />
                    </div>
                    <div style={{ display: "flex", gap: "15px", fontSize: "13px" }}>
                        <span>File</span><span>Edit</span><span>Tutorials</span><span>Board</span><span>Connect</span><BookOpen size={16} />
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "4px 12px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <input defaultValue="My Project" style={{ background: "transparent", border: "none", color: "#fff", textAlign: "center", width: "100px", outline: "none" }} />
                        <Save size={16} />
                    </div>
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.2)", borderRadius: "6px", padding: "2px", gap: "2px" }}>
                        <button style={{ padding: "4px 12px", background: "#fff", color: COLORS.PURPLE, border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>Mode</button>
                        <button style={{ padding: "4px 12px", background: "transparent", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px" }}>Stage</button>
                    </div>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                        <Bell size={18} /><Settings size={18} /><User size={18} />
                    </div>
                </div>
            </header>

            {/* 2. SUB-HEADER */}
            <nav style={{ height: "36px", background: "#f8f9fa", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", padding: "0 10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", height: "100%", alignItems: "center", gap: "4px" }}>
                    <TabButton label="Blocks" active={activeTab === "blocks"} onClick={() => setActiveTab("blocks")} />
                    <TabButton label="Python" active={activeTab === "python"} onClick={() => setActiveTab("python")} />
                    <TabButton label="Costumes" active={activeTab === "costumes"} onClick={() => setActiveTab("costumes")} />
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <ToolbarIcon icon={<Undo size={16}/>} /><ToolbarIcon icon={<Redo size={16}/>} /><ToolbarIcon icon={<Search size={16}/>} />
                </div>
            </nav>

            {/* 3. MAIN WORKSPACE */}
            <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <aside style={{ width: "160px", background: "#fcfcfc", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "10px", fontSize: "11px", fontWeight: "bold", color: "#666" }}>PROJECT FILES</div>
                    <div style={{ flex: 1 }}>
                        {Object.keys(projectFiles).map(file => (
                            <div key={file} onClick={() => setActiveFile(file)} style={{ padding: "6px 15px", fontSize: "12px", cursor: "pointer", background: activeFile === file ? "#e3f2fd" : "transparent", color: activeFile === file ? "#1976d2" : "#333", borderLeft: activeFile === file ? "3px solid #1976d2" : "3px solid transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Hash size={12} /> {file}
                            </div>
                        ))}
                    </div>
                </aside>

                <section style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Editor height="100%" defaultLanguage="python" theme="vs" value={projectFiles[activeFile]} onChange={(val) => setProjectFiles(prev => ({ ...prev, [activeFile]: val }))} options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }} />
                    </div>
                    <div style={{ height: "24px", background: "#f0f0f0", borderTop: "1px solid #ddd", display: "flex", alignItems: "center", padding: "0 10px", fontSize: "10px", color: "#666" }}>
                        Ln 1, Col 1 | Board: None
                    </div>
                </section>

                <aside style={{ width: "340px", display: "flex", flexDirection: "column", borderLeft: "1px solid #ddd", background: "#fff" }}>
                    <div style={{ padding: "8px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                            <button onClick={handleRun} style={{ background: "transparent", border: "none", cursor: "pointer" }}><Play size={20} color="#4CAF50" fill="#4CAF50" /></button>
                            <button onClick={() => setIsRunning(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><Square size={20} color="#f44336" fill="#f44336" /></button>
                        </div>
                        <div style={{ flex: 1, background: "#fff", border: "1px solid #eee", borderRadius: "8px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ position: "absolute", inset: 0, opacity: 0.1, pointerEvents: "none", backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                {sprites[0] && (
                                    <Teddy id={sprites[0].id} type={sprites[0].type} active={true} x={sprites[0].x} y={sprites[0].y} angle={sprites[0].angle} size={sprites[0].size} visible={sprites[0].visible} currentCostume={sprites[0].currentCostume} costumes={sprites[0].costumes} speech={sprites[0].speech} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ height: "240px", borderTop: "1px solid #ddd", display: "flex", flexDirection: "column", background: "#f9f9f9" }}>
                        <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                             <PropertyInput label="Sprite" value={selectedSprite?.name} onChange={(v) => updateSpriteProperty(selectedSpriteId, 'name', v)} />
                             <div style={{ display: "flex", gap: "10px" }}>
                                <PropertyInput label="x" value={selectedSprite?.x} compact onChange={(v) => updateSpriteProperty(selectedSpriteId, 'x', v)} />
                                <PropertyInput label="y" value={selectedSprite?.y} compact onChange={(v) => updateSpriteProperty(selectedSpriteId, 'y', v)} />
                             </div>
                             <PropertyInput label="Size" value={selectedSprite?.size} onChange={(v) => updateSpriteProperty(selectedSpriteId, 'size', v)} />
                             <PropertyInput label="Direction" value={selectedSprite?.angle} onChange={(v) => updateSpriteProperty(selectedSpriteId, 'angle', v)} />
                        </div>
                    </div>
                </aside>
            </main>

            {/* 4. FOOTER */}
            <footer style={{ height: "100px", background: "#fff", borderTop: "1px solid #ddd", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", background: "#f0f0f0", height: "28px", borderBottom: "1px solid #ddd" }}>
                    <TerminalTab label="Terminal" active={activeTerminalTab === "terminal"} onClick={() => setActiveTerminalTab("terminal")} />
                    <TerminalTab label="Log" active={activeTerminalTab === "log"} onClick={() => setActiveTerminalTab("log")} />
                </div>
                <div style={{ flex: 1, padding: "8px 15px", overflowY: "auto", fontFamily: "monospace", fontSize: "12px" }}>
                    {terminalOutput.length === 0 ? <div style={{ color: "#aaa" }}>Console output will appear here...</div> : terminalOutput.map((log, i) => <div key={i} style={{ color: log.type === "error" ? "#f44336" : "#333", marginBottom: "2px" }}>{log.text}</div>)}
                </div>
            </footer>
        </div>
    );
}

function TabButton({ label, active, onClick }) {
    return <div onClick={onClick} style={{ display: "flex", alignItems: "center", padding: "0 15px", height: "100%", cursor: "pointer", fontSize: "12px", fontWeight: "500", color: active ? COLORS.PURPLE : "#666", borderBottom: active ? `3px solid ${COLORS.PURPLE}` : "3px solid transparent" }}>{label}</div>;
}

function ToolbarIcon({ icon }) {
    return <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: "4px", color: "#666" }}>{icon}</div>;
}

function TerminalTab({ label, active, onClick }) {
    return <div onClick={onClick} style={{ padding: "0 20px", height: "100%", display: "flex", alignItems: "center", fontSize: "11px", fontWeight: "bold", cursor: "pointer", color: active ? COLORS.PURPLE : "#666", background: active ? "#fff" : "transparent", borderTop: active ? `2px solid ${COLORS.PURPLE}` : "none" }}>{label}</div>;
}

function PropertyInput({ label, value, compact, onChange }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{label}</span>
            <input value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ width: compact ? "40px" : "100%", padding: "4px 8px", borderRadius: "20px", border: "1px solid #eee", background: "#fff", fontSize: "12px", outline: "none" }} />
        </div>
    );
}
