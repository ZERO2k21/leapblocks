import React, { useState } from 'react';

// Define costume categories
const CATEGORIES = [
    { id: 'All', color: '#FF4C4C' },
    { id: 'Animals', color: '#4C97FF' },
    { id: 'People', color: '#9966FF' },
    { id: 'Fantasy', color: '#CF63CF' },
    { id: 'Dance', color: '#E066FF' },
    { id: 'Music', color: '#FFAB19' },
    { id: 'Sports', color: '#FF8C1A' },
    { id: 'Food', color: '#0FBD8C' },
    { id: 'Fashion', color: '#F97316' },
    { id: 'Letters', color: '#FF6680' },
    { id: 'Objects', color: '#855CD6' },
    { id: 'Transport', color: '#4CBFE6' },
];

const DEFAULT_COSTUMES = [
    { name: 'Robot Idle', src: 'assets/sprites/robot/robot_idle.svg', category: 'Fantasy' },
    { name: 'Robot Talk 1', src: 'assets/sprites/robot/image-removebg-preview.png', category: 'Fantasy' },
    { name: 'Robot Talk 2', src: 'assets/sprites/robot/robot_talk1.svg', category: 'Fantasy' },
    { name: 'Robot Wave 1', src: 'assets/sprites/robot/image-removebg-preview (1).png', category: 'Fantasy' },
    { name: 'Robot Wave 2', src: 'assets/sprites/robot/robot_wave1.svg', category: 'Fantasy' },
    { name: 'Robot Wave 3', src: 'assets/sprites/robot/image-Photoroom.png', category: 'Fantasy' },
    { name: 'Robot Wave 4', src: 'assets/sprites/robot/robot_wave2.svg', category: 'Fantasy' },
    { name: 'Cat', src: 'assets/sprites/leap/cat.svg', category: 'Animals' },
];

interface CostumeLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCostume: (name: string, src: string) => void;
}

export const CostumeLibrary: React.FC<CostumeLibraryProps> = ({
    isOpen,
    onClose,
    onSelectCostume
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    if (!isOpen) return null;

    const filteredCostumes = DEFAULT_COSTUMES.filter(costume => {
        const matchesCategory = activeCategory === 'All' || costume.category === activeCategory;
        const matchesSearch = !searchQuery ||
            costume.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSelect = (costume: typeof DEFAULT_COSTUMES[0]) => {
        const img = new Image();
        img.onload = () => {
            onSelectCostume(costume.name, costume.src);
        };
        img.onerror = () => {
            console.warn(`Could not load ${costume.name}, skipping.`);
            onSelectCostume(costume.name, costume.src);
        };
        img.src = costume.src;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-xs p-4" onClick={onClose}>
            <div className="bg-white w-4/5 max-w-5xl h-[80vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-purple-600 text-white">
                    <h2 className="m-0 text-xl font-semibold">Choose a Costume</h2>
                    <button type="button" className="bg-transparent border-0 text-white text-2xl cursor-pointer py-1 px-2 rounded hover:bg-white/20 transition-colors" onClick={onClose}>✕</button>
                </div>

                {/* Search and Category Bar */}
                <div className="p-3 px-4 bg-gray-50 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Search costumes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 px-3 rounded-lg border border-gray-300 text-sm mb-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-sans"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={`py-1 px-3 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                    activeCategory === cat.id ? 'text-white border-0' : 'text-gray-700 bg-gray-200 border-0 hover:bg-gray-300'
                                }`}
                                style={{
                                    backgroundColor: activeCategory === cat.id ? cat.color : undefined,
                                }}
                            >
                                {cat.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Costume Grid */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto flex-1">
                    {filteredCostumes.map(costume => (
                        <div
                            key={costume.name + costume.src}
                            className="flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-100"
                            onClick={() => handleSelect(costume)}
                        >
                            <div className="w-full aspect-square rounded-lg relative flex items-center justify-center text-3xl mb-2 border-2 border-gray-200 bg-slate-50 overflow-hidden">
                                <img
                                    src={costume.src}
                                    alt={costume.name}
                                    className="absolute inset-0 w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        e.currentTarget.classList.add('hidden');
                                    }}
                                />
                            </div>
                            <div className="text-xs font-medium text-gray-700 text-center break-words">{costume.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CostumeLibrary;
