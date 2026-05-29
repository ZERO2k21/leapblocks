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
    onItemAdd?: (item: string) => void;
    onItemEdit?: (index: number, value: string) => void;
    onItemDelete?: (index: number) => void;
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
    onPointerDown,
    onItemAdd,
    onItemEdit,
    onItemDelete
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartRef = React.useRef({ x: 0, y: 0, startX: 0, startY: 0 });
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [editingValue, setEditingValue] = React.useState('');
    const editInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingIndex]);

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

    React.useEffect(() => {
        if (!containerRef.current || !onResize) return;
        let animationFrameId: number;

        const resizeObserver = new ResizeObserver((entries) => {
            animationFrameId = requestAnimationFrame(() => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
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

    const handleAdd = () => {
        const newItem = prompt("Enter new item:") || "";
        if (newItem !== "") {
            onItemAdd?.(newItem);
        }
    };

    const startEditing = (index: number, currentValue: string) => {
        setEditingIndex(index);
        setEditingValue(currentValue);
    };

    const commitEdit = () => {
        if (editingIndex !== null) {
            onItemEdit?.(editingIndex, editingValue);
            setEditingIndex(null);
            setEditingValue('');
        }
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditingValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    };

    const handleDelete = (index: number) => {
        if (confirm("Delete this item?")) {
            onItemDelete?.(index);
        }
    };

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
            onPointerDown={onPointerDown}
        >
            <div
                style={{ ...styles.header, cursor: isDragging ? 'grabbing' : 'grab' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <span style={styles.headerText}>{name}</span>
                <span style={styles.lengthBadge}>length {items.length}</span>
            </div>

            <div style={styles.itemsContainer}>
                {items.length === 0 ? (
                    <div style={styles.emptyState}>(empty)</div>
                ) : (
                    items.map((item, index) => (
                        <div key={index} style={styles.itemRow}>
                            <span style={styles.itemIndex}>{index + 1}</span>
                            {editingIndex === index ? (
                                <input
                                    ref={editInputRef}
                                    style={styles.editInput}
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={handleKeyDown}
                                />
                            ) : (
                                <span style={styles.itemValue}>{String(item)}</span>
                            )}
                            <button
                                style={styles.editBtn}
                                onClick={() => startEditing(index, String(item))}
                                title="Edit item"
                            >=</button>
                            <button
                                style={styles.deleteBtn}
                                onClick={() => handleDelete(index)}
                                title="Delete item"
                            >×</button>
                        </div>
                    ))
                )}
            </div>

            <div style={styles.footer}>
                <button style={styles.addBtn} onClick={handleAdd} title="Add item">+</button>
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontWeight: 600,
        fontSize: '14px',
    },
    lengthBadge: {
        fontSize: '11px',
        opacity: 0.8,
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
        gap: '4px',
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
        alignItems: 'center',
    },
    addBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        color: 'white',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '18px',
        fontWeight: 'bold',
        width: '26px',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1',
        padding: 0,
    },
    editBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: 'none',
        color: 'white',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        width: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1',
        padding: 0,
        flexShrink: 0,
    },
    deleteBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: 'none',
        color: 'white',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        width: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1',
        padding: 0,
        flexShrink: 0,
    },
    editInput: {
        flex: 1,
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '12px',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '3px',
        padding: '1px 4px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        color: '#333',
        outline: 'none',
        minWidth: 0,
    },
};

export default ListMonitor;
