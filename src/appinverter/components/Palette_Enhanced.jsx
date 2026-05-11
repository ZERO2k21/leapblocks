/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Enhanced Palette Component - Matches MIT App Inventor functionality
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
        dragPreview.className = 'bg-white border-2 border-purple-500 rounded-lg p-2 shadow-lg';
        dragPreview.innerHTML = `<span class="text-lg">${component.icon}</span> <span class="text-sm font-medium">${component.label}</span>`;
        dragPreview.style.position = 'absolute';
        dragPreview.style.top = '-1000px';
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 0, 0);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
    };

    return (
        <div className="w-[250px] bg-[#f7f9fc] border-r border-[#c6cfda] flex flex-col h-full overflow-hidden shrink-0">
            {/* Header */}
            <div className="p-3 border-b border-[#c6cfda] bg-[#dfe6ee]">
                <h2 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wide mb-2">Palette</h2>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search components..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-[#b7c4d4] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#4a90e2] focus:border-[#4a90e2]"
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
                        <div key={category} className="border-b border-[#e1e8f0] last:border-b-0">
                            {/* Category Header */}
                            <button
                                className="w-full flex items-center justify-between px-3 py-2 bg-[#eef3f8] hover:bg-[#e3ebf4] text-xs font-bold text-[#2c3e50] uppercase tracking-wide transition-colors"
                                onClick={() => toggleCategory(category)}
                            >
                                <span className="flex items-center gap-2">
                                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    {category}
                                </span>
                                <span className="text-xs text-gray-500 font-normal">{filteredItems.length}</span>
                            </button>

                            {/* Category Items */}
                            {!isCollapsed && (
                                <div className="p-2 space-y-0.5">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item.type}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onMouseEnter={() => setHoveredComponent(item)}
                                            onMouseLeave={() => setHoveredComponent(null)}
                                            className="group relative flex items-center space-x-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-[#e8f1ff] text-gray-700 text-sm transition-all border border-transparent hover:border-[#b9d4ff]"
                                            title={item.description}
                                        >
                                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                                            <span className="flex-1 font-medium">{item.label}</span>

                                            {/* Info icon */}
                                            {item.description && (
                                                <Info className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}

                                            {/* Tooltip */}
                                            {hoveredComponent?.type === item.type && item.description && (
                                                <div className="absolute left-full ml-2 top-0 z-50 w-64 bg-[#263238] text-white text-xs rounded p-3 shadow-xl pointer-events-none">
                                                    <div className="font-bold mb-1">{item.label}</div>
                                                    <div className="text-gray-300">{item.description}</div>
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
            <div className="p-2 border-t border-[#c6cfda] bg-[#eef3f8] text-xs text-gray-500 text-center">
                {PALETTE_ENHANCED.length} components available
            </div>
        </div>
    );
}
