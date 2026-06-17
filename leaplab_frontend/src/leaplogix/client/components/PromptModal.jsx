/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { useLogix } from "../context/LogixContext";
import { C } from "../utils/theme";

export default function PromptModal() {
    const ctx = useLogix();

    if (!ctx.modalState.isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', width: '400px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden',
            }}>
                <div style={{
                    backgroundColor: C.PURPLE, color: 'white', padding: '12px 16px',
                    fontSize: '16px', fontWeight: 'bold', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                }}>
                    {ctx.modalState.title}
                    <div onClick={ctx.handleModalCancel} style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>×</div>
                </div>
                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#575E75' }}>{ctx.modalState.message}</div>
                    <input autoFocus type="text" value={ctx.modalInput} onChange={(e) => ctx.setModalInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') ctx.handleModalSubmit(); if (e.key === 'Escape') ctx.handleModalCancel(); }}
                        style={{ padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '0 20px 20px' }}>
                    <button onClick={ctx.handleModalCancel} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', color: '#666' }}>Cancel</button>
                    <button onClick={ctx.handleModalSubmit} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: C.PURPLE, color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>OK</button>
                </div>
            </div>
        </div>
    );
}
