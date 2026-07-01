/**
 * Vision3D - Toolbar Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { exportShapes, downloadBlob } from '../engine/ExportEngine';
import { GRID_PRESETS } from '../utils/constants';
import { log } from '../utils/logger';

export const Toolbar = () => {
  const {
    activeTool, setTool, selectedIds, shapes,
    removeShapes, groupShapes, ungroupShape, duplicateShapes, alignShapes,
    undo, redo, historyIndex, history,
    gridSnap, setGridSnap, showGrid, setShowGrid, showAxes, setShowAxes,
    clearScene, mirrorShapes, dropToWorkplane,
  } = use3DStore();

  const handleDelete = () => {
    log('Toolbar: delete, selectedIds=' + selectedIds.length);
    if (selectedIds.length > 0) removeShapes(selectedIds);
  };

  const handleGroup = () => {
    log('Toolbar: group, selectedIds=' + selectedIds.length);
    if (selectedIds.length >= 2) groupShapes(selectedIds);
  };

  const handleUngroup = () => {
    log('Toolbar: ungroup, selectedIds=' + selectedIds.length);
    if (selectedIds.length === 1) {
      const shape = shapes.find((s) => s.id === selectedIds[0]);
      if (shape?.type === 'group') ungroupShape(selectedIds[0]);
    }
  };

  const handleDuplicate = () => {
    log('Toolbar: duplicate, selectedIds=' + selectedIds.length);
    if (selectedIds.length > 0) duplicateShapes(selectedIds);
  };

  const handleExport = async (format) => {
    log('Toolbar: export format=' + format);
    try {
      const blob = await exportShapes(shapes, {
        format,
        includeGrid: false,
        includeHidden: false,
      });
      downloadBlob(blob, `vision3d_export.${format}`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  const handleImport = () => {
    log('Toolbar: import clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.stl,.obj,.gltf,.glb';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const { importSTL, importOBJ } = await import('../engine/ExportEngine');
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'stl') {
          const geometry = await importSTL(file);
          console.log('Imported STL geometry:', geometry);
        } else if (extension === 'obj') {
          const group = await importOBJ(file);
          console.log('Imported OBJ group:', group);
        } else {
          alert('Unsupported file format');
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert('Import failed. Please try again.');
      }
    };
    input.click();
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="Select (V)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
          </button>
          <button
            className={`toolbar-btn ${activeTool === 'move' ? 'active' : ''}`}
            onClick={() => setTool('move')}
            title="Move (G)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
            </svg>
          </button>
          <button
            className={`toolbar-btn ${activeTool === 'rotate' ? 'active' : ''}`}
            onClick={() => setTool('rotate')}
            title="Rotate (R)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
          <button
            className={`toolbar-btn ${activeTool === 'scale' ? 'active' : ''}`}
            onClick={() => setTool('scale')}
            title="Scale (S)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 3l-7 7M21 3v5M21 3h-5M3 21l7-7M3 21v-5M3 21h5" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleDuplicate} disabled={selectedIds.length === 0} title="Duplicate (Ctrl+D)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button className="toolbar-btn" onClick={handleDelete} disabled={selectedIds.length === 0} title="Delete (Del)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleGroup} disabled={selectedIds.length < 2} title="Group (Ctrl+G)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="1" width="9" height="9" />
              <rect x="14" y="14" width="9" height="9" />
              <path d="M14 14l-4-4M10 10l4 4" />
            </svg>
          </button>
          <button
            className="toolbar-btn"
            onClick={handleUngroup}
            disabled={selectedIds.length !== 1 || shapes.find((s) => s.id === selectedIds[0])?.type !== 'group'}
            title="Ungroup (Ctrl+Shift+G)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="1" width="9" height="9" />
              <rect x="14" y="14" width="9" height="9" />
              <path d="M10 10l4 4M14 14l-4-4" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => alignShapes(selectedIds, 'x', 'center')} disabled={selectedIds.length < 2} title="Align X">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="2" x2="12" y2="22" />
              <rect x="4" y="6" width="16" height="4" />
              <rect x="6" y="14" width="12" height="4" />
            </svg>
          </button>
          <button className="toolbar-btn" onClick={() => alignShapes(selectedIds, 'y', 'center')} disabled={selectedIds.length < 2} title="Align Y">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="2" y1="12" x2="22" y2="12" />
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="6" width="4" height="12" />
            </svg>
          </button>
          <button className="toolbar-btn" onClick={() => alignShapes(selectedIds, 'z', 'center')} disabled={selectedIds.length < 2} title="Align Z">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => mirrorShapes(selectedIds, 'x')} disabled={selectedIds.length === 0} title="Mirror X (M)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v18M8 7l-4 5 4 5M16 7l4 5-4 5" />
            </svg>
          </button>
          <button className="toolbar-btn" onClick={() => dropToWorkplane(selectedIds)} disabled={selectedIds.length === 0} title="Drop to Workplane (D)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h10a5 5 0 0 1 0 10H9" />
              <polyline points="7 14 3 10 7 6" />
            </svg>
          </button>
          <button className="toolbar-btn" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Shift+Z)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10H11a5 5 0 0 0 0 10h4" />
              <polyline points="17 14 21 10 17 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-group">
          <label className="toolbar-label">Grid</label>
          <select value={gridSnap} onChange={(e) => setGridSnap(parseFloat(e.target.value))} className="toolbar-select">
            {GRID_PRESETS.map((preset) => (
              <option key={preset} value={preset}>{preset}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <button className={`toolbar-btn ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid(!showGrid)} title="Toggle Grid">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
          <button className={`toolbar-btn ${showAxes ? 'active' : ''}`} onClick={() => setShowAxes(!showAxes)} title="Toggle Axes">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <polyline points="16 6 20 2 18 8" />
              <polyline points="6 16 2 20 8 18" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleImport} title="Import">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <div className="export-dropdown">
            <button className="toolbar-btn" title="Export">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <div className="export-menu">
              <button onClick={() => handleExport('stl')}>Export STL</button>
              <button onClick={() => handleExport('obj')}>Export OBJ</button>
              <button onClick={() => handleExport('gltf')}>Export GLTF</button>
              <button onClick={() => handleExport('glb')}>Export GLB</button>
            </div>
          </div>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn danger" onClick={clearScene} title="Clear Scene">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
