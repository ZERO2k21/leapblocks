/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { FileText, Sprout, Image, Package, Download, Upload, Plus } from "lucide-react";

const ACTIVITY_ITEMS = [
    { id: "files", icon: FileText, label: "Files" },
    { id: "sprites", icon: Sprout, label: "Sprites" },
    { id: "backdrops", icon: Image, label: "Backdrops" },
    { id: "extensions", icon: Package, label: "Extensions" },
    { id: "pip", icon: Download, label: "Packages" },
];

export default function ActivityBar({
    sidePanel,
    setSidePanel,
    onCSVUpload,
    onTextUpload,
    onImageUpload,
    onVideoUpload,
    onAudioUpload,
    onPythonUpload,
}) {
    const [showUploadMenu, setShowUploadMenu] = React.useState(false);
    const uploadAreaRef = React.useRef(null);

    React.useEffect(() => {
        const handlePointerDown = (event) => {
            if (!uploadAreaRef.current?.contains(event.target)) {
                setShowUploadMenu(false);
            }
        };

        window.addEventListener("mousedown", handlePointerDown);
        return () => window.removeEventListener("mousedown", handlePointerDown);
    }, []);

    const uploadItems = [
        { id: "csv", badge: "CSV", label: "Upload CSV", onClick: onCSVUpload },
        { id: "txt", badge: "TXT", label: "Upload Text", onClick: onTextUpload },
        { id: "photo", badge: "IMG", label: "Upload Photo", onClick: onImageUpload },
        { id: "video", badge: "VID", label: "Upload Video", onClick: onVideoUpload },
        { id: "audio", badge: "AUD", label: "Upload Audio", onClick: onAudioUpload },
        { id: "python", badge: "PY", label: "Upload Python", onClick: onPythonUpload },
    ];

    return (
        <div className="w-12 bg-slate-900 flex flex-col items-center pt-2 shrink-0 border-r border-slate-800 relative overflow-visible">
            {ACTIVITY_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = sidePanel === item.id;

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setSidePanel(item.id)}
                        title={item.label}
                        className={`w-10 h-10 flex items-center justify-center cursor-pointer mb-1 rounded-md transition-all duration-150 border-l-4 ${
                            isActive
                                ? "bg-purple-600/30 border-purple-500"
                                : "bg-transparent border-transparent hover:bg-white/5"
                        }`}
                    >
                        <Icon size={20} className={isActive ? "text-purple-300" : "text-slate-400"} />
                    </button>
                );
            })}

            <div className="flex-1" />

            <div ref={uploadAreaRef} className="relative pb-3.5 flex items-center justify-center">
                {showUploadMenu && (
                    <div className="absolute left-3 bottom-18 w-44 bg-slate-900/95 border border-purple-300/25 rounded-2xl shadow-2xl p-2 flex flex-col gap-1.5 z-30 backdrop-blur-md">
                        {uploadItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setShowUploadMenu(false);
                                    item.onClick?.();
                                }}
                                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border-0 bg-white/5 text-purple-50 cursor-pointer text-left hover:bg-white/10 transition-colors"
                            >
                                <span className="min-w-9 p-0.5 px-1.5 rounded-full bg-purple-600/20 text-purple-200 text-xs font-bold font-mono text-center">
                                    {item.badge}
                                </span>
                                <span className="text-xs font-semibold">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setShowUploadMenu((prev) => !prev)}
                    title="Upload Files"
                    className="w-10.5 h-10.5 rounded-full border-2 border-white/80 bg-gradient-to-b from-rose-500 to-rose-600 cursor-pointer flex items-center justify-center relative shadow-lg shadow-rose-600/30 hover:scale-105 transition-transform"
                >
                    <Upload size={18} className="text-white" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-md">
                        <Plus size={11} />
                    </span>
                </button>
            </div>
        </div>
    );
}
