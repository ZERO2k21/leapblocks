/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { PALETTE } from '../data/paletteComponents';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

export default function Palette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Group by category
  const categories = PALETTE.reduce((acc, curr) => {
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

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('componentType', type);
  };

  return (
    <div className="w-[210px] bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#6c63ff] focus:border-[#6c63ff]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(categories).map(([category, items]) => {
          const filteredItems = items.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          const isCollapsed = collapsedCategories[category];

          return (
            <div key={category} className="border-b border-gray-100 last:border-b-0">
              <button
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 uppercase"
                onClick={() => toggleCategory(category)}
              >
                <span>{category}</span>
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {!isCollapsed && (
                <div className="p-2 space-y-1">
                  {filteredItems.map(item => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-purple-50 hover:text-[#6c63ff] text-gray-600 text-sm transition-colors"
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
