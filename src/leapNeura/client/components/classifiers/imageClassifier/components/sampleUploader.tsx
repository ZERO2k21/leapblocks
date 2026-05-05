/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useRef } from 'react';

interface SampleUploaderProps {
    onUpload?: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
}

export default function SampleUploader({
    onUpload,
    accept = 'image/*',
    multiple = true,
}: SampleUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onUpload?.(files);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={handleClick}
                className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-medium"
            >
                📁 Upload
            </button>
        </>
    );
}
