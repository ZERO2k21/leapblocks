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

  return (
    <div ref={containerRef} className="relative select-none">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300 rounded-xl p-2 px-3 text-xs font-bold cursor-pointer transition-all duration-200 min-w-[90px]"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 bg-white border-2 border-slate-200 rounded-xl py-1.5 min-w-[130px] z-[2000] overflow-hidden shadow-lg animate-[slideDropdownUp_0.15s_ease-out]">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-xs cursor-pointer transition-colors duration-150 ${
                opt.value === value
                  ? 'font-bold bg-sky-50 text-sky-600'
                  : 'font-normal text-slate-600 hover:bg-slate-50'
              }`}
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
    const size = 18;
    const style = { color: primaryColor };
    const category = categoryName.toUpperCase();
    if (category.includes('MOTOR') || category.includes('ACTUATOR')) return <Zap size={size} style={style} strokeWidth={2.5} />;
    else if (category.includes('SENSOR')) return <Radio size={size} style={style} strokeWidth={2.5} />;
    else if (category.includes('DISPLAY') || category.includes('OUTPUT') || category.includes('LIGHT')) return <Sparkles size={size} style={style} strokeWidth={2.5} />;
    else if (category.includes('BOARD') || category.includes('MCU') || category.includes('CHIP')) return <Cpu size={size} style={style} strokeWidth={2.5} />;
    else if (category.includes('POWER')) return <Power size={size} style={style} strokeWidth={2.5} />;
    else if (category.includes('INPUT') || category.includes('CONTROL')) return <Sliders size={size} style={style} strokeWidth={2.5} />;
    else return <Zap size={size} style={style} strokeWidth={2.5} />;
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

    return (
      <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-200">
        <Sliders size={13} className="text-slate-500" />
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px] min-w-[55px]">{config.label}</span>
        <span className="text-[11px] text-slate-700 font-bold">{currentValue}{config.unit && <span className="ml-1 text-[9px] text-slate-500">{config.unit}</span>}</span>
      </div>
    );
  };

  const WIRE_COLORS = [{ name: 'Red', color: '#ef4444' }, { name: 'Black', color: '#000000' }, { name: 'Green', color: '#22c55e' }, { name: 'Blue', color: '#3b82f6' }, { name: 'Yellow', color: '#eab308' }, { name: 'White', color: '#ffffff' }];
  const LED_COLORS = [{ name: 'Red', color: 'red' }, { name: 'Green', color: '#10b981' }, { name: 'Blue', color: '#3b82f6' }, { name: 'Yellow', color: '#eab308' }, { name: 'White', color: '#ffffff' }];

  const renderLEDColorPalette = () => {
    if (nodeType !== 'led' && nodeType !== 'led-ring' && nodeType !== 'led-bar-graph') return null;
    return (
      <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-200">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px]">LED COLOR</span>
        <div className="flex gap-1.5 items-center">
          {LED_COLORS.map((lc) => (
            <button key={lc.color} onClick={() => updateNodeData(selectedNode!.id, { color: lc.color })} title={lc.name} className={`w-5 h-5 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-white shadow-sm ${selectedNode?.data?.color === lc.color ? 'ring-2 ring-blue-400 scale-110' : ''}`} style={{ backgroundColor: lc.color }} />
          ))}
        </div>
      </div>
    );
  };

  const renderColorPalette = () => {
    if (!selectedEdge) return null;
    return (
      <div className="flex items-center bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-200">
        <div className="flex gap-1.5 items-center">
          {WIRE_COLORS.map((wc) => (
            <button key={wc.color} onClick={() => updateEdgeData(selectedEdge.id, { color: wc.color })} title={wc.name} className={`w-5 h-5 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-white shadow-sm ${selectedEdge.data?.color === wc.color ? 'ring-2 ring-blue-400 scale-110' : ''}`} style={{ backgroundColor: wc.color }} />
          ))}
        </div>
      </div>
    );
  };

  const renderIRReceiverInput = () => {
    if (nodeType !== 'ir-receiver') return null;
    return (
      <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-200">
        <Radio size={13} className="text-blue-500" />
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px]">ADDR</span>
        <input type="text" value={irAddress} onChange={(e) => setIrAddress(e.target.value)} className="w-9 bg-white text-slate-700 border border-slate-200 rounded-md p-1 text-[11px] text-center outline-none focus:border-blue-400 font-mono font-bold" />
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px]">CMD</span>
        <input type="text" value={irCommand} onChange={(e) => setIrCommand(e.target.value)} className="w-10 bg-white text-slate-700 border border-slate-200 rounded-md p-1 text-[11px] text-center outline-none focus:border-blue-400 font-mono font-bold" />
        <button onClick={() => { const addr = parseInt(irAddress) || 0; const cmd = parseInt(irCommand) || 0; if (selectedNode?.id) import('../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => circuitEngine.sendIRSignalToReceiver(selectedNode.id, addr, cmd)); }} className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white border-none p-1 px-2.5 rounded-md text-[10px] font-bold cursor-pointer uppercase tracking-[0.5px] transition-all shadow-sm">Send</button>
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
      <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-200">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px]">SIZE</span>
        <CustomSelect value={currentSize} onChange={(val) => updateNodeData(selectedNode!.id, { size: parseInt(val) || 23 })} options={sizes} primaryColor={badgeInfo.primary} />
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px]">DISP</span>
        <CustomSelect value={currentDisplay} onChange={(val) => updateNodeData(selectedNode!.id, { display: val })} options={displays} primaryColor={badgeInfo.primary} />
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px]">GEAR</span>
        <div className="flex items-center gap-1.5">
          <CustomSelect value={gearOptions.some(opt => opt.value === currentGearRatio) ? currentGearRatio : 'custom'} onChange={(val) => { if (val !== 'custom') updateNodeData(selectedNode!.id, { gearRatio: val }); }} options={gearOptions} primaryColor={badgeInfo.primary} />
          {(currentGearRatio === 'custom' || !['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'].includes(currentGearRatio)) && <input type="text" value={currentGearRatio === 'custom' ? '' : currentGearRatio} onChange={(e) => updateNodeData(selectedNode!.id, { gearRatio: e.target.value })} className="w-12 bg-white text-slate-700 border border-slate-200 rounded-md p-1 text-[11px] outline-none focus:border-blue-400 font-mono font-bold" />}
        </div>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px]">ARROW</span>
        <CustomSelect value={currentArrow} onChange={(val) => updateNodeData(selectedNode!.id, { arrow: val })} options={arrowColors} primaryColor={badgeInfo.primary} />
      </div>
    );
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] flex items-center bg-white p-1.5 px-2.5 rounded-xl border border-slate-200 transition-all duration-200 ease-out shadow-[0_6px_20px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.06)] animate-[slideUp_0.25s_ease-out]"
    >
      <style>{`
        @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes slideDropdownUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .custom-slider-input {
          -webkit-appearance: none;
          width: 120px;
          height: 8px;
          border-radius: 4px;
          outline: none;
        }
        .custom-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 3px solid var(--primary-color, #3b82f6);
          transition: transform 0.15s ease;
        }
        .custom-slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .custom-slider-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid var(--primary-color, #3b82f6);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.15s ease;
        }
        .custom-slider-input::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>

      {selectedNode ? (
        <>
          <div className="flex items-center select-none">
            <div className="group relative rounded-xl bg-white border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-default">
              <div className="flex items-center gap-2.5 p-1.5 px-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${badgeInfo.primary}18 0%, ${badgeInfo.primary}10 100%)`,
                    borderColor: `${badgeInfo.primary}35`
                  }}
                >
                  {getCategoryIcon(badgeInfo.category, badgeInfo.primary)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-extrabold text-slate-800 tracking-wide leading-tight uppercase font-sans">
                    {badgeInfo.displayName}
                  </span>
                  <span
                    className="text-[9px] font-bold tracking-wider leading-none uppercase"
                    style={{ color: badgeInfo.primary }}
                  >
                    {badgeInfo.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {hasControls && (
            <>
              <div className="w-0.5 h-6 bg-slate-200 rounded-full self-center mx-2.5" />
              <div className="flex gap-2 items-center">{renderSlider()}{renderLEDColorPalette()}{renderIRReceiverInput()}{renderStepperControls()}</div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center select-none">
            <div className="group relative rounded-xl bg-white border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
              <div className="flex items-center gap-2.5 p-1.5 px-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${badgeInfo.primary}18 0%, ${badgeInfo.primary}10 100%)`,
                    borderColor: `${badgeInfo.primary}35`
                  }}
                >
                  {getCategoryIcon(badgeInfo.category, badgeInfo.primary)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-extrabold text-slate-800 tracking-wide leading-tight uppercase font-sans">
                    {badgeInfo.displayName}
                  </span>
                  <span
                    className="text-[9px] font-bold tracking-wider leading-none uppercase"
                    style={{ color: badgeInfo.primary }}
                  >
                    {badgeInfo.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {hasControls && (
            <>
              <div className="w-0.5 h-6 bg-slate-200 rounded-full self-center mx-2.5" />
              <div className="flex gap-2 items-center">{renderColorPalette()}</div>
            </>
          )}
        </>
      )}

      {!(selectedNode && ['esp32-c3', 'esp32', 'arduino-uno'].includes(nodeType)) && (
        <>
          <div className="w-0.5 h-6 bg-slate-200 rounded-full self-center mx-2.5" />
          <div className="flex items-center">
            <button
              onClick={handleDelete}
              title="Remove"
              className="group relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer border border-red-200 bg-red-50 transition-all duration-200 hover:bg-red-100 hover:border-red-300 hover:scale-105 active:scale-95"
            >
              <Trash2 size={15} className="text-red-500 transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
