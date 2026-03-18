import { useState } from "react";

const sections = [
  {
    id: "topbar",
    label: "① Top Menu Bar",
    color: "#6c2eb9",
    icon: "🟣",
    items: [
      { name: "File", desc: "New, Open, Save, Export projects" },
      { name: "Edit", desc: "Undo, Redo, Cut, Copy, Paste code" },
      { name: "View", desc: "Toggle panels, zoom, and layout options" },
      { name: "Run", desc: "Execute scripts or debug your program" },
      { name: "Help", desc: "Access documentation and this guide" },
    ],
  },
  {
    id: "modetoggle",
    label: "② Mode Toggle (Stage / Upload)",
    color: "#2563eb",
    icon: "🔵",
    items: [
      { name: "Stage Mode", desc: "Run code live — sprites respond in real time on screen" },
      { name: "Upload Mode", desc: "Compile & flash code to a physical hardware board (Arduino/ESP32)" },
    ],
  },
  {
    id: "tabs",
    label: "③ Tab Bar — Activity Panels",
    color: "#059669",
    icon: "🟢",
    items: [
      { name: "Files (📁)", desc: "Browse and manage project .py files" },
      { name: "Search (🔍)", desc: "Search across all files in the project" },
      { name: "Debug (🐛)", desc: "Step through code, watch variables, view call stack" },
      { name: "Packages (📦)", desc: "PIP Manager — install Python packages from Skulpt stdlib" },
    ],
  },
  {
    id: "editor",
    label: "④ Code Editor",
    color: "#0891b2",
    icon: "💻",
    items: [
      { name: "Syntax Highlighting", desc: "Color-coded keywords, strings, and functions for readability" },
      { name: "Autocomplete", desc: "Suggests Sprite methods and Python builtins as you type" },
      { name: "Line Numbers", desc: "Auto-numbered lines for easy error reference" },
      { name: "Folding", desc: "Collapse/expand code blocks (functions, loops)" },
      { name: "Status bar", desc: "Shows Ln/Col cursor position and running state at the bottom" },
      { name: "Multiple Tabs", desc: "Switch between project files using the file tabs at the top of the editor" },
    ],
  },
  {
    id: "projectfiles",
    label: "⑤ Project Files Panel",
    color: "#7c3aed",
    icon: "📁",
    items: [
      { name: "main.py ✓", desc: "Default entry point — Python script that runs when you click Run" },
      { name: "utils.py", desc: "Additional file for helper functions and utilities" },
      { name: "+ New File button", desc: "Add a new .py file to the project" },
      { name: "× Delete file", desc: "Remove a file from the project (hover to reveal)" },
    ],
  },
  {
    id: "stage",
    label: "⑥ Stage & Sprite Panel",
    color: "#dc2626",
    icon: "🎭",
    items: [
      { name: "Stage canvas", desc: "Live preview — sprites move, animate, and respond to Python code" },
      { name: "Grid overlay", desc: "Semi-transparent reference grid to help position sprites" },
      { name: "Axes (center lines)", desc: "Horizontal and vertical lines showing x=0, y=0 origin" },
      { name: "Show / Hide (👁)", desc: "Toggle sprite visibility using the eye icon in properties" },
      { name: "Size: 100", desc: "Sprite scale — 100 = original, 200 = double size" },
      { name: "Direction: 90", desc: "Angle the sprite faces (90 = right, 0 = up, 180 = down)" },
      { name: "Reset Stage (↺)", desc: "Reset all sprites to their default position and state" },
    ],
  },
  {
    id: "bottombar",
    label: "⑦ Run Controls",
    color: "#16a34a",
    icon: "▶️",
    items: [
      { name: "▶ Run (green)", desc: "Execute the currently open .py file" },
      { name: "■ Stop (red)", desc: "Immediately halt execution of all running scripts" },
      { name: "Keyboard: Enter", desc: "Press Enter in the REPL input to run inline commands" },
    ],
  },
  {
    id: "terminal",
    label: "⑧ Terminal & REPL",
    color: "#4b5563",
    icon: "🖥️",
    items: [
      { name: "Terminal tab ✓", desc: "Shows print() output, errors, and program results when you Run" },
      { name: "REPL tab ⚡", desc: "Interactive console — type Python commands and see instant output, supports history with ↑/↓" },
      { name: ">>> prompt", desc: "Type expressions like 2+2, print('hello'), or Sprite calls" },
      { name: "🗑 Clear button", desc: "Wipe terminal output to start fresh" },
      { name: "Error display", desc: "Python errors show in red with the error type and message" },
    ],
  },
  {
    id: "pip",
    label: "⑨ PIP Package Manager",
    color: "#9d174d",
    icon: "📦",
    items: [
      { name: "Search bar", desc: "Filter packages by name or description" },
      { name: "● READY", desc: "Package is installed and available to import" },
      { name: "INSTALL button", desc: "Click to install the package for your project" },
      { name: "Built-in modules", desc: "math, random, time, json, re, sys are pre-available" },
      { name: "Standard Library", desc: "datetime, collections, itertools, csv, typing, unittest" },
      { name: "Computer Vision", desc: "OpenCV, MediaPipe, Pillow for image/video processing" },
      { name: "Machine Learning", desc: "TensorFlow, PyTorch, scikit-learn, NumPy, Pandas" },
      { name: "Speech & Audio", desc: "SpeechRecognition, pyttsx3, gTTS, Whisper" },
      { name: "IoT & Hardware", desc: "pyserial, pyfirmata, RPi.GPIO, Adafruit, MQTT" },
      { name: "Networking", desc: "requests, Flask, WebSocket, Paramiko SSH" },
    ],
  },
  {
    id: "spriteapi",
    label: "⑩ Sprite Python API",
    color: "#b45309",
    icon: "🤖",
    items: [
      { name: "Sprite('Name')", desc: "Create a controller object linked to a named sprite on stage" },
      { name: ".move_right(steps)", desc: "Move sprite right by given number of pixels" },
      { name: ".move_left(steps)", desc: "Move sprite left by given number of pixels" },
      { name: ".move_up(steps)", desc: "Move sprite up by given number of pixels" },
      { name: ".move_down(steps)", desc: "Move sprite down by given number of pixels" },
      { name: ".say(message)", desc: "Show a speech bubble above the sprite with the message" },
      { name: ".goto(x, y)", desc: "Teleport sprite to exact coordinates on the stage" },
      { name: ".set_size(size)", desc: "Set sprite scale (100 = normal, 200 = double)" },
      { name: ".hide() / .show()", desc: "Make sprite invisible or visible on the stage" },
      { name: ".point_in_direction(angle)", desc: "Rotate sprite to face a specific angle in degrees" },
    ],
  },
];

export default function PythonIDEGuide({ onClose }) {
  const [active, setActive] = useState(null);

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: "#0f0f1a", color: "#e2e8f0",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #6c2eb9 0%, #2563eb 100%)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🐍</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>LeapBlocks Python IDE</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Complete Working Functionalities Guide</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            ✕ Close
          </button>
        )}
      </div>

      {/* Quick Nav */}
      <div style={{ background: "#1e1e2e", padding: "10px 16px", borderBottom: "1px solid #312e5a", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Jump to Section</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(active === s.id ? null : s.id)}
              style={{
                background: active === s.id ? s.color : "#2d2d44",
                border: `1.5px solid ${active === s.id ? s.color : "#3d3d5c"}`,
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                color: "#e2e8f0",
                fontSize: 10,
                fontWeight: 600,
                transition: "all 0.18s",
              }}
            >
              {s.icon} {s.label.split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {sections.map(section => (
          <div
            key={section.id}
            onClick={() => setActive(active === section.id ? null : section.id)}
            style={{
              background: active === section.id ? "#1a1a2e" : "#16162a",
              border: `2px solid ${active === section.id ? section.color : "#2a2a40"}`,
              borderRadius: 10, marginBottom: 8, overflow: "hidden", cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: active === section.id ? `0 0 16px ${section.color}33` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "11px 16px", gap: 10 }}>
              <div style={{ background: section.color, borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                {section.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{section.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{section.items.length} features</div>
              </div>
              <div style={{ fontSize: 14, color: section.color, transform: active === section.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>⌄</div>
            </div>

            {active === section.id && (
              <div style={{ borderTop: `1px solid ${section.color}44`, padding: "10px 16px 14px" }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{
                      background: `${section.color}22`, border: `1px solid ${section.color}55`,
                      borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                      color: section.color, whiteSpace: "nowrap", flexShrink: 0, fontFamily: "monospace",
                    }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5, paddingTop: 2 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Quick Code Reference */}
        <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "16px 18px", marginTop: 4 }}>
          <div style={{ color: "#58a6ff", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⚡ Quick Reference — Sprite API</div>
          {[
            ["sprite = Sprite('Robot')", "Link to the Robot sprite on stage"],
            ["sprite.say('Hello!')", "Show speech bubble"],
            ["sprite.move_right(50)", "Move 50px to the right"],
            ["sprite.goto(0, 0)", "Go to center of stage"],
            ["sprite.set_size(150)", "Scale to 150%"],
            ["sprite.hide()", "Make invisible"],
            ["sprite.show()", "Make visible"],
            ["sprite.point_in_direction(180)", "Face downward"],
          ].map(([code, desc], i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 6, alignItems: "center" }}>
              <code style={{
                background: "#161b22", border: "1px solid #30363d", borderRadius: 4,
                padding: "2px 8px", fontSize: 11, color: "#79c0ff", fontFamily: "monospace",
                minWidth: 200, flexShrink: 0,
              }}>{code}</code>
              <span style={{ fontSize: 11, color: "#8b949e" }}>{desc}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 16, paddingBottom: 8 }}>
          LeapBlocks Python IDE • All {sections.length} UI sections explained
        </div>
      </div>
    </div>
  );
}
