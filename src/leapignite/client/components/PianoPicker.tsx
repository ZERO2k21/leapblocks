/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Note {
    name: string;
    type: 'white' | 'black';
    nameLong?: string;
}

const NOTES: Note[] = [
    { name: 'C', type: 'white' },
    { name: 'C#', type: 'black' },
    { name: 'D', type: 'white' },
    { name: 'D#', type: 'black' },
    { name: 'E', type: 'white' },
    { name: 'F', type: 'white' },
    { name: 'F#', type: 'black' },
    { name: 'G', type: 'white' },
    { name: 'G#', type: 'black' },
    { name: 'A', type: 'white' },
    { name: 'A#', type: 'black' },
    { name: 'B', type: 'white' },
    { name: 'C2', nameLong: 'C', type: 'white' },
];

// Black key positions (left offset in px)
const BLACK_KEY_POSITIONS: Record<string, number> = {
    'C#': 45, 'D#': 87, 'F#': 171, 'G#': 213, 'A#': 255,
};

interface PianoPickerProps {
    onPick: (note: string, octave: number) => void;
    onClose: () => void;
    onPreview?: (note: string, octave: number) => void;
    position: { x: number; y: number } | null;
    initialNote?: string;
    initialOctave?: number;
}

export default function PianoPicker({ onPick, onClose, onPreview, position, initialNote = 'C', initialOctave = 4 }: PianoPickerProps) {
    const [octave, setOctave] = useState(initialOctave);
    const [selectedNote, setSelectedNote] = useState(initialNote);
    const [isMouseDown, setIsMouseDown] = useState(false);

    if (!position) return null;

    const handleNoteClick = (note: string) => {
        const cleanNote = note === 'C2' ? 'C' : note;
        const finalOctave = note === 'C2' ? octave + 1 : octave;
        setSelectedNote(note);
        if (onPreview) onPreview(cleanNote, finalOctave);
        onPick(cleanNote, finalOctave);
        setTimeout(onClose, 800);
    };

    const handleNotePreview = (note: string) => {
        const cleanNote = note === 'C2' ? 'C' : note;
        const finalOctave = note === 'C2' ? octave + 1 : octave;
        setSelectedNote(note);
        if (onPreview) onPreview(cleanNote, finalOctave);
    };

    const changeOctave = (delta: number) => {
        setOctave(Math.max(1, Math.min(7, octave + delta)));
    };

    return (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9005]" onClick={onClose}>
            <div
                className="absolute bg-[#CF63CF] rounded-xl p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] select-none min-w-[320px]"
                style={{ left: position.x, top: position.y }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Arrow */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#CF63CF]" />

                {/* Octave Header */}
                <div className="flex justify-between items-center bg-white/20 rounded-lg mb-2.5 px-2.5 py-1">
                    <button
                        className="bg-transparent border-none text-white cursor-pointer flex items-center p-0"
                        onClick={() => changeOctave(-1)}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-white font-bold text-lg">{octave}</span>
                    <button
                        className="bg-transparent border-none text-white cursor-pointer flex items-center p-0"
                        onClick={() => changeOctave(1)}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Keyboard */}
                <div
                    className="bg-white rounded-md flex p-1 relative h-[120px]"
                    onMouseDown={() => setIsMouseDown(true)}
                    onMouseUp={() => setIsMouseDown(false)}
                    onMouseLeave={() => setIsMouseDown(false)}
                >
                    {NOTES.map((note, index) => {
                        const isSelected = selectedNote === note.name;

                        if (note.type === 'black') {
                            return (
                                <div
                                    key={index}
                                    className={`absolute w-6 h-[65px] rounded cursor-pointer transition-all duration-100 z-[2] -ml-[13px] ${isSelected ? 'bg-[#03A9F4]' : 'bg-[#333]'}`}
                                    style={{ left: BLACK_KEY_POSITIONS[note.name] }}
                                    onMouseDown={(e) => { e.stopPropagation(); setIsMouseDown(true); handleNotePreview(note.name); }}
                                    onMouseEnter={() => { if (isMouseDown) handleNotePreview(note.name); }}
                                    onMouseUp={() => handleNoteClick(note.name)}
                                />
                            );
                        }

                        return (
                            <div
                                key={index}
                                className={`w-10 h-full rounded border border-[#ddd] mr-0.5 last:mr-0 flex items-end justify-center pb-2.5 z-[1] cursor-pointer transition-all duration-100 ${isSelected ? 'bg-[#B3E5FC]' : 'bg-white'}`}
                                onMouseDown={(e) => { e.stopPropagation(); setIsMouseDown(true); handleNotePreview(note.name); }}
                                onMouseEnter={() => { if (isMouseDown) handleNotePreview(note.name); }}
                                onMouseUp={() => handleNoteClick(note.name)}
                            >
                                <span className="text-[#666] font-bold text-base">{note.nameLong || note.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
