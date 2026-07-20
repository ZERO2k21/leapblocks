/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 * 
 * RESPONSIVE LAYOUT - Adapts to screen sizes
 * Left sidebar collapses on mobile, right panel stacks below on small screens
 */

import React, { useState, useEffect, useCallback } from 'react';

interface EditorLayoutProps {
    children: React.ReactNode;           // Central workspace (Stage or Code area)
    leftSidebar?: React.ReactNode;       // Block categories / events panel
    rightPanel?: React.ReactNode;        // Stage panel OR Arduino Code + Log panel
    topBar?: React.ReactNode;            // MenuBar component
    toolbar?: React.ReactNode;           // Unified toolbar (tabs + controls)
    addExtensionButton?: React.ReactNode; // Add Extension button
}

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < breakpoint)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [breakpoint])
    return isMobile
}

function useIsTablet(breakpoint = 1024) {
    const [isTablet, setIsTablet] = useState(() => window.innerWidth < breakpoint)
    useEffect(() => {
        const onResize = () => setIsTablet(window.innerWidth < breakpoint)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [breakpoint])
    return isTablet
}

export default function EditorLayout({
    children,
    leftSidebar,
    rightPanel,
    topBar,
    toolbar,
    addExtensionButton,
}: EditorLayoutProps) {
    const isMobile = useIsMobile(768)
    const isTablet = useIsTablet(1024)
    const [leftOpen, setLeftOpen] = useState(false)

    const closeLeft = useCallback(() => setLeftOpen(false), [])

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
                flexDirection: isMobile ? 'column' : 'row',
                overflow: 'hidden',
                position: 'relative',
            }}>
                {/* LEFT SIDEBAR - Block Categories */}
                {leftSidebar && !isMobile && (
                    <div style={{
                        width: isTablet ? 200 : 260,
                        minWidth: isTablet ? 200 : 260,
                        background: '#f1f5f9',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            scrollbarWidth: 'thin',
                        }}>
                            {leftSidebar}
                        </div>
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

                {/* Mobile left sidebar overlay */}
                {leftSidebar && isMobile && leftOpen && (
                    <>
                        <div onClick={closeLeft} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '260px',
                            maxWidth: '80vw',
                            background: '#f1f5f9',
                            borderRight: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            zIndex: 50,
                            boxShadow: '4px 0 16px rgba(0,0,0,0.15)',
                        }}>
                            <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={closeLeft} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin' }}>
                                {leftSidebar}
                            </div>
                            {addExtensionButton && (
                                <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
                                    {addExtensionButton}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* CENTRAL WORKSPACE */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: '#fff',
                    position: 'relative',
                    minHeight: isMobile ? '50vh' : 0,
                }}>
                    {isMobile && leftSidebar && (
                        <button onClick={() => setLeftOpen(true)} style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            zIndex: 10,
                            padding: '6px 10px',
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}>☰</button>
                    )}
                    {children}
                </div>

                {/* RIGHT PANEL - Stage / Arduino Code / Log */}
                {rightPanel && (
                    <div style={{
                        width: isMobile ? '100%' : isTablet ? 320 : 380,
                        minWidth: isMobile ? '100%' : isTablet ? 320 : 380,
                        height: isMobile ? '50vh' : 'auto',
                        background: '#f8fafc',
                        borderLeft: isMobile ? 'none' : '1px solid #e2e8f0',
                        borderTop: isMobile ? '1px solid #e2e8f0' : 'none',
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
