import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'primary' | 'warning'
    icon?: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', icon, onConfirm, onCancel }: ConfirmModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
            if (e.key === 'Enter') onConfirm()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen, onConfirm, onCancel])

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) onCancel()
    }

    if (!isOpen) return null

    const variantClasses = {
        danger: {
            iconBg: 'from-red-100 to-red-200 border-red-200/40 text-red-600',
            confirmBtn: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25',
            icon: icon || '🗑️',
        },
        warning: {
            iconBg: 'from-amber-100 to-amber-200 border-amber-200/40 text-amber-600',
            confirmBtn: 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/25',
            icon: icon || '⚠️',
        },
        primary: {
            iconBg: 'from-violet-100 to-indigo-100 border-violet-200/40 text-violet-600',
            confirmBtn: 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-600/25',
            icon: icon || '✨',
        },
    }[variant]

    return createPortal(
        <div ref={overlayRef} onClick={handleOverlayClick} className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <div className="relative w-full max-w-[400px] animate-[modalSlideIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-white/20 via-white/5 to-white/10 blur-sm" />
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.05)]">
                    <div className={`h-1 w-full ${variant === 'danger' ? 'bg-gradient-to-r from-red-400 to-red-600' : variant === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500'}`} />
                    <div className="p-7 pb-5 text-center">
                        <div className="relative w-14 h-14 mx-auto mb-4">
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${variantClasses.iconBg} rotate-3 shadow-md`} />
                            <div className={`relative w-full h-full rounded-2xl bg-white flex items-center justify-center shadow-sm border ${variantClasses.iconBg.split(' ')[1]}`}>
                                <span className="text-2xl">{variantClasses.icon}</span>
                            </div>
                        </div>
                        <h3 className="text-[15px] font-extrabold text-slate-900 mb-2 leading-snug">{title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[320px] mx-auto whitespace-pre-line">{message}</p>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-6" />
                    <div className="p-4 px-6 pb-5 flex gap-2.5">
                        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            {cancelText}
                        </button>
                        <button type="button" onClick={onConfirm} className={`flex-1 py-3 rounded-2xl text-xs font-bold border-none cursor-pointer shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg ${variantClasses.confirmBtn}`}>
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`@keyframes modalSlideIn { from { opacity:0; transform: translateY(12px) scale(0.96);} to {opacity:1; transform: translateY(0) scale(1);} }`}</style>
        </div>,
        document.body
    )
}
