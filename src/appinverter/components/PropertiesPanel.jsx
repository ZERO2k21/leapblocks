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
        <div className="flex flex-col items-center justify-center h-full p-10 text-center text-slate-900">
           <div className="relative mb-6">
              <div className="absolute inset-0 bg-slate-50 rounded-full blur-2xl scale-150 opacity-50"></div>
              <Smartphone className="h-16 w-16 relative text-slate-900" strokeWidth={1} />
           </div>
           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-1">No Selection</p>
           <p className="text-[10px] text-slate-900 font-medium">Select a component to edit properties</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="w-full">
          <div className="relative">
            <select
              value={currentValue}
              style={{ height: '36px', paddingLeft: '12px', paddingRight: '32px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
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
            <ChevronDown style={{ width: '14px', height: '14px', right: '12px', top: '11px' }} className="absolute text-slate-900 pointer-events-none" />
          </div>

          {isCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min="1"
                max="9999"
                value={value}
                style={{ height: '36px', paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all flex-1"
                onChange={(e) => updateProp(id, key, parseInt(e.target.value) || 1)}
              />
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.05em' }}>PX</span>
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

      if (isBoolean) {
        return (
          <div 
            key={key} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '14px 20px', 
              borderBottom: '1px solid #f1f5f9', 
              backgroundColor: '#ffffff' 
            }}
            className="hover:bg-slate-50/50 transition-all duration-200"
          >
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <div
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${value ? 'bg-blue-600 shadow-md shadow-blue-500/25' : 'bg-slate-200'}`}
              onClick={() => updateProp(id, key, !value)}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
            </div>
          </div>
        );
      }

      return (
        <div 
          key={key} 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            padding: '14px 20px', 
            borderBottom: '1px solid #f1f5f9', 
            backgroundColor: '#ffffff' 
          }}
          className="hover:bg-slate-50/50 transition-all duration-200"
        >
          <label style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>

          {isSizeProperty ? (
            renderSizeProperty(key, value)
          ) : isColor ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={value && value !== 'transparent' ? value : '#000000'}
                style={{ width: '36px', height: '36px', padding: '0', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'transparent' }}
                className="shrink-0 shadow-sm hover:scale-105 transition-transform"
                onChange={(e) => updateProp(id, key, e.target.value)}
              />
              <input
                type="text"
                value={value || ''}
                style={{ height: '36px', paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', letterSpacing: '0.05em' }}
                className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-mono text-center"
                placeholder="#HEXCODE"
                onChange={(e) => updateProp(id, key, e.target.value)}
              />
            </div>
          ) : options ? (
            <div className="relative w-full">
              <select
                value={value}
                style={{ height: '36px', paddingLeft: '12px', paddingRight: '32px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                onChange={(e) => updateProp(id, key, e.target.value)}
              >
                {options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown style={{ width: '14px', height: '14px', right: '12px', top: '11px' }} className="absolute text-slate-900 pointer-events-none" />
            </div>
          ) : isArray ? (
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value || ''}
              placeholder="item1, item2, item3"
              style={{ height: '36px', paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
              onChange={(e) => {
                const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateProp(id, key, items);
              }}
            />
          ) : isNumber ? (
            <input
              type="number"
              value={value}
              style={{ height: '36px', paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
              onChange={(e) => updateProp(id, key, parseFloat(e.target.value) || 0)}
            />
          ) : (
            <input
              type="text"
              value={value ?? ''}
              style={{ height: '36px', paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
              onChange={(e) => updateProp(id, key, e.target.value)}
            />
          )}
        </div>
      );
    };

    return (
      <div style={{ padding: '20px' }} className="min-h-full bg-transparent">
        {/* Pro Header - Clean Flex Layout */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column' }} className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
            <div className="h-1.5 bg-blue-600 w-full" />
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div className="flex-1 min-w-0">
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '6px' }}>Active Module</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }} className="truncate">{id}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <span style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '6px', border: '1px solid #dbeafe', backgroundColor: '#eff6ff', color: '#2563eb' }}>{type}</span>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (window.confirm(`Delete ${id}?`)) {
                            removeComponent(id);
                        }
                    }}
                    style={{ padding: '14px' }}
                    className="bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-100 rounded-2xl transition-all shadow-sm active:scale-95 group shrink-0"
                    title="Delete Module"
                >
                    <Trash2 style={{ width: '20px', height: '20px' }} className="transition-transform group-hover:rotate-12" />
                </button>
            </div>
        </div>

        {/* Categorized Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(categorizedProps).map(([category, props]) => (
            <div key={category} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
                style={{ padding: '16px 20px', fontSize: '11px', fontWeight: '900' }}
                className="w-full flex items-center justify-between bg-white text-slate-900 hover:bg-slate-50 transition-all border-b border-slate-100 uppercase tracking-[0.2em] font-['Inter']"
                onClick={() => toggleSection(category)}
              >
                <span>{category}</span>
                {collapsedSections[category] ? (
                  <ChevronRight style={{ width: '14px', height: '14px' }} className="text-slate-900" />
                ) : (
                  <ChevronDown style={{ width: '14px', height: '14px' }} className="text-blue-600" />
                )}
              </button>
              {!collapsedSections[category] && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
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
      <div 
        style={{ paddingTop: '24px', paddingBottom: '16px', paddingLeft: '32px', paddingRight: '24px' }}
        className="bg-gradient-to-b from-white to-slate-50 backdrop-blur-md border-b-2 border-slate-200 flex items-center justify-between shrink-0 shadow-sm"
      >
        <span className="text-[19px] font-black uppercase tracking-[0.15em] text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.8)]">Properties</span>
      </div>
      {/* Property Editor */}
      <div className="flex-1 overflow-y-auto">
        {renderPropertyEditor()}
      </div>
    </div>
  );
}
