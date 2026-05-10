/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { Trash2, Smartphone, Plus } from 'lucide-react';

export default function PropertiesPanel({ appState }) {
  const {
    screens, activeScreen, selectedId,
    setSelectedId, updateProp, removeComponent, addScreen
  } = appState;

  const [newScreenName, setNewScreenName] = useState('');
  const [isAddingScreen, setIsAddingScreen] = useState(false);

  const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
  const components = currentScreen?.components || [];

  let selectedComponent = components.find(c => c.id === selectedId);

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

    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{type} Properties</h3>
        <div className="space-y-4">
          {Object.entries(props).map(([key, value]) => {
            const isColor = key.toLowerCase().includes('color');
            const isBoolean = typeof value === 'boolean';
            const isNumber = typeof value === 'number';

            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>

                {isBoolean ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={value}
                      onChange={(e) => updateProp(id, key, e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6c63ff]"></div>
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
                      className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6c63ff] focus:ring-[#6c63ff] sm:text-sm border px-2 py-1"
                      onChange={(e) => updateProp(id, key, e.target.value)}
                    />
                  </div>
                ) : isNumber ? (
                  <input
                    type="number"
                    value={value}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6c63ff] focus:ring-[#6c63ff] sm:text-sm border px-2 py-1"
                    onChange={(e) => updateProp(id, key, parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6c63ff] focus:ring-[#6c63ff] sm:text-sm border px-2 py-1"
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

  return (
    <div className="w-[260px] bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
      {/* TOP HALF - Component Tree */}
      <div className="h-1/2 border-b border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 uppercase">Components</span>
        </div>
        <div className="p-3 overflow-y-auto flex-1 text-sm">
          <div className="flex items-center space-x-2 text-gray-800 font-medium mb-2">
            <Smartphone className="h-4 w-4 text-[#6c63ff]" />
            <span>{activeScreen}</span>
          </div>
          <div className="pl-6 space-y-1">
            {components.map(comp => (
              <div
                key={comp.id}
                className={`flex items-center justify-between group px-2 py-1.5 rounded cursor-pointer ${selectedId === comp.id ? 'bg-purple-50 text-[#6c63ff]' : 'hover:bg-gray-50 text-gray-600'}`}
                onClick={() => setSelectedId(comp.id)}
              >
                <div className="truncate flex-1">
                  {comp.id} <span className="text-xs text-gray-400">({comp.type})</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeComponent(comp.id); }}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                  title="Remove Component"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Screen section */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          {isAddingScreen ? (
            <div className="flex space-x-2">
              <input
                type="text"
                autoFocus
                placeholder="Screen name"
                className="w-full text-sm border-gray-300 rounded-md border px-2 py-1 focus:ring-1 focus:ring-[#6c63ff] focus:border-[#6c63ff] outline-none"
                value={newScreenName}
                onChange={(e) => setNewScreenName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddScreen()}
              />
              <button
                className="px-2 py-1 bg-[#6c63ff] text-white text-xs rounded hover:bg-purple-600"
                onClick={handleAddScreen}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              className="flex items-center justify-center w-full space-x-1 text-xs text-[#6c63ff] hover:text-purple-700 font-medium py-1"
              onClick={() => setIsAddingScreen(true)}
            >
              <Plus className="h-3 w-3" />
              <span>Add Screen</span>
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM HALF - Properties Editor */}
      <div className="h-1/2 overflow-y-auto">
        {renderPropertyEditor()}
      </div>
    </div>
  );
}
