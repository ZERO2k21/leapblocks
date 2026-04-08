export function parseHexString(hex: string): Uint16Array {
  // ATmega328p has 32KB flash memory max
  const progData = new Uint8Array(0x8000);
  let ptr = 0;

  const lines = hex.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(':')) continue;

    const count = parseInt(trimmed.substring(1, 3), 16);
    const address = parseInt(trimmed.substring(3, 7), 16);
    const recordType = parseInt(trimmed.substring(7, 9), 16);

    // 00 is Data Record
    if (recordType === 0) {
      for (let i = 0; i < count; i++) {
        progData[address + i] = parseInt(trimmed.substring(9 + i * 2, 11 + i * 2), 16);
      }
    }
  }

  // The CPU accepts 16-bit instructions, so we wrap the byte buffer safely.
  // AVR memory is arranged as little-endian words, matching JS TypedArrays.
  return new Uint16Array(progData.buffer);
}
