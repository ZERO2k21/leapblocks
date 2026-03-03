import React, { useRef, useEffect, useCallback, useState } from 'react';
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
    onSpriteSelect?: (id: string) => void;
    isCameraOn?: boolean;
}

export const Stage: React.FC<StageProps> = ({
    width = 480,
    height = 360,
    sprites,
    isRunning,
    onStageClick,
    showGridNumbers = false,
    onSpriteSelect,
    isCameraOn = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [draggingSpriteId, setDraggingSpriteId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isCameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                    }
                })
                .catch((err) => console.error("Error accessing camera:", err));
        } else {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOn]);

    // Force re-render on external stage events like backdrop changes
    const [, forceRender] = useState({});
    useEffect(() => {
        const handleUpdate = () => forceRender({});
        window.addEventListener('leap-stage-update', handleUpdate);
        return () => window.removeEventListener('leap-stage-update', handleUpdate);
    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Draw backdrop
        ctx.clearRect(0, 0, width, height);
        const backdrop = stageManager.currentBackdrop;
        if (backdrop && backdrop.image) {
            ctx.drawImage(backdrop.image, 0, 0, width, height);
        } else if (!isCameraOn) {
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

        // 5. Drag overlay
        if (draggingSpriteId) {
            const draggedSprite = sprites.find(s => s.id === draggingSpriteId);
            if (draggedSprite) {
                const cx = width / 2 + draggedSprite.x;
                const cy = height / 2 - draggedSprite.y;

                // Draw coordinate lines
                ctx.strokeStyle = '#4C97FF';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
                ctx.moveTo(0, cy); ctx.lineTo(width, cy);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw label
                ctx.fillStyle = '#4C97FF';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`X: ${Math.round(draggedSprite.x)} Y: ${Math.round(draggedSprite.y)}`, cx + 10, cy - 10);
            }
        }

        // 6. Render sprites
        for (const sprite of sprites) {
            sprite.render(ctx, width, height);
        }
    }, [width, height, sprites, showGridNumbers, draggingSpriteId, isCameraOn]);

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

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) * (width / rect.width)) - width / 2;
        const mouseY = height / 2 - ((e.clientY - rect.top) * (height / rect.height));

        // Hit detection (top-most sprite)
        for (let i = sprites.length - 1; i >= 0; i--) {
            const sprite = sprites[i];
            if (!sprite.visible) continue;

            const scale = sprite.size / 100;
            const w = (sprite.currentCostume?.width || 80) * scale; // Approx picking width
            const h = (sprite.currentCostume?.height || 80) * scale;

            if (Math.abs(mouseX - sprite.x) <= w / 2 && Math.abs(mouseY - sprite.y) <= h / 2) {
                setDraggingSpriteId(sprite.id);
                setDragOffset({ x: sprite.x - mouseX, y: sprite.y - mouseY });
                if (onSpriteSelect) onSpriteSelect(sprite.id);
                // Capture pointer to track outside canvas
                canvas.setPointerCapture(e.pointerId);
                return;
            }
        }

        if (onStageClick) onStageClick(mouseX, mouseY);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!draggingSpriteId) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) * (width / rect.width)) - width / 2;
        const mouseY = height / 2 - ((e.clientY - rect.top) * (height / rect.height));

        const sprite = sprites.find(s => s.id === draggingSpriteId);
        if (sprite) {
            sprite.setX(mouseX + dragOffset.x);
            sprite.setY(mouseY + dragOffset.y);
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (draggingSpriteId) {
            setDraggingSpriteId(null);
            const canvas = canvasRef.current;
            if (canvas) canvas.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div style={{ position: 'relative', width, height, backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {isCameraOn && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)' // Mirror effect
                    }}
                />
            )}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    display: 'block',
                    backgroundColor: isCameraOn ? 'transparent' : '#fff',
                    cursor: draggingSpriteId ? 'grabbing' : 'crosshair'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
        </div>
    );
};

export default Stage;
