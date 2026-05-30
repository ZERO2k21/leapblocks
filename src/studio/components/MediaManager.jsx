/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Upload, Search, File, Image as ImageIcon, Music, Video,
    Trash2, Eye, Download, FolderOpen, Play, Pause, MoreVertical, Grid, List,
    AlertTriangle, X
} from 'lucide-react';

export default function MediaManager({ appState }) {
    const { media, addMedia, deleteMedia } = appState;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
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
        setDeleteTarget(filename);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        deleteMedia(deleteTarget);
        if (selectedFile === deleteTarget) setSelectedFile(null);
        if (previewFile?.filename === deleteTarget) setPreviewFile(null);
        setDeleteTarget(null);
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
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Standardized Header */}
            <div 
                style={{ paddingTop: '24px', paddingBottom: '16px', paddingLeft: '32px', paddingRight: '24px' }}
                className="bg-gradient-to-b from-white to-slate-50 backdrop-blur-md border-b-2 border-slate-200 flex items-center justify-between shrink-0 shadow-sm"
            >
                <span className="text-[19px] font-black uppercase tracking-[0.15em] text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.8)]">Media</span>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-100/50 transition-all active:scale-95 cursor-pointer"
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
                    <Search 
                        style={{ width: '18px', height: '18px', left: '14px' }} 
                        className="absolute top-1/2 -translate-y-1/2 text-slate-900 group-focus-within:text-blue-600 transition-colors" 
                    />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '42px', fontSize: '13px', paddingTop: '10px', paddingBottom: '10px' }}
                        className="w-full pr-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 bg-slate-50/30 transition-all placeholder:text-slate-900 font-bold tracking-wide"
                    />
                </div>

                {/* Filter Tabs - Precise Pill Style */}
                <div style={{ gap: '8px' }} className="flex overflow-x-auto pb-0.5 scrollbar-none">
                    {['all', 'image', 'audio', 'video'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            style={{
                                fontSize: '11px',
                                fontWeight: '900',
                                paddingLeft: '14px',
                                paddingRight: '14px',
                                paddingTop: '8px',
                                paddingBottom: '8px'
                            }}
                            className={`flex-shrink-0 rounded-full uppercase tracking-[0.07em] transition-all duration-200 cursor-pointer ${filterType === type
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-slate-50 text-slate-900 hover:bg-slate-100 hover:text-slate-950'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                    <div 
                        style={{ fontSize: '11px', fontWeight: '900' }} 
                        className="text-slate-900 uppercase tracking-[0.1em]"
                    >
                        {filteredMedia.length} {filteredMedia.length === 1 ? 'Asset' : 'Assets'}
                    </div>
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{ fontSize: '11px', fontWeight: '800', paddingLeft: '12px', paddingRight: '12px', paddingTop: '5px', paddingBottom: '5px' }}
                            className={`rounded-md transition-all duration-200 cursor-pointer ${viewMode === 'grid'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-900 hover:text-slate-950'
                                }`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{ fontSize: '11px', fontWeight: '800', paddingLeft: '12px', paddingRight: '12px', paddingTop: '5px', paddingBottom: '5px' }}
                            className={`rounded-md transition-all duration-200 cursor-pointer ${viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-900 hover:text-slate-950'
                                }`}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>

            {/* Media Grid/List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 bg-white leap-panel-body">
                {filteredMedia.length === 0 ? (
                    <div style={{ minHeight: '300px' }} className="flex flex-col items-center justify-center h-full text-slate-900 py-10">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-slate-50 rounded-full blur-2xl scale-150 opacity-50"></div>
                            <FolderOpen className="h-20 w-20 relative text-slate-900" strokeWidth={1} />
                        </div>
                        <p style={{ fontSize: '13px' }} className="font-black uppercase tracking-[0.15em] text-slate-900 mb-2">No Assets</p>
                        <p style={{ fontSize: '13px' }} className="text-slate-900 font-medium">
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
                                        ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-lg scale-[1.02]'
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
                                            <div className="text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {getFileIcon(item.type, 'h-10 w-10')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
                                        <div style={{ fontSize: '12px' }} className="font-extrabold text-white truncate mb-1.5">{item.filename}</div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreview(item);
                                                }}
                                                className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-all cursor-pointer"
                                            >
                                                <Eye style={{ width: '16px', height: '16px' }} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(item);
                                                }}
                                                className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-all cursor-pointer"
                                            >
                                                <Download style={{ width: '16px', height: '16px' }} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.filename);
                                                }}
                                                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-all ml-auto cursor-pointer"
                                            >
                                                <Trash2 style={{ width: '16px', height: '16px' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {filteredMedia.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${selectedFile === item.filename
                                        ? 'bg-blue-50/50 border-blue-200/50 shadow-sm'
                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                                        }`}
                                    onClick={() => setSelectedFile(item.filename)}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 overflow-hidden">
                                        {getFileCategory(item.type) === 'image' ? (
                                            <img src={item.data} className="w-full h-full object-cover" />
                                        ) : getFileIcon(item.type, 'h-6 w-6 text-slate-900')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div style={{ fontSize: '13px' }} className="font-extrabold text-slate-700 truncate">{item.filename}</div>
                                        <div style={{ fontSize: '10px' }} className="font-black text-slate-900 uppercase tracking-widest mt-1">
                                            {formatFileSize(item.size)} • {getFileExtension(item.filename)}
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreview(item);
                                            }}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-900 transition-colors"
                                        >
                                            <Eye style={{ width: '18px', height: '18px' }} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.filename);
                                            }}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                                        >
                                            <Trash2 style={{ width: '18px', height: '18px' }} />
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
                <div style={{ gap: '12px' }} className="flex">
                    <div className="flex-1 relative overflow-hidden p-3.5 border-2 border-slate-200 rounded-xl bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-blue-500 before:to-blue-400 before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300 before:origin-left transition-all duration-300">
                        <div style={{ fontSize: '10px', fontWeight: '900' }} className="uppercase tracking-wider text-slate-900 mb-1">Total Files</div>
                        <div className="text-xl font-black text-slate-800 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">{stats.total}</div>
                    </div>
                    <div className="flex-1 relative overflow-hidden p-3.5 border-2 border-slate-200 rounded-xl bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-blue-500 before:to-blue-400 before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300 before:origin-left transition-all duration-300">
                        <div style={{ fontSize: '10px', fontWeight: '900' }} className="uppercase tracking-wider text-slate-900 mb-1">Total Size</div>
                        <div className="text-xl font-black text-slate-800 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">{formatFileSize(stats.totalSize)}</div>
                    </div>
                </div>
                {selectedFile && (
                    <button
                        onClick={handleDeleteSelected}
                        style={{ fontSize: '11px', fontWeight: '900' }}
                        className="w-full mt-3 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white uppercase tracking-[0.2em] rounded-xl transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
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
                                <div className="p-2 bg-slate-50 rounded-xl text-slate-900">
                                    {getFileIcon(previewFile.type, "h-5 w-5")}
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-800">{previewFile.filename}</div>
                                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{formatFileSize(previewFile.size)}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setPreviewFile(null);
                                    setIsPlaying(false);
                                }}
                                className="p-2.5 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <MoreVertical className="h-5 w-5 text-slate-900" />
                            </button>
                        </div>

                        <div className="aspect-video bg-slate-50 flex items-center justify-center p-10">
                            {getFileCategory(previewFile.type) === 'image' && (
                                <img src={previewFile.data} className="max-w-full max-h-full rounded-xl shadow-lg" alt="Preview" />
                            )}
                            {getFileCategory(previewFile.type) === 'audio' && (
                                <div className="flex flex-col items-center gap-8 w-full max-w-sm">
                                    <div className={`p-10 rounded-full bg-white shadow-xl transition-transform duration-500 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
                                        <Music className={`h-16 w-16 ${isPlaying ? 'text-blue-600' : 'text-slate-900'}`} />
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
                                            className="p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-500/30 transition-all active:scale-95"
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
                                    <File className="h-20 w-20 text-slate-900 mx-auto mb-4" />
                                    <p className="text-slate-900 font-medium">No visual preview available</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="px-6 py-2.5 text-slate-900 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
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
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-[380px] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 pt-6 pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                                </div>
                                <span className="text-[17px] font-black text-slate-900 tracking-tight">Delete Asset</span>
                            </div>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm">
                                <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center overflow-hidden">
                                    {(media.find(m => m.filename === deleteTarget)?.type || '').startsWith('image/') ? (
                                        <img src={media.find(m => m.filename === deleteTarget)?.data} className="w-full h-full object-cover" />
                                    ) : (
                                        <File className="w-6 h-6 text-rose-500" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-[15px] font-bold text-slate-900 truncate max-w-[240px]">{deleteTarget}</div>
                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                                        {media.find(m => m.filename === deleteTarget)?.type || 'Unknown'}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-[13px] text-slate-600 font-medium leading-relaxed">
                                Are you sure you want to delete this asset? This action cannot be undone. All references to this file will break.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm uppercase tracking-[0.05em]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-white bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 transition-all active:scale-95 shadow-md shadow-rose-500/25 uppercase tracking-[0.05em] flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
