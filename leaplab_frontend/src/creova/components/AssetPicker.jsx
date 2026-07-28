/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Asset Picker Component - For selecting media in properties panel
 * Leap App Inventor Style
 */
import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Image, Music, Video, File, X, Upload } from 'lucide-react';

/**
 * AssetPicker - Modal for selecting assets from media library
 * Used in properties panel for Image, Sound, Video properties
 */
export default function AssetPicker({
    isOpen,
    onClose,
    onSelect,
    onUpload,
    media = [],
    filterType = 'all', // 'image', 'audio', 'video', 'all'
    currentValue = null
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const dragCounterRef = useRef(0);

    if (!isOpen) return null;

    // Get file category
    const getFileCategory = (type) => {
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('audio/')) return 'audio';
        if (type.startsWith('video/')) return 'video';
        return 'other';
    };

    // Filter media
    const filteredMedia = media.filter(item => {
        const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || getFileCategory(item.type) === filterType;
        return matchesSearch && matchesType;
    });

    const getFileIcon = (type) => {
        const category = getFileCategory(type);
        switch (category) {
            case 'image': return <Image className="h-5 w-5 text-blue-500" />;
            case 'audio': return <Music className="h-5 w-5 text-green-500" />;
            case 'video': return <Video className="h-5 w-5 text-purple-500" />;
            default: return <File className="h-5 w-5 text-slate-900" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleSelect = (item) => {
        onSelect(item.filename);
        onClose();
    };

    const handleClear = () => {
        onSelect('');
        onClose();
    };

    // Process and upload files
    const processFiles = useCallback((files) => {
        if (!onUpload) return;
        const fileArray = Array.from(files);
        fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target.result;
                const b64len = data.indexOf(',') >= 0 ? data.length - data.indexOf(',') - 1 : data.length;
                if (data.length < 50 || b64len < 10) {
                    console.warn('[MEDIA-UPLOAD] File appears empty:', file.name, 'size:', file.size, 'dataLen:', data.length, 'b64Len:', b64len);
                }
                onUpload({
                    filename: file.name,
                    type: file.type,
                    size: file.size,
                    data: data,
                    timestamp: Date.now()
                });
            };
            reader.onerror = () => {
                console.error('[MEDIA-UPLOAD] FileReader error for', file.name, reader.error);
            };
            reader.readAsDataURL(file);
        });
    }, [onUpload]);

    // Drag and drop handlers
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounterRef.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }, [processFiles]);

    const handleFileInputChange = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
        e.target.value = '';
    }, [processFiles]);

    return createPortal(
        <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden transition-colors duration-200 ${
                    isDragging ? 'border-2 border-dashed border-indigo-600' : 'border border-slate-100'
                }`}
            >
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,audio/*,video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight m-0">
                            Select {filterType === 'all' ? 'Asset' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1 mb-0">
                            Choose from uploaded media files
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentValue && (
                            <button
                                onClick={handleClear}
                                className="px-4 py-2 text-xs font-extrabold rounded-xl border border-red-200 bg-rose-50 text-rose-600 cursor-pointer transition-all hover:bg-rose-100 hover:border-red-300"
                            >
                                Clear Selection
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 bg-transparent cursor-pointer transition-all shrink-0 hover:bg-slate-100 hover:text-slate-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-6 py-4 border-b border-slate-200 shrink-0">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 px-4 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-800 font-medium box-border transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-400/15"
                        autoFocus
                    />
                </div>

                {/* Media Grid */}
                <div className="neura-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-6 min-h-0">
                    {filteredMedia.length === 0 ? (
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center h-full min-h-[280px] p-10 px-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                                isDragging
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-indigo-200 hover:bg-purple-50/50'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
                                isDragging ? 'bg-indigo-200' : 'bg-slate-200'
                            }`}>
                                <Upload className={`w-7 h-7 transition-colors duration-200 ${
                                    isDragging ? 'text-indigo-600' : 'text-slate-400'
                                }`} />
                            </div>
                            <p className={`text-sm font-bold m-0 transition-colors duration-200 ${
                                isDragging ? 'text-indigo-600' : 'text-slate-600'
                            }`}>
                                {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                            </p>
                            <p className="text-xs mt-2 m-0 text-slate-400">
                                or <span className="text-indigo-600 font-bold">browse files</span>
                            </p>
                            <p className="text-[11px] mt-3 m-0 text-slate-300 font-semibold">
                                {searchTerm ? 'Try a different search' : 'Supports images, audio, and video'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 p-1">
                            {filteredMedia.map((item, index) => (
                                <div
                                    key={index}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleSelect(item)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(item); } }}
                                    className={`relative rounded-xl border-2 overflow-hidden cursor-pointer text-left transition-all bg-white p-0 outline-none ${
                                        currentValue === item.filename
                                            ? 'border-indigo-600 shadow-md shadow-indigo-600/15'
                                            : 'border-slate-200 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-600/10 focus:border-indigo-400'
                                    }`}
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-slate-50 flex items-center justify-center">
                                        {getFileCategory(item.type) === 'image' ? (
                                            <img
                                                src={item.data}
                                                alt={item.filename}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                {getFileIcon(item.type)}
                                                <span className="text-[11px] font-bold text-slate-500 uppercase">
                                                    {item.filename.split('.').pop().toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="p-2.5 px-3 bg-white">
                                        <div className="text-xs font-bold text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap" title={item.filename}>
                                            {item.filename}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                            {formatFileSize(item.size)}
                                        </div>
                                    </div>

                                    {/* Selected Indicator */}
                                    {currentValue === item.filename && (
                                        <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md shadow-indigo-600/30">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Upload more card */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                                className="rounded-xl border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer text-center transition-all bg-slate-50 p-6 px-3 flex flex-col items-center justify-center gap-2 min-h-[180px] outline-none hover:border-indigo-200 hover:bg-purple-50/50 focus:border-indigo-200"
                            >
                                <Upload className="w-6 h-6 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">
                                    Upload more
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
