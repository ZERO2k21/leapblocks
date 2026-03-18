import React from "react";
import { Download } from "lucide-react";

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

export default function PipPanel({ packages, pipFilter, setPipFilter, handleInstall }) {
    return (
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
                {packages.filter(p => p.name.toLowerCase().includes(pipFilter.toLowerCase())).map(pkg => (
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
    );
}
