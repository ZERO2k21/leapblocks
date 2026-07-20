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
        <div className="fixed inset-0 w-screen h-screen z-[9005]" onClick={onClose}>
            <div
                className="bg-[#CF63CF] rounded-xl p-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] select-none min-w-[320px]"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-l-transparent border-r-transparent border-b-[#CF63CF]" style={{ borderLeftWidth: '8px', borderRightWidth: '8px', borderBottomWidth: '8px' }}></div>

                <div className="flex justify-between items-center bg-white/20 rounded-lg mb-[10px] px-[10px] py-1">
                    <button className="bg-none border-none text-white cursor-pointer flex items-center p-0" onClick={() => changeOctave(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-white font-bold text-lg">{octave}</span>
                    <button className="bg-none border-none text-white cursor-pointer flex items-center p-0" onClick={() => changeOctave(1)}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div
                    className="bg-white rounded-md flex p-1 relative h-[120px]"
                    onMouseDown={() => setIsMouseDown(true)}
                    onMouseUp={() => setIsMouseDown(false)}
                    onMouseLeave={() => setIsMouseDown(false)}
                >
                    {NOTES.map((note, index) => (
                        <div
                            key={index}
                            className={`cursor-pointer rounded-[4px] transition-all duration-100 ${
                                note.type === 'white'
                                    ? `w-10 h-full bg-white border border-[#ddd] mr-[2px] flex items-end justify-center pb-[10px] z-[1] last:mr-0 ${selectedNote === note.name ? 'bg-[#B3E5FC]' : ''}`
                                    : `w-6 h-[65px] bg-[#333] absolute z-[2] ${selectedNote === note.name ? 'bg-[#03A9F4]' : ''}`
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
                            {note.type === 'white' && <span className="text-[#666] font-bold text-base">{note.nameLong || note.name}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
