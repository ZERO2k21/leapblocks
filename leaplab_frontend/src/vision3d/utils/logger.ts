/**
 * Vision3D - Centralized Logger
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 *
 * All logs are prefixed with [Vision3D] for easy filtering in browser console.
 * Usage: import { log, warn, error, debug, group } from '../utils/logger';
 */

const TAG = '[Vision3D]';

export type LogLevel = 'debug' | 'log' | 'warn' | 'error';

let enabled = true;

export function setLoggingEnabled(value: boolean) {
  enabled = value;
}

export function log(...args: unknown[]) {
  if (!enabled) return;
  console.log(TAG, ...args);
}

export function debug(...args: unknown[]) {
  if (!enabled) return;
  console.debug(TAG, '[DEBUG]', ...args);
}

export function warn(...args: unknown[]) {
  if (!enabled) return;
  console.warn(TAG, ...args);
}

export function error(...args: unknown[]) {
  if (!enabled) return;
  console.error(TAG, ...args);
}

export function group(label: string) {
  if (!enabled) return;
  console.group(TAG, label);
}

export function groupEnd() {
  if (!enabled) return;
  console.groupEnd();
}

export function table(data: unknown) {
  if (!enabled) return;
  console.table(data);
}

export function time(label: string) {
  if (!enabled) return;
  console.time(`${TAG} ${label}`);
}

export function timeEnd(label: string) {
  if (!enabled) return;
  console.timeEnd(`${TAG} ${label}`);
}
