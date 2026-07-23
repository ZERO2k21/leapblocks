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
import { Trash2, Smartphone, ChevronDown, ChevronRight, Pencil, X } from 'lucide-react';
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
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        value={localValue && localValue !== 'transparent' ? localValue : '#000000'}
        className="w-9 h-9 p-0 cursor-pointer border border-slate-300 rounded-lg bg-transparent shrink-0 shadow-sm hover:scale-105 transition-transform"
        onChange={(e) => handleChangeDebounced(e.target.value)}
      />
      <input
        type="text"
        value={localValue || ''}
        className="h-9 px-3 text-xs font-semibold bg-slate-50 text-slate-900 rounded-lg border border-slate-200 tracking-wider w-full hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-mono text-center"
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
    media, addMedia
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
        <div className="flex flex-col gap-2 w-full">
          <div className="relative">
            <select
              value={currentValue}
              className="w-full h-9 px-3 pr-8 text-xs font-semibold bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
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
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-900 pointer-events-none" />
          </div>

          {isCustom && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="9999"
                value={value}
                className="w-full h-9 px-3 text-xs font-semibold bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all flex-1"
                onChange={(e) => updateProp(id, key, parseInt(e.target.value) || 1)}
              />
              <span className="text-[10px] font-black text-slate-900 tracking-wider">PX</span>
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
            className="flex items-center justify-between py-3.5 px-5 border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-all duration-200"
          >
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
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
          className="flex flex-col gap-2 py-3.5 px-5 border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-all duration-200"
        >
          <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
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
                className="w-full h-9 px-3 pr-8 text-xs font-semibold bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                onChange={(e) => updateProp(id, key, e.target.value)}
              >
                {options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-900 pointer-events-none" />
            </div>
          ) : isArray ? (
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value || ''}
              placeholder="item1, item2, item3"
              className="w-full h-9 px-3 text-xs font-semibold bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
              onChange={(e) => {
                const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateProp(id, key, items);
              }}
            />
          ) : isNumber ? (
            <input
              type="number"
              value={value}
              className="w-full h-9 px-3 text-xs font-semibold bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
              onChange={(e) => updateProp(id, key, parseFloat(e.target.value) || 0)}
            />
          ) : MEDIA_PROPERTIES[key] ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={value ?? ''}
                readOnly
                className="w-full h-9 px-3 text-xs font-semibold bg-slate-100 text-slate-900 rounded-lg border border-slate-200 flex-1 cursor-pointer"
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
                className="py-2 px-3 h-9 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-900 cursor-pointer whitespace-nowrap hover:bg-white hover:border-blue-300 transition-all"
              >
                Select
              </button>
              {value ? (
                <button
                  onClick={() => updateProp(id, key, '')}
                  className="p-2 h-9 w-9 text-sm rounded-lg border border-slate-200 bg-red-50 text-red-600 cursor-pointer flex items-center justify-center font-bold hover:bg-red-100 hover:border-red-300 transition-all"
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
              className="w-full h-9 px-3 text-xs font-semibold bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
              onChange={(e) => updateProp(id, key, e.target.value)}
            />
          )}
        </div>
      );
    };

    return (
      <div className="min-h-full bg-transparent p-5">
        {/* Pro Header - Clean Flex Layout */}
        <div className="mb-6 flex flex-col bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <div className="h-1.5 bg-blue-600 w-full" />
          <div className="p-6 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Active Module</div>
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xl font-black tracking-tight p-0.5 px-2 rounded-md border-2 border-blue-500 bg-slate-50 text-slate-900 w-full outline-none"
                />
              ) : (
                <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">{id}</h3>
              )}
              <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                <span className="py-0.75 px-2 text-[10px] font-black uppercase tracking-wider rounded-md border border-blue-100 bg-blue-50 text-blue-600">{type}</span>
                <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider whitespace-nowrap">Selected</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {!isRenaming && (
                <button
                  onClick={handleStartRename}
                  className="w-10 h-10 bg-slate-50 hover:bg-blue-50/50 text-slate-500 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200/60 rounded-xl transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center group shrink-0 cursor-pointer"
                  title="Rename Module"
                >
                  <Pencil className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" />
                </button>
              )}
              <button
                onClick={() => setDeleteConfirm({ id, type: selectedComponent.type })}
                className="w-10 h-10 bg-slate-50 hover:bg-rose-50/60 text-slate-500 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200/60 rounded-xl transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center group shrink-0 cursor-pointer"
                title="Delete Module"
              >
                <Trash2 className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Categorized Properties */}
        <div className="flex flex-col gap-4">
          {Object.entries(categorizedProps).map(([category, props]) => (
            <div key={category} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                className="w-full flex items-center justify-between bg-white text-slate-900 hover:bg-slate-50 transition-all border-b border-slate-100 uppercase tracking-widest font-sans py-4 px-5 text-[11px] font-black"
                onClick={() => toggleSection(category)}
              >
                <span>{category}</span>
                {collapsedSections[category] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                )}
              </button>
              {!collapsedSections[category] && (
                <div className="flex flex-col bg-white">
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
      <div className="bg-gradient-to-b from-white to-slate-50 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-sm py-4 px-5">
        <span className="text-base font-bold uppercase tracking-wider text-slate-900">Properties</span>
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
          onUpload={(mediaItem) => {
            addMedia(mediaItem);
          }}
          media={media || []}
          filterType={assetPickerProp.filter}
          currentValue={assetPickerProp.currentValue}
        />
      )}
      {deleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[420px] max-w-[90vw] m-auto flex flex-col overflow-hidden border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-3 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5.5 h-5.5" />
                </div>
                <span className="text-lg font-black text-slate-800 tracking-tight">Delete Module</span>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 border border-slate-200 bg-transparent hover:bg-slate-100 cursor-pointer transition-colors shrink-0 ml-3"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pt-2 pb-5">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-3.5">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-200 shrink-0 text-indigo-600">
                  <ComponentIcon type={deleteConfirm.type} size={24} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-800 truncate max-w-[240px] leading-snug">{deleteConfirm.id}</div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                    {deleteConfirm.type}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed m-0">
                Deleting <span className="font-extrabold text-slate-800">{deleteConfirm.id}</span> will permanently remove all of its properties and block references from this project.
              </p>
            </div>

            {/* Footer */}
            <div className="p-7 px-6 flex justify-end gap-3 items-center bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="min-w-[120px] py-3.5 px-7 inline-flex items-center justify-center rounded-2xl font-extrabold text-sm border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeComponent(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="min-w-[130px] py-3.5 px-7 inline-flex items-center justify-center gap-2.5 rounded-2xl font-extrabold text-sm border-none bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all shadow-md shadow-rose-600/25 hover:shadow-lg hover:shadow-rose-600/30"
              >
                <Trash2 className="w-4.5 h-4.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
