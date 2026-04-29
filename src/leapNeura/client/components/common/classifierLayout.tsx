import React from 'react'

type ClassifierLayoutProps = {
    project?: any
    onBack: () => void
    children: React.ReactNode
}

export default function ClassifierLayout({ project, onBack, children }: ClassifierLayoutProps) {
    return (
        <div className="space-y-6 flex-1 w-full p-8 max-w-[1200px] mx-auto">
            {children}
        </div>
    )
}
