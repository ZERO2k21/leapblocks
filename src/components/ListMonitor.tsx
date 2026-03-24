import React from 'react';

interface ListMonitorProps {
    name: string;
    items: (string | number)[];
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

export const ListMonitor: React.FC<ListMonitorProps> = ({
    name,
    items,
    visible,
    x = 10,
    y = 60,
    width = 140,
    height = 180,
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
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
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
                    const { width, height } = entry.contentRect;
                    // Add borders/padding bounds if box-sizing is border-box
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
            className="list-monitor"
            onPointerDown={onPointerDown} // still register click for z-index on background
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

            {/* Items List */}
            <div style={styles.itemsContainer}>
                {items.length === 0 ? (
                    <div style={styles.emptyState}>(empty)</div>
                ) : (
                    items.map((item, index) => (
                        <div key={index} style={styles.itemRow}>
                            <span style={styles.itemIndex}>{index + 1}</span>
                            <span style={styles.itemValue}>{String(item)}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Footer with length */}
            <div style={styles.footer}>
                <span style={styles.lengthText}>length: {items.length}</span>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'absolute',
        backgroundColor: '#CF63CF',
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
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        padding: '8px 12px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    },
    headerText: {
        fontWeight: 600,
        fontSize: '14px',
    },
    itemsContainer: {
        flex: 1,
        overflow: 'auto',
        padding: '6px',
    },
    emptyState: {
        padding: '20px',
        textAlign: 'center',
        opacity: 0.6,
        fontStyle: 'italic',
    },
    itemRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 6px',
        borderRadius: '4px',
        marginBottom: '2px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    itemIndex: {
        fontSize: '11px',
        opacity: 0.7,
        minWidth: '20px',
    },
    itemValue: {
        flex: 1,
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '12px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    footer: {
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        padding: '6px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
    },
    lengthText: {
        fontSize: '11px',
        fontWeight: 500,
        opacity: 0.9,
    },
};

export default ListMonitor;
