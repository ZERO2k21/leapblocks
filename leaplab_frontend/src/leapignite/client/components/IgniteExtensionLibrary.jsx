/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback } from 'react';
import '../styles/igniteExtensionLibrary.css';

const EXTENSIONS = [
    { id: 'face_detection', name: 'Face Detection', description: 'Detect and recognize human face', emoji: '👤', color: 'linear-gradient(135deg,#f9a825,#ffe082)', icon: '🎯' },
    { id: 'hand_pose', name: 'Hand Pose Detection', description: 'Identify hand gestures', emoji: '✋', color: 'linear-gradient(135deg,#283593,#7986cb)', icon: '🖐️' },
];

export default function IgniteExtensionLibrary({ onClose, onSelectExtension }) {
    const [search, setSearch] = useState('');
    const [iframeExtension, setIframeExtension] = useState(null);

    useEffect(() => {
        function handleMessage(event) {
            if (event.data && event.data.type === 'ADD_EXTENSION') {
                const extId = event.data.extensionId;
                console.log('[IgniteExtensionLibrary] ADD_EXTENSION received:', extId);
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
        setIframeExtension(ext);
    }, []);

    const handleIframeClose = useCallback(() => {
        setIframeExtension(null);
    }, []);

    const buildDetailUrl = (ext) =>
        `/extensions/ext-detail.html?id=${ext.id}&name=${encodeURIComponent(ext.name)}&desc=${encodeURIComponent(ext.description)}&emoji=${encodeURIComponent(ext.emoji)}&color=${encodeURIComponent(ext.color)}`;

    const getIframeUrl = (ext) => {
        if (ext.id === 'face_detection' || ext.id === 'face-detection') {
            return `/extensions/ext-face-detection.html`;
        }
        return buildDetailUrl(ext);
    };

    const matchesSearch = (ext, term) =>
        !term || ext.name.toLowerCase().includes(term) || ext.description.toLowerCase().includes(term);

    const filteredExtensions = EXTENSIONS.filter(ext => matchesSearch(ext, search.toLowerCase()));

    return (
        <div className="iel-modal-overlay">
            <div className="iel-header">
                <button className="iel-back-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                </button>
                <div className="iel-title">Choose an Extension</div>
                <button className="iel-docs-btn">Read Documentation</button>
            </div>

            <div className="iel-controls-bar">
                <div className="iel-search-container">
                    <svg className="iel-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="iel-search-input"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="iel-content">
                <div className="iel-grid">
                    {filteredExtensions.map(ext => (
                        <div
                            key={ext.id}
                            className="iel-card"
                            onClick={() => handleCardClick(ext)}
                        >
                            <div className="iel-card-banner" style={{ background: ext.color }}>
                                <span className="iel-card-emoji">{ext.emoji}</span>
                                <div className="iel-card-icon" style={{ backgroundColor: ext.id === 'face_detection' ? '#2e7d32' : '#1e88e5' }}>
                                    {ext.icon}
                                </div>
                            </div>
                            <div className="iel-card-info">
                                <h3 className="iel-card-title">{ext.name}</h3>
                                <p className="iel-card-desc">{ext.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredExtensions.length === 0 && (
                    <div className="iel-empty">
                        <span className="iel-empty-icon">🔍</span>
                        <p>No extensions found matching "{search}"</p>
                    </div>
                )}
            </div>

            {iframeExtension && (
                <div className="iel-iframe-overlay">
                    <div className="iel-iframe-backdrop" onClick={handleIframeClose} />
                    <div className="iel-iframe-container">
                        <button className="iel-iframe-close" onClick={handleIframeClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <iframe
                            className="iel-iframe"
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
