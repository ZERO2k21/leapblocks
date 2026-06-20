import React from 'react'

type ClassifierLayoutProps = {
    project?: any
    onBack: () => void
    children: React.ReactNode
}

export default function ClassifierLayout({ project, onBack, children }: ClassifierLayoutProps) {
    return (
        <div className="flex-1 w-full p-8 max-w-[1400px] mx-auto min-h-screen"
             style={{ background: '#0a0a12' }}>
            {/* Subtle dot pattern */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }} />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
