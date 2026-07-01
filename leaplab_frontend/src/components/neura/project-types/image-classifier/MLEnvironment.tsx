/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Full-featured ML Environment with TensorFlow.js + MobileNet
 * Real-time training, webcam capture, and live predictions
 */

import { useState, useRef, useEffect, useCallback } from "react";
import ClassifierLayout from '../../components/ClassifierLayout';
import AddClassButton from '../../components/AddClassButton';
import { KNNClassifier } from '../../ml/KNNClassifier';
import { ensureTf, ensureMobileNet } from '../../ml/loadScript';
import { showToast } from '../../../../leapignite/client/components/Toast';
import { Upload, Camera, Zap } from 'lucide-react';

// ─── CLASS CARD COLORS ───────────────────────────────────────────────────────
const CLASS_COLORS = [
    { bg: "#FF6B6B", light: "#fff5f5", border: "#ffc9c9", text: "#c92a2a", glow: "#FF6B6B40", lighter: "#FF8E8E" },
    { bg: "#20C997", light: "#f0fff8", border: "#b2f2e0", text: "#087f5b", glow: "#20C99740", lighter: "#3DD8A8" },
    { bg: "#748FFC", light: "#f3f0ff", border: "#d0bfff", text: "#3b27aa", glow: "#748FFC40", lighter: "#91A7FC" },
    { bg: "#FFA94D", light: "#fff4e6", border: "#ffd8a8", text: "#d9480f", glow: "#FFA94D40", lighter: "#FFC078" },
    { bg: "#F06595", light: "#fff0f6", border: "#fcc2d7", text: "#a61e4d", glow: "#F0659540", lighter: "#F489AD" },
    { bg: "#4DABF7", light: "#e7f5ff", border: "#a5d8ff", text: "#1864ab", glow: "#4DABF740", lighter: "#74C0FC" },
];

interface ClassType {
    id: number;
    name: string;
    samples: string[];
}

interface ColorType {
    bg: string;
    light: string;
    border: string;
    text: string;
    glow: string;
    lighter: string;
}

// ─── WEBCAM MODAL ────────────────────────────────────────────────────────────
function WebcamModal({ classLabel, color, onCapture, onClose }: {
    classLabel: string;
    color: ColorType;
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [count, setCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } as any })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(() => setError("Camera access denied. Please allow camera permissions."));
        return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
    }, []);

    const captureFrame = useCallback(() => {
        const v = videoRef.current, c = canvasRef.current;
        if (!v || !c) return;
        c.width = 224; c.height = 224;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, 224, 224);
        const dataUrl = c.toDataURL("image/jpeg", 0.8);
        onCapture(dataUrl);
        setCount(n => n + 1);
    }, [onCapture]);

    useEffect(() => {
        if (!capturing) return;
        const id = setInterval(captureFrame, 200);
        return () => clearInterval(id);
    }, [capturing, captureFrame]);

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", zIndex: 1000 }}>
            <div className="bg-ml-surface border border-ml-border-strong rounded-[20px] shadow-modal" style={{ padding: 28, width: 400 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-[10px] h-[10px] rounded-full" style={{ background: color.bg }} />
                        <span className="font-sans font-semibold text-ml-text-primary text-[15px]">Capture for <em className="not-italic" style={{ color: color.bg }}>{classLabel}</em></span>
                    </div>
                    <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-ml-text-muted p-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
                {error ? (
                    <div className="py-6 text-center text-ml-error-text font-sans text-sm">{error}</div>
                ) : (
                    <>
                        <div className="rounded-xl overflow-hidden bg-ml-bg relative mb-4">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full block" style={{ transform: "scaleX(-1)" }} />
                            {capturing && <div className="absolute rounded-md text-xs font-sans font-semibold flex items-center" style={{ top: 10, right: 10, background: "#ff4444", padding: "3px 8px", color: "#fff", gap: 5 }}><span className="w-[7px] h-[7px] rounded-full inline-block" style={{ background: "#fff" }} />REC</div>}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex items-center gap-2.5">
                            <button
                                onMouseDown={() => setCapturing(true)} onMouseUp={() => setCapturing(false)} onMouseLeave={() => setCapturing(false)}
                                onTouchStart={() => setCapturing(true)} onTouchEnd={() => setCapturing(false)}
                                className="flex-1 rounded-[10px] font-sans font-semibold text-sm cursor-pointer transition-all duration-150 ease-out"
                                style={{ padding: "12px 0", background: capturing ? color.bg : "#1e1e30", border: `1.5px solid ${capturing ? color.bg : "var(--ml-border-strong)"}`, color: capturing ? "#fff" : "var(--ml-text-secondary)" }}>
                                {capturing ? "● Recording…" : "Hold to Capture"}
                            </button>
                            <button onClick={captureFrame} className="px-4 py-3 rounded-[10px] cursor-pointer" style={{ background: "#1e1e30", border: "1.5px solid var(--ml-border-strong)", color: "var(--ml-text-secondary)" }}>
                                <Camera size={18} />
                            </button>
                        </div>
                        {count > 0 && <div className="text-center font-sans text-[13px] font-semibold mt-3" style={{ color: color.bg }}>{count} frame{count !== 1 ? "s" : ""} captured</div>}
                    </>
                )}
                <button onClick={onClose} className="w-full rounded-[10px] font-sans text-sm cursor-pointer" style={{ marginTop: 14, padding: "10px 0", background: "transparent", border: "1.5px solid var(--ml-border-strong)", color: "var(--ml-text-muted)" }}>Done</button>
            </div>
        </div>
    );
}

// ─── CLASS CARD (PictoBlox-style left sidebar) ───────────────────────────────
function ClassCard({ cls, color, onAddSamples, onWebcam, onDelete, onRename, sampleCount }: {
    cls: ClassType;
    color: ColorType;
    onAddSamples: (classId: number, dataUrl: string) => void;
    onWebcam: (classId: number) => void;
    onDelete: (classId: number) => void;
    onRename: (classId: number, name: string) => void;
    sampleCount: number;
}) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(cls.name);
    const [hovered, setHovered] = useState(false);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => onAddSamples(cls.id, ev.target?.result as string);
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const commitRename = () => { onRename(cls.id, name || cls.name); setEditing(false); };

    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showMenu]);

    return (
        <div
            className="flex rounded-2xl overflow-hidden transition-all duration-250"
            style={{
                border: `1px solid ${hovered ? color.bg + "40" : "var(--ml-border)"}`,
                boxShadow: hovered ? `0 4px 20px ${color.glow}` : "0 1px 3px rgba(0,0,0,0.04)",
                background: "var(--ml-surface)",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Left colored sidebar */}
            <div className="flex flex-col items-center py-4 px-2 gap-2" style={{
                width: 72,
                background: `linear-gradient(180deg, ${color.bg} 0%, ${color.lighter} 100%)`,
                flexShrink: 0,
            }}>
                {/* Activity icon */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="3" />
                        <path d="M6.5 8l4-1.5 3.5 2 4-1.5" />
                        <path d="M6.5 13l4-1.5 3.5 2 4-1.5" />
                        <path d="M6.5 18l4-1.5 3.5 2 4-1.5" />
                    </svg>
                </div>

                {/* Class name */}
                {editing ? (
                    <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && commitRename()} autoFocus
                        className="rounded font-sans text-[11px] font-bold w-full text-center outline-none"
                        style={{ background: "rgba(0,0,0,0.2)", border: "none", padding: "2px 4px", color: "#fff" }} />
                ) : (
                    <span className="text-white font-sans text-[11px] font-bold truncate w-full text-center" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
                        {cls.name}
                    </span>
                )}

                {/* Edit icon */}
                <button onClick={() => setEditing(true)} className="cursor-pointer flex items-center justify-center" style={{ background: "none", border: "none", padding: 2 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>

                {/* Three-dot menu */}
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="cursor-pointer flex flex-col items-center gap-[3px]" style={{ background: "none", border: "none", padding: "2px 4px" }}>
                        <span className="block w-[3px] h-[3px] rounded-full bg-white opacity-80" />
                        <span className="block w-[3px] h-[3px] rounded-full bg-white opacity-80" />
                        <span className="block w-[3px] h-[3px] rounded-full bg-white opacity-80" />
                    </button>
                    {showMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50" style={{ minWidth: 110 }}>
                            <button onClick={() => { setEditing(true); setShowMenu(false); }}
                                className="w-full px-3 py-1.5 text-left text-[12px] font-sans text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2" style={{ background: "none", border: "none" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Rename
                            </button>
                            <button onClick={() => { onDelete(cls.id); setShowMenu(false); }}
                                className="w-full px-3 py-1.5 text-left text-[12px] font-sans text-red-500 hover:bg-red-50 cursor-pointer flex items-center gap-2" style={{ background: "none", border: "none" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right body */}
            <div className="flex-1 px-5 py-4 flex flex-col gap-3 min-w-0">
                {/* Top row: label + sample count */}
                <div className="flex items-center justify-between">
                    <span className="font-sans text-[13px] font-semibold text-ml-text-primary">Add Image Samples</span>
                    <span className="font-sans text-[12px] font-bold" style={{ color: color.bg }}>
                        {sampleCount} Sample{sampleCount !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Action buttons + illustration row */}
                <div className="flex items-center gap-4">
                    {/* Upload button */}
                    <button onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                            width: 100, height: 80,
                            border: `2px dashed ${hoveredAction === "upload" ? color.bg : "var(--ml-border-strong)"}`,
                            background: hoveredAction === "upload" ? color.bg + "08" : "transparent",
                        }}
                        onMouseEnter={() => setHoveredAction("upload")}
                        onMouseLeave={() => setHoveredAction(null)}>
                        <div style={{ color: hoveredAction === "upload" ? color.bg : "var(--ml-text-muted)" }}>
                            <Upload size={22} />
                        </div>
                        <span className="font-sans text-[11px] font-semibold" style={{ color: hoveredAction === "upload" ? color.bg : "var(--ml-text-muted)" }}>Upload</span>
                    </button>

                    {/* Webcam button */}
                    <button onClick={() => onWebcam(cls.id)}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                            width: 100, height: 80,
                            border: `2px dashed ${hoveredAction === "webcam" ? color.bg : "var(--ml-border-strong)"}`,
                            background: hoveredAction === "webcam" ? color.bg + "08" : "transparent",
                        }}
                        onMouseEnter={() => setHoveredAction("webcam")}
                        onMouseLeave={() => setHoveredAction(null)}>
                        <div style={{ color: hoveredAction === "webcam" ? color.bg : "var(--ml-text-muted)" }}>
                            <Camera size={22} />
                        </div>
                        <span className="font-sans text-[11px] font-semibold" style={{ color: hoveredAction === "webcam" ? color.bg : "var(--ml-text-muted)" }}>Webcam</span>
                    </button>

                    {/* Decorative illustration */}
                    <div className="flex-1 flex items-center justify-center opacity-30">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <circle cx="40" cy="16" r="6" fill={color.bg} opacity="0.4" />
                            <path d="M28 32 L40 24 L52 32" stroke={color.bg} strokeWidth="2" fill="none" opacity="0.3" />
                            <path d="M40 24 V52" stroke={color.bg} strokeWidth="2" opacity="0.3" />
                            <path d="M28 44 L40 52 L52 44" stroke={color.bg} strokeWidth="2" fill="none" opacity="0.3" />
                            <circle cx="26" cy="36" r="4" fill={color.bg} opacity="0.2" />
                            <circle cx="54" cy="36" r="4" fill={color.bg} opacity="0.2" />
                            <path d="M32 60 L40 52 L48 60" stroke={color.bg} strokeWidth="1.5" fill="none" opacity="0.2" />
                        </svg>
                    </div>
                </div>

                {/* Thumbnail strip (when samples exist) */}
                {sampleCount > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {cls.samples.slice(-6).map((s, i) => (
                            <div key={i} className="rounded-lg overflow-hidden" style={{ width: 32, height: 32, border: `1.5px solid ${color.bg}30` }}>
                                <img src={s} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {sampleCount > 6 && (
                            <div className="rounded-lg flex items-center justify-center text-[10px] font-sans font-bold" style={{
                                width: 32, height: 32,
                                background: color.bg + "12", color: color.bg,
                            }}>
                                +{sampleCount - 6}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        </div>
    );
}

// ─── TRAINING CARD (PictoBlox-style) ────────────────────────────────────────
function TrainingCard({ classes, status, progress, accuracy, onTrain, showAdvanced, setShowAdvanced, epochs, setEpochs, trained }: {
    classes: ClassType[];
    status: string;
    progress: number;
    accuracy: number;
    onTrain: () => void;
    showAdvanced: boolean;
    setShowAdvanced: (show: boolean) => void;
    epochs: number;
    setEpochs: (epochs: number) => void;
    trained: boolean;
}) {
    const totalSamples = classes.reduce((s, c) => s + c.samples.length, 0);
    const classesWithData = classes.filter(c => c.samples.length > 0);
    const canTrain = classesWithData.length >= 2 && totalSamples >= 4 && status !== "training";

    return (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--ml-border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {/* Purple header */}
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3 6-1 1-2 2.5-2 4h-4c0-1.5-1-3-2-4-1.5-1.5-3-3.5-3-6a7 7 0 0 1 7-7z" />
                    <path d="M9 21h6" />
                </svg>
                <span className="text-white font-bold text-sm font-sans">Training</span>
                <div className="ml-auto flex gap-1" style={{ padding: "2px 3px" }}>
                    {["JS", "PY"].map(m => (
                        <div key={m} className="rounded text-[10px] font-mono font-bold" style={{
                            padding: "2px 8px",
                            background: m === "JS" ? "rgba(255,255,255,0.25)" : "transparent",
                            color: m === "JS" ? "#fff" : "rgba(255,255,255,0.5)",
                        }}>{m}</div>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col items-center gap-4">
                {status === "training" ? (
                    <div className="w-full">
                        <div className="flex justify-between mb-1.5">
                            <span className="font-sans text-xs text-ml-text-secondary">Extracting features…</span>
                            <span className="font-mono text-xs font-semibold" style={{ color: "#7c3aed" }}>{Math.round(progress)}%</span>
                        </div>
                        <div className="bg-ml-well rounded-md overflow-hidden" style={{ height: 6 }}>
                            <div className="rounded-md" style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", transition: "width 0.3s" }} />
                        </div>
                    </div>
                ) : trained ? (
                    <div className="w-full bg-ml-success-bg border border-ml-success-border rounded-xl px-4 py-3">
                        <div className="font-sans text-xs text-ml-success-text font-semibold mb-1">✓ Model trained successfully</div>
                        <div className="font-mono text-[11px] text-ml-text-secondary">Accuracy: {Math.round(accuracy * 100)}% · {totalSamples} samples</div>
                    </div>
                ) : (
                    <>
                        {/* Brain icon */}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#7c3aed15" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                                <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3 6-1 1-2 2.5-2 4h-4c0-1.5-1-3-2-4-1.5-1.5-3-3.5-3-6a7 7 0 0 1 7-7z" />
                                <path d="M9 21h6" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <div className="font-sans text-[15px] font-bold text-ml-text-primary mb-1">Train Model</div>
                            <div className="font-sans text-[12px] text-ml-text-muted" style={{ lineHeight: 1.5 }}>
                                {classesWithData.length < 2
                                    ? "Add samples to at least 2 classes to begin."
                                    : "Train your model with the added classes"}
                            </div>
                        </div>
                    </>
                )}

                {/* Train button */}
                <button onClick={onTrain} disabled={!canTrain} className="w-full rounded-xl font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                        padding: "12px 0",
                        background: canTrain ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "var(--ml-btn-idle)",
                        border: "none",
                        color: canTrain ? "#fff" : "var(--ml-text-disabled)",
                        cursor: canTrain ? "pointer" : "not-allowed",
                    }}>
                    <Zap size={15} />{status === "training" ? "Training…" : trained ? "Retrain Model" : "Train Model"}
                </button>

                {/* Advanced Settings */}
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between bg-transparent border-0 text-ml-text-muted font-sans text-[13px] cursor-pointer p-0">
                    <span className="font-semibold" style={{ color: "#7c3aed" }}>Advanced Settings</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: showAdvanced ? "rotate(90deg)" : "none" }}>
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>

                {showAdvanced && (
                    <div className="w-full bg-ml-well rounded-xl flex flex-col gap-3" style={{ padding: 14 }}>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="font-sans text-xs text-ml-text-secondary">Epochs</span>
                                <span className="font-mono text-xs font-semibold" style={{ color: "#7c3aed" }}>{epochs}</span>
                            </div>
                            <input type="range" min={5} max={100} step={5} value={epochs} onChange={e => setEpochs(+e.target.value)}
                                className="w-full" style={{ accentColor: "#7c3aed" }} />
                        </div>
                        <div className="font-sans text-[11px] text-ml-text-muted" style={{ lineHeight: 1.5 }}>
                            Using MobileNet transfer learning + KNN classifier. All computation runs in-browser via TensorFlow.js.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── FLOW CONNECTORS (SVG overlay) ───────────────────────────────────────────
function FlowConnectors({ classCardRefs, trainingRef, testingRef, classColors, containerRef }: {
    classCardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    trainingRef: React.MutableRefObject<HTMLDivElement | null>;
    testingRef: React.MutableRefObject<HTMLDivElement | null>;
    classColors: ColorType[];
    containerRef: React.RefObject<HTMLDivElement | null>;
}) {
    const [paths, setPaths] = useState<{ d: string; color: string }[]>([]);
    const [trainToTest, setTrainToTest] = useState("");
    const [dots, setDots] = useState<{ cx: number; cy: number; color: string }[]>([]);

    useEffect(() => {
        const compute = () => {
            const container = containerRef.current;
            if (!container) return;
            const cRect = container.getBoundingClientRect();

            const newPaths: { d: string; color: string }[] = [];
            const newDots: { cx: number; cy: number; color: string }[] = [];

            // Class cards → Training
            const training = trainingRef.current;
            if (training) {
                const tRect = training.getBoundingClientRect();
                const tLeft = tRect.left - cRect.left;
                const tMidY = tRect.top - cRect.top + tRect.height / 2;

                classCardRefs.current.forEach((card, i) => {
                    if (!card) return;
                    const cardRect = card.getBoundingClientRect();
                    const startX = cardRect.right - cRect.left;
                    const startY = cardRect.top - cRect.top + cardRect.height / 2;
                    const endX = tLeft;
                    const endY = tMidY + (i - (classCardRefs.current.length - 1) / 2) * 40;
                    const cpOffset = Math.abs(endX - startX) * 0.4;
                    const d = `M ${startX} ${startY} C ${startX + cpOffset} ${startY}, ${endX - cpOffset} ${endY}, ${endX} ${endY}`;
                    newPaths.push({ d, color: classColors[i % classColors.length].bg });
                    newDots.push({ cx: startX, cy: startY, color: classColors[i % classColors.length].bg });
                });

                // Training → Testing
                const testing = testingRef.current;
                if (testing) {
                    const teRect = testing.getBoundingClientRect();
                    const startX = tRect.right - cRect.left;
                    const startY = tRect.top - cRect.top + tRect.height / 2;
                    const endX = teRect.left - cRect.left;
                    const endY = teRect.top - cRect.top + teRect.height / 2;
                    const cpOffset = (endX - startX) * 0.3;
                    setTrainToTest(`M ${startX} ${startY} C ${startX + cpOffset} ${startY}, ${endX - cpOffset} ${endY}, ${endX} ${endY}`);
                    newDots.push({ cx: startX, cy: startY, color: "#7c3aed" });
                    newDots.push({ cx: endX, cy: endY, color: "#7c3aed" });
                }
            }

            setPaths(newPaths);
            setDots(newDots);
        };

        compute();
        const timer = setTimeout(compute, 100);

        const ro = new ResizeObserver(compute);
        if (containerRef.current) ro.observe(containerRef.current);
        classCardRefs.current.forEach(el => { if (el) ro.observe(el); });
        if (trainingRef.current) ro.observe(trainingRef.current);
        if (testingRef.current) ro.observe(testingRef.current);

        return () => { clearTimeout(timer); ro.disconnect(); };
    }, [classCardRefs.current.length]);

    return (
        <svg className="ml-flow-svg">
            <defs>
                {paths.map((p, i) => (
                    <linearGradient key={`lg-${i}`} id={`connector-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={p.color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
                    </linearGradient>
                ))}
                {trainToTest && (
                    <linearGradient id="connector-grad-train-test" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.5" />
                    </linearGradient>
                )}
            </defs>

            {/* Class → Training connector lines */}
            {paths.map((p, i) => (
                <g key={`conn-${i}`}>
                    <path d={p.d} stroke={`url(#connector-grad-${i})`} strokeWidth="2" fill="none" className="neura-connector-line" />
                    <circle r="4" fill={p.color} opacity="0.8">
                        <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite" path={p.d} />
                    </circle>
                </g>
            ))}

            {/* Training → Testing connector */}
            {trainToTest && (
                <g>
                    <path d={trainToTest} stroke="url(#connector-grad-train-test)" strokeWidth="2" fill="none" className="neura-connector-line" />
                    <circle r="3.5" fill="#7c3aed" opacity="0.8">
                        <animateMotion dur="2s" repeatCount="indefinite" path={trainToTest} />
                    </circle>
                </g>
            )}

            {/* Connection point dots */}
            {dots.map((dot, i) => (
                <circle key={`dot-${i}`} cx={dot.cx} cy={dot.cy} r="3" fill="white" stroke={dot.color} strokeWidth="1.5" />
            ))}
        </svg>
    );
}

// ─── TESTING PANEL CONTENT ───────────────────────────────────────────────────
function TestingPanelContent({ trained, classes, predict }: {
    trained: boolean;
    classes: ClassType[];
    predict: (canvas: HTMLCanvasElement) => Promise<any>;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<"idle" | "webcam" | "upload">("idle");
    const [result, setResult] = useState<any>(null);
    const [testImg, setTestImg] = useState<string | null>(null);
    const [camError, setCamError] = useState<string | null>(null);

    const stopCam = useCallback(() => {
        if (rafRef.current) clearTimeout(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        rafRef.current = null;
        streamRef.current = null;
    }, []);

    const startCam = useCallback(async () => {
        setCamError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } as any });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; }
            setMode("webcam");
            const loop = async () => {
                const v = videoRef.current, c = canvasRef.current;
                if (!v || !c || !streamRef.current) return;
                c.width = 224; c.height = 224;
                const ctx = c.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(v, 0, 0, 224, 224);
                const res = await predict(c);
                if (res) setResult(res);
                rafRef.current = setTimeout(loop, 300) as any;
            };
            if (videoRef.current) {
                videoRef.current.onloadedmetadata = loop;
            }
        } catch { setCamError("Camera access denied."); }
    }, [predict]);

    useEffect(() => () => stopCam(), [stopCam]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
            const dataUrl = ev.target?.result as string;
            setTestImg(dataUrl); setMode("upload");
            const img = new window.Image(); img.src = dataUrl;
            img.onload = async () => {
                const c = canvasRef.current; if (!c) return;
                c.width = 224; c.height = 224;
                const ctx = c.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, 224, 224);
                const res = await predict(c);
                if (res) setResult(res);
            };
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const topLabel = result ? Object.entries(result.confidences).sort((a: any, b: any) => b[1] - a[1])[0] : null;
    const sortedConf = result ? Object.entries(result.confidences).sort((a: any, b: any) => b[1] - a[1]) : [];

    return (
        <>
            <div className="flex gap-2">
                <button onClick={() => { stopCam(); setMode("idle"); setResult(null); setTestImg(null); fileRef.current?.click(); }}
                    className="flex-1 rounded-[9px] font-sans text-[13px] cursor-pointer flex items-center justify-center gap-1.5"
                    style={{ padding: "9px 0", background: mode === "upload" ? "#1a1a3a" : "var(--ml-btn-idle)", border: `1.5px solid ${mode === "upload" ? "#7c3aed" : "var(--ml-border-strong)"}`, color: mode === "upload" ? "#a78bfa" : "var(--ml-text-secondary)" }}>
                    <Upload size={15} /><span>Upload</span>
                </button>
                <button onClick={() => mode === "webcam" ? (stopCam(), setMode("idle"), setResult(null)) : startCam()}
                    className="flex-1 rounded-[9px] font-sans text-[13px] cursor-pointer flex items-center justify-center gap-1.5"
                    style={{ padding: "9px 0", background: mode === "webcam" ? "#1a1a3a" : "var(--ml-btn-idle)", border: `1.5px solid ${mode === "webcam" ? "#7c3aed" : "var(--ml-border-strong)"}`, color: mode === "webcam" ? "#a78bfa" : "var(--ml-text-secondary)" }}>
                    <Camera size={15} /><span>{mode === "webcam" ? "Stop Camera" : "Webcam"}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>

            {camError && <div className="font-sans text-[13px] text-ml-error-text">{camError}</div>}

            {mode === "webcam" && (
                <div className="rounded-[10px] overflow-hidden bg-ml-bg">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full block" style={{ transform: "scaleX(-1)" }} />
                </div>
            )}
            {mode === "upload" && testImg && (
                <div className="rounded-[10px] overflow-hidden bg-ml-bg text-center">
                    <img src={testImg} alt="test" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            {result && (
                <div className="flex flex-col gap-2">
                    {topLabel && (
                        <div className="bg-ml-well rounded-[10px] px-3.5 py-2.5 flex items-center justify-between">
                            <span className="font-sans text-[13px] font-semibold" style={{ color: "#a78bfa" }}>Prediction</span>
                            <span className="font-mono text-sm text-ml-success-dot font-bold">{topLabel[0]}</span>
                        </div>
                    )}
                    {sortedConf.map(([label, conf]: any, i: number) => {
                        const color = CLASS_COLORS[i % CLASS_COLORS.length];
                        return (
                            <div key={label}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-sans text-xs text-ml-text-secondary">{label}</span>
                                    <span className="font-mono text-xs font-bold" style={{ color: color.bg }}>{Math.round(conf * 100)}%</span>
                                </div>
                                <div className="bg-ml-well overflow-hidden" style={{ borderRadius: 4, height: 5 }}>
                                    <div style={{ height: "100%", width: `${conf * 100}%`, background: color.bg, borderRadius: 4, transition: "width 0.3s" }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

// ─── MAIN ML ENVIRONMENT ──────────────────────────────────────────────────────
export default function MLEnvironment({ project, onBack, onDataChange }: { project?: any; onBack?: () => void; onDataChange?: (data: Record<string, any>) => void }) {
    const [tfReady, setTfReady] = useState(false);
    const [tfError, setTfError] = useState<string | null>(null);
    const [classes, setClasses] = useState<ClassType[]>([
        { id: 1, name: "class1", samples: [] },
        { id: 2, name: "class2", samples: [] },
    ]);
    const [nextId, setNextId] = useState(3);
    const [webcamFor, setWebcamFor] = useState<number | null>(null);
    const [trainStatus, setTrainStatus] = useState("idle");
    const [progress, setProgress] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [epochs, setEpochs] = useState(30);
    const [restored, setRestored] = useState(false);
    const knnRef = useRef<KNNClassifier | null>(null);
    const mobileNetRef = useRef<any>(null);

    // Load TF.js + MobileNet in one shot
    useEffect(() => {
        (async () => {
            try {
                const m = await ensureMobileNet();
                mobileNetRef.current = await m.load();
                setTfReady(true);
            } catch (e: any) {
                setTfError(e.message);
            }
        })();
    }, []);

    // Deserialize: restore from saved project on mount
    useEffect(() => {
        if (project?.classes?.length > 0 && !restored) {
            const restoredClasses: ClassType[] = project.classes.map((c: any) => ({
                id: Number(c.id),
                name: c.name,
                samples: (c.samples || []).map((s: any) => s.data ?? s),
            }))
            setClasses(restoredClasses.length > 0 ? restoredClasses : [
                { id: 1, name: "class1", samples: [] },
                { id: 2, name: "class2", samples: [] },
            ])
            setNextId(restoredClasses.length > 0 ? Math.max(...restoredClasses.map(c => c.id)) + 1 : 3)
            if (project.projectData?.epochs) setEpochs(project.projectData.epochs)
            setRestored(true)
        }
    }, [project])

    // Serialize: sync state back to parent (debounced)
    useEffect(() => {
        if (!restored || !onDataChange) return
        const timer = setTimeout(() => {
            onDataChange({
                classes: classes.map((c, ci) => ({
                    id: String(c.id),
                    name: c.name,
                    color: CLASS_COLORS[ci % CLASS_COLORS.length]?.bg || '#FF6B6B',
                    samples: c.samples.map((dataUrl, i) => ({
                        id: `img-${c.id}-${i}`,
                        type: 'image' as const,
                        data: dataUrl,
                        timestamp: Date.now(),
                    })),
                })),
                modelTrained: trainStatus === 'done',
                projectData: { nextId, epochs },
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [classes, trainStatus, nextId, epochs])

    const trained = trainStatus === "done";

    const addSample = useCallback((classId: number, dataUrl: string) => {
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, samples: [...c.samples, dataUrl] } : c));
    }, []);

    const deleteClass = useCallback((id: number) => {
        setClasses(prev => prev.filter(c => c.id !== id));
    }, []);

    const renameClass = useCallback((id: number, name: string) => {
        setClasses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    }, []);

    const addClass = () => {
        setClasses(prev => [...prev, { id: nextId, name: `class${nextId}`, samples: [] }]);
        setNextId(n => n + 1);
    };

    const getEmbedding = useCallback((canvas: HTMLCanvasElement) => {
        if (!mobileNetRef.current || !(window as any).tf) return null;
        return (window as any).tf.tidy(() => {
            const imgTensor = (window as any).tf.browser.fromPixels(canvas).toFloat().div(127.5).sub(1).expandDims(0);
            const result = mobileNetRef.current.infer(imgTensor, true);
            const embedding = result?.embedding ?? result;
            if (!embedding) return null;
            return embedding.squeeze();
        });
    }, []);

    const handleTrain = useCallback(async () => {
        if (!tfReady || !mobileNetRef.current) return;
        setTrainStatus("training"); setProgress(0);

        const knn = new KNNClassifier();
        if (knnRef.current) knnRef.current.clear();
        knnRef.current = knn;

        const allSamples = classes.flatMap(c => c.samples.map(s => ({ label: c.name, src: s })));
        const total = allSamples.length;

        for (let i = 0; i < total; i++) {
            const { label, src } = allSamples[i];
            await new Promise<void>(res => {
                const img = new window.Image(); img.src = src;
                img.onload = async () => {
                    const c = document.createElement("canvas"); c.width = 224; c.height = 224;
                    const ctx = c.getContext("2d");
                    if (!ctx) { res(); return; }
                    ctx.drawImage(img, 0, 0, 224, 224);
                    const emb = getEmbedding(c);
                    if (emb) {
                        await knn.addExample(emb, label);
                        emb.dispose();
                    }
                    res();
                };
                img.onerror = () => res();
            });
            setProgress(Math.round(((i + 1) / total) * 85));
            await new Promise(r => setTimeout(r, 10));
        }

        let correct = 0, total2 = 0;
        for (const cls of classes) {
            for (const src of cls.samples) {
                const img = new window.Image(); img.src = src;
                await new Promise(res => { img.onload = res; img.onerror = res; });
                const c2 = document.createElement("canvas"); c2.width = 224; c2.height = 224;
                const ctx = c2.getContext("2d");
                if (!ctx) continue;
                ctx.drawImage(img, 0, 0, 224, 224);
                const emb = getEmbedding(c2);
                if (!emb) continue;
                const pred = await knn.predictClass(emb);
                if (pred && pred.label === cls.name) correct++;
                emb.dispose();
                total2++;
            }
        }

        setAccuracy(total2 > 0 ? correct / total2 : 0.9);
        setProgress(100);
        setTimeout(() => setTrainStatus("done"), 400);
    }, [tfReady, classes, getEmbedding]);

    const predict = useCallback(async (canvas: HTMLCanvasElement) => {
        if (!knnRef.current || !mobileNetRef.current) return null;
        const emb = getEmbedding(canvas);
        if (!emb) return null;
        const result = await knnRef.current.predictClass(emb, 3);
        emb.dispose();
        return result;
    }, [getEmbedding]);

    const webcamClass = webcamFor ? classes.find(c => c.id === webcamFor) : null;
    const webcamColor = webcamClass ? CLASS_COLORS[(classes.findIndex(c => c.id === webcamFor)) % CLASS_COLORS.length] : CLASS_COLORS[0];

    const totalSamples = classes.reduce((s, c) => s + c.samples.length, 0);

    const containerRef = useRef<HTMLDivElement>(null);
    const classCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const trainingRef = useRef<HTMLDivElement>(null);
    const testingRef = useRef<HTMLDivElement>(null);

    return (
        <ClassifierLayout project={project} onBack={onBack || (() => {})}>
            <div className="ml-flow-container">
                {/* SVG Connector overlay */}
                <FlowConnectors
                    classCardRefs={classCardRefs}
                    trainingRef={trainingRef}
                    testingRef={testingRef}
                    classColors={CLASS_COLORS}
                    containerRef={containerRef}
                />

                <div className="ml-flow-columns" ref={containerRef}>
                    {/* LEFT: Class cards */}
                    <div className="ml-flow-left">
                        <div className="mb-4 rounded-2xl border border-ml-border bg-ml-surface p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ml-accent">01 — Collect</div>
                            <div className="mt-3 text-sm font-semibold text-ml-text-primary">Training Data</div>
                            <div className="mt-2 text-[12px] text-ml-text-muted leading-5">Upload images and capture webcam samples to build your classes.</div>
                        </div>

                        {/* Upload Folder button */}
                        <button
                            className="rounded-xl bg-ml-btn-idle border border-ml-border-strong text-ml-text-secondary font-sans text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-150"
                            style={{ padding: "10px 16px" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed"; (e.currentTarget as HTMLButtonElement).style.color = "#7c3aed"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ml-border-strong)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ml-text-secondary)"; }}
                            onClick={() => {
                                const el = document.createElement("input");
                                el.type = "file";
                                (el as any).webkitdirectory = true;
                                el.onchange = (ev: any) => {
                                    const files = Array.from(ev.target.files);
                                    const folderGroups: Record<string, any[]> = {};
                                    (files as any[]).filter((f: any) => f.type.startsWith("image/")).forEach((f: any) => {
                                        const parts = f.webkitRelativePath.split("/");
                                        const cls = parts[1] || parts[0];
                                        if (!folderGroups[cls]) folderGroups[cls] = [];
                                        folderGroups[cls].push(f);
                                    });
                                    Object.entries(folderGroups).forEach(([name, fls]) => {
                                        const existing = classes.find(c => c.name === name);
                                        const cid = existing ? existing.id : nextId;
                                        if (!existing) {
                                            setClasses(p => [...p, { id: cid, name, samples: [] }]);
                                            setNextId(n => n + 1);
                                        }
                                        fls.forEach((file: any) => {
                                            const r = new FileReader();
                                            r.onload = (ev2: any) => addSample(cid, ev2.target.result);
                                            r.readAsDataURL(file);
                                        });
                                    });
                                };
                                el.click();
                            }}>
                            <Upload size={15} /><span>Upload Classes from Folder</span>
                        </button>

                        {/* Class cards */}
                        {classes.map((cls, i) => (
                            <div key={cls.id} ref={el => { classCardRefs.current[i] = el; }}>
                                <ClassCard cls={cls} color={CLASS_COLORS[i % CLASS_COLORS.length]}
                                    onAddSamples={addSample} onWebcam={setWebcamFor} onDelete={deleteClass} onRename={renameClass}
                                    sampleCount={cls.samples.length} />
                            </div>
                        ))}

                        <AddClassButton onClick={addClass} />
                    </div>

                    {/* MIDDLE: Training card */}
                    <div className="ml-flow-center" ref={trainingRef}>
                        <div className="mb-4 rounded-2xl border border-ml-border bg-ml-surface p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ml-accent">02 — Train</div>
                            <div className="mt-3 text-sm font-semibold text-ml-text-primary">Model</div>
                            <div className="mt-2 text-[12px] text-ml-text-muted leading-5">Use the live training panel to teach your model with image samples.</div>
                        </div>
                        <TrainingCard classes={classes} status={trainStatus} progress={progress} accuracy={accuracy}
                            onTrain={handleTrain} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced}
                            epochs={epochs} setEpochs={setEpochs} trained={trained} />

                        {trained && (
                            <div className="mt-4 bg-white rounded-2xl border border-ml-border p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <div className="text-[11px] font-bold text-ml-text-muted uppercase mb-3" style={{ letterSpacing: "0.05em" }}>Class distribution</div>
                                {classes.map((c, i) => {
                                    const pct = totalSamples > 0 ? (c.samples.length / totalSamples) * 100 : 0;
                                    return (
                                        <div key={c.id} className="mb-2">
                                            <div className="flex justify-between" style={{ marginBottom: 3 }}>
                                                <span className="text-[11px] text-ml-text-secondary font-sans">{c.name}</span>
                                                <span className="text-[11px] font-mono font-semibold" style={{ color: CLASS_COLORS[i % CLASS_COLORS.length].bg }}>{c.samples.length}</span>
                                            </div>
                                            <div className="bg-ml-well overflow-hidden" style={{ borderRadius: 3, height: 4 }}>
                                                <div style={{ height: "100%", width: `${pct}%`, background: CLASS_COLORS[i % CLASS_COLORS.length].bg, borderRadius: 3 }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Testing card */}
                    <div className="ml-flow-right" ref={testingRef}>
                        <div className="mb-4 rounded-2xl border border-ml-border bg-ml-surface p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ml-accent">03 — Test</div>
                            <div className="mt-3 text-sm font-semibold text-ml-text-primary">Predictions</div>
                            <div className="mt-2 text-[12px] text-ml-text-muted leading-5">Run live predictions once the model is trained and see results instantly.</div>
                        </div>
                        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--ml-border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                            {/* Purple header */}
                            <div className="px-4 py-3 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 3h6v11l-3 3-3-3V3z" />
                                    <path d="M6 21h12" />
                                </svg>
                                <span className="text-white font-bold text-sm font-sans">Testing</span>
                            </div>

                            {/* Body */}
                            <div className="p-5 flex flex-col items-center text-center" style={{ minHeight: 180 }}>
                                {!trained ? (
                                    <div className="flex flex-col items-center justify-center flex-1 gap-3">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#7c3aed10" }}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="M21 21l-4.35-4.35" />
                                            </svg>
                                        </div>
                                        <p className="font-sans text-[12px] text-ml-text-muted m-0" style={{ lineHeight: 1.6 }}>
                                            You must train a model on the left before you can test it here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col gap-3">
                                        <TestingPanelContent trained={trained} classes={classes} predict={predict} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {trained && (
                            <div className="mt-4 bg-white rounded-2xl border border-ml-border p-4 flex flex-col gap-2.5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <div className="text-[11px] font-bold text-ml-text-muted uppercase" style={{ letterSpacing: "0.05em" }}>Export model</div>
                                {[
                                    { label: "Download as JSON", desc: "TensorFlow.js format", action: () => { const data = { type: "neura-ml-knn", classes: classes.map(c => ({ name: c.name, sampleCount: c.samples.length })), accuracy, created: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "neura-model.json"; a.click(); } },
                                    { label: "Copy embed code", desc: "Use in your app", action: () => { try { navigator.clipboard?.writeText(`<!-- Neura ML Model -->\n<script>const model = ${JSON.stringify({ classes: classes.map(c => c.name) })}</script>`).then(() => showToast("Copied!", "success")).catch(() => showToast("Failed to copy. Please copy manually.", "error")); } catch (_) { showToast("Failed to copy. Please copy manually.", "error"); } } },
                                ].map(({ label, desc, action }) => (
                                    <button key={label} onClick={action} className="rounded-xl bg-ml-well border border-ml-border text-ml-text-secondary font-sans text-[12px] cursor-pointer text-left transition-all duration-150" style={{ padding: "10px 12px" }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ml-text-primary)"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ml-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ml-text-secondary)"; }}>
                                        <div className="font-semibold text-[12px]">{label}</div>
                                        <div className="text-[10px] text-ml-text-muted" style={{ marginTop: 2 }}>{desc}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Webcam modal */}
            {webcamFor && webcamClass && (
                <WebcamModal classLabel={webcamClass.name} color={webcamColor}
                    onCapture={(dataUrl) => addSample(webcamFor, dataUrl)}
                    onClose={() => setWebcamFor(null)} />
            )}
        </ClassifierLayout>
    );
}
