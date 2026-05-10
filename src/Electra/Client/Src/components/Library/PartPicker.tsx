/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState } from 'react';
import {
  Search,
  Lightbulb,
  Smartphone,
  Gauge,
  MousePointer2,
  X,
  LayoutGrid
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'ALL', icon: LayoutGrid },
  { id: 'outputs', name: 'OUT', icon: Lightbulb },
  { id: 'displays', name: 'DSPL', icon: Smartphone },
  { id: 'sensors', name: 'SENS', icon: Gauge },
  { id: 'inputs', name: 'INP', icon: MousePointer2 },
];

const COMPONENTS = [
  // OUTPUTS
  { id: 'led', name: 'LED', category: 'outputs', desc: 'Standard 5mm LED' },
  { id: 'rgb-led', name: 'RGB LED', category: 'outputs', desc: 'Multi-color LED' },
  { id: 'neopixel', name: 'NeoPixel', category: 'outputs', desc: 'Addressable RGB LED' },
  { id: 'led-bar-graph', name: 'LED Bar Graph', category: 'outputs', desc: '10-segment LED bar' },
  { id: 'led-ring', name: 'LED Ring', category: 'outputs', desc: 'NeoPixel Ring' },
  { id: 'neopixel-matrix', name: 'NeoPixel Matrix', category: 'outputs', desc: 'RGB LED Matrix' },
  { id: 'buzzer', name: 'Buzzer', category: 'outputs', desc: 'Piezo sounder' },
  { id: 'servo', name: 'Servo Motor', category: 'outputs', desc: 'Positionable motor' },
  { id: 'stepper-motor', name: 'Stepper Motor', category: 'outputs', desc: 'Step motor' },
  { id: 'biaxial-stepper', name: 'Biaxial Stepper', category: 'outputs', desc: 'Dual-axis stepper' },
  { id: 'a4988', name: 'A4988 Driver', category: 'outputs', desc: 'Stepper motor driver' },
  { id: 'l298n', name: 'L298N Driver', category: 'outputs', desc: 'Dual DC motor driver' },
  { id: 'dc-motor', name: 'DC Motor', category: 'outputs', desc: 'Simple DC motor' },
  { id: 'ks2e-m-dc5', name: 'Relay', category: 'outputs', desc: '5V Relay' },
  { id: 'relay-module', name: 'Relay Module', category: 'outputs', desc: 'Single-channel relay' },

  // DISPLAYS
  { id: 'lcd1602', name: 'LCD 1602', category: 'displays', desc: '16x2 Character display' },
  { id: 'lcd1602-i2c', name: 'LCD 1602 I²C', category: 'displays', desc: '16x2 Character display (I²C)' },
  { id: 'lcd2004', name: 'LCD 2004', category: 'displays', desc: '20x4 Character display' },
  { id: 'lcd2004-i2c', name: 'LCD 2004 I²C', category: 'displays', desc: '20x4 Character display (I²C)' },
  { id: '7segment', name: '7-Segment', category: 'displays', desc: 'Numeric display' },
  { id: 'ssd1306', name: 'OLED SSD1306', category: 'displays', desc: '128x64 Graphics OLED' },
  { id: 'ili9341', name: 'ILI9341 TFT', category: 'displays', desc: '2.8" SPI TFT' },

  // SENSORS
  { id: 'dht22', name: 'DHT22', category: 'sensors', desc: 'Temp & Humidity' },
  { id: 'hc-sr04', name: 'HC-SR04', category: 'sensors', desc: 'Ultrasonic distance' },
  { id: 'pir-motion-sensor', name: 'PIR Sensor', category: 'sensors', desc: 'Motion detector' },
  { id: 'mpu6050', name: 'MPU6050', category: 'sensors', desc: 'Accelerometer & Gyro' },
  { id: 'ntc-temperature-sensor', name: 'NTC Thermistor', category: 'sensors', desc: 'Temperature sensor' },
  { id: 'photoresistor-sensor', name: 'Photoresistor', category: 'sensors', desc: 'Light sensor (LDR)' },
  { id: 'flame-sensor', name: 'Flame Sensor', category: 'sensors', desc: 'IR flame detector' },
  { id: 'gas-sensor', name: 'Gas Sensor', category: 'sensors', desc: 'MQ-series gas sensor' },
  { id: 'heart-beat-sensor', name: 'Heart Rate', category: 'sensors', desc: 'Pulse sensor' },
  { id: 'hx711', name: 'HX711 Load Cell', category: 'sensors', desc: 'Weight sensor amp' },
  { id: 'ir-receiver', name: 'IR Receiver', category: 'sensors', desc: 'Infrared receiver' },
  { id: 'ds1307', name: 'DS1307 RTC', category: 'sensors', desc: 'Real-time clock' },
  { id: 'microsd-card', name: 'MicroSD Card', category: 'sensors', desc: 'SD card module' },

  // INPUTS / PASSIVES
  { id: 'pushbutton', name: 'Pushbutton', category: 'inputs', desc: 'Momentary switch' },
  { id: 'potentiometer', name: 'Potentiometer', category: 'inputs', desc: 'Variable resistor' },
  { id: 'membrane-keypad', name: 'Keypad (4x4)', category: 'inputs', desc: 'Matrix keypad' },
  { id: 'slide-switch', name: 'Slide Switch', category: 'inputs', desc: 'SPDT toggle' },
  { id: 'analog-joystick', name: 'Joystick', category: 'inputs', desc: '2-axis analog joystick' },
  { id: 'ky-040', name: 'Rotary Encoder', category: 'inputs', desc: 'Incremental encoder' },
  { id: 'ir-remote', name: 'IR Remote', category: 'inputs', desc: 'Infrared remote' },
  { id: 'battery-12v', name: '12V Battery', category: 'inputs', desc: '12V Lead-acid battery' },
  { id: 'resistor', name: 'Resistor', category: 'inputs', desc: 'Passive resistor' },
];

interface PartPickerProps {
  onSelect: (type: string) => void;
  onClose: () => void;
  currentBoard?: 'arduino-uno' | 'esp32-c3';
}

export const PartPicker: React.FC<PartPickerProps> = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = COMPONENTS.filter(c => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="component-sidebar" style={{
      width: '100%',
      height: '100%',
      background: 'var(--lp-dark-bg)',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--lp-border)',
      fontFamily: "'Space Mono', monospace"
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--lp-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--lp-dark-surface)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            color: 'var(--lp-accent-primary)', 
            fontSize: '12px', 
            fontWeight: 700, 
            letterSpacing: '1px' 
          }}>LIBRARY.BROWSER</span>
          <span style={{ color: 'var(--lp-zinc-400)', fontSize: '9px' }}>v1.0.4-STABLE</span>
        </div>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          color: 'var(--lp-zinc-400)',
          cursor: 'pointer',
          padding: '4px'
        }}><X size={14} /></button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '12px' }}>
        <div style={{
          background: 'var(--lp-zinc-800)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          border: '1px solid var(--lp-border)',
        }}>
          <span style={{ color: 'var(--lp-accent-primary)', fontSize: '12px', marginRight: '4px' }}>&gt;</span>
          <input
            type="text"
            placeholder="FILTER_PARTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 4px',
              color: 'var(--lp-zinc-400)',
              fontSize: '11px',
              outline: 'none',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
          <Search size={12} color="var(--lp-zinc-600)" />
        </div>
      </div>

      {/* Categories & List Container */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Vertical Categories */}
        <div style={{
          width: '56px',
          borderRight: '1px solid var(--lp-border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--lp-dark-surface)'
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                width: '100%',
                height: '56px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: activeCategory === cat.id ? 'var(--lp-zinc-800)' : 'transparent',
                border: 'none',
                borderLeft: activeCategory === cat.id ? '2px solid var(--lp-accent-primary)' : '2px solid transparent',
                color: activeCategory === cat.id ? 'var(--lp-accent-primary)' : 'var(--lp-zinc-400)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <cat.icon size={16} />
              <span style={{ fontSize: '8px', fontWeight: 700 }}>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Component Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '8px',
          alignContent: 'start'
        }}>
          {filteredComponents.map(comp => (
            <div
              key={comp.id}
              onClick={() => onSelect(comp.id)}
              className="component-card"
              style={{
                background: 'var(--lp-dark-surface)',
                border: '1px solid var(--lp-border)',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.1s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--lp-accent-primary)';
                e.currentTarget.style.background = 'var(--lp-zinc-800)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--lp-border)';
                e.currentTarget.style.background = 'var(--lp-dark-surface)';
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--lp-border)',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                <div style={{
                  transform: 'scale(0.3)',
                  transformOrigin: 'center center',
                  opacity: 0.8
                }}>
                  {React.createElement(`leap-${comp.id}` as any, {
                    color: comp.id === 'led' ? 'red' : undefined,
                    value: true
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ 
                  color: 'var(--lp-zinc-400)', 
                  fontSize: '10px', 
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{comp.name}</span>
                <span style={{ color: 'var(--lp-zinc-600)', fontSize: '8px' }}>{comp.id.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Status Bar */}
      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid var(--lp-border)',
        fontSize: '8px',
        color: 'var(--lp-zinc-600)',
        display: 'flex',
        justifyContent: 'space-between',
        background: 'var(--lp-dark-surface)'
      }}>
        <span>READY</span>
        <span>{filteredComponents.length} ELEMENTS</span>
      </div>
    </div>
  );
};

export default PartPicker;
