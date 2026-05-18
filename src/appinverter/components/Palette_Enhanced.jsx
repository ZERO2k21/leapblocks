/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Enhanced Palette Component - Matches Leap App Inventor functionality
 */
import React, { useState } from 'react';
import { PALETTE_ENHANCED } from '../data/paletteComponents_Enhanced';
import { Search, ChevronDown, ChevronRight, Info } from 'lucide-react';

export default function PaletteEnhanced() {
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [hoveredComponent, setHoveredComponent] = useState(null);

    // Group by category
    const categories = PALETTE_ENHANCED.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {});

    const toggleCategory = (cat) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    const handleDragStart = (e, component) => {
        e.dataTransfer.setData('componentType', component.type);
        e.dataTransfer.setData('componentData', JSON.stringify(component));

        // Create drag preview
        const dragPreview = document.createElement('div');
        dragPreview.className = 'bg-white border-2 border-indigo-500 rounded-2xl p-4 shadow-2xl flex items-center gap-3 scale-90 origin-top-left';
        dragPreview.innerHTML = `<div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-2xl text-indigo-600">${component.icon}</div> <span class="text-sm font-extrabold text-slate-900 uppercase tracking-widest">${component.label}</span>`;
        dragPreview.style.position = 'absolute';
        dragPreview.style.top = '-1000px';
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 0, 0);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                <div className="relative w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search modules..."
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Component Categories */}
            <div className="flex-1 overflow-y-auto">
                {Object.entries(categories).map(([category, items]) => {
                    const filteredItems = items.filter(item =>
                        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    );

                    if (filteredItems.length === 0) return null;

                    const isCollapsed = collapsedCategories[category];

                    return (
                        <div key={category} className="palette-category mx-4 mt-4 last:mb-4">
                            {/* Category Header */}
                            <button
                                className={`palette-category-header w-full ${!isCollapsed ? 'active' : ''}`}
                                onClick={() => toggleCategory(category)}
                            >
                                <span className="flex items-center gap-3">
                                    <div className="palette-category-icon-wrapper">
                                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                    <span className="tracking-[0.05em] font-extrabold">{category}</span>
                                </span>
                                <span className="text-[12px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-black shadow-sm border border-slate-200">{filteredItems.length}</span>
                            </button>

                            {/* Category Items */}
                            {!isCollapsed && (
                                <div className="palette-item-grid bg-slate-50/20">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item.type}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onMouseEnter={() => setHoveredComponent(item)}
                                            onMouseLeave={() => setHoveredComponent(null)}
                                            className="palette-item-pro relative"
                                            title={item.description}
                                        >
                                            <span className="palette-item-icon-pro">{item.icon}</span>
                                            <span className="palette-item-label-pro">{item.label}</span>

                                            {/* Info icon */}
                                            {item.description && (
                                                <Info className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}

                                            {/* Tooltip */}
                                            {hoveredComponent?.type === item.type && item.description && (
                                                <div className="fixed left-72 top-auto z-50 w-72 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl p-5 shadow-pro pointer-events-none border border-white/10 animate-fade-in">
                                                    <div className="font-extrabold mb-2 text-indigo-400 uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                        {item.label}
                                                    </div>
                                                    <div className="text-slate-300 leading-relaxed font-medium">{item.description}</div>
                                                    {item.visible !== undefined && (
                                                        <div className="mt-2 text-gray-400 italic">
                                                            {item.visible ? 'Visible component' : 'Non-visible component'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Info */}
            <div className="p-5 border-t border-slate-200 bg-white text-[12px] font-extrabold text-slate-400 text-center uppercase tracking-[0.15em]">
                {PALETTE_ENHANCED.length} MODULES DETECTED
            </div>
        </div>
    );
}

