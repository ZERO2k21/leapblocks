/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const NOTES = [
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

export default function PianoPicker({ onPick, onClose, onPreview, position, initialNote = 'C', initialOctave = 4 }) {
    const [octave, setOctave] = useState(initialOctave);
    const [selectedNote, setSelectedNote] = useState(initialNote);
    const [isMouseDown, setIsMouseDown] = useState(false);

    if (!position) return null;

    const handleNoteClick = (note) => {
        const cleanNote = note === 'C2' ? 'C' : note;
        const finalOctave = note === 'C2' ? octave + 1 : octave;
        setSelectedNote(note);
        if (onPreview) onPreview(cleanNote, finalOctave);
        onPick(cleanNote, finalOctave);
        setTimeout(onClose, 800);
    };

    const handleNotePreview = (note) => {
        const cleanNote = note === 'C2' ? 'C' : note;
        const finalOctave = note === 'C2' ? octave + 1 : octave;
        setSelectedNote(note);
        if (onPreview) onPreview(cleanNote, finalOctave);
    };

    const changeOctave = (delta) => {
        setOctave(Math.max(1, Math.min(7, octave + delta)));
    };

    const blackKeyLeftPositions = { 1: '45px', 3: '87px', 6: '171px', 8: '213px', 10: '255px' };

    return (
        <div className="fixed inset-0 w-screen h-screen z-[99999]" onClick={onClose}>
            <div
                className="bg-fuchsia-500 rounded-xl p-2.5 shadow-2xl select-none min-w-[320px]"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-fuchsia-500"></div>

                <div className="flex justify-between items-center bg-white/20 rounded-lg mb-2.5 px-2.5 py-1">
                    <button type="button" className="bg-transparent border-0 text-white cursor-pointer flex items-center p-0" onClick={() => changeOctave(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-white font-bold text-lg">{octave}</span>
                    <button type="button" className="bg-transparent border-0 text-white cursor-pointer flex items-center p-0" onClick={() => changeOctave(1)}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div
                    className="bg-white rounded-md flex p-1 relative h-30"
                    onMouseDown={() => setIsMouseDown(true)}
                    onMouseUp={() => setIsMouseDown(false)}
                    onMouseLeave={() => setIsMouseDown(false)}
                >
                    {NOTES.map((note, index) => (
                        <div
                            key={index}
                            className={`cursor-pointer rounded-sm transition-all duration-100 ${
                                note.type === 'white'
                                    ? `w-10 h-full bg-white border border-gray-300 mr-0.5 flex items-end justify-center pb-2.5 z-0 last:mr-0 ${selectedNote === note.name ? 'bg-sky-200' : ''}`
                                    : `w-6 h-16 bg-slate-800 absolute z-10 ${selectedNote === note.name ? 'bg-sky-500' : ''}`
                            }`}
                            style={note.type === 'black' ? { left: blackKeyLeftPositions[index], marginLeft: '-13px' } : {}}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsMouseDown(true);
                                handleNotePreview(note.name);
                            }}
                            onMouseEnter={() => {
                                if (isMouseDown) handleNotePreview(note.name);
                            }}
                            onMouseUp={() => {
                                handleNoteClick(note.name);
                            }}
                        >
                            {note.type === 'white' && <span className="text-slate-500 font-bold text-base">{note.nameLong || note.name}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
