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
        <div className="flex items-center gap-1.5 py-1.5 px-2.5 bg-white border-t-2 border-t-[#4C97FF] box-border w-full">
            {/* Question label */}
            <span
                className="bg-[#4C97FF] text-white rounded-[14px] py-[3px] px-2.5 text-xs font-semibold whitespace-nowrap max-w-[40%] overflow-hidden text-ellipsis shrink-0"
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
                className="flex-1 border-2 border-[#4C97FF] rounded py-1 px-2 text-[13px] outline-none min-w-0"
            />

            {/* Submit (checkmark) button */}
            <button
                type="button"
                onClick={submit}
                className="w-[26px] h-[26px] rounded-full bg-[#4C97FF] border-none cursor-pointer flex items-center justify-center shrink-0 p-0"
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
