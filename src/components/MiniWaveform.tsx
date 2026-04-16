/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useRef } from 'react';

interface MiniWaveformProps {
    buffer: AudioBuffer | null;
    color?: string;
    width?: number;
    height?: number;
}

export const MiniWaveform: React.FC<MiniWaveformProps> = ({ 
    buffer, 
    color = '#855CD6', 
    width = 60, 
    height = 40 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !buffer) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const data = buffer.getChannelData(0);
        
        // Find peak for normalization
        let peak = 0.01;
        for (let i = 0; i < data.length; i += 100) {
            const abs = Math.abs(data[i]);
            if (abs > peak) peak = abs;
        }
        const normalizationScale = 0.9 / peak;

        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';

        // Draw a simplified waveform (symmetrical)
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            // Draw a vertical line for this segment (normalized)
            const x = i;
            const y1 = (1 + min * normalizationScale) * amp;
            const y2 = (1 + max * normalizationScale) * amp;
            
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
        }

        ctx.stroke();
    }, [buffer, color, width, height]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width, height, opacity: buffer ? 1 : 0.3 }}
        />
    );
};

export default MiniWaveform;
