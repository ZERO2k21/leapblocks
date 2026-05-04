/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { 
  AVRPortConfig, 
  portAConfig, portBConfig, portCConfig, portDConfig, portEConfig, portFConfig, portGConfig, portHConfig, portJConfig, portKConfig, portLConfig,
  timer0Config, timer1Config, timer2Config,
  adcConfig, usart0Config, twiConfig, spiConfig, eepromConfig,
  AVRTimerConfig
} from '../../lib/avr8js';

export const portBTinyConfig: AVRPortConfig = {
  PIN: 0x16,
  DDR: 0x17,
  PORT: 0x18,
  externalInterrupts: [],
};

export interface MCUConfig {
  name: string;
  flashSize: number;
  sramSize: number;
  eepromSize: number;
  ports: Record<string, AVRPortConfig>;
  timers: AVRTimerConfig[];
  hasADC: boolean;
  hasTWI: boolean;
  hasSPI: boolean;
  hasUSART: boolean;
  frequency: number;
}

export const BOARDS: Record<string, MCUConfig> = {
  'arduino-uno': {
    name: 'ATmega328P',
    flashSize: 32 * 1024,
    sramSize: 2048,
    eepromSize: 1024,
    ports: {
      'B': portBConfig,
      'C': portCConfig,
      'D': portDConfig
    },
    timers: [timer0Config, timer1Config, timer2Config],
    hasADC: true,
    hasTWI: true,
    hasSPI: true,
    hasUSART: true,
    frequency: 16e6
  },
  'arduino-mega': {
    name: 'ATmega2560',
    flashSize: 256 * 1024,
    sramSize: 8192,
    eepromSize: 4096,
    ports: {
      'A': portAConfig,
      'B': portBConfig,
      'C': portCConfig,
      'D': portDConfig,
      'E': portEConfig,
      'F': portFConfig,
      'G': portGConfig,
      'H': portHConfig,
      'J': portJConfig,
      'K': portKConfig,
      'L': portLConfig
    },
    timers: [timer0Config, timer1Config, timer2Config], // Mega has more timers (3, 4, 5), need to check avr8js
    hasADC: true,
    hasTWI: true,
    hasSPI: true,
    hasUSART: true,
    frequency: 16e6
  },
  'attiny85': {
    name: 'ATtiny85',
    flashSize: 8 * 1024,
    sramSize: 512,
    eepromSize: 512,
    ports: {
      'B': portBTinyConfig
    },
    timers: [timer0Config], // Attiny85 uses standard Timer0
    hasADC: true,
    hasTWI: false, // Uses USI for TWI
    hasSPI: false, // Uses USI for SPI
    hasUSART: false,
    frequency: 8e6
  }
};
