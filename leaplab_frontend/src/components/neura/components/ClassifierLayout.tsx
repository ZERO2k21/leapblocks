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
        <div className="flex-1 w-full min-h-screen px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12 max-w-[1600px] mx-auto flex flex-col justify-center bg-ml-bg animate-fade-in">
            {/* Subtle dot pattern */}
            <div className="fixed inset-0 opacity-[0.018] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle, var(--ml-accent) 1px, transparent 1px)`,
                backgroundSize: '28px 28px'
            }} />

            {/* Ambient glow orbs */}
            <div className="fixed top-32 right-32 w-80 h-80 bg-gradient-to-br from-[#7C3AED]/[0.05] to-transparent rounded-full blur-[80px] pointer-events-none" />
            <div className="fixed bottom-32 left-32 w-64 h-64 bg-gradient-to-tr from-[#4F46E5]/[0.04] to-transparent rounded-full blur-[70px] pointer-events-none" />

            <div className="relative z-10 flex-1 w-full flex flex-col min-h-0">
                {children}
            </div>
        </div>
    )
}
