/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useForgeStore } from '../../utlis/store/useForgeStore';

interface BoardSelectionModalProps {
    onSelect: (board: 'arduino-uno' | 'esp32-c3') => void;
    onClose: () => void;
}

export const BoardSelectionModal: React.FC<BoardSelectionModalProps> = ({ onSelect, onClose }) => {
    const uiTheme = useForgeStore(state => state.uiTheme);
    const ArduinoUnoPreview = 'leap-arduino-uno' as any;
    const Esp32C3Preview = 'leap-esp32-c3' as any;

    const [hovered, setHovered] = React.useState<'arduino' | 'esp32' | null>(null);
    const isLight = uiTheme === 'light';

    const arduinoStyle = {
        background: isLight 
            ? (hovered === 'arduino' ? '#ffffff' : '#f8fafc')
            : (hovered === 'arduino' ? 'rgba(28, 28, 35, 0.6)' : 'rgba(28, 28, 35, 0.4)'),
        border: hovered === 'arduino'
            ? '1px solid rgba(251, 146, 60, 0.4)'
            : (isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.05)'),
        boxShadow: hovered === 'arduino'
            ? (isLight 
                ? '0 20px 40px -10px rgba(251, 146, 60, 0.12), 0 0 0 1px rgba(251, 146, 60, 0.08)' 
                : '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 12px rgba(251, 146, 60, 0.08)')
            : 'none',
        transform: hovered === 'arduino' ? 'translateY(-4px)' : 'translateY(0)',
    };

    const esp32Style = {
        background: isLight 
            ? (hovered === 'esp32' ? '#ffffff' : '#f8fafc')
            : (hovered === 'esp32' ? 'rgba(28, 28, 35, 0.6)' : 'rgba(28, 28, 35, 0.4)'),
        border: hovered === 'esp32'
            ? '1px solid rgba(6, 182, 212, 0.4)'
            : (isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.05)'),
        boxShadow: hovered === 'esp32'
            ? (isLight 
                ? '0 20px 40px -10px rgba(6, 182, 212, 0.12), 0 0 0 1px rgba(6, 182, 212, 0.08)' 
                : '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 12px rgba(6, 182, 212, 0.08)')
            : 'none',
        transform: hovered === 'esp32' ? 'translateY(-4px)' : 'translateY(0)',
    };

    return (
        <div 
            className={`theme-${uiTheme} fixed inset-0 z-[10000] flex items-center justify-center animate-[overlay-fade-in_0.25s_ease-out]`} 
            style={{ 
                background: isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(8, 9, 12, 0.85)', 
                backdropFilter: 'blur(16px)' 
            }}
        >
            <div 
                className="relative p-10 px-12 max-md:p-8 max-md:px-6 max-w-[900px] max-md:max-w-[480px] w-[90%] rounded-[20px] animate-[modal-slide-up_0.35s_cubic-bezier(0.16,1,0.3,1)] transition-all duration-300" 
                style={{ 
                    background: isLight ? '#ffffff' : '#0f111a', 
                    border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)', 
                    boxShadow: isLight 
                        ? '0 30px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)' 
                        : '0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02)' 
                }}
            >
                {/* Floating Close Button */}
                <button 
                    className={`absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 bg-transparent border-none ${
                        isLight 
                            ? 'text-[#64748b] hover:bg-[rgba(0,0,0,0.05)] hover:text-[#0f172a]' 
                            : 'text-[#64748b] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f8fafc]'
                    }`} 
                    onClick={onClose} 
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="text-center mb-9">
                    <h1 className={`text-[32px] max-md:text-[26px] font-bold m-0 mb-2 tracking-[-0.5px] ${isLight ? 'text-[#0f172a]' : 'text-[#f8fafc]'}`}>
                        Choose Your Board
                    </h1>
                    <p className={`text-[14px] m-0 font-normal ${isLight ? 'text-[#475569]' : 'text-[#64748b]'}`}>
                        Select a microcontroller to start your simulation
                    </p>
                </div>

                {/* Board Options */}
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6 max-md:gap-5">
                    {/* Arduino Uno */}
                    <div
                        className="group/arduino p-8 rounded-[16px] cursor-pointer flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        onClick={() => onSelect('arduino-uno')}
                        style={arduinoStyle}
                        onMouseEnter={() => setHovered('arduino')}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <div 
                            className="h-[180px] w-full flex items-center justify-center rounded-xl overflow-hidden relative mb-6 transition-all duration-300" 
                            style={{ 
                                background: isLight ? '#f1f5f9' : 'rgba(8, 9, 12, 0.5)', 
                                border: isLight ? '1px solid rgba(0, 0, 0, 0.02)' : '1px solid rgba(255, 255, 255, 0.03)' 
                            }}
                        >
                            <div className={`flex items-center justify-center pointer-events-none w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${hovered === 'arduino' ? 'scale-[1.05]' : 'scale-100'}`}>
                                <ArduinoUnoPreview className="block scale-[0.65] origin-center pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex flex-col flex-1">
                            <h2 className={`text-[20px] font-semibold m-0 mb-2 transition-colors duration-200 ${isLight ? 'text-[#0f172a]' : 'text-[#f8fafc]'}`}>
                                Arduino Uno
                            </h2>
                            <p className={`text-[13px] leading-[1.5] m-0 mb-5 flex-1 transition-colors duration-200 ${isLight ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>
                                Classic AVR microcontroller perfect for learning electronics and embedded programming.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-7">
                                {[
                                    { text: 'ATmega328P', darkBg: 'rgba(255, 255, 255, 0.04)', darkBorder: 'rgba(255, 255, 255, 0.06)' },
                                    { text: '14 Digital I/O', darkBg: 'rgba(255, 255, 255, 0.04)', darkBorder: 'rgba(255, 255, 255, 0.06)' },
                                    { text: '6 Analog Inputs', darkBg: 'rgba(255, 255, 255, 0.04)', darkBorder: 'rgba(255, 255, 255, 0.06)' }
                                ].map((tag) => (
                                    <span 
                                        key={tag.text}
                                        className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border transition-all duration-300" 
                                        style={{ 
                                            color: hovered === 'arduino'
                                                ? (isLight ? '#c2410c' : '#fb923c')
                                                : (isLight ? '#475569' : '#94a3b8'), 
                                            background: hovered === 'arduino'
                                                ? (isLight ? 'rgba(251, 146, 60, 0.08)' : 'rgba(251, 146, 60, 0.08)')
                                                : (isLight ? 'rgba(15, 23, 42, 0.04)' : tag.darkBg), 
                                            borderColor: hovered === 'arduino'
                                                ? 'rgba(251, 146, 60, 0.25)'
                                                : (isLight ? 'rgba(15, 23, 42, 0.08)' : tag.darkBorder) 
                                        }}
                                    >
                                        {tag.text}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-auto">
                                <span 
                                    className="text-[13px] font-semibold transition-colors duration-250"
                                    style={{ 
                                        color: hovered === 'arduino' 
                                            ? (isLight ? '#ea580c' : '#fb923c') 
                                            : (isLight ? '#64748b' : '#94a3b8') 
                                    }}
                                >
                                    Start Simulation
                                </span>
                                <ArrowRight 
                                    size={16} 
                                    className="transition-all duration-250" 
                                    style={{
                                        color: hovered === 'arduino' 
                                            ? (isLight ? '#ea580c' : '#fb923c') 
                                            : (isLight ? '#64748b' : '#94a3b8'),
                                        transform: hovered === 'arduino' ? 'translateX(4px)' : 'translateX(0)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ESP32-C3 */}
                    <div
                        className="group/esp32 p-8 rounded-[16px] cursor-pointer flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        onClick={() => onSelect('esp32-c3')}
                        style={esp32Style}
                        onMouseEnter={() => setHovered('esp32')}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <div 
                            className="h-[180px] w-full flex items-center justify-center rounded-xl overflow-hidden relative mb-6 transition-all duration-300" 
                            style={{ 
                                background: isLight ? '#f1f5f9' : 'rgba(8, 9, 12, 0.5)', 
                                border: isLight ? '1px solid rgba(0, 0, 0, 0.02)' : '1px solid rgba(255, 255, 255, 0.03)' 
                            }}
                        >
                            <div className={`flex items-center justify-center pointer-events-none w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${hovered === 'esp32' ? 'scale-[1.05]' : 'scale-100'}`}>
                                <Esp32C3Preview className="block scale-[0.65] origin-center pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex flex-col flex-1">
                            <h2 className={`text-[20px] font-semibold m-0 mb-2 transition-colors duration-200 ${isLight ? 'text-[#0f172a]' : 'text-[#f8fafc]'}`}>
                                ESP32-C3
                            </h2>
                            <p className={`text-[13px] leading-[1.5] m-0 mb-5 flex-1 transition-colors duration-200 ${isLight ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>
                                Modern RISC-V microcontroller with built-in WiFi and Bluetooth for IoT projects.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-7">
                                {[
                                    { text: 'RISC-V 32-bit', darkBg: 'rgba(255, 255, 255, 0.04)', darkBorder: 'rgba(255, 255, 255, 0.06)' },
                                    { text: 'WiFi & BLE 5.0', darkBg: 'rgba(255, 255, 255, 0.04)', darkBorder: 'rgba(255, 255, 255, 0.06)' },
                                    { text: '22 GPIO Pins', darkBg: 'rgba(255, 255, 255, 0.04)', darkBorder: 'rgba(255, 255, 255, 0.06)' }
                                ].map((tag) => (
                                    <span 
                                        key={tag.text}
                                        className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border transition-all duration-300" 
                                        style={{ 
                                            color: hovered === 'esp32'
                                                ? (isLight ? '#0891b2' : '#22d3ee')
                                                : (isLight ? '#475569' : '#94a3b8'), 
                                            background: hovered === 'esp32'
                                                ? (isLight ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.08)')
                                                : (isLight ? 'rgba(15, 23, 42, 0.04)' : tag.darkBg), 
                                            borderColor: hovered === 'esp32'
                                                ? 'rgba(6, 182, 212, 0.25)'
                                                : (isLight ? 'rgba(15, 23, 42, 0.08)' : tag.darkBorder) 
                                        }}
                                    >
                                        {tag.text}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-auto">
                                <span 
                                    className="text-[13px] font-semibold transition-colors duration-250"
                                    style={{ 
                                        color: hovered === 'esp32' 
                                            ? (isLight ? '#0891b2' : '#06b6d4') 
                                            : (isLight ? '#64748b' : '#94a3b8') 
                                    }}
                                >
                                    Start Simulation
                                </span>
                                <ArrowRight 
                                    size={16} 
                                    className="transition-all duration-250" 
                                    style={{
                                        color: hovered === 'esp32' 
                                            ? (isLight ? '#0891b2' : '#06b6d4') 
                                            : (isLight ? '#64748b' : '#94a3b8'),
                                        transform: hovered === 'esp32' ? 'translateX(4px)' : 'translateX(0)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex justify-center mt-8">
                    <button 
                        className={`px-7 py-2.5 text-[14px] font-semibold rounded-[10px] cursor-pointer border transition-all duration-200 
                            ${isLight 
                                ? 'bg-[rgba(15,23,42,0.02)] border-[rgba(15,23,42,0.1)] text-[#475569] hover:bg-[rgba(15,23,42,0.06)] hover:border-[rgba(15,23,42,0.18)] hover:text-[#0f172a]' 
                                : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.12)] text-[#94a3b8] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.25)] hover:text-[#ffffff]'
                            }`} 
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
