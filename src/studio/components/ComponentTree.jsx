/**
* Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
* All rights reserved. Proprietary and confidential.
* Unauthorized copying, distribution, or modification is strictly prohibited.
*/
import React, { useEffect, useState } from 'react';

/**
 * ComponentTree - Displays hierarchical tree of components on current screen
 * Inspired by Leap App Inventor's component hierarchy panel
 */
export default function ComponentTree({ appState }) {
    const { currentScreen, selectedComponent, selectComponent, deleteComponent, renameComponent } = appState;
    const [expandedNodes, setExpandedNodes] = useState(new Set(['Screen1']));
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [contextMenu, setContextMenu] = useState(null);

    if (!currentScreen) {
        return (
            <div className="p-4 text-center text-slate-900 text-sm font-bold">
                No screen selected
            </div>
        );
    }

    useEffect(() => {
        setExpandedNodes(prev => {
            if (prev.has(currentScreen.id)) return prev;
            return new Set([...prev, currentScreen.id]);
        });
    }, [currentScreen.id]);

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const handleRename = (component) => {
        setRenamingId(component.id);
        setRenameValue(component.id);
    };

    const handleRenameSubmit = (oldId) => {
        if (renameValue && renameValue !== oldId) {
            renameComponent(oldId, renameValue);
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const handleContextMenu = (e, component) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            component
        });
    };

    const handleDelete = (component) => {
        if (window.confirm(`Delete ${component.id}?`)) {
            deleteComponent(component.id);
        }
        setContextMenu(null);
    };

    const renderComponent = (component, depth = 0) => {
        const isExpanded = expandedNodes.has(component.id);
        const isSelected = selectedComponent?.id === component.id;
        const hasChildren = component.children && component.children.length > 0;
        const isRenaming = renamingId === component.id;

        // Component icon based on type
        const getIcon = (type) => {
            const icons = {
                Button: '🔲',
                Label: '📝',
                TextBox: '📄',
                Image: '🖼️',
                CheckBox: '☑️',
                Slider: '🎚️',
                Switch: '🔘',
                HorizontalArrangement: '↔️',
                VerticalArrangement: '↕️',
                TableArrangement: '📊',
                Canvas: '🎨',
                Camera: '📷',
                Sound: '🔊',
                TinyDB: '💾',
                LocationSensor: '📍',
                Web: '🌐',
            };
            return icons[type] || '📦';
        };

        return (
            <div key={component.id}>
                <div
                    className={`relative flex items-center py-4 px-5 rounded-2xl cursor-pointer transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] mx-3 mb-1.5 border-2 text-[15px] font-bold text-slate-900 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[4px] before:rounded-r before:bg-blue-500 before:transition-all before:duration-250 before:ease-[cubic-bezier(0.4,0,0.2,1)] ${isSelected
                        ? 'bg-gradient-to-br from-blue-500/12 to-blue-500/6 border-blue-500/30 text-blue-600 shadow-md shadow-blue-500/20 translate-x-1 before:h-[80%]'
                        : 'border-transparent hover:bg-gradient-to-r hover:from-blue-500/3 hover:to-transparent hover:translate-x-0.5 before:h-0 hover:before:h-[60%]'
                        }`}
                    style={{ marginLeft: `${depth * 14}px` }}
                    onClick={() => selectComponent(component.id)}
                    onContextMenu={(e) => handleContextMenu(e, component)}
                >
                    {/* Expand/Collapse Arrow */}
                    {hasChildren && (
                        <button
                            className="w-5 h-5 flex items-center justify-center mr-1.5 text-slate-900 hover:text-black text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(component.id);
                            }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!hasChildren && <span className="w-5 mr-1.5"></span>}

                    {/* Component Icon */}
                    <span className="mr-2.5 text-base">{getIcon(component.type)}</span>

                    {/* Component Name */}
                    {isRenaming ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameSubmit(component.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit(component.id);
                                if (e.key === 'Escape') {
                                    setRenamingId(null);
                                    setRenameValue('');
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-0.5 text-sm border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            autoFocus
                        />
                    ) : (
                        <div className="flex-1 min-w-0">
                            <span className="text-[15px] block truncate">{component.id}</span>
                            <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                                {component.props?.Text || component.props?.Hint || component.type}
                            </span>
                        </div>
                    )}
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {component.children.map((child) => renderComponent(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Standardized Header */}
            <div
                style={{ paddingTop: '24px', paddingBottom: '16px', paddingLeft: '32px', paddingRight: '24px' }}
                className="bg-gradient-to-b from-white to-slate-50 backdrop-blur-md border-b-2 border-slate-200 flex items-center justify-between shrink-0 shadow-sm"
            >
                <span className="text-[19px] font-black uppercase tracking-[0.15em] text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.8)]">Components</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Screen Node */}
                <div
                    className={`flex items-center py-4.5 px-6 border-b border-slate-100 font-extrabold text-[15px] cursor-pointer transition-all sticky top-0 z-10 backdrop-blur-md uppercase tracking-[0.1em] ${selectedComponent?.id === currentScreen.id
                        ? 'bg-blue-50/70 text-blue-600 border-l-4 border-l-blue-500'
                        : 'bg-slate-50/50 text-slate-900 hover:bg-slate-100'
                        }`}
                    onClick={() => selectComponent(currentScreen.id)}
                >
                    <button 
                        className="w-6 h-6 flex items-center justify-center mr-3 text-slate-900 text-xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(currentScreen.id);
                        }}
                    >
                        {expandedNodes.has(currentScreen.id) ? '▼' : '▶'}
                    </button>
                    <span className="mr-3 opacity-100 text-xl">📱</span>
                    <span className="truncate">{currentScreen.id}</span>
                </div>

                {/* Visible Components */}
                {expandedNodes.has(currentScreen.id) && (
                    <div className="py-2">
                        {currentScreen.components && currentScreen.components.length > 0 ? (
                            currentScreen.components.map((comp) => renderComponent(comp, 0))
                        ) : (
                            <div className="px-10 py-16 text-center">
                                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">Empty Screen</p>
                                <p className="text-[11px] text-slate-900 font-medium mt-2">Drag components from palette</p>
                            </div>
                        )}

                        {/* Non-Visible Components Section */}
                        {currentScreen.nonVisibleComponents && currentScreen.nonVisibleComponents.length > 0 && (
                            <div className="mt-4 border-t border-slate-200">
                                <div className="py-2.5 px-5 bg-slate-50/80 text-xs text-slate-900 font-extrabold uppercase tracking-wider border-b border-slate-100">
                                    Non-visible components
                                </div>
                                {currentScreen.nonVisibleComponents.map((comp) => renderComponent(comp, 0))}
                            </div>
                        )}
                    </div>
                )}

                {/* Context Menu */}
                {contextMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setContextMenu(null)}
                        />
                        <div
                            className="fixed z-50 bg-white border-2 border-slate-200 rounded-xl shadow-2xl py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                        >
                            <button
                                className="w-full px-5 py-2.5 text-left text-[14px] hover:bg-slate-50 text-slate-900 flex items-center gap-3 transition-colors font-semibold"
                                onClick={() => {
                                    handleRename(contextMenu.component);
                                    setContextMenu(null);
                                }}
                            >
                                <span className="text-lg">✏️</span> Rename
                            </button>
                            <button
                                className="w-full px-5 py-2.5 text-left text-[14px] hover:bg-slate-50 text-slate-900 flex items-center gap-3 transition-colors font-semibold"
                                onClick={() => {
                                    // Copy functionality
                                    setContextMenu(null);
                                }}
                            >
                                <span className="text-lg">📋</span> Copy
                            </button>
                            <div className="border-t border-slate-100 my-2"></div>
                            <button
                                className="w-full px-5 py-2.5 text-left text-[14px] hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors font-semibold"
                                onClick={() => handleDelete(contextMenu.component)}
                            >
                                <span className="text-lg">🗑️</span> Delete
                            </button>
                        </div>

                    </>
                )}
            </div>
        </div>
    );
}

