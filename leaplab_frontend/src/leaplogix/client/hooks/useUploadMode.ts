/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useRef, useCallback, useEffect } from "react"
import { getBoardConfig, getBoardNameById, createUploadFiles, formatPortLabel, isBoardUploadFile, sortUploadFiles } from "../utils/boardConfig"
import { isWebSerialSupported, listPorts as webListPorts, requestPort as webRequestPort, uploadToBoard, startWebSerialMonitor, stopWebSerialMonitor, sendWebSerial } from "../../../webflash"

interface BoardPort {
  path: string
  manufacturer?: string
}

interface UploadTerminalMessage {
  text: string
  type: string
  ts: Date
}

interface UseUploadModeProps {
  addLog: (message: string, type: string) => void
}

export function useUploadMode({ addLog }: UseUploadModeProps) {
  const [uploadView, setUploadView] = useState("project")
  const [selectedBoard, setSelectedBoard] = useState("arduino_uno")
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false)
  const [uploadProjectFiles, setUploadProjectFiles] = useState<Record<string, string>>(() => createUploadFiles("arduino_uno"))
  const [uploadActiveFile, setUploadActiveFile] = useState("main.py")
  const [uploadPanelTab, setUploadPanelTab] = useState("terminal")
  const [ports, setPorts] = useState<BoardPort[]>([])
  const [selectedPort, setSelectedPort] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isUploadingFirmware, setIsUploadingFirmware] = useState(false)
  const [showBoardCppMenu, setShowBoardCppMenu] = useState(false)
  const [uploadProgressMessage, setUploadProgressMessage] = useState("")
  const [baudRate, setBaudRate] = useState(115200)
  const [lineEnding, setLineEnding] = useState("")
  const [serialMessages, setSerialMessages] = useState<string[]>([])
  const [uploadTerminalOutput, setUploadTerminalOutput] = useState<UploadTerminalMessage[]>([
    { text: "Python upload mode ready. Switch between MicroPython and board firmware files.", type: "info", ts: new Date() },
  ])
  const [uploadLogMessages, setUploadLogMessages] = useState<string[]>([
    "Upload mode initialized",
  ])
  const boardCppMenuRef = useRef<HTMLDivElement | null>(null)

  const selectedBoardConfig = getBoardConfig(selectedBoard)
  const selectedBoardName = (getBoardNameById() as Record<string, string>)[selectedBoard] || selectedBoardConfig.runtimeLabel
  const activeBoardFile = selectedBoardConfig.fileName
  const protectedUploadFiles = new Set(["main.py", activeBoardFile])
  const visibleUploadFiles = uploadView === "board"
    ? sortUploadFiles(
        Object.keys(uploadProjectFiles).filter((file) => isBoardUploadFile(file, activeBoardFile)),
        activeBoardFile
      )
    : sortUploadFiles(
        Object.keys(uploadProjectFiles).filter((file) => !isBoardUploadFile(file, activeBoardFile)),
        "main.py"
      )

  const addUploadMessage = useCallback((text: string, type: string = "info") => {
    setUploadTerminalOutput((prev) => [...prev, { text, type, ts: new Date() }])
    setUploadLogMessages((prev) => [...prev, text])
  }, [])

  const refreshPorts = useCallback(async () => {
    if (!(window as any).electronAPI?.getPorts) {
      if (isWebSerialSupported()) {
        try {
          const nextPorts = await webListPorts()
          setPorts(nextPorts.map((p, i) => ({ path: p.path, manufacturer: p.manufacturer || `Web Serial port ${i + 1}` })))
          return
        } catch {
          addUploadMessage("Unable to scan Web Serial ports.", "error")
          return
        }
      }
      addUploadMessage("Serial support is unavailable in this renderer.", "warning")
      return
    }

    try {
      const nextPorts = await (window as any).electronAPI.getPorts()
      setPorts(nextPorts || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to scan serial ports."
      addUploadMessage(message, "error")
    }
  }, [addUploadMessage])

  const handleConnectToBoard = useCallback(async () => {
    if (!(window as any).electronAPI) {
      if (!isWebSerialSupported()) {
        addUploadMessage("Serial support is unavailable in this renderer.", "warning")
        return
      }

      if (isConnected) {
        await stopWebSerialMonitor()
        setIsConnected(false)
        addUploadMessage("Board disconnected from Web Serial.", "warning")
        return
      }

      try {
        await stopWebSerialMonitor()
        const picked = await webRequestPort()
        if (picked?.port) {
          setSelectedPort(picked.path)
          setPorts((prev) => {
            const next = prev.filter((p) => p.path !== picked.path)
            return [{ path: picked.path, manufacturer: picked.manufacturer || "Web Serial device" }, ...next]
          })
          setIsConnected(true)
          addUploadMessage("Board connected via Web Serial. Ready to upload.", "success")
          refreshPorts()
          startWebSerialMonitor(
            baudRate,
            (line) => setSerialMessages((prev) => [...prev.slice(-100), line]),
            (msg) => addUploadMessage(msg, msg.toLowerCase().includes("fail") ? "error" : "info")
          )
        } else {
          addUploadMessage("No board selected.", "warning")
        }
      } catch {
        addUploadMessage("Unable to connect via Web Serial.", "error")
      }
      return
    }

    if (isConnected) {
      const disconnectResult = await (window as any).electronAPI.disconnectPort()
      if (disconnectResult?.success) {
        setIsConnected(false)
        addUploadMessage(`Disconnected from ${selectedPort || "board"}.`, "warning")
      } else {
        addUploadMessage(disconnectResult?.error || "Unable to disconnect from the current board.", "error")
      }
      return
    }

    if (!selectedPort) {
      addUploadMessage("Select a COM port before connecting.", "warning")
      return
    }

    if (selectedPort === "BRIDGE_DETECTED") {
      addUploadMessage("A USB bridge was detected without a usable COM port. Install the required driver first.", "error")
      return
    }

    const connectResult = await (window as any).electronAPI.connectPort(selectedPort, baudRate, selectedBoard)
    if (connectResult?.success) {
      setIsConnected(true)
      addUploadMessage(`Connected to ${selectedPort}.`, "success")
    } else {
      addUploadMessage(connectResult?.error || "Unable to connect to the selected port.", "error")
    }
  }, [addUploadMessage, baudRate, isConnected, refreshPorts, selectedBoard, selectedPort, setSerialMessages])

  const handleSendSerial = useCallback(async (message: string) => {
    const electronAPI = (window as any).electronAPI
    try {
      if (electronAPI?.sendSerial) {
        await electronAPI.sendSerial(message)
        setSerialMessages((prev) => [...prev, `> ${message}`])
      } else if (isWebSerialSupported()) {
        const ok = await sendWebSerial(message)
        if (ok) {
          setSerialMessages((prev) => [...prev, `> ${message}`])
        } else {
          addUploadMessage("Failed to send — port is not open.", "error")
        }
      } else {
        addUploadMessage("Serial support is unavailable in this renderer.", "warning")
      }
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Unable to send serial data."
      addUploadMessage(nextMessage, "error")
    }
  }, [addUploadMessage, setSerialMessages])

  const handleUploadFirmware = useCallback(async () => {
    if (!(window as any).electronAPI?.uploadCode) {
      // ── Web Serial upload path (no Electron) ──
      if (!isWebSerialSupported()) {
        addUploadMessage("Upload requires LeapBlocks Desktop, or Chrome/Edge with Web Serial.", "warning")
        return
      }

      const boardCode = uploadProjectFiles[activeBoardFile] || ""
      if (!boardCode.trim()) {
        addUploadMessage(`No board firmware found in ${activeBoardFile}.`, "warning")
        return
      }

      setUploadPanelTab("terminal")
      setIsUploadingFirmware(true)
      setUploadProgressMessage(`Preparing ${activeBoardFile}...`)
      addUploadMessage(`Uploading ${activeBoardFile} to ${selectedBoardName} via Web Serial.`, "info")

      try {
        await stopWebSerialMonitor()
        const result = await uploadToBoard({
          code: boardCode,
          fqbn: selectedBoardConfig.fqbn,
          onProgress: (progress, message) => {
            const nextMessage = `${progress}%: ${message}`
            setUploadProgressMessage(nextMessage)
            addUploadMessage(nextMessage, "info")
          },
          onLog: (message) => addUploadMessage(message, "info"),
        })

        if (result?.success) {
          setUploadProgressMessage("Upload complete.")
          addUploadMessage(`Upload complete for ${selectedBoardName}.`, "success")
        } else {
          const message = result?.error || "Upload failed."
          setUploadProgressMessage(message)
          addUploadMessage(message, "error")
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected upload failure."
        setUploadProgressMessage(message)
        addUploadMessage(message, "error")
      } finally {
        setIsUploadingFirmware(false)
        startWebSerialMonitor(
          baudRate,
          (line) => setSerialMessages((prev) => [...prev.slice(-100), line]),
          (msg) => addUploadMessage(msg, msg.toLowerCase().includes("fail") ? "error" : "info")
        )
      }
      return
    }

    if (!selectedPort) {
      addUploadMessage("Select a COM port before uploading.", "warning")
      return
    }

    const boardCode = uploadProjectFiles[activeBoardFile] || ""
    if (!boardCode.trim()) {
      addUploadMessage(`No board firmware found in ${activeBoardFile}.`, "warning")
      return
    }

    setUploadPanelTab("terminal")
    setIsUploadingFirmware(true)
    setUploadProgressMessage(`Preparing ${activeBoardFile}...`)
    addUploadMessage(`Uploading ${activeBoardFile} to ${selectedBoardName} on ${selectedPort}.`, "info")

    const shouldReconnect = isConnected

    try {
      if (shouldReconnect) {
        await (window as any).electronAPI.disconnectPort()
        setIsConnected(false)
      }

      const result = await (window as any).electronAPI.uploadCode(
        boardCode,
        selectedPort,
        selectedBoardConfig.fqbn
      )

      if (result?.success) {
        setUploadProgressMessage("Upload complete.")
        addUploadMessage(`Upload complete for ${selectedBoardName}.`, "success")
      } else {
        const message = result?.error || "Upload failed."
        setUploadProgressMessage(message)
        addUploadMessage(message, "error")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected upload failure."
      setUploadProgressMessage(message)
      addUploadMessage(message, "error")
    } finally {
      if (shouldReconnect && selectedPort) {
        const reconnectResult = await (window as any).electronAPI.connectPort(selectedPort, baudRate, selectedBoard)
        if (reconnectResult?.success) {
          setIsConnected(true)
          addUploadMessage(`Reconnected to ${selectedPort}.`, "success")
        }
      }
      setIsUploadingFirmware(false)
    }
  }, [activeBoardFile, addUploadMessage, baudRate, isConnected, selectedBoard, selectedBoardConfig.fqbn, selectedBoardName, selectedPort, setSerialMessages, uploadProjectFiles])

  useEffect(() => {
    if (!(window as any).electronAPI) return undefined

    const cleanups: (() => void)[] = [
      (window as any).electronAPI.onSerialData((data: string) => {
        setSerialMessages((prev) => [...prev, data])
      }),
      (window as any).electronAPI.onConnectionChange((connected: boolean) => {
        setIsConnected(connected)
        addUploadMessage(connected ? "Board connection opened." : "Board connection closed.", connected ? "success" : "warning")
      }),
      (window as any).electronAPI.onUploadProgress((progress: number, message: string) => {
        const nextMessage = `${progress}%: ${message}`
        setUploadProgressMessage(nextMessage)
        setUploadTerminalOutput((prev) => {
          if (prev[prev.length - 1]?.text === nextMessage) {
            return prev
          }
          return [...prev, { text: nextMessage, type: "info", ts: new Date() }]
        })
      }),
    ]

    return () => {
      cleanups.forEach(fn => fn?.())
    }
  }, [addUploadMessage])

  useEffect(() => {
    refreshPorts()
    const timer = window.setInterval(() => {
      if (!selectedPort && !isConnected) {
        refreshPorts()
      }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [selectedPort, isConnected, refreshPorts])

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
  }
}

export default useUploadMode
