import React from 'react';

interface BackdropAsset {
    name: string;
    src: string;
    color: string;
}

const DEFAULT_BACKDROPS: BackdropAsset[] = [
    { name: 'Arctic', src: '/assets/backdrops/Artic.png', color: '#E0F7FA' },
    { name: 'Beach', src: '/assets/backdrops/Beach.png', color: '#FFF9C4' },
    { name: 'Castle', src: '/assets/backdrops/Castle.png', color: '#EDF1F7' },
    { name: 'City', src: '/assets/backdrops/city.svg', color: '#CFD8DC' },
    { name: 'Maze', src: '/assets/backdrops/maze.svg', color: '#E1BEE7' },
    { name: 'Park', src: '/assets/backdrops/park.svg', color: '#B2EBF2' },
    { name: 'Space', src: '/assets/backdrops/Space.png', color: '#CFD8DC' },
    { name: 'Underwater', src: '/assets/backdrops/underwater.svg', color: '#FFF9C4' },
];

interface BackdropLibraryProps {
    onSelect: (name: string, src: string) => void;
    onClose: () => void;
}

export const BackdropLibrary: React.FC<BackdropLibraryProps> = ({ onSelect, onClose }) => {
    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => {
                                if (!bg.src) {
                                    onSelect(bg.name, bg.src);
                                    return;
                                }

                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement("canvas");
                                    canvas.width = 480;
                                    canvas.height = 360;
                                    const ctx = canvas.getContext("2d");
                                    ctx?.drawImage(img, 0, 0, 480, 360);
                                    onSelect(bg.name, canvas.toDataURL());

                                    // Hack to force re-render in parent app
                                    window.dispatchEvent(new Event('leap-stage-update'));
                                };
                                img.onerror = () => {
                                    console.warn(`Could not load ${bg.name}, adding blank.`);
                                    const canvas = document.createElement("canvas");
                                    canvas.width = 480;
                                    canvas.height = 360;
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        ctx.fillStyle = bg.color;
                                        ctx.fillRect(0, 0, 480, 360);
                                    }
                                    onSelect(bg.name, canvas.toDataURL());
                                    window.dispatchEvent(new Event('leap-stage-update'));
                                };
                                img.src = bg.src;
                            }}
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
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
