/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Pipette } from 'lucide-react';

interface HSBColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    onClose: () => void;
    title?: string;
}

// Convert HEX to HSB
function hexToHsb(hex: string) {
    let r = 0, g = 0, b = 0;
    if (!hex) return { h: 0, s: 100, b: 100, a: 1 };
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    } else if (hex === 'transparent') {
        return { h: 0, s: 0, b: 100, a: 0 };
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: Math.round(h * 100), s: Math.round(s * 100), b: Math.round(v * 100), a: 1 };
}

// Convert HSB back to HEX
function hsbToHex(h: number, s: number, b: number, a: number = 1) {
    if (a === 0) return 'transparent';

    // Convert HSB to RGB
    let r = 0, g = 0, b_rgb = 0;
    const h_normalized = (h / 100) * 360; // 0-360
    const s_normalized = s / 100;
    const v_normalized = b / 100;

    const c = v_normalized * s_normalized;
    const x = c * (1 - Math.abs(((h_normalized / 60) % 2) - 1));
    const m = v_normalized - c;

    if (h_normalized >= 0 && h_normalized < 60) {
        r = c; g = x; b_rgb = 0;
    } else if (h_normalized >= 60 && h_normalized < 120) {
        r = x; g = c; b_rgb = 0;
    } else if (h_normalized >= 120 && h_normalized < 180) {
        r = 0; g = c; b_rgb = x;
    } else if (h_normalized >= 180 && h_normalized < 240) {
        r = 0; g = x; b_rgb = c;
    } else if (h_normalized >= 240 && h_normalized < 300) {
        r = x; g = 0; b_rgb = c;
    } else {
        r = c; g = 0; b_rgb = x;
    }

    const rgbToHex = (x: number) => {
        const hex = Math.round((x + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${rgbToHex(r)}${rgbToHex(g)}${rgbToHex(b_rgb)}`;
}

export function HSBColorPicker({ color, onChange, onClose, title = "Color" }: HSBColorPickerProps) {
    const [hsb, setHsb] = useState(hexToHsb(color));
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHsb(hexToHsb(color));
    }, [color]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleHsbChange = (key: keyof typeof hsb, value: number) => {
        const newHsb = { ...hsb, [key]: value, a: 1 }; // Ensure alpha is 1 if adjusting sliders
        setHsb(newHsb);
        onChange(hsbToHex(newHsb.h, newHsb.s, newHsb.b, newHsb.a));
    };

    const setTransparent = () => {
        setHsb({ ...hsb, a: 0 });
        onChange('transparent');
    };

    // Derived hex for the slider backgrounds
    const hueColorHex = hsbToHex(hsb.h, 100, 100);

    return (
        <div ref={popupRef} className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-2xl w-64 p-4 flex flex-col gap-4 font-sans select-none" style={{ top: '100%', left: 0, marginTop: '8px' }}>
            {/* Header: Presets & Tools */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                    {/* Presets - Solid and Gradients (Visual only for now) */}
                    <button className="w-8 h-8 rounded-md bg-[#855CD6] border border-gray-100 shadow-sm transition-transform active:scale-95" title="Solid Color"></button>
                    <button className="w-8 h-8 rounded-md bg-gradient-to-r from-purple-500 to-indigo-500 border border-gray-100 opacity-50 cursor-not-allowed" title="Linear Gradient (Horizontal)"></button>
                    <button className="w-8 h-8 rounded-md bg-gradient-to-b from-purple-500 to-indigo-500 border border-gray-100 opacity-50 cursor-not-allowed" title="Linear Gradient (Vertical)"></button>
                    <button className="w-8 h-8 rounded-md bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 to-indigo-500 border border-gray-100 opacity-50 cursor-not-allowed" title="Radial Gradient"></button>
                </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Sliders */}
            <div className="flex flex-col gap-3">
                {/* Hue Slider */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                        <span>Color</span>
                        <input
                            type="number"
                            min="0" max="100"
                            value={hsb.h}
                            onChange={(e) => handleHsbChange('h', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="w-10 text-right bg-transparent outline-none"
                        />
                    </div>
                    <div className="h-4 rounded-full relative w-full" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}>
                        <input
                            type="range"
                            min="0" max="100"
                            value={hsb.h}
                            onChange={(e) => handleHsbChange('h', parseInt(e.target.value))}
                            className="absolute top-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 rounded-full shadow-md pointer-events-none" style={{ left: `calc(${hsb.h}% - 12px)`, borderColor: hueColorHex }} />
                    </div>
                </div>

                {/* Saturation Slider */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                        <span>Saturation</span>
                        <input
                            type="number"
                            min="0" max="100"
                            value={hsb.s}
                            onChange={(e) => handleHsbChange('s', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="w-10 text-right bg-transparent outline-none"
                        />
                    </div>
                    <div className="h-4 rounded-full relative w-full" style={{ background: `linear-gradient(to right, #b4b4b4, ${hueColorHex})` }}>
                        <input
                            type="range"
                            min="0" max="100"
                            value={hsb.s}
                            onChange={(e) => handleHsbChange('s', parseInt(e.target.value))}
                            className="absolute top-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 rounded-full shadow-md pointer-events-none" style={{ left: `calc(${hsb.s}% - 12px)`, borderColor: hsbToHex(hsb.h, hsb.s, 100) }} />
                    </div>
                </div>

                {/* Brightness Slider */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                        <span>Brightness</span>
                        <input
                            type="number"
                            min="0" max="100"
                            value={hsb.b}
                            onChange={(e) => handleHsbChange('b', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="w-10 text-right bg-transparent outline-none"
                        />
                    </div>
                    <div className="h-4 rounded-full relative w-full" style={{ background: `linear-gradient(to right, #000000, ${hsbToHex(hsb.h, hsb.s, 100)})` }}>
                        <input
                            type="range"
                            min="0" max="100"
                            value={hsb.b}
                            onChange={(e) => handleHsbChange('b', parseInt(e.target.value))}
                            className="absolute top-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 rounded-full shadow-md pointer-events-none" style={{ left: `calc(${hsb.b}% - 12px)`, borderColor: hsbToHex(hsb.h, hsb.s, hsb.b) }} />
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-100 w-full mt-2" />

            {/* Bottom Tools */}
            <div className="flex justify-between items-center">
                <button
                    onClick={setTransparent}
                    className="w-[42px] h-[42px] flex items-center justify-center bg-[#f8f8f8] border border-gray-200 rounded-lg hover:bg-white hover:border-[#855CD6] transition-all group"
                    title="No Color"
                >
                    <div className="w-6 h-6 border-2 border-red-500 relative overflow-hidden rounded-sm opacity-60 group-hover:opacity-100">
                        <div className="absolute bg-red-500 w-[140%] h-[2px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
                    </div>
                </button>

                <button
                    className="flex-1 ml-3 h-[42px] flex items-center justify-center gap-2 bg-[#f8f8f8] border border-gray-200 rounded-lg hover:bg-white hover:border-[#855CD6] text-gray-500 font-bold text-sm transition-all opacity-50 cursor-not-allowed"
                    title="Eyedropper (Coming Soon)"
                >
                    <Pipette size={18} />
                </button>
            </div>
        </div>
    );
}

export default HSBColorPicker;
