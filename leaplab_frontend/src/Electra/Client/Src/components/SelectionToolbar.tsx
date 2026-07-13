/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { useForgeStore } from '../../utlis/store/useForgeStore';
import { Trash2, Sliders, Radio, Zap, ChevronDown, Cpu, Sparkles, Power } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  primaryColor?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, primaryColor }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];
  const colorAccent = primaryColor || '#22d3ee';

  return (
    <div ref={containerRef} className="relative select-none">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-[8px] bg-[rgba(15,23,42,0.45)] hover:bg-[rgba(30,41,59,0.6)] text-slate-200 border border-solid border-[rgba(255,255,255,0.08)] hover:border-cyan-500/30 rounded-[8px] p-[6px_12px] text-[11px] font-bold cursor-pointer transition-all duration-200 min-w-[90px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={11} className="text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 bg-[#0e1017] border border-solid border-[rgba(255,255,255,0.1)] rounded-[10px] py-[4px] min-w-[130px] z-[2000] overflow-hidden shadow-[0_12px_28px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[slideDropdownUp_0.15s_cubic-bezier(0.16,1,0.3,1)]">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="p-[6px_12px] text-[11px] font-semibold cursor-pointer transition-colors duration-150"
              style={{
                color: opt.value === value ? colorAccent : '#cbd5e1',
                backgroundColor: opt.value === value ? `${colorAccent}15` : 'transparent',
                fontWeight: opt.value === value ? 'bold' : 'normal'
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SelectionToolbar: React.FC = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    nodes,
    edges,
    removeNode,
    removeEdge,
    setSelectedNode,
    setSelectedEdge,
    updateNodeData,
    updateEdgeData
  } = useForgeStore();

  const [irAddress, setIrAddress] = React.useState('0');
  const [irCommand, setIrCommand] = React.useState('162');

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) return null;

  const nodeType = selectedNode?.data?.type;
  const currentValues = selectedNode?.data?.sensorValues;

  const getStatusLabel = (category: string) => {
    const cat = category.toUpperCase();
    if (cat.includes('BOARD') || cat.includes('MCU')) return 'MCU';
    if (cat.includes('SENSOR')) return 'INPUT';
    if (cat.includes('ACTUATOR') || cat.includes('MOTOR')) return 'ACTUATOR';
    if (cat.includes('DISPLAY')) return 'DISPLAY';
    if (cat.includes('OUTPUT')) return 'OUTPUT';
    if (cat.includes('POWER')) return 'POWER';
    if (cat.includes('CONNECTION')) return 'WIRE';
    return 'DEV';
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      setSelectedNode(null);
    } else if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
      setSelectedEdge(null);
    }
  };

  const getBadgeStyle = () => {
    let primary = '#22d3ee';
    let category = 'COMPONENT';
    let displayName = 'UNKNOWN';

    if (selectedNode) {
      const t = (selectedNode.data?.type || '').toLowerCase();
      displayName = t.replace(/-/g, ' ').toUpperCase();

      if (['esp32-c3', 'esp32'].includes(t)) {
        category = 'MCU BOARD';
        displayName = 'ESP32 C3';
        primary = '#f97316';
      } else if (t === 'arduino-uno') {
        category = 'MCU BOARD';
        displayName = 'ARDUINO UNO';
        primary = '#06b6d4';
      } else if (['hc-sr04', 'dht22', 'dht11', 'ntc-temperature-sensor', 'photoresistor-sensor', 'photoresistor', 'flame-sensor', 'gas-sensor', 'heart-beat-sensor', 'big-sound-sensor', 'small-sound-sensor', 'hx711', 'ky-040', 'pir-motion-sensor', 'mpu6050'].includes(t)) {
        category = 'SENSOR';
        primary = '#10b981';
      } else if (['stepper-motor', 'dc-motor', 'servo', 'l298n', 'relay-module', 'steppermotor'].includes(t)) {
        category = 'MOTOR/ACTUATOR';
        displayName = t === 'dc-motor' ? 'DC MOTOR' : displayName;
        primary = '#f43f5e';
      } else if (['ili9341', 'ili9341-touch', 'ssd1306', 'lcd1602', 'lcd2004', 'lcd1602-i2c', 'lcd2004-i2c'].includes(t)) {
        category = 'DISPLAY';
        primary = '#a855f7';
      } else if (['led', 'rgb-led', 'led-bar-graph', 'neopixel', 'neopixel-matrix', 'led-ring', 'buzzer'].includes(t)) {
        category = 'OUTPUT';
        primary = '#eab308';
      } else if (['potentiometer', 'slide-potentiometer', 'resistor', 'pushbutton', 'pushbutton-6mm', 'membrane-keypad', 'rotary-dialer', 'tilt-switch'].includes(t)) {
        category = 'INPUT/PASSIVE';
        primary = '#3b82f6';
      } else if (['battery-12v', 'battery'].includes(t)) {
        category = 'POWER';
        primary = '#ef4444';
      } else if (['ds1307'].includes(t)) {
        category = 'RTC/CHIP';
        primary = '#7c3aed';
      }
    } else if (selectedEdge) {
      category = 'CONNECTION';
      const edgeColorName = selectedEdge.data?.color || 'green';
      displayName = `${edgeColorName.toUpperCase()} WIRE`;
      const WIRE_HEX: Record<string, string> = {
        red: '#ef4444', black: '#1e293b', green: '#10b981', blue: '#3b82f6',
        yellow: '#eab308', white: '#ffffff', orange: '#f97316', purple: '#a855f7',
        pink: '#ec4899', cyan: '#06b6d4'
      };
      primary = WIRE_HEX[edgeColorName.toLowerCase()] || '#10b981';
    }

    return { primary, category, displayName };
  };

  const badgeInfo = getBadgeStyle();

  const isDistanceSensor = nodeType === 'hc-sr04';
  const isAnalogSensor = ['potentiometer', 'slide-potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(nodeType);
  const isBuzzer = nodeType === 'buzzer';

  const hasControls = selectedNode
    ? !!(isDistanceSensor || isAnalogSensor || isBuzzer || ['led', 'led-ring', 'led-bar-graph'].includes(nodeType) || nodeType === 'ir-receiver' || ['stepper-motor', 'stepperMotor'].includes(nodeType))
    : !!selectedEdge;

  const hexToRgb = (hex: string) => {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const getCategoryIcon = (categoryName: string, primaryColor: string) => {
    const size = 13;
    const style = { color: primaryColor };
    const category = categoryName.toUpperCase();
    if (category.includes('MOTOR') || category.includes('ACTUATOR')) return <Zap size={size} style={style} className="animate-[pulse_1.5s_infinite]" />;
    else if (category.includes('SENSOR')) return <Radio size={size} style={style} className="animate-[pulse_1.5s_infinite]" />;
    else if (category.includes('DISPLAY') || category.includes('OUTPUT') || category.includes('LIGHT')) return <Sparkles size={size} style={style} className="animate-[pulse_1.5s_infinite]" />;
    else if (category.includes('BOARD') || category.includes('MCU') || category.includes('CHIP')) return <Cpu size={size} style={style} className="animate-[pulse_1.5s_infinite]" />;
    else if (category.includes('POWER')) return <Power size={size} style={style} className="animate-[pulse_1.5s_infinite]" />;
    else if (category.includes('INPUT') || category.includes('CONTROL')) return <Sliders size={size} style={style} className="animate-[pulse_1.5s_infinite]" />;
    else return <Zap size={size} style={style} className="animate-[pulse_1.5s_infinite]" />;
  };

  const renderSlider = () => {
    if (!isDistanceSensor && !isAnalogSensor && !isBuzzer) return null;
    let config: any;
    if (isDistanceSensor) config = { label: 'Distance', unit: 'cm', min: 2, max: 400, step: 0.1, default: 100, key: 'distance' };
    else if (nodeType === 'potentiometer' || nodeType === 'slide-potentiometer') config = { label: 'Resistance', unit: '', min: 0, max: 1023, step: 1, default: 0, key: 'value' };
    else if (nodeType === 'resistor') config = { label: 'Resistance', unit: 'Ω', min: 0, max: 1000000, step: 100, default: 1000, key: 'value' };
    else if (nodeType === 'photoresistor') config = { label: 'Light', unit: 'lux', min: 0, max: 1000, step: 1, default: 500, key: 'value' };
    else if (nodeType === 'ntc-temperature-sensor') config = { label: 'Temp', unit: '°C', min: -40, max: 125, step: 0.5, default: 25, key: 'value' };
    else if (isBuzzer) config = { label: 'Volume', unit: '', min: 0.01, max: 1.0, step: 0.01, default: 1.0, key: 'volume', isTopLevel: true };
    else config = { label: 'Value', unit: '', min: 0, max: 1023, step: 1, default: 512, key: 'value' };

    const currentValue = config.isTopLevel ? (selectedNode?.data?.[config.key] ?? config.default ?? config.min) : (currentValues?.[config.key] ?? config.default ?? config.min);
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (config.isTopLevel) updateNodeData(selectedNode!.id, { [config.key]: val });
      else updateNodeData(selectedNode!.id, { sensorValues: { ...currentValues, [config.key]: val } });
    };
    const sliderPercent = ((currentValue - config.min) / (config.max - config.min)) * 100;

    return (
      <div className="flex items-center gap-[12px] bg-[rgba(15,23,42,0.45)] p-[6px_14px] rounded-[10px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
        <Sliders size={13} className="text-slate-400 opacity-80" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] min-w-[70px]">{config.label}</span>
        <input type="range" min={config.min} max={config.max} step={config.step ?? 1} value={currentValue} onChange={handleSliderChange} className="w-[120px] custom-slider-input" style={{ background: `linear-gradient(to right, ${badgeInfo.primary} 0%, ${badgeInfo.primary} ${sliderPercent}%, rgba(255,255,255,0.08) ${sliderPercent}%, rgba(255,255,255,0.08) 100%)` }} />
        <input type="number" value={currentValue} min={config.min} max={config.max} step={config.step ?? 1} onChange={handleSliderChange} className="w-[72px] bg-[rgba(8,9,12,0.75)] border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_10px] text-[11px] text-cyan-400 font-bold text-right outline-none focus:border-cyan-400 font-mono" />
        {config.unit && <span className="text-[10px] font-black text-cyan-400/80 bg-[rgba(34,211,238,0.08)] px-[6px] py-[2px] rounded-[4px] border border-solid border-[rgba(34,211,238,0.15)]" style={{ fontFamily: "'Space Mono', sans-serif" }}>{config.unit}</span>}
      </div>
    );
  };

  const WIRE_COLORS = [{ name: 'Red', color: '#ef4444' }, { name: 'Black', color: '#000000' }, { name: 'Green', color: '#22c55e' }, { name: 'Blue', color: '#3b82f6' }, { name: 'Yellow', color: '#eab308' }, { name: 'White', color: '#ffffff' }];
  const LED_COLORS = [{ name: 'Red', color: 'red' }, { name: 'Green', color: '#10b981' }, { name: 'Blue', color: '#3b82f6' }, { name: 'Yellow', color: '#eab308' }, { name: 'White', color: '#ffffff' }];

  const renderLEDColorPalette = () => {
    if (nodeType !== 'led' && nodeType !== 'led-ring' && nodeType !== 'led-bar-graph') return null;
    return (
      <div className="flex gap-[10px] items-center bg-[rgba(15,23,42,0.45)] p-[6px_14px] rounded-[10px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px]">LED COLOR</span>
        <div className="flex gap-[6px] items-center">
          {LED_COLORS.map((lc) => (
            <button key={lc.color} onClick={() => updateNodeData(selectedNode!.id, { color: lc.color })} title={lc.name} className={`w-[18px] h-[18px] rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.25] hover:-translate-y-[2px] active:scale-95 border border-solid border-[rgba(255,255,255,0.2)] ${selectedNode?.data?.color === lc.color ? 'border-2 border-solid border-cyan-400 scale-[1.15] shadow-[0_0_10px_rgba(34,211,238,0.6)]' : ''}`} style={{ backgroundColor: lc.color }} />
          ))}
        </div>
      </div>
    );
  };

  const renderColorPalette = () => {
    if (!selectedEdge) return null;
    return (
      <div className="flex gap-[10px] items-center bg-[rgba(15,23,42,0.45)] p-[6px_14px] rounded-[10px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
        <div className="flex gap-[6px] items-center">
          {WIRE_COLORS.map((wc) => (
            <button key={wc.color} onClick={() => updateEdgeData(selectedEdge.id, { color: wc.color })} title={wc.name} className={`w-[18px] h-[18px] rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.25] hover:-translate-y-[2px] active:scale-95 border border-solid border-[rgba(255,255,255,0.2)] ${selectedEdge.data?.color === wc.color ? 'border-2 border-solid border-cyan-400 scale-[1.15] shadow-[0_0_10px_rgba(34,211,238,0.6)]' : ''}`} style={{ backgroundColor: wc.color }} />
          ))}
        </div>
      </div>
    );
  };

  const renderIRReceiverInput = () => {
    if (nodeType !== 'ir-receiver') return null;
    return (
      <div className="flex gap-[10px] items-center bg-[rgba(15,23,42,0.45)] p-[6px_14px] rounded-[10px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
        <Radio size={13} className="text-cyan-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px]">ADDR</span>
        <input type="text" value={irAddress} onChange={(e) => setIrAddress(e.target.value)} className="w-[36px] bg-[rgba(8,9,12,0.75)] text-cyan-400 border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_8px] text-[11px] text-center outline-none focus:border-cyan-400 font-mono" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">CMD</span>
        <input type="text" value={irCommand} onChange={(e) => setIrCommand(e.target.value)} className="w-[38px] bg-[rgba(8,9,12,0.75)] text-cyan-400 border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_8px] text-[11px] text-center outline-none focus:border-cyan-400 font-mono" />
        <button onClick={() => { const addr = parseInt(irAddress) || 0; const cmd = parseInt(irCommand) || 0; if (selectedNode?.id) import('../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => circuitEngine.sendIRSignalToReceiver(selectedNode.id, addr, cmd)); }} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:scale-95 text-slate-950 border-none p-[5px_12px] rounded-[8px] text-[10px] font-black cursor-pointer uppercase transition-all shadow-[0_0_8px_rgba(34,211,238,0.2)]">Send</button>
      </div>
    );
  };

  const renderStepperControls = () => {
    if (nodeType !== 'stepper-motor' && nodeType !== 'stepperMotor') return null;
    const currentSize = selectedNode?.data?.size ?? '23';
    const currentDisplay = selectedNode?.data?.display ?? 'steps';
    const currentGearRatio = selectedNode?.data?.gearRatio ?? '1:1';
    const currentArrow = selectedNode?.data?.arrow ?? '';
    const sizes = ['8', '11', '14', '17', '23', '34'].map(s => ({ value: s, label: `NEMA ${s}` }));
    const displays = [{ value: 'steps', label: 'Steps' }, { value: 'angle', label: 'Angle' }, { value: 'none', label: 'None' }];
    const gearRatios = ['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'].map(g => ({ value: g, label: g }));
    const gearOptions = [...gearRatios];
    if (!['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'].includes(currentGearRatio)) gearOptions.push({ value: currentGearRatio, label: `${currentGearRatio} (Custom)` });
    gearOptions.push({ value: 'custom', label: 'Custom...' });
    const arrowColors = [{ value: '', label: 'Dynamic (Orange)' }, { value: 'none', label: 'None (Hidden)' }, { value: 'orange', label: 'Orange' }, { value: 'white', label: 'White' }, { value: 'green', label: 'Green' }, { value: 'blue', label: 'Blue' }, { value: 'yellow', label: 'Yellow' }, { value: 'red', label: 'Red' }];

    return (
      <div className="flex gap-[12px] items-center bg-[rgba(15,23,42,0.45)] p-[6px_14px] rounded-[10px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px]">SIZE</span>
        <CustomSelect value={currentSize} onChange={(val) => updateNodeData(selectedNode!.id, { size: parseInt(val) || 23 })} options={sizes} primaryColor={badgeInfo.primary} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">DISP</span>
        <CustomSelect value={currentDisplay} onChange={(val) => updateNodeData(selectedNode!.id, { display: val })} options={displays} primaryColor={badgeInfo.primary} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">GEAR</span>
        <div className="flex items-center gap-[6px]">
          <CustomSelect value={gearOptions.some(opt => opt.value === currentGearRatio) ? currentGearRatio : 'custom'} onChange={(val) => { if (val !== 'custom') updateNodeData(selectedNode!.id, { gearRatio: val }); }} options={gearOptions} primaryColor={badgeInfo.primary} />
          {(currentGearRatio === 'custom' || !['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'].includes(currentGearRatio)) && <input type="text" value={currentGearRatio === 'custom' ? '' : currentGearRatio} onChange={(e) => updateNodeData(selectedNode!.id, { gearRatio: e.target.value })} className="w-[56px] bg-[rgba(8,9,12,0.75)] text-cyan-400 border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_8px] text-[11px] outline-none focus:border-cyan-400 font-mono" />}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">ARROW</span>
        <CustomSelect value={currentArrow} onChange={(val) => updateNodeData(selectedNode!.id, { arrow: val })} options={arrowColors} primaryColor={badgeInfo.primary} />
      </div>
    );
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-[1000] flex items-center bg-[#0c0d12] p-[8px] rounded-[12px] border border-solid transition-all duration-300 ease-out"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        borderColor: `${badgeInfo.primary}25`,
        boxShadow: `0 16px 36px rgba(0,0,0,0.8), 0 0 20px 1px ${badgeInfo.primary}10, inset 0 1px 0 rgba(255,255,255,0.05)`
      }}
    >
      <style>{`
        @keyframes slideUp { from { transform: translate(-50%, 28px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes slideDropdownUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .custom-slider-input {
          -webkit-appearance: none;
          width: 120px;
          background: rgba(255, 255, 255, 0.06);
          height: 4px;
          border-radius: 2px;
          outline: none;
        }
        .custom-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 3px;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 8px var(--primary-color, #22d3ee), 0 1px 2px rgba(0,0,0,0.6);
          border: 2px solid var(--primary-color, #22d3ee);
          transition: transform 0.15s ease;
        }
        .custom-slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .custom-slider-input::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid var(--primary-color, #22d3ee);
          box-shadow: 0 0 8px var(--primary-color, #22d3ee), 0 1px 2px rgba(0,0,0,0.6);
          transition: transform 0.15s ease;
        }
        .custom-slider-input::-moz-range-thumb:hover {
          transform: scale(1.15);
        }

        .icon-box-plate {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 6px;
          transition: transform 0.2s ease;
        }
        .group:hover .icon-box-plate {
          transform: scale(1.05);
        }

        .chip-id-plate {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
          cursor: default;
        }
        .chip-id-plate:hover {
          border-color: rgba(255, 255, 255, 0.12);
        }
      `}</style>

      {selectedNode ? (
        <>
          <div className="flex items-center select-none">
            <div
              className="group chip-id-plate"
              style={{
                background: `linear-gradient(90deg, rgba(${hexToRgb(badgeInfo.primary)}, 0.05) 0%, rgba(12, 13, 18, 0.8) 100%)`,
                borderLeft: `2.5px solid ${badgeInfo.primary}`
              }}
            >
              <div className="flex items-center gap-[12px] p-[8px_16px_8px_10px]">
                <div
                  className="icon-box-plate"
                  style={{
                    background: `rgba(${hexToRgb(badgeInfo.primary)}, 0.1)`,
                    border: `1px solid ${badgeInfo.primary}30`,
                    boxShadow: `inset 0 1px 2px rgba(0,0,0,0.5), 0 0 10px ${badgeInfo.primary}15`
                  }}
                >
                  {getCategoryIcon(badgeInfo.category, badgeInfo.primary)}
                </div>
                <div className="flex flex-col gap-[3px]">
                  <div className="flex items-center gap-[6px]">
                    <span className="text-[7.5px] font-black tracking-[1.5px] uppercase leading-none" style={{ color: `${badgeInfo.primary}bf` }}>{badgeInfo.category}</span>
                    <span className="text-[7px] font-extrabold px-[4px] py-[1px] rounded-[3px] border border-solid tracking-[0.5px] leading-none uppercase" style={{ color: badgeInfo.primary, backgroundColor: `${badgeInfo.primary}15`, borderColor: `${badgeInfo.primary}30` }}>
                      {getStatusLabel(badgeInfo.category)}
                    </span>
                  </div>
                  <span className="text-[12px] font-black text-slate-100 tracking-[0.5px] leading-none uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {badgeInfo.displayName}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {hasControls && (
            <>
              <div className="w-[1px] h-[22px] bg-[rgba(255,255,255,0.08)] self-center mx-[10px]" />
              <div className="flex gap-[12px] items-center">{renderSlider()}{renderLEDColorPalette()}{renderIRReceiverInput()}{renderStepperControls()}</div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center select-none">
            <div
              className="group chip-id-plate"
              style={{
                background: `linear-gradient(90deg, rgba(${hexToRgb(badgeInfo.primary)}, 0.05) 0%, rgba(12, 13, 18, 0.8) 100%)`,
                borderLeft: `2.5px solid ${badgeInfo.primary}`
              }}
            >
              <div className="flex items-center gap-[12px] p-[8px_16px_8px_10px]">
                <div
                  className="icon-box-plate"
                  style={{
                    background: `rgba(${hexToRgb(badgeInfo.primary)}, 0.1)`,
                    border: `1px solid ${badgeInfo.primary}30`,
                    boxShadow: `inset 0 1px 2px rgba(0,0,0,0.5), 0 0 10px ${badgeInfo.primary}15`
                  }}
                >
                  {getCategoryIcon(badgeInfo.category, badgeInfo.primary)}
                </div>
                <div className="flex flex-col gap-[3px]">
                  <div className="flex items-center gap-[6px]">
                    <span className="text-[7.5px] font-black tracking-[1.5px] uppercase leading-none" style={{ color: `${badgeInfo.primary}bf` }}>{badgeInfo.category}</span>
                    <span className="text-[7px] font-extrabold px-[4px] py-[1px] rounded-[3px] border border-solid tracking-[0.5px] leading-none uppercase" style={{ color: badgeInfo.primary, backgroundColor: `${badgeInfo.primary}15`, borderColor: `${badgeInfo.primary}30` }}>
                      {getStatusLabel(badgeInfo.category)}
                    </span>
                  </div>
                  <span className="text-[12px] font-black text-slate-100 tracking-[0.5px] leading-none uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {badgeInfo.displayName}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {hasControls && (
            <>
              <div className="w-[1px] h-[22px] bg-[rgba(255,255,255,0.08)] self-center mx-[10px]" />
              <div className="flex gap-[10px] items-center">{renderColorPalette()}</div>
            </>
          )}
        </>
      )}

      {!(selectedNode && ['esp32-c3', 'esp32', 'arduino-uno'].includes(nodeType)) && (
        <>
          <div className="w-[1px] h-[22px] bg-[rgba(255,255,255,0.08)] self-center mx-[10px]" />
          <div className="flex gap-[8px] items-center">
            <button
              onClick={handleDelete}
              title="REMOVE ELEMENT"
              className="group relative flex items-center justify-center w-[36px] h-[36px] rounded-[8px] cursor-pointer border-none transition-all duration-200"
              style={{
                background: 'linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(244, 63, 94, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-0.5px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(244, 63, 94, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(244, 63, 94, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0.5px)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(244, 63, 94, 0.15)';
              }}
            >
              <Trash2 size={15} className="text-white transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
