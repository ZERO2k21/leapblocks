/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Designer Panel
// Drag & drop component canvas
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useCallback } from 'react';
import type { AFProject, AFComponent } from '../../AppForgeStudio';
import componentsData from '../../data/components.json';

interface DesignerProps {
  project: AFProject;
  updateProject: (updates: Partial<AFProject>) => void;
}

type Category = string;

const CATEGORIES = [...new Set((componentsData as any[]).map((c: any) => c.category))];

let componentCounter = 0;
const genId = () => `comp_${++componentCounter}_${Date.now()}`;

export default function Designer({ project, updateProject }: DesignerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0] || 'UI');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentScreen = project.screens[project.activeScreenIndex];
  const components = currentScreen?.components || [];

  const filteredComponents = (componentsData as any[]).filter((c: any) => {
    const matchesCategory = c.category === selectedCategory;
    const matchesSearch = searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedComp = components.find(c => c.id === selectedComponentId);

  const addComponent = useCallback((compDef: any) => {
    const newComp: AFComponent = {
      id: genId(),
      type: compDef.name,
      name: `${compDef.name}${components.filter(c => c.type === compDef.name).length + 1}`,
      parentId: null,
      properties: Object.fromEntries(
        (compDef.properties || []).map((p: any) => [p.name, p.default ?? ''])
      ),
    };
    const updatedScreens = [...project.screens];
    updatedScreens[project.activeScreenIndex] = {
      ...currentScreen,
      components: [...components, newComp],
    };
    updateProject({ screens: updatedScreens });
    setSelectedComponentId(newComp.id);
  }, [project, currentScreen, components, updateProject]);

  const updateComponentProp = useCallback((id: string, propName: string, value: any) => {
    const updatedScreens = [...project.screens];
    const screen = { ...updatedScreens[project.activeScreenIndex] };
    screen.components = screen.components.map(c =>
      c.id === id ? { ...c, properties: { ...c.properties, [propName]: value } } : c
    );
    updatedScreens[project.activeScreenIndex] = screen;
    updateProject({ screens: updatedScreens });
  }, [project, updateProject]);

  const deleteComponent = useCallback((id: string) => {
    const updatedScreens = [...project.screens];
    const screen = { ...updatedScreens[project.activeScreenIndex] };
    screen.components = screen.components.filter(c => c.id !== id);
    updatedScreens[project.activeScreenIndex] = screen;
    updateProject({ screens: updatedScreens });
    if (selectedComponentId === id) setSelectedComponentId(null);
  }, [project, selectedComponentId, updateProject]);

  const compDef = selectedComp
    ? (componentsData as any[]).find((c: any) => c.name === selectedComp.type)
    : null;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* ── Left: Component Palette ─────────── */}
      <div style={{ width: 240, background: '#16161d', borderRight: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '10px 12px' }}>
          <input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, background: '#1e1e28', border: '1px solid #2a2a3a', color: '#e4e4e7', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 12px 8px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                background: selectedCategory === cat ? '#3b82f6' : '#252530',
                color: selectedCategory === cat ? '#fff' : '#a1a1aa',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{cat}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
          {filteredComponents.map((comp: any) => (
            <div
              key={comp.name}
              onClick={() => addComponent(comp)}
              style={{
                padding: '8px 10px', marginBottom: 4, borderRadius: 8, cursor: 'pointer',
                background: '#1e1e28', border: '1px solid #2a2a3a', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#252530'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.background = '#1e1e28'; }}
            >
              <span style={{ fontSize: 16 }}>{comp.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>{comp.name}</div>
                <div style={{ fontSize: 10, color: '#71717a' }}>{comp.description?.slice(0, 40)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Center: Screen Canvas ──────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f13' }}>
        <div style={{
          width: 360, height: 640, background: '#1a1a24', borderRadius: 28,
          border: '2px solid #2a2a3a', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {/* Phone status bar mockup */}
          <div style={{ height: 32, background: '#111118', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#71717a' }}>
            {project.appName}
          </div>
          {/* Canvas area */}
          <div style={{ flex: 1, padding: 8, overflow: 'auto' }}>
            {components.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#52525b', fontSize: 12, textAlign: 'center', gap: 8 }}>
                <span style={{ fontSize: 32 }}>📱</span>
                <div>Drag components from the left panel</div>
              </div>
            ) : (
              components.map(comp => {
                const def = (componentsData as any[]).find((d: any) => d.name === comp.type);
                return (
                  <div
                    key={comp.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedComponentId(comp.id); }}
                    style={{
                      padding: '8px 12px', marginBottom: 4, borderRadius: 6,
                      background: selectedComponentId === comp.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                      border: selectedComponentId === comp.id ? '1px solid #3b82f6' : '1px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{def?.icon || '📦'}</span>
                    <span style={{ fontSize: 12, color: '#e4e4e7' }}>{comp.name}</span>
                    <span style={{ fontSize: 10, color: '#52525b', marginLeft: 'auto' }}>{comp.type}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Properties Panel ─────────── */}
      <div style={{ width: 260, background: '#16161d', borderLeft: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {selectedComp && compDef ? (
          <>
            <div style={{ padding: '12px', borderBottom: '1px solid #2a2a3a' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7', marginBottom: 4 }}>{selectedComp.name}</div>
              <div style={{ fontSize: 11, color: '#71717a' }}>{selectedComp.type}</div>
              <button onClick={() => deleteComponent(selectedComp.id)} style={{ marginTop: 8, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Properties</div>
              {(compDef.properties || []).map((prop: any) => (
                <div key={prop.name} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 3 }}>{prop.name}</label>
                  {prop.type === 'boolean' ? (
                    <button
                      onClick={() => updateComponentProp(selectedComp.id, prop.name, !selectedComp.properties[prop.name])}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                        background: selectedComp.properties[prop.name] ? '#22c55e' : '#3f3f46',
                        color: '#fff', border: 'none',
                      }}
                    >{selectedComp.properties[prop.name] ? 'ON' : 'OFF'}</button>
                  ) : prop.type === 'color' ? (
                    <input
                      type="color"
                      value={selectedComp.properties[prop.name] || '#ffffff'}
                      onChange={(e) => updateComponentProp(selectedComp.id, prop.name, e.target.value)}
                      style={{ width: '100%', height: 28, borderRadius: 4, border: 'none', cursor: 'pointer' }}
                    />
                  ) : prop.type === 'number' ? (
                    <input
                      type="number"
                      value={selectedComp.properties[prop.name] || 0}
                      onChange={(e) => updateComponentProp(selectedComp.id, prop.name, Number(e.target.value))}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: 4, background: '#1e1e28', border: '1px solid #2a2a3a', color: '#e4e4e7', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={selectedComp.properties[prop.name] || ''}
                      onChange={(e) => updateComponentProp(selectedComp.id, prop.name, e.target.value)}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: 4, background: '#1e1e28', border: '1px solid #2a2a3a', color: '#e4e4e7', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#52525b', fontSize: 12, textAlign: 'center', padding: 20 }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>👆</span>
            Select a component to edit its properties
          </div>
        )}
      </div>
    </div>
  );
}
