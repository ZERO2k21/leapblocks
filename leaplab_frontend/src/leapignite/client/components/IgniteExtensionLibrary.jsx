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
        <div className="fixed inset-0 z-[1000] flex flex-col font-sans bg-[#f5f0fa]">
            <div className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <button
                    onClick={onClose}
                    className="bg-transparent border border-slate-200 rounded-xl text-slate-900 font-bold text-sm flex items-center gap-2 cursor-pointer px-4 py-2 transition-all hover:bg-[#f3f0f8] hover:border-slate-300"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                </button>

                <span className="text-base font-extrabold text-slate-900 tracking-wide">Extension Library</span>

                <a
                    href="https://docs.leapblocks.com/extensions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-br from-[#0a015a] to-[#1a0a7a] text-white border-none rounded-xl px-5 py-2 font-bold text-xs cursor-pointer no-underline transition-all shadow-[0_2px_8px_rgba(10,1,90,0.15)] hover:opacity-90 hover:-translate-y-0.5"
                >
                    Read Documentation
                </a>
            </div>

            <div className="p-4 px-6 border-b border-slate-100 bg-[#faf8fd]">
                <div className="bg-white rounded-xl border border-slate-200 px-3.5 flex items-center gap-2.5 max-w-[420px] transition-colors hover:border-[#7B4FC4]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="stroke-slate-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="border-none outline-none bg-transparent text-sm text-slate-900 w-45 py-2.25"
                        placeholder="Search extensions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 pt-6 scroll-smooth scrollbar-thin">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 max-w-[960px]">
                    {filteredExtensions.map(ext => (
                        <div
                            key={ext.id}
                            className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 shadow-[0_2px_12px_rgba(10,1,90,0.06)] border border-slate-100 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(10,1,90,0.10)] hover:border-transparent"
                            onClick={() => handleCardClick(ext)}
                        >
                            <div className="w-full h-40 flex items-center justify-center relative overflow-hidden" style={{ background: ext.color }}>
                                <span className="text-6xl drop-shadow-md relative z-10 transition-transform">{ext.emoji}</span>
                                <div className={`absolute bottom-2.5 left-3 w-9.5 h-9.5 rounded-xl flex items-center justify-center text-lg shadow-md z-20 ${ext.id === 'face_detection' ? 'bg-emerald-700' : 'bg-blue-600'}`}>
                                    {ext.icon}
                                </div>
                            </div>
                            <div className="p-3.5 px-4 pb-4">
                                <h3 className="m-0 mb-1 text-sm font-extrabold text-slate-900">{ext.name}</h3>
                                <p className="m-0 text-xs text-slate-500 leading-snug">{ext.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredExtensions.length === 0 && (
                    <div className="text-center py-15 px-6 text-slate-400">
                        <span className="text-5xl block mb-4">🔍</span>
                        <p className="text-sm font-semibold">No extensions found matching "{search}"</p>
                    </div>
                )}
            </div>

            {iframeExtension && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={handleIframeClose} />
                    <div className="relative w-[90%] max-w-[560px] h-[80%] max-h-[600px] rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.3)] z-[1101] bg-white">
                        <button
                            onClick={handleIframeClose}
                            className="absolute top-3 right-3 z-[1102] bg-black/45 hover:bg-black/70 hover:scale-108 border-none text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <iframe
                            className="w-full h-full border-none bg-slate-50"
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
