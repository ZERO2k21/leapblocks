/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 * 
 * FIXED LAYOUT - Works perfectly at 100% zoom + many extensions
 * Prevents page scroll when adding extensions/blocks
 */

import React from 'react';

interface EditorLayoutProps {
    children: React.ReactNode;           // Central workspace (Stage or Code area)
    leftSidebar?: React.ReactNode;       // Block categories / events panel
    rightPanel?: React.ReactNode;        // Stage panel OR Arduino Code + Log panel
    topBar?: React.ReactNode;            // MenuBar component
    toolbar?: React.ReactNode;           // Unified toolbar (tabs + controls)
    addExtensionButton?: React.ReactNode; // Add Extension button
}

export default function EditorLayout({
    children,
    leftSidebar,
    rightPanel,
    topBar,
    toolbar,
    addExtensionButton,
}: EditorLayoutProps) {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#f8fafc',
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
        }}>
            {/* ==================== FIXED TOP BAR ==================== */}
            {topBar}

            {/* ==================== TOOLBAR (Optional) ==================== */}
            {toolbar}

            {/* ==================== MAIN CONTENT AREA (100% height) ==================== */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',           // ← THIS IS THE KEY FIX
                position: 'relative',
            }}>
                {/* LEFT SIDEBAR - Block Categories (Scrollable) */}
                {leftSidebar && (
                    <div style={{
                        width: 260,
                        background: '#f1f5f9',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        {/* Categories / Extensions list */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',        // ← ONLY sidebar scrolls
                            overflowX: 'hidden',
                            scrollbarWidth: 'thin',
                        }}>
                            {leftSidebar}
                        </div>

                        {/* Add Extension Button (always visible at bottom) */}
                        {addExtensionButton && (
                            <div style={{
                                padding: '12px 16px',
                                borderTop: '1px solid #e2e8f0',
                                background: '#fff',
                                flexShrink: 0,
                            }}>
                                {addExtensionButton}
                            </div>
                        )}
                    </div>
                )}

                {/* CENTRAL WORKSPACE */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: '#fff',
                    position: 'relative',
                }}>
                    {children}   {/* ← Your Stage area OR Code editor area */}
                </div>

                {/* RIGHT PANEL - Stage / Arduino Code / Log */}
                {rightPanel && (
                    <div style={{
                        width: 380,
                        background: '#f8fafc',
                        borderLeft: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        {rightPanel}
                    </div>
                )}
            </div>
        </div>
    );
}
