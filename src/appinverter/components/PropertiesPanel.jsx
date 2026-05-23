/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Properties Panel — MIT App Inventor-style property editor
 * Shows ALL properties defined in COMPONENT_METADATA for the selected
 * component, falling back to the component's own props for values.
 */
import React, { useState, useMemo } from 'react';
import { Trash2, Smartphone, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { COMPONENT_METADATA } from '../data/componentMetadata';

export default function PropertiesPanel({ appState }) {
  const {
    screens, activeScreen, selectedId, selectedComponent,
    setSelectedId, updateProp, removeComponent, addScreen
  } = appState;

  const [newScreenName, setNewScreenName] = useState('');
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

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
    Shape: ['default', 'rounded', 'rectangular', 'oval'],
    AlignHorizontal: ['Left', 'Center', 'Right'],
    AlignVertical: ['Top', 'Center', 'Bottom'],
    ScreenOrientation: ['Unspecified', 'Portrait', 'Landscape', 'Sensor', 'User']
  };

  const handleAddScreen = () => {
    if (newScreenName.trim() && !screens.find(s => s.id === newScreenName.trim())) {
      addScreen(newScreenName.trim());
      setNewScreenName('');
      setIsAddingScreen(false);
    }
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  /**
   * Build a merged property map:
   * 1. Start with the component's current props (user-set values)
   * 2. Fill in any properties from COMPONENT_METADATA that aren't yet present
   *    with sensible defaults based on type.
   */
  const getFullPropertyMap = (comp) => {
    if (!comp) return {};

    const { type, props } = comp;
    const metadata = COMPONENT_METADATA[type];
    const fullProps = { ...props };

    if (metadata?.properties) {
      metadata.properties.forEach(propDef => {
        const name = propDef.name;
        // Don't overwrite existing values
        if (fullProps[name] !== undefined) return;

        // Infer default based on type
        switch (propDef.type) {
          case 'Boolean':
            fullProps[name] = false;
            break;
          case 'Number':
            fullProps[name] = 0;
            break;
          case 'Color':
            fullProps[name] = '#000000';
            break;
          case 'String':
            fullProps[name] = '';
            break;
          case 'Array':
            fullProps[name] = [];
            break;
          default:
            fullProps[name] = '';
            break;
        }
      });
    }

    return fullProps;
  };

  /**
   * Determine the property type from metadata if available
   */
  const getPropertyType = (compType, propName) => {
    const metadata = COMPONENT_METADATA[compType];
    if (!metadata?.properties) return null;
    const propDef = metadata.properties.find(p => p.name === propName);
    return propDef?.type || null;
  };

  /**
   * Get options for a property from metadata
   */
  const getPropertyOptions = (compType, propName) => {
    const metadata = COMPONENT_METADATA[compType];
    if (!metadata?.properties) return null;
    const propDef = metadata.properties.find(p => p.name === propName);
    return propDef?.options || enumOptions[propName] || null;
  };

  const renderPropertyEditor = () => {
    if (!selectedComponent) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center text-slate-300">
           <div className="relative mb-6">
              <div className="absolute inset-0 bg-slate-50 rounded-full blur-2xl scale-150 opacity-50"></div>
              <Smartphone className="h-16 w-16 relative text-slate-200" strokeWidth={1} />
           </div>
           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">No Selection</p>
           <p className="text-[10px] text-slate-300 font-medium">Select a component to edit properties</p>
        </div>
      );
    }

    const { id, type } = selectedComponent;
    const fullProps = getFullPropertyMap(selectedComponent);

    // Categorize properties for organized display
    const categorizeProps = (props) => {
      const categories = {
        'Appearance': [],
        'Behavior': [],
        'Size & Position': [],
        'Data': [],
        'Other': []
      };

      const appearanceKeys = new Set([
        'BackgroundColor', 'TextColor', 'FontSize', 'FontBold', 'FontItalic',
        'FontTypeface', 'TextAlignment', 'Shape', 'Image', 'Picture',
        'BackgroundImage', 'Color', 'PaintColor', 'AlternateText',
        'HTMLFormat', 'HasMargins', 'RotationAngle', 'ScalePictureToFit',
        'ShowFeedback', 'ItemBackgroundColor', 'ItemTextColor',
        'ThumbColorActive', 'ThumbColorInactive', 'TrackColorActive',
        'TrackColorInactive', 'ColorLeft', 'ColorRight', 'FillColor',
        'StrokeColor', 'FillOpacity', 'StrokeOpacity', 'StrokeWidth',
        'DividerColor', 'DividerThickness', 'ElementColor',
        'ElementCornerRadius', 'ElementMarginsWidth', 'LineWidth'
      ]);

      const sizeKeys = new Set([
        'Width', 'Height', 'X', 'Y', 'Z', 'Radius',
        'AlignHorizontal', 'AlignVertical', 'Columns', 'Rows',
        'Latitude', 'Longitude', 'ZoomLevel'
      ]);

      const dataKeys = new Set([
        'Text', 'Hint', 'Title', 'Elements', 'ElementsFromString',
        'Selection', 'SelectionIndex', 'Source', 'Url', 'HomeUrl',
        'Namespace', 'PhoneNumber', 'EmailAddress', 'Prompt',
        'ShowFilterBar', 'WebViewString', 'ListData'
      ]);

      Object.entries(props).forEach(([key, value]) => {
        // Skip legacy lowercase aliases
        if (key === 'width' || key === 'height' || key === 'visible') return;

        if (sizeKeys.has(key)) categories['Size & Position'].push([key, value]);
        else if (appearanceKeys.has(key)) categories['Appearance'].push([key, value]);
        else if (dataKeys.has(key)) categories['Data'].push([key, value]);
        else if (typeof value === 'boolean') categories['Behavior'].push([key, value]);
        else categories['Other'].push([key, value]);
      });

      // Remove empty categories
      return Object.fromEntries(
        Object.entries(categories).filter(([, items]) => items.length > 0)
      );
    };

    const categorizedProps = categorizeProps(fullProps);

    const renderSizeProperty = (key, value) => {
      const isCustom = typeof value === 'number';
      const currentValue = isCustom ? 'custom' : value;

      return (
        <div className="space-y-3">
          <select
            value={currentValue}
            className="property-input-pro appearance-none"
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue === 'custom') {
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

          {isCustom && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="9999"
                value={value}
                className="property-input-pro flex-1"
                onChange={(e) => updateProp(id, key, parseInt(e.target.value) || 1)}
              />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PX</span>
            </div>
          )}
        </div>
      );
    };

    const renderSingleProp = (key, value) => {
      const metaType = getPropertyType(type, key);
      const isColor = key.toLowerCase().includes('color') || metaType === 'Color';
      const isBoolean = typeof value === 'boolean' || metaType === 'Boolean';
      const isNumber = (typeof value === 'number' && key !== 'Width' && key !== 'Height') || (metaType === 'Number' && key !== 'Width' && key !== 'Height');
      const isSizeProperty = key === 'Width' || key === 'Height';
      const options = getPropertyOptions(type, key);
      const isArray = Array.isArray(value) || metaType === 'Array';

      return (
        <div key={key} className="property-row-pro">
          <label className="property-label-pro">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>

          {isSizeProperty ? (
            renderSizeProperty(key, value)
          ) : isBoolean ? (
            <div
                className={`flex items-center justify-between p-3.5 bg-slate-50 border rounded-2xl cursor-pointer transition-all ${value ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => updateProp(id, key, !value)}
            >
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${value ? 'text-indigo-700' : 'text-slate-500'}`}>{value ? 'ENABLED' : 'DISABLED'}</span>
                <div className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${value ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
                </div>
            </div>
          ) : isColor ? (
            <div className="flex items-center gap-3">
              <div className="relative group">
                <input
                    type="color"
                    value={value && value !== 'transparent' ? value : '#000000'}
                    className="h-12 w-12 rounded-xl cursor-pointer border border-slate-200 p-1.5 bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
                    onChange={(e) => updateProp(id, key, e.target.value)}
                />
              </div>
              <input
                type="text"
                value={value || ''}
                className="property-input-pro font-mono text-center tracking-widest"
                placeholder="#HEXCODE"
                onChange={(e) => updateProp(id, key, e.target.value)}
              />
            </div>
          ) : options ? (
            <div className="relative">
                <select
                value={value}
                className="property-input-pro appearance-none pr-10"
                onChange={(e) => updateProp(id, key, e.target.value)}
                >
                {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          ) : isArray ? (
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value || ''}
              placeholder="item1, item2, item3"
              className="property-input-pro font-medium"
              onChange={(e) => {
                const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateProp(id, key, items);
              }}
            />
          ) : isNumber ? (
            <input
              type="number"
              value={value}
              className="property-input-pro"
              onChange={(e) => updateProp(id, key, parseFloat(e.target.value) || 0)}
            />
          ) : (
            <input
              type="text"
              value={value ?? ''}
              className="property-input-pro"
              onChange={(e) => updateProp(id, key, e.target.value)}
            />
          )}
        </div>
      );
    };

    return (
      <div className="p-5 min-h-full bg-transparent">
        {/* Pro Header - Clean Flex Layout */}
        <div className="mb-6 bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
            <div className="h-1.5 bg-indigo-500 w-full" />
            <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5">Active Module</div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">{id}</h3>
                    <div className="flex items-center gap-2 mt-2.5">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-100">{type}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Selected</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (window.confirm(`Delete ${id}?`)) {
                            removeComponent(id);
                        }
                    }}
                    className="p-3.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-100 rounded-2xl transition-all shadow-sm active:scale-95 group shrink-0"
                    title="Delete Module"
                >
                    <Trash2 className="h-5 w-5 transition-transform group-hover:rotate-12" />
                </button>
            </div>
        </div>

        {/* Categorized Properties */}
        <div className="space-y-4">
          {Object.entries(categorizedProps).map(([category, props]) => (
            <div key={category} className="border border-[var(--leap-border)] rounded-xl overflow-hidden bg-[var(--leap-panel)] shadow-sm">
            <button
                className="w-full flex items-center justify-between px-5 py-4 bg-white text-[11px] font-bold text-slate-800 hover:bg-slate-50 transition-all border-b border-slate-100 uppercase tracking-[0.2em] font-['Inter']"
                onClick={() => toggleSection(category)}
              >
                <span>{category}</span>
                {collapsedSections[category] ? (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />
                )}
              </button>
              {!collapsedSections[category] && (
                <div className="p-4 space-y-5 bg-[var(--leap-bg)]">
                  {props.map(([key, value]) => renderSingleProp(key, value))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[320px] bg-white border-l border-slate-100 flex flex-col h-full shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)] z-20">
      {/* Panel Header */}
      <div className="leap-panel-header-pro">
        <span>Properties</span>
      </div>

      {/* Property Editor */}
      <div className="flex-1 overflow-y-auto">
        {renderPropertyEditor()}
      </div>
    </div>
  );
}
