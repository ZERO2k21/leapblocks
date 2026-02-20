import React from 'react';
import { stageManager } from '../engine/StageManager';

interface StagePanelProps {
    onOpenLibrary: () => void;
    onOpenEditor: () => void;
}

export const StagePanel: React.FC<StagePanelProps> = ({ onOpenLibrary, onOpenEditor }) => {
    const currentBackdrop = stageManager.currentBackdrop;

    return (
        <div className="stage-panel-container" style={styles.container} onClick={onOpenEditor} title="Click to manage backdrops">
            <div style={styles.header}>
                <span>🎬 Stage</span>
            </div>
            <div style={styles.content}>
                <div style={styles.preview}>
                    {currentBackdrop && currentBackdrop.image ? (
                        <img src={currentBackdrop.src} alt={currentBackdrop.name} style={styles.image} />
                    ) : (
                        <div style={styles.placeholder}>🖼️</div>
                    )}
                </div>
                <div style={styles.info}>
                    <span style={styles.name}>{currentBackdrop?.name || 'No Backdrop'}</span>
                    <div style={styles.actions}>
                        <button
                            style={styles.actionButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenLibrary();
                            }}
                            title="Choose a Backdrop"
                        >
                            ➕
                        </button>
                        <button
                            style={styles.actionButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditor();
                            }}
                            title="Edit Backdrop"
                        >
                            ✏️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '100px',
        height: '120px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #ddd',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    header: {
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: '#f5f5f5',
        padding: '4px 8px',
        borderBottom: '1px solid #ddd',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    preview: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    placeholder: {
        fontSize: '24px',
    },
    info: {
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
    },
    name: {
        fontSize: '10px',
        fontWeight: 500,
        color: '#666',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    actionButton: {
        background: 'none',
        border: 'none',
        fontSize: '12px',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '4px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
    },
};

export default StagePanel;
