import React from 'react'
import { useNeuraTheme } from '../common/NeuraThemeContext'

type ClassifierLayoutProps = {
    project?: any
    onBack: () => void
    children: React.ReactNode
}

export default function ClassifierLayout({ project, onBack, children }: ClassifierLayoutProps) {
    const { isDark } = useNeuraTheme()

    return (
        <div className="flex-1 w-full p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col bg-ml-bg animate-fade-in">
            {/* Subtle dot pattern */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle, var(--ml-accent) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }} />

            {/* Ambient glow orbs */}
            <div className="fixed top-20 right-20 w-64 h-64 bg-gradient-to-br from-[#7C3AED]/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-20 left-20 w-48 h-48 bg-gradient-to-tr from-[#4F46E5]/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col min-h-0">
                {children}
            </div>
        </div>
    )
}
