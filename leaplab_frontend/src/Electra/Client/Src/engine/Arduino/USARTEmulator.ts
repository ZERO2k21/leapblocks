/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { AVRUSART } from '../../lib/avr8js';

/**
 * Intercepts USART signals from the AVR and emits them to JS.
 */
export class USARTEmulator {
  private usart: AVRUSART;
  private onData: (char: string) => void;
  private decoder = new TextDecoder('utf-8');
  private encoder = new TextEncoder();

  constructor(usart: AVRUSART, onData: (char: string) => void) {
    this.usart = usart;
    this.onData = onData;

    // Listen to every byte transmitted on the TX line
    this.usart.onByteTransmit = (value: number) => {
      const char = this.decoder.decode(new Uint8Array([value]), { stream: true });
      if (char) {
        this.onData(char);
      }
    };
  }

  /**
   * Send data to the AVR's serial RX buffer (from Serial Monitor input)
   */
  sendData(data: string): void {
    const bytes = this.encoder.encode(data);
    for (let i = 0; i < bytes.length; i++) {
      this.usart.writeByte(bytes[i]);
    }
    console.log(`[USART] Sent ${bytes.length} bytes to AVR RX: "${data}"`);
  }
}
