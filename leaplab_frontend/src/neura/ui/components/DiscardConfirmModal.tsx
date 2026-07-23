import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DiscardConfirmModalProps {
    isOpen: boolean
    classCount: number
    onConfirm: () => void
    onCancel: () => void
    title?: string
    description?: string
    confirmText?: string
}

export default function DiscardConfirmModal({ isOpen, classCount, onConfirm, onCancel, title, description, confirmText }: DiscardConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onCancel()
        }
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onCancel])

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === modalRef.current) onCancel()
    }

    if (!isOpen) return null

    return createPortal(
        <div
            ref={modalRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-[modalFadeIn_0.25s_ease-out]"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#0a0128]/60 backdrop-blur-md" />

            {/* Modal */}
            <div className="relative w-full max-w-[380px] animate-[modalSlideIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                {/* Glow border */}
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-400/30 via-indigo-400/20 to-[#630ed4]/30 blur-xs" />

                {/* Card */}
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(99,14,212,0.2),0_0_0_1px_rgba(99,14,212,0.05)]">
                    {/* Top gradient bar */}
                    <div className="h-1 bg-gradient-to-r from-purple-400 via-[#630ed4] to-indigo-400" />

                    {/* Content */}
                    <div className="p-7 pb-5 text-center">
                        {/* Icon */}
                        <div className="relative w-14 h-14 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 rotate-3 shadow-md shadow-amber-500/15" />
                            <div className="relative w-full h-full rounded-2xl bg-white flex items-center justify-center shadow-xs border border-amber-200/30">
                                <span className="text-2xl">⚠️</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-[1.15rem] font-extrabold text-[#131b2e] mb-2 leading-snug">
                            {title || 'Leave without adding samples?'}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-500 leading-relaxed max-w-[300px] mx-auto">
                            {description || (
                                <>You created <span className="font-bold text-[#630ed4]">{classCount} {classCount === 1 ? 'class' : 'classes'}</span> but haven't added any training data yet. Your progress will be lost!</>
                            )}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-6" />

                    {/* Buttons */}
                    <div className="p-4 px-6 pb-5 flex gap-2.5">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-2xl text-xs font-bold border-none cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-md shadow-purple-600/25 transition-all duration-200 tracking-wide hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/30"
                        >
                            Stay 🏠
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 py-3 rounded-2xl text-xs font-bold border-2 border-gray-200 cursor-pointer bg-white text-gray-700 transition-all duration-200 tracking-wide hover:border-purple-400 hover:bg-purple-50/50 hover:-translate-y-0.5"
                        >
                            {confirmText || 'Leave 🚪'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>,
        document.body
    )
}
