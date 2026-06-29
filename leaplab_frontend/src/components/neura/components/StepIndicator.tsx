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
                <div className="text-[13px] font-bold text-ml-text-secondary uppercase mb-0.5" style={{ letterSpacing: '0.06em' }}>
                    {num} — {label}
                </div>
                <div className="text-lg font-bold text-ml-text-primary" style={{ letterSpacing: '-0.02em' }}>
                    {title}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
