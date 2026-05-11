/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { Trash2, Smartphone, Plus } from 'lucide-react';

export default function PropertiesPanel({ appState }) {
  const {
    screens, activeScreen, selectedId, selectedComponent,
    setSelectedId, updateProp, removeComponent, addScreen
  } = appState;

  const [newScreenName, setNewScreenName] = useState('');
  const [isAddingScreen, setIsAddingScreen] = useState(false);

  const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
  const components = currentScreen?.components || [];
  const nonVisibleComponents = currentScreen?.nonVisibleComponents || [];

  // MIT App Inventor style Width/Height options
  const sizeOptions = {
    Width: [
      { value: 'Automatic', label: 'Automatic' },
      { value: 'Fill parent', label: 'Fill parent...' },
      { value: 'custom', label: 'Custom (pixels)...' }
    ],
    Height: [
      { value: 'Automatic', label: 'Automatic' },
      { value: 'Fill parent', label: 'Fill parent...' },
      { value: 'custom', label: 'Custom (pixels)...' }
    ]
  };

  const enumOptions = {
    TextAlignment: ['left', 'center', 'right'],
    Shape: ['default', 'rounded', 'rectangular', 'oval']
  };

  const handleAddScreen = () => {
    if (newScreenName.trim() && !screens.find(s => s.id === newScreenName.trim())) {
      addScreen(newScreenName.trim());
      setNewScreenName('');
      setIsAddingScreen(false);
    }
  };

  const renderPropertyEditor = () => {
    if (!selectedComponent) {
      return (
        <div className="p-6 text-center text-gray-500 text-sm">
          Select a component to edit its properties
        </div>
      );
    }

    const { id, type, props } = selectedComponent;

    // Helper function to render Width/Height with MIT App Inventor style
    const renderSizeProperty = (key, value) => {
      const isCustom = typeof value === 'number';
      const currentValue = isCustom ? 'custom' : value;

      return (
        <div className="space-y-2">
          <select
            value={currentValue}
            className="block w-full rounded-md border-[#b7c4d4] shadow-sm focus:border-[#4a90e2] focus:ring-[#4a90e2] sm:text-sm border px-2 py-1 bg-white"
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue === 'custom') {
                // Set to default pixel value
                updateProp(id, key, 100);
              } else {
                updateProp(id, key, newValue);
              }
            }}
          >
            {sizeOptions[key].map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Show pixel input if custom is selected */}
          {isCustom && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="9999"
                value={value}
                className="flex-1 block w-full rounded-md border-[#b7c4d4] shadow-sm focus:border-[#4a90e2] focus:ring-[#4a90e2] sm:text-sm border px-2 py-1"
                onChange={(e) => updateProp(id, key, parseInt(e.target.value) || 1)}
              />
              <span className="text-xs text-gray-500">pixels</span>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="p-4">
        {/* Header with Delete Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">{type} Properties</h3>
          <button
            onClick={() => {
              if (window.confirm(`Delete ${id}?`)) {
                removeComponent(id);
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
            title="Delete Component"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
        <div className="space-y-4">
          {Object.entries(props).map(([key, value]) => {
            // Skip legacy lowercase aliases
            if (key === 'width' || key === 'height' || key === 'visible') {
              return null;
            }

            const isColor = key.toLowerCase().includes('color');
            const isBoolean = typeof value === 'boolean';
            const isNumber = typeof value === 'number' && key !== 'Width' && key !== 'Height';
            const isSizeProperty = key === 'Width' || key === 'Height';
            const options = enumOptions[key];

            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>

                {isSizeProperty ? (
                  renderSizeProperty(key, value)
                ) : isBoolean ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={value}
                      onChange={(e) => updateProp(id, key, e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4a90e2]"></div>
                  </label>
                ) : isColor ? (
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={value}
                      className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                      onChange={(e) => updateProp(id, key, e.target.value)}
                    />
                    <input
                      type="text"
                      value={value}
                      className="flex-1 block w-full rounded-md border-[#b7c4d4] shadow-sm focus:border-[#4a90e2] focus:ring-[#4a90e2] sm:text-sm border px-2 py-1"
                      onChange={(e) => updateProp(id, key, e.target.value)}
                    />
                  </div>
                ) : options ? (
                  <select
                    value={value}
                    className="block w-full rounded-md border-[#b7c4d4] shadow-sm focus:border-[#4a90e2] focus:ring-[#4a90e2] sm:text-sm border px-2 py-1 bg-white"
                    onChange={(e) => updateProp(id, key, e.target.value)}
                  >
                    {options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : isNumber ? (
                  <input
                    type="number"
                    value={value}
                    className="block w-full rounded-md border-[#b7c4d4] shadow-sm focus:border-[#4a90e2] focus:ring-[#4a90e2] sm:text-sm border px-2 py-1"
                    onChange={(e) => updateProp(id, key, parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    className="block w-full rounded-md border-[#b7c4d4] shadow-sm focus:border-[#4a90e2] focus:ring-[#4a90e2] sm:text-sm border px-2 py-1"
                    onChange={(e) => updateProp(id, key, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const rowClass = (id) => `flex items-center justify-between group px-2 py-1.5 rounded cursor-pointer ${selectedId === id ? 'bg-[#e8f1ff] text-[#2b6cb0]' : 'hover:bg-gray-50 text-gray-600'}`;

  return (
    <div className="w-[280px] bg-white border-l border-[#c6cfda] flex flex-col h-full shrink-0">
      <div className="h-1/2 border-b border-[#c6cfda] flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-[#c6cfda] bg-[#dfe6ee] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#2c3e50] uppercase tracking-wide">Components</span>
        </div>
        <div className="p-3 overflow-y-auto flex-1 text-sm">
          <div className="flex items-center space-x-2 text-gray-800 font-medium mb-2">
            <Smartphone className="h-4 w-4 text-[#4a90e2]" />
            <span>{activeScreen}</span>
          </div>
          <div className="pl-6 space-y-1">
            {components.map(comp => (
              <div key={comp.id} className={rowClass(comp.id)} onClick={() => setSelectedId(comp.id)}>
                <div className="truncate flex-1">{comp.id} <span className="text-xs text-gray-400">({comp.type})</span></div>
                <button onClick={(e) => { e.stopPropagation(); removeComponent(comp.id); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" title="Remove Component">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {nonVisibleComponents.map(comp => (
              <div key={comp.id} className={rowClass(comp.id)} onClick={() => setSelectedId(comp.id)}>
                <div className="truncate flex-1">{comp.id} <span className="text-xs text-gray-400">({comp.type})</span></div>
                <button onClick={(e) => { e.stopPropagation(); removeComponent(comp.id); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" title="Remove Component">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-[#c6cfda] bg-[#eef3f8]">
          {isAddingScreen ? (
            <div className="flex space-x-2">
              <input
                type="text"
                autoFocus
                placeholder="Screen name"
                className="w-full text-sm border-[#b7c4d4] rounded-md border px-2 py-1 focus:ring-1 focus:ring-[#4a90e2] focus:border-[#4a90e2] outline-none"
                value={newScreenName}
                onChange={(e) => setNewScreenName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddScreen()}
              />
              <button className="px-2 py-1 bg-[#4a90e2] text-white text-xs rounded hover:bg-[#3f79bf]" onClick={handleAddScreen}>Add</button>
            </div>
          ) : (
            <button className="flex items-center justify-center w-full space-x-1 text-xs text-[#2b6cb0] hover:text-[#1e4f85] font-medium py-1" onClick={() => setIsAddingScreen(true)}>
              <Plus className="h-3 w-3" />
              <span>Add Screen</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-1/2 overflow-y-auto">
        {renderPropertyEditor()}
      </div>
    </div>
  );
}
