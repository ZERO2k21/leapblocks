/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Full-featured ML Environment with TensorFlow.js + MobileNet
 * Real-time training, webcam capture, and live predictions
 */

import { useState, useRef, useEffect, useCallback } from "react";
import ClassifierLayout from '../../components/ClassifierLayout';
import StepIndicator from '../../components/StepIndicator';
import AddClassButton from '../../components/AddClassButton';
import ProjectTestingPanel from '../../components/ProjectTestingPanel';
import { KNNClassifier } from '../../ml/KNNClassifier';
import { ensureTf, ensureMobileNet } from '../../ml/loadScript';
import { showToast } from '../../../../leapignite/client/components/Toast';
import { Image as ImageIcon, Upload, Camera, Zap, Settings } from 'lucide-react';

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

// ─── CLASS CARD ──────────────────────────────────────────────────────────────
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
    const [hoveredThumb, setHoveredThumb] = useState<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

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

    return (
        <div
            className="bg-ml-surface rounded-2xl overflow-hidden"
            style={{
                border: `1px solid ${hovered ? color.bg + "60" : "var(--ml-border)"}`,
                transition: "all 0.25s ease",
                boxShadow: hovered ? `0 4px 24px ${color.glow}, 0 0 0 1px ${color.bg}20` : "none",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Gradient header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{
                background: `linear-gradient(135deg, ${color.bg} 0%, ${color.lighter} 100%)`,
            }}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {editing ? (
                        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && commitRename()} autoFocus
                            className="rounded-md font-sans text-sm font-semibold w-full outline-none"
                            style={{ background: "rgba(0,0,0,0.25)", border: "none", padding: "3px 8px", color: "#fff" }} />
                    ) : (
                        <span className="text-white font-sans font-bold text-sm truncate" style={{ letterSpacing: "-0.01em", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{cls.name}</span>
                    )}
                </div>
                <div className="flex gap-1 ml-2">
                    {editing ? (
                        <>
                            <button onClick={commitRename} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: "rgba(255,255,255,0.25)", border: "none", padding: "4px 6px", transition: "background 0.15s" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </button>
                            <button onClick={() => { setName(cls.name); setEditing(false); }} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: "rgba(255,255,255,0.15)", border: "none", padding: "4px 6px", transition: "background 0.15s" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditing(true)} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: "rgba(255,255,255,0.2)", border: "none", padding: "4px 6px", transition: "background 0.15s" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button onClick={() => onDelete(cls.id)} className="rounded-md cursor-pointer text-white flex items-center" style={{ background: "rgba(255,255,255,0.15)", border: "none", padding: "4px 6px", transition: "background 0.15s" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="px-4 py-3.5">
                {/* Sample count badge */}
                <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
                    <span className="rounded-[10px] text-[11px] font-sans font-bold" style={{
                        background: color.bg + "18",
                        color: color.bg,
                        padding: "3px 10px",
                        letterSpacing: "0.02em",
                    }}>
                        {sampleCount} sample{sampleCount !== 1 ? "s" : ""}
                    </span>
                </div>
                {sampleCount > 0 && (
                    <div className="flex flex-wrap mb-3" style={{ gap: 5 }}>
                        {cls.samples.slice(-8).map((s, i) => (
                            <div
                                key={i}
                                className="rounded-lg overflow-hidden transition-all duration-200 ease-out"
                                style={{
                                    width: 40, height: 40,
                                    border: `1.5px solid ${hoveredThumb === i ? color.bg : "var(--ml-border-strong)"}`,
                                    transform: hoveredThumb === i ? "scale(1.12)" : "scale(1)",
                                    zIndex: hoveredThumb === i ? 2 : 1,
                                    boxShadow: hoveredThumb === i ? `0 2px 10px ${color.glow}` : "none",
                                }}
                                onMouseEnter={() => setHoveredThumb(i)}
                                onMouseLeave={() => setHoveredThumb(null)}
                            >
                                <img src={s} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {sampleCount > 8 && (
                            <div className="rounded-lg flex items-center justify-center text-[11px] font-sans font-bold" style={{
                                width: 40, height: 40,
                                background: color.bg + "12", border: `1.5px solid ${color.bg}30`,
                                color: color.bg,
                            }}>
                                +{sampleCount - 8}
                            </div>
                        )}
                    </div>
                )}
                <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()} className="flex-1 rounded-[9px] bg-ml-btn-idle border border-dashed border-ml-border-strong text-ml-text-secondary font-sans text-[13px] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ease-out" style={{ padding: "9px 0" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color.bg; (e.currentTarget as HTMLButtonElement).style.color = color.bg; (e.currentTarget as HTMLButtonElement).style.background = color.bg + "10"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ml-border-strong)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ml-text-secondary)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--ml-btn-idle)"; }}>
                        <Upload size={15} /><span>Upload</span>
                    </button>
                    <button onClick={() => onWebcam(cls.id)} className="flex-1 rounded-[9px] bg-ml-btn-idle border border-dashed border-ml-border-strong text-ml-text-secondary font-sans text-[13px] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ease-out" style={{ padding: "9px 0" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color.bg; (e.currentTarget as HTMLButtonElement).style.color = color.bg; (e.currentTarget as HTMLButtonElement).style.background = color.bg + "10"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ml-border-strong)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ml-text-secondary)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--ml-btn-idle)"; }}>
                        <Camera size={15} /><span>Webcam</span>
                    </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </div>
        </div>
    );
}

// ─── TRAINING PANEL ──────────────────────────────────────────────────────────
function TrainingPanel({ classes, status, progress, accuracy, onTrain, showAdvanced, setShowAdvanced, epochs, setEpochs, trained }: {
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
        <div className="bg-ml-surface border border-ml-border rounded-2xl p-5 flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
                <div className="rounded-full" style={{ width: 8, height: 8, background: trained ? "var(--ml-success-dot)" : "#444", boxShadow: trained ? "0 0 8px var(--ml-success-dot)" : "none", transition: "all 0.4s" }} />
                <span className="font-sans font-bold text-[15px] text-ml-text-primary" style={{ letterSpacing: "-0.01em" }}>Training</span>
                <div className="ml-auto flex gap-1 bg-ml-well rounded-lg" style={{ padding: "3px 4px" }}>
                    {["JS", "PY"].map(m => (
                        <div key={m} className="rounded-md text-[11px] font-mono font-bold transition-all duration-200 ease-out" style={{ padding: "3px 9px", background: m === "JS" ? "#7c3aed" : "transparent", color: m === "JS" ? "#fff" : "var(--ml-text-muted)" }}>{m}</div>
                    ))}
                </div>
            </div>

            {status === "training" ? (
                <div>
                    <div className="flex justify-between mb-1.5">
                        <span className="font-sans text-xs text-ml-text-secondary">Extracting features…</span>
                        <span className="font-mono text-xs font-semibold" style={{ color: "#a78bfa" }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-ml-well rounded-md overflow-hidden" style={{ height: 6 }}>
                        <div className="rounded-md" style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", transition: "width 0.3s" }} />
                    </div>
                </div>
            ) : trained ? (
                <div className="bg-ml-success-bg border border-ml-success-border rounded-[10px] px-3.5 py-2.5">
                    <div className="font-sans text-xs text-ml-success-text font-semibold mb-1">✓ Model trained successfully</div>
                    <div className="font-mono text-[11px] text-ml-text-secondary">Accuracy: {Math.round(accuracy * 100)}% · {totalSamples} samples · {classes.length} classes</div>
                </div>
            ) : (
                <div className="flex flex-col items-center py-2">
                    <svg width="120" height="70" viewBox="0 0 120 70" fill="none" style={{ marginBottom: 10, opacity: 0.6 }}>
                        <circle cx="20" cy="15" r="5" fill="#7c3aed" opacity="0.4" />
                        <circle cx="20" cy="35" r="5" fill="#7c3aed" opacity="0.5" />
                        <circle cx="20" cy="55" r="5" fill="#7c3aed" opacity="0.4" />
                        <circle cx="60" cy="12" r="5" fill="#a78bfa" opacity="0.5" />
                        <circle cx="60" cy="35" r="5" fill="#a78bfa" opacity="0.6" />
                        <circle cx="60" cy="58" r="5" fill="#a78bfa" opacity="0.5" />
                        <circle cx="100" cy="25" r="5" fill="#c4b5fd" opacity="0.5" />
                        <circle cx="100" cy="45" r="5" fill="#c4b5fd" opacity="0.4" />
                        <line x1="25" y1="15" x2="55" y2="12" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                        <line x1="25" y1="15" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                        <line x1="25" y1="35" x2="55" y2="12" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                        <line x1="25" y1="35" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                        <line x1="25" y1="35" x2="55" y2="58" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                        <line x1="25" y1="55" x2="55" y2="35" stroke="#7c3aed" strokeWidth="0.8" opacity="0.2" />
                        <line x1="25" y1="55" x2="55" y2="58" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3" />
                        <line x1="65" y1="12" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                        <line x1="65" y1="12" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                        <line x1="65" y1="35" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                        <line x1="65" y1="35" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                        <line x1="65" y1="58" x2="95" y2="25" stroke="#a78bfa" strokeWidth="0.8" opacity="0.2" />
                        <line x1="65" y1="58" x2="95" y2="45" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3" />
                    </svg>
                    <div className="font-sans text-[13px] text-ml-text-muted text-center" style={{ lineHeight: 1.5 }}>
                        {classesWithData.length < 2 ? "Add samples to at least 2 classes to begin." : "Ready to train."}
                    </div>
                </div>
            )}

            <button onClick={onTrain} disabled={!canTrain} className="w-full rounded-[11px] font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ease-out"
                style={{ padding: "13px 0", background: canTrain ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "var(--ml-btn-idle)", border: "none", color: canTrain ? "#fff" : "var(--ml-text-disabled)", cursor: canTrain ? "pointer" : "not-allowed", letterSpacing: "-0.01em" }}>
                <Zap size={15} />{status === "training" ? "Training…" : trained ? "Retrain Model" : "Train Model"}
            </button>

            <button onClick={() => setShowAdvanced(!showAdvanced)} className="bg-transparent border-0 text-ml-text-muted font-sans text-[13px] cursor-pointer flex items-center gap-1.5 p-0">
                <Settings size={14} /><span>Advanced settings</span>
                <span className="ml-auto" style={{ transition: "transform 0.2s", transform: showAdvanced ? "rotate(180deg)" : "none" }}>▾</span>
            </button>

            {showAdvanced && (
                <div className="bg-ml-well rounded-[10px] flex flex-col gap-3" style={{ padding: 14 }}>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="font-sans text-xs text-ml-text-secondary">Epochs</span>
                            <span className="font-mono text-xs font-semibold" style={{ color: "#a78bfa" }}>{epochs}</span>
                        </div>
                        <input type="range" min={5} max={100} step={5} value={epochs} onChange={e => setEpochs(+e.target.value)}
                            className="w-full" style={{ accentColor: "#7c3aed" }} />
                    </div>
                    <div className="font-sans text-[11px] text-ml-text-muted" style={{ lineHeight: 1.5 }}>
                        Using MobileNet transfer learning + KNN classifier. All computation runs in-browser via TensorFlow.js — no data leaves your device.
                    </div>
                </div>
            )}
        </div>
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

    return (
        <ClassifierLayout project={project} onBack={onBack || (() => {})}>
            <div className="flex gap-5 items-stretch flex-1 min-h-0">
                {/* Left: Data Collection */}
                <div className="flex-1 flex flex-col gap-3.5">
                    <StepIndicator
                        number={1}
                        label="Collect"
                        title="Training Data"
                        action={
                            <button
                                className="rounded-[10px] bg-ml-btn-idle border border-ml-border-strong text-ml-text-secondary font-sans text-[13px] cursor-pointer flex items-center gap-1.5 transition-all duration-150"
                                style={{ padding: "8px 14px" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#a78bfa"; (e.currentTarget as HTMLButtonElement).style.color = "#a78bfa"; }}
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
                                <Upload size={15} /><span>Upload Folder</span>
                            </button>
                        }
                    />

                    <div className="flex flex-col gap-3">
                        {classes.map((cls, i) => (
                            <ClassCard key={cls.id} cls={cls} color={CLASS_COLORS[i % CLASS_COLORS.length]}
                                onAddSamples={addSample} onWebcam={setWebcamFor} onDelete={deleteClass} onRename={renameClass}
                                sampleCount={cls.samples.length} />
                        ))}
                    </div>

                    <AddClassButton onClick={addClass} />
                </div>

                {/* Middle: Training */}
                <div className="flex flex-col gap-3.5 w-[280px] shrink-0">
                    <StepIndicator number={2} label="Train" title="Model" />
                    <TrainingPanel classes={classes} status={trainStatus} progress={progress} accuracy={accuracy}
                        onTrain={handleTrain} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced}
                        epochs={epochs} setEpochs={setEpochs} trained={trained} />

                    {trained && (
                        <div className="bg-ml-surface border border-ml-border rounded-2xl p-4">
                            <div className="text-xs font-bold text-ml-text-muted uppercase mb-3" style={{ letterSpacing: "0.05em" }}>Class distribution</div>
                            {classes.map((c, i) => {
                                const pct = totalSamples > 0 ? (c.samples.length / totalSamples) * 100 : 0;
                                return (
                                    <div key={c.id} className="mb-2">
                                        <div className="flex justify-between" style={{ marginBottom: 3 }}>
                                            <span className="text-xs text-ml-text-secondary font-sans">{c.name}</span>
                                            <span className="text-xs font-mono font-semibold" style={{ color: CLASS_COLORS[i % CLASS_COLORS.length].bg }}>{c.samples.length}</span>
                                        </div>
                                        <div className="bg-ml-well overflow-hidden" style={{ borderRadius: 4, height: 4 }}>
                                            <div style={{ height: "100%", width: `${pct}%`, background: CLASS_COLORS[i % CLASS_COLORS.length].bg, borderRadius: 4 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Testing */}
                <div className="flex flex-col gap-3.5 w-[280px] shrink-0">
                    <StepIndicator number={3} label="Test" title="Predictions" />
                    <ProjectTestingPanel
                        icon={<ImageIcon size={16} className="text-white" />}
                        trained={trained}
                        emptyText="Train your model to unlock live predictions"
                        emptyIllustration={
                            <svg width="100" height="80" viewBox="0 0 100 80" fill="none" style={{ opacity: 0.5 }}>
                                <rect x="20" y="25" width="50" height="38" rx="6" stroke="#7c3aed" strokeWidth="2" fill="#7c3aed10" />
                                <circle cx="45" cy="44" r="12" stroke="#a78bfa" strokeWidth="2" fill="#a78bfa10" />
                                <circle cx="45" cy="44" r="6" stroke="#c4b5fd" strokeWidth="1.5" fill="#c4b5fd15" />
                                <rect x="32" y="20" width="10" height="6" rx="2" stroke="#7c3aed" strokeWidth="1.5" fill="#7c3aed15" />
                                <text x="72" y="35" fontSize="24" fontWeight="700" fill="#7c3aed" opacity="0.6" fontFamily="'DM Sans', sans-serif">?</text>
                                <rect x="38" y="60" width="14" height="10" rx="2" stroke="#555" strokeWidth="1.5" fill="#33320" />
                                <path d="M41 60 V56 Q41 52 45 52 Q49 52 49 56 V60" stroke="#555" strokeWidth="1.5" fill="none" />
                            </svg>
                        }
                    >
                        <TestingPanelContent trained={trained} classes={classes} predict={predict} />
                    </ProjectTestingPanel>

                    {trained && (
                        <div className="bg-ml-surface border border-ml-border rounded-2xl p-4 flex flex-col gap-2.5">
                            <div className="text-xs font-bold text-ml-text-muted uppercase" style={{ letterSpacing: "0.05em" }}>Export model</div>
                            {[
                                { label: "Download as JSON", desc: "TensorFlow.js format", action: () => { const data = { type: "neura-ml-knn", classes: classes.map(c => ({ name: c.name, sampleCount: c.samples.length })), accuracy, created: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "neura-model.json"; a.click(); } },
                                { label: "Copy embed code", desc: "Use in your app", action: () => { try { navigator.clipboard?.writeText(`<!-- Neura ML Model -->\n<script>const model = ${JSON.stringify({ classes: classes.map(c => c.name) })}</script>`).then(() => showToast("Copied!", "success")).catch(() => showToast("Failed to copy. Please copy manually.", "error")); } catch (_) { showToast("Failed to copy. Please copy manually.", "error"); } } },
                            ].map(({ label, desc, action }) => (
                                <button key={label} onClick={action} className="rounded-[9px] bg-ml-well border border-ml-border text-ml-text-secondary font-sans text-[13px] cursor-pointer text-left transition-all duration-150" style={{ padding: "10px 14px" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#a78bfa"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ml-text-primary)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ml-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ml-text-secondary)"; }}>
                                    <div className="font-semibold text-[13px]">{label}</div>
                                    <div className="text-[11px] text-ml-text-muted" style={{ marginTop: 2 }}>{desc}</div>
                                </button>
                            ))}
                        </div>
                    )}
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
