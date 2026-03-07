import React from 'react';
import { Save } from 'lucide-react';

export default function UnsavedWarningModal({ isOpen, onYes, onNo, onCancel }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 999999, // Ensure absolute top above Intermediate App and Modals
        }}>
            <div style={{
                background: '#F0E6F0', // Light purple background as in the image
                borderRadius: '12px',
                width: '400px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* Header Section */}
                <div style={{
                    background: '#B0003A', // Crimson red
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white'
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '500', textAlign: 'center', flex: 1 }}>
                        Don't Forget to Save Your Project!
                    </h2>
                    <button onClick={onCancel} style={{
                        background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%',
                        color: 'white', width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontWeight: 'bold'
                    }}>
                        ✕
                    </button>
                </div>

                {/* Body Section */}
                <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                        <Save size={100} color="#5B2975" fill="#5B2975" />

                        {/* Yellow Warning Circle Overlay */}
                        <div style={{
                            position: 'absolute',
                            bottom: '0', right: '-10px',
                            background: '#FFD700',
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 0 10px rgba(255, 215, 0, 0.3)', // Glow effect
                            color: 'white', fontWeight: 'bold', fontSize: '20px'
                        }}>
                            !
                        </div>
                    </div>

                    <p style={{ margin: '0 0 20px', fontSize: '18px', color: '#333' }}>
                        Save changes to your current project?
                    </p>
                </div>

                {/* Footer Section */}
                <div style={{
                    background: 'white',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <button onClick={onYes} style={{
                        padding: '12px 32px', borderRadius: '12px', border: 'none',
                        background: '#5B2975', color: 'white', fontWeight: 'bold', fontSize: '16px',
                        cursor: 'pointer'
                    }}>
                        Yes
                    </button>

                    <button onClick={onNo} style={{
                        padding: '12px 32px', borderRadius: '12px', border: 'none',
                        background: '#E6DBe8', color: '#5B2975', fontWeight: 'bold', fontSize: '16px',
                        cursor: 'pointer'
                    }}>
                        No
                    </button>

                    <button onClick={onCancel} style={{
                        padding: '12px 24px', borderRadius: '12px', border: 'none',
                        background: '#E6DBe8', color: '#5B2975', fontWeight: 'bold', fontSize: '16px',
                        cursor: 'pointer'
                    }}>
                        Cancel
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
