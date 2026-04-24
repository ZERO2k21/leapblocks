/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * AppForgeStudio — placeholder stub.
 * The full implementation source is not present in this workspace.
 */
import React from 'react';

interface AppForgeStudioProps {
  onBack: () => void;
}

const AppForgeStudio: React.FC<AppForgeStudioProps> = ({ onBack }) => (
  <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d1117',
    color: '#c9d1d9',
    fontFamily: 'system-ui, sans-serif',
    gap: '16px',
  }}>
    <h2 style={{ margin: 0, color: '#f0f6fc' }}>AppForge Studio</h2>
    <p style={{ margin: 0, color: '#8b949e', fontSize: '14px' }}>
      This module is not available in the current build.
    </p>
    <button
      onClick={onBack}
      style={{
        marginTop: '8px',
        padding: '8px 20px',
        background: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '6px',
        color: '#c9d1d9',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      ← Back
    </button>
  </div>
);

export default AppForgeStudio;
