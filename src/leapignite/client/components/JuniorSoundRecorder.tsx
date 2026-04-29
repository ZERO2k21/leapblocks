/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore
import AudioRecorder from '../../../leapAudio/src/audio/audioRecorder';
import { Play, X, RotateCcw, ChevronLeft } from 'lucide-react';

interface AudioData {
    buffer: AudioBuffer;
    blobUrl: string;
    trimStart?: number;
    trimEnd?: number;
}

// --- SUB-COMPONENTS ---

interface VerticalLevelMeterProps {
    analyser: AnalyserNode | null;
}

const VerticalLevelMeter = ({ analyser }: VerticalLevelMeterProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        if (!analyser) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const renderFrame = () => {
            requestRef.current = requestAnimationFrame(renderFrame);
            analyser.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            // Mockup Style: Vertical segments
            const segmentCount = 12;
            const segmentHeight = height / segmentCount - 4;
            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            const activeSegments = Math.floor((average / 128) * segmentCount);

            for (let i = 0; i < segmentCount; i++) {
                const y = height - (i + 1) * (segmentHeight + 4);
                ctx.fillStyle = i < activeSegments ? (i < 8 ? '#0fbd8c' : i < 10 ? '#ffab19' : '#ff4d4d') : '#e0e0e0';

                // Draw rounded segment
                const radius = 4;
                ctx.beginPath();
                // @ts-ignore
                if (ctx.roundRect) {
                    // @ts-ignore
                    ctx.roundRect(4, y, width - 8, segmentHeight, radius);
                } else {
                    ctx.rect(4, y, width - 8, segmentHeight);
                }
                ctx.fill();
            }
        };

        renderFrame();
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [analyser]);

    return <canvas ref={canvasRef} width={40} height={200} className="junior-recorder-level-v" />;
};

interface WaveformWithTrimProps {
    buffer: AudioBuffer;
    trimStart: number;
    trimEnd: number;
    onTrimChange: (start: number, end: number) => void;
}

const WaveformWithTrim = ({ buffer, trimStart, trimEnd, onTrimChange }: WaveformWithTrimProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!buffer) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        // Draw selection background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw excluded areas (striped)
        const drawStriped = (x: number, w: number) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, 0, w, height);
            ctx.clip();
            ctx.fillStyle = '#ff4d4d22'; // Light red tint
            ctx.fillRect(x, 0, w, height);

            ctx.strokeStyle = '#ff4d4d44';
            ctx.lineWidth = 2;
            for (let i = -height; i < w + height; i += 10) {
                ctx.beginPath();
                ctx.moveTo(x + i, 0);
                ctx.lineTo(x + i + height, height);
                ctx.stroke();
            }
            ctx.restore();
        };

        drawStriped(0, trimStart * width);
        drawStriped(trimEnd * width, width * (1 - trimEnd));

        // Draw pink waveform
        ctx.fillStyle = '#CF63CF';
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            const yMin = (1 + min) * amp;
            const yMax = (1 + max) * amp;
            ctx.fillRect(i, yMin, 1, Math.max(1, yMax - yMin));
        }

        // Selection borders
        ctx.strokeStyle = '#ff6a00';
        ctx.lineWidth = 2;
        ctx.strokeRect(trimStart * width, 0, (trimEnd - trimStart) * width, height);

    }, [buffer, trimStart, trimEnd]);

    const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end') => {
        const startX = e.clientX;
        const initialVal = type === 'start' ? trimStart : trimEnd;
        const rect = containerRef.current!.getBoundingClientRect();

        const handleMouseMove = (mmE: MouseEvent) => {
            const delta = (mmE.clientX - startX) / rect.width;
            let newVal = Math.max(0, Math.min(1, initialVal + delta));

            if (type === 'start') {
                newVal = Math.min(newVal, trimEnd - 0.05);
                onTrimChange(newVal, trimEnd);
            } else {
                newVal = Math.max(newVal, trimStart + 0.05);
                onTrimChange(trimStart, newVal);
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="junior-waveform-container" ref={containerRef}>
            <canvas ref={canvasRef} width={600} height={200} className="junior-waveform-canvas" />

            {/* Trim Handles */}
            <div
                className="trim-handle"
                style={{ left: `${trimStart * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'start')}
            >
                <div className="trim-handle-pill top"></div>
                <div className="trim-handle-pill bottom"></div>
            </div>
            <div
                className="trim-handle"
                style={{ left: `${trimEnd * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'end')}
            >
                <div className="trim-handle-pill top"></div>
                <div className="trim-handle-pill bottom"></div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

interface JuniorSoundRecorderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AudioData) => void;
}

const JuniorSoundRecorder = ({ isOpen, onClose, onSave }: JuniorSoundRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [audioData, setAudioData] = useState<AudioData | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const [trim, setTrim] = useState({ start: 0, end: 1 });

    const recorderRef = useRef<any>(null);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        if (isOpen) {
            setIsReady(false);
            setAudioData(null);
            setTrim({ start: 0, end: 1 });
            recorderRef.current = new AudioRecorder();
            recorderRef.current.onComplete = (data: AudioData) => {
                setAudioData(data);
                setIsRecording(false);
                setAnalyser(null);
            };

            recorderRef.current.requestDevice().then((success: boolean) => {
                if (success) {
                    setAnalyser(recorderRef.current.getAnalyser());
                    setIsReady(true);
                } else {
                    alert("Microphone access is required.");
                    onClose();
                }
            });
        }

        return () => {
            if (recorderRef.current) recorderRef.current.dispose();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, [isOpen, onClose]);

    const handleToggleRecording = () => {
        if (!recorderRef.current || !isReady) return;
        if (isRecording) {
            recorderRef.current.stop();
        } else {
            setAudioData(null);
            recorderRef.current.start();
            setIsRecording(true);
        }
    };

    const handlePlayPreview = () => {
        if (audioData?.blobUrl && audioData.buffer) {
            const duration = audioData.buffer.duration;
            const start = trim.start * duration;
            const end = trim.end * duration;

            if (!Number.isFinite(start)) return;

            audioRef.current.src = audioData.blobUrl;

            const onMetadataLoaded = () => {
                audioRef.current.currentTime = start;
                audioRef.current.play().catch(err => console.error("Playback failed:", err));
                setIsPlaying(true);
                audioRef.current.removeEventListener('loadedmetadata', onMetadataLoaded);
            };

            audioRef.current.addEventListener('loadedmetadata', onMetadataLoaded);

            const checkEnd = () => {
                if (audioRef.current.currentTime >= end) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                    audioRef.current.removeEventListener('timeupdate', checkEnd);
                }
            };
            audioRef.current.addEventListener('timeupdate', checkEnd);
            audioRef.current.onended = () => {
                setIsPlaying(false);
                audioRef.current.removeEventListener('timeupdate', checkEnd);
            };
        }
    };

    const handleStopPreview = () => {
        audioRef.current.pause();
        setIsPlaying(false);
    };

    const handleSave = async () => {
        if (audioData && onSave) {
            // In a real implementation, we'd slice the buffer here.
            // For now, we'll pass the trim info along or simulate slicing.
            onSave({
                ...audioData,
                trimStart: trim.start,
                trimEnd: trim.end
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="junior-recorder-overlay">
            <div className="junior-recorder-modal complex">
                <div className="junior-recorder-header-new">
                    <span>Record Sound</span>
                    <button className="junior-recorder-close-new" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="junior-recorder-body">
                    <div className="junior-recorder-main-view">
                        <VerticalLevelMeter analyser={analyser} />

                        <div className="junior-recorder-visual-center">
                            {audioData ? (
                                <WaveformWithTrim
                                    buffer={audioData.buffer}
                                    trimStart={trim.start}
                                    trimEnd={trim.end}
                                    onTrimChange={(s, e) => setTrim({ start: s, end: e })}
                                />
                            ) : (
                                <div className="junior-recorder-placeholder">
                                    {isReady && !isRecording ? "Click to record!" : isRecording ? "Recording..." : "Waking up mic..."}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="junior-recorder-mid-controls">
                        {audioData ? (
                            <div className="play-control-group">
                                <button className="junior-play-big" onClick={isPlaying ? handleStopPreview : handlePlayPreview}>
                                    <div className={`play-icon-shape ${isPlaying ? 'stop' : 'play'}`}></div>
                                </button>
                                <span className="play-label">{isPlaying ? "Stop" : "Play"}</span>
                            </div>
                        ) : (
                            <button
                                className={`junior-record-circle ${isRecording ? 'active' : ''}`}
                                onClick={handleToggleRecording}
                                disabled={!isReady}
                            >
                                <div className="record-inner-circle"></div>
                            </button>
                        )}
                    </div>
                </div>

                <div className="junior-recorder-footer">
                    <button className="junior-btn-secondary" onClick={handleToggleRecording} disabled={isRecording}>
                        <RotateCcw size={18} style={{ transform: 'scaleX(-1)' }} />
                        Re-record
                    </button>
                    <button className="junior-btn-primary" onClick={handleSave} disabled={!audioData}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JuniorSoundRecorder;
