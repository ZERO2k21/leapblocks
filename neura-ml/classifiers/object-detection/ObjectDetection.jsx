import React, { useState, useRef, useEffect } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';

/**
 * COCO-SSD, no training needed
 * Pre-trained object detection using COCO-SSD model
 */
function ObjectDetection({ project }) {
    const [detections, setDetections] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const startDetection = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsLive(true);
                // TODO: Load COCO-SSD and start detection loop
            }
        } catch (error) {
            console.error('Error accessing webcam:', error);
            alert('Could not access webcam');
        }
    };

    const stopDetection = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsLive(false);
    };

    useEffect(() => {
        return () => {
            stopDetection();
        };
    }, []);

    return (
        <ClassifierLayout project={project}>
            <div className="object-detection">
                <div className="detection-info">
                    <h3>Real-time Object Detection</h3>
                    <p>This uses a pre-trained COCO-SSD model. No training required!</p>
                </div>

                <div className="detection-view">
                    <div className="video-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="detection-video"
                        />
                        <canvas ref={canvasRef} className="detection-canvas" />
                    </div>

                    <div className="detection-controls">
                        {!isLive ? (
                            <button className="btn-primary" onClick={startDetection}>
                                📹 Start Detection
                            </button>
                        ) : (
                            <button className="btn-danger" onClick={stopDetection}>
                                ⏹ Stop
                            </button>
                        )}
                    </div>

                    <div className="detections-list">
                        <h4>Detected Objects</h4>
                        {detections.length === 0 ? (
                            <p>No objects detected</p>
                        ) : (
                            <ul>
                                {detections.map((det, idx) => (
                                    <li key={idx}>
                                        {det.class} - {(det.score * 100).toFixed(1)}%
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </ClassifierLayout>
    );
}

export default ObjectDetection;
