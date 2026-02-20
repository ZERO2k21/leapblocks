import React from 'react';

interface BackdropAsset {
    name: string;
    src: string;
    color: string;
}

const DEFAULT_BACKDROPS: BackdropAsset[] = [
    { name: 'Arctic', src: '', color: '#E0F7FA' },
    { name: 'Beach', src: '', color: '#FFF9C4' },
    { name: 'Bedroom', src: '', color: '#F8BBD0' },
    { name: 'Castle', src: '', color: '#E1BEE7' },
    { name: 'City', src: '', color: '#CFD8DC' },
];

interface BackdropLibraryProps {
    onSelect: (name: string, src: string) => void;
    onClose: () => void;
}

export const BackdropLibrary: React.FC<BackdropLibraryProps> = ({ onSelect, onClose }) => {
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Choose a Backdrop</h2>
                    <button style={styles.closeButton} onClick={onClose}>✕</button>
                </div>
                <div style={styles.grid}>
                    {DEFAULT_BACKDROPS.map(bg => (
                        <div
                            key={bg.name}
                            className="backdrop-item"
                            style={styles.item}
                            onClick={() => onSelect(bg.name, bg.src)}
                        >
                            <div style={{ ...styles.preview, backgroundColor: bg.color }}>
                                {bg.src ? <img src={bg.src} alt={bg.name} style={styles.image} /> : <span>🖼️</span>}
                            </div>
                            <div style={styles.name}>{bg.name}</div>
                        </div>
                    ))}
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
        width: '80%',
        maxWidth: '800px',
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
        fontSize: '20px',
        fontWeight: 600,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '4px',
    },
    grid: {
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '20px',
        overflowY: 'auto',
    },
    item: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
    },
    preview: {
        width: '100%',
        paddingTop: '75%', // 4:3 Aspect Ratio
        borderRadius: '6px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        marginBottom: '8px',
        border: '1px solid #ddd',
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
    name: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#333',
    },
};

export default BackdropLibrary;
