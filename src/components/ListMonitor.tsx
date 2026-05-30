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
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartRef = React.useRef({ x: 0, y: 0, startX: 0, startY: y });
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [editingValue, setEditingValue] = React.useState('');
    const editInputRef = React.useRef<HTMLInputElement>(null);
    const prevLengthRef = React.useRef(items.length);

    // Auto-focus and highlight input when entering edit mode
    React.useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingIndex]);

    // Polish: When a new item is added, automatically focus the edit input and scroll to it
    React.useEffect(() => {
        if (items.length > prevLengthRef.current) {
            const newIndex = items.length - 1;
            setEditingIndex(newIndex);
            setEditingValue(String(items[newIndex] || ''));

            // Allow DOM to render then scroll to bottom
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                }
            }, 30);
        }
        prevLengthRef.current = items.length;
    }, [items.length]);

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
        onPositionChange?.(
            Math.max(-100, dragStartRef.current.startX + dx),
            Math.max(-100, dragStartRef.current.startY + dy)
        );
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
        // In Scratch, clicking '+' immediately appends a blank line and goes to edit mode
        onItemAdd?.('');
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
            className="list-monitor list-monitor-container"
            onPointerDown={onPointerDown}
        >
            {/* Inline CSS style block to ensure reliable, high-fidelity styles and hover states */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .list-monitor-container {
                    box-sizing: border-box;
                }
                .list-monitor-items::-webkit-scrollbar {
                    width: 7px;
                    height: 7px;
                }
                .list-monitor-items::-webkit-scrollbar-track {
                    background: #f9f9f9;
                    border-radius: 4px;
                }
                .list-monitor-items::-webkit-scrollbar-thumb {
                    background: #d2d2d2;
                    border-radius: 4px;
                }
                .list-monitor-items::-webkit-scrollbar-thumb:hover {
                    background: #b5b5b5;
                }

                .list-monitor-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 4px;
                    gap: 6px;
                    position: relative;
                    box-sizing: border-box;
                }

                .list-monitor-item-box {
                    flex: 1;
                    background-color: #ff661a;
                    border: 1px solid #e65c00;
                    color: white;
                    border-radius: 4px;
                    padding: 3px 8px;
                    font-size: 11px;
                    font-weight: bold;
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    min-height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    overflow: hidden;
                    position: relative;
                    box-sizing: border-box;
                    transition: background-color 0.1s ease;
                }

                .list-monitor-item-box:hover {
                    background-color: #e65c00;
                }

                .list-monitor-delete-btn {
                    opacity: 0;
                    transition: opacity 0.15s ease;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                    width: 14px;
                    height: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    margin-left: 4px;
                    border-radius: 50%;
                }

                .list-monitor-row:hover .list-monitor-delete-btn {
                    opacity: 0.7;
                }

                .list-monitor-delete-btn:hover {
                    opacity: 1 !important;
                    background-color: rgba(0, 0, 0, 0.15);
                }

                .list-monitor-input {
                    flex: 1;
                    font-size: 11px;
                    font-weight: bold;
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    border: 1px solid #4c97ff;
                    box-shadow: 0 0 0 2px rgba(76, 151, 255, 0.25);
                    border-radius: 3px;
                    padding: 2px 6px;
                    background-color: #ffffff;
                    color: #333;
                    outline: none;
                    min-width: 0;
                    box-sizing: border-box;
                    height: 22px;
                }

                .list-monitor-footer-btn {
                    background: #ffffff;
                    border: 1px solid #cccccc;
                    color: #575e75;
                    font-weight: bold;
                    font-size: 14px;
                    border-radius: 3px;
                    cursor: pointer;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    padding: 0;
                    box-sizing: border-box;
                    transition: background 0.1s, border-color 0.1s;
                }

                .list-monitor-footer-btn:hover {
                    background: #f5f5f5;
                    border-color: #a8a8a8;
                }

                .list-monitor-footer-btn:active {
                    background: #e5e5e5;
                }
            ` }} />

            <div
                style={{ ...styles.header, cursor: isDragging ? 'grabbing' : 'grab' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <span style={styles.headerText}>{name}</span>
            </div>

            <div
                ref={scrollContainerRef}
                className="list-monitor-items"
                style={styles.itemsContainer}
            >
                {items.length === 0 ? (
                    <div style={styles.emptyState}>(empty)</div>
                ) : (
                    items.map((item, index) => (
                        <div key={index} className="list-monitor-row">
                            <span style={styles.itemIndex}>{index + 1}</span>
                            {editingIndex === index ? (
                                <input
                                    ref={editInputRef}
                                    className="list-monitor-input"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={handleKeyDown}
                                />
                            ) : (
                                <div
                                    className="list-monitor-item-box"
                                    onClick={() => startEditing(index, String(item))}
                                >
                                    <span style={styles.itemValue}>{String(item)}</span>
                                    <button
                                        className="list-monitor-delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onItemDelete?.(index);
                                        }}
                                        title="Delete item"
                                    >×</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div style={styles.footer}>
                <button className="list-monitor-footer-btn" onClick={handleAdd} title="Add item">+</button>
                <span style={styles.footerText}>length {items.length}</span>
                <span style={styles.resizeHandle} title="Resize monitor">=</span>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'absolute',
        backgroundColor: '#ffffff',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '12px',
        color: '#575e75',
        zIndex: 100,
        cursor: 'default',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: '100px',
        minHeight: '100px',
        resize: 'both',
    },
    header: {
        backgroundColor: '#ffffff',
        padding: '6px 8px',
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: '12px',
        color: '#575e75',
    },
    itemsContainer: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '6px 8px',
        backgroundColor: '#ffffff',
    },
    emptyState: {
        padding: '16px',
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        fontSize: '11px',
    },
    itemIndex: {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#575e75',
        minWidth: '16px',
        textAlign: 'right',
        userSelect: 'none',
    },
    itemValue: {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: '1.2',
    },
    footer: {
        backgroundColor: '#ffffff',
        padding: '4px 6px',
        borderTop: '1px solid #d9d9d9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        height: '28px',
    },
    footerText: {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#575e75',
        marginRight: 'auto',
        marginLeft: '8px',
        userSelect: 'none',
    },
    resizeHandle: {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#b3b3b3',
        cursor: 'nwse-resize',
        userSelect: 'none',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
    }
};

export default ListMonitor;
