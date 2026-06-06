/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

let _PIP_PACKAGES = null;

export const getPipPackages = () => {
    if (!_PIP_PACKAGES) {
        _PIP_PACKAGES = [
            // ── Built-in Standard Library Modules ──
            { name: "math", desc: "Mathematical functions", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "random", desc: "Random number generation", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "time", desc: "Time access & conversions", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "json", desc: "JSON encoder/decoder", installed: true, builtin: true, category: "core", version: "3.10", tags: ["data"] },
            { name: "re", desc: "Regular expressions", installed: true, builtin: true, category: "core", version: "3.10", tags: ["text"] },
            { name: "sys", desc: "System-specific parameters", installed: true, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "os", desc: "Operating system interface", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "datetime", desc: "Date and time classes", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "collections", desc: "Container data types (deque, Counter, etc.)", installed: false, builtin: true, category: "core", version: "3.10", tags: ["data"] },
            { name: "itertools", desc: "Iterator building blocks", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "functools", desc: "Higher-order functions and operations", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "string", desc: "String constants and classes", installed: false, builtin: true, category: "core", version: "3.10", tags: ["text"] },
            { name: "operator", desc: "Standard operators as functions", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "copy", desc: "Shallow and deep copy operations", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "typing", desc: "Type hints support", installed: false, builtin: true, category: "core", version: "3.10", tags: ["core"] },
            { name: "unittest", desc: "Unit testing framework", installed: false, builtin: true, category: "core", version: "3.10", tags: ["testing"] },
            { name: "csv", desc: "CSV file reading and writing", installed: false, builtin: true, category: "core", version: "3.10", tags: ["data"] },
            { name: "base64", desc: "Base64 encoding and decoding", installed: false, builtin: true, category: "core", version: "3.10", tags: ["encoding"] },
            { name: "hashlib", desc: "Secure hash and message digest", installed: false, builtin: true, category: "core", version: "3.10", tags: ["security"] },
            { name: "logging", desc: "Flexible logging facility", installed: false, builtin: true, category: "core", version: "3.10", tags: ["debug"] },
            { name: "argparse", desc: "Command-line argument parsing", installed: false, builtin: true, category: "core", version: "3.10", tags: ["cli"] },
            { name: "pathlib", desc: "Object-oriented filesystem paths", installed: false, builtin: true, category: "core", version: "3.10", tags: ["files"] },

            // ── Computer Vision & Image Processing ──
            { name: "opencv-python", desc: "OpenCV - Computer vision and image processing", installed: false, builtin: false, category: "computer-vision", version: "4.8.0", tags: ["vision", "image", "video"] },
            { name: "mediapipe", desc: "MediaPipe - ML solutions for vision, audio, and text", installed: false, builtin: false, category: "computer-vision", version: "0.10.8", tags: ["vision", "pose", "hands", "face", "gesture"] },
            { name: "pillow", desc: "PIL Fork - Image processing library", installed: false, builtin: false, category: "computer-vision", version: "10.1.0", tags: ["image", "processing"] },
            { name: "scikit-image", desc: "Image processing algorithms", installed: false, builtin: false, category: "computer-vision", version: "0.22.0", tags: ["vision", "processing"] },
            { name: "imageio", desc: "Image reading and writing library", installed: false, builtin: false, category: "computer-vision", version: "2.31.0", tags: ["image", "video"] },

            // ── Machine Learning & AI ──
            { name: "tensorflow", desc: "TensorFlow - Deep learning framework", installed: false, builtin: false, category: "machine-learning", version: "2.15.0", tags: ["ml", "deep-learning", "neural-networks"] },
            { name: "torch", desc: "PyTorch - Deep learning framework", installed: false, builtin: false, category: "machine-learning", version: "2.1.0", tags: ["ml", "deep-learning", "neural-networks"] },
            { name: "scikit-learn", desc: "Scikit-learn - Machine learning library", installed: false, builtin: false, category: "machine-learning", version: "1.3.2", tags: ["ml", "classification", "regression"] },
            { name: "numpy", desc: "NumPy - Numerical computing library", installed: false, builtin: false, category: "machine-learning", version: "1.26.2", tags: ["math", "arrays", "numerical"] },
            { name: "pandas", desc: "Pandas - Data analysis and manipulation", installed: false, builtin: false, category: "machine-learning", version: "2.1.4", tags: ["data", "analysis", "dataframe"] },
            { name: "matplotlib", desc: "Matplotlib - Plotting library", installed: false, builtin: false, category: "machine-learning", version: "3.8.2", tags: ["visualization", "plotting", "graphs"] },
            { name: "opencv-contrib-python", desc: "OpenCV with extra modules (SIFT, SURF, etc.)", installed: false, builtin: false, category: "computer-vision", version: "4.8.0", tags: ["vision", "advanced"] },

            // ── Speech & Audio ──
            { name: "speechrecognition", desc: "Speech Recognition - Convert speech to text", installed: false, builtin: false, category: "speech", version: "3.10.1", tags: ["speech", "audio", "stt"] },
            { name: "pyttsx3", desc: "pyttsx3 - Text-to-speech (offline)", installed: false, builtin: false, category: "speech", version: "2.90", tags: ["speech", "tts", "voice"] },
            { name: "gTTS", desc: "Google Text-to-Speech", installed: false, builtin: false, category: "speech", version: "2.5.0", tags: ["speech", "tts", "google"] },
            { name: "pyaudio", desc: "PyAudio - Audio I/O library", installed: false, builtin: false, category: "speech", version: "0.2.13", tags: ["audio", "microphone"] },
            { name: "librosa", desc: "Librosa - Audio analysis library", installed: false, builtin: false, category: "speech", version: "0.10.1", tags: ["audio", "music", "analysis"] },
            { name: "sounddevice", desc: "SoundDevice - Audio playback and recording", installed: false, builtin: false, category: "speech", version: "0.4.6", tags: ["audio", "playback"] },
            { name: "whisper", desc: "OpenAI Whisper - Speech recognition model", installed: false, builtin: false, category: "speech", version: "1.1.10", tags: ["speech", "ai", "transcription"] },

            // ── IoT & Hardware ──
            { name: "pyserial", desc: "PySerial - Serial port communication", installed: false, builtin: false, category: "iot", version: "3.5", tags: ["serial", "arduino", "hardware"] },
            { name: "pyfirmata", desc: "PyFirmata - Arduino communication protocol", installed: false, builtin: false, category: "iot", version: "2.3.8", tags: ["arduino", "firmata"] },
            { name: "rpi.gpio", desc: "RPi.GPIO - Raspberry Pi GPIO control", installed: false, builtin: false, category: "iot", version: "0.7.1", tags: ["raspberry-pi", "gpio"] },
            { name: "adafruit-circuitpython", desc: "Adafruit CircuitPython libraries", installed: false, builtin: false, category: "iot", version: "8.0.0", tags: ["adafruit", "circuitpython", "sensors"] },
            { name: "pymata4", desc: "PyMata4 - Arduino Firmata interface", installed: false, builtin: false, category: "iot", version: "3.04", tags: ["arduino", "iot"] },
            { name: "esptool", desc: "ESP Tool - ESP8266/ESP32 flash utility", installed: false, builtin: false, category: "iot", version: "4.7.0", tags: ["esp32", "esp8266", "flash"] },
            { name: "mpy-cross", desc: "MicroPython cross-compiler", installed: false, builtin: false, category: "iot", version: "1.21.0", tags: ["micropython", "embedded"] },
            { name: "smbus2", desc: "SMBus2 - I2C communication library", installed: false, builtin: false, category: "iot", version: "0.4.3", tags: ["i2c", "sensors", "hardware"] },

            // ── Robotics & Control ──
            { name: "roboticstoolbox-python", desc: "Robotics Toolbox - Robot modeling and control", installed: false, builtin: false, category: "hardware", version: "1.0.3", tags: ["robotics", "kinematics", "control"] },
            { name: "pynput", desc: "PyNput - Keyboard and mouse control", installed: false, builtin: false, category: "hardware", version: "1.7.6", tags: ["input", "automation", "control"] },
            { name: "pyvjoy", desc: "PyVJoy - Virtual joystick control", installed: false, builtin: false, category: "hardware", version: "1.0.5", tags: ["joystick", "gamepad", "control"] },
            { name: "gpiozero", desc: "GPIO Zero - GPIO device interface", installed: false, builtin: false, category: "hardware", version: "2.0", tags: ["gpio", "raspberry-pi", "sensors"] },

            // ── Networking & Communication ──
            { name: "requests", desc: "HTTP library for humans", installed: false, builtin: false, category: "utility", version: "2.31.0", tags: ["http", "api", "web"] },
            { name: "flask", desc: "Flask - Lightweight web framework", installed: false, builtin: false, category: "utility", version: "3.0.0", tags: ["web", "server", "api"] },
            { name: "websocket-client", desc: "WebSocket client library", installed: false, builtin: false, category: "utility", version: "1.7.0", tags: ["websocket", "real-time"] },
            { name: "paho-mqtt", desc: "Paho MQTT - IoT messaging protocol", installed: false, builtin: false, category: "iot", version: "1.6.1", tags: ["mqtt", "iot", "messaging"] },
            { name: "paramiko", desc: "Paramiko - SSH2 protocol library", installed: false, builtin: false, category: "utility", version: "3.4.0", tags: ["ssh", "remote", "networking"] },

            // ── Data Processing ──
            { name: "openpyxl", desc: "OpenPyXL - Excel file manipulation", installed: false, builtin: false, category: "utility", version: "3.1.2", tags: ["excel", "spreadsheet"] },
            { name: "pyyaml", desc: "PyYAML - YAML parser and emitter", installed: false, builtin: false, category: "utility", version: "6.0.1", tags: ["yaml", "config"] },
            { name: "lxml", desc: "lxml - XML and HTML processing", installed: false, builtin: false, category: "utility", version: "4.9.4", tags: ["xml", "html", "parsing"] },
            { name: "beautifulsoup4", desc: "Beautiful Soup - Web scraping library", installed: false, builtin: false, category: "utility", version: "4.12.2", tags: ["scraping", "html", "parsing"] },

            // ── GUI & Visualization ──
            { name: "tkinter", desc: "Tkinter - Standard GUI library", installed: false, builtin: true, category: "utility", version: "3.10", tags: ["gui", "desktop"] },
            { name: "pygame", desc: "Pygame - Game development library", installed: false, builtin: false, category: "utility", version: "2.5.2", tags: ["game", "graphics", "multimedia"] },
            { name: "plotly", desc: "Plotly - Interactive visualization", installed: false, builtin: false, category: "utility", version: "5.18.0", tags: ["visualization", "interactive", "graphs"] },
            { name: "seaborn", desc: "Seaborn - Statistical visualization", installed: false, builtin: false, category: "utility", version: "0.13.0", tags: ["visualization", "statistics"] },

            // ── Utilities ──
            { name: "python-dotenv", desc: "Environment variable management", installed: false, builtin: false, category: "utility", version: "1.0.0", tags: ["config", "env"] },
            { name: "schedule", desc: "Job scheduling library", installed: false, builtin: false, category: "utility", version: "1.2.1", tags: ["scheduling", "automation"] },
            { name: "watchdog", desc: "Filesystem events monitoring", installed: false, builtin: false, category: "utility", version: "3.0.0", tags: ["files", "monitoring"] },
            { name: "pillow-simd", desc: "Pillow with SIMD optimizations", installed: false, builtin: false, category: "computer-vision", version: "10.2.0", tags: ["image", "fast"] },
        ];
    }
    return _PIP_PACKAGES;
};

export default getPipPackages;
