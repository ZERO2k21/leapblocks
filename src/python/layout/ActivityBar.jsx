import React from "react";
import { FileText, Sprout, Package, Download, Upload, Settings, Bug, FolderOpen } from "lucide-react";

const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    BG: "#F3F4F6",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
};

const ACTIVITY_ITEMS = [
    { id: "files", icon: FileText, label: "Files" },
    { id: "sprites", icon: Sprout, label: "Sprites" },
    { id: "extensions", icon: Package, label: "Extensions" },
    { id: "pip", icon: Download, label: "Packages" },
];

export default function ActivityBar({
    sidePanel,
    setSidePanel,
    setShowSpriteLibrary,
    onCSVUpload,
    onPythonUpload,
}) {
    return (
        <div style={{
            width: 48,
            background: "#2D2B55",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 8,
            flexShrink: 0,
            borderRight: `1px solid #1E1B4B`,
        }}>
            {/* Main activity icons */}
            {ACTIVITY_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = sidePanel === item.id;
                return (
                    <div
                        key={item.id}
                        onClick={() => setSidePanel(item.id)}
                        title={item.label}
                        style={{
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            marginBottom: 4,
                            borderRadius: 6,
                            background: isActive ? "rgba(139, 92, 246, 0.3)" : "transparent",
                            borderLeft: isActive ? "3px solid #8B5CF6" : "3px solid transparent",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <Icon 
                            size={20} 
                            style={{ 
                                color: isActive ? "#A78BFA" : "#9CA3AF",
                            }} 
                        />
                    </div>
                );
            })}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Bottom actions */}
            <div style={{ paddingBottom: 12 }}>
                {/* Upload Python file */}
                <div
                    onClick={onPythonUpload}
                    title="Import Python File"
                    style={{
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        marginBottom: 4,
                        borderRadius: 6,
                        transition: "all 0.15s ease",
                    }}
                >
                    <Upload size={18} style={{ color: "#9CA3AF" }} />
                </div>
                {/* Upload CSV */}
                <div
                    onClick={onCSVUpload}
                    title="Import CSV Data"
                    style={{
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        marginBottom: 4,
                        borderRadius: 6,
                        transition: "all 0.15s ease",
                    }}
                >
                    <FolderOpen size={18} style={{ color: "#9CA3AF" }} />
                </div>
            </div>
        </div>
    );
}
