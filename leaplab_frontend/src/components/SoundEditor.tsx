/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Play, Square, Trash2, Copy, Music as MusicIcon,
    Volume2, VolumeX, Scissors, RotateCcw, Undo, Redo,
    ArrowUpFromLine, ArrowDownToLine, ArrowRightLeft, ArrowLeftRight, Clipboard as ClipboardIcon
} from 'lucide-react';
import { ActionMenu } from '../stage/ActionMenu';
import { SoundBank } from '../Leap-audio/src/SoundBank';
import { SoundLibrary } from './SoundLibrary';
import AudioEffects from '../Leap-audio/src/audio/audio-effects';
import WavEncoder from 'wav-encoder';
import { ADPCMSoundDecoder } from '../Leap-audio/src/ADPCMSoundDecoder';
import { MiniWaveform } from './MiniWaveform';

// ═══════════════════════════════════════════════════════════════════════════
// WAVEFORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
interface WaveformProps {
    buffer: AudioBuffer | null;
    color: string;
    selectionStart?: number;
    selectionEnd?: number;
    onSelectionChange?: (start: number, end: number) => void;
}

const Waveform: React.FC<WaveformProps> = ({ buffer, color, selectionStart = 0, selectionEnd = 1, onSelectionChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [hoverRatio, setHoverRatio] = useState<number | null>(null);

    const getRatioFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return 0;
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        return x / rect.width;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ratio = getRatioFromEvent(e);
        setIsDragging(true);
        setDragStart(ratio);
        if (onSelectionChange) onSelectionChange(ratio, ratio);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const currentRatio = getRatioFromEvent(e);
        setHoverRatio(currentRatio);
        if (isDragging && onSelectionChange) {
            onSelectionChange(Math.min(dragStart, currentRatio), Math.max(dragStart, currentRatio));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setHoverRatio(null);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !buffer) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const data = buffer.getChannelData(0);
        const duration = buffer.duration;

        // Dark background for DAW aesthetic
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, width, height);

        const rulerHeight = 22;
        const ampRegionHeight = height - rulerHeight;
        const ampCenterY = rulerHeight + ampRegionHeight / 2;

        // 1. Time Ruler at Top
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, width, rulerHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rulerHeight);
        ctx.lineTo(width, rulerHeight);
        ctx.stroke();

        // Time ticks
        const ticksCount = Math.max(2, Math.floor(width / 90));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '500 9px monospace';
        ctx.textAlign = 'center';

        for (let t = 0; t <= ticksCount; t++) {
            const tickRatio = t / ticksCount;
            const tickX = tickRatio * width;
            const timeSec = (tickRatio * duration).toFixed(2) + 's';

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.moveTo(tickX, rulerHeight - 6);
            ctx.lineTo(tickX, rulerHeight);
            ctx.stroke();

            const textX = Math.max(16, Math.min(width - 16, tickX));
            ctx.fillText(timeSec, textX, 13);
        }

        // 2. Waveform Background Grid Lines
        [0.25, 0.5, 0.75].forEach(r => {
            const gridY = rulerHeight + ampRegionHeight * r;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.moveTo(0, gridY);
            ctx.lineTo(width, gridY);
            ctx.stroke();
        });

        // Center zero line
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ampCenterY);
        ctx.lineTo(width, ampCenterY);
        ctx.stroke();

        // 3. Audio Waveform Bars
        const numBars = Math.floor(width / 2);
        const samplesPerBar = Math.floor(data.length / numBars);

        const gradient = ctx.createLinearGradient(0, rulerHeight, 0, height);
        gradient.addColorStop(0, '#d8b4fe');
        gradient.addColorStop(0.5, '#c084fc');
        gradient.addColorStop(1, '#818cf8');

        ctx.fillStyle = gradient;

        for (let i = 0; i < numBars; i++) {
            let max = 0;
            const startSample = i * samplesPerBar;
            for (let j = 0; j < samplesPerBar; j++) {
                const val = Math.abs(data[startSample + j] || 0);
                if (val > max) max = val;
            }

            const barHeight = Math.max(3, max * (ampRegionHeight / 2 - 4));
            const x = i * 2;
            const y = ampCenterY - barHeight;

            ctx.fillRect(x, y, 1.5, barHeight * 2);
        }

        // 4. Selection Overlay
        if (selectionStart !== selectionEnd) {
            const startX = width * selectionStart;
            const endX = width * selectionEnd;

            // Translucent unselected masks
            ctx.fillStyle = 'rgba(11, 15, 25, 0.65)';
            ctx.fillRect(0, 0, startX, height);
            ctx.fillRect(endX, 0, width - endX, height);

            // Active selection glow box
            ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
            ctx.fillRect(startX, rulerHeight, endX - startX, ampRegionHeight);

            // Boundary handles
            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(startX, rulerHeight);
            ctx.lineTo(startX, height);
            ctx.moveTo(endX, rulerHeight);
            ctx.lineTo(endX, height);
            ctx.stroke();

            // Handle head grip pills
            ctx.fillStyle = '#a855f7';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;

            // Start handle
            ctx.beginPath();
            ctx.roundRect(startX - 5, rulerHeight + 3, 10, 16, 4);
            ctx.fill();
            ctx.stroke();

            // End handle
            ctx.beginPath();
            ctx.roundRect(endX - 5, height - 19, 10, 16, 4);
            ctx.fill();
            ctx.stroke();
        }

        // 5. Active Hover Playhead Guide Line
        if (hoverRatio !== null && !isDragging) {
            const hoverX = width * hoverRatio;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(hoverX, rulerHeight);
            ctx.lineTo(hoverX, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Floating Hover Time Badge
            const hoverTimeText = (hoverRatio * duration).toFixed(2) + 's';
            ctx.fillStyle = '#9333ea';
            ctx.font = 'bold 9px sans-serif';
            const badgeWidth = 38;
            const badgeX = Math.max(2, Math.min(width - badgeWidth - 2, hoverX - badgeWidth / 2));
            
            ctx.beginPath();
            ctx.roundRect(badgeX, rulerHeight + 2, badgeWidth, 14, 4);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(hoverTimeText, badgeX + badgeWidth / 2, rulerHeight + 12);
        }
    }, [buffer, color, selectionStart, selectionEnd, hoverRatio, isDragging]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair select-none block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    );
};

export interface Sound {
    name: string;
    src: string;
}

interface SoundEditorProps {
    sounds: Sound[];
    spriteName: string;
    onAddSound?: (name: string, src: string) => Promise<void>;
    onDeleteSound?: (index: number) => void;
    onDuplicateSound?: (index: number) => void;
    onClose: () => void;
    mode?: 'junior' | 'intermediate';
    onSoundChange?: () => void;
}

// ─── Lazy initialization to avoid TDZ errors in production builds ─────────
let _audioContext: AudioContext | null = null;
let _globalSoundBank: SoundBank | null = null;

function getAudioContext(): AudioContext {
    if (!_audioContext) {
        _audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return _audioContext;
}

function getGlobalSoundBank(): SoundBank {
    if (!_globalSoundBank) {
        _globalSoundBank = new SoundBank(getAudioContext());
    }
    return _globalSoundBank;
}

// Proxy references so existing code using `audioContext` and `globalSoundBank` keeps working
const audioContext: AudioContext = new Proxy({} as AudioContext, {
    get(_target, prop) {
        const real = getAudioContext();
        const value = (real as any)[prop];
        return typeof value === 'function' ? value.bind(real) : value;
    }
});
const globalSoundBank: SoundBank = new Proxy({} as SoundBank, {
    get(_target, prop) {
        const real = getGlobalSoundBank();
        const value = (real as any)[prop];
        return typeof value === 'function' ? value.bind(real) : value;
    }
});

export const SoundEditor: React.FC<SoundEditorProps> = ({
    sounds,
    spriteName,
    onAddSound,
    onDeleteSound,
    onDuplicateSound,
    onClose,
    mode = 'intermediate',
    onSoundChange
}) => {
    const [activeSoundIndex, setActiveSoundIndex] = useState<number>(0);
    const [soundName, setSoundName] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [history, setHistory] = useState<AudioBuffer[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(1);
    const [clipboardBuffer, setClipboardBuffer] = useState<AudioBuffer | null>(null);
    const [sidebarBuffers, setSidebarBuffers] = useState<Map<number, AudioBuffer>>(new Map());
    const [volume, setVolume] = useState<number>(100);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentSoundPlayer = useRef<AudioBufferSourceNode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeSound = sounds[activeSoundIndex];

    useEffect(() => {
        if (activeSound) {
            setSoundName(activeSound.name);
            loadBuffer(activeSound.src || activeSound.name);
        } else {
            setSoundName('');
            setAudioBuffer(null);
            setHistory([]);
            setHistoryIndex(-1);
        }
        stopPlayback();
    }, [activeSoundIndex, activeSound]);

    const fetchBuffer = async (urlOrName: string) => {
        try {
            if (urlOrName.startsWith('http') || urlOrName.startsWith('blob:') || urlOrName.startsWith('data:') || urlOrName.startsWith('/')) {
                const response = await fetch(urlOrName);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const decoder = new ADPCMSoundDecoder(audioContext);
                return await decoder.decode(arrayBuffer);
            } else {
                return await globalSoundBank.getSoundBuffer(urlOrName);
            }
        } catch (err) {
            console.error("Failed to fetch buffer:", err);
            return null;
        }
    };

    const loadBuffer = async (urlOrName: string) => {
        const buffer = await fetchBuffer(urlOrName);
        if (buffer) {
            setAudioBuffer(buffer);
            setHistory([buffer]);
            setHistoryIndex(0);

            setSidebarBuffers(prev => {
                const next = new Map(prev);
                next.set(activeSoundIndex, buffer);
                return next;
            });
        }
    };

    useEffect(() => {
        const loadAllSidebarBuffers = async () => {
            const newBuffers = new Map(sidebarBuffers);
            let updated = false;
            for (let i = 0; i < sounds.length; i++) {
                if (!newBuffers.has(i)) {
                    const buffer = await fetchBuffer(sounds[i].src || sounds[i].name);
                    if (buffer) {
                        newBuffers.set(i, buffer);
                        updated = true;
                    }
                }
            }
            if (updated) setSidebarBuffers(newBuffers);
        };
        loadAllSidebarBuffers();
    }, [sounds]);

    const stopPlayback = () => {
        if (currentSoundPlayer.current) {
            try { currentSoundPlayer.current.stop(); } catch (e) { }
            currentSoundPlayer.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    };

    const pushHistory = (newBuffer: AudioBuffer) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newBuffer);
        if (newHistory.length > 10) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setAudioBuffer(newBuffer);
        updateParentSource(newBuffer);
    };

    const updateParentSource = async (buffer: AudioBuffer) => {
        if (!onAddSound || !activeSound) return;

        try {
            const wavData = await WavEncoder.encode({
                sampleRate: buffer.sampleRate,
                channelData: [buffer.getChannelData(0)]
            });
            const blob = new Blob([wavData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            onAddSound(activeSound.name, url);
        } catch (err) {
            console.error("Failed to encode and save sound:", err);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            setAudioBuffer(prev);
            updateParentSource(prev);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            setAudioBuffer(next);
            updateParentSource(next);
        }
    };

    const applyEffect = (effectName: any) => {
        if (!audioBuffer) return;

        const effects = new AudioEffects(audioBuffer, effectName, selectionStart, selectionEnd);
        effects.process((renderedBuffer: AudioBuffer) => {
            pushHistory(renderedBuffer);
        });
    };

    const copyToClipboard = () => {
        if (!audioBuffer || selectionStart === selectionEnd) return;
        const startSample = Math.floor(selectionStart * audioBuffer.length);
        const endSample = Math.floor(selectionEnd * audioBuffer.length);
        const newLength = endSample - startSample;

        if (newLength <= 0) return;

        const newBuffer = audioContext.createBuffer(1, newLength, audioBuffer.sampleRate);
        const newChannelData = newBuffer.getChannelData(0);
        const originalData = audioBuffer.getChannelData(0);

        for (let i = 0; i < newLength; i++) {
            newChannelData[i] = originalData[startSample + i];
        }

        setClipboardBuffer(newBuffer);
    };

    const copyToNew = async () => {
        if (!audioBuffer || !onAddSound || selectionStart === selectionEnd) return;

        const startSample = Math.floor(selectionStart * audioBuffer.length);
        const endSample = Math.floor(selectionEnd * audioBuffer.length);
        const newLength = endSample - startSample;

        const newBuffer = audioContext.createBuffer(1, newLength, audioBuffer.sampleRate);
        const newChannelData = newBuffer.getChannelData(0);
        const originalData = audioBuffer.getChannelData(0);

        for (let i = 0; i < newLength; i++) {
            newChannelData[i] = originalData[startSample + i];
        }

        try {
            const wavData = await WavEncoder.encode({
                sampleRate: newBuffer.sampleRate,
                channelData: [newBuffer.getChannelData(0)]
            });
            const blob = new Blob([wavData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            onAddSound(`${activeSound.name} (copy)`, url);
        } catch (err) {
            console.error("Failed to copy to new:", err);
        }
    };

    const pasteFromClipboard = () => {
        if (!audioBuffer || !clipboardBuffer) return;

        const startSample = Math.floor(selectionStart * audioBuffer.length);
        const newLength = audioBuffer.length + clipboardBuffer.length;

        const newBuffer = audioContext.createBuffer(1, newLength, audioBuffer.sampleRate);
        const newChannelData = newBuffer.getChannelData(0);
        const originalData = audioBuffer.getChannelData(0);
        const clipboardData = clipboardBuffer.getChannelData(0);

        for (let i = 0; i < startSample; i++) {
            newChannelData[i] = originalData[i];
        }
        for (let i = 0; i < clipboardBuffer.length; i++) {
            newChannelData[startSample + i] = clipboardData[i];
        }
        for (let i = startSample; i < audioBuffer.length; i++) {
            newChannelData[clipboardBuffer.length + i] = originalData[i];
        }

        pushHistory(newBuffer);
        setSelectionEnd(selectionStart);
    };

    const deleteSelection = () => {
        if (!audioBuffer || selectionStart === selectionEnd) return;

        const startSample = Math.floor(selectionStart * audioBuffer.length);
        const endSample = Math.floor(selectionEnd * audioBuffer.length);
        const newLength = audioBuffer.length - (endSample - startSample);

        if (newLength <= 0) return;

        const newBuffer = audioContext.createBuffer(1, newLength, audioBuffer.sampleRate);
        const newChannelData = newBuffer.getChannelData(0);
        const originalData = audioBuffer.getChannelData(0);

        for (let i = 0; i < startSample; i++) {
            newChannelData[i] = originalData[i];
        }
        for (let i = endSample; i < audioBuffer.length; i++) {
            newChannelData[startSample + (i - endSample)] = originalData[i];
        }

        pushHistory(newBuffer);
        setSelectionEnd(selectionStart);
    };

    const handlePlayPause = async () => {
        if (!audioBuffer) return;

        if (isPlaying) {
            stopPlayback();
            return;
        }

        try {
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();

            source.buffer = audioBuffer;
            gainNode.gain.value = volume / 100;

            source.connect(gainNode);
            gainNode.connect(audioContext.destination);

            source.onended = () => setIsPlaying(false);
            source.start();
            currentSoundPlayer.current = source;
            setIsPlaying(true);
        } catch (err) {
            console.error("Failed to play sound:", err);
            setIsPlaying(false);
        }
    };

    const handleSelectFromLibrary = (sound: { name: string, src: string }) => {
        if (onAddSound) {
            onAddSound(sound.name, sound.src);
        }
        setIsLibraryOpen(false);
        onSoundChange?.();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onAddSound) return;

        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);

        const wavData = await WavEncoder.encode({
            sampleRate: buffer.sampleRate,
            channelData: [buffer.getChannelData(0)]
        });
        const blob = new Blob([wavData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);

        const name = file.name.replace(/\.[^/.]+$/, '');
        await onAddSound(name, url);
        onSoundChange?.();

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const hasSelection = selectionStart !== selectionEnd;
    const durationSec = audioBuffer ? audioBuffer.duration : 0;
    const selectionDuration = hasSelection ? (selectionEnd - selectionStart) * durationSec : 0;

    return (
        <div className="flex flex-1 w-full h-full bg-slate-50/50 select-none overflow-hidden font-sans text-slate-800 border-t border-slate-200/80">
            {/* Hidden file input for sound upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleUpload}
                style={{ display: 'none' }}
            />

            <SoundLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onSelectSound={handleSelectFromLibrary}
            />

            {/* 1. LEFT SIDEBAR (Sounds Panel) */}
            <div className="w-24 min-w-[96px] border-r border-slate-200/80 flex flex-col bg-slate-100/70 overflow-hidden relative">
                <div className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 px-2 pt-3 pb-1 text-center border-b border-slate-200/50">
                    Sounds ({sounds.length})
                </div>
                
                <div className="flex-1 overflow-y-auto px-2 py-2.5 flex flex-col gap-2.5 no-scrollbar pb-20">
                    {sounds.map((s, i) => (
                        <div key={i} className="relative group w-full flex justify-center">
                            <div
                                onClick={() => setActiveSoundIndex(i)}
                                className={`w-[76px] h-[76px] rounded-xl border-2 flex flex-col items-center justify-between p-1.5 cursor-pointer relative transition-all duration-200 ${
                                    activeSoundIndex === i 
                                        ? 'bg-white border-purple-600 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/20 translate-x-0.5' 
                                        : 'bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                                }`}
                            >
                                <span className="absolute top-1 left-1.5 text-[9px] font-extrabold text-slate-400 bg-slate-100/90 px-1 rounded-md">
                                    {i + 1}
                                </span>
                                <div className="flex-1 w-full flex items-center justify-center pt-2 overflow-hidden">
                                    {sidebarBuffers.has(i) ? (
                                        <MiniWaveform
                                            buffer={sidebarBuffers.get(i)!}
                                            width={52}
                                            height={34}
                                            color={activeSoundIndex === i ? '#9333ea' : '#94a3b8'}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                            <Volume2 size={16} />
                                        </div>
                                    )}
                                </div>
                                <div 
                                    className={`w-full text-[10px] font-bold text-center truncate px-0.5 transition-colors ${
                                        activeSoundIndex === i ? 'text-purple-700' : 'text-slate-600 group-hover:text-slate-900'
                                    }`} 
                                    title={s.name}
                                >
                                    {s.name}
                                </div>
                            </div>

                            {/* Floating Action Overlay (Delete / Duplicate) */}
                            <div className="absolute -top-1.5 -right-1 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                {onDeleteSound && (
                                    <button
                                        className="w-6 h-6 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                                        title="Delete"
                                        onClick={(e) => { e.stopPropagation(); onDeleteSound(i); onSoundChange?.(); }}
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                )}
                                {onDuplicateSound && (
                                    <button
                                        className="w-6 h-6 bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                                        title="Duplicate"
                                        onClick={(e) => { e.stopPropagation(); onDuplicateSound(i); onSoundChange?.(); }}
                                    >
                                        <Copy size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Floating Add Sound Action Menu */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                    <ActionMenu
                        mainIcon={<MusicIcon size={18} />}
                        color="#855CD6"
                        tooltipLabel="Choose a Sound"
                        actions={[
                            { id: 'upload', icon: '📁', label: 'Upload Sound', onClick: triggerUpload },
                            {
                                id: 'surprise', icon: '✨', label: 'Surprise', onClick: () => {
                                    const surprises = ['meow', 'bark', 'grunt', 'pop', 'boing'];
                                    const s = surprises[Math.floor(Math.random() * surprises.length)];
                                    if (onAddSound) onAddSound(s, '');
                                    onSoundChange?.();
                                }
                            },
                            { id: 'record', icon: '🎤', label: 'Record', onClick: () => console.log('Record Sound') },
                            { id: 'search', icon: '🔍', label: 'Choose a Sound', onClick: () => setIsLibraryOpen(true) },
                        ]}
                    />
                </div>
            </div>

            {/* 2. MAIN EDITOR AREA */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                {activeSound ? (
                    <>
                        {/* TOP TOOLBAR */}
                        <div className="h-14 px-6 border-b border-slate-200/80 bg-white flex items-center justify-between shadow-xs z-10">
                            {/* Left Header Title */}
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                                    <Volume2 size={18} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">Edit Sound</span>
                                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                                        {activeSound.name}
                                    </span>
                                </div>
                            </div>

                            {/* Right Editing Tools */}
                            <div className="flex items-center gap-2">
                                {/* Undo / Redo group */}
                                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-0.5 border border-slate-200/60">
                                    <button
                                        className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-purple-600 hover:shadow-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                                        onClick={handleUndo}
                                        disabled={historyIndex <= 0}
                                        title="Undo"
                                    >
                                        <Undo size={16} />
                                    </button>
                                    <button
                                        className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-purple-600 hover:shadow-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                                        onClick={handleRedo}
                                        disabled={historyIndex >= history.length - 1}
                                        title="Redo"
                                    >
                                        <Redo size={16} />
                                    </button>
                                </div>

                                <div className="w-px h-5 bg-slate-200 mx-1.5" />

                                {/* Action Buttons */}
                                <button
                                    onClick={copyToClipboard}
                                    disabled={!hasSelection}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <Copy size={14} />
                                    <span>Copy</span>
                                </button>

                                <button
                                    onClick={pasteFromClipboard}
                                    disabled={!clipboardBuffer}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ClipboardIcon size={14} />
                                    <span>Paste</span>
                                </button>

                                <button
                                    onClick={copyToNew}
                                    disabled={!hasSelection}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <MusicIcon size={14} />
                                    <span>Copy to New</span>
                                </button>

                                <button
                                    onClick={deleteSelection}
                                    disabled={!hasSelection}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <Scissors size={14} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>

                        {/* EDITOR CONTENT AREA */}
                        <div className="flex-1 flex flex-row overflow-hidden">
                            {/* WAVEFORM DECK & CONTROLS */}
                            <div className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto max-w-5xl mx-auto w-full">
                                
                                {/* Waveform Control Deck */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
                                    {/* Control Bar Header */}
                                    <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/60 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handlePlayPause}
                                                className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer"
                                                title={isPlaying ? "Stop" : "Play"}
                                            >
                                                {isPlaying ? <Square size={18} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
                                            </button>

                                            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs font-mono text-xs font-bold text-slate-700">
                                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                                <span>Duration: {durationSec.toFixed(2)}s</span>
                                            </div>
                                        </div>

                                        {/* Selection Stats */}
                                        <div className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                                            {hasSelection ? (
                                                <span>Selection: {(selectionStart * durationSec).toFixed(2)}s - {(selectionEnd * durationSec).toFixed(2)}s ({selectionDuration.toFixed(2)}s)</span>
                                            ) : (
                                                <span className="text-slate-500">Drag on waveform to select a segment</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Waveform Canvas Area Container */}
                                    <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 relative overflow-hidden flex flex-col group transition-all">
                                        <div className="w-full h-56 relative rounded-xl overflow-hidden bg-[#0b0f19] border border-slate-800/80 shadow-inner">
                                            <Waveform
                                                buffer={audioBuffer}
                                                color="#a855f7"
                                                selectionStart={selectionStart}
                                                selectionEnd={selectionEnd}
                                                onSelectionChange={(start, end) => {
                                                    setSelectionStart(start);
                                                    setSelectionEnd(end);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Audio Effect Tools Panel */}
                                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-3.5 flex flex-col gap-2.5">
                                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                                        Effects & Manipulations
                                    </div>
                                    <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
                                        <EffectTool icon={<ArrowUpFromLine size={18} />} onClick={() => applyEffect('faster')} label="Faster" />
                                        <EffectTool icon={<ArrowDownToLine size={18} />} onClick={() => applyEffect('slower')} label="Slower" />
                                        <div className="w-px h-8 bg-slate-200 mx-1 flex-shrink-0" />
                                        <EffectTool icon={<Volume2 size={18} />} onClick={() => applyEffect('higher')} label="Louder" />
                                        <EffectTool icon={<VolumeX size={18} />} onClick={() => applyEffect('lower')} label="Softer" />
                                        <EffectTool icon={<VolumeX size={18} />} onClick={() => applyEffect('mute')} label="Mute" />
                                        <div className="w-px h-8 bg-slate-200 mx-1 flex-shrink-0" />
                                        <EffectTool icon={<ArrowLeftRight size={18} />} onClick={() => applyEffect('fade in')} label="Fade in" />
                                        <EffectTool icon={<ArrowRightLeft size={18} />} onClick={() => applyEffect('fade out')} label="Fade out" />
                                        <EffectTool icon={<RotateCcw size={18} />} onClick={() => applyEffect('reverse')} label="Reverse" />
                                        <div className="w-px h-8 bg-slate-200 mx-1 flex-shrink-0" />
                                        <EffectTool icon={<MusicIcon size={18} />} onClick={() => applyEffect('robot')} label="Robot" />
                                    </div>
                                </div>
                            </div>

                            {/* 3. PROPERTIES PANEL (Right Sidebar) */}
                            <div className="w-72 min-w-[280px] border-l border-slate-200/80 bg-white p-5 flex flex-col gap-6 shadow-xs overflow-y-auto">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Properties</h3>
                                </div>

                                {/* Sound Name */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sound Name</label>
                                    <input
                                        type="text"
                                        value={soundName}
                                        onChange={(e) => setSoundName(e.target.value)}
                                        className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all shadow-2xs"
                                    />
                                </div>

                                {/* Volume Control */}
                                <div className="flex flex-col gap-3 bg-slate-50/60 border border-slate-100 p-3.5 rounded-2xl">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Volume</label>
                                        <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                                            {volume}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <VolumeX size={16} className="text-slate-400" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={volume}
                                            onChange={(e) => setVolume(Number(e.target.value))}
                                            className="flex-1 accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                                        />
                                        <Volume2 size={16} className="text-slate-400" />
                                    </div>
                                </div>

                                {/* Audio Information Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                                        <span className="text-base font-extrabold text-slate-800 font-mono">
                                            {audioBuffer ? `${audioBuffer.duration.toFixed(2)}s` : '0.00s'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Format</span>
                                        <span className="text-xs font-bold text-purple-700 mt-1">
                                            WAV Audio
                                        </span>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="mt-auto bg-gradient-to-br from-purple-50 via-indigo-50/40 to-purple-50/30 border border-purple-100 rounded-2xl p-4 shadow-2xs">
                                    <p className="text-xs text-purple-900 font-medium leading-relaxed">
                                        ✨ Edit, trim, and apply real-time audio effects to your sound clips with full undo & redo support.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-purple-600 bg-slate-50/50 text-center p-8">
                        <div className="w-20 h-20 rounded-3xl bg-purple-100/70 border border-purple-200/60 flex items-center justify-center shadow-inner mb-4">
                            <MusicIcon size={40} className="text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Sound Selected</h3>
                        <p className="text-slate-500 max-w-sm text-sm">Select a sound from the panel on the left, or use the menu below to add a new sound clip.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ToolBtnHorizontal = ({ onClick, icon, label, color = "text-purple-600", disabled = false }: any) => (
    <button onClick={onClick} disabled={disabled} className={`flex flex-col items-center gap-0.5 px-2.5 py-1 hover:bg-slate-100 rounded-xl transition-all active:scale-95 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
        <div className={color}>{icon}</div>
        <span className="text-[9px] font-bold text-slate-500 capitalize">{label}</span>
    </button>
);

const EffectTool = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-purple-50/80 border border-slate-100 hover:border-purple-200/80 text-slate-600 hover:text-purple-700 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group min-w-[64px]">
        <div className="w-9 h-9 rounded-xl bg-slate-100/80 group-hover:bg-purple-100/80 flex items-center justify-center text-slate-600 group-hover:text-purple-700 transition-colors shadow-2xs">
            {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-600 group-hover:text-purple-700">{label}</span>
    </button>
);

export default SoundEditor;
