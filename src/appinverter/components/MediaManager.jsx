/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef } from 'react';

/**
 * MediaManager - Manages media assets (images, sounds, videos) for the app
 * Inspired by MIT App Inventor's media panel
 */
export default function MediaManager({ appState }) {
    const { media = [], addMedia, deleteMedia } = appState;
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('audio/')) return '🎵';
        if (type.startsWith('video/')) return '🎬';
        if (type === 'application/json') return '📋';
        if (type === 'text/') return '📄';
        return '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);

        for (const file of files) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                continue;
            }

            // Read file as base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const mediaItem = {
                    filename: file.name,
                    size: file.size,
                    type: file.type,
                    data: event.target.result,
                    uploadedAt: new Date().toISOString()
                };

                if (addMedia) {
                    addMedia(mediaItem);
                }
            };
            reader.readAsDataURL(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = (filename) => {
        if (window.confirm(`Delete ${filename}?`)) {
            if (deleteMedia) {
                deleteMedia(filename);
            }
        }
    };

    const handleDownload = (mediaItem) => {
        // Create download link
        const link = document.createElement('a');
        link.href = mediaItem.data;
        link.download = mediaItem.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Upload Button */}
            <div className="mb-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,audio/*,video/*,.txt,.json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors"
                >
                    <span>📁</span> Upload File
                </button>
            </div>

            {/* Media List */}
            <div className="flex-1 overflow-y-auto">
                {media.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs italic py-4">
                        No media files yet
                    </div>
                ) : (
                    <div className="space-y-1">
                        {media.map((item, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded border cursor-pointer transition-colors ${selectedFile === item.filename
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                                onClick={() => setSelectedFile(item.filename)}
                            >
                                <div className="flex items-start gap-2">
                                    {/* File Icon */}
                                    <span className="text-lg flex-shrink-0">{getFileIcon(item.type)}</span>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-gray-800 truncate" title={item.filename}>
                                            {item.filename}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatFileSize(item.size)}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions (shown when selected) */}
                                {selectedFile === item.filename && (
                                    <div className="flex gap-1 mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(item);
                                            }}
                                            className="flex-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                                            title="Download"
                                        >
                                            ⬇️ Download
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.filename);
                                            }}
                                            className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                                            title="Delete"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Media Count */}
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 text-center">
                {media.length} file{media.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
