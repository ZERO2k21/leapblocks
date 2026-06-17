/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import pako from 'pako';

const COMPRESSED_MAGIC = '___LBC';

export function pack<T>(data: T): string {
  const json = JSON.stringify(data);
  const compressed = pako.deflate(json, { level: 9 });
  const bytes = new Uint8Array(compressed);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return COMPRESSED_MAGIC + btoa(binary);
}

export function unpack<T>(packed: string): T {
  const base64 = packed.startsWith(COMPRESSED_MAGIC)
    ? packed.slice(COMPRESSED_MAGIC.length)
    : packed;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes, { to: 'string' });
  return JSON.parse(decompressed) as T;
}

export function isPacked(data: string): boolean {
  return data.startsWith(COMPRESSED_MAGIC);
}
