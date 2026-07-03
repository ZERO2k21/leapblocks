import React from 'react'
import { Plus } from 'lucide-react'

type AddClassButtonProps = {
    onClick: () => void
    accentColor?: string
    label?: string
}

export default function AddClassButton({ onClick, accentColor = '#7c3aed', label = 'Add Class' }: AddClassButtonProps) {
    return (
        <button
            onClick={onClick}
            className="w-full py-4 rounded-xl border-2 border-dashed border-ml-border bg-transparent text-ml-text-muted font-sans text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-200"
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = accentColor
                e.currentTarget.style.color = accentColor
                e.currentTarget.style.background = accentColor + '08'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--ml-border)'
                e.currentTarget.style.color = 'var(--ml-text-muted)'
                e.currentTarget.style.background = 'transparent'
            }}
        >
            <Plus size={18} />
            {label}
        </button>
    )
}
