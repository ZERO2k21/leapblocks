import React from 'react';

interface LandingPageProps {
    onSelect: (mode: 'intermediate' | 'junior') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelect }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f0f4f8',
            fontFamily: '"Segoe UI", sans-serif'
        }}>
            <h1 style={{ fontSize: '3rem', color: '#2c3e50', marginBottom: '2rem' }}>
                Welcome to LeapBlocks
            </h1>

            <div style={{ display: 'flex', gap: '2rem' }}>
                <button
                    onClick={() => onSelect('intermediate')}
                    style={{
                        padding: '2rem',
                        fontSize: '1.5rem',
                        backgroundColor: '#6C4BB4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        width: '250px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🚀 Intermediate
                    <div style={{ fontSize: '1rem', marginTop: '0.5rem', opacity: 0.8 }}>
                        Blockly + Arduino
                    </div>
                </button>

                <button
                    onClick={() => onSelect('junior')}
                    style={{
                        padding: '2rem',
                        fontSize: '1.5rem',
                        backgroundColor: '#FFAB19',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        width: '250px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🐻 Junior
                    <div style={{ fontSize: '1rem', marginTop: '0.5rem', opacity: 0.8 }}>
                        Icon Blocks & Stories
                    </div>
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
