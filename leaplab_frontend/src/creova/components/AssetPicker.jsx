/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Asset Picker Component - For selecting media in properties panel
 * Leap App Inventor Style
 */
import React, { useState } from 'react';
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
    media = [],
    filterType = 'all', // 'image', 'audio', 'video', 'all'
    currentValue = null
}) {
    const [searchTerm, setSearchTerm] = useState('');

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
                    border: '1px solid #f1f5f9'
                }}
            >
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
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#94a3b8',
                            padding: '40px 0'
                        }}>
                            <Upload style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
                            <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>No files found</p>
                            <p style={{ fontSize: '12px', marginTop: '4px', margin: '4px 0 0' }}>
                                {searchTerm ? 'Try a different search' : 'Upload files in the Media tab'}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px'
                        }}>
                            {filteredMedia.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(item)}
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
                                            : 'none'
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
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

