import React from 'react';
import { stageManager, BackdropState } from '../engine/StageManager';

interface BackdropEditorProps {
    onClose: () => void;
}

export const BackdropEditor: React.FC<BackdropEditorProps> = ({ onClose }) => {
    const [backdrops, setBackdrops] = React.useState<BackdropState[]>(stageManager.getAllBackdrops());

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const src = event.target?.result as string;
                await stageManager.addBackdrop(file.name, src);
                setBackdrops(stageManager.getAllBackdrops());
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = (index: number) => {
        stageManager.deleteBackdrop(index);
        setBackdrops(stageManager.getAllBackdrops());
    };

    const handleSelect = (index: number) => {
        stageManager.setBackdrop(index);
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Manage Backdrops</h2>
                    <button style={styles.closeButton} onClick={onClose}>✕</button>
                </div>
                <div style={styles.content}>
                    <div style={styles.toolbar}>
                        <label style={styles.uploadButton}>
                            ➕ Upload Backdrop
                            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                    <div style={styles.list}>
                        {backdrops.map((bg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    ...styles.item,
                                    border: stageManager.currentBackdrop === bg ? '2px solid #855CD6' : '1px solid #ddd'
                                }}
                                onClick={() => handleSelect(idx)}
                            >
                                <div style={styles.preview}>
                                    {bg.image ? <img src={bg.src} alt={bg.name} style={styles.image} /> : <span>🖼️</span>}
                                </div>
                                <div style={styles.itemInfo}>
                                    <span style={styles.itemName}>{bg.name}</span>
                                    <button
                                        style={styles.deleteButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(idx);
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '60%',
        maxWidth: '600px',
        maxHeight: '80%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        overflow: 'hidden',
    },
    header: {
        padding: '16px 24px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#855CD6',
        color: 'white',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
    },
    content: {
        padding: '24px',
        overflowY: 'auto',
    },
    toolbar: {
        marginBottom: '20px',
    },
    uploadButton: {
        padding: '10px 20px',
        backgroundColor: '#4C97FF',
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        display: 'inline-block',
    },
    list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '16px',
    },
    item: {
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    preview: {
        width: '100%',
        paddingTop: '75%',
        backgroundColor: '#f8f8f8',
        borderRadius: '4px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '4px',
        overflow: 'hidden',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    itemInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: '12px',
        fontWeight: 500,
        maxWidth: '80px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    deleteButton: {
        background: 'none',
        border: 'none',
        fontSize: '14px',
        cursor: 'pointer',
        padding: '2px',
    },
};

export default BackdropEditor;
