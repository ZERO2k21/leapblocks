import React, { useRef, useState, useEffect } from 'react';

/**
 * Hold-to-record capture modal
 * Used for capturing training samples from webcam
 */
function WebcamModal({ isOpen, onClose, onCapture, captureMode = 'click' }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [capturedCount, setCapturedCount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            startWebcam();
        } else {
            stopWebcam();
        }

        return () => stopWebcam();
    }, [isOpen]);

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            console.error('Error accessing webcam:', err);
            alert('Could not access webcam');
            onClose();
        }
    };

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const captureFrame = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        canvas.toBlob((blob) => {
            onCapture(blob);
            setCapturedCount(prev => prev + 1);
        });
    };

    const handleMouseDown = () => {
        if (captureMode === 'hold') {
            setIsRecording(true);
            startContinuousCapture();
        }
    };

    const handleMouseUp = () => {
        if (captureMode === 'hold') {
            setIsRecording(false);
        }
    };

    const startContinuousCapture = () => {
        const interval = setInterval(() => {
            if (!isRecording) {
                clearInterval(interval);
                return;
            }
            captureFrame();
        }, 100); // Capture every 100ms while holding
    };

    const handleClick = () => {
        if (captureMode === 'click') {
            captureFrame();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="webcam-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Capture Training Samples</h3>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="webcam-preview"
                    />

                    <div className="capture-info">
                        <p>Captured: {capturedCount} samples</p>
                        {captureMode === 'hold' && (
                            <p className="hint">Hold button to record multiple samples</p>
                        )}
                        {captureMode === 'click' && (
                            <p className="hint">Click to capture individual samples</p>
                        )}
                    </div>

                    <div className="capture-controls">
                        {captureMode === 'hold' ? (
                            <button
                                className={`btn-capture ${isRecording ? 'recording' : ''}`}
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                {isRecording ? '🔴 Recording...' : '⏺ Hold to Record'}
                            </button>
                        ) : (
                            <button className="btn-capture" onClick={handleClick}>
                                📸 Capture
                            </button>
                        )}

                        <button className="btn-done" onClick={onClose}>
                            ✓ Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WebcamModal;
