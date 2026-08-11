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
  ChevronDown
} from 'lucide-react';
import { useForgeStore } from '../../utlis/store/useForgeStore';

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
  { id: 'esp32-c3', name: 'ESP32-C3', category: 'boards', desc: 'RISC-V WiFi & Bluetooth MCU' },

  // OUTPUTS
  { id: 'led', name: 'LED', category: 'outputs', desc: 'Standard 5mm LED' },
  { id: 'rgb-led', name: 'RGB LED', category: 'outputs', desc: 'Multi-color LED' },
  { id: 'neopixel', name: 'NeoPixel', category: 'outputs', desc: 'Addressable RGB LED' },
  { id: 'buzzer', name: 'Buzzer', category: 'outputs', desc: 'Piezo sounder' },
  { id: 'servo', name: 'Servo Motor', category: 'outputs', desc: 'Positionable motor' },
  { id: 'stepper-motor', name: 'Stepper Motor', category: 'outputs', desc: 'NEMA bipolar stepper' },
  { id: 'a4988', name: 'A4988 Driver', category: 'outputs', desc: 'Stepper motor driver' },
  { id: 'relay-module', name: 'Relay Module', category: 'outputs', desc: 'Single-channel relay' },

  // DISPLAYS
  { id: 'lcd1602', name: 'LCD 1602', category: 'displays', desc: '16x2 Character display (parallel)' },
  { id: 'lcd1602-i2c', name: 'LCD 1602 I²C', category: 'displays', desc: '16x2 Character display (I²C)' },
  { id: 'lcd2004', name: 'LCD 2004', category: 'displays', desc: '20x4 Character display (parallel)' },
  { id: 'lcd2004-i2c', name: 'LCD 2004 I²C', category: 'displays', desc: '20x4 Character display (I²C)' },
  { id: '7segment', name: '7-Segment', category: 'displays', desc: 'Numeric display' },
  { id: 'ssd1306', name: 'OLED SSD1306', category: 'displays', desc: '128x64 Graphics display' },

  // SENSORS
  { id: 'dht22', name: 'DHT22', category: 'sensors', desc: 'Temp & Humidity' },
  { id: 'hc-sr04', name: 'HC-SR04', category: 'sensors', desc: 'Ultrasonic distance' },
  { id: 'pir-motion-sensor', name: 'PIR Sensor', category: 'sensors', desc: 'Motion detector' },
  { id: 'ir-obstacle-sensor', name: 'IR Sensor', category: 'sensors', desc: 'IR Obstacle Avoidance (FC-51)' },
  { id: 'mpu6050', name: 'MPU6050', category: 'sensors', desc: 'Accelerometer & Gyro' },
  { id: 'proximity-sensor', name: 'Proximity Sensor', category: 'sensors', desc: 'IR proximity detector' },
  { id: 'rain-sensor', name: 'Rain Sensor', category: 'sensors', desc: 'Rain detection sensor (AO + DO)' },
  { id: 'soil-moisture-sensor', name: 'Soil Moisture', category: 'sensors', desc: 'Soil moisture sensor (AO + DO)' },
  { id: 'ntc-temperature-sensor', name: 'NTC Thermistor', category: 'sensors', desc: 'Temperature sensor' },

  // INPUTS
  { id: 'pushbutton', name: 'Pushbutton', category: 'inputs', desc: 'Momentary switch' },
  { id: 'potentiometer', name: 'Potentiometer', category: 'inputs', desc: 'Variable resistor' },
  { id: 'membrane-keypad', name: 'Keypad', category: 'inputs', desc: 'Matrix keypad' },
  { id: 'slide-switch', name: 'Slide Switch', category: 'inputs', desc: 'SPDT toggle' },
];

export default function Sidebar() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const board = useForgeStore((s) => s.board);
  const isESP32Board = board === 'esp32-c3' || board === 'esp32';

  const filteredComponents = COMPONENTS.filter(c => {
    // Hide components not compatible with current board
    if (isESP32Board && c.id === 'biaxial-stepper') return false;

    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const onDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData('application/forge-component', componentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="component-sidebar h-full flex flex-col font-['Outfit',sans-serif] bg-[var(--lp-dark-surface)] text-[var(--lp-text-color)] border-r border-solid border-[var(--lp-border)]">
      <div className="p-3 border-b border-solid border-[var(--lp-border)]">
        <label className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-2 block text-[var(--lp-zinc-400)]">Target Board</label>
        <div className="relative flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] cursor-pointer bg-[var(--lp-glass)] border border-solid border-[var(--lp-border)]">
          <Cpu size={14} className="shrink-0 text-[var(--lp-accent-primary)]" />
          <select
            value={useForgeStore((s) => s.board)}
            onChange={(e) => useForgeStore.getState().setBoard(e.target.value)}
            className="flex-1 bg-transparent border-none text-[12px] outline-none cursor-pointer appearance-none text-[var(--lp-text-color)]"
          >
            {COMPONENTS.filter(c => c.category === 'boards').map(b => (
              <option key={b.id} value={b.id} className="bg-[#1e293b]">{b.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none shrink-0 text-[var(--lp-zinc-400)]" />
        </div>
      </div>

      <div className="p-3 border-b border-solid border-[var(--lp-border)]">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-2.5 text-[var(--lp-zinc-400)]" />
          <input
            type="text"
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-8 pr-3 text-[12px] rounded-md outline-none transition-colors bg-[var(--lp-glass)] border border-solid border-[var(--lp-border)] text-[var(--lp-text-color)] placeholder-[var(--lp-zinc-400)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 p-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 border ${activeCategory === cat.id ? 'border-[var(--lp-accent-primary)]/30 bg-[rgba(var(--lp-accent-primary-rgb,34,211,238),0.15)] text-[var(--lp-accent-primary)]' : 'border-transparent hover:bg-[var(--lp-glass)] text-[var(--lp-zinc-400)]'}`}
            onClick={() => setActiveCategory(cat.id)}
            title={cat.name}
          >
            <cat.icon size={18} />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredComponents.map(comp => (
          <div
            key={comp.id}
            className="component-card flex items-center gap-2.5 p-2 rounded-md cursor-grab transition-all duration-200 border border-transparent hover:border-[rgba(59,130,246,0.2)] active:cursor-grabbing"
            draggable
            onDragStart={(e) => onDragStart(e, comp.id)}
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-md shrink-0 bg-[var(--lp-glass)]">
              {comp.category === 'boards'
                ? <Cpu size={20} className="text-[var(--lp-accent-primary)]" />
                : <Lightbulb size={20} className="text-[#22d3ee]" />
              }
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold truncate text-[var(--lp-text-color)]">{comp.name}</span>
              <span className="text-[10px] truncate text-[var(--lp-zinc-400)]">{comp.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
