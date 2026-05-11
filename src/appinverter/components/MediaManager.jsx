/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Complete Asset Management System - MIT App Inventor Style
 * Supports: Images, Sounds, Videos, Data files
 */
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Trash2, Search, Image, Music, Video, File, FolderOpen, Eye, X, Play, Pause } from 'lucide-react';

/**
 * MediaManager - Complete asset management with preview, organization, and search
 * MIT App Inventor compatible
 */
export default function MediaManager({ appState }) {
    const { media = [], addMedia, deleteMedia, updateMedia } = appState;
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, images, audio, video, other
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [previewFile, setPreviewFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Get file category
    const getFileCategory = (type) => {
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('audio/')) return 'audio';
        if (type.startsWith('video/')) return 'video';
        return 'other';
    };

    const getFileIcon = (type) => {
        const category = getFileCategory(type);
        switch (category) {
            case 'image': return <Image className="h-5 w-5 text-blue-500" />;
            case 'audio': return <Music className="h-5 w-5 text-green-500" />;
            case 'video': return <Video className="h-5 w-5 text-purple-500" />;
            default: return <File className="h-5 w-5 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Get file extension
    const getFileExtension = (filename) => {
        return filename.split('.').pop().toUpperCase();
    };

    // Filter media based on search and type
    const filteredMedia = media.filter(item => {
        const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || getFileCategory(item.type) === filterType;
        return matchesSearch && matchesType;
    });

    // Get statistics
    const stats = {
        total: media.length,
        images: media.filter(m => getFileCategory(m.type) === 'image').length,
        audio: media.filter(m => getFileCategory(m.type) === 'audio').length,
        video: media.filter(m => getFileCategory(m.type) === 'video').length,
        other: media.filter(m => getFileCategory(m.type) === 'other').length,
        totalSize: media.reduce((sum, m) => sum + m.size, 0)
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Update progress
            setUploadProgress({
                current: i + 1,
                total: files.length,
                filename: file.name
            });

            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 50MB.`);
                continue;
            }

            // Check for duplicate names
            if (media.some(m => m.filename === file.name)) {
                const overwrite = window.confirm(`File ${file.name} already exists. Overwrite?`);
                if (!overwrite) continue;
                // Delete existing file
                deleteMedia(file.name);
            }

            // Read file as base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const mediaItem = {
                    filename: file.name,
                    size: file.size,
                    type: file.type,
                    data: event.target.result,
                    uploadedAt: new Date().toISOString(),
                    category: getFileCategory(file.type)
                };

                if (addMedia) {
                    addMedia(mediaItem);
                }
            };
            reader.readAsDataURL(file);
        }

        // Reset progress after a delay
        setTimeout(() => {
            setUploadProgress(null);
        }, 1000);

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
            if (selectedFile === filename) {
                setSelectedFile(null);
            }
            if (previewFile?.filename === filename) {
                setPreviewFile(null);
            }
        }
    };

    const handleDeleteSelected = () => {
        if (!selectedFile) return;
        handleDelete(selectedFile);
    };

    const handleDownload = (mediaItem) => {
        const link = document.createElement('a');
        link.href = mediaItem.data;
        link.download = mediaItem.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = (mediaItem) => {
        setPreviewFile(mediaItem);
    };

    const handleClosePreview = () => {
        setPreviewFile(null);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const toggleAudioPlayback = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header with Upload and Actions */}
            <div className="p-3 border-b border-gray-200 space-y-3">
                {/* Upload Button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,audio/*,video/*,.txt,.json,.csv,.xml"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2.5 bg-[#4a90e2] hover:bg-[#3f79bf] text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors"
                >
                    <Upload className="h-4 w-4" />
                    Upload Media
                </button>

                {/* Upload Progress */}
                {uploadProgress && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <div className="text-xs text-blue-700 mb-1">
                            Uploading {uploadProgress.current} of {uploadProgress.total}...
                        </div>
                        <div className="text-xs text-blue-600 truncate">
                            {uploadProgress.filename}
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 text-xs">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`flex-1 px-2 py-1.5 rounded transition-colors ${filterType === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilterType('image')}
                        className={`flex-1 px-2 py-1.5 rounded transition-colors ${filterType === 'image'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Images ({stats.images})
                    </button>
                    <button
                        onClick={() => setFilterType('audio')}
                        className={`flex-1 px-2 py-1.5 rounded transition-colors ${filterType === 'audio'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Audio ({stats.audio})
                    </button>
                    <button
                        onClick={() => setFilterType('video')}
                        className={`flex-1 px-2 py-1.5 rounded transition-colors ${filterType === 'video'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Video ({stats.video})
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-600">
                        {filteredMedia.length} file{filteredMedia.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-2 py-1 text-xs rounded ${viewMode === 'grid'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-2 py-1 text-xs rounded ${viewMode === 'list'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>

            {/* Media Grid/List */}
            <div className="flex-1 overflow-y-auto p-3">
                {filteredMedia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FolderOpen className="h-16 w-16 mb-3" />
                        <p className="text-sm font-medium">No media files</p>
                        <p className="text-xs mt-1">
                            {searchTerm ? 'Try a different search' : 'Upload files to get started'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 gap-2">
                        {filteredMedia.map((item, index) => (
                            <div
                                key={index}
                                className={`relative group rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${selectedFile === item.filename
                                        ? 'border-blue-500 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => setSelectedFile(item.filename)}
                            >
                                {/* Thumbnail/Preview */}
                                <div className="aspect-square bg-gray-50 flex items-center justify-center">
                                    {getFileCategory(item.type) === 'image' ? (
                                        <img
                                            src={item.data}
                                            alt={item.filename}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            {getFileIcon(item.type)}
                                            <span className="text-xs font-medium text-gray-500">
                                                {getFileExtension(item.filename)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="p-2 bg-white">
                                    <div className="text-xs font-medium text-gray-800 truncate" title={item.filename}>
                                        {item.filename}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatFileSize(item.size)}
                                    </div>
                                </div>

                                {/* Quick Actions (on hover) */}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(item);
                                        }}
                                        className="p-1.5 bg-white rounded shadow hover:bg-gray-100"
                                        title="Preview"
                                    >
                                        <Eye className="h-3 w-3 text-gray-700" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(item);
                                        }}
                                        className="p-1.5 bg-white rounded shadow hover:bg-gray-100"
                                        title="Download"
                                    >
                                        <Download className="h-3 w-3 text-gray-700" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.filename);
                                        }}
                                        className="p-1.5 bg-white rounded shadow hover:bg-red-100"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3 text-red-600" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredMedia.map((item, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${selectedFile === item.filename
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                                onClick={() => setSelectedFile(item.filename)}
                            >
                                {/* Icon/Thumbnail */}
                                <div className="flex-shrink-0">
                                    {getFileCategory(item.type) === 'image' ? (
                                        <img
                                            src={item.data}
                                            alt={item.filename}
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                            {getFileIcon(item.type)}
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate" title={item.filename}>
                                        {item.filename}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatFileSize(item.size)} • {getFileExtension(item.filename)}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(item);
                                        }}
                                        className="p-1.5 hover:bg-gray-200 rounded"
                                        title="Preview"
                                    >
                                        <Eye className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(item);
                                        }}
                                        className="p-1.5 hover:bg-gray-200 rounded"
                                        title="Download"
                                    >
                                        <Download className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.filename);
                                        }}
                                        className="p-1.5 hover:bg-red-100 rounded"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with Stats */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                        <span>Total Files:</span>
                        <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Size:</span>
                        <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
                    </div>
                </div>
                {selectedFile && (
                    <button
                        onClick={handleDeleteSelected}
                        className="w-full mt-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
                    >
                        Delete Selected
                    </button>
                )}
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                                {getFileIcon(previewFile.type)}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {previewFile.filename}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {formatFileSize(previewFile.size)} • {getFileExtension(previewFile.filename)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClosePreview}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-4 bg-gray-50">
                            {getFileCategory(previewFile.type) === 'image' && (
                                <img
                                    src={previewFile.data}
                                    alt={previewFile.filename}
                                    className="max-w-full max-h-full mx-auto"
                                />
                            )}
                            {getFileCategory(previewFile.type) === 'audio' && (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <Music className="h-24 w-24 text-gray-400" />
                                    <audio
                                        ref={audioRef}
                                        src={previewFile.data}
                                        onEnded={() => setIsPlaying(false)}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={toggleAudioPlayback}
                                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center gap-2 transition-colors"
                                    >
                                        {isPlaying ? (
                                            <>
                                                <Pause className="h-5 w-5" />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-5 w-5" />
                                                Play
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                            {getFileCategory(previewFile.type) === 'video' && (
                                <video
                                    src={previewFile.data}
                                    controls
                                    className="max-w-full max-h-full mx-auto"
                                />
                            )}
                            {getFileCategory(previewFile.type) === 'other' && (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                                    <File className="h-24 w-24" />
                                    <p className="text-lg">Preview not available</p>
                                    <p className="text-sm">Download the file to view it</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-2 p-4 border-t">
                            <button
                                onClick={() => handleDownload(previewFile)}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(previewFile.filename);
                                    handleClosePreview();
                                }}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                            <button
                                onClick={handleClosePreview}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
