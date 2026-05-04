/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

interface TableMonitorProps {
    name: string;
    data: (string | number)[][];
    visible: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    zIndex?: number;
    onPositionChange?: (x: number, y: number) => void;
    onResize?: (w: number, h: number) => void;
    onPointerDown?: () => void;
}

export const TableMonitor: React.FC<TableMonitorProps> = ({
    name,
    data,
    visible,
    x = 10,
    y = 260,
    width = 200,
    height = 150,
    zIndex = 100,
    onPositionChange,
    onResize,
    onPointerDown
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartRef = React.useRef({ x: 0, y: 0, startX: 0, startY: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        onPointerDown?.();
        if (e.button !== 0) return;
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY, startX: x, startY: y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;

        let scale = 1;
        let parent = e.currentTarget.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.transform && style.transform !== 'none') {
                const matrix = style.transform.match(/^matrix\((.+)\)$/);
                if (matrix) {
                    scale = parseFloat(matrix[1].split(',')[0]);
                    break;
                }
            }
            parent = parent.parentElement;
        }

        const dx = (e.clientX - dragStartRef.current.x) / scale;
        const dy = (e.clientY - dragStartRef.current.y) / scale;
        onPositionChange?.(Math.max(-100, dragStartRef.current.startX + dx), Math.max(-100, dragStartRef.current.startY + dy));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // Use ResizeObserver to detect CSS resize changes and report back to parent
    React.useEffect(() => {
        if (!containerRef.current || !onResize) return;
        let animationFrameId: number;
        
        const resizeObserver = new ResizeObserver((entries) => {
            animationFrameId = requestAnimationFrame(() => {
                for (const entry of entries) {
                    const el = entry.target as HTMLElement;
                    onResize(el.offsetWidth, el.offsetHeight);
                }
            });
        });

        resizeObserver.observe(containerRef.current);
        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [onResize]);

    if (!visible) return null;

    const rows = data.length;
    const cols = rows > 0 ? data[0].length : 0;

    return (
        <div
            ref={containerRef}
            style={{
                ...styles.container,
                left: x,
                top: y,
                width: width,
                height: height,
                zIndex: zIndex,
            }}
            className="table-monitor"
            onPointerDown={onPointerDown} // register click for z-index
        >
            {/* Header */}
            <div 
                style={{ ...styles.header, cursor: isDragging ? 'grabbing' : 'grab' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <span style={styles.headerText}>{name}</span>
            </div>

            {/* Table Grid */}
            <div style={styles.tableContainer}>
                {rows === 0 || cols === 0 ? (
                    <div style={styles.emptyState}>(empty table)</div>
                ) : (
                    <table style={styles.table}>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, colIndex) => (
                                        <td key={colIndex} style={styles.cell}>
                                            {String(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer with dimensions */}
            <div style={styles.footer}>
                <span style={styles.dimensionsText}>{rows} × {cols}</span>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'absolute',
        backgroundColor: '#A52A2A',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontSize: '13px',
        color: 'white',
        zIndex: 100,
        cursor: 'default',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: '120px',
        minHeight: '100px',
        resize: 'both',
    },
    header: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        padding: '8px 12px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    },
    headerText: {
        fontWeight: 600,
        fontSize: '14px',
    },
    tableContainer: {
        flex: 1,
        overflow: 'auto',
        padding: '8px',
    },
    emptyState: {
        padding: '20px',
        textAlign: 'center',
        opacity: 0.6,
        fontStyle: 'italic',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    cell: {
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '6px 8px',
        textAlign: 'center',
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        minWidth: '40px',
    },
    footer: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        padding: '6px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
    },
    dimensionsText: {
        fontSize: '11px',
        fontWeight: 500,
        opacity: 0.9,
    },
};

export default TableMonitor;
