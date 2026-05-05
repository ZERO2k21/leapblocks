/**
 * useHardware.ts
 * Manages serial port connection, upload flow, and hardware IPC events.
 * All functions accept optional parameters — if omitted, current state is used.
 * This makes them compatible with both () => void and (args) => void call sites.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useHardware(addLog: (msg: string) => void) {
    const [ports, setPorts] = useState<{ path: string; manufacturer?: string }[]>([]);
    const [selectedPort, setSelectedPort] = useState('');
    const [selectedBoard, setSelectedBoard] = useState('arduino_uno');
    const [selectedBoardName, setSelectedBoardName] = useState('Arduino Uno');
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [serialMessages, setSerialMessages] = useState<string[]>([]);
    const [baudRate, setBaudRate] = useState(9600);
    const [lineEnding, setLineEnding] = useState('\r\n');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');

    // Ref so callbacks always see latest values without stale closures
    const s = useRef({ selectedPort, selectedBoard, isConnected, baudRate, isUploading, generatedCode });
    useEffect(() => {
        s.current = { selectedPort, selectedBoard, isConnected, baudRate, isUploading, generatedCode };
    }, [selectedPort, selectedBoard, isConnected, baudRate, isUploading, generatedCode]);

    // ─── IPC listeners ────────────────────────────────────────────────────────
    useEffect(() => {
        const api = (window as any).electronAPI;
        api?.onSerialData?.((data: string) =>
            setSerialMessages(prev => [...prev.slice(-100), data]));
        api?.onConnectionChange?.((connected: boolean) => setIsConnected(connected));
        api?.onUploadProgress?.((progress: string, message: string) => {
            setUploadProgress(`${progress}: ${message}`);
            addLog(`[Upload] ${message}`);
        });
        api?.onPortsUpdate?.((list: any[]) => setPorts(list));
    }, [addLog]);

    // ─── Auto-refresh ports ───────────────────────────────────────────────────
    useEffect(() => {
        const api = (window as any).electronAPI;
        if (!api?.getPorts) return;
        const t = setInterval(() =>
            api.getPorts().then((l: any[]) => setPorts(l)).catch(() => { }), 5000);
        return () => clearInterval(t);
    }, []);

    // ─── Refresh ports ────────────────────────────────────────────────────────
    const refreshPorts = useCallback(async () => {
        try {
            const api = (window as any).electronAPI;
            setPorts(api?.getPorts
                ? await api.getPorts()
                : [{ path: 'WEB_DEMO', manufacturer: 'LeapBlocks Web' }]);
        } catch { addLog('Failed to scan ports'); }
    }, [addLog]);

    // ─── Connect / Disconnect — optional params fall back to current state ────
    const handleConnect = useCallback(async (
        port?: string, baud?: number, board?: string, connected?: boolean
    ) => {
        const p = port ?? s.current.selectedPort;
        const b = baud ?? s.current.baudRate;
        const br = board ?? s.current.selectedBoard;
        const c = connected ?? s.current.isConnected;

        if (!p) { addLog('Select a port first'); return; }
        if (p === 'BRIDGE_DETECTED') {
            addLog('⚠ Device detected but no COM port assigned. Please install drivers.');
            return;
        }
        const api = (window as any).electronAPI;
        if (c) {
            if (api?.disconnectPort) {
                const r = await api.disconnectPort();
                if (r.success) { setIsConnected(false); addLog(`Disconnected from ${p}`); }
            } else { setIsConnected(false); addLog(`Disconnected from ${p}`); }
            return;
        }
        try {
            if (api?.connectPort) {
                const r = await api.connectPort(p, b, br);
                if (r.success) { setIsConnected(true); addLog(`Connected to ${p} at ${b} baud`); }
                else addLog(`Connection failed: ${r.error}`);
            } else if (p === 'WEB_DEMO') {
                setIsConnected(true); addLog('Connected (Simulation Mode)');
            } else {
                addLog('Serial connection requires LeapBlocks Desktop');
            }
        } catch { addLog('Connection error occurred'); }
    }, [addLog]);

    // ─── Send serial — data required, port/connected optional ─────────────────
    const handleSendSerial = useCallback(async (data: string, port?: string, connected?: boolean) => {
        const p = port ?? s.current.selectedPort;
        const c = connected ?? s.current.isConnected;
        if (!c) return;
        try {
            const api = (window as any).electronAPI;
            if (api?.sendSerial) {
                await api.sendSerial(data);
                setSerialMessages(prev => [...prev.slice(-100), `> ${data.trim()}`]);
            } else if (p === 'WEB_DEMO') {
                setSerialMessages(prev => [...prev.slice(-100), `> ${data.trim()}`]);
            }
        } catch { addLog('Failed to send'); }
    }, [addLog]);

    // ─── Upload — all params optional, fall back to current state ─────────────
    const handleUpload = useCallback(async (
        code?: string, port?: string, board?: string, connected?: boolean, baud?: number
    ) => {
        const uploadCode = code ?? s.current.generatedCode;
        const p = port ?? s.current.selectedPort;
        const br = board ?? s.current.selectedBoard;
        const c = connected ?? s.current.isConnected;
        const b = baud ?? s.current.baudRate;

        if (!uploadCode || s.current.isUploading) return;
        if (!p) {
            addLog('No port selected!');
            alert('⚠️ No port selected!\n\nPlease connect your board and select a COM port.');
            return;
        }
        const api = (window as any).electronAPI;
        if (c && api?.disconnectPort) {
            addLog('Disconnecting serial for upload...');
            await api.disconnectPort();
            setIsConnected(false);
            await new Promise(r => setTimeout(r, 1500));
        }
        setIsUploading(true);
        setUploadProgress('Uploading...');
        addLog('Starting upload...');

        const fqbnMap: Record<string, string> = {
            arduino_uno: 'arduino:avr:uno',
            arduino_mega: 'arduino:avr:mega',
            arduino_nano: 'arduino:avr:nano',
            esp32: 'esp32:esp32:esp32',
        };
        try {
            const result = await api.uploadCode(uploadCode, p, fqbnMap[br] || 'arduino:avr:uno');
            if (result.success) {
                addLog('Upload complete!');
                setUploadProgress('Upload complete!');
                if (p && api?.connectPort) {
                    addLog('Connecting serial monitor...');
                    setTimeout(async () => {
                        try {
                            const r = await api.connectPort(p, b, br);
                            if (r.success) { setIsConnected(true); addLog('Serial monitor connected'); }
                        } catch { }
                        setIsUploading(false);
                    }, 2000);
                } else { setIsUploading(false); }
            } else {
                let msg = result.error || 'Unknown error';
                if (msg.includes('busy') || msg.includes('Access is denied'))
                    msg += '\nTIP: Close any other serial monitors and try again.';
                addLog(`Upload failed: ${msg}`);
                setUploadProgress(`Failed: ${msg}`);
                setIsUploading(false);
            }
        } catch {
            addLog('Upload error');
            setUploadProgress('Upload error');
            setIsUploading(false);
        }
    }, [addLog]);

    return {
        ports, setPorts,
        selectedPort, setSelectedPort,
        selectedBoard, setSelectedBoard,
        selectedBoardName, setSelectedBoardName,
        isBoardModalOpen, setIsBoardModalOpen,
        isConnected, setIsConnected,
        serialMessages, setSerialMessages,
        baudRate, setBaudRate,
        lineEnding, setLineEnding,
        isUploading, setIsUploading,
        uploadProgress, setUploadProgress,
        generatedCode, setGeneratedCode,
        refreshPorts,
        handleConnect,
        handleSendSerial,
        handleUpload,
    };
}
