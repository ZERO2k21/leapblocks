import { useCallback, useEffect } from 'react';
import type React from 'react';
import { log } from '../utils/log';

export function useHardwareControls(
    editorMode: string,
    selectedPort: string,
    isConnected: boolean,
    baudRate: number,
    selectedBoard: string,
    generatedCode: string,
    isUploading: boolean,
    setPorts: React.Dispatch<React.SetStateAction<any[]>>,
    setIsConnected: React.Dispatch<React.SetStateAction<boolean>>,
    setSerialMessages: React.Dispatch<React.SetStateAction<string[]>>,
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
    setUploadProgress: React.Dispatch<React.SetStateAction<string>>,
    setActiveTab: (tab: 'log' | 'serial') => void,
    addLog: (msg: string) => void,
) {

    const refreshPorts = useCallback(async () => {
        try {
            let portList: any[] = [];
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.getPorts) {
                portList = await electronAPI.getPorts();
                setPorts(portList);
            } else {
                portList = [{ path: 'WEB_DEMO', manufacturer: 'LeapBlocks Web' }];
                setPorts(portList);
            }
        } catch (e) {
            addLog('Failed to scan ports');
        }
    }, [addLog, setPorts]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (editorMode === 'upload' && !selectedPort && !isConnected) {
            timer = setInterval(() => {
                const electronAPI = (window as any).electronAPI;
                if (electronAPI?.getPorts) {
                    electronAPI.getPorts().then((portList: any[]) => {
                        setPorts(portList);
                    }).catch(() => {});
                }
            }, 5000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [editorMode, selectedPort, isConnected, setPorts]);

    const handleConnect = useCallback(async () => {
        if (!selectedPort) {
            addLog('Select a port first');
            return;
        }

        if (selectedPort === 'BRIDGE_DETECTED') {
            addLog('⚠ Device detected but no COM port assigned. Please install drivers or try a different USB cable.');
            return;
        }

        if (isConnected) {
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.disconnectPort) {
                const result = await electronAPI.disconnectPort();
                if (result.success) {
                    setIsConnected(false);
                    addLog(`Disconnected from ${selectedPort}`);
                }
            } else {
                setIsConnected(false);
                addLog(`Disconnected from ${selectedPort}`);
            }
        }

        try {
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.connectPort) {
                const result = await electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
                if (result.success) {
                    setIsConnected(true);
                    addLog(`Connected to ${selectedPort} at ${baudRate} baud`);
                } else {
                    addLog(`Connection failed: ${result.error}`);
                }
            } else if (selectedPort === 'WEB_DEMO') {
                setIsConnected(true);
                addLog('Connected to LeapBlocks Web (Simulation Mode)');
            } else {
                addLog('Serial connection requires LeapBlocks Desktop');
            }
        } catch (err) {
            addLog('Connection error occurred');
            console.error(err);
        }
    }, [selectedPort, isConnected, baudRate, selectedBoard, addLog, setIsConnected]);

    useEffect(() => {
        if (isConnected && selectedPort) {
            log.app(`Baud rate changed to ${baudRate}, reconnecting...`);
            const timer = setTimeout(() => {
                handleConnect();
                setTimeout(() => {
                    handleConnect();
                }, 500);
            }, 100);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baudRate]);

    const handleSendSerial = useCallback(async (data: string) => {
        if (!isConnected) return;
        try {
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.sendSerial) {
                await electronAPI.sendSerial(data);
                setSerialMessages(prev => [...prev.slice(-100), `> ${data.trim()}`]);
            } else if (selectedPort === 'WEB_DEMO') {
                setSerialMessages(prev => [...prev.slice(-100), `> ${data.trim()}`]);
            }
        } catch (e) {
            addLog('Failed to send');
        }
    }, [isConnected, selectedPort, addLog, setSerialMessages]);

    const handleUpload = useCallback(async () => {
        if (!generatedCode || isUploading) return;

        if (!selectedPort) {
            addLog('No port selected!');
            alert('⚠️ No port selected!\n\nPlease connect your board and select a COM port.');
            return;
        }

        const electronAPI = (window as any).electronAPI;
        if (isConnected) {
            addLog('Disconnecting serial for upload...');
            await window.electronAPI.disconnectPort();
            setIsConnected(false);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        setIsUploading(true);
        setUploadProgress('Uploading...');
        addLog('Starting upload...');

        const fqbnMap: Record<string, string> = {
            'arduino_uno': 'arduino:avr:uno',
            'arduino_mega': 'arduino:avr:mega',
            'arduino_nano': 'arduino:avr:nano',
            'esp32': 'esp32:esp32:esp32c3',
        };
        const fqbn = fqbnMap[selectedBoard] || 'arduino:avr:uno';

        try {
            const result = await window.electronAPI.uploadCode(generatedCode, selectedPort, fqbn);

            if (result.success) {
                addLog('Upload complete!');
                setUploadProgress('Upload complete!');

                if (selectedPort) {
                    addLog('Connecting serial monitor...');
                    setActiveTab('serial');
                    setTimeout(async () => {
                        try {
                            const reconnectResult = await window.electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
                            if (reconnectResult.success) {
                                setIsConnected(true);
                                addLog('Serial monitor connected — showing live data');
                            }
                        } catch (reconnectErr) {
                            console.error('Auto-reconnect failed:', reconnectErr);
                        }
                        setIsUploading(false);
                    }, 2000);
                } else {
                    setIsUploading(false);
                }
            } else {
                let errorMsg = result.error || 'Unknown error occurred';
                if (errorMsg.includes('busy') || errorMsg.includes('Access is denied')) {
                    errorMsg += "\nTIP: Close any other serial monitors or wait 2 seconds and try again.";
                }
                addLog(`Upload failed: ${errorMsg}`);
                setUploadProgress(`Failed: ${errorMsg}`);
                setIsUploading(false);
            }
        } catch (e) {
            addLog('Upload error');
            setUploadProgress('Upload error');
            setIsUploading(false);
        }
    }, [generatedCode, isUploading, addLog, selectedPort, selectedBoard, isConnected, baudRate, setIsConnected, setIsUploading, setUploadProgress, setActiveTab]);

    return { refreshPorts, handleConnect, handleSendSerial, handleUpload };
}
