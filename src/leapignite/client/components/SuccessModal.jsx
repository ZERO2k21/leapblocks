/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Trophy, Check, RefreshCw } from 'lucide-react';

export default function SuccessModal({ message, onRestart, onNext }) {
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '24px',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{
                    width: '80px', height: '80px', margin: '0 auto 20px',
                    borderRadius: '50%', background: '#FFD500',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Trophy size={48} color="white" />
                </div>

                <h2 style={{ margin: '0 0 10px', fontSize: '28px', color: '#444' }}>Success!</h2>
                <p style={{ margin: '0 0 30px', fontSize: '18px', color: '#666' }}>{message}</p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button onClick={onRestart} style={{
                        padding: '12px 24px', borderRadius: '12px', border: 'none',
                        background: '#F0F0F0', color: '#555', fontWeight: 'bold', fontSize: '16px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <RefreshCw size={20} /> Replay
                    </button>

                    <button onClick={onNext} style={{
                        padding: '12px 24px', borderRadius: '12px', border: 'none',
                        background: '#4C97FF', color: 'white', fontWeight: 'bold', fontSize: '16px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(76, 151, 255, 0.3)'
                    }}>
                        <Check size={20} /> Next Lesson
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
