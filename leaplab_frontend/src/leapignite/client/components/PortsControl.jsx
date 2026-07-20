/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function PortsControl({ ports, selectedPort, onPortSelect, onRefreshPorts, onConnect, isConnected }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '0 8px',
            height: 32,
            flexShrink: 0,
        }}>
            <button
                onClick={onRefreshPorts}
                title="Refresh ports"
                style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', padding: 2,
                    display: 'flex', alignItems: 'center',
                    borderRadius: 6, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
                <RotateCcw size={12} strokeWidth={2.5} />
            </button>

            <select
                value={selectedPort}
                onChange={(e) => onPortSelect?.(e.target.value)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 11,
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    width: 80,
                    fontFamily: "'Segoe UI', Inter, monospace, sans-serif",
                }}
            >
                <option value="" style={{ background: '#0a015a' }}>
                    {ports.length === 0 ? 'No Ports' : 'Select Port'}
                </option>
                {ports.map(p => (
                    <option key={p.path} value={p.path} style={{ background: '#0a015a' }}>
                        {p.path}
                    </option>
                ))}
            </select>

            <button
                onClick={onConnect}
                style={{
                    padding: '3px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isConnected
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    letterSpacing: '0.04em',
                }}
                onMouseEnter={e => { if (!isConnected) e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={e => { if (!isConnected) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            >
                {isConnected ? '● ON' : 'CONNECT'}
            </button>
        </div>
    );
}
