/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback } from 'react';

interface Extension {
    id: string;
    name: string;
    description: string;
    emoji: string;
    color: string;
    cat: string;
    iconBg: string;
    icon: string;
    requires?: string;
    badge?: string;
}

const EXTENSIONS: Extension[] = [
    // AI & ML
    { id: 'face_detection', name: 'Face Detection', description: 'Detect and recognize human faces in real-time using the camera.', emoji: '👤', color: 'linear-gradient(135deg,#f9a825,#ffe082)', cat: 'ai', iconBg: '#f5c518', icon: '🎯' },
    { id: 'object_detection', name: 'Object Detection', description: 'Identify objects from image using AI vision models.', emoji: '🐱', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'ai', iconBg: '#3dba7e', icon: '🔎' },
    { id: 'human_body', name: 'Human Body Detection', description: 'Identify human body parts, poses and hand gestures from image.', emoji: '🤸', color: 'linear-gradient(135deg,#283593,#7986cb)', cat: 'ai', iconBg: '#5c6bc0', icon: '✋' },
    { id: 'hand_pose', name: 'Hand Pose Detection', description: 'Identify hand gestures and track finger positions in real-time.', emoji: '✋', color: 'linear-gradient(135deg,#283593,#7986cb)', cat: 'ai', iconBg: '#3f51b5', icon: '🖐️' },
    { id: 'ml_environment', name: 'Machine Learning Environment', description: 'Classify Image, Pose, Hand Pose, Text, Number & Object Detection.', emoji: '🧠', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'ai', iconBg: '#43a047', icon: '🤖', requires: '📡 WiFi' },
    { id: 'teachable_machine', name: 'ML with Teachable Machine', description: "Classify Image & Pose using Google's Teachable Machine.", emoji: '🎓', color: 'linear-gradient(135deg,#880e4f,#f48fb1)', cat: 'ai', iconBg: '#e91e63', icon: '📚', requires: '🖥 📡' },
    { id: 'computer_vision', name: 'Computer Vision', description: 'Detect Object, Brand, Landmark & Celebrity using cloud AI.', emoji: '👁️', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'ai', iconBg: '#8e24aa', icon: '🔍', requires: '🖥 📡' },
    { id: 'text_recognition', name: 'Text Recognition', description: 'Read printed and handwritten text from images using OCR.', emoji: '📝', color: 'linear-gradient(135deg,#558b2f,#aed581)', cat: 'ai', iconBg: '#7cb342', icon: '📄', requires: '🖥 📡' },
    { id: 'speech_recognition', name: 'Speech Recognition', description: 'Convert speech to text in real-time using microphone input.', emoji: '🎙️', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'ai', iconBg: '#1e88e5', icon: '🔊', requires: '📡', badge: 'New' },
    { id: 'chatgpt', name: 'ChatGPT (Alpha)', description: 'Gamify your learning with ChatGPT integration.', emoji: '💬', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'ai', iconBg: '#10a37f', icon: '🤖', requires: '🖥 📡' },

    // IoT & Connectivity
    { id: 'weather', name: 'Weather Data', description: 'Get real-time weather data by location anywhere on Earth.', emoji: '🌤️', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'iot', iconBg: '#1976d2', icon: '☁️', requires: '📡' },
    { id: 'ifttt', name: 'IFTTT Webhooks', description: 'Trigger IFTTT Webhooks to automate anything.', emoji: '⚡', color: 'linear-gradient(135deg,#f9a825,#ffe082)', cat: 'iot', iconBg: '#f5c518', icon: '🔗', requires: '📡' },
    { id: 'iot', name: 'Internet of Things (IoT)', description: 'Connect projects across the globe with IoT sensors!', emoji: '🌐', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'iot', iconBg: '#7b1fa2', icon: '📡', requires: '📡' },
    { id: 'alexa', name: 'Alexa (Alpha)', description: 'Play with the Alexa skill — voice-enable your projects.', emoji: '🔵', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'iot', iconBg: '#232f3e', icon: '🎵', badge: 'New' },

    // Games & Animation
    { id: 'physics', name: 'Physics Engine', description: 'Add real-world motions, gravity and forces to sprites.', emoji: '🎾', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'games', iconBg: '#388e3c', icon: '⚽' },
    { id: 'pen', name: 'Pen', description: 'Draw trails, patterns and shapes with your sprites.', emoji: '✏️', color: 'linear-gradient(135deg,#558b2f,#aed581)', cat: 'games', iconBg: '#558b2f', icon: '🖌️' },
    { id: 'music', name: 'Music', description: 'Play instruments, drums, and compose musical sequences.', emoji: '🎹', color: 'linear-gradient(135deg,#880e4f,#f48fb1)', cat: 'games', iconBg: '#c62828', icon: '🥁' },
    { id: 'video_sensing', name: 'Video Sensing', description: 'Sense motion and movement with the camera.', emoji: '📷', color: 'linear-gradient(135deg,#006064,#4dd0e1)', cat: 'games', iconBg: '#00838f', icon: '🎥' },
    { id: 'content_creation', name: 'Content Creation (Alpha)', description: 'Create interactive buttons, paragraphs, quizzes & more.', emoji: '✨', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'games', iconBg: '#1565c0', icon: '📝', badge: 'New' },

    // Utilities
    { id: 'qr_scanner', name: 'QR Code Scanner', description: 'Detect and identify QR codes using the camera.', emoji: '📱', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'hardware', iconBg: '#00695c', icon: '📷' },
    { id: 'text_to_speech', name: 'Text to Speech', description: 'Make your projects talk with natural-sounding voices.', emoji: '🔈', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'hardware', iconBg: '#6a1b9a', icon: '💬', requires: '📡' },
    { id: 'translate', name: 'Translate', description: 'Translate text into many languages instantly.', emoji: '🌍', color: 'linear-gradient(135deg,#006064,#4dd0e1)', cat: 'hardware', iconBg: '#006064', icon: '🔤', requires: '📡' },
    { id: 'data_logger', name: 'Data Logger', description: 'Store project data in a CSV file for analysis.', emoji: '📊', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'hardware', iconBg: '#2e7d32', icon: '📋' },
    { id: 'video_player', name: 'Video Player', description: 'Play videos from YouTube, URL or local PC files.', emoji: '🎬', color: 'linear-gradient(135deg,#e65100,#ffb74d)', cat: 'hardware', iconBg: '#e65100', icon: '▶️', requires: '📡' },
    { id: 'makey_makey', name: 'Makey Makey', description: 'Make anything a key — turn bananas into controllers!', emoji: '🎮', color: 'linear-gradient(135deg,#b71c1c,#ef9a9a)', cat: 'hardware', iconBg: '#b71c1c', icon: '🕹️' },
];

const SECTIONS = [
    { key: 'ai', label: '🤖 AI & Machine Learning' },
    { key: 'iot', label: '🌐 IoT & Connectivity' },
    { key: 'games', label: '🎮 Games & Animation' },
    { key: 'hardware', label: '🛠️ Utilities' },
];

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'ai', label: 'AI & ML' },
    { key: 'games', label: 'Games' },
    { key: 'iot', label: 'IoT' },
    { key: 'hardware', label: 'Utilities' },
];

interface JuniorExtensionLibraryProps {
    onClose: () => void;
    onSelectExtension: (id: string) => void;
    installedExtensions?: Set<string>;
}

export default function JuniorExtensionLibrary({
    onClose,
    onSelectExtension,
    installedExtensions = new Set(),
}: JuniorExtensionLibraryProps) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    // Local installed set so clicking Add gives instant feedback
    const [localInstalled, setLocalInstalled] = useState<Set<string>>(new Set(installedExtensions));

    // Sync if parent passes updated set
    useEffect(() => {
        setLocalInstalled(new Set(installedExtensions));
    }, [installedExtensions]);

    // Also listen for postMessage (iframe-based extensions still work)
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.data?.type === 'ADD_EXTENSION') {
                const extId = event.data.extensionId || event.data.extension;
                if (extId) {
                    setLocalInstalled(prev => new Set([...prev, extId]));
                    onSelectExtension(extId);
                }
            }
        }
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSelectExtension]);

    const handleAdd = useCallback((ext: Extension, e: React.MouseEvent) => {
        e.stopPropagation();
        const id = ext.id;
        setLocalInstalled(prev => new Set([...prev, id]));
        onSelectExtension(id);
    }, [onSelectExtension]);

    // Filter
    const filteredExtensions = EXTENSIONS.filter(ext => {
        const catMatch = activeFilter === 'all' || ext.cat === activeFilter;
        const textMatch = !search ||
            ext.name.toLowerCase().includes(search.toLowerCase()) ||
            ext.description.toLowerCase().includes(search.toLowerCase());
        return catMatch && textMatch;
    });

    const groupedSections = SECTIONS
        .map(section => ({
            ...section,
            extensions: filteredExtensions.filter(ext => ext.cat === section.key),
        }))
        .filter(section => section.extensions.length > 0);

    const totalInstalled = localInstalled.size;

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col" style={{ fontFamily: "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: '#f0eaf8' }}>
            <style>{`
                .jel-scroll::-webkit-scrollbar { width: 7px; }
                .jel-scroll::-webkit-scrollbar-track { background: transparent; }
                .jel-scroll::-webkit-scrollbar-thumb { background: #c4a0e0; border-radius: 10px; }
                .jel-scroll::-webkit-scrollbar-thumb:hover { background: #9b6fd4; }
                .jel-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
                .jel-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(74,21,128,0.16) !important; }
                .jel-card:active { transform: translateY(-1px); }
                .jel-add-btn { transition: all 0.15s ease; }
                .jel-add-btn:hover:not(:disabled) { transform: scale(1.06); }
                .jel-add-btn:active:not(:disabled) { transform: scale(0.97); }
                .jel-filter-btn { transition: all 0.15s ease; }
                .jel-filter-btn:hover { transform: scale(1.04); }
                @keyframes jel-pop { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
                .jel-animate { animation: jel-pop 0.22s cubic-bezier(0.34,1.56,0.64,1); }
            `}</style>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #3d0f6e 0%, #5a1a9e 100%)',
                color: '#fff', height: 56, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 20px',
                boxShadow: '0 3px 14px rgba(0,0,0,0.28)', flexShrink: 0, zIndex: 10,
            }}>
                <button
                    onClick={onClose}
                    style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 30, padding: '6px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: 0.4 }}>Choose an Extension</span>
                    {totalInstalled > 0 && (
                        <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
                            {totalInstalled} added to project
                        </span>
                    )}
                </div>

                <div style={{ width: 90 }} />
            </div>

            {/* ── Filter Bar ─────────────────────────────────────────────── */}
            <div style={{
                background: '#dcc8f5', padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0,
                borderBottom: '1px solid #cbb0e8',
            }}>
                {/* Search */}
                <div style={{
                    background: '#fff', borderRadius: 30, padding: '6px 14px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 200,
                }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search extensions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: '#1a1a2e', width: 160 }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                    )}
                </div>

                {/* Category filters */}
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            className="jel-filter-btn"
                            onClick={() => setActiveFilter(f.key)}
                            style={{
                                border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                                padding: '6px 16px', borderRadius: 30, cursor: 'pointer',
                                background: activeFilter === f.key ? '#5a1a9e' : 'rgba(90,26,158,0.18)',
                                color: activeFilter === f.key ? '#fff' : '#5a1a9e',
                                boxShadow: activeFilter === f.key ? '0 3px 10px rgba(90,26,158,0.35)' : 'none',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Extension Grid ─────────────────────────────────────────── */}
            <div className="jel-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 24px' }}>
                {groupedSections.map(section => (
                    <div key={section.key} style={{ marginBottom: 32 }}>
                        {/* Section header */}
                        <div style={{
                            fontSize: 15, fontWeight: 900, color: '#4a1580',
                            paddingBottom: 8, marginBottom: 16,
                            borderBottom: '2px solid #cbb0e8',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            {section.label}
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#9b6fd4', marginLeft: 4 }}>
                                ({section.extensions.length})
                            </span>
                        </div>

                        {/* Cards grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 16,
                        }}>
                            {section.extensions.map(ext => {
                                const isInstalled = localInstalled.has(ext.id);
                                return (
                                    <div
                                        key={ext.id}
                                        className="jel-card jel-animate"
                                        style={{
                                            background: '#fff', borderRadius: 16,
                                            overflow: 'hidden',
                                            boxShadow: isInstalled
                                                ? '0 0 0 2.5px #5a1a9e, 0 6px 20px rgba(74,21,128,0.14)'
                                                : '0 4px 16px rgba(74,21,128,0.09)',
                                            display: 'flex', flexDirection: 'column',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Card banner */}
                                        <div style={{
                                            background: ext.color, height: 130,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                            <span style={{ fontSize: 52, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.2))', zIndex: 2 }}>{ext.emoji}</span>

                                            {/* Badge (New) */}
                                            {ext.badge && (
                                                <span style={{
                                                    position: 'absolute', top: 10, right: 10,
                                                    background: '#3dba7e', color: '#fff',
                                                    fontSize: 10, fontWeight: 800, padding: '3px 9px',
                                                    borderRadius: 20, letterSpacing: 0.5, zIndex: 3,
                                                }}>{ext.badge}</span>
                                            )}

                                            {/* Requires badge */}
                                            {ext.requires && (
                                                <span style={{
                                                    position: 'absolute', bottom: 8, right: 8,
                                                    background: 'rgba(255,255,255,0.88)', color: '#1a1a2e',
                                                    fontSize: 10, fontWeight: 700, padding: '3px 8px',
                                                    borderRadius: 8, zIndex: 3,
                                                }}>{ext.requires}</span>
                                            )}

                                            {/* Icon chip */}
                                            <div style={{
                                                position: 'absolute', bottom: 8, left: 8,
                                                width: 38, height: 38, borderRadius: 10,
                                                background: ext.iconBg, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 3,
                                            }}>{ext.icon}</div>

                                            {/* Installed checkmark */}
                                            {isInstalled && (
                                                <div style={{
                                                    position: 'absolute', top: 8, left: 8,
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: '#5a1a9e', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)', zIndex: 4,
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card body */}
                                        <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', lineHeight: 1.2 }}>{ext.name}</div>
                                            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.45, flex: 1 }}>{ext.description}</div>

                                            {/* Add / Added button */}
                                            <button
                                                className="jel-add-btn"
                                                onClick={e => handleAdd(ext, e)}
                                                disabled={isInstalled}
                                                style={{
                                                    marginTop: 8, border: 'none', borderRadius: 10,
                                                    padding: '8px 0', fontFamily: 'inherit',
                                                    fontWeight: 800, fontSize: 13, cursor: isInstalled ? 'default' : 'pointer',
                                                    width: '100%',
                                                    background: isInstalled
                                                        ? 'linear-gradient(135deg, #5a1a9e, #7b2fd4)'
                                                        : 'linear-gradient(135deg, #7b2fd4, #9b4de8)',
                                                    color: '#fff',
                                                    boxShadow: isInstalled
                                                        ? 'none'
                                                        : '0 4px 12px rgba(123,47,212,0.35)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                    opacity: isInstalled ? 0.85 : 1,
                                                }}
                                            >
                                                {isInstalled ? (
                                                    <>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        Added to Project
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                                        </svg>
                                                        Add to Project
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {groupedSections.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <p style={{ fontSize: 15, fontWeight: 600 }}>No extensions found for "{search}"</p>
                        <button
                            onClick={() => setSearch('')}
                            style={{ marginTop: 12, border: 'none', background: '#5a1a9e', color: '#fff', borderRadius: 20, padding: '8px 20px', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <div style={{
                textAlign: 'center', padding: '10px 16px',
                color: '#7b2fd4', fontSize: 12, fontWeight: 600,
                background: '#e8d9f5', borderTop: '1px solid #d0b8ec', flexShrink: 0,
            }}>
                🧩 Click <strong>Add to Project</strong> to add an extension's blocks to your workspace
            </div>
        </div>
    );
}
