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
                onUpload({
                    filename: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    timestamp: Date.now()
                });
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
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                padding: '16px'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    maxWidth: '640px',
                    width: '100%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: isDragging ? '2px dashed #4f46e5' : '1px solid #f1f5f9',
                    transition: 'border 0.2s ease'
                }}
            >
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,audio/*,video/*"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                />

                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px 24px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    flexShrink: 0
                }}>
                    <div>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: 900,
                            color: '#1e293b',
                            letterSpacing: '-0.02em',
                            margin: 0
                        }}>
                            Select {filterType === 'all' ? 'Asset' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        </h3>
                        <p style={{
                            fontSize: '13px',
                            color: '#94a3b8',
                            fontWeight: 500,
                            marginTop: '4px',
                            margin: '4px 0 0'
                        }}>
                            Choose from uploaded media files
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {currentValue && (
                            <button
                                onClick={handleClear}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    borderRadius: '10px',
                                    border: '1px solid #fecaca',
                                    backgroundColor: '#fff1f2',
                                    color: '#e11d48',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffe4e6';
                                    e.currentTarget.style.borderColor = '#fca5a5';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fff1f2';
                                    e.currentTarget.style.borderColor = '#fecaca';
                                }}
                            >
                                Clear Selection
                            </button>
                        )}
                        <button
                            onClick={onClose}
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
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f1f5f9';
                                e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            <X style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '14px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            backgroundColor: '#f8fafc',
                            color: '#1e293b',
                            fontWeight: 500,
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#818cf8';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.15)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        autoFocus
                    />
                </div>

                {/* Media Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', minHeight: 0 }}>
                    {filteredMedia.length === 0 ? (
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                minHeight: '280px',
                                color: '#94a3b8',
                                padding: '40px 20px',
                                border: isDragging
                                    ? '2px dashed #4f46e5'
                                    : '2px dashed #e2e8f0',
                                borderRadius: '16px',
                                backgroundColor: isDragging ? '#eef2ff' : '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isDragging) {
                                    e.currentTarget.style.borderColor = '#c7d2fe';
                                    e.currentTarget.style.backgroundColor = '#f5f3ff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isDragging) {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                }
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                backgroundColor: isDragging ? '#c7d2fe' : '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                transition: 'all 0.2s ease'
                            }}>
                                <Upload style={{
                                    width: '28px',
                                    height: '28px',
                                    color: isDragging ? '#4f46e5' : '#94a3b8',
                                    transition: 'color 0.2s ease'
                                }} />
                            </div>
                            <p style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                margin: 0,
                                color: isDragging ? '#4f46e5' : '#64748b',
                                transition: 'color 0.2s ease'
                            }}>
                                {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                            </p>
                            <p style={{
                                fontSize: '13px',
                                marginTop: '8px',
                                margin: '8px 0 0',
                                color: '#94a3b8'
                            }}>
                                or <span style={{ color: '#4f46e5', fontWeight: 700 }}>browse files</span>
                            </p>
                            <p style={{
                                fontSize: '11px',
                                marginTop: '12px',
                                margin: '12px 0 0',
                                color: '#cbd5e1',
                                fontWeight: 600
                            }}>
                                {searchTerm ? 'Try a different search' : 'Supports images, audio, and video'}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px'
                        }}>
                            {filteredMedia.map((item, index) => (
                                <div
                                    key={index}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleSelect(item)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(item); } }}
                                    style={{
                                        position: 'relative',
                                        borderRadius: '14px',
                                        border: currentValue === item.filename
                                            ? '2px solid #4f46e5'
                                            : '2px solid #e2e8f0',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        backgroundColor: '#ffffff',
                                        padding: 0,
                                        boxShadow: currentValue === item.filename
                                            ? '0 4px 12px rgba(79, 70, 229, 0.15)'
                                            : 'none',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentValue !== item.filename) {
                                            e.currentTarget.style.borderColor = '#818cf8';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentValue !== item.filename) {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                    onFocus={(e) => {
                                        if (currentValue !== item.filename) {
                                            e.currentTarget.style.borderColor = '#818cf8';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (currentValue !== item.filename) {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div style={{
                                        aspectRatio: '1',
                                        backgroundColor: '#f8fafc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {getFileCategory(item.type) === 'image' ? (
                                            <img
                                                src={item.data}
                                                alt={item.filename}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                {getFileIcon(item.type)}
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: '#64748b',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {item.filename.split('.').pop().toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div style={{ padding: '10px 12px', backgroundColor: '#ffffff' }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }} title={item.filename}>
                                            {item.filename}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#94a3b8',
                                            fontWeight: 600,
                                            marginTop: '2px'
                                        }}>
                                            {formatFileSize(item.size)}
                                        </div>
                                    </div>

                                    {/* Selected Indicator */}
                                    {currentValue === item.filename && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            backgroundColor: '#4f46e5',
                                            color: '#ffffff',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                                        }}>
                                            <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 20 20">
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
                                style={{
                                    borderRadius: '14px',
                                    border: '2px dashed #e2e8f0',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    backgroundColor: '#f8fafc',
                                    padding: '24px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    minHeight: '180px',
                                    outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#c7d2fe';
                                    e.currentTarget.style.backgroundColor = '#f5f3ff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#c7d2fe';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <Upload style={{ width: '24px', height: '24px', color: '#94a3b8' }} />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
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
