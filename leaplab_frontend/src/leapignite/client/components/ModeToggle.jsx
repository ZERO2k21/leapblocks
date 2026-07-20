/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Monitor, Rocket } from 'lucide-react';

export default function ModeToggle({ mode, onModeChange }) {
    return (
        <div
            onClick={() => onModeChange(mode === 'stage' ? 'upload' : 'stage')}
            title={`Switch to ${mode === 'stage' ? 'Upload' : 'Stage'} mode`}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                padding: 3,
                cursor: 'pointer',
                width: 136,
                height: 32,
                flexShrink: 0,
                transition: 'border-color 0.2s',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
        >
            {/* Sliding pill */}
            <div style={{
                position: 'absolute',
                top: 3,
                bottom: 3,
                width: 'calc(50% - 3px)',
                borderRadius: 999,
                transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
                left: mode === 'stage' ? 3 : 'calc(50%)',
                background: mode === 'stage'
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #3B82F6, #4F46E5)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }} />
            {/* Stage label */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, zIndex: 1, fontSize: 11, fontWeight: 700,
                color: mode === 'stage' ? '#fff' : 'rgba(255,255,255,0.45)',
                fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                transition: 'color 0.2s',
            }}>
                <Monitor size={12} strokeWidth={2.5} />
                Stage
            </div>
            {/* Upload label */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, zIndex: 1, fontSize: 11, fontWeight: 700,
                color: mode === 'upload' ? '#fff' : 'rgba(255,255,255,0.45)',
                fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                transition: 'color 0.2s',
            }}>
                <Rocket size={12} strokeWidth={2.5} />
                Upload
            </div>
        </div>
    );
}
