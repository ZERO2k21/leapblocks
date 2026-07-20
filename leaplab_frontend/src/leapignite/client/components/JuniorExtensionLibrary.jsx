/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback } from 'react';

const EXTENSIONS = [
    { id: 'face_detection', name: 'Face Detection', description: 'Detect and recognize human faces in real-time using the camera.', emoji: '👤', color: 'linear-gradient(135deg,#f9a825,#ffe082)', cat: 'ai', iconBg: '#f5c518', icon: '🎯' },
    { id: 'object_detection', name: 'Object Detection', description: 'Identify objects from image using AI vision models.', emoji: '🐱', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'ai', iconBg: '#3dba7e', icon: '🔎' },
    { id: 'human_body', name: 'Human Body Detection', description: 'Identify human body parts, poses and hand gestures from image.', emoji: '🤸', color: 'linear-gradient(135deg,#283593,#7986cb)', cat: 'ai', iconBg: '#5c6bc0', icon: '✋' },
    { id: 'ml_environment', name: 'Machine Learning Environment', description: 'Classify Image, Pose, Hand Pose, Text, Number & Object Detection.', emoji: '🧠', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'ai', iconBg: '#43a047', icon: '🤖', requires: '📡 WiFi' },
    { id: 'teachable_machine', name: 'ML with Teachable Machine', description: "Classify Image & Pose using Google's Teachable Machine.", emoji: '🎓', color: 'linear-gradient(135deg,#880e4f,#f48fb1)', cat: 'ai', iconBg: '#e91e63', icon: '📚', requires: '🖥 📡', comingSoon: true },
    { id: 'computer_vision', name: 'Computer Vision', description: 'Detect Object, Brand, Landmark & Celebrity using cloud AI.', emoji: '👁️', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'ai', iconBg: '#8e24aa', icon: '🔍', requires: '🖥 📡' },
    { id: 'text_recognition', name: 'Text Recognition', description: 'Read printed and handwritten text from images using OCR.', emoji: '📝', color: 'linear-gradient(135deg,#558b2f,#aed581)', cat: 'ai', iconBg: '#7cb342', icon: '📄', requires: '🖥 📡' },
    { id: 'speech_recognition', name: 'Speech Recognition', description: 'Convert speech to text in real-time using microphone input.', emoji: '🎙️', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'ai', iconBg: '#1e88e5', icon: '🔊', requires: '📡', badge: 'New' },
    { id: 'chatgpt', name: 'ChatGPT (Alpha)', description: 'Gamify your learning with ChatGPT integration.', emoji: '💬', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'ai', iconBg: '#10a37f', icon: '🤖', requires: '🖥 📡', comingSoon: true },

    { id: 'weather', name: 'Weather Data', description: 'Get real-time weather data by location anywhere on Earth.', emoji: '🌤️', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'iot', iconBg: '#1976d2', icon: '☁️', requires: '📡' },
    { id: 'ifttt', name: 'IFTTT Webhooks', description: 'Trigger IFTTT Webhooks to automate anything.', emoji: '⚡', color: 'linear-gradient(135deg,#f9a825,#ffe082)', cat: 'iot', iconBg: '#f5c518', icon: '🔗', requires: '📡', comingSoon: true },
    { id: 'iot', name: 'Internet of Things (IoT)', description: 'Connect projects across the globe with IoT sensors!', emoji: '🌐', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'iot', iconBg: '#7b1fa2', icon: '📡', requires: '📡', comingSoon: true },
    { id: 'alexa', name: 'Alexa (Alpha)', description: 'Play with the Alexa skill — voice-enable your projects.', emoji: '🔵', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'iot', iconBg: '#232f3e', icon: '🎵', badge: 'New', comingSoon: true },

    { id: 'physics', name: 'Physics Engine', description: 'Add real-world motions, gravity and forces to sprites.', emoji: '🎾', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'games', iconBg: '#388e3c', icon: '⚽' },
    { id: 'pen', name: 'Pen', description: 'Draw trails and patterns with your sprites.', emoji: '✏️', color: 'linear-gradient(135deg,#558b2f,#aed581)', cat: 'games', iconBg: '#558b2f', icon: '🖌️' },
    { id: 'music', name: 'Music', description: 'Play instruments, drums, and compose musical sequences.', emoji: '🎹', color: 'linear-gradient(135deg,#880e4f,#f48fb1)', cat: 'games', iconBg: '#c62828', icon: '🥁' },
    { id: 'video_sensing', name: 'Video Sensing', description: 'Sense motion and movement with the camera.', emoji: '📷', color: 'linear-gradient(135deg,#006064,#4dd0e1)', cat: 'games', iconBg: '#00838f', icon: '🎥' },
    { id: 'content_creation', name: 'Content Creation (Alpha)', description: 'Create interactive buttons, paragraphs, quizzes & more.', emoji: '✨', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'games', iconBg: '#1565c0', icon: '📝', badge: 'New', comingSoon: true },

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

function ExtensionCard({ ext, onClick }) {
    return (
        <div
            className={`bg-white rounded-[14px] overflow-hidden shadow-[0_4px_18px_rgba(74,21,128,0.10)] cursor-pointer transition-all duration-200 hover:-translate-y-[5px] hover:scale-[1.01] hover:shadow-[0_12px_32px_rgba(74,21,128,0.18)] active:-translate-y-[2px] active:scale-[0.99] ${ext.comingSoon ? 'cursor-not-allowed' : ''}`}
            onClick={onClick}
        >
            <div className="w-full h-[160px] flex items-center justify-center relative overflow-hidden" style={{ background: ext.color }}>
                <span className="text-[56px] drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)] z-[2] transition-transform duration-300 group-hover:scale-112 group-hover:-rotate-3">{ext.emoji}</span>
                {ext.comingSoon && (
                    <span className="absolute top-2 left-2 bg-[#9e9e9e] text-white text-[11px] font-extrabold px-[10px] py-[3px] rounded-[20px] tracking-[0.5px] z-[3]">Coming Soon</span>
                )}
                {ext.badge && !ext.comingSoon && (
                    <span className="absolute top-[10px] right-[10px] bg-[#3dba7e] text-white text-[11px] font-extrabold px-[10px] py-[3px] rounded-[20px] tracking-[0.5px] z-[3]">{ext.badge}</span>
                )}
                {ext.requires && (
                    <span className="absolute bottom-[10px] right-[10px] bg-white/85 text-[#1a1a2e] text-[11px] font-bold px-[10px] py-1 rounded-lg flex items-center gap-1 z-[3]">{ext.requires}</span>
                )}
                <div className="absolute bottom-[10px] left-[10px] w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-xl shadow-[0_2px_8px_rgba(0,0,0,0.18)] z-[3]" style={{ backgroundColor: ext.iconBg }}>
                    {ext.icon}
                </div>
            </div>
            <div className="px-4 pb-[18px] pt-[14px]">
                <h3 className="m-0 mb-1 text-base font-extrabold text-[#1a1a2e]">{ext.name}</h3>
                <p className="m-0 text-[13px] text-[#555] leading-[1.4]">{ext.description}</p>
            </div>
        </div>
    );
}

function SectionGroup({ section, onCardClick }) {
    return (
        <div>
            <div className="text-lg font-black text-[#4a1580] pb-[6px] border-b-[3px] border-b-[#c9a8e8] mt-5 mb-[18px] first:mt-0">{section.label}</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5 mb-7 max-w-[1300px]">
                {section.extensions.map(ext => (
                    <ExtensionCard key={ext.id} ext={ext} onClick={() => onCardClick(ext)} />
                ))}
            </div>
        </div>
    );
}

function EmptyState({ search }) {
    return (
        <div className="text-center px-6 py-[60px] text-[#888]">
            <span className="text-[48px] block mb-4">🔍</span>
            <p className="text-base font-semibold">No extensions found matching "{search}"</p>
        </div>
    );
}

export default function JuniorExtensionLibrary({ onClose, onSelectExtension }) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [iframeExtension, setIframeExtension] = useState(null);

    useEffect(() => {
        function handleMessage(event) {
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

    const handleCardClick = useCallback((ext) => {
        if (ext.comingSoon) return;
        setIframeExtension(ext);
    }, []);

    const handleIframeClose = useCallback(() => {
        setIframeExtension(null);
    }, []);

    const getIframeUrl = (ext) => {
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
        if (ext.id === 'human_body') {
            return `/extensions/ext-human-body.html`;
        }

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

    const matchesSearch = (ext, term) =>
        !term || ext.name.toLowerCase().includes(term) || ext.description.toLowerCase().includes(term);

    const filteredExtensions = EXTENSIONS.filter(ext => {
        const catMatch = activeFilter === 'all' || ext.cat === activeFilter;
        return catMatch && matchesSearch(ext, search.toLowerCase());
    });

    const groupedSections = SECTIONS.map(section => ({
        ...section,
        extensions: filteredExtensions.filter(ext => ext.cat === section.key),
    })).filter(section => section.extensions.length > 0);

    return (
        <div className="fixed inset-0 bg-[#e8d9f5] z-[1000] flex flex-col" style={{ fontFamily: "'Nunito','Segoe UI',Tahoma,Geneva,Verdana,sans-serif" }}>
            <div className="bg-[#4a1580] text-white h-[54px] flex items-center justify-between px-6 sticky top-0 z-[100] shadow-[0_3px_12px_rgba(0,0,0,0.25)]">
                <button className="bg-none border-none text-white font-bold text-[15px] flex items-center gap-2 cursor-pointer opacity-90 hover:opacity-100 transition-opacity duration-200 px-2 py-1" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                </button>
                <div className="text-lg font-extrabold tracking-[0.5px]">Choose an Extension</div>
                <button className="bg-[#6b2fa0] text-white border-none rounded-[30px] px-[18px] py-2 font-bold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#8840c2]">Read Documentation</button>
            </div>

            <div className="bg-[#c9a8e8] px-6 py-[14px] flex items-center gap-4 flex-wrap">
                <div className="bg-white rounded-[30px] px-4 py-[7px] flex items-center gap-2 shadow-[0_2px_6px_rgba(0,0,0,0.1)] min-w-[200px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="border-none outline-none bg-transparent text-[14px] text-[#1a1a2e] w-[160px] placeholder:text-[#bbb]"
                        placeholder="Search extensions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`border-none text-white font-bold text-[13px] px-[18px] py-2 rounded-[30px] cursor-pointer transition-all duration-200 ${activeFilter === f.key ? 'bg-[#e84545]' : 'bg-[#6b2fa0] hover:scale-105'}`}
                            onClick={() => setActiveFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 pb-3 pt-6 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c9a8e8] [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb:hover]:bg-[#a07dc5]">
                {groupedSections.map(section => (
                    <SectionGroup key={section.key} section={section} onCardClick={handleCardClick} />
                ))}
                {groupedSections.length === 0 && <EmptyState search={search} />}
            </div>

            <div className="text-center px-4 py-4 text-[#6b2fa0] text-[13px] font-semibold bg-[#e8d9f5] border-t border-t-[#d4bde8]">
                🧩 Click any extension to learn more and add its blocks to your project
            </div>

            {iframeExtension && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[6px] animate-[jelFadeIn_0.25s_ease-out]" onClick={handleIframeClose} />
                    <div className="relative w-[90%] max-w-[560px] h-[80%] max-h-[600px] rounded-[20px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.35)] z-[1101] animate-[jelPopIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
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
                            sandbox="allow-scripts allow-popups"
                        />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes jelFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes jelPopIn { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
        </div>
    );
}
