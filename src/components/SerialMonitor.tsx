import React, { useState, useEffect, useRef } from 'react';

interface SerialMonitorProps {
    baudRate: number;
    setBaudRate: (baud: number) => void;
    lineEnding: string;
    setLineEnding: (ending: string) => void;
    messages: string[];
    setMessages: React.Dispatch<React.SetStateAction<string[]>>;
    onSendMessage: (msg: string) => void;
    isConnected: boolean;
}

const SerialMonitor: React.FC<SerialMonitorProps> = ({
    baudRate,
    setBaudRate,
    lineEnding,
    setLineEnding,
    messages,
    setMessages,
    onSendMessage,
    isConnected
}) => {
    const [input, setInput] = useState('');
    const [autoscroll, setAutoscroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoscroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, autoscroll]);

    const handleSend = () => {
        if (!input.trim() || !isConnected) return;
        onSendMessage(input + lineEnding);
        setInput('');
    };

    const handleClear = () => {
        setMessages([]);
    };

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <span style={styles.inputLabel}>Input</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={styles.input}
                    disabled={!isConnected}
                />
                <button
                    onClick={handleSend}
                    style={isConnected ? styles.sendIconBtn : styles.sendIconBtnDisabled}
                    disabled={!isConnected}
                    title="Send"
                >
                    ➤
                </button>
                <button onClick={handleClear} style={styles.iconBtn} title="Clear output">
                    🗑️
                </button>

                <div style={styles.divider}></div>

                <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(parseInt(e.target.value))}
                    style={styles.select}
                    title="Baud Rate"
                >
                    <option value="9600">9600</option>
                    <option value="115200">115200</option>
                    <option value="57600">57600</option>
                    <option value="38400">38400</option>
                    <option value="19200">19200</option>
                </select>

                <div style={styles.divider}></div>

                <select
                    value={lineEnding}
                    onChange={(e) => setLineEnding(e.target.value)}
                    style={styles.select}
                    title="Line Ending"
                >
                    <option value="">No line ending</option>
                    <option value="\n">Newline (NL)</option>
                    <option value="\r">Carriage return (CR)</option>
                    <option value="\r\n">Both (NL & CR)</option>
                </select>
            </div>

            <div style={styles.monitor} ref={scrollRef}>
                {messages.length === 0 ? (
                    <div style={styles.placeholder}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📟</div>
                        Waiting for serial data...<br />
                        <span style={{ fontSize: '11px', opacity: 0.6 }}> Ensure your board is connected and code is running.</span>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} style={styles.message}>
                            {msg}
                        </div>
                    ))
                )}
            </div>
            {/* Added an autoscroll toggle at the bottom to save space in the top bar */}
            <div style={styles.footer}>
                <label style={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={autoscroll}
                        onChange={(e) => setAutoscroll(e.target.checked)}
                    />
                    <span>Autoscroll</span>
                </label>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        backgroundColor: '#fff',
        border: '1px solid #eee',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    topBar: {
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #eee',
        gap: '6px',
    },
    inputLabel: {
        fontSize: '12px',
        color: '#666',
        fontWeight: 'bold' as const,
        marginRight: '4px',
    },
    input: {
        flex: 1,
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '12px',
        outline: 'none',
        minWidth: '50px',
    },
    sendIconBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
    },
    sendIconBtnDisabled: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: '4px 8px',
        cursor: 'default',
        fontSize: '14px',
        color: '#ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
    },
    divider: {
        width: '1px',
        height: '16px',
        backgroundColor: '#ddd',
        margin: '0 4px',
    },
    select: {
        padding: '4px 6px',
        fontSize: '11px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        outline: 'none',
        backgroundColor: '#fff',
        color: '#333',
    },
    monitor: {
        flex: 1,
        padding: '12px',
        overflowY: 'auto' as const,
        backgroundColor: '#fff',
        color: '#333',
        fontFamily: 'Consolas, monaco, monospace',
        fontSize: '13px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap' as const,
    },
    message: {
        marginBottom: '2px',
        borderBottom: '1px solid #f0f0f0',
    },
    placeholder: {
        color: '#aaa',
        textAlign: 'center' as const,
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    footer: {
        padding: '4px 12px',
        backgroundColor: '#f9f9f9',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: '#666',
        cursor: 'pointer',
    },
};

export default SerialMonitor;
