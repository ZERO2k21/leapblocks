/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useCallback } from "react"
import { getPipPackages, type PipPackage } from "../data/pipPackages"

interface UsePipManagerProps {
  addLog: (message: string, type: string) => void
  setActivePanel: React.Dispatch<React.SetStateAction<string>>
}

const IMPORT_EXAMPLES: Record<string, string> = {
  "opencv-python": "import cv2  # OpenCV",
  "mediapipe": "import mediapipe as mp  # MediaPipe",
  "numpy": "import numpy as np  # NumPy",
  "pandas": "import pandas as pd  # Pandas",
  "pillow": "from PIL import Image  # Pillow",
  "tensorflow": "import tensorflow as tf  # TensorFlow",
  "torch": "import torch  # PyTorch",
  "scikit-learn": "from sklearn import *  # Scikit-learn",
  "matplotlib": "import matplotlib.pyplot as plt  # Matplotlib",
  "speechrecognition": "import speech_recognition as sr  # Speech Recognition",
  "pyttsx3": "import pyttsx3  # Text-to-Speech",
  "requests": "import requests  # HTTP requests",
  "flask": "from flask import Flask  # Flask web framework",
  "pyserial": "import serial  # Serial communication",
  "pygame": "import pygame  # Pygame",
}

export function usePipManager({ addLog, setActivePanel }: UsePipManagerProps) {
  const [packages, setPackages] = useState<PipPackage[]>(() => getPipPackages())
  const [pipFilter, setPipFilter] = useState("")

  const handleInstall = useCallback((pkgName: string) => {
    const pkg = getPipPackages().find(p => p.name === pkgName)
    if (!pkg) return

    setPackages(prev => prev.map(p => p.name === pkgName ? { ...p, installed: true } : p))

    if (pkg.builtin) {
      addLog(`✓ ${pkgName} enabled (built-in module)`, "success")
      addLog(`  → Ready to import in your Python scripts`, "info")
    } else {
      addLog(`⏳ Installing ${pkgName} via pip...`, "info")
      setActivePanel("terminal")
      if ((window as any).electronAPI?.isElectron) {
        ;(window as any).electronAPI.pythonShellRun(`python -m pip install ${pkgName}`)
      } else {
        setTimeout(() => {
          addLog(`✓ ${pkgName} registered (web mode)`, "success")
          addLog(`  ⚠ Browser mode uses Skulpt — only built-in modules run natively.`, "warning")
          addLog(`  → For full library support, use the LeapLab desktop app.`, "info")
        }, 600)
      }

      if (IMPORT_EXAMPLES[pkgName]) {
        addLog(`  → Use: ${IMPORT_EXAMPLES[pkgName]}`, "info")
      }

      addLog(`  ⚠ Browser mode uses Skulpt — only built-in modules run natively.`, "warning")
      if (!pkg.builtin) {
        addLog(`  ❗ ${pkgName} cannot actually be imported in browser mode due to missing native Python extension support. Use desktop Python mode for full support.`, "warning")
      }

      if (pkg.category === "computer-vision") {
        addLog(`  → Tip: Requires camera access for real-time processing`, "info")
      } else if (pkg.category === "speech") {
        addLog(`  → Tip: Requires microphone access for audio input`, "info")
      } else if (pkg.category === "iot") {
        addLog(`  → Tip: Connect your hardware device before use`, "info")
      }
    }
  }, [addLog, setActivePanel])

  return {
    packages,
    setPackages,
    pipFilter,
    setPipFilter,
    handleInstall,
  }
}

export default usePipManager
