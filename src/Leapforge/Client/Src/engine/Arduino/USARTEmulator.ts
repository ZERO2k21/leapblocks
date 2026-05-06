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

  constructor(usart: AVRUSART, onData: (char: string) => void) {
    this.usart = usart;
    this.onData = onData;

    // Listen to every byte transmitted on the TX line
    this.usart.onByteTransmit = (value: number) => {
      this.onData(String.fromCharCode(value));
    };
  }

  /**
   * Send data to the AVR's serial RX buffer (from Serial Monitor input)
   */
  sendData(data: string): void {
    for (let i = 0; i < data.length; i++) {
      const byte = data.charCodeAt(i);
      this.usart.writeByte(byte);
    }
    console.log(`[USART] Sent ${data.length} bytes to AVR RX: "${data}"`);
  }
}
