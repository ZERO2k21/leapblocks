/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/pianoPicker.css';

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
        // Delay closing to allow for multiple clicks/glissando if they want
        // But for "Pick", we usually close. Let's keep a small delay.
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
        <div className="piano-overlay" onClick={onClose}>
            <div
                className="piano-container"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="piano-arrow-up"></div>
                <div className="piano-header">
                    <button className="octave-btn" onClick={() => changeOctave(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className="octave-display">{octave}</span>
                    <button className="octave-btn" onClick={() => changeOctave(1)}>
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div
                    className="piano-keyboard"
                    onMouseDown={() => setIsMouseDown(true)}
                    onMouseUp={() => setIsMouseDown(false)}
                    onMouseLeave={() => setIsMouseDown(false)}
                >
                    {NOTES.map((note, index) => (
                        <div
                            key={index}
                            className={`piano-key ${note.type} ${selectedNote === note.name ? 'selected' : ''}`}
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
                            {note.type === 'white' && <span className="key-label">{note.nameLong || note.name}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
