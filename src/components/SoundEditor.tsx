import React, { useState, useRef, useEffect } from 'react';
import {
    Play, Square, Trash2, Copy, Music as MusicIcon,
    Volume2, VolumeX, Scissors, RotateCcw, Undo, Redo,
    ArrowUpFromLine, ArrowDownToLine, ArrowRightLeft, ArrowLeftRight, Clipboard as ClipboardIcon
} from 'lucide-react';
import { ActionMenu } from '../stage/ActionMenu';
import { SoundBank } from '../scratch-audio/src/SoundBank';
import { SoundLibrary } from './SoundLibrary';
import AudioEffects from '../scratch-audio/src/audio/audio-effects';
import WavEncoder from 'wav-encoder';

// ═══════════════════════════════════════════════════════════════════════════
// WAVEFORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const Waveform: React.FC<{ buffer: AudioBuffer | null, color: string }> = ({ buffer, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !buffer) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, amp);

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.lineTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }

        ctx.stroke();
    }, [buffer, color]);

    return <canvas ref={canvasRef} className="w-full h-full" width={1000} height={200} />;
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
}

// Ensure AudioContext is available
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
const globalSoundBank = new SoundBank(audioContext);

const generateWaveformPoints = (width: number, height: number): string => {
    let points = '';
    const pointsCount = 100;
    const centerY = height / 2;
    for (let i = 0; i < pointsCount; i++) {
        const x = (i / pointsCount) * width;
        // Generate pseudo-random realistic looking waveform
        const amplitude = Math.sin(i * 0.2) * Math.cos(i * 0.5) * Math.random();
        const y = centerY + amplitude * (height / 2.5);
        points += `${x},${y} `;

        // Add bottom half of waveform for symmetry
        const y2 = centerY - amplitude * (height / 2.5);
        points += `${x},${y2} `;
    }
    return points;
};

export const SoundEditor: React.FC<SoundEditorProps> = ({
    sounds,
    spriteName,
    onAddSound,
    onDeleteSound,
    onDuplicateSound,
    onClose,
    mode = 'intermediate'
}) => {
    const [activeSoundIndex, setActiveSoundIndex] = useState<number>(0);
    const [soundName, setSoundName] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [history, setHistory] = useState<AudioBuffer[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentSoundPlayer = useRef<AudioBufferSourceNode | null>(null);

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

    const loadBuffer = async (urlOrName: string) => {
        try {
            let buffer: AudioBuffer | null = null;
            if (urlOrName.startsWith('http') || urlOrName.startsWith('blob:') || urlOrName.startsWith('data:')) {
                const response = await fetch(urlOrName);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await audioContext.decodeAudioData(arrayBuffer);
            } else {
                buffer = await globalSoundBank.getSoundBuffer(urlOrName);
            }

            if (buffer) {
                setAudioBuffer(buffer);
                setHistory([buffer]);
                setHistoryIndex(0);
            }
        } catch (err) {
            console.error("Failed to load buffer:", err);
        }
    };

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
        // Limit history to 10 steps
        if (newHistory.length > 10) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setAudioBuffer(newBuffer);

        // Also update the source in the parent component
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
            // We use onAddSound to update the existing sound in the list
            // In a real implementation we might need a dedicated updateSound callback
            // For now, we'll assume the parent handles the 'src' change.
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

    const applyEffect = (effectName: string) => {
        if (!audioBuffer) return;

        const effects = new AudioEffects(audioBuffer, effectName, 0, 1);
        effects.process((renderedBuffer: AudioBuffer) => {
            pushHistory(renderedBuffer);
        });
    };

    const handlePlayPause = async () => {
        if (!audioBuffer) return;

        if (isPlaying) {
            stopPlayback();
            return;
        }

        try {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
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
    };

    return (
        <div className="flex flex-1 w-full h-full bg-white select-none overflow-hidden font-sans border-t border-gray-100">
            <SoundLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onSelectSound={handleSelectFromLibrary}
            />
            {/* 1. LEFT SIDEBAR (Sounds Panel) */}
            <div className="w-[100px] border-r border-gray-200 flex flex-col bg-[#EDF1F7] overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3 no-scrollbar pb-20">
                    {sounds.map((s, i) => (
                        <div key={i} className="relative group">
                            <div
                                onClick={() => setActiveSoundIndex(i)}
                                className={`w-[80px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-1 bg-white cursor-pointer relative ${activeSoundIndex === i ? 'border-[#855CD6] shadow-sm' : 'border-gray-200'}`}
                            >
                                <span className="absolute top-1 left-1.5 text-[10px] text-gray-500 font-bold">{i + 1}</span>
                                <div className="flex-1 w-full flex items-center justify-center">
                                    <div className="w-10 h-10 bg-[#e0d6ff] rounded-full flex items-center justify-center text-[#855CD6]">
                                        <Volume2 size={24} />
                                    </div>
                                </div>
                                <div className="w-full text-[10px] text-center truncate text-gray-700 font-medium px-0.5 mt-0.5" title={s.name}>{s.name}</div>
                            </div>

                            {/* Context Actions (Hover) */}
                            <div className={`absolute -top-2 -right-2 flex-col gap-1 z-10 hidden group-hover:flex ${activeSoundIndex === i ? 'flex' : ''}`}>
                                {onDeleteSound && (
                                    <button
                                        className="w-6 h-6 bg-white border border-gray-200 text-gray-500 hover:text-rose-500 rounded-full flex items-center justify-center shadow-md transition-colors"
                                        title="Delete"
                                        onClick={(e) => { e.stopPropagation(); onDeleteSound(i); }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                                {onDuplicateSound && (
                                    <button
                                        className="w-6 h-6 bg-white border border-gray-200 text-gray-500 hover:text-[#855CD6] rounded-full flex items-center justify-center shadow-md transition-colors"
                                        title="Duplicate"
                                        onClick={(e) => { e.stopPropagation(); onDuplicateSound(i); }}
                                    >
                                        <Copy size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Menu (Floating Bottom Left) */}
                <div className="absolute bottom-4 left-4 z-50">
                    <ActionMenu
                        mainIcon={<MusicIcon size={20} />}
                        color="#855CD6"
                        tooltipLabel="Choose a Sound"
                        actions={[
                            { id: 'upload', icon: '📁', label: 'Upload Sound', onClick: () => console.log('Upload Sound') },
                            {
                                id: 'surprise', icon: '✨', label: 'Surprise', onClick: () => {
                                    const surprises = ['meow', 'bark', 'grunt', 'pop', 'boing'];
                                    const s = surprises[Math.floor(Math.random() * surprises.length)];
                                    if (onAddSound) onAddSound(s, '');
                                }
                            },
                            { id: 'record', icon: '🎤', label: 'Record', onClick: () => console.log('Record Sound') },
                            { id: 'search', icon: '🔍', label: 'Choose a Sound', onClick: () => setIsLibraryOpen(true) },
                        ]}
                    />
                </div>
            </div>

            {/* 2. MAIN EDITOR AREA */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f9f9f9]">
                {activeSound ? (
                    <>
                        {/* TOP TOOLBAR */}
                        <div className="h-14 px-6 border-b border-gray-200 flex items-center bg-white justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">Sound</span>
                                    <input
                                        type="text"
                                        value={soundName}
                                        onChange={(e) => setSoundName(e.target.value)}
                                        className="bg-[#f8f8f8] border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-600 outline-none focus:border-[#855CD6] w-48"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    className={`p-2 rounded-lg transition-colors ${historyIndex > 0 ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}
                                    onClick={handleUndo}
                                    disabled={historyIndex <= 0}
                                    title="Undo"
                                >
                                    <Undo size={20} />
                                </button>
                                <button
                                    className={`p-2 rounded-lg transition-colors ${historyIndex < history.length - 1 ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}
                                    onClick={handleRedo}
                                    disabled={historyIndex >= history.length - 1}
                                    title="Redo"
                                >
                                    <Redo size={20} />
                                </button>
                                <div className="w-px h-6 bg-gray-200 mx-1" />
                                <ToolBtnHorizontal icon={<Copy size={18} />} label="Copy" />
                                <ToolBtnHorizontal icon={<ClipboardIcon size={18} />} label="Paste" />
                                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                                    <Scissors size={20} />
                                </button>
                                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* WAVEFORM & CONTROLS */}
                        <div className="flex-1 flex flex-col p-8 relative">
                            {/* Playback Control Button */}
                            <div className="absolute top-8 left-8 z-10">
                                <button
                                    onClick={handlePlayPause}
                                    className="w-16 h-16 rounded-full bg-[#855CD6] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all outline-none"
                                >
                                    {isPlaying ? <Square size={28} fill="white" /> : <Play size={32} fill="white" className="ml-2" />}
                                </button>
                            </div>

                            {/* Waveform Visualization */}
                            <div className="flex-1 bg-white rounded-2xl border-2 border-[#e0d6ff] shadow-sm relative overflow-hidden flex items-center justify-center mt-20 mb-8 mx-auto w-full max-w-4xl">
                                <div className="absolute inset-0 flex items-center group cursor-pointer w-full">
                                    <Waveform buffer={audioBuffer} color="#855CD6" />
                                </div>
                            </div>

                            {/* Audio Effect Tools */}
                            <div className="h-24 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-around px-4 max-w-4xl mx-auto w-full">
                                <EffectTool icon={<ArrowUpFromLine size={24} />} onClick={() => applyEffect('faster')} label="Faster" />
                                <EffectTool icon={<ArrowDownToLine size={24} />} onClick={() => applyEffect('slower')} label="Slower" />
                                <div className="w-px h-12 bg-gray-200" />
                                <EffectTool icon={<Volume2 size={24} />} onClick={() => applyEffect('higher')} label="Louder" />
                                <EffectTool icon={<VolumeX size={24} />} onClick={() => applyEffect('lower')} label="Softer" />
                                <EffectTool icon={<VolumeX size={24} />} onClick={() => applyEffect('mute')} label="Mute" />
                                <div className="w-px h-12 bg-gray-200" />
                                <EffectTool icon={<ArrowLeftRight size={24} />} onClick={() => applyEffect('fade in')} label="Fade in" />
                                <EffectTool icon={<ArrowRightLeft size={24} />} onClick={() => applyEffect('fade out')} label="Fade out" />
                                <EffectTool icon={<RotateCcw size={24} />} onClick={() => applyEffect('reverse')} label="Reverse" />
                                <div className="w-px h-12 bg-gray-200" />
                                <EffectTool icon={<MusicIcon size={24} />} onClick={() => applyEffect('robot')} label="Robot" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#855CD6] bg-[#f9f9f9] text-center p-8">
                        <span style={{ fontSize: '64px' }}>🎵</span>
                        <h3 className="text-2xl font-bold mt-4 mb-2">No Sound Selected</h3>
                        <p className="text-gray-500 max-w-sm">Select a sound from the panel on the left, or use the menu below to add a new sound.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ToolBtnHorizontal = ({ onClick, icon, label, color = "text-[#855CD6]" }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 hover:bg-gray-50 rounded-lg transition-all active:scale-95">
        <div className={color}>{icon}</div>
        <span className="text-[10px] font-bold text-gray-400 capitalize">{label}</span>
    </button>
);

const EffectTool = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-2 w-20 rounded-xl hover:bg-[#EDF1F7] text-[#855CD6] transition-colors group">
        <div className="bg-[#f8f6ff] p-3 rounded-full group-hover:bg-white shadow-sm border border-transparent group-hover:border-[#e0d6ff] transition-all">
            {icon}
        </div>
        <span className="text-xs font-bold text-gray-500 group-hover:text-[#855CD6]">{label}</span>
    </button>
);

export default SoundEditor;
