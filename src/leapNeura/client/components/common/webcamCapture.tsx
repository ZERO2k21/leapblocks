/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useRef, useEffect, useState } from 'react';

interface WebcamCaptureProps {
    onCapture?: (imageData: string) => void;
    isActive?: boolean;
    className?: string;
}

export default function WebcamCapture({ onCapture, isActive, className }: WebcamCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (isActive) {
            startWebcam();
        } else {
            stopWebcam();
        }

        return () => {
            stopWebcam();
        };
    }, [isActive]);

    const startWebcam = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            setError('Unable to access webcam');
            console.error('Webcam error:', err);
        }
    };

    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg');
                onCapture?.(imageData);
            }
        }
    };

    return (
        <div className={`relative ${className}`}>
            {error ? (
                <div className="aspect-video bg-red-50 rounded-2xl flex items-center justify-center">
                    <div className="text-center text-red-600">
                        <div className="text-4xl mb-2">⚠️</div>
                        <div className="text-sm">{error}</div>
                    </div>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-video bg-gray-900 rounded-2xl object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {isActive && (
                        <button
                            onClick={captureImage}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-purple-700 px-6 py-2 rounded-full font-semibold shadow-lg hover:bg-purple-50 transition-colors"
                        >
                            📸 Capture
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
