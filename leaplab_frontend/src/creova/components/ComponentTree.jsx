/**
* Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
* All rights reserved. Proprietary and confidential.
* Unauthorized copying, distribution, or modification is strictly prohibited.
*/
import React, { useEffect, useState } from 'react';
import ComponentIcon from './ComponentIcon';

/**
 * ComponentTree - Displays hierarchical tree of components on current screen
 * Sleek, professional sidebar tree UI inspired by Xcode / VS Code / Framer
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

const findComponentById = (id, list) => {
    if (!list) return null;
    for (const comp of list) {
        if (comp.id === id) return comp;
        if (comp.children?.length) {
            const found = findComponentById(id, comp.children);
            if (found) return found;
        }
    }
    return null;
};

const countComponents = (components) => {
    if (!components) return 0;
    let count = components.length;
    for (const comp of components) {
        if (comp.children?.length) {
            count += countComponents(comp.children);
        }
    }
    return count;
};

export default function ComponentTree({ appState }) {
    const { currentScreen, selectedComponent, selectComponent, deleteComponent, renameComponent, moveComponent } = appState;
    const [expandedNodes, setExpandedNodes] = useState(new Set(['Screen1']));
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [dragOverId, setDragOverId] = useState(null);
    const [draggedComponentId, setDraggedComponentId] = useState(null);
    const [dropPosition, setDropPosition] = useState(null);

    if (!currentScreen) {
        return (
            <div className="p-4 text-center text-slate-500 text-xs font-semibold">
                No screen selected
            </div>
        );
    }

    const handleDragStart = (e, compId) => {
        e.stopPropagation();
        e.dataTransfer.setData('draggedComponentId', compId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedComponentId(compId);
    };

    const handleDragEnd = () => {
        setDraggedComponentId(null);
        setDropPosition(null);
        setDragOverId(null);
    };

    const getDropPosition = (e, component) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const isContainer = ARRANGEMENT_TYPES.has(component.type);

        if (isContainer) {
            if (relativeY < rect.height * 0.25) return 'before';
            if (relativeY > rect.height * 0.75) return 'after';
            return 'inside';
        }
        return relativeY < rect.height / 2 ? 'before' : 'after';
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        setDropPosition(null);

        const draggedId = e.dataTransfer.getData('draggedComponentId') || draggedComponentId;

        if (draggedId) {
            if (draggedId === targetId) return;
            let position;
            if (targetId === currentScreen.id) {
                position = 'inside';
            } else {
                const targetNode = findComponentById(targetId, currentScreen.components);
                position = targetNode ? getDropPosition(e, targetNode) : 'after';
            }
            if (moveComponent) {
                moveComponent(draggedId, targetId, position);
            }
            setDraggedComponentId(null);
            return;
        }

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
            const targetNode = findComponentById(targetId, currentScreen.components);
            const isTargetLayout = targetNode && (ARRANGEMENT_TYPES.has(targetNode.type) || targetId.includes('Layout') || targetId.includes('Arrangement'));
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

    const handleRenameSubmit = (oldId) => {
        if (renameValue && renameValue !== oldId) {
            renameComponent(oldId, renameValue);
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const totalCount = (currentScreen.components ? countComponents(currentScreen.components) : 0) +
        (currentScreen.nonVisibleComponents ? currentScreen.nonVisibleComponents.length : 0);

    const renderComponent = (component, depth = 0) => {
        const isExpanded = expandedNodes.has(component.id);
        const isSelected = selectedComponent?.id === component.id;
        const hasChildren = component.children && component.children.length > 0;
        const isRenaming = renamingId === component.id;
        const isSelfDragged = draggedComponentId === component.id;

        const isDragOver = dragOverId === component.id && !isSelfDragged;
        const showTopIndicator = isDragOver && dropPosition === 'before';
        const showBottomIndicator = isDragOver && dropPosition === 'after';
        const showInsideIndicator = isDragOver && dropPosition === 'inside';

        return (
            <div key={component.id} className="relative">
                {/* Minimal Hierarchy Guide Line */}
                {depth > 0 && (
                    <div
                        className="absolute top-0 bottom-0 border-l border-slate-200/70 pointer-events-none"
                        style={{ left: `${(depth - 1) * 14 + 14}px` }}
                    />
                )}

                <div
                    className={`group relative flex items-center h-8 px-2 my-0.5 rounded-lg cursor-pointer transition-colors duration-100 select-none gap-1.5 ${isSelfDragged
                        ? 'opacity-30'
                        : showInsideIndicator
                            ? 'bg-purple-100 text-purple-900 ring-2 ring-purple-400 ring-inset'
                            : isSelected
                                ? 'bg-purple-100/90 text-purple-950 font-semibold shadow-2xs border border-purple-200/80'
                                : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                        }`}
                    style={{
                        paddingLeft: `${depth * 14 + 6}px`,
                        ...(showTopIndicator ? { borderTop: '2px solid #8b5cf6' } : {}),
                        ...(showBottomIndicator ? { borderBottom: '2px solid #8b5cf6' } : {}),
                    }}
                    onClick={() => selectComponent(component.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, component.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (component.id !== draggedComponentId) {
                            setDragOverId(component.id);
                            setDropPosition(getDropPosition(e, component));
                        }
                    }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={(e) => {
                        e.stopPropagation();
                        if (dragOverId === component.id) {
                            setDragOverId(null);
                            setDropPosition(null);
                        }
                    }}
                    onDrop={(e) => handleDrop(e, component.id)}
                >
                    {/* Expand/Collapse Chevron */}
                    {hasChildren ? (
                        <button
                            className="w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-purple-600 hover:bg-slate-200/60 transition-colors shrink-0"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(component.id); }}
                        >
                            <svg
                                width="9"
                                height="9"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    ) : (
                        <span className="w-4 flex items-center justify-center shrink-0">
                            <span className="w-1 h-1 bg-slate-300 group-hover:bg-purple-400 rounded-full transition-colors" />
                        </span>
                    )}

                    {/* Component Icon */}
                    <div className={`w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isSelected
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-500 border border-slate-200/70 group-hover:border-purple-200 group-hover:text-purple-600'
                        }`}>
                        <ComponentIcon type={component.type} size={13} />
                    </div>

                    {/* Component Name & Type Tag */}
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
                            className="flex-1 px-1.5 py-0.5 text-[11.5px] font-semibold border border-purple-400 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-300 bg-white text-slate-800"
                            autoFocus
                        />
                    ) : (
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 overflow-hidden">
                            <span className={`text-[12px] truncate transition-colors ${isSelected ? 'font-bold text-purple-950' : 'font-medium text-slate-700 group-hover:text-slate-900'
                                }`}>
                                {component.id}
                            </span>
                            <span className={`text-[9px] font-semibold uppercase tracking-wide shrink-0 transition-colors ${isSelected ? 'text-purple-700 font-bold' : 'text-slate-400 group-hover:text-purple-600'
                                }`}>
                                {component.type}
                            </span>
                        </div>
                    )}
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {component.children.map((child) => renderComponent(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden font-sans border-r border-slate-200/80">
            {/* Header */}
            <div className="h-10 px-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Components
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-bold">
                    {totalCount}
                </span>
            </div>

            <div
                className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 leap-panel-body"
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => handleDrop(e, currentScreen.id)}
            >
                {/* Screen Root Node */}
                <div
                    className={`group relative flex items-center h-8.5 px-2 my-0.5 rounded-lg cursor-pointer transition-colors duration-100 select-none gap-2 ${dragOverId === currentScreen.id && dropPosition === 'inside'
                        ? 'bg-purple-100 text-purple-900 ring-2 ring-purple-400 ring-inset'
                        : selectedComponent?.id === currentScreen.id
                            ? 'bg-purple-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100/90 text-slate-800 hover:bg-slate-200/70'
                        }`}
                    onClick={() => selectComponent(currentScreen.id)}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverId(currentScreen.id);
                        setDropPosition('inside');
                    }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={(e) => {
                        e.stopPropagation();
                        if (dragOverId === currentScreen.id) { setDragOverId(null); setDropPosition(null); }
                    }}
                    onDrop={(e) => handleDrop(e, currentScreen.id)}
                >
                    <button
                        className={`w-4 h-4 flex items-center justify-center rounded transition-colors shrink-0 ${selectedComponent?.id === currentScreen.id
                            ? 'text-white/80 hover:text-white'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        onClick={(e) => { e.stopPropagation(); toggleExpand(currentScreen.id); }}
                    >
                        <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-150 ${expandedNodes.has(currentScreen.id) ? 'rotate-90' : 'rotate-0'}`}
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    <div className={`w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0 ${selectedComponent?.id === currentScreen.id
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-100 text-purple-600'
                        }`}>
                        <ComponentIcon type="Screen" size={13} />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1 overflow-hidden">
                        <span className="text-[12.5px] font-bold truncate">{currentScreen.id}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide shrink-0 ${selectedComponent?.id === currentScreen.id
                            ? 'text-white/90'
                            : 'text-purple-600'
                            }`}>
                            Screen
                        </span>
                    </div>
                </div>

                {/* Visible Components Tree */}
                {expandedNodes.has(currentScreen.id) && (
                    <div className="py-0.5">
                        {currentScreen.components && currentScreen.components.length > 0 ? (
                            currentScreen.components.map((comp) => renderComponent(comp, 0))
                        ) : (
                            <div className="py-8 px-4 text-center flex flex-col items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 my-2">
                                <p className="text-[11.5px] font-semibold text-slate-500">No components added</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Drag items from palette</p>
                            </div>
                        )}

                        {/* Non-Visible Components Section */}
                        {currentScreen.nonVisibleComponents && currentScreen.nonVisibleComponents.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-200/70">
                                <div className="px-2 mb-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                                    Non-Visible
                                </div>
                                {currentScreen.nonVisibleComponents.map((comp) => renderComponent(comp, 0))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
