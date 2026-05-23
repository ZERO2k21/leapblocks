/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Upload, Search, File, Image as ImageIcon, Music, Video,
    Trash2, Eye, Download, FolderOpen, Play, Pause, MoreVertical, Grid, List
} from 'lucide-react';

export default function MediaManager({ appState }) {
    const { media, addMedia, deleteMedia } = appState;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Get file extension
    const getFileExtension = (filename) => {
        return filename.split('.').pop().toUpperCase();
    };

    // Get file category for filtering
    const getFileCategory = (type) => {
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('audio/')) return 'audio';
        if (type.startsWith('video/')) return 'video';
        return 'other';
    };

    // Get icon based on file type
    const getFileIcon = (type, className = "h-6 w-6") => {
        if (type.startsWith('image/')) return <ImageIcon className={className} />;
        if (type.startsWith('audio/')) return <Music className={className} />;
        if (type.startsWith('video/')) return <Video className={className} />;
        return <File className={className} />;
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                addMedia({
                    filename: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    timestamp: Date.now()
                });
            };
            reader.readAsDataURL(file);
        });
        e.target.value = null; // Reset input
    };

    const handleDelete = (filename) => {
        if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
            deleteMedia(filename);
            if (selectedFile === filename) setSelectedFile(null);
            if (previewFile?.filename === filename) setPreviewFile(null);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedFile) handleDelete(selectedFile);
    };

    const handleDownload = (file) => {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = (file) => {
        setPreviewFile(file);
        setIsPlaying(false);
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const filteredMedia = media.filter(file => {
        const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || getFileCategory(file.type) === filterType;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: media.length,
        totalSize: media.reduce((acc, file) => acc + file.size, 0)
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
            {/* Standardized Header */}
            <div className="leap-panel-header-pro">
                <span>Media</span>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100 transition-all active:scale-95"
                    title="Upload Media"
                >
                    <Upload className="h-4 w-4" />
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,video/*,.txt,.json,.csv,.xml"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Search and Filters Section - Refined Spacing */}
            <div className="px-4 py-4 space-y-4 bg-white border-b border-slate-100">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 bg-slate-50/30 transition-all placeholder:text-slate-400 font-bold tracking-wide"
                    />
                </div>

                {/* Filter Tabs - Precise Pill Style */}
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                    {['all', 'image', 'audio', 'video'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-200 ${filterType === type
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        {filteredMedia.length} {filteredMedia.length === 1 ? 'Asset' : 'Assets'}
                    </div>
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${viewMode === 'grid'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${viewMode === 'list'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>

            {/* Media Grid/List */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
                {filteredMedia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-slate-50 rounded-full blur-2xl scale-150 opacity-50"></div>
                            <FolderOpen className="h-16 w-16 relative text-slate-200" strokeWidth={1} />
                        </div>
                        <p className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">No Assets</p>
                        <p className="text-[12px] text-slate-300 font-medium">
                            {searchTerm ? 'Adjust search terms' : 'Upload files to begin'}
                        </p>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 gap-4">
                            {filteredMedia.map((item, index) => (
                                <div
                                    key={index}
                                    className={`group relative aspect-square rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${selectedFile === item.filename
                                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg scale-[1.02]'
                                        : 'border-slate-50 hover:border-slate-200 hover:shadow-md'
                                        }`}
                                    onClick={() => setSelectedFile(item.filename)}
                                >
                                    {/* Preview Content */}
                                    <div className="w-full h-full bg-slate-50/50 flex items-center justify-center">
                                        {getFileCategory(item.type) === 'image' ? (
                                            <img
                                                src={item.data}
                                                alt={item.filename}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                                                {getFileIcon(item.type, 'h-10 w-10')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                        <div className="text-[10px] font-bold text-white truncate mb-1">{item.filename}</div>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreview(item);
                                                }}
                                                className="p-1.5 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-all"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(item);
                                                }}
                                                className="p-1.5 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-all"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.filename);
                                                }}
                                                className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-all ml-auto"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredMedia.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${selectedFile === item.filename
                                        ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                                        }`}
                                    onClick={() => setSelectedFile(item.filename)}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 overflow-hidden">
                                        {getFileCategory(item.type) === 'image' ? (
                                            <img src={item.data} className="w-full h-full object-cover" />
                                        ) : getFileIcon(item.type, 'h-5 w-5 text-slate-400')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-slate-700 truncate">{item.filename}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {formatFileSize(item.size)} • {getFileExtension(item.filename)}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreview(item);
                                            }}
                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.filename);
                                            }}
                                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Stats Footer - Standardized Pro Style */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                <div className="grid grid-cols-2 gap-4">
                    <div className="leap-stats-card-pro">
                        <div className="leap-stats-label-pro">Total Files</div>
                        <div className="leap-stats-value-pro">{stats.total}</div>
                    </div>
                    <div className="leap-stats-card-pro">
                        <div className="leap-stats-label-pro">Total Size</div>
                        <div className="leap-stats-value-pro">{formatFileSize(stats.totalSize)}</div>
                    </div>
                </div>
                {selectedFile && (
                    <button
                        onClick={handleDeleteSelected}
                        className="w-full mt-4 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Selected
                    </button>
                )}
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                    {getFileIcon(previewFile.type, "h-5 w-5")}
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-800">{previewFile.filename}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatFileSize(previewFile.size)}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setPreviewFile(null);
                                    setIsPlaying(false);
                                }}
                                className="p-2.5 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <MoreVertical className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="aspect-video bg-slate-50 flex items-center justify-center p-10">
                            {getFileCategory(previewFile.type) === 'image' && (
                                <img src={previewFile.data} className="max-w-full max-h-full rounded-xl shadow-lg" alt="Preview" />
                            )}
                            {getFileCategory(previewFile.type) === 'audio' && (
                                <div className="flex flex-col items-center gap-8 w-full max-w-sm">
                                    <div className={`p-10 rounded-full bg-white shadow-xl transition-transform duration-500 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
                                        <Music className={`h-16 w-16 ${isPlaying ? 'text-indigo-500' : 'text-slate-300'}`} />
                                    </div>
                                    <audio
                                        ref={audioRef}
                                        src={previewFile.data}
                                        onEnded={() => setIsPlaying(false)}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={toggleAudio}
                                            className="p-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-500/30 transition-all active:scale-95"
                                        >
                                            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {getFileCategory(previewFile.type) === 'video' && (
                                <video src={previewFile.data} controls className="max-w-full max-h-full rounded-xl shadow-lg" />
                            )}
                            {getFileCategory(previewFile.type) === 'other' && (
                                <div className="text-center">
                                    <File className="h-20 w-20 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-medium">No visual preview available</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleDownload(previewFile)}
                                className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download File
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
