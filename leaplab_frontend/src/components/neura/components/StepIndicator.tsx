import React from 'react'

type StepIndicatorProps = {
    number: string | number
    label: string
    title: string
    accentColor?: string
    action?: React.ReactNode
}

export default function StepIndicator({ number, label, title, accentColor, action }: StepIndicatorProps) {
    const num = String(number).padStart(2, '0')
    return (
        <div className="flex items-center justify-between mb-0.5">
            <div>
                <div className="text-[14px] font-bold uppercase mb-1" style={{ letterSpacing: '0.1em', color: accentColor || 'var(--ml-accent)' }}>
                    {num} — {label}
                </div>
                <div className="text-[19px] font-bold text-ml-text-primary" style={{ letterSpacing: '-0.02em' }}>
                    {title}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
