/**
* Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
* All rights reserved. Proprietary and confidential.
* Unauthorized copying, distribution, or modification is strictly prohibited.
*/
import React, { useEffect, useState } from 'react';
import ComponentIcon from './ComponentIcon';

/**
 * ComponentTree - Displays hierarchical tree of components on current screen
 * Inspired by Leap App Inventor's component hierarchy panel
 */
const ARRANGEMENT_TYPES = new Set([
    'HorizontalArrangement',
    'HorizontalScrollArrangement',
    'VerticalArrangement',
    'VerticalScrollArrangement',
    'TableArrangement',
    'AbsoluteArrangement',
    'Canvas',
    'Map',
    'FeatureCollection'
]);

const findParentIdOfNode = (components, nodeId, currentParentId = null) => {
    if (!components) return null;
    for (const comp of components) {
        if (comp.id === nodeId) return currentParentId;
        if (comp.children?.length) {
            const result = findParentIdOfNode(comp.children, nodeId, comp.id);
            if (result) return result;
        }
    }
    return null;
};

export default function ComponentTree({ appState }) {
    const { currentScreen, selectedComponent, selectComponent, deleteComponent, renameComponent } = appState;
    const [expandedNodes, setExpandedNodes] = useState(new Set(['Screen1']));
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    if (!currentScreen) {
        return (
            <div className="p-4 text-center text-slate-900 text-sm font-bold">
                No screen selected
            </div>
        );
    }

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);

        const type = e.dataTransfer.getData('componentType');
        const componentData = e.dataTransfer.getData('componentData');
        if (!type) return;

        let visible = true;
        if (componentData) {
            try {
                const parsed = JSON.parse(componentData);
                if (parsed.visible === false) visible = false;
            } catch (err) {
                console.error(err);
            }
        }

        let parentId = null;
        if (visible && targetId && targetId !== currentScreen.id) {
            const isTargetLayout = ARRANGEMENT_TYPES.has(targetId) || targetId.includes('Layout') || targetId.includes('Arrangement');
            if (isTargetLayout) {
                parentId = targetId;
                selectComponent(targetId);
            } else {
                const computedParentId = findParentIdOfNode(currentScreen.components, targetId);
                if (computedParentId) {
                    parentId = computedParentId;
                    selectComponent(computedParentId);
                } else {
                    selectComponent(currentScreen.id);
                }
            }
        } else {
            selectComponent(currentScreen.id);
        }

        if (appState.addComponent) {
            appState.addComponent(type, { visible, parentId });
        }
    };

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

        const isDragOver = dragOverId === component.id;

        return (
            <div key={component.id}>
                <div
                    className={`relative flex items-center py-2 px-3 rounded-xl cursor-pointer mx-2 mb-0.5 transition-all ${isDragOver
                        ? 'bg-purple-100 text-purple-700 shadow-sm'
                        : isSelected
                            ? 'bg-purple-50 text-purple-700 shadow-sm'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    style={{ marginLeft: `${depth * 14}px` }}
                    onClick={() => selectComponent(component.id)}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId(component.id); }}
                    onDragLeave={(e) => { e.stopPropagation(); if (dragOverId === component.id) setDragOverId(null); }}
                    onDrop={(e) => handleDrop(e, component.id)}
                >
                    {/* Expand/Collapse Arrow */}
                    {hasChildren ? (
                        <button
                            className="w-5 h-5 flex items-center justify-center mr-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(component.id); }}
                            style={{ fontSize: '9px' }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    ) : (
                        <span className="w-5 mr-1 flex items-center justify-center">
                            <span className="w-1.5 h-[2px] bg-slate-300 rounded-full" />
                        </span>
                    )}

                    {/* Component Icon */}
                    <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: isSelected ? 'linear-gradient(135deg, #ede9fe, #f5f3ff)' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: '8px', flexShrink: 0,
                        border: `1px solid ${isSelected ? '#e9e5f5' : '#e2e8f0'}`
                    }}>
                        <ComponentIcon type={component.type} size={14} />
                    </div>

                    {/* Component Name */}
                    {isRenaming ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameSubmit(component.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit(component.id);
                                if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-0.5 text-[12px] border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
                            autoFocus
                        />
                    ) : (
                        <div className="flex-1 min-w-0">
                            <span className="text-[12.5px] font-semibold block truncate">{component.id}</span>
                            <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5 uppercase tracking-wider">
                                {component.type}
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
                style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px' }}
                className="bg-gradient-to-b from-white to-slate-50 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-sm"
            >
                <span className="text-[16px] font-bold uppercase tracking-[0.08em] text-slate-900">Components</span>
            </div>

            <div
                className="flex-1 overflow-y-auto overflow-x-hidden leap-panel-body"
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => handleDrop(e, currentScreen.id)}
            >
                {/* Screen Node */}
                <div
                    className={`relative flex items-center py-3 px-4 border-b cursor-pointer sticky top-0 z-10 backdrop-blur-md transition-all ${dragOverId === currentScreen.id
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : selectedComponent?.id === currentScreen.id
                            ? 'border-purple-200 bg-purple-50/80 text-purple-700'
                            : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    onClick={() => selectComponent(currentScreen.id)}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId(currentScreen.id); }}
                    onDragLeave={(e) => { e.stopPropagation(); if (dragOverId === currentScreen.id) setDragOverId(null); }}
                    onDrop={(e) => handleDrop(e, currentScreen.id)}
                >
                    <button
                        className="w-6 h-6 flex items-center justify-center mr-2 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(currentScreen.id); }}
                        style={{ fontSize: '9px' }}
                    >
                        {expandedNodes.has(currentScreen.id) ? '▼' : '▶'}
                    </button>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: '10px', flexShrink: 0, border: '1px solid #e9e5f5'
                    }}>
                        <ComponentIcon type="Screen" size={16} />
                    </div>
                    <span className="text-[13px] font-bold truncate">{currentScreen.id}</span>
                </div>

                {/* Visible Components */}
                {expandedNodes.has(currentScreen.id) && (
                    <div className="py-2">
                        {currentScreen.components && currentScreen.components.length > 0 ? (
                            currentScreen.components.map((comp) => renderComponent(comp, 0))
                        ) : (
                            <div className="px-8 py-12 text-center">
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 12px', border: '1px solid #e2e8f0'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M12 8v8M8 12h8" />
                                    </svg>
                                </div>
                                <p className="text-[11px] font-bold text-slate-500">No Components Yet</p>
                                <p className="text-[10px] text-slate-400 mt-1">Drag from the palette</p>
                            </div>
                        )}

                        {/* Non-Visible Components Section */}
                        {currentScreen.nonVisibleComponents && currentScreen.nonVisibleComponents.length > 0 && (
                            <div className="mt-6 mx-2">
                                <div className="py-2 px-3 mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                    Non-visible
                                </div>
                                {currentScreen.nonVisibleComponents.map((comp) => renderComponent(comp, 0))}
                            </div>
                        )}
                    </div>
                )}

                {/* Context Menu Removed */}
            </div>
        </div>
    );
}

