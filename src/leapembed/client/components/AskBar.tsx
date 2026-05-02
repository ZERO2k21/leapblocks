/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';

interface AskBarProps {
    question: string;
    onSubmit: (answer: string) => void;
}

const AskBar: React.FC<AskBarProps> = ({ question, onSubmit }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus the input as soon as the bar appears
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const submit = () => {
        onSubmit(value);
        setValue('');
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                backgroundColor: '#fff',
                borderTop: '2px solid #4C97FF',
                boxSizing: 'border-box',
                width: '100%',
            }}
        >
            {/* Question label */}
            <span
                style={{
                    backgroundColor: '#4C97FF',
                    color: '#fff',
                    borderRadius: 14,
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    maxWidth: '40%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 0,
                }}
                title={question}
            >
                {question}
            </span>

            {/* Text input */}
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') submit();
                }}
                style={{
                    flex: 1,
                    border: '2px solid #4C97FF',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 13,
                    outline: 'none',
                    minWidth: 0,
                }}
            />

            {/* Submit (checkmark) button */}
            <button
                type="button"
                onClick={submit}
                style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: '#4C97FF',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    padding: 0,
                }}
                title="Submit"
            >
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path
                        d="M1 5L4.5 8.5L13 1"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </div>
    );
};

export default AskBar;
