/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioRecorder from '../../../Leap-audio/src/audio/audio-recorder';
import { Play, X, RotateCcw, ChevronLeft } from 'lucide-react';
import { showToast } from './Toast';

const VerticalLevelMeter = ({ analyser }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    useEffect(() => {
        if (!analyser) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const renderFrame = () => {
            requestRef.current = requestAnimationFrame(renderFrame);
            analyser.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const segmentCount = 12;
            const segmentHeight = height / segmentCount - 4;
            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            const activeSegments = Math.floor((average / 128) * segmentCount);

            for (let i = 0; i < segmentCount; i++) {
                const y = height - (i + 1) * (segmentHeight + 4);
                ctx.fillStyle = i < activeSegments ? (i < 8 ? '#0fbd8c' : i < 10 ? '#ffab19' : '#ff4d4d') : '#e0e0e0';

                const radius = 4;
                ctx.beginPath();
                ctx.roundRect(4, y, width - 8, segmentHeight, radius);
                ctx.fill();
            }
        };

        renderFrame();
        return () => cancelAnimationFrame(requestRef.current);
    }, [analyser]);

    return <canvas ref={canvasRef} width={40} height={200} className="bg-[#f1f5f9] rounded-lg border border-[#e2e8f0]" />;
};

const WaveformWithTrim = ({ buffer, trimStart, trimEnd, onTrimChange }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!buffer) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        const drawStriped = (x, w) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, 0, w, height);
            ctx.clip();
            ctx.fillStyle = '#ff4d4d22';
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

        ctx.strokeStyle = '#ff6a00';
        ctx.lineWidth = 2;
        ctx.strokeRect(trimStart * width, 0, (trimEnd - trimStart) * width, height);

    }, [buffer, trimStart, trimEnd]);

    const handleMouseDown = (e, type) => {
        const startX = e.clientX;
        const initialVal = type === 'start' ? trimStart : trimEnd;
        const rect = containerRef.current.getBoundingClientRect();

        const handleMouseMove = (mmE) => {
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
        <div className="flex-1 bg-white border-2 border-[#e2e8f0] rounded-[16px] relative overflow-hidden" ref={containerRef}>
            <canvas ref={canvasRef} width={600} height={200} className="w-full h-full" />

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



const JuniorSoundRecorder = ({ isOpen, onClose, onSave }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [audioData, setAudioData] = useState(null);
    const [analyser, setAnalyser] = useState(null);
    const [trim, setTrim] = useState({ start: 0, end: 1 });

    const recorderRef = useRef(null);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        if (isOpen) {
            setIsReady(false);
            setAudioData(null);
            setTrim({ start: 0, end: 1 });
            recorderRef.current = new AudioRecorder();
            recorderRef.current.onComplete = (data) => {
                setAudioData(data);
                setIsRecording(false);
                setAnalyser(null);
            };

            recorderRef.current.requestDevice().then(success => {
                if (success) {
                    setAnalyser(recorderRef.current.getAnalyser());
                    setIsReady(true);
                } else {
                    showToast("Microphone access is required.", 'error');
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
            onSave({
                ...audioData,
                trimStart: trim.start,
                trimEnd: trim.end
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    const renderPlaceholder = () => {
        if (!isReady) return 'Waking up mic...';
        return isRecording ? 'Recording...' : 'Click to record!';
    };

    const renderControls = () => {
        if (audioData) {
            return (
                <div className="flex flex-col items-center">
                    <button className="w-[90px] h-[90px] bg-[#4C97FF] border-none rounded-full flex flex-col items-center justify-center cursor-pointer shadow-[0_6px_0_#3a7bd5] transition-all duration-100 text-white active:translate-y-1 active:shadow-[0_2px_0_#3a7bd5]" onClick={isPlaying ? handleStopPreview : handlePlayPreview}>
                        {isPlaying ? (
                            <div className="w-5 h-5 bg-white border-none"></div>
                        ) : (
                            <div className="w-0 h-0 border-t-[14px] border-b-[14px] border-l-[22px] border-t-transparent border-b-transparent border-l-white ml-[6px]"></div>
                        )}
                    </button>
                    <span className="mt-1 font-bold text-[14px]">{isPlaying ? 'Stop' : 'Play'}</span>
                </div>
            );
        }
        return (
            <button
                className={`w-[100px] h-[100px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-8 ${
                    isRecording
                        ? 'bg-[#333] animate-[pulse-red_1s_infinite] border-red-400/20'
                        : 'bg-[#ff4d4d] border-red-400/20'
                }`}
                onClick={handleToggleRecording}
                disabled={!isReady}
            >
                <div className="w-6 h-6 bg-white rounded-full"></div>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur flex justify-center items-center z-[5000]">
            <div className="w-[700px] h-[500px] p-0 overflow-hidden flex flex-col rounded-[24px] border-none bg-[#fdfdfd] shadow-[0_25px_60px_rgba(0,0,0,0.3)] animate-[junior-pop_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                <div className="bg-[#6b21a8] text-white px-5 py-4 flex justify-center items-center relative text-[22px] font-semibold">
                    <span>Record Sound</span>
                    <button className="absolute right-[15px] bg-white/10 border-none text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="flex-1 flex flex-col p-6 bg-[#f8fafc]">
                    <div className="flex gap-5 h-[240px] mb-6">
                        <VerticalLevelMeter analyser={analyser} />
                        <div className="flex-1">
                            {audioData ? (
                                <WaveformWithTrim
                                    buffer={audioData.buffer}
                                    trimStart={trim.start}
                                    trimEnd={trim.end}
                                    onTrimChange={(s, e) => setTrim({ start: s, end: e })}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-[#94a3b8]">{renderPlaceholder()}</div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-center items-center">{renderControls()}</div>
                </div>

                <div className="flex justify-between p-6 bg-white border-t border-[#e2e8f0]">
                    <button className="bg-white text-[#6b21a8] px-6 py-3 rounded-xl border-2 border-[#e2e8f0] font-bold text-base flex items-center gap-[10px] cursor-pointer" onClick={handleToggleRecording} disabled={isRecording}>
                        <RotateCcw size={18} className="-scale-x-100" />
                        Re-record
                    </button>
                    <button className="bg-[#6b21a8] text-white px-10 py-3 rounded-xl border-none font-bold text-lg cursor-pointer shadow-[0_4px_0_#4c1d95] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSave} disabled={!audioData}>
                        Save
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes junior-pop {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pulse-red {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,77,77,0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255,77,77,0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,77,77,0); }
                }
                .trim-handle {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: #ff6a00;
                    cursor: ew-resize;
                    z-index: 20;
                    transform: translateX(-50%);
                }
                .trim-handle-pill {
                    position: absolute;
                    left: -10px;
                    width: 24px;
                    height: 24px;
                    background: #ff6a00;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                .trim-handle-pill.top { top: -12px; }
                .trim-handle-pill.bottom { bottom: -12px; }
            `}</style>
        </div>
    );
};

export default JuniorSoundRecorder;
