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
    { id: 'pen', name: 'Pen', description: 'Draw trails and patterns with your sprites.', emoji: '✏️', color: 'linear-gradient(135deg,#558b2f,#aed581)', cat: 'games', iconBg: '#558b2f', icon: '🖌️' },
    { id: 'music', name: 'Music', description: 'Play instruments, drums, and compose musical sequences.', emoji: '🎹', color: 'linear-gradient(135deg,#880e4f,#f48fb1)', cat: 'games', iconBg: '#c62828', icon: '🥁' },
    { id: 'video_sensing', name: 'Video Sensing', description: 'Sense motion and movement with the camera.', emoji: '📷', color: 'linear-gradient(135deg,#006064,#4dd0e1)', cat: 'games', iconBg: '#00838f', icon: '🎥' },
    { id: 'content_creation', name: 'Content Creation (Alpha)', description: 'Create interactive buttons, paragraphs, quizzes & more.', emoji: '✨', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'games', iconBg: '#1565c0', icon: '📝', badge: 'New' },

    // Hardware / Utilities
    { id: 'qr_scanner', name: 'QR Code Scanner', description: 'Detect and Identify QR Code using camera.', emoji: '📱', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'hardware', iconBg: '#00695c', icon: '📷' },
    { id: 'text_to_speech', name: 'Text to Speech', description: 'Make your projects talk with natural-sounding voices.', emoji: '🔈', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'hardware', iconBg: '#6a1b9a', icon: '💬', requires: '📡' },
    { id: 'translate', name: 'Translate', description: 'Translate text into many languages instantly.', emoji: '🌍', color: 'linear-gradient(135deg,#006064,#4dd0e1)', cat: 'hardware', iconBg: '#006064', icon: '🔤', requires: '📡' },
    { id: 'data_logger', name: 'Data Logger', description: 'Store project data in a CSV File for analysis.', emoji: '📊', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'hardware', iconBg: '#2e7d32', icon: '📋' },
    { id: 'video_player', name: 'Video Player', description: 'Play videos from YouTube, URL or local PC files.', emoji: '🎬', color: 'linear-gradient(135deg,#e65100,#ffb74d)', cat: 'hardware', iconBg: '#e65100', icon: '▶️', requires: '📡' },
    { id: 'makey_makey', name: 'Makey Makey', description: 'Make anything a key — turn bananas into controllers!', emoji: '🎮', color: 'linear-gradient(135deg,#b71c1c,#ef9a9a)', cat: 'hardware', iconBg: '#b71c1c', icon: '🕹️' },
    { id: 'hand_pose', name: 'Hand Pose Detection', description: 'Identify hand gestures and track finger positions in real-time.', emoji: '✋', color: 'linear-gradient(135deg,#283593,#7986cb)', cat: 'ai', iconBg: '#3f51b5', icon: '🖐️' },
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
    { key: 'hardware', label: 'Hardware' },
    { key: 'iot', label: 'IoT' },
    { key: 'games', label: 'Games & Animation' },
];

interface JuniorExtensionLibraryProps {
    onClose: () => void;
    onSelectExtension: (id: string) => void;
}

export default function JuniorExtensionLibrary({ onClose, onSelectExtension }: JuniorExtensionLibraryProps) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [iframeExtension, setIframeExtension] = useState<Extension | null>(null);

    // Listen for postMessage from the iframe
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.data && event.data.type === 'ADD_EXTENSION') {
                const extId = event.data.extensionId;
                console.log('[ExtensionLibrary] ADD_EXTENSION received:', extId);
                setIframeExtension(null);
                if (onSelectExtension) {
                    onSelectExtension(extId);
                }
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSelectExtension]);

    const handleCardClick = useCallback((ext: Extension) => {
        setIframeExtension(ext);
    }, []);

    const handleIframeClose = useCallback(() => {
        setIframeExtension(null);
    }, []);

    // Build iframe URL from extension data
    const getIframeUrl = (ext: Extension) => {
        // Direct mappings for extensions with custom HTML files
        if (ext.id === 'pen') {
            return `/extensions/ext-pen.html`;
        }
        if (ext.id === 'face_detection' || ext.id === 'face-detection') {
            return `/extensions/ext-face-detection.html`;
        }
        if (ext.id === 'object_detection') {
            return `/extensions/ext-object-detection.html`;
        }
        if (ext.id === 'music') {
            return `/extensions/ext-music.html`;
        }

        // Generic detail page for other extensions
        const params = new URLSearchParams({
            id: ext.id,
            name: ext.name,
            desc: ext.description,
            emoji: encodeURIComponent(ext.emoji),
            color: encodeURIComponent(ext.color),
            cat: ext.cat,
            requires: ext.requires || '',
        });
        return `/extensions/ext-detail.html?${params.toString()}`;
    };

    // Filter extensions
    const filteredExtensions = EXTENSIONS.filter(ext => {
        const catMatch = activeFilter === 'all' || ext.cat === activeFilter;
        const textMatch = !search || ext.name.toLowerCase().includes(search.toLowerCase()) || ext.description.toLowerCase().includes(search.toLowerCase());
        return catMatch && textMatch;
    });

    // Group by section
    const groupedSections = SECTIONS.map(section => ({
        ...section,
        extensions: filteredExtensions.filter(ext => ext.cat === section.key),
    })).filter(section => section.extensions.length > 0);

    return (
        <div className="fixed inset-0 bg-[#e8d9f5] z-[1000] font-[Nunito,Segoe_UI,Tahoma,Geneva,Verdana,sans-serif] flex flex-col">
            <style>{`
                /* Scrollbar */
                .jel-content::-webkit-scrollbar { width: 8px; }
                .jel-content::-webkit-scrollbar-track { background: transparent; }
                .jel-content::-webkit-scrollbar-thumb { background: #c9a8e8; border-radius: 10px; }
                .jel-content::-webkit-scrollbar-thumb:hover { background: #a07dc5; }
                
                @keyframes iframeFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes iframePopIn {
                    from { opacity: 0; transform: scale(0.85) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            {/* Header */}
            <div className="bg-[#4a1580] text-white h-[54px] flex items-center justify-between px-6 sticky top-0 z-[100] shadow-[0_3px_12px_rgba(0,0,0,0.25)]">
                <button className="bg-transparent border-none text-white font-[inherit] font-bold text-[15px] flex items-center gap-2 cursor-pointer opacity-90 transition-opacity duration-200 px-2 py-1 hover:opacity-100" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                </button>
                <div className="text-lg font-extrabold tracking-[0.5px]">Choose an Extension</div>
                <button className="bg-[#6b2fa0] text-white border-none rounded-[30px] px-[18px] py-2 font-[inherit] font-bold text-sm cursor-pointer transition-colors duration-200 hover:bg-[#8840c2]">Read Documentation</button>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#c9a8e8] px-6 py-3.5 flex items-center gap-4 flex-wrap">
                <div className="bg-white rounded-[30px] px-4 py-[7px] flex items-center gap-2 shadow-[0_2px_6px_rgba(0,0,0,0.1)] min-w-[200px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="border-none outline-none bg-transparent font-[inherit] text-sm text-[#1a1a2e] w-[160px] placeholder-[#bbb]"
                        placeholder="Search extensions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`border-none text-white font-[inherit] font-bold text-[13px] px-[18px] py-2 rounded-[30px] cursor-pointer transition-all duration-200 hover:scale-105 ${activeFilter === f.key ? 'bg-[#e84545]' : 'bg-[#6b2fa0]'}`}
                            onClick={() => setActiveFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Extension Grid */}
            <div className="jel-content flex-1 overflow-y-auto px-7 pt-6 pb-3 scroll-smooth">
                {groupedSections.map(section => (
                    <div key={section.key}>
                        <div className="text-lg font-black text-[#4a1580] pb-1.5 border-b-[3px] border-[#c9a8e8] mt-5 mb-[18px] first:mt-0">{section.label}</div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5 mb-7 max-w-[1300px]">
                            {section.extensions.map(ext => (
                                <div
                                    key={ext.id}
                                    className="bg-white rounded-[14px] overflow-hidden shadow-[0_4px_18px_rgba(74,21,128,0.10)] cursor-pointer transition-all duration-200 no-underline text-inherit block relative group hover:-translate-y-[5px] hover:scale-[1.01] hover:shadow-[0_12px_32px_rgba(74,21,128,0.18)] active:-translate-y-[2px] active:scale-[0.99]"
                                    onClick={() => handleCardClick(ext)}
                                >
                                    <div className="w-full h-[160px] flex items-center justify-center relative overflow-hidden" style={{ background: ext.color }}>
                                        <span className="text-[56px] drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)] z-[2] transition-transform duration-300 group-hover:scale-[1.12] group-hover:-rotate-3">{ext.emoji}</span>
                                        {ext.badge && (
                                            <span className="absolute top-2.5 right-2.5 bg-[#3dba7e] text-white text-[11px] font-extrabold px-2.5 py-[3px] rounded-[20px] tracking-[0.5px] z-[3]">{ext.badge}</span>
                                        )}
                                        {ext.requires && (
                                            <span className="absolute bottom-2.5 right-2.5 bg-white/85 text-[#1a1a2e] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 z-[3]">{ext.requires}</span>
                                        )}
                                        <div className="absolute bottom-2.5 left-2.5 w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.18)] z-[3]" style={{ backgroundColor: ext.iconBg }}>
                                            {ext.icon}
                                        </div>
                                    </div>
                                    <div className="px-4 pt-3.5 pb-[18px]">
                                        <h3 className="m-0 mb-1 text-base font-extrabold text-[#1a1a2e]">{ext.name}</h3>
                                        <p className="m-0 text-[13px] text-[#555] leading-[1.4]">{ext.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {groupedSections.length === 0 && (
                    <div className="text-center py-[60px] px-6 text-[#888]">
                        <span className="text-[48px] block mb-4">🔍</span>
                        <p className="text-base font-semibold">No extensions found matching "{search}"</p>
                    </div>
                )}
            </div>

            <div className="text-center p-4 text-[#6b2fa0] text-[13px] font-semibold bg-[#e8d9f5] border-t border-[#d4bde8]">
                🧩 Click any extension to learn more and add its blocks to your project
            </div>

            {/* Iframe Embed Overlay */}
            {iframeExtension && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[6px] animate-[iframeFadeIn_0.25s_ease-out]" onClick={handleIframeClose} />
                    <div className="relative w-[90%] max-w-[560px] h-[80%] max-h-[600px] rounded-[20px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.35)] z-[1101] animate-[iframePopIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
                        <button className="absolute top-3 right-3 z-[1102] bg-black/50 border-none text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-black/75 hover:scale-110" onClick={handleIframeClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <iframe
                            className="w-full h-full border-none bg-[#f5f0fa]"
                            src={getIframeUrl(iframeExtension)}
                            title={iframeExtension.name}
                            sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
