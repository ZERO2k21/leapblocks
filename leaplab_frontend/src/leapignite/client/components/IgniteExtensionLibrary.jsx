/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback } from 'react';

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
        <div className="fixed inset-0 z-[1000] flex flex-col" style={{ fontFamily: "'Nunito','Segoe UI',Tahoma,Geneva,Verdana,sans-serif", background: "#f5f0fa" }}>
            <div style={{
                background: "#ffffff",
                borderBottom: "1px solid #e8ecf2",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                position: "sticky",
                top: 0,
                zIndex: 100,
                boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
            }}>
                <button onClick={onClose} style={{
                    background: "none",
                    border: "1px solid #e0e4ea",
                    borderRadius: "10px",
                    color: "#1a1a2e",
                    fontWeight: 700,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "8px 16px",
                    transition: "all 0.15s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f3f0f8"; e.currentTarget.style.borderColor = "#d0d0e0"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#e0e4ea"; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                </button>

                <span style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "0.3px" }}>Extension Library</span>

                <a
                    href="https://docs.leapblocks.com/extensions"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        background: "linear-gradient(135deg, #0a015a, #1a0a7a)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        padding: "8px 20px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "opacity 0.15s, transform 0.15s",
                        boxShadow: "0 2px 8px rgba(10,1,90,0.15)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                    Read Documentation
                </a>
            </div>

            <div style={{
                padding: "16px 24px",
                borderBottom: "1px solid #edeff3",
                background: "#faf8fd",
            }}>
                <div style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e0e4ea",
                    padding: "0 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    maxWidth: "420px",
                    transition: "border-color 0.15s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#7B4FC4"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e4ea"; }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        style={{
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontSize: "14px",
                            color: "#1a1a2e",
                            width: "180px",
                            padding: "9px 0",
                        }}
                        placeholder="Search extensions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 pt-6 scroll-smooth"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#d0c8e0 #f5f0fa",
                }}
            >
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 max-w-[960px]">
                    {filteredExtensions.map(ext => (
                        <div
                            key={ext.id}
                            className="bg-white overflow-hidden cursor-pointer transition-all duration-200"
                            style={{
                                borderRadius: "14px",
                                boxShadow: "0 2px 12px rgba(10,1,90,0.06)",
                                border: "1px solid #edeff3",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = "0 12px 32px rgba(10,1,90,0.10)";
                                e.currentTarget.style.borderColor = "transparent";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,1,90,0.06)";
                                e.currentTarget.style.borderColor = "#edeff3";
                            }}
                            onClick={() => handleCardClick(ext)}
                        >
                            <div style={{
                                width: "100%",
                                height: "160px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                                overflow: "hidden",
                                background: ext.color,
                            }}>
                                <span style={{
                                    fontSize: "56px",
                                    filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.15))",
                                    position: "relative",
                                    zIndex: 2,
                                    transition: "transform 0.3s",
                                }}>{ext.emoji}</span>
                                <div style={{
                                    position: "absolute",
                                    bottom: "10px",
                                    left: "12px",
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "18px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    zIndex: 3,
                                    backgroundColor: ext.id === 'face_detection' ? '#2e7d32' : '#1e88e5',
                                }}>
                                    {ext.icon}
                                </div>
                            </div>
                            <div style={{ padding: "14px 16px 16px" }}>
                                <h3 style={{
                                    margin: 0,
                                    marginBottom: "4px",
                                    fontSize: "15px",
                                    fontWeight: 800,
                                    color: "#1a1a2e",
                                }}>{ext.name}</h3>
                                <p style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    color: "#666",
                                    lineHeight: 1.45,
                                }}>{ext.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredExtensions.length === 0 && (
                    <div style={{
                        textAlign: "center",
                        padding: "60px 24px",
                        color: "#888",
                    }}>
                        <span style={{ fontSize: "44px", display: "block", marginBottom: "16px" }}>🔍</span>
                        <p style={{ fontSize: "15px", fontWeight: 600 }}>No extensions found matching "{search}"</p>
                    </div>
                )}
            </div>

            {iframeExtension && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center">
                    <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={handleIframeClose} />
                    <div className="relative" style={{
                        width: "90%",
                        maxWidth: "560px",
                        height: "80%",
                        maxHeight: "600px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
                        zIndex: 1101,
                        background: "#fff",
                    }}>
                        <button onClick={handleIframeClose} style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            zIndex: 1102,
                            background: "rgba(0,0,0,0.45)",
                            border: "none",
                            color: "white",
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.7)"; e.currentTarget.style.transform = "scale(1.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "scale(1)"; }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <iframe
                            className="w-full h-full"
                            style={{ border: "none", background: "#f8f6fc" }}
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
