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
            <div className="p-4 text-center text-gray-500 text-sm">
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
                    className={`tree-node-pro ${isSelected ? 'selected' : ''}`}
                    style={{ marginLeft: `${depth * 12}px` }}
                    onClick={() => selectComponent(component.id)}
                    onContextMenu={(e) => handleContextMenu(e, component)}
                >
                    {/* Expand/Collapse Arrow */}
                    {hasChildren && (
                        <button
                            className="w-4 h-4 flex items-center justify-center mr-1 text-gray-600 hover:text-gray-900"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(component.id);
                            }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!hasChildren && <span className="w-4 mr-1"></span>}

                    {/* Component Icon */}
                    <span className="mr-2 text-sm">{getIcon(component.type)}</span>

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
                        <span className="flex-1 text-[13px]">{component.id}</span>
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
            <div className="leap-panel-header-pro">
                <span>Components</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Screen Node */}
                <div
                    className="flex items-center py-3.5 px-5 bg-slate-50/50 border-b border-slate-100 font-bold text-[13px] cursor-pointer hover:bg-slate-100 transition-all sticky top-0 z-10 backdrop-blur-md text-slate-800 uppercase tracking-[0.08em]"
                    onClick={() => toggleExpand(currentScreen.id)}
                >
                    <button className="w-5 h-5 flex items-center justify-center mr-2.5 text-slate-400">
                        {expandedNodes.has(currentScreen.id) ? '▼' : '▶'}
                    </button>
                    <span className="mr-2.5 opacity-70 text-lg">📱</span>
                    <span className="truncate">{currentScreen.id}</span>
                </div>

                {/* Visible Components */}
                {expandedNodes.has(currentScreen.id) && (
                    <div className="py-2">
                        {currentScreen.components && currentScreen.components.length > 0 ? (
                            currentScreen.components.map((comp) => renderComponent(comp, 0))
                        ) : (
                            <div className="px-10 py-16 text-center">
                                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-300">Empty Screen</p>
                                <p className="text-[11px] text-slate-300 font-medium mt-2">Drag components from palette</p>
                            </div>
                        )}

                        {/* Non-Visible Components Section */}
                        {currentScreen.nonVisibleComponents && currentScreen.nonVisibleComponents.length > 0 && (
                            <div className="mt-2 border-t border-gray-200">
                                <div className="py-1 px-2 bg-gray-50 text-xs text-gray-600 font-semibold">
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
                                className="w-full px-5 py-2.5 text-left text-[14px] hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-colors font-semibold"
                                onClick={() => {
                                    handleRename(contextMenu.component);
                                    setContextMenu(null);
                                }}
                            >
                                <span className="text-lg">✏️</span> Rename
                            </button>
                            <button
                                className="w-full px-5 py-2.5 text-left text-[14px] hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-colors font-semibold"
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

