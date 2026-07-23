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
        <div className="w-12 bg-[#2D2B55] flex flex-col items-center pt-2 shrink-0 border-r border-[#1E1B4B] relative overflow-visible">
            {ACTIVITY_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = sidePanel === item.id;

                return (
                    <div
                        key={item.id}
                        onClick={() => setSidePanel(item.id)}
                        title={item.label}
                        className={`w-10 h-10 flex items-center justify-center cursor-pointer mb-1 rounded-md transition-all duration-150 border-l-[3px] ${
                            isActive
                                ? "bg-[#8B5CF6]/30 border-[#8B5CF6]"
                                : "bg-transparent border-transparent hover:bg-white/5"
                        }`}
                    >
                        <Icon size={20} className={isActive ? "text-[#A78BFA]" : "text-gray-400"} />
                    </div>
                );
            })}

            <div className="flex-1" />

            <div ref={uploadAreaRef} className="relative pb-3.5 flex items-center justify-center">
                {showUploadMenu && (
                    <div className="absolute left-3 bottom-[72px] w-[184px] bg-[#181828]/96 border border-[#A78BFA]/25 rounded-2xl shadow-[0_18px_40px_rgba(15,23,42,0.28)] p-2 flex flex-col gap-1.5 z-30 backdrop-blur-md">
                        {uploadItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setShowUploadMenu(false);
                                    item.onClick?.();
                                }}
                                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border-none bg-white/5 text-[#F5F3FF] cursor-pointer text-left hover:bg-white/10 transition-colors"
                            >
                                <span className="min-w-[34px] p-0.5 px-1.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] text-[10px] font-bold font-mono text-center">
                                    {item.badge}
                                </span>
                                <span className="text-xs font-semibold">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => setShowUploadMenu((prev) => !prev)}
                    title="Upload Files"
                    className="w-10.5 h-10.5 rounded-full border-[3px] border-white/75 bg-gradient-to-b from-[#FF3B7A] to-[#E11D48] cursor-pointer flex items-center justify-center relative shadow-[0_12px_28px_rgba(225,29,72,0.35)] hover:scale-105 transition-transform"
                >
                    <Upload size={18} className="text-white" />
                    <span className="absolute -top-0.75 -right-0.75 w-4 h-4 rounded-full bg-white text-[#E11D48] flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.2)]">
                        <Plus size={11} />
                    </span>
                </button>
            </div>
        </div>
    );
}
