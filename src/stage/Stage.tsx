import React, { useRef, useEffect, useCallback } from 'react';
import { Sprite } from './Sprite';
import { gameLoop } from '../engine/GameLoop';
import { stageManager } from '../engine/StageManager';

// ═══════════════════════════════════════════════════════════════════════════
// STAGE component
// ═══════════════════════════════════════════════════════════════════════════

interface StageProps {
    width?: number;
    height?: number;
    sprites: Sprite[];
    isRunning: boolean;
    onStageClick?: (x: number, y: number) => void;
    showGridNumbers?: boolean;
}

export const Stage: React.FC<StageProps> = ({
    width = 480,
    height = 360,
    sprites,
    isRunning,
    onStageClick,
    showGridNumbers = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Draw backdrop
        const backdrop = stageManager.currentBackdrop;
        if (backdrop && backdrop.image) {
            ctx.drawImage(backdrop.image, 0, 0, width, height);
        } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw grid (PictoBlox style)
        ctx.strokeStyle = showGridNumbers ? '#e5e5e5' : '#f0f0f0';
        ctx.lineWidth = 1;

        const gridSpacing = showGridNumbers ? width / 20 : 20;
        const xCount = showGridNumbers ? 20 : Math.floor(width / 20);
        const yCount = showGridNumbers ? 15 : Math.floor(height / 20);

        for (let i = 0; i <= xCount; i++) {
            const x = i * (showGridNumbers ? (width / 20) : 20);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let i = 0; i <= yCount; i++) {
            const y = i * (showGridNumbers ? (height / 15) : 20);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 3. Junior numbers
        if (showGridNumbers) {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            for (let i = 1; i <= 20; i++) {
                const x = i * (width / 20) - (width / 40);
                ctx.fillText(String(i), x, height - 4);
            }
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 1; i <= 15; i++) {
                const y = height - (i * (height / 15)) + (height / 30);
                ctx.fillText(String(i), width - 4, y);
            }
        }

        // 4. Center cross
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
        ctx.stroke();

        // 5. Render sprites
        for (const sprite of sprites) {
            sprite.render(ctx, width, height);
        }
    }, [width, height, sprites, showGridNumbers]);

    useEffect(() => {
        const handleUpdate = (deltaMs: number) => {
            if (isRunning) {
                for (const sprite of sprites) {
                    if (sprite.isGliding) sprite.updateGlide(deltaMs);
                }
            }
            render();
        };
        gameLoop.addUpdateCallback(handleUpdate);
        gameLoop.start();
        return () => gameLoop.removeUpdateCallback(handleUpdate);
    }, [render, sprites, isRunning]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onStageClick) return;
        const rect = canvas.getBoundingClientRect();
        const stageX = ((e.clientX - rect.left) * (width / rect.width)) - width / 2;
        const stageY = height / 2 - ((e.clientY - rect.top) * (height / rect.height));
        onStageClick(stageX, stageY);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', backgroundColor: '#fff', cursor: 'crosshair' }} onClick={handleClick} />
        </div>
    );
};

export default Stage;
