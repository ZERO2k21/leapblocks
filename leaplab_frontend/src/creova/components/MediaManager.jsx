/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
                style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px' }}
                className="bg-gradient-to-b from-white to-slate-50 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-sm"
            >
                <span className="text-[16px] font-bold uppercase tracking-[0.08em] text-slate-900">Media</span>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full border border-blue-100/50 transition-all active:scale-95 cursor-pointer"
                    style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                    }}
                    title="Upload Media"
                >
                    <Upload className="h-5 w-5" />
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
                        style={{ fontSize: '11px', fontWeight: '900', paddingLeft: '8px' }} 
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
                        <div className="grid grid-cols-2 gap-3">
                            {filteredMedia.map((item, index) => (
                                <div
                                    key={index}
                                    className={`group flex flex-col rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 bg-white ${selectedFile === item.filename
                                        ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-sm'
                                        : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                    onClick={() => setSelectedFile(item.filename)}
                                >
                                    {/* Thumbnail container */}
                                    <div className="w-full aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-50 relative">
                                        {getFileCategory(item.type) === 'image' ? (
                                            <img
                                                src={item.data}
                                                alt={item.filename}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
                                                {getFileIcon(item.type, 'h-8 w-8')}
                                            </div>
                                        )}

                                        {/* Hover actions panel overlay */}
                                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreview(item);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 rounded-full text-slate-700 transition-all cursor-pointer shadow active:scale-90"
                                                title="Preview"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(item);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 rounded-full text-slate-700 transition-all cursor-pointer shadow active:scale-90"
                                                title="Download"
                                            >
                                                <Download size={15} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.filename);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center bg-rose-500 hover:bg-rose-600 rounded-full text-white transition-all cursor-pointer shadow active:scale-90"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dedicated text block */}
                                    <div className="p-2 flex flex-col gap-0.5 bg-white min-w-0">
                                        <div className="text-[11px] font-bold text-slate-700 truncate w-full" title={item.filename}>
                                            {item.filename}
                                        </div>
                                        <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            {formatFileSize(item.size)}
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
                <div className="flex gap-3">
                    <div className="flex-1 relative overflow-hidden p-3 border border-slate-200/60 rounded-xl bg-white hover:shadow-md hover:border-slate-300/80 transition-all duration-300 text-center">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 leading-none">Total Files</div>
                        <div className="text-lg font-black text-slate-800 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent leading-tight">{stats.total}</div>
                    </div>
                    <div className="flex-1 relative overflow-hidden p-3 border border-slate-200/60 rounded-xl bg-white hover:shadow-md hover:border-slate-300/80 transition-all duration-300 text-center">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 leading-none">Total Size</div>
                        <div className="text-lg font-black text-slate-800 bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent leading-tight">{formatFileSize(stats.totalSize)}</div>
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
            {previewFile && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75">
                    <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] md:max-h-[90vh] flex flex-col bg-white rounded-[28px] overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm shrink-0">
                                    {getFileIcon(previewFile.type, "h-5 w-5")}
                                </div>
                                <div className="text-left min-w-0">
                                    <div className="text-[15px] font-black text-slate-800 tracking-tight leading-none truncate">{previewFile.filename}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{formatFileSize(previewFile.size)}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setPreviewFile(null);
                                    setIsPlaying(false);
                                }}
                                className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 hover:text-slate-800 rounded-full transition-all border border-slate-100 cursor-pointer shrink-0 ml-3"
                                title="Close"
                            >
                                <X className="h-4 w-4 text-slate-900" />
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 bg-slate-50 flex items-center justify-center p-6">
                            {getFileCategory(previewFile.type) === 'image' && (
                                <img src={previewFile.data} className="max-w-full max-h-[45vh] rounded-xl shadow-lg object-contain" alt="Preview" />
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
                                <video src={previewFile.data} controls className="max-w-full max-h-[45vh] rounded-xl shadow-lg object-contain" />
                            )}
                            {getFileCategory(previewFile.type) === 'other' && (
                                <div className="text-center">
                                    <File className="h-20 w-20 text-slate-900 mx-auto mb-4" />
                                    <p className="text-slate-900 font-medium">No visual preview available</p>
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '28px 24px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            alignItems: 'center',
                            backgroundColor: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={() => setPreviewFile(null)}
                                style={{
                                    minWidth: '120px',
                                    padding: '14px 28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#f8fafc',
                                    color: '#334155',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    e.currentTarget.style.color = '#0f172a';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                    e.currentTarget.style.color = '#334155';
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleDownload(previewFile)}
                                style={{
                                    minWidth: '150px',
                                    padding: '14px 28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    border: 'none',
                                    backgroundColor: '#4f46e5',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#4338ca';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#4f46e5';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.25)';
                                }}
                            >
                                <Download className="h-5 w-5" />
                                <span>Download File</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {deleteTarget && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            width: '420px',
                            maxWidth: '90vw',
                            margin: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1px solid #f1f5f9'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px 24px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#ffffff',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    backgroundColor: '#fff1f2',
                                    color: '#f43f5e',
                                    border: '1px solid #fecdd3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <AlertTriangle style={{ width: '22px', height: '22px' }} />
                                </div>
                                <span style={{
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    color: '#1e293b',
                                    letterSpacing: '-0.02em'
                                }}>Delete Asset</span>
                            </div>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                    marginLeft: '12px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    e.currentTarget.style.color = '#1e293b';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#94a3b8';
                                }}
                                title="Close"
                            >
                                <X style={{ width: '16px', height: '16px' }} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '8px 24px 20px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '14px',
                                borderRadius: '14px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #f1f5f9'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0',
                                    flexShrink: 0
                                }}>
                                    {(media.find(m => m.filename === deleteTarget)?.type || '').startsWith('image/') ? (
                                        <img src={media.find(m => m.filename === deleteTarget)?.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <File style={{ width: '24px', height: '24px', color: '#f43f5e' }} />
                                    )}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: '#1e293b',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '240px',
                                        lineHeight: 1.2
                                    }}>{deleteTarget}</div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: '#94a3b8',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        marginTop: '4px'
                                    }}>
                                        {media.find(m => m.filename === deleteTarget)?.type || 'Unknown'}
                                    </div>
                                </div>
                            </div>
                            <p style={{
                                marginTop: '14px',
                                fontSize: '13px',
                                color: '#64748b',
                                fontWeight: 500,
                                lineHeight: 1.7
                            }}>
                                Are you sure you want to delete this asset? This action <span style={{ fontWeight: 800, color: '#f43f5e' }}>cannot be undone</span>. All references to this file will break.
                            </p>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '28px 24px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            alignItems: 'center',
                            backgroundColor: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    minWidth: '120px',
                                    padding: '14px 28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#f8fafc',
                                    color: '#334155',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    e.currentTarget.style.color = '#0f172a';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                    e.currentTarget.style.color = '#334155';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    minWidth: '130px',
                                    padding: '14px 28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    border: 'none',
                                    backgroundColor: '#e11d48',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#be123c';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(225, 29, 72, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e11d48';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(225, 29, 72, 0.25)';
                                }}
                            >
                                <Trash2 style={{ width: '18px', height: '18px' }} />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}