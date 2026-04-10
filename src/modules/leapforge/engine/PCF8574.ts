import { I2CSlave } from './I2CBusManager';
import { HD44780 } from './HD44780';

/**
 * PCF8574 Emulator
 * I2C to 8-bit Parallel I/O Expander.
 * Commonly used as an I2C Backpack for LCD1602/2004 displays.
 */
export class PCF8574 implements I2CSlave {
  public i2cAddress: number;
  private outputData: number = 0;
  private lcd: HD44780;
  private onDataChange: (state: any) => void;

  /**
   * Typical Backpack Pinout:
   * P0 -> RS
   * P1 -> RW
   * P2 -> E (Enable)
   * P3 -> Backlight Control
   * P4 -> D4
   * P5 -> D5
   * P6 -> D6
   * P7 -> D7
   */

  constructor(address: number, lcd: HD44780, onDataChange: (state: any) => void) {
    this.i2cAddress = address;
    this.lcd = lcd;
    this.onDataChange = onDataChange;
  }

  onStart(repeated: boolean): void { }
  onStop(): void { }

  onConnect(write: boolean): boolean {
    return true; // Always ACK connection
  }

  onWrite(value: number): boolean {
    const prevE = (this.outputData & 0x04) !== 0;
    const currE = (value & 0x04) !== 0;
    
    // Logic: If E goes from HIGH to LOW, it's a parallel pulse
    if (prevE && !currE) {
      const rs = (value & 0x01) !== 0;
      // Data is in the upper nibble (P4-P7)
      const data = value & 0xF0;
      this.lcd.processPulse(rs, data);
      
      // Notify UI of LCD state change
      this.onDataChange(this.lcd.getState());
    }

    // Handle Backlight
    const backlight = (value & 0x08) !== 0;
    // Note: We might want to pass this to the LCD state too
    
    this.outputData = value;
    return true; // ACK byte
  }

  onRead(ack: boolean): number {
    // Reading from PCF8574 returns the values of the pins
    // In many backpacks, pins are pulled high.
    return 0xFF; 
  }
}
