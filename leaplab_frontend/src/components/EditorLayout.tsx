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
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 font-sans">
            {/* ==================== FIXED TOP BAR ==================== */}
            {topBar}

            {/* ==================== TOOLBAR (Optional) ==================== */}
            {toolbar}

            {/* ==================== MAIN CONTENT AREA (100% height) ==================== */}
            <div className={`flex-1 flex overflow-hidden relative ${isMobile ? 'flex-col' : 'flex-row'}`}>
                {/* LEFT SIDEBAR - Block Categories */}
                {leftSidebar && !isMobile && (
                    <div
                        className="bg-slate-100 border-r border-slate-200 flex flex-col overflow-hidden"
                        style={{ width: isTablet ? 200 : 260, minWidth: isTablet ? 200 : 260 }}
                    >
                        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
                            {leftSidebar}
                        </div>
                        {addExtensionButton && (
                            <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
                                {addExtensionButton}
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile left sidebar overlay */}
                {leftSidebar && isMobile && leftOpen && (
                    <>
                        <div onClick={closeLeft} className="fixed inset-0 bg-black/30 z-40" />
                        <div className="fixed top-0 left-0 bottom-0 w-[260px] max-w-[80vw] bg-slate-100 border-r border-slate-200 flex flex-col overflow-hidden z-50 shadow-2xl">
                            <div className="px-3 py-2 border-b border-slate-200 flex justify-end">
                                <button type="button" onClick={closeLeft} className="bg-transparent border-0 text-lg cursor-pointer text-slate-500">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
                                {leftSidebar}
                            </div>
                            {addExtensionButton && (
                                <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
                                    {addExtensionButton}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* CENTRAL WORKSPACE */}
                <div className={`flex-1 flex flex-col overflow-hidden bg-white relative ${isMobile ? 'min-h-[50vh]' : 'min-h-0'}`}>
                    {isMobile && leftSidebar && (
                        <button type="button" onClick={() => setLeftOpen(true)} className="absolute top-2 left-2 z-10 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer text-sm shadow-md">☰</button>
                    )}
                    {children}
                </div>

                {/* RIGHT PANEL - Stage / Arduino Code / Log */}
                {rightPanel && (
                    <div
                        className={`flex flex-col overflow-hidden ${isMobile ? 'w-full h-[50vh] border-t border-slate-200' : 'border-l border-slate-200'} bg-slate-50`}
                        style={isMobile ? undefined : { width: isTablet ? 320 : 380, minWidth: isTablet ? 320 : 380 }}
                    >
                        {rightPanel}
                    </div>
                )}
            </div>
        </div>
    );
}
