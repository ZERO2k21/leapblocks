/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState } from 'react';
import { LEAP_PINS } from '../../engine/Arduino/PinHarness';
import {
  Search,
  X,
  ChevronDown
} from 'lucide-react';

const COMPONENTS = [
  { id: 'battery-12v', name: '12V Battery', category: 'inputs', desc: '12V Lead-acid battery' },
  { id: '7segment', name: '7-Segment', category: 'displays', desc: 'Numeric display' },
  { id: 'a4988', name: 'A4988 Driver', category: 'outputs', desc: 'Stepper motor driver' },
  { id: 'biaxial-stepper', name: 'Biaxial Stepper', category: 'outputs', desc: 'Dual-axis stepper' },
  { id: 'big-sound-sensor', name: 'Big Sound Sensor', category: 'sensors', desc: 'Sound detection module' },
  { id: 'buzzer', name: 'Buzzer', category: 'outputs', desc: 'Piezo sounder' },
  { id: 'dc-motor', name: 'DC Motor', category: 'outputs', desc: 'Simple DC motor' },
  { id: 'dht22', name: 'DHT22', category: 'sensors', desc: 'Temp & Humidity' },
  { id: 'ds1307', name: 'DS1307 RTC', category: 'sensors', desc: 'Real-time clock' },
  { id: 'flame-sensor', name: 'Flame Sensor', category: 'sensors', desc: 'IR flame detector' },
  { id: 'gas-sensor', name: 'Gas Sensor', category: 'sensors', desc: 'MQ-series gas sensor' },
  { id: 'hc-sr04', name: 'HC-SR04', category: 'sensors', desc: 'Ultrasonic distance' },
  { id: 'heart-beat-sensor', name: 'Heart Rate', category: 'sensors', desc: 'Pulse sensor' },
  { id: 'hx711', name: 'HX711 Load Cell', category: 'sensors', desc: 'Weight sensor amp' },
  { id: 'ili9341', name: 'ILI9341 TFT', category: 'displays', desc: '2.8" SPI TFT' },
  { id: 'ili9341-touch', name: 'ILI9341 TFT + FT6206 Touch', category: 'displays', desc: '2.8" SPI TFT + I2C Touch' },
  { id: 'ir-receiver', name: 'IR Receiver', category: 'sensors', desc: 'Infrared receiver' },
  { id: 'ir-remote', name: 'IR Remote', category: 'inputs', desc: 'Infrared remote' },
  { id: 'analog-joystick', name: 'Joystick', category: 'inputs', desc: '2-axis analog joystick' },
  { id: 'membrane-keypad', name: 'Keypad (4x4)', category: 'inputs', desc: 'Matrix keypad' },
  { id: 'l298n', name: 'L298N Driver', category: 'outputs', desc: 'Dual DC motor driver' },
  { id: 'lcd1602', name: 'LCD 1602', category: 'displays', desc: '16x2 Character display' },
  { id: 'lcd1602-i2c', name: 'LCD 1602 I²C', category: 'displays', desc: '16x2 Character display (I²C)' },
  { id: 'lcd2004', name: 'LCD 2004', category: 'displays', desc: '20x4 Character display' },
  { id: 'lcd2004-i2c', name: 'LCD 2004 I²C', category: 'displays', desc: '20x4 Character display (I²C)' },
  { id: 'led', name: 'LED', category: 'outputs', desc: 'Standard 5mm LED' },
  { id: 'led-bar-graph', name: 'LED Bar Graph', category: 'outputs', desc: '10-segment LED bar' },
  { id: 'led-ring', name: 'LED Ring', category: 'outputs', desc: 'NeoPixel Ring' },
  { id: 'microsd-card', name: 'MicroSD Card', category: 'sensors', desc: 'SD card module' },
  { id: 'mpu6050', name: 'MPU6050', category: 'sensors', desc: 'Accelerometer & Gyro' },
  { id: 'neopixel', name: 'NeoPixel', category: 'outputs', desc: 'Addressable RGB LED' },
  { id: 'neopixel-matrix', name: 'NeoPixel Matrix', category: 'outputs', desc: 'RGB LED Matrix' },
  { id: 'ntc-temperature-sensor', name: 'NTC Thermistor', category: 'sensors', desc: 'Temperature sensor' },
  { id: 'ssd1306', name: 'OLED SSD1306', category: 'displays', desc: '128x64 Graphics OLED' },
  { id: 'photoresistor-sensor', name: 'Photoresistor', category: 'sensors', desc: 'Light sensor (LDR)' },
  { id: 'pir-motion-sensor', name: 'PIR Sensor', category: 'sensors', desc: 'Motion detector' },
  { id: 'potentiometer', name: 'Potentiometer', category: 'inputs', desc: 'Variable resistor' },
  { id: 'pushbutton', name: 'Pushbutton', category: 'inputs', desc: 'Momentary switch' },
  { id: 'relay-module', name: 'Relay Module', category: 'outputs', desc: 'Single-channel relay' },
  { id: 'resistor', name: 'Resistor', category: 'inputs', desc: 'Passive resistor' },
  { id: 'rgb-led', name: 'RGB LED', category: 'outputs', desc: 'Multi-color LED' },
  { id: 'rotary-dialer', name: 'Rotary Dialer', category: 'inputs', desc: 'Rotary dial selector' },
  { id: 'ky-040', name: 'Rotary Encoder', category: 'inputs', desc: 'Incremental encoder' },
  { id: 'servo', name: 'Servo Motor', category: 'outputs', desc: 'Positionable motor' },
  { id: 'slide-potentiometer', name: 'Slide Pot', category: 'inputs', desc: 'Slider potentiometer' },
  { id: 'slide-switch', name: 'Slide Switch', category: 'inputs', desc: 'SPDT toggle' },
  { id: 'small-sound-sensor', name: 'Small Sound Sensor', category: 'sensors', desc: 'Microphone sensor' },
  { id: 'stepper-motor', name: 'Stepper Motor', category: 'outputs', desc: 'Step motor' },
  { id: 'tilt-switch', name: 'Tilt Switch', category: 'sensors', desc: 'Tilt detection switch' },
];

const getComponentScale = (id: string, defaultScale: number): number => {
  // Custom manual scale overrides for components that need specific sizing
  if (id === 'neopixel') return 2.3;
  if (id === 'led' || id === 'rgb-led') return 1.0;
  if (id === 'resistor') return 1.3;
  if (id === 'membrane-keypad') return 0.2;
  if (id === 'analog-joystick') return 0.55;
  if (id === 'hc-sr04') return 0.4;
  if (id === 'led-bar-graph') return 0.8;
  if (id === 'l298n') return 0.4;
  if (id === 'a4988') return 0.4;
  if (id === 'ds1307') return 0.8;
  if (id === 'microsd-card') return 0.8;
  if (id === 'hx711') return 0.4;
  if (id === '7segment') return 0.8;
  if (id === 'lcd1602') return 0.25;
  if (id === 'lcd1602-i2c') return 0.25;
  if (id === 'lcd2004') return 0.25;
  if (id === 'lcd2004-i2c') return 0.25;
  if (id === 'ssd1306') return 0.8;
  if (id === 'ili9341') return 0.4;
  if (id === 'ili9341-touch') return 0.4;
  if (id == 'neopixel-matrix') return 0.4;
  const pinData = LEAP_PINS[id];
  if (!pinData || !pinData.viewBox) {
    return defaultScale; // Fallback to default scale
  }
  const { width, height } = pinData.viewBox;
  const maxDim = Math.max(width, height);
  // Calculate the component size at default scale
  const currentSize = maxDim * defaultScale;
  // If it exceeds the target box size (72px), scale it down to fit.
  // Otherwise, keep the default scale so it doesn't get oversized.
  if (currentSize > 72) {
    return 72 / maxDim;
  }
  return defaultScale;
};

interface PartPickerProps {
  onSelect: (type: string) => void;
  onClose: () => void;
  currentBoard?: 'arduino-uno' | 'esp32-c3' | 'esp32';
}

export const PartPicker: React.FC<PartPickerProps> = ({ onSelect, onClose, currentBoard = 'arduino-uno' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(true);

  const handleDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData('application/forge-component', componentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const isESP32Board = currentBoard === 'esp32-c3' || currentBoard === 'esp32';

  const shouldHide = (id: string): boolean => {
    if (id === 'biaxial-stepper' && isESP32Board) return true;
    return false;
  };

  let allComponents = [...COMPONENTS];

  // Apply board-specific hiding
  if (isESP32Board) {
    allComponents = allComponents.filter(c => !shouldHide(c.id));
  }

  // Sort alphabetically by name
  allComponents.sort((a, b) => a.name.localeCompare(b.name));

  // Filter based on search query
  const filteredComponents = allComponents.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="component-sidebar" style={{
      width: '100%',
      height: '100%',
      background: 'var(--lp-dark-bg)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--lp-border)',
      fontFamily: "'Outfit', sans-serif"
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
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>Component Library</span>
          <span style={{ color: 'var(--lp-zinc-400)', fontSize: '9px', fontWeight: 600 }}>v1.1.0-STABLE</span>
        </div>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          color: 'var(--lp-zinc-400)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s'
        }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--lp-accent-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--lp-zinc-400)'}
        >
          <X size={16} />
        </button>
      </div>

      {/* Search Bar - outside scrollable area */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--lp-dark-bg)',
        borderBottom: '1px solid var(--lp-border)',
        flexShrink: 0
      }}>
        <div style={{
          background: 'var(--lp-zinc-800)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          border: '1px solid var(--lp-border)',
          borderRadius: '8px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <Search size={14} color="var(--lp-zinc-600)" style={{ marginRight: '6px' }} />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 0',
              color: 'var(--lp-text-color)',
              fontSize: '12px',
              outline: 'none',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>

        {/* Accordion 1: COMPONENT LIBRARY */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => setLibraryOpen(!libraryOpen)}
            style={{
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--lp-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--lp-text-color)',
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span>COMPONENT LIBRARY</span>
            <ChevronDown
              size={14}
              style={{
                transform: libraryOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>

          {libraryOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.02)' }}>
              {/* 2-Column Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                padding: '12px 16px 16px 16px'
              }}>
                {filteredComponents.map(comp => (
                  <div key={comp.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', minWidth: 0 }}>
                    <div
                      onClick={() => onSelect(comp.id)}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, comp.id)}
                      className="component-card"
                      title={comp.name}
                      style={{
                        background: 'var(--lp-dark-surface)',
                        border: '1px solid var(--lp-border)',
                        width: '100%',
                        aspectRatio: '1/1',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        boxShadow: 'var(--lp-shadow)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <div style={{
                        transform: `scale(${getComponentScale(comp.id, 0.7)})`,
                        transformOrigin: 'center center',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.95
                      }}>
                        {React.createElement(`leap-${comp.id}` as any, {
                          color: comp.id === 'led' ? 'red' : undefined,
                          ...(comp.id === 'rgb-led' ? { ledRed: 0.2, ledGreen: 0.8, ledBlue: 0.8 } : {}),
                          ...(comp.id === 'neopixel' ? { r: 0.2, g: 0.8, b: 0.8 } : {}),
                          value: true
                        })}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: 'var(--lp-text-color)',
                      textAlign: 'center',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      opacity: 0.9
                    }}>
                      {comp.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Status Bar */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--lp-border)',
        fontSize: '9px',
        fontWeight: 600,
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
