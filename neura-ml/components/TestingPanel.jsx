import React, { useState, useRef, useEffect } from 'react';

/**
 * Live webcam + upload + confidence bars
 * Real-time testing interface for trained models
 */
function TestingPanel({ model, classes, onPredict }) {
    const [predictions, setPredictions] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startLiveTest = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsLive(true);
                runLivePrediction();
            }
        } catch (err) {
            console.error('Error accessing webcam:', err);
            alert('Could not access webcam');
        }
    };

    const stopLiveTest = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsLive(false);
    };

    const runLivePrediction = async () => {
        if (!isLive || !videoRef.current) return;

        const result = await onPredict(videoRef.current);
        if (result) {
            setPredictions(result);
        }

        requestAnimationFrame(runLivePrediction);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = async () => {
            const result = await onPredict(img);
            if (result) {
                setPredictions(result);
            }
        };
    };

    useEffect(() => {
        return () => {
            stopLiveTest();
        };
    }, []);

    return (
        <div className="testing-panel">
            <div className="testing-header">
                <h3>Testing</h3>
                {!model && <span className="status-badge warning">⚠ Train model first</span>}
            </div>

            <div className="test-input">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="test-video"
                    style={{ display: isLive ? 'block' : 'none' }}
                />

                {!isLive && (
                    <div className="test-placeholder">
                        <p>Start live testing or upload a file</p>
                    </div>
                )}
            </div>

            <div className="test-controls">
                {!isLive ? (
                    <button
                        className="btn-primary"
                        onClick={startLiveTest}
                        disabled={!model}
                    >
                        📹 Start Live Test
                    </button>
                ) : (
                    <button className="btn-danger" onClick={stopLiveTest}>
                        ⏹ Stop
                    </button>
                )}

                <label className="btn-secondary">
                    📁 Upload File
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        disabled={!model}
                    />
                </label>
            </div>

            <div className="predictions">
                <h4>Predictions</h4>
                {predictions.length === 0 ? (
                    <p className="no-predictions">No predictions yet</p>
                ) : (
                    <div className="confidence-bars">
                        {predictions.map((pred, idx) => (
                            <div key={idx} className="confidence-row">
                                <span className="class-label">{pred.className}</span>
                                <div className="confidence-bar">
                                    <div
                                        className="confidence-fill"
                                        style={{ width: `${pred.confidence * 100}%` }}
                                    />
                                </div>
                                <span className="confidence-value">
                                    {(pred.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TestingPanel;
