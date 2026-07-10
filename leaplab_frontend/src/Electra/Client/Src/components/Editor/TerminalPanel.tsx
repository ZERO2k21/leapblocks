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
  // If libraries tab is active, we don't display the terminal panel
  if (activeTab === 'libraries') return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--lp-dark-bg)', minHeight: 0 }}>
      {/* Tab Header Bar */}
      <div className="flex items-center gap-1.5 px-4 relative backdrop-blur-[12px] transition-all duration-300" style={{ height: 32, background: 'rgba(10, 11, 14, 0.15)', borderTop: '1px solid var(--lp-border)' }}>
        <button
          className={`bg-transparent border-none px-2.5 h-[24px] cursor-pointer text-[10px] font-bold flex items-center gap-1.5 rounded-none uppercase tracking-[0.8px] relative transition-all duration-200 ${activeTab === 'serial' || activeTab === 'code' ? 'text-[var(--lp-accent-bright)]' : 'text-[var(--lp-zinc-400)]'}`}
          onClick={() => setActiveTab('serial')}
        >
          <Terminal size={14} /> SERIAL OUTPUT
          {serialOutput.length > 0 && <span className="w-[6px] h-[6px] rounded-full animate-[pulse-dot_1.5s_ease-in-out_infinite]" style={{ marginLeft: 6, background: 'var(--lp-rose)', boxShadow: '0 0 8px var(--lp-rose)' }} />}
        </button>

        {board === 'esp32-c3' && (
          <button
            className={`bg-transparent border-none px-2.5 h-[24px] cursor-pointer text-[10px] font-bold flex items-center gap-1.5 rounded-none uppercase tracking-[0.8px] relative transition-all duration-200 ${activeTab === 'wifi' ? 'text-[var(--lp-accent-bright)]' : 'text-[var(--lp-zinc-400)]'}`}
            onClick={() => setActiveTab('wifi')}
          >
            <Wifi size={14} /> WiFi LOG
            {wifiLog.length > 0 && <span className="w-[6px] h-[6px] rounded-full animate-[pulse-dot_1.5s_ease-in-out_infinite]" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981', marginLeft: 6 }} />}
          </button>
        )}
      </div>

      {/* Tab Content Panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'wifi' ? (
          <div style={{ fontFamily: 'var(--code-font, "JetBrains Mono", monospace)', fontSize: 12, padding: 16, overflowY: 'auto', height: '100%', background: 'var(--lp-dark-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--lp-zinc-400)', fontSize: 9, fontWeight: 700, letterSpacing: '0.5px' }}>NETWORK LOG</span>
              <button onClick={() => clearWiFiLog()} className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.5px] cursor-pointer rounded-[var(--lp-radius-sm)] transition-all duration-200 hover:bg-[var(--lp-accent-primary)] hover:text-[var(--lp-btn-text,#000)]" style={{ background: 'var(--lp-wifi-clear-bg, rgba(34, 211, 238, 0.1))', border: '1px solid var(--lp-wifi-clear-border, rgba(34, 211, 238, 0.3))', color: 'var(--lp-accent-primary)' }}>CLEAR</button>
            </div>
            {wifiLog.length === 0 ? (
              <div style={{ color: 'var(--lp-zinc-600)', textAlign: 'center', marginTop: 20 }}>No network activity.</div>
            ) : wifiLog.map((line, i) => (
              <div key={i} style={{ color: line.includes('ERROR') ? '#ef4444' : 'var(--lp-zinc-400)', marginBottom: 2 }}>{line}</div>
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
