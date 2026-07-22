/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

export const C: Record<string, string> = {
  PURPLE: "#8B5CF6",
  DARK_PURPLE: "#7C3AED",
  LIGHT_PURPLE: "#EDE9FE",
  PURPLE_BG: "#F5F3FF",
  BORDER: "#E5E7EB",
  BG: "#F9FAFB",
  BG2: "#F3F4F6",
  TEXT: "#1F2937",
  MUTED: "#6B7280",
  GREEN: "#10B981",
  RED: "#EF4444",
  BLUE: "#3B82F6",
  ORANGE: "#F59E0B",
  ACCENT: "#8B5CF6",
  HEADER_BG: "#8B5CF6",
}

export const DEFAULT_ACTIVE_FILE = "main.py"
export const DEFAULT_FILES: Record<string, string> = {
  [DEFAULT_ACTIVE_FILE]: 'print("Hello from LeapBlocks Python!")\n',
}

export const BOARD_HEADER_EXTENSIONS = new Set([".h", ".hpp"])
export const BOARD_SOURCE_EXTENSIONS = new Set([".ino", ".cpp", ".cc", ".c"])

export default C
