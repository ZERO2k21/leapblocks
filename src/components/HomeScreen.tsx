import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// HOME SCREEN - Welcome/Mode Selection
// ═══════════════════════════════════════════════════════════════════════════

export type AppMode = 'home' | 'blocks' | 'junior' | 'python' | 'notebook' | 'ml' | 'xr';

interface ModeCardProps {
    icon: string;
    title: string;
    description: string;
    age: string;
    color: string;
    beta?: boolean;
    onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ icon, title, description, age, color, beta, onClick }) => (
    <div
        style={{
            ...styles.modeCard,
            borderColor: color,
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 8px 24px ${color}40`;
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }}
    >
        <div style={styles.cardBadges}>
            <span style={{ ...styles.ageBadge, backgroundColor: color }}>{age}</span>
            {beta && <span style={styles.betaBadge}>Beta</span>}
        </div>
        <div style={{ ...styles.cardIcon, backgroundColor: `${color}20` }}>
            {icon}
        </div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardDescription}>{description}</p>
    </div>
);

interface HomeScreenProps {
    onSelectMode: (mode: AppMode) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectMode }) => {
    return (
        <div style={styles.container}>
            <div style={styles.modal}>
                <h1 style={styles.title}>What would you like to do?</h1>

                {/* Block Coding Section */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Block Coding</h2>
                    <div style={styles.cardRow}>
                        <ModeCard
                            icon="🧩"
                            title="Junior Blocks"
                            description="Code by stacking puzzle shaped blocks"
                            age="Ages 4+"
                            color="#FF6B6B"
                            beta={true}
                            onClick={() => onSelectMode('junior')}
                        />
                        <ModeCard
                            icon="🔲"
                            title="Blocks"
                            description="Code with playful puzzle shaped blocks"
                            age="Ages 7+"
                            color="#4ECDC4"
                            onClick={() => onSelectMode('blocks')}
                        />
                    </div>
                </div>

                {/* Python Coding Section */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Python Coding</h2>
                    <div style={styles.cardRow}>
                        <ModeCard
                            icon="🐍"
                            title="Py Editor"
                            description="Code with text based coding in Python"
                            age="Ages 12+"
                            color="#3498DB"
                            onClick={() => onSelectMode('python')}
                        />
                        <ModeCard
                            icon="📓"
                            title="Py Notebook"
                            description="Code with text-based coding in Notebook Interface"
                            age="Ages 12+"
                            color="#9B59B6"
                            onClick={() => onSelectMode('notebook')}
                        />
                    </div>
                </div>

                {/* Advanced Features Section */}
                <div style={styles.section}>
                    <div style={styles.cardRow}>
                        <ModeCard
                            icon="🧠"
                            title="Machine Learning Environment"
                            description="Train ML models for image, object, face, pose, hand and body, sound, NLP and numbers"
                            age="Ages 12+"
                            color="#E74C3C"
                            onClick={() => onSelectMode('ml')}
                        />
                        <ModeCard
                            icon="🌐"
                            title="3D and XR Studio"
                            description="Create interactive 3D projects in AR/VR with animations, physics, trackers, filters and more"
                            age="Ages 12+"
                            color="#F39C12"
                            beta={true}
                            onClick={() => onSelectMode('xr')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#855CD6',
        padding: '40px',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '40px 60px',
        maxWidth: '900px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    title: {
        textAlign: 'center',
        color: '#855CD6',
        fontSize: '28px',
        fontWeight: 600,
        marginBottom: '32px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    section: {
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '14px',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '16px',
        fontWeight: 500,
    },
    cardRow: {
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
    },
    modeCard: {
        flex: '1 1 200px',
        minWidth: '180px',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '2px solid transparent',
        position: 'relative',
    },
    cardBadges: {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
    },
    ageBadge: {
        fontSize: '11px',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        fontWeight: 500,
    },
    betaBadge: {
        fontSize: '11px',
        color: '#666',
        padding: '2px 8px',
        borderRadius: '10px',
        backgroundColor: '#f0f0f0',
        fontWeight: 500,
    },
    cardIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        marginBottom: '12px',
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#333',
        marginBottom: '6px',
        margin: 0,
    },
    cardDescription: {
        fontSize: '12px',
        color: '#777',
        lineHeight: 1.4,
        margin: 0,
        marginTop: '8px',
    },
};

export default HomeScreen;
