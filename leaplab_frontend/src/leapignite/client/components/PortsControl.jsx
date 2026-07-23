/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function PortsControl({ ports, selectedPort, onPortSelect, onRefreshPorts, onConnect, isConnected }) {
    return (
        <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-full px-2 h-8 shrink-0">
            <button
                onClick={onRefreshPorts}
                title="Refresh ports"
                className="bg-transparent border-none text-white/60 hover:text-white cursor-pointer p-0.5 flex items-center rounded-md transition-colors"
            >
                <RotateCcw size={12} strokeWidth={2.5} />
            </button>

            <select
                value={selectedPort}
                onChange={(e) => onPortSelect?.(e.target.value)}
                className="bg-transparent border-none text-white/85 text-[11px] font-semibold outline-none cursor-pointer w-[80px] font-mono"
            >
                <option value="" className="bg-[#0a015a]">
                    {ports.length === 0 ? 'No Ports' : 'Select Port'}
                </option>
                {ports.map(p => (
                    <option key={p.path} value={p.path} className="bg-[#0a015a]">
                        {p.path}
                    </option>
                ))}
            </select>

            <button
                onClick={onConnect}
                className={`px-2.5 py-0.75 text-[10px] font-bold border-none rounded-full cursor-pointer transition-all text-white tracking-wider ${
                    isConnected
                        ? 'bg-gradient-to-br from-[#10B981] to-[#059669]'
                        : 'bg-white/12 hover:bg-white/22'
                }`}
            >
                {isConnected ? '● ON' : 'CONNECT'}
            </button>
        </div>
    );
}
