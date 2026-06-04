/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { getBoardConfig, getBoardNameById, createUploadFiles, formatPortLabel, isBoardUploadFile, sortUploadFiles } from "../utils/boardConfig";

export function useUploadMode({ addLog }) {
    const [uploadView, setUploadView] = useState("project");
    const [selectedBoard, setSelectedBoard] = useState("arduino_uno");
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [uploadProjectFiles, setUploadProjectFiles] = useState(() => createUploadFiles("arduino_uno"));
    const [uploadActiveFile, setUploadActiveFile] = useState("main.py");
    const [uploadPanelTab, setUploadPanelTab] = useState("terminal");
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isUploadingFirmware, setIsUploadingFirmware] = useState(false);
    const [showBoardCppMenu, setShowBoardCppMenu] = useState(false);
    const [uploadProgressMessage, setUploadProgressMessage] = useState("");
    const [baudRate, setBaudRate] = useState(115200);
    const [lineEnding, setLineEnding] = useState("");
    const [serialMessages, setSerialMessages] = useState([]);
    const [uploadTerminalOutput, setUploadTerminalOutput] = useState([
        { text: "Python upload mode ready. Switch between MicroPython and board firmware files.", type: "info", ts: new Date() },
    ]);
    const [uploadLogMessages, setUploadLogMessages] = useState([
        "Upload mode initialized",
    ]);
    const boardCppMenuRef = useRef(null);

    const selectedBoardConfig = getBoardConfig(selectedBoard);
    const selectedBoardName = getBoardNameById()[selectedBoard] || selectedBoardConfig.runtimeLabel;
    const activeBoardFile = selectedBoardConfig.fileName;
    const protectedUploadFiles = new Set(["main.py", activeBoardFile]);
    const visibleUploadFiles = uploadView === "board"
        ? sortUploadFiles(
            Object.keys(uploadProjectFiles).filter((file) => isBoardUploadFile(file, activeBoardFile)),
            activeBoardFile
        )
        : sortUploadFiles(
            Object.keys(uploadProjectFiles).filter((file) => !isBoardUploadFile(file, activeBoardFile)),
            "main.py"
        );

    const addUploadMessage = useCallback((text, type = "info") => {
        setUploadTerminalOutput((prev) => [...prev, { text, type, ts: new Date() }]);
        setUploadLogMessages((prev) => [...prev, text]);
    }, []);

    const refreshPorts = useCallback(async () => {
        if (!window.electronAPI?.getPorts) {
            addUploadMessage("Serial support is unavailable in this renderer.", "warning");
            return;
        }

        try {
            const nextPorts = await window.electronAPI.getPorts();
            setPorts(nextPorts || []);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to scan serial ports.";
            addUploadMessage(message, "error");
        }
    }, [addUploadMessage]);

    const handleConnectToBoard = useCallback(async () => {
        if (!window.electronAPI) {
            addUploadMessage("Serial support is unavailable in this renderer.", "warning");
            return;
        }

        if (isConnected) {
            const disconnectResult = await window.electronAPI.disconnectPort();
            if (disconnectResult?.success) {
                setIsConnected(false);
                addUploadMessage(`Disconnected from ${selectedPort || "board"}.`, "warning");
            } else {
                addUploadMessage(disconnectResult?.error || "Unable to disconnect from the current board.", "error");
            }
            return;
        }

        if (!selectedPort) {
            addUploadMessage("Select a COM port before connecting.", "warning");
            return;
        }

        if (selectedPort === "BRIDGE_DETECTED") {
            addUploadMessage("A USB bridge was detected without a usable COM port. Install the required driver first.", "error");
            return;
        }

        const connectResult = await window.electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
        if (connectResult?.success) {
            setIsConnected(true);
            addUploadMessage(`Connected to ${selectedPort}.`, "success");
        } else {
            addUploadMessage(connectResult?.error || "Unable to connect to the selected port.", "error");
        }
    }, [addUploadMessage, baudRate, isConnected, selectedBoard, selectedPort]);

    const handleSendSerial = useCallback(async (message) => {
        if (!window.electronAPI?.sendSerial) {
            addUploadMessage("Serial support is unavailable in this renderer.", "warning");
            return;
        }

        try {
            await window.electronAPI.sendSerial(message);
            setSerialMessages((prev) => [...prev, `> ${message}`]);
        } catch (error) {
            const nextMessage = error instanceof Error ? error.message : "Unable to send serial data.";
            addUploadMessage(nextMessage, "error");
        }
    }, [addUploadMessage]);

    const handleUploadFirmware = useCallback(async () => {
        if (!window.electronAPI?.uploadCode) {
            addUploadMessage("Upload support is unavailable in this renderer.", "warning");
            return;
        }

        if (!selectedPort) {
            addUploadMessage("Select a COM port before uploading.", "warning");
            return;
        }

        const boardCode = uploadProjectFiles[activeBoardFile] || "";
        if (!boardCode.trim()) {
            addUploadMessage(`No board firmware found in ${activeBoardFile}.`, "warning");
            return;
        }

        setUploadPanelTab("terminal");
        setIsUploadingFirmware(true);
        setUploadProgressMessage(`Preparing ${activeBoardFile}...`);
        addUploadMessage(`Uploading ${activeBoardFile} to ${selectedBoardName} on ${selectedPort}.`, "info");

        const shouldReconnect = isConnected;

        try {
            if (shouldReconnect) {
                await window.electronAPI.disconnectPort();
                setIsConnected(false);
            }

            const result = await window.electronAPI.uploadCode(
                boardCode,
                selectedPort,
                selectedBoardConfig.fqbn
            );

            if (result?.success) {
                setUploadProgressMessage("Upload complete.");
                addUploadMessage(`Upload complete for ${selectedBoardName}.`, "success");
            } else {
                const message = result?.error || "Upload failed.";
                setUploadProgressMessage(message);
                addUploadMessage(message, "error");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unexpected upload failure.";
            setUploadProgressMessage(message);
            addUploadMessage(message, "error");
        } finally {
            if (shouldReconnect && selectedPort) {
                const reconnectResult = await window.electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
                if (reconnectResult?.success) {
                    setIsConnected(true);
                    addUploadMessage(`Reconnected to ${selectedPort}.`, "success");
                }
            }
            setIsUploadingFirmware(false);
        }
    }, [activeBoardFile, addUploadMessage, baudRate, isConnected, selectedBoard, selectedBoardConfig.fqbn, selectedBoardName, selectedPort, uploadProjectFiles]);

    // Serial data listeners
    useEffect(() => {
        if (!window.electronAPI) return undefined;

        const cleanups = [
            window.electronAPI.onSerialData((data) => {
                setSerialMessages((prev) => [...prev, data]);
            }),
            window.electronAPI.onConnectionChange((connected) => {
                setIsConnected(connected);
                addUploadMessage(connected ? "Board connection opened." : "Board connection closed.", connected ? "success" : "warning");
            }),
            window.electronAPI.onUploadProgress((progress, message) => {
                const nextMessage = `${progress}%: ${message}`;
                setUploadProgressMessage(nextMessage);
                setUploadTerminalOutput((prev) => {
                    if (prev[prev.length - 1]?.text === nextMessage) {
                        return prev;
                    }
                    return [...prev, { text: nextMessage, type: "info", ts: new Date() }];
                });
            }),
        ];

        return () => {
            cleanups.forEach(fn => fn());
        };
    }, [addUploadMessage]);

    // Auto-refresh ports
    useEffect(() => {
        refreshPorts();
        const timer = window.setInterval(() => {
            if (!selectedPort && !isConnected) {
                refreshPorts();
            }
        }, 5000);
        return () => window.clearInterval(timer);
    }, [selectedPort, isConnected, refreshPorts]);

    return {
        uploadView,
        setUploadView,
        selectedBoard,
        setSelectedBoard,
        isBoardModalOpen,
        setIsBoardModalOpen,
        uploadProjectFiles,
        setUploadProjectFiles,
        uploadActiveFile,
        setUploadActiveFile,
        uploadPanelTab,
        setUploadPanelTab,
        ports,
        selectedPort,
        setSelectedPort,
        isConnected,
        setIsConnected,
        isUploadingFirmware,
        showBoardCppMenu,
        setShowBoardCppMenu,
        uploadProgressMessage,
        baudRate,
        setBaudRate,
        lineEnding,
        setLineEnding,
        serialMessages,
        setSerialMessages,
        uploadTerminalOutput,
        uploadLogMessages,
        boardCppMenuRef,
        selectedBoardConfig,
        selectedBoardName,
        activeBoardFile,
        protectedUploadFiles,
        visibleUploadFiles,
        addUploadMessage,
        refreshPorts,
        handleConnectToBoard,
        handleSendSerial,
        handleUploadFirmware,
    };
}

export default useUploadMode;
