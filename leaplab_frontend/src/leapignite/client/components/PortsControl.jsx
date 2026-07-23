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
                type="button"
                onClick={onRefreshPorts}
                title="Refresh ports"
                className="bg-transparent border-0 text-white/60 hover:text-white cursor-pointer p-0.5 flex items-center rounded-md transition-colors"
            >
                <RotateCcw size={12} strokeWidth={2.5} />
            </button>

            <select
                value={selectedPort}
                onChange={(e) => onPortSelect?.(e.target.value)}
                className="bg-transparent border-0 text-white/85 text-xs font-semibold outline-none cursor-pointer w-20 font-mono"
            >
                <option value="" className="bg-indigo-950">
                    {ports.length === 0 ? 'No Ports' : 'Select Port'}
                </option>
                {ports.map(p => (
                    <option key={p.path} value={p.path} className="bg-indigo-950">
                        {p.path}
                    </option>
                ))}
            </select>

            <button
                type="button"
                onClick={onConnect}
                className={`px-2.5 py-1 text-xs font-bold border-0 rounded-full cursor-pointer transition-all text-white tracking-wider ${
                    isConnected
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                        : 'bg-white/10 hover:bg-white/20'
                }`}
            >
                {isConnected ? '● ON' : 'CONNECT'}
            </button>
        </div>
    );
}
