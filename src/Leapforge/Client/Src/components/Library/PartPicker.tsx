/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import {
  Search,
  Cpu,
  Lightbulb,
  Smartphone,
  Gauge,
  MousePointer2,
  X
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Search },
  { id: 'boards', name: 'Boards', icon: Cpu },
  { id: 'outputs', name: 'Outputs', icon: Lightbulb },
  { id: 'displays', name: 'Displays', icon: Smartphone },
  { id: 'sensors', name: 'Sensors', icon: Gauge },
  { id: 'inputs', name: 'Inputs', icon: MousePointer2 },
];

const COMPONENTS = [
  // BOARDS
  { id: 'arduino-uno', name: 'Arduino Uno', category: 'boards', desc: 'Standard microcontroller' },
  { id: 'arduino-mega', name: 'Arduino Mega', category: 'boards', desc: 'Powerful microcontroller' },
  { id: 'arduino-nano', name: 'Arduino Nano', category: 'boards', desc: 'Compact microcontroller' },
  { id: 'esp32-c3', name: 'ESP32-C3', category: 'boards', desc: 'RISC-V WiFi & Bluetooth MCU' },
  { id: 'franzininho', name: 'Franzininho', category: 'boards', desc: 'ATtiny85 board' },
  { id: 'nano-rp2040-connect', name: 'Nano RP2040', category: 'boards', desc: 'RP2040 connected board' },

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
  { id: 'ks2e-m-dc5', name: 'Relay', category: 'outputs', desc: '5V Relay' },

  // DISPLAYS
  { id: 'lcd1602', name: 'LCD 1602', category: 'displays', desc: '16x2 Character display (parallel)' },
  { id: 'lcd1602-i2c', name: 'LCD 1602 I²C', category: 'displays', desc: '16x2 Character display (I²C)' },
  { id: 'lcd2004', name: 'LCD 2004', category: 'displays', desc: '20x4 Character display (parallel)' },
  { id: 'lcd2004-i2c', name: 'LCD 2004 I²C', category: 'displays', desc: '20x4 Character display (I²C)' },
  { id: '7segment', name: '7-Segment', category: 'displays', desc: 'Numeric display' },
  { id: 'ssd1306', name: 'OLED SSD1306', category: 'displays', desc: '128x64 Graphics OLED' },
  { id: 'ili9341', name: 'ILI9341 TFT', category: 'displays', desc: '2.8" SPI TFT display' },

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
  { id: 'big-sound-sensor', name: 'Big Sound Sensor', category: 'sensors', desc: 'Microphone module' },
  { id: 'small-sound-sensor', name: 'Small Sound Sensor', category: 'sensors', desc: 'Microphone module' },
  { id: 'hx711', name: 'HX711 Load Cell', category: 'sensors', desc: 'Weight sensor amp' },
  { id: 'ir-receiver', name: 'IR Receiver', category: 'sensors', desc: 'Infrared receiver' },
  { id: 'ds1307', name: 'DS1307 RTC', category: 'sensors', desc: 'Real-time clock' },
  { id: 'microsd-card', name: 'MicroSD Card', category: 'sensors', desc: 'SD card module' },

  // INPUTS / PASSIVES
  { id: 'pushbutton', name: 'Pushbutton', category: 'inputs', desc: 'Momentary switch' },
  { id: 'pushbutton-6mm', name: 'Pushbutton 6mm', category: 'inputs', desc: 'Small tactile button' },
  { id: 'potentiometer', name: 'Potentiometer', category: 'inputs', desc: 'Variable resistor' },
  { id: 'slide-potentiometer', name: 'Slide Pot.', category: 'inputs', desc: 'Linear variable resistor' },
  { id: 'membrane-keypad', name: 'Keypad (4x4)', category: 'inputs', desc: 'Matrix keypad' },
  { id: 'slide-switch', name: 'Slide Switch', category: 'inputs', desc: 'SPDT toggle' },
  { id: 'dip-switch-8', name: 'DIP Switch (8)', category: 'inputs', desc: '8-position toggle' },
  { id: 'tilt-switch', name: 'Tilt Switch', category: 'inputs', desc: 'Tilt sensor switch' },
  { id: 'analog-joystick', name: 'Joystick', category: 'inputs', desc: '2-axis analog joystick' },
  { id: 'ky-040', name: 'Rotary Encoder', category: 'inputs', desc: 'Incremental encoder' },
  { id: 'rotary-dialer', name: 'Rotary Dialer', category: 'inputs', desc: 'Classic rotary dial' },
  { id: 'ir-remote', name: 'IR Remote', category: 'inputs', desc: 'Infrared remote control' },
  { id: 'resistor', name: 'Resistor', category: 'inputs', desc: 'Passive resistor' },
];

interface PartPickerProps {
  onSelect: (type: string) => void;
  onClose: () => void;
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
    <div className="part-picker-overlay" style={{
      position: 'absolute',
      top: '60px',
      left: '20px',
      width: '320px',
      maxHeight: '400px',
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(16px)',
      borderRadius: '16px',
      border: '1.5px solid rgba(148, 163, 184, 0.2)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div className="picker-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>Add Component</span>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px'
        }}><X size={18} /></button>
      </div>

      <div className="picker-search" style={{ padding: '10px 16px' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px'
        }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      </div>

      <div className="categories-strip" style={{
        display: 'flex',
        gap: '8px',
        padding: '0 16px 10px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: activeCategory === cat.id ? '#BEF264' : 'rgba(148, 163, 184, 0.1)',
              color: activeCategory === cat.id ? '#0f172a' : '#94a3b8',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="picker-list" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        background: 'rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {filteredComponents.map(comp => (
            <div
              key={comp.id}
              onClick={() => onSelect(comp.id)}
              style={{
                background: 'rgba(51, 65, 85, 0.4)',
                padding: '12px 8px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                transition: 'all 0.2s',
                height: '100px',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(51, 65, 85, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(190, 242, 100, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(51, 65, 85, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Component Preview Container */}
              <div style={{
                height: '54px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
                pointerEvents: 'none',
                opacity: 0.9,
                overflow: 'hidden'
              }}>
                <div style={{
                  transform: comp.id.includes('mega') ? 'scale(0.12)' :
                    comp.id.includes('uno') ? 'scale(0.18)' :
                      comp.id.includes('esp32') ? 'scale(0.22)' :
                        comp.category === 'boards' ? 'scale(0.25)' :
                          comp.category === 'displays' ? 'scale(0.3)' : 'scale(0.5)',
                  transformOrigin: 'center center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {React.createElement(`leap-${comp.id}` as any, {
                    color: comp.id === 'led' ? 'red' : undefined,
                    value: true
                  })}                </div>
              </div>

              <span style={{
                color: '#f8fafc',
                fontSize: '10px',
                fontWeight: 600,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.2'
              }}>
                {comp.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartPicker;
