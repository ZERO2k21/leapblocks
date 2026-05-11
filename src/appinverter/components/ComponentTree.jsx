/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useState } from 'react';

/**
 * ComponentTree - Displays hierarchical tree of components on current screen
 * Inspired by MIT App Inventor's component hierarchy panel
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
                    className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-100 border-l-2 border-blue-500' : ''
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
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
                            className="flex-1 px-1 py-0 text-sm border border-blue-500 rounded focus:outline-none"
                            autoFocus
                        />
                    ) : (
                        <span className="flex-1 text-sm text-gray-800">{component.id}</span>
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
        <div className="relative">
            {/* Screen Node */}
            <div
                className="flex items-center py-2 px-2 bg-gray-50 border-b border-gray-200 font-semibold text-sm cursor-pointer hover:bg-gray-100"
                onClick={() => toggleExpand(currentScreen.id)}
            >
                <button className="w-4 h-4 flex items-center justify-center mr-1 text-gray-600">
                    {expandedNodes.has(currentScreen.id) ? '▼' : '▶'}
                </button>
                <span className="mr-2">📱</span>
                <span>{currentScreen.id}</span>
            </div>

            {/* Visible Components */}
            {expandedNodes.has(currentScreen.id) && (
                <div>
                    {currentScreen.components && currentScreen.components.length > 0 ? (
                        currentScreen.components.map((comp) => renderComponent(comp, 0))
                    ) : (
                        <div className="p-4 text-center text-gray-400 text-xs italic">
                            No components yet
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
                        className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-[150px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                                handleRename(contextMenu.component);
                                setContextMenu(null);
                            }}
                        >
                            <span>✏️</span> Rename
                        </button>
                        <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                                // Copy functionality
                                setContextMenu(null);
                            }}
                        >
                            <span>📋</span> Copy
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            onClick={() => handleDelete(contextMenu.component)}
                        >
                            <span>🗑️</span> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
