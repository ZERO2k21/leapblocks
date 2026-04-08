import { AVRUSART } from 'avr8js';

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
}
