/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { useCodex } from "../context/CodexContext";
import { C } from "../utils/theme";

export default function SpriteLibraryModal() {
    const ctx = useCodex();

    if (!ctx.showSpriteLibrary) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', width: '600px',
                maxHeight: '80vh', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
                <div style={{
                    backgroundColor: C.PURPLE, color: 'white', padding: '12px 16px',
                    fontSize: '16px', fontWeight: 'bold', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                }}>
                    {ctx.libraryMode === "costume" ? "Choose a Costume" : "Choose a Sprite"}
                    <div onClick={() => ctx.setShowSpriteLibrary(false)} style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>×</div>
                </div>
                <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                        {ctx.getSpriteLibrary().map(sp => (
                            <div key={sp.name} onClick={() => {
                                if (ctx.libraryMode === "costume" && ctx.selectedSpriteId) {
                                    const costumeId = `costume_${Date.now()}`;
                                    const img = sp.img || sp.image || sp.emoji;
                                    ctx.updateSpriteProperty(ctx.selectedSpriteId, 'costumes', {
                                        ...ctx.sprites.find(s => s.id === ctx.selectedSpriteId).costumes,
                                        [costumeId]: img
                                    });
                                    ctx.updateSpriteProperty(ctx.selectedSpriteId, 'currentCostume', costumeId);
                                    ctx.addLog(`Added costume to ${ctx.sprites.find(s => s.id === ctx.selectedSpriteId).name}`, 'success');
                                } else {
                                    ctx.addSpriteFromLibrary(sp);
                                }
                                ctx.setShowSpriteLibrary(false);
                            }} style={{ background: '#F5F0FF', border: '2px solid transparent', borderRadius: 10, padding: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                                <img src={sp.img} alt={sp.name} style={{ width: 48, height: 48, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.TEXT, marginTop: 6 }}>{sp.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
