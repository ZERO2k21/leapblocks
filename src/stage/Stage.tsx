import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Sprite } from './Sprite';

// ═══════════════════════════════════════════════════════════════════════════
// STAGE - Animation canvas component
// ═══════════════════════════════════════════════════════════════════════════

interface StageProps {
    width?: number;
    height?: number;
    sprites: Sprite[];
    isRunning: boolean;
    onStageClick?: (x: number, y: number) => void;
    showGridNumbers?: boolean; // Show numbered coordinate scale for Junior mode
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
    const [lastTime, setLastTime] = useState(0);

    // Render all sprites
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Calculate grid spacing for 20 cells
        const gridSpacing = showGridNumbers ? width / 20 : 20;

        // Draw grid
        ctx.strokeStyle = showGridNumbers ? '#e5e5e5' : '#f0f0f0';
        ctx.lineWidth = 1;

        for (let i = 0; i <= (showGridNumbers ? 20 : width / 20); i++) {
            const x = i * gridSpacing;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let i = 0; i <= (showGridNumbers ? 15 : height / 20); i++) {
            const y = i * (showGridNumbers ? height / 15 : 20);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw numbered scale for Junior mode
        if (showGridNumbers) {
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';

            // Draw X axis numbers (1-20 at bottom)
            for (let i = 1; i <= 20; i++) {
                const x = i * gridSpacing - gridSpacing / 2;
                ctx.fillText(String(i), x, height - 4);
            }

            // Draw Y axis numbers (1-15 on right side)
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 1; i <= 15; i++) {
                const y = height - (i * (height / 15)) + (height / 30);
                ctx.fillText(String(i), width - 4, y);
            }
        }

        // Draw center crosshair
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Render all sprites
        for (const sprite of sprites) {
            sprite.render(ctx, width, height);
        }
    }, [width, height, sprites, showGridNumbers]);

    // Animation loop
    useEffect(() => {
        let animationId: number;
        let prevTime = performance.now();

        const tick = (time: number) => {
            const deltaMs = time - prevTime;
            prevTime = time;

            // Update gliding sprites
            if (isRunning) {
                for (const sprite of sprites) {
                    if (sprite.isGliding) {
                        sprite.updateGlide(deltaMs);
                    }
                }
            }

            // Render
            render();

            animationId = requestAnimationFrame(tick);
        };

        animationId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationId);
    }, [render, sprites, isRunning]);

    // Handle clicks
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onStageClick) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        // Convert to stage coordinates (center = 0,0)
        const stageX = canvasX - width / 2;
        const stageY = height / 2 - canvasY; // Flip Y

        onStageClick(stageX, stageY);
    };

    return (
        <div style={styles.container}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={styles.canvas}
                onClick={handleClick}
            />
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    canvas: {
        display: 'block',
        backgroundColor: '#fff',
        cursor: 'crosshair',
    },
};

export default Stage;
