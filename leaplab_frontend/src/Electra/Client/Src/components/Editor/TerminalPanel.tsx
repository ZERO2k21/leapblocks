import React from 'react';
import { Terminal, Wifi } from 'lucide-react';
import { SerialMonitor } from './SerialMonitor';
import { getSimulationRunner } from '../../../utlis/store/useForgeStore';

interface TerminalPanelProps {
  board: string;
  activeTab: 'code' | 'serial' | 'wifi' | 'libraries';
  setActiveTab: (tab: 'code' | 'serial' | 'wifi' | 'libraries') => void;
  serialOutput: string;
  clearSerial: () => void;
  wifiLog: string[];
  clearWiFiLog: () => void;
  isSimulating: boolean;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  board,
  activeTab,
  setActiveTab,
  serialOutput,
  clearSerial,
  wifiLog,
  clearWiFiLog,
  isSimulating,
}) => {
  const [height, setHeight] = React.useState<number>(240);
  const isDragging = React.useRef(false);
  const startY = React.useRef(0);
  const startHeight = React.useRef(240);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaY = startY.current - moveEvent.clientY;
      const newHeight = Math.max(100, Math.min(650, startHeight.current + deltaY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // If libraries tab is active, we don't display the terminal panel
  if (activeTab === 'libraries') return null;

  return (
    <div
      style={{ height: `${height}px` }}
      className="flex flex-col bg-slate-950 shrink-0 min-h-0 relative select-none border-t border-slate-800/80"
    >
      {/* Resizable handle at the top edge */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag to resize panel"
        className="absolute -top-1.5 left-0 right-0 h-3 cursor-ns-resize z-30 group flex items-center justify-center"
      >
        <div className="w-12 h-1 bg-slate-700/60 rounded-full group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_#22d3ee] transition-all duration-150" />
      </div>

      {/* Tab Header Bar */}
      <div className="flex items-center gap-1.5 px-4 h-8 bg-slate-950/40 backdrop-blur-md transition-all duration-300 shrink-0">
        <button
          type="button"
          className={`bg-transparent border-0 px-2.5 h-6 cursor-pointer text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'serial' || activeTab === 'code' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('serial')}
        >
          <Terminal size={14} /> SERIAL OUTPUT
          {serialOutput.length > 0 && <span className="w-1.5 h-1.5 rounded-full ml-1.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />}
        </button>

        {board === 'esp32-c3' && (
          <button
            type="button"
            className={`bg-transparent border-0 px-2.5 h-6 cursor-pointer text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'wifi' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('wifi')}
          >
            <Wifi size={14} /> WiFi LOG
            {wifiLog.length > 0 && <span className="w-1.5 h-1.5 rounded-full ml-1.5 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />}
          </button>
        )}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'wifi' ? (
          <div className="font-mono text-xs p-4 overflow-y-auto h-full bg-slate-950">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-[9px] font-bold tracking-wider">NETWORK LOG</span>
              <button 
                type="button"
                onClick={() => clearWiFiLog()} 
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer rounded-md transition-all duration-200 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950"
              >
                CLEAR
              </button>
            </div>
            {wifiLog.length === 0 ? (
              <div className="text-slate-600 text-center mt-5">No network activity.</div>
            ) : wifiLog.map((line, i) => (
              <div key={i} className={`mb-0.5 ${line.includes('ERROR') ? 'text-red-500' : 'text-slate-400'}`}>{line}</div>
            ))}
          </div>
        ) : (
          <SerialMonitor
            output={serialOutput}
            onClear={() => clearSerial()}
            onSend={async (data) => {
              const runner = await getSimulationRunner();
              if (runner && isSimulating) runner.sendSerialInput(data);
            }}
          />
        )}
      </div>
    </div>
  );
};
