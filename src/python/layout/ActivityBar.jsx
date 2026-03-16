import React from "react";
import { Folder, Search, Bug, Package } from "lucide-react";

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

export default function ActivityBar({ sidePanel, setSidePanel, setShowSpriteLibrary, onCSVUpload, onPythonUpload }) {
    return (
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
            <div onClick={onCSVUpload} title="Upload CSV file"
                style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.6)",marginBottom:2}}>
                <span style={{fontSize:16}}>📊</span>
            </div>
            {/* Upload Python */}
            <div onClick={onPythonUpload} title="Upload Python file (.py)"
                style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.6)",marginBottom:8}}>
                <span style={{fontSize:16}}>🐍</span>
            </div>
        </div>
    );
}
