/**
 * Vision3D - Centralized Logger
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 *
 * All logs are prefixed with [Vision3D] for easy filtering in browser console.
 */

const TAG = '[Vision3D]'

if (typeof window !== 'undefined') {
  const originalConsoleWarn = window.console.warn
  window.console.warn = function (...args: unknown[]) {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0] as string).includes('THREE.Clock') &&
      (args[0] as string).includes('deprecated')
    ) {
      return
    }
    originalConsoleWarn.apply(window.console, args as [string, ...unknown[]])
  }
}

let enabled = true

export function setLoggingEnabled(value: boolean): void {
  enabled = value
}

export function log(...args: unknown[]): void {
  if (!enabled) return
  console.log(TAG, ...args)
}

export function debug(...args: unknown[]): void {
  if (!enabled) return
  console.debug(TAG, '[DEBUG]', ...args)
}

export function warn(...args: unknown[]): void {
  if (!enabled) return
  console.warn(TAG, ...args)
}

export function error(...args: unknown[]): void {
  if (!enabled) return
  console.error(TAG, ...args)
}

export function group(label: string): void {
  if (!enabled) return
  console.group(TAG, label)
}

export function groupEnd(): void {
  if (!enabled) return
  console.groupEnd()
}

export function table(data: unknown): void {
  if (!enabled) return
  console.table(data)
}

export function time(label: string): void {
  if (!enabled) return
  console.time(`${TAG} ${label}`)
}

export function timeEnd(label: string): void {
  if (!enabled) return
  console.timeEnd(`${TAG} ${label}`)
}
