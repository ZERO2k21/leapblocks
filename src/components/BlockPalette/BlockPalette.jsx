import React, { useState, useRef, useEffect } from 'react';
import blockDefinitions, { COLORS } from '../../blocks/blockDefinitions';
import './BlockPalette.css';

const BlockPalette = ({ workspace, onBlockDragStart }) => {
    const [activeCategory, setActiveCategory] = useState('motion');
    const paletteRef = useRef(null);
    const categoryRefs = useRef({});

    const categories = [
        { id: 'motion', name: 'Motion', color: COLORS.motion },
        { id: 'looks', name: 'Looks', color: COLORS.looks },
        { id: 'sound', name: 'Sound', color: COLORS.sound },
        { id: 'events', name: 'Events', color: COLORS.events },
        { id: 'control', name: 'Control', color: COLORS.control },
        { id: 'sensing', name: 'Sensing', color: COLORS.sensing },
        { id: 'operators', name: 'Operators', color: COLORS.operators },
        { id: 'variables', name: 'Variables', color: COLORS.variables },
        { id: 'list', name: 'My Lists', color: COLORS.variables },
        { id: 'myblocks', name: 'My Blocks', color: COLORS.myblocks },
    ];

    const scrollToCategory = (id) => {
        setActiveCategory(id);
        const element = categoryRefs.current[id];
        if (element && paletteRef.current) {
            paletteRef.current.scrollTo({
                top: element.offsetTop - 10,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (!paletteRef.current) return;
        const scrollPos = paletteRef.current.scrollTop + 50;
        
        for (const cat of categories) {
            const element = categoryRefs.current[cat.id];
            if (element && element.offsetTop <= scrollPos && (element.offsetTop + element.offsetHeight) > scrollPos) {
                setActiveCategory(cat.id);
                break;
            }
        }
    };

    const renderBlock = (opcode, def) => {
        // This is a simplified visual representation of the block for the palette
        // In a full implementation, this might render an SVG that matches Scratch's shapes
        return (
            <div 
                key={opcode}
                className={`block-item block-shape-${def.shape}`}
                style={{ '--block-color': def.color }}
                draggable
                onDragStart={(e) => onBlockDragStart(e, opcode)}
            >
                <div className="block-content">
                    {def.message.split(/%(\d+)/).map((part, i) => {
                        const inputIndex = parseInt(part) - 1;
                        if (!isNaN(inputIndex) && def.inputs[inputIndex]) {
                            const input = def.inputs[inputIndex];
                            return (
                                <div key={i} className={`block-input block-input-${input.type}`}>
                                    {input.default !== undefined ? input.default : ''}
                                </div>
                            );
                        }
                        return <span key={i}>{part}</span>;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="block-palette-container">
            {/* Sidebar with color pills */}
            <div className="category-sidebar">
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => scrollToCategory(cat.id)}
                        title={cat.name}
                    >
                        <div className="pill-dot" style={{ backgroundColor: cat.color }} />
                        <span className="pill-label">{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Main Palette Area */}
            <div 
                className="palette-scroll-area" 
                ref={paletteRef}
                onScroll={handleScroll}
            >
                {categories.map(cat => {
                    const categoryBlocks = Object.entries(blockDefinitions)
                        .filter(([_, def]) => def.category === cat.id);
                    
                    if (categoryBlocks.length === 0 && cat.id !== 'variables' && cat.id !== 'myblocks') return null;

                    return (
                        <div 
                            key={cat.id} 
                            className="palette-category-group"
                            ref={el => categoryRefs.current[cat.id] = el}
                        >
                            <h3 className="category-title">{cat.name}</h3>
                            
                            {cat.id === 'variables' && (
                                <button className="palette-action-btn var-btn">Make a Variable</button>
                            )}
                            {cat.id === 'list' && (
                                <button className="palette-action-btn list-btn">Make a List</button>
                            )}
                            {cat.id === 'myblocks' && (
                                <button className="palette-action-btn block-btn">Make a Block</button>
                            )}

                            <div className="category-blocks">
                                {categoryBlocks.map(([opcode, def]) => renderBlock(opcode, def))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BlockPalette;
