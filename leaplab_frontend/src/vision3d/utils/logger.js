/**
 * Vision3D - Centralized Logger
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 *
 * All logs are prefixed with [Vision3D] for easy filtering in browser console.
 */

const TAG = '[Vision3D]';

let enabled = true;

export function setLoggingEnabled(value) {
  enabled = value;
}

export function log(...args) {
  if (!enabled) return;
  console.log(TAG, ...args);
}

export function debug(...args) {
  if (!enabled) return;
  console.debug(TAG, '[DEBUG]', ...args);
}

export function warn(...args) {
  if (!enabled) return;
  console.warn(TAG, ...args);
}

export function error(...args) {
  if (!enabled) return;
  console.error(TAG, ...args);
}

export function group(label) {
  if (!enabled) return;
  console.group(TAG, label);
}

export function groupEnd() {
  if (!enabled) return;
  console.groupEnd();
}

export function table(data) {
  if (!enabled) return;
  console.table(data);
}

export function time(label) {
  if (!enabled) return;
  console.time(`${TAG} ${label}`);
}

export function timeEnd(label) {
  if (!enabled) return;
  console.timeEnd(`${TAG} ${label}`);
}
