/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { useForgeStore } from '../../utlis/store/useForgeStore';
import { Trash2, Sliders, Radio, Zap, ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options }) => {
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
        className="flex items-center justify-between gap-[8px] bg-[rgba(8,9,12,0.85)] hover:bg-[rgba(15,23,42,0.95)] text-cyan-400 border border-solid border-[rgba(255,255,255,0.1)] hover:border-cyan-400/50 rounded-[8px] p-[6px_12px] text-[11px] font-bold cursor-pointer transition-all duration-200 min-w-[80px]"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={12} className={`text-cyan-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 bg-[rgba(10,11,14,0.98)] border border-solid border-cyan-400/30 rounded-[10px] shadow-[0_12px_28px_rgba(0,0,0,0.6)] py-[5px] min-w-[130px] z-[2000] overflow-hidden animate-[slideDropdownUp_0.18s_cubic-bezier(0.16,1,0.3,1)]">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`p-[6px_12px] text-[11px] font-semibold cursor-pointer transition-colors duration-150 ${
                opt.value === value
                  ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
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

  const isDistanceSensor = nodeType === 'hc-sr04';
  const isAnalogSensor = ['potentiometer', 'slide-potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(nodeType);
  const isBuzzer = nodeType === 'buzzer';

  const handleDelete = () => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      setSelectedNode(null);
    } else if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
      setSelectedEdge(null);
    }
  };

  const renderSlider = () => {
    if (!isDistanceSensor && !isAnalogSensor && !isBuzzer) return null;

    let config: any;
    if (isDistanceSensor) {
      config = { label: 'Distance', unit: 'cm', min: 2, max: 400, step: 0.1, default: 100, key: 'distance' };
    } else if (nodeType === 'potentiometer' || nodeType === 'slide-potentiometer') {
      config = { label: 'Resistance', unit: '', min: 0, max: 1023, step: 1, default: 0, key: 'value' };
    } else if (nodeType === 'resistor') {
      config = { label: 'Resistance', unit: 'Ω', min: 0, max: 1000000, step: 100, default: 1000, key: 'value' };
    } else if (nodeType === 'photoresistor') {
      config = { label: 'Light', unit: 'lux', min: 0, max: 1000, step: 1, default: 500, key: 'value' };
    } else if (nodeType === 'ntc-temperature-sensor') {
      config = { label: 'Temp', unit: '°C', min: -40, max: 125, step: 0.5, default: 25, key: 'value' };
    } else if (isBuzzer) {
      config = { label: 'Volume', unit: '', min: 0.01, max: 1.0, step: 0.01, default: 1.0, key: 'volume', isTopLevel: true };
    } else {
      config = { label: 'Value', unit: '', min: 0, max: 1023, step: 1, default: 512, key: 'value' };
    }

    const currentValue = config.isTopLevel
      ? (selectedNode?.data?.[config.key] ?? config.default ?? config.min)
      : (currentValues?.[config.key] ?? config.default ?? config.min);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (config.isTopLevel) {
        updateNodeData(selectedNode!.id, { [config.key]: val });
      } else {
        updateNodeData(selectedNode!.id, {
          sensorValues: { ...currentValues, [config.key]: val }
        });
      }

      if (isAnalogSensor && selectedNode?.id) {
        import('../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
          const pinName = nodeType === 'ntc-temperature-sensor' ? 'OUT'
            : (nodeType === 'photoresistor' || nodeType === 'photoresistor-sensor') ? 'AO'
              : (nodeType === 'potentiometer' || nodeType === 'slide-potentiometer') ? 'SIG'
                : 'OUT';
          circuitEngine.pushInputSignal(selectedNode.id, pinName, true);
        });
      }
    };

    const sliderPercent = ((currentValue - config.min) / (config.max - config.min)) * 100;

    return (
      <div className="flex items-center gap-[12px] bg-[rgba(15,23,42,0.4)] p-[6px_14px] rounded-[12px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        <Sliders size={13} className="text-cyan-400 animate-pulse" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] min-w-[70px]">{config.label}</span>
        
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step ?? (config.min < 1 ? 0.01 : 1)}
          value={currentValue}
          onChange={handleSliderChange}
          className="w-[120px] custom-slider-input"
          style={{
            background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${sliderPercent}%, rgba(255,255,255,0.08) ${sliderPercent}%, rgba(255,255,255,0.08) 100%)`
          }}
        />
        
        <input
          type="number"
          value={currentValue}
          min={config.min}
          max={config.max}
          step={config.step ?? (config.min < 1 ? 0.01 : 1)}
          onChange={handleSliderChange}
          className="w-[72px] bg-[rgba(8,9,12,0.7)] border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_10px] text-[11px] text-cyan-400 font-bold text-right outline-none transition-all focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.2)]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        />

        {config.unit && (
          <span className="text-[10px] font-black text-cyan-400/80 bg-[rgba(34,211,238,0.08)] px-[6px] py-[2px] rounded-[4px] border border-solid border-[rgba(34,211,238,0.15)]" style={{ fontFamily: "'Space Mono', sans-serif" }}>
            {config.unit}
          </span>
        )}
      </div>
    );
  };

  const WIRE_COLORS = [
    { name: 'Red', color: '#ef4444' },
    { name: 'Black', color: '#000000' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'White', color: '#ffffff' },
  ];

  const LED_COLORS = [
    { name: 'Red', color: 'red' },
    { name: 'Green', color: '#10b981' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'White', color: '#ffffff' },
  ];

  const renderLEDColorPalette = () => {
    if (nodeType !== 'led' && nodeType !== 'led-ring' && nodeType !== 'led-bar-graph') return null;
    return (
      <div className="flex gap-[10px] items-center bg-[rgba(15,23,42,0.4)] p-[6px_14px] rounded-[12px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px]">LED_COLOR</span>
        <div className="flex gap-[6px] items-center">
          {LED_COLORS.map((lc) => (
            <button
              key={lc.color}
              onClick={() => updateNodeData(selectedNode!.id, { color: lc.color })}
              title={lc.name}
              className={`w-[18px] h-[18px] rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.2] active:scale-90 ${
                selectedNode?.data?.color === lc.color 
                  ? 'border-2 border-solid border-cyan-400 scale-[1.1] shadow-[0_0_10px_rgba(34,211,238,0.6)]' 
                  : 'border border-solid border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.5)]'
              }`}
              style={{ backgroundColor: lc.color }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderColorPalette = () => {
    if (!selectedEdge) return null;
    return (
      <div className="flex gap-[10px] items-center bg-[rgba(15,23,42,0.4)] p-[6px_14px] rounded-[12px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        <div className="flex gap-[6px] items-center">
          {WIRE_COLORS.map((wc) => (
            <button
              key={wc.color}
              onClick={() => updateEdgeData(selectedEdge.id, { color: wc.color })}
              title={wc.name}
              className={`w-[18px] h-[18px] rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.2] active:scale-90 ${
                selectedEdge.data?.color === wc.color 
                  ? 'border-2 border-solid border-cyan-400 scale-[1.1] shadow-[0_0_10px_rgba(34,211,238,0.6)]' 
                  : 'border border-solid border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.5)]'
              }`}
              style={{ backgroundColor: wc.color }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderIRReceiverInput = () => {
    if (nodeType !== 'ir-receiver') return null;
    return (
      <div className="flex gap-[10px] items-center bg-[rgba(15,23,42,0.4)] p-[6px_14px] rounded-[12px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        <Radio size={13} className="text-cyan-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px]">ADDR</span>
        <input
          type="text"
          value={irAddress}
          onChange={(e) => setIrAddress(e.target.value)}
          title="IR Address (0-255)"
          className="w-[36px] bg-[rgba(8,9,12,0.7)] text-cyan-400 border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_8px] text-[11px] text-center outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.2)]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">CMD</span>
        <input
          type="text"
          value={irCommand}
          onChange={(e) => setIrCommand(e.target.value)}
          title="IR Command (0-255)"
          className="w-[38px] bg-[rgba(8,9,12,0.7)] text-cyan-400 border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_8px] text-[11px] text-center outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.2)]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        />
        <button
          onClick={() => {
            const addr = parseInt(irAddress) || 0;
            const cmd = parseInt(irCommand) || 0;
            if (selectedNode?.id) {
              import('../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
                circuitEngine.sendIRSignalToReceiver(selectedNode.id, addr, cmd);
              });
            }
          }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:scale-95 text-slate-950 border-none p-[5px_12px] rounded-[8px] text-[10px] font-black cursor-pointer uppercase transition-all shadow-[0_0_8px_rgba(34,211,238,0.2)]"
        >
          Send
        </button>
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
    const displays = [
      { value: 'steps', label: 'Steps' },
      { value: 'angle', label: 'Angle' },
      { value: 'none', label: 'None' }
    ];
    const gearRatios = ['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'].map(g => ({ value: g, label: g }));
    
    // Add custom selection option if customized
    const gearOptions = [...gearRatios];
    if (!['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'].includes(currentGearRatio)) {
      gearOptions.push({ value: currentGearRatio, label: `${currentGearRatio} (Custom)` });
    }
    gearOptions.push({ value: 'custom', label: 'Custom...' });

    const arrowColors = [
      { value: '', label: 'Dynamic (Orange)' },
      { value: 'none', label: 'None (Hidden)' },
      { value: 'orange', label: 'Orange' },
      { value: 'white', label: 'White' },
      { value: 'green', label: 'Green' },
      { value: 'blue', label: 'Blue' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'red', label: 'Red' }
    ];

    return (
      <div className="flex gap-[12px] items-center bg-[rgba(15,23,42,0.4)] p-[6px_14px] rounded-[12px] border border-solid border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {/* Size Selector */}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px]">SIZE</span>
        <CustomSelect
          value={currentSize}
          onChange={(val) => updateNodeData(selectedNode!.id, { size: parseInt(val) || 23 })}
          options={sizes}
        />

        {/* Display Selector */}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">DISP</span>
        <CustomSelect
          value={currentDisplay}
          onChange={(val) => updateNodeData(selectedNode!.id, { display: val })}
          options={displays}
        />

        {/* Gear Ratio Selector */}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">GEAR</span>
        <div className="flex items-center gap-[6px]">
          <CustomSelect
            value={gearOptions.some(opt => opt.value === currentGearRatio) ? currentGearRatio : 'custom'}
            onChange={(val) => {
              if (val !== 'custom') {
                updateNodeData(selectedNode!.id, { gearRatio: val });
              }
            }}
            options={gearOptions}
          />

          {(currentGearRatio === 'custom' || !['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'].includes(currentGearRatio)) && (
            <input
              type="text"
              placeholder="e.g. 5:1"
              value={currentGearRatio === 'custom' ? '' : currentGearRatio}
              onChange={(e) => updateNodeData(selectedNode!.id, { gearRatio: e.target.value })}
              className="w-[56px] bg-[rgba(8,9,12,0.7)] text-cyan-400 border border-solid border-[rgba(255,255,255,0.1)] rounded-[8px] p-[5px_8px] text-[11px] outline-none focus:border-cyan-400"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          )}
        </div>

        {/* Arrow Color Selector */}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] ml-[4px]">ARROW</span>
        <CustomSelect
          value={currentArrow}
          onChange={(val) => updateNodeData(selectedNode!.id, { arrow: val })}
          options={arrowColors}
        />
      </div>
    );
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-[16px] bg-[rgba(10,11,14,0.85)] p-[12px_22px] rounded-[24px] border border-solid border-[rgba(34,211,238,0.18)] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7),0_0_30px_4px_rgba(34,211,238,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 28px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @keyframes slideDropdownUp {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* World class custom range slider style overrides */
        .custom-slider-input {
          -webkit-appearance: none;
          width: 120px;
          background: rgba(255, 255, 255, 0.08);
          height: 5px;
          border-radius: 4px;
          outline: none;
          transition: background 0.2s;
        }
        .custom-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
          box-shadow: 0 0 10px #22d3ee, 0 0 4px rgba(34,211,238,0.5);
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .custom-slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.35);
        }
        .custom-slider-input::-moz-range-thumb {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px #22d3ee, 0 0 4px rgba(34,211,238,0.5);
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .custom-slider-input::-moz-range-thumb:hover {
          transform: scale(1.35);
        }
      `}</style>

      {selectedNode ? (
        <>
          <div className="flex items-center gap-[10px] select-none">
            <span className="flex items-center gap-[8px] text-[10px] font-black text-cyan-400 tracking-[1.5px] bg-[rgba(34,211,238,0.12)] px-[14px] py-[6px] rounded-[30px] border border-solid border-[rgba(34,211,238,0.25)] whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.06)]">
              <Zap size={11} className="text-cyan-400 animate-pulse" />
              {selectedNode?.data?.type.replace(/-/g, ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="w-px h-[24px] bg-[rgba(255,255,255,0.12)] self-center mx-[2px]" />
          
          <div className="flex gap-[12px] items-center">
            {renderSlider()}
            {renderLEDColorPalette()}
            {renderIRReceiverInput()}
            {renderStepperControls()}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-[10px] select-none">
            <span className="flex items-center gap-[8px] text-[10px] font-black text-cyan-400 tracking-[1.5px] bg-[rgba(34,211,238,0.12)] px-[14px] py-[6px] rounded-[30px] border border-solid border-[rgba(34,211,238,0.25)] whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.06)]">
              <Zap size={11} className="text-cyan-400" />
              WIRE SPEC
            </span>
          </div>
          
          <div className="w-px h-[24px] bg-[rgba(255,255,255,0.12)] self-center mx-[2px]" />
          
          <div className="flex gap-[8px] items-center">
            {renderColorPalette()}
          </div>
        </>
      )}

      {/* Hide delete for board elements — they are essential */}
      {!(selectedNode && ['esp32-c3', 'esp32', 'arduino-uno'].includes(nodeType)) && (
        <>
          <div className="w-px h-[24px] bg-[rgba(255,255,255,0.12)] self-center mx-[2px]" />
          <div className="flex gap-[8px] items-center">
            <button
              onClick={handleDelete}
              title="REMOVE_ELEMENT"
              className="bg-[rgba(244,63,94,0.06)] hover:bg-[rgba(244,63,94,0.14)] border border-solid border-[rgba(244,63,94,0.35)] hover:border-[rgba(244,63,94,0.7)] text-[#fb7185] p-[7px_16px] rounded-[12px] cursor-pointer text-[11px] font-black flex items-center gap-[6px] transition-all duration-[0.25s] ease-out shadow-[0_2px_8px_rgba(244,63,94,0.04)] hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            >
              <Trash2 size={13} className="transition-transform duration-200 group-hover:rotate-6" />
              DELETE
            </button>
          </div>
        </>
      )}
    </div>
  );
};
