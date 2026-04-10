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
import { useForgeStore } from '../store/useForgeStore';

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
  { id: 'attiny85', name: 'ATtiny85', category: 'boards', desc: 'Mini 8-pin MCU' },
  { id: 'arduino-nano', name: 'Arduino Nano', category: 'boards', desc: 'Compact microcontroller' },
  { id: 'esp32-devkit-v1', name: 'ESP32 DevKit', category: 'boards', desc: 'WiFi & Bluetooth MCU' },

  // OUTPUTS
  { id: 'led', name: 'LED', category: 'outputs', desc: 'Standard 5mm LED' },
  { id: 'rgb-led', name: 'RGB LED', category: 'outputs', desc: 'Multi-color LED' },
  { id: 'neopixel', name: 'NeoPixel', category: 'outputs', desc: 'Addressable RGB LED' },
  { id: 'buzzer', name: 'Buzzer', category: 'outputs', desc: 'Piezo sounder' },
  { id: 'servo', name: 'Servo Motor', category: 'outputs', desc: 'Positionable motor' },

  // DISPLAYS
  { id: 'lcd1602', name: 'LCD 1602', category: 'displays', desc: '16x2 Character display' },
  { id: 'lcd2004', name: 'LCD 2004', category: 'displays', desc: '20x4 Character display' },
  { id: '7segment', name: '7-Segment', category: 'displays', desc: 'Numeric display' },
  { id: 'ssd1306', name: 'OLED SSD1306', category: 'displays', desc: '128x64 Graphics display' },

  // SENSORS
  { id: 'dht22', name: 'DHT22', category: 'sensors', desc: 'Temp & Humidity' },
  { id: 'hc-sr04', name: 'HC-SR04', category: 'sensors', desc: 'Ultrasonic distance' },
  { id: 'pir-motion-sensor', name: 'PIR Sensor', category: 'sensors', desc: 'Motion detector' },
  { id: 'mpu6050', name: 'MPU6050', category: 'sensors', desc: 'Accelerometer & Gyro' },

  // INPUTS
  { id: 'pushbutton', name: 'Pushbutton', category: 'inputs', desc: 'Momentary switch' },
  { id: 'potentiometer', name: 'Potentiometer', category: 'inputs', desc: 'Variable resistor' },
  { id: 'membrane-keypad', name: 'Keypad', category: 'inputs', desc: 'Matrix keypad' },
  { id: 'slide-switch', name: 'Slide Switch', category: 'inputs', desc: 'SPDT toggle' },
];

export default function Sidebar() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = COMPONENTS.filter(c => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const onDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData('application/forge-component', componentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="forge-sidebar">
      <div className="sidebar-section">
        <label className="section-label">Target Board</label>
        <div className="board-selector">
          <Cpu size={14} />
          <select 
            value={useForgeStore((s) => s.board)}
            onChange={(e) => useForgeStore.getState().setBoard(e.target.value)}
          >
            {COMPONENTS.filter(c => c.category === 'boards').map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="chevron" />
        </div>
      </div>

      <div className="sidebar-header">
        <div className="search-container">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="categories-grid">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            title={cat.name}
          >
            <cat.icon size={18} />
          </button>
        ))}
      </div>

      <div className="component-list">
        {filteredComponents.map(comp => (
          <div
            key={comp.id}
            className="component-card"
            draggable
            onDragStart={(e) => onDragStart(e, comp.id)}
          >
            <div className="comp-icon">
              {comp.category === 'boards' ? <Cpu size={24} /> : <Lightbulb size={24} />}
            </div>
            <div className="comp-info">
              <span className="comp-name">{comp.name}</span>
              <span className="comp-desc">{comp.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
