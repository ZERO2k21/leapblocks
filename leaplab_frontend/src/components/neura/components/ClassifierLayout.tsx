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
        <div className="flex-1 w-full p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col bg-ml-bg">
            {/* Subtle dot pattern */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle, var(--ml-accent) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }} />
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
                {children}
            </div>
        </div>
    )
}
