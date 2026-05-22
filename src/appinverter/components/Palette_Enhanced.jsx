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
        dragPreview.className = 'bg-white border-2 border-orange-500 rounded-2xl p-4 shadow-2xl flex items-center gap-3 scale-90 origin-top-left';
        dragPreview.innerHTML = `<div class="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-2xl text-orange-600">${component.icon}</div> <span class="text-sm font-extrabold text-slate-900 uppercase tracking-widest">${component.label}</span>`;
        dragPreview.style.position = 'absolute';
        dragPreview.style.top = '-1000px';
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 0, 0);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <div className="pt-4 pb-3 px-4 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                <div className="relative w-full flex items-center">
                    <div className="absolute left-3 pointer-events-none flex items-center justify-center">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search modules..."
                        className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 shadow-sm"
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
                        <div key={category} className="mx-3 mt-3 last:mb-3 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm hover:border-orange-500/30 hover:shadow-md hover:-translate-y-0.5">
                            {/* Category Header */}
                            <button
                                className={`flex items-center justify-between w-full px-5 py-4 cursor-pointer font-black text-sm text-slate-800 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative tracking-wide border-b border-transparent hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 hover:text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-[3px] after:bg-gradient-to-r after:from-orange-500 after:to-cyan-500 after:transition-all after:duration-300 after:ease-[cubic-bezier(0.4,0,0.2,1)] ${!isCollapsed ? 'bg-gradient-to-br from-orange-500/5 to-orange-500/0 text-orange-500 border-b-orange-500/15 after:w-full' : 'bg-gradient-to-b from-white to-slate-50 after:w-0'}`}
                                onClick={() => toggleCategory(category)}
                            >
                                <span className="flex items-center gap-2">
                                    <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${!isCollapsed ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 scale-[1.08] border-transparent' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-orange-500/15 text-orange-500'}`}>
                                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className="tracking-[0.05em] font-extrabold">{category}</span>
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-black shadow-sm border border-slate-200">{filteredItems.length}</span>
                            </button>

                            {/* Category Items */}
                            {!isCollapsed && (
                                <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-b from-slate-50/50 to-white">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item.type}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onMouseEnter={() => setHoveredComponent(item)}
                                            onMouseLeave={() => setHoveredComponent(null)}
                                            className="group/item relative flex flex-col items-center gap-2.5 p-4 text-center cursor-grab active:cursor-grabbing border-2 border-slate-200 rounded-2xl bg-gradient-to-b from-white to-slate-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-orange-500 before:to-cyan-400 before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300 hover:border-orange-500 hover:bg-gradient-to-br hover:from-orange-500/5 hover:to-white hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10"
                                            title={item.description}
                                        >
                                            <span className="text-3xl text-slate-600 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] grayscale-[20%] group-hover/item:scale-110 group-hover/item:rotate-6 group-hover/item:text-orange-500 group-hover/item:grayscale-0">{item.icon}</span>
                                            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider transition-colors duration-300 leading-tight group-hover/item:text-orange-500 group-hover/item:font-black">{item.label}</span>

                                            {/* Info icon */}
                                            {item.description && (
                                                <Info className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}

                                            {/* Tooltip */}
                                            {hoveredComponent?.type === item.type && item.description && (
                                                <div className="fixed left-72 top-auto z-50 w-72 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl p-5 shadow-pro pointer-events-none border border-white/10 animate-fade-in">
                                                    <div className="font-extrabold mb-2 text-orange-400 uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(255,122,0,0.8)]" />
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

