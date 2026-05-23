/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Asset Picker Component - For selecting media in properties panel
 * Leap App Inventor Style
 */
import React, { useState } from 'react';
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
            default: return <File className="h-5 w-5 text-gray-500" />;
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            Select {filterType === 'all' ? 'Asset' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Choose from uploaded media files
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                </div>

                {/* Media List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredMedia.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Upload className="h-16 w-16 mb-3" />
                            <p className="text-sm font-medium">No files found</p>
                            <p className="text-xs mt-1">
                                {searchTerm ? 'Try a different search' : 'Upload files in the Media tab'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredMedia.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className={`relative group rounded-lg border-2 overflow-hidden cursor-pointer transition-all text-left ${currentValue === item.filename
                                            ? 'border-blue-500 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
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
                                                    {item.filename.split('.').pop().toUpperCase()}
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

                                    {/* Selected Indicator */}
                                    {currentValue === item.filename && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t bg-gray-50">
                    {currentValue && (
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                        >
                            Clear Selection
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    >
                        {currentValue ? 'Keep Current' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
}

