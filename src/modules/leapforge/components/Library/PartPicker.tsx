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
        padding: '0 8px 8px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {filteredComponents.map(comp => (
            <div 
              key={comp.id} 
              onClick={() => onSelect(comp.id)}
              style={{
                background: 'rgba(148, 163, 184, 0.05)',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                border: '1px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(190, 242, 100, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ color: '#BEF264', marginBottom: '8px' }}>
                {comp.category === 'boards' ? <Cpu size={20} /> : <Lightbulb size={20} />}
              </div>
              <span style={{ color: '#f8fafc', fontSize: '11px', fontWeight: 600 }}>{comp.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartPicker;
