/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Properties Panel — Leap-style property editor
 * Shows ALL properties defined in COMPONENT_METADATA for the selected
 * component, falling back to the component's own props for values.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Smartphone, Plus, ChevronDown, ChevronRight, Pencil, Image, AlertTriangle, X } from 'lucide-react';
import { COMPONENT_METADATA } from '../data/componentMetadata';
import AssetPicker from './AssetPicker';
import ComponentIcon from './ComponentIcon';

// Color input with local state and debounced parent updates to prevent lag
function ColorPickerInput({ id, propKey, value, updateProp }) {
  const [localValue, setLocalValue] = useState(value || '#000000');

  // Keep local value in sync if the prop changes externally
  useEffect(() => {
    setLocalValue(value || '#000000');
  }, [value]);

  const stateRef = useRef({ id, propKey, updateProp });
  stateRef.current = { id, propKey, updateProp };

  const timeoutRef = useRef(null);

  const commitValue = useCallback((val) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const { id, propKey, updateProp } = stateRef.current;
    updateProp(id, propKey, val);
  }, []);

  const handleChangeDebounced = useCallback((val) => {
    setLocalValue(val);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      const { id, propKey, updateProp } = stateRef.current;
      updateProp(id, propKey, val);
    }, 100); // 100ms debounce
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleBlur = () => {
    commitValue(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitValue(localValue);
      e.target.blur();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <input
        type="color"
        value={localValue && localValue !== 'transparent' ? localValue : '#000000'}
        style={{ width: '36px', height: '36px', padding: '0', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'transparent' }}
        className="shrink-0 shadow-sm hover:scale-105 transition-transform"
        onChange={(e) => handleChangeDebounced(e.target.value)}
      />
      <input
        type="text"
        value={localValue || ''}
        style={{ height: '36px', paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', letterSpacing: '0.05em' }}
        className="w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-mono text-center text-slate-900"
        placeholder="#HEXCODE"
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default function PropertiesPanel({ appState }) {
  const {
    screens, activeScreen, selectedId, selectedComponent,
    setSelectedId, updateProp, removeComponent, addScreen, renameComponent,
    media
  } = appState;

  const [newScreenName, setNewScreenName] = useState('');
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetPickerProp, setAssetPickerProp] = useState({ key: '', filter: 'image', currentValue: '' });

  const MEDIA_PROPERTIES = useMemo(() => ({
    BackgroundImage: 'image',
    Picture: 'image',
    Image: 'image',
    Source: 'all',
  }), []);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];
  const components = currentScreen?.components || [];
  const nonVisibleComponents = currentScreen?.nonVisibleComponents || [];

  const LENGTH_AUTO = -1;
  const LENGTH_FILL = -2;

  // Leap Style Width/Height options
  const sizeOptions = {
    Width: [
      { value: LENGTH_AUTO, label: 'Automatic' },
      { value: LENGTH_FILL, label: 'Fill parent...' },
      { value: 'custom', label: 'Custom (pixels)...' }
    ],
    Height: [
      { value: LENGTH_AUTO, label: 'Automatic' },
      { value: LENGTH_FILL, label: 'Fill parent...' },
      { value: 'custom', label: 'Custom (pixels)...' }
    ]
  };

  const enumOptions = {
    TextAlignment: ['left', 'center', 'right'],
    Shape: ['default', 'rounded', 'rectangular', 'oval'],
    AlignHorizontal: ['Left', 'Center', 'Right'],
    AlignVertical: ['Top', 'Center', 'Bottom'],
    ScreenOrientation: ['Unspecified', 'Portrait', 'Landscape', 'Sensor', 'User', 'Behind', 'NoSensor', 'FullSensor', 'ReversePortrait', 'ReverseLandscape', 'SensorPortrait', 'SensorLandscape'],
    HorizontalAlignment: ['Left', 'Center', 'Right']
  };

  const handleAddScreen = () => {
    if (newScreenName.trim() && !screens.find(s => s.id === newScreenName.trim())) {
      addScreen(newScreenName.trim());
      setNewScreenName('');
      setIsAddingScreen(false);
    }
  };

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleStartRename = () => {
    if (!selectedComponent) return;
    setIsRenaming(true);
    setRenameValue(selectedComponent.id);
  };

  const handleRenameSubmit = () => {
    if (!selectedComponent) return;
    const oldId = selectedComponent.id;
    const newId = renameValue?.trim();
    if (newId && newId !== oldId && renameComponent) {
      renameComponent(oldId, newId);
    }
    setIsRenaming(false);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue('');
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
            fullProps[name] = name === 'Enabled' ? true : false;
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
        'Latitude', 'Longitude', 'ZoomLevel',
        'HorizontalAlignment'
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
      const isAuto = value === LENGTH_AUTO;
      const isFill = value === LENGTH_FILL;
      const isCustom = typeof value === 'number' && value > 0;
      const currentValue = isAuto ? LENGTH_AUTO : (isFill ? LENGTH_FILL : 'custom');

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
                  updateProp(id, key, parseInt(newValue, 10));
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
            <ColorPickerInput
              key={`${id}-${key}`}
              id={id}
              propKey={key}
              value={value}
              updateProp={updateProp}
            />
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
          ) : MEDIA_PROPERTIES[key] ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={value ?? ''}
                readOnly
                style={{ height: '36px', paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, cursor: 'pointer' }}
                className="w-full"
                placeholder="None"
                onClick={() => {
                  setAssetPickerProp({ key, filter: MEDIA_PROPERTIES[key], currentValue: value || '' });
                  setAssetPickerOpen(true);
                }}
              />
              <button
                onClick={() => {
                  setAssetPickerProp({ key, filter: MEDIA_PROPERTIES[key], currentValue: value || '' });
                  setAssetPickerOpen(true);
                }}
                style={{ padding: '8px 12px', height: '36px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#0f172a', cursor: 'pointer', whiteSpace: 'nowrap' }}
                className="hover:bg-white hover:border-blue-300 transition-all"
              >
                Select
              </button>
              {value ? (
                <button
                  onClick={() => updateProp(id, key, '')}
                  style={{ padding: '8px', height: '36px', width: '36px', fontSize: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}
                  className="hover:bg-red-50 hover:border-red-300 transition-all"
                  title="Clear"
                >
                  ×
                </button>
              ) : null}
            </div>
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
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.02em', padding: '2px 8px', borderRadius: '6px', border: '2px solid #3b82f6', backgroundColor: '#f8fafc', color: '#0f172a', width: '100%' }}
                  className="outline-none"
                />
              ) : (
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }} className="truncate">{id}</h3>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <span style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '6px', border: '1px solid #dbeafe', backgroundColor: '#eff6ff', color: '#2563eb' }}>{type}</span>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isRenaming && (
                <button
                  onClick={handleStartRename}
                  style={{ padding: '14px' }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-2xl transition-all shadow-sm active:scale-95 group shrink-0"
                  title="Rename Module"
                >
                  <Pencil style={{ width: '20px', height: '20px' }} className="transition-transform group-hover:scale-110" />
                </button>
              )}
              <button
                onClick={() => setDeleteConfirm({ id, type: selectedComponent.type })}
                style={{ padding: '14px' }}
                className="bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-100 rounded-2xl transition-all shadow-sm active:scale-95 group shrink-0"
                title="Delete Module"
              >
                <Trash2 style={{ width: '20px', height: '20px' }} className="transition-transform group-hover:rotate-12" />
              </button>
            </div>
          </div>
        </div>

        {/* Categorized Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(categorizedProps).map(([category, props]) => (
            <div key={category} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                style={{ padding: '16px 20px', fontSize: '11px', fontWeight: '900' }}
                className="w-full flex items-center justify-between bg-white text-slate-900 hover:bg-slate-50 transition-all border-b border-slate-100 uppercase tracking-[0.2em] font-sans"
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
        style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px' }}
        className="bg-gradient-to-b from-white to-slate-50 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-sm"
      >
        <span className="text-[16px] font-bold uppercase tracking-[0.08em] text-slate-900">Properties</span>
      </div>
      {/* Property Editor */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden leap-panel-body">
        {renderPropertyEditor()}
      </div>
      {assetPickerOpen && (
        <AssetPicker
          isOpen={assetPickerOpen}
          onClose={() => setAssetPickerOpen(false)}
          onSelect={(filename) => {
            updateProp(selectedId, assetPickerProp.key, filename);
            setAssetPickerOpen(false);
          }}
          media={media || []}
          filterType={assetPickerProp.filter}
          currentValue={assetPickerProp.currentValue}
        />
      )}
      {deleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-[20px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)] w-full max-w-[380px] overflow-hidden border border-slate-100 animate-scale-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <span className="text-[17px] font-bold text-slate-900 tracking-tight">Delete Module</span>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 flex-1">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 shadow-inner">
                <ComponentIcon type={deleteConfirm.type} size={36} />
                <div>
                  <div className="text-[15px] font-bold text-slate-900 leading-snug">{deleteConfirm.id}</div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mt-0.5">{deleteConfirm.type}</div>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-slate-500 font-medium leading-relaxed">
                Are you sure you want to delete this module? This action cannot be undone. All properties and block references will be permanently removed.
              </p>
            </div>
            <div 
              style={{
                padding: '18px 24px 24px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                flexShrink: 0
              }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#475569',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                className="hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeComponent(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                className="hover:shadow-rose-500/35 hover:brightness-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
