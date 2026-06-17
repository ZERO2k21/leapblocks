/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback } from 'react';
import '../styles/juniorExtensionLibrary.css';

const EXTENSIONS = [
    // AI & ML
    { id: 'face_detection', name: 'Face Detection', description: 'Detect and recognize human faces in real-time using the camera.', emoji: '👤', color: 'linear-gradient(135deg,#f9a825,#ffe082)', cat: 'ai', iconBg: '#f5c518', icon: '🎯' },
    { id: 'object_detection', name: 'Object Detection', description: 'Identify objects from image using AI vision models.', emoji: '🐱', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'ai', iconBg: '#3dba7e', icon: '🔎' },
    { id: 'human_body', name: 'Human Body Detection', description: 'Identify human body parts, poses and hand gestures from image.', emoji: '🤸', color: 'linear-gradient(135deg,#283593,#7986cb)', cat: 'ai', iconBg: '#5c6bc0', icon: '✋' },
    { id: 'ml_environment', name: 'Machine Learning Environment', description: 'Classify Image, Pose, Hand Pose, Text, Number & Object Detection.', emoji: '🧠', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'ai', iconBg: '#43a047', icon: '🤖', requires: '📡 WiFi' },
    { id: 'teachable_machine', name: 'ML with Teachable Machine', description: "Classify Image & Pose using Google's Teachable Machine.", emoji: '🎓', color: 'linear-gradient(135deg,#880e4f,#f48fb1)', cat: 'ai', iconBg: '#e91e63', icon: '📚', requires: '🖥 📡', comingSoon: true },
    { id: 'computer_vision', name: 'Computer Vision', description: 'Detect Object, Brand, Landmark & Celebrity using cloud AI.', emoji: '👁️', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'ai', iconBg: '#8e24aa', icon: '🔍', requires: '🖥 📡' },
    { id: 'text_recognition', name: 'Text Recognition', description: 'Read printed and handwritten text from images using OCR.', emoji: '📝', color: 'linear-gradient(135deg,#558b2f,#aed581)', cat: 'ai', iconBg: '#7cb342', icon: '📄', requires: '🖥 📡' },
    { id: 'speech_recognition', name: 'Speech Recognition', description: 'Convert speech to text in real-time using microphone input.', emoji: '🎙️', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'ai', iconBg: '#1e88e5', icon: '🔊', requires: '📡', badge: 'New' },
    { id: 'chatgpt', name: 'ChatGPT (Alpha)', description: 'Gamify your learning with ChatGPT integration.', emoji: '💬', color: 'linear-gradient(135deg,#00796b,#4db6ac)', cat: 'ai', iconBg: '#10a37f', icon: '🤖', requires: '🖥 📡', comingSoon: true },

    // IoT & Connectivity
    { id: 'weather', name: 'Weather Data', description: 'Get real-time weather data by location anywhere on Earth.', emoji: '🌤️', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'iot', iconBg: '#1976d2', icon: '☁️', requires: '📡' },
    { id: 'ifttt', name: 'IFTTT Webhooks', description: 'Trigger IFTTT Webhooks to automate anything.', emoji: '⚡', color: 'linear-gradient(135deg,#f9a825,#ffe082)', cat: 'iot', iconBg: '#f5c518', icon: '🔗', requires: '📡', comingSoon: true },
    { id: 'iot', name: 'Internet of Things (IoT)', description: 'Connect projects across the globe with IoT sensors!', emoji: '🌐', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'iot', iconBg: '#7b1fa2', icon: '📡', requires: '📡', comingSoon: true },
    { id: 'alexa', name: 'Alexa (Alpha)', description: 'Play with the Alexa skill — voice-enable your projects.', emoji: '🔵', color: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', cat: 'iot', iconBg: '#232f3e', icon: '🎵', badge: 'New', comingSoon: true },

    // Games & Animation
    { id: 'physics', name: 'Physics Engine', description: 'Add real-world motions, gravity and forces to sprites.', emoji: '🎾', color: 'linear-gradient(135deg,#2e7d32,#66bb6a)', cat: 'games', iconBg: '#388e3c', icon: '⚽' },
    { id: 'pen', name: 'Pen', description: 'Draw trails and patterns with your sprites.', emoji: '✏️', color: 'linear-gradient(135deg,#558b2f,#aed581)', cat: 'games', iconBg: '#558b2f', icon: '🖌️' },
    { id: 'music', name: 'Music', description: 'Play instruments, drums, and compose musical sequences.', emoji: '🎹', color: 'linear-gradient(135deg,#880e4f,#f48fb1)', cat: 'games', iconBg: '#c62828', icon: '🥁' },
    { id: 'video_sensing', name: 'Video Sensing', description: 'Sense motion and movement with the camera.', emoji: '📷', color: 'linear-gradient(135deg,#006064,#4dd0e1)', cat: 'games', iconBg: '#00838f', icon: '🎥' },
    { id: 'content_creation', name: 'Content Creation (Alpha)', description: 'Create interactive buttons, paragraphs, quizzes & more.', emoji: '✨', color: 'linear-gradient(135deg,#1e88e5,#42a5f5)', cat: 'games', iconBg: '#1565c0', icon: '📝', badge: 'New', comingSoon: true },

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

export default function JuniorExtensionLibrary({ onClose, onSelectExtension }) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [iframeExtension, setIframeExtension] = useState(null);

    // Listen for postMessage from the iframe
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

    // Build iframe URL from extension data
    const getIframeUrl = (ext) => {
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
        if (ext.id === 'human_body') {
            return `/extensions/ext-human-body.html`;
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
        <div className="jel-modal-overlay">
            {/* Header */}
            <div className="jel-header">
                <button className="jel-back-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                </button>
                <div className="jel-title">Choose an Extension</div>
                <button className="jel-docs-btn">Read Documentation</button>
            </div>

            {/* Filter Bar */}
            <div className="jel-controls-bar">
                <div className="jel-search-container">
                    <svg className="jel-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="jel-search-input"
                        placeholder="Search extensions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="jel-filter-group">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`jel-filter-btn ${activeFilter === f.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Extension Grid */}
            <div className="jel-content">
                {groupedSections.map(section => (
                    <div key={section.key}>
                        <div className="jel-section-label">{section.label}</div>
                        <div className="jel-grid">
                            {section.extensions.map(ext => (
                                <div
                                    key={ext.id}
                                    className={`jel-card ${ext.comingSoon ? 'jel-card-coming-soon' : ''}`}
                                    onClick={() => handleCardClick(ext)}
                                    style={ext.comingSoon ? { cursor: 'not-allowed' } : {}}
                                >
                                    <div className="jel-card-banner" style={{ background: ext.color }}>
                                        <span className="jel-card-emoji">{ext.emoji}</span>
                                        {ext.comingSoon && (
                                            <span className="jel-card-badge" style={{ backgroundColor: '#9e9e9e', position: 'absolute', top: '8px', left: '8px' }}>Coming Soon</span>
                                        )}
                                        {ext.badge && !ext.comingSoon && (
                                            <span className="jel-card-badge">{ext.badge}</span>
                                        )}
                                        {ext.requires && (
                                            <span className="jel-card-requires">{ext.requires}</span>
                                        )}
                                        <div className="jel-card-icon" style={{ backgroundColor: ext.iconBg }}>
                                            {ext.icon}
                                        </div>
                                    </div>
                                    <div className="jel-card-info">
                                        <h3 className="jel-card-title">{ext.name}</h3>
                                        <p className="jel-card-desc">{ext.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {groupedSections.length === 0 && (
                    <div className="jel-empty">
                        <span className="jel-empty-icon">🔍</span>
                        <p>No extensions found matching "{search}"</p>
                    </div>
                )}
            </div>

            <div className="jel-footer">
                🧩 Click any extension to learn more and add its blocks to your project
            </div>

            {/* Iframe Embed Overlay */}
            {iframeExtension && (
                <div className="jel-iframe-overlay">
                    <div className="jel-iframe-backdrop" onClick={handleIframeClose} />
                    <div className="jel-iframe-container">
                        <button className="jel-iframe-close" onClick={handleIframeClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <iframe
                            className="jel-iframe"
                            src={getIframeUrl(iframeExtension)}
                            title={iframeExtension.name}
                            sandbox="allow-scripts allow-popups"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
