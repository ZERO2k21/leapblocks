/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Simple file-based logger for Python execution output.
 * Writes daily rotating log files to %APPDATA%/leapblocks/logs/
 * Auto-cleans logs older than 7 days on startup.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const LOG_DIR_NAME = 'logs';
const MAX_LOG_AGE_DAYS = 7;

function getLogsDir(): string {
  try {
    const { app } = require('electron');
    if (app?.getPath) {
      return path.join(app.getPath('userData'), LOG_DIR_NAME);
    }
  } catch { /* not in Electron context */ }

  const platform = os.platform();
  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', 'leapblocks', LOG_DIR_NAME);
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'leapblocks', LOG_DIR_NAME);
  } else {
    return path.join(os.homedir(), '.config', 'leapblocks', LOG_DIR_NAME);
  }
}

function getTodayLogFile(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return path.join(getLogsDir(), `python-${dateStr}.log`);
}

/**
 * Append a timestamped line to today's log file.
 * Creates the log directory and file if they don't exist.
 */
export function logToFile(channel: string, data: string): void {
  try {
    const logsDir = getLogsDir();
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = getTodayLogFile();
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${channel}] ${data}\n`;

    fs.appendFileSync(logFile, line, 'utf-8');
  } catch (err) {
    console.error('[fileLogger] Failed to write log:', err);
  }
}

/**
 * Delete log files older than MAX_LOG_AGE_DAYS.
 * Call this once on app startup.
 */
export function cleanupOldLogs(): void {
  try {
    const logsDir = getLogsDir();
    if (!fs.existsSync(logsDir)) return;

    const cutoff = Date.now() - MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(logsDir);

    for (const file of files) {
      if (!file.startsWith('python-') || !file.endsWith('.log')) continue;

      const filePath = path.join(logsDir, file);
      const stat = fs.statSync(filePath);

      if (stat.mtimeMs < cutoff) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[fileLogger] Cleaned up old log: ${file}`);
        } catch { /* ignore */ }
      }
    }
  } catch (err) {
    console.error('[fileLogger] Failed to cleanup old logs:', err);
  }
}
